-- 0002_cache_table.sql
-- Add the read-through D1 cache table used by `apps/api/src/lib/cache.ts`.
--
-- The schema:
--   key       TEXT PRIMARY KEY   -- fully-qualified cache key (e.g. "page:abc123")
--   value     TEXT NOT NULL      -- JSON-encoded payload
--   expires_at INTEGER NOT NULL  -- Unix epoch seconds; expired rows are ignored and lazily reaped
--   created_at INTEGER NOT NULL  -- Unix epoch ms (audit; not used for eviction)
--
-- Eviction is lazy: cacheGet() returns null for expired rows, and a future
-- Phase 2 sweeper can `DELETE FROM cache WHERE expires_at < now()`.
-- We deliberately do NOT use a UNIQUE index on `expires_at` because the
-- D1 read volume is orders of magnitude higher than the write volume.

CREATE TABLE IF NOT EXISTS cache (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Index on `expires_at` to make the lazy sweeper cheap once we add it.
CREATE INDEX IF NOT EXISTS cache_expires_at_idx ON cache (expires_at);
