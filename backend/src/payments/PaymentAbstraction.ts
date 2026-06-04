import { PaymongoService, PaymongoUnavailableError, CreatePaymentIntentInput, PaymentIntent, AttachPaymentMethodInput } from "./PaymongoService";

export type PaymentGateway = "paymongo";

export type PaymentConfig = {
  gateway: PaymentGateway;
  paymongo: {
    enabled: boolean;
    mode: "test" | "live";
    secretKey?: string;
    publicKey?: string;
    webhookSecret?: string;
  };
};

export class PaymentProvider {
  private readonly cfg: PaymentConfig;
  private readonly paymongo: PaymongoService;

  constructor(cfg: PaymentConfig) {
    this.cfg = cfg;
    this.paymongo = new PaymongoService({
      enabled: cfg.paymongo.enabled,
      mode: cfg.paymongo.mode,
      secretKey: cfg.paymongo.secretKey,
      publicKey: cfg.paymongo.publicKey,
    });
  }

  gateway(): PaymentGateway {
    return this.cfg.gateway;
  }

  isLive(): boolean {
    return this.cfg.paymongo.mode === "live";
  }

  isEnabled(): boolean {
    return this.cfg.paymongo.enabled;
  }

  async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    try {
      return await this.paymongo.createPaymentIntent(input);
    } catch (e) {
      if (e instanceof PaymongoUnavailableError) {
        throw e;
      }
      throw e;
    }
  }

  async retrieveIntent(id: string): Promise<PaymentIntent> {
    try {
      return await this.paymongo.retrievePaymentIntent(id);
    } catch (e) {
      if (e instanceof PaymongoUnavailableError) {
        throw e;
      }
      throw e;
    }
  }

  async cancelIntent(id: string): Promise<PaymentIntent> {
    try {
      return await this.paymongo.cancelPaymentIntent(id);
    } catch (e) {
      if (e instanceof PaymongoUnavailableError) {
        throw e;
      }
      throw e;
    }
  }

  async attachMethod(input: AttachPaymentMethodInput): Promise<PaymentIntent> {
    try {
      return await this.paymongo.attachPaymentMethod(input);
    } catch (e) {
      if (e instanceof PaymongoUnavailableError) {
        throw e;
      }
      throw e;
    }
  }
}
