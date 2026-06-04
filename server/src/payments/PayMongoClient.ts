import fetch from "node-fetch";

export type PayMongoStatus = "pending" | "paid" | "failed" | "refunded" | "voided" | "expired";

export interface PayMongoConfig {
  publicKey: string;
  secretKey: string;
  baseUrl: string;
  enabled: boolean;
}

export interface CreateCheckoutParams {
  amount: number;
  currency: string;
  description: string;
  referenceId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  billing: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, string>;
}

export interface CheckoutResponse {
  id: string;
  status: PayMongoStatus | "unpaid";
  checkoutUrl: string;
  referenceId: string;
  amount: number;
  currency: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    attributes: {
      type?: string;
      status?: string;
      data?: any;
      reference_number?: string;
      amount?: number;
      currency?: string;
    };
  };
}

export class PayMongoClient {
  private config: PayMongoConfig;

  constructor(config: PayMongoConfig) {
    this.config = config;
  }

  isEnabled(): boolean {
    return !!this.config.enabled && !!this.config.publicKey && !!this.config.secretKey && !!this.config.baseUrl;
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResponse> {
    if (!this.isEnabled()) {
      return {
        id: "disabled",
        status: "pending",
        checkoutUrl: "",
        referenceId: params.referenceId,
        amount: params.amount,
        currency: params.currency
      };
    }
    const url = `${this.config.baseUrl}/v1/checkout_sessions`;
    const payload = {
      data: {
        attributes: {
          amount: Math.round(params.amount),
          currency: params.currency,
          description: params.description,
          reference_number: params.referenceId,
          cancel_url: params.cancelUrl,
          success_url: params.successUrl,
          billing: {
            name: params.billing.name || "",
            email: params.customerEmail || params.billing.email || "",
            phone: params.billing.phone || ""
          },
          payment_method_types: ["gcash", "paymaya", "card"],
          metadata: params.metadata || {}
        }
      }
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(this.config.secretKey + ":").toString("base64")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    const json = await res.json();
    const attr = json.data.attributes;
    return {
      id: json.data.id,
      status: this.mapStatus(attr.status || "unpaid"),
      checkoutUrl: attr.checkout_url,
      referenceId: attr.reference_number,
      amount: attr.amount,
      currency: attr.currency
    };
  }

  async retrieveCheckout(id: string): Promise<CheckoutResponse> {
    if (!this.isEnabled()) {
      return {
        id: "disabled",
        status: "pending",
        checkoutUrl: "",
        referenceId: "",
        amount: 0,
        currency: "PHP"
      };
    }
    const url = `${this.config.baseUrl}/v1/checkout_sessions/${id}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(this.config.secretKey + ":").toString("base64")}`
      }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    const json = await res.json();
    const attr = json.data.attributes;
    return {
      id: json.data.id,
      status: this.mapStatus(attr.status || "unpaid"),
      checkoutUrl: attr.checkout_url,
      referenceId: attr.reference_number,
      amount: attr.amount,
      currency: attr.currency
    };
  }

  verifyWebhookSignature(signatureHeader: string, rawBody: string): boolean {
    if (!this.isEnabled()) return true;
    if (!signatureHeader) return false;
    const parts = signatureHeader.split(",");
    const sigPart = parts.find(p => p.startsWith("v1="));
    if (!sigPart) return false;
    const provided = sigPart.replace("v1=", "").trim();
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", this.config.secretKey);
    hmac.update(rawBody);
    const computed = hmac.digest("hex");
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(computed));
  }

  parseWebhook(event: WebhookEvent): {
    referenceId: string;
    status: PayMongoStatus;
    amount: number;
    currency: string;
  } | null {
    if (!event || !event.data || !event.data.attributes) return null;
    const a = event.data.attributes;
    const status = this.mapStatus(a.status || "");
    const ref = a.reference_number || (a.data && a.data.attributes && a.data.attributes.reference_number) || "";
    const amount = a.amount || (a.data && a.data.attributes && a.data.attributes.amount) || 0;
    const currency = a.currency || (a.data && a.data.attributes && a.data.attributes.currency) || "PHP";
    if (!ref) return null;
    return {
      referenceId: ref,
      status,
      amount,
      currency
    };
  }

  private mapStatus(status: string): PayMongoStatus {
    switch (status) {
      case "paid":
      case "succeeded":
      case "paid_out":
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
        return "pending";
    }
  }
}
