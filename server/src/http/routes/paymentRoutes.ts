import { Router } from "express";
import { PaymentService } from "../../payments/PaymentService";
import { PayMongoClient } from "../../payments/PayMongoClient";
import { PaymentRepoPrisma } from "../../payments/PaymentRepoPrisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getActorId(req: any): string {
  return req.user?.id || "anonymous";
}

function isAdmin(req: any): boolean {
  return !!req.user?.roles?.includes("admin");
}

function isSeller(req: any, sellerId: string): boolean {
  return req.user?.id === sellerId || req.user?.roles?.includes("seller");
}

function isBuyer(req: any, buyerId: string): boolean {
  return req.user?.id === buyerId;
}

const repo = new PaymentRepoPrisma(prisma);
const access = {
  isAdmin: async (userId: string) => !!userId && userId !== "anonymous",
  isSeller: async (userId: string, sellerId: string) => !!userId && userId === sellerId,
  isBuyer: async (userId: string, buyerId: string) => !!userId && userId === buyerId
};

const paymongo = new PayMongoClient({
  publicKey: process.env.PAYMONGO_PUBLIC_KEY || "",
  secretKey: process.env.PAYMONGO_SECRET_KEY || "",
  baseUrl: process.env.PAYMONGO_BASE_URL || "[api.paymongo.com](https://api.paymongo.com)",
  enabled: process.env.PAYMONGO_ENABLED === "true"
});

const provider = process.env.PAYMENTS_PROVIDER === "paymongo" ? "paymongo" : "none";

const service = new PaymentService(repo as any, access, paymongo, provider as any);

export const paymentRoutes = Router();

paymentRoutes.post("/payments/ensure", async (req, res) => {
  try {
    const actorId = getActorId(req);
    const body = req.body || {};
    const result = await service.ensurePaymentForOrder(
      {
        orderId: body.orderId,
        amount: body.amount,
        currency: body.currency || "PHP",
        buyerId: body.buyerId,
        sellerId: body.sellerId,
        description: body.description || `Order ${body.orderId}`,
        customerEmail: body.customerEmail,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
        billing: body.billing || {},
        metadata: body.metadata || {}
      },
      actorId
    );
    if (provider === "paymongo" && !paymongo.isEnabled()) {
      res.status(200).json({
        message: "PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator.",
        payment: result.payment,
        checkoutUrl: ""
      });
      return;
    }
    res.status(200).json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

paymentRoutes.get("/payments/:id", async (req, res) => {
  try {
    const actorId = getActorId(req);
    const p = await service.get(req.params.id, actorId);
    res.status(200).json(p);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

paymentRoutes.get("/payments", async (req, res) => {
  try {
    const actorId = getActorId(req);
    const filters = {
      q: req.query.q as string | undefined,
      status: req.query.status ? String(req.query.status).split(",") as any : undefined,
      provider: req.query.provider ? String(req.query.provider).split(",") as any : undefined,
      buyerId: req.query.buyerId as string | undefined,
      sellerId: req.query.sellerId as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
      pageSize: req.query.pageSize ? parseInt(String(req.query.pageSize), 10) : 20,
      sort: req.query.sort as string | undefined
    };
    const list = await service.list(filters as any, actorId);
    res.status(200).json(list);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

paymentRoutes.post("/payments/webhooks/paymongo", expressRawBody, async (req, res) => {
  try {
    const signature = req.header("Paymongo-Signature") || "";
    await service.handleWebhook(signature, (req as any).rawBody);
    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

function expressRawBody(req: any, res: any, next: any) {
  let data: Buffer[] = [];
  req.on("data", (chunk: Buffer) => {
    data.push(chunk);
  });
  req.on("end", () => {
    const raw = Buffer.concat(data).toString("utf8");
    (req as any).rawBody = raw;
    try {
      req.body = JSON.parse(raw);
    } catch {
      req.body = {};
    }
    next();
  });
}
