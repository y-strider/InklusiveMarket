import { Database } from "sqlite";
import { randomUUID } from "crypto";
import { CreatePaymentRecordInput, PaymentRecord, UpdatePaymentRecordInput } from "./PaymentModels";

export class PaymentRepository {
  constructor(private db: Database) {}

  async create(input: CreatePaymentRecordInput): Promise<PaymentRecord> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const metadata = JSON.stringify(input.metadata || {});
    await this.db.run(
      "INSERT INTO payments (id, order_id, user_id, amount, currency, provider, status, description, metadata, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      id,
      input.orderId,
      input.userId,
      Math.round(input.amount),
      input.currency,
      "paymongo",
      "pending",
      input.description || null,
      metadata,
      now,
      now
    );
    return this.findById(id);
  }

  async update(input: UpdatePaymentRecordInput): Promise<PaymentRecord> {
    const existing = await this.findById(input.id);
    const merged = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    await this.db.run(
      "UPDATE payments SET amount=?, currency=?, intent_id=?, provider=?, status=?, description=?, error_message=?, metadata=?, updated_at=? WHERE id=?",
      Math.round(merged.amount),
      merged.currency,
      merged.intentId || null,
      merged.provider,
      merged.status,
      merged.description || null,
      merged.errorMessage || null,
      JSON.stringify(merged.metadata || {}),
      merged.updatedAt,
      merged.id
    );
    return this.findById(merged.id);
  }

  async findById(id: string): Promise<PaymentRecord> {
    const row = await this.db.get("SELECT * FROM payments WHERE id = ?", id);
    return this.map(row);
  }

  async findByOrderId(orderId: string): Promise<PaymentRecord[]> {
    const rows = await this.db.all("SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC", orderId);
    return rows.map(this.map);
  }

  async findAllByUser(userId: string, limit: number, offset: number, q?: string): Promise<{ data: PaymentRecord[]; total: number }> {
    const params: any[] = [userId];
    let where = "WHERE user_id = ?";
    if (q && q.trim().length > 0) {
      where += " AND (id LIKE ? OR order_id LIKE ? OR status LIKE ?)";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const totalRow = await this.db.get(`SELECT COUNT(*) as c FROM payments ${where}`, ...params);
    params.push(limit, offset);
    const rows = await this.db.all(
      `SELECT * FROM payments ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      ...params
    );
    return { data: rows.map(this.map), total: totalRow.c as number };
  }

  private map = (row: any): PaymentRecord => {
    return {
      id: row.id,
      orderId: row.order_id,
      userId: row.user_id,
      amount: row.amount,
      currency: row.currency,
      intentId: row.intent_id,
      provider: row.provider,
      status: row.status,
      description: row.description,
      errorMessage: row.error_message,
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  };
}
