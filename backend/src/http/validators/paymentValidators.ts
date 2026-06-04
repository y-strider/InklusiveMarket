import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().min(1),
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.literal("PHP"),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export const beginCheckoutSchema = z.object({
  paymentId: z.string().uuid(),
  methods: z.array(z.enum(["gcash", "grab_pay", "paymaya", "card"])).min(1),
  returnUrl: z.string().url(),
});

export const attachMethodSchema = z.object({
  paymentId: z.string().uuid(),
  paymentMethodId: z.string().min(1),
});

export const listPaymentsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().optional(),
});
