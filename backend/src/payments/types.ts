export type PaymentStatus = "requires_payment_method" | "processing" | "succeeded" | "failed" | "canceled";

export type PaymentIntentRecord = {
  id: string;
  provider: "paymongo";
  providerIntentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  latest_provider_payload?: unknown;
};

export type PaymentIntent = PaymentIntentRecord;

export type PaymentMethod = {
  id: string;
  type: "card" | "gcash" | "grab_pay" | "paymaya";
  returnUrl: string;
};

export type PaymentVisibility = {
  canViewAmounts: boolean;
  canViewPii: boolean;
  canRefund: boolean;
};

export type PaymentSyncResult = {
  checked: number;
  updated: number;
};

export interface PaymentProvider {
  isEnabled(): boolean;
  createIntent(amount: number, currency: string, metadata: Record<string, string>): Promise<PaymentIntent>;
  attachPaymentMethod(intentId: string, paymentMethod: PaymentMethod): Promise<PaymentIntent>;
  retrieveIntent(intentId: string): Promise<PaymentIntent>;
  syncStatuses(limit?: number): Promise<PaymentSyncResult>;
  visibilityFor(role: "buyer" | "seller" | "admin"): PaymentVisibility;
}
