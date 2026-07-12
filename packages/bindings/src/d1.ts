/**
 * D1 facade. Returns the native Cloudflare `D1Database` on Workers, or a
 * Neon-Postgres-backed implementation on Node.
 *
 * The Neon implementation uses a tiny in-process table called `__cache__`
 * with columns (key TEXT PRIMARY KEY, value JSONB, expires_at BIGINT) to
 * emulate D1's `cache` table. This is created on first use via a session
 * pool.
 */

import type { BindingsEnv, D1Database } from "./types.ts";
import { getRuntime } from "./runtime.ts";

const cache = new Map<string, D1Database>();

export function getD1(env: BindingsEnv, bindingName: keyof BindingsEnv): D1Database {
  const runtime = getRuntime();

  if (runtime === "cloudflare") {
    const binding = env[bindingName] as D1Database | undefined;
    if (!binding) {
      throw new Error(
        `[bindings] D1 binding '${String(bindingName)}' is not defined in wrangler.toml`
      );
    }
    return binding;
  }

  const cached = cache.get(String(bindingName));
  if (cached) return cached;

  if (!env.NEON_DATABASE_URL) {
    throw new Error(
      `[bindings] NEON_DATABASE_URL must be set for Node runtime to emulate D1`
    );
  }

  const instance = createNeonD1(env);
  cache.set(String(bindingName), instance);
  return instance;
}

function createNeonD1(env: BindingsEnv): D1Database {
  const { neon } = require("@neondatabase/serverless") as typeof import("@neondatabase/serverless");
  const sql = neon(env.NEON_DATABASE_URL!);
  const tableName = `__cache_${Math.random().toString(36).slice(2, 10)}`;

  // Bootstrap: create the cache table for this binding
  sql(`CREATE TABLE IF NOT EXISTS ${tableName} (key TEXT PRIMARY KEY, value JSONB, expires_at BIGINT)`)
    .catch((e: Error) => {
      // Race condition: another instance created it. Ignore.
      if (!String(e).includes("already exists")) throw e;
    });

  return {
    prepare(query: string): D1PreparedStatement {
      // Translate D1's `?1, ?2, ?3` placeholders to Neon positional `$1, $2, $3`.
      // D1 allows non-numbered `?`; we normalise to numbered.
      const normalised = query.replace(/\?/g, () => `$${++_i}`);
      _i = 0;
      let params: any[] = [];

      const stmt: D1PreparedStatement = {
        bind(...values: any[]): D1PreparedStatement {
          params = values;
          return stmt;
        },
        async first<T = any>(): Promise<T | null> {
          const rows = await sql(normalised, params);
          return (rows[0] as T) ?? null;
        },
        async all<T = any>(): Promise<D1Result<T>> {
          const rows = await sql(normalised, params);
          return {
            results: rows as T[],
            success: true,
            meta: { duration: 0, changes: rows.length, last_row_id: null, served_by: "neon-bindings", size_after: 0, rows_read: rows.length, rows_written: 0 },
          };
        },
        async run(): Promise<D1Result> {
          const rows = await sql(normalised, params);
          return {
            results: [],
            success: true,
            meta: { duration: 0, changes: rows.length, last_row_id: null, served_by: "neon-bindings", size_after: 0, rows_read: 0, rows_written: rows.length },
          };
        },
        async raw<T = any>(): Promise<T[]> {
          return (await sql(normalised, params)) as T[];
        },
      };
      return stmt;
    },
    async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
      const results: D1Result[] = [];
      for (const s of statements) results.push(await s.run());
      return results;
    },
    async exec(query: string): Promise<D1Result> {
      await sql(query);
      return { results: [], success: true, meta: {} as any };
    },
    async dump(): Promise<ArrayBuffer> {
      throw new Error("[bindings] D1.dump() is not supported on Node runtime");
    },
  } as unknown as D1Database;
}

// Module-scoped counter for `?` → `$N` translation in `prepare`.
let _i = 0;
