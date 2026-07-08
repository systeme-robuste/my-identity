# Deployment

> Cloudflare-first. Each app is deployed independently via Wrangler or Cloudflare Pages.

## Prerequisites

- A Cloudflare account (the team has `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets).
- A Neon project with at least one branch per environment.
- A Stripe account (test mode for staging, live for prod).
- A Resend account with the `myidentity.app` domain verified.
- A Cloudflare R2 bucket `my-identity-media` with a public custom domain `media.myidentity.app`.
- A Cloudflare Turnstile site key for `myidentity.app` and `*.myidentity.app`.

## Provisioned resources

| Resource | Purpose | Created by |
|----------|---------|------------|
| Neon project `my-identity` | Primary DB | Neon UI / API |
| Cloudflare Worker `my-identity-api` | API | `wrangler deploy` in `apps/api` |
| Cloudflare Worker `my-identity-renderer` | Edge SSR | `wrangler deploy` in `apps/renderer` |
| Cloudflare Pages project `my-identity-dashboard` | Studio | GitHub Actions |
| Cloudflare Pages project `my-identity-marketing` | Marketing | GitHub Actions |
| Cloudflare Pages project `my-identity-docs` | Docs | GitHub Actions |
| D1 database `my-identity-cache` | Edge cache | `wrangler d1 create` |
| KV namespace `SESSIONS` | Sessions | `wrangler kv:namespace create` |
| KV namespace `RATE_LIMIT` | Rate limiting | `wrangler kv:namespace create` |
| KV namespace `RENDER_CACHE` | Rendered HTML cache | `wrangler kv:namespace create` |
| R2 bucket `my-identity-media` | Media | `wrangler r2 bucket create` |

## Environment matrix

| Env | Branch | API URL | Renderer URL | DB | Stripe mode |
|-----|--------|---------|--------------|----|-------------|
| Local | `feature/*` | `http://localhost:8787` | `http://localhost:8788` | Neon dev branch | test |
| Preview | PR | per-PR tunnel | per-PR tunnel | ephemeral preview | test |
| Staging | `main` | `https://api.staging.myidentity.app` | `https://staging.myidentity.app` | Neon `staging` | test |
| Production | tag `v*` or manual | `https://api.myidentity.app` | rendered on customer domains | Neon `main` | live |

## Deploy commands

```bash
# API
pnpm --filter @my-identity/api deploy

# Renderer
pnpm --filter @my-identity/renderer deploy

# Dashboard (Pages)
pnpm --filter @my-identity/dashboard build
# Cloudflare Pages picks up the dist/ on push to main via the deploy-dashboard workflow

# Marketing (Pages)
pnpm --filter @my-identity/marketing build
# Same pattern

# Docs (Pages)
pnpm --filter @my-identity/docs build
# Same pattern
```

## Secrets management

- **GitHub Actions secrets** (per environment):
  - `CLOUDFLARE_API_TOKEN` — deploy token
  - `CLOUDFLARE_ACCOUNT_ID`
  - `DATABASE_URL` — Neon pooled connection string
  - `DATABASE_URL_UNPOOLED` — Neon direct (for migrations)
  - `RESEND_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `MISTRAL_API_KEY`
  - `TURNSTILE_SECRET_KEY`
  - `AUTH_SECRET`
- **Wrangler secrets** (per Worker, per environment) are set via `wrangler secret put NAME`.
- **Never** commit real secrets. Only `.env.example` with placeholders is in git.

## Database migrations on deploy

- On every push to `main`, the API deploy workflow runs `pnpm --filter @my-identity/db migrate` against the staging database before deploying the API.
- Production migrations are gated behind a manual approval (`environment: production` with required reviewers).
- Migrations are forward-only. Rollbacks are written as new migrations.

## Rollback

- **API / Renderer**: `wrangler rollback --message "..."` from the Cloudflare dashboard, or `pnpm --filter @my-identity/api rollback` (alias).
- **Dashboard / Marketing / Docs**: revert the commit on `main` and push — Pages redeploys the previous build in ~30s.
- **DB**: write a new migration that undoes the change. Do not edit applied migrations.

## Post-deploy checks

- API: `curl -fsS https://api.myidentity.app/health` returns `{"ok":true,"env":"production"}`.
- Renderer: open a preview domain, confirm Lighthouse ≥ 95 on all four categories.
- Dashboard: log in, create a site, publish a page, confirm it renders.
- Stripe webhook: `stripe trigger checkout.session.completed` against the live endpoint returns 2xx.
