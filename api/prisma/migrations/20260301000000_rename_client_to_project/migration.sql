-- Rename Client -> Project, ClientReviewer -> ProjectReviewer
-- Tables: clients -> projects, client_reviewers -> project_reviewers
-- Columns: client_id -> project_id where applicable
-- Enum: ActivityLogAction CLIENT_* -> PROJECT_*

-- 1. Rename table clients to projects
ALTER TABLE "clients" RENAME TO "projects";
-- Index on clients moves with table; rename for consistency
ALTER INDEX IF EXISTS "clients_organization_id_archived_at_idx" RENAME TO "projects_organization_id_archived_at_idx";
ALTER INDEX IF EXISTS "clients_organization_id_created_at_idx" RENAME TO "projects_organization_id_created_at_idx";

-- 2. Drop indexes on client_reviewers that use client_id (before column rename)
DROP INDEX IF EXISTS "client_reviewers_client_id_reviewer_id_key";
DROP INDEX IF EXISTS "client_reviewers_client_id_idx";

-- 3. Rename column in client_reviewers: client_id -> project_id
ALTER TABLE "client_reviewers" RENAME COLUMN "client_id" TO "project_id";

-- 4. Rename table client_reviewers to project_reviewers
ALTER TABLE "client_reviewers" RENAME TO "project_reviewers";

-- 5. Create indexes on project_reviewers
CREATE UNIQUE INDEX "project_reviewers_project_id_reviewer_id_key" ON "project_reviewers"("project_id", "reviewer_id");
CREATE INDEX "project_reviewers_project_id_idx" ON "project_reviewers"("project_id");

-- 6. Drop indexes on review_items that use client_id
DROP INDEX IF EXISTS "review_items_client_id_idx";
DROP INDEX IF EXISTS "review_items_client_id_created_at_idx";
DROP INDEX IF EXISTS "review_items_client_id_archived_at_idx";
DROP INDEX IF EXISTS "review_items_client_id_status_idx";

-- 7. Rename column in review_items: client_id -> project_id
ALTER TABLE "review_items" RENAME COLUMN "client_id" TO "project_id";

-- 8. Create indexes on review_items
CREATE INDEX "review_items_project_id_idx" ON "review_items"("project_id");
CREATE INDEX "review_items_project_id_created_at_idx" ON "review_items"("project_id", "created_at");
CREATE INDEX "review_items_project_id_archived_at_idx" ON "review_items"("project_id", "archived_at");
CREATE INDEX "review_items_project_id_status_idx" ON "review_items"("project_id", "status");

-- 9. Drop unique constraint and index on invitations that use client_id
DROP INDEX IF EXISTS "invitations_organization_id_client_id_email_type_key";
DROP INDEX IF EXISTS "invitations_client_id_idx";

-- 10. Rename column in invitations: client_id -> project_id
ALTER TABLE "invitations" RENAME COLUMN "client_id" TO "project_id";

-- 11. Create indexes on invitations
CREATE UNIQUE INDEX "invitations_organization_id_project_id_email_type_key" ON "invitations"("organization_id", "project_id", "email", "type");
CREATE INDEX "invitations_project_id_idx" ON "invitations"("project_id");

-- 8. ActivityLogAction enum: replace CLIENT_CREATED/CLIENT_UPDATED with PROJECT_CREATED/PROJECT_UPDATED
CREATE TYPE "ActivityLogAction_new" AS ENUM (
  'REVIEW_CREATED',
  'REVIEW_UPDATED',
  'REVIEW_APPROVED',
  'REVIEW_CHANGES_REQUESTED',
  'REVIEW_ARCHIVED',
  'COMMENT_ADDED',
  'COMMENT_DELETED',
  'ATTACHMENT_UPLOADED',
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'USER_INVITED',
  'USER_JOINED',
  'USER_UPDATED',
  'ORGANIZATION_UPDATED',
  'REMINDER_SENT'
);

ALTER TABLE "activity_logs"
  ALTER COLUMN "action" TYPE "ActivityLogAction_new"
  USING (
    CASE "action"::text
      WHEN 'CLIENT_CREATED' THEN 'PROJECT_CREATED'::"ActivityLogAction_new"
      WHEN 'CLIENT_UPDATED' THEN 'PROJECT_UPDATED'::"ActivityLogAction_new"
      ELSE "action"::text::"ActivityLogAction_new"
    END
  );

DROP TYPE "ActivityLogAction";
ALTER TYPE "ActivityLogAction_new" RENAME TO "ActivityLogAction";
