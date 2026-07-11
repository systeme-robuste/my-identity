# Pre-deploy Security Checklist

> **M1-S2 — 50+ items across 7 categories. Review before every production
> deploy. Tick and sign off.**

Last updated: **2026-07-11** · Owner: Califi Mwarabu · Reviewer: Y

---

## 1. Code & dependencies (10)

- [ ] `pnpm audit --prod` reports **0 high / 0 critical** vulnerabilities
- [ ] `pnpm outdated` reviewed, no major version behind on runtime deps
- [ ] Lockfile (`pnpm-lock.yaml`) committed; CI uses `pnpm install --frozen-lockfile`
- [ ] No `console.log` of secrets in source
- [ ] No `eval`, `new Function`, or `Function(...)` in user-facing code
- [ ] No `dangerouslySetInnerHTML` without DOMPurify sanitization
- [ ] All dependencies declared with **exact** version ranges (no `latest`)
- [ ] License compatibility checked (no GPL in MIT project, etc.)
- [ ] Renovate / Dependabot enabled (will be added in M2)
- [ ] `gitleaks` scan returns 0 leaks in last 7 days of commits

## 2. Infrastructure & secrets (10)

- [ ] All production secrets in **Wrangler Secrets** (or equivalent) — never in code
- [ ] `.env.example` committed; **`.env` ignored** by git
- [ ] No secrets in CI logs (use `::add-mask::` or equivalent)
- [ ] Database credentials rotated within the last **90 days**
- [ ] API tokens rotated within the last **90 days**
- [ ] Service accounts use **least privilege** (no `*` permissions)
- [ ] Cloudflare WAF rules reviewed (rate limit, bot score, country block)
- [ ] DDoS protection enabled (Cloudflare proxy on all public endpoints)
- [ ] DNS records have **DNSSEC** enabled where supported
- [ ] Backups verified (Neon → R2 with restore drill in last 30 days)

## 3. Authentication & authorization (8)

- [ ] Passwords hashed with **Argon2id** (m=19 MiB, t=2, p=1)
- [ ] Cookies are `HttpOnly`, `Secure`, `SameSite=Strict`
- [ ] CSRF protection on all state-changing endpoints
- [ ] Session expiration: **30 days** rolling, **absolute 90 days**
- [ ] Rate limiting on `/api/auth/*` (10 req / 5 min / IP)
- [ ] 2FA / WebAuthn available for high-privilege accounts
- [ ] RBAC + row-level security verified on multi-tenant queries
- [ ] Password reset tokens **single-use, 15-min TTL**

## 4. Data protection (8)

- [ ] Database encryption at rest: **AES-256** (Neon default)
- [ ] Object storage encryption at rest: **AES-256** (R2 default)
- [ ] TLS 1.3 enforced (Cloudflare edge)
- [ ] HSTS enabled with `max-age=31536000; includeSubDomains; preload`
- [ ] RGPD Art. 15 (access) request flow tested with a real account
- [ ] RGPD Art. 17 (erasure) request flow tested with a real account
- [ ] Data export produces valid JSON + CSV (Art. 20 portability)
- [ ] Audit log retains **365 days** of all writes

## 5. Payment & billing (6)

- [ ] Stripe webhook signatures verified (`stripe.webhooks.constructEvent`)
- [ ] No card data ever touches our servers (Stripe Elements / Checkout)
- [ ] Idempotency keys on all payment-mutating endpoints
- [ ] 3DS / SCA triggered for EU cards
- [ ] Refund flow tested end-to-end in test mode
- [ ] PCI-DSS scope verified (SAQ A, since we use Stripe Elements)

## 6. Compliance & legal (6)

- [ ] Privacy policy published & linked in footer
- [ ] Terms of service published & linked in footer
- [ ] Cookie banner compliant with EU cookie law (e-Consent)
- [ ] Data Processing Agreement (DPA) available on request
- [ ] DMCA designated agent registered with US Copyright Office
- [ ] Transparency report published at `/transparency` (DSA Art. 15)

## 7. Observability & incident response (6)

- [ ] Sentry error tracking active on all apps
- [ ] Uptime monitoring (status.myidentity.app, ping every 60s)
- [ ] Alerts configured: error rate >1%, p95 latency >500ms, CPU >80%
- [ ] Incident runbook in `docs/INCIDENT_RESPONSE.md`
- [ ] On-call rotation defined (currently: Califi Mwarabu, 24/7)
- [ ] Post-mortem template ready (`docs/POSTMORTEM_TEMPLATE.md`)

---

**Sign-off**

| Role | Name | Date | Signature |
| ---- | ---- | ---- | --------- |
| Engineering Lead | Califi Mwarabu | | |
| Security Reviewer | Califi Mwarabu | | |
| Product Owner | Califi Mwarabu | | |

— *This checklist is mandatory before any production deploy. If any item
cannot be checked, document the exception in `docs/SECURITY_EXCEPTIONS.md`.*
