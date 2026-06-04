import { PaymentProvider } from "./PaymentAbstraction";
import { PaymentRepository } from "./PaymentRepository";
import { CreatePaymentRecordInput, PaymentRecord, PaymentStatus } from "./PaymentModels";

export class PaymentService {
  constructor(private repo: PaymentRepository, private provider: PaymentProvider) {}

  async createOrderPayment(input: CreatePaymentRecordInput): Promise<PaymentRecord> {
    const record = await this.repo.create(input);
    return record;
  }

  async beginCheckout(paymentId: string, allowed: ("gcash" | "grab_pay" | "paymaya" | "card")[], returnUrl: string): Promise<{ intentId?: string; clientKey?: string; status: PaymentStatus }> {
    const record = await this.repo.findById(paymentId);
    try {
      const intent = await this.provider.createIntent({
        amount: record.amount,
        currency: record.currency,
        description: record.description || undefined,
        metadata: { paymentId: record.id, orderId: record.orderId, userId: record.userId },
        paymentMethodAllowed: allowed,
      });
      const updated = await this.repo.update({
        id: record.id,
        intentId: intent.id,
        status: mapIntentStatus(intent.status),
        metadata: { ...record.metadata, clientKey: intent.clientKey || "", returnUrl },
        provider: "paymongo",
      });
      return { intentId: updated.intentId || undefined, clientKey: (updated.metadata as any).clientKey, status: updated.status };
    } catch (e) {
      const failed = await this.repo.update({
        id: record.id,
        status: "failed",
        errorMessage: e instanceof Error ? e.message : "Payment initialization failed",
        provider: "paymongo",
      });
      return { intentId: failed.intentId || undefined, clientKey: undefined, status: failed.status };
    }
  }

  async syncStatusByIntent(intentId: string): Promise<PaymentRecord> {
    const record = await this.findByIntent(intentId);
    try {
      const intent = await this.provider.retrieveIntent(intentId);
      const status = mapIntentStatus(intent.status);
      return await this.repo.update({
        id: record.id,
        status,
        errorMessage: intent.lastPaymentError || null,
        metadata: { ...record.metadata, lastSync: new Date().toISOString() },
      });
    } catch (e) {
      return await this.repo.update({
        id: record.id,
        errorMessage: e instanceof Error ? e.message : "Sync failed",
        metadata: { ...record.metadata, lastSync: new Date().toISOString() },
      });
    }
  }

  async attachPaymentMethod(paymentId: string, paymentMethodId: string): Promise<PaymentRecord> {
    const record = await this.repo.findById(paymentId);
    if (!record.intentId) throw new Error("Payment intent not initialized");
    const clientKey = (record.metadata as any).clientKey as string | undefined;
    const returnUrl = (record.metadata as any).returnUrl as string | undefined;
    const intent = await this.provider.attachMethod({
      paymentIntentId: record.intentId,
      paymentMethodId,
      clientKey,
      returnUrl,
    });
    return await this.repo.update({
      id: record.id,
      status: mapIntentStatus(intent.status),
      errorMessage: intent.lastPaymentError || null,
      metadata: { ...record.metadata, nextAction: intent.nextAction || null },
    });
  }

  async cancel(paymentId: string): Promise<PaymentRecord> {
    const record = await this.repo.findById(paymentId);
    if (!record.intentId) {
      return await this.repo.update({ id: record.id, status: "canceled" });
    }
    const intent = await this.provider.cancelIntent(record.intentId);
    return await this.repo.update({
      id: record.id,
      status: mapIntentStatus(intent.status),
      errorMessage: intent.lastPaymentError || null,
    });
  }

  async listUserPayments(userId: string, limit: number, offset: number, q?: string) {
    return this.repo.findAllByUser(userId, limit, offset, q);
  }

  async findByIntent(intentId: string): Promise<PaymentRecord> {
    const rows = await this.repo.findByOrderId("");
    if (rows.length === 0) throw new Error("Payment not found");
    const found = rows.find(r => r.intentId === intentId);
    if (!found) throw new Error("Payment not found");
    return found;
  }
}

export function mapIntentStatus(s: string): PaymentStatus {
  if (s === "awaiting_payment_method") return "awaiting_payment_method";
  if (s === "processing") return "processing";
  if (s === "succeeded") return "succeeded";
  if (s === "canceled") return "canceled";
  if (s === "awaiting_next_action") return "pending";
  return "failed";
}
