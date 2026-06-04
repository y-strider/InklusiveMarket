import axios, { AxiosInstance } from "axios";

export type PayMongoEnvironment = "test" | "live";

export type PayMongoPaymentStatus = "pending" | "paid" | "failed" | "canceled";

export interface PayMongoConfig {
  enabled: boolean;
  secretKey?: string;
  publicKey?: string;
  environment: PayMongoEnvironment;
  webhookSigningSecret?: string;
  baseUrl?: string;
}

export interface PaymentIntentCreateParams {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, string | number | boolean>;
  paymentMethodAllowed: string[];
  captureType?: "automatic" | "manual";
}

export interface PaymentIntent {
  id: string;
  clientKey: string | null;
  status: PayMongoPaymentStatus | "awaiting_payment_method" | "processing" | "requires_payment_method" | "succeeded";
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: number;
}

export interface PaymentMethodAttachParams {
  paymentMethodId: string;
  returnUrl?: string;
}

export interface PaymentEventVerification {
  valid: boolean;
  reason?: string;
}

export interface PayMongoPayment {
  id: string;
  amount: number;
  currency: string;
  status: PayMongoPaymentStatus;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  paidAt?: number | null;
  raw: any;
}

export class PayMongoService {
  private http: AxiosInstance;
  private cfg: PayMongoConfig;
  private disabled: boolean;

