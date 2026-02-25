# WORKLIENT – PERFORMANCE ARCHITECTURE REPORT

**Generated:** Based on actual source code analysis  
**Date:** 2024  
**Scope:** API implementation performance audit

---

## EXECUTIVE SUMMARY

This report analyzes the Worklient API architecture for performance risks, query inefficiencies, and scalability bottlenecks. The analysis is based on actual source code review without load simulation.

**Key Findings:**
- **HIGH RISK:** Session version verification adds 1 DB query per authenticated request
- **HIGH RISK:** SQS calls inside transactions create synchronous bottlenecks
- **MODERATE RISK:** N+1 query patterns in reviewer endpoints
- **MODERATE RISK:** Missing composite indexes for common query patterns
- **LOW RISK:** Repository instantiation overhead (cold start amplification)

---

## 1. REQUEST LIFECYCLE COST MODEL

### Typical Authenticated Request Flow

Every authenticated request follows this path:

1. **Token Extraction** (`CookieTokenExtractor.extract`)
   - Reads cookie from request headers
   - Parses JWT token
   - **Cost:** Negligible (in-memory)

2. **Session Verification** (`AuthService.verifySessionVersion`)
   - **Internal User:** `UserRepository.findById(userId, organizationId)`
   - **Reviewer:** `ReviewerRepository.findById(reviewerId)`
   - **Cost:** 1 DB query per request
   - **Query:** `SELECT * FROM users WHERE id = $1 AND organization_id = $2 AND archived_at IS NULL`
   - **Index Used:** `(id, organizationId)` - implicit via PK + organizationId index

3. **Session Version Check**
   - Compares `user.sessionVersion` or `reviewer.sessionVersion` with token claim
   - **Cost:** In-memory comparison (already fetched in step 2)

4. **RBAC Resolution** (`RBACService.resolve`)
   - For reviewers with organizationId: `ClientReviewerRepository.findByReviewerIdAndOrganization`
   - **Cost:** 0-1 additional DB query (only for reviewers with organizationId)
   - **Query:** `SELECT * FROM client_reviewers WHERE reviewer_id = $1 AND client.organization_id = $2`
   - **Index Used:** `(reviewerId)` index exists

5. **Repository Scoping**
   - All repository methods include `organizationId` in WHERE clauses
   - **Cost:** Additional WHERE condition (indexed, minimal overhead)

### Estimated DB Queries Per Request

| Endpoint Type | Auth Queries | Business Logic Queries | Total |
|--------------|--------------|------------------------|-------|
| Internal User (simple GET) | 1 | 1-2 | **2-3** |
| Internal User (list with pagination) | 1 | 1 | **2** |
| Reviewer (simple GET) | 1-2 | 1-2 | **2-4** |
| Reviewer (list with pagination) | 1-2 | 1 | **2-3** |
| Write operations | 1 | 2-5+ | **3-6+** |

**Session Version Overhead:**
- **1 extra DB query per authenticated request**
- At 100 RPS: 100 extra queries/second
- At 1000 RPS: 1000 extra queries/second
- **Impact:** HIGH - This is a synchronous bottleneck on every request

---

## 2. HOT ENDPOINT IDENTIFICATION

### GET /review-items

**Handler:** `handleGetReviewItems` in `api/src/handlers/review.ts`

**Flow:**
1. Auth: 1 query (session verification)
2. For reviewers: 1 query (`ClientRepository.findByIdForReviewer`)
3. List query: 1 query (`ReviewItemRepository.listByOrganization` or `listByClient`)

**DB Query Analysis:**
```typescript
// Internal users
prisma.reviewItem.findMany({
  where: {
    organizationId,
    archivedAt: null,
    ...cursorWhere, // (createdAt < X OR (createdAt = X AND id < Y))
  },
  orderBy: { createdAt: 'desc', id: 'desc' },
  take: limit + 1,
})
```

