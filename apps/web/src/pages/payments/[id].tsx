/* New-Item -ItemType File -Force -Path apps/web/src/pages/payments/[id].tsx add payment detail page with accessible layout and visibility */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

type Payment = {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  buyerName: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
};

export default function PaymentDetail() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [data, setData] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [role] = useState<"buyer" | "seller" | "admin">("buyer");

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/payments/${id}`, { headers: { "x-user-role": role } });
        if (r.ok) {
          const j = await r.json();
          setData(j as Payment);
        } else {
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, role]);

  return (
    <>
      <Head>
        <title>Payment {data?.reference || ""}</title>
      </Head>
      <main role="main" aria-labelledby="payment-heading" className="container mx-auto px-4 py-6">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center gap-2 text-sm">
            <li><Link href="/payments" className="text-blue-700 underline">Payments</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{data?.reference || "..."}</li>
          </ol>
        </nav>

        <h1 id="payment-heading" className="text-2xl font-semibold mb-4">Payment Details</h1>

        <section aria-live="polite" className="mb-4">
          {loading && <p>Loading payment...</p>}
        </section>

        {data && (
          <section aria-labelledby="summary-heading" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4" aria-describedby="summary-desc">
              <h2 id="summary-heading" className="text-lg font-medium mb-2">Summary</h2>
              <p id="summary-desc" className="sr-only">Overview of the payment</p>
              <dl>
                <div className="grid grid-cols-3 py-2">
                  <dt className="font-medium">Reference</dt>
                  <dd className="col-span-2">{data.reference}</dd>
                </div>
                <div className="grid grid-cols-3 py-2">
                  <dt className="font-medium">Status</dt>
                  <dd className="col-span-2">{data.status}</dd>
                </div>
                <div className="grid grid-cols-3 py-2">
                  <dt className="font-medium">Amount</dt>
                  <dd className="col-span-2">{data.currency} {(data.amount / 100).toFixed(2)}</dd>
                </div>
                <div className="grid grid-cols-3 py-2">
                  <dt className="font-medium">Buyer</dt>
                  <dd className="col-span-2">{data.buyerName}</dd>
                </div>
                <div className="grid grid-cols-3 py-2">
                  <dt className="font-medium">Seller</dt>
                  <dd className="col-span-2">{data.sellerName}</dd>
                </div>
                <div className="grid grid-cols-3 py-2">
                  <dt className="font-medium">Created</dt>
                  <dd className="col-span-2"><time dateTime={data.createdAt}>{new Date(data.createdAt).toLocaleString()}</time></dd>
                </div>
                <div className="grid grid-cols-3 py-2">
                  <dt className="font-medium">Updated</dt>
                  <dd className="col-span-2"><time dateTime={data.updatedAt}>{new Date(data.updatedAt).toLocaleString()}</time></dd>
                </div>
              </dl>
            </div>
            <div className="border rounded p-4">
              <h2 className="text-lg font-medium mb-2">Actions</h2>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/payments/receipt/${data.id}`}
                  className="px-4 py-2 border rounded hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  aria-label="Download receipt"
                >
                  Download receipt
                </a>
                {data.status === "pending" && (
                  <a
                    href={`/api/payments/retry/${data.id}`}
                    className="px-4 py-2 border rounded hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    aria-label="Retry payment"
                  >
                    Retry payment
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {!loading && !data && (
          <p role="alert">Payment not found or you do not have permission to view it.</p>
        )}
      </main>
      <style jsx>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </>
  );
}
