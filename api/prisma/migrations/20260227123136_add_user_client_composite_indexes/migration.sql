-- CreateIndex
CREATE INDEX "users_organization_id_created_at_idx" ON "users"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "users_organization_id_archived_at_idx" ON "users"("organization_id", "archived_at");

-- CreateIndex
CREATE INDEX "clients_organization_id_archived_at_idx" ON "clients"("organization_id", "archived_at");
