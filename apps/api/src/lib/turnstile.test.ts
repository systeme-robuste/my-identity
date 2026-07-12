/**
 * Unit tests for `lib/turnstile.ts` — Cloudflare Turnstile verification.
 *
 * Mocks the global `fetch` to avoid hitting the real endpoint.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { verifyTurnstileToken } from "./turnstile.ts";
import { ApiError } from "./errors.ts";
import type { Env } from "../types/env.d.ts";

const env = {
  TURNSTILE_SECRET_KEY: "test_secret",
  TURNSTILE_SITE_KEY: "test_site",
  ENVIRONMENT: "test",
} as unknown as Env;

let originalFetch: typeof fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetchOnce(status: number, body: unknown) {
  globalThis.fetch = vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    })
  ) as unknown as typeof fetch;
}

describe("verifyTurnstileToken", () => {
  it("rejects empty token", async () => {
    await expect(verifyTurnstileToken(env, "", null)).rejects.toThrow(ApiError);
  });

  it("returns true on success", async () => {
    mockFetchOnce(200, { success: true });
    const r = await verifyTurnstileToken(env, "tk_abc", "1.2.3.4");
    expect(r).toBe(true);
  });

  it("throws on Turnstile failure (success=false)", async () => {
    mockFetchOnce(200, { success: false, "error-codes": ["invalid-input-response"] });
    await expect(verifyTurnstileToken(env, "tk_bad", null)).rejects.toThrow(ApiError);
  });

  it("throws on HTTP error from Turnstile", async () => {
    mockFetchOnce(500, { success: false });
    await expect(verifyTurnstileToken(env, "tk_abc", null)).rejects.toThrow(ApiError);
  });

  it("includes remoteip when provided", async () => {
    let capturedBody: string | null = null;
    globalThis.fetch = vi.fn(async (_url, init) => {
      capturedBody = (init?.body as string) ?? null;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }) as unknown as typeof fetch;
    await verifyTurnstileToken(env, "tk", "1.2.3.4");
    expect(capturedBody).toContain("remoteip=1.2.3.4");
  });

  it("omits remoteip when not provided", async () => {
    let capturedBody: string | null = null;
    globalThis.fetch = vi.fn(async (_url, init) => {
      capturedBody = (init?.body as string) ?? null;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }) as unknown as typeof fetch;
    await verifyTurnstileToken(env, "tk", null);
    expect(capturedBody).not.toContain("remoteip");
  });
});
