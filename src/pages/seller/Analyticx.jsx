import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import SellerShell from "@/components/layout/SellerShell";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Eye, ShoppingCart, Star } from "lucide-react";

export default function SellerAnalytics() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [prods, allOrders] = await Promise.all([
        base44.entities.Product.filter({ seller_id: user.id }, "-created_date"),
        base44.entities.Order.list("-placed_at", 200),
      ]);
      setProducts(prods);
      setOrders(allOrders.filter(o => (o.items || []).some(i => i.seller_id === user.id)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const totalRevenue = orders
    .filter(o => o.payment_status === "paid")
    .reduce((s, o) => s + (o.items || []).filter(i => i.seller_id === user.id).reduce((si, i) => si + i.subtotal, 0), 0);

  const totalViews = products.reduce((s, p) => s + (p.views_count || 0), 0);
  const totalOrders = products.reduce((s, p) => s + (p.orders_count || 0), 0);
  const avgRating = products.filter(p => p.reviews_count > 0).reduce((s, p) => s + p.average_rating, 0) / (products.filter(p => p.reviews_count > 0).length || 1);

  const topProducts = [...products]
    .sort((a, b) => (b.orders_count || 0) - (a.orders_count || 0))
    .slice(0, 8)
    .map(p => ({ name: p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name, orders: p.orders_count || 0, views: p.views_count || 0 }));

  const kpis = [
    { label: "Total Revenue", value: `₱${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Product Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-600 bg-blue-50" },
    { label: "Units Sold", value: totalOrders.toLocaleString(), icon: ShoppingCart, color: "text-purple-600 bg-purple-50" },
    { label: "Avg Rating", value: avgRating ? avgRating.toFixed(1) + " ★" : "No reviews", icon: Star, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <SellerShell>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        {topProducts.length > 0 && (
          <section aria-labelledby="top-products-chart" className="bg-white border border-border rounded-xl p-5">
            <h2 id="top-products-chart" className="font-semibold mb-4">Top Products by Orders</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical" aria-label="Bar chart of top products by order count">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        <section aria-labelledby="product-perf-heading" className="bg-white border border-border rounded-xl overflow-hidden">
          <h2 id="product-perf-heading" className="px-5 py-4 font-semibold border-b border-border">Product Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-busy={loading}>
              <caption className="sr-only">Product performance table with views, orders, and ratings</caption>
              <thead className="bg-muted/30">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Product</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Views</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Orders</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Rating</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-3"><div className="h-4 bg-muted rounded animate-pulse w-16" /></td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No products yet.</td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-medium max-w-[200px]">
                        <p className="line-clamp-1">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category_name}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{p.views_count || 0}</td>
                      <td className="px-5 py-3 font-medium">{p.orders_count || 0}</td>
                      <td className="px-5 py-3">
                        {p.reviews_count > 0 ? `${p.average_rating?.toFixed(1)} ★ (${p.reviews_count})` : "—"}
                      </td>
                      <td className={`px-5 py-3 font-medium ${p.stock_quantity <= (p.low_stock_threshold || 5) ? "text-amber-600" : ""}`}>
                        {p.stock_quantity}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SellerShell>
  );
}