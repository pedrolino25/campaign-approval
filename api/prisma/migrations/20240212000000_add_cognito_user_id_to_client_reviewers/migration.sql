-- AlterTable
ALTER TABLE "client_reviewers" ADD COLUMN "cognito_user_id" TEXT NOT NULL DEFAULT '';
ALTER TABLE "client_reviewers" ADD COLUMN "archived_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "client_reviewers_cognito_user_id_idx" ON "client_reviewers"("cognito_user_id");

-- CreateIndex
CREATE INDEX "client_reviewers_client_id_cognito_user_id_idx" ON "client_reviewers"("client_id", "cognito_user_id");

-- Remove default after data migration (if needed)
-- Note: In production, you may need to backfill cognito_user_id for existing reviewers
-- before removing the default. For new systems, this default can be removed immediately.
-- ALTER TABLE "client_reviewers" ALTER COLUMN "cognito_user_id" DROP DEFAULT;
