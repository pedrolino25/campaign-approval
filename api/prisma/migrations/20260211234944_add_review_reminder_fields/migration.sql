-- AlterEnum
ALTER TYPE "ActivityLogAction" ADD VALUE 'REMINDER_SENT';

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "reminder_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "organizations" ADD COLUMN "reminder_interval_days" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "review_items" ADD COLUMN "last_reminder_sent_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "organizations_reminder_enabled_idx" ON "organizations"("reminder_enabled");

-- CreateIndex
-- Note: Using "updatedAt" (camelCase) because column rename happens in later migration
CREATE INDEX "review_items_updatedAt_idx" ON "review_items"("updatedAt");

-- CreateIndex
CREATE INDEX "review_items_last_reminder_sent_at_idx" ON "review_items"("last_reminder_sent_at");

-- CreateIndex
-- Note: Using "updatedAt" (camelCase) because column rename happens in later migration
CREATE INDEX "review_items_organization_id_status_updatedAt_idx" ON "review_items"("organization_id", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "review_items_organization_id_status_last_reminder_sent_at_idx" ON "review_items"("organization_id", "status", "last_reminder_sent_at");
