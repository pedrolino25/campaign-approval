# Domain Model Definition

All entities must strictly follow this model.

---

# Organization

Represents an agency account.

Fields:
- id (UUID)
- name (string)
- createdAt
- deletedAt (nullable)

Rules:
- All data belongs to an organization.
- No cross-organization access is allowed.

---

# User

Fields:
- id (UUID, matches Cognito sub)
- email
- role (owner | admin | member | reviewer)
- organizationId (nullable for reviewer)
- clientId (nullable, required for reviewer)
- createdAt
- deletedAt

Rules:
- Internal users must have organizationId.
- Reviewers must have clientId.
- Role is authoritative in DB, not JWT.

---

# Client

Fields:
- id
- organizationId
- name
- status (active | inactive)
- createdAt
- deletedAt

Rules:
- Clients belong to one organization.
- Reviewers are scoped to a single client.

---

# ReviewItem

Fields:
- id
- organizationId
- clientId
- title
- description
- status (enum)
- createdById
- createdAt
- updatedAt
- deletedAt

Status Enum:
- draft
- pending_review
- changes_requested
- approved
- archived

Rules:
- Must always belong to organization.
- Must always belong to client.
- Status transitions strictly controlled.

---

# Attachment

Fields:
- id
- reviewItemId
- storageUrl
- type (image | video | pdf | url | html)
- versionNumber (int)
- uploadedById
- createdAt
- deletedAt

Rules:
- versionNumber must increment.
- Only one active attachment per version.
- Upload may trigger status reset.

---

# Comment

Fields:
- id
- reviewItemId
- authorId
- parentCommentId (nullable)
- content
- createdAt
- deletedAt

Rules:
- Threaded replies allowed.
- Soft delete only.
- Must enforce organization scoping.

---

# Notification

Fields:
- id
- reviewItemId
- recipientId
- type
- deliveredAt (nullable)
- createdAt

Rules:
- Created on significant events.
- Email sending handled via SQS worker.