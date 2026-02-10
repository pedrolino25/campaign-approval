# Background Processing

Email sending must NEVER happen inside API Lambda.

---

# Flow

1. API updates DB.
2. API inserts Notification record.
3. API enqueues SQS message.
4. Worker Lambda processes message.
5. Worker calls SendGrid.
6. Worker marks notification delivered.

---

# Worker Rules

- Must fetch fresh DB state.
- Must be idempotent.
- Must handle duplicate messages.
- Must not crash on retry.
- Must log failures.

---

# SQS Rules

- Dead Letter Queue required.
- Max receive count = 5.
- Payload must only contain IDs.
- No large payloads allowed.