/**
 * CORS middleware. Restricts origins to a per-environment allowlist; for
 * the dashboard, supports credentials (cookies). For programmatic API
 * access, credentials are not used.
 *
 * Wildcard origins are never used with credentials — instead we echo the
 * origin when it's in the allowlist and refuse otherwise.
 */

import type { MiddlewareHandler } from "hono";
import type { Env } from "../types/env.d.ts";

export interface CORSOptions {
  origin: (origin: string) => string | null;
  credentials: boolean;
  allowedMethods?: ReadonlyArray<string>;
  allowedHeaders?: ReadonlyArray<string>;
}

const DEFAULT_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const DEFAULT_HEADERS = ["Content-Type", "Authorization", "X-Requested-With", "Idempotency-Key", "X-Request-Id"];

export function cors(options: CORSOptions): MiddlewareHandler<Env> {
  return async (c, next) => {
    const origin = c.req.header("Origin");
    if (origin) {
      const allowed = options.origin(origin);
      if (allowed) {
        c.header("Access-Control-Allow-Origin", allowed);
        c.header("Vary", "Origin");
        if (options.credentials) c.header("Access-Control-Allow-Credentials", "true");
        c.header("Access-Control-Allow-Methods", (options.allowedMethods ?? DEFAULT_METHODS).join(", "));
        c.header("Access-Control-Allow-Headers", (options.allowedHeaders ?? DEFAULT_HEADERS).join(", "));
        c.header("Access-Control-Max-Age", "600");
      }
    }
    if (c.req.method === "OPTIONS") return new Response(null, { status: 204 });
    await next();
  };
}
