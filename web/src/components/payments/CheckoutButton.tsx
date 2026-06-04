import React from 'react'

type Props = {
  orderId: string
  amount: number
  currency: 'PHP'
  description: string
  referenceId: string
  customerEmail?: string
  onCreated?: (data: { checkoutUrl?: string }) => void
}

export default function CheckoutButton(props: Props) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': window.localStorage.getItem('userId') || ''
        },
        body: JSON.stringify({
          orderId: props.orderId,
          amount: props.amount,
          currency: props.currency,
          description: props.description,
          referenceId: props.referenceId,
          customerEmail: props.customerEmail,
          successUrl: window.location.origin + '/payments/success',
          cancelUrl: window.location.origin + '/payments/cancel'
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create checkout session')
      if (props.onCreated) props.onCreated({ checkoutUrl: json.checkoutUrl })
      if (json.checkoutUrl) window.location.assign(json.checkoutUrl)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div role="group" aria-label="Payment checkout" className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="px-4 py-2 rounded bg-indigo-600 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-50"
        aria-label="Proceed to secure checkout"
        aria-busy={loading ? 'true' : 'false'}
        aria-disabled={loading ? 'true' : 'false'}
        disabled={loading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {loading ? 'Processing…' : 'Pay Now'}
      </button>
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="text-sm text-red-600"
          tabIndex={-1}
        >
          {error}
        </div>
      )}
    </div>
  )
}
