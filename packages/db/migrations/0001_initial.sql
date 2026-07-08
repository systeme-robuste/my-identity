-- My Identity — Initial migration
-- Source of truth: packages/db (Drizzle). This file mirrors roadmap/phase-1-mvp/schema.sql
-- and is kept in sync by hand until Drizzle Kit takes over (0002+).

-- My Identity — Database schema v0.1
-- Target: Neon Postgres (primary) + Cloudflare D1 (cache)
-- Migrations: drizzle-kit
-- Date: 2026-07-02

-- ====================================================================
-- USERS
-- ====================================================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,                       -- ulid
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,                        -- argon2id, NULL if OAuth-only
  name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'fr',                  -- 'fr' | 'en' | 'es'
  plan TEXT DEFAULT 'free',                  -- 'free' | 'pro' | 'business'
  plan_renews_at INTEGER,                    -- unix epoch ms
  stripe_customer_id TEXT UNIQUE,
  totp_secret TEXT,                          -- encrypted at rest
  totp_enabled INTEGER DEFAULT 0,
  backup_codes TEXT,                         -- JSON array, hashed
  email_verified INTEGER DEFAULT 0,
  email_verified_at INTEGER,
  last_login_at INTEGER,
  last_login_ip TEXT,
  failed_login_count INTEGER DEFAULT 0,
  locked_until INTEGER,                      -- 1-hour lockout after 10 failures
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER                         -- soft delete (RGPD right to erasure)
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe ON users(stripe_customer_id);
CREATE INDEX idx_users_plan ON users(plan) WHERE deleted_at IS NULL;

-- ====================================================================
-- SESSIONS
-- ====================================================================
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,                       -- JWT jti
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip TEXT,
  user_agent TEXT,
  country TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  revoked_at INTEGER
);
CREATE INDEX idx_sessions_user ON sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE revoked_at IS NULL;

-- ====================================================================
-- OAUTH ACCOUNTS
-- ====================================================================
CREATE TABLE oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,                    -- 'google' | 'github'
  provider_user_id TEXT NOT NULL,
  access_token_encrypted TEXT,               -- encrypted at rest
  refresh_token_encrypted TEXT,
  scopes TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(provider, provider_user_id)
);
CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);

-- ====================================================================
-- API KEYS
-- ====================================================================
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id TEXT,                              -- nullable, site-scoped keys
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,                    -- sha256 of the full key
  prefix TEXT NOT NULL,                      -- 'mi_live_abc123' (first 12 chars)
  scopes TEXT,                               -- JSON array, e.g., ['read:cms', 'write:forms']
  last_used_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ====================================================================
-- SITES
-- ====================================================================
CREATE TABLE sites (
  id TEXT PRIMARY KEY,                       -- ulid
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,                 -- for *.myidentity.app
  name TEXT NOT NULL,
  description TEXT,
  state TEXT DEFAULT 'draft',                -- 'draft' | 'published' | 'archived'
  custom_domain TEXT UNIQUE,                 -- optional
  custom_domain_verified INTEGER DEFAULT 0,
  locale TEXT DEFAULT 'fr',                  -- primary locale of this site
  plan_quota_cents INTEGER DEFAULT 0,        -- hard cap on monthly overages
  theme TEXT,                                -- theme override (e.g., 'Aura', 'Helix')
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER,
  archived_at INTEGER
);
CREATE INDEX idx_sites_user ON sites(user_id) WHERE archived_at IS NULL;
CREATE INDEX idx_sites_state ON sites(state);
CREATE INDEX idx_sites_custom_domain ON sites(custom_domain) WHERE custom_domain IS NOT NULL;

-- ====================================================================
-- SITE MEMBERSHIPS (team)
-- ====================================================================
CREATE TABLE site_members (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                        -- 'owner' | 'editor' | 'viewer'
  invited_by TEXT REFERENCES users(id),
  invited_at INTEGER NOT NULL,
  accepted_at INTEGER,
  UNIQUE(site_id, user_id)
);
CREATE INDEX idx_site_members_user ON site_members(user_id);
CREATE INDEX idx_site_members_site ON site_members(site_id);

