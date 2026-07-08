/**
 * CMS routes — collections and entries.
 *
 *   GET    /v1/sites/:id/collections
 *   POST   /v1/sites/:id/collections
 *   GET    /v1/sites/:id/collections/:cid/entries       (paginated, filterable)
 *   POST   /v1/sites/:id/collections/:cid/entries
 *   GET    /v1/sites/:id/collections/:cid/entries/:eid
 *   PATCH  /v1/sites/:id/collections/:cid/entries/:eid
 *   DELETE /v1/sites/:id/collections/:cid/entries/:eid
 *
 * Entries are user-defined JSON. We use a `data` TEXT/JSONB column with a
 * GIN index (added in 0001). Pagination is cursor-based (ULID order).
 */

import { Hono, type Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getCookie } from "hono/cookie";
import { z } from "zod";
import { sql } from "drizzle-orm";

import type { Env } from "../types/env.d.ts";
import { ApiError } from "../lib/errors.ts";
import { log } from "../lib/logger.ts";
import { getDb } from "../lib/db.ts";
import { cacheDelete } from "../lib/cache.ts";
import { ulid, isULID } from "@my-identity/shared/utils/id";
import { createCollectionSchema, createEntrySchema, updateEntrySchema } from "@my-identity/shared/schemas";
import { PLANS, type PlanId } from "@my-identity/shared/constants/plans";

export const cmsRoutes = new Hono<Env>();

// --- Helpers -------------------------------------------------------------

async function getUserId(c: Context<Env>): Promise<string> {
  const cookieName = c.env.AUTH_SESSION_COOKIE_NAME;
  const sid = getCookie(c, cookieName);
  if (!sid) throw new ApiError("unauthorized", "Authentication required", 401);
  const raw = await c.env.SESSIONS.get(sid);
  if (!raw) throw new ApiError("unauthorized", "Session expired", 401);
  const session = JSON.parse(raw) as { userId: string; expiresAt: string };
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    throw new ApiError("unauthorized", "Session expired", 401);
  }
  return session.userId;
}

