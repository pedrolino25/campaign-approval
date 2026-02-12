-- DropIndex
DROP INDEX "review_items_organization_id_status_updated_at_idx";

-- CreateIndex
CREATE INDEX "notifications_user_id_organization_id_created_at_idx" ON "notifications"("user_id", "organization_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_organization_id_read_at_created_at_idx" ON "notifications"("user_id", "organization_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "notifications_reviewer_id_organization_id_created_at_idx" ON "notifications"("reviewer_id", "organization_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_reviewer_id_organization_id_read_at_created_a_idx" ON "notifications"("reviewer_id", "organization_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "review_items_organization_id_status_archived_at_created_at_idx" ON "review_items"("organization_id", "status", "archived_at", "created_at");
