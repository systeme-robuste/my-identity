/**
 * Unit tests for `lib/cache.ts` — D1 read-through cache (cacheGet, cacheSet,
 * cacheDelete, getOrSet) with TTL handling. Uses an in-memory D1 fake.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { cacheGet, cacheSet, cacheDelete, getOrSet } from "./cache.ts";
import type { D1Database, D1Result } from "@cloudflare/workers-types";

type Row = { value: string; expires_at: number };

class FakeD1 {
  private store = new Map<string, Row>();

  prepare(_sql: string) {
    const self = this;
    return {
      bind(..._args: unknown[]) {
        return {
          async first<T>(): Promise<T | null> {
            const key = arguments[0] as string;
            const row = self.store.get(key);
            return (row as unknown as T) ?? null;
          },
          async run(): Promise<D1Result> {
            // The SQL used by cache.ts is always INSERT OR REPLACE / DELETE,
            // we route on the prepared sql by inspecting `self.lastSql`.
            const sql = (self as unknown as { lastSql: string }).lastSql ?? "";
            const key = arguments[0] as string;
            if (sql.startsWith("INSERT OR REPLACE")) {
              const value = arguments[1] as string;
              const expiresAt = arguments[2] as number;
              self.store.set(key, { value, expires_at: expiresAt });
            } else if (sql.startsWith("DELETE")) {
              self.store.delete(key);
            }
            return { success: true, meta: {} } as unknown as D1Result;
          },
        };
      },
    };
  }

  // helpers for tests
  setRaw(key: string, row: Row) {
    this.store.set(key, row);
  }
  has(key: string) {
    return this.store.has(key);
  }
  raw(key: string) {
    return this.store.get(key);
  }
  size() {
    return this.store.size;
  }
}

function makeDb() {
  const db = new FakeD1();
  // Tag the fake with the last SQL statement it saw so `bind(...).run()` can
  // branch on the operation. cache.ts re-uses the same prepared instance
  // pattern but we instrument by overriding the sql argument.
  return new Proxy(db, {
    get(target, prop) {
      if (prop === "prepare") {
        return (sql: string) => {
          (target as unknown as { lastSql: string }).lastSql = sql;
          return (target as unknown as { prepare: (s: string) => unknown }).prepare(sql);
        };
      }
      return (target as unknown as Record<string | symbol, unknown>)[prop];
    },
  }) as unknown as D1Database & FakeD1;
}

describe("cacheGet", () => {
  let db: ReturnType<typeof makeDb>;
  beforeEach(() => {
    db = makeDb();
  });

  it("returns null when key is missing", async () => {
    expect(await cacheGet(db, "missing")).toBeNull();
  });

  it("returns null when entry is expired", async () => {
    const past = Math.floor(Date.now() / 1000) - 10;
    db.setRaw("k", { value: JSON.stringify({ x: 1 }), expires_at: past });
    expect(await cacheGet(db, "k")).toBeNull();
  });

  it("returns parsed value when entry is fresh", async () => {
    const future = Math.floor(Date.now() / 1000) + 60;
    db.setRaw("k", { value: JSON.stringify({ x: 42 }), expires_at: future });
    expect(await cacheGet<{ x: number }>(db, "k")).toEqual({ x: 42 });
  });

  it("returns null when stored JSON is malformed", async () => {
    const future = Math.floor(Date.now() / 1000) + 60;
    db.setRaw("k", { value: "not-json{", expires_at: future });
    expect(await cacheGet(db, "k")).toBeNull();
  });
});

describe("cacheSet", () => {
  it("writes JSON-stringified value with TTL", async () => {
    const db = makeDb();
    await cacheSet(db, "k", { a: "b" }, 30);
    const row = db.raw("k");
    expect(row).toBeDefined();
    expect(JSON.parse(row!.value)).toEqual({ a: "b" });
    const now = Math.floor(Date.now() / 1000);
    expect(row!.expires_at).toBeGreaterThanOrEqual(now + 29);
    expect(row!.expires_at).toBeLessThanOrEqual(now + 31);
  });

  it("defaults TTL to 300s", async () => {
    const db = makeDb();
    await cacheSet(db, "k", 1);
    const now = Math.floor(Date.now() / 1000);
    const row = db.raw("k")!;
    expect(row.expires_at).toBeGreaterThanOrEqual(now + 299);
    expect(row.expires_at).toBeLessThanOrEqual(now + 301);
  });

  it("overwrites an existing key (INSERT OR REPLACE)", async () => {
    const db = makeDb();
    await cacheSet(db, "k", "v1", 60);
    await cacheSet(db, "k", "v2", 60);
    expect(db.size()).toBe(1);
    expect(JSON.parse(db.raw("k")!.value)).toBe("v2");
  });
});

describe("cacheDelete", () => {
  it("removes the key", async () => {
    const db = makeDb();
    await cacheSet(db, "k", "v", 60);
    expect(db.size()).toBe(1);
    await cacheDelete(db, "k");
    expect(db.size()).toBe(0);
  });

  it("is a no-op when the key is missing", async () => {
    const db = makeDb();
    await expect(cacheDelete(db, "absent")).resolves.toBeUndefined();
    expect(db.size()).toBe(0);
  });
});

describe("getOrSet", () => {
  it("returns cached value without calling the loader", async () => {
    const db = makeDb();
    const future = Math.floor(Date.now() / 1000) + 60;
    db.setRaw("k", { value: JSON.stringify({ hit: true }), expires_at: future });
    let called = 0;
    const v = await getOrSet(db, { prefix: "p" }, "k", async () => {
      called++;
      return { hit: false };
    });
    expect(v).toEqual({ hit: true });
    expect(called).toBe(0);
  });

  it("calls the loader, stores the result, and returns it on miss", async () => {
    const db = makeDb();
    let called = 0;
    const v = await getOrSet(db, { prefix: "p", ttlSeconds: 90 }, "k", async () => {
      called++;
      return { fresh: 1 };
    });
    expect(v).toEqual({ fresh: 1 });
    expect(called).toBe(1);
    // Subsequent call should hit the cache.
    const v2 = await getOrSet(db, { prefix: "p" }, "k", async () => {
      called++;
      return { fresh: 2 };
    });
    expect(v2).toEqual({ fresh: 1 });
    expect(called).toBe(1);
  });

  it("uses default TTL of 300s when not specified", async () => {
    const db = makeDb();
    await getOrSet(db, { prefix: "p" }, "k", async () => "v");
    const now = Math.floor(Date.now() / 1000);
    const row = db.raw("k")!;
    expect(row.expires_at).toBeGreaterThanOrEqual(now + 299);
    expect(row.expires_at).toBeLessThanOrEqual(now + 301);
  });
});
