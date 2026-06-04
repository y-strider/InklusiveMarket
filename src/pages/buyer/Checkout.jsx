import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", line1: "", line2: "", city: "", province: "", postal_code: "",
    payment_method: "cod", notes: "",
  });

  useEffect(() => {
    if (user) {
      base44.entities.Cart.filter({ buyer_id: user.id })
        .then(res => setCart(res[0] || null))
        .finally(() => setLoading(false));
      setForm(f => ({ ...f, full_name: user.full_name || "" }));
    }
  }, [user]);

  const items = cart?.items || [];
  const TAX_RATE = 0.12;
  const SHIP = 100;
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + tax + SHIP;

  const handlePlace = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const order = await base44.entities.Order.create({
        buyer_id: user.id, buyer_name: user.full_name, buyer_email: user.email,
        items: items.map(i => ({ ...i, unit_price: i.price, subtotal: i.price * i.quantity })),
        subtotal, tax_amount: tax, shipping_amount: SHIP, grand_total: total,
        status: "pending", payment_status: "unpaid",
        payment_method: form.payment_method, notes: form.notes,
        delivery_address: { full_name: form.full_name, phone: form.phone, line1: form.line1, line2: form.line2, city: form.city, province: form.province, postal_code: form.postal_code },
        placed_at: new Date().toISOString(),
      });
      if (cart) await base44.entities.Cart.update(cart.id, { items: [], subtotal: 0 });
      setDone(true);
      setTimeout(() => navigate("/buyer/orders"), 2500);
    } finally {
      setPlacing(false);
    }
  };

  if (done) return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" aria-hidden="true" />
        <h1 className="font-heading text-2xl font-bold mb-2">Order Placed!</h1>
        <p className="text-muted-foreground">Redirecting to your orders…</p>
      </div>
    </AppShell>
  );

  if (loading) return <AppShell><div className="max-w-2xl mx-auto px-4 py-10 animate-pulse"><div className="h-10 bg-muted rounded mb-6 w-48" /><div className="h-40 bg-muted rounded" /></div></AppShell>;

  if (items.length === 0) return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
      </div>
    </AppShell>
  );

  const F = ({ id, label, required, ...props }) => (
    <div>
      <Label htmlFor={id}>{label}{required && <span className="text-destructive ml-0.5" aria-label="required">*</span>}</Label>
      <Input id={id} className="mt-1" required={required} {...props} onChange={(e) => setForm(f => ({ ...f, [id]: e.target.value }))} />
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-2xl font-bold mb-6">Checkout</h1>

        <form onSubmit={handlePlace} className="grid grid-cols-1 lg:grid-cols-3 gap-6" noValidate aria-label="Checkout form">
          <div className="lg:col-span-2 space-y-4">
            <section aria-labelledby="delivery-heading" className="bg-white border border-border rounded-xl p-5">
              <h2 id="delivery-heading" className="font-semibold mb-4">Delivery Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F id="full_name" label="Full Name" value={form.full_name} required />
                <F id="phone" label="Phone" type="tel" value={form.phone} required />
                <div className="sm:col-span-2"><F id="line1" label="Address Line 1" value={form.line1} required /></div>
                <div className="sm:col-span-2"><F id="line2" label="Address Line 2" value={form.line2} /></div>
                <F id="city" label="City" value={form.city} required />
                <F id="province" label="Province" value={form.province} required />
                <F id="postal_code" label="Postal Code" value={form.postal_code} required />
              </div>
            </section>

            <section aria-labelledby="payment-heading" className="bg-white border border-border rounded-xl p-5">
              <h2 id="payment-heading" className="font-semibold mb-4">Payment Method</h2>
              <div className="space-y-2" role="radiogroup" aria-labelledby="payment-heading">
                {[["cod", "Cash on Delivery"], ["gcash", "GCash"], ["bank", "Bank Transfer"]].map(([val, lbl]) => (
                  <label key={val} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input type="radio" name="payment" value={val} checked={form.payment_method === val} onChange={() => setForm(f => ({ ...f, payment_method: val }))} className="accent-primary" />
                    <span className="text-sm font-medium">{lbl}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="bg-white border border-border rounded-xl p-5">
              <Label htmlFor="notes">Order Notes (optional)</Label>
              <textarea id="notes" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Special instructions…" />
            </section>
          </div>

          <aside aria-label="Order summary">
            <div className="bg-white border border-border rounded-xl p-5 sticky top-24">
              <h2 className="font-semibold mb-4">Order Summary</h2>
              <ul className="space-y-2 mb-4 text-sm" aria-label="Items in order">
                {items.map(i => (
                  <li key={i.product_id} className="flex justify-between gap-2">
                    <span className="text-muted-foreground line-clamp-1">{i.product_name} ×{i.quantity}</span>
                    <span className="flex-shrink-0 font-medium">₱{(i.price * i.quantity).toLocaleString("en-PH")}</span>
                  </li>
                ))}
              </ul>
              <dl className="space-y-1.5 text-sm border-t border-border pt-3">
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>₱{subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">VAT (12%)</dt><dd>₱{tax.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>₱{SHIP.toLocaleString("en-PH")}</dd></div>
                <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-1">
                  <dt>Total</dt><dd className="text-primary">₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</dd>
                </div>
              </dl>
              <Button type="submit" className="w-full mt-4" size="lg" disabled={placing}>
                {placing ? "Placing Order…" : "Place Order"}
              </Button>
            </div>
          </aside>
        </form>
      </div>
    </AppShell>
  );
}