# Development

> Local dev setup, prerequisites, common commands.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20 LTS | `nvm use` reads `.nvmrc` |
| pnpm | 9.x | `corepack enable && corepack prepare pnpm@9 --activate` |
| Git | 2.40+ | |
| Wrangler | 3.x | `pnpm dlx wrangler --version` to check |
| Docker (optional) | 24+ | for local Postgres if you don't want a Neon dev branch |

## Initial setup

```bash
git clone https://github.com/systeme-robuste/my-identity.git
cd my-identity
nvm use
corepack enable
pnpm install
cp .env.example .env
# fill in DATABASE_URL, RESEND_API_KEY, STRIPE_SECRET_KEY, MISTRAL_API_KEY, R2_*, KV_*, TURNSTILE_*
```

## Run the apps

```bash
# Run every app in parallel
pnpm dev

# Or one at a time
pnpm dev:api          # http://localhost:8787
pnpm dev:renderer     # http://localhost:8788
pnpm dev:dashboard    # http://localhost:5173
pnpm dev:marketing    # http://localhost:5174
pnpm dev:docs         # http://localhost:5175
```

## Database

```bash
# Generate a migration after editing packages/db/src/schema/*
pnpm db:generate

# Apply migrations locally
pnpm db:migrate

# Push schema directly (dev only — skips migration files)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio

# Seed dev data
pnpm db:seed
```

## Tests

```bash
# Unit tests (Vitest)
pnpm test:unit

# E2E tests (Playwright)
pnpm test:e2e

# Watch mode
pnpm --filter @my-identity/dashboard test
```

## Linting & formatting

```bash
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
```

## Commit & PR

- Branches: `feature/<short-slug>`, `fix/<short-slug>`, `chore/<short-slug>`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`.
- PRs: target `main`. The CI workflow runs lint, typecheck, and tests. Review by at least one maintainer.

## Project structure

```
my-identity/
├── apps/         # Deployable applications
├── packages/     # Shared libraries
├── docs/         # Architecture, security, API, etc.
└── roadmap/      # 3-phase delivery plan
```

Each app and package has its own `README.md` with app-specific instructions.

## Common pitfalls

- **Wrangler 4.x vs 3.x**: this repo targets Wrangler 3.x. Don't blindly upgrade — some D1 / R2 APIs changed.
- **`pnpm install` fails on lockfile mismatch**: `pnpm install --no-frozen-lockfile` for a one-off, but then commit the resulting `pnpm-lock.yaml`.
- **Drizzle complains about `bigint`**: this project uses `bigint({ mode: 'number' })` everywhere. Do not switch to `bigint` mode without updating shared types.
- **Hono RPC client not picking up new routes**: restart the `tsc` watch in the consuming app — the type is generated at build time.

## See also

- [`architecture.md`](./architecture.md) — system overview
- [`database.md`](./database.md) — DB schema
- [`deployment.md`](./deployment.md) — deploy guide
- [`security.md`](./security.md) — security model
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — contribution workflow
