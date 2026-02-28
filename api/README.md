# Worklient Backend – Complete Local Development Guide

This guide contains **every required step** to run the backend locally from scratch.

It assumes macOS and Node.js 20.

No production instructions are included here. This document is strictly for **local development setup**.

---

# 0. Prerequisites

Install the following:

```bash
brew install node
brew install mkcert
brew install postgresql
```

Then install mkcert root CA:

```bash
mkcert -install
```

Ensure you are using Node 20:

```bash
node -v
```

---

# 1. Configure Local Domains (/etc/hosts)

We use custom local domains to mirror production cookie behavior.

## 1.1 Edit Hosts File

Open terminal:

```bash
sudo nano /etc/hosts
```

Add the following lines at the bottom:

```
127.0.0.1 app.worklient.test
127.0.0.1 api.worklient.test
```

Save with:

* Control + O
* Enter
* Control + X

---

## 1.2 Flush DNS Cache

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

---

## 1.3 Verify

```bash
ping api.worklient.test
```

It must resolve to:

```
127.0.0.1
```

---

# 2. Environment Variables

The backend uses strict runtime validation. Missing or empty variables will crash startup.

We maintain three environment files:

* `.env.local` → local development
* `.env.dev` → mirrors deployed dev
* `.env.prod` → mirrors production

Never commit real secrets.

---

## 2.1 Create `.env.local`

Inside `api/` create:

```
.env.local
```

Example:

```env
ENVIRONMENT=dev

DATABASE_URL=postgresql://user:password@localhost:5432/worklient

SESSION_SECRET=generated_secret
ACTIVATION_COOKIE_SECRET=generated_secret
CLOUDFRONT_REQUEST_ID_SECRET=generated_secret

COGNITO_USER_POOL_ID=us-east-1_xxxxx
COGNITO_APP_CLIENT_ID=xxxxxxxxxxxx

S3_BUCKET_NAME=dev-worklient-storage

FRONTEND_URL=https://app.worklient.test:3000
WORKLIENT_API_URL=https://api.worklient.test:4001

SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/xxxx/dev-queue

SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@worklient.com
```

---

## 2.2 Generate Secure Secrets

```bash
openssl rand -hex 64
```

Generate separate values for:

* SESSION_SECRET
* ACTIVATION_COOKIE_SECRET
* CLOUDFRONT_REQUEST_ID_SECRET

---

# 3. Prisma – Database Setup

## 3.1 Export DATABASE_URL Manually (Optional)

To temporarily switch environments for migrations:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/worklient"
```

To switch to dev database:

```bash
export DATABASE_URL="<dev_database_url>"
```

Check current value:

```bash
echo $DATABASE_URL
```

---

## 3.2 Install Dependencies

```bash
yarn install
```

---

## 3.3 Generate Prisma Client

```bash
yarn prisma generate
```

---

## 3.4 Run Migrations Locally

```bash
yarn prisma migrate dev
```

This will:

* Apply pending migrations
* Create migration if schema changed
* Regenerate Prisma client

---

## 3.5 Deploy Migrations (Dev DB)

If targeting an existing environment:

```bash
yarn prisma migrate deploy
```

Never use `migrate dev` against shared dev DB.

---

# 4. HTTPS Certificates (Required for Auth)

Backend must run on HTTPS to:

* Avoid mixed-content errors
* Support Secure cookies
* Mirror production behavior

---

## 4.1 Generate Backend Certificate

Inside `api/`:

```bash
mkcert api.worklient.test
```

This generates:

```
api.worklient.test.pem
api.worklient.test-key.pem
```

Do not commit these files.

---

# 5. Running Backend Locally

We run two processes:

1. serverless-offline (port 4000)
2. HTTPS proxy (port 4001)

---

## 5.1 Start Backend

```bash
yarn dev
```

This runs both processes using concurrently.

---

## 5.2 Verify Backend

Open:

```
https://api.worklient.test:4001/api-docs
```

Swagger must load.

---

# 6. Full Local URLs

Frontend:

```
https://app.worklient.test:3000
```

Backend:

```
https://api.worklient.test:4001
```

---

# 7. Common Issues

## Mixed Content Error

Frontend must call HTTPS backend.

---

## Missing Session Cookie

Occurs if:

* Not logged in
* Cookie Secure flag used over HTTP
* Domain mismatch

Ensure both frontend and backend use HTTPS.

---

## Env Validation Failure

Ensure:

* All required variables defined
* No empty values
* No trailing spaces

---

# 8. Clean Restart Procedure

If something behaves unexpectedly:

```bash
rm -rf dist
rm -rf node_modules

yarn install
yarn prisma generate
yarn dev
```

---

# 9. Local Development Checklist

* [ ] Hosts configured
* [ ] mkcert installed
* [ ] Certificates generated
* [ ] .env.local created
* [ ] DATABASE_URL correct
* [ ] Prisma migrations applied
* [ ] yarn dev running
* [ ] Swagger loads
* [ ] No mixed-content errors

---

Backend is now fully runnable locally with production-grade parity.