**Indexes Used:**
- `(organizationId, createdAt)` - ✅ EXISTS
- `(organizationId, status, archivedAt, createdAt)` - ✅ EXISTS (better match)

**Join Complexity:** None (single table query)

**Pagination:** Cursor-based using `(createdAt, id)` - ✅ CORRECT

**DB Calls Count:** 2-3 queries

**Risk Assessment:** LOW - Well-indexed, efficient pagination

---

### GET /review-items/:id

**Handler:** `handleGetReviewItem` in `api/src/handlers/review.ts`

**Flow:**
1. Auth: 1 query
2. For reviewers: 1 query (`ClientRepository.findByIdForReviewer`)
3. Review item fetch: 1 query with `include: { createdBy: {...} }`
4. Version history: 2 queries
   - `AttachmentRepository.listByReviewItemGroupedByVersion` - 1 query
   - `ActivityLogRepository.list` with limit 1000 - 1 query

**DB Query Analysis:**
```typescript
// Main query
prisma.reviewItem.findFirst({
  where: { id, organizationId, archivedAt: null },
  include: {
    createdBy: { select: { id: true, name: true, email: true } }
  }
})

// Version history - N+1 RISK
const attachmentsByVersion = await attachmentRepository.listByReviewItemGroupedByVersion(reviewItemId)
const activityLogs = await activityLogRepository.list({
  organizationId,
  reviewItemId,
  pagination: { limit: 1000 } // ⚠️ No pagination limit enforcement
})
```

**Indexes Used:**
- `(id, organizationId)` - ✅ EXISTS (implicit via PK + organizationId)
- `(reviewItemId)` on attachments - ✅ EXISTS
- `(reviewItemId, createdAt)` on activity_logs - ✅ EXISTS

**Join Complexity:** 1 join (createdBy user)

**Pagination:** None for version history (fetches up to 1000 activity logs)

**DB Calls Count:** 4-5 queries

**Risk Assessment:** MODERATE
- Activity log limit of 1000 could be expensive for items with many activities
- No cursor pagination for version history

---

### GET /notifications

**Handler:** `handleGetNotifications` in `api/src/handlers/notification.ts`

**Flow:**
1. Auth: 1-2 queries (session + optional client lookup for reviewers)
2. List query: 1 query

**DB Query Analysis:**
```typescript
// Internal users
prisma.notification.findMany({
  where: {
    userId,
    organizationId,
    ...cursorWhere,
  },
  orderBy: { createdAt: 'desc', id: 'desc' },
  take: limit + 1,
})
```

**Indexes Used:**
- `(userId, organizationId, createdAt)` - ✅ EXISTS
- `(userId, organizationId, readAt, createdAt)` - ✅ EXISTS (for unread)

**Join Complexity:** None

**Pagination:** Cursor-based - ✅ CORRECT

**DB Calls Count:** 2-3 queries

**Risk Assessment:** LOW - Well-indexed

---

### GET /clients

**Handler:** `handleGetClients` in `api/src/handlers/client.ts`

**Flow:**
1. Auth: 1 query
2. List query: 1 query

**DB Query Analysis:**
```typescript
prisma.client.findMany({
  where: {
    organizationId,
    archivedAt: null,
    ...cursorWhere,
  },
  orderBy: { createdAt: 'desc', id: 'desc' },
  take: limit + 1,
})
```

**Indexes Used:**
- `(organizationId, createdAt)` - ✅ EXISTS

**Join Complexity:** None

**Pagination:** Cursor-based - ✅ CORRECT

**DB Calls Count:** 2 queries

**Risk Assessment:** LOW

---

### GET /organization/users

**Handler:** `handleGetUsers` in `api/src/handlers/organization.ts`

**Flow:**
1. Auth: 1 query
2. List query: 1 query

**DB Query Analysis:**
```typescript
prisma.user.findMany({
  where: {
    organizationId,
    archivedAt: null,
    ...cursorWhere,
  },
  orderBy: { createdAt: 'desc', id: 'desc' },
  take: limit + 1,
})
```

