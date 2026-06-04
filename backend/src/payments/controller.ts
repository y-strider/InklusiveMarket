import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PayMongoService } from "./PayMongoService";
import { PaymentStore } from "./store";
import { readConfig } from "../shared/config";
import { z } from "zod";

const CreateIntentDto = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  metadata: z.record(z.string()).default({})
});

const AttachMethodDto = z.object({
  paymentMethodId: z.string().min(1),
  type: z.enum(["card", "gcash", "grab_pay", "paymaya"]),
  returnUrl: z.string().url()
});

export async function registerPaymentRoutes(app: FastifyInstance) {
  const store = new PaymentStore();
  const svc = new PayMongoService(store, readConfig());

  app.post("/api/payments/intent", async (req: FastifyRequest, rep: FastifyReply) => {
    const parse = CreateIntentDto.safeParse(req.body);
    if (!parse.success) return rep.status(422).send({ error: "Invalid payload" });
    const { amount, currency, metadata } = parse.data;
    const pi = await svc.createIntent(amount, currency.toUpperCase(), metadata);
    const disabledBanner = svc.isEnabled() ? null : "PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator.";
    return rep.send({ intent: pi, provider: "paymongo", enabled: svc.isEnabled(), notice: disabledBanner });
  });

  app.post("/api/payments/intent/:id/attach", async (req: FastifyRequest, rep: FastifyReply) => {
    const params = req.params as { id: string };
    const parse = AttachMethodDto.safeParse(req.body);
    if (!parse.success) return rep.status(422).send({ error: "Invalid payload" });
    const pi = await svc.attachPaymentMethod(params.id, { id: parse.data.paymentMethodId, type: parse.data.type, returnUrl: parse.data.returnUrl });
    return rep.send({ intent: pi });
  });

  app.get("/api/payments/intent/:id", async (req: FastifyRequest, rep: FastifyReply) => {
    const params = req.params as { id: string };
    const pi = await svc.retrieveIntent(params.id);
    return rep.send({ intent: pi });
  });

  app.post("/api/payments/webhook/paymongo", async (req: FastifyRequest, rep: FastifyReply) => {
    const event = req.body as any;
    const data = event?.data?.attributes?.data || event?.data;
    const type = event?.type || event?.data?.type;
    if (!data || !type) return rep.status(400).send({ ok: false });
    const providerIntentId = data?.attributes?.payment_intent_id || data?.id || data?.attributes?.id;
    if (!providerIntentId) return rep.send({ ok: true });
    const sync = await svc.syncStatuses(50);
    return rep.send({ ok: true, sync });
  });

  app.post("/api/payments/sync", async (_req: FastifyRequest, rep: FastifyReply) => {
    const sync = await svc.syncStatuses(200);
    return rep.send(sync);
  });
}
