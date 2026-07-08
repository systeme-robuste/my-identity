# Architecture

> System architecture for My Identity. Cloudflare-first, edge-native, type-safe end-to-end.

## High-level overview

```
                        ┌────────────────────────────────────────┐
                        │  Customer browser (0-JS by default)   │
                        └────────────┬───────────────────────────┘
                                     │ HTTP
            ┌────────────────────────┼─────────────────────────┐
            │                        │                         │
            ▼                        ▼                         ▼
  ┌──────────────────┐   ┌──────────────────────┐   ┌──────────────────┐
  │ Marketing site   │   │ Renderer (Edge SSR)  │   │ Dashboard SPA    │
  │  myidentity.app  │   │  (Cloudflare Worker) │   │ studio.myidentity│
  │  (Vite, static)  │   │  /sites/*            │   │  .app (React)    │
  └──────────────────┘   └──────────┬───────────┘   └────────┬─────────┘
                                    │ read                 │ authenticated
                                    ▼                      ▼
                            ┌─────────────────────────────┐
                            │  API (Hono on Workers)      │
                            │  api.myidentity.app         │
                            │  /v1/*                      │
                            └──┬──────────┬───────────┬───┘
                               │          │           │
                ┌──────────────┘          │           └────────────┐
                ▼                         ▼                        ▼
        ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
        │ Neon         │         │ Cloudflare   │         │ Cloudflare   │
        │ Postgres     │         │ D1 (cache)   │         │ R2 (media)   │
        │ (primary DB) │         │ + KV         │         └──────────────┘
        └──────────────┘         └──────────────┘
                                      ▲
                                      │ shared session / rate-limit
                                      │
                            ┌─────────┴──────────┐
                            │ Auth (cookie       │
                            │ session, Argon2id) │
                            └────────────────────┘
                                      │
        ┌──────────────┐   ┌──────────┴──────┐  ┌────────────┐
        │ Stripe       │   │ Resend (email)  │  │ Mistral AI │
        └──────────────┘   └─────────────────┘  └────────────┘
```

## Apps

| App | Purpose | Runtime | URL |
|-----|---------|---------|-----|
| `apps/api` | Authenticated + public API | Cloudflare Workers (Hono) | `api.myidentity.app` |
| `apps/renderer` | Edge SSR for end-user sites | Cloudflare Workers (Hono) | rendered on customer domains |
| `apps/dashboard` | Studio / admin SPA | Cloudflare Pages (React + Vite) | `studio.myidentity.app` |
| `apps/marketing` | Public marketing site | Cloudflare Pages (Vite + React) | `myidentity.app` |
| `apps/docs` | Documentation | Cloudflare Pages (Astro + Starlight) | `docs.myidentity.app` |

## Packages

| Package | Purpose |
|---------|---------|
| `@my-identity/shared` | Types, Zod schemas, i18n strings, utilities. Imported by every app. |
| `@my-identity/db` | Drizzle ORM schemas + migrations. Single source of truth for DB structure. |
| `@my-identity/ui` | Shared React components (Button, Input, Card, Modal, Toast, shadcn-style). |
| `@my-identity/config` | Shared `eslint`, `prettier`, `tailwind`, `tsconfig` configs. |

## Data model overview

See [`packages/db/src/schema/`](https://github.com/systeme-robuste/my-identity/tree/main/packages/db/src/schema) for the 20 Drizzle schemas. Initial SQL is in [`packages/db/migrations/0001_initial.sql`](../packages/db/migrations/0001_initial.sql).

The high-level entities are:

- **Identity & access**: `users`, `sessions`, `api_keys`, `oauth`
- **Sites & content**: `sites`, `pages`, `cms_collections`, `cms_entries`, `media`
- **Forms & engagement**: `forms`, `form_submissions`, `email_lists`, `email_events`
- **Commerce**: `products`, `orders`, `order_items`, `members`, `gated`
- **Automation & analytics**: `automations`, `analytics_events`, `usage`
- **Webhooks & ops**: `webhooks`, `webhook_deliveries`, `audit`, `abuse`, `data_rights`

## Cross-cutting concerns

- **Auth**: cookie sessions (httpOnly, Secure, SameSite=Lax), Argon2id password hashing, 30-day rolling TTL, KV-backed session store.
- **Rate limiting**: KV-backed sliding window. Defaults: 60 req/min anon, 600 req/min authed, 5 req/min signup.
- **CSP**: per-app strict CSP, nonce-based inline scripts, no `unsafe-eval` in renderer.
- **i18n**: server-side resolved from `Accept-Language` + `lang` cookie. Locales: `fr` (default), `en`, `es`, `de`, `pt`.
- **A/B testing**: bucketed at edge, deterministic by visitor cookie + experiment key.
- **Caching**: KV (page HTML, 5 min + stale-while-revalidate 1 day) + D1 (site config + page tree, invalidated on publish).

## Type safety

- **Monorepo**: TypeScript strict + `noUncheckedIndexedAccess` + `noImplicitOverride`. Shared types live in `packages/shared`.
- **API**: Hono with typed RPC via `hc.withType<typeof routes>()`. Client types are generated from the server route tree.
- **DB**: Drizzle ORM with `pgTable` and `InferSelectModel` / `InferInsertModel` types propagated to shared.

## Edge vs. origin

- **Edge (Cloudflare Workers)**: rendering, auth, API serving, rate limiting, session lookup, A/B bucketing.
- **Origin (Neon)**: source of truth for persistent state. D1 + KV are read-through caches that can be rebuilt from Neon.
- **R2**: media only, served directly with custom domain (e.g. `media.myidentity.app`).

## Failure modes

- **Neon unreachable**: API falls back to D1 for read-only paths (sites, pages). Writes are rejected with 503. Renderer serves last-known-good HTML from KV with `stale-while-revalidate`.
- **R2 unreachable**: media upload fails with 502; media reads fall back to a placeholder.
- **Stripe webhook backlog**: queued in `webhook_deliveries` table with exponential backoff retry (max 24h, then dead-letter).
- **Mistral unavailable**: AI workflow step returns 503 and is marked `pending_retry` in the `automations` table.

## See also

- [`database.md`](./database.md) — DB schema detail
- [`deployment.md`](./deployment.md) — Deploying each app
- [`security.md`](./security.md) — Threat model + RGPD/DSA/DMCA
- [`api.md`](./api.md) — REST + GraphQL API reference
- [`prd.md`](./prd.md) — Product requirements (v0.1)
- [`roadmap.md`](./roadmap.md) — 3-phase delivery plan
