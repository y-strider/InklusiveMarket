export type UUID = string;

export type OrderStatus = 'draft' | 'placed' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';
export type PaymentStatus = 'unpaid' | 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'voided';

export interface OrderItem {
  id: UUID;
  orderId: UUID;
  productId: UUID;
  productName: string;
  productSku?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: UUID;
  buyerId: UUID;
  sellerId: UUID;
  status: OrderStatus;
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  shippingAddressLine1: string;
  shippingAddressLine2?: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  contactFullName: string;
  contactEmail: string;
  contactPhone?: string | null;
  placedAt?: string | null;
  paidAt?: string | null;
  fulfilledAt?: string | null;
  cancelledAt?: string | null;
  metadata: Record<string, unknown>;
  createdBy?: UUID | null;
  updatedBy?: UUID | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface Payment {
  id: UUID;
  orderId: UUID;
  provider: string;
  providerPaymentId?: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  checkoutUrl?: string | null;
  receiptUrl?: string | null;
  raw: Record<string, unknown>;
  authorizedAt?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
  createdBy?: UUID | null;
  updatedBy?: UUID | null;
  createdAt: string;
  updatedAt: string;
}
