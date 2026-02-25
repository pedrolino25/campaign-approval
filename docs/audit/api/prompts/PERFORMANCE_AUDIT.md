# WORKLIENT — PERFORMANCE AUDIT (INDEXES + QUERY PLAN VALIDATION)

## Objective

Perform a complete performance audit of:

- All list queries
- All filtering queries
- All workflow state transitions
- Reminder worker queries
- Notification queries
- Activity log queries
- Invitation lookups
- Reviewer resolution

We are validating:

1. Every WHERE clause is index-backed
2. Every ORDER BY is index-compatible
3. Cursor pagination is index-friendly
4. No full-table scans exist in hot paths
5. No missing composite indexes
6. No redundant or unused indexes

This is READ-ONLY analysis. Do not modify logic unless index changes are required.

---

# STEP 1 — ENUMERATE ALL HOT QUERIES

Search across repositories for:

- findMany
- findFirst
- findUnique
- updateMany
- count
- upsert
- raw queries (if any)

For each, extract:

- Model
- WHERE conditions
- ORDER BY fields
- Pagination fields
- Frequency (API path or worker path)

Produce a table like:

| Model | Method | WHERE | ORDER BY | Pagination | Used In | Hot Path? |

Hot paths include:

- GET /review-items
- GET /clients
- GET /notifications
- GET /activity
- Reminder worker
- Workflow transitions
- Invitation lookup by token
- Reviewer resolution

---

# STEP 2 — VERIFY INDEX COVERAGE

For each query:

Check if there is a matching index in schema.prisma.

Rules:

1. Every equality filter in WHERE should be left-most column in an index.
2. Composite indexes must match:
   WHERE columns order → ORDER BY column.
3. Cursor pagination must use indexed ORDER BY column.
4. Frequently combined filters must have composite indexes.

Flag:

- Missing indexes
- Redundant indexes
- Inefficient column order
- Low-selectivity first column (bad for performance)

---

# STEP 3 — REVIEW KEY MODELS DEEPLY

## 1️⃣ ReviewItem

Validate indexes cover:

- listByOrganization()
  WHERE: organizationId, archivedAt
  ORDER BY: createdAt OR updatedAt

- listByClient()
  WHERE: clientId, organizationId, archivedAt
  ORDER BY: createdAt

- listByStatus()
  WHERE: organizationId, status, archivedAt
  ORDER BY: updatedAt

- Reminder worker:
  WHERE:
    organizationId
    status = PENDING_REVIEW
    archivedAt = null
    updatedAt < cutoff
    lastReminderSentAt is null OR < cutoff

Ensure composite index exists matching:

(organizationId, status, archivedAt, updatedAt, lastReminderSentAt)

Evaluate if partial index would be better.

---

## 2️⃣ Notification

Validate indexes cover:

- listByUser()
  WHERE: organizationId, userId, readAt
  ORDER BY: createdAt DESC

- listByReviewer()
  WHERE: organizationId, reviewerId, readAt
  ORDER BY: createdAt DESC

- findById()
  WHERE: id, organizationId

Ensure composite indexes support both filtering and ordering.

---

## 3️⃣ ActivityLog

Validate:

- list by organization
- list by reviewItem
- list by actor
- ORDER BY createdAt DESC

Ensure composite indexes:

(organizationId, createdAt DESC)
(reviewItemId, createdAt DESC)

---

## 4️⃣ Invitation

Validate:

- findByToken(token) → must use unique index
- listByOrganization()
- listPendingByOrganization()
  WHERE: organizationId, acceptedAt null, expiresAt > now

Check if composite index:
(organizationId, acceptedAt, expiresAt)

---

## 5️⃣ ClientReviewer

Validate:

- findByReviewerIdAndOrganization()
- findByReviewerIdAndClient()

Ensure indexes:
(reviewerId)
(clientId)
(clientId, reviewerId) UNIQUE

---

# STEP 4 — VERIFY CURSOR PAGINATION EFFICIENCY

Ensure:

- Cursor field is indexed
- ORDER BY matches index
- No OFFSET-based pagination exists

Confirm that:

- All pagination uses `cursor + take`
- No skip/offset is used in hot paths

Flag if ORDER BY is not deterministic (must include unique tiebreaker like id).

---

# STEP 5 — ANALYZE QUERY PLANS (IMPORTANT)

For each hot query:

Generate raw SQL equivalent.

Run in PostgreSQL:

EXPLAIN (ANALYZE, BUFFERS)
SELECT ...

Confirm:

- Index Scan used
- No Seq Scan on large tables
- No Bitmap Heap Scan on high-frequency paths
- Proper index usage

Simulate large data volumes:

- 100k review items
- 1M activity logs
- 500k notifications

If Seq Scan appears → index missing.

Document:

| Query | Expected Plan | Actual Plan | OK? |

---

# STEP 6 — DETECT REDUNDANT INDEXES

Identify:

- Indexes fully covered by larger composite indexes
- Duplicate single-column indexes
- Indexes on low-selectivity columns (boolean fields)

Recommend removals if safe.

---

# STEP 7 — WORKER-SPECIFIC PERFORMANCE

Validate:

## Reminder Worker

Query:

findEligibleForReminder()

Ensure index covers:

(organizationId, status, archivedAt, updatedAt, lastReminderSentAt)

Verify no full-table scan when organization has many review items.

---

## Email Worker

Query:

findById(notificationId, organizationId)

Must use:

PRIMARY KEY on id OR composite index (id, organizationId)

---

# STEP 8 — FINAL REPORT FORMAT

Produce:

## 1️⃣ Index Coverage Score
% of hot queries properly indexed.

## 2️⃣ Missing Indexes
List exact Prisma schema additions required.

## 3️⃣ Redundant Indexes
List candidates for removal.

## 4️⃣ Query Plan Warnings
List queries that trigger Seq Scan.

## 5️⃣ Scalability Risk Assessment
- Safe to 100k review items?
- Safe to 1M activity logs?
- Safe to 500k notifications?

## 6️⃣ Required Schema Changes
Provide exact Prisma migration diff if needed.

---

# OUTPUT REQUIREMENTS

Do NOT summarize code.

Produce:

- Full table of hot queries
- Index validation per query
- Concrete Prisma schema changes if required
- No vague recommendations

This must be a deep technical performance report.

No assumptions.
No simplifications.
Exact analysis only.
