import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]"
import { z } from "zod"
import { prisma } from "../../../../server/prisma"

const QuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["pending","paid","failed","refunded","cancelled","shipped","delivered"]).optional(),
  paymentStatus: z.enum(["unpaid","processing","paid","failed","refunded"]).optional(),
  mine: z.enum(["1"]).optional(),
  page: z.string().regex(/^\d+$/).transform(v => parseInt(v,10)).default("1").transform(Number),
  pageSize: z.string().regex(/^\d+$/).transform(v => parseInt(v,10)).default("20").transform(Number)
})

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
  const parsed = QuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" })
    return
  }
  const { q, status, paymentStatus, mine, page, pageSize } = parsed.data
  const where: any = {}
  if (role === "buyer") {
    where.buyerId = session.user.id
  } else if (role === "seller") {
    if (mine === "1") where.sellerId = session.user.id
  }
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { buyerName: { contains: q, mode: "insensitive" } },
      { sellerName: { contains: q, mode: "insensitive" } }
    ]
  }
  if (status) where.status = status
  if (paymentStatus) where.paymentStatus = paymentStatus
  const take = Math.min(100, Math.max(1, pageSize))
  const skip = Math.max(0, (Math.max(1, page) - 1) * take)
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        number: true,
        buyerId: true,
        buyerName: true,
        sellerId: true,
        sellerName: true,
        total: true,
        currency: true,
        createdAt: true,
        status: true,
        paymentStatus: true
      }
    }),
    prisma.order.count({ where })
  ])
  res.json({ items: items.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })), total, page: Math.max(1, page), pageSize: take })
}
