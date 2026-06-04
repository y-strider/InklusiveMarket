import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccessibleModal({ open, onClose, title, description, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && open) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-desc" : undefined}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 focus:outline-none"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="modal-title" className="font-heading text-lg font-bold">{title}</h2>
            {description && <p id="modal-desc" className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog" className="-mr-2 -mt-2">
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}