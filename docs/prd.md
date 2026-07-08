# My Identity — Product Requirements Document v0.1

**Status**: Draft
**Date**: 2026-07-02
**Owner**: Califi Mwarabu (Founder, NEXUS)
**Last update**: 2026-07-02 19:22 WAT
**Confidentiality**: Internal — NEXUS

---

## 1. Vision

**My Identity** is a sovereign, all-in-one platform that lets a single person run a complete digital business — landing pages, blog, store, newsletter, courses, memberships, automations, and an AI assistant — on **one bill, one login, one stack**. It positions itself as the "Carrd-killer that grows with you": free for a side project, $9/yr when you're serious, $49/yr when you're running a team.

**Mission**: Replace 7+ subscriptions with 1 platform. Save makers 80% on their stack. Make the sovereign web the default for African creators.

**Success metrics (12-month window)**:
- 5,000 active free users
- 500 paying users (10% conversion)
- $50,000 ARR by month 12
- 95% gross margin (Cloudflare edge costs)
- < 100ms p50 TTFB from African edge nodes
- 4.8/5 user rating on Product Hunt launch

---

## 2. Personas

### Solo (free → $9/yr)
**Name**: **Léa, 28, freelance designer (Lyon, FR)**
- Runs a portfolio site + booking page
- Currently pays Carrd Pro $19/yr + Calendly free
- Pain: 2 logins, 2 bills, no analytics
- Goal: One page, one bill, one place to track visitors
- Success: Migrates in 15 min, gets 100 visits/week, sees conversion in dashboard

### Maker ($9/yr)
**Name**: **Kossi, 32, indie developer (Kinshasa, DRC)**
- Runs a SaaS landing + technical blog + newsletter
- Currently pays Carrd $19 + WP hosting $300 + Mailchimp $240 = $559/yr
- Pain: 3 bills, integrations break, slow from DRC
- Goal: One platform, fast from Africa, native CMS + email
- Success: Migrates in a weekend, gets 4 new channels, pays $108/yr

### Business ($49/yr)
**Name**: **Amina, 41, course creator (Nairobi, KE)**
- Sells a $299 course with 1,200 students
- Currently pays Carrd + ConvertKit $708 + Memberstack $300 + Stripe Atlas $60 + Airtable $240 = $1,327/yr
- Pain: 5 bills, 5 logins, lost students between systems
- Goal: One funnel, native membership, one customer view
- Success: Migrates in 2 days, conversion 1.8% → 6.8%, saves $1,219/yr

### Agency ($49/yr × N clients)
**Name**: **Studio Bamako, 4-person agency**
- Manages 12 client sites + funnels
- Currently pays $14,400/yr in SaaS subscriptions
- Pain: Per-seat fees everywhere, client onboarding takes 3 days
- Goal: One workspace, white-label export, role-based access
- Success: Onboards 1 client in 1 hour, white-labels the dashboard

---

## 3. Scope (v0.1)

### In scope (MVP — months 1-4)
1. **Auth**: Email + password + magic link, OAuth (Google, GitHub), 2FA TOTP
2. **Sites**: Multi-page site builder (10 blocks: Hero, Text, Image, Form, Pricing, FAQ, Footer, Embed, Code, CMS Collection)
3. **CMS**: Postgres-backed collections, 5 field types (text, rich, image, number, relation)
4. **Commerce**: Stripe Checkout, 1 product per site, 1 currency (USD), digital goods
5. **Email**: Transactional + broadcast, 1 list, 5 templates, MJML editor
6. **Forms**: 5 field types, email notification, webhook to Zapier
7. **Memberships**: 1 tier per site, gated content, customer portal
8. **Automation**: 5 triggers (form submit, new CMS entry, payment, signup, manual), 5 actions (email, webhook, CMS update, tag, HTTP)
9. **AI**: 1 model (text generation), 5,000 generations/month on Pro, prompt library
10. **Analytics**: Pageviews, unique visitors, referrers, conversion events, 90-day retention
11. **Custom domain**: 1 per site on Pro, free subdomain `*.myidentity.app`
12. **API**: REST + 1 webhook per site, OpenAPI spec
13. **Billing**: Stripe subscriptions, 3 plans (Free, Pro, Business), usage-based overages
14. **i18n**: Multi-language UI (FR, EN, ES) — sites are mono-language at launch
15. **Security**: CSP, CORS, rate limit, encryption at rest, RGPD/DSA/DMCA-compliant

