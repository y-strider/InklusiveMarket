import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/ui/StatusBadge";
import { Package, ChevronRight } from "lucide-react";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      base44.entities.Order.filter({ buyer_id: user.id }, "-placed_at", 100)
        .then(setOrders)
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" aria-hidden="true" /> My Orders
        </h1>

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading orders">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" aria-hidden="true" />
            <p className="font-medium text-lg mb-2">No orders yet</p>
            <Link to="/catalog" className="text-primary hover:underline text-sm">Browse products to get started</Link>
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Order list">
            {orders.map(order => (
              <li key={order.id}>
                <Link
                  to={`/buyer/orders/${order.id}`}
                  className="flex items-center gap-4 bg-white border border-border rounded-xl p-4 hover:shadow-md transition-shadow group"
                  aria-label={`Order ${order.id.slice(-8).toUpperCase()}, status: ${order.status}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold">#{order.id.slice(-8).toUpperCase()}</span>
                      <StatusBadge status={order.status} />
                      <StatusBadge status={order.payment_status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.placed_at ? new Date(order.placed_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                      {" · "}
                      {(order.items || []).length} item{(order.items || []).length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">₱{order.grand_total?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}