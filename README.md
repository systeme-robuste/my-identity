# My Identity

> The professional no-code platform built for the next decade. A Carrd-killer for creators, freelancers, indie hackers, and small businesses who need a serious online presence without the engineering overhead.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-20_LTS-339933)](./.nvmrc)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6)](./tsconfig.base.json)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?logo=cloudflare&logoColor=white)](https://cloudflare.com)
[![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white)](https://hono.dev)
[![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team)

**Live reference site:** <https://site.zapia.com/7bog68jb>

My Identity lets you build a multi-page site with a native CMS, e-commerce, A/B testing, memberships, and AI-powered workflows — all from a single dashboard. Pages render at the edge on Cloudflare Workers, with 0 JavaScript by default and a Lighthouse 100/100/100/100 baseline.

## Highlights

- **Multi-page sites** — beyond the one-page Carrd limit, with up to 25 pages per site (Pro) and unlimited on Business.
- **Native CMS** — collections and entries, no third-party Airtable lock-in.
- **Edge SSR** — pages rendered on Cloudflare Workers, cached on KV + D1.
- **0-JS by default** — the reference implementation ships 0 lines of JavaScript and still has a working language switcher, theme, and pricing toggle. Progressive enhancement only.
- **Multi-language** — built-in i18n with 5 locales (fr, en, es, de, pt).
- **E-commerce, memberships, automations, A/B testing, webhooks** — all from the same primitive model.
- **RGPD/DSA/DMCA compliant** — built for the EU market, not retrofitted.
- **USD pricing** — clear, fixed pricing, no usage surprises.

## Quick start

```bash
# 1. Clone
git clone https://github.com/systeme-robuste/my-identity.git
cd my-identity

# 2. Install (pnpm 9, Node 20 LTS)
nvm use
corepack enable
pnpm install

# 3. Set up env
cp .env.example .env
# fill in DATABASE_URL, RESEND_API_KEY, STRIPE_SECRET_KEY, MISTRAL_API_KEY, R2_*, KV_*, TURNSTILE_*

# 4. Apply DB schema
pnpm --filter @my-identity/db migrate

# 5. Run the dashboard locally
pnpm --filter @my-identity/dashboard dev

# 6. Run the API locally
pnpm --filter @my-identity/api dev

# 7. Run the renderer locally
pnpm --filter @my-identity/renderer dev
```

## Pricing (USD)

| Plan | Price (monthly) | Price (annual) | Pages / Site | Bandwidth | Custom domain | Best for |
|------|-----------------|----------------|--------------|-----------|---------------|----------|
| **Free** | $0 | $0 | 1 | 10 GB | ❌ | Trying it out |
| **Pro** | **$11** | **$9/yr** | 25 | 250 GB | ✅ | Freelancers, indie hackers |
| **Business** | **$59** | **$49/yr** | Unlimited | 2 TB | ✅ + wildcard | Small agencies, e-commerce |

All prices in USD. Annual plans are billed once per year. Taxes calculated at checkout based on customer location.

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend (dashboard) | React 18 + Vite + TypeScript + Tailwind + shadcn/ui style |
| Frontend (marketing) | Vite + React (or plain TSX, 0-JS friendly) |
| Docs | Astro 4 + Starlight |
| API | Hono on Cloudflare Workers |
| Renderer | Hono on Cloudflare Workers (edge SSR) |
| Database (primary) | Neon Postgres (serverless) |
| Database (edge cache) | Cloudflare D1 |
| KV / cache | Cloudflare KV |
| Object storage | Cloudflare R2 |
| ORM | Drizzle ORM |
| Email | Resend |
| AI | Mistral |
| Billing | Stripe (Checkout + Customer Portal) |
| Bot protection | Cloudflare Turnstile |
| Validation | Zod |
| Monorepo | pnpm workspaces |
| Testing | Vitest (unit), Playwright (E2E) |
| CI | GitHub Actions |
| Deploy | Wrangler + Cloudflare Pages |

## Repository layout

```
my-identity/
├── apps/
│   ├── api/         # Cloudflare Workers API (Hono)
│   ├── renderer/    # Edge SSR renderer (Hono on Workers)
│   ├── dashboard/   # studio.myidentity.app (React + Vite)
│   ├── marketing/   # myidentity.app (Vite + React)
│   └── docs/        # docs.myidentity.app (Astro + Starlight)
├── packages/
│   ├── shared/      # shared types, schemas, i18n, utils
│   ├── db/          # Drizzle ORM schemas + migrations
│   ├── ui/          # shared React components
│   └── config/      # shared eslint/prettier/tsconfig/tailwind
├── docs/            # architecture, security, API, deployment, etc.
└── roadmap/         # phase-1-mvp, phase-2-beta, phase-3-ga
```

See [`docs/architecture.md`](./docs/architecture.md) for the full system architecture, [`docs/prd.md`](./docs/prd.md) for the product requirements (v0.1, 888 lines), and [`roadmap/`](./roadmap/) for the 3-phase delivery plan.

## Contributing

We welcome issues and PRs. See [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) and open a "good first issue" from the issue tracker to get started.

## Security & compliance

- **RGPD** — data export, deletion, audit log, no third-party tracking.
- **DSA** — transparency reports, statement of reasons for moderation actions.
- **DMCA** — takedown process documented, repeat-infringer policy.
- **Threat model** — see [`docs/security.md`](./docs/security.md).

Report vulnerabilities to <security@myidentity.app>.

## License

[MIT](./LICENSE) — Copyright © 2026 Califi Mwarabu / My Identity.
