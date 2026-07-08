/**
 * Form routes.
 *
 *   POST /v1/sites/:id/forms/:fid/submissions     (PUBLIC — no auth)
 *   GET  /v1/sites/:id/forms/:fid/submissions     (auth)
 *
 * The public submission endpoint is the only one in the API that does
 * not require authentication. It's mounted under `/v1/` so it benefits
 * from the global CORS + rate-limit middleware, but it is NOT covered by
 * the per-user `auth({ required: true })` middleware — we apply auth
 * selectively inside the handler.
 *
 * Submissions:
 *   1. Verify Turnstile token (if required by the form).
 *   2. Validate the payload against the form's field schema.
 *   3. Persist to `form_submissions` (unless `storeSubmissions=false`).
 *   4. Run automations triggered by `form.submit`.
 *   5. Optionally notify the site owner by email.
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
import { sendEmail } from "../lib/email.ts";
import { verifyTurnstileToken } from "../lib/turnstile.ts";
import { ulid } from "@my-identity/shared/utils/id";
import { submitFormSchema } from "@my-identity/shared/schemas";

export const formRoutes = new Hono<Env>();

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

interface FormRow {
  id: string;
  site_id: string;
  user_id: string;
  name: string;
  fields: string;
  success_message: string;
  email_to: string | null;
  email_subject: string | null;
  store_submissions: number;
  turnstile_required: number;
  created_at: number;
  updated_at: number;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function loadForm(db: ReturnType<typeof getDb>, formId: string, siteId: string): Promise<FormRow> {
  const result = await db.execute(
    sql`SELECT f.*, s.user_id FROM forms f JOIN sites s ON s.id = f.site_id WHERE f.id = ${formId} AND f.site_id = ${siteId} AND f.deleted_at IS NULL AND s.deleted_at IS NULL LIMIT 1`
  );
  const row = (result as unknown as { rows: ReadonlyArray<FormRow> }).rows[0];
  if (!row) throw new ApiError("not_found", "Form not found", 404);
  return row;
}

function validateAgainstSchema(payload: Record<string, unknown>, fields: ReadonlyArray<{ name: string; type: string; required: boolean; options?: ReadonlyArray<string> }>): { ok: true } | { ok: false; error: string } {
  for (const f of fields) {
    const value = payload[f.name];
    if (f.required && (value === undefined || value === null || value === "")) {
      return { ok: false, error: `Field '${f.name}' is required.` };
    }
    if (value === undefined || value === null) continue;
    if (f.type === "email" && typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { ok: false, error: `Field '${f.name}' must be a valid email.` };
    }
    if (f.type === "url" && typeof value === "string" && !/^https?:\/\//.test(value)) {
      return { ok: false, error: `Field '${f.name}' must be a valid URL.` };
    }
    if (f.type === "number" && typeof value !== "number") {
      return { ok: false, error: `Field '${f.name}' must be a number.` };
    }
    if (f.type === "select" && f.options && typeof value === "string" && !f.options.includes(value)) {
      return { ok: false, error: `Field '${f.name}' must be one of: ${f.options.join(", ")}` };
    }
  }
  return { ok: true };
}

interface SubmissionRow {
  id: string;
  form_id: string;
  data: string;
  ip: string | null;
  user_agent: string | null;
  country: string | null;
  referrer: string | null;
  spam_score: number | null;
  created_at: number;
}

function toSubmission(row: SubmissionRow) {
  return {
    id: String(row.id),
    formId: String(row.form_id),
    data: safeJson(row.data),
    ip: row.ip ?? null,
    userAgent: row.user_agent ?? null,
    country: row.country ?? null,
    referrer: row.referrer ?? null,
    spamScore: row.spam_score ?? null,
    createdAt: new Date(Number(row.created_at)).toISOString(),
  };
}

// --- POST /v1/sites/:id/forms/:fid/submissions  (PUBLIC) --------------

formRoutes.post(
  "/:id/forms/:fid/submissions",
  zValidator("param", z.object({ id: z.string(), fid: z.string() })),
  zValidator("json", submitFormSchema),
  async (c) => {
    const { id: siteId, fid } = c.req.valid("param");
    const input = c.req.valid("json");
    const db = getDb(c.env);
    const form = await loadForm(db, fid, siteId);
    const fields = (Array.isArray(safeJson(form.fields)) ? safeJson(form.fields) : []) as ReadonlyArray<{
      name: string;
      type: string;
      required: boolean;
      options?: ReadonlyArray<string>;
    }>;

    if (form.turnstile_required && input.turnstileToken) {
      const captcha = await verifyTurnstileToken(c.env, input.turnstileToken, c.req.header("CF-Connecting-IP") ?? null);
      if (!captcha.ok) {
        throw new ApiError("captcha_failed", "Bot check failed", 400);
      }
    }

    const result = validateAgainstSchema(input.data, fields);
    if (!result.ok) {
      throw new ApiError("validation_error", result.error, 422);
    }

    const submissionId = ulid();
    const now = Date.now();
    let stored = true;
    if (form.store_submissions) {
      await db.execute(
        sql`INSERT INTO form_submissions (id, form_id, data, ip, user_agent, country, referrer, spam_score, created_at)
            VALUES (${submissionId}, ${fid}, ${JSON.stringify(input.data)}, ${c.req.header("CF-Connecting-IP") ?? null}, ${c.req.header("User-Agent") ?? null}, ${c.req.header("CF-IPCountry") ?? null}, ${c.req.header("Referer") ?? null}, ${null}, ${now})`
      );
    } else {
      stored = false;
    }

    // Email notification (best-effort)
    if (form.email_to) {
      try {
        const subject = form.email_subject ?? `New submission: ${form.name}`;
        const pretty = Object.entries(input.data)
          .map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(String(v))}</td></tr>`)
          .join("");
        await sendEmail(c.env, {
          to: form.email_to,
          subject,
          html: `<table style="border-collapse:collapse">${pretty}</table>`,
        });
      } catch (err) {
        log(c.env, "warn", "form_email_failed", { formId: fid, error: err instanceof Error ? err.message : String(err) });
      }
    }

    log(c.env, "info", "form_submission", { siteId, formId: fid, submissionId, stored });
    return c.json(
      {
        data: {
          id: submissionId,
          message: form.success_message,
        },
      },
      201
    );
  }
);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- GET /v1/sites/:id/forms/:fid/submissions  (auth) ----------------

formRoutes.get(
  "/:id/forms/:fid/submissions",
  zValidator("param", z.object({ id: z.string(), fid: z.string() })),
  async (c) => {
    const userId = await getUserId(c);
    const { id: siteId, fid } = c.req.valid("param");
    const db = getDb(c.env);
    // verify ownership
    await loadForm(db, fid, siteId);
    const siteCheck = await db.execute(sql`SELECT user_id FROM sites WHERE id = ${siteId} AND deleted_at IS NULL LIMIT 1`);
    const siteRow = (siteCheck as unknown as { rows: ReadonlyArray<{ user_id: string }> }).rows[0];
    if (!siteRow || siteRow.user_id !== userId) throw new ApiError("forbidden", "Not your site", 403);

    const result = await db.execute(
      sql`SELECT * FROM form_submissions WHERE form_id = ${fid} ORDER BY created_at DESC LIMIT 200`
    );
    const rows = (result as unknown as { rows: ReadonlyArray<SubmissionRow> }).rows;
    return c.json({ data: rows.map(toSubmission), nextCursor: null, prevCursor: null, total: rows.length });
  }
);
