# ReviewItem State Machine

State transitions are enforced server-side only.

Frontend cannot mutate status directly.

---

# Allowed States

- draft
- pending_review
- changes_requested
- approved
- archived

---

# Allowed Transitions

draft → pending_review
pending_review → approved
pending_review → changes_requested
changes_requested → pending_review
approved → draft (triggered by new version upload)
draft → archived
approved → archived

No other transitions allowed.

---

# Automatic Transitions

If new attachment uploaded:
- approved → draft
- pending_review → draft
- changes_requested → no change

---

# Invalid Transitions

- approved → pending_review (without new version)
- changes_requested → approved
- archived → any
- draft → approved
- reviewer triggering draft transitions

Invalid transitions must return 409 Conflict.

---

# Transition Rules

- Every transition must log ActivityLog.
- Every transition must create Notification.
- Transition must be idempotent.