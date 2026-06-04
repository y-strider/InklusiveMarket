import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PaymentStore } from "../payments/store";

const storeSingleton = new PaymentStore();

export async function registerAdminPaymentRoutes(app: FastifyInstance) {
  app.get("/api/admin/payments", async (req: FastifyRequest, rep: FastifyReply) => {
    const q = (req.query as any).q?.toString().toLowerCase() || "";
    const offset = Number((req.query as any).offset || 0);
    const limit = Math.min(200, Number((req.query as any).limit || 20));
    const all = await storeSingleton.listByStatuses(["requires_payment_method", "processing", "succeeded", "failed", "canceled"], Number.MAX_SAFE_INTEGER);
    const filtered = all.filter(p => {
      if (!q) return true;
      return Object.values(p.metadata || {}).some(v => v.toLowerCase().includes(q));
    });
    const items = filtered.slice(offset, offset + limit);
    return rep.send({ items, total: filtered.length, offset, limit });
  });
}
