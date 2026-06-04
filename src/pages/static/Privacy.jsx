import AppShell from "@/components/layout/AppShell";

export default function Privacy() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-heading text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2025</p>

        {[
          {
            title: "1. Data Collection",
            content: "We collect personal information you provide during registration (name, email address) and transaction details required to process orders. We collect only data necessary for the functioning of the platform."
          },
          {
            title: "2. Legal Basis (RA 10173)",
            content: "Your data is processed in accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173). We are registered with the National Privacy Commission (NPC) and comply with all applicable data protection requirements."
          },
          {
            title: "3. Use of Your Data",
            content: "Your data is used to: process and fulfill orders, communicate order status updates, improve platform services, and comply with legal obligations. We do not sell your personal data to third parties."
          },
          {
            title: "4. Data Retention",
            content: "We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting our Data Privacy Officer."
          },
          {
            title: "5. Your Rights",
            content: "Under RA 10173, you have the right to: access your personal data, correct inaccurate data, object to processing, request erasure, and file a complaint with the NPC."
          },
          {
            title: "6. Security",
            content: "We implement appropriate technical and organizational measures to protect your data against unauthorized access, loss, or disclosure."
          },
          {
            title: "7. Contact",
            content: "For data privacy concerns, contact our Data Privacy Officer at dpo@inclusivemarket.ph."
          },
        ].map(section => (
          <section key={section.title} className="mb-6">
            <h2 className="font-heading text-lg font-bold mb-2">{section.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{section.content}</p>
          </section>
        ))}
      </div>
    </AppShell>
  );
}