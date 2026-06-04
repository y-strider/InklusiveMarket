import { Knex } from 'knex';
import { Order, OrderItem, Payment } from './entities';

export class OrdersRepository {
  constructor(private readonly db: Knex) {}

  async create(order: Omit<Order, 'createdAt' | 'updatedAt' | 'items'>, items: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt' | 'orderId'>[]): Promise<Order> {
    const id = order.id;
    await this.db('orders').insert({
      id,
      buyer_id: order.buyerId,
      seller_id: order.sellerId,
      status: order.status,
      subtotal_amount: order.subtotalAmount,
      shipping_amount: order.shippingAmount,
      tax_amount: order.taxAmount,
      discount_amount: order.discountAmount,
      total_amount: order.totalAmount,
      currency: order.currency,
      payment_status: order.paymentStatus,
      payment_provider: order.paymentProvider ?? null,
      payment_reference: order.paymentReference ?? null,
      shipping_address_line1: order.shippingAddressLine1,
      shipping_address_line2: order.shippingAddressLine2 ?? null,
      shipping_city: order.shippingCity,
      shipping_state: order.shippingState,
      shipping_postal_code: order.shippingPostalCode,
      shipping_country: order.shippingCountry,
      contact_full_name: order.contactFullName,
      contact_email: order.contactEmail,
      contact_phone: order.contactPhone ?? null,
      placed_at: order.placedAt ?? null,
      paid_at: order.paidAt ?? null,
      fulfilled_at: order.fulfilledAt ?? null,
      cancelled_at: order.cancelledAt ?? null,
      metadata: JSON.stringify(order.metadata),
      created_by: order.createdBy ?? null,
      updated_by: order.updatedBy ?? null
    });
    const itemRows = items.map((it) => ({
      id: this.db.raw('gen_random_uuid()'),
      order_id: id,
      product_id: it.productId,
      product_name: it.productName,
      product_sku: it.productSku ?? null,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      total_price: it.unitPrice * it.quantity,
      options: JSON.stringify(it.options)
    }));
    await this.db('order_items').insert(itemRows);
    return this.findById(id, true) as unknown as Order;
  }

  async addPayment(p: Omit<Payment, 'createdAt' | 'updatedAt'>): Promise<Payment> {
    await this.db('payments').insert({
      id: p.id,
      order_id: p.orderId,
      provider: p.provider,
      provider_payment_id: p.providerPaymentId ?? null,
      status: p.status,
      amount: p.amount,
      currency: p.currency,
      checkout_url: p.checkoutUrl ?? null,
      receipt_url: p.receiptUrl ?? null,
      raw: JSON.stringify(p.raw),
      authorized_at: p.authorizedAt ?? null,
      paid_at: p.paidAt ?? null,
      refunded_at: p.refundedAt ?? null,
      created_by: p.createdBy ?? null,
      updated_by: p.updatedBy ?? null
    });
    const row = await this.db('payments').where({ id: p.id }).first();
    return this.mapPayment(row);
  }

  async updateOrderPaymentStatus(orderId: string, paymentStatus: string, paymentProvider?: string | null, paymentReference?: string | null, paidAt?: string | null) {
    await this.db('orders').where({ id: orderId }).update({
      payment_status: paymentStatus,
      payment_provider: paymentProvider ?? null,
      payment_reference: paymentReference ?? null,
      paid_at: paidAt ?? null,
      updated_at: this.db.fn.now()
    });
  }

  async findById(id: string, withItems = false): Promise<Order | null> {
    const row = await this.db('orders').where({ id }).first();
    if (!row) return null;
    const order = this.mapOrder(row);
    if (withItems) {
      const items = await this.db('order_items').where({ order_id: id }).orderBy('created_at', 'asc');
      order.items = items.map(this.mapItem);
    }
    return order;
  }

  async listByUser(userId: string, role: 'buyer' | 'seller' | 'admin', q?: string, status?: string, page = 1, pageSize = 20) {
    const base = this.db('orders').select('*');
    if (role === 'buyer') base.where({ buyer_id: userId });
    if (role === 'seller') base.where({ seller_id: userId });
    if (q) {
      base.andWhere((b) => {
        b.whereILike('contact_full_name', `%${q}%`).orWhereILike('contact_email', `%${q}%`).orWhereILike('payment_reference', `%${q}%`);
      });
    }
    if (status) base.andWhere('status', status);
    const [{ count }] = await this.db('orders').count('* as count').modify((b) => {
      if (role === 'buyer') b.where({ buyer_id: userId });
      if (role === 'seller') b.where({ seller_id: userId });
      if (q) {
        b.andWhere((bb) => {
          bb.whereILike('contact_full_name', `%${q}%`).orWhereILike('contact_email', `%${q}%`).orWhereILike('payment_reference', `%${q}%`);
        });
      }
      if (status) b.andWhere('status', status);
    });
    const rows = await base.orderBy('created_at', 'desc').limit(pageSize).offset((page - 1) * pageSize);
    return {
      data: rows.map(this.mapOrder),
      total: Number(count),
      page,
      pageSize
    };
  }

  async logActivity(actorId: string | null, actorRole: string | null, entity: string, entityId: string, action: string, data: Record<string, unknown>) {
    await this.db('activities').insert({
      id: this.db.raw('gen_random_uuid()'),
      actor_id: actorId,
      actor_role: actorRole,
      entity,
      entity_id: entityId,
      action,
      data: JSON.stringify(data),
      created_at: this.db.fn.now()
    });
  }

  private mapOrder = (row: any) => ({
    id: row.id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    status: row.status,
    subtotalAmount: Number(row.subtotal_amount),
    shippingAmount: Number(row.shipping_amount),
    taxAmount: Number(row.tax_amount),
    discountAmount: Number(row.discount_amount),
    totalAmount: Number(row.total_amount),
    currency: row.currency,
    paymentStatus: row.payment_status,
    paymentProvider: row.payment_provider,
    paymentReference: row.payment_reference,
    shippingAddressLine1: row.shipping_address_line1,
    shippingAddressLine2: row.shipping_address_line2,
    shippingCity: row.shipping_city,
    shippingState: row.shipping_state,
    shippingPostalCode: row.shipping_postal_code,
    shippingCountry: row.shipping_country,
    contactFullName: row.contact_full_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    placedAt: row.placed_at ? new Date(row.placed_at).toISOString() : null,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    fulfilledAt: row.fulfilled_at ? new Date(row.fulfilled_at).toISOString() : null,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).toISOString() : null,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  });

  private mapItem = (row: any) => ({
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    productSku: row.product_sku,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
    options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  });

  private mapPayment = (row: any) => ({
    id: row.id,
    orderId: row.order_id,
    provider: row.provider,
    providerPaymentId: row.provider_payment_id,
    status: row.status,
    amount: Number(row.amount),
    currency: row.currency,
    checkoutUrl: row.checkout_url,
    receiptUrl: row.receipt_url,
    raw: typeof row.raw === 'string' ? JSON.parse(row.raw) : row.raw,
    authorizedAt: row.authorized_at ? new Date(row.authorized_at).toISOString() : null,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    refundedAt: row.refunded_at ? new Date(row.refunded_at).toISOString() : null,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  });
}
