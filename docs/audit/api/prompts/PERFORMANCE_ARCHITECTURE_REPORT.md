# WORKLIENT – PERFORMANCE ARCHITECTURE REPORT

Generate a deep performance audit of the current API implementation.

Do NOT simulate load.
Analyze architecture and code structure.

Base everything on actual source code.


============================================================
OBJECTIVE
============================================================

Identify:

- Query inefficiencies
- N+1 risks
- Missing index risks
- Transaction overhead
- SessionVersion overhead
- High-frequency endpoint cost
- Cold start amplification
- Pagination efficiency
- SQS/S3 integration latency risks


============================================================
ANALYSIS STRUCTURE
============================================================


# 1. REQUEST LIFECYCLE COST MODEL

Describe:

- Typical authenticated request flow
- Session verification cost
- sessionVersion DB lookup cost
- RBAC resolution cost
- Repository scoping cost

Estimate number of DB queries per typical request.


# 2. HOT ENDPOINT IDENTIFICATION

Identify endpoints most likely high traffic:

- GET /review-items
- GET /review-items/:id
- GET /notifications
- GET /clients
- GET /organization/users

For each:
- DB calls count
- Join complexity
- Pagination behavior
- Index reliance


# 3. TRANSACTION HEAVY ENDPOINTS

List all endpoints using prisma.$transaction.

For each:
- Number of DB operations inside
- Risk of lock contention
- Optimistic locking usage
- Version column usage


# 4. INDEX ANALYSIS

Based on repository usage:

Identify fields that MUST be indexed:

- organizationId
- clientId
- reviewItemId
- reviewerId
- userId
- status
- archivedAt
- version
- token (in invitations)

Flag potential missing indexes.


# 5. PAGINATION EFFICIENCY

Analyze:

- Cursor-based pagination correctness
- Stable sort fields
- Large dataset behavior
- Potential full table scans


# 6. SESSION VERSION COST

Evaluate:

- Extra DB query per request
- Worst-case RPS impact
- Whether read-replica would be needed at scale


# 7. EXTERNAL SERVICE LATENCY RISK

Analyze:

- SQS send calls inside transactions?
- S3 presign generation cost
- Cognito exchange latency
- Potential synchronous bottlenecks


# 8. COLD START AMPLIFICATION

Analyze:

- Service instantiation cost
- Repository instantiation pattern
- Whether Prisma client reused properly


# 9. SCALABILITY RISK SCENARIOS

Simulate:

- 10k review items in one org
- 500 comments per review item
- 1000 reviewers per org
- 100 RPS on GET /review-items


# 10. PERFORMANCE RISK SUMMARY

Classify findings:

LOW / MODERATE / HIGH

Provide architectural improvement suggestions.