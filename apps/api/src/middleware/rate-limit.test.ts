/**
 * Unit tests for `middleware/rate-limit.ts` — sliding-window KV rate limit.
 * Uses an in-memory KV fake and a minimal Hono Context stub.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, type RateLimitOptions } from "./rate-limit.ts";
import { ApiError } from "../lib/errors.ts";
import type { Context, MiddlewareHandler } from "hono";
import type { Env } from "../types/env.d.ts";

class FakeKV {
  store = new Map<string, string>();
  async get(k: string): Promise<string | null> {
    return this.store.get(k) ?? null;
  }
  async put(k: string, v: string): Promise<void> {
    this.store.set(k, v);
  }
}

type CtxOpts = {
  ip?: string;
  forwardedFor?: string;
  userId?: string | null;
  kv: FakeKV;
};

function makeCtx(opts: CtxOpts): Context<Env> {
  const store = new Map<string, unknown>();
  if (opts.userId !== undefined) store.set("userId", opts.userId);
  const headers: Record<string, string> = {};
  if (opts.ip) headers["CF-Connecting-IP"] = opts.ip;
  if (opts.forwardedFor) headers["X-Forwarded-For"] = opts.forwardedFor;
  const setHeaders: Record<string, string> = {};
  return {
    req: { header: (n: string) => headers[n] } as unknown as Context<Env>["req"],
    env: { RATE_LIMIT: opts.kv as unknown as KVNamespace } as Env,
    get: (k: string) => store.get(k),
    set: (k: string, v: unknown) => store.set(k, v),
    header: (n: string, v: string) => {
      setHeaders[n] = v;
    },
  } as unknown as Context<Env>;
}

async function runMw(mw: MiddlewareHandler<Env>, ctx: Context<Env>): Promise<{ status: number; body: { error: { code: string; message: string } } | null }> {
  try {
    await mw(ctx, async () => {
      // downstream ok
    });
    return { status: 200, body: null };
  } catch (e) {
    if (e instanceof ApiError) {
      return { status: e.status, body: { error: { code: e.code, message: e.message } } };
    }
    throw e;
  }
}

describe("rateLimit", () => {
  let kv: FakeKV;
  beforeEach(() => {
    kv = new FakeKV();
  });

  it("lets the request through when no keying source is available (user-or-ip, no IP, no user)", async () => {
    const ctx = makeCtx({ kv });
    const opts: RateLimitOptions = { window: 60, max: 1, by: "user-or-ip" };
    const r = await runMw(rateLimit(opts), ctx);
    expect(r.status).toBe(200);
    expect(kv.store.size).toBe(0);
  });

  it("counts and lets through requests under the limit", async () => {
    const opts: RateLimitOptions = { window: 60, max: 3, by: "ip" };
    const ctx = makeCtx({ ip: "1.2.3.4", kv });
    for (let i = 0; i < 3; i++) {
      const r = await runMw(rateLimit(opts), ctx);
      expect(r.status).toBe(200);
    }
  });

  it("rejects the (max+1)-th request with 429 and rate_limited code", async () => {
    const opts: RateLimitOptions = { window: 60, max: 2, by: "ip" };
    const ctx = makeCtx({ ip: "1.2.3.4", kv });
    await runMw(rateLimit(opts), ctx);
    await runMw(rateLimit(opts), ctx);
    const r = await runMw(rateLimit(opts), ctx);
    expect(r.status).toBe(429);
    expect(r.body?.error.code).toBe("rate_limited");
  });

  it("isolates counters per IP", async () => {
    const opts: RateLimitOptions = { window: 60, max: 1, by: "ip" };
    const a = makeCtx({ ip: "1.1.1.1", kv });
    const b = makeCtx({ ip: "2.2.2.2", kv });
    expect((await runMw(rateLimit(opts), a)).status).toBe(200);
    expect((await runMw(rateLimit(opts), b)).status).toBe(200);
    expect((await runMw(rateLimit(opts), a)).status).toBe(429);
  });

  it("isolates counters per userId when by=userId", async () => {
    const opts: RateLimitOptions = { window: 60, max: 1, by: "userId" };
    const u1 = makeCtx({ userId: "u1", kv });
    const u2 = makeCtx({ userId: "u2", kv });
    expect((await runMw(rateLimit(opts), u1)).status).toBe(200);
    expect((await runMw(rateLimit(opts), u2)).status).toBe(200);
    expect((await runMw(rateLimit(opts), u1)).status).toBe(429);
  });

  it("falls back to X-Forwarded-For when CF-Connecting-IP is missing", async () => {
    const opts: RateLimitOptions = { window: 60, max: 1, by: "ip" };
    const ctx = makeCtx({ forwardedFor: "9.9.9.9", kv });
    expect((await runMw(rateLimit(opts), ctx)).status).toBe(200);
    expect((await runMw(rateLimit(opts), ctx)).status).toBe(429);
  });

  it("uses 'anon' bucket for missing IP, so all anonymous traffic shares the counter", async () => {
    const opts: RateLimitOptions = { window: 60, max: 1, by: "ip" };
    const c1 = makeCtx({ kv });
    const c2 = makeCtx({ kv });
    expect((await runMw(rateLimit(opts), c1)).status).toBe(200);
    expect((await runMw(rateLimit(opts), c2)).status).toBe(429);
  });
});
