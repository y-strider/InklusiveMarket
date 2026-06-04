import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Package, ChevronLeft, MapPin, CreditCard } from "lucide-react";

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Order.filter({ id })
      .then(res => setOrder(res[0] || null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse" aria-busy="true" aria-label="Loading order details">
        <div className="h-8 bg-muted rounded w-48 mb-6" />
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}</div>
      </div>
    </AppShell>
  );

  if (!order) return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" aria-hidden="true" />
        <h1 className="font-heading text-xl font-bold mb-2">Order not found</h1>
        <Link to="/buyer/orders"><Button variant="outline">Back to Orders</Button></Link>
      </div>
    </AppShell>
  );

  const items = order.items || [];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/buyer/orders" className="hover:text-primary flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> My Orders
          </Link>
          <span>/ Order #{order.id.slice(-8).toUpperCase()}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Order #{order.id.slice(-8).toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Placed {order.placed_at ? new Date(order.placed_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.payment_status} />
          </div>
        </div>

        <div className="space-y-5">
          {/* Items */}
          <section aria-labelledby="order-items-heading" className="bg-white border border-border rounded-xl overflow-hidden">
            <h2 id="order-items-heading" className="px-5 py-4 font-semibold border-b border-border">Order Items</h2>
            <ul className="divide-y divide-border" aria-label="Ordered items">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {item.product_image && <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product_id}`} className="font-medium text-sm hover:text-primary transition-colors focus-visible:outline-ring line-clamp-1">
                      {item.product_name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">Sold by {item.seller_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity} × ₱{item.unit_price?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <p className="font-bold text-sm flex-shrink-0">
                    ₱{item.subtotal?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Delivery address */}
            {order.delivery_address && (
              <section aria-labelledby="delivery-heading" className="bg-white border border-border rounded-xl p-5">
                <h2 id="delivery-heading" className="font-semibold flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> Delivery Address
                </h2>
                <address className="not-italic text-sm text-muted-foreground space-y-0.5">
                  <p className="font-medium text-foreground">{order.delivery_address.full_name}</p>
                  <p>{order.delivery_address.phone}</p>
                  <p>{order.delivery_address.line1}{order.delivery_address.line2 ? `, ${order.delivery_address.line2}` : ""}</p>
                  <p>{order.delivery_address.city}, {order.delivery_address.province} {order.delivery_address.postal_code}</p>
                </address>
              </section>
            )}

            {/* Payment summary */}
            <section aria-labelledby="payment-heading" className="bg-white border border-border rounded-xl p-5">
              <h2 id="payment-heading" className="font-semibold flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> Payment Summary
              </h2>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>₱{order.subtotal?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">VAT (12%)</dt>
                  <dd>₱{order.tax_amount?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd>₱{order.shipping_amount?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</dd>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-2">
                  <dt>Total</dt>
                  <dd className="text-primary">₱{order.grand_total?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</dd>
                </div>
                <div className="flex justify-between text-xs">
                  <dt className="text-muted-foreground">Payment Status</dt>
                  <dd><StatusBadge status={order.payment_status} /></dd>
                </div>
              </dl>
            </section>
          </div>

          {order.notes && (
            <div className="bg-muted/50 border border-border rounded-xl px-5 py-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Order Notes</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}