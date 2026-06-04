import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AdminShell from "@/components/layout/AdminShell";
import StatusBadge from "@/components/ui/StatusBadge";
import AccessibleModal from "@/components/ui/AccessibleModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Eye, Search } from "lucide-react";

export default function ProductApprovals() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);
  const [rejReason, setRejReason] = useState("");
  const [rejectModal, setRejectModal] = useState(null);

  useEffect(() => { loadProducts(); }, [filter]);

  const loadProducts = async () => {
    setLoading(true);
    const data = filter === "all"
      ? await base44.entities.Product.list("-created_date", 300)
      : await base44.entities.Product.filter({ approval_status: filter }, "-created_date", 300);
    setProducts(data);
    setLoading(false);
  };

  const approve = async (p) => {
    await base44.entities.Product.update(p.id, { approval_status: "approved", rejection_reason: "" });
    await base44.entities.AuditLog.create({ actor_id: user.id, actor_name: user.full_name, actor_role: "admin", action: "product.approved", subject_type: "Product", subject_id: p.id, subject_label: p.name, description: `Approved: ${p.name}` });
    loadProducts();
  };

  const reject = async () => {
    if (!rejectModal) return;
    await base44.entities.Product.update(rejectModal.id, { approval_status: "rejected", rejection_reason: rejReason });
    await base44.entities.AuditLog.create({ actor_id: user.id, actor_name: user.full_name, actor_role: "admin", action: "product.rejected", subject_type: "Product", subject_id: rejectModal.id, subject_label: rejectModal.name, description: `Rejected: ${rejectModal.name}. Reason: ${rejReason}` });
    setRejectModal(null); setRejReason(""); loadProducts();
  };

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.seller_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminShell>
      <div className="space-y-5">
        <h1 className="font-heading text-2xl font-bold">Product Approvals</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input type="search" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" aria-label="Search products" />
          </div>
          <div className="flex gap-2" role="group" aria-label="Filter by status">
            {["pending", "approved", "rejected", "all"].map(f => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} aria-pressed={filter === f} className="capitalize text-xs">
                {f}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />) :
          filtered.length === 0 ? <p className="text-center py-10 text-muted-foreground">No products found.</p> :
          filtered.map(p => (
            <div key={p.id} className="flex items-center gap-4 bg-white border border-border rounded-xl p-4">
              <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {p.primary_image_url && <img src={p.primary_image_url} alt="" className="w-full h-full object-cover" aria-hidden="true" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.seller_name} · ₱{p.price?.toLocaleString("en-PH")} · Stock: {p.stock_quantity}</p>
                {p.rejection_reason && <p className="text-xs text-destructive mt-0.5">Rejected: {p.rejection_reason}</p>}
              </div>
              <StatusBadge status={p.approval_status} />
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setPreview(p)} aria-label={`Preview ${p.name}`}><Eye className="w-4 h-4" aria-hidden="true" /></Button>
                {p.approval_status !== "approved" && (
                  <Button variant="ghost" size="icon" onClick={() => approve(p)} className="text-green-600 hover:bg-green-50" aria-label={`Approve ${p.name}`}><CheckCircle className="w-4 h-4" aria-hidden="true" /></Button>
                )}
                {p.approval_status !== "rejected" && (
                  <Button variant="ghost" size="icon" onClick={() => { setRejectModal(p); setRejReason(""); }} className="text-destructive hover:bg-destructive/10" aria-label={`Reject ${p.name}`}><XCircle className="w-4 h-4" aria-hidden="true" /></Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AccessibleModal open={!!preview} onClose={() => setPreview(null)} title={preview?.name || ""}>
        {preview && (
          <div className="space-y-3">
            {preview.primary_image_url && <img src={preview.primary_image_url} alt={preview.name} className="w-full aspect-video object-cover rounded-lg" />}
            <p className="text-sm text-muted-foreground">{preview.description}</p>
            <div className="flex gap-4 text-sm">
              <span><strong>Price:</strong> ₱{preview.price?.toLocaleString("en-PH")}</span>
              <span><strong>Stock:</strong> {preview.stock_quantity}</span>
            </div>
          </div>
        )}
      </AccessibleModal>

      <AccessibleModal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Product" description={rejectModal?.name}>
        <div className="space-y-4">
          <div>
            <label htmlFor="rej-reason" className="text-sm font-medium">Rejection Reason</label>
            <textarea id="rej-reason" value={rejReason} onChange={(e) => setRejReason(e.target.value)} className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Explain why this product is being rejected…" />
          </div>
          <div className="flex gap-3">
            <Button onClick={reject} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirm Reject</Button>
            <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
          </div>
        </div>
      </AccessibleModal>
    </AdminShell>
  );
}