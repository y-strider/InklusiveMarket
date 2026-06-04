import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminShell from "@/components/layout/AdminShell";
import AccessibleModal from "@/components/ui/AccessibleModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

const EMPTY = { name: "", description: "", image_url: "", status: "active", sort_order: "0" };

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCats(); }, []);

  const loadCats = async () => {
    const data = await base44.entities.Category.list("sort_order");
    setCats(data); setLoading(false);
  };

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (c) => { setForm({ ...c, sort_order: String(c.sort_order ?? 0) }); setEditing(c); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, sort_order: Number(form.sort_order) };
    if (editing) await base44.entities.Category.update(editing.id, payload);
    else await base44.entities.Category.create(payload);
    await loadCats(); setModal(false); setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    await base44.entities.Category.delete(id);
    setCats(cats.filter(c => c.id !== id));
  };

  const F = ({ id, label, ...props }) => (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="mt-1" value={form[id] ?? ""} onChange={(e) => setForm(f => ({ ...f, [id]: e.target.value }))} {...props} />
    </div>
  );

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Tag className="w-6 h-6 text-primary" aria-hidden="true" /> Categories</h1>
          <Button size="sm" onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Category</Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : cats.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">No categories yet.</p>
        ) : (
          <ul className="space-y-3" aria-label="Category list">
            {cats.map(c => (
              <li key={c.id} className="flex items-center gap-4 bg-white border border-border rounded-xl p-4">
                {c.image_url && <img src={c.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" aria-hidden="true" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.description || "No description"} · Order: {c.sort_order}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{c.status}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`}><Pencil className="w-4 h-4" aria-hidden="true" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive hover:bg-destructive/10" aria-label={`Delete ${c.name}`}><Trash2 className="w-4 h-4" aria-hidden="true" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AccessibleModal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Category" : "Add Category"}>
        <form onSubmit={handleSave} className="space-y-3" noValidate>
          <F id="name" label="Name" required />
          <F id="description" label="Description" />
          <F id="image_url" label="Image URL" type="url" />
          <F id="sort_order" label="Sort Order" type="number" />
          <div>
            <Label htmlFor="cat-status">Status</Label>
            <select id="cat-status" value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Create"}</Button>
            <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
          </div>
        </form>
      </AccessibleModal>
    </AdminShell>
  );
}