-- ====================================================================
-- PAGES
-- ====================================================================
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                        -- /about, /pricing
  title TEXT NOT NULL,
  blocks TEXT NOT NULL,                      -- JSON array of block definitions
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  noindex INTEGER DEFAULT 0,
  state TEXT DEFAULT 'published',            -- 'draft' | 'published' | 'archived'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER,
  UNIQUE(site_id, slug)
);
CREATE INDEX idx_pages_site ON pages(site_id);
CREATE INDEX idx_pages_state ON pages(state);

-- ====================================================================
-- CMS COLLECTIONS
-- ====================================================================
CREATE TABLE cms_collections (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                        -- 'posts', 'products'
  singular_name TEXT NOT NULL,               -- 'post', 'product'
  fields TEXT NOT NULL,                      -- JSON schema (array of field defs)
  display_template TEXT,                     -- mustache template for detail view
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(site_id, name)
);
CREATE INDEX idx_cms_collections_site ON cms_collections(site_id);

-- ====================================================================
-- CMS ENTRIES
-- ====================================================================
CREATE TABLE cms_entries (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES cms_collections(id) ON DELETE CASCADE,
  slug TEXT,                                 -- for URLs
  data TEXT NOT NULL,                        -- JSON object
  state TEXT DEFAULT 'published',
  author_id TEXT REFERENCES users(id),
  seo_title TEXT,
  seo_description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER,
  UNIQUE(collection_id, slug)
);
CREATE INDEX idx_cms_entries_collection ON cms_entries(collection_id, created_at DESC);
CREATE INDEX idx_cms_entries_state ON cms_entries(state) WHERE state = 'published';

