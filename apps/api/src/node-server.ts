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

// ============================================================================
// CRASH SHIELD (top-level) — must be installed BEFORE any import that could
// fail. Catches anything that escapes even the try/catch in main().
// ============================================================================

/**
 * Format a log line for Render. Render captures stdout/stderr from the
 * Node process, and `console.error` is the most reliable channel —
 * the platform forwards it to the deploy log stream.
 */
function log(stage: string, msg: string, extra?: unknown): void {
  const ts = new Date().toISOString();
  const tail = extra === undefined ? "" : ` | ${JSON.stringify(extra)}`;
  const line = `[${ts}] [api:boot] [${stage}] ${msg}${tail}\n`;
  // console.error writes to stderr; flush is implicit on each call.
  console.error(line);
}

log("shield", "installing global crash handlers");
process.on("uncaughtException", (err) => {
  log("shield", "UNCAUGHT EXCEPTION", { message: err.message, stack: err.stack });
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  log("shield", "UNHANDLED REJECTION", { message: err.message, stack: err.stack });
  process.exit(1);
});

log("boot", "node-server.ts: file entered, runtime detected", {
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  pid: process.pid,
  envRuntime: process.env.RUNTIME ?? "(unset)",
  envPort: process.env.PORT ?? "(unset)",
});

// ============================================================================
// MAIN — wrapped in a top-level async IIFE that funnels every error into
// the same log channel. We use dynamic imports so a module that throws
// at load time lands in the catch block instead of crashing the file
// before main() ever runs.
// ============================================================================

async function main(): Promise<void> {
  log("main", "main() started");

  // --- 1. Imports ---------------------------------------------------------
  let serveFn: typeof import("@hono/node-server").serve;
  let app: import("hono").Hono;
  let buildNodeEnv: () => ReturnType<typeof import("./node-env.js").buildNodeEnv>;

  try {
    log("import", "importing @hono/node-server");
    const honoNode = await import("@hono/node-server");
    serveFn = honoNode.serve;
    log("import", "@hono/node-server loaded");

    log("import", "importing ./index.ts (Hono app)");
    const appMod = await import("./index.ts");
    app = (appMod as any).default ?? (appMod as any).app;
    if (!app) throw new Error("Hono app not exported (neither `default` nor `app`)");
    log("import", "./index.ts loaded");

    log("import", "importing ./node-env.ts");
    const envMod = await import("./node-env.ts");
    buildNodeEnv = (envMod as any).buildNodeEnv;
    if (typeof buildNodeEnv !== "function") {
      throw new Error("buildNodeEnv is not a function");
    }
    log("import", "./node-env.ts loaded");
  } catch (err) {
    log("import", "FATAL: import failed", {
      message: (err as Error).message,
      stack: (err as Error).stack,
    });
    process.exit(1);
    return; // unreachable, but keeps the type-checker happy
  }

  // --- 2. Build env -------------------------------------------------------
  let env: ReturnType<typeof buildNodeEnv>;
  try {
    log("env", "calling buildNodeEnv()");
    env = buildNodeEnv();
    log("env", "buildNodeEnv() succeeded", {
      RUNTIME: env.RUNTIME,
      ENVIRONMENT: (env as any).ENVIRONMENT,
      hasUpstash: Boolean((env as any).UPSTASH_REDIS_REST_URL),
      hasR2: Boolean((env as any).R2_ACCESS_KEY_ID && (env as any).R2_SECRET_ACCESS_KEY),
      hasDb: Boolean((env as any).DATABASE_URL),
    });
  } catch (err) {
    log("env", "FATAL: buildNodeEnv() failed", {
      message: (err as Error).message,
      stack: (err as Error).stack,
    });
    process.exit(1);
    return;
  }

  // --- 3. Start the server -----------------------------------------------
  const port = Number(process.env.PORT ?? 10000);
  log("serve", `preparing to bind 0.0.0.0:${port}`);

  // Wrap Hono's fetch to inject the env as the second argument. Hono's
  // `app.fetch(request, env, ctx)` signature matches the Workers API, so
  // this is a thin passthrough.
  const nodeFetch = (request: Request): Promise<Response> => app.fetch(request, env as any);

  try {
    serveFn(
      {
        fetch: nodeFetch,
        port,
        hostname: "0.0.0.0",
      },
      (info) => {
        log("serve", `LISTENING on http://${info.address}:${info.port} — SERVER IS LIVE`);
      },
    );
    log("serve", "serve() returned synchronously (server is async)");
  } catch (err) {
    log("serve", "FATAL: serve() threw synchronously", {
      message: (err as Error).message,
      stack: (err as Error).stack,
    });
    process.exit(1);
    return;
  }

  // --- 4. Graceful shutdown ----------------------------------------------
  const shutdown = (signal: string) => {
    log("shutdown", `${signal} received, exiting gracefully`);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  log("main", "main() finished — server handed off to @hono/node-server");
}

// ============================================================================
// ENTRY POINT — fire main(). All errors funnel through the crash shield
// installed at the top of the file.
// ============================================================================

log("entry", "calling main()");
main().catch((topErr) => {
  log("entry", "UNHANDLED main() rejection", {
    message: (topErr as Error).message,
    stack: (topErr as Error).stack,
  });
  process.exit(1);
});

log("entry", "node-server.ts: file fully evaluated (main() in flight)");
