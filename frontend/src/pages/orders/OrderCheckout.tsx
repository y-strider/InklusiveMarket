import React, { useEffect, useRef, useState } from 'react';

type CheckoutResponse = {
  payment: { id: string; status: string };
  checkoutUrl: string | null;
  message?: string;
};

export default function OrderCheckout({ orderId, returnUrl, cancelUrl }: { orderId: string; returnUrl: string; cancelUrl: string }) {
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const srRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && srRef.current) {
      srRef.current.focus();
    }
  }, [message]);

  return (
    <section aria-labelledby="checkout-heading">
      <h2 id="checkout-heading" tabIndex={-1}>Checkout</h2>
      <div role="status" aria-live="polite" aria-atomic="true" tabIndex={-1} ref={srRef}>
        {loading ? 'Creating checkout…' : message}
      </div>
      {!checkoutUrl && (
        <button
          onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ orderId, returnUrl, cancelUrl })
              });
              const data: CheckoutResponse = await res.json();
              setCheckoutUrl(data.checkoutUrl);
              setMessage(data.message ?? null);
              if (data.checkoutUrl) {
                window.location.assign(data.checkoutUrl);
              }
            } finally {
              setLoading(false);
            }
          }}
          aria-busy={loading}
          disabled={loading}
        >
          Proceed to Pay
        </button>
      )}
      {checkoutUrl && (
        <p>
          Redirecting to payment. If you are not redirected, <a href={checkoutUrl}>click here</a>.
        </p>
      )}
    </section>
  );
}
