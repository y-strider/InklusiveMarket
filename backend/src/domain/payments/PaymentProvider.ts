export type PaymentCreateCheckoutInput = {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  buyerEmail: string;
};

export type PaymentCheckout = {
  provider: string;
  providerPaymentId: string | null;
  checkoutUrl: string | null;
  status: 'pending' | 'failed';
  raw: Record<string, unknown>;
};

export interface PaymentProvider {
  name(): string;
  createCheckout(input: PaymentCreateCheckoutInput): Promise<PaymentCheckout>;
  parseWebhook(headers: Record<string, string | string[] | undefined>, body: unknown): Promise<{
    event: string;
    providerPaymentId: string | null;
    orderReference?: string | null;
    status: 'authorized' | 'paid' | 'failed' | 'refunded' | 'voided';
    amount?: number;
    currency?: string;
    raw: Record<string, unknown>;
  }>;
  fetchStatus(providerPaymentId: string): Promise<{
    status: 'authorized' | 'paid' | 'failed' | 'refunded' | 'voided' | 'pending';
    amount?: number;
    currency?: string;
    raw: Record<string, unknown>;
  }>;
}
