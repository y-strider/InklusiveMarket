export type PaymentStatus =
  | "pending"
  | "awaiting_payment_method"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

export type PaymentRecord = {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: "PHP";
  intentId?: string | null;
  provider: "paymongo";
  status: PaymentStatus;
  description?: string | null;
  errorMessage?: string | null;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentRecordInput = {
  orderId: string;
  userId: string;
  amount: number;
  currency: "PHP";
  description?: string | null;
  metadata?: Record<string, string>;
};

export type UpdatePaymentRecordInput = Partial<
  Omit<PaymentRecord, "id" | "createdAt" | "orderId" | "userId">
> & {
  id: string;
};
