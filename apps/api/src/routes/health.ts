/**
 * Health & root routes.
 *
 * - `GET /` returns API info (name, version, docs URL).
 * - `GET /health` returns liveness info.
 *
 * Both endpoints are unauthenticated and excluded from the global
 * `/v1/*` rate limit (they're mounted on the root `app`, not under
 * `v1`). They're safe to poll from uptime monitors.
 */

import { Hono } from "hono";
import type { Env } from "../types/env.d.ts";
import { log } from "../lib/logger.ts";

export const healthRoutes = new Hono<Env>();

healthRoutes.get("/", (c) => {
  return c.json({
    name: c.env.APP_NAME,
    version: c.env.APP_VERSION,
    environment: c.env.ENVIRONMENT,
    docs: "https://docs.myidentity.app/api",
    timestamp: new Date().toISOString(),
  });
});

healthRoutes.get("/health", (c) => {
  log(c.env, "debug", "health_check", { requestId: c.get("requestId" as never) as string | undefined });
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: c.env.APP_VERSION,
    environment: c.env.ENVIRONMENT,
  });
});
