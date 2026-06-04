import { PayMongoService } from './PayMongoService'
import { PaymentProvider, PaymentProviderName } from './PaymentProvider'

type RegistryConfig = {
  paymongo?: {
    secretKey?: string
    publicKey?: string
    webhookSecret?: string
    baseUrl?: string
  }
}

class PaymentRegistry {
  private static instance: PaymentRegistry
  private providers: Map<PaymentProviderName, PaymentProvider> = new Map()

  private constructor() {}

  static getInstance(): PaymentRegistry {
    if (!PaymentRegistry.instance) PaymentRegistry.instance = new PaymentRegistry()
    return PaymentRegistry.instance
  }

  configure(cfg: RegistryConfig) {
    const pm = new PayMongoService({
      secretKey: cfg.paymongo?.secretKey || process.env.PAYMONGO_SECRET_KEY,
      publicKey: cfg.paymongo?.publicKey || process.env.PAYMONGO_PUBLIC_KEY,
      webhookSecret: cfg.paymongo?.webhookSecret || process.env.PAYMONGO_WEBHOOK_SECRET,
      baseUrl: cfg.paymongo?.baseUrl
    })
    this.providers.set(pm.name, pm)
  }

  get(name: PaymentProviderName): PaymentProvider {
    const p = this.providers.get(name)
    if (!p) {
      const pm = new PayMongoService({
        secretKey: process.env.PAYMONGO_SECRET_KEY,
        publicKey: process.env.PAYMONGO_PUBLIC_KEY,
        webhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET
      })
      this.providers.set(pm.name, pm)
      return pm
    }
    return p
  }
}

export const Payments = PaymentRegistry.getInstance()
export * from './PaymentProvider'
