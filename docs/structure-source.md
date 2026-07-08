# My Identity — Monorepo structure

**Repo**: `systeme-robuste/my-identity` (private during MVP, public at v1.0)

## Layout

```
my-identity/
├── apps/
│   ├── api/                      # Cloudflare Workers + Hono API
│   │   ├── src/
│   │   │   ├── index.ts          # entry point
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── sites.ts
│   │   │   │   ├── pages.ts
│   │   │   │   ├── cms.ts
│   │   │   │   ├── forms.ts
│   │   │   │   ├── email.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── orders.ts
│   │   │   │   ├── memberships.ts
│   │   │   │   └── webhooks.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rate-limit.ts
│   │   │   │   ├── cors.ts
│   │   │   │   └── csp.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts     # drizzle schema
│   │   │   │   └── client.ts     # neon + d1 clients
│   │   │   ├── services/
│   │   │   │   ├── stripe.ts
│   │   │   │   ├── resend.ts
│   │   │   │   ├── mistral.ts
│   │   │   │   ├── sentry.ts
│   │   │   │   └── turnstile.ts
│   │   │   └── lib/
│   │   │       ├── auth.ts       # lucia setup
│   │   │       ├── crypto.ts     # argon2, hmac, jwt
│   │   │       ├── i18n.ts
│   │   │       └── errors.ts
│   │   ├── wrangler.toml
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── renderer/                 # Cloudflare Workers site renderer
│   │   ├── src/
│   │   │   ├── index.ts          # entry point
│   │   │   ├── blocks/
│   │   │   │   ├── hero.ts
│   │   │   │   ├── text.ts
│   │   │   │   ├── image.ts
│   │   │   │   ├── form.ts
│   │   │   │   ├── pricing.ts
│   │   │   │   ├── faq.ts
│   │   │   │   ├── footer.ts
│   │   │   │   ├── embed.ts
│   │   │   │   ├── code.ts
│   │   │   │   └── cms.ts
│   │   │   ├── render.ts         # main render function
│   │   │   └── cache.ts          # KV cache layer
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   ├── dashboard/                # React + Vite SPA (admin)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── routes/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── login.tsx
│   │   │   │   ├── signup.tsx
│   │   │   │   ├── sites/
│   │   │   │   ├── pages/
│   │   │   │   ├── cms/
│   │   │   │   ├── forms/
│   │   │   │   ├── email/
│   │   │   │   ├── products/
│   │   │   │   ├── memberships/
│   │   │   │   └── settings/
│   │   │   ├── components/
│   │   │   │   ├── BlockEditor.tsx
│   │   │   │   ├── TemplateGallery.tsx
│   │   │   │   ├── CmsBuilder.tsx
│   │   │   │   ├── FormBuilder.tsx
│   │   │   │   ├── EmailEditor.tsx
│   │   │   │   └── ...
│   │   │   ├── lib/
│   │   │   │   ├── api.ts        # api client
│   │   │   │   ├── i18n.ts
│   │   │   │   └── auth.ts
│   │   │   ├── styles/
│   │   │   └── i18n/
│   │   │       ├── fr.json
│   │   │       ├── en.json
│   │   │       └── es.json
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   ├── marketing/                # Static marketing site (the one we built)
│   │   ├── index.html
│   │   ├── docs/
│   │   ├── templates/
│   │   └── package.json
│   │
│   └── docs/                     # Documentation site (Docusaurus)
│       ├── docs/
│       ├── blog/
│       └── docusaurus.config.ts
│
├── packages/
│   ├── shared/                   # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── site.ts
│   │   │   │   ├── page.ts
│   │   │   │   ├── block.ts
│   │   │   │   ├── cms.ts
│   │   │   │   ├── form.ts
│   │   │   │   ├── user.ts
│   │   │   │   └── ...
│   │   │   ├── schemas/         # Zod schemas
│   │   │   │   ├── site.ts
│   │   │   │   ├── page.ts
│   │   │   │   └── ...
│   │   │   ├── i18n/             # i18n strings shared
│   │   │   └── lib/
│   │   │       ├── billing.ts    # cost calculation
│   │   │       ├── quotas.ts     # plan limits
│   │   │       └── slug.ts
│   │   └── package.json
│   │
│   ├── db/                       # Drizzle schema and migrations
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── sites.ts
│   │   │   ├── pages.ts
│   │   │   ├── cms.ts
│   │   │   ├── forms.ts
│   │   │   ├── email.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── memberships.ts
│   │   │   ├── automations.ts
│   │   │   ├── analytics.ts
│   │   │   ├── usage.ts
│   │   │   ├── webhooks.ts
│   │   │   └── audit.ts
│   │   ├── migrations/
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── ui/                       # Shared React components
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── config/                   # Shared configs
│       ├── eslint/
│       ├── tsconfig/
│       └── vitest/
│
├── scripts/
│   ├── deploy.sh
│   ├── migrate.ts
│   ├── seed.ts
│   └── e2e/
│       ├── auth.spec.ts
│       ├── sites.spec.ts
│       └── ...
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                # lint, test, type-check
│   │   ├── deploy-staging.yml    # on push to main
│   │   └── deploy-prod.yml       # on tag v*
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── infrastructure/
│   ├── terraform/                # Cloudflare resources
│   │   ├── main.tf
│   │   ├── workers.tf
│   │   ├── d1.tf
│   │   ├── r2.tf
│   │   ├── kv.tf
│   │   ├── dns.tf
│   │   └── analytics.tf
│   └── neon/
│       └── README.md
│
├── docs/
│   ├── PRD.md                    # Product requirements (v0.1)
│   ├── ARCHITECTURE.md           # System architecture
│   ├── SECURITY.md               # Security model
│   ├── API.md                    # API reference
│   ├── BILLING.md                # Pricing + usage
│   ├── COMPLIANCE.md             # RGPD, DSA, DMCA
│   └── RUNBOOK.md                # Operational runbook
│
├── roadmap/
│   ├── phase-1-mvp/
│   ├── phase-2-beta/
│   └── phase-3-ga/
│
├── .env.example
├── .gitignore
├── .nvmrc                        # node 20
├── package.json                  # root, workspaces
├── pnpm-workspace.yaml
├── tsconfig.json                 # base
├── README.md
└── LICENSE                       # AGPL-3.0 (or BSL?)
```

