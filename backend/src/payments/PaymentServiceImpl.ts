import { PayMongoService } from "./PayMongoService";
import { PaymentCreateInput, PaymentProvider, PaymentRecord, PaymentRepository, PaymentService, PaymentStatus } from "./PaymentAbstraction";

export class PaymentServiceImpl implements PaymentService {
  private repo: PaymentRepository;
  private paymongo: PayMongoService;

  constructor(repo: PaymentRepository, paymongo: PayMongoService) {
    this.repo = repo;
    this.paymongo = paymongo;
  }

  async createPayment(input: PaymentCreateInput): Promise<PaymentRecord> {
    const intent = await this.paymongo.createPaymentIntent({
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      metadata: {
        orderId: input.orderId,
        buyerId: input.buyerId,
        ...input.metadata
      },
      paymentMethodAllowed: input.methods
    });
    const status: PaymentStatus =
      intent.status === "paid" ? "paid" : intent.status === "failed" ? "failed" : intent.status === "canceled" ? "canceled" : intent.status === "processing" ? "processing" : "pending";
    const rec = await this.repo.create({
      provider: "paymongo",
      providerIntentId: intent.id,
      status,
      orderId: input.orderId,
      buyerId: input.buyerId,
      amount: input.amount,
      currency: input.currency,
      clientKey: intent.clientKey
    });
    return rec;
  }

  async syncPaymentByIntent(provider: PaymentProvider, providerIntentId: string): Promise<PaymentRecord | null> {
    if (provider !== "paymongo") return null;
    const rec = await this.repo.findByProviderIntent("paymongo", providerIntentId);
    if (!rec) return null;
    const list = await this.paymongo.listPaymentsByIntent(providerIntentId);
    let status: PaymentStatus = rec.status;
    if (list.some(p => p.status === "paid")) status = "paid";
    else if (list.some(p => p.status === "failed")) status = "failed";
    else if (list.some(p => p.status === "canceled")) status = "canceled";
    else if (list.length > 0) status = "processing";
    if (status !== rec.status) {
      return await this.repo.update(rec.id, { status });
    }
    return rec;
  }

  async getBuyerView(buyerId: string, paymentId: string): Promise<PaymentRecord | null> {
    const rec = await this.repo.findById(paymentId);
    if (!rec) return null;
    if (rec.buyerId !== buyerId) return null;
    return rec;
  }

  async getSellerView(sellerId: string, orderId: string): Promise<PaymentRecord[]> {
    const items = await this.repo.listByOrder(orderId);
    return items;
  }

  async getAdminView(params: { status?: PaymentStatus; from?: Date; to?: Date; search?: string; skip?: number; take?: number }): Promise<{ items: PaymentRecord[]; total: number }> {
    const all = await this.repo["prisma"] ? await this.prismaAdminList(params) : [];
    return { items: all, total: all.length };
  }

  private async prismaAdminList(params: { status?: PaymentStatus; from?: Date; to?: Date; search?: string; skip?: number; take?: number }): Promise<PaymentRecord[]> {
    const prisma = this.repo["prisma"];
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = params.from;
      if (params.to) where.createdAt.lte = params.to;
    }
    if (params.search) {
      where.OR = [
        { orderId: { contains: params.search, mode: "insensitive" } },
        { buyerId: { contains: params.search, mode: "insensitive" } },
        { providerIntentId: { contains: params.search, mode: "insensitive" } }
      ];
    }
    const rows = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.skip || 0,
      take: params.take || 50
    });
    return rows.map((row: any) => ({
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
    }));
  }
}
