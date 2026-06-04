import React from "react";

type Props = {
  orderId: string;
  amount: number;
  currency: string;
  buyerId: string;
  sellerId: string;
  description: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  billing?: { name?: string; email?: string; phone?: string };
};

export default function CheckoutButton(props: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    const r = await fetch("/api/payments/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        orderId: props.orderId,
        amount: props.amount,
        currency: props.currency,
        buyerId: props.buyerId,
        sellerId: props.sellerId,
        description: props.description,
        customerEmail: props.customerEmail,
        successUrl: props.successUrl,
        cancelUrl: props.cancelUrl,
        billing: props.billing || {}
      })
    });
    const json = await r.json();
    setLoading(false);
    if (!r.ok) {
      setError(json.error || "Unable to start checkout");
      return;
    }
    if (json.checkoutUrl) {
      window.location.assign(json.checkoutUrl);
      return;
    }
    if (json.message) {
      setError(json.message);
      return;
    }
    setError("Checkout is not available.");
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
        aria-busy={loading}
        aria-live="polite"
      >
        {loading ? "Processing..." : "Pay now"}
      </button>
      {error && (
        <div role="alert" className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
