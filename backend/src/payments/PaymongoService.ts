import axios, { AxiosInstance } from "axios";
import { PaymentIntent, PaymentMethod, PaymentStatus, PaymentProvider, PaymentVisibility, PaymentSyncResult } from "./types";
import { PaymentStore } from "./store";
import { Config } from "../shared/config";

export class PayMongoService implements PaymentProvider {
  private http: AxiosInstance;
  private enabled: boolean;
  private apiKey: string | null;

  constructor(private store: PaymentStore, private config: Config) {
    this.apiKey = config.PAYMONGO_SECRET_KEY || null;
    this.enabled = !!this.apiKey;
    this.http = axios.create({
      baseURL: "[api.paymongo.com](https://api.paymongo.com/v1)",
      auth: this.apiKey ? { username: this.apiKey, password: "" } : undefined,
      headers: { "Content-Type": "application/json" }
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async createIntent(amount: number, currency: string, metadata: Record<string, string>): Promise<PaymentIntent> {
    if (!this.enabled) {
      return this.store.createIntent({
        provider: "paymongo",
        providerIntentId: null,
        amount,
        currency,
        status: "requires_payment_method",
        metadata
      });
    }
    const res = await this.http.post("/payment_intents", {
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          payment_method_allowed: ["card", "gcash", "grab_pay", "paymaya"],
          payment_method_options: { card: { request_three_d_secure: "automatic" } },
          currency: currency.toLowerCase(),
          capture_type: "automatic",
          metadata
        }
      }
    });
    const pi = res.data.data;
    return this.store.createIntent({
      provider: "paymongo",
      providerIntentId: pi.id,
      amount,
      currency,
      status: this.mapStatus(pi.attributes.status),
      metadata
    });
  }

  async attachPaymentMethod(intentId: string, paymentMethod: PaymentMethod): Promise<PaymentIntent> {
    const intent = await this.store.getById(intentId);
    if (!intent) throw new Error("Payment intent not found");
    if (!this.enabled || !intent.providerIntentId) {
      return intent;
    }
    const res = await this.http.post(`/payment_intents/${intent.providerIntentId}/attach`, {
      data: {
        attributes: {
          payment_method: paymentMethod.id,
          return_url: paymentMethod.returnUrl
        }
      }
    });
    const pi = res.data.data;
    return this.store.updateStatus(intentId, this.mapStatus(pi.attributes.status), {
      latest_provider_payload: pi
    });
  }

  async retrieveIntent(intentId: string): Promise<PaymentIntent> {
    const intent = await this.store.getById(intentId);
    if (!intent) throw new Error("Payment intent not found");
    if (!this.enabled || !intent.providerIntentId) {
      return intent;
    }
    const res = await this.http.get(`/payment_intents/${intent.providerIntentId}`);
    const pi = res.data.data;
    return this.store.updateStatus(intentId, this.mapStatus(pi.attributes.status), {
      latest_provider_payload: pi
    });
  }

  async syncStatuses(limit: number = 100): Promise<PaymentSyncResult> {
    const pending = await this.store.listByStatuses(["requires_payment_method", "requires_action", "processing", "succeeded_pending_sync"], limit);
    let updated = 0;
    for (const p of pending) {
      if (!this.enabled || !p.providerIntentId) continue;
      try {
        const res = await this.http.get(`/payment_intents/${p.providerIntentId}`);
        const pi = res.data.data;
        const newStatus = this.mapStatus(pi.attributes.status);
        if (newStatus !== p.status) {
          await this.store.updateStatus(p.id, newStatus, { latest_provider_payload: pi });
          updated++;
        }
      } catch {}
    }
    return { checked: pending.length, updated };
  }

  visibilityFor(role: "buyer" | "seller" | "admin"): PaymentVisibility {
    if (role === "admin") return { canViewAmounts: true, canViewPii: true, canRefund: true };
    if (role === "seller") return { canViewAmounts: true, canViewPii: false, canRefund: false };
    return { canViewAmounts: true, canViewPii: false, canRefund: false };
  }

  private mapStatus(s: string): PaymentStatus {
    if (s === "succeeded") return "succeeded";
    if (s === "awaiting_next_action" || s === "processing") return "processing";
    if (s === "requires_payment_method" || s === "requires_action") return "requires_payment_method";
    if (s === "canceled") return "canceled";
    if (s === "failed") return "failed";
    return "processing";
  }
}
