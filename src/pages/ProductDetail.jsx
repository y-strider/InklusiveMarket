import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, ChevronLeft, Minus, Plus, Package } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedMsg, setAddedMsg] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.Product.filter({ id }),
      base44.entities.Review.filter({ product_id: id, moderation_status: "approved" }, "-created_date", 20),
    ]).then(([prods, revs]) => {
      setProduct(prods[0] || null);
      setReviews(revs);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { window.location.href = "/login"; return; }
    setAddingToCart(true);
    try {
      const carts = await base44.entities.Cart.filter({ buyer_id: user.id });
      const cart = carts[0];
      const newItem = {
        product_id: product.id, product_name: product.name,
        product_image: product.primary_image_url, seller_id: product.seller_id,
        seller_name: product.seller_name, price: product.price, quantity: qty,
        max_quantity: product.stock_quantity,
      };
      if (cart) {
        const items = cart.items || [];
        const existing = items.findIndex(i => i.product_id === product.id);
        if (existing >= 0) items[existing].quantity = Math.min(items[existing].quantity + qty, product.stock_quantity);
        else items.push(newItem);
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
        await base44.entities.Cart.update(cart.id, { items, subtotal });
      } else {
        await base44.entities.Cart.create({ buyer_id: user.id, items: [newItem], subtotal: product.price * qty });
      }
      setAddedMsg("Added to cart!");
      setTimeout(() => setAddedMsg(""), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse" aria-busy="true" aria-label="Loading product">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-24" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      </div>
    </AppShell>
  );

  if (!product) return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" aria-hidden="true" />
        <h1 className="text-xl font-bold mb-2">Product not found</h1>
        <Link to="/catalog"><Button variant="outline">Back to Catalog</Button></Link>
      </div>
    </AppShell>
  );

  const inStock = product.stock_quantity > 0;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/catalog" className="hover:text-primary flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Products
          </Link>
          <span>/ {product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
            {product.primary_image_url ? (
              <img src={product.primary_image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <Package className="w-20 h-20" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-sm text-muted-foreground mb-1">{product.category_name}</p>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-sm text-muted-foreground mb-4">by {product.seller_name}</p>

            {product.reviews_count > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex" aria-label={`${product.average_rating} out of 5 stars`}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.average_rating) ? "fill-amber-400 stroke-amber-400" : "stroke-muted-foreground"}`} aria-hidden="true" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({product.reviews_count} reviews)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-primary">₱{product.price?.toLocaleString("en-PH")}</span>
              {product.compare_at_price && (
                <span className="text-lg text-muted-foreground line-through">₱{product.compare_at_price?.toLocaleString("en-PH")}</span>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{product.description}</p>
            )}

            <div className="mt-auto space-y-4">
              {inStock ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center gap-2 border border-border rounded-lg overflow-hidden">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-muted transition-colors" aria-label="Decrease quantity">
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <span className="px-4 py-2 font-medium" aria-live="polite" aria-label={`Quantity: ${qty}`}>{qty}</span>
                      <button onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))} className="px-3 py-2 hover:bg-muted transition-colors" aria-label="Increase quantity">
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">{product.stock_quantity} available</span>
                  </div>

                  {addedMsg && (
                    <div role="status" aria-live="polite" className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      {addedMsg}
                    </div>
                  )}

                  <Button onClick={handleAddToCart} disabled={addingToCart} className="w-full gap-2" size="lg">
                    <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                    {addingToCart ? "Adding…" : "Add to Cart"}
                  </Button>
                </>
              ) : (
                <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground font-medium text-center" role="status">
                  Out of Stock
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="font-heading text-xl font-bold mb-4">Customer Reviews</h2>
            <div className="space-y-4">
              {reviews.map(r => (
                <article key={r.id} className="bg-white border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex" aria-label={`${r.rating} out of 5 stars`}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-amber-400 stroke-amber-400" : "stroke-muted-foreground"}`} aria-hidden="true" />
                      ))}
                    </div>
                    <span className="font-medium text-sm">{r.buyer_name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(r.created_date).toLocaleDateString("en-PH")}</span>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}