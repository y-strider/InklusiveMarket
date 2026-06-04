import React, { useEffect, useState } from "react";

type Summary = {
  total: { count: number; amount: number };
  byStatus: Record<string, { count: number; amount: number }>;
};

type Recent = {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: "PHP";
  status: string;
  createdAt: string;
}[];

export default function PaymentsDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Recent>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const s = await fetch("/api/admin/payments/summary").then(r => r.json());
      const r = await fetch("/api/admin/payments/recent").then(r => r.json());
      setSummary(s);
      setRecent(r);
      setLoading(false);
    };
    run();
  }, []);

  return (
    <section aria-labelledby="payments-dashboard-title">
      <h1 id="payments-dashboard-title">Payments Dashboard</h1>
      <div role="region" aria-live="polite" aria-busy={loading ? "true" : "false"}>
        <div aria-label="KPI cards" role="group">
          <div>
            <h2>Total Payments</h2>
            <p aria-live="polite">{summary ? summary.total.count : 0}</p>
          </div>
          <div>
            <h2>Total Volume</h2>
            <p aria-live="polite">₱ {(summary ? summary.total.amount : 0) / 100}</p>
          </div>
        </div>
        <div>
          <h2>Status Breakdown</h2>
          <ul>
            {summary &&
              Object.entries(summary.byStatus).map(([k, v]) => (
                <li key={k}>
                  <span>{k}</span>: <span aria-live="polite">{v.count}</span> (₱ {v.amount / 100})
                </li>
              ))}
          </ul>
        </div>
        <div>
          <h2>Recent Payments</h2>
          <table aria-label="Recent payments table">
            <thead>
              <tr>
                <th scope="col">Payment</th>
                <th scope="col">Order</th>
                <th scope="col">User</th>
                <th scope="col">Amount</th>
                <th scope="col">Currency</th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id}>
                  <th scope="row">{r.id}</th>
                  <td>{r.orderId}</td>
                  <td>{r.userId}</td>
                  <td>{(r.amount / 100).toFixed(2)}</td>
                  <td>{r.currency}</td>
                  <td>{r.status}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
