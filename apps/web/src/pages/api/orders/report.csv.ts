import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]"
import { prisma } from "../../../../server/prisma"

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g,'""')}"`
  return v
}

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

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      number: true,
      buyerName: true,
      sellerName: true,
      total: true,
      currency: true,
      status: true,
      paymentStatus: true,
      createdAt: true
    }
  })
  const header = ["number","buyer","seller","status","paymentStatus","total","currency","createdAt"].join(",")
  const rows = orders.map(o => [
    csvEscape(o.number),
    csvEscape(o.buyerName),
    csvEscape(o.sellerName),
    csvEscape(o.status),
    csvEscape(o.paymentStatus),
    String(o.total),
    csvEscape(o.currency),
    o.createdAt.toISOString()
  ].join(","))
  const body = [header, ...rows].join("\n")
  res.setHeader("Content-Type", "text/csv; charset=utf-8")
  res.setHeader("Content-Disposition", "attachment; filename=orders_report.csv")
  res.send(body)
}
