import { PaymentStore } from "./store";
import { PaymentStatus } from "./types";

export class PaymentReporting {
  constructor(private store: PaymentStore) {}

  async totalsByStatus(): Promise<Record<PaymentStatus, { count: number; amount: number }>> {
    const statuses: PaymentStatus[] = ["requires_payment_method", "processing", "succeeded", "failed", "canceled"];
    const res: Record<PaymentStatus, { count: number; amount: number }> = {
      requires_payment_method: { count: 0, amount: 0 },
      processing: { count: 0, amount: 0 },
      succeeded: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
      canceled: { count: 0, amount: 0 }
    };
    const all = await this.store.listByStatuses(statuses, Number.MAX_SAFE_INTEGER);
    for (const p of all) {
      res[p.status].count += 1;
      res[p.status].amount += p.amount;
    }
    return res;
  }
}
