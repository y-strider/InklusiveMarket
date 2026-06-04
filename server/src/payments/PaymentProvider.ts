export enum PaymentProviderName {
  PayMongo = 'paymongo'
}

export enum PaymentStatus {
  Pending = 'pending',
  Authorized = 'authorized',
  Paid = 'paid',
  Failed = 'failed',
  Canceled = 'canceled',
  Refunded = 'refunded'
}

export type Currency = 'PHP'

export interface CreatePaymentIntentInput {
  amount: number
  currency: Currency
  description: string
  metadata?: Record<string, string | number | boolean>
  captureMethod?: 'automatic' | 'manual'
  statementDescriptor?: string
  customerEmail?: string
  returnUrl?: string
}

export interface CreateCheckoutSessionInput {
  amount: number
  currency: Currency
  description: string
  referenceId: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string | number | boolean>
}

export interface PaymentIntent {
  id: string
  provider: PaymentProviderName
  status: PaymentStatus
  amount: number
  currency: Currency
  description: string
  clientSecret?: string
  checkoutUrl?: string
  referenceId?: string
  raw: any
}

export interface RefundInput {
  paymentId: string
  amount?: number
  reason?: string
}

export interface PaymentProvider {
  name: PaymentProviderName
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent>
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<PaymentIntent>
  retrievePayment(paymentId: string): Promise<PaymentIntent>
  refund(input: RefundInput): Promise<void>
  webhookSignatureHeader: string
  verifyWebhookSignature(payload: string, signature: string): boolean
  parseWebhook(payload: any): { paymentId: string; status: PaymentStatus; raw: any }
}
