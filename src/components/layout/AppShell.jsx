import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ShoppingCart, User, Menu, X, Store, LayoutDashboard, Package } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Browse" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function AppShell({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 bg-white border-b border-border" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="font-heading font-bold text-xl tracking-tight flex items-center gap-2 focus-visible:outline-ring rounded-sm">
            <Store className="w-5 h-5 text-primary" aria-hidden="true" />
            Inclusive Market
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-ring ${location.pathname === l.to ? "bg-accent font-semibold" : "text-muted-foreground"}`}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Link to="/admin/dashboard">
                    <Button variant="ghost" size="sm" className="hidden sm:flex gap-1 text-xs">
                      <LayoutDashboard className="w-4 h-4" /> Admin
                    </Button>
                  </Link>
                )}
                <Link to="/seller/dashboard">
                  <Button variant="ghost" size="sm" className="hidden sm:flex gap-1 text-xs">
                    <Package className="w-4 h-4" /> Sell
                  </Button>
                </Link>
                <Link to="/buyer/cart" aria-label="Shopping cart">
                  <Button variant="ghost" size="icon"><ShoppingCart className="w-5 h-5" /></Button>
                </Link>
                <Link to="/buyer/profile">
                  <Button variant="ghost" size="icon" aria-label={`Account: ${user?.full_name}`}>
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => logout()} className="hidden sm:flex text-xs">Sign out</Button>
              </>
            ) : (
              <Link to="/login"><Button size="sm">Sign in</Button></Link>
            )}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(v => !v)} aria-expanded={mobileOpen} aria-label="Toggle menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1" aria-label="Mobile navigation">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent">
                {l.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button onClick={() => logout()} className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10">
                Sign out
              </button>
            )}
          </nav>
        )}
      </header>

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t border-border bg-white py-8" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Inclusive Market — AVRC Region IX. All rights reserved.</p>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-4">
            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
            <Link to="/accessibility" className="hover:text-primary transition-colors">Accessibility</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}