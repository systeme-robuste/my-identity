/**
 * Drizzle DB client for Neon Postgres (serverless driver).
 *
 * The driver is connection-pooled by Neon, so we cache the drizzle instance
 * per `DATABASE_URL` to avoid re-creating it on every request.
 *
 * In production, the URL never changes per request, so this is effectively
 * a singleton. In dev, if you change the URL, you'll need to restart the
 * worker.
 *
 * TODO(Phase 1): wire Drizzle Kit to manage migrations.
 */

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { Env } from "../types/env.d.ts";
import * as schema from "@my-identity/db/schema";

neonConfig.fetchConnectionCache = true;

const cache = new Map<string, NeonHttpDatabase<typeof schema>>();

export function getDb(env: Pick<Env, "DATABASE_URL" | "ENVIRONMENT">): NeonHttpDatabase<typeof schema> {
  const existing = cache.get(env.DATABASE_URL);
  if (existing) return existing;
  const sql = neon(env.DATABASE_URL);
  const db = drizzle(sql, { schema, logger: env.ENVIRONMENT === "development" });
  cache.set(env.DATABASE_URL, db);
  return db;
}

export type Db = ReturnType<typeof getDb>;
