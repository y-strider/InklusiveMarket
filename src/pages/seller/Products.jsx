import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import SellerShell from "@/components/layout/SellerShell";
import AccessibleModal from "@/components/ui/AccessibleModal";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

const EMPTY = { name: "", description: "", price: "", stock_quantity: "", category_id: "", category_name: "", primary_image_url: "", short_description: "" };

export default function SellerProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [prods, cats] = await Promise.all([
      base44.entities.Product.filter({ seller_id: user.id }, "-created_date"),
      base44.entities.Category.filter({ status: "active" }, "sort_order"),
    ]);
    setProducts(prods);
    setCategories(cats);
    setLoading(false);
  };

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal("add"); };
  const openEdit = (p) => { setForm({ ...p, price: String(p.price), stock_quantity: String(p.stock_quantity) }); setEditing(p); setModal("edit"); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const cat = categories.find(c => c.id === form.category_id);
    const payload = {
      ...form,
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
      category_name: cat?.name || "",
      seller_id: user.id,
      seller_name: user.full_name,
    };
    if (editing) {
      await base44.entities.Product.update(editing.id, payload);
    } else {
      await base44.entities.Product.create({ ...payload, approval_status: "pending", is_active: true });
    }
    await loadData();
    closeModal();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await base44.entities.Product.delete(id);
    setProducts(products.filter(p => p.id !== id));
  };

  const F = ({ id, label, required, type = "text", ...props }) => (
    <div>
      <Label htmlFor={id}>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      <Input id={id} type={type} className="mt-1" required={required} value={form[id] ?? ""} onChange={(e) => setForm(f => ({ ...f, [id]: e.target.value }))} {...props} />
    </div>
  );

  return (
    <SellerShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">My Products</h1>
          <Button size="sm" onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" aria-hidden="true" />
            <p className="font-medium mb-2">No products yet</p>
            <Button onClick={openAdd}>Add Your First Product</Button>
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Product list">
            {products.map(p => (
              <li key={p.id} className="flex items-center gap-4 bg-white border border-border rounded-xl p-4">
                <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {p.primary_image_url && <img src={p.primary_image_url} alt="" className="w-full h-full object-cover" aria-hidden="true" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
                  <p className="text-xs text-muted-foreground">₱{p.price?.toLocaleString("en-PH")} · Stock: {p.stock_quantity}</p>
                </div>
                <StatusBadge status={p.approval_status} />
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}>
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive hover:bg-destructive/10" aria-label={`Delete ${p.name}`}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AccessibleModal open={!!modal} onClose={closeModal} title={editing ? "Edit Product" : "Add New Product"}>
        <form onSubmit={handleSave} className="space-y-3" noValidate>
          <F id="name" label="Product Name" required />
          <F id="short_description" label="Short Description" />
          <div>
            <Label htmlFor="description">Full Description</Label>
            <textarea id="description" value={form.description ?? ""} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F id="price" label="Price (₱)" type="number" min="0" required />
            <F id="stock_quantity" label="Stock" type="number" min="0" required />
          </div>
          <div>
            <Label htmlFor="category_id">Category</Label>
            <select id="category_id" value={form.category_id ?? ""} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))} className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <F id="primary_image_url" label="Image URL" type="url" />
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Create Product"}</Button>
            <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
          </div>
        </form>
      </AccessibleModal>
    </SellerShell>
  );
}