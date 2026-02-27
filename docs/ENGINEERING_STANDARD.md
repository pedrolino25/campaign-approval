# Engineering Standard

## 1. Core Philosophy

The codebase adheres to the following principles:

- **Structural Simplicity**: Code must be directly understandable without mental indirection. Avoid unnecessary abstraction layers.
- **Deterministic Behavior**: All failures propagate explicitly. No silent degradation.
- **Explicit Boundaries**: Domain, transport, and persistence layers remain strictly separated.
- **Tenant Isolation by Construction**: Organization scoping is enforced structurally at repository level.
- **Atomic Invariants**: All business invariants are validated within transaction boundaries.
- **Minimal Surface Area**: Introduce new abstractions only when justified by multiple concrete use cases.
- **Security Before Optimization**: Correctness and isolation take precedence over micro-optimizations.

## 2. Forbidden Patterns

The following patterns are prohibited:

- **No handler-owned transactions**: Handlers delegate to services
- **No statusCode in DomainError**: Domain errors contain no HTTP semantics
- **No swallowed catch blocks**: All errors must propagate or be explicitly handled
- **No `{ valid: boolean }` validation**: Validation throws DomainError on failure
- **No updateMany + reload**: Use atomic updates with version checks
- **No DB calls inside loops**: Batch operations using `createMany` or `findMany` with `in` clause
- **No pass-through service layers**: Services must add value beyond delegation
- **No wrapper classes without state**: Utility functions preferred over stateless wrappers
- **No global repository mutations**: All mutations scoped by organization
- **No multi-tenant access without org filter**: Every query includes `organizationId`
- **No business logic in handlers**: Handlers are transport layer only

## 3. Required Patterns

The following patterns are mandatory:

- **Throw-based validation**: Validation functions throw `ValidationError` on failure
- **Centralized HTTP error mapping**: `ErrorService` maps DomainError to HTTP status
- **Optimistic locking for state changes**: Entities with mutable state include `version` field
- **Repository-level org scoping**: All repository methods accept `organizationId` parameter
- **Transaction-bound invariants**: All state transitions occur within service transactions
- **Batched DB operations**: Use `createMany` for bulk inserts, `findMany` with `in` for batch reads
- **Composite indexes for pagination**: Index fields used in `where` and `orderBy` clauses
- **Explicit version increments on privilege loss**: `sessionVersion` incremented on role change, archive, or link removal

## 4. Transaction Rules

### Transaction Ownership

- All state transitions occur inside service-owned transactions
- Handlers never create transactions
- Services use `prisma.$transaction(async (tx) => { ... })`

### Invariant Validation

- No invariant checks outside transaction
- Validation occurs within transaction boundary
- Version checks occur inside transaction

### Transaction Scope

- No nested transactions
- Single transaction per service method
- Short transaction duration: <100ms target

### Side Effects

- No side effects inside transaction
- Email enqueue occurs after transaction commits
- External API calls occur after commit
- Logging allowed but must not throw

### Example

```typescript
// CORRECT
async serviceMethod(): Promise<Entity> {
  const result = await prisma.$transaction(async (tx) => {
    const entity = await this.loadAndValidate(tx)
    return await this.update(tx, entity)
  })
  
  await this.enqueueEmail(result) // After commit
  return result
}

// FORBIDDEN
async handlerMethod(): Promise<Response> {
  await prisma.$transaction(async (tx) => { // Handler owns transaction
    await service.update(tx)
  })
}
```

## 5. Error Rules

### Domain Errors

- All domain failures throw `DomainError` subclass
- No HTTP semantics in services: No statusCode, no Response types
- Error messages must be user-actionable
- Error details provide context for debugging

### Error Propagation

- No silent logging: Errors must propagate or be explicitly handled
- No partial failure masking: Failures must be reported
- Catch blocks must either rethrow or handle completely

### Error Mapping

- HTTP status mapping centralized in `ErrorService`
- Domain layer never imports HTTP types
- Handler layer maps DomainError to HTTP response

### Example

```typescript
// CORRECT
if (!entity) {
  throw new NotFoundError('Resource not found')
}

// FORBIDDEN
if (!entity) {
  logger.warn('Entity not found')
  return { success: false }
}
```

