import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminShell from "@/components/layout/AdminShell";
import { Input } from "@/components/ui/input";
import { ClipboardList, Search } from "lucide-react";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.AuditLog.list("-created_date", 200).then(setLogs).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    !search ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell>
      <div className="space-y-5">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" aria-hidden="true" /> Activity Logs
        </h1>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input type="search" placeholder="Search logs…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" aria-label="Search activity logs" />
        </div>

        <div aria-live="polite" className="text-sm text-muted-foreground">
          {filtered.length} log{filtered.length !== 1 ? "s" : ""} found
        </div>

        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-busy={loading}>
              <caption className="sr-only">Platform activity audit logs</caption>
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Action</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actor</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Description</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} aria-hidden="true">
                    {[1,2,3,4].map(j => <td key={j} className="px-5 py-3"><div className="h-4 bg-muted rounded animate-pulse w-24" /></td>)}
                  </tr>
                )) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No logs found.</td></tr>
                ) : filtered.map(log => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{log.action}</code>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-sm">{log.actor_name || "System"}</p>
                      {log.actor_role && <p className="text-xs text-muted-foreground capitalize">{log.actor_role}</p>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground max-w-xs">
                      <p className="line-clamp-2 text-sm">{log.description}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {log.created_date ? new Date(log.created_date).toLocaleString("en-PH") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}