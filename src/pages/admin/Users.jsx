import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminShell from "@/components/layout/AdminShell";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.User.list().then(setUsers).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell>
      <div className="space-y-5">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" aria-hidden="true" /> Users
        </h1>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input type="search" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" aria-label="Search users" />
        </div>

        <div aria-live="polite" className="text-sm text-muted-foreground">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""} found
        </div>

        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm" aria-busy={loading}>
            <caption className="sr-only">Platform users list</caption>
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Email</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Role</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} aria-hidden="true">
                  {[1,2,3,4].map(j => <td key={j} className="px-5 py-3"><div className="h-4 bg-muted rounded animate-pulse w-24" /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No users found.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0" aria-hidden="true">
                        {u.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="font-medium">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {u.created_date ? new Date(u.created_date).toLocaleDateString("en-PH") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}