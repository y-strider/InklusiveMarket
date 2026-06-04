import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";

type Role = "buyer" | "seller" | "admin";

type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

type PaymentView = {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  buyerName: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
};

type PagedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

function useQueryParam(name: string, fallback: string) {
  const router = useRouter();
  const value = useMemo(() => {
    if (!router.isReady) return fallback;
    const v = router.query[name];
    if (!v) return fallback;
    if (Array.isArray(v)) return v[0] ?? fallback;
    return v;
  }, [router.isReady, router.query, name, fallback]);
  const setValue = (v: string) => {
    const q = { ...router.query, [name]: v };
    if (!v) delete q[name];
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  };
  return [value, setValue] as const;
}

function useNumberQueryParam(name: string, fallback: number) {
  const [value, setValue] = useQueryParam(name, String(fallback));
  const n = useMemo(() => {
    const parsed = parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return fallback;
  }, [value, fallback]);
  const setNumber = (v: number) => setValue(String(v));
  return [n, setNumber] as const;
}

function srOnly(text: string) {
  return <span className="sr-only">{text}</span>;
}

export default function PaymentsPage() {
  const [role] = useQueryParam("role", "buyer");
  const [status, setStatus] = useQueryParam("status", "");
  const [search, setSearch] = useQueryParam("q", "");
  const [page, setPage] = useNumberQueryParam("page", 1);
  const [pageSize, setPageSize] = useNumberQueryParam("pageSize", 20);
  const [sort, setSort] = useQueryParam("sort", "createdAt:desc");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PagedResult<PaymentView>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 20
  });
  const tableRef = useRef<HTMLTableElement>(null);
  const [focusedRow, setFocusedRow] = useState<number>(-1);

  const canSeeBuyer = role === "buyer" || role === "admin";
  const canSeeSeller = role === "seller" || role === "admin";
  const isAdmin = role === "admin";

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("sort", sort);
      if (status) params.set("status", status);
      if (search) params.set("q", search);
      const r = await fetch(`/api/payments?${params.toString()}`, {
        headers: {
          "x-user-role": role
        }
      });
      if (!r.ok) {
        throw new Error("Failed");
      }
      const data = (await r.json()) as PagedResult<PaymentView>;
      setResult(data);
    } catch (e) {
      setResult({
        data: [],
        total: 0,
        page,
        pageSize
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, status, search, sort, role]);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  const onKeyDownTable = (e: React.KeyboardEvent<HTMLTableElement>) => {
    if (result.data.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedRow((r) => Math.min(result.data.length - 1, r + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedRow((r) => Math.max(0, r - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusedRow(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusedRow(result.data.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = result.data[focusedRow];
      if (row) {
        window.location.href = `/payments/${row.id}`;
      }
    }
  };

  useEffect(() => {
    if (focusedRow >= 0) {
      const rowEl = document.querySelector(`[data-row-index="${focusedRow}"]`) as HTMLElement | null;
      rowEl?.focus();
    }
  }, [focusedRow]);

  const updateSort = (key: string) => {
    const [k, d] = sort.split(":");
    if (k === key) {
      setSort(`${key}:${d === "asc" ? "desc" : "asc"}`);
    } else {
      setSort(`${key}:asc`);
    }
  };

  return (
    <>
      <Head>
        <title>Payments</title>
      </Head>
      <main role="main" aria-labelledby="payments-heading" className="container mx-auto px-4 py-6">
        <h1 id="payments-heading" className="text-2xl font-semibold mb-4">Payments</h1>

        <section aria-labelledby="filters-heading" className="mb-4">
          <h2 id="filters-heading" className="text-lg font-medium mb-2">Filters</h2>
          <form
            role="search"
            aria-label="Search payments"
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchData();
            }}
          >
            <div className="flex flex-col">
              <label htmlFor="q" className="mb-1">Search</label>
              <input
                id="q"
                name="q"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference, buyer, seller"
                className="border rounded px-3 py-2"
                aria-describedby="q-desc"
              />
              <span id="q-desc" className="text-sm text-gray-600">Type and press Enter to search.</span>
            </div>
            <div className="flex flex-col">
              <label htmlFor="status" className="mb-1">Status</label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="border rounded px-3 py-2"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="pageSize" className="mb-1">Page size</label>
              <select
                id="pageSize"
                name="pageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="border rounded px-3 py-2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
                aria-label="Apply filters"
              >
                Apply
              </button>
            </div>
          </form>
        </section>

        <section aria-labelledby="payments-table-heading">
          <h2 id="payments-table-heading" className="sr-only">Payments table</h2>
          <div role="status" aria-live="polite" className="mb-2">
            {loading ? "Loading payments..." : `Showing ${result.data.length} of ${result.total}`}
          </div>
          <div className="overflow-auto border rounded" tabIndex={0} aria-label="Payments results container">
            <table
              ref={tableRef}
              role="table"
              aria-label="Payments"
              className="min-w-full divide-y"
              onKeyDown={onKeyDownTable}
            >
              <thead role="rowgroup" className="bg-gray-50">
                <tr role="row">
                  <th role="columnheader" scope="col" className="px-4 py-2 text-left">
                    <button
                      type="button"
                      onClick={() => updateSort("createdAt")}
                      aria-sort={sort.startsWith("createdAt") ? (sort.endsWith("asc") ? "ascending" : "descending") : "none"}
                    >
                      Created
                    </button>
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-2 text-left">
                    <button
                      type="button"
                      onClick={() => updateSort("reference")}
                      aria-sort={sort.startsWith("reference") ? (sort.endsWith("asc") ? "ascending" : "descending") : "none"}
                    >
                      Reference
                    </button>
                  </th>
                  {canSeeBuyer && (
                    <th role="columnheader" scope="col" className="px-4 py-2 text-left">
                      <button
                        type="button"
                        onClick={() => updateSort("buyerName")}
                        aria-sort={sort.startsWith("buyerName") ? (sort.endsWith("asc") ? "ascending" : "descending") : "none"}
                      >
                        Buyer
                      </button>
                    </th>
                  )}
                  {canSeeSeller && (
                    <th role="columnheader" scope="col" className="px-4 py-2 text-left">
                      <button
                        type="button"
                        onClick={() => updateSort("sellerName")}
                        aria-sort={sort.startsWith("sellerName") ? (sort.endsWith("asc") ? "ascending" : "descending") : "none"}
                      >
                        Seller
                      </button>
                    </th>
                  )}
                  <th role="columnheader" scope="col" className="px-4 py-2 text-left">
                    <button
                      type="button"
                      onClick={() => updateSort("amount")}
                      aria-sort={sort.startsWith("amount") ? (sort.endsWith("asc") ? "ascending" : "descending") : "none"}
                    >
                      Amount
                    </button>
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-2 text-left">
                    <button
                      type="button"
                      onClick={() => updateSort("status")}
                      aria-sort={sort.startsWith("status") ? (sort.endsWith("asc") ? "ascending" : "descending") : "none"}
                    >
                      Status
                    </button>
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody role="rowgroup" className="divide-y">
                {result.data.map((p, idx) => (
                  <tr
                    key={p.id}
                    role="row"
                    tabIndex={focusedRow === idx ? 0 : -1}
                    data-row-index={idx}
                    aria-selected={focusedRow === idx}
                    className={focusedRow === idx ? "bg-blue-50 outline-none ring-2 ring-blue-300" : ""}
                    onFocus={() => setFocusedRow(idx)}
                  >
                    <td role="cell" className="px-4 py-2 whitespace-nowrap">
                      <time dateTime={p.createdAt}>{new Date(p.createdAt).toLocaleString()}</time>
                    </td>
                    <td role="cell" className="px-4 py-2">{p.reference}</td>
                    {canSeeBuyer && <td role="cell" className="px-4 py-2">{p.buyerName}</td>}
                    {canSeeSeller && <td role="cell" className="px-4 py-2">{p.sellerName}</td>}
                    <td role="cell" className="px-4 py-2">{p.currency} {(p.amount / 100).toFixed(2)}</td>
                    <td role="cell" className="px-4 py-2">
                      <span
                        aria-label={`Status ${p.status}`}
                        className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                          p.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : p.status === "failed" || p.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : p.status === "refunded"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td role="cell" className="px-4 py-2">
                      <div className="flex gap-2">
                        <Link
                          href={`/payments/${p.id}`}
                          className="px-3 py-1 border rounded hover:bg-gray-50 focus:ring-2 focus:ring-blue-400"
                          aria-label={`View payment ${p.reference}`}
                        >
                          View
                        </Link>
                        {isAdmin && (
                          <Link
                            href={`/admin/payments/${p.id}`}
                            className="px-3 py-1 border rounded hover:bg-gray-50 focus:ring-2 focus:ring-blue-400"
                            aria-label={`Admin view payment ${p.reference}`}
                          >
                            Admin
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && result.data.length === 0 && (
                  <tr role="row">
                    <td role="cell" className="px-4 py-6 text-center text-gray-600" colSpan={canSeeBuyer && canSeeSeller ? 7 : 6}>
                      No payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <nav
            role="navigation"
            aria-label="Pagination"
            className="flex items-center justify-between mt-4"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                aria-disabled={page <= 1}
              >
                First
              </button>
              <button
                type="button"
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                aria-disabled={page <= 1}
              >
                Previous
              </button>
              <span aria-live="polite" aria-atomic="true" className="px-2">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                aria-disabled={page >= totalPages}
              >
                Next
              </button>
              <button
                type="button"
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                aria-disabled={page >= totalPages}
              >
                Last
              </button>
            </div>
            <div className="flex items-center gap-2" aria-live="polite">
              Showing {(result.page - 1) * result.pageSize + Math.min(result.data.length, result.data.length)} to {(result.page - 1) * result.pageSize + result.data.length} of {result.total}
            </div>
          </nav>
        </section>
      </main>
      <style jsx>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </>
  );
}
/* New-Item -ItemType File -Force -Path apps/web/src/pages/payments/index.tsx add payments dashboard with accessibility, tables, filters, pagination, keyboard nav, screen reader support, buyer/seller/admin visibility */
