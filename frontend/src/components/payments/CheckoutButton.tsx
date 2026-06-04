import React, { useState } from "react";

type Props = {
  paymentId: string;
  methods?: ("gcash" | "grab_pay" | "paymaya" | "card")[];
  returnUrl: string;
  disabled?: boolean;
};

export function CheckoutButton({ paymentId, methods = ["gcash"], returnUrl, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const onClick = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/payments/checkout/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, methods, returnUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to begin checkout");
      const clientKey = data.clientKey as string | undefined;
      if (!clientKey) {
        throw new Error("PayMongo payment processing is temporarily unavailable because payment credentials have not been configured by the system administrator.");
      }
      const paymongoUrl = `[pay.try.paymongo.com](https://pay.try.paymongo.com/clients/${encodeURIComponent(clientKey)})`;
      window.location.assign(paymongoUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        aria-busy={loading ? "true" : "false"}
        aria-disabled={disabled || loading ? "true" : "false"}
        className="ikm-btn ikm-btn-primary"
      >
        {loading ? "Processing..." : "Pay now"}
      </button>
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="ikm-alert ikm-alert-error"
          tabIndex={-1}
        >
          {error}
        </div>
      )}
    </div>
  );
}
