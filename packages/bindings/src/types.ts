/**
 * Re-export the Cloudflare Workers types so the rest of the codebase can
 * import them from `@my-identity/bindings` without depending directly
 * on `@cloudflare/workers-types` (which is Workers-only).
 *
 * On Node, these are pure TypeScript interfaces — the actual implementation
 * is provided by `node-kv.ts`, `node-d1.ts`, and `node-r2.ts`.
 */

export type {
  D1Database,
  D1PreparedStatement,
  D1Result,
  KVNamespace,
  R2Bucket,
  R2Object,
  R2ObjectBody,
  R2PutOptions,
  R2ListOptions,
  R2ListResult,
} from "@cloudflare/workers-types";

/**
 * Minimal subset of the Workers `Env` interface that the bindings consume.
 * The full `Env` (with all secrets) lives in each app's `types/env.d.ts`.
 */
export interface BindingsEnv {
  // Vars
  ENVIRONMENT: "development" | "staging" | "production";

  // For Node runtime only — Cloudflare binds resources via wrangler.toml
  // and these are ignored.
  RUNTIME?: "cloudflare" | "node";
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  NEON_DATABASE_URL?: string;

  // Cloudflare bindings (only present on Workers)
  DB_CACHE?: D1Database;
  SESSIONS?: KVNamespace;
  RATE_LIMIT?: KVNamespace;
  AUDIT_LOG?: KVNamespace;
  RENDER_CACHE?: KVNamespace;
  CACHE_DB?: D1Database;
  MEDIA?: R2Bucket;
}
