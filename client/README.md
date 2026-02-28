# Worklient Frontend – Complete Local Development Guide

This document explains **every required step** to run the frontend locally with full backend integration and production‑like behavior.

This guide assumes:

* macOS
* Node.js 20
* Backend already configured per backend README

---

# 0. Prerequisites

Ensure the following are installed:

```bash
brew install node
brew install mkcert
```

Verify Node version:

```bash
node -v
```

Must be Node 20.

---

# 1. Configure Local Domain (/etc/hosts)

The frontend must run on a custom HTTPS domain to:

* Mirror production cookie behavior
* Support Secure cookies
* Avoid SameSite issues

---

## 1.1 Edit Hosts File

```bash
sudo nano /etc/hosts
```

Add:

```
127.0.0.1 app.worklient.test
```

Save:

* Control + O
* Enter
* Control + X

---

## 1.2 Flush DNS

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

---

## 1.3 Verify

```bash
ping app.worklient.test
```

Must resolve to:

```
127.0.0.1
```

---

# 2. HTTPS Certificate (Required)

Frontend must run over HTTPS.

---

## 2.1 Install mkcert (if not installed)

```bash
brew install mkcert
mkcert -install
```

---

## 2.2 Generate Certificate

From inside the frontend root folder:

```bash
mkcert app.worklient.test
```

This generates:

```
app.worklient.test.pem
app.worklient.test-key.pem
```

Do not commit these files.

---

# 3. Environment Variables

Create a file:

```
.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=https://api.worklient.test:4001
NEXT_PUBLIC_ENVIRONMENT=local
```

Important:

* Backend must already be running on HTTPS port 4001
* API URL must use HTTPS

---

# 4. Install Dependencies

From frontend root:

```bash
yarn install
```

---

# 5. Start Frontend

```bash
yarn dev
```

Open:

```
https://app.worklient.test:3000
```

You may need to trust the mkcert certificate the first time.

---


# 6. Full Local Stack Summary

Frontend:

```
https://app.worklient.test:3000
```

Backend:

```
https://api.worklient.test:4001
```

Both must be running simultaneously.

---

# 7. Common Issues

## Mixed Content Error

Ensure API URL is HTTPS.

---

## Cookies Not Being Set

Ensure:

* Backend running on HTTPS
* Domain is `.local.worklient.test`
* Secure flag enabled

---

## Certificate Warning

Run:

```bash
mkcert -install
```

Regenerate certificates if needed.

---

# 8. Clean Restart Procedure

```bash
rm -rf .next
rm -rf node_modules

yarn install
yarn dev
```

---

Frontend is now fully runnable locally with production‑grade behavior.
