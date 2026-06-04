import React from "react";

export function CheckoutNotice({ availability }: { availability: string | null }) {
  if (!availability) return null;
  return (
    <div role="alert" aria-live="assertive" className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-yellow-900 focus:outline-none" tabIndex={0}>
      <span className="font-medium">Payment unavailable:</span> {availability}
    </div>
  );
}
