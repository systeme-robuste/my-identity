# API reference

> REST API served by `apps/api` at `https://api.myidentity.app/v1/`.
> All endpoints return JSON. Errors follow the RFC 7807-ish shape `{ error: { code, message, details? } }`.

## Conventions

- **Base URL**: `https://api.myidentity.app/v1`
- **Auth**: cookie session for the dashboard; `Authorization: Bearer mi_<key>` for programmatic access
- **Versioning**: URL-based (`/v1/`, `/v2/`). Breaking changes = new major version, 12-month overlap
- **Pagination**: cursor-based, `?cursor=<opaque>&limit=<1..100>`. Response includes `nextCursor` and `prevCursor`
- **Rate limit**: 60 req/min anonymous, 600 req/min authenticated, 5 req/min on `/auth/*`. Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Idempotency**: state-changing endpoints accept `Idempotency-Key` (UUID) header, 24h replay window

## Endpoints (skeleton — full list generated from `apps/api/src/routes/`)

### Health
- `GET /health` — liveness + DB ping, no auth

### Auth
- `POST /auth/signup` — create account (Turnstile required)
- `POST /auth/login` — start session
- `POST /auth/logout` — end session
- `POST /auth/refresh` — rotate session
- `POST /auth/forgot` — start password reset
- `POST /auth/reset` — complete password reset
- `POST /auth/oauth/:provider/start` — begin OAuth flow
- `POST /auth/oauth/:provider/callback` — complete OAuth flow

### Sites
- `GET /sites` — list sites owned by the caller
- `POST /sites` — create a site
- `GET /sites/:id` — fetch a site
- `PATCH /sites/:id` — update a site
- `DELETE /sites/:id` — delete a site
- `POST /sites/:id/publish` — publish a site (clears KV cache)
- `POST /sites/:id/unpublish` — unpublish a site

### Pages
- `GET /sites/:id/pages` — list pages
- `POST /sites/:id/pages` — create a page
- `GET /sites/:id/pages/:pageId` — fetch a page
- `PATCH /sites/:id/pages/:pageId` — update a page
- `DELETE /sites/:id/pages/:pageId` — delete a page
- `POST /sites/:id/pages/reorder` — reorder pages

### CMS
- `GET /sites/:id/collections` — list collections
- `POST /sites/:id/collections` — create a collection
- `GET /sites/:id/collections/:cid/entries` — list entries
- `POST /sites/:id/collections/:cid/entries` — create an entry
- `PATCH /sites/:id/collections/:cid/entries/:eid` — update
- `DELETE /sites/:id/collections/:cid/entries/:eid` — delete

### Forms
- `GET /sites/:id/forms` — list forms
- `POST /sites/:id/forms` — create a form
- `POST /sites/:id/forms/:fid/submissions` — public: submit a form (Turnstile required)

### Media
- `POST /sites/:id/media` — upload (multipart, 25 MB cap)
- `GET /sites/:id/media` — list media
- `DELETE /sites/:id/media/:mid` — delete

### Products & orders (Phase 2)
- `GET /sites/:id/products`
- `POST /sites/:id/products`
- `PATCH /sites/:id/products/:pid`
- `DELETE /sites/:id/products/:pid`
- `GET /sites/:id/orders`
- `GET /sites/:id/orders/:oid`
- `POST /sites/:id/orders/:oid/refund`

### Members & gated content (Phase 2)
- `GET /sites/:id/members`
- `POST /sites/:id/members`
- `DELETE /sites/:id/members/:mid`
- `GET /sites/:id/gated` — list gated blocks
- `POST /sites/:id/gated/:gid/check` — public: check access for a visitor

### Webhooks
- `GET /sites/:id/webhooks` — list outgoing webhooks
- `POST /sites/:id/webhooks` — create
- `DELETE /sites/:id/webhooks/:wid` — delete
- `POST /webhooks/incoming/:token` — public: incoming webhook

### Analytics
- `GET /sites/:id/analytics/summary` — aggregated counters
- `GET /sites/:id/analytics/events` — raw events (paginated)

### Account & RGPD
- `GET /me` — current user
- `PATCH /me` — update profile
- `POST /me/api-keys` — create API key
- `DELETE /me/api-keys/:kid` — revoke
- `GET /me/export` — start data export
- `POST /me/delete` — schedule account deletion
- `GET /me/audit` — audit log

## GraphQL (Phase 3)

A read-only GraphQL gateway will be added in Phase 3 for the end-user public API (per-site), exposed at `https://<site>/graphql`. Schema is generated from the site owner’s CMS collections.
