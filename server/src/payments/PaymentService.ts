import { v4 as uuid } from "uuid";
import { PayMongoClient } from "./PayMongoClient";
import { CreatePaymentInput, PaymentFilters, PaymentProvider, PaymentRecord, PaymentStatus, PaymentVisibility } from "./PaymentTypes";

interface Repo {
  create(p: PaymentRecord): Promise<PaymentRecord>;
  update(id: string, patch: Partial<PaymentRecord>): Promise<PaymentRecord>;
  getById(id: string): Promise<PaymentRecord | null>;
  getByOrderId(orderId: string): Promise<PaymentRecord | null>;
  list(filters: PaymentFilters): Promise<{ data: PaymentRecord[]; total: number }>;
  logActivity(actorId: string, action: string, subjectId: string, details?: Record<string, any>): Promise<void>;
}

interface Access {
  isAdmin(userId: string): Promise<boolean>;
  isSeller(userId: string, sellerId: string): Promise<boolean>;
  isBuyer(userId: string, buyerId: string): Promise<boolean>;
}

export class PaymentService {
  private repo: Repo;
  private access: Access;
  private paymongo: PayMongoClient;
  private provider: PaymentProvider;

  constructor(repo: Repo, access: Access, paymongo: PayMongoClient, provider: PaymentProvider) {
    this.repo = repo;
    this.access = access;
    this.paymongo = paymongo;
    this.provider = provider;
  }

  async ensurePaymentForOrder(input: CreatePaymentInput, actorId: string): Promise<{ payment: PaymentRecord; checkoutUrl?: string }> {
    const existing = await this.repo.getByOrderId(input.orderId);
    if (existing) {
      const visibility = await this.visibility(existing, actorId);
      if (!visibility.canView) throw new Error("Forbidden");
      const checkoutUrl = existing.providerSessionId ? await this.checkoutUrl(existing) : undefined;
      return { payment: existing, checkoutUrl };
    }
    const id = uuid();
    const now = new Date().toISOString();
    const base: PaymentRecord = {
      id,
      orderId: input.orderId,
      provider: this.provider,
      providerSessionId: undefined,
      amount: Math.round(input.amount),
      currency: input.currency,
      status: "pending",
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata || {}
    };
    let checkoutUrl: string | undefined = undefined;
    if (this.provider === "paymongo") {
      const ref = id;
      const session = await this.paymongo.createCheckout({
        amount: base.amount,
        currency: base.currency,
        description: input.description,
        referenceId: ref,
        customerEmail: input.customerEmail,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        billing: input.billing,
        metadata: { orderId: input.orderId, buyerId: input.buyerId, sellerId: input.sellerId, ...(input.metadata || {}) }
      });
      base.providerSessionId = session.id;
      base.status = session.checkoutUrl ? "processing" : "pending";
      checkoutUrl = session.checkoutUrl || undefined;
    }
    const created = await this.repo.create(base);
    await this.repo.logActivity(actorId, "payment.create", created.id, { orderId: input.orderId, provider: created.provider, amount: created.amount });
    return { payment: created, checkoutUrl };
  }

  async syncProviderStatusBySessionId(sessionId: string): Promise<PaymentRecord | null> {
    if (this.provider !== "paymongo") return null;
    const session = await this.paymongo.retrieveCheckout(sessionId);
    const refId = session.referenceId;
    const payment = await this.repo.getById(refId);
    if (!payment) return null;
    const status = this.mapProviderToInternal(session.status);
    if (payment.status !== status) {
      const updated = await this.repo.update(payment.id, { status, updatedAt: new Date().toISOString() });
      return updated;
    }
    return payment;
  }

  async handleWebhook(signature: string, rawBody: string): Promise<void> {
    if (this.provider !== "paymongo") return;
    const ok = this.paymongo.verifyWebhookSignature(signature, rawBody);
    if (!ok) throw new Error("Invalid signature");
    const event = JSON.parse(rawBody);
    const parsed = this.paymongo.parseWebhook(event);
    if (!parsed) return;
    const payment = await this.repo.getById(parsed.referenceId);
    if (!payment) return;
    const status = this.mapProviderToInternal(parsed.status);
    if (payment.status !== status) {
      await this.repo.update(payment.id, { status, updatedAt: new Date().toISOString() });
      await this.repo.logActivity("system", "payment.status.update", payment.id, { from: payment.status, to: status });
    }
  }

  async get(id: string, actorId: string): Promise<PaymentRecord> {
    const p = await this.repo.getById(id);
    if (!p) throw new Error("Not found");
    const v = await this.visibility(p, actorId);
    if (!v.canView) throw new Error("Forbidden");
    return p;
  }

  async list(filters: PaymentFilters, actorId: string): Promise<{ data: PaymentRecord[]; total: number }> {
    const isAdmin = await this.access.isAdmin(actorId);
    if (!isAdmin) {
      if (await this.access.isSeller(actorId, "")) {
      }
    }
    const data = await this.repo.list(filters);
    const filtered = await Promise.all(
      data.data.map(async p => {
        const v = await this.visibility(p, actorId);
        return v.canView ? p : null;
      })
    );
    return { data: filtered.filter(Boolean) as PaymentRecord[], total: data.total };
  }

  async visibility(p: PaymentRecord, actorId: string): Promise<PaymentVisibility> {
    const isAdmin = await this.access.isAdmin(actorId);
    const isBuyer = await this.access.isBuyer(actorId, p.buyerId);
    const isSeller = await this.access.isSeller(actorId, p.sellerId);
    const canView = isAdmin || isBuyer || isSeller;
    const canPay = isBuyer && (p.status === "pending" || p.status === "processing");
    const canRefund = isAdmin || isSeller;
    const canVoid = isAdmin;
    return { canView, canPay, canRefund, canVoid };
  }

  private async checkoutUrl(p: PaymentRecord): Promise<string | undefined> {
    if (this.provider !== "paymongo") return undefined;
    if (!p.providerSessionId) return undefined;
    const session = await this.paymongo.retrieveCheckout(p.providerSessionId);
    return session.checkoutUrl || undefined;
  }

  private mapProviderToInternal(s: string): PaymentStatus {
    switch (s) {
      case "paid":
        return "paid";
      case "failed":
        return "failed";
      case "refunded":
        return "refunded";
      case "voided":
        return "voided";
      case "expired":
        return "expired";
      default:
        return "processing";
    }
  }
}
