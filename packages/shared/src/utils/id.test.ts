/**
 * Unit tests for `shared/utils/id.ts` — ULID generation & API key prefix.
 */
import { describe, it, expect } from "vitest";
import { ulid, makeApiKeyPrefix, isULID } from "./id.ts";

describe("ulid", () => {
  it("returns a 26-char string", () => {
    const id = ulid();
    expect(id.length).toBe(26);
  });

  it("matches Crockford base-32 alphabet (no I, L, O, U)", () => {
    for (let i = 0; i < 100; i++) {
      const id = ulid();
      expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    }
  });

  it("is monotonic (later call > earlier call)", () => {
    const ids = Array.from({ length: 10 }, () => ulid());
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i] > ids[i - 1]).toBe(true);
    }
  });
});

describe("makeApiKeyPrefix", () => {
  it("starts with mi_live_ for live env", () => {
    const p = makeApiKeyPrefix("live");
    expect(p.startsWith("mi_live_")).toBe(true);
  });

  it("starts with mi_test_ for test env", () => {
    const p = makeApiKeyPrefix("test");
    expect(p.startsWith("mi_test_")).toBe(true);
  });

  it("has length ≤ 24", () => {
    const p = makeApiKeyPrefix("live");
    expect(p.length).toBeLessThanOrEqual(24);
  });

  it("is unique across many calls", () => {
    const set = new Set(Array.from({ length: 100 }, () => makeApiKeyPrefix("live")));
    expect(set.size).toBe(100);
  });
});

describe("isULID", () => {
  it("accepts a valid ULID", () => {
    expect(isULID("01ARZ3NDEKTSV4RRFFQ69G5FAV")).toBe(true);
    expect(isULID(ulid())).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(isULID("01ARZ3NDEKTSV4RRFFQ69G5FA")).toBe(false); // 25 chars
    expect(isULID("01ARZ3NDEKTSV4RRFFQ69G5FAVV")).toBe(false); // 27 chars
  });

  it("rejects lowercase (Crockford is uppercase)", () => {
    expect(isULID("01arz3ndektsv4rrffq69g5fav")).toBe(false);
  });

  it("rejects forbidden characters (I, L, O, U)", () => {
    expect(isULID("01ARZ3NDEKTSV4RRFFQ69G5FAI")).toBe(false); // I
    expect(isULID("01ARZ3NDEKTSV4RRFFQ69G5FAL")).toBe(false); // L
    expect(isULID("01ARZ3NDEKTSV4RRFFQ69G5FAO")).toBe(false); // O
    expect(isULID("01ARZ3NDEKTSV4RRFFQ69G5FAU")).toBe(false); // U
  });
});
