import { Router, Request, Response } from "express";
import { PaymentServiceImpl } from "./PaymentServiceImpl";
import { PaymentRepositoryPrisma } from "./PaymentRepositoryPrisma";
import { PayMongoService } from "./PayMongoService";

function getConfig() {
  const enabled = process.env.PAYMENTS_ENABLED === "true";
  const environment = process.env.PAYMONGO_ENV === "live" ? "live" : "test";
  return {
    enabled,
    secretKey: process.env.PAYMONGO_SECRET_KEY,
    publicKey: process.env.PAYMONGO_PUBLIC_KEY,
    environment,
    webhookSigningSecret: process.env.PAYMONGO_WEBHOOK_SECRET
  };
}

export function PaymentsController(): Router {
  const r = Router();
  const repo = new PaymentRepositoryPrisma();
  const paymongo = new PayMongoService(getConfig());
  const svc = new PaymentServiceImpl(repo, paymongo);

  r.post("/payments", async (req: Request, res: Response) => {
    const { orderId, amount, currency, description, buyerId, methods, returnUrl, metadata } = req.body || {};
    if (!orderId || !amount || !currency || !description || !buyerId || !methods) {
      return res.status(422).json({ error: "Missing required fields" });
    }
    const availability = paymongo.availabilityMessage();
    const record = await svc.createPayment({
      orderId,
      amount,
      currency,
      description,
      buyerId,
      methods,
      metadata,
      returnUrl
    });
    res.status(201).json({ payment: record, availability });
  });

  r.get("/payments/:id", async (req: Request, res: Response) => {
    const id = req.params.id;
    const buyerId = String(req.query.buyerId || "");
    const rec = await svc.getBuyerView(buyerId, id);
    if (!rec) return res.status(404).json({ error: "Not found" });
    res.json({ payment: rec });
  });

  r.get("/orders/:orderId/payments", async (req: Request, res: Response) => {
    const orderId = req.params.orderId;
    const sellerId = String(req.query.sellerId || "");
    const list = await svc.getSellerView(sellerId, orderId);
    res.json({ payments: list });
  });

  r.post("/payments/sync", async (req: Request, res: Response) => {
    const { provider, providerIntentId } = req.body || {};
    if (provider !== "paymongo" || !providerIntentId) return res.status(422).json({ error: "Invalid payload" });
    const updated = await svc.syncPaymentByIntent("paymongo", providerIntentId);
    res.json({ payment: updated });
  });

  r.post("/webhooks/paymongo", async (req: Request, res: Response) => {
    const raw = (req as any).rawBody || JSON.stringify(req.body);
    const sig = req.header("Paymongo-Signature");
    const v = paymongo.verifyWebhookSignature(typeof raw === "string" ? raw : JSON.stringify(raw), sig || undefined);
    if (!v.valid) return res.status(400).json({ error: "Invalid signature" });
    const data = req.body?.data || req.body?.data?.data || req.body;
    const type = req.body?.type || data?.type;
    const pi = data?.attributes?.data?.attributes?.payment_intent_id || data?.attributes?.payment_intent_id || data?.data?.attributes?.payment_intent_id;
    if (pi) {
      await svc.syncPaymentByIntent("paymongo", pi);
    }
    res.json({ ok: true, type });
  });

  r.get("/admin/payments", async (req: Request, res: Response) => {
    const status = req.query.status as any;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const skip = req.query.skip ? parseInt(String(req.query.skip)) : undefined;
    const take = req.query.take ? parseInt(String(req.query.take)) : undefined;
    const out = await svc.getAdminView({ status, from, to, search, skip, take });
    res.json(out);
  });

  return r;
}
