import { PrismaClient } from "@prisma/client";
import { PaymentFilters, PaymentRecord } from "./PaymentTypes";

export class PaymentRepoPrisma {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(p: PaymentRecord): Promise<PaymentRecord> {
    const created = await this.prisma.payment.create({ data: {
      id: p.id,
      orderId: p.orderId,
      provider: p.provider,
      providerSessionId: p.providerSessionId || null,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      buyerId: p.buyerId,
      sellerId: p.sellerId,
      adminNote: p.adminNote || null,
      metadata: p.metadata || {},
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt)
    }});
    return this.map(created);
  }

  async update(id: string, patch: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        providerSessionId: patch.providerSessionId,
        amount: patch.amount,
        currency: patch.currency,
        status: patch.status,
        adminNote: patch.adminNote,
        metadata: patch.metadata,
        updatedAt: patch.updatedAt ? new Date(patch.updatedAt) : new Date()
      }
    });
    return this.map(updated);
  }

  async getById(id: string): Promise<PaymentRecord | null> {
    const row = await this.prisma.payment.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async getByOrderId(orderId: string): Promise<PaymentRecord | null> {
    const row = await this.prisma.payment.findFirst({ where: { orderId } });
    return row ? this.map(row) : null;
  }

  async list(filters: PaymentFilters): Promise<{ data: PaymentRecord[]; total: number }> {
    const where: any = {};
    if (filters.q) {
      where.OR = [
        { id: { contains: filters.q, mode: "insensitive" } },
        { orderId: { contains: filters.q, mode: "insensitive" } }
      ];
    }
    if (filters.status && filters.status.length) {
      where.status = { in: filters.status };
    }
    if (filters.provider && filters.provider.length) {
      where.provider = { in: filters.provider };
    }
    if (filters.buyerId) where.buyerId = filters.buyerId;
    if (filters.sellerId) where.sellerId = filters.sellerId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize || 20));
    const orderBy = this.parseSort(filters.sort);
    const [total, rows] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize })
    ]);
    return { data: rows.map(this.map), total };
  }

  async logActivity(actorId: string, action: string, subjectId: string, details?: Record<string, any>): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        id: crypto.randomUUID(),
        actorId,
        action,
        subjectId,
        details: details || {},
        createdAt: new Date()
      }
    });
  }

  private parseSort(sort?: string): any {
    if (!sort) return { createdAt: "desc" };
    const [field, dir] = sort.split(":");
    const direction = dir === "asc" ? "asc" : "desc";
    switch (field) {
      case "amount":
      case "createdAt":
      case "status":
        return { [field]: direction };
      default:
        return { createdAt: "desc" };
    }
  }

  private map = (row: any): PaymentRecord => ({
    id: row.id,
    orderId: row.orderId,
    provider: row.provider,
    providerSessionId: row.providerSessionId || undefined,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    adminNote: row.adminNote || undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    metadata: row.metadata || {}
  });
}