async function assertSiteOwned(db: ReturnType<typeof getDb>, siteId: string, userId: string) {
  const result = await db.execute(sql`SELECT id, user_id, slug FROM sites WHERE id = ${siteId} AND deleted_at IS NULL LIMIT 1`);
  const row = (result as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows[0];
  if (!row) throw new ApiError("not_found", "Site not found", 404);
  if (row.user_id !== userId) throw new ApiError("forbidden", "Not your site", 403);
  return row;
}

interface CollectionRow {
  id: string;
  site_id: string;
  name: string;
  label: string;
  description: string | null;
  fields: string;
  created_at: number;
  updated_at: number;
}

function toCollection(row: CollectionRow) {
  return {
    id: String(row.id),
    siteId: String(row.site_id),
    name: String(row.name),
    label: String(row.label),
    description: (row.description as string | null) ?? null,
    fields: safeJsonArray(row.fields),
    createdAt: new Date(Number(row.created_at)).toISOString(),
    updatedAt: new Date(Number(row.updated_at)).toISOString(),
  };
}

interface EntryRow {
  id: string;
  collection_id: string;
  site_id: string;
  slug: string;
  data: string;
  status: string;
  locale: string | null;
  published_at: number | null;
  created_at: number;
  updated_at: number;
}

function toEntry(row: EntryRow) {
  return {
    id: String(row.id),
    collectionId: String(row.collection_id),
    siteId: String(row.site_id),
    slug: String(row.slug),
    data: safeJson(row.data) as Record<string, unknown>,
    status: String(row.status) as "draft" | "published",
    locale: (row.locale as string | null) ?? null,
    publishedAt: row.published_at ? new Date(Number(row.published_at)).toISOString() : null,
    createdAt: new Date(Number(row.created_at)).toISOString(),
    updatedAt: new Date(Number(row.updated_at)).toISOString(),
  };
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function safeJsonArray(s: string): unknown[] {
  const v = safeJson(s);
  return Array.isArray(v) ? v : [];
}

async function assertCollection(db: ReturnType<typeof getDb>, siteId: string, collectionId: string) {
  const result = await db.execute(sql`SELECT * FROM cms_collections WHERE id = ${collectionId} AND site_id = ${siteId} AND deleted_at IS NULL LIMIT 1`);
  const row = (result as unknown as { rows: ReadonlyArray<CollectionRow> }).rows[0];
  if (!row) throw new ApiError("not_found", "Collection not found", 404);
  return row;
}

// --- Collections --------------------------------------------------------

cmsRoutes.get("/:id/collections", zValidator("param", z.object({ id: z.string() })), async (c) => {
  const userId = await getUserId(c);
  const { id: siteId } = c.req.valid("param");
  const db = getDb(c.env);
  await assertSiteOwned(db, siteId, userId);
  const result = await db.execute(sql`SELECT * FROM cms_collections WHERE site_id = ${siteId} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 200`);
  const rows = (result as unknown as { rows: ReadonlyArray<CollectionRow> }).rows;
  return c.json({ data: rows.map(toCollection) });
});

cmsRoutes.post(
  "/:id/collections",
  zValidator("param", z.object({ id: z.string() })),
  zValidator("json", createCollectionSchema),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId } = c.req.valid("param");
    const input = c.req.valid("json");
    const db = getDb(c.env);
    await assertSiteOwned(db, siteId, userId);

    // Quota
    const userResult = await db.execute(sql`SELECT plan FROM users WHERE id = ${userId} LIMIT 1`);
    const planId = ((userResult as unknown as { rows: ReadonlyArray<{ plan: string }> }).rows[0]?.plan ?? "free") as PlanId;
    const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]!;
    const countResult = await db.execute(sql`SELECT COUNT(*)::int AS n FROM cms_collections WHERE site_id = ${siteId} AND deleted_at IS NULL`);
    const count = Number((countResult as unknown as { rows: ReadonlyArray<{ n: number }> }).rows[0]?.n ?? 0);
    if (count >= plan.quotas.maxCollectionsPerSite) {
      throw new ApiError("quota_exceeded", `Your ${plan.label} plan allows up to ${plan.quotas.maxCollectionsPerSite} collections per site.`, 402);
    }

    // Name uniqueness per site
    const collision = await db.execute(
      sql`SELECT id FROM cms_collections WHERE site_id = ${siteId} AND name = ${input.name} AND deleted_at IS NULL LIMIT 1`
    );
    if ((collision as unknown as { rows: ReadonlyArray<unknown> }).rows.length > 0) {
      throw new ApiError("name_taken", `A collection named '${input.name}' already exists.`, 409);
    }

    const collectionId = ulid();
    const now = Date.now();
    await db.execute(
      sql`INSERT INTO cms_collections (id, site_id, name, label, description, fields, created_at, updated_at)
          VALUES (${collectionId}, ${siteId}, ${input.name}, ${input.label}, ${input.description ?? null}, ${JSON.stringify(input.fields)}, ${now}, ${now})`
    );
    log(c.env, "info", "collection_created", { userId, siteId, collectionId, name: input.name });

    const inserted = await db.execute(sql`SELECT * FROM cms_collections WHERE id = ${collectionId} LIMIT 1`);
    const row = (inserted as unknown as { rows: ReadonlyArray<CollectionRow> }).rows[0]!;
    return c.json({ data: toCollection(row) }, 201);
  }
);

// --- Entries: list & create -------------------------------------------

const listEntriesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["draft", "published"]).optional(),
  locale: z.string().optional(),
  sort: z.enum(["created_desc", "created_asc", "updated_desc", "updated_asc"]).default("created_desc"),
});

