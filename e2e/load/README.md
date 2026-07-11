# My Identity — Load & Stress Tests

Smoke + load + spike test for the public API surface of My Identity, written in [k6](https://k6.io).

## Goal

Prove that the public API handles:

- **Steady state:** 50 VUs × 1 min (target: ~50 req/s, the spec floor for `RPS`).
- **Spike:** 200 VUs × 30 s (target: no 5xx, no connection refusal).
- **Auth rejection roundtrip:** anonymous `/v1/sites` requests (the real-world anon load profile).

A run that misses any threshold fails with a non-zero exit code, which gates the deploy in CI.

## Tooling

- **k6 v0.49+** — `brew install k6` (macOS) / `apt install k6` (Linux) / `choco install k6` (Windows)
- **Optional JSON output** for Grafana Cloud or any other sink.

## Files

| File | Purpose |
|------|---------|
| `k6-smoke.js` | The test script (3 scenarios, custom summary banner) |
| `README.md` | This file |

## Running

### Local (against the dev worker)

```bash
pnpm dev:api &                              # start the API in another terminal
k6 run e2e/load/k6-smoke.js                # defaults to http://localhost:8787
```

### Against staging / production

```bash
BASE_URL=https://api-staging.myidentity.app \
  k6 run e2e/load/k6-smoke.js

BASE_URL=https://api.myidentity.app \
  MI_SESSION_COOKIE=eyJ1aWQiOi... \
  k6 run e2e/load/k6-smoke.js
```

### With form submissions enabled (full E2E POST)

```bash
BASE_URL=https://api-staging.myidentity.app \
MI_SESSION_COOKIE=eyJ1aWQiOi... \
MI_TEST_SITE_ID=01H... \
MI_TEST_FORM_ID=form_contact \
MI_TURNSTILE_TOKEN=XXXX.DUMMY.TOKEN.XXXX \
  k6 run e2e/load/k6-smoke.js
```

If the three form env vars are unset, the script gracefully skips the form-POST scenario — a fresh checkout still runs usefully on `/health` + `/v1/sites`.

### With JSON output for Grafana / dashboards

```bash
k6 run --out json=test-results/k6.json e2e/load/k6-smoke.js
```

## Scenarios

The script runs three `constant-vus` scenarios **sequentially**:

| # | Scenario | VUs | Duration | Start | Purpose |
|---|----------|-----|----------|-------|---------|
| 1 | `warmup` | 10  | 30 s     | 0 s   | JIT/cache warmup (discarded from p99 stats) |
| 2 | `load`   | 50  | 60 s     | 35 s  | **Target steady state** — 50 req/s floor |
| 3 | `spike`  | 200 | 30 s     | 1m 50s | Burst test (signups, viral post, bot attack) |

## Endpoints exercised

- `GET /health` — public, always 200
- `GET /v1/sites` — public list (returns 401 if no cookie, 200 with valid `mi_session` cookie)
- `POST /v1/sites/:id/forms/:fid/submissions` — only if the three env vars are set

## Thresholds

| Metric | Threshold | Why |
|--------|-----------|-----|
| `http_req_duration{endpoint:health}` p(99) | < 200 ms | Health check should be near-instant (KV lookup) |
| `http_req_duration` p(95) | < 500 ms | Public pages target Lighthouse 100; API must be fast |
| `http_req_duration` p(99) | < 1500 ms | Workers cold-start + DB query budget |
| `errors` rate | < 1 % | 1 % of traffic may fail (rate-limit, validation), not more |
| `http_req_failed` rate | < 1 % | Mirror of `errors` from k6's standard counter |

Any miss = non-zero exit = **CI deploy is blocked**.

## Interpreting the output

A successful run prints a banner like:

```
═══════════════════════════════════════════════════════════════
  My Identity — k6 smoke summary
═══════════════════════════════════════════════════════════════
  Base URL:   https://api-staging.myidentity.app
  Auth:       cookie set
  Form POST:  enabled
  Total reqs:    14 200
  p95 latency:   312.4 ms  (threshold: < 500 ms)
  p99 latency:   987.1 ms  (threshold: < 1500 ms)
  Error rate:    0.18%  (threshold: < 1%)
  Form submits:  3 480
═══════════════════════════════════════════════════════════════
```

A failed run prints a `THRESHOLD FAILURE` block and exits 1.

## When to run

- **Locally:** before opening a PR that touches `apps/api/**` or `apps/renderer/**`.
- **Pre-deploy:** in the GitHub Actions `deploy-api.yml` workflow, after unit tests, before `wrangler deploy`.
- **Nightly:** against staging (we'll wire this into a scheduled workflow in M2).

## Future improvements (M2+)

- [ ] Wire into Grafana Cloud free tier for trend visualization.
- [ ] Add a `soak` scenario (50 VUs × 1 h) to catch memory leaks.
- [ ] Add a `breakpoint` scenario (ramp from 0 to 1000 VUs) to find the ceiling.
- [ ] Add a `mixed-scripting` scenario to exercise the authenticated editor flow.

---

_Maintained by Zapia. Last review: 2026-07-11._
