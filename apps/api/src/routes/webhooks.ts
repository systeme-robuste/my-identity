/**
 * Webhook routes — register endpoints and fire test events.
 *
 *   GET    /v1/sites/:id/webhooks
 *   POST   /v1/sites/:id/webhooks
 *   DELETE /v1/sites/:id/webhooks/:wid
 *   POST   /v1/sites/:id/webhooks/:wid/test
 *
 * Each webhook is identified by a ULID and has a per-webhook secret used
 * to sign outgoing payloads with HMAC-SHA256 (header `X-MyIdentity-Signature`).
 * Every delivery is logged in `webhook_deliveries` (status, response code,
 * duration, response excerpt).
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
import { createWebhookSchema } from "@my-identity/shared/schemas";
import { hmacSha256Hex } from "@my-identity/shared/utils/crypto";
import { newWebhookSecret } from "../lib/id.ts";

export const webhookRoutes = new Hono<Env>();

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

interface WebhookRow {
  id: string;
  site_id: string;
  direction: string;
  url: string;
  events: string;
  enabled: number;
  secret: string;
  created_at: number;
  updated_at: number;
}

function toWebhook(row: WebhookRow, includeSecret = false) {
  return {
    id: String(row.id),
    siteId: String(row.site_id),
    direction: String(row.direction) as "incoming" | "outgoing",
    url: String(row.url),
    events: safeJsonArray(row.events),
    enabled: Number(row.enabled) === 1,
    ...(includeSecret ? { secret: String(row.secret) } : {}),
    createdAt: new Date(Number(row.created_at)).toISOString(),
    updatedAt: new Date(Number(row.updated_at)).toISOString(),
  };
}

function safeJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

// --- GET /v1/sites/:id/webhooks ---------------------------------------

webhookRoutes.get(
  "/:id/webhooks",
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId } = c.req.valid("param");
    const db = getDb(c.env);
    await assertSiteOwned(db, siteId, userId);
    const result = await db.execute(
      sql`SELECT * FROM webhooks WHERE site_id = ${siteId} ORDER BY created_at DESC LIMIT 100`
    );
    const rows = (result as unknown as { rows: ReadonlyArray<WebhookRow> }).rows;
    return c.json({ data: rows.map((r) => toWebhook(r, false)) });
  }
);

// --- POST /v1/sites/:id/webhooks --------------------------------------

webhookRoutes.post(
  "/:id/webhooks",
  zValidator("param", z.object({ id: z.string() })),
  zValidator("json", createWebhookSchema),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId } = c.req.valid("param");
    const input = c.req.valid("json");
    const db = getDb(c.env);
    await assertSiteOwned(db, siteId, userId);

    const countResult = await db.execute(sql`SELECT COUNT(*)::int AS n FROM webhooks WHERE site_id = ${siteId}`);
    if (Number((countResult as unknown as { rows: ReadonlyArray<{ n: number }> }).rows[0]?.n ?? 0) >= 20) {
      throw new ApiError("quota_exceeded", "Up to 20 webhooks per site.", 402);
    }

    const id = ulid();
    const secret = newWebhookSecret();
    const now = Date.now();
    await db.execute(
      sql`INSERT INTO webhooks (id, site_id, direction, url, events, enabled, secret, created_at, updated_at)
          VALUES (${id}, ${siteId}, ${input.direction}, ${input.url}, ${JSON.stringify(input.events)}, ${input.enabled ? 1 : 0}, ${secret}, ${now}, ${now})`
    );
    log(c.env, "info", "webhook_created", { userId, siteId, webhookId: id });

    const inserted = await db.execute(sql`SELECT * FROM webhooks WHERE id = ${id} LIMIT 1`);
    const row = (inserted as unknown as { rows: ReadonlyArray<WebhookRow> }).rows[0]!;
    return c.json({ data: toWebhook(row, true) }, 201);
  }
);

// --- DELETE /v1/sites/:id/webhooks/:wid ------------------------------

webhookRoutes.delete(
  "/:id/webhooks/:wid",
  zValidator("param", z.object({ id: z.string(), wid: z.string() })),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId, wid } = c.req.valid("param");
    const db = getDb(c.env);
    await assertSiteOwned(db, siteId, userId);
    const result = await db.execute(
      sql`DELETE FROM webhooks WHERE id = ${wid} AND site_id = ${siteId} RETURNING id`
    );
    if ((result as unknown as { rows: ReadonlyArray<unknown> }).rows.length === 0) {
      throw new ApiError("not_found", "Webhook not found", 404);
    }
    log(c.env, "info", "webhook_deleted", { userId, siteId, webhookId: wid });
    return c.json({ data: { ok: true } });
  }
);

// --- POST /v1/sites/:id/webhooks/:wid/test ----------------------------

webhookRoutes.post(
  "/:id/webhooks/:wid/test",
  zValidator("param", z.object({ id: z.string(), wid: z.string() })),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId, wid } = c.req.valid("param");
    const db = getDb(c.env);
    await assertSiteOwned(db, siteId, userId);
    const result = await db.execute(
      sql`SELECT * FROM webhooks WHERE id = ${wid} AND site_id = ${siteId} LIMIT 1`
    );
    const wh = (result as unknown as { rows: ReadonlyArray<WebhookRow> }).rows[0];
    if (!wh) throw new ApiError("not_found", "Webhook not found", 404);

    const delivery = await deliverWebhook(c.env, wh, {
      event: "webhook.test",
      deliveredAt: new Date().toISOString(),
      data: { ok: true, message: "This is a test delivery from My Identity." },
    });
    log(c.env, "info", "webhook_test", { userId, siteId, webhookId: wid, status: delivery.status });
    return c.json({ data: delivery });
  }
);

// --- Delivery helper ---------------------------------------------------

interface DeliveryResult {
  status: "delivered" | "failed";
  httpStatus: number | null;
  durationMs: number;
  error: string | null;
}

async function deliverWebhook(env: Env, wh: WebhookRow, payload: Record<string, unknown>): Promise<DeliveryResult> {
  const body = JSON.stringify(payload);
  const signature = await hmacSha256Hex(wh.secret, body);
  const start = Date.now();
  let httpStatus: number | null = null;
  let error: string | null = null;
  try {
    const res = await fetch(wh.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MyIdentity-Signature": `sha256=${signature}`,
        "X-MyIdentity-Event": String(payload["event"] ?? "unknown"),
        "User-Agent": "MyIdentity-Webhooks/0.1",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    httpStatus = res.status;
    if (!res.ok) error = `HTTP ${res.status}`;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  const durationMs = Date.now() - start;
  const status: DeliveryResult["status"] = httpStatus !== null && httpStatus >= 200 && httpStatus < 300 ? "delivered" : "failed";
  // Log to D1 (best-effort)
  try {
    const db = getDb(env);
    await db.execute(
      sql`INSERT INTO webhook_deliveries (id, webhook_id, event, payload, http_status, duration_ms, error, attempted_at)
          VALUES (${ulid()}, ${wh.id}, ${String(payload["event"] ?? "unknown")}, ${body}, ${httpStatus}, ${durationMs}, ${error}, ${Date.now()})`
    );
  } catch (err) {
    log(env, "warn", "webhook_log_failed", { error: err instanceof Error ? err.message : String(err) });
  }
  return { status, httpStatus, durationMs, error };
}
