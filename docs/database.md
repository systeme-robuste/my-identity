# Database

> Source of truth: [`packages/db/src/schema/`](https://github.com/systeme-robuste/my-identity/tree/main/packages/db/src/schema) (Drizzle ORM).
> SQL bootstrap: [`packages/db/migrations/0001_initial.sql`](../packages/db/migrations/0001_initial.sql).

## Topology

- **Primary**: Neon Postgres (serverless, branching for staging).
- **Edge cache**: Cloudflare D1 (read-through, rebuilt from Neon).
- **Sessions + rate-limit + render cache**: Cloudflare KV.

## Schema map

| Domain | Tables | Notes |
|--------|--------|-------|
| Identity & access | `users`, `sessions`, `api_keys`, `oauth_*` | Argon2id password, OAuth code + token storage |
| Sites & content | `sites`, `pages`, `cms_collections`, `cms_entries`, `media` | One `sites` row per customer site, multi-page |
| Forms & engagement | `forms`, `form_submissions`, `email_lists`, `email_events` | Server-side validation, anti-spam |
| Commerce | `products`, `orders`, `order_items`, `members`, `gated` | Stripe-backed; full order ledger |
| Automation & analytics | `automations`, `analytics_events`, `usage` | Event-sourced analytics; usage metered for billing |
| Webhooks & ops | `webhooks`, `webhook_deliveries`, `audit`, `abuse`, `data_rights` | Outgoing + incoming webhooks; RGPD export/delete; abuse signals |

## Conventions

- All timestamps are `timestamptz` (UTC).
- All IDs are ULID strings (26 chars, lexicographically sortable) generated via `@my-identity/shared/utils/id`.
- All `*_at` columns are non-nullable and default to `now()`.
- Soft delete is **not** used. Hard delete + `audit` row.
- Foreign keys are declared with explicit `ON DELETE` action; cascade only when the child is meaningless without the parent (e.g. `pages.site_id`).

## Migrations

Drizzle Kit is the only migration source. The initial SQL in `0001_initial.sql` is kept in sync for reference (and for quick local Postgres bootstrap) but **the source of truth is the Drizzle schema files**.

```bash
# Generate a new migration from schema changes
pnpm --filter @my-identity/db generate

# Apply migrations to the dev DB
pnpm --filter @my-identity/db migrate

# Push the current schema (no migration file) — dev only
pnpm --filter @my-identity/db push

# Open Drizzle Studio
pnpm --filter @my-identity/db studio
```

## Branching strategy (Neon)

- `main` branch → production DB.
- `preview/*` branches → ephemeral preview DBs created per PR via Neon API.
- Local dev → either Neon dev branch or `docker compose up postgres`.

## Performance

- Hot indexes: `sites(owner_id)`, `pages(site_id, slug)`, `cms_entries(collection_id, slug)`, `orders(customer_id, created_at)`, `analytics_events(site_id, ts)`.
- Partial indexes: `webhook_deliveries(status) WHERE status = 'pending'`.
- Read paths on the renderer go through D1 + KV; Neon is hit only on cache miss or write.

## Backup & recovery

- Neon auto-backup every 6h, 7-day retention on Free, 30-day on Pro/Business plans.
- PITR enabled on paid Neon plans.
- Monthly export of `users`, `sites`, `cms_entries`, `orders` to R2 in Parquet format, kept 12 months for RGPD/DSA auditability.
