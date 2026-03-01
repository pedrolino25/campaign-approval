-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommentAuthorType" AS ENUM ('INTERNAL', 'REVIEWER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REVIEW_APPROVED', 'REVIEW_CHANGES_REQUESTED', 'REVIEW_COMMENT', 'REVIEW_ASSIGNED', 'INVITATION_SENT', 'INVITATION_ACCEPTED', 'INVITATION_CREATED');

-- CreateEnum
CREATE TYPE "ActivityLogAction" AS ENUM ('REVIEW_CREATED', 'REVIEW_UPDATED', 'REVIEW_APPROVED', 'REVIEW_CHANGES_REQUESTED', 'REVIEW_ARCHIVED', 'COMMENT_ADDED', 'COMMENT_DELETED', 'ATTACHMENT_UPLOADED', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'USER_INVITED', 'USER_JOINED', 'USER_UPDATED', 'ORGANIZATION_UPDATED', 'REMINDER_SENT');

-- CreateEnum
CREATE TYPE "InvitationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "InvitationType" AS ENUM ('INTERNAL_USER', 'REVIEWER');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "reminder_enabled" BOOLEAN NOT NULL DEFAULT true,
    "reminder_interval_days" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "cognito_user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "session_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewers" (
    "id" TEXT NOT NULL,
    "cognito_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "session_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "reviewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_reviewers" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "project_reviewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_items" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReviewStatus" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),
    "last_reminder_sent_at" TIMESTAMP(3),

    CONSTRAINT "review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "review_item_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "s3_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "review_item_id" TEXT NOT NULL,
    "author_type" "CommentAuthorType" NOT NULL,
    "author_user_id" TEXT,
    "author_reviewer_id" TEXT,
    "content" TEXT NOT NULL,
    "x_coordinate" DOUBLE PRECISION,
    "y_coordinate" DOUBLE PRECISION,
    "timestamp_seconds" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "reviewer_id" TEXT,
    "email" TEXT,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotency_key" TEXT,
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "review_item_id" TEXT,
    "actor_user_id" TEXT,
    "actor_reviewer_id" TEXT,
    "action" "ActivityLogAction" NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT,
    "email" TEXT NOT NULL,
    "role" "InvitationRole",
    "type" "InvitationType" NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "inviter_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizations_reminder_enabled_idx" ON "organizations"("reminder_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_user_id_key" ON "users"("cognito_user_id");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "users_cognito_user_id_idx" ON "users"("cognito_user_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_created_at_idx" ON "users"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "users_organization_id_archived_at_idx" ON "users"("organization_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviewers_cognito_user_id_key" ON "reviewers"("cognito_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviewers_email_key" ON "reviewers"("email");

-- CreateIndex
CREATE INDEX "reviewers_email_idx" ON "reviewers"("email");

-- CreateIndex
CREATE INDEX "projects_organization_id_idx" ON "projects"("organization_id");

-- CreateIndex
CREATE INDEX "projects_organization_id_created_at_idx" ON "projects"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "projects_organization_id_archived_at_idx" ON "projects"("organization_id", "archived_at");

-- CreateIndex
CREATE INDEX "project_reviewers_project_id_idx" ON "project_reviewers"("project_id");

-- CreateIndex
CREATE INDEX "project_reviewers_reviewer_id_idx" ON "project_reviewers"("reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_reviewers_project_id_reviewer_id_key" ON "project_reviewers"("project_id", "reviewer_id");

-- CreateIndex
CREATE INDEX "review_items_organization_id_idx" ON "review_items"("organization_id");

-- CreateIndex
CREATE INDEX "review_items_project_id_idx" ON "review_items"("project_id");

-- CreateIndex
CREATE INDEX "review_items_status_idx" ON "review_items"("status");

-- CreateIndex
CREATE INDEX "review_items_created_at_idx" ON "review_items"("created_at");

-- CreateIndex
CREATE INDEX "review_items_updated_at_idx" ON "review_items"("updated_at");

-- CreateIndex
CREATE INDEX "review_items_last_reminder_sent_at_idx" ON "review_items"("last_reminder_sent_at");

-- CreateIndex
CREATE INDEX "review_items_organization_id_status_idx" ON "review_items"("organization_id", "status");

-- CreateIndex
CREATE INDEX "review_items_organization_id_created_at_idx" ON "review_items"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "review_items_project_id_created_at_idx" ON "review_items"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "review_items_organization_id_status_archived_at_created_at_idx" ON "review_items"("organization_id", "status", "archived_at", "created_at");

-- CreateIndex
CREATE INDEX "review_items_organization_id_status_last_reminder_sent_at_idx" ON "review_items"("organization_id", "status", "last_reminder_sent_at");

-- CreateIndex
CREATE INDEX "review_items_project_id_archived_at_idx" ON "review_items"("project_id", "archived_at");

-- CreateIndex
CREATE INDEX "review_items_project_id_status_idx" ON "review_items"("project_id", "status");

-- CreateIndex
CREATE INDEX "attachments_review_item_id_idx" ON "attachments"("review_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_review_item_id_s3_key_key" ON "attachments"("review_item_id", "s3_key");

-- CreateIndex
CREATE INDEX "comments_review_item_id_idx" ON "comments"("review_item_id");

-- CreateIndex
CREATE INDEX "comments_review_item_id_created_at_idx" ON "comments"("review_item_id", "created_at");

-- CreateIndex
CREATE INDEX "comments_author_reviewer_id_idx" ON "comments"("author_reviewer_id");

-- CreateIndex
CREATE INDEX "comments_author_user_id_idx" ON "comments"("author_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_idempotency_key_key" ON "notifications"("idempotency_key");

-- CreateIndex
CREATE INDEX "notifications_organization_id_idx" ON "notifications"("organization_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_reviewer_id_idx" ON "notifications"("reviewer_id");

-- CreateIndex
CREATE INDEX "notifications_email_idx" ON "notifications"("email");

-- CreateIndex
CREATE INDEX "notifications_read_at_idx" ON "notifications"("read_at");

-- CreateIndex
CREATE INDEX "notifications_sent_at_idx" ON "notifications"("sent_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_organization_id_created_at_idx" ON "notifications"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_organization_id_read_at_idx" ON "notifications"("organization_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_organization_id_created_at_idx" ON "notifications"("user_id", "organization_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_organization_id_read_at_created_at_idx" ON "notifications"("user_id", "organization_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "notifications_reviewer_id_organization_id_created_at_idx" ON "notifications"("reviewer_id", "organization_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_reviewer_id_organization_id_read_at_created_a_idx" ON "notifications"("reviewer_id", "organization_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_organization_id_idx" ON "activity_logs"("organization_id");

-- CreateIndex
CREATE INDEX "activity_logs_review_item_id_idx" ON "activity_logs"("review_item_id");

-- CreateIndex
CREATE INDEX "activity_logs_actor_user_id_idx" ON "activity_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "activity_logs_actor_reviewer_id_idx" ON "activity_logs"("actor_reviewer_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "activity_logs_organization_id_created_at_idx" ON "activity_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_review_item_id_created_at_idx" ON "activity_logs"("review_item_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_organization_id_idx" ON "invitations"("organization_id");

-- CreateIndex
CREATE INDEX "invitations_project_id_idx" ON "invitations"("project_id");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_expires_at_idx" ON "invitations"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_organization_id_project_id_email_type_key" ON "invitations"("organization_id", "project_id", "email", "type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_reviewers" ADD CONSTRAINT "project_reviewers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_reviewers" ADD CONSTRAINT "project_reviewers_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_review_item_id_fkey" FOREIGN KEY ("review_item_id") REFERENCES "review_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_review_item_id_fkey" FOREIGN KEY ("review_item_id") REFERENCES "review_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_reviewer_id_fkey" FOREIGN KEY ("author_reviewer_id") REFERENCES "reviewers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_review_item_id_fkey" FOREIGN KEY ("review_item_id") REFERENCES "review_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_reviewer_id_fkey" FOREIGN KEY ("actor_reviewer_id") REFERENCES "reviewers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_user_id_fkey" FOREIGN KEY ("inviter_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

