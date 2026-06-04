/* New-Item -ItemType File -Force -Path apps/web/src/pages/api/payments/index.ts add payments API with role-based visibility, filtering, sorting, pagination, accessible error handling */
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@inklusive/db";
import { getSessionUser } from "../../../server/session";

const prisma = new PrismaClient();

type Role = "buyer" | "seller" | "admin";

function parseSort(sort: string | string[] | undefined) {
  const s = Array.isArray(sort) ? sort[0] : sort;
  if (!s) return { createdAt: "desc" as const };
  const [field, dir] = s.split(":");
  const direction = dir === "asc" ? "asc" : "desc";
  const allowed = new Set(["createdAt", "reference", "buyerName", "sellerName", "amount", "status"]);
  if (!allowed.has(field)) return { createdAt: "desc" as const };
  if (field === "buyerName" || field === "sellerName") return { createdAt: "desc" as const };
  return { [field]: direction } as Record<string, "asc" | "desc">;
}

function like(value: string) {
  return { contains: value, mode: "insensitive" as const };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end();
    return;
  }

  const user = await getSessionUser(req, res);
  const headerRole = (req.headers["x-user-role"] as string) || "";
  const role: Role =
    user?.role === "admin"
      ? "admin"
      : headerRole === "seller"
      ? "seller"
      : "buyer";

  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const pageSize = Math.max(1, Math.min(100, parseInt((req.query.pageSize as string) || "20", 10)));
  const skip = (page - 1) * pageSize;
  const sort = parseSort(req.query.sort);
  const q = (req.query.q as string) || "";
  const status = (req.query.status as string) || "";

  const where: any = {};
  if (status) where.status = status;

  if (q) {
    where.OR = [
      { reference: like(q) },
      { buyerName: like(q) },
      { sellerName: like(q) }
    ];
  }

  if (role === "buyer" && user) {
    where.buyerId = user.id;
  } else if (role === "seller" && user) {
    where.sellerId = user.id;
  }

  const [total, rows] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: sort,
      skip,
      take: pageSize,
      select: {
        id: true,
        reference: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } }
      }
    })
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    amount: r.amount,
    currency: r.currency,
    status: r.status as any,
    buyerName: r.buyer?.name || "Unknown",
    sellerName: r.seller?.name || "Unknown",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString()
  }));

  res.status(200).json({
    data,
    total,
    page,
    pageSize
  });
}
