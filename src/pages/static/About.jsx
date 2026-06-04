import AppShell from "@/components/layout/AppShell";
import { Heart, Users, Award } from "lucide-react";

export default function About() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-heading text-4xl font-bold mb-6">About Inclusive Market</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Inclusive Market is a dedicated e-commerce platform serving the AVRC (Abot-Kamay ang Rehabilitasyon sa Cavite) Region IX community — empowering persons with disabilities (PWDs) to showcase and sell their handcrafted goods to buyers across the Philippines.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[
            { icon: Heart, title: "Our Mission", desc: "To create economic opportunities for PWD artisans by providing a dignified marketplace for their talents." },
            { icon: Users, title: "Our Community", desc: "We support registered PWD members under AVRC Region IX, connecting them with buyers who value authentic craftsmanship." },
            { icon: Award, title: "Quality First", desc: "Every product undergoes admin review to ensure quality and authenticity before being listed on the platform." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-border rounded-2xl p-5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <h2 className="font-semibold mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <section className="bg-muted/50 rounded-2xl p-6">
          <h2 className="font-heading text-xl font-bold mb-3">Legal Compliance</h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Compliant with the Philippine Data Privacy Act (RA 10173)</li>
            <li>WCAG 2.1 Level AA accessibility standards</li>
            <li>Registered under the Department of Social Welfare and Development (DSWD)</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}