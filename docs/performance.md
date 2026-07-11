# Performance — My Identity

This document describes the performance budget, the Core Web Vitals targets,
and the operational metrics we track across the API, the renderer, the
dashboard, and the marketing site. It is the single source of truth for
"what good looks like" and is referenced from the CI workflows and the
deployment checklist.

## 1. North Star

- **p95 API latency** (EU + Africa edge) < **200 ms**
- **p99 API latency** < **500 ms**
- **Uptime** > **99.9%** (rolling 30-day window)
- **Lighthouse** on the marketing site: **100 / 100 / 100 / 100**
- **LCP** < **1.5 s** on a simulated 4G connection
- **CLS** < **0.05**
- **INP** < **200 ms**

## 2. Front-end budgets

The marketing site and the dashboard ship with hard bundle budgets enforced
by Vite's `build.rollupOptions.output` and a CI check that fails the build
when the threshold is exceeded.

| App | JS (gz) | CSS (gz) | HTML (raw) | LCP target |
|---|---|---|---|---|
| `apps/marketing` | 0 KB (no JS by default) | ≤ 10 KB | ≤ 50 KB | < 1.0 s |
| `apps/docs` (Astro) | ≤ 30 KB | ≤ 15 KB | — | < 1.5 s |
| `apps/dashboard` | ≤ 180 KB | ≤ 25 KB | — | < 2.0 s |
| `apps/renderer` (Worker) | 0 KB client-side | — | streamed | n/a |

> The renderer is a Cloudflare Worker that streams HTML at the edge — no
> JavaScript ships to the visitor unless the page itself embeds a block
> that requires it (e.g. A/B test instrumentation, form, comments).

## 3. Core Web Vitals — what we measure

We sample real-user data with the `web-vitals` library on the dashboard
(marketing site ships 0 JS, so we rely on synthetic Lighthouse + CrUX). The
events are sent to our analytics KV namespace with a 1% sample rate.

| Metric | Target | Tooling |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 1.5 s (4G) | Lighthouse, web-vitals |
| **CLS** (Cumulative Layout Shift) | < 0.05 | Lighthouse, web-vitals |
| **INP** (Interaction to Next Paint) | < 200 ms | web-vitals (dashboard) |
| **TTFB** (Time to First Byte) | < 200 ms (edge) | wrangler tail, Sentry |
| **TBT** (Total Blocking Time) | < 100 ms | Lighthouse |
| **FCP** (First Contentful Paint) | < 1.0 s | Lighthouse |

## 4. Bundle budgets — CI enforcement

The CI workflow runs `pnpm --filter <app> build` and then a small Node script
that walks the dist output and asserts size. The thresholds live in
`scripts/check-bundle-size.mjs` and are reviewed at every release.

```yaml
# .github/workflows/ci.yml (excerpt)
- name: Bundle size check
  run: |
    node scripts/check-bundle-size.mjs \
      --app marketing --js 0kb --css 10kb --html 50kb \
      --app dashboard --js 180kb --css 25kb \
      --app docs     --js 30kb  --css 15kb
```

Failing the size check blocks the PR. Bumping a budget requires a PR with
a justification comment (new feature, new vendor, etc.) and an approval from
a code owner.

## 5. Edge & Worker performance

### Renderer
- **Cache**: KV (hot) → D1 (warm) → origin (cold). SWR with `stale-while-revalidate`.
- **Cold-start budget**: < 5 ms (Worker isolates are reused).
- **HTML size budget**: ≤ 64 KB compressed per page.
- **Streaming**: HTML is sent with `Content-Encoding: br` and starts flushing
  after the first 8 KB to keep TTFB low.

### API
- **Latency budget** per route (p95):
  - `GET /v1/sites/:id` < 30 ms (KV hit) / < 80 ms (D1)
  - `GET /v1/pages/:id/render` < 50 ms (KV hit) / < 120 ms (D1)
  - `POST /v1/forms/:id/submit` < 150 ms (D1 + Resend enqueue)
  - `POST /v1/cms/entries` < 100 ms (D1 + audit KV)
- **Concurrency**: 100 concurrent connections per Worker isolate, soft cap.
- **CPU time** (Workers): < 30 ms p95, < 100 ms p99.

### Rate limiting
- Sliding-window counter stored in KV. Bucket key = `rl:<by>:<bucket>`.
- Bucket size = `window` seconds. TTL = `window * 2`.
- The current implementation is a sliding-window **approximation** (a true
  sliding-window with sorted sets is planned for Phase 2 — see
  `middleware/rate-limit.ts`).

## 6. Database performance

### Neon Postgres
- **Region**: EU (Frankfurt). Read replicas optional in Phase 2.
- **Connection pool**: serverless driver, no PgBouncer.
- **Statement timeout**: 5 s (queries exceeding this are killed and logged).
- **Slow query threshold**: > 250 ms → logged + alerted to Sentry.

### Cloudflare D1 (cache only)
- **Reads** dominate (cache hits). Reads are billed per row.
- **TTL** defaults to 300 s. Per-call override via `CacheOptions.ttlSeconds`.
- **Hit rate** target: > 80% on `/v1/pages/:id/render`, > 60% overall.

## 7. Caching strategy

| Layer | Tech | TTL | Hit-rate target |
|---|---|---|---|
| Edge HTML | KV + D1 (SWR) | 60 s fresh, 24 h stale | > 90% |
| API responses | D1 (`cache` table) | 300 s | > 70% |
| Sessions | KV (`SESSIONS`) | 30 d (sliding) | n/a |
| Rate limit | KV (`RATE_LIMIT`) | 2 × window | n/a |
| Audit log | KV (`AUDIT`) | 90 d | n/a |

## 8. Observability

- **Logs**: structured JSON via `lib/logger.ts`, shipped to Logpush.
- **Errors**: Sentry (planned for Phase 2).
- **Metrics**: Workers Analytics Engine for per-route latency + status
  codes. D1 daily reads/writes exported to a dashboard.
- **Alerts** (PagerDuty):
  - p95 API latency > 500 ms for 5 min
  - Error rate > 1% for 5 min
  - D1 hit rate < 50% for 1 h
  - Lighthouse score drops below 95/100/95/95 on `main`

## 9. Performance testing

- **Lighthouse CI**: runs on every PR against a preview deployment, with
  a soft threshold (warning) and a hard threshold (block on regression).
- **k6 load tests** (Phase 2): 1 000 RPS sustained for 5 min, ramping to
  5 000 RPS for 30 s. Targets: p95 < 200 ms, error rate < 0.1%.
- **Synthetic uptime**: every 60 s from 3 regions (EU, US, Africa).

## 10. Roadmap

- [ ] Migrate rate limiter to a true sliding window (sorted sets).
- [ ] Add Workers Analytics Engine dashboards.
- [ ] Wire up Sentry to the API + renderer.
- [ ] Per-tenant rate limits (Business plan).
- [ ] HTTP/3 + 0-RTT (Cloudflare defaults; verify in CI).
- [ ] Adaptive image sizing (responsive `srcset` from R2).
- [ ] Pre-rendered static marketing pages (deployed via Pages, not Worker).

---

*Owner: Performance Working Group.*
*Review cadence: every 2 weeks, or after any production incident.*
