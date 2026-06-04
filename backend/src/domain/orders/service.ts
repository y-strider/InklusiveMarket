import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { OrdersRepository } from './repository';
import { CreateOrderSchema, CreateCheckoutSchema, UpdateOrderStatusSchema } from './validation';
import { Order, Payment } from './entities';
import { PaymentProvider } from '../payments/PaymentProvider';

export class OrdersService {
  constructor(private readonly repo: OrdersRepository, private readonly payment: PaymentProvider) {}

  async createOrder(input: unknown, actorId: string): Promise<Order> {
    const dto = CreateOrderSchema.parse(input);
    const subtotal = dto.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    const shipping = 0;
    const tax = 0;
    const discount = 0;
    const total = subtotal + shipping + tax - discount;
    const order: Omit<Order, 'items' | 'createdAt' | 'updatedAt'> = {
      id: randomUUID(),
      buyerId: dto.buyerId,
      sellerId: dto.sellerId,
      status: 'placed',
      subtotalAmount: subtotal,
      shippingAmount: shipping,
      taxAmount: tax,
      discountAmount: discount,
      totalAmount: total,
      currency: dto.currency,
      paymentStatus: 'unpaid',
      paymentProvider: null,
      paymentReference: null,
      shippingAddressLine1: dto.shipping.line1,
      shippingAddressLine2: dto.shipping.line2 ?? null,
      shippingCity: dto.shipping.city,
      shippingState: dto.shipping.state,
      shippingPostalCode: dto.shipping.postalCode,
      shippingCountry: dto.shipping.country,
      contactFullName: dto.contact.fullName,
      contactEmail: dto.contact.email,
      contactPhone: dto.contact.phone ?? null,
      placedAt: new Date().toISOString(),
      paidAt: null,
      fulfilledAt: null,
      cancelledAt: null,
      metadata: dto.metadata,
      createdBy: actorId,
      updatedBy: actorId
    };
    const items = dto.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      productSku: it.productSku ?? null,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      options: it.options
    }));
    const created = await this.repo.create(order, items);
    await this.repo.logActivity(actorId, 'buyer', 'order', created.id, 'order.created', { total });
    return created;
  }

  async createCheckout(input: unknown, actorId: string): Promise<{ payment: Payment; checkoutUrl: string | null; message?: string }> {
    const dto = CreateCheckoutSchema.parse(input);
    const order = await this.repo.findById(dto.orderId, true);
    if (!order) throw new Error('Order not found');
    if (order.paymentStatus === 'paid') return { payment: await this.createPaymentRecord(order, null, 'paid', order.totalAmount, order.currency, {}), checkoutUrl: null };
    const ck = await this.payment.createCheckout({
      orderId: order.id,
      amount: order.totalAmount,
      currency: order.currency,
      description: 'Order ' + order.id,
      returnUrl: dto.returnUrl,
      cancelUrl: dto.cancelUrl,
      buyerEmail: order.contactEmail
    });
    const payment = await this.createPaymentRecord(order, ck.providerPaymentId, ck.status === 'pending' ? 'pending' : 'failed', order.totalAmount, order.currency, ck.raw, ck.checkoutUrl ?? null);
    await this.repo.updateOrderPaymentStatus(order.id, ck.status === 'pending' ? 'pending' : 'failed', this.payment.name(), ck.providerPaymentId, null);
    await this.repo.logActivity(actorId, 'buyer', 'order', order.id, 'payment.checkout.created', { provider: this.payment.name(), status: ck.status });
    const message = ck.checkoutUrl ? undefined : (ck.raw?.message as string | undefined);
    return { payment, checkoutUrl: ck.checkoutUrl, message };
  }

  async handleWebhook(headers: Record<string, string | string[] | undefined>, body: unknown) {
    const parsed = await this.payment.parseWebhook(headers, body);
    const orderId = (parsed.orderReference as string | null) ?? null;
    if (!orderId && !parsed.providerPaymentId) return { ok: true };
    let order = orderId ? await this.repo.findById(orderId, true) : null;
    if (order) {
      await this.syncPaymentForOrder(order.id, parsed.status, parsed.providerPaymentId ?? null, parsed.amount, parsed.currency, parsed.raw);
      return { ok: true };
    }
    if (parsed.providerPaymentId) {
      const updated = await this.payment.fetchStatus(parsed.providerPaymentId);
      return { ok: true, status: updated.status };
    }
    return { ok: true };
  }

  async syncPaymentForOrder(orderId: string, newStatus: string, providerPaymentId: string | null, amount?: number, currency?: string, raw?: Record<string, unknown>) {
    const order = await this.repo.findById(orderId, true);
    if (!order) return;
    let mapped: 'unpaid' | 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'voided' = 'pending';
    if (newStatus === 'paid') mapped = 'paid';
    else if (newStatus === 'authorized') mapped = 'authorized';
    else if (newStatus === 'refunded') mapped = 'refunded';
    else if (newStatus === 'voided') mapped = 'voided';
    else if (newStatus === 'failed') mapped = 'failed';
    const payment: Payment = {
      id: randomUUID(),
      orderId: order.id,
      provider: this.payment.name(),
      providerPaymentId,
      status: mapped,
      amount: amount ?? order.totalAmount,
      currency: (currency ?? order.currency).toUpperCase(),
      checkoutUrl: order.paymentReference ? null : null,
      receiptUrl: null,
      raw: raw ?? {},
      authorizedAt: mapped === 'authorized' ? new Date().toISOString() : null,
      paidAt: mapped === 'paid' ? new Date().toISOString() : null,
      refundedAt: mapped === 'refunded' ? new Date().toISOString() : null,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.repo.addPayment(payment);
    await this.repo.updateOrderPaymentStatus(order.id, mapped, this.payment.name(), providerPaymentId, mapped === 'paid' ? payment.paidAt! : null);
    await this.repo.logActivity(null, 'system', 'order', order.id, 'payment.status.synced', { status: mapped });
  }

  private async createPaymentRecord(order: Order, providerPaymentId: string | null, status: Payment['status'], amount: number, currency: string, raw: Record<string, unknown>, checkoutUrl: string | null = null) {
    const p: Payment = {
      id: randomUUID(),
      orderId: order.id,
      provider: this.payment.name(),
      providerPaymentId,
      status,
      amount,
      currency: currency.toUpperCase(),
      checkoutUrl,
      receiptUrl: null,
      raw,
      authorizedAt: null,
      paidAt: null,
      refundedAt: null,
      createdBy: order.buyerId,
      updatedBy: order.buyerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const saved = await this.repo.addPayment(p);
    return saved;
  }

  async updateOrderStatus(orderId: string, input: unknown, actorId: string, role: 'seller' | 'admin') {
    const dto = UpdateOrderStatusSchema.parse(input);
    const order = await this.repo.findById(orderId, true);
    if (!order) throw new Error('Order not found');
    const allowed: Record<typeof dto.status, ('seller' | 'admin')[]> = {
      placed: ['admin'],
      paid: ['admin'],
      fulfilled: ['seller', 'admin'],
      cancelled: ['seller', 'admin']
    } as any;
    const can = (allowed as any)[dto.status]?.includes(role);
    if (!can) throw new Error('Forbidden');
    await (this.repo as any).db('orders').where({ id: orderId }).update({ status: dto.status, updated_at: (this.repo as any).db.fn.now() });
    await this.repo.logActivity(actorId, role, 'order', orderId, 'order.status.updated', { status: dto.status });
    return await this.repo.findById(orderId, true);
  }
}
