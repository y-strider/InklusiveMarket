import React, { useEffect, useRef, useState } from "react";
import PaymentBadge from "../../components/payments/PaymentBadge";

type Payment = {
  id: string;
  orderId: string;
  provider: string;
  providerSessionId?: string;
  amount: number;
  currency: string;
  status: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
};

export default function PaymentDetail() {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const id = window.location.pathname.split("/").pop() || "";
    setLoading(true);
    fetch(`/api/payments/${id}`, { headers: { Accept: "application/json" } })
      .then(r => r.json())
      .then(json => {
        setPayment(json);
        setLoading(false);
        setTimeout(() => headingRef.current?.focus(), 0);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main role="main" aria-labelledby="payment-heading" className="p-4 max-w-3xl mx-auto">
      <h1 id="payment-heading" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold mb-4">Payment</h1>
      {loading && <p role="status" aria-live="polite">Loading...</p>}
      {notice && <div role="alert" className="mb-4 border rounded px-3 py-2 bg-yellow-50">{notice}</div>}
      {payment && (
        <section aria-labelledby="summary-heading" className="space-y-2">
          <h2 id="summary-heading" className="text-xl font-medium">Summary</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <dt className="text-sm text-gray-500">Payment ID</dt>
              <dd className="font-mono">{payment.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Order</dt>
              <dd>{payment.orderId}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Provider</dt>
              <dd>{payment.provider}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd><PaymentBadge status={payment.status as any} /></dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Amount</dt>
              <dd>{(payment.amount/100).toFixed(2)} {payment.currency}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Updated</dt>
              <dd>{new Date(payment.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <a
              href={`/api/payments/${payment.id}`}
              className="sr-only"
              aria-label="Refresh payment details"
            >
              Refresh
            </a>
            <button
              className="px-3 py-2 border rounded"
              onClick={() => {
                setLoading(true);
                fetch(`/api/payments/${payment.id}`, { headers: { Accept: "application/json" } })
                  .then(r => r.json())
                  .then(json => { setPayment(json); setLoading(false); setNotice("Payment refreshed."); setTimeout(() => setNotice(null), 2000); })
                  .catch(() => setLoading(false));
              }}
            >
              Refresh
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
