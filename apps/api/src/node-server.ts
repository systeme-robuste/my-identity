/**
 * Node.js entry point for the API service (Render / Vercel / Fly / etc.).
 *
 * On Workers, `src/index.ts` is the entry — wrangler picks it up via
 * `main = "src/index.ts"` in `wrangler.toml`. On Node, this file takes
 * over and wraps the Hono app with `@hono/node-server`.
 *
 * The two entry points share the same Hono app — no duplication of routes
 * or middleware. The runtime difference is hidden by the bindings package:
 *   - `env.DB_CACHE` returns the D1 binding on Workers, a Neon-backed
 *     emulated D1 on Node.
 *   - `env.SESSIONS` returns the KV binding on Workers, an Upstash-Redis
 *     emulated KV on Node.
 *
 * The environment variable `RUNTIME=node` triggers the Node path everywhere
 * in the bindings package.
 */

import { serve } from "@hono/node-server";
import app from "./index.ts";
import { buildNodeEnv } from "./node-env.ts";

// Build the env ONCE per process. The bindings (KV/D1/R2) are
// process-singletons. The plain string fields are also cached.
const env = buildNodeEnv();

const port = Number(process.env.PORT ?? 10000);

console.log(`[api] Starting Node server on port ${port}`);
console.log(`[api] RUNTIME = ${env.RUNTIME}`);
console.log(`[api] ENVIRONMENT = ${env.ENVIRONMENT}`);
console.log(`[api] Upstash configured: ${Boolean(env.UPSTASH_REDIS_REST_URL)}`);
console.log(`[api] R2 configured: ${Boolean(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY)}`);

// Wrap Hono's fetch to inject the env as the second argument. Hono's
// `app.fetch(request, env, ctx)` signature matches the Workers API, so
// this is a thin passthrough.
const nodeFetch = (request: Request): Promise<Response> => app.fetch(request, env);

serve(
  {
    fetch: nodeFetch,
    port,
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`[api] Listening on http://${info.address}:${info.port}`);
  }
);

// Graceful shutdown for Render's zero-downtime deploys
const shutdown = (signal: string) => {
  console.log(`[api] ${signal} received, shutting down gracefully`);
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
