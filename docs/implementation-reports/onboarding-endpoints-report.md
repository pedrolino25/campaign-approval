# Onboarding Endpoints - Detailed Implementation Report

**File:** `api/src/handlers/organization.ts`  
**Lines:** 445-447  
**Date:** 2024  
**Status:** ✅ Active

---

## Table of Contents

1. [Overview](#overview)
2. [Route Definitions](#route-definitions)
3. [Endpoint 1: POST /onboarding/internal](#endpoint-1-post-onboardinginternal)
4. [Endpoint 2: POST /onboarding/reviewer](#endpoint-2-post-onboardingreviewer)
5. [Security & Access Control](#security--access-control)
6. [Request/Response Schemas](#requestresponse-schemas)
7. [Business Logic Flow](#business-logic-flow)
8. [Integration Points](#integration-points)
9. [Error Handling](#error-handling)
10. [Usage Examples](#usage-examples)

---

## Overview

Lines 445-447 in `organization.ts` register two critical onboarding endpoints that allow users to complete their profile setup after initial signup. These endpoints are part of the **onboarding guard system** that restricts access to most API resources until users complete their profile information.

### Purpose

After a user signs up and authenticates via Cognito, they are created with minimal information:
- **Internal Users:** Created with `name: null` and organization with `name: null`
- **Reviewers:** Created with `name: null`

These endpoints allow users to:
1. Complete their profile by providing their name
2. Set their organization name (for internal users)
3. Mark onboarding as complete, unlocking full API access

---

## Route Definitions

```typescript
const routes: RouteDefinition[] = [
  // ... other routes ...
  RouteBuilder.post('/onboarding/internal', handlePostInternalOnboarding),
  RouteBuilder.post('/onboarding/reviewer', handlePostReviewerOnboarding),
  // ... other routes ...
]
```

### Route Registration

- **Method:** `RouteBuilder.post()` - Creates POST route definitions
- **Path:** `/onboarding/internal` and `/onboarding/reviewer`
- **Handler:** Function references to async handlers
- **Router:** Routes are registered with the `Router` class and exported as the API handler

---

## Endpoint 1: POST /onboarding/internal

### Route Information

- **Path:** `/onboarding/internal`
- **Method:** `POST`
- **Handler:** `handlePostInternalOnboarding`
- **Authentication:** Required (Bearer token)
- **Authorization:** Internal users only

### Handler Implementation

**Location:** `api/src/handlers/organization.ts:115-156`

```typescript
const handlePostInternalOnboarding = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const actor = request.auth.actor

  // 1. Actor Type Validation
  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('This endpoint is only available for internal users')
  }

  // 2. Onboarding Status Check
  if (actor.onboardingCompleted) {
    throw new ForbiddenError('Onboarding has already been completed')
  }

  // 3. Request Validation
  const validated = validateBody(CompleteInternalOnboardingSchema)(request)
  
  // 4. Service Initialization
  const onboardingService = new OnboardingService(
    new UserRepository(),
    new ReviewerRepository(),
    new OrganizationRepository()
  )

  // 5. Complete Onboarding
  const result = await onboardingService.completeInternalOnboarding({
    userId: actor.userId,
    organizationId: actor.organizationId,
    userName: validated.body.userName,
    organizationName: validated.body.organizationName,
  })

  // 6. Return Response
  return {
    statusCode: 200,
    body: {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
      },
    },
  }
}
```

### Request Schema

**Schema:** `CompleteInternalOnboardingSchema`  
**Location:** `api/src/lib/schemas/onboarding.schema.ts`

```typescript
export const CompleteInternalOnboardingSchema = z.object({
  userName: z
    .string()
    .min(1, 'User name must be at least 1 character')
    .max(255, 'User name must be at most 255 characters')
    .trim(),
  organizationName: z
    .string()
    .min(1, 'Organization name must be at least 1 character')
    .max(255, 'Organization name must be at most 255 characters')
    .trim(),
}).strict()
```

**Request Body Example:**
```json
{
  "userName": "John Doe",
  "organizationName": "Acme Corporation"
}
```

### Response Schema

**Status Code:** `200 OK`

**Response Body:**
```typescript
{
  user: {
    id: string,        // UUID
    name: string,      // User's full name
    email: string      // User's email
  },
  organization: {
    id: string,        // UUID
    name: string       // Organization name
  }
}
```

**Response Example:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@acme.com"
  },
  "organization": {
    "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "name": "Acme Corporation"
  }
}
```

### Business Logic

**Service Method:** `OnboardingService.completeInternalOnboarding()`

**Location:** `api/src/services/onboarding.service.ts:73-108`

```typescript
async completeInternalOnboarding(params: {
  userId: string
  organizationId: string
  userName: string
  organizationName: string
}): Promise<{
  user: Awaited<ReturnType<UserRepository['update']>>
  organization: Awaited<ReturnType<OrganizationRepository['update']>>
}> {
  return await prisma.$transaction(async (tx) => {
    const [user, organization] = await Promise.all([
      tx.user.update({
        where: {
          id: params.userId,
          organizationId: params.organizationId,
        },
        data: {
          name: params.userName || null,
        },
      }),
      tx.organization.update({
        where: {
          id: params.organizationId,
        },
        data: {
          name: params.organizationName,
        },
      }),
    ])

    return { user, organization }
  })
}
```

**Key Operations:**
1. ✅ **Transactional Update:** Both user and organization updated atomically
2. ✅ **Parallel Updates:** Uses `Promise.all()` for efficiency
3. ✅ **Data Validation:** Ensures user belongs to organization
4. ✅ **Null Handling:** User name can be null if empty string provided

### Database Operations

**SQL Equivalent:**
```sql
BEGIN TRANSACTION;

UPDATE users
SET name = $1, updated_at = NOW()
WHERE id = $2 AND organization_id = $3;

UPDATE organizations
SET name = $4, updated_at = NOW()
WHERE id = $5;

COMMIT;
```

---

## Endpoint 2: POST /onboarding/reviewer

### Route Information

- **Path:** `/onboarding/reviewer`
- **Method:** `POST`
- **Handler:** `handlePostReviewerOnboarding`
- **Authentication:** Required (Bearer token)
- **Authorization:** Reviewers only

### Handler Implementation

**Location:** `api/src/handlers/organization.ts:158-193`

```typescript
const handlePostReviewerOnboarding = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const actor = request.auth.actor

  // 1. Actor Type Validation
  if (actor.type !== ActorType.Reviewer) {
    throw new ForbiddenError('This endpoint is only available for reviewers')
  }

  // 2. Onboarding Status Check
  if (actor.onboardingCompleted) {
    throw new ForbiddenError('Onboarding has already been completed')
  }

  // 3. Request Validation
  const validated = validateBody(CompleteReviewerOnboardingSchema)(request)
  
  // 4. Service Initialization
  const onboardingService = new OnboardingService(
    new UserRepository(),
    new ReviewerRepository(),
    new OrganizationRepository()
  )

  // 5. Complete Onboarding
  const reviewer = await onboardingService.completeReviewerOnboarding({
    reviewerId: actor.reviewerId,
    name: validated.body.name,
  })

  // 6. Return Response
  return {
    statusCode: 200,
    body: {
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
      },
    },
  }
}
```

### Request Schema

**Schema:** `CompleteReviewerOnboardingSchema`  
**Location:** `api/src/lib/schemas/onboarding.schema.ts`

```typescript
export const CompleteReviewerOnboardingSchema = z.object({
  name: z
    .string()
    .min(1, 'Name must be at least 1 character')
    .max(255, 'Name must be at most 255 characters')
    .trim(),
}).strict()
```

**Request Body Example:**
```json
{
  "name": "Jane Reviewer"
}
```

### Response Schema

**Status Code:** `200 OK`

**Response Body:**
```typescript
{
  reviewer: {
    id: string,        // UUID
    name: string,      // Reviewer's full name
    email: string      // Reviewer's email
  }
}
```

**Response Example:**
```json
{
  "reviewer": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Jane Reviewer",
    "email": "jane.reviewer@example.com"
  }
}
```

### Business Logic

**Service Method:** `OnboardingService.completeReviewerOnboarding()`

**Location:** `api/src/services/onboarding.service.ts:110-117`

```typescript
async completeReviewerOnboarding(params: {
  reviewerId: string
  name: string
}): Promise<Awaited<ReturnType<ReviewerRepository['update']>>> {
  return await this.reviewerRepository.update(params.reviewerId, {
    name: params.name,
  })
}
```

**Key Operations:**
1. ✅ **Simple Update:** Updates reviewer name only
2. ✅ **No Transaction:** Single table update, no transaction needed
3. ✅ **Direct Repository Call:** Uses repository update method

### Database Operations

**SQL Equivalent:**
```sql
UPDATE reviewers
SET name = $1, updated_at = NOW()
WHERE id = $2;
```

---

## Security & Access Control

### Authentication

- ✅ **Required:** Both endpoints require valid Bearer token
- ✅ **Token Verification:** Handled by `AuthService.authenticate()`
- ✅ **Session Validation:** Session must be valid and not expired

### Authorization

#### Internal Onboarding Endpoint

**Checks:**
1. ✅ **Actor Type:** Must be `ActorType.Internal`
2. ✅ **Onboarding Status:** Must not be already completed
3. ✅ **User Context:** Must have valid `userId` and `organizationId`

**Error Responses:**
- `403 Forbidden` - If actor type is not Internal
- `403 Forbidden` - If onboarding already completed

#### Reviewer Onboarding Endpoint

**Checks:**
1. ✅ **Actor Type:** Must be `ActorType.Reviewer`
2. ✅ **Onboarding Status:** Must not be already completed
3. ✅ **Reviewer Context:** Must have valid `reviewerId`

**Error Responses:**
- `403 Forbidden` - If actor type is not Reviewer
- `403 Forbidden` - If onboarding already completed

### Onboarding Guard

**Location:** `api/src/lib/auth/utils/onboarding-guard.ts`

Both endpoints are **whitelisted** in the onboarding guard, allowing access even when `onboardingCompleted: false`.

```typescript
const ALLOWED_ROUTES = new Set([
  'POST /onboarding/internal',
  'POST /onboarding/reviewer',
  'GET /organization',
])
```

**Guard Behavior:**
- ✅ **If `onboardingCompleted: true`:** All routes accessible
- ✅ **If `onboardingCompleted: false`:** Only whitelisted routes accessible
- ✅ **Onboarding endpoints:** Always accessible (whitelisted)

---

## Request/Response Schemas

### Complete Internal Onboarding Schema

```typescript
{
  userName: string,           // 1-255 characters, trimmed
  organizationName: string    // 1-255 characters, trimmed
}
```

**Validation Rules:**
- Both fields required
- Minimum length: 1 character
- Maximum length: 255 characters
- Auto-trimmed (leading/trailing whitespace removed)
- Strict mode (no additional properties allowed)

### Complete Reviewer Onboarding Schema

```typescript
{
  name: string    // 1-255 characters, trimmed
}
```

**Validation Rules:**
- Field required
- Minimum length: 1 character
- Maximum length: 255 characters
- Auto-trimmed
- Strict mode

---

## Business Logic Flow

### Internal User Onboarding Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Signs Up                                        │
│    - User created with name: null                      │
│    - Organization created with name: null               │
│    - onboardingCompleted: false                        │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. User Redirected to /onboarding/internal             │
│    - Onboarding guard allows access                     │
│    - Frontend shows onboarding form                     │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. User Submits Form                                    │
│    POST /onboarding/internal                            │
│    { userName, organizationName }                      │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Validation & Processing                              │
│    - Validate actor type (Internal)                     │
│    - Check onboarding not completed                     │
│    - Validate request body                              │
│    - Update user.name                                   │
│    - Update organization.name                           │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Session Updated                                      │
│    - onboardingCompleted: true                          │
│    - User can access all API resources                  │
└─────────────────────────────────────────────────────────┘
```

### Reviewer Onboarding Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Reviewer Signs Up                                    │
│    - Reviewer created with name: null                  │
│    - onboardingCompleted: false                         │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Reviewer Redirected to /onboarding/reviewer        │
│    - Onboarding guard allows access                     │
│    - Frontend shows onboarding form                     │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Reviewer Submits Form                                │
│    POST /onboarding/reviewer                            │
│    { name }                                             │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Validation & Processing                              │
│    - Validate actor type (Reviewer)                     │
│    - Check onboarding not completed                     │
│    - Validate request body                              │
│    - Update reviewer.name                               │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Session Updated                                      │
│    - onboardingCompleted: true                          │
│    - Reviewer can access all API resources              │
└─────────────────────────────────────────────────────────┘
```

---

## Integration Points

### 1. Authentication System

**Integration:** `AuthService.authenticate()`

- Extracts and validates session token
- Builds `AuthContext` with actor information
- Sets `onboardingCompleted` flag from session

### 2. Onboarding Guard

**Integration:** `onboardingGuard()`

- Whitelists onboarding endpoints
- Blocks access to other endpoints until onboarding complete
- Applied to all authenticated requests

### 3. Session Management

**Integration:** `SessionService`

- Session contains `onboardingCompleted` flag
- Flag calculated from user/reviewer name and organization name
- Updated on next request after onboarding completion

### 4. Frontend Integration

**Routes:**
- Internal: `/onboarding/internal` (Next.js page)
- Reviewer: `/onboarding/reviewer` (Next.js page)

**Flow:**
1. User signs up → Redirected to onboarding page
2. User fills form → Submits to API endpoint
3. Onboarding complete → Redirected to dashboard

---

## Error Handling

### Validation Errors

**Status Code:** `400 Bad Request`

**Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": ["userName"],
        "message": "User name must be at least 1 character"
      }
    ]
  }
}
```

### Authorization Errors

**Status Code:** `403 Forbidden`

**Scenarios:**
1. Wrong actor type (e.g., reviewer calling internal endpoint)
2. Onboarding already completed
3. Missing required actor properties

**Response:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "This endpoint is only available for internal users"
  }
}
```

### Authentication Errors

**Status Code:** `401 Unauthorized`

**Scenarios:**
- Invalid or expired token
- Missing authentication header

**Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired session"
  }
}
```

### Database Errors

**Status Code:** `500 Internal Server Error`

**Scenarios:**
- Transaction failure
- Database connection issues
- Constraint violations

**Response:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Usage Examples

### Example 1: Complete Internal User Onboarding

**Request:**
```bash
curl -X POST https://api.worklient.com/onboarding/internal \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "John Doe",
    "organizationName": "Acme Corporation"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@acme.com"
  },
  "organization": {
    "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "name": "Acme Corporation"
  }
}
```

### Example 2: Complete Reviewer Onboarding

**Request:**
```bash
curl -X POST https://api.worklient.com/onboarding/reviewer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Reviewer"
  }'
```

**Response:**
```json
{
  "reviewer": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Jane Reviewer",
    "email": "jane.reviewer@example.com"
  }
}
```

### Example 3: Error - Onboarding Already Completed

**Request:**
```bash
curl -X POST https://api.worklient.com/onboarding/internal \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "John Doe",
    "organizationName": "Acme Corporation"
  }'
```

**Response:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Onboarding has already been completed"
  }
}
```

### Example 4: Error - Wrong Actor Type

**Request:** (Reviewer calling internal endpoint)
```bash
curl -X POST https://api.worklient.com/onboarding/internal \
  -H "Authorization: Bearer <reviewer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "John Doe",
    "organizationName": "Acme Corporation"
  }'
