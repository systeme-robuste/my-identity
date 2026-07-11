# Phase 1 — Provisioning checklist

> **Goal**: take the M1 code from "compiles + tests pass" to "API live on Cloudflare Workers, DB on Neon, payments on Stripe".
> **Owner**: Y (CMS) + Zapia (CAO).
> **ETA**: < 1 hour once all 8 secrets are in hand.

## Prerequisites (8 secrets)

| # | Secret | Source | Used by |
|---|--------|--------|---------|
| 1 | `CLOUDFLARE_API_TOKEN` | https://dash.cloudflare.com/profile/api-tokens | bootstrap script, CI deploys |
| 2 | `CLOUDFLARE_ACCOUNT_ID` | https://dash.cloudflare.com — right sidebar | bootstrap script |
| 3 | `NEON_DATABASE_URL` | https://console.neon.tech — connection string | API + seed |
| 4 | `NEON_DATABASE_URL_UNPOOLED` | same, "Pooled" off | migrations only |
| 5 | `RESEND_API_KEY` | https://resend.com/api-keys | transactional email |
| 6 | `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/apikeys | checkout + webhooks |
| 7 | `STRIPE_WEBHOOK_SECRET` | https://dashboard.stripe.com/webhooks | webhook handler |
| 8 | `MISTRAL_API_KEY` | https://console.mistral.ai | AI assistant |
| 9 | `SENTRY_DSN` (optional) | https://sentry.io | error reporting |
| 10 | `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (optional) | https://dash.cloudflare.com/?to=/:account/turnstile | bot protection |

## Steps

### 1. Bootstrap Cloudflare resources (5 min)

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
bash scripts/bootstrap-cloudflare.sh
```

This creates:
- Worker `my-identity-api` (production)
- Worker `my-identity-renderer`
- D1 database `my-identity-cache`
- R2 bucket `my-identity-media`
- KV namespaces `my-identity-sessions`, `my-identity-rate-limit`, `my-identity-audit-log`
- Custom domains `api.myidentity.app`, `renderer.myidentity.app`

The script updates `apps/api/wrangler.toml` and `apps/renderer/wrangler.toml` with the real resource IDs.

### 2. Provision Neon (2 min)

1. Go to https://console.neon.tech
2. Create project `my-identity`
3. Copy the **pooled** URL → `NEON_DATABASE_URL`
4. Copy the **direct** URL → `NEON_DATABASE_URL_UNPOOLED`
5. (Optional) enable branching for staging

### 3. Apply migrations to Neon (1 min)

```bash
NEON_DATABASE_URL_UNPOOLED=... pnpm --filter @my-identity/db migrate
```

Or use the script: `bash scripts/migrate.sh` (uses the `validate-migrations.sh` pattern).

### 4. Seed the staging DB (1 min)

```bash
NEON_DATABASE_URL=... bash scripts/seed-local.sh
```

Demo credentials: `demo@myidentity.local / demo1234`.

### 5. Set the secrets in Cloudflare (5 min)

```bash
# For each secret
echo "$STRIPE_SECRET_KEY" | wrangler secret put STRIPE_SECRET_KEY
echo "$RESEND_API_KEY"   | wrangler secret put RESEND_API_KEY
# ... repeat for all
```

Or use the GitHub Actions workflow `deploy-api.yml` which reads from GitHub Secrets.

### 6. Deploy (2 min)

```bash
pnpm deploy:api
pnpm deploy:renderer
```

### 7. Smoke test (2 min)

```bash
bash scripts/smoke-test.sh https://api.myidentity.app
```

Expected output:
- `/health` → 200, `{ok: true}`
- `/v1/sites` (unauth) → 401
- A demo site fetched from /v1/sites/:slug → 200

## Rollback

If anything goes wrong:

```bash
# Revert the last deploy
wrangler rollback --name my-identity-api

# Restore the DB from a backup
bash scripts/restore-db.sh ~/backups/my-identity_2026-07-11.dump
```

## Post-Phase 1

- Configure Stripe webhooks to point to `https://api.myidentity.app/v1/webhooks/stripe`
- Configure Resend domain (SPF + DKIM)
- Set up Cloudflare Analytics
- Enable Sentry (paste DSN into env)
- Enable Turnstile on all public forms
- Run first E2E test against production
