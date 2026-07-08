/**
 * Rendered-page cache.
 *
 * Two-tier cache:
 *  - `RENDER_CACHE` (KV) — the rendered HTML. We put the entire HTML
 *    blob in a single key. KV is read-at-edge, single-digit-ms.
 *  - `CACHE_DB` (D1) — a tiny `render_cache_index` table that tracks
 *    `last_rendered_at` so we can implement stale-while-revalidate.
 *    We also store the rendered HTML's size here for monitoring.
 *
 * Read path:
 *   1. Read index row by key.
 *   2. If `fresh_until > now`, return the cached HTML from KV.
 *   3. If `stale_until > now`, return the cached HTML but mark as stale
 *      so the caller fires a background revalidation.
 *
 * Write path:
 *   1. Put HTML in KV with an `expirationTtl` = stale_seconds.
 *   2. UPSERT the index row with `fresh_until` = now + ttl,
 *      `stale_until` = now + stale_seconds, and `size_bytes`.
 *
 * Invalidation: pages invalidate their key from the API (D1 cache
 * table). Since the renderer's KV namespace is separate from the API's,
 * we rely on TTL expiry for the per-page content; the API signals a
 * cache miss by deleting its own D1 key, and the next request from the
 * renderer hits the API again — and then we re-cache here.
 */

export interface CachedPage {
  html: string;
  /** `false` if the entry is still within the fresh window. */
  stale: boolean;
}

const KV_KEY_PREFIX = "render:";
const DDL = `
  CREATE TABLE IF NOT EXISTS render_cache_index (
    key TEXT PRIMARY KEY,
    fresh_until INTEGER NOT NULL,
    stale_until INTEGER NOT NULL,
    size_bytes INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_render_cache_stale ON render_cache_index(stale_until);
`;

let ddlApplied = false;
async function ensureDdl(db: D1Database): Promise<void> {
  if (ddlApplied) return;
  try {
    const statements = DDL.split(";").map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await db.prepare(stmt).run();
    }
    ddlApplied = true;
  } catch {
    // DDL might already exist; ignore.
    ddlApplied = true;
  }
}

export async function getCachedPage(kv: KVNamespace, db: D1Database, key: string): Promise<CachedPage | null> {
  await ensureDdl(db);
  const row = await db
    .prepare("SELECT fresh_until, stale_until FROM render_cache_index WHERE key = ?1")
    .bind(key)
    .first<{ fresh_until: number; stale_until: number }>();
  if (!row) return null;
  const now = Math.floor(Date.now() / 1000);
  if (row.stale_until < now) return null;
  const html = await kv.get(KV_KEY_PREFIX + key);
  if (!html) return null;
  return { html, stale: row.fresh_until < now };
}

export async function setCachedPage(
  kv: KVNamespace,
  db: D1Database,
  key: string,
  html: string,
  ttlSeconds: number,
  staleSeconds: number
): Promise<void> {
  await ensureDdl(db);
  const now = Math.floor(Date.now() / 1000);
  await kv.put(KV_KEY_PREFIX + key, html, { expirationTtl: staleSeconds });
  await db
    .prepare(
      "INSERT OR REPLACE INTO render_cache_index (key, fresh_until, stale_until, size_bytes, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)"
    )
    .bind(key, now + ttlSeconds, now + staleSeconds, html.length, now)
    .run();
}
