/**
 * @my-identity/bindings
 *
 * Cross-runtime bindings adapter. Provides the same interface for KV, D1
 * and R2 across Cloudflare Workers AND Node.js (Render / Vercel / Fly).
 *
 * The runtime is selected at module-load time via the `RUNTIME` env var
 * ("cloudflare" or "node"). The default is "cloudflare" for backwards
 * compatibility with the existing Workers deployment.
 *
 * Usage:
 *   import { getKV, getD1, getR2 } from "@my-identity/bindings";
 *   const kv = getKV(env);          // returns KVNamespace-compatible
 *   const d1 = getD1(env);          // returns D1Database-compatible
 *   const r2 = getR2(env);          // returns R2Bucket-compatible
 *
 * The interface intentionally mirrors the Cloudflare Workers types so
 * that call sites in `apps/api/src/**` and `apps/renderer/src/**` do
 * not need to change.
 */

export * from "./types.ts";
export * from "./kv.ts";
export * from "./d1.ts";
export * from "./r2.ts";
export { getRuntime, isCloudflare, isNode } from "./runtime.ts";
