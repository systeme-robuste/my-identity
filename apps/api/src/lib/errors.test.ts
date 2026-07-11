/**
 * Unit tests for `lib/errors.ts` — runs in `vitest` or `node --test`.
 * Tests the ApiError class and the error/404 handlers with a mock Hono context.
 */
import { describe, it, expect } from "vitest";
import { ApiError, errorHandler, notFoundHandler } from "./errors.ts";
import type { Context } from "hono";
import type { Env } from "../types/env.d.ts";

function makeContext(env: Partial<Env>, path = "/test", method = "GET"): Context<Env> {
  const store = new Map<string, unknown>();
  return {
    req: { path, method } as Context<Env>["req"],
    env: env as Env,
    get: (k: string) => store.get(k),
    set: (k: string, v: unknown) => store.set(k, v),
    json: (data: unknown, status: number) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" },
      }),
  } as unknown as Context<Env>;
}

describe("ApiError", () => {
  it("constructs with code, message, status", () => {
    const e = new ApiError("not_found", "Resource not found", 404);
    expect(e.code).toBe("not_found");
    expect(e.message).toBe("Resource not found");
    expect(e.status).toBe(404);
    expect(e.name).toBe("ApiError");
  });

  it("defaults status to 400", () => {
    const e = new ApiError("bad_request", "Bad");
    expect(e.status).toBe(400);
  });

  it("attaches details when provided", () => {
    const details = [{ field: "email", message: "invalid" }];
    const e = new ApiError("validation", "Invalid input", 422, details);
    expect(e.details).toEqual(details);
  });

  it("is throwable and catchable as Error", () => {
    try {
      throw new ApiError("test", "msg", 500);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e).toBeInstanceOf(ApiError);
    }
  });
});

describe("errorHandler", () => {
  it("returns ApiError as JSON with the right status", async () => {
    const err = new ApiError("forbidden", "nope", 403);
    const ctx = makeContext({ ENVIRONMENT: "development" });
    const res = await errorHandler(err, ctx);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("forbidden");
    expect(body.error.message).toBe("nope");
    expect(body.error.requestId).toBeNull();
  });

  it("hides message in production for unknown errors", async () => {
    const err = new Error("DB connection failed: super secret");
    const ctx = makeContext({ ENVIRONMENT: "production" });
    const res = await errorHandler(err, ctx);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("internal_error");
    expect(body.error.message).toBe("Internal server error");
  });

  it("leaks message in development for unknown errors", async () => {
    const err = new Error("DB connection failed: super secret");
    const ctx = makeContext({ ENVIRONMENT: "development" });
    const res = await errorHandler(err, ctx);
    const body = await res.json();
    expect(body.error.message).toContain("DB connection failed");
  });
});

describe("notFoundHandler", () => {
  it("returns 404 with the requested method and path", async () => {
    const ctx = makeContext({ ENVIRONMENT: "production" }, "/v1/sites", "POST");
    const res = notFoundHandler(ctx);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("not_found");
    expect(body.error.message).toContain("POST");
    expect(body.error.message).toContain("/v1/sites");
  });
});
