/**
 * Media routes — upload, list, delete.
 *
 *   POST   /v1/sites/:id/media         (multipart/form-data, single file)
 *   GET    /v1/sites/:id/media
 *   DELETE /v1/sites/:id/media/:mid
 *
 * Files are stored in the `MEDIA` R2 bucket. The server stores the
 * canonical URL, content-type, size, and an ULID for the key. Upload
 * accepts any content-type up to the per-plan size limit.
 *
 * On delete, the row in `media` is hard-deleted and the R2 object is
 * removed. There is no soft-delete — deletion is unrecoverable by
 * design. (Callers should copy objects they want to keep.)
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
import { PLANS, type PlanId } from "@my-identity/shared/constants/plans";
import { LIMITS } from "@my-identity/shared/constants/limits";

export const mediaRoutes = new Hono<Env>();

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
  const result = await db.execute(sql`SELECT id, user_id FROM sites WHERE id = ${siteId} AND deleted_at IS NULL LIMIT 1`);
  const row = (result as unknown as { rows: ReadonlyArray<{ id: string; user_id: string }> }).rows[0];
  if (!row) throw new ApiError("not_found", "Site not found", 404);
  if (row.user_id !== userId) throw new ApiError("forbidden", "Not your site", 403);
  return row;
}

interface MediaRow {
  id: string;
  site_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  url: string;
  r2_key: string;
  width: number | null;
  height: number | null;
  uploaded_by: string;
  created_at: number;
}

function toMedia(row: MediaRow) {
  return {
    id: String(row.id),
    siteId: String(row.site_id),
    filename: String(row.filename),
    contentType: String(row.content_type),
    sizeBytes: Number(row.size_bytes),
    url: String(row.url),
    width: row.width,
    height: row.height,
    uploadedBy: String(row.uploaded_by),
    createdAt: new Date(Number(row.created_at)).toISOString(),
  };
}

// --- POST /v1/sites/:id/media -----------------------------------------

mediaRoutes.post(
  "/:id/media",
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId } = c.req.valid("param");
    const db = getDb(c.env);
    await assertSiteOwned(db, siteId, userId);

    // Per-plan file size limit
    const userResult = await db.execute(sql`SELECT plan FROM users WHERE id = ${userId} LIMIT 1`);
    const planId = ((userResult as unknown as { rows: ReadonlyArray<{ plan: string }> }).rows[0]?.plan ?? "free") as PlanId;
    const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]!;
    const maxBytes = Math.min(plan.quotas.storageBytes / 100, LIMITS.maxMediaFileBytes);

    const formData = await c.req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError("invalid_input", "A 'file' field is required (multipart/form-data).", 400);
    }
    if (file.size > maxBytes) {
      throw new ApiError("file_too_large", `File exceeds the ${(maxBytes / 1024 / 1024).toFixed(0)} MB limit.`, 413);
    }

    // Total storage check
    const totalResult = await db.execute(
      sql`SELECT COALESCE(SUM(size_bytes), 0)::bigint AS bytes FROM media WHERE site_id = ${siteId} AND deleted_at IS NULL`
    );
    const total = Number((totalResult as unknown as { rows: ReadonlyArray<{ bytes: number | string }> }).rows[0]?.bytes ?? 0);
    if (total + file.size > plan.quotas.storageBytes) {
      throw new ApiError("storage_quota_exceeded", `Site storage quota (${(plan.quotas.storageBytes / 1024 / 1024).toFixed(0)} MB) exceeded.`, 402);
    }

    const id = ulid();
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const r2Key = `sites/${siteId}/${id}${ext}`;
    const arrayBuf = await file.arrayBuffer();
    await c.env.MEDIA.put(r2Key, arrayBuf, {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });
    const url = `${c.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${r2Key}`;

    const now = Date.now();
    await db.execute(
      sql`INSERT INTO media (id, site_id, filename, content_type, size_bytes, url, r2_key, uploaded_by, created_at)
          VALUES (${id}, ${siteId}, ${file.name}, ${file.type || "application/octet-stream"}, ${file.size}, ${url}, ${r2Key}, ${userId}, ${now})`
    );

    log(c.env, "info", "media_uploaded", { userId, siteId, mediaId: id, size: file.size });
    return c.json(
      {
        data: {
          id,
          siteId,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          url,
          uploadedBy: userId,
          createdAt: new Date(now).toISOString(),
        },
      },
      201
    );
  }
);

// --- GET /v1/sites/:id/media ------------------------------------------

mediaRoutes.get(
  "/:id/media",
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId } = c.req.valid("param");
    const db = getDb(c.env);
    await assertSiteOwned(db, siteId, userId);
    const result = await db.execute(
      sql`SELECT * FROM media WHERE site_id = ${siteId} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 500`
    );
    const rows = (result as unknown as { rows: ReadonlyArray<MediaRow> }).rows;
    return c.json({ data: rows.map(toMedia) });
  }
);

// --- DELETE /v1/sites/:id/media/:mid ----------------------------------

mediaRoutes.delete(
  "/:id/media/:mid",
  zValidator("param", z.object({ id: z.string(), mid: z.string() })),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId, mid } = c.req.valid("param");
    const db = getDb(c.env);
    await assertSiteOwned(db, siteId, userId);
    const found = await db.execute(
      sql`SELECT id, r2_key FROM media WHERE id = ${mid} AND site_id = ${siteId} AND deleted_at IS NULL LIMIT 1`
    );
    const row = (found as unknown as { rows: ReadonlyArray<{ id: string; r2_key: string }> }).rows[0];
    if (!row) throw new ApiError("not_found", "Media not found", 404);

    const now = Date.now();
    await db.execute(sql`UPDATE media SET deleted_at = ${now} WHERE id = ${mid}`);
    try {
      await c.env.MEDIA.delete(row.r2_key);
    } catch (err) {
      log(c.env, "warn", "r2_delete_failed", { mediaId: mid, error: err instanceof Error ? err.message : String(err) });
    }
    log(c.env, "info", "media_deleted", { userId, siteId, mediaId: mid });
    return c.json({ data: { ok: true } });
  }
);
