/**
 * Unit tests for `lib/cache.ts` — D1 read-through cache.
 *
 * Mocks the D1Database prepare/bind/first/run API with a Map-based stub.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { cacheGet, cacheSet, cacheDelete, getOrSet } from "./cache.ts";
import type { D1Database, D1PreparedStatement, D1Result } from "@cloudflare/workers-types";

type Row = { value: string; expires_at: number };

function makeMockD1(): D1Database & { _rows: Map<string, Row> } {
  const rows = new Map<string, Row>();
  const db: any = {
    _rows: rows,
    prepare: vi.fn((sql: string) => {
      const stmt: Partial<D1PreparedStatement> = {
        bind: vi.fn((...args: unknown[]) => {
          stmt._args = args;
          return stmt;
        }),
        first: vi.fn(async () => {
          if (sql.includes("SELECT value, expires_at FROM cache WHERE key")) {
            const key = stmt._args?.[0] as string;
            return rows.get(key) ?? null;
          }
          return null;
        }),
        run: vi.fn(async (): Promise<D1Result> => {
          if (sql.includes("INSERT OR REPLACE INTO cache")) {
            const [k, v, exp] = stmt._args as [string, string, number];
            rows.set(k, { value: v, expires_at: exp });
          } else if (sql.includes("DELETE FROM cache WHERE key")) {
            const k = stmt._args?.[0] as string;
            rows.delete(k);
          }
          return { success: true, meta: {} } as D1Result;
        }),
      };
      return stmt as D1PreparedStatement;
    }),
  };
  return db as D1Database & { _rows: Map<string, Row> };
}

let db: ReturnType<typeof makeMockD1>;

beforeEach(() => {
  db = makeMockD1();
});

describe("cacheSet + cacheGet", () => {
  it("stores and retrieves a value", async () => {
    await cacheSet(db, "k1", { x: 1 }, 60);
    const r = await cacheGet<{ x: number }>(db, "k1");
    expect(r).toEqual({ x: 1 });
  });

  it("returns null for missing key", async () => {
    const r = await cacheGet(db, "nope");
    expect(r).toBeNull();
  });

  it("returns null for expired key", async () => {
    await cacheSet(db, "k1", "old", 1);
    vi.useFakeTimers();
    vi.advanceTimersByTime(2000);
    vi.useRealTimers();
    const r = await cacheGet(db, "k1");
    expect(r).toBeNull();
  });

  it("returns null for unparseable value", async () => {
    db._rows.set("k1", { value: "{invalid", expires_at: Date.now() / 1000 + 60 });
    const r = await cacheGet(db, "k1");
    expect(r).toBeNull();
  });
});

describe("cacheDelete", () => {
  it("removes a key", async () => {
    await cacheSet(db, "k1", "v", 60);
    await cacheDelete(db, "k1");
    const r = await cacheGet(db, "k1");
    expect(r).toBeNull();
  });
});

describe("getOrSet", () => {
  it("returns cached value on hit", async () => {
    await cacheSet(db, "k1", { cached: true }, 60);
    const loader = vi.fn(async () => ({ cached: false }));
    const r = await getOrSet(db, { prefix: "p" }, "k1", loader);
    expect(r).toEqual({ cached: true });
    expect(loader).not.toHaveBeenCalled();
  });

  it("calls loader and caches result on miss", async () => {
    const loader = vi.fn(async () => ({ fresh: true }));
    const r = await getOrSet(db, { prefix: "p" }, "k1", loader);
    expect(r).toEqual({ fresh: true });
    expect(loader).toHaveBeenCalledTimes(1);
    const cached = await cacheGet<{ fresh: boolean }>(db, "k1");
    expect(cached).toEqual({ fresh: true });
  });
});

/**
 * KNOWN ISSUE (D3 — open for Phase 1):
 *   The `cache` table referenced by `cacheGet`/`cacheSet`/`cacheDelete`
 *   is NOT in `migrations/0001_initial.sql`. Either:
 *     (a) add `cache` table to migration 0002 (preferred — keeps lib simple)
 *     (b) move cache.ts to KV-based implementation (no schema change)
 *   Decision pending Cloudflare D1 provisioning so we can test the
 *   read-through flow end-to-end.
 */
describe("KNOWN ISSUE D3 (cache table not in migration)", () => {
  it("documented in M1-S2-CODE-AUDIT.md", () => {
    expect(true).toBe(true); // placeholder
  });
});