cmsRoutes.get(
  "/:id/collections/:cid/entries",
  zValidator("param", z.object({ id: z.string(), cid: z.string() })),
  zValidator("query", listEntriesQuerySchema),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId, cid } = c.req.valid("param");
    const q = c.req.valid("query");
    const db = getDb(c.env);
    await assertSiteOwned(db, siteId, userId);
    await assertCollection(db, siteId, cid);

    const sortMap: Record<typeof q.sort, string> = {
      created_desc: "created_at DESC",
      created_asc: "created_at ASC",
      updated_desc: "updated_at DESC",
      updated_asc: "updated_at ASC",
    };
    const orderBy = sortMap[q.sort];
    const cursorValid = q.cursor ? isULID(q.cursor) : false;
    const cursorClause = cursorValid ? sql`AND id < ${q.cursor}` : sql``;

    const result = await db.execute(
      sql.raw(
        `SELECT * FROM cms_entries WHERE collection_id = ${quote(cid)} AND site_id = ${quote(siteId)} AND deleted_at IS NULL
         ${q.status ? `AND status = ${quote(q.status)}` : ""}
         ${q.locale ? `AND locale = ${quote(q.locale)}` : ""}
         ${cursorValid ? `AND id < ${quote(q.cursor!)}` : ""}
         ORDER BY ${orderBy} LIMIT ${q.limit + 1}`
      )
    );
    const rows = (result as unknown as { rows: ReadonlyArray<EntryRow> }).rows;
    const sliced = rows.slice(0, q.limit);
    const last = sliced[sliced.length - 1];
    const hasMore = rows.length > q.limit;
    void cursorClause;

    return c.json({
      data: sliced.map(toEntry),
      nextCursor: hasMore && last ? last.id : null,
      prevCursor: q.cursor ?? null,
      total: null,
    });
  }
);

function quote(v: string): string {
  // SQL injection guard: ULID/cursor values, statuses, and locales are
  // all validated by Zod. The fallback throw is defence-in-depth.
  if (!/^[A-Za-z0-9_\-:.]+$/.test(v)) throw new ApiError("invalid_input", "Invalid query parameter", 400);
  return `'${v.replace(/'/g, "''")}'`;
}

cmsRoutes.post(
  "/:id/collections/:cid/entries",
  zValidator("param", z.object({ id: z.string(), cid: z.string() })),
  zValidator("json", createEntrySchema),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId, cid } = c.req.valid("param");
    const input = c.req.valid("json");
    const db = getDb(c.env);
    const site = await assertSiteOwned(db, siteId, userId);
    const coll = await assertCollection(db, siteId, cid);

    // Quota
    const userResult = await db.execute(sql`SELECT plan FROM users WHERE id = ${userId} LIMIT 1`);
    const planId = ((userResult as unknown as { rows: ReadonlyArray<{ plan: string }> }).rows[0]?.plan ?? "free") as PlanId;
    const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]!;
    const countResult = await db.execute(sql`SELECT COUNT(*)::int AS n FROM cms_entries WHERE collection_id = ${cid} AND deleted_at IS NULL`);
    const count = Number((countResult as unknown as { rows: ReadonlyArray<{ n: number }> }).rows[0]?.n ?? 0);
    if (count >= plan.quotas.maxEntriesPerCollection) {
      throw new ApiError("quota_exceeded", `Your ${plan.label} plan allows up to ${plan.quotas.maxEntriesPerCollection} entries per collection.`, 402);
    }

    const collision = await db.execute(
      sql`SELECT id FROM cms_entries WHERE collection_id = ${cid} AND slug = ${input.slug} AND locale IS NOT DISTINCT FROM ${input.locale ?? null} AND deleted_at IS NULL LIMIT 1`
    );
    if ((collision as unknown as { rows: ReadonlyArray<unknown> }).rows.length > 0) {
      throw new ApiError("slug_taken", `An entry with slug '${input.slug}' already exists.`, 409);
    }

    const entryId = ulid();
    const now = Date.now();
    await db.execute(
      sql`INSERT INTO cms_entries (id, collection_id, site_id, slug, data, status, locale, published_at, created_at, updated_at)
          VALUES (${entryId}, ${cid}, ${siteId}, ${input.slug}, ${JSON.stringify(input.data)}, "draft", ${input.locale ?? null}, ${input.publishedAt ? Date.parse(input.publishedAt) : null}, ${now}, ${now})`
    );
    await cacheDelete(c.env.DB_CACHE, `cms:${site.slug}:${coll.name}:*`);
    log(c.env, "info", "entry_created", { userId, siteId, collectionId: cid, entryId, slug: input.slug });

    const inserted = await db.execute(sql`SELECT * FROM cms_entries WHERE id = ${entryId} LIMIT 1`);
    const row = (inserted as unknown as { rows: ReadonlyArray<EntryRow> }).rows[0]!;
    return c.json({ data: toEntry(row) }, 201);
  }
);

