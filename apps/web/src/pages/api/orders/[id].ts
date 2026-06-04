// New-Item -ItemType File -Force -Path apps/web/src/pages/api/orders/[id].ts add order details API with role-based access and payment visibility
import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]"
import { prisma } from "../../../../server/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).end()
    return
  }
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    res.status(401).end()
    return
  }
  const id = req.query.id as string
  const role = (session.user as any).role || "buyer"
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payment: true
    }
  })
  if (!order) {
    res.status(404).end()
    return
  }
  if (role === "buyer" && order.buyerId !== session.user.id) {
    res.status(403).end()
    return
  }
  if (role === "seller" && order.sellerId !== session.user.id) {
    res.status(403).end()
    return
  }
  res.json({
    id: order.id,
    number: order.number,
    buyerId: order.buyerId,
    buyerName: order.buyerName,
    buyerEmail: order.buyerEmail,
    sellerId: order.sellerId,
    sellerName: order.sellerName,
    total: order.total,
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    paymentStatus: order.paymentStatus,
    items: order.items.map(i => ({
      id: i.id,
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      currency: i.currency,
      total: i.total
    })),
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          status: order.payment.status,
          amount: order.payment.amount,
          currency: order.payment.currency,
          checkoutUrl: order.payment.checkoutUrl || null,
          externalRef: order.payment.externalRef || null,
          createdAt: order.payment.createdAt.toISOString(),
          updatedAt: order.payment.updatedAt.toISOString()
        }
      : null
  })
}
