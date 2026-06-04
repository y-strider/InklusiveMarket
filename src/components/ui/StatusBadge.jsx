const STATUS_STYLES = {
  // Order statuses
  pending:    "bg-amber-100 text-amber-800",
  confirmed:  "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  completed:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
  refunded:   "bg-gray-100 text-gray-700",
  // Payment statuses
  paid:                "bg-green-100 text-green-800",
  unpaid:              "bg-amber-100 text-amber-800",
  failed:              "bg-red-100 text-red-800",
  partially_refunded:  "bg-orange-100 text-orange-800",
  // Product / seller statuses
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  verified: "bg-blue-100 text-blue-800",
  active:   "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-700",
};

const LABEL = {
  partially_refunded: "Partial Refund",
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700";
  const label = LABEL[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {label}
    </span>
  );
}