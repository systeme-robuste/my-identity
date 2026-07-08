/**
 * Auth middleware. Validates the session cookie and attaches the user
 * context to the Hono context. Supports two modes:
 *   - `required: true` → returns 401 if no valid session
 *   - `required: false` → attaches context if present, otherwise anonymous
 *
 * The session is looked up in the `SESSIONS` KV namespace by ID. The
 * session payload contains `{ userId, role, expiresAt, ... }`.
 *
 * TODO(Phase 1): wire up role-based authorization on top of authentication
 * (e.g. `auth({ required: true, role: "owner" })`).
 */

import type { MiddlewareHandler } from "hono";
import type { Env, Context } from "../types/env.d.ts";
import { ApiError } from "../lib/errors.ts";

export interface AuthOptions {
  required: boolean;
  role?: "owner" | "admin" | "editor" | "viewer";
}

export function auth(options: AuthOptions): MiddlewareHandler<Env> {
  return async (c, next) => {
    const cookieName = c.env.AUTH_SESSION_COOKIE_NAME;
    const sessionId = readCookie(c.req.header("Cookie"), cookieName);
    if (!sessionId) {
      if (options.required) throw new ApiError("unauthorized", "Authentication required", 401);
      attachAnonymous(c);
      await next();
      return;
    }

    const raw = await c.env.SESSIONS.get(sessionId);
    if (!raw) {
      if (options.required) throw new ApiError("unauthorized", "Session expired", 401);
      attachAnonymous(c);
      await next();
      return;
    }

    let payload: { userId: string; role: Context["role"]; expiresAt: string };
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      await c.env.SESSIONS.delete(sessionId);
      throw new ApiError("unauthorized", "Session corrupted", 401);
    }

    if (new Date(payload.expiresAt).getTime() < Date.now()) {
      await c.env.SESSIONS.delete(sessionId);
      if (options.required) throw new ApiError("unauthorized", "Session expired", 401);
      attachAnonymous(c);
      await next();
      return;
    }

    if (options.role) {
      const order: ReadonlyArray<Context["role"]> = ["viewer", "editor", "admin", "owner"];
      if (order.indexOf(payload.role) < order.indexOf(options.role)) {
        throw new ApiError("forbidden", `Role '${options.role}' required`, 403);
      }
    }

    c.set("userId" as never, payload.userId as never);
    c.set("sessionId" as never, sessionId as never);
    c.set("role" as never, payload.role as never);
    await next();
  };
}

function attachAnonymous(c: { set: (k: string, v: unknown) => void }) {
  c.set("userId", null);
  c.set("sessionId", null);
  c.set("role", "anonymous");
}

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}