### Out of scope (MVP)
- Marketplace / community templates
- White-label (agency feature)
- Mobile app (mobile web only)
- Multi-region data residency (single region: EU-west for MVP)
- Video hosting (use YouTube/Vimeo embeds)

### Out of scope (v1.0)
- Course player (scorm, video DRM)
- Live chat
- Native forum
- Multi-currency (USD only at MVP)
- AI image generation
- Native booking system
- App marketplace

---

## 4. User Stories (top 20)

| # | Persona | Story | Priority |
|---|---|---|---|
| 1 | Solo | As a free user, I can sign up with email and create 3 sites in under 5 minutes | P0 |
| 2 | Solo | As a user, I can choose from 8 templates and customize them visually | P0 |
| 3 | Solo | As a user, I can connect a custom domain in 3 clicks | P0 |
| 4 | Maker | As a Pro user, I can create a CMS collection and display it on a page | P0 |
| 5 | Maker | As a Pro user, I can send a broadcast email to my subscribers | P0 |
| 6 | Maker | As a Pro user, I can A/B test 2 variants of a headline | P1 |
| 7 | Maker | As a Pro user, I have access to 5,000 AI generations/month | P1 |
| 8 | Business | As a Business user, I can sell a product with Stripe Checkout | P0 |
| 9 | Business | As a Business user, I can create a members-only section with 1 tier | P0 |
| 10 | Business | As a Business user, I can set up automations (form → email → tag) | P0 |
| 11 | Business | As a Business user, I can see conversion funnels in analytics | P1 |
| 12 | Agency | As a Business user, I can invite 5 teammates with roles | P0 |
| 13 | Agency | As a Business user, I can manage multiple sites from one dashboard | P0 |
| 14 | All | As a user, I can see all my bills in one Stripe Customer Portal | P0 |
| 15 | All | As a user, I can export my data as a zip (RGPD right to data portability) | P0 |
| 16 | All | As a user, I can delete my account and all data (RGPD right to erasure) | P0 |
| 17 | All | As a user, I get an email notification when a form is submitted | P0 |
| 18 | All | As a user, I can set a hard usage cap to never get surprised by overages | P1 |
| 19 | All | As a user, I can switch the UI to French, English, or Spanish | P0 |
| 20 | All | As a user, I get a 99.99% uptime SLA (with credits) | P1 |

---

## 5. Functional Spec

### 5.1 Authentication

**Flows**:
- Email + password (Argon2id hash, 32-byte salt, 64MB memory cost)
- Magic link (15-min TTL, single-use, signed JWT)
- OAuth: Google, GitHub (OAuth 2.0 PKCE)
- 2FA: TOTP (RFC 6238), QR code enrollment, 8 backup codes (one-time)

**Sessions**:
- HTTP-only, Secure, SameSite=Lax cookie
- JWT (HS256), 7-day rolling expiry
- Active sessions list in user settings (revoke any)
- Concurrent sessions allowed (max 10 per user)

**Account recovery**:
- Email-based recovery (no security questions)
- Recovery codes (8 single-use, generated at 2FA enrollment)

### 5.2 Sites

**Limits by plan**:
| | Free | Pro ($9/yr) | Business ($49/yr) |
|---|---|---|---|
| Sites | 3 | 25 | unlimited |
| Pages per site | 5 | 100 | 1,000 |
| Storage | 1 GB | 50 GB | 500 GB |
| Bandwidth | unlimited* | unlimited* | unlimited* |
| Custom domain | 0 | 1 | 10 |

*Fair-use: 100 GB/month on Free, 10 TB/month on Pro, 100 TB/month on Business

**URL structure**:
- Free: `https://{slug}.myidentity.app` (slug unique, 3-32 chars, lowercase)
- Custom: CNAME or A record to edge node

**Site states**:
- `draft` (private, password-protected, or link-only)
- `published` (public)
- `archived` (read-only, hidden from dashboard)

### 5.3 CMS

**Collections**:
- Per-site, unlimited collections
- Per-collection fields: text, longtext, rich (Markdown), number, boolean, date, image, file, relation, select
- Up to 50 fields per collection
- Up to 10,000 entries per collection on Pro, 100,000 on Business

