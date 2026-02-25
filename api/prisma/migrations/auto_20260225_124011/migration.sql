-- CreateIndex
CREATE UNIQUE INDEX "attachments_review_item_id_s3_key_key" ON "attachments"("review_item_id", "s3_key");
