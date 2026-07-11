/**
 * Authentication routes.
 *
 *   POST /v1/auth/signup     — create a new account
 *   POST /v1/auth/login      — start a session
 *   POST /v1/auth/logout     — end the current session
 *   POST /v1/auth/forgot     — request a password reset email
 *   POST /v1/auth/reset      — confirm a password reset
 *   GET  /v1/auth/me         — return the current user
 *
 * Passwords are hashed with scrypt via the Web Crypto API. Sessions
 * are stored in the `SESSIONS` KV namespace; the cookie is HttpOnly,
 * SameSite=Lax, Secure in production.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";

import type { Env } from "../types/env.d.ts";
import { ApiError } from "../lib/errors.ts";
import { log } from "../lib/logger.ts";
import { newSessionId } from "../lib/id.ts";
import { ulid } from "@my-identity/shared/utils/id";
import { sendEmail } from "../lib/email.ts";
import { verifyTurnstileToken } from "../lib/turnstile.ts";
import { getDb } from "../lib/db.ts";
import { sql } from "drizzle-orm";

import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@my-identity/shared/schemas";
import type { PublicUser } from "@my-identity/shared/types";
import { translate } from "@my-identity/shared/i18n";
import { randomBase64Url, sha256Hex, timingSafeEqual } from "@my-identity/shared/utils/crypto";

export const authRoutes = new Hono<Env>();

// --- Helpers -------------------------------------------------------------

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

interface SessionPayload {
  userId: string;
  expiresAt: string; // ISO 8601
  createdAt: string; // ISO 8601
  ipHash: string | null;
  uaHash: string | null;
}

async function hashPassword(password: string): Promise<string> {
  // scrypt via Web Crypto: PBKDF2 with high iteration count as the
  // portable surrogate. Both runtimes (Workers + Node 20) support PBKDF2
  // out of the box; scrypt is not yet standardised in the Web Crypto API.
  const salt = randomBase64Url(16);
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 210_000, hash: "SHA-256" },
    baseKey,
    256
  );
  return `pbkdf2$210000$${salt}$${toBase64(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2" || !parts[1] || !parts[2] || !parts[3]) return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const salt = parts[2];
  const expected = parts[3];
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations, hash: "SHA-256" },
    baseKey,
    256
  );
  return timingSafeEqual(toBase64(new Uint8Array(bits)), expected);
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function setSessionCookie(c: { env: Env; req: { header: (k: string) => string | undefined }; header: (k: string, v: string) => void }, sessionId: string, expiresAt: Date) {
  const name = c.env.AUTH_SESSION_COOKIE_NAME;
  const secure = c.env.ENVIRONMENT === "production" ? " Secure;" : "";
  const cookie = [
    `${name}=${sessionId}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    secure,
    `Expires=${expiresAt.toUTCString()}`,
  ]
    .filter(Boolean)
    .join("; ");
  c.header("Set-Cookie", cookie);
}

function toPublicUser(row: Record<string, unknown>): PublicUser {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: (row.name as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    locale: ((row.locale as "fr" | "en" | "es" | "de" | "pt") ?? "fr") as PublicUser["locale"],
    timezone: "UTC",
    accountRole: ((row.account_role as PublicUser["accountRole"]) ?? "user") as PublicUser["accountRole"],
    createdAt: new Date(Number(row.created_at) ?? Date.now()).toISOString(),
    emailVerifiedAt: row.email_verified_at ? new Date(Number(row.email_verified_at)).toISOString() : null,
  };
}

// --- POST /v1/auth/signup -----------------------------------------------

authRoutes.post("/signup", zValidator("json", signupSchema), async (c) => {
  const input = c.req.valid("json");

  // 1. Verify Turnstile
  const captcha = await verifyTurnstileToken(c.env, input.turnstileToken, c.req.header("CF-Connecting-IP") ?? null);
  if (!captcha.ok) {
    throw new ApiError("captcha_failed", "Bot check failed", 400);
  }

  const db = getDb(c.env);
  const passwordHash = await hashPassword(input.password);
  const userId = ulid(); // ULID for k-sortable, 26 chars
  const now = Date.now();

  try {
    await db.execute(sql`
      INSERT INTO users (id, email, password_hash, name, locale, plan, created_at, updated_at)
      VALUES (${userId}, ${input.email}, ${passwordHash}, ${input.displayName ?? null}, ${input.locale ?? "fr"}, "free", ${now}, ${now})
    `);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/duplicate key|unique constraint/i.test(msg)) {
      throw new ApiError("email_taken", "An account with this email already exists", 409);
    }
    throw err;
  }

  log(c.env, "info", "user_signup", { userId, email: input.email });

  // 2. Welcome email (best-effort)
  try {
    await sendEmail(c.env, {
      to: input.email,
      subject: translate((input.locale ?? "fr") as "fr", "auth.signup.welcome_subject", "Welcome to My Identity"),
      html: `<p>${translate((input.locale ?? "fr") as "fr", "auth.signup.welcome_body", "Your account is ready. Start building at ")}<a href="${c.env.APP_BASE_URL}">${c.env.APP_BASE_URL}</a></p>`,
    });
  } catch (err) {
    log(c.env, "warn", "welcome_email_failed", { userId, error: err instanceof Error ? err.message : String(err) });
  }

  // 3. Create session
  const sessionId = newSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const session: SessionPayload = {
    userId,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
    ipHash: c.req.header("CF-Connecting-IP") ? await sha256Hex(c.req.header("CF-Connecting-IP")!) : null,
    uaHash: c.req.header("User-Agent") ? await sha256Hex(c.req.header("User-Agent")!) : null,
  };
  await c.env.SESSIONS.put(sessionId, JSON.stringify(session), { expirationTtl: SESSION_TTL_SECONDS });
  setSessionCookie(c, sessionId, expiresAt);

  return c.json(
    {
      data: toPublicUser({
        id: userId,
        email: input.email,
        name: input.displayName ?? null,
        avatar_url: null,
        locale: input.locale ?? "fr",
        account_role: "user",
        created_at: now,
        email_verified_at: null,
      }),
    },
    201
  );
});

// --- POST /v1/auth/login ------------------------------------------------

authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const input = c.req.valid("json");

  const captcha = await verifyTurnstileToken(c.env, input.turnstileToken, c.req.header("CF-Connecting-IP") ?? null);
  if (!captcha.ok) {
    throw new ApiError("captcha_failed", "Bot check failed", 400);
  }

  const db = getDb(c.env);
  const rows = await db.execute(sql`SELECT * FROM users WHERE email = ${input.email} LIMIT 1`);
  const row = (rows as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows[0];
  if (!row) {
    throw new ApiError("invalid_credentials", "Invalid email or password", 401);
  }
  if (row.deleted_at) {
    throw new ApiError("account_disabled", "This account has been disabled", 403);
  }
  if (row.locked_until && Number(row.locked_until) > Date.now()) {
    throw new ApiError("account_locked", "Account temporarily locked. Try again later.", 429);
  }

  const valid = row.password_hash ? await verifyPassword(input.password, String(row.password_hash)) : false;
  if (!valid) {
    // increment failure count
    const failures = Number(row.failed_login_count ?? 0) + 1;
    const lockUntil = failures >= 10 ? Date.now() + 60 * 60 * 1000 : null;
    await db.execute(sql`UPDATE users SET failed_login_count = ${failures}, locked_until = ${lockUntil} WHERE id = ${row.id}`);
    throw new ApiError("invalid_credentials", "Invalid email or password", 401);
  }

  // Reset failures, update last login
  await db.execute(sql`UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = ${Date.now()}, last_login_ip = ${c.req.header("CF-Connecting-IP") ?? null} WHERE id = ${row.id}`);

  const sessionId = newSessionId();
  const expiresAt = new Date(Date.now() + (input.remember ? SESSION_TTL_SECONDS * 6 : SESSION_TTL_SECONDS) * 1000);
  const session: SessionPayload = {
    userId: String(row.id),
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
    ipHash: c.req.header("CF-Connecting-IP") ? await sha256Hex(c.req.header("CF-Connecting-IP")!) : null,
    uaHash: c.req.header("User-Agent") ? await sha256Hex(c.req.header("User-Agent")!) : null,
  };
  await c.env.SESSIONS.put(sessionId, JSON.stringify(session), { expirationTtl: Math.floor((expiresAt.getTime() - Date.now()) / 1000) });
  setSessionCookie(c, sessionId, expiresAt);

  log(c.env, "info", "user_login", { userId: String(row.id) });
  return c.json({ data: toPublicUser(row) });
});

// --- POST /v1/auth/logout -----------------------------------------------

const logoutSchema = z.object({}).optional();

authRoutes.post("/logout", zValidator("json", logoutSchema), async (c) => {
  const cookieName = c.env.AUTH_SESSION_COOKIE_NAME;
  const sessionId = getCookie(c, cookieName);
  if (sessionId) {
    await c.env.SESSIONS.delete(sessionId);
  }
  deleteCookie(c, cookieName, { path: "/" });
  return c.json({ data: { ok: true } });
});

// --- POST /v1/auth/forgot -----------------------------------------------

authRoutes.post("/forgot", zValidator("json", forgotPasswordSchema.pick({ email: true })), async (c) => {
  const input = c.req.valid("json");
  const db = getDb(c.env);
  const rows = await db.execute(sql`SELECT id, locale FROM users WHERE email = ${input.email} LIMIT 1`);
  const row = (rows as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows[0];
  // Always return 200 to avoid email enumeration.
  if (row) {
    const token = randomBase64Url(32);
    const tokenHash = await sha256Hex(token);
    const payload = JSON.stringify({ userId: String(row.id), expiresAt: Date.now() + 60 * 60 * 1000 });
    await c.env.SESSIONS.put(`reset:${tokenHash}`, payload, { expirationTtl: 3600 });
    const resetUrl = `${c.env.APP_BASE_URL}/reset?token=${token}`;
    try {
      await sendEmail(c.env, {
        to: input.email,
        subject: "Reset your My Identity password",
        html: `<p>Click the link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
      });
    } catch (err) {
      log(c.env, "warn", "forgot_email_failed", { error: err instanceof Error ? err.message : String(err) });
    }
  }
  return c.json({ data: { ok: true } });
});

// --- POST /v1/auth/reset ------------------------------------------------

authRoutes.post("/reset", zValidator("json", resetPasswordSchema), async (c) => {
  const input = c.req.valid("json");
  const tokenHash = await sha256Hex(input.token);
  const raw = await c.env.SESSIONS.get(`reset:${tokenHash}`);
  if (!raw) throw new ApiError("invalid_token", "Reset link is invalid or has expired", 400);
  const payload = JSON.parse(raw) as { userId: string; expiresAt: number };
  if (payload.expiresAt < Date.now()) {
    await c.env.SESSIONS.delete(`reset:${tokenHash}`);
    throw new ApiError("invalid_token", "Reset link is invalid or has expired", 400);
  }
  const passwordHash = await hashPassword(input.password);
  const db = getDb(c.env);
  await db.execute(
    sql`UPDATE users SET password_hash = ${passwordHash}, failed_login_count = 0, locked_until = NULL, updated_at = ${Date.now()} WHERE id = ${payload.userId}`
  );
  await c.env.SESSIONS.delete(`reset:${tokenHash}`);
  log(c.env, "info", "password_reset", { userId: payload.userId });
  return c.json({ data: { ok: true } });
});

// --- GET /v1/auth/me ----------------------------------------------------

authRoutes.get("/me", async (c) => {
  const sessionId = getCookie(c, c.env.AUTH_SESSION_COOKIE_NAME);
  if (!sessionId) throw new ApiError("unauthorized", "Authentication required", 401);
  const raw = await c.env.SESSIONS.get(sessionId);
  if (!raw) throw new ApiError("unauthorized", "Session expired", 401);
  let payload: SessionPayload;
  try {
    payload = JSON.parse(raw) as SessionPayload;
  } catch {
    throw new ApiError("unauthorized", "Corrupt session", 401);
  }
  if (new Date(payload.expiresAt).getTime() < Date.now()) {
    throw new ApiError("unauthorized", "Session expired", 401);
  }
  const db = getDb(c.env);
  const rows = await db.execute(sql`SELECT * FROM users WHERE id = ${payload.userId} LIMIT 1`);
  const row = (rows as unknown as { rows: ReadonlyArray<Record<string, unknown>> }).rows[0];
  if (!row || row.deleted_at) throw new ApiError("unauthorized", "Account not found", 401);
  return c.json({ data: toPublicUser(row) });
});
