/**
 * Unit tests for `lib/logger.ts` — level filtering, pretty vs JSON output,
 * and the requestId middleware behaviour.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { shouldLog, log, logger, type LogLevel } from "./logger.ts";
import type { Env } from "../types/env.d.ts";
import type { Context, MiddlewareHandler } from "hono";

function makeEnv(level: LogLevel, environment: "development" | "production" = "production"): Pick<Env, "ENVIRONMENT" | "LOG_LEVEL" | "APP_NAME"> {
  return {
    ENVIRONMENT: environment,
    LOG_LEVEL: level,
    APP_NAME: "my-identity-test",
  } as Pick<Env, "ENVIRONMENT" | "LOG_LEVEL" | "APP_NAME">;
}

describe("shouldLog", () => {
  it("respects ordering: debug < info < warn < error", () => {
    expect(shouldLog("info", "debug")).toBe(false);
    expect(shouldLog("info", "info")).toBe(true);
    expect(shouldLog("info", "warn")).toBe(true);
    expect(shouldLog("info", "error")).toBe(true);
  });

  it("emits everything at debug level", () => {
    expect(shouldLog("debug", "debug")).toBe(true);
    expect(shouldLog("debug", "info")).toBe(true);
    expect(shouldLog("debug", "warn")).toBe(true);
    expect(shouldLog("debug", "error")).toBe(true);
  });

  it("emits only errors at error level", () => {
    expect(shouldLog("error", "debug")).toBe(false);
    expect(shouldLog("error", "info")).toBe(false);
    expect(shouldLog("error", "warn")).toBe(false);
    expect(shouldLog("error", "error")).toBe(true);
  });
});

describe("log", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits JSON in production", () => {
    log(makeEnv("info", "production"), "info", "hello", { a: 1 });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const line = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe("info");
    expect(parsed.msg).toBe("hello");
    expect(parsed.app).toBe("my-identity-test");
    expect(parsed.env).toBe("production");
    expect(parsed.a).toBe(1);
    expect(typeof parsed.ts).toBe("string");
  });

  it("emits pretty lines in development", () => {
    log(makeEnv("info", "development"), "warn", "careful");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const line = warnSpy.mock.calls[0][0] as string;
    // pretty format: "<iso> LEVEL  msg {json fields}"
    expect(line).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(line).toContain("WARN");
    expect(line).toContain("careful");
  });

  it("routes error level to console.error and warn to console.warn", () => {
    log(makeEnv("debug", "production"), "error", "boom");
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("suppresses entries below the configured level", () => {
    log(makeEnv("warn", "production"), "info", "skipped");
    log(makeEnv("warn", "production"), "debug", "skipped");
    log(makeEnv("warn", "production"), "warn", "kept");
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe("logger middleware", () => {
  function makeCtx(reqIdHeader: string | undefined, env: Pick<Env, "ENVIRONMENT" | "LOG_LEVEL" | "APP_NAME">) {
    const headers: Record<string, string> = {};
    if (reqIdHeader) headers["X-Request-Id"] = reqIdHeader;
    const store = new Map<string, unknown>();
    const setHeaders: Record<string, string> = {};
    const req = { method: "GET", path: "/test", header: (n: string) => headers[n] } as unknown as Context<Env>["req"];
    const res = {
      status: 200,
      // The middleware reads c.res.status after next() resolves.
    };
    return {
      ctx: {
        req,
        res,
        env: env as Env,
        set: (k: string, v: unknown) => store.set(k, v),
        get: (k: string) => store.get(k),
        header: (n: string, v: string) => {
          setHeaders[n] = v;
        },
      } as unknown as Context<Env>,
      store,
      setHeaders,
    };
  }

  it("uses the provided X-Request-Id when present", async () => {
    const { ctx, store, setHeaders } = makeCtx("req_abc", makeEnv("info", "production"));
    const mw = logger({ pretty: false }) as MiddlewareHandler<Env>;
    await mw(ctx, async () => {
      expect(store.get("requestId")).toBe("req_abc");
    });
    expect(setHeaders["X-Request-Id"]).toBe("req_abc");
  });

  it("generates a UUID v4 when X-Request-Id is missing", async () => {
    const { ctx, store, setHeaders } = makeCtx(undefined, makeEnv("info", "production"));
    const mw = logger({ pretty: false }) as MiddlewareHandler<Env>;
    await mw(ctx, async () => {});
    const id = store.get("requestId") as string;
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(20);
    // Loose UUID shape: 8-4-4-4-12 hex chars
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(setHeaders["X-Request-Id"]).toBe(id);
  });

  it("re-throws downstream errors after logging", async () => {
    const { ctx } = makeCtx("req_x", makeEnv("info", "production"));
    const mw = logger({ pretty: false }) as MiddlewareHandler<Env>;
    await expect(
      mw(ctx, async () => {
        throw new Error("downstream boom");
      })
    ).rejects.toThrow("downstream boom");
  });
});
