/**
 * Rate-limit middleware. Backed by Cloudflare KV with a sliding-window
 * approximation. The window is in seconds; the key is derived from
 * `by` (`ip`, `userId`, or both).
 *
 * TODO(Phase 2): replace the sliding-window approximation with a true
 * sliding-window using a sorted-set per key.
 */

import type { MiddlewareHandler } from "hono";
import type { Env } from "../types/env.d.ts";
import { ApiError } from "../lib/errors.ts";

export interface RateLimitOptions {
  window: number; // seconds
  max: number;
  by: "ip" | "userId" | "user-or-ip";
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler<Env> {
  return async (c, next) => {
    const key = buildKey(c, options.by);
    if (!key) {
      // No keying source available (no IP, no user) — let it through.
      await next();
      return;
    }
    const kvKey = `rl:${key}`;
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / options.window);
    const kvSubKey = `${kvKey}:${bucket}`;
    const current = Number((await c.env.RATE_LIMIT.get(kvSubKey)) ?? "0");
    if (current + 1 > options.max) {
      const resetAt = (bucket + 1) * options.window;
      c.header("X-RateLimit-Limit", String(options.max));
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", String(resetAt));
      throw new ApiError("rate_limited", "Too many requests", 429);
    }
    await c.env.RATE_LIMIT.put(kvSubKey, String(current + 1), { expirationTtl: options.window * 2 });
    c.header("X-RateLimit-Limit", String(options.max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, options.max - current - 1)));
    await next();
  };
}

function buildKey(c: { req: { header: (n: string) => string | undefined }; get: (k: string) => unknown }, by: RateLimitOptions["by"]): string | null {
  if (by === "ip") return c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "anon";
  if (by === "userId") {
    const uid = c.get("userId" as never) as string | null | undefined;
    return uid ?? null;
  }
  // user-or-ip
  const uid = c.get("userId" as never) as string | null | undefined;
  if (uid) return `u:${uid}`;
  return `i:${c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "anon"}`;
}