```

**Response:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "This endpoint is only available for internal users"
  }
}
```

---

## Key Design Decisions

### 1. Separate Endpoints for Different Actor Types

**Rationale:**
- Different data requirements (internal users need org name, reviewers don't)
- Clear separation of concerns
- Type-safe validation per actor type

### 2. Onboarding Guard Whitelist

**Rationale:**
- Prevents users from accessing resources before completing profile
- Allows onboarding endpoints to be accessible
- Enforces completion before full access

### 3. Transactional Updates for Internal Users

**Rationale:**
- User and organization updates must be atomic
- Prevents partial state (user updated but org not)
- Ensures data consistency

### 4. Single Update for Reviewers

**Rationale:**
- Reviewers only need to update their name
- No organization relationship
- Simpler operation, no transaction needed

### 5. Idempotency Check

**Rationale:**
- Prevents duplicate onboarding submissions
- Checks `onboardingCompleted` flag before processing
- Returns clear error if already completed

---

## Testing Considerations

### Unit Tests

**Test Cases:**
- ✅ Valid request for internal user
- ✅ Valid request for reviewer
- ✅ Invalid actor type
- ✅ Already completed onboarding
- ✅ Validation errors (empty name, too long, etc.)
- ✅ Transaction rollback on failure (internal)

### Integration Tests

**Test Cases:**
- ✅ End-to-end onboarding flow
- ✅ Session update after completion
- ✅ Onboarding guard allows access after completion
- ✅ Database state after completion

### Edge Cases

**Test Cases:**
- ✅ Empty string handling (should be null)
- ✅ Whitespace-only strings (trimmed)
- ✅ Maximum length strings (255 characters)
- ✅ Concurrent onboarding attempts
- ✅ Database constraint violations

---

## Related Files

### Handler Files
- `api/src/handlers/organization.ts` - Route definitions and handlers

### Service Files
- `api/src/services/onboarding.service.ts` - Business logic

### Schema Files
- `api/src/lib/schemas/onboarding.schema.ts` - Request validation schemas

### Guard Files
- `api/src/lib/auth/utils/onboarding-guard.ts` - Access control

### Frontend Files
- `client/src/app/onboarding/internal/page.tsx` - Internal onboarding UI
- `client/src/app/onboarding/reviewer/page.tsx` - Reviewer onboarding UI

---

## Conclusion

These two route definitions (lines 445-447) are critical components of the user onboarding system. They:

✅ **Enable profile completion** for new users  
✅ **Enforce data requirements** (name, organization name)  
✅ **Control API access** via onboarding guard  
✅ **Maintain data integrity** through transactions  
✅ **Provide clear error messages** for invalid requests  

The endpoints are well-integrated with the authentication, authorization, and session management systems, ensuring a secure and smooth onboarding experience.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Author:** Implementation Team  
**Review Status:** ✅ Complete
