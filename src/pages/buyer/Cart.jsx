import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight } from "lucide-react";

export default function Cart() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadCart();
  }, [user]);

  const loadCart = async () => {
    const carts = await base44.entities.Cart.filter({ buyer_id: user.id });
    setCart(carts[0] || null);
    setLoading(false);
  };

  const updateItem = async (productId, delta) => {
    if (!cart) return;
    const items = (cart.items || []).map(i =>
      i.product_id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
    ).filter(i => i.quantity > 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const updated = await base44.entities.Cart.update(cart.id, { items, subtotal });
    setCart(updated);
  };

  const removeItem = async (productId) => {
    if (!cart) return;
    const items = (cart.items || []).filter(i => i.product_id !== productId);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const updated = await base44.entities.Cart.update(cart.id, { items, subtotal });
    setCart(updated);
  };

  const items = cart?.items || [];

  if (loading) return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse" aria-busy="true" aria-label="Loading cart">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl mb-4" />)}
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" aria-hidden="true" /> Shopping Cart
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" aria-hidden="true" />
            <p className="font-medium text-lg mb-2">Your cart is empty</p>
            <Link to="/catalog"><Button>Browse Products</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-3" aria-label="Cart items">
              {items.map(item => (
                <li key={item.product_id} className="flex items-center gap-4 bg-white border border-border rounded-xl p-4">
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {item.product_image && <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product_id}`} className="font-medium text-sm hover:text-primary line-clamp-1">
                      {item.product_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.seller_name}</p>
                    <p className="text-sm font-bold text-primary mt-1">₱{item.price?.toLocaleString("en-PH")}</p>
                  </div>
                  <div className="flex items-center gap-2 border border-border rounded-lg overflow-hidden">
                    <button onClick={() => updateItem(item.product_id, -1)} className="px-2 py-1.5 hover:bg-muted transition-colors" aria-label={`Decrease quantity of ${item.product_name}`}>
                      <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <span className="px-2 text-sm font-medium" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                    <button onClick={() => updateItem(item.product_id, 1)} className="px-2 py-1.5 hover:bg-muted transition-colors" aria-label={`Increase quantity of ${item.product_name}`}>
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.product_id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors" aria-label={`Remove ${item.product_name} from cart`}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="bg-white border border-border rounded-xl p-5">
              <div className="flex justify-between font-bold text-lg mb-4">
                <span>Subtotal</span>
                <span className="text-primary">₱{cart?.subtotal?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
              </div>
              <Link to="/buyer/checkout">
                <Button className="w-full gap-2" size="lg">
                  Proceed to Checkout <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}