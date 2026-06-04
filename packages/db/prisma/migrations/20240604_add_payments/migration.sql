/* New-Item -ItemType File -Force -Path packages/db/prisma/migrations/20240604_add_payments/migration.sql add payments table with indexes and relations */

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'PHP',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "buyerId" TEXT,
  "sellerId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'paymongo',
  "providerPaymentId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_buyerId_idx" ON "Payment"("buyerId");
CREATE INDEX "Payment_sellerId_idx" ON "Payment"("sellerId");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
