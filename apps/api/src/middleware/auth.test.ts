/**
 * Unit tests for `middleware/auth.ts` — auth middleware with required/optional/role modes.
 */
import { describe, it, expect, vi } from "vitest";
import { auth } from "./auth.ts";
import { ApiError } from "../lib/errors.ts";
import type { Context, MiddlewareHandler } from "hono";
import type { Env } from "../types/env.d.ts";

type KV = { get: (k: string) => Promise<string | null>; delete: (k: string) => Promise<void> };

function makeContext(opts: {
  cookie?: string;
  kv: KV;
  cookieName?: string;
}): Context<Env> {
  const store = new Map<string, unknown>();
  const headers: Record<string, string> = {};
  if (opts.cookie) headers["Cookie"] = opts.cookie;
  return {
    req: { header: (n: string) => headers[n] } as Context<Env>["req"],
    env: {
      SESSIONS: opts.kv as unknown as KVNamespace,
      AUTH_SESSION_COOKIE_NAME: opts.cookieName ?? "mi_session",
    } as Env,
    get: (k: string) => store.get(k),
    set: (k: string, v: unknown) => store.set(k, v),
    json: (data: unknown, status: number) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" },
      }),
  } as unknown as Context<Env>;
}

async function runMw(mw: MiddlewareHandler<Env>, ctx: Context<Env>): Promise<{ status: number; body: any; ctx: Context<Env> }> {
  try {
    await mw(ctx, async () => {});
    return { status: 200, body: null, ctx };
  } catch (e) {
    if (e instanceof ApiError) {
      const res = ctx.json({ error: { code: e.code, message: e.message } }, e.status as number);
      return { status: e.status as number, body: await res.json(), ctx };
    }
    throw e;
  }
}

describe("auth middleware", () => {
  it("returns 401 when required and no cookie", async () => {
    const ctx = makeContext({ kv: { get: async () => null, delete: async () => {} } });
    const r = await runMw(auth({ required: true }), ctx);
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe("unauthorized");
  });

  it("passes through when not required and no cookie (anonymous)", async () => {
    const ctx = makeContext({ kv: { get: async () => null, delete: async () => {} } });
    const r = await runMw(auth({ required: false }), ctx);
    expect(r.status).toBe(200);
    expect(r.ctx.get("role")).toBe("anonymous");
    expect(r.ctx.get("userId")).toBeNull();
  });

  it("attaches userId from valid session", async () => {
    const session = { userId: "u_1", role: "owner", expiresAt: new Date(Date.now() + 60000).toISOString() };
    const ctx = makeContext({
      cookie: "mi_session=sess_abc",
      kv: { get: async () => JSON.stringify(session), delete: async () => {} },
    });
    const r = await runMw(auth({ required: false }), ctx);
    expect(r.status).toBe(200);
    expect(r.ctx.get("userId")).toBe("u_1");
    expect(r.ctx.get("role")).toBe("owner");
    expect(r.ctx.get("sessionId")).toBe("sess_abc");
  });

  it("rejects expired session", async () => {
    const session = { userId: "u_1", role: "owner", expiresAt: new Date(Date.now() - 1000).toISOString() };
    const delCalls: string[] = [];
    const ctx = makeContext({
      cookie: "mi_session=sess_abc",
      kv: {
        get: async () => JSON.stringify(session),
        delete: async (k: string) => { delCalls.push(k); },
      },
    });
    const r = await runMw(auth({ required: true }), ctx);
    expect(r.status).toBe(401);
    expect(delCalls).toContain("sess_abc");
  });

  it("rejects corrupted session payload", async () => {
    const delCalls: string[] = [];
    const ctx = makeContext({
      cookie: "mi_session=sess_corrupt",
      kv: {
        get: async () => "this is not JSON{",
        delete: async (k: string) => { delCalls.push(k); },
      },
    });
    const r = await runMw(auth({ required: true }), ctx);
    expect(r.status).toBe(401);
    expect(r.body.error.message).toContain("corrupted");
    expect(delCalls).toContain("sess_corrupt");
  });

  it("rejects insufficient role", async () => {
    const session = { userId: "u_1", role: "viewer", expiresAt: new Date(Date.now() + 60000).toISOString() };
    const ctx = makeContext({
      cookie: "mi_session=sess_abc",
      kv: { get: async () => JSON.stringify(session), delete: async () => {} },
    });
    const r = await runMw(auth({ required: true, role: "owner" }), ctx);
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("forbidden");
  });

  it("accepts sufficient role", async () => {
    const session = { userId: "u_1", role: "admin", expiresAt: new Date(Date.now() + 60000).toISOString() };
    const ctx = makeContext({
      cookie: "mi_session=sess_abc",
      kv: { get: async () => JSON.stringify(session), delete: async () => {} },
    });
    const r = await runMw(auth({ required: true, role: "editor" }), ctx);
    expect(r.status).toBe(200);
  });
});
