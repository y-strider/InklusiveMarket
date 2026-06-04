import { z } from 'zod';

export const AddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(2).max(3)
});

export const ContactSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable()
});

export const OrderItemInputSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1),
  productSku: z.string().optional().nullable(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().nonnegative(),
  options: z.record(z.any()).default({})
});

export const CreateOrderSchema = z.object({
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  items: z.array(OrderItemInputSchema).min(1),
  shipping: AddressSchema,
  contact: ContactSchema,
  currency: z.string().default('PHP'),
  metadata: z.record(z.any()).default({})
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['placed', 'paid', 'fulfilled', 'cancelled'])
});

export const CreateCheckoutSchema = z.object({
  orderId: z.string().uuid(),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url()
});
