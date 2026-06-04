import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import SellerShell from "@/components/layout/SellerShell";
import { Package, ShoppingBag, TrendingUp, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      Promise.all([
        base44.entities.Product.filter({ seller_id: user.id }, "-created_date", 50),
        base44.entities.Order.list("-placed_at", 200),
      ]).then(([prods, allOrders]) => {
        setProducts(prods);
        setOrders(allOrders.filter(o => (o.items || []).some(i => i.seller_id === user.id)));
      }).finally(() => setLoading(false));
    }
  }, [user]);

  const totalRevenue = orders
    .filter(o => o.payment_status === "paid")
    .reduce((s, o) => s + (o.items || []).filter(i => i.seller_id === user?.id).reduce((si, i) => si + i.subtotal, 0), 0);

  const pending = products.filter(p => p.approval_status === "pending").length;
  const lowStock = products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 5) && p.stock_quantity > 0).length;

  const kpis = [
    { label: "Total Products", value: products.length, icon: Package, color: "text-blue-600 bg-blue-50" },
    { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-purple-600 bg-purple-50" },
    { label: "Revenue (Paid)", value: `₱${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
  ];

  return (
    <SellerShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
          <Link to="/seller/products">
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
          </Link>
        </div>

        {(pending > 0 || lowStock > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-amber-800 space-y-0.5">
              {pending > 0 && <p>{pending} product{pending !== 1 ? "s" : ""} awaiting admin approval.</p>}
              {lowStock > 0 && <p>{lowStock} product{lowStock !== 1 ? "s" : ""} running low on stock.</p>}
            </div>
          </div>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-white border border-border rounded-xl p-5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <dt className="text-xs text-muted-foreground">{kpi.label}</dt>
                <dd className={`font-bold text-xl mt-1 ${loading ? "animate-pulse bg-muted rounded h-7 w-20" : ""}`}>
                  {loading ? "" : kpi.value}
                </dd>
              </div>
            );
          })}
        </dl>

        <section aria-labelledby="recent-products-heading" className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 id="recent-products-heading" className="font-semibold">Recent Products</h2>
            <Link to="/seller/products" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : products.length === 0 ? (
            <p className="px-5 py-8 text-center text-muted-foreground text-sm">No products yet. <Link to="/seller/products" className="text-primary hover:underline">Add your first product.</Link></p>
          ) : (
            <ul className="divide-y divide-border">
              {products.slice(0, 5).map(p => (
                <li key={p.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {p.primary_image_url && <img src={p.primary_image_url} alt="" className="w-full h-full object-cover" aria-hidden="true" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                    <p className="text-xs text-muted-foreground">₱{p.price?.toLocaleString("en-PH")} · Stock: {p.stock_quantity}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.approval_status === "approved" ? "bg-green-100 text-green-700" :
                    p.approval_status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{p.approval_status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </SellerShell>
  );
}