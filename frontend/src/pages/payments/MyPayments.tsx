import React, { useEffect, useMemo, useRef, useState } from "react";

type Payment = {
  id: string;
  orderId: string;
  amount: number;
  currency: "PHP";
  status: string;
  description?: string | null;
  createdAt: string;
};

type Paged<T> = { data: T[]; total: number };

export default function MyPaymentsPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const offset = useMemo(() => page * limit, [page, limit]);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/payments?${params.toString()}`);
    const data: Paged<Payment> = await res.json();
    setItems(data.data);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [q, page, limit]);

  useEffect(() => {
    if (!loading && tableRef.current) {
      tableRef.current.focus();
    }
  }, [loading]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <section aria-labelledby="mypayments-title">
      <h1 id="mypayments-title">My Payments</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          load();
        }}
        aria-label="Search payments"
      >
        <label htmlFor="search" className="sr-only">
          Search payments
        </label>
        <input
          id="search"
          name="search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by ID, order or status"
          aria-describedby="search-help"
        />
        <span id="search-help">Type a keyword and press Enter to search.</span>
        <label htmlFor="limit" className="sr-only">
          Rows per page
        </label>
        <select
          id="limit"
          value={limit}
          onChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(0);
          }}
          aria-label="Rows per page"
        >
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
        </select>
        <button type="submit">Search</button>
      </form>

      <div role="region" aria-live="polite" aria-busy={loading ? "true" : "false"} aria-labelledby="table-title">
        <h2 id="table-title" className="sr-only">Payments table</h2>
        <table ref={tableRef} tabIndex={0} aria-describedby="table-caption">
          <caption id="table-caption">List of recent payments with status and amounts.</caption>
          <thead>
            <tr>
              <th scope="col">Payment ID</th>
              <th scope="col">Order</th>
              <th scope="col">Amount</th>
              <th scope="col">Currency</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={6}>No payments found.</td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id}>
                <th scope="row">{p.id}</th>
                <td>{p.orderId}</td>
                <td>{(p.amount / 100).toFixed(2)}</td>
                <td>{p.currency}</td>
                <td>
                  <span aria-live="polite">{p.status}</span>
                </td>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav role="navigation" aria-label="Pagination">
        <ul className="pagination">
          <li>
            <button
              type="button"
              onClick={() => setPage(0)}
              disabled={page === 0}
              aria-label="First page"
            >
              «
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              aria-label="Previous page"
            >
              ‹
            </button>
          </li>
          <li aria-current="page">
            <span>Page {page + 1} of {totalPages}</span>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
            >
              ›
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              aria-label="Last page"
            >
              »
            </button>
          </li>
        </ul>
      </nav>
    </section>
  );
}
