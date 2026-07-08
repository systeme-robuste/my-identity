# @my-identity/dashboard

The studio editor at `studio.myidentity.app`. A React 18 + Vite + TypeScript SPA.

## Status

🚧 **Initial scaffold only.** Routes, components, and editor are stubbed. Implementation is part of **Phase 1 — MVP**.

## Architecture

- **React 18** with **React Router 6** (typed routes)
- **Vite 5** for dev server and build
- **Tailwind CSS** with a dark-first theme matching `apps/marketing`
- **TanStack Query** for server state
- **Zod** for runtime validation
- **Lexical** for the block-based page editor (planned)

## Routes (planned)

| Path | Purpose |
|---|---|
| `/login` | Email + password sign-in |
| `/` | Dashboard overview: site list, usage, recent activity |
| `/sites` | Grid of all sites, "Create new" |
| `/sites/:id/editor/:pageId?` | Block-based page editor |
| `/sites/:id/collections` | CMS collections manager |
| `/sites/:id/products` | E-commerce products + orders |
| `/sites/:id/automations` | Workflow builder |
| `/sites/:id/members` | Membership tiers + members |
| `/sites/:id/analytics` | Charts: visitors, conversion, top pages |
| `/sites/:id/settings` | Site settings, domain, team, API keys |
| `/sites/:id/billing` | Plan, usage, Stripe Customer Portal |

## Local development

```bash
# from the monorepo root
pnpm install
pnpm --filter @my-identity/dashboard dev
# → http://localhost:5173
```

The dev server proxies `/v1/*` to `http://localhost:8787` (the API worker).

## Next steps

- [ ] Wire up the typed API client (`src/lib/api.ts`)
- [ ] Implement the auth flow (`/login` + session cookie)
- [ ] Build the block editor (Lexical + custom blocks)
- [ ] Hook up TanStack Query for site/page state
- [ ] Add Stripe Customer Portal redirect
