# Changelog

All notable changes to My Identity are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-07-10 — M0 Foundations

### Added
- **Monorepo structure** : pnpm workspaces, 5 apps (`api`, `renderer`, `dashboard`, `marketing`, `docs`) + 4 packages (`config`, `db`, `shared`, `ui`).
- **API Cloudflare Workers** (Hono) : 14 routes v1 (`auth`, `sites`, `pages`, `cms`, `forms`, `media`, `webhooks`, `api`), 8 middleware (CORS, rate-limit, auth, audit, logger), 9 lib modules (db, cache, email, ai, storage, stripe, turnstile, id, errors), typed RPC.
- **Renderer Cloudflare Workers** : SWR cache (KV + D1), edge HTML rendering, O(1) page reads.
- **Dashboard React 18** : Vite + TanStack Query + React Router 6 + Tailwind, 4 routes (dashboard, sites, analytics, login).
- **Marketing site** : Vite + Tailwind, 0 JS, Lighthouse 100/100/100/100.
- **Docs site** : Astro, 10 docs (architecture, API, DB, deployment, security, prd, roadmap, structure, development, contributing).
- **DB schema (Drizzle ORM)** : 22 tables (users, sessions, sites, pages, cms, forms, media, members, products, orders, oauth, api-keys, webhooks, automations, analytics, audit, usage, abuse, email, data-rights, gated), 543 lines migration SQL.
- **Config presets** : shared ESLint, Prettier, Tailwind, tsconfig.
- **UI package** : Modal component, hooks (useDebounce, useLocalStorage, useToggle), globals.css.
- **CI/CD workflows** : 4 GitHub Actions files (ci, deploy-api, deploy-dashboard, deploy-renderer). Currently in `.github/_workflows/` due to GitHub Contents API restrictions — see [MIGRATION.md](.github/_workflows/README.md).
- **Roadmap** : 3 phases (MVP → Beta → GA), 150+ deliverables.
- **Site de référence** : <https://site.zapia.com/7bog68jb> (v3, FR only).
- **Documentation** : `docs/` covers architecture, API contracts, DB schema, deployment, security, PRD.
- **Status dashboard** : `STATUS.md` at repo root.
- **License** : MIT, copyright Califi Mwarabu / My Identity.

### Technical choices
- **Stack** : Cloudflare Workers (API + Renderer) + Cloudflare Pages (Dashboard + Marketing + Docs) + Neon Postgres (primary DB) + D1 (cache) + R2 (media) + KV (sessions, rate-limit) + Hono (router) + Drizzle (ORM) + React 18 (dashboard) + Vite (build) + Tailwind (CSS) + Stripe (payments) + Resend (email) + Mistral AI (text generation) + Sentry (errors) + Cloudflare Turnstile (anti-bot).
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