**Display**:
- List view: filter, sort, paginate
- Detail view: customizable template
- Embed: `{{cms.collection-name}}` syntax in page

**API**: `GET /api/v1/sites/{site_id}/cms/{collection}` returns JSON

### 5.4 Commerce

**MVP scope**:
- 1 product per site (Pro), unlimited on Business
- 1 currency: USD
- 1 price point per product (no variants, no tiers)
- Digital goods only (no shipping, no inventory)
- Stripe Checkout (hosted, redirect back to site)
- Webhook on `checkout.session.completed` → grants access

**Customer view**:
- Email with download link or access URL
- "My purchases" page (proxied from Stripe Customer Portal)
- Receipts via Stripe

**Tax**:
- Stripe Tax (auto-enabled, $0 setup)
- 1 product, 1 tax rate (or auto-detect)

### 5.5 Email

**Transactional** (unlimited on all plans):
- Form confirmations
- Purchase receipts (via Stripe)
- Magic links, 2FA codes
- Account changes

**Broadcast** (Pro: 10,000/month, Business: 100,000/month):
- 1 list per site
- 5 templates (Pro), 20 (Business)
- MJML editor (drag-and-drop, with HTML source view)
- Send to all, or to a segment (tags)
- Open + click tracking (1×1 pixel, unique signed URLs)
- Unsubscribe link (RGPD-compliant, list-unsubscribe header)

**Infrastructure**:
- DKIM + SPF + DMARC (auto-configured)
- Sending IP: shared pool (Pro), dedicated (Business on request)
- Warm-up: 50 emails/day → 50K/day over 30 days for new domains

### 5.6 Forms

**Field types**: text, email, textarea, select, radio, checkbox, file (Pro only), date, number, hidden

**Submissions**:
- Stored in DB, max 1,000 on Free, 10,000 on Pro, 100,000 on Business
- Email notification (1 recipient on Free, 5 on Pro, unlimited on Business)
- Webhook (POST JSON, 5 endpoints on Pro, 20 on Business)
- Zapier-compatible (yes — webhook format matches)

**Anti-spam**:
- Cloudflare Turnstile (free, no friction)
- Honeypot field
- Rate limit: 10 submissions/min/IP

### 5.7 Memberships

**MVP scope**:
- 1 tier per site (Pro), 5 on Business
- Gated content: mark any page or CMS entry as "members-only"
- Sign-up: email + password or magic link
- Customer portal: hosted at `/members/{site}` (no separate domain)

**Auth**:
- Session cookie scoped to site domain
- No 2FA (delegated to account-level 2FA)
- Password reset via magic link

**Billing**:
- Free: included in site owner account (no separate subscription)
- Paid memberships: Stripe Subscriptions, $1+ / month (any amount set by site owner)
- Webhook sync: cancel → revoke access within 5 min

### 5.8 Automation

**Triggers (5)**: form.submit, cms.create, cms.update, payment.success, signup.create, manual

**Actions (5)**: email.send, webhook.fire, cms.update, tag.add, http.request

**Rules**:
- Pro: 10 active rules per site
- Business: 100
- 1-second delay (Pro) or 1-min cron (Business)
- No loops (action cannot trigger itself)
- Logs: 100 most recent runs visible in UI

**Example**: "When form X is submitted → tag subscriber as 'lead' → send email 'Welcome' → add to CRM collection"

### 5.9 AI

**Model**: Mistral 7B (cloud) for Pro, Mixtral 8x7B for Business (configurable)

**Capabilities (MVP)**:
- Text generation (prompts: blog post, email subject, social post, headline, summary, translate)
- Image alt text generation
- 5,000 generations/month on Pro, 50,000 on Business
- Overage: $0.001/generation (Pro), $0.0005 (Business)

**Limits**:
- 2,000 input tokens, 1,000 output tokens per request
- 60s timeout
- No streaming (JSON response only at MVP)
- No function calling
- Prompt library: 20 starter templates

**Cost tracking**: every generation logged with input/output tokens + cost in cents

### 5.10 Analytics

**Events tracked** (cookie-less, RGPD-compliant):
- `pageview` (path, referrer, country, device)
- `conversion` (custom event, e.g., form.submit, payment.success)
- `signup` (newsletter, membership, account)

**Storage**:
- Edge: rollups per minute (Cloudflare Analytics Engine)
- Origin: full events in Postgres (90-day retention on Pro, 1-year on Business)

