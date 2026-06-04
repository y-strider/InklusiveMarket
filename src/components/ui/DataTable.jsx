import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DataTable({ caption, columns, data, loading, emptyMessage = "No data.", pagination }) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-busy={loading}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              {columns.map(col => (
                <th key={col.key} scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} aria-hidden="true">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id ?? i} className="hover:bg-muted/20 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
          <span>Showing {pagination.from}–{pagination.to} of {pagination.total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={pagination.onPrev} disabled={pagination.page <= 1} aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 py-1">Page {pagination.page} / {pagination.totalPages}</span>
            <Button variant="outline" size="sm" onClick={pagination.onNext} disabled={pagination.page >= pagination.totalPages} aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}