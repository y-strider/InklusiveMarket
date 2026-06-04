import React from "react";

type Props = {
  status: "pending" | "processing" | "paid" | "failed" | "refunded" | "voided" | "expired" | "canceled";
};

export default function PaymentBadge({ status }: Props) {
  const color = (() => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-300";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "failed":
      case "voided":
      case "expired":
      case "canceled":
        return "bg-red-100 text-red-800 border-red-300";
      case "refunded":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  })();
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}