## Tooling

- **Package manager**: pnpm (workspaces)
- **Node**: 20 LTS
- **TypeScript**: 5.5+, strict mode
- **Linting**: ESLint + Prettier
- **Testing**: Vitest (unit), Playwright (E2E)
- **Git hooks**: Husky + lint-staged
- **CI**: GitHub Actions
- **Deploy**: Wrangler (Cloudflare)

## Naming conventions

- **Files**: kebab-case (`auth-middleware.ts`)
- **Functions**: camelCase (`getUserById`)
- **Types/Interfaces**: PascalCase (`SiteConfig`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Database**: snake_case (`created_at`)
- **API routes**: kebab-case (`/api/v1/sites/:id/cms/:collection`)
- **Components**: PascalCase (`BlockEditor.tsx`)

## Versioning

- **Monorepo**: changesets (`.changeset/`)
- **API**: semver, with breaking changes = new major
- **Database**: sequential migrations, no rollback (write new migration)
- **Deploy**: tag-based (`v0.1.0`, `v0.2.0`)

## Branches

- `main`: stable, deploys to staging
- `feature/*`: feature branches
- `fix/*`: bug fixes
- `chore/*`: tooling, docs
- `release/*`: release candidates

## License

- **Source code**: AGPL-3.0 (or Business Source License 1.1 — TBD)
- **Templates**: CC-BY-4.0 (free) or commercial (paid)
- **Documentation**: CC-BY-4.0
- **Brand**: "My Identity" trademark
