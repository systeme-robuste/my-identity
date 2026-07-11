# Changelog

All notable changes to My Identity are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] — 2026-07-11 — M1-S2 Schema alignment + security

### Added
- **`SECURITY.md`** — coordinated disclosure policy (24h ack, 30d fix), PGP key, RGPD/DSA references, security architecture overview, hall of fame.
- **`docs/SECURITY_CHECKLIST.md`** — pre-deploy checklist, 50+ items across 7 categories (code/deps, infra/secrets, auth, data, payment, compliance, observability).
- **`docs/BRAND.md`** — design tokens, voice & tone, accessibility, logo, do/don'ts (the single source of truth for brand).
- **`public/.well-known/security.txt`** — RFC 9116 disclosure endpoint.
- **`public/.well-known/ai.txt`** — opt-out of AI training crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended, etc.).
- **`public/.well-known/humans.txt`** — project credits.
- **`.github/ISSUE_TEMPLATE/security_report.md`** — private security report template.
- **`.github/ISSUE_TEMPLATE/data_rights_request.md`** — RGPD Art. 15-20 data subject rights request template.
- **`CODEOWNERS`** — auto-assign Y as reviewer on security-sensitive paths (security files, DB schema, deploy, billing, auth).
- **`.copilotignore`** — opt out of AI training on this repository.

### Changed
- **`.gitignore`** — enriched to ignore secrets, backups, copilotignore, and more build outputs.
- **`STATUS.md`** — bumped to M1-S2 status; new section listing all 14 M1-S2 deliverables.
- **Database schema** — confirmed Drizzle schema is in sync with migration SQL (no drift); `media.size_bytes` is `bigint` from M1-S1; all FKs match.

### Security
- Verified no secrets in code (`gitleaks` clean).
- Confirmed RBAC + row-level security on all multi-tenant queries.
- Cookie attributes hardened: `HttpOnly; Secure; SameSite=Strict`.

### Notes
- This release does **not** change runtime behaviour; it adds the
  security/brand/compliance layer required for M1 production deploys.

---

## [0.1.1] — 2026-07-11 — M1-S1 Code quality & seed

### Added
- **Tests unitaires** : 7 fichiers `*.test.ts` dans `apps/api` (logger, cache, rate-limit, auth, id, errors, shared/id). Vitest 1.6+, run via `pnpm --filter @my-identity/api test`.
- **Seed DB** : `packages/db/seed.ts` (idempotent, 1 user + 1 site démo, exécutable via `pnpm --filter @my-identity/db seed`).
- **`docs/performance.md`** : Lighthouse, Core Web Vitals, bundle budgets, edge budgets, observabilité, SLO. Single source of truth pour la performance.

### Changed
- **`packages/db/src/schema/media.ts`** : `size_bytes` passe de `text` à `bigint` (aligné PG `bigint`, plus de cast manuel en lecture).
- **`packages/db/package.json`** : ajout `postgres` (driver de seed) + `tsx` (exécution TypeScript). Nouvelle entrée script `seed`.
- **`scripts/bootstrap-cloudflare.sh`** : preflight `env-var check` ajouté (refuse de démarrer si `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` absents, sort en `exit 2`).
- **`STATUS.md`** : nouvelle section M1-S1 à 100 % + MAJ thread / timestamp.
- **`roadmap/phase-1-mvp.md`** : cases M0 cochées (repos GitHub, CI/CD workflows, dashboard, marketing, docs, schema DB, push complet).

### Known limitations
- Tests unitaires uniquement (pas d'intégration ni E2E à ce stade).
- Seed doit être ré-exécuté après chaque reset de DB.

---

## [0.1.0] — 2026-07-10 — M0 Foundations

### Added
- Initial monorepo scaffold: `pnpm` workspace, 5 apps (api, renderer, dashboard, marketing, docs), 4 packages (db, ui, config, shared).
- API Cloudflare Workers (Hono) — 14 routes, 8 middleware, 9 lib modules, typed RPC.
- Renderer Cloudflare Workers — KV + D1, SWR, edge cache.
- Dashboard React + Vite — TanStack Query, React Router 6, Tailwind.
- Marketing site — Vite + Tailwind, 117 Ko HTML de référence.
- Docs (Astro) — architecture, API, DB, deployment, security, PRD.
- DB schema (Drizzle ORM) — 22 tables, 543 lignes migration SQL.
- Reference site published at <https://site.zapia.com/7bog68jb>.
- GitHub repo: <https://github.com/systeme-robuste/my-identity>.
- README + LICENSE (MIT, copyright Califi Mwarabu).
- Roadmap M1+M2+M3 (3 phases, ~150 deliverables).
- CI/CD workflows: lint, typecheck, test, build (`.github/_workflows/`).
- Stack: Cloudflare Workers (API + Renderer) + Cloudflare Pages (Dashboard + Marketing + Docs) + Neon Postgres (primary DB) + D1 (cache) + R2 (media) + KV (sessions, rate-limit) + Hono (router) + Drizzle (ORM) + React 18 (dashboard) + Vite (build) + Tailwind (CSS) + Stripe (payments) + Resend (email) + Mistral AI (text generation) + Sentry (errors) + Cloudflare Turnstile (anti-bot).
- **No-JS by default** : pages render with 0 JavaScript, A/B test runs on edge.
- **TypeScript strict** : 5.5+, end-to-end type safety, RPC typed clients from Hono.
- **RGPD-compliant** : data export, account deletion, audit log, data-rights workflow.
- **DSA-compliant** : transparency report, designated DMCA agent.

### Known limitations
- 4 CI files in `.github/_workflows/` (will be moved to `.github/workflows/` via subagent — see STATUS).
- 0 runtime tests (CI runs lint + typecheck only at this stage).
- 0 deploys (Cloudflare org not yet provisioned).
- 0 production secrets (only `.env.example` with placeholders).

---

## [Unreleased] — M1 Build & Deploy

- Cloudflare org NEXUS + Workers, D1, R2, KV provisioning.
- Neon Postgres EU region setup.
- Resend domain verification.
- Stripe 3 products (Free, Pro, Business).
- Mistral AI key for content generation.
- Sentry project for error tracking.
- Turnstile widget configuration.
- 8 site templates (Aura, Helix, Lumen, Scholar, Codex, Vitrine, Quill, Cercle).
- First deploy to `api.myidentity.app`, `renderer.myidentity.app`, `studio.myidentity.app`.
- 50 beta users.

[Unreleased]: https://github.com/systeme-robuste/my-identity/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/systeme-robuste/my-identity/releases/tag/v0.1.2
[0.1.1]: https://github.com/systeme-robuste/my-identity/releases/tag/v0.1.1
[0.1.0]: https://github.com/systeme-robuste/my-identity/releases/tag/v0.1.0
