import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, User } from "lucide-react";

export default function BuyerProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name || "", phone: user.phone || "" });
  }, [user]);

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await base44.auth.updateMe({ phone: form.phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-heading text-3xl font-bold mb-8 flex items-center gap-3">
          <User className="w-7 h-7 text-primary" aria-hidden="true" /> My Profile
        </h1>

        <div className="bg-white border border-border rounded-2xl p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary" aria-hidden="true">
              {user?.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.full_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize font-medium">{user?.role}</span>
            </div>
          </div>

          <form onSubmit={handleSave} noValidate className="space-y-4" aria-label="Edit profile form">
            <div>
              <Label htmlFor="profile-name">Full Name <span className="text-destructive" aria-label="required">*</span></Label>
              <Input
                id="profile-name"
                value={form.full_name}
                onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                className={`mt-1 ${errors.full_name ? "border-destructive" : ""}`}
                aria-invalid={!!errors.full_name}
                aria-describedby={errors.full_name ? "name-err" : undefined}
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Name is managed by your Google account.</p>
              {errors.full_name && <p id="name-err" role="alert" className="text-xs text-destructive mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <Label htmlFor="profile-email">Email Address</Label>
              <Input id="profile-email" type="email" value={user?.email || ""} className="mt-1 bg-muted" disabled aria-readonly="true" />
              <p className="text-xs text-muted-foreground mt-1">Email is managed by your Google account.</p>
            </div>

            <div>
              <Label htmlFor="profile-phone">Phone Number</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className="mt-1"
                placeholder="+63 900 000 0000"
                aria-describedby="phone-hint"
              />
              <p id="phone-hint" className="text-xs text-muted-foreground mt-1">Used for order delivery contact.</p>
            </div>

            {saved && (
              <div role="status" aria-live="polite" className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4" aria-hidden="true" /> Profile updated successfully!
              </div>
            )}

            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Data Privacy (RA 10173):</strong> Your personal data is protected under the Philippine Data Privacy Act.
            You may request data access or deletion by contacting our{" "}
            <a href="/contact" className="underline hover:text-amber-900">support team</a>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}