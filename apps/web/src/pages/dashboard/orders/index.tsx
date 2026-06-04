import { useEffect, useMemo, useRef, useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { useSession } from "next-auth/react"

type OrderStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled" | "shipped" | "delivered"
type PaymentStatus = "unpaid" | "processing" | "paid" | "failed" | "refunded"
type Role = "buyer" | "seller" | "admin"

type Order = {
  id: string
  number: string
  buyerId: string
  buyerName: string
  sellerId: string
  sellerName: string
  total: number
  currency: string
  createdAt: string
  status: OrderStatus
  paymentStatus: PaymentStatus
}

type Paged<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

function srOnly(text: string) {
  return <span className="sr-only">{text}</span>
}

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return v
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`
  }
}

export default function OrdersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const role: Role = useMemo(() => {
    const r = (session?.user as any)?.role
    if (r === "admin" || r === "seller" || r === "buyer") return r
    return "buyer"
  }, [session])
  const [data, setData] = useState<Paged<Order>>({ items: [], total: 0, page: 1, pageSize: 20 })
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState<string>((router.query.q as string) || "")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">(((router.query.status as string) as any) || "all")
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">(((router.query.paymentStatus as string) as any) || "all")
  const [mineOnly, setMineOnly] = useState<boolean>((router.query.mine as string) === "1")
  const [page, setPage] = useState<number>(parseInt((router.query.page as string) || "1", 10))
  const [pageSize, setPageSize] = useState<number>(parseInt((router.query.pageSize as string) || "20", 10))
  const debouncedQ = useDebounced(q, 400)
  const tableRef = useRef<HTMLTableElement>(null)

  const query = useMemo(() => {
    const o: Record<string, string> = {}
    if (debouncedQ) o.q = debouncedQ
    if (statusFilter !== "all") o.status = statusFilter
    if (paymentFilter !== "all") o.paymentStatus = paymentFilter
    if (mineOnly) o.mine = "1"
    o.page = String(page)
    o.pageSize = String(pageSize)
    return o
  }, [debouncedQ, statusFilter, paymentFilter, mineOnly, page, pageSize])

  useEffect(() => {
    if (status !== "authenticated") return
    const url = {
      pathname: "/dashboard/orders",
      query
    }
    router.replace(url, undefined, { shallow: true })
  }, [query, status])

  useEffect(() => {
    if (status !== "authenticated") return
    let ignore = false
    setLoading(true)
    const params = new URLSearchParams(query as any).toString()
    fetch(`/api/orders?${params}`, { headers: { accept: "application/json" } })
      .then(async r => {
        if (!r.ok) throw new Error("Failed to load")
        return r.json()
      })
      .then((j: Paged<Order>) => {
        if (ignore) return
        setData(j)
        setTimeout(() => {
          const el = tableRef.current
          if (el) el.focus()
        }, 0)
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [router.query.page, router.query.pageSize, router.query.q, router.query.status, router.query.paymentStatus, router.query.mine, status])

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  function onPageChange(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages))
  }

  function keyNav(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      if (canPrev) onPageChange(page - 1)
    }
    if (e.key === "ArrowRight") {
      if (canNext) onPageChange(page + 1)
    }
  }

  const title = role === "admin" ? "All Orders" : role === "seller" ? "Store Orders" : "My Orders"

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <section aria-labelledby="orders-heading" className="max-w-7xl mx-auto p-4">
        <h1 id="orders-heading" className="text-2xl font-semibold mb-4">{title}</h1>
        <form
          aria-label="Orders filters"
          className="grid gap-3 md:grid-cols-6 items-end mb-4"
          onSubmit={e => e.preventDefault()}
        >
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium">Search</label>
            <input
              id="search"
              name="search"
              type="search"
              value={q}
              onChange={e => {
                setQ(e.target.value)
                setPage(1)
              }}
              aria-label="Search orders"
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="Order number, buyer, seller"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium">Order status</label>
            <select
              id="status"
              name="status"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as any)
                setPage(1)
              }}
              className="mt-1 w-full border rounded px-3 py-2"
              aria-label="Filter by order status"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div>
            <label htmlFor="paymentStatus" className="block text-sm font-medium">Payment status</label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              value={paymentFilter}
              onChange={e => {
                setPaymentFilter(e.target.value as any)
                setPage(1)
              }}
              className="mt-1 w-full border rounded px-3 py-2"
              aria-label="Filter by payment status"
            >
              <option value="all">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="mineOnly"
              name="mineOnly"
              type="checkbox"
              checked={mineOnly}
              onChange={e => {
                setMineOnly(e.target.checked)
                setPage(1)
              }}
              aria-checked={mineOnly}
              aria-label={role === "seller" ? "Show only my store orders" : "Show only my orders"}
            />
            <label htmlFor="mineOnly" className="text-sm">{role === "seller" ? "Only my store" : "Only mine"}</label>
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="pageSize" className="block text-sm font-medium">Per page</label>
              <select
                id="pageSize"
                name="pageSize"
                value={pageSize}
                onChange={e => {
                  setPageSize(parseInt(e.target.value, 10))
                  setPage(1)
                }}
                className="mt-1 w-full border rounded px-3 py-2"
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <Link href="/dashboard/orders/report" className="inline-flex items-center justify-center h-10 px-4 border rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" aria-label="Open orders report page">
              Open report
            </Link>
          </div>
        </form>

        <div role="status" aria-live="polite" className="mb-2 text-sm">
          {loading ? "Loading orders..." : `${data.total} orders • Page ${data.page} of ${totalPages}`}
        </div>

        <div className="overflow-auto rounded border" onKeyDown={keyNav}>
          <table
            ref={tableRef}
            tabIndex={0}
            aria-label="Orders table"
            className="min-w-full text-sm"
            role="table"
          >
            <thead role="rowgroup" className="bg-gray-50">
              <tr role="row">
                <th role="columnheader" scope="col" className="px-3 py-2 text-left">Order</th>
                <th role="columnheader" scope="col" className="px-3 py-2 text-left">Buyer</th>
                <th role="columnheader" scope="col" className="px-3 py-2 text-left">Seller</th>
                <th role="columnheader" scope="col" className="px-3 py-2 text-left">Created</th>
                <th role="columnheader" scope="col" className="px-3 py-2 text-left">Order status</th>
                <th role="columnheader" scope="col" className="px-3 py-2 text-left">Payment</th>
                <th role="columnheader" scope="col" className="px-3 py-2 text-right">Total</th>
                <th role="columnheader" scope="col" className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {data.items.map(o => (
                <tr key={o.id} role="row" className="border-t focus-within:bg-blue-50">
                  <td role="cell" className="px-3 py-2">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      aria-label={`Open order ${o.number}`}
                    >
                      {o.number}
                    </Link>
                  </td>
                  <td role="cell" className="px-3 py-2">
                    <span aria-label={`Buyer ${o.buyerName}`}>{o.buyerName}</span>
                  </td>
                  <td role="cell" className="px-3 py-2">
                    <span aria-label={`Seller ${o.sellerName}`}>{o.sellerName}</span>
                  </td>
                  <td role="cell" className="px-3 py-2">
                    <time dateTime={o.createdAt}>{new Date(o.createdAt).toLocaleString()}</time>
                  </td>
                  <td role="cell" className="px-3 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100" aria-label={`Order status ${o.status}`}>{o.status}</span>
                  </td>
                  <td role="cell" className="px-3 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100" aria-label={`Payment status ${o.paymentStatus}`}>{o.paymentStatus}</span>
                  </td>
                  <td role="cell" className="px-3 py-2 text-right">
                    <span aria-label={`Total ${formatMoney(o.total, o.currency)}`}>{formatMoney(o.total, o.currency)}</span>
                  </td>
                  <td role="cell" className="px-3 py-2 text-right">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="inline-flex items-center h-9 px-3 border rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    >
                      {srOnly(`Open order ${o.number}`)}
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && !loading && (
                <tr role="row">
                  <td role="cell" colSpan={8} className="px-3 py-8 text-center">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <nav
          className="mt-4 flex items-center justify-between gap-2"
          role="navigation"
          aria-label="Pagination"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={!canPrev}
              className="h-10 px-3 border rounded disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-label="First page"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={!canPrev}
              className="h-10 px-3 border rounded disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-label="Previous page"
            >
              ‹
            </button>
          </div>
          <div aria-live="polite" aria-atomic="true">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={!canNext}
              className="h-10 px-3 border rounded disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-label="Next page"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={!canNext}
              className="h-10 px-3 border rounded disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-label="Last page"
            >
              »
            </button>
          </div>
        </nav>
      </section>
    </>
  )
}
