CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL CHECK (currency = 'PHP'),
  intent_id TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('paymongo')),
  status TEXT NOT NULL CHECK (status IN ('pending','awaiting_payment_method','processing','succeeded','failed','canceled')),
  description TEXT,
  error_message TEXT,
  metadata JSON NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
