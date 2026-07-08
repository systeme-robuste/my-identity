# Security

> Threat model, RGPD/DSA/DMCA posture, and the controls we ship by default.

## Threat model

| Threat | Mitigation |
|--------|-----------|
| Credential stuffing | Argon2id passwords (memory-hard, t=3, p=4, m=64 MiB), rate limit 5/min on `/auth/login`, Turnstile on signup and login, breach password check (HaveIBeenPwned k-anonymity API) |
| Session theft | HttpOnly + Secure + SameSite=Lax cookies, 30-day rolling TTL with refresh on use, server-side session store in KV, IP/UA pinning optional via `AUTH_SESSION_PIN=strict` |
| CSRF | SameSite=Lax cookies + double-submit token for state-changing requests from the dashboard |
| XSS | Renderer outputs pre-sanitized HTML; no `dangerouslySetInnerHTML` in studio; CSP with nonce on inline scripts, `object-src 'none'`, `frame-ancestors 'none'` |
| SQL injection | All DB access through Drizzle ORM with parameterized queries; no raw SQL except in vetted migrations |
| SSRF | Outgoing webhooks blocked from internal CIDRs (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, ::1/128, fc00::/7); DNS resolution re-checked at fetch time |
| DoS | Cloudflare WAF + Bot Fight Mode, per-IP and per-API-key rate limits, request body size cap (1 MB JSON, 25 MB media), 100 KB HTML render cap |
| Privilege escalation | Strict role check (`owner` / `admin` / `editor` / `viewer`) on every protected route; no client-side trust |
| Open redirect | Outbound redirects validated against an allowlist of customer domains; deep links use signed tokens |
| Secrets leak | `.env` in `.gitignore`, pre-commit `gitleaks` hook, GitHub secret scanning enabled, `wrangler secret put` only in CI |
| Supply chain | `pnpm` with `--frozen-lockfile` in CI, Dependabot weekly, Renovate for transitive deps, `npm audit` on every PR |
| Insider threat | Audit log for all write actions; quarterly access review; principle of least privilege on Cloudflare + Neon + Stripe |

## Auth model

- **Email + password** is the default. Argon2id, no password hints.
- **OAuth**: Google, GitHub (initial set), Apple (Phase 2). PKCE flow.
- **Magic link** (Phase 2): 15-min TTL, single-use.
- **API keys**: scoped (`read:sites`, `write:pages`, `read:analytics`, …), prefix `mi_` for easy detection, hashed at rest (SHA-256), shown once on creation.
- **Sessions**: opaque session ID (32 bytes, base64url), stored in KV, mapped to `{ userId, role, expiresAt, ipHash, uaHash }`.

## RGPD

- **Data export**: `GET /v1/me/export` returns a JSON+ZIP of all user data, ready within 24h via async job.
- **Data deletion**: `POST /v1/me/delete` schedules a 30-day grace period, then hard-deletes user + cascade. Audit row preserved (anonymized).
- **Consent**: per-purpose (analytics, marketing email, AI training opt-out). Stored in `users.consent` JSONB.
- **DPIA**: documented internally, available on request to DPO at <dpo@myidentity.app>.
- **Subprocessors list**: published at <https://myidentity.app/legal/subprocessors>.

## DSA (Digital Services Act)

- **Statement of reasons**: any moderation action (site taken down, content removed) is logged with the legal basis, communicated to the affected user within 7 days.
- **Transparency report**: published every 6 months at <https://myidentity.app/legal/transparency>.
- **Trusted flaggers**: mechanism documented; not yet active.
- **No profiling for advertising**: My Identity does not run ads and does not profile users for ad targeting.

## DMCA

- **Designated agent**: registered with the US Copyright Office (filing in progress).
- **Takedown form**: <https://myidentity.app/legal/dmca>.
- **Counter-notice**: 10–14 day window, then content is restored unless a court action is filed.
- **Repeat infringer policy**: 3 strikes within 12 months → account termination.

## Encryption

- **At rest**: Neon encrypts data at rest with AES-256. R2 encrypts objects with AES-256. Backups encrypted by default.
- **In transit**: TLS 1.3 only, HSTS `max-age=63072000; includeSubDomains; preload`.
- **App-level**: API keys hashed (SHA-256). PII fields (`email`, `phone`, `address`) optionally encrypted with AES-GCM using a per-tenant key derived from `AUTH_SECRET` (Phase 2).

## Audit log

Every state-changing API call is logged in `audit` with: actor (user / API key / system), action, target, before/after JSON, IP, UA, timestamp. Retained 12 months. User-accessible via the dashboard; exportable as JSON.

## Vulnerability reporting

- **Email**: <security@myidentity.app> (PGP key on the website).
- **SLA**: acknowledgement within 48h, triage within 7 days.
- **Bug bounty**: planned for Phase 2 GA. Until then, public thanks + swag for valid reports.
