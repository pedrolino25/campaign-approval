# WORKLIENT – AUTHORITATIVE ENDPOINT INVENTORY REPORT
# Source-of-Truth Extraction From Codebase

This task is to generate a COMPLETE and AUTHORITATIVE endpoint inventory
based ONLY on actual source code.

Do NOT summarize.
Do NOT assume.
Do NOT infer from documentation.
Extract directly from route registrations.

This report will serve as the canonical contract for the entire API.


============================================================
OBJECTIVE
============================================================

Produce a fully accurate list of:

- Every registered HTTP endpoint
- HTTP method
- Full path
- Handler function
- Auth requirement
- Actor type requirement
- Role requirement
- Multi-tenant scoping mechanism
- Validation schema used
- Service method called
- Repository methods involved

This must reflect the CURRENT implementation.


============================================================
STEP 1 – LOCATE ROUTE REGISTRATIONS
============================================================

Search for:

- RouteBuilder.*
- createHandler()
- ApiHandlerFactory.create()
- Express-style route registrations (if any)
- Any central route index file

Identify:

- All route definitions
- All HTTP methods
- Full route paths
- Dynamic parameters


============================================================
STEP 2 – BUILD MASTER ENDPOINT TABLE
============================================================

For each endpoint produce a structured entry in this exact format:

------------------------------------------------------------

METHOD: <GET | POST | PATCH | DELETE>
PATH: <full path>

HANDLER:
  - File:
  - Function name:

AUTH:
  - Public or Authenticated
  - If authenticated:
      - Actor types allowed (INTERNAL / REVIEWER / BOTH)
      - Role restrictions (OWNER / ADMIN / MEMBER)
      - Is onboarding guard applied?

VALIDATION:
  - Body schema:
  - Query schema:
  - Param schema:

MULTI-TENANT SCOPE:
  - organizationId source:
  - clientId source:
  - repository scoping method used:

SERVICE LAYER:
  - Service class:
  - Method:

REPOSITORY CALLS:
  - List all repository methods invoked
  - Confirm whether scoped or unscoped

TRANSACTION:
  - Uses prisma.$transaction? (Yes/No)

SIDE EFFECTS:
  - Logs?
  - Notifications?
  - Session mutation?
  - S3?
  - External services?

------------------------------------------------------------

Repeat for ALL endpoints.


============================================================
STEP 3 – VERIFY NO MISSING ENDPOINTS
============================================================

Cross-check:

- auth.ts
- organization.ts
- client.ts
- review-item.ts
- comment.ts
- attachment.ts
- notification.ts
- any additional handler files

Ensure no handler file exports routes not included.

If route is registered but unreachable → mark as DEAD ROUTE.


============================================================
STEP 4 – GROUP ENDPOINTS BY DOMAIN
============================================================

After listing individually, group into:

- Authentication
- Organization
- Organization Users
- Invitations
- Clients
- Client Reviewers
- Review Items
- Comments
- Attachments
- Notifications
- System / Health
- Other


============================================================
STEP 5 – SUMMARY STATISTICS
============================================================

At end of report include:

- Total endpoints count
- Public endpoints count
- Authenticated endpoints count
- INTERNAL-only endpoints count
- REVIEWER-only endpoints count
- Endpoints using transactions
- Endpoints modifying data
- Endpoints performing deletes
- Endpoints touching S3
- Endpoints without validation schema (if any)
- Endpoints without explicit RBAC enforcement (if any)


============================================================
STRICT RULES
============================================================

- Do NOT rely on prior documentation.
- Extract from code only.
- If something is unclear, inspect service layer.
- If handler uses generic wrapper, trace actual function.
- If repository call is indirect, follow call chain.
- Do not omit endpoints.
- Do not simplify output.
- Do not compress format.

This is a security and architecture foundation report.
Accuracy is mandatory.