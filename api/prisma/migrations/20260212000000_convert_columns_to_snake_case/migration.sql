-- Rename all camelCase columns to snake_case for consistency

-- Organizations table
ALTER TABLE "organizations" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "organizations" RENAME COLUMN "updatedAt" TO "updated_at";

-- Users table
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";

-- Clients table
ALTER TABLE "clients" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "clients" RENAME COLUMN "updatedAt" TO "updated_at";

-- Client reviewers table
ALTER TABLE "client_reviewers" RENAME COLUMN "createdAt" TO "created_at";

-- Review items table
ALTER TABLE "review_items" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "review_items" RENAME COLUMN "updatedAt" TO "updated_at";

-- Attachments table
ALTER TABLE "attachments" RENAME COLUMN "createdAt" TO "created_at";

-- Comments table
ALTER TABLE "comments" RENAME COLUMN "createdAt" TO "created_at";

-- Notifications table
ALTER TABLE "notifications" RENAME COLUMN "createdAt" TO "created_at";

-- Activity logs table
ALTER TABLE "activity_logs" RENAME COLUMN "createdAt" TO "created_at";

-- Invitations table
ALTER TABLE "invitations" RENAME COLUMN "createdAt" TO "created_at";

-- Drop old indexes that reference camelCase columns
DROP INDEX IF EXISTS "review_items_createdAt_idx";
DROP INDEX IF EXISTS "review_items_organization_id_createdAt_idx";
DROP INDEX IF EXISTS "notifications_createdAt_idx";
DROP INDEX IF EXISTS "activity_logs_createdAt_idx";
DROP INDEX IF EXISTS "review_items_updatedAt_idx";
DROP INDEX IF EXISTS "review_items_organization_id_status_updatedAt_idx";

-- Recreate indexes with snake_case column names
CREATE INDEX "review_items_created_at_idx" ON "review_items"("created_at");
CREATE INDEX "review_items_organization_id_created_at_idx" ON "review_items"("organization_id", "created_at");
CREATE INDEX "review_items_updated_at_idx" ON "review_items"("updated_at");
CREATE INDEX "review_items_organization_id_status_updated_at_idx" ON "review_items"("organization_id", "status", "updated_at");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");
