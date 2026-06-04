import React, { useEffect, useMemo, useState } from 'react';
import { AccessibleTable } from '../../components/AccessibleTable';

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  contactFullName: string;
  createdAt: string;
};

export default function OrdersList() {
  const [data, setData] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    fetch('/api/orders?' + params.toString(), { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((res) => {
        setData(res.data ?? []);
        setTotal(res.total ?? 0);
      });
  }, [page, pageSize, q, status]);

  const cols = useMemo(
    () => [
      { key: 'id', header: 'Order ID' },
      { key: 'status', header: 'Status' },
      { key: 'paymentStatus', header: 'Payment' },
      { key: 'totalAmount', header: 'Total', render: (r: Order) => `${r.currency} ${r.totalAmount.toFixed(2)}` },
      { key: 'contactFullName', header: 'Buyer' },
      { key: 'createdAt', header: 'Created', render: (r: Order) => new Date(r.createdAt).toLocaleString() }
    ],
    []
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section aria-labelledby="orders-heading">
      <h1 id="orders-heading" tabIndex={-1}>Orders</h1>
      <form
        aria-label="Filters"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
        }}
      >
        <label htmlFor="orders-q">Search</label>
        <input
          id="orders-q"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search orders"
        />
        <label htmlFor="orders-status">Status</label>
        <select
          id="orders-status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All</option>
          <option value="placed">Placed</option>
          <option value="paid">Paid</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="submit">Apply</button>
      </form>

      <AccessibleTable<Order> id="orders-table" caption="Orders list" columns={cols as any} data={data} />

      <nav role="navigation" aria-label="Pagination">
        <ul role="list">
          <li>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-disabled={page <= 1}
              aria-label="Previous page"
            >
              Previous
            </button>
          </li>
          <li aria-current="page">Page {page} of {totalPages}</li>
          <li>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              aria-disabled={page >= totalPages}
              aria-label="Next page"
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    </section>
  );
}