  constructor(cfg: PayMongoConfig) {
    this.cfg = {
      baseUrl: "[api.paymongo.com](https://api.paymongo.com/v1)",
      ...cfg
    };
    this.disabled = !cfg.enabled || !cfg.secretKey || !cfg.publicKey;
    this.http = axios.create({
      baseURL: this.cfg.baseUrl,
      timeout: 15000,
      headers: this.disabled
        ? {}
        : {
            Authorization: `Basic ${Buffer.from(`${this.cfg.secretKey}:`).toString("base64")}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          }
    });
  }

  isLive(): boolean {
    return this.cfg.environment === "live";
  }

  isEnabled(): boolean {
    return this.cfg.enabled === true;
  }

  isExecutionDisabled(): boolean {
    return this.disabled;
  }

  disableExecutionReason(): string | null {
    if (!this.cfg.enabled) return "Payments are disabled by configuration.";
    if (!this.cfg.secretKey || !this.cfg.publicKey) return "Payment credentials are not configured.";
    return null;
  }

  availabilityMessage(): string | null {
    if (this.isExecutionDisabled()) {
      return "PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator.";
    }
    return null;
  }

  async createPaymentIntent(params: PaymentIntentCreateParams): Promise<PaymentIntent> {
    if (this.isExecutionDisabled()) {
      return {
        id: `disabled_pi_${Date.now()}`,
        clientKey: null,
        status: "pending",
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        metadata: params.metadata,
        createdAt: Math.floor(Date.now() / 1000)
      };
    }
    const res = await this.http.post("/payment_intents", {
      data: {
        attributes: {
          amount: params.amount,
          currency: params.currency,
          description: params.description,
          payment_method_allowed: params.paymentMethodAllowed,
          capture_type: params.captureType || "automatic",
          metadata: params.metadata
        }
      }
    });
    const d = res.data.data;
    return {
      id: d.id,
      clientKey: d.attributes.client_key ?? null,
      status: this.mapIntentStatus(d.attributes.status),
      amount: d.attributes.amount,
      currency: d.attributes.currency,
      description: d.attributes.description,
      metadata: d.attributes.metadata,
      createdAt: d.attributes.created_at
    };
  }

  async retrievePaymentIntent(id: string): Promise<PaymentIntent> {
    if (this.isExecutionDisabled()) {
      return {
        id,
        clientKey: null,
        status: "pending",
        amount: 0,
        currency: "PHP",
        createdAt: Math.floor(Date.now() / 1000)
      };
    }
    const res = await this.http.get(`/payment_intents/${id}`);
    const d = res.data.data;
    return {
      id: d.id,
      clientKey: d.attributes.client_key ?? null,
      status: this.mapIntentStatus(d.attributes.status),
      amount: d.attributes.amount,
      currency: d.attributes.currency,
      description: d.attributes.description,
      metadata: d.attributes.metadata,
      createdAt: d.attributes.created_at
    };
  }

  async attachPaymentMethod(intentId: string, params: PaymentMethodAttachParams): Promise<PaymentIntent> {
    if (this.isExecutionDisabled()) {
      return {
        id: intentId,
        clientKey: null,
        status: "pending",
        amount: 0,
        currency: "PHP",
        createdAt: Math.floor(Date.now() / 1000)
      };
    }
    const res = await this.http.post(`/payment_intents/${intentId}/attach`, {
      data: {
        attributes: {
          payment_method: params.paymentMethodId,
          return_url: params.returnUrl
        }
      }
    });
    const d = res.data.data;
    return {
      id: d.id,
      clientKey: d.attributes.client_key ?? null,
      status: this.mapIntentStatus(d.attributes.status),
      amount: d.attributes.amount,
      currency: d.attributes.currency,
      description: d.attributes.description,
      metadata: d.attributes.metadata,
      createdAt: d.attributes.created_at
    };
  }

  async listPaymentsByIntent(intentId: string): Promise<PayMongoPayment[]> {
    if (this.isExecutionDisabled()) {
      return [];
    }
    const res = await this.http.get(`/payments`, { params: { payment_intent_id: intentId } });
    const arr = res.data.data as any[];
    return arr.map(this.mapPayment);
  }

  async retrievePayment(id: string): Promise<PayMongoPayment> {
    if (this.isExecutionDisabled()) {
      return {
        id,
        amount: 0,
        currency: "PHP",
        status: "pending",
        createdAt: Math.floor(Date.now() / 1000),
        raw: {}
      };
    }
    const res = await this.http.get(`/payments/${id}`);
    return this.mapPayment(res.data.data);
  }

  verifyWebhookSignature(payload: string, signature: string | undefined): PaymentEventVerification {
    if (!this.cfg.webhookSigningSecret) {
      return { valid: false, reason: "Missing webhook signing secret" };
    }
    if (!signature) {
      return { valid: false, reason: "Missing signature header" };
    }
    try {
      const [t, v1] = this.parseSignature(signature);
      if (!t || !v1) return { valid: false, reason: "Invalid signature header" };
      const crypto = require("crypto");
      const hmac = crypto.createHmac("sha256", this.cfg.webhookSigningSecret);
      hmac.update(`${t}.${payload}`);
      const digest = hmac.digest("hex");
      if (this.timingSafeEqual(Buffer.from(digest), Buffer.from(v1))) {
        return { valid: true };
      }
      return { valid: false, reason: "Signature mismatch" };
    } catch (e) {
      return { valid: false, reason: "Verification error" };
    }
  }

  private parseSignature(sig: string): [string | null, string | null] {
    const parts = sig.split(",").map(s => s.trim());
    let t: string | null = null;
    let v1: string | null = null;
    for (const p of parts) {
      const [k, v] = p.split("=");
      if (k === "t") t = v;
      if (k === "v1") v1 = v;
    }
    return [t, v1];
  }

  private timingSafeEqual(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) return false;
    const crypto = require("crypto");
    return crypto.timingSafeEqual(a, b);
  }

  private mapIntentStatus(s: string): PayMongoPaymentStatus | "awaiting_payment_method" | "processing" | "requires_payment_method" | "succeeded" {
    switch (s) {
      case "succeeded":
        return "paid";
      case "failed":
        return "failed";
      case "canceled":
        return "canceled";
      case "processing":
        return "processing";
      case "awaiting_payment_method":
        return "awaiting_payment_method";
      case "requires_payment_method":
        return "requires_payment_method";
      default:
        return "pending";
    }
  }

  private mapPayment = (d: any): PayMongoPayment => {
    const status = d.attributes?.status;
    let mapped: PayMongoPaymentStatus = "pending";
    if (status === "paid") mapped = "paid";
    else if (status === "failed") mapped = "failed";
    else if (status === "canceled") mapped = "canceled";
    return {
      id: d.id,
      amount: d.attributes.amount,
      currency: d.attributes.currency,
      status: mapped,
      description: d.attributes.description,
      metadata: d.attributes.metadata,
      createdAt: d.attributes.created_at,
      paidAt: d.attributes.paid_at ?? null,
      raw: d
    };
  };
}
