/**
 * Structured JSON logger. Writes to stdout in dev (pretty) and to JSON in
 * prod. The Cloudflare Workers runtime captures stdout and ships it to
 * Logpush if configured.
 *
 * TODO(Phase 2): ship to Sentry for `error` level.
 */

import type { MiddlewareHandler } from "hono";
import type { Env } from "../types/env.d.ts";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

const LEVEL_ORDER: Readonly<Record<LogLevel, number>> = { debug: 10, info: 20, warn: 30, error: 40 };

export function shouldLog(envLevel: LogLevel, level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[envLevel];
}

export function log(env: Pick<Env, "ENVIRONMENT" | "LOG_LEVEL" | "APP_NAME">, level: LogLevel, msg: string, fields: LogFields = {}): void {
  if (!shouldLog(env.LOG_LEVEL, level)) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    app: env.APP_NAME,
    env: env.ENVIRONMENT,
    msg,
    ...fields,
  };
  const line = env.ENVIRONMENT === "development" ? prettyPrint(entry) : JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function prettyPrint(entry: LogFields): string {
  const { ts, level, msg, ...rest } = entry as { ts: string; level: string; msg: string; [k: string]: unknown };
  const restStr = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
  return `${ts} ${level.toUpperCase().padEnd(5)} ${msg}${restStr}`;
}

export function logger(opts: { pretty: boolean }): MiddlewareHandler<Env> {
  return async (c, next) => {
    const start = Date.now();
    const reqId = c.req.header("X-Request-Id") ?? crypto.randomUUID();
    c.set("requestId" as never, reqId as never);
    c.header("X-Request-Id", reqId);
    log(c.env, "debug", "request.start", { reqId, method: c.req.method, path: c.req.path });
    try {
      await next();
      log(c.env, "info", "request.end", {
        reqId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - start,
      });
    } catch (e) {
      log(c.env, "error", "request.error", { reqId, error: e instanceof Error ? e.message : String(e) });
      throw e;
    }
  };
}
