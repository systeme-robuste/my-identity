/**
 * Schema for the D1 read-through cache table.
 *
 * Aligned with `migrations/0002_cache_table.sql`.
 *
 * The cache stores JSON-encoded values with an absolute `expires_at` epoch
 * (in seconds, not ms, to match the SQL convention used by the wrapper in
 * `apps/api/src/lib/cache.ts`). Eviction is lazy: `cacheGet` returns null
 * for expired rows; a future sweeper can `DELETE FROM cache WHERE
 * expires_at < now()`.
 */
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const cache = sqliteTable(
  "cache",
  {
    /** Fully-qualified cache key (e.g. "page:abc123"). */
    key: text("key").primaryKey(),
    /** JSON-encoded payload. */
    value: text("value").notNull(),
    /** Unix epoch SECONDS at which the entry becomes stale. */
    expiresAt: integer("expires_at").notNull(),
    /** Unix epoch MILLISECONDS at which the row was created (audit only). */
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({
    expiresAtIdx: index("cache_expires_at_idx").on(t.expiresAt),
  }),
);

export type CacheRow = typeof cache.$inferSelect;
export type NewCacheRow = typeof cache.$inferInsert;