-- ====================================================================
-- FORMS
-- ====================================================================
CREATE TABLE forms (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields TEXT NOT NULL,                      -- JSON schema
  submit_button_label TEXT DEFAULT 'Submit',
  success_message TEXT,
  success_redirect_url TEXT,
  email_to TEXT,                             -- notification recipient(s), comma-separated
  email_subject TEXT,
  webhook_url TEXT,                          -- zapier-compatible
  webhook_secret TEXT,                       -- HMAC secret for webhook
  turnstile_enabled INTEGER DEFAULT 1,
  honeypot_field TEXT,                       -- hidden field name
  rate_limit_per_minute INTEGER DEFAULT 10,
  state TEXT DEFAULT 'active',               -- 'active' | 'archived'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_forms_site ON forms(site_id);

-- ====================================================================
-- FORM SUBMISSIONS
-- ====================================================================
CREATE TABLE form_submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  country TEXT,
  referrer TEXT,
  spam_score REAL,                           -- 0.0 (ham) to 1.0 (spam)
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_form_submissions_form ON form_submissions(form_id, created_at DESC);

-- ====================================================================
-- SUBSCRIBERS (email list)
-- ====================================================================
CREATE TABLE subscribers (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  tags TEXT,                                 -- JSON array
  state TEXT DEFAULT 'active',               -- 'active' | 'unsubscribed' | 'bounced' | 'complained'
  source TEXT,                               -- 'form' | 'manual' | 'import' | 'api'
  source_form_id TEXT REFERENCES forms(id),
  ip_country TEXT,
  created_at INTEGER NOT NULL,
  subscribed_at INTEGER,
  unsubscribed_at INTEGER,
  bounced_at INTEGER,
  UNIQUE(site_id, email)
);
CREATE INDEX idx_subscribers_site ON subscribers(site_id, state);
CREATE INDEX idx_subscribers_email ON subscribers(email);

-- ====================================================================
-- EMAIL TEMPLATES
-- ====================================================================
CREATE TABLE email_templates (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  mjml TEXT,                                 -- MJML source
  html TEXT,                                 -- compiled HTML
  variables TEXT,                            -- JSON schema of available vars
  state TEXT DEFAULT 'draft',                -- 'draft' | 'published'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_email_templates_site ON email_templates(site_id);

-- ====================================================================
-- EMAIL BROADCASTS (history)
-- ====================================================================
CREATE TABLE email_broadcasts (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES email_templates(id),
  subject TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  sent_to_count INTEGER NOT NULL,
  delivered_count INTEGER,
  opened_count INTEGER,
  clicked_count INTEGER,
  bounced_count INTEGER,
  complained_count INTEGER,
  unsubscribed_count INTEGER,
  state TEXT DEFAULT 'queued',               -- 'queued' | 'sending' | 'sent' | 'failed'
  scheduled_for INTEGER,
  sent_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_email_broadcasts_site ON email_broadcasts(site_id, sent_at DESC);

-- ====================================================================
-- PRODUCTS
-- ====================================================================
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  file_url TEXT,                             -- R2 key for digital good
  stripe_product_id TEXT UNIQUE,
  stripe_price_id TEXT UNIQUE,
  state TEXT DEFAULT 'active',               -- 'active' | 'archived'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_products_site ON products(site_id);

-- ====================================================================
-- ORDERS
-- ====================================================================
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  buyer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  state TEXT DEFAULT 'pending',              -- 'pending' | 'paid' | 'failed' | 'refunded'
  paid_at INTEGER,
  refunded_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_orders_site ON orders(site_id, created_at DESC);
CREATE INDEX idx_orders_buyer ON orders(buyer_email);
CREATE INDEX idx_orders_state ON orders(state);

-- ====================================================================
-- MEMBERSHIPS (member tiers)
-- ====================================================================
CREATE TABLE membership_tiers (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                        -- 'Free', 'Pro', 'VIP'
  description TEXT,
  price_cents INTEGER NOT NULL,              -- 0 for free
  interval TEXT,                             -- 'month' | 'year' (NULL for free)
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  features TEXT,                             -- JSON array of feature names
  state TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_membership_tiers_site ON membership_tiers(site_id);

-- ====================================================================
-- MEMBERS
-- ====================================================================
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL REFERENCES membership_tiers(id),
  user_id TEXT,                              -- nullable: if member is also platform user
  email TEXT NOT NULL,
  password_hash TEXT,                        -- nullable if magic-link only
  name TEXT,
  state TEXT DEFAULT 'active',               -- 'active' | 'cancelled' | 'expired'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start INTEGER,
  current_period_end INTEGER,
  cancelled_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(site_id, email)
);
CREATE INDEX idx_members_site ON members(site_id, state);
CREATE INDEX idx_members_stripe ON members(stripe_subscription_id);

-- ====================================================================
-- GATED CONTENT (membership)
-- ====================================================================
CREATE TABLE gated_content (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,               -- 'page' | 'cms_entry'
  resource_id TEXT NOT NULL,
  required_tier_id TEXT NOT NULL REFERENCES membership_tiers(id),
  UNIQUE(site_id, resource_type, resource_id)
);
CREATE INDEX idx_gated_content_site ON gated_content(site_id);

-- ====================================================================
-- AUTOMATIONS (Phase 2)
-- ====================================================================
CREATE TABLE automations (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,                     -- 'form.submit' | 'cms.create' | etc.
  trigger_config TEXT,                       -- JSON
  conditions TEXT,                           -- JSON array of conditions
  actions TEXT NOT NULL,                     -- JSON array
  enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_automations_site ON automations(site_id) WHERE enabled = 1;

-- ====================================================================
-- AUTOMATION LOGS
-- ====================================================================
CREATE TABLE automation_logs (
  id TEXT PRIMARY KEY,
  automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  triggered_at INTEGER NOT NULL,
  completed_at INTEGER,
  status TEXT NOT NULL,                      -- 'success' | 'error' | 'skipped' | 'in_progress'
  duration_ms INTEGER,
  log TEXT,                                  -- JSON
  error TEXT
);
CREATE INDEX idx_automation_logs_auto ON automation_logs(automation_id, triggered_at DESC);

-- ====================================================================
-- ANALYTICS EVENTS
-- ====================================================================
CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  event_type TEXT NOT NULL,                  -- 'pageview' | 'conversion' | 'signup'
  path TEXT,
  referrer TEXT,
  country TEXT,
  device_type TEXT,                          -- 'mobile' | 'tablet' | 'desktop'
  browser TEXT,
  os TEXT,
  session_id TEXT,                           -- hashed session
  visitor_id TEXT,                           -- hashed visitor
  metadata TEXT,                             -- JSON
  created_at INTEGER NOT NULL
);
-- Note: real analytics are in Cloudflare Analytics Engine, this is for archival
CREATE INDEX idx_analytics_events_site ON analytics_events(site_id, created_at DESC);
CREATE INDEX idx_analytics_events_type ON analytics_events(site_id, event_type, created_at DESC);

-- ====================================================================
-- USAGE EVENTS (for billing overages)
-- ====================================================================
CREATE TABLE usage_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id TEXT,                              -- nullable
  metric TEXT NOT NULL,                      -- 'ai_generations' | 'storage_gb' | 'bandwidth_gb' | 'subscribers'
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,                        -- 'count' | 'gb' | 'mb' | 'request'
  cost_cents INTEGER NOT NULL,
  period TEXT NOT NULL,                      -- 'YYYY-MM'
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_usage_events_user_period ON usage_events(user_id, period);
CREATE INDEX idx_usage_events_site_period ON usage_events(site_id, period);

-- ====================================================================
-- WEBHOOKS (outgoing)
-- ====================================================================
CREATE TABLE webhooks (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT NOT NULL,                      -- JSON array
  secret TEXT NOT NULL,                      -- HMAC secret
  state TEXT DEFAULT 'active',               -- 'active' | 'paused'
  last_triggered_at INTEGER,
  last_status_code INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_webhooks_site ON webhooks(site_id) WHERE state = 'active';

-- ====================================================================
-- WEBHOOK DELIVERIES
-- ====================================================================
CREATE TABLE webhook_deliveries (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  attempt_number INTEGER NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  duration_ms INTEGER,
  state TEXT NOT NULL,                       -- 'pending' | 'success' | 'failed' | 'dead_letter'
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);

-- ====================================================================
-- AUDIT LOG
-- ====================================================================
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,                              -- nullable for system events
  site_id TEXT,                              -- nullable
  action TEXT NOT NULL,                      -- 'user.login' | 'site.published' | 'form.submitted' | etc.
  resource_type TEXT,
  resource_id TEXT,
  ip TEXT,
  user_agent TEXT,
  metadata TEXT,                             -- JSON
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_site ON audit_log(site_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action, created_at DESC);

-- ====================================================================
-- ABUSE REPORTS
-- ====================================================================
CREATE TABLE abuse_reports (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  reporter_email TEXT NOT NULL,
  reporter_name TEXT,
  reason TEXT NOT NULL,                      -- 'spam' | 'phishing' | 'copyright' | 'illegal' | 'other'
  description TEXT,
  evidence_url TEXT,
  state TEXT DEFAULT 'pending',              -- 'pending' | 'investigating' | 'resolved' | 'rejected'
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at INTEGER,
  resolution TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_abuse_reports_site ON abuse_reports(site_id);
CREATE INDEX idx_abuse_reports_state ON abuse_reports(state, created_at DESC);

-- ====================================================================
-- DATA EXPORT REQUESTS (RGPD)
-- ====================================================================
CREATE TABLE data_export_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state TEXT DEFAULT 'pending',              -- 'pending' | 'ready' | 'expired' | 'downloaded'
  download_url TEXT,                         -- signed, expires in 7 days
  expires_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_data_export_user ON data_export_requests(user_id, created_at DESC);
