import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, ShoppingBag, Star, X } from "lucide-react";

function ProductCard({ product }) {
  return (
    <article className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          {product.primary_image_url ? (
            <img src={product.primary_image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <ShoppingBag className="w-10 h-10" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs text-muted-foreground mb-0.5">{product.category_name}</p>
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-primary text-sm">₱{product.price?.toLocaleString("en-PH")}</span>
            {product.reviews_count > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-amber-600">
                <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" aria-hidden="true" />
                {product.average_rating?.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    Promise.all([
      base44.entities.Product.filter({ approval_status: "approved", is_active: true }, "-created_date", 200),
      base44.entities.Category.filter({ status: "active" }, "sort_order"),
    ]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = products
    .filter(p => !selectedCategory || p.category_id === selectedCategory)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "rating") return (b.average_rating || 0) - (a.average_rating || 0);
      return new Date(b.created_date) - new Date(a.created_date);
    });

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-3xl font-bold mb-6">Browse Products</h1>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search products"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-input rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Sort products"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by category">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("")}
            aria-pressed={!selectedCategory}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? "" : cat.id)}
              aria-pressed={selectedCategory === cat.id}
            >
              {cat.name}
            </Button>
          ))}
          {selectedCategory && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategory("")} className="text-muted-foreground gap-1">
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>

        <div aria-live="polite" className="text-sm text-muted-foreground mb-4">
          {loading ? "Loading…" : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" aria-busy="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-border overflow-hidden animate-pulse" aria-hidden="true">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-16" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto opacity-30 mb-3" aria-hidden="true" />
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}