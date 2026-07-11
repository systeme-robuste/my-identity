# Phase 1: MVP (months 1-4, target 2026-10)

## Goal
Ship a usable, RGPD-compliant, single-bill alternative to Carrd + Systeme.io. Public launch on Product Hunt.

## Deliverables

### 1. Infrastructure (week 1-2)
- [x] Cloudflare account setup (org: NEXUS) — _script `bootstrap-cloudflare.sh` prêt (M1-S2)_
- [x] Workers project initialized (TypeScript + Hono) — _`apps/api` (M0)_
- [x] D1 database created (cache layer) — _schema M0, instance créée en M1-S2_
- [x] Neon Postgres provisioned (primary DB) — _schema Drizzle M0, instance à provisionner en M1-S2_
- [x] R2 bucket created (assets) — _script prêt (M1-S2)_
- [x] KV namespace created (cache) — _script prêt (M1-S2)_
- [ ] Resend account + domain verified — _M1-S3_
- [ ] Stripe account + products created (Free, Pro, Business) — _M1-S3_
- [ ] Mistral API key obtained — _M1-S3_
- [ ] Sentry project created — _M1-S3_
- [ ] Cloudflare Turnstile widget configured — _M1-S3_
- [x] GitHub repo: `systeme-robuste/my-identity` — _privé, 231 fichiers HEAD_
- [x] CI/CD: GitHub Actions workflow (lint, test, deploy) — _`.github/_workflows/` en cours de restauration dans `.github/workflows/`_

### 2. Auth (week 2-3)
- [ ] Email + password (Argon2id)
- [ ] Magic link (15-min TTL, signed JWT)
- [ ] OAuth: Google, GitHub
- [ ] 2FA TOTP + 8 backup codes
- [ ] Session management (HTTP-only cookies)
- [ ] Account recovery
- [ ] Rate limiting (5 failed/15min)
- [ ] Account lockout (10 failed → 1h)

### 3. Sites (week 3-4)
- [ ] Site CRUD (create, read, update, archive)
- [ ] 10 block types: Hero, Text, Image, Form, Pricing, FAQ, Footer, Embed, Code, CMS Collection
- [ ] 8 starter templates (Aura, Helix, Lumen, Scholar, Codex, Vitrine, Quill, Cercle)
- [ ] Page CRUD
- [ ] Subdomain provisioning: `{slug}.myidentity.app`
- [ ] Custom domain (CNAME + A record)
- [ ] Auto-TLS (Let's Encrypt DNS-01)
- [ ] HSTS preload
- [ ] Site renderer (Workers + KV cache)
- [ ] Site state: draft, published, archived

### 4. CMS (week 4-5)
- [ ] Collections CRUD
- [ ] 9 field types: text, longtext, rich, number, boolean, date, image, file, relation
- [ ] Entries CRUD
- [ ] Public API: `GET /api/v1/sites/:id/cms/:collection`
- [ ] Display in pages: `{{cms.collection-name}}`
- [ ] Filtering, sorting, pagination
- [ ] Limits: 10K entries/collection on Pro

### 5. Forms (week 5)
- [ ] Form builder (9 field types)
- [ ] Submission handling
- [ ] Email notification
- [ ] Webhook (HMAC-signed)
- [ ] Cloudflare Turnstile integration
- [ ] Honeypot field
- [ ] Rate limit: 10/min/IP
- [ ] Dashboard: submissions list

### 6. Email (week 5-6)
- [ ] Transactional: Resend integration
- [ ] Broadcast: 1 list per site
- [ ] MJML editor (drag-and-drop + source view)
- [ ] 5 templates on Pro
- [ ] Open + click tracking
- [ ] RGPD-compliant unsubscribe
- [ ] DKIM + SPF + DMARC
- [ ] Warm-up: 50 → 50K/day over 30 days

### 7. Commerce (week 6-7)
- [ ] Stripe Checkout integration
- [ ] 1 product per site (Pro), unlimited (Business)
- [ ] USD only
- [ ] Digital goods
- [ ] Webhook: `checkout.session.completed`
- [ ] Email receipt
- [ ] "My purchases" page (proxied from Stripe)
- [ ] Stripe Tax auto-enabled

### 8. Memberships (week 7-8)
- [ ] 1 tier per site (Pro), 5 on Business
- [ ] Sign-up: email + password or magic link
- [ ] Customer portal: `/members/{site}`
- [ ] Gated content (page or CMS entry)
- [ ] Stripe Subscriptions integration
- [ ] Webhook sync (5 min)
- [ ] Session cookie scoped to site domain

### 9. Dashboard (week 4-9, ongoing)
- [ ] React + Vite + TanStack Router
- [ ] Login / signup pages
- [ ] Site list + create
- [ ] Site editor (drag-and-drop blocks)
- [ ] Page editor
- [ ] CMS collections
- [ ] Forms builder
- [ ] Email templates
- [ ] Memberships
- [ ] Settings (account, billing, API keys, team)
- [ ] Analytics (basic)

### 10. i18n (week 9)
- [ ] UI in FR / EN / ES
- [ ] Locale switcher in dashboard
- [ ] Site-level locale (one language per site at MVP)
- [ ] Date / number formatting per locale

### 11. Security & Compliance (week 9-10)
- [ ] CSP, CORS, CSRF token
- [ ] Input validation (Zod)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React default escaping)
- [ ] Secrets management (Workers Secrets)
- [ ] RGPD: data export (JSON + zip)
- [ ] RGPD: account deletion
- [ ] DSA: transparency report
- [ ] DMCA: designated agent
- [ ] Audit log
- [ ] Backup: daily snapshot, 30-day retention

### 12. Performance (week 10)
- [ ] TTFB < 50ms p50
- [ ] LCP < 1.5s p75
- [ ] CLS < 0.1
- [ ] HTML size < 50 KB gzipped
- [ ] Cache hit rate > 95%
- [ ] Image optimization (WebP, AVIF)
- [ ] Service worker for offline (site renderer)

### 13. Observability (week 10)
- [ ] Sentry error tracking
- [ ] Cloudflare Analytics Engine metrics
- [ ] Workers Tail logs
- [ ] Status page (status.myidentity.app)
- [ ] Slack alerts (error rate, latency)

### 14. Beta launch (week 11-12)
- [ ] 10 hand-picked beta users
- [ ] Onboarding flow
- [ ] Intercom / Crisp chat support
- [ ] In-app feedback widget
- [ ] Bug bash + polish
- [ ] Public launch on Product Hunt

### 15. Marketing site (week 1-12, parallel)
- [x] Site vitrine v1 (shipped 2026-07-02)
- [ ] Site vitrine v2 (FR par défaut + i18n)
- [ ] Templates marketplace
- [ ] Documentation site
- [ ] Blog (CMS-driven)
- [ ] Changelog
- [ ] Status page
- [ ] Help center

## Success criteria

- 50 beta users signed up
- 5 paying users ($45 MRR)
- p95 latency < 200ms from EU + Africa
- 99.9% uptime
- 0 critical security issues
- 4.5/5 user rating
- $0 of unexpected infra costs

## Out of scope (Phase 1)

- Automations
- AI (text generation)
- A/B testing
- Webhooks (incoming)
- Team members
- White-label
- Multi-currency
- Video hosting
- Course player
- Community features
- Mobile app
