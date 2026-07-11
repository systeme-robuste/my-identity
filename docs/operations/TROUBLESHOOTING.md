# My Identity — Troubleshooting Guide

**Last updated:** 2026-07-11
**For:** Y (CMS) + future on-call engineers
**Audience:** technical, but not necessarily familiar with My Identity internals

---

## Table of contents

1. [Health check failing](#1-health-check-failing)
2. [Workers returning 500 errors](#2-workers-returning-500-errors)
3. [Database connection errors](#3-database-connection-errors)
4. [Stripe webhook not firing](#4-stripe-webhook-not-firing)
5. [Email not delivered](#5-email-not-delivered)
6. [Sites not rendering](#6-sites-not-rendering)
7. [Slow responses](#7-slow-responses)
8. [Rate limit triggered too aggressively](#8-rate-limit-triggered-too-aggressively)
9. [Migrations failing](#9-migrations-failing)
10. [Storage (R2) upload failing](#10-storage-r2-upload-failing)

---

## 1. Health check failing

**Symptom:** `curl https://api.myidentity.app/health` returns non-200.

**Diagnosis:**

```bash
# 1. Check if the API is reachable at all
curl -v https://api.myidentity.app/health 2>&1 | head -30

# 2. Check Cloudflare Workers status
# Visit https://www.cloudflarestatus.com
# Look for "Workers" service

# 3. Tail the worker logs
wrangler tail --name my-identity-api --format=pretty
```

**Common causes:**

- **Worker not deployed** — run `pnpm deploy:api` (see `PHASE1.md` § 6)
- **Custom domain not routed** — check `wrangler.toml` routes section
- **Cloudflare account suspended** — log in to dash.cloudflare.com to check
- **DNS not propagated** — wait up to 48h, or check with `dig myidentity.app`

**Fix:** deploy or re-deploy the worker, verify routes in Cloudflare dashboard.

---

## 2. Workers returning 500 errors

**Symptom:** API responses show `500 Internal Server Error` in logs.

**Diagnosis:**

```bash
# 1. Get the last 100 error logs
wrangler tail --name my-identity-api --format=json | jq 'select(.outcome == "exception")' | tail -100

# 2. Check Sentry (if enabled)
# Visit https://sentry.io → my-identity-api project

# 3. Reproduce locally
DATABASE_URL=... pnpm --filter @my-identity/api dev
```

**Common causes:**

- **Database connection lost** — Neon auto-suspends; first query triggers cold start. Wait 5-10s and retry.
- **Missing environment variable** — check `wrangler secret list`
- **Code bug** — check git log, see if a recent deploy introduced a regression
- **Drizzle schema mismatch** — re-run migrations: `pnpm --filter @my-identity/db migrate`

**Fix:** deploy a known-good version (`wrangler rollback`), or fix the bug and redeploy.

---

## 3. Database connection errors

**Symptom:** logs show `Error: connect ECONNREFUSED` or `NeonDbError`.

**Diagnosis:**

```bash
# 1. Verify the DATABASE_URL is set correctly in the worker
wrangler secret list | grep DATABASE

# 2. Test the connection locally
DATABASE_URL=$NEON_DATABASE_URL psql $NEON_DATABASE_URL -c "SELECT 1"

# 3. Check Neon status
# Visit https://neonstatus.com

# 4. Check connection pooler
# Neon pooled connection: port 5432 with -pooler suffix in hostname
# Direct connection: port 5432, no -pooler
```

**Common causes:**

- **Wrong URL** (pooled vs unpooled, wrong region)
- **Neon project paused** — first request after pause takes 1-2s (cold start)
- **Connection limit reached** — Neon free tier has 100 connections max
- **SSL not enabled** — connection string must include `?sslmode=require`

**Fix:** update the secret, restart the worker, or upgrade Neon tier.

---

## 4. Stripe webhook not firing

**Symptom:** Customer paid on Stripe, but the order stays `pending` in My Identity DB.

**Diagnosis:**

```bash
# 1. Check Stripe dashboard
# Visit https://dashboard.stripe.com/webhooks
# Look for the endpoint https://api.myidentity.app/v1/webhooks/stripe
# Check "Logs" tab for delivery attempts

# 2. Check signature verification
# Webhook secret must match what's in STRIPE_WEBHOOK_SECRET

# 3. Tail API logs while triggering a test event
wrangler tail --name my-identity-api --format=pretty
# In Stripe dashboard, click "Send test event"
```

**Common causes:**

- **Webhook endpoint URL incorrect** — must be `https://api.myidentity.app/v1/webhooks/stripe`
- **STRIPE_WEBHOOK_SECRET mismatch** — copy the signing secret from Stripe dashboard
- **Worker returning 4xx** — signature verification fails; check `wrangler tail`
- **Stripe account in test mode but API in live mode** (or vice-versa)

**Fix:** update the secret, ensure the endpoint is enabled, re-test.

---

## 5. Email not delivered

**Symptom:** User signs up but receives no confirmation email.

**Diagnosis:**

```bash
# 1. Check Resend dashboard
# Visit https://resend.com/emails
# Look for the recent email, check status (Sent, Delivered, Bounced)

# 2. Check SPF/DKIM/DMARC records on the sending domain
dig TXT myidentity.app
# Should include v=spf1 include:_spf.resend.com ~all

# 3. Check the "from" address
# For new domains, must be on a verified domain
# Default in My Identity: hello@myidentity.app
```

**Common causes:**

- **Domain not verified in Resend** — must add the DNS records Resend shows
- **"From" address on unverified domain** — must use `noreply@myidentity.app` or similar
- **Recipient marked as spam** — check spam folder, request whitelisting
- **Resend free tier limit reached** — 100 emails/day, 3000/month

**Fix:** verify the domain, update the from address, or upgrade Resend.

---

## 6. Sites not rendering

**Symptom:** User creates a site, but visiting `https://<username>.myidentity.app` shows 404 or a generic error.

**Diagnosis:**

```bash
# 1. Check the renderer worker
curl https://renderer.myidentity.app/health

# 2. Check the public site endpoint
curl https://api.myidentity.app/v1/sites/<slug>
# Should return site JSON with status: "published"

# 3. Check the R2 cache
# Visit Cloudflare dashboard → R2 → my-identity-media
# Look for the site bundle in /sites/<site-id>/

# 4. Check the renderer's cache (D1)
wrangler d1 execute my-identity-render-cache --command "SELECT * FROM cache WHERE slug = '<slug>'"
```

**Common causes:**

- **Site not published** — owner must click "Publish" in the dashboard
- **Custom domain not configured** — `*.myidentity.app` wildcard must be routed to renderer
- **R2 cache empty** — renderer failed to pre-render; check worker logs
- **D1 cache miss + slow DB** — first request after deploy can be slow

**Fix:** verify the route, force a re-publish from the dashboard, or pre-warm the cache.

---

## 7. Slow responses

**Symptom:** API takes >2s to respond on first request, or consistently >500ms.

**Diagnosis:**

```bash
# 1. Run k6 stress test
k6 run --out json=results.json e2e/load/k6-smoke.js

# 2. Check Neon performance
# Visit https://console.neon.tech → Metrics
# Look for "CPU" and "Connections" graphs

# 3. Check D1 performance
wrangler d1 insights my-identity-cache

# 4. Check Workers analytics
# Visit Cloudflare dashboard → Workers → my-identity-api → Metrics
```

**Common causes:**

- **Cold start** — first request after idle takes ~500ms (Cloudflare Workers)
- **DB cold start** — Neon auto-suspends after 5min idle; first query takes ~1-2s
- **Missing index** — Drizzle should add them, but check `EXPLAIN ANALYZE` on slow queries
- **Network** — distance to nearest Cloudflare data center (Frankfurt for EU, often best for Africa)

**Fix:** upgrade Neon to "Always on" tier, add cache layer (already in lib/cache.ts), or pre-warm with cron.

---

## 8. Rate limit triggered too aggressively

**Symptom:** Legitimate users get 429 "Too Many Requests" responses.

**Diagnosis:**

```bash
# 1. Check current rate limits in the code
grep -r "rateLimit" apps/api/src/

# 2. Check the rate limit KV
wrangler kv:key list --binding=RATE_LIMIT | head

# 3. Tail logs for 429 responses
wrangler tail --name my-identity-api --format=pretty | grep 429
```

**Common causes:**

- **Limits too strict** — default is 60 req/min per IP, may need to bump for the dashboard
- **Shared IP** — office, school, or VPN — many users share one IP
- **Bot/automation** — actual abuse, but catching real users

**Fix:** increase limits in `apps/api/src/lib/rate-limit.ts`, or implement user-based limits (after auth).

---

## 9. Migrations failing

**Symptom:** `pnpm --filter @my-identity/db migrate` returns errors.

**Diagnosis:**

```bash
# 1. Validate the migration first
bash scripts/validate-migrations.sh

# 2. Check for drift
DATABASE_URL=$NEON_DATABASE_URL_UNPOOLED pnpm drizzle-kit check

# 3. Check for conflicting migrations
ls packages/db/migrations/
# Migrations must be applied in order: 0001, 0002, 0003, ...
```

**Common causes:**

- **Out-of-order migrations** — Drizzle sorts by filename, so always use `0001_`, `0002_`, ...
- **SQL syntax error** — check the .sql file manually
- **Drift between schema.ts and migrations/** — regenerate: `pnpm --filter @my-identity/db generate`
- **Lock conflict** — another migration is running; wait 1 minute

**Fix:** validate, regenerate, retry. If production is broken, restore from backup.

---

## 10. Storage (R2) upload failing

**Symptom:** User uploads an image, but it doesn't appear on the site.

**Diagnosis:**

```bash
# 1. Check R2 bucket exists
wrangler r2 bucket list

# 2. Check the file was uploaded
# Visit Cloudflare dashboard → R2 → my-identity-media
# Navigate to the expected path (e.g., /uploads/<user-id>/<file-id>)

# 3. Check the public URL
curl -I https://media.myidentity.app/<path>
# Should return 200 with correct Content-Type
```

**Common causes:**

- **R2 bucket not created** — run `scripts/bootstrap-cloudflare.sh`
- **Public access not enabled** — R2 requires explicit public access for serving
- **Custom domain not configured** — `media.myidentity.app` must point to R2
- **CORS issue** — if the browser blocks, check R2 CORS settings

**Fix:** enable R2 public access, configure custom domain, or serve via the API.

---

## Escalation

If none of the above resolves the issue:

1. Check `#my-identity-ops` Slack channel (if configured)
2. File a bug at https://github.com/systeme-robuste/my-identity/issues
3. Email `support@myidentity.app` (or `robuste.blogs@gmail.com` during MVP)
4. Check `docs/SECURITY.md` for security-specific incidents

---

_Last reviewed: 2026-07-11 — Y + Zapia. Add new issues here as they arise._
