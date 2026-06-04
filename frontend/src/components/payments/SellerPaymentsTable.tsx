import React from "react";
import { Payment } from "../../lib/api/payments";

export function SellerPaymentsTable({ payments }: { payments: Payment[] }) {
  return (
    <div role="region" aria-labelledby="seller-payments-heading" className="overflow-x-auto">
      <h2 id="seller-payments-heading" className="text-lg font-semibold mb-2">
        Order payments
      </h2>
      <table className="min-w-full border" role="table" aria-label="Payments table">
        <thead className="bg-gray-50" role="rowgroup">
          <tr role="row">
            <th role="columnheader" scope="col" className="px-3 py-2 text-left">
              Created
            </th>
            <th role="columnheader" scope="col" className="px-3 py-2 text-left">
              Status
            </th>
            <th role="columnheader" scope="col" className="px-3 py-2 text-left">
              Provider Ref
            </th>
            <th role="columnheader" scope="col" className="px-3 py-2 text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {payments.map(p => (
            <tr key={p.id} role="row" tabIndex={0} className="focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <td role="cell" className="px-3 py-2">
                {new Date(p.createdAt).toLocaleString()}
              </td>
              <td role="cell" className="px-3 py-2 capitalize">
                {p.status}
              </td>
              <td role="cell" className="px-3 py-2 font-mono text-sm">{p.providerIntentId}</td>
              <td role="cell" className="px-3 py-2 text-right">
                {(p.amount / 100).toFixed(2)} {p.currency}
              </td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr role="row">
              <td role="cell" colSpan={4} className="px-3 py-4 text-center text-gray-500">
                No payments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <nav aria-label="Pagination" className="sr-only" />
    </div>
  );
}
