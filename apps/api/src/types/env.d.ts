/**
 * Cloudflare Workers environment bindings. The shape of `Env` is mirrored
 * in `wrangler.toml` — adding a binding here requires adding it there too.
 */

export interface Env {
  // Vars
  ENVIRONMENT: "development" | "staging" | "production";
  LOG_LEVEL: "debug" | "info" | "warn" | "error";
  APP_BASE_URL: string;
  RENDERER_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;

  // Secrets
  DATABASE_URL: string;
  DATABASE_URL_UNPOOLED: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  RESEND_REPLY_TO: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  MISTRAL_API_KEY: string;
  MISTRAL_MODEL: string;
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  AUTH_SECRET: string;
  AUTH_SESSION_COOKIE_NAME: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_BASE_URL: string;

  // D1 / KV / R2 bindings
  DB_CACHE: D1Database;
  SESSIONS: KVNamespace;
  RATE_LIMIT: KVNamespace;
  AUDIT_LOG: KVNamespace;
  MEDIA: R2Bucket;
}

/** Per-request context, attached by middleware. */
export interface Context {
  requestId: string;
  userId: string | null;
  sessionId: string | null;
  role: "owner" | "admin" | "editor" | "viewer" | "anonymous";
  locale: "fr" | "en" | "es" | "de" | "pt";
  /** Site ID, set when the request is scoped to a site (e.g. `/v1/sites/:id/*`). */
  siteId: string | null;
}
