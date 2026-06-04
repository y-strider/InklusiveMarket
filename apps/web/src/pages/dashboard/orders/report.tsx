import { useEffect, useMemo, useState } from "react"
import Head from "next/head"
import { useRouter } from "next/router"

type KPI = {
  totalOrders: number
  totalGross: number
  currency: string
  paidOrders: number
  unpaidOrders: number
  refundedOrders: number
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`
  }
}

export default function OrdersReportPage() {
  const router = useRouter()
  const [from, setFrom] = useState<string>((router.query.from as string) || "")
  const [to, setTo] = useState<string>((router.query.to as string) || "")
  const [sellerId, setSellerId] = useState<string>((router.query.sellerId as string) || "")
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [loading, setLoading] = useState(false)

  const query = useMemo(() => {
    const o: Record<string, string> = {}
    if (from) o.from = from
    if (to) o.to = to
    if (sellerId) o.sellerId = sellerId
    return o
  }, [from, to, sellerId])

  useEffect(() => {
    const url = { pathname: "/dashboard/orders/report", query }
    router.replace(url, undefined, { shallow: true })
  }, [query])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    const params = new URLSearchParams(query as any).toString()
    fetch(`/api/orders/report?${params}`, { headers: { accept: "application/json" } })
      .then(async r => {
        if (!r.ok) throw new Error("Failed")
        return r.json()
      })
      .then((j: KPI) => {
        if (ignore) return
        setKpi(j)
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [router.query.from, router.query.to, router.query.sellerId])

  function exportCsv() {
    const params = new URLSearchParams(query as any).toString()
    window.location.href = `/api/orders/report.csv?${params}`
  }

  return (
    <>
      <Head>
        <title>Orders report</title>
      </Head>
      <section aria-labelledby="report-heading" className="max-w-5xl mx-auto p-4">
        <h1 id="report-heading" className="text-2xl font-semibold mb-4">Orders report</h1>
        <form className="grid md:grid-cols-4 gap-3 items-end mb-4" aria-label="Report filters" onSubmit={e => e.preventDefault()}>
          <div>
            <label htmlFor="from" className="block text-sm font-medium">From</label>
            <input id="from" name="from" type="date" value={from} onChange={e => setFrom(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label htmlFor="to" className="block text-sm font-medium">To</label>
            <input id="to" name="to" type="date" value={to} onChange={e => setTo(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label htmlFor="sellerId" className="block text-sm font-medium">Seller ID</label>
            <input id="sellerId" name="sellerId" type="text" value={sellerId} onChange={e => setSellerId(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="Optional" />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={exportCsv} className="h-10 px-4 border rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" aria-label="Export CSV">
              Export CSV
            </button>
          </div>
        </form>
        <div role="status" aria-live="polite" className="mb-2 text-sm">
          {loading ? "Loading KPIs..." : ""}
        </div>
        {kpi && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border rounded p-4" role="group" aria-labelledby="kpi1">
              <div id="kpi1" className="text-sm text-gray-600">Total orders</div>
              <div className="text-2xl font-semibold">{kpi.totalOrders}</div>
            </div>
            <div className="border rounded p-4" role="group" aria-labelledby="kpi2">
              <div id="kpi2" className="text-sm text-gray-600">Gross</div>
              <div className="text-2xl font-semibold">{formatMoney(kpi.totalGross, kpi.currency)}</div>
            </div>
            <div className="border rounded p-4" role="group" aria-labelledby="kpi3">
              <div id="kpi3" className="text-sm text-gray-600">Paid</div>
              <div className="text-2xl font-semibold">{kpi.paidOrders}</div>
            </div>
            <div className="border rounded p-4" role="group" aria-labelledby="kpi4">
              <div id="kpi4" className="text-sm text-gray-600">Unpaid</div>
              <div className="text-2xl font-semibold">{kpi.unpaidOrders}</div>
            </div>
            <div className="border rounded p-4" role="group" aria-labelledby="kpi5">
              <div id="kpi5" className="text-sm text-gray-600">Refunded</div>
              <div className="text-2xl font-semibold">{kpi.refundedOrders}</div>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
