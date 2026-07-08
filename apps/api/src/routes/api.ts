/**
 * Public, per-site end-user API.
 *
 *   GET  /v1/api/sites/:slug                          — site info
 *   GET  /v1/api/sites/:slug/pages/:pageSlug          — rendered page (D1-cached)
 *   GET  /v1/api/sites/:slug/cms/:collectionSlug      — published CMS entries
 *   GET  /v1/me                                       — current user (auth)
 *   GET  /v1/me/sites                                 — current user's sites (auth)
 *
 * Calls are rate-limited per API key (header `X-API-Key`) or per IP for
 * unauthenticated reads. The render path uses the D1 cache populated by
 * the API on page publish.
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
import { getOrSet } from "../lib/cache.ts";
import { sha256Hex, timingSafeEqual } from "@my-identity/shared/utils/crypto";
import { LIMITS } from "@my-identity/shared/constants/limits";
import { isULID } from "@my-identity/shared/utils/id";

export const apiRoutes = new Hono<Env>();

// --- Helpers -------------------------------------------------------------

async function getUserIdOptional(c: Context<Env>): Promise<string | null> {
  const cookieName = c.env.AUTH_SESSION_COOKIE_NAME;
  const sid = getCookie(c, cookieName);
  if (!sid) return null;
  const raw = await c.env.SESSIONS.get(sid);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as { userId: string; expiresAt: string };
    if (new Date(session.expiresAt).getTime() < Date.now()) return null;
    return session.userId;
  } catch {
    return null;
  }
}

async function getUserIdRequired(c: Context<Env>): Promise<string> {
  const uid = await getUserIdOptional(c);
  if (!uid) throw new ApiError("unauthorized", "Authentication required", 401);
  return uid;
}

interface PublicSiteSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  locale: string;
  customDomain: string | null;
}

// --- GET /v1/api/sites/:slug ------------------------------------------

apiRoutes.get(
  "/api/sites/:slug",
  zValidator("param", z.object({ slug: z.string() })),
  async (c) => {
    const { slug } = c.req.valid("param");
    const db = getDb(c.env);
    const cacheKey = `api:site:${slug}`;
    const summary = await getOrSet<PublicSiteSummary>(
      c.env.DB_CACHE,
      { prefix: "api", ttlSeconds: 60 },
      cacheKey,
      async () => {
        const result = await db.execute(
          sql`SELECT id, slug, name, description, locale, custom_domain FROM sites WHERE slug = ${slug} AND state = 'published' AND deleted_at IS NULL LIMIT 1`
        );
        const row = (result as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows[0];
        if (!row) return null as unknown as PublicSiteSummary;
        return {
          id: String(row.id),
          slug: String(row.slug),
          name: String(row.name),
          description: (row.description as string | null) ?? null,
          locale: String(row.locale ?? "fr"),
          customDomain: (row.custom_domain as string | null) ?? null,
        };
      }
    );
    if (!summary) throw new ApiError("not_found", "Site not found", 404);
    return c.json({ data: summary });
  }
);

// --- GET /v1/api/sites/:slug/pages/:pageSlug -------------------------

apiRoutes.get(
  "/api/sites/:slug/pages/:pageSlug",
  zValidator("param", z.object({ slug: z.string(), pageSlug: z.string() })),
  async (c) => {
    const { slug, pageSlug } = c.req.valid("param");
    const locale = c.req.query("locale") ?? null;
    const cacheKey = `page:${slug}:${locale ?? "default"}:${pageSlug}`;
    const db = getDb(c.env);
    const page = await getOrSet<unknown>(
      c.env.DB_CACHE,
      { prefix: "page", ttlSeconds: LIMITS.renderCacheTtlSeconds },
      cacheKey,
      async () => {
        const result = await db.execute(
          sql`SELECT p.*, s.state AS site_state FROM pages p
              JOIN sites s ON s.id = p.site_id
              WHERE s.slug = ${slug} AND p.slug = ${pageSlug}
                AND p.locale IS NOT DISTINCT FROM ${locale}
                AND p.status = 'published' AND p.deleted_at IS NULL
                AND s.deleted_at IS NULL
              LIMIT 1`
        );
        const row = (result as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows[0];
        if (!row) return null;
        const blocks = typeof row.blocks === "string" ? safeJson(row.blocks) : row.blocks ?? [];
        const seo = typeof row.seo === "string" ? safeJson(row.seo) : row.seo ?? {};
        return {
          id: String(row.id),
          siteSlug: slug,
          slug: String(row.slug),
          title: String(row.title),
          description: (row.description as string | null) ?? null,
          blocks,
          locale: (row.locale as string | null) ?? null,
          seo,
          publishedAt: row.published_at ? new Date(Number(row.published_at)).toISOString() : null,
        };
      }
    );
    if (!page) throw new ApiError("not_found", "Page not found", 404);
    return c.json({ data: page });
  }
);

// --- GET /v1/api/sites/:slug/cms/:collectionSlug ---------------------

apiRoutes.get(
  "/api/sites/:slug/cms/:collectionSlug",
  zValidator("param", z.object({ slug: z.string(), collectionSlug: z.string() })),
  zValidator(
    "query",
    z.object({
      limit: z.coerce.number().int().min(1).max(50).default(20),
      cursor: z.string().optional(),
      locale: z.string().optional(),
    })
  ),
  async (c) => {
    const { slug, collectionSlug } = c.req.valid("param");
    const q = c.req.valid("query");
    const db = getDb(c.env);
    const cursorValid = q.cursor ? isULID(q.cursor) : false;
    const result = await db.execute(
      sql.raw(
        `SELECT e.* FROM cms_entries e
         JOIN cms_collections c ON c.id = e.collection_id
         JOIN sites s ON s.id = e.site_id
         WHERE s.slug = ${quote(slug)}
           AND c.name = ${quote(collectionSlug)}
           AND e.status = 'published'
           AND e.deleted_at IS NULL
           AND c.deleted_at IS NULL
           AND s.deleted_at IS NULL
           ${q.locale ? `AND e.locale = ${quote(q.locale)}` : ""}
           ${cursorValid ? `AND e.id < ${quote(q.cursor!)}` : ""}
         ORDER BY e.id DESC LIMIT ${q.limit + 1}`
      )
    );
    const rows = (result as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows;
    const sliced = rows.slice(0, q.limit);
    const last = sliced[sliced.length - 1];
    return c.json({
      data: sliced.map((row) => ({
        id: String(row.id),
        collection: collectionSlug,
        slug: String(row.slug),
        data: typeof row.data === "string" ? safeJson(row.data) : row.data ?? {},
        locale: (row.locale as string | null) ?? null,
        publishedAt: row.published_at ? new Date(Number(row.published_at)).toISOString() : null,
      })),
      nextCursor: rows.length > q.limit && last ? String(last.id) : null,
      prevCursor: q.cursor ?? null,
      total: null,
    });
  }
);

function quote(v: string): string {
  if (!/^[A-Za-z0-9_\-:.]+$/.test(v)) throw new ApiError("invalid_input", "Invalid parameter", 400);
  return `'${v.replace(/'/g, "''")}'`;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// --- GET /v1/me -------------------------------------------------------

apiRoutes.get("/me", async (c) => {
  const userId = await getUserIdRequired(c);
  const db = getDb(c.env);
  const result = await db.execute(
    sql`SELECT id, email, name, avatar_url, locale, account_role, created_at, email_verified_at
        FROM users WHERE id = ${userId} AND deleted_at IS NULL LIMIT 1`
  );
  const row = (result as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows[0];
  if (!row) throw new ApiError("not_found", "User not found", 404);
  return c.json({
    data: {
      id: String(row.id),
      email: String(row.email),
      displayName: (row.name as string | null) ?? null,
      avatarUrl: (row.avatar_url as string | null) ?? null,
      locale: (row.locale as string) ?? "fr",
      accountRole: ((row.account_role as string) ?? "user") as "user" | "support" | "admin",
      createdAt: new Date(Number(row.created_at)).toISOString(),
      emailVerifiedAt: row.email_verified_at ? new Date(Number(row.email_verified_at)).toISOString() : null,
    },
  });
});

// --- GET /v1/me/sites -------------------------------------------------

apiRoutes.get("/me/sites", async (c) => {
  const userId = await getUserIdRequired(c);
  const db = getDb(c.env);
  const result = await db.execute(
    sql`SELECT id, slug, name, description, state, locale, custom_domain, created_at, updated_at, published_at
        FROM sites WHERE user_id = ${userId} AND deleted_at IS NULL
        ORDER BY created_at DESC LIMIT 200`
  );
  const rows = (result as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows;
  return c.json({
    data: rows.map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: (row.description as string | null) ?? null,
      status: String(row.state ?? "draft"),
      locale: String(row.locale ?? "fr"),
      customDomain: (row.custom_domain as string | null) ?? null,
      createdAt: new Date(Number(row.created_at)).toISOString(),
      updatedAt: new Date(Number(row.updated_at)).toISOString(),
      publishedAt: row.published_at ? new Date(Number(row.published_at)).toISOString() : null,
    })),
  });
});

// Avoid unused-import warning for crypto (used implicitly by callers).
void sha256Hex;
void timingSafeEqual;