**Indexes Used:**
- `(organizationId)` - ✅ EXISTS
- **MISSING:** `(organizationId, archivedAt, createdAt)` composite index

**Join Complexity:** None

**Pagination:** Cursor-based - ✅ CORRECT

**DB Calls Count:** 2 queries

**Risk Assessment:** MODERATE
- Missing composite index for `(organizationId, archivedAt, createdAt)` could cause index scan instead of index-only scan

---

## 3. TRANSACTION HEAVY ENDPOINTS

All endpoints using `prisma.$transaction`:

### Review Workflow Actions
**Endpoints:**
- `POST /review-items/:id/send`
- `POST /review-items/:id/approve`
- `POST /review-items/:id/request-changes`

**Transaction Operations:**
1. `reviewItem.updateMany` (optimistic lock with version)
2. `reviewItem.findFirst` (refetch after update)
3. `activityLog.create` (via ActivityLogService)
4. `notification.upsert` (via WorkflowEventDispatcher)
5. **SQS enqueueEmailJob** (⚠️ INSIDE TRANSACTION - see section 7)

**DB Operations Count:** 4-6 queries

**Lock Contention Risk:** MODERATE
- Uses `updateMany` with version check (optimistic locking)
- Version column prevents concurrent modifications
- Risk increases with high concurrency on same review item

**Optimistic Locking:** ✅ YES (version column)

**Version Column Usage:** ✅ CORRECT

---

### Comment Creation
**Endpoint:** `POST /review-items/:id/comments`

**Transaction Operations:**
1. `comment.create`
2. `reviewItem.findFirst` (for activity log)
3. `activityLog.create`
4. `reviewItem.update` (increment version if needed)

**DB Operations Count:** 3-4 queries

**Lock Contention Risk:** LOW
- Comments are append-only
- No version conflicts expected

---

### Attachment Operations
**Endpoints:**
- `POST /attachments/presign`
- `POST /attachments/:id/confirm`

**Transaction Operations:**
1. `reviewItem.findFirst`
2. `attachment.findMany` (check existing)
3. `reviewItem.update` (version increment + status change)
4. `attachment.create`
5. `activityLog.create`

**DB Operations Count:** 4-5 queries

**Lock Contention Risk:** MODERATE
- Version increment on review item
- Multiple attachments per review item could contend

---

### Organization Service Operations
**Endpoints:**
- `PATCH /organization/users/:id/role`
- `DELETE /organization/users/:id`

**Transaction Operations:**
1. `user.findFirst` (with FOR UPDATE lock for owner count)
2. `user.update` (role change)
3. `activityLog.create`
4. Owner count validation queries

**DB Operations Count:** 3-5 queries

**Lock Contention Risk:** HIGH
- Uses `FOR UPDATE` lock on user count query
- Serializes all role changes in organization
- **Bottleneck:** All role changes must serialize

**Optimistic Locking:** ❌ NO (uses pessimistic `FOR UPDATE`)

---

### Client Service Operations
**Endpoints:**
- `POST /clients`
- `PATCH /clients/:id`
- `POST /clients/:id/archive`

**Transaction Operations:**
1. `client.create/update`
2. `activityLog.create`
3. Optional: `reviewItem.count` (for validation)

**DB Operations Count:** 2-3 queries

**Lock Contention Risk:** LOW

---

### Invitation Service
**Endpoints:**
- `POST /organization/users/invite`
- `POST /organization/invitations/:token/accept`

**Transaction Operations:**
1. `invitation.create/update`
2. `notification.create`
3. `user.create` (on accept)
4. `organization.findFirst` (validation)

**DB Operations Count:** 3-4 queries

**Lock Contention Risk:** LOW

---

## 4. INDEX ANALYSIS

### Existing Indexes (from schema.prisma)

**User:**
- ✅ `(organizationId)`
- ✅ `(cognitoUserId)` - unique
- ✅ `(email)`
- ⚠️ **MISSING:** `(organizationId, archivedAt, createdAt)` - needed for pagination

