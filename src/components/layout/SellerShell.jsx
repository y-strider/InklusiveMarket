import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, Package, ShoppingBag, BarChart2, Store, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/seller/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/seller/products", icon: Package, label: "My Products" },
  { to: "/seller/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/seller/analytics", icon: BarChart2, label: "Analytics" },
];

export default function SellerShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Sidebar = () => (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-border flex flex-col h-full" aria-label="Seller navigation">
      <div className="h-16 flex items-center px-4 border-b border-border gap-2">
        <Store className="w-5 h-5 text-primary" aria-hidden="true" />
        <span className="font-heading font-bold text-sm">Seller Center</span>
      </div>
      <div className="px-3 py-2 border-b border-border">
        <p className="text-sm font-medium truncate">{user?.full_name}</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Seller menu">
        {NAV.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-sm transition-colors hover:bg-accent ${location.pathname === to ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground"}`}>
            <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-primary">
          <Store className="w-4 h-4" /> View Store
        </Link>
        <button onClick={() => logout()} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <div className="lg:hidden h-14 bg-white border-b border-border flex items-center justify-between px-4">
        <span className="font-heading font-bold text-sm">Seller Center</span>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:flex lg:flex-shrink-0 lg:h-screen lg:sticky lg:top-0">
          <Sidebar />
        </div>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            <div className="relative z-10 h-full"><Sidebar /></div>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8" id="main-content" tabIndex={-1}>
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}