**Dashboard**:
- Pageviews, uniques, top pages, top referrers, top countries
- Conversion funnels (Pro+)
- Real-time (last 5 min)
- Export CSV (Pro+)

### 5.11 Custom Domain

**Setup**:
- User adds CNAME: `www.mysite.com → myidentity.app` or A record
- TLS auto-issued via Let's Encrypt DNS-01
- HSTS preload (after 30 days of clean renewal)
- 1-click HTTPS enforcement

**Limits**:
- Pro: 1 custom domain
- Business: 10
- Apex domains (no `www`): supported via ALIAS/ANAME

**Subdomain on Free**: `{slug}.myidentity.app` (HTTPS auto, no setup)

### 5.12 API

**REST API** (v1):
- `GET /api/v1/sites` — list sites
- `POST /api/v1/sites` — create site
- `GET /api/v1/sites/{id}` — read
- `PATCH /api/v1/sites/{id}` — update
- `DELETE /api/v1/sites/{id}` — archive
- `GET /api/v1/sites/{id}/cms/{collection}` — list entries
- `POST /api/v1/sites/{id}/cms/{collection}` — create entry
- `POST /api/v1/sites/{id}/forms/{form_id}/submit` — submit form
- `POST /api/v1/sites/{id}/checkout` — create Stripe checkout session

**Auth**: Bearer token (per-site API key, generated in dashboard)

**Webhooks**: site owner registers URL, we sign with HMAC-SHA256

**Rate limit**: 60 req/min on Free, 1,000 on Pro, 10,000 on Business

**OpenAPI 3.1 spec**: published at `/api/v1/openapi.json`

---

## 6. Technical Architecture

### 6.1 Stack (Cloudflare-first)

| Layer | Choice | Why |
|---|---|---|
| **Edge compute** | Cloudflare Workers | Sub-50ms cold start, 200+ PoPs, $0.50/M requests |
| **API** | Workers + Hono framework | TypeScript, ~3ms cold start, fits Workers runtime |
| **Database** | Cloudflare D1 (SQLite, distributed) | Free tier generous, $0.75/GB-month, Postgres-like SQL |
| **Object storage** | Cloudflare R2 | $0.015/GB-month, no egress fees |
| **Video** | Cloudflare Stream | $1/1000 min stored, $1/1000 min delivered |
| **Cache** | Cloudflare KV | $0.50/GB-month, edge-replicated |
| **Analytics** | Cloudflare Analytics Engine | Free, time-series, SQL-like query |
| **Email** | Resend (or AWS SES) | $20/month for 50K emails, deliverability |
| **Auth** | Lucia (self-hosted) | No vendor lock-in, full control |
| **Payments** | Stripe | Industry standard, RGPD-compliant |
| **AI** | Mistral API | EU-hosted, no vendor lock-in |
| **Forms anti-spam** | Cloudflare Turnstile | Free, no user friction |
| **Monitoring** | Sentry + Workers Analytics | Error tracking + logs |
| **CI/CD** | GitHub Actions | Free for public repos, integrates with our `systeme-robuste` account |
| **DNS** | Cloudflare DNS | Free, fast, integrated |
| **CDN** | Cloudflare CDN | Implicit with Workers |

**Why not Vercel + Supabase?**
- Vercel costs grow non-linearly with usage (1TB bandwidth = $150 on Vercel, $0 on CF)
- Supabase has egress fees ($0.09/GB after 5GB)
- Our usage-based pricing model aligns with Cloudflare's flat rates
- African edge presence: Cloudflare has Lagos, Cape Town, Nairobi PoPs; Vercel has Frankfurt only

**Why not self-hosted (Hetzner + Postgres)?**
- Capex, DevOps burden, slower iteration
- Doesn't align with $9/yr pricing (need to amortize infra over many users)

