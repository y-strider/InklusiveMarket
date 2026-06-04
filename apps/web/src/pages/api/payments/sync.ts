// New-Item -ItemType File -Force -Path apps/web/src/pages/api/payments/sync.ts add payment status synchronization API for buyer/seller/admin
import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]"
import { prisma } from "../../../../server/prisma"
import { PayMongoGateway } from "../../../server/payments/paymongo"
import { PaymentUnavailableError } from "../../../server/payments/abstraction"

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
  const { orderId } = JSON.parse(req.body || "{}")
  if (!orderId) {
    res.status(400).json({ error: "orderId required" })
    return
  }
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } })
  if (!order) {
    res.status(404).end()
    return
  }
  const role = (session.user as any).role || "buyer"
  if (role === "buyer" && order.buyerId !== session.user.id) {
    res.status(403).end()
    return
  }
  if (role === "seller" && order.sellerId !== session.user.id) {
    res.status(403).end()
    return
  }
  if (!order.payment?.externalRef) {
    res.status(400).json({ error: "No payment reference" })
    return
  }
  try {
    const gw = new PayMongoGateway()
    const synced = await gw.syncPayment(order.payment.externalRef)
    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        status: synced.status
      }
    })
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: synced.status as any, status: synced.status === "paid" ? "paid" : order.status }
    })
    res.json({ status: synced.status })
  } catch (e: any) {
    if (e instanceof PaymentUnavailableError) {
      res.status(503).json({ error: e.message })
      return
    }
    res.status(500).json({ error: "Failed to sync" })
  }
}
