CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerSessionId" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "adminNote" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Payment_order_idx" ON "Payment" ("orderId");
CREATE INDEX IF NOT EXISTS "Payment_buyer_idx" ON "Payment" ("buyerId");
CREATE INDEX IF NOT EXISTS "Payment_seller_idx" ON "Payment" ("sellerId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment" ("status");
CREATE INDEX IF NOT EXISTS "Payment_provider_idx" ON "Payment" ("provider");

CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "details" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ActivityLog_actor_idx" ON "ActivityLog" ("actorId");
CREATE INDEX IF NOT EXISTS "ActivityLog_subject_idx" ON "ActivityLog" ("subjectId");
