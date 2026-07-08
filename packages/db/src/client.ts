/**
 * Drizzle client factory for Neon Postgres.
 *
 * Two flavours:
 *   - `createNeonHttp(url)` — uses Neon's serverless HTTP driver (slower, but
 *     works in any environment, including Cloudflare Workers).
 *   - `createNeonWebSocket(url)` — uses Neon's serverless WebSocket driver
 *     (faster, persistent connections, but requires `nodejs_compat`).
 *
 * Always use `createNeonHttp` inside Cloudflare Workers unless you have
 * a specific reason to use WebSockets.
 */

import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { Pool, neonConfig as wsNeonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleWs, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema> | NeonDatabase<typeof schema>;

export function createNeonHttp(url: string): { db: Db; sql: NeonQueryFunction<false, false> } {
  neonConfig.fetchConnectionCache = true;
  const sql = neon(url);
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export function createNeonWebSocket(url: string): { db: Db; pool: Pool } {
  wsNeonConfig.useSecureWebSocket = true;
  wsNeonConfig.wsProxy = (host) => `${host}?neon=use_v3&sslmode=require`;
  const pool = new Pool({ connectionString: url });
  const db = drizzleWs(pool, { schema });
  return { db, pool };
}
