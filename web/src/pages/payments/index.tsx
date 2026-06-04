import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PaymentBadge from "../../components/payments/PaymentBadge";

type Payment = {
  id: string;
  orderId: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
};

type ListResponse = {
  data: Payment[];
  total: number;
};

export default function PaymentsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<ListResponse>({ data: [], total: 0 });
  const tableRef = useRef<HTMLTableElement>(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status.length) p.set("status", status.join(","));
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    return p.toString();
  }, [q, status, page, pageSize]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/payments?${params}`, { headers: { Accept: "application/json" } })
      .then(r => r.json())
      .then((json: ListResponse) => {
        if (!active) return;
        setList(json);
        setLoading(false);
        const el = tableRef.current;
        if (el) {
          el.setAttribute("tabindex", "-1");
          el.focus();
        }
      })
      .catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [params]);

  const totalPages = Math.max(1, Math.ceil(list.total / pageSize));

  function toggleStatus(s: string) {
    setPage(1);
    setStatus(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setPage(1);
    }
  }

  return (
    <main role="main" aria-labelledby="payments-heading" className="p-4 max-w-6xl mx-auto">
      <h1 id="payments-heading" className="text-2xl font-semibold mb-4">Payments</h1>

      <form aria-label="Payments filters" className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4" onSubmit={e => e.preventDefault()}>
        <div>
          <label htmlFor="search" className="block text-sm font-medium">Search</label>
          <input
            id="search"
            name="search"
            type="search"
            aria-label="Search payments"
            className="mt-1 w-full border rounded px-3 py-2"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onSearchKey}
          />
        </div>
        <fieldset aria-label="Status filter" className="md:col-span-2">
          <legend className="block text-sm font-medium">Status</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {["pending","processing","paid","failed","refunded","voided","expired","canceled"].map(s => (
              <button
                key={s}
                type="button"
                role="checkbox"
                aria-checked={status.includes(s)}
                onClick={() => toggleStatus(s)}
                className={`px-3 py-1 rounded border text-sm ${status.includes(s) ? "bg-gray-900 text-white" : "bg-white"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => { setQ(""); setStatus([]); setPage(1); }}
            className="px-3 py-2 border rounded"
          >
            Reset
          </button>
        </div>
      </form>

      <div role="region" aria-labelledby="payments-table-caption" className="overflow-x-auto">
        <table ref={tableRef} className="min-w-full border rounded" aria-describedby="payments-table-desc">
          <caption id="payments-table-caption" className="sr-only">Payments table</caption>
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">ID</th>
              <th scope="col" className="px-3 py-2 text-left">Order</th>
              <th scope="col" className="px-3 py-2 text-left">Provider</th>
              <th scope="col" className="px-3 py-2 text-left">Amount</th>
              <th scope="col" className="px-3 py-2 text-left">Status</th>
              <th scope="col" className="px-3 py-2 text-left">Created</th>
              <th scope="col" className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {list.data.map(p => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">
                  <Link href={`/payments/${p.id}`} className="text-blue-600 underline">{p.id.slice(0,8)}</Link>
                </td>
                <td className="px-3 py-2">{p.orderId}</td>
                <td className="px-3 py-2">{p.provider}</td>
                <td className="px-3 py-2">{(p.amount/100).toFixed(2)} {p.currency}</td>
                <td className="px-3 py-2"><PaymentBadge status={p.status as any} /></td>
                <td className="px-3 py-2">{new Date(p.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <Link href={`/payments/${p.id}`} className="px-3 py-1 text-sm border rounded">View</Link>
                </td>
              </tr>
            ))}
            {!list.data.length && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center">No payments found</td>
              </tr>
            )}
          </tbody>
        </table>
        <p id="payments-table-desc" className="sr-only">Use arrow keys to navigate the table. Use tab to move to pagination.</p>
      </div>

      <nav aria-label="Pagination" className="mt-4 flex items-center gap-2">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span aria-live="polite" aria-atomic="true">Page {page} of {totalPages}</span>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
        <label className="ml-auto text-sm">
          <span className="mr-2">Rows</span>
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={e => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
            className="border rounded px-2 py-1"
          >
            {[10,20,50,100].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </nav>
    </main>
  );
}
