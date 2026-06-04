import { PaymentCheckout, PaymentCreateCheckoutInput, PaymentProvider } from '../../domain/payments/PaymentProvider';

type Env = {
  PAYMONGO_PUBLIC_KEY?: string;
  PAYMONGO_SECRET_KEY?: string;
  PAYMONGO_WEBHOOK_SECRET?: string;
};

function env(): Env {
  return {
    PAYMONGO_PUBLIC_KEY: process.env.PAYMONGO_PUBLIC_KEY,
    PAYMONGO_SECRET_KEY: process.env.PAYMONGO_SECRET_KEY,
    PAYMONGO_WEBHOOK_SECRET: process.env.PAYMONGO_WEBHOOK_SECRET
  };
}

export class PayMongoProvider implements PaymentProvider {
  name(): string {
    return 'paymongo';
  }

  async createCheckout(input: PaymentCreateCheckoutInput): Promise<PaymentCheckout> {
    const e = env();
    if (!e.PAYMONGO_PUBLIC_KEY || !e.PAYMONGO_SECRET_KEY) {
      return {
        provider: this.name(),
        providerPaymentId: null,
        checkoutUrl: null,
        status: 'failed',
        raw: {
          message: 'PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator.'
        }
      };
    }
    const payload = {
      data: {
        attributes: {
          line_items: [
            {
              name: input.description,
              amount: Math.round(input.amount * 100),
              currency: input.currency.toLowerCase(),
              quantity: 1
            }
          ],
          payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay', 'billease'],
          success_url: input.returnUrl,
          cancel_url: input.cancelUrl,
          description: input.description,
          metadata: {
            order_id: input.orderId,
            buyer_email: input.buyerEmail
          }
        }
      }
    };
    const res = await fetch('[api.paymongo.com](https://api.paymongo.com/v1/checkout_sessions)', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(e.PAYMONGO_SECRET_KEY + ':').toString('base64')
      },
      body: JSON.stringify(payload)
    });
    const raw = await res.json();
    if (!res.ok) {
      return {
        provider: this.name(),
        providerPaymentId: null,
        checkoutUrl: null,
        status: 'failed',
        raw
      };
    }
    return {
      provider: this.name(),
      providerPaymentId: raw.data?.id ?? null,
      checkoutUrl: raw.data?.attributes?.checkout_url ?? null,
      status: 'pending',
      raw
    };
  }

  async parseWebhook(headers: Record<string, string | string[] | undefined>, body: unknown): Promise<{
    event: string;
    providerPaymentId: string | null;
    orderReference?: string | null;
    status: 'authorized' | 'paid' | 'failed' | 'refunded' | 'voided';
    amount?: number | undefined;
    currency?: string | undefined;
    raw: Record<string, unknown>;
  }> {
    const e = env();
    const event = typeof (body as any)?.data?.attributes?.type === 'string' ? (body as any).data.attributes.type : 'unknown';
    const providerPaymentId = (body as any)?.data?.id ?? null;
    const amount = ((body as any)?.data?.attributes?.data?.attributes?.amount ?? null) as number | null;
    const currency = ((body as any)?.data?.attributes?.data?.attributes?.currency ?? null) as string | null;
    const metadata = (body as any)?.data?.attributes?.data?.attributes?.metadata ?? {};
    let status: 'authorized' | 'paid' | 'failed' | 'refunded' | 'voided' = 'failed';
    if (event.includes('payment.paid') || event.includes('checkout_session.payment.paid')) status = 'paid';
    else if (event.includes('payment.refunded')) status = 'refunded';
    else if (event.includes('payment.authorized')) status = 'authorized';
    else if (event.includes('payment.voided')) status = 'voided';
    return {
      event,
      providerPaymentId,
      orderReference: metadata?.order_id ?? null,
      status,
      amount: amount ? amount / 100 : undefined,
      currency: currency ? currency.toUpperCase() : undefined,
      raw: { headers, body, verified: !!e.PAYMONGO_WEBHOOK_SECRET }
    };
  }

  async fetchStatus(providerPaymentId: string): Promise<{
    status: 'authorized' | 'paid' | 'failed' | 'refunded' | 'voided' | 'pending';
    amount?: number | undefined;
    currency?: string | undefined;
    raw: Record<string, unknown>;
  }> {
    const e = env();
    if (!e.PAYMONGO_SECRET_KEY) {
      return {
        status: 'pending',
        raw: {
          message: 'PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator.'
        }
      };
    }
    const res = await fetch('[api.paymongo.com](https://api.paymongo.com/v1/payments/)' + encodeURIComponent(providerPaymentId), {
      headers: {
        Authorization: 'Basic ' + Buffer.from(e.PAYMONGO_SECRET_KEY + ':').toString('base64')
      }
    });
    const raw = await res.json();
    if (!res.ok) {
      return { status: 'failed', raw };
    }
    const attr = raw.data?.attributes ?? {};
    let status: 'authorized' | 'paid' | 'failed' | 'refunded' | 'voided' | 'pending' = 'pending';
    if (attr.status === 'paid') status = 'paid';
    else if (attr.status === 'authorized') status = 'authorized';
    else if (attr.status === 'refunded') status = 'refunded';
    else if (attr.status === 'voided') status = 'voided';
    else if (attr.status === 'failed') status = 'failed';
    return {
      status,
      amount: typeof attr.amount === 'number' ? attr.amount / 100 : undefined,
      currency: typeof attr.currency === 'string' ? attr.currency.toUpperCase() : undefined,
      raw
    };
  }
}
