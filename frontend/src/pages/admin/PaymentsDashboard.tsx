import React, { useEffect, useMemo, useState } from "react";
import { Payment, PaymentStatus, adminListPayments } from "../../lib/api/payments";

const statuses: PaymentStatus[] = ["pending", "processing", "paid", "failed", "canceled"];

export default function PaymentsDashboard() {
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(0);
  const take = 20;
  const [items, setItems] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pages = useMemo(() => Math.ceil(total / take), [total]);

  useEffect(() => {
    let canceled = false;
    async function load() {
      setLoading(true);
      try {
        const out = await adminListPayments({ status: status || undefined, from: from || undefined, to: to || undefined, search: search || undefined, skip: page * take, take });
        if (!canceled) {
          setItems(out.items);
          setTotal(out.total);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      canceled = true;
    };
  }, [status, from, to, search, page]);

  return (
    <section aria-labelledby="admin-payments-heading" className="space-y-4">
      <h1 id="admin-payments-heading" className="text-xl font-semibold">
        Payments
      </h1>
      <form role="search" aria-label="Payments filters" className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <label className="flex flex-col">
          <span className="text-sm">Status</span>
          <select
            value={status}
            onChange={e => {
              setPage(0);
              setStatus(e.target.value as any);
            }}
            className="rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filter by status"
          >
            <option value="">All</option>
            {statuses.map(s => (
              <option value={s} key={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-sm">From</span>
          <input
            type="date"
            value={from}
            onChange={e => {
              setPage(0);
              setFrom(e.target.value);
            }}
            className="rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="From date"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm">To</span>
          <input
            type="date"
            value={to}
            onChange={e => {
              setPage(0);
              setTo(e.target.value);
            }}
            className="rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="To date"
          />
        </label>
        <label className="md:col-span-2 flex flex-col">
          <span className="text-sm">Search</span>
          <input
            type="search"
            value={search}
            onChange={e => {
              setPage(0);
              setSearch(e.target.value);
            }}
            placeholder="Order ID, Buyer ID, Intent ID"
            className="rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Search payments"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setStatus("");
              setFrom("");
              setTo("");
              setSearch("");
              setPage(0);
            }}
            className="rounded bg-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Reset
          </button>
        </div>
      </form>
      <div role="region" aria-live="polite" aria-busy={loading ? "true" : "false"} className="overflow-x-auto">
        <table className="min-w-full border" role="table" aria-label="Admin payments table">
          <thead className="bg-gray-50" role="rowgroup">
            <tr role="row">
              <th role="columnheader" scope="col" className="px-3 py-2 text-left">
                Created
              </th>
              <th role="columnheader" scope="col" className="px-3 py-2 text-left">
                Status
              </th>
              <th role="columnheader" scope="col" className="px-3 py-2 text-left">
                Order
              </th>
              <th role="columnheader" scope="col" className="px-3 py-2 text-left">
                Buyer
              </th>
              <th role="columnheader" scope="col" className="px-3 py-2 text-left">
                Intent
              </th>
              <th role="columnheader" scope="col" className="px-3 py-2 text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {items.map(i => (
              <tr key={i.id} role="row" tabIndex={0} className="focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <td role="cell" className="px-3 py-2">
                  {new Date(i.createdAt).toLocaleString()}
                </td>
                <td role="cell" className="px-3 py-2 capitalize">
                  {i.status}
                </td>
                <td role="cell" className="px-3 py-2">{i.orderId}</td>
                <td role="cell" className="px-3 py-2">{i.buyerId}</td>
                <td role="cell" className="px-3 py-2 font-mono text-sm">{i.providerIntentId}</td>
                <td role="cell" className="px-3 py-2 text-right">
                  {(i.amount / 100).toFixed(2)} {i.currency}
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr role="row">
                <td role="cell" colSpan={6} className="px-3 py-4 text-center text-gray-500">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="mt-3 flex items-center justify-between" role="navigation" aria-label="Pagination">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded px-3 py-1 bg-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Previous
          </button>
          <div aria-live="polite" className="text-sm">
            Page {page + 1} of {Math.max(1, pages)}
          </div>
          <button
            type="button"
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) >= pages}
            className="rounded px-3 py-1 bg-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