### 6.2 High-level diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      User Browser                            │
└─────────────────────────────┬────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              Cloudflare Edge (200+ PoPs)                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Workers (Hono router)                                 │  │
│  │  - /sites/* → site renderer (KV cache)                 │  │
│  │  - /api/v1/* → API handler                             │  │
│  │  - /dashboard/* → SPA (static asset)                   │  │
│  │  - /webhooks/* → webhook receiver                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ D1 (DB)  │  │ R2 (file)│  │   KV     │  │ Analytics│     │
│  │ sites    │  │ uploads  │  │  cache   │  │  Engine  │     │
│  │ users    │  │ images   │  │  config  │  │ events   │     │
│  │ cms      │  │ videos   │  │  html    │  │          │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────┬────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  Third-party services                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Stripe   │  │  Resend  │  │ Mistral  │  │ Sentry   │     │
│  │ payments │  │  email   │  │   AI     │  │  errors  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Database schema (D1, 10 tables)

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- ulid
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,                -- argon2id, NULL if OAuth-only
  name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'fr',         -- 'fr' | 'en' | 'es'
  plan TEXT DEFAULT 'free',         -- 'free' | 'pro' | 'business'
  stripe_customer_id TEXT UNIQUE,
  totp_secret TEXT,
  backup_codes TEXT,                -- JSON array, hashed
  created_at INTEGER NOT NULL,      -- unix epoch ms
  deleted_at INTEGER                -- soft delete (RGPD right to erasure)
);

-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,              -- JWT jti
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);

-- Sites
CREATE TABLE sites (
  id TEXT PRIMARY KEY,              -- ulid
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,        -- for *.myidentity.app
  name TEXT NOT NULL,
  description TEXT,
  state TEXT DEFAULT 'draft',       -- 'draft' | 'published' | 'archived'
  custom_domain TEXT UNIQUE,        -- optional, e.g., www.example.com
  locale TEXT DEFAULT 'fr',
  plan_quota_cents INTEGER,         -- hard cap on monthly overages, 0 = unlimited
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER
);
CREATE INDEX idx_sites_user ON sites(user_id);
CREATE INDEX idx_sites_state ON sites(state);

-- Pages (within a site)
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,               -- /about, /pricing, etc.
  title TEXT NOT NULL,
  blocks TEXT NOT NULL,             -- JSON array of block definitions
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  state TEXT DEFAULT 'published',   -- 'draft' | 'published' | 'archived'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(site_id, slug)
);
CREATE INDEX idx_pages_site ON pages(site_id);

-- CMS collections
CREATE TABLE cms_collections (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,               -- 'posts', 'products', etc.
  fields TEXT NOT NULL,             -- JSON schema
  created_at INTEGER NOT NULL,
  UNIQUE(site_id, name)
);

-- CMS entries
CREATE TABLE cms_entries (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES cms_collections(id) ON DELETE CASCADE,
  data TEXT NOT NULL,               -- JSON object
  state TEXT DEFAULT 'published',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_cms_entries_collection ON cms_entries(collection_id, created_at DESC);

-- Forms (one per site, but allow multiple)
CREATE TABLE forms (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields TEXT NOT NULL,             -- JSON schema
  email_to TEXT,                    -- notification recipient
  webhook_url TEXT,                 -- zapier-compatible
  turnstile_enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Form submissions
CREATE TABLE form_submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  country TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_form_submissions_form ON form_submissions(form_id, created_at DESC);

-- Email subscribers (per site)
CREATE TABLE subscribers (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  tags TEXT,                        -- JSON array
  state TEXT DEFAULT 'active',      -- 'active' | 'unsubscribed' | 'bounced'
  source TEXT,                      -- 'form', 'manual', 'import'
  created_at INTEGER NOT NULL,
  unsubscribed_at INTEGER,
  UNIQUE(site_id, email)
);
CREATE INDEX idx_subscribers_site ON subscribers(site_id, state);

-- Members (memberships)
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id TEXT,                     -- nullable: if member is also platform user
  email TEXT NOT NULL,
  password_hash TEXT,               -- nullable if magic-link only
  tier_id TEXT NOT NULL,
  state TEXT DEFAULT 'active',
  stripe_subscription_id TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  UNIQUE(site_id, email)
);

-- Automation rules
CREATE TABLE automations (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,            -- 'form.submit', 'cms.create', etc.
  trigger_config TEXT,              -- JSON
  conditions TEXT,                  -- JSON array
  actions TEXT NOT NULL,            -- JSON array
  enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Automation logs
CREATE TABLE automation_logs (
  id TEXT PRIMARY KEY,
  automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  triggered_at INTEGER NOT NULL,
  status TEXT NOT NULL,             -- 'success' | 'error' | 'skipped'
  duration_ms INTEGER,
  log TEXT                          -- JSON
);
CREATE INDEX idx_automation_logs_auto ON automation_logs(automation_id, triggered_at DESC);

-- Usage events (for billing overages)
CREATE TABLE usage_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id TEXT,                     -- nullable
  metric TEXT NOT NULL,             -- 'ai_generations', 'storage_gb', 'bandwidth_gb', 'subscribers'
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,               -- 'count', 'gb', 'mb', etc.
  cost_cents INTEGER NOT NULL,
  period TEXT NOT NULL,             -- 'YYYY-MM'
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_usage_events_user_period ON usage_events(user_id, period);
CREATE INDEX idx_usage_events_site_period ON usage_events(site_id, period);

-- API keys
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,           -- sha256 of the key
  prefix TEXT NOT NULL,             -- 'mi_live_abc123' (first 12 chars, for display)
  last_used_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL
);
```

### 6.4 API surface (Hono router)

```typescript
// apps/api/src/index.ts
import { Hono } from 'hono';
import { authMiddleware, rateLimitMiddleware } from './middleware';

const api = new Hono()
  .use('*', rateLimitMiddleware)
  .use('/api/*', authMiddleware);

api.get('/api/v1/sites', listSites);
api.post('/api/v1/sites', createSite);
api.get('/api/v1/sites/:id', getSite);
api.patch('/api/v1/sites/:id', updateSite);
api.delete('/api/v1/sites/:id', archiveSite);

api.get('/api/v1/sites/:id/pages', listPages);
api.post('/api/v1/sites/:id/pages', createPage);
api.patch('/api/v1/sites/:id/pages/:pageId', updatePage);

api.get('/api/v1/sites/:id/cms/:collection', listCmsEntries);
api.post('/api/v1/sites/:id/cms/:collection', createCmsEntry);
api.patch('/api/v1/sites/:id/cms/:collection/:entryId', updateCmsEntry);

api.post('/api/v1/sites/:id/forms/:formId/submit', submitForm);

api.post('/api/v1/sites/:id/checkout', createCheckoutSession);
api.post('/api/v1/sites/:id/broadcast', sendBroadcast);

api.post('/api/v1/sites/:id/ai/generate', generateText);

api.get('/api/v1/analytics/sites/:id', getAnalytics);

export default api;
```

### 6.5 Webhooks (incoming + outgoing)

**Incoming** (we receive):
- Stripe: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- Resend: `email.delivered`, `email.bounced`, `email.complained`
- Cloudflare: `stream.video.ready` (for transcoding notifications)

**Outgoing** (we send):
- Site owner registers URL, we sign with `X-MyIdentity-Signature: sha256(hmac(secret, body))`
- Retry: 3 attempts, exponential backoff (1s, 10s, 100s)
- Dead letter queue after 3 failures (visible in dashboard)

### 6.6 Security

**Authentication**:
- Argon2id for password hashing (memory=64MB, iterations=3, parallelism=4)
- Constant-time comparison
- Rate limit: 5 failed logins per 15 min per IP
- Account lockout: 10 failed logins → 1-hour lockout (email notification)

**Authorization**:
- Per-resource ACL (site, page, collection, form, automation)
- 3 roles: owner, editor, viewer
- 2-person approval for destructive actions on Business plan (optional)

**Transport**:
- TLS 1.3 only, HSTS preload, OCSP stapling
- HSTS max-age 2 years
- CAA records restricting CA to Let's Encrypt

**Application**:
- CSP: `default-src 'self'; script-src 'self' 'unsafe-inline' (only for inline handlers); style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com`
- CORS: allow only our domains
- CSRF: token in custom header for state-changing requests
- Input validation: Zod schemas at API boundary
- Output encoding: React's default escaping (in dashboard SPA)
- SQL injection: parameterized queries only (D1 binding)
- XSS: no `eval`, no `dangerouslySetInnerHTML` in production

**Data**:
- Encryption at rest: D1 is encrypted by Cloudflare (AES-256)
- Encryption in transit: TLS 1.3
- PII minimization: collect only what's needed
- RGPD: right to access, rectification, erasure, portability (export as JSON+zip)
- DSA: transparency report, 24h response to takedowns
- DMCA: designated agent, counter-notice flow
- Backup: daily snapshot, 30-day retention, in EU region

**Operational**:
- Secrets in Cloudflare Workers Secrets (encrypted)
- No secrets in code, no secrets in env vars
- Rotation: every 90 days for active credentials
- Audit log: 1-year retention (immutable, append-only)

### 6.7 Observability

**Metrics** (Cloudflare Analytics Engine):
- Request count, p50/p95/p99 latency, error rate
- Per-endpoint, per-plan, per-region
- Custom events: site.published, form.submitted, payment.completed

**Logs** (Workers Tail → Sentry):
- Structured JSON logs
- PII redaction (no email/password/token in logs)
- 30-day retention, search in Sentry

**Errors** (Sentry):
- Source maps uploaded on deploy
- Release tracking
- User feedback widget (optional, in-app)

**Uptime**:
- 99.9% target (MVP), 99.99% (GA)
- Health check: `GET /health` returns 200 with build SHA + DB ping
- Status page: status.myidentity.app (Cloudflare Workers + KV)

**Alerts**:
- Error rate > 1% → Slack #incidents
- p95 latency > 500ms → Slack #perf
- Stripe webhook failure > 5% → Slack #billing

### 6.8 Performance budgets

| Metric | Budget | Tool |
|---|---|---|
| TTFB (edge) | < 50ms p50, < 200ms p95 | Workers Analytics |
| LCP | < 1.5s p75 | Real User Monitoring |
| CLS | < 0.1 | Real User Monitoring |
| HTML size | < 50 KB gzipped | Build check |
| JS size (dashboard) | < 200 KB gzipped | Build check |
| Image size | < 200 KB per image | Upload-time check |
| DB query time | < 10ms p95 | D1 metrics |
| Cache hit rate | > 95% | KV metrics |

### 6.9 Cost projections (month 12, 500 paying users)

| Item | Unit cost | Volume | Monthly |
|---|---|---|---|
| Workers requests | $0.50/M | 50M | $25 |
| D1 reads | $0.001/M | 100M | $100 |
| D1 writes | $1.00/M | 5M | $5,000... wait, that's too much |

**Reconsidering D1 for write-heavy workloads.**

D1 write costs are $1/M, which at 5M writes/month = $5,000. That's not viable. Switching to a hybrid: D1 for reads + **Neon** (serverless Postgres) for writes. Neon: $0.016/GB-month storage, $0.09/compute-hour. At 500 users with ~10 writes/user/day = 150K writes/day = 4.5M writes/month. Compute: 0.5 CU = ~$15/month. Storage: 10 GB = $0.16. Total: $15-30/month. Much better.

**Revised architecture**:
- D1: read-only replicas, KV cache, page rendering cache
- Neon: primary database (writes, complex queries, analytics)
- R2: assets
- Workers: edge logic
- Cron: scheduled jobs (analytics rollups, usage billing)

**Cost table (revised)**:
| Item | Unit cost | Volume | Monthly |
|---|---|---|---|
| Workers requests | $0.50/M | 50M | $25 |
| D1 (cache) | $0.75/GB-month | 5 GB | $4 |
| Neon compute | $0.09/CU-hour | 0.5 CU | $11 |
| Neon storage | $0.16/GB-month | 10 GB | $2 |
| R2 storage | $0.015/GB-month | 100 GB | $2 |
| R2 egress | $0 | 1 TB | $0 |
| Resend | $20/month | 50K emails | $20 |
| Mistral AI | $0.20/M tokens | 10M | $2 |
| Stripe | 2.9% + 30¢ | $4,167 MRR | $160 |
| Sentry | $26/month | 100K errors | $26 |
| Turnstile | $0 | free | $0 |
| **Total** | | | **~$252** |

At $4,167 MRR (500 × $9 Pro average), **gross margin = 94%**. ✓

### 6.10 Deployment

**Environments**:
- `local`: wrangler dev, local D1 + MinIO (S3-compatible) + Postgres in Docker
- `staging`: deploy on push to `main`, separate Cloudflare account
- `production`: deploy on release tag (v0.1.0), manual approval

**CI/CD** (GitHub Actions):
1. PR: lint, type-check, test, build
2. Merge to main: deploy to staging
3. Tag v*: build Docker image, push, deploy to production
4. Post-deploy: run smoke tests, notify Sentry

**Database migrations**:
- Drizzle ORM (drizzle-kit)
- Migrations are forward-only
- Rollback: write a new migration
- Migration history: stored in `migrations/` directory, applied in order

**Feature flags**:
- Cloudflare Workers KV (cheap, fast)
- 1-second TTL (no stale flags)
- Per-user, per-site flags

---

## 7. Roadmap

### Phase 1: MVP (months 1-4, target 2026-10)
- Auth (email + magic link + OAuth)
- Sites (10 blocks, 8 templates)
- Custom domain
- CMS (5 field types)
- Forms
- Email (transactional + 1 broadcast list)
- Stripe Checkout (1 product)
- Memberships (1 tier)
- 3 languages (FR/EN/ES)
- Site renderer (Cloudflare Workers + KV cache)
- Dashboard (React + Vite + TanStack Router)
- RGPD-compliant data export + delete

### Phase 2: Beta (months 5-7, target 2026-12)
- Automations (5 triggers, 5 actions)
- AI (Mistral 7B, 5K generations/month on Pro)
- Analytics (pageviews, conversion events, funnels)
- A/B testing
- Webhooks (incoming + outgoing)
- API + OpenAPI spec
- Multiple team members (3 roles)
- Webhooks for Zapier

### Phase 3: GA (months 8-12, target 2027-03)
- White-label for agencies
- 50+ templates (marketplace-ready)
- Mobile app (React Native)
- Advanced analytics (cohorts, retention)
- Multi-currency
- Video hosting (Cloudflare Stream)
- Course player
- Native booking
- Community features (comments, forum)
- Mobile push notifications

---

## 8. Open questions

1. **Multi-currency**: USD-only at MVP, but should we add EUR/GBP/CDF in Phase 2? Cost: +1 week for Stripe multi-currency + tax. Decision: defer to Phase 2.
2. **White-label timing**: Marketing says "agencies love it" — but white-label is a big lift. Defer to Phase 3? Or build a minimal "remove My Identity branding" toggle in Phase 2?
3. **AI cost control**: Mistral 7B is $0.20/M tokens. If a user runs 5,000 generations of 2K input + 1K output, that's 15M tokens = $3 per user per month. Fine for Pro ($9/yr), but at scale: 500 users × $3 = $1,500/month AI cost. We need a hard cap or rate limit.
4. **Africa-specific features**: SMS notifications? Mobile money payments (M-Pesa, Airtel Money)? Low-bandwidth mode? Defer to Phase 3 unless user research shows strong demand.
5. **Data residency**: Single region (EU-west) at MVP, but African users may want African data residency. Cloudflare's "Regional Services" add 50% cost. Defer to Phase 2/3.

---

## 9. Risks & mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| D1 write costs blow up at scale | High | High | Switched to Neon Postgres (already in this PRD) |
| Cloudflare Workers cold start on first request | Medium | Medium | < 5ms; use Cache API for first-page paint |
| Stripe webhook delivery failure | Low | High | 3-retry with exponential backoff; manual replay in dashboard |
| Mistral API outage | Low | Medium | Fallback to local Llama 3 8B (slower, no streaming) |
| African PoP latency still > 200ms | Medium | Medium | Cache aggressively, measure, optimize |
| RGPD/DSA takedown volume | Low | Medium | Designated agent, clear process, $5K legal retainer |
| User data export leak | Low | Critical | Signed URLs, expiring tokens, no PII in logs |
| Template IP theft | Medium | Medium | License terms, fingerprint, DMCA process |
| AI-generated content policy violations | Medium | High | Content moderation, terms of service, opt-out flag |
| Cost overrun on abuse | Medium | High | Hard caps, anomaly detection, account suspension |

---

## 10. References

- [Carrd pricing](https://carrd.co/pricing)
- [Systeme.io pricing](https://systeme.io/pricing)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Stripe pricing](https://stripe.com/pricing)
- [Resend pricing](https://resend.com/pricing)
- [Mistral pricing](https://docs.mistral.ai/getting-started/pricing/)
- [Neon pricing](https://neon.tech/pricing)
- [Drizzle ORM docs](https://orm.drizzle.team/)
- [Hono docs](https://hono.dev/)
- [Lucia auth](https://lucia-auth.com/)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Cloudflare Stream](https://developers.cloudflare.com/stream/)
- [Cloudflare Analytics Engine](https://developers.cloudflare.com/analytics/)

---

**Sign-off**: Draft for review. Awaiting feedback from Califi before promoting to v0.2 with: confirmed stack choice, final pricing, MVP feature list adjustments.
