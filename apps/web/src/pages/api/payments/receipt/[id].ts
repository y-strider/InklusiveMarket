/* New-Item -ItemType File -Force -Path apps/web/src/pages/api/payments/receipt/[id].ts add receipt download endpoint */
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@inklusive/db";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end();
    return;
  }
  const id = req.query.id as string;
  const p = await prisma.payment.findUnique({
    where: { id }
  });
  if (!p) {
    res.status(404).end();
    return;
  }

  const receipt = [
    "InklusiveMarket Receipt",
    `Reference: ${p.reference}`,
    `Status: ${p.status}`,
    `Amount: ${p.currency} ${(p.amount / 100).toFixed(2)}`,
    `Date: ${p.createdAt.toISOString()}`
  ].join("\n");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="receipt-${p.reference}.txt"`);
  res.status(200).send(receipt);
}
