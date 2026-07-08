/**
 * D1 wrapper. The renderer's read-through cache lives in D1. The wrapper
 * exposes a `getOrSet` helper that fetches from the cache and falls back
 * to the loader on miss, then writes the result back with a TTL.
 *
 * Used only by the API; the renderer uses its own KV-based cache.
 */

import type { D1Database } from "@cloudflare/workers-types";

export interface CacheOptions {
  /** TTL in seconds. Default 300. */
  ttlSeconds?: number;
  /** Prefix for the cache key. */
  prefix: string;
}

export async function cacheGet<T>(db: D1Database, key: string): Promise<T | null> {
  const row = await db.prepare("SELECT value, expires_at FROM cache WHERE key = ?1").bind(key).first<{ value: string; expires_at: number }>();
  if (!row) return null;
  if (row.expires_at < Math.floor(Date.now() / 1000)) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(db: D1Database, key: string, value: T, ttlSeconds = 300): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  await db
    .prepare("INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?1, ?2, ?3)")
    .bind(key, JSON.stringify(value), expiresAt)
    .run();
}

export async function cacheDelete(db: D1Database, key: string): Promise<void> {
  await db.prepare("DELETE FROM cache WHERE key = ?1").bind(key).run();
}

export async function getOrSet<T>(db: D1Database, opts: CacheOptions, key: string, loader: () => Promise<T>): Promise<T> {
  const cached = await cacheGet<T>(db, key);
  if (cached !== null) return cached;
  const fresh = await loader();
  await cacheSet(db, key, fresh, opts.ttlSeconds ?? 300);
  return fresh;
}
