export type PaymentProvider = "none" | "paymongo";

export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "refunded" | "voided" | "expired" | "canceled";

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerSessionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  buyerId: string;
  sellerId: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  currency: string;
  buyerId: string;
  sellerId: string;
  description: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  billing: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, string>;
}

export interface PaymentVisibility {
  canView: boolean;
  canPay: boolean;
  canRefund: boolean;
  canVoid: boolean;
}

export interface PaymentFilters {
  q?: string;
  status?: PaymentStatus[];
  provider?: PaymentProvider[];
  buyerId?: string;
  sellerId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}
