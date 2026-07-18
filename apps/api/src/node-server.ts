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

process.stderr.write("[api:boot] node-server.ts: file entered\n");

async function main() {
  process.stderr.write("[api:boot] main() start\n");

  let serve: any;
  let app: any;
  let buildNodeEnv: any;

  try {
    process.stderr.write("[api:boot] importing @hono/node-server\n");
    ({ serve } = await import("@hono/node-server"));
    process.stderr.write("[api:boot] @hono/node-server imported OK\n");

    process.stderr.write("[api:boot] importing ./index.ts (Hono app)\n");
    const appMod = await import("./index.ts");
    app = appMod.default ?? appMod.app;
    process.stderr.write("[api:boot] Hono app imported OK\n");

    process.stderr.write("[api:boot] importing ./node-env.ts\n");
    const envMod = await import("./node-env.ts");
    buildNodeEnv = envMod.buildNodeEnv;
    process.stderr.write("[api:boot] node-env imported OK\n");
  } catch (importErr) {
    process.stderr.write(`[api:boot] FATAL import error: ${importErr instanceof Error ? importErr.stack : String(importErr)}\n`);
    process.exit(1);
  }

  // Build the env ONCE per process. The bindings (KV/D1/R2) are
  // process-singletons. The plain string fields are also cached.
  let env;
  try {
    process.stderr.write("[api:boot] calling buildNodeEnv()\n");
    env = buildNodeEnv();
    process.stderr.write("[api:boot] buildNodeEnv() returned OK\n");
  } catch (envErr) {
    process.stderr.write(`[api:boot] FATAL buildNodeEnv error: ${envErr instanceof Error ? envErr.stack : String(envErr)}\n`);
    process.exit(1);
  }

  const port = Number(process.env.PORT ?? 10000);

  process.stderr.write(`[api:boot] Starting Node server on port ${port}\n`);
  process.stderr.write(`[api:boot] RUNTIME = ${env.RUNTIME}\n`);
  process.stderr.write(`[api:boot] ENVIRONMENT = ${env.ENVIRONMENT}\n`);
  process.stderr.write(`[api:boot] Upstash configured: ${Boolean(env.UPSTASH_REDIS_REST_URL)}\n`);
  process.stderr.write(`[api:boot] R2 configured: ${Boolean(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY)}\n`);

  // Wrap Hono's fetch to inject the env as the second argument. Hono's
  // `app.fetch(request, env, ctx)` signature matches the Workers API, so
  // this is a thin passthrough.
  const nodeFetch = (request: Request): Promise<Response> => app.fetch(request, env);

  try {
    process.stderr.write(`[api:boot] calling serve() on 0.0.0.0:${port}\n`);
    serve(
      {
        fetch: nodeFetch,
        port,
        hostname: "0.0.0.0",
      },
      (info: { address: string; port: number }) => {
        process.stderr.write(`[api:boot] Listening on http://${info.address}:${info.port}\n`);
        process.stderr.write(`[api:boot] SERVER IS LIVE\n`);
      }
    );
    process.stderr.write(`[api:boot] serve() returned (server is async)\n`);
  } catch (serveErr) {
    process.stderr.write(`[api:boot] FATAL serve() error: ${serveErr instanceof Error ? serveErr.stack : String(serveErr)}\n`);
    process.exit(1);
  }

  // Graceful shutdown for Render's zero-downtime deploys
  const shutdown = (signal: string) => {
    process.stderr.write(`[api:boot] ${signal} received, shutting down gracefully\n`);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.stderr.write("[api:boot] calling main()\n");
main().catch((topErr) => {
  process.stderr.write(`[api:boot] UNHANDLED main() error: ${topErr instanceof Error ? topErr.stack : String(topErr)}\n`);
  process.exit(1);
});
