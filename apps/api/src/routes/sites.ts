/**
 * Site routes — the container for a user's site.
 *
 *   GET    /v1/sites                  — list current user's sites
 *   POST   /v1/sites                  — create a new site
 *   GET    /v1/sites/:id              — fetch a site
 *   PATCH  /v1/sites/:id              — update a site
 *   DELETE /v1/sites/:id              — soft-delete (sets `deleted_at`)
 *   GET    /v1/sites/:id/usage        — current usage vs plan quota
 *
 * On create, we provision three default pages: `index`, `404`, `privacy`,
 * `terms`. Index and 404 are required to ship a usable site; privacy/terms
 * are recommended for any site serving EU traffic (RGPD).
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
import { ulid } from "@my-identity/shared/utils/id";
import { createSiteSchema, updateSiteSchema } from "@my-identity/shared/schemas";
import { PLANS, type PlanId } from "@my-identity/shared/constants/plans";

export const siteRoutes = new Hono<Env>();

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

async function findSite(db: ReturnType<typeof getDb>, siteId: string, userId: string) {
  const result = await db.execute(sql`SELECT * FROM sites WHERE id = ${siteId} AND user_id = ${userId} AND deleted_at IS NULL LIMIT 1`);
  const rows = (result as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows;
  if (!rows[0]) throw new ApiError("not_found", "Site not found", 404);
  return rows[0];
}

interface SiteRow {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  description: string | null;
  state: string;
  custom_domain: string | null;
  locale: string;
  created_at: number;
  updated_at: number;
  published_at: number | null;
  archived_at: number | null;
}

function toSite(row: SiteRow) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    status: String(row.state ?? "draft") as "draft" | "published" | "archived",
    customDomain: (row.custom_domain as string | null) ?? null,
    locale: String(row.locale ?? "fr"),
    createdAt: new Date(Number(row.created_at)).toISOString(),
    updatedAt: new Date(Number(row.updated_at)).toISOString(),
    publishedAt: row.published_at ? new Date(Number(row.published_at)).toISOString() : null,
  };
}

async function provisionDefaultPages(db: ReturnType<typeof getDb>, siteId: string) {
  const now = Date.now();
  const defaults: ReadonlyArray<{ slug: string; title: string; description: string | null; status: "draft" | "published"; blocks: unknown[] }> = [
    {
      slug: "index",
      title: "Home",
      description: null,
      status: "published",
      blocks: [
        { id: ulid(), type: "hero", heading: "Welcome", subheading: "Built on My Identity.", ctaLabel: "Get started", ctaHref: "#", align: "center" },
      ],
    },
    {
      slug: "404",
      title: "Page not found",
      description: null,
      status: "published",
      blocks: [
        { id: ulid(), type: "text", markdown: "# 404\n\nThis page does not exist.", align: "left" },
      ],
    },
    {
      slug: "privacy",
      title: "Privacy policy",
      description: null,
      status: "draft",
      blocks: [
        { id: ulid(), type: "text", markdown: "# Privacy policy\n\nReplace with your own.", align: "left" },
      ],
    },
    {
      slug: "terms",
      title: "Terms of service",
      description: null,
      status: "draft",
      blocks: [
        { id: ulid(), type: "text", markdown: "# Terms of service\n\nReplace with your own.", align: "left" },
      ],
    },
  ];
  for (const p of defaults) {
    await db.execute(
      sql`INSERT INTO pages (id, site_id, slug, title, description, blocks, status, seo, created_at, updated_at, published_at)
          VALUES (${ulid()}, ${siteId}, ${p.slug}, ${p.title}, ${p.description}, ${JSON.stringify(p.blocks)}, ${p.status}, ${JSON.stringify({})}, ${now}, ${now}, ${p.status === "published" ? now : null})`
    );
  }
}

// --- GET /v1/sites ------------------------------------------------------

siteRoutes.get("/", async (c) => {
  const userId = await getUserId(c);
  const db = getDb(c.env);
  const result = await db.execute(sql`SELECT * FROM sites WHERE user_id = ${userId} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 200`);
  const rows = (result as unknown as { rows: ReadonlyArray<SiteRow> }).rows;
  return c.json({ data: rows.map(toSite) });
});

// --- POST /v1/sites -----------------------------------------------------

siteRoutes.post("/", zValidator("json", createSiteSchema), async (c) => {
  const userId = await getUserId(c);
  const input = c.req.valid("json");
  const db = getDb(c.env);

  // Enforce per-plan site quota
  const userResult = await db.execute(sql`SELECT plan FROM users WHERE id = ${userId} LIMIT 1`);
  const userRow = (userResult as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows[0];
  const planId = (userRow?.plan as PlanId | undefined) ?? "free";
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]!;
  const countResult = await db.execute(sql`SELECT COUNT(*)::int AS n FROM sites WHERE user_id = ${userId} AND deleted_at IS NULL`);
  const count = Number((countResult as unknown as { rows: ReadonlyArray<{ n: number }> }).rows[0]?.n ?? 0);
  if (count >= plan.quotas.maxSites) {
    throw new ApiError("quota_exceeded", `Your ${plan.label} plan allows up to ${plan.quotas.maxSites} site(s).`, 402);
  }

  // Check slug uniqueness
  const existing = await db.execute(sql`SELECT id FROM sites WHERE slug = ${input.slug} LIMIT 1`);
  if ((existing as unknown as { rows: ReadonlyArray<unknown> }).rows.length > 0) {
    throw new ApiError("slug_taken", "This site slug is already in use", 409);
  }

  const siteId = ulid();
  const now = Date.now();
  await db.execute(
    sql`INSERT INTO sites (id, user_id, slug, name, description, state, locale, created_at, updated_at)
        VALUES (${siteId}, ${userId}, ${input.slug}, ${input.title}, ${input.description ?? null}, "draft", ${input.defaultLocale}, ${now}, ${now})`
  );

  await provisionDefaultPages(db, siteId);
  log(c.env, "info", "site_created", { userId, siteId, slug: input.slug });

  const created = await db.execute(sql`SELECT * FROM sites WHERE id = ${siteId} LIMIT 1`);
  const row = (created as unknown as { rows: ReadonlyArray<SiteRow> }).rows[0]!;
  return c.json({ data: toSite(row) }, 201);
});

// --- GET /v1/sites/:id --------------------------------------------------

const idParam = z.object({ id: z.string().min(1).max(64) });
siteRoutes.get("/:id", zValidator("param", idParam), async (c) => {
  const userId = await getUserId(c);
  const { id } = c.req.valid("param");
  const db = getDb(c.env);
  const row = await findSite(db, id, userId);
  return c.json({ data: toSite(row as SiteRow) });
});

// --- PATCH /v1/sites/:id -----------------------------------------------

siteRoutes.patch("/:id", zValidator("param", idParam), zValidator("json", updateSiteSchema), async (c) => {
  const userId = await getUserId(c);
  const { id } = c.req.valid("param");
  const input = c.req.valid("json");
  const db = getDb(c.env);
  const existing = await findSite(db, id, userId);

  const now = Date.now();
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (input.title !== undefined) {
    fields.push(`name = $${i++}`); values.push(input.title);
  }
  if (input.description !== undefined) {
    fields.push(`description = $${i++}`); values.push(input.description);
  }
  if (input.defaultLocale !== undefined) {
    fields.push(`locale = $${i++}`); values.push(input.defaultLocale);
  }
  if (input.customDomain !== undefined) {
    fields.push(`custom_domain = $${i++}`); values.push(input.customDomain);
  }
  if (input.status !== undefined) {
    fields.push(`state = $${i++}`); values.push(input.status);
  }
  if (fields.length === 0) {
    return c.json({ data: toSite(existing as SiteRow) });
  }
  fields.push(`updated_at = $${i++}`); values.push(now);
  values.push(id);

  await db.execute(
    sql.raw(`UPDATE sites SET ${fields.join(", ")} WHERE id = $${i} AND deleted_at IS NULL`, ...(values as never[]))
  );

  const refreshed = await db.execute(sql`SELECT * FROM sites WHERE id = ${id} LIMIT 1`);
  const row = (refreshed as unknown as { rows: ReadonlyArray<SiteRow> }).rows[0]!;
  return c.json({ data: toSite(row) });
});

// --- DELETE /v1/sites/:id (soft) ---------------------------------------

siteRoutes.delete("/:id", zValidator("param", idParam), async (c) => {
  const userId = await getUserId(c);
  const { id } = c.req.valid("param");
  const db = getDb(c.env);
  await findSite(db, id, userId);
  const now = Date.now();
  await db.execute(sql`UPDATE sites SET deleted_at = ${now}, updated_at = ${now} WHERE id = ${id}`);
  log(c.env, "info", "site_archived", { userId, siteId: id });
  return c.json({ data: { ok: true } });
});

// --- GET /v1/sites/:id/usage -------------------------------------------

siteRoutes.get("/:id/usage", zValidator("param", idParam), async (c) => {
  const userId = await getUserId(c);
  const { id } = c.req.valid("param");
  const db = getDb(c.env);
  const site = await findSite(db, id, userId);

  const userResult = await db.execute(sql`SELECT plan FROM users WHERE id = ${userId} LIMIT 1`);
  const planId = ((userResult as unknown as { rows: ReadonlyArray<{ plan: string }> }).rows[0]?.plan ?? "free") as PlanId;
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]!;

  const [pagesRes, mediaRes, subsRes, collRes] = await Promise.all([
    db.execute(sql`SELECT COUNT(*)::int AS n FROM pages WHERE site_id = ${id} AND deleted_at IS NULL`),
    db.execute(sql`SELECT COALESCE(SUM(size_bytes), 0)::bigint AS bytes FROM media WHERE site_id = ${id} AND deleted_at IS NULL`),
    db.execute(sql`SELECT COUNT(*)::int AS n FROM subscribers WHERE site_id = ${id} AND state = 'active'`),
    db.execute(sql`SELECT COUNT(*)::int AS n FROM cms_collections WHERE site_id = ${id}`),
  ]);
  const n = (r: unknown) => Number((r as unknown as { rows: ReadonlyArray<{ n: number }> }).rows[0]?.n ?? 0);
  const b = (r: unknown) => Number((r as unknown as { rows: ReadonlyArray<{ bytes: number | string }> }).rows[0]?.bytes ?? 0);
  const pages = n(pagesRes);
  const mediaBytes = b(mediaRes);
  const subs = n(subsRes);
  const colls = n(collRes);

  return c.json({
    data: {
      siteId: id,
      plan: plan.id,
      usage: {
        pages: { used: pages, limit: plan.quotas.maxPagesPerSite },
        collections: { used: colls, limit: plan.quotas.maxCollectionsPerSite },
        storageBytes: { used: mediaBytes, limit: plan.quotas.storageBytes },
        subscribers: { used: subs, limit: -1 },
      },
      quotas: plan.quotas,
    },
  });
});
