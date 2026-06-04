export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "canceled";

export interface Payment {
  id: string;
  provider: "paymongo";
  providerIntentId: string;
  status: PaymentStatus;
  orderId: string;
  buyerId: string;
  amount: number;
  currency: string;
  clientKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createPayment(input: {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  buyerId: string;
  methods: string[];
  returnUrl?: string;
  metadata?: Record<string, any>;
}): Promise<{ payment: Payment; availability: string | null }> {
  const res = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error("Failed to create payment");
  return res.json();
}

export async function getBuyerPayment(paymentId: string, buyerId: string): Promise<Payment> {
  const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}?buyerId=${encodeURIComponent(buyerId)}`);
  if (!res.ok) throw new Error("Payment not found");
  const data = await res.json();
  return data.payment;
}

export async function listOrderPayments(orderId: string, sellerId: string): Promise<Payment[]> {
  const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/payments?sellerId=${encodeURIComponent(sellerId)}`);
  if (!res.ok) throw new Error("Failed to load payments");
  const data = await res.json();
  return data.payments;
}

export async function adminListPayments(q: { status?: PaymentStatus; from?: string; to?: string; search?: string; skip?: number; take?: number }) {
  const p = new URLSearchParams();
  if (q.status) p.set("status", q.status);
  if (q.from) p.set("from", q.from);
  if (q.to) p.set("to", q.to);
  if (q.search) p.set("search", q.search);
  if (typeof q.skip === "number") p.set("skip", String(q.skip));
  if (typeof q.take === "number") p.set("take", String(q.take));
  const res = await fetch(`/api/admin/payments?${p.toString()}`);
  if (!res.ok) throw new Error("Failed to load admin payments");
  return res.json() as Promise<{ items: Payment[]; total: number }>;
}
