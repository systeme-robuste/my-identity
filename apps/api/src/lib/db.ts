/**
 * Drizzle DB client for Neon Postgres (serverless driver).
 *
 * Each request that needs the DB calls `getDb(env)` to get a connection
 * backed by a fetch-based driver. The driver is connection-pooled by
 * Neon, so we don't manage a pool ourselves.
 *
 * TODO(Phase 1): wire Drizzle Kit to manage migrations.
 */

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { Env } from "../types/env.d.ts";
import * as schema from "@my-identity/db/schema";

neonConfig.fetchConnectionCache = true;

export function getDb(env: Env) {
  const sql = neon(env.DATABASE_URL);
  return drizzle(sql, { schema, logger: env.ENVIRONMENT === "development" });
}

export type Db = ReturnType<typeof getDb>;
