import axios from "axios";

export type PaymongoMode = "test" | "live";
export type PaymongoSourceType = "gcash" | "grab_pay" | "paymaya" | "card";
export type Currency = "PHP";

export type PaymongoConfig = {
  secretKey?: string;
  publicKey?: string;
  mode: PaymongoMode;
  baseUrl?: string;
  enabled: boolean;
};

export type CreatePaymentIntentInput = {
  amount: number;
  currency: Currency;
  description?: string;
  metadata?: Record<string, string>;
  paymentMethodAllowed: PaymongoSourceType[];
  paymentMethodOptions?: Record<string, unknown>;
  statementDescriptor?: string;
  captureType?: "automatic" | "manual";
};

export type PaymentIntent = {
  id: string;
  clientKey?: string;
  amount: number;
  currency: Currency;
  status:
    | "awaiting_payment_method"
    | "processing"
    | "succeeded"
    | "awaiting_next_action"
    | "canceled";
  description?: string | null;
  lastPaymentError?: string | null;
  nextAction?: unknown | null;
  livemode: boolean;
  metadata: Record<string, string>;
};

export type AttachPaymentMethodInput = {
  paymentIntentId: string;
  paymentMethodId: string;
  returnUrl?: string;
  clientKey?: string;
};

export type WebhookEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      type: string;
      attributes: any;
    };
  };
  livemode: boolean;
  created_at: number;
};

export class PaymongoUnavailableError extends Error {
  constructor() {
    super(
      "PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator."
    );
    this.name = "PaymongoUnavailableError";
  }
}

export class PaymongoService {
  private readonly cfg: PaymongoConfig;
  private readonly http = axios.create();

  constructor(cfg: PaymongoConfig) {
    this.cfg = {
      baseUrl: "[api.paymongo.com](https://api.paymongo.com/v1)",
      ...cfg,
    };
  }

  isEnabled(): boolean {
    return !!this.cfg.enabled;
  }

  private requireEnabled(): void {
    if (!this.isEnabled() || !this.cfg.secretKey || !this.cfg.publicKey) {
      throw new PaymongoUnavailableError();
    }
  }

  private authHeader(): { Authorization: string } {
    const key = this.cfg.secretKey || "";
    const token = Buffer.from(`${key}:`).toString("base64");
    return { Authorization: `Basic ${token}` };
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    this.requireEnabled();
    const url = `${this.cfg.baseUrl}/payment_intents`;
    const payload = {
      data: {
        attributes: {
          amount: Math.round(input.amount),
          payment_method_allowed: input.paymentMethodAllowed,
          payment_method_options: input.paymentMethodOptions || {},
          currency: input.currency,
          description: input.description || null,
          statement_descriptor: input.statementDescriptor || null,
          capture_type: input.captureType || "automatic",
          metadata: input.metadata || {},
        },
      },
    };
    const res = await this.http.post(url, payload, {
      headers: {
        ...this.authHeader(),
        "Content-Type": "application/json",
      },
    });
    const a = res.data.data.attributes;
    return {
      id: res.data.data.id,
      clientKey: a.client_key,
      amount: a.amount,
      currency: a.currency,
      status: a.status,
      description: a.description,
      lastPaymentError: a.last_payment_error || null,
      nextAction: a.next_action || null,
      livemode: a.livemode,
      metadata: a.metadata || {},
    };
  }

  async retrievePaymentIntent(id: string): Promise<PaymentIntent> {
    this.requireEnabled();
    const url = `${this.cfg.baseUrl}/payment_intents/${id}`;
    const res = await this.http.get(url, {
      headers: {
        ...this.authHeader(),
      },
    });
    const a = res.data.data.attributes;
    return {
      id: res.data.data.id,
      clientKey: a.client_key,
      amount: a.amount,
      currency: a.currency,
      status: a.status,
      description: a.description,
      lastPaymentError: a.last_payment_error || null,
      nextAction: a.next_action || null,
      livemode: a.livemode,
      metadata: a.metadata || {},
    };
  }

  async cancelPaymentIntent(id: string): Promise<PaymentIntent> {
    this.requireEnabled();
    const url = `${this.cfg.baseUrl}/payment_intents/${id}/cancel`;
    const res = await this.http.post(url, {}, { headers: this.authHeader() });
    const a = res.data.data.attributes;
    return {
      id: res.data.data.id,
      clientKey: a.client_key,
      amount: a.amount,
      currency: a.currency,
      status: a.status,
      description: a.description,
      lastPaymentError: a.last_payment_error || null,
      nextAction: a.next_action || null,
      livemode: a.livemode,
      metadata: a.metadata || {},
    };
  }

  async attachPaymentMethod(input: AttachPaymentMethodInput): Promise<PaymentIntent> {
    this.requireEnabled();
    const url = `${this.cfg.baseUrl}/payment_intents/${input.paymentIntentId}/attach`;
    const payload = {
      data: {
        attributes: {
          payment_method: input.paymentMethodId,
          return_url: input.returnUrl || null,
          client_key: input.clientKey || null,
        },
      },
    };
    const res = await this.http.post(url, payload, {
      headers: {
        ...this.authHeader(),
        "Content-Type": "application/json",
      },
    });
    const a = res.data.data.attributes;
    return {
      id: res.data.data.id,
      clientKey: a.client_key,
      amount: a.amount,
      currency: a.currency,
      status: a.status,
      description: a.description,
      lastPaymentError: a.last_payment_error || null,
      nextAction: a.next_action || null,
      livemode: a.livemode,
      metadata: a.metadata || {},
    };
  }

  async verifySignature(rawBody: string, signatureHeader: string | undefined, webhookSecret: string | undefined): Promise<boolean> {
    if (!signatureHeader || !webhookSecret) return false;
    const [tPart, sigPart] = signatureHeader.split(",").map(s => s.trim());
    if (!tPart || !sigPart) return false;
    const t = tPart.replace("t=", "");
    const sig = sigPart.replace("v1=", "");
    const crypto = await import("crypto");
    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(`${t}.${rawBody}`);
    const digest = hmac.digest("hex");
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(sig));
  }
}
