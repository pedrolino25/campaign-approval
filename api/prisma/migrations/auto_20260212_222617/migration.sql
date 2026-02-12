-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "idempotency_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "invitations_organization_id_client_id_email_type_key" ON "invitations"("organization_id", "client_id", "email", "type");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_idempotency_key_key" ON "notifications"("idempotency_key");
