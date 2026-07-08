/**
 * Audit middleware. Logs every state-changing API call to the `audit` KV
 * namespace (and to the structured logger). The KV entry is short-lived
 * (24h) — the canonical audit log is written to Neon asynchronously by
 * a queue worker (Phase 1.5).
 *
 * To enable on a route: `app.use("/v1/me/delete", audit())`.
 *
 * TODO(Phase 1.5): flush KV entries to Neon in batches every 60s.
 */

import type { MiddlewareHandler } from "hono";
import type { Env } from "../types/env.d.ts";

export interface AuditOptions {
  /** Override the action name; defaults to `${method} ${path}`. */
  action?: string;
}

export function audit(options: AuditOptions = {}): MiddlewareHandler<Env> {
  return async (c, next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    const userId = (c.get("userId" as never) as string | null | undefined) ?? null;
    const ip = c.req.header("CF-Connecting-IP") ?? null;
    const ua = c.req.header("User-Agent") ?? null;

    let status = 0;
    try {
      await next();
      status = c.res.status;
    } finally {
      const entry = {
        ts: new Date().toISOString(),
        action: options.action ?? `${method} ${path}`,
        userId,
        ip,
        ua,
        status,
        durationMs: Date.now() - start,
      };
      // Best-effort write; never fail the request because of audit.
      c.executionCtx?.waitUntil(
        c.env.AUDIT_LOG.put(`audit:${entry.ts}:${crypto.randomUUID()}`, JSON.stringify(entry), { expirationTtl: 86_400 })
      );
    }
  };
}
