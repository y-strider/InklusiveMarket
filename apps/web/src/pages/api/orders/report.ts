// New-Item -ItemType File -Force -Path apps/web/src/pages/api/orders/report.ts add orders KPI API with optional date and seller scope
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
  const role = (session.user as any).role || "buyer"
  const { from, to, sellerId } = req.query as Record<string, string>
  const where: any = {}
  if (from) where.createdAt = Object.assign(where.createdAt || {}, { gte: new Date(from) })
  if (to) where.createdAt = Object.assign(where.createdAt || {}, { lte: new Date(to + "T23:59:59.999Z") })
  if (role === "seller") where.sellerId = session.user.id
  if (role === "buyer") where.buyerId = session.user.id
  if (role === "admin" && sellerId) where.sellerId = sellerId
  const [totalOrders, paidOrders, unpaidOrders, refundedOrders, grossAgg] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.count({ where: { ...where, paymentStatus: "paid" } }),
    prisma.order.count({ where: { ...where, paymentStatus: { in: ["unpaid","processing","failed"] } } }),
    prisma.order.count({ where: { ...where, paymentStatus: "refunded" } }),
    prisma.order.aggregate({ where, _sum: { total: true } })
  ])
  const currency = "PHP"
  res.json({
    totalOrders,
    totalGross: grossAgg._sum.total || 0,
    currency,
    paidOrders,
    unpaidOrders,
    refundedOrders
  })
}