**ReviewItem:**
- ✅ `(organizationId)`
- ✅ `(clientId)`
- ✅ `(status)`
- ✅ `(createdAt)`
- ✅ `(updatedAt)`
- ✅ `(lastReminderSentAt)`
- ✅ `(organizationId, status)`
- ✅ `(organizationId, createdAt)`
- ✅ `(clientId, createdAt)`
- ✅ `(organizationId, status, archivedAt, createdAt)` - excellent
- ✅ `(organizationId, status, lastReminderSentAt)`
- ✅ `(clientId, archivedAt)`
- ✅ `(clientId, status)`

**Comment:**
- ✅ `(reviewItemId)`
- ✅ `(reviewItemId, createdAt)` - excellent for pagination
- ✅ `(authorReviewerId)`
- ✅ `(authorUserId)`

**Notification:**
- ✅ `(organizationId)`
- ✅ `(userId)`
- ✅ `(reviewerId)`
- ✅ `(email)`
- ✅ `(readAt)`
- ✅ `(sentAt)`
- ✅ `(createdAt)`
- ✅ `(organizationId, createdAt)`
- ✅ `(userId, readAt)`
- ✅ `(organizationId, readAt)`
- ✅ `(userId, organizationId, createdAt)` - excellent
- ✅ `(userId, organizationId, readAt, createdAt)` - excellent
- ✅ `(reviewerId, organizationId, createdAt)`
- ✅ `(reviewerId, organizationId, readAt, createdAt)`

**Client:**
- ✅ `(organizationId)`
- ✅ `(organizationId, createdAt)`
- ⚠️ **MISSING:** `(organizationId, archivedAt, createdAt)` - for pagination with archived filter

**ClientReviewer:**
- ✅ `(clientId)`
- ✅ `(reviewerId)`
- ✅ `(clientId, reviewerId)` - unique
- ⚠️ **MISSING:** `(reviewerId, organizationId)` - for reviewer organization lookup

**Invitation:**
- ✅ `(organizationId)`
- ✅ `(clientId)`
- ✅ `(email)`
- ✅ `(token)` - unique
- ✅ `(expiresAt)`
- ⚠️ **MISSING:** `(organizationId, expiresAt, acceptedAt)` - for pending invitations query

**ActivityLog:**
- ✅ `(organizationId)`
- ✅ `(reviewItemId)`
- ✅ `(actorUserId)`
- ✅ `(actorReviewerId)`
- ✅ `(action)`
- ✅ `(createdAt)`
- ✅ `(organizationId, createdAt)`
- ✅ `(reviewItemId, createdAt)`

### Missing Index Risks

**HIGH PRIORITY:**

1. **User pagination:**
   ```sql
   CREATE INDEX idx_users_org_archived_created ON users(organization_id, archived_at, created_at);
   ```
   - **Impact:** Full table scan on large user lists
   - **Query:** `listByOrganization` with cursor pagination

2. **ClientReviewer reviewer lookup:**
   ```sql
   CREATE INDEX idx_client_reviewers_reviewer_org ON client_reviewers(reviewer_id, client_id) 
   INCLUDE (archived_at);
   ```
   - **Impact:** Extra join or subquery for reviewer organization resolution
   - **Query:** `findByReviewerIdAndOrganization` (used in RBAC resolution)

3. **Invitation pending query:**
   ```sql
   CREATE INDEX idx_invitations_org_expires_accepted ON invitations(organization_id, expires_at, accepted_at);
   ```
   - **Impact:** Slow pending invitations list
   - **Query:** `listPendingByOrganization`

**MODERATE PRIORITY:**

4. **Client pagination:**
   ```sql
   CREATE INDEX idx_clients_org_archived_created ON clients(organization_id, archived_at, created_at);
   ```
   - **Impact:** Index scan instead of index-only scan

---

## 5. PAGINATION EFFICIENCY

### Cursor-Based Pagination Implementation

