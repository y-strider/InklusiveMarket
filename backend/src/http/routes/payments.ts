import { Router } from "express";
import { z } from "zod";
import { createPaymentSchema, beginCheckoutSchema, attachMethodSchema, listPaymentsSchema } from "../validators/paymentValidators";
import { PaymentService } from "../../payments/PaymentService";
import { PaymentRepository } from "../../payments/PaymentRepository";
import { PaymentProvider } from "../../payments/PaymentAbstraction";
import { Database } from "sqlite";

export function paymentsRouter(db: Database, cfg: any) {
  const repo = new PaymentRepository(db);
  const provider = new PaymentProvider({
    gateway: "paymongo",
    paymongo: {
      enabled: !!cfg.paymongo?.enabled,
      mode: cfg.paymongo?.mode === "live" ? "live" : "test",
      secretKey: cfg.paymongo?.secretKey,
      publicKey: cfg.paymongo?.publicKey,
      webhookSecret: cfg.paymongo?.webhookSecret,
    },
  });
  const service = new PaymentService(repo, provider);
  const r = Router();

  r.post("/payments", async (req, res) => {
    const parse = createPaymentSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: "Invalid payload" });
    const record = await service.createOrderPayment(parse.data);
    res.json(record);
  });

  r.post("/payments/checkout/begin", async (req, res) => {
    const parse = beginCheckoutSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: "Invalid payload" });
    try {
      const out = await service.beginCheckout(parse.data.paymentId, parse.data.methods, parse.data.returnUrl);
      res.json(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      res.status(409).json({ error: msg });
    }
  });

  r.post("/payments/attach", async (req, res) => {
    const parse = attachMethodSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: "Invalid payload" });
    try {
      const record = await service.attachPaymentMethod(parse.data.paymentId, parse.data.paymentMethodId);
      res.json(record);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Attach failed";
      res.status(409).json({ error: msg });
    }
  });

  r.get("/payments", async (req, res) => {
    const parse = listPaymentsSchema.safeParse(req.query);
    if (!parse.success) return res.status(400).json({ error: "Invalid query" });
    const userId = (req as any).user?.id || "";
    const data = await service.listUserPayments(userId, parse.data.limit, parse.data.offset, parse.data.q);
    res.json(data);
  });

  r.post("/payments/webhook", async (req, res) => {
    const webhookSecret = cfg.paymongo?.webhookSecret as string | undefined;
    const raw = (req as any).rawBody || JSON.stringify(req.body || {});
    const sig = req.header("Paymongo-Signature");
    const crypto = await import("crypto");
    if (!webhookSecret || !sig) return res.status(401).end();
    const [tPart, sigPart] = sig.split(",").map(s => s.trim());
    if (!tPart || !sigPart) return res.status(401).end();
    const t = tPart.replace("t=", "");
    const v1 = sigPart.replace("v1=", "");
    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(`${t}.${raw}`);
    const digest = hmac.digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(v1))) return res.status(401).end();

    const evt = req.body;
    const type = evt.type as string;
    const obj = evt.data?.object;
    if (!type || !obj) return res.status(400).end();

    if (obj.type === "payment_intent") {
      const intentId = obj.id as string;
      try {
        const found = await db.get("SELECT id FROM payments WHERE intent_id = ?", intentId);
        if (found) {
          const status = mapWebhookToStatus(type, obj.attributes?.status);
          await db.run("UPDATE payments SET status = ?, updated_at = ? WHERE id = ?", status, new Date().toISOString(), found.id);
        }
      } catch {}
    }
    res.json({ received: true });
  });

  return r;
}

function mapWebhookToStatus(type: string, attrStatus?: string) {
  if (type === "payment_intent.succeeded" || attrStatus === "succeeded") return "succeeded";
  if (type === "payment_intent.payment_failed" || attrStatus === "failed") return "failed";
  if (type === "payment_intent.canceled" || attrStatus === "canceled") return "canceled";
  if (attrStatus === "processing") return "processing";
  if (attrStatus === "awaiting_payment_method") return "awaiting_payment_method";
  return "pending";
}
