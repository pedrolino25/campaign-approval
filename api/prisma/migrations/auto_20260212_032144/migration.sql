-- CreateIndex
CREATE INDEX "activity_logs_organization_id_created_at_idx" ON "activity_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_review_item_id_created_at_idx" ON "activity_logs"("review_item_id", "created_at");

-- CreateIndex
CREATE INDEX "clients_organization_id_created_at_idx" ON "clients"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "comments_review_item_id_created_at_idx" ON "comments"("review_item_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_organization_id_created_at_idx" ON "notifications"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_organization_id_read_at_idx" ON "notifications"("organization_id", "read_at");

-- CreateIndex
CREATE INDEX "review_items_client_id_created_at_idx" ON "review_items"("client_id", "created_at");