**Location:** `api/src/lib/pagination/cursor-pagination.ts`

**Implementation:**
```typescript
// Cursor format: base64(JSON({ createdAt: string, id: string }))
// Order by: { createdAt: 'desc', id: 'desc' }
// Where condition:
{
  OR: [
    { createdAt: { lt: cursorDate } },
    { createdAt: cursorDate, id: { lt: cursorId } }
  ]
}
```

**Correctness:** ✅ CORRECT
- Uses stable sort fields (`createdAt`, `id`)
- Handles ties correctly with `id` as tiebreaker
- Prevents duplicates across pages

**Stable Sort Fields:** ✅ YES
- `createdAt` is immutable (set on creation)
- `id` is unique and immutable

**Large Dataset Behavior:**
- ✅ Efficient with proper indexes
- ✅ No full table scans (uses index on `(organizationId, createdAt)`)
- ⚠️ **Risk:** If cursor is very old, `createdAt < X` condition may scan many rows
- **Mitigation:** Indexes are in place

**Potential Issues:**

1. **Activity Log Pagination:**
   - `GET /review-items/:id/activity` uses limit 1000 without cursor
   - **Risk:** Could return 1000 rows in single query
   - **Fix:** Implement cursor pagination

2. **Version History:**
   - `buildVersionHistory` fetches all activity logs (limit 1000)
   - **Risk:** Expensive for review items with many activities
   - **Fix:** Add cursor pagination or limit to last N versions

---

## 6. SESSION VERSION COST

### Current Implementation

**Location:** `api/src/lib/auth/auth.service.ts`

**Flow:**
1. Extract session from JWT token (contains `sessionVersion` claim)
2. Query database: `UserRepository.findById(userId, organizationId)` or `ReviewerRepository.findById(reviewerId)`
3. Compare `user.sessionVersion` with token claim
4. If mismatch: throw `UnauthorizedError`

**Cost Per Request:**
- **1 additional DB query** for every authenticated request
- Query is simple: `SELECT * FROM users WHERE id = $1 AND organization_id = $2`
- Uses indexed lookup (PK + organizationId index)

### Worst-Case RPS Impact

**At 100 RPS:**
- 100 extra queries/second
- Assuming 1ms query time: 100ms total DB time
- **Impact:** MODERATE

**At 1000 RPS:**
- 1000 extra queries/second
- Assuming 1ms query time: 1000ms total DB time
- **Impact:** HIGH - Could become bottleneck

**At 10,000 RPS:**
- 10,000 extra queries/second
- **Impact:** CRITICAL - Will require read replicas

### Read Replica Consideration

**Current:** All queries go to primary database

**Recommendation:**
- Use read replica for session verification queries
- Session version check is read-only
- No consistency requirement (eventual consistency acceptable)
- **Benefit:** Offload 1 query per request from primary

**Implementation:**
```typescript
// Use read replica for session verification
const user = await readReplica.user.findFirst({
  where: { id: userId, organizationId, archivedAt: null }
})
```

**Risk:** LOW
- Session invalidation is eventual (acceptable trade-off)
- Worst case: User continues with invalid session for <1 second

---

## 7. EXTERNAL SERVICE LATENCY RISK

### SQS Integration

**Location:** `api/src/lib/sqs/sqs.service.ts`

**Usage Pattern:**
```typescript
// Called from NotificationService.sendEmailIfNeeded
// Which is called from createForWorkflowEvent
// Which is called INSIDE prisma.$transaction
await this.sqsService.enqueueEmailJob(payload)
```

**Problem:** ⚠️ **SQS CALLS INSIDE TRANSACTIONS**

**Affected Endpoints:**
- `POST /review-items/:id/send`
- `POST /review-items/:id/approve`
- `POST /review-items/:id/request-changes`
- `POST /organization/users/invite`

**Impact:**
- Transaction holds database connection while waiting for SQS API call
- SQS API latency: ~50-200ms (network + AWS API)
- **Transaction duration:** Extended by SQS latency
- **Lock contention:** Increases (transactions hold locks longer)
- **Database connection pool:** Connections held longer

