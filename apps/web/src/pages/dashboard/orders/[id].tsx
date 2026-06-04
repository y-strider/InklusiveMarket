import { useEffect, useMemo, useRef, useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useSession } from "next-auth/react"

type OrderStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled" | "shipped" | "delivered"
type PaymentStatus = "unpaid" | "processing" | "paid" | "failed" | "refunded"
type Role = "buyer" | "seller" | "admin"

type LineItem = {
  id: string
  productId: string
  name: string
  quantity: number
  unitPrice: number
  currency: string
  total: number
}

type Payment = {
  id: string
  provider: "paymongo"
  status: PaymentStatus
  amount: number
  currency: string
  checkoutUrl?: string
  externalRef?: string
  createdAt: string
  updatedAt: string
}

type Order = {
  id: string
  number: string
  buyerId: string
  buyerName: string
  buyerEmail: string
  sellerId: string
  sellerName: string
  total: number
  currency: string
  createdAt: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  items: LineItem[]
  payment?: Payment
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`
  }
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const role: Role = useMemo(() => {
    const r = (session?.user as any)?.role
    if (r === "admin" || r === "seller" || r === "buyer") return r
    return "buyer"
  }, [session])
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const h1Ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (status !== "authenticated") return
    const id = router.query.id as string
    if (!id) return
    let ignore = false
    setLoading(true)
    fetch(`/api/orders/${id}`, { headers: { accept: "application/json" } })
      .then(async r => {
        if (!r.ok) throw new Error("Failed to load")
        return r.json()
      })
      .then((j: Order) => {
        if (ignore) return
        setOrder(j)
        setTimeout(() => h1Ref.current?.focus(), 0)
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [router.query.id, status])

  const canPay = role === "buyer" && order?.paymentStatus === "unpaid" && order?.payment?.checkoutUrl

  return (
    <>
      <Head>
        <title>{order ? `Order ${order.number}` : "Order"}</title>
      </Head>
      <section aria-labelledby="order-heading" className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1
            id="order-heading"
            tabIndex={-1}
            ref={h1Ref}
            className="text-2xl font-semibold"
          >
            {order ? `Order ${order.number}` : "Order"}
          </h1>
          <Link href="/dashboard/orders" className="underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" aria-label="Back to orders">
            Back to orders
          </Link>
        </div>

        <div role="status" aria-live="polite" className="mb-2 text-sm">
          {loading ? "Loading order..." : ""}
        </div>

        {order && (
          <div className="grid gap-4">
            <section aria-labelledby="summary-heading" className="border rounded p-4">
              <h2 id="summary-heading" className="text-xl font-medium mb-2">Summary</h2>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <dt className="text-sm text-gray-600">Status</dt>
                  <dd className="text-sm"><span className="inline-flex px-2 py-0.5 rounded bg-gray-100" aria-label={`Order status ${order.status}`}>{order.status}</span></dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Payment</dt>
                  <dd className="text-sm"><span className="inline-flex px-2 py-0.5 rounded bg-gray-100" aria-label={`Payment status ${order.paymentStatus}`}>{order.paymentStatus}</span></dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Created</dt>
                  <dd className="text-sm"><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString()}</time></dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Total</dt>
                  <dd className="text-sm">{formatMoney(order.total, order.currency)}</dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby="parties-heading" className="border rounded p-4">
              <h2 id="parties-heading" className="text-xl font-medium mb-2">Parties</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div role="group" aria-labelledby="buyer-label" className="border rounded p-3">
                  <div id="buyer-label" className="text-sm font-medium mb-1">Buyer</div>
                  <div className="text-sm">{order.buyerName}</div>
                  <div className="text-sm">{order.buyerEmail}</div>
                </div>
                <div role="group" aria-labelledby="seller-label" className="border rounded p-3">
                  <div id="seller-label" className="text-sm font-medium mb-1">Seller</div>
                  <div className="text-sm">{order.sellerName}</div>
                </div>
              </div>
            </section>

            <section aria-labelledby="items-heading" className="border rounded p-4">
              <h2 id="items-heading" className="text-xl font-medium mb-2">Items</h2>
              <div className="overflow-auto rounded border">
                <table className="min-w-full text-sm" aria-label="Order line items" role="table">
                  <thead role="rowgroup" className="bg-gray-50">
                    <tr role="row">
                      <th role="columnheader" scope="col" className="px-3 py-2 text-left">Product</th>
                      <th role="columnheader" scope="col" className="px-3 py-2 text-right">Qty</th>
                      <th role="columnheader" scope="col" className="px-3 py-2 text-right">Unit price</th>
                      <th role="columnheader" scope="col" className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {order.items.map(it => (
                      <tr key={it.id} role="row" className="border-t">
                        <td role="cell" className="px-3 py-2">{it.name}</td>
                        <td role="cell" className="px-3 py-2 text-right">{it.quantity}</td>
                        <td role="cell" className="px-3 py-2 text-right">{formatMoney(it.unitPrice, it.currency)}</td>
                        <td role="cell" className="px-3 py-2 text-right">{formatMoney(it.total, it.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot role="rowgroup">
                    <tr role="row" className="border-t">
                      <th role="cell" colSpan={3} className="px-3 py-2 text-right">Total</th>
                      <td role="cell" className="px-3 py-2 text-right">{formatMoney(order.total, order.currency)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section aria-labelledby="payment-heading" className="border rounded p-4">
              <h2 id="payment-heading" className="text-xl font-medium mb-2">Payment</h2>
              {order.payment ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded p-3" role="group" aria-labelledby="buyer-payment-label">
                    <div id="buyer-payment-label" className="text-sm font-medium mb-2">Buyer view</div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-gray-600">Status</dt>
                        <dd><span className="inline-flex px-2 py-0.5 rounded bg-gray-100">{order.payment.status}</span></dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Amount</dt>
                        <dd>{formatMoney(order.payment.amount, order.payment.currency)}</dd>
                      </div>
                      <div className="col-span-2">
                        {canPay ? (
                          <a
                            href={order.payment.checkoutUrl as string}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center h-10 px-4 border rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            aria-label="Pay now"
                          >
                            Pay now
                          </a>
                        ) : (
                          <div className="text-gray-600">No payment action available</div>
                        )}
                      </div>
                    </dl>
                  </div>
                  <div className="border rounded p-3" role="group" aria-labelledby="merchant-payment-label">
                    <div id="merchant-payment-label" className="text-sm font-medium mb-2">Seller/Admin view</div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-gray-600">Provider</dt>
                        <dd>{order.payment.provider}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">External ref</dt>
                        <dd>{order.payment.externalRef || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Created</dt>
                        <dd><time dateTime={order.payment.createdAt}>{new Date(order.payment.createdAt).toLocaleString()}</time></dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Updated</dt>
                        <dd><time dateTime={order.payment.updatedAt}>{new Date(order.payment.updatedAt).toLocaleString()}</time></dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">No payment record</div>
              )}
            </section>
          </div>
        )}
      </section>
    </>
  )
}
