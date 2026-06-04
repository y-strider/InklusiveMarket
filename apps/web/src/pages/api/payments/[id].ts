/* New-Item -ItemType File -Force -Path apps/web/src/pages/api/payments/[id].ts add payment by id API with role-based access */
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@inklusive/db";
import { getSessionUser } from "../../../server/session";

const prisma = new PrismaClient();

type Role = "buyer" | "seller" | "admin";

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

  const id = req.query.id as string;
  const p = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      reference: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      buyerId: true,
      sellerId: true,
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } }
    }
  });

  if (!p) {
    res.status(404).end();
    return;
  }

  if (role === "buyer" && user && p.buyerId !== user.id) {
    res.status(403).end();
    return;
  }
  if (role === "seller" && user && p.sellerId !== user.id) {
    res.status(403).end();
    return;
  }

  res.status(200).json({
    id: p.id,
    reference: p.reference,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    buyerName: p.buyer?.name || "Unknown",
    sellerName: p.seller?.name || "Unknown",
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  });
}
