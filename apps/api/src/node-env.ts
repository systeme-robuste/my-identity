/**
 * Cross-runtime env adapter. On Workers, `env` is the second argument
 * to the fetch handler. On Node, we build an `Env` from `process.env`
 * and the runtime-detected Upstash/S3 clients.
 *
 * The bindings themselves are constructed eagerly here (one per process)
 * using the bindings package. On Workers, these fields are populated by
 * the runtime from `wrangler.toml`.
 */

import { getRuntime, isNode, getKV, getD1, getR2 } from "@my-identity/bindings";
import type { KVNamespace, D1Database, R2Bucket } from "@cloudflare/workers-types";
import type { Env } from "./types/env.d.ts";

/**
 * Build an `Env` object from `process.env` + bindings package. Used by
 * the Node entry point (`src/node-server.ts`) to construct the per-request
 * env that Hono middleware expects.
 */
export function buildNodeEnv(): Env {
  if (!isNode()) {
    throw new Error("[node-env] buildNodeEnv() called on a non-Node runtime");
  }
  const env = process.env;

  // Construct bindings eagerly so routes can do `c.env.SESSIONS.get(...)`
  // unchanged. The bindings are runtime-aware: on Node they back to
  // Upstash Redis (KV) + Neon (D1) + S3 (R2).
  const baseEnv: Env = {
    // Vars
    ENVIRONMENT: (env.ENVIRONMENT as Env["ENVIRONMENT"]) ?? "development",
    LOG_LEVEL: (env.LOG_LEVEL as Env["LOG_LEVEL"]) ?? "info",
    APP_BASE_URL: env.APP_BASE_URL ?? "http://localhost:5173",
    RENDERER_BASE_URL: env.RENDERER_BASE_URL ?? "http://localhost:8788",
    APP_NAME: env.APP_NAME ?? "My Identity API",
    APP_VERSION: env.APP_VERSION ?? "0.1.0",

    // Runtime
    RUNTIME: "node",

    // Secrets
    DATABASE_URL: env.DATABASE_URL ?? "",
    DATABASE_URL_UNPOOLED: env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL ?? "",
    RESEND_API_KEY: env.RESEND_API_KEY ?? "",
    RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL ?? "noreply@myidentity.app",
    RESEND_REPLY_TO: env.RESEND_REPLY_TO ?? "support@myidentity.app",
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY ?? "",
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET ?? "",
    MISTRAL_API_KEY: env.MISTRAL_API_KEY ?? "",
    MISTRAL_MODEL: env.MISTRAL_MODEL ?? "mistral-large-latest",
    TURNSTILE_SITE_KEY: env.TURNSTILE_SITE_KEY ?? "",
    TURNSTILE_SECRET_KEY: env.TURNSTILE_SECRET_KEY ?? "",
    AUTH_SECRET: env.AUTH_SECRET ?? "dev-secret-change-me",
    AUTH_SESSION_COOKIE_NAME: env.AUTH_SESSION_COOKIE_NAME ?? "mi_session",
    R2_ACCOUNT_ID: env.R2_ACCOUNT_ID ?? "",
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID ?? "",
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY ?? "",
    R2_BUCKET_NAME: env.R2_BUCKET_NAME ?? "my-identity-media",
    R2_PUBLIC_BASE_URL:
      env.R2_PUBLIC_BASE_URL ?? env.MEDIA_PUBLIC_URL ?? "http://localhost:9000/my-identity-media",

    // Upstash (Node-only, emulates KV)
    UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL ?? "",
    UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN ?? "",

    // Bindings — constructed via the bindings package (Upstash/Neon/S3 on Node,
    // native Cloudflare bindings on Workers).
    DB_CACHE: undefined as unknown as D1Database,
    SESSIONS: undefined as unknown as KVNamespace,
    RATE_LIMIT: undefined as unknown as KVNamespace,
    AUDIT_LOG: undefined as unknown as KVNamespace,
    MEDIA: undefined as unknown as R2Bucket,
  };

  // Now construct the bindings. The bindings package reads RUNTIME + env
  // and dispatches to the right backend.
  baseEnv.SESSIONS = getKV(baseEnv, "SESSIONS");
  baseEnv.RATE_LIMIT = getKV(baseEnv, "RATE_LIMIT");
  baseEnv.AUDIT_LOG = getKV(baseEnv, "AUDIT_LOG");
  baseEnv.DB_CACHE = getD1(baseEnv, "DB_CACHE");
  baseEnv.MEDIA = getR2(baseEnv, "MEDIA");

  return baseEnv;
}

// Re-export the runtime helpers for convenience
export { getRuntime, isNode };

