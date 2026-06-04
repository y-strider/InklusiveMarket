import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AdminShell from "@/components/layout/AdminShell";
import StatusBadge from "@/components/ui/StatusBadge";
import { Package, Users, ShoppingBag, CreditCard, Clock } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0, revenue: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list("-created_date", 500),
      base44.entities.Order.list("-placed_at", 500),
      base44.entities.User.list(),
    ]).then(([products, orders, users]) => {
      const revenue = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + (o.grand_total || 0), 0);
      const pending = products.filter(p => p.approval_status === "pending").length;
      setStats({ products: products.length, users: users.length, orders: orders.length, revenue, pending });
      setRecentOrders(orders.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Total Products", value: stats.products, icon: Package, color: "text-blue-600 bg-blue-50", link: "/admin/products" },
    { label: "Total Users", value: stats.users, icon: Users, color: "text-purple-600 bg-purple-50", link: "/admin/users" },
    { label: "Total Orders", value: stats.orders, icon: ShoppingBag, color: "text-amber-600 bg-amber-50", link: "/admin/orders" },
    { label: "Paid Revenue", value: `₱${stats.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, icon: CreditCard, color: "text-green-600 bg-green-50", link: "/admin/transactions" },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>

        {stats.pending > 0 && (
          <Link to="/admin/products" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-amber-800 font-medium">{stats.pending} product{stats.pending !== 1 ? "s" : ""} pending approval</p>
          </Link>
        )}

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <Link key={kpi.label} to={kpi.link} className="bg-white border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <dt className="text-xs text-muted-foreground">{kpi.label}</dt>
                <dd className={`font-bold text-xl mt-1 ${loading ? "animate-pulse bg-muted rounded h-7 w-16" : ""}`}>
                  {loading ? "" : kpi.value}
                </dd>
              </Link>
            );
          })}
        </dl>

        <section aria-labelledby="recent-orders-heading" className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 id="recent-orders-heading" className="font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-busy={loading}>
              <caption className="sr-only">Recent orders table</caption>
              <thead className="bg-muted/30">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Order ID</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Buyer</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Total</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} aria-hidden="true">
                    {[1,2,3,4].map(j => <td key={j} className="px-5 py-3"><div className="h-4 bg-muted rounded animate-pulse w-20" /></td>)}
                  </tr>
                )) : recentOrders.map(o => (
                  <tr key={o.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-mono text-xs font-medium">#{o.id.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-3">{o.buyer_name}</td>
                    <td className="px-5 py-3 font-bold text-primary">₱{o.grand_total?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}