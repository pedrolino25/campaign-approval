-- CreateEnum
CREATE TYPE "InvitationType" AS ENUM ('INTERNAL_USER', 'REVIEWER');

-- DropIndex
DROP INDEX "client_reviewers_client_id_cognito_user_id_idx";

-- DropIndex
DROP INDEX "client_reviewers_cognito_user_id_idx";

-- DropIndex
DROP INDEX "client_reviewers_email_idx";

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "actor_reviewer_id" TEXT;

-- AlterTable
ALTER TABLE "client_reviewers" DROP COLUMN "cognito_user_id",
DROP COLUMN "email",
ADD COLUMN     "reviewer_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "author_email",
ADD COLUMN     "author_reviewer_id" TEXT;

-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "client_id" TEXT,
ADD COLUMN     "type" "InvitationType" NOT NULL,
ALTER COLUMN "role" DROP NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "reviewer_id" TEXT;

-- CreateTable
CREATE TABLE "reviewers" (
    "id" TEXT NOT NULL,
    "cognito_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "reviewers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviewers_cognito_user_id_key" ON "reviewers"("cognito_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviewers_email_key" ON "reviewers"("email");

-- CreateIndex
CREATE INDEX "reviewers_email_idx" ON "reviewers"("email");

-- CreateIndex
CREATE INDEX "activity_logs_actor_reviewer_id_idx" ON "activity_logs"("actor_reviewer_id");

-- CreateIndex
CREATE INDEX "client_reviewers_reviewer_id_idx" ON "client_reviewers"("reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_reviewers_client_id_reviewer_id_key" ON "client_reviewers"("client_id", "reviewer_id");

-- CreateIndex
CREATE INDEX "comments_author_reviewer_id_idx" ON "comments"("author_reviewer_id");

-- CreateIndex
CREATE INDEX "comments_author_user_id_idx" ON "comments"("author_user_id");

-- CreateIndex
CREATE INDEX "invitations_client_id_idx" ON "invitations"("client_id");

-- CreateIndex
CREATE INDEX "notifications_reviewer_id_idx" ON "notifications"("reviewer_id");

-- CreateIndex
CREATE INDEX "review_items_client_id_archived_at_idx" ON "review_items"("client_id", "archived_at");

-- CreateIndex
CREATE INDEX "review_items_client_id_status_idx" ON "review_items"("client_id", "status");

-- AddForeignKey
ALTER TABLE "client_reviewers" ADD CONSTRAINT "client_reviewers_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_reviewer_id_fkey" FOREIGN KEY ("author_reviewer_id") REFERENCES "reviewers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_reviewer_id_fkey" FOREIGN KEY ("actor_reviewer_id") REFERENCES "reviewers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
