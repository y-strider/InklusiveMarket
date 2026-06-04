import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, ShoppingBag, Heart, Shield } from "lucide-react";

function ProductCard({ product }) {
  return (
    <article className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow group">
      <Link to={`/product/${product.id}`} tabIndex={0}>
        <div className="aspect-square overflow-hidden bg-muted">
          {product.primary_image_url ? (
            <img
              src={product.primary_image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <ShoppingBag className="w-12 h-12" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{product.category_name}</p>
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{product.seller_name}</p>
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="font-bold text-primary">₱{product.price?.toLocaleString("en-PH")}</span>
              {product.compare_at_price && (
                <span className="ml-2 text-xs text-muted-foreground line-through">₱{product.compare_at_price?.toLocaleString("en-PH")}</span>
              )}
            </div>
            {product.reviews_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" aria-hidden="true" />
                <span aria-label={`${product.average_rating} out of 5 stars`}>{product.average_rating?.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Product.filter({ approval_status: "approved", is_featured: true, is_active: true }, "-created_date", 8)
      .then(setFeatured)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 px-4" aria-labelledby="hero-heading">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Heart className="w-3.5 h-3.5 fill-primary" aria-hidden="true" /> Supporting PWD Artisans in AVRC Region IX
          </div>
          <h1 id="hero-heading" className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-tight">
            Handcrafted with Heart,<br />
            <span className="text-primary">Sold with Pride</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Discover authentic handmade goods crafted by persons with disabilities in Zamboanga Peninsula. Every purchase empowers a skilled artisan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/catalog">
              <Button size="lg" className="gap-2">Browse Products <ArrowRight className="w-4 h-4" aria-hidden="true" /></Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline">Learn About AVRC</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-14 px-4 bg-white" aria-labelledby="values-heading">
        <div className="max-w-5xl mx-auto">
          <h2 id="values-heading" className="sr-only">Our Values</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Heart, title: "PWD-Made", desc: "Every product is crafted by a registered PWD artisan in the AVRC program." },
              { icon: Shield, title: "Secure & Private", desc: "Protected under the Philippine Data Privacy Act (RA 10173)." },
              { icon: Star, title: "Quality Assured", desc: "All products go through admin review before appearing on the platform." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <dt className="font-semibold">{title}</dt>
                <dd className="text-sm text-muted-foreground">{desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-14 px-4" aria-labelledby="featured-heading">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 id="featured-heading" className="font-heading text-2xl font-bold">Featured Products</h2>
            <Link to="/catalog" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading products">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden animate-pulse" aria-hidden="true">
                  <div className="aspect-square bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-muted rounded w-16" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-20 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto opacity-30 mb-3" aria-hidden="true" />
              <p>No featured products yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-primary text-primary-foreground" aria-labelledby="cta-heading">
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="cta-heading" className="font-heading text-2xl sm:text-3xl font-bold mb-4">Are you a PWD artisan?</h2>
          <p className="mb-6 text-primary-foreground/80">Join our platform to sell your handcrafted goods to buyers across the Philippines.</p>
          <Link to="/register">
            <Button size="lg" variant="secondary">Register as a Seller</Button>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}