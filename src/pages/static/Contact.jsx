import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, CheckCircle } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-heading text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-muted-foreground text-lg mb-10">Have a question or concern? We're here to help.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact info */}
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-bold">Get in Touch</h2>
            {[
              { icon: Mail, label: "Email", value: "info@inclusivemarket.ph", href: "mailto:info@inclusivemarket.ph" },
              { icon: Phone, label: "Phone", value: "+63 62 123 4567", href: "tel:+63621234567" },
              { icon: MapPin, label: "Address", value: "AVRC Region IX, Zamboanga City, Philippines" },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  {href ? (
                    <a href={href} className="text-muted-foreground hover:text-primary transition-colors text-sm">{value}</a>
                  ) : (
                    <p className="text-muted-foreground text-sm">{value}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
              <p className="text-sm text-amber-800">
                <strong>Data Privacy (RA 10173):</strong> Information submitted through this form is used solely to respond to your inquiry and is protected under the Philippine Data Privacy Act.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white border border-border rounded-2xl p-6">
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" aria-hidden="true" />
                <h2 className="font-heading text-xl font-bold mb-2">Message Sent!</h2>
                <p className="text-muted-foreground text-sm">We'll get back to you within 1–2 business days.</p>
                <Button variant="outline" className="mt-4" onClick={() => { setForm({ name: "", email: "", subject: "", message: "" }); setSent(false); }}>Send Another</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-label="Contact form">
                <div className="grid grid-cols-2 gap-4">
                  {[["name", "Full Name", "text"], ["email", "Email", "email"]].map(([id, label, type]) => (
                    <div key={id}>
                      <Label htmlFor={id}>{label} <span className="text-destructive" aria-label="required">*</span></Label>
                      <Input id={id} type={type} required value={form[id]} onChange={(e) => setForm(f => ({ ...f, [id]: e.target.value }))} className="mt-1" />
                    </div>
                  ))}
                </div>
                <div>
                  <Label htmlFor="subject">Subject <span className="text-destructive" aria-label="required">*</span></Label>
                  <Input id="subject" required value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="message">Message <span className="text-destructive" aria-label="required">*</span></Label>
                  <textarea id="message" required value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <Button type="submit" className="w-full">Send Message</Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}