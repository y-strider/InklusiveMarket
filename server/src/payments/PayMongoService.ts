import crypto from 'crypto'
import fetch from 'node-fetch'
import { PaymentProvider, PaymentProviderName, PaymentStatus, CreatePaymentIntentInput, CreateCheckoutSessionInput, PaymentIntent, RefundInput } from './PaymentProvider'

type PayMongoConfig = {
  secretKey?: string
  publicKey?: string
  webhookSecret?: string
  baseUrl?: string
  enabled?: boolean
}

type PayMongoPayment = {
  id: string
  type: string
  attributes: {
    amount: number
    currency: string
    description?: string
    status: string
    access_url?: string
    livemode: boolean
    created_at: number
    updated_at?: number
    payments?: Array<any>
    statement_descriptor?: string
    metadata?: Record<string, any>
    client_key?: string
    checkout_url?: string
    reference_number?: string
  }
}

export class PayMongoService implements PaymentProvider {
  name: PaymentProviderName = PaymentProviderName.PayMongo
  webhookSignatureHeader = 'Paymongo-Signature'
  private config: PayMongoConfig

  constructor(config: PayMongoConfig) {
    this.config = {
      baseUrl: '[api.paymongo.com](https://api.paymongo.com/v1)',
      enabled: Boolean(config.secretKey && config.publicKey),
      ...config
    }
  }

  private get isEnabled(): boolean {
    return Boolean(this.config.enabled && this.config.secretKey && this.config.publicKey)
  }

  private authHeader(): string {
    if (!this.isEnabled) return ''
    const token = Buffer.from(`${this.config.secretKey}:`).toString('base64')
    return `Basic ${token}`
  }

  private headers(): Record<string, string> {
    if (!this.isEnabled) {
      return { 'Content-Type': 'application/json' }
    }
    return {
      'Content-Type': 'application/json',
      Authorization: this.authHeader()
    }
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    if (!this.isEnabled) {
      return {
        id: 'disabled_paymongo_intent',
        provider: this.name,
        status: PaymentStatus.Pending,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        clientSecret: undefined,
        raw: { message: 'PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator.' }
      }
    }
    const body = {
      data: {
        attributes: {
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          capture_type: input.captureMethod === 'manual' ? 'manual' : 'automatic',
          statement_descriptor: input.statementDescriptor,
          metadata: input.metadata || {},
          payment_method_allowed: ['card', 'gcash', 'grab_pay', 'paymaya', 'dob'],
          payment_method_options: { card: { request_three_d_secure: 'automatic' } }
        }
      }
    }
    const res = await fetch(`${this.config.baseUrl}/payment_intents`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body)
    })
    const json: { data: PayMongoPayment } = await res.json()
    return {
      id: json.data.id,
      provider: this.name,
      status: this.mapStatus(json.data.attributes.status),
      amount: json.data.attributes.amount,
      currency: json.data.attributes.currency.toUpperCase() as any,
      description: json.data.attributes.description || '',
      clientSecret: json.data.attributes.client_key,
      raw: json
    }
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<PaymentIntent> {
    if (!this.isEnabled) {
      return {
        id: 'disabled_paymongo_checkout',
        provider: this.name,
        status: PaymentStatus.Pending,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        checkoutUrl: undefined,
        referenceId: input.referenceId,
        raw: { message: 'PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator.' }
      }
    }
    const body = {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          description: input.description,
          statement_descriptor: input.description,
          reference_number: input.referenceId,
          cancel_url: input.cancelUrl,
          success_url: input.successUrl,
          customer_email: input.customerEmail,
          line_items: [
            {
              currency: input.currency,
              amount: input.amount,
              name: input.description,
              quantity: 1
            }
          ],
          payment_method_types: ['gcash', 'card', 'paymaya', 'grab_pay', 'dob'],
          metadata: input.metadata || {}
        }
      }
    }
    const res = await fetch(`${this.config.baseUrl}/checkout_sessions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body)
    })
    const json: { data: PayMongoPayment } = await res.json()
    return {
      id: json.data.id,
      provider: this.name,
      status: this.mapStatus(json.data.attributes.status),
      amount: json.data.attributes.amount,
      currency: json.data.attributes.currency?.toUpperCase?.() as any || input.currency,
      description: json.data.attributes.description || input.description,
      checkoutUrl: json.data.attributes.checkout_url || json.data.attributes.access_url,
      referenceId: json.data.attributes.reference_number || input.referenceId,
      raw: json
    }
  }

  async retrievePayment(paymentId: string): Promise<PaymentIntent> {
    if (!this.isEnabled) {
      return {
        id: paymentId,
        provider: this.name,
        status: PaymentStatus.Pending,
        amount: 0,
        currency: 'PHP',
        description: '',
        raw: { message: 'PayMongo disabled' }
      }
    }
    const res = await fetch(`${this.config.baseUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: this.headers()
    })
    const json: { data: PayMongoPayment } = await res.json()
    return {
      id: json.data.id,
      provider: this.name,
      status: this.mapStatus(json.data.attributes.status),
      amount: json.data.attributes.amount,
      currency: json.data.attributes.currency.toUpperCase() as any,
      description: json.data.attributes.description || '',
      raw: json
    }
  }

  async refund(input: RefundInput): Promise<void> {
    if (!this.isEnabled) return
    const body = {
      data: {
        attributes: {
          amount: input.amount,
          notes: input.reason
        }
      }
    }
    await fetch(`${this.config.baseUrl}/payments/${input.paymentId}/refunds`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body)
    })
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) return false
    try {
      const [tPart, sPart] = signature.split(',')
      const t = tPart.split('=')[1]
      const v1 = sPart.split('=')[1]
      const data = `${t}.${payload}`
      const hmac = crypto.createHmac('sha256', this.config.webhookSecret)
      hmac.update(data)
      const digest = hmac.digest('hex')
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(v1))
    } catch {
      return false
    }
  }

  parseWebhook(payload: any): { paymentId: string; status: PaymentStatus; raw: any } {
    const d = payload?.data || payload
    const id = d?.id || d?.data?.id || ''
    const status = this.mapStatus(d?.attributes?.status || d?.data?.attributes?.status || '')
    return { paymentId: id, status, raw: payload }
  }

  private mapStatus(s: string): PaymentStatus {
    const k = (s || '').toLowerCase()
    if (k === 'paid' || k === 'succeeded') return PaymentStatus.Paid
    if (k === 'processing' || k === 'awaiting_next_action' || k === 'pending') return PaymentStatus.Pending
    if (k === 'authorized') return PaymentStatus.Authorized
    if (k === 'failed') return PaymentStatus.Failed
    if (k === 'refunded') return PaymentStatus.Refunded
    if (k === 'canceled' || k === 'cancelled') return PaymentStatus.Canceled
    return PaymentStatus.Pending
  }
}
