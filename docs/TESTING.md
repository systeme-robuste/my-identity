# Testing strategy

> Status: **20 test files, 100+ cases, 0 e2e tests yet (Playwright planned for M2)**.

## What we test

| Layer | Tool | Files | What |
|-------|------|-------|------|
| **API unit** | Vitest | 12 | Route handlers, lib (auth, db, rate-limit, cache, id, errors, turnstile, email, storage, stripe, logger) |
| **Shared schemas** | Vitest | 8 | Zod validation for user, page, site, cms, form, product, webhook, etc. |
| **E2E** | Playwright (planned) | 0 | Sign-up, create-site, publish-page, submit-form, place-order, login-as-admin |
| **Webhooks** | curl | 0 | `scripts/smoke-test.sh` validates webhook signature, end-to-end flow |
| **DB** | sql-check | 0 | `scripts/validate-migrations.sh` checks SQL syntax + numbering |

## Running

```bash
# All tests
pnpm test

# One file
pnpm test apps/api/src/lib/storage.test.ts

# With coverage
pnpm test --coverage

# Typecheck
bash scripts/typecheck.sh

# Lint
bash scripts/lint.sh

# Webhook smoke test (requires running API)
bash scripts/smoke-test.sh http://localhost:8787
```

## Conventions

- **Mock external services**: Resend (email), Cloudflare Turnstile, Stripe, R2. No network in unit tests.
- **ULIDs everywhere**: when tests need an ID, use `ulid()` not `crypto.randomUUID()`.
- **One file per module**: `foo.ts` → `foo.test.ts` next to it. No shared `tests/` directory.
- **Imports**: use `.ts` extension on local imports (works in both Vitest and Hono).
- **Env in tests**: build a `Pick<Env, ...>` with only the fields the unit needs. Don't fabricate a full Env.
- **Coverage target**: 80% for `apps/api/src/lib/**`, 90% for `packages/shared/src/schemas/**`. E2E coverage is integration-tested via `smoke-test.sh` instead.

## What's NOT tested yet (M2+)

- **Playwright E2E** — wire up a CI job against a preview deploy.
- **Mutation tests** — use `stryker` to verify the tests actually catch bugs.
- **Load tests** — use `k6` against the staging Workers URL.
- **Security tests** — use `OWASP ZAP` baseline scan in CI.
- **Visual regression** — Playwright screenshots on key templates.
