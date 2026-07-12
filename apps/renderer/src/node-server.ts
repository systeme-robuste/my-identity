/**
 * Node.js entry point for the Renderer service (Render / Fly / etc.).
 *
 * Mirrors the api service — wraps the Hono app exported by `src/index.ts`
 * with `@hono/node-server` so the same code runs on Workers and Node.
 *
 * The renderer is read-only (caches pages from the API, serves them
 * with stale-while-revalidate semantics). On Node, the cache is backed
 * by Upstash Redis (KV binding) and a tiny table in Neon Postgres
 * (D1 binding emulation).
 */

import { serve } from "@hono/node-server";
import app from "./index.ts";
import { getRuntime, isNode, getKV, getD1 } from "@my-identity/bindings";
import type { KVNamespace, D1Database } from "@cloudflare/workers-types";
import type { Env } from "./types/env.d.ts";

const env: Env = {
  ENVIRONMENT: (process.env.ENVIRONMENT as Env["ENVIRONMENT"]) ?? "development",
  APP_NAME: process.env.APP_NAME ?? "My Identity Renderer",
  APP_VERSION: process.env.APP_VERSION ?? "0.1.0",
  RUNTIME: "node",
  API_BASE_URL: process.env.API_BASE_URL ?? "http://localhost:8787",
  CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS ?? "300",
  CACHE_STALE_SECONDS: process.env.CACHE_STALE_SECONDS ?? "86400",
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  RENDER_CACHE: undefined as unknown as KVNamespace,
  CACHE_DB: undefined as unknown as D1Database,
};

env.RENDER_CACHE = getKV(env, "RENDER_CACHE");
env.CACHE_DB = getD1(env, "CACHE_DB");

const port = Number(process.env.PORT ?? 10000);

console.log(`[renderer] Starting Node server on port ${port}`);
console.log(`[renderer] RUNTIME = ${env.RUNTIME}`);
console.log(`[renderer] ENVIRONMENT = ${env.ENVIRONMENT}`);
console.log(`[renderer] API_BASE_URL = ${env.API_BASE_URL}`);
console.log(`[renderer] Upstash configured: ${Boolean(env.UPSTASH_REDIS_REST_URL)}`);

const nodeFetch = (request: Request): Promise<Response> => app.fetch(request, env);

serve(
  {
    fetch: nodeFetch,
    port,
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`[renderer] Listening on http://${info.address}:${info.port}`);
  }
);

const shutdown = (signal: string) => {
  console.log(`[renderer] ${signal} received, shutting down gracefully`);
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