## 6. Performance Rules

### N+1 Prevention

- No per-item DB writes in loops
- Batch operations using `createMany`
- Batch reads using `findMany` with `in` clause
- Use `select` to limit fetched fields

### Query Optimization

- Always prefer `createMany` when applicable
- Always analyze `select` vs `include`: Use `select` for minimal fields
- Index every filtered pagination field
- Composite indexes for multi-field filters

### Example

```typescript
// CORRECT
const reviewerIds = clientReviewers.map(cr => cr.reviewerId)
const reviewers = await reviewerRepository.findByIds(reviewerIds)

// FORBIDDEN
for (const cr of clientReviewers) {
  const reviewer = await reviewerRepository.findById(cr.reviewerId) // N+1
}
```

## 7. Security Rules

### Tenant Isolation

- All ID-based fetches org-scoped
- Repository methods accept `organizationId` parameter
- No global queries without org filter
- NotFoundError for both missing and unauthorized resources

### Reviewer Access

- Reviewer access validated via client relation
- Reviewers cannot access resources outside assigned client
- Client link validation occurs in repository queries

### Session Management

- `sessionVersion` increment on privilege loss
- Immediate revocation on: role change, archive, link removal
- Session validation per request via DB lookup
- No session caching without invalidation strategy

### Defense in Depth

- Repository-level org scoping
- Handler-level RBAC enforcement
- Service-level business rule validation
- No direct storage URLs returned: Signed URLs generated server-side

### Example

```typescript
// CORRECT
const entity = await repository.findByIdScoped(id, organizationId)
if (!entity) throw new NotFoundError()

// FORBIDDEN
const entity = await repository.findById(id) // No org filter
if (entity.organizationId !== organizationId) {
  throw new NotFoundError() // Leaks org membership
}
```

## 8. Cursor Operating Instructions

When implementing changes, follow these rules:

1. **Never assume**: Verify patterns by reading existing code
2. **Never introduce new abstraction without 2+ real use cases**: Prefer explicit code
3. **Never duplicate validation logic**: Extract to shared validators
4. **Always ask if transaction boundary unclear**: Services own transactions
5. **Always confirm org scoping**: Every repository query includes `organizationId`
6. **Always confirm session invalidation semantics**: Increment `sessionVersion` on privilege loss
7. **Keep responses short and precise**: No verbose explanations
8. **No speculative overengineering**: Implement only what is needed

## 9. Architectural Non-Regression Rule

Any change that modifies:

- Transaction boundaries
- Repository scoping
- Session invalidation semantics
- Error propagation model
- Multi-tenant isolation
- Workflow state transitions

Must include:

1. Explicit reasoning.
2. Updated audit documentation if invariants change.
3. Concurrency and tenant-isolation validation.

### Decision Tree

**Adding a new service method:**
1. Does it modify state? → Must use transaction
2. Does it query data? → Must include org filter
3. Does it validate input? → Throw ValidationError
4. Does it check permissions? → Use authorizeOrThrow in handler

**Adding a new repository method:**
1. Does it query by ID? → Must accept `organizationId` parameter
2. Does it mutate data? → Must accept optional `tx` parameter
3. Does it filter by organization? → Include in `where` clause

**Adding a new handler:**
1. Does it need auth? → Use `createHandler` factory
2. Does it need RBAC? → Call `authorizeOrThrow`
3. Does it validate input? → Use `validateBody`/`validateParams`/`validateQuery`
4. Does it call service? → Delegate, no business logic

### Code Review Checklist

- [ ] No handler-owned transactions
- [ ] All repository queries org-scoped
- [ ] All validation throws DomainError
- [ ] No N+1 query patterns
- [ ] Batched operations where applicable
- [ ] Session invalidation on privilege loss
- [ ] No HTTP types in domain layer
- [ ] Side effects after transaction commit
- [ ] Composite indexes for pagination
- [ ] Error propagation not swallowed
- [ ] No comments
- [ ] No functions with complexity over 10
- [ ] No functions with more than 80 lines


