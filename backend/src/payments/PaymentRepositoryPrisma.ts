import { PaymentProvider, PaymentRecord, PaymentRepository, PaymentStatus } from "./PaymentAbstraction";
import { PrismaClient } from "@prisma/client";

export class PaymentRepositoryPrisma implements PaymentRepository {
  private prisma: PrismaClient;
  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  async create(data: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">): Promise<PaymentRecord> {
    const row = await this.prisma.payment.create({
      data: {
        provider: data.provider,
        providerIntentId: data.providerIntentId,
        status: data.status,
        orderId: data.orderId,
        buyerId: data.buyerId,
        amount: data.amount,
        currency: data.currency,
        clientKey: data.clientKey
      }
    });
    return this.map(row);
  }

  async update(id: string, patch: Partial<Omit<PaymentRecord, "id">>): Promise<PaymentRecord> {
    const row = await this.prisma.payment.update({
      where: { id },
      data: {
        provider: patch.provider,
        providerIntentId: patch.providerIntentId,
        status: patch.status as PaymentStatus | undefined,
        orderId: patch.orderId,
        buyerId: patch.buyerId,
        amount: patch.amount,
        currency: patch.currency,
        clientKey: patch.clientKey,
        updatedAt: new Date()
      }
    });
    return this.map(row);
  }

  async findById(id: string): Promise<PaymentRecord | null> {
    const row = await this.prisma.payment.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findByProviderIntent(provider: PaymentProvider, providerIntentId: string): Promise<PaymentRecord | null> {
    const row = await this.prisma.payment.findFirst({ where: { provider, providerIntentId } });
    return row ? this.map(row) : null;
  }

  async listByOrder(orderId: string): Promise<PaymentRecord[]> {
    const rows = await this.prisma.payment.findMany({ where: { orderId }, orderBy: { createdAt: "desc" } });
    return rows.map(this.map);
  }

  private map = (row: any): PaymentRecord => {
    return {
      id: row.id,
      provider: row.provider,
      providerIntentId: row.providerIntentId,
      status: row.status,
      orderId: row.orderId,
      buyerId: row.buyerId,
      amount: row.amount,
      currency: row.currency,
      clientKey: row.clientKey,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  };
}
