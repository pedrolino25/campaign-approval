-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "sent_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "notifications_sent_at_idx" ON "notifications"("sent_at");
