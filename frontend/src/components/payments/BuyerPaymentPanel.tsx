import React, { useEffect, useState } from "react";
import { Payment, PaymentStatus, createPayment, getBuyerPayment } from "../../lib/api/payments";
import { CheckoutNotice } from "./CheckoutNotice";

type Method = "gcash" | "paymaya" | "card";

export function BuyerPaymentPanel({
  orderId,
  buyerId,
  amount,
  currency,
  description
}: {
  orderId: string;
  buyerId: string;
  amount: number;
  currency: string;
  description: string;
}) {
  const [methods, setMethods] = useState<Method[]>(["gcash", "card"]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [availability, setAvailability] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!payment) return;
    const id = setInterval(async () => {
      try {
        const p = await getBuyerPayment(payment.id, buyerId);
        setPayment(p);
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, [payment, buyerId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const out = await createPayment({
        orderId,
        amount,
        currency,
        description,
        buyerId,
        methods,
        returnUrl: window.location.href
      });
      setPayment(out.payment);
      setAvailability(out.availability);
    } catch (err: any) {
      setError(err.message || "Failed to start payment");
    } finally {
      setBusy(false);
    }
  }

  function toggle(m: Method) {
    setMethods(prev => (prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]));
  }

  return (
    <section aria-labelledby="buyer-payment-heading" className="space-y-4">
      <h2 id="buyer-payment-heading" className="text-lg font-semibold">
        Complete your payment
      </h2>
      <CheckoutNotice availability={availability} />
      <form onSubmit={onSubmit} aria-describedby="payment-desc" className="space-y-4" role="form">
        <p id="payment-desc" className="sr-only">
          Choose your preferred payment methods and start checkout.
        </p>
        <fieldset aria-label="Payment methods" className="space-y-2">
          <legend className="font-medium">Payment methods</legend>
          <div role="group" aria-label="Methods" className="grid grid-cols-2 gap-2">
            {["gcash", "paymaya", "card"].map(m => (
              <label key={m} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="methods"
                  value={m}
                  checked={methods.includes(m as Method)}
                  onChange={() => toggle(m as Method)}
                  aria-checked={methods.includes(m as Method)}
                />
                <span className="capitalize">{m}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-indigo-600 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            aria-busy={busy ? "true" : "false"}
          >
            {busy ? "Processing..." : "Start payment"}
          </button>
          <div aria-live="polite" className="text-sm text-gray-600">
            Amount: {currency} {(amount / 100).toFixed(2)}
          </div>
        </div>
        {error && (
          <div role="alert" aria-live="assertive" className="text-red-700">
            {error}
          </div>
        )}
      </form>
      {payment && (
        <div className="rounded border p-3" role="region" aria-labelledby="payment-status-heading" tabIndex={0}>
          <h3 id="payment-status-heading" className="font-medium">
            Payment status
          </h3>
          <dl className="grid grid-cols-2 gap-2">
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd className="font-semibold capitalize" aria-live="polite">
                {payment.status}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Reference</dt>
              <dd className="font-mono text-sm">{payment.providerIntentId}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Created</dt>
              <dd className="text-sm">{new Date(payment.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
