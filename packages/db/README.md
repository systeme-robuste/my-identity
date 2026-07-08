# @my-identity/db

Drizzle ORM schemas + client for Neon Postgres.

## Status

🚧 **Initial scaffold only.** Schemas are condensed but reflect the table structure documented in `migrations/0001_initial.sql` (the source of truth). After the first Drizzle Kit migration is generated, this package will be the canonical schema definition.

## Files

- `src/client.ts` — Drizzle client factory (Neon HTTP + WebSocket)
- `src/relations.ts` — Drizzle relations
- `src/schema/*.ts` — 20 table definitions
- `migrations/0001_initial.sql` — initial SQL (reference, will be replaced by Drizzle Kit output)

## Tables (20)

users, sessions, sites, pages, collections, entries, forms, submissions, email_subscribers, email_templates, email_broadcasts, products, product_variants, orders, order_items, members, member_tiers, gated_content, automations, automation_logs, analytics_events, usage_counters, webhooks, webhook_deliveries, audit_log, abuse_reports, data_rights_requests, api_keys, oauth_clients, media
