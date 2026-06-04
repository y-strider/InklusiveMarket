// New-Item -ItemType File -Force -Path apps/web/src/pages/api/orders/create.ts add order creation API to support checkout flow and activity log
import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]"
import { prisma } from "../../../../server/prisma"

function genOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).slice(2,6).toUpperCase()
  return `ORD-${ts}-${rnd}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end()
    return
  }
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    res.status(401).end()
    return
  }
  const { sellerId, sellerName, items, currency } = JSON.parse(req.body || "{}") as {
    sellerId: string
    sellerName: string
    items: { productId: string; name: string; quantity: number; unitPrice: number }[]
    currency: string
  }
  if (!sellerId || !sellerName || !Array.isArray(items) || !items.length || !currency) {
    res.status(400).json({ error: "Invalid payload" })
    return
  }
  const total = items.reduce((s, it) => s + Math.round(it.unitPrice) * Math.max(1, Math.round(it.quantity)), 0)
  const order = await prisma.order.create({
    data: {
      number: genOrderNumber(),
      buyerId: session.user.id,
      buyerName: (session.user as any).name || "Buyer",
      buyerEmail: (session.user as any).email || "no-email@example.com",
      sellerId,
      sellerName,
      total,
      currency,
      status: "pending",
      paymentStatus: "unpaid",
      items: {
        createMany: {
          data: items.map(it => ({
            productId: it.productId,
            name: it.name,
            quantity: Math.max(1, Math.round(it.quantity)),
            unitPrice: Math.round(it.unitPrice),
            currency,
            total: Math.round(it.unitPrice) * Math.max(1, Math.round(it.quantity))
          }))
        }
      }
    }
  })
  res.json({ id: order.id })
}
