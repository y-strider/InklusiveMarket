import AppShell from "@/components/layout/AppShell";

export default function Terms() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-heading text-4xl font-bold mb-3">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective: June 2025</p>

        {[
          { title: "1. Acceptance of Terms", content: "By accessing and using Inclusive Market, you agree to be bound by these Terms of Service and all applicable laws and regulations." },
          { title: "2. Platform Use", content: "Inclusive Market is an e-commerce platform exclusively for products created by registered PWD artisans under AVRC Region IX. Misrepresentation of seller status is grounds for immediate account termination." },
          { title: "3. Buyer Responsibilities", content: "Buyers are responsible for providing accurate delivery information and timely payment. Orders are binding once confirmed." },
          { title: "4. Seller Responsibilities", content: "Sellers must accurately describe their products, maintain adequate stock levels, and fulfill orders promptly. All products are subject to admin review before listing." },
          { title: "5. Prohibited Activities", content: "Users may not: impersonate others, upload false or misleading product information, engage in fraudulent transactions, or violate any applicable Philippine laws." },
          { title: "6. Intellectual Property", content: "All content on this platform, including product listings, images, and descriptions, remains the property of the respective sellers. Platform design and code are owned by Inclusive Market." },
          { title: "7. Limitation of Liability", content: "Inclusive Market serves as an intermediary marketplace. We are not responsible for the quality, safety, or legality of listed items beyond our stated review process." },
          { title: "8. Governing Law", content: "These terms are governed by the laws of the Republic of the Philippines. Disputes shall be resolved in the courts of Zamboanga City." },
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