import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, Package, Users, ShoppingBag, CreditCard, Tag, BarChart2, ClipboardList, Settings, LogOut, Store, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/products", icon: Package, label: "Product Approvals" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/admin/transactions", icon: CreditCard, label: "Transactions" },
  { to: "/admin/categories", icon: Tag, label: "Categories" },
  { to: "/admin/reports", icon: BarChart2, label: "Reports" },
  { to: "/admin/activity-logs", icon: ClipboardList, label: "Activity Logs" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Sidebar = () => (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-border flex flex-col h-full" aria-label="Admin navigation">
      <div className="h-16 flex items-center px-4 border-b border-border gap-2">
        <Store className="w-5 h-5 text-primary" aria-hidden="true" />
        <span className="font-heading font-bold text-sm">Inclusive Market</span>
      </div>
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs text-muted-foreground">Admin Panel</p>
        <p className="text-sm font-medium truncate">{user?.full_name}</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Admin menu">
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
      {/* Mobile header */}
      <div className="lg:hidden h-14 bg-white border-b border-border flex items-center justify-between px-4">
        <span className="font-heading font-bold text-sm">Admin Panel</span>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0 lg:h-screen lg:sticky lg:top-0">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            <div className="relative z-10 h-full"><Sidebar /></div>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8" id="main-content" tabIndex={-1}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}