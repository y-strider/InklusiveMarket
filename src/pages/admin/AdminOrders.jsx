import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AdminShell from "@/components/layout/AdminShell";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import AccessibleModal from "@/components/ui/AccessibleModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const STATUSES = ["pending", "confirmed", "processing", "completed", "cancelled"];

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState(null);

  useEffect(() => { loadOrders(); }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    const data = statusFilter === "all"
      ? await base44.entities.Order.list("-placed_at", 300)
      : await base44.entities.Order.filter({ status: statusFilter }, "-placed_at", 300);
    setOrders(data);
    setLoading(false);
  };

  const updateStatus = async (order, status) => {
    await base44.entities.Order.update(order.id, { status });
    await base44.entities.AuditLog.create({ actor_id: user.id, actor_name: user.full_name, actor_role: "admin", action: "order.status_changed", subject_type: "Order", subject_id: order.id, description: `Status changed to ${status}` });
    loadOrders();
    setDetail(null);
  };

  const filtered = orders.filter(o =>
    !search ||
    o.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.id?.slice(-8).toUpperCase().includes(search.toUpperCase())
  );

  const columns = [
    { key: "id", label: "Order ID", render: (r) => <span className="font-mono text-xs font-medium">#{r.id.slice(-8).toUpperCase()}</span> },
    { key: "buyer_name", label: "Buyer", render: (r) => <div><p className="text-sm font-medium">{r.buyer_name}</p><p className="text-xs text-muted-foreground">{r.buyer_email}</p></div> },
    { key: "grand_total", label: "Total", render: (r) => <span className="font-bold text-primary">₱{r.grand_total?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span> },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "payment_status", label: "Payment", render: (r) => <StatusBadge status={r.payment_status} /> },
    { key: "placed_at", label: "Date", render: (r) => <span className="text-xs text-muted-foreground">{r.placed_at ? new Date(r.placed_at).toLocaleDateString("en-PH") : "—"}</span> },
    { key: "actions", label: "", render: (r) => (
      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setDetail(r)}>Manage</Button>
    )},
  ];

  return (
    <AdminShell>
      <div className="space-y-5">
        <h1 className="font-heading text-2xl font-bold">Orders</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input type="search" placeholder="Search by buyer or order ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" aria-label="Search orders" />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {["all", ...STATUSES].map(s => (
              <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} aria-pressed={statusFilter === s} className="capitalize text-xs">{s}</Button>
            ))}
          </div>
        </div>

        <DataTable caption="All orders" columns={columns} data={filtered} loading={loading} emptyMessage="No orders found." />
      </div>

      <AccessibleModal open={!!detail} onClose={() => setDetail(null)} title={`Order #${detail?.id.slice(-8).toUpperCase()}`} description={`Buyer: ${detail?.buyer_name}`}>
        {detail && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm font-medium">Update Status:</span>
              {STATUSES.map(s => (
                <Button key={s} size="sm" variant={detail.status === s ? "default" : "outline"} onClick={() => updateStatus(detail, s)} className="capitalize text-xs">{s}</Button>
              ))}
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Total:</strong> ₱{detail.grand_total?.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
              <p><strong>Payment:</strong> <StatusBadge status={detail.payment_status} /></p>
              <p><strong>Items:</strong> {(detail.items || []).length}</p>
            </div>
          </div>
        )}
      </AccessibleModal>
    </AdminShell>
  );
}