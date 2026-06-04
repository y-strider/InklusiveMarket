export type PaymentProvider = "paymongo";

export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "canceled";

export interface PaymentCreateInput {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  buyerId: string;
  metadata?: Record<string, string | number | boolean>;
  methods: string[];
  returnUrl?: string;
}

export interface PaymentRecord {
  id: string;
  provider: PaymentProvider;
  providerIntentId: string;
  status: PaymentStatus;
  orderId: string;
  buyerId: string;
  amount: number;
  currency: string;
  clientKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRepository {
  create(data: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">): Promise<PaymentRecord>;
  update(id: string, patch: Partial<Omit<PaymentRecord, "id">>): Promise<PaymentRecord>;
  findById(id: string): Promise<PaymentRecord | null>;
  findByProviderIntent(provider: PaymentProvider, providerIntentId: string): Promise<PaymentRecord | null>;
  listByOrder(orderId: string): Promise<PaymentRecord[]>;
}

export interface PaymentService {
  createPayment(input: PaymentCreateInput): Promise<PaymentRecord>;
  syncPaymentByIntent(provider: PaymentProvider, providerIntentId: string): Promise<PaymentRecord | null>;
  getBuyerView(buyerId: string, paymentId: string): Promise<PaymentRecord | null>;
  getSellerView(sellerId: string, orderId: string): Promise<PaymentRecord[]>;
  getAdminView(params: { status?: PaymentStatus; from?: Date; to?: Date; search?: string; skip?: number; take?: number }): Promise<{ items: PaymentRecord[]; total: number }>;
}
