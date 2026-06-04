export type UserRole = "buyer" | "seller" | "admin";

export const canViewPayment = (role: UserRole) => role === "buyer" || role === "seller" || role === "admin";
export const canManagePayments = (role: UserRole) => role === "admin";