**Risk Level:** HIGH

**Fix:**
```typescript
// Move SQS call AFTER transaction commits
await prisma.$transaction(async (tx) => {
  // ... DB operations ...
  const notification = await tx.notification.upsert(...)
  return notification
})

// After transaction
await this.enqueueEmailJob({ notificationId: notification.id, ... })
```

**Current Code Flow:**
1. Transaction starts
2. Create notification (inside tx)
3. **SQS call (inside tx)** ⚠️
4. Transaction commits

**Recommended Flow:**
1. Transaction starts
2. Create notification (inside tx)
3. Transaction commits
4. **SQS call (after tx)** ✅

---

### S3 Presigned URL Generation

**Location:** `api/src/lib/s3/s3.service.ts`

**Usage:** `POST /attachments/presign`

**Implementation:**
```typescript
async generatePresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({ Bucket, Key: key, ContentType: contentType })
  return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 })
}
```

**Cost:** 
- **Latency:** ~20-50ms (AWS SDK call)
- **CPU:** Minimal (crypto signing)
- **Network:** Minimal (API call to S3 service)

**Transaction Context:**
- Called from `AttachmentService.generatePresignedUpload`
- **NOT inside transaction** ✅
- Transaction only for version increment (if needed)

**Risk Level:** LOW
- Not blocking transactions
- Acceptable latency for user-facing operation

---

### Cognito Token Exchange

**Location:** `api/src/lib/auth/utils/jwt-verifier.ts`

**Implementation:**
- Uses `jose` library with JWKS caching
- JWKS fetched from Cognito on first use
- Cached in memory: `Map<string, JWKS>`

**Cost:**
- **First request:** ~100-200ms (fetch JWKS)
- **Subsequent requests:** <1ms (cached)
- **Cache invalidation:** Never (JWKS changes infrequently)

**Risk Level:** LOW
- Caching prevents repeated fetches
- Only affects cold starts

---

## 8. COLD START AMPLIFICATION

### Service Instantiation Pattern

**Current Pattern:**
```typescript
// Handlers create new instances on every request
const repository = new ReviewItemRepository()
const service = new ReviewItemService()
```

**Location:** All handler files (`api/src/handlers/*.ts`)

**Cost Per Request:**
- Repository instantiation: ~0.1ms (negligible)
- Service instantiation: ~0.1-0.5ms (may instantiate dependencies)
- **Total:** <1ms per request

**Cold Start Impact:**
- Lambda cold start: ~500-2000ms (first invocation)
- Service instantiation: <1ms (negligible compared to Lambda cold start)

**Risk Level:** LOW

**Optimization Opportunity:**
- Reuse service instances across requests (if Lambda container reused)
- **Benefit:** Minimal (<1ms savings)
- **Complexity:** Medium (dependency injection needed)
- **Recommendation:** Not worth it for current scale

---

### Prisma Client Reuse

**Location:** `api/src/lib/prisma/client.ts`

**Implementation:**
```typescript
export const prisma: PrismaClient = global.prisma ?? createPrismaClient()
if (!global.prisma) {
  global.prisma = prisma
}
```

**Correctness:** ✅ CORRECT
- Uses global variable to reuse Prisma client
- Prevents connection pool exhaustion
- Reuses connection pool across Lambda invocations (if container reused)

**Risk Level:** LOW
- Properly implemented
- No connection leaks expected

---

### Repository Instantiation

**Pattern:**
- Each handler creates new repository instances
- Repositories are lightweight (just wrap Prisma calls)
- No stateful dependencies

**Cost:** Negligible (<0.1ms per instance)

**Risk Level:** LOW

---

## 9. SCALABILITY RISK SCENARIOS

### Scenario 1: 10,000 Review Items in One Organization

**Endpoint:** `GET /review-items`

