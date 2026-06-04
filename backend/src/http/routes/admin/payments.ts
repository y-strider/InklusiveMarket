import { Router } from "express";
import { Database } from "sqlite";

export function adminPaymentsRouter(db: Database) {
  const r = Router();

  r.get("/admin/payments/summary", async (_req, res) => {
    const rows = await db.all(
      "SELECT status, COUNT(*) as count, SUM(amount) as amount FROM payments GROUP BY status"
    );
    const byStatus = rows.reduce((acc: any, r: any) => {
      acc[r.status] = { count: r.count, amount: Number(r.amount || 0) };
      return acc;
    }, {});
    const totalRow = await db.get("SELECT COUNT(*) as c, SUM(amount) as a FROM payments");
    res.json({
      total: { count: totalRow.c, amount: Number(totalRow.a || 0) },
      byStatus,
    });
  });

  r.get("/admin/payments/recent", async (_req, res) => {
    const rows = await db.all(
      "SELECT id, order_id as orderId, user_id as userId, amount, currency, status, created_at as createdAt FROM payments ORDER BY created_at DESC LIMIT 50"
    );
    res.json(rows);
  });

  return r;
}
