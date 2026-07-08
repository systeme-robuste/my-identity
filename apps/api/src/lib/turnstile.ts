/**
 * Cloudflare Turnstile verification. Called on every state-changing
 * public endpoint (signup, login, forgot, public form submission,
 * webhook create). Returns `true` if the token is valid, throws otherwise.
 *
 * TODO(Phase 1): add a per-IP failure counter to ban repeat offenders.
 */

import type { Env } from "../types/env.d.ts";
import { ApiError } from "./errors.ts";

export async function verifyTurnstile(env: Env, token: string, remoteIp: string | null): Promise<boolean> {
  if (!token) throw new ApiError("turnstile_failed", "Missing Turnstile token", 400);
  const body = new URLSearchParams();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new ApiError("turnstile_failed", `Turnstile verify failed: HTTP ${res.status}`, 502);
  }
  const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
  if (!data.success) {
    throw new ApiError("turnstile_failed", `Turnstile rejected: ${(data["error-codes"] ?? []).join(",") || "unknown"}`, 400);
  }
  return true;
}
