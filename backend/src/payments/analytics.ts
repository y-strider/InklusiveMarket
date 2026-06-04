type Counter = { count: number };
export class PaymentAnalytics {
  private counters: Map<string, Counter> = new Map();

  inc(key: string) {
    const item = this.counters.get(key) || { count: 0 };
    item.count++;
    this.counters.set(key, item);
  }

  snapshot() {
    const out: Record<string, number> = {};
    for (const [k, v] of this.counters.entries()) out[k] = v.count;
    return out;
  }
}