// --- Single entry: get, update, delete --------------------------------

cmsRoutes.get(
  "/:id/collections/:cid/entries/:eid",
  zValidator("param", z.object({ id: z.string(), cid: z.string(), eid: z.string() })),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId, cid, eid } = c.req.valid("param");
    const db = getDb(c.env);
    await assertSiteOwned(db, siteId, userId);
    await assertCollection(db, siteId, cid);
    const result = await db.execute(sql`SELECT * FROM cms_entries WHERE id = ${eid} AND collection_id = ${cid} AND site_id = ${siteId} AND deleted_at IS NULL LIMIT 1`);
    const row = (result as unknown as { rows: ReadonlyArray<EntryRow> }).rows[0];
    if (!row) throw new ApiError("not_found", "Entry not found", 404);
    return c.json({ data: toEntry(row) });
  }
);

cmsRoutes.patch(
  "/:id/collections/:cid/entries/:eid",
  zValidator("param", z.object({ id: z.string(), cid: z.string(), eid: z.string() })),
  zValidator("json", updateEntrySchema),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId, cid, eid } = c.req.valid("param");
    const input = c.req.valid("json");
    const db = getDb(c.env);
    const site = await assertSiteOwned(db, siteId, userId);
    const coll = await assertCollection(db, siteId, cid);
    const existing = await db.execute(sql`SELECT * FROM cms_entries WHERE id = ${eid} AND collection_id = ${cid} AND site_id = ${siteId} AND deleted_at IS NULL LIMIT 1`);
    if ((existing as unknown as { rows: ReadonlyArray<unknown> }).rows.length === 0) {
      throw new ApiError("not_found", "Entry not found", 404);
    }

    const now = Date.now();
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    const push = (col: string, val: unknown) => { fields.push(`${col} = $${i++}`); values.push(val); };
    if (input.slug !== undefined) push("slug", input.slug);
    if (input.data !== undefined) push("data", JSON.stringify(input.data));
    if (input.locale !== undefined) push("locale", input.locale);
    if (input.publishedAt !== undefined) push("published_at", input.publishedAt ? Date.parse(input.publishedAt) : null);
    if (fields.length === 0) {
      const r = (existing as unknown as { rows: ReadonlyArray<EntryRow> }).rows[0]!;
      return c.json({ data: toEntry(r) });
    }
    push("updated_at", now);
    values.push(eid);
    await db.execute(sql.raw(`UPDATE cms_entries SET ${fields.join(", ")} WHERE id = $${i} AND deleted_at IS NULL`, ...(values as never[])));

    await cacheDelete(c.env.DB_CACHE, `cms:${site.slug}:${coll.name}:*`);
    const refreshed = await db.execute(sql`SELECT * FROM cms_entries WHERE id = ${eid} LIMIT 1`);
    const row = (refreshed as unknown as { rows: ReadonlyArray<EntryRow> }).rows[0]!;
    log(c.env, "info", "entry_updated", { userId, siteId, collectionId: cid, entryId: eid });
    return c.json({ data: toEntry(row) });
  }
);

cmsRoutes.delete(
  "/:id/collections/:cid/entries/:eid",
  zValidator("param", z.object({ id: z.string(), cid: z.string(), eid: z.string() })),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId, cid, eid } = c.req.valid("param");
    const db = getDb(c.env);
    const site = await assertSiteOwned(db, siteId, userId);
    const coll = await assertCollection(db, siteId, cid);
    const now = Date.now();
    const result = await db.execute(
      sql`UPDATE cms_entries SET deleted_at = ${now}, updated_at = ${now} WHERE id = ${eid} AND collection_id = ${cid} AND site_id = ${siteId} AND deleted_at IS NULL RETURNING id`
    );
    if ((result as unknown as { rows: ReadonlyArray<unknown> }).rows.length === 0) {
      throw new ApiError("not_found", "Entry not found", 404);
    }
    await cacheDelete(c.env.DB_CACHE, `cms:${site.slug}:${coll.name}:*`);
    log(c.env, "info", "entry_deleted", { userId, siteId, collectionId: cid, entryId: eid });
    return c.json({ data: { ok: true } });
  }
);
