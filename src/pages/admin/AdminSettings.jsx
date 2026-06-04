import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminShell from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Settings, AlertTriangle } from "lucide-react";

const DEFAULT_SETTINGS = [
  { key: "site_name", value: "Inclusive Market", label: "Site Name", type: "text", group: "general" },
  { key: "contact_email", value: "info@inclusivemarket.ph", label: "Contact Email", type: "text", group: "general" },
  { key: "tax_rate", value: "12", label: "VAT Tax Rate (%)", type: "number", group: "commerce" },
  { key: "shipping_fee", value: "100", label: "Default Shipping Fee (₱)", type: "number", group: "commerce" },
  { key: "review_window_days", value: "30", label: "Review Window (days after order completion)", type: "number", group: "commerce" },
  { key: "maintenance_mode", value: "false", label: "Maintenance Mode", type: "boolean", group: "system" },
  { key: "review_moderation", value: "false", label: "Require Review Moderation", type: "boolean", group: "system" },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const data = await base44.entities.SiteSettings.list();
      const map = {};
      for (const s of data) map[s.key] = s.value;
      // Merge with defaults
      const merged = {};
      for (const d of DEFAULT_SETTINGS) merged[d.key] = map[d.key] ?? d.value;
      setSettings(merged);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const def of DEFAULT_SETTINGS) {
        const existing = await base44.entities.SiteSettings.filter({ key: def.key });
        const value = String(settings[def.key] ?? def.value);
        if (existing.length > 0) {
          await base44.entities.SiteSettings.update(existing[0].id, { value });
        } else {
          await base44.entities.SiteSettings.create({ key: def.key, value, label: def.label, type: def.type, group: def.group });
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const groups = ["general", "commerce", "system"];
  const groupLabels = { general: "General Settings", commerce: "Commerce Settings", system: "System Settings" };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" aria-hidden="true" />
          <h1 className="font-heading text-2xl font-bold">Settings</h1>
        </div>

        <div role="note" className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-amber-800">
            <strong>Security Notice:</strong> PayMongo API keys, database credentials, and other secrets are configured via environment variables and are never stored in the database.
            Contact your system administrator to update those values.
          </div>
        </div>

        <form onSubmit={handleSave} noValidate aria-label="Site settings form" className="space-y-6">
          {groups.map(group => {
            const groupDefs = DEFAULT_SETTINGS.filter(d => d.group === group);
            return (
              <section key={group} aria-labelledby={`${group}-settings-heading`} className="bg-white border border-border rounded-xl p-5">
                <h2 id={`${group}-settings-heading`} className="font-semibold mb-4 capitalize">
                  {groupLabels[group]}
                </h2>
                <div className="space-y-4">
                  {groupDefs.map(def => (
                    <div key={def.key}>
                      {def.type === "boolean" ? (
                        <div className="flex items-center gap-3">
                          <input
                            id={`setting-${def.key}`}
                            type="checkbox"
                            checked={settings[def.key] === "true"}
                            onChange={(e) => setSettings(s => ({ ...s, [def.key]: String(e.target.checked) }))}
                            className="w-4 h-4 rounded border-input accent-primary"
                          />
                          <Label htmlFor={`setting-${def.key}`} className="cursor-pointer font-normal">{def.label}</Label>
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor={`setting-${def.key}`}>{def.label}</Label>
                          <Input
                            id={`setting-${def.key}`}
                            type={def.type === "number" ? "number" : "text"}
                            value={settings[def.key] ?? def.value}
                            onChange={(e) => setSettings(s => ({ ...s, [def.key]: e.target.value }))}
                            className="mt-1"
                            disabled={loading}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {saved && (
            <div role="status" aria-live="polite" className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4" aria-hidden="true" /> Settings saved successfully!
            </div>
          )}

          <Button type="submit" disabled={saving || loading} className="bg-primary hover:bg-primary/90">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </div>
    </AdminShell>
  );
}