import AppShell from "@/components/layout/AppShell";

export default function Accessibility() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-sm max-w-none">
        <h1 className="font-heading text-4xl font-bold mb-6">Accessibility Statement</h1>
        <p className="text-muted-foreground text-lg mb-6">
          Inclusive Market is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards.
        </p>

        <h2 className="font-heading text-xl font-bold mt-8 mb-3">Conformance Status</h2>
        <p className="text-muted-foreground mb-4">
          Inclusive Market aims to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>. These guidelines explain how to make web content more accessible to people with disabilities.
        </p>

        <h2 className="font-heading text-xl font-bold mt-8 mb-3">Measures Taken</h2>
        <ul className="text-muted-foreground space-y-2 list-disc list-inside mb-4">
          <li>Semantic HTML with proper heading hierarchy</li>
          <li>ARIA labels and roles for interactive elements</li>
          <li>Keyboard navigability for all interactive features</li>
          <li>Skip navigation link for keyboard users</li>
          <li>Sufficient color contrast ratios</li>
          <li>Text alternatives for non-text content</li>
          <li>Responsive design for various screen sizes and zoom levels</li>
          <li>Live regions for dynamic content updates</li>
        </ul>

        <h2 className="font-heading text-xl font-bold mt-8 mb-3">Known Limitations</h2>
        <p className="text-muted-foreground mb-4">
          Some third-party content may not meet all accessibility standards. We are working to address these gaps.
        </p>

        <h2 className="font-heading text-xl font-bold mt-8 mb-3">Feedback & Contact</h2>
        <p className="text-muted-foreground">
          We welcome feedback on the accessibility of Inclusive Market. Please contact us at{" "}
          <a href="mailto:accessibility@inclusivemarket.ph" className="text-primary hover:underline">
            accessibility@inclusivemarket.ph
          </a>{" "}
          if you experience accessibility barriers.
        </p>
      </div>
    </AppShell>
  );
}