**Query:**
```sql
SELECT * FROM review_items 
WHERE organization_id = $1 
  AND archived_at IS NULL
  AND (created_at < $2 OR (created_at = $2 AND id < $3))
ORDER BY created_at DESC, id DESC
LIMIT 21;
```

**Index Used:** `(organizationId, status, archivedAt, createdAt)`

**Performance:**
- ✅ Index scan: O(log n) + limit
- ✅ Efficient even with 10k items
- **Risk:** LOW

**Pagination:**
- Cursor-based pagination handles large datasets efficiently
- No performance degradation as dataset grows

---

### Scenario 2: 500 Comments Per Review Item

**Endpoint:** `GET /review-items/:id`

**Query:**
```sql
-- Version history fetch
SELECT * FROM attachments WHERE review_item_id = $1;
SELECT * FROM activity_logs 
WHERE review_item_id = $1 
ORDER BY created_at DESC
LIMIT 1000;
```

**Index Used:** 
- `(reviewItemId)` on attachments
- `(reviewItemId, createdAt)` on activity_logs

**Performance:**
- ✅ Indexed lookup: O(log n)
- ⚠️ **Risk:** Fetching 1000 activity logs could be slow
- **Mitigation:** Add cursor pagination or limit to last N activities

**Risk Level:** MODERATE
- Current limit of 1000 could be expensive
- Should paginate activity logs

---

### Scenario 3: 1,000 Reviewers Per Organization

**Endpoint:** `GET /clients/:id/reviewers`

**Query:**
```sql
SELECT * FROM client_reviewers 
WHERE client_id = $1 
  AND archived_at IS NULL
  AND (created_at < $2 OR (created_at = $2 AND id < $3))
ORDER BY created_at DESC, id DESC
LIMIT 21;
```

**Index Used:** `(clientId)` (exists)

**Performance:**
- ✅ Indexed lookup
- ⚠️ **Missing:** `(clientId, archivedAt, createdAt)` composite index
- **Risk:** Index scan may need to filter `archivedAt` in memory

**Risk Level:** MODERATE
- Add composite index for better performance

---

### Scenario 4: 100 RPS on GET /review-items

**Load:**
- 100 requests/second
- Each request: 2-3 DB queries
- **Total:** 200-300 queries/second

**Database Impact:**
- ✅ Well within PostgreSQL capacity (can handle 1000s of queries/second)
- ✅ Queries are indexed and efficient
- ✅ No full table scans

**Session Version Overhead:**
- 100 extra queries/second for session verification
- **Total:** 300-400 queries/second
- **Impact:** MODERATE (manageable but adds load)

**Risk Level:** LOW
- Current architecture can handle this load
- Consider read replica for session verification at higher RPS

---

## 10. PERFORMANCE RISK SUMMARY

### HIGH RISK

1. **SQS Calls Inside Transactions**
   - **Location:** `NotificationService.sendEmailIfNeeded` called from within transactions
   - **Impact:** Extends transaction duration by 50-200ms
   - **Affected:** Review workflow actions, invitation creation
   - **Fix:** Move SQS calls after transaction commits
   - **Priority:** HIGH

2. **Session Version DB Lookup Per Request**
   - **Location:** `AuthService.verifySessionVersion`
   - **Impact:** 1 extra DB query per authenticated request
   - **At 1000 RPS:** 1000 extra queries/second
   - **Fix:** Use read replica for session verification
   - **Priority:** HIGH (at scale)

---

### MODERATE RISK

3. **Missing Composite Indexes**
   - **User pagination:** `(organizationId, archivedAt, createdAt)`
   - **ClientReviewer lookup:** `(reviewerId, organizationId)`
   - **Invitation pending:** `(organizationId, expiresAt, acceptedAt)`
   - **Impact:** Index scans instead of index-only scans
   - **Priority:** MODERATE

4. **Activity Log Limit Without Pagination**
   - **Location:** `buildVersionHistory` in `review.ts`
   - **Impact:** Fetches up to 1000 activity logs in single query
   - **Fix:** Add cursor pagination or limit to last N activities
   - **Priority:** MODERATE

