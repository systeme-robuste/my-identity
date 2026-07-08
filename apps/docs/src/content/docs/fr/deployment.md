---
title: Déploiement
description: Comment déployer My Identity.
---

## Stack

- **Cloudflare Workers** — pour l'API et le renderer
- **Cloudflare Pages** — pour le dashboard, le marketing, et la docs
- **Neon Postgres** — base de données

## Variables d'environnement

Voir `.env.example` à la racine du monorepo.

## Commandes

```bash
# Déployer l'API
pnpm --filter @my-identity/api deploy

# Déployer le renderer
pnpm --filter @my-identity/renderer deploy

# Déployer le dashboard
pnpm --filter @my-identity/dashboard deploy

# Déployer le marketing
pnpm --filter @my-identity/marketing deploy

# Déployer la docs
pnpm --filter @my-identity/docs deploy
```

## CI/CD

Quatre GitHub Actions dans `.github/workflows/` :

- `ci.yml` — lint + typecheck + test à chaque PR
- `deploy-api.yml` — déploie l'API sur push vers `main`
- `deploy-renderer.yml` — déploie le renderer sur push vers `main`
- `deploy-dashboard.yml` — déploie dashboard + marketing + docs sur push vers `main`

## Secrets Cloudflare

À configurer dans GitHub → Settings → Secrets :

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NEON_DATABASE_URL`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MISTRAL_API_KEY`
- `TURNSTILE_SECRET`
