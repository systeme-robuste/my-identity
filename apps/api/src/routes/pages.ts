/**
 * Page routes — CRUD for a site's pages.
 *
 *   GET    /v1/sites/:id/pages
 *   POST   /v1/sites/:id/pages
 *   GET    /v1/sites/:id/pages/:pid
 *   PATCH  /v1/sites/:id/pages/:pid     (auto-save; supports status → published)
 *   DELETE /v1/sites/:id/pages/:pid
 *   POST   /v1/sites/:id/pages/reorder
 *
 * Publishing a page invalidates the D1 cache key for that site's page
 * so the renderer fetches the freshest content on the next request.
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
import { ulid } from "@my-identity/shared/utils/id";
import { createPageSchema, updatePageSchema, reorderPagesSchema } from "@my-identity/shared/schemas";
import { PLANS, type PlanId } from "@my-identity/shared/constants/plans";

export const pageRoutes = new Hono<Env>();

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
  const result = await db.execute(sql`SELECT id, user_id, slug, state FROM sites WHERE id = ${siteId} AND deleted_at IS NULL LIMIT 1`);
  const row = (result as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows[0];
  if (!row) throw new ApiError("not_found", "Site not found", 404);
  if (row.user_id !== userId) throw new ApiError("forbidden", "Not your site", 403);
  return row;
}

interface PageRow {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  description: string | null;
  blocks: unknown;
  locale: string | null;
  status: string;
  seo: string;
  created_at: number;
  updated_at: number;
  published_at: number | null;
}

function toPage(row: PageRow) {
  return {
    id: String(row.id),
    siteId: String(row.site_id),
    slug: String(row.slug),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    blocks: typeof row.blocks === "string" ? JSON.parse(row.blocks) : row.blocks ?? [],
    locale: (row.locale as string | null) ?? null,
    status: String(row.status) as "draft" | "published" | "archived",
    seo: typeof row.seo === "string" ? safeJson(row.seo) : row.seo ?? {},
    createdAt: new Date(Number(row.created_at)).toISOString(),
    updatedAt: new Date(Number(row.updated_at)).toISOString(),
    publishedAt: row.published_at ? new Date(Number(row.published_at)).toISOString() : null,
  };
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

async function invalidateCache(env: Env, siteSlug: string, pageSlug: string, locale: string | null) {
  const key = `page:${siteSlug}:${locale ?? "default"}:${pageSlug}`;
  try {
    await cacheDelete(env.DB_CACHE, key);
  } catch (err) {
    log(env, "warn", "cache_invalidate_failed", { key, error: err instanceof Error ? err.message : String(err) });
  }
}

// --- GET /v1/sites/:id/pages -------------------------------------------

pageRoutes.get("/:id/pages", zValidator("param", z.object({ id: z.string() })), async (c) => {
  const userId = await getUserId(c);
  const { id } = c.req.valid("param");
  const db = getDb(c.env);
  await assertSiteOwned(db, id, userId);
  const result = await db.execute(sql`SELECT * FROM pages WHERE site_id = ${id} AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 500`);
  const rows = (result as unknown as { rows: ReadonlyArray<PageRow> }).rows;
  return c.json({ data: rows.map(toPage) });
});

// --- POST /v1/sites/:id/pages ------------------------------------------

pageRoutes.post("/:id/pages", zValidator("param", z.object({ id: z.string() })), zValidator("json", createPageSchema), async (c) => {
  const userId = await getUserId(c);
  const { id: siteId } = c.req.valid("param");
  const input = c.req.valid("json");
  const db = getDb(c.env);
  const site = await assertSiteOwned(db, siteId, userId);

  // Quota
  const userResult = await db.execute(sql`SELECT plan FROM users WHERE id = ${userId} LIMIT 1`);
  const planId = ((userResult as unknown as { rows: ReadonlyArray<{ plan: string }> }).rows[0]?.plan ?? "free") as PlanId;
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]!;
  const countResult = await db.execute(sql`SELECT COUNT(*)::int AS n FROM pages WHERE site_id = ${siteId} AND deleted_at IS NULL`);
  const count = Number((countResult as unknown as { rows: ReadonlyArray<{ n: number }> }).rows[0]?.n ?? 0);
  if (count >= plan.quotas.maxPagesPerSite) {
    throw new ApiError("quota_exceeded", `Your ${plan.label} plan allows up to ${plan.quotas.maxPagesPerSite} pages per site.`, 402);
  }

  // Slug collision
  const collision = await db.execute(
    sql`SELECT id FROM pages WHERE site_id = ${siteId} AND slug = ${input.slug} AND locale IS NOT DISTINCT FROM ${input.locale ?? null} AND deleted_at IS NULL LIMIT 1`
  );
  if ((collision as unknown as { rows: ReadonlyArray<unknown> }).rows.length > 0) {
    throw new ApiError("slug_taken", `A page with slug '${input.slug}' already exists on this site.`, 409);
  }

  const pageId = ulid();
  const now = Date.now();
  await db.execute(
    sql`INSERT INTO pages (id, site_id, slug, title, description, blocks, locale, status, seo, created_at, updated_at, published_at)
        VALUES (${pageId}, ${siteId}, ${input.slug}, ${input.title}, ${input.description ?? null}, ${JSON.stringify(input.blocks ?? [])}, ${input.locale ?? null}, "draft", ${JSON.stringify({})}, ${now}, ${now}, NULL)`
  );

  log(c.env, "info", "page_created", { userId, siteId, pageId, slug: input.slug });
  const inserted = await db.execute(sql`SELECT * FROM pages WHERE id = ${pageId} LIMIT 1`);
  const row = (inserted as unknown as { rows: ReadonlyArray<PageRow> }).rows[0]!;
  void site; // referenced for ownership
  return c.json({ data: toPage(row) }, 201);
});

// --- GET /v1/sites/:id/pages/:pid --------------------------------------

pageRoutes.get("/:id/pages/:pid", zValidator("param", z.object({ id: z.string(), pid: z.string() })), async (c) => {
  const userId = await getUserId(c);
  const { id: siteId, pid } = c.req.valid("param");
  const db = getDb(c.env);
  await assertSiteOwned(db, siteId, userId);
  const result = await db.execute(sql`SELECT * FROM pages WHERE id = ${pid} AND site_id = ${siteId} AND deleted_at IS NULL LIMIT 1`);
  const row = (result as unknown as { rows: ReadonlyArray<PageRow> }).rows[0];
  if (!row) throw new ApiError("not_found", "Page not found", 404);
  return c.json({ data: toPage(row) });
});

// --- PATCH /v1/sites/:id/pages/:pid -----------------------------------

pageRoutes.patch("/:id/pages/:pid", zValidator("param", z.object({ id: z.string(), pid: z.string() })), zValidator("json", updatePageSchema), async (c) => {
  const userId = await getUserId(c);
  const { id: siteId, pid } = c.req.valid("param");
  const input = c.req.valid("json");
  const db = getDb(c.env);
  const site = await assertSiteOwned(db, siteId, userId);
  const existing = await db.execute(sql`SELECT * FROM pages WHERE id = ${pid} AND site_id = ${siteId} AND deleted_at IS NULL LIMIT 1`);
  const existingRow = (existing as unknown as { rows: ReadonlyArray<PageRow> }).rows[0];
  if (!existingRow) throw new ApiError("not_found", "Page not found", 404);

  const now = Date.now();
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  const push = (col: string, val: unknown) => { fields.push(`${col} = $${i++}`); values.push(val); };
  if (input.slug !== undefined) push("slug", input.slug);
  if (input.title !== undefined) push("title", input.title);
  if (input.description !== undefined) push("description", input.description);
  if (input.blocks !== undefined) push("blocks", JSON.stringify(input.blocks));
  if (input.locale !== undefined) push("locale", input.locale);
  if (input.seo !== undefined) push("seo", JSON.stringify(input.seo));
  if (input.status !== undefined) {
    push("status", input.status);
    if (input.status === "published" && !existingRow.published_at) {
      push("published_at", now);
    }
  }
  if (fields.length === 0) {
    return c.json({ data: toPage(existingRow) });
  }
  push("updated_at", now);
  values.push(pid);

  await db.execute(
    sql.raw(`UPDATE pages SET ${fields.join(", ")} WHERE id = $${i} AND deleted_at IS NULL`, ...(values as never[]))
  );

  // Invalidate cache if published or content changed
  if (input.status === "published" || input.blocks !== undefined || input.slug !== undefined) {
    await invalidateCache(c.env, String(site.slug ?? ""), String(input.slug ?? existingRow.slug), (input.locale ?? existingRow.locale) as string | null);
  }

  const refreshed = await db.execute(sql`SELECT * FROM pages WHERE id = ${pid} LIMIT 1`);
  const row = (refreshed as unknown as { rows: ReadonlyArray<PageRow> }).rows[0]!;
  log(c.env, "info", "page_updated", { userId, siteId, pageId: pid });
  return c.json({ data: toPage(row) });
});

// --- DELETE /v1/sites/:id/pages/:pid ----------------------------------

pageRoutes.delete("/:id/pages/:pid", zValidator("param", z.object({ id: z.string(), pid: z.string() })), async (c) => {
  const userId = await getUserId(c);
  const { id: siteId, pid } = c.req.valid("param");
  const db = getDb(c.env);
  const site = await assertSiteOwned(db, siteId, userId);
  const now = Date.now();
  const result = await db.execute(
    sql`UPDATE pages SET deleted_at = ${now}, updated_at = ${now}, status = 'archived' WHERE id = ${pid} AND site_id = ${siteId} AND deleted_at IS NULL RETURNING slug`
  );
  const rows = (result as unknown as { rows: ReadonlyArray<{ slug: string }> }).rows;
  if (rows.length === 0) throw new ApiError("not_found", "Page not found", 404);
  if (rows[0]) await invalidateCache(c.env, String(site.slug ?? ""), String(rows[0].slug), null);
  log(c.env, "info", "page_deleted", { userId, siteId, pageId: pid });
  return c.json({ data: { ok: true } });
});

// --- POST /v1/sites/:id/pages/reorder ---------------------------------

pageRoutes.post("/:id/pages/reorder", zValidator("param", z.object({ id: z.string() })), zValidator("json", reorderPagesSchema), async (c) => {
  const userId = await getUserId(c);
  const { id: siteId } = c.req.valid("param");
  const input = c.req.valid("json");
  const db = getDb(c.env);
  await assertSiteOwned(db, siteId, userId);
  for (let idx = 0; idx < input.order.length; idx++) {
    const item = input.order[idx];
    if (!item) continue;
    await db.execute(sql`UPDATE pages SET sort_order = ${idx}, updated_at = ${Date.now()} WHERE id = ${item.id} AND site_id = ${siteId} AND deleted_at IS NULL`);
  }
  return c.json({ data: { ok: true } });
});
