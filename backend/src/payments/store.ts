import { randomUUID } from "crypto";
import { PaymentIntent, PaymentIntentRecord, PaymentStatus } from "./types";

export class PaymentStore {
  private byId: Map<string, PaymentIntentRecord> = new Map();

  async createIntent(data: Omit<PaymentIntentRecord, "id" | "createdAt" | "updatedAt">): Promise<PaymentIntent> {
    const id = randomUUID();
    const now = new Date();
    const rec: PaymentIntentRecord = { id, createdAt: now, updatedAt: now, ...data };
    this.byId.set(id, rec);
    return rec;
  }

  async getById(id: string): Promise<PaymentIntent | null> {
    return this.byId.get(id) || null;
  }

  async updateStatus(id: string, status: PaymentStatus, extra?: Partial<PaymentIntentRecord>): Promise<PaymentIntent> {
    const rec = this.byId.get(id);
    if (!rec) throw new Error("Payment not found");
    const updated: PaymentIntentRecord = { ...rec, status, updatedAt: new Date(), ...extra };
    this.byId.set(id, updated);
    return updated;
  }

  async listByStatuses(statuses: PaymentStatus[], limit: number): Promise<PaymentIntent[]> {
    const out: PaymentIntent[] = [];
    for (const rec of this.byId.values()) {
      if (statuses.includes(rec.status)) {
        out.push(rec);
        if (out.length >= limit) break;
      }
    }
    return out;
  }
}
