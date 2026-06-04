import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import SellerShell from "@/components/layout/SellerShell";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user) loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.Order.list("-placed_at", 300);
      const mine = all.filter(o => (o.items || []).some(i => i.seller_id === user.id));
      setOrders(mine);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getMyTotal = (order) =>
    (order.items || []).filter(i => i.seller_id === user.id).reduce((s, i) => s + i.subtotal, 0);

  const filtered = orders.filter(o =>
    !search ||
    o.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.id?.slice(-8).toUpperCase().includes(search.toUpperCase())
  );

  const columns = [
    { key: "id", label: "Order ID", render: (row) => <span className="font-mono text-xs font-medium">#{row.id.slice(-8).toUpperCase()}</span> },
    { key: "buyer_name", label: "Buyer", render: (row) => (
      <div>
        <p className="text-sm font-medium">{row.buyer_name}</p>
        <p className="text-xs text-muted-foreground">{row.buyer_email}</p>
      </div>
    )},
    { key: "items", label: "My Items", render: (row) => {
      const mine = (row.items || []).filter(i => i.seller_id === user.id);
      return <span className="text-sm">{mine.length} item{mine.length !== 1 ? "s" : ""}</span>;
    }},
    { key: "my_total", label: "My Revenue", render: (row) => (
      <span className="font-bold text-primary">₱{getMyTotal(row).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
    )},
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "payment_status", label: "Payment", render: (row) => <StatusBadge status={row.payment_status} /> },
    { key: "placed_at", label: "Date", render: (row) => (
      <span className="text-xs text-muted-foreground">{row.placed_at ? new Date(row.placed_at).toLocaleDateString("en-PH") : "—"}</span>
    )},
  ];

  return (
    <SellerShell>
      <div className="space-y-5">
        <h1 className="font-heading text-2xl font-bold">My Orders</h1>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search by buyer or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search orders"
          />
        </div>

        <div aria-live="polite" className="text-sm text-muted-foreground">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""} found
        </div>

        <DataTable
          caption="Orders containing your products"
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No orders yet. Once customers buy your products, they'll appear here."
        />
      </div>
    </SellerShell>
  );
}