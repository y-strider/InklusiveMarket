import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminShell from "@/components/layout/AdminShell";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, ShoppingBag, Package, Users } from "lucide-react";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Order.list("-placed_at", 500),
      base44.entities.Product.filter({ approval_status: "approved" }, "-created_date", 200),
    ]).then(([o, p]) => { setOrders(o); setProducts(p); }).finally(() => setLoading(false));
  }, []);

  const revenue = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + (o.grand_total || 0), 0);

  // Monthly order counts
  const monthly = {};
  orders.forEach(o => {
    if (!o.placed_at) return;
    const key = new Date(o.placed_at).toLocaleDateString("en-PH", { year: "numeric", month: "short" });
    monthly[key] = (monthly[key] || 0) + 1;
  });
  const monthlyData = Object.entries(monthly).slice(-6).map(([month, count]) => ({ month, count }));

  // Category breakdown
  const catMap = {};
  products.forEach(p => {
    const cat = p.category_name || "Uncategorized";
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Reports</h1>

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: `₱${revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
            { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
            { label: "Approved Products", value: products.length, icon: Package, color: "text-purple-600 bg-purple-50" },
            { label: "Paid Orders", value: orders.filter(o => o.payment_status === "paid").length, icon: Users, color: "text-amber-600 bg-amber-50" },
          ].map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white border border-border rounded-xl p-5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${k.color}`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <dt className="text-xs text-muted-foreground">{k.label}</dt>
                <dd className={`font-bold text-xl mt-1 ${loading ? "animate-pulse bg-muted rounded h-7 w-16" : ""}`}>
                  {loading ? "" : k.value}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section aria-labelledby="monthly-chart" className="bg-white border border-border rounded-xl p-5">
            <h2 id="monthly-chart" className="font-semibold mb-4">Orders per Month</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section aria-labelledby="cat-chart" className="bg-white border border-border rounded-xl p-5">
            <h2 id="cat-chart" className="font-semibold mb-4">Products by Category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}