5. **N+1 Query Pattern for Reviewers**
   - **Location:** Multiple handlers calling `ClientRepository.findByIdForReviewer`
   - **Impact:** Extra query per reviewer request to resolve organizationId
   - **Fix:** Include organizationId in reviewer session token
   - **Priority:** MODERATE

6. **Pessimistic Locking on Role Changes**
   - **Location:** `UserRepository.countActiveOwnersWithLock` uses `FOR UPDATE`
   - **Impact:** Serializes all role changes in organization
   - **Fix:** Use optimistic locking or reduce lock scope
   - **Priority:** MODERATE

---

### LOW RISK

7. **Repository Instantiation Overhead**
   - **Impact:** <1ms per request
   - **Priority:** LOW (not worth optimizing)

8. **S3 Presigned URL Generation**
   - **Impact:** 20-50ms latency (acceptable)
   - **Priority:** LOW

9. **Cold Start Service Instantiation**
   - **Impact:** <1ms (negligible compared to Lambda cold start)
   - **Priority:** LOW

---

## ARCHITECTURAL IMPROVEMENT SUGGESTIONS

### Immediate Actions (High Priority)

1. **Move SQS Calls Outside Transactions**
   ```typescript
   // Current (BAD)
   await prisma.$transaction(async (tx) => {
     const notification = await createNotification(tx)
     await enqueueEmailJob(notification) // ⚠️ Inside transaction
   })
   
   // Recommended (GOOD)
   const notification = await prisma.$transaction(async (tx) => {
     return await createNotification(tx)
   })
   await enqueueEmailJob(notification) // ✅ After transaction
   ```

2. **Add Missing Composite Indexes**
   ```sql
   CREATE INDEX idx_users_org_archived_created ON users(organization_id, archived_at, created_at);
   CREATE INDEX idx_client_reviewers_reviewer_org ON client_reviewers(reviewer_id, client_id) 
     INCLUDE (archived_at);
   CREATE INDEX idx_invitations_org_expires_accepted ON invitations(organization_id, expires_at, accepted_at);
   ```

3. **Implement Read Replica for Session Verification**
   - Configure read replica connection
   - Use for `AuthService.verifySessionVersion` queries
   - Reduces load on primary database

---

### Medium-Term Improvements

4. **Add Cursor Pagination for Activity Logs**
   - Limit `buildVersionHistory` to last N activities
   - Or implement cursor pagination for activity logs

5. **Optimize Reviewer Organization Resolution**
   - Include `organizationId` in reviewer session token
   - Eliminate `ClientRepository.findByIdForReviewer` calls

6. **Replace Pessimistic Locking with Optimistic Locking**
   - Remove `FOR UPDATE` from owner count query
   - Use version column or retry logic

---

### Long-Term Considerations

7. **Session Version Caching**
   - Cache session versions in Redis
   - Reduce DB load for session verification
   - TTL: 5-10 minutes (acceptable staleness)

8. **Database Connection Pooling Optimization**
   - Monitor connection pool usage
   - Adjust pool size based on RPS
   - Consider PgBouncer for connection pooling

9. **Query Performance Monitoring**
   - Add query timing logs
   - Monitor slow queries (>100ms)
   - Set up alerts for query performance degradation

---

## CONCLUSION

The Worklient API architecture is generally well-designed with proper indexing, cursor-based pagination, and optimistic locking. However, there are critical performance risks that should be addressed:

1. **SQS calls inside transactions** are the highest priority issue, extending transaction duration unnecessarily.
2. **Session version verification** adds significant database load at scale and should use read replicas.
3. **Missing composite indexes** could cause performance degradation as data grows.

The architecture can handle current scale (100-1000 RPS) but will need optimizations for higher scale (10,000+ RPS).

**Overall Risk Assessment:** MODERATE
- Current implementation: Functional and performant
- At scale: Requires optimizations (read replicas, index additions, transaction optimization)
