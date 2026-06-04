import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasOrders = await knex.schema.hasTable('orders');
  if (!hasOrders) {
    await knex.schema.createTable('orders', (t) => {
      t.uuid('id').primary();
      t.uuid('buyer_id').notNullable().index();
      t.uuid('seller_id').notNullable().index();
      t.string('status', 32).notNullable().index();
      t.decimal('subtotal_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('shipping_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('tax_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
      t.decimal('total_amount', 12, 2).notNullable().defaultTo(0);
      t.string('currency', 8).notNullable().defaultTo('PHP');
      t.string('payment_status', 32).notNullable().index();
      t.string('payment_provider', 64).nullable();
      t.string('payment_reference', 128).nullable().index();
      t.string('shipping_address_line1').notNullable();
      t.string('shipping_address_line2').nullable();
      t.string('shipping_city').notNullable();
      t.string('shipping_state').notNullable();
      t.string('shipping_postal_code').notNullable();
      t.string('shipping_country').notNullable().defaultTo('PH');
      t.string('contact_full_name').notNullable();
      t.string('contact_email').notNullable().index();
      t.string('contact_phone').nullable();
      t.timestamp('placed_at').nullable().index();
      t.timestamp('paid_at').nullable().index();
      t.timestamp('fulfilled_at').nullable().index();
      t.timestamp('cancelled_at').nullable().index();
      t.jsonb('metadata').notNullable().defaultTo('{}');
      t.uuid('created_by').nullable();
      t.uuid('updated_by').nullable();
      t.timestamps(true, true);
    });
  }

  const hasOrderItems = await knex.schema.hasTable('order_items');
  if (!hasOrderItems) {
    await knex.schema.createTable('order_items', (t) => {
      t.uuid('id').primary();
      t.uuid('order_id').notNullable().index().references('id').inTable('orders').onDelete('CASCADE');
      t.uuid('product_id').notNullable().index();
      t.string('product_name').notNullable();
      t.string('product_sku').nullable();
      t.integer('quantity').notNullable().defaultTo(1);
      t.decimal('unit_price', 12, 2).notNullable().defaultTo(0);
      t.decimal('total_price', 12, 2').notNullable().defaultTo(0);
      t.jsonb('options').notNullable().defaultTo('{}');
      t.timestamps(true, true);
    });
  }

  const hasPayments = await knex.schema.hasTable('payments');
  if (!hasPayments) {
    await knex.schema.createTable('payments', (t) => {
      t.uuid('id').primary();
      t.uuid('order_id').notNullable().index().references('id').inTable('orders').onDelete('CASCADE');
      t.string('provider', 64).notNullable().index();
      t.string('provider_payment_id', 128).nullable().index();
      t.string('status', 32).notNullable().index();
      t.decimal('amount', 12, 2).notNullable();
      t.string('currency', 8).notNullable().defaultTo('PHP');
      t.string('checkout_url').nullable();
      t.string('receipt_url').nullable();
      t.jsonb('raw').notNullable().defaultTo('{}');
      t.timestamp('authorized_at').nullable();
      t.timestamp('paid_at').nullable();
      t.timestamp('refunded_at').nullable();
      t.uuid('created_by').nullable();
      t.uuid('updated_by').nullable();
      t.timestamps(true, true);
    });
  }

  const hasActivities = await knex.schema.hasTable('activities');
  if (!hasActivities) {
    await knex.schema.createTable('activities', (t) => {
      t.uuid('id').primary();
      t.uuid('actor_id').nullable().index();
      t.string('actor_role', 32).nullable();
      t.string('entity', 64).notNullable().index();
      t.uuid('entity_id').notNullable().index();
      t.string('action', 64).notNullable().index();
      t.jsonb('data').notNullable().defaultTo('{}');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now()).index();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('activities');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
}
