# Non-Negotiable Rules

1. No direct status mutation in database.
2. No query without organization scoping.
3. No email sending in API Lambda.
4. No role enforcement in frontend only.
5. No public S3 objects.
6. No cross-tenant queries.
7. No business logic inside Lambda handler.
8. No skipping ActivityLog creation.
9. No skipping Notification creation.
10. No adding features not defined in documentation.