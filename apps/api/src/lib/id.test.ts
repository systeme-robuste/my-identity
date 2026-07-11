/**
 * Unit tests for `lib/id.ts` — session ID, webhook secret, ULID re-exports.
 */
import { describe, it, expect } from "vitest";
import { newSessionId, newWebhookSecret, ulid, makeApiKeyPrefix } from "./id.ts";

describe("newSessionId", () => {
  it("returns a non-empty string", () => {
    const id = newSessionId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(20);
  });

  it("uses URL-safe base64 alphabet", () => {
    const id = newSessionId();
    expect(id).not.toMatch(/[+/=]/);
  });

  it("produces unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => newSessionId()));
    expect(ids.size).toBe(100);
  });
});

describe("newWebhookSecret", () => {
  it("starts with whsec_", () => {
    const s = newWebhookSecret();
    expect(s.startsWith("whsec_")).toBe(true);
  });

  it("is unique", () => {
    const ids = new Set(Array.from({ length: 100 }, () => newWebhookSecret()));
    expect(ids.size).toBe(100);
  });
});

describe("ulid (re-export)", () => {
  it("returns a 26-char string", () => {
    const id = ulid();
    expect(id.length).toBe(26);
  });

  it("produces monotonic IDs", () => {
    const a = ulid();
    const b = ulid();
    expect(b > a).toBe(true);
  });
});

describe("makeApiKeyPrefix", () => {
  it("returns a short prefix with the env", () => {
    const live = makeApiKeyPrefix("live");
    const test = makeApiKeyPrefix("test");
    expect(live.startsWith("mi_live_")).toBe(true);
    expect(test.startsWith("mi_test_")).toBe(true);
    expect(live.length).toBeGreaterThan(0);
    expect(live.length).toBeLessThanOrEqual(24);
  });

  it("is unique", () => {
    const ids = new Set(Array.from({ length: 100 }, () => makeApiKeyPrefix("live")));
    expect(ids.size).toBe(100);
  });
});
