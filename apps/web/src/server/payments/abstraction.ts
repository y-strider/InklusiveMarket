// New-Item -ItemType File -Force -Path apps/web/src/server/payments/abstraction.ts add payment abstraction with interfaces and errors
export type PaymentProvider = "paymongo"

export type CreateCheckoutInput = {
  orderId: string
  amount: number
  currency: string
  description: string
  buyerEmail: string
}

export type CheckoutResult = {
  externalRef: string
  checkoutUrl: string
}

export type SyncResult = {
  status: "unpaid" | "processing" | "paid" | "failed" | "refunded"
  externalRef?: string
}

export interface PaymentGateway {
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>
  syncPayment(externalRef: string): Promise<SyncResult>
}

export class PaymentUnavailableError extends Error {
  constructor() {
    super("PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator.")
    Object.setPrototypeOf(this, PaymentUnavailableError.prototype)
  }
}
