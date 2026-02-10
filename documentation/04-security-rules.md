# Security Rules

Strict multi-tenant isolation is mandatory.

---

# JWT Validation

Backend must:
- Validate signature via Cognito JWKS.
- Validate issuer.
- Validate audience.
- Validate expiration.

Never trust frontend claims.

---

# Multi-Tenant Enforcement

Every database query MUST include:

organizationId = currentUser.organizationId

For reviewers:

clientId = currentUser.clientId

No exceptions.

---

# S3 Rules

- Bucket must be private.
- Public access blocked.
- Only pre-signed URLs allowed.
- No public ACL.

---

# IAM Rules

- Least privilege only.
- Lambda must only access:
  - Specific S3 bucket
  - Specific SQS queue