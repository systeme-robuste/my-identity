/**
 * User identity & access types.
 *
 * The full schema is in `packages/db/src/schema/users.ts`. These types are
 * the consumer-facing projections (what the API returns, what the dashboard
 * displays). Avoid leaking DB-internal columns (e.g. `password_hash`,
 * `failed_login_count`) to the client.
 */

import type { Locale } from "../constants/locales.ts";

/** Roles on a site. Owner has full control; admin everything except delete-site; editor content only; viewer read-only. */
export type SiteRole = "owner" | "admin" | "editor" | "viewer";

/** Roles at the account level (cross-site). */
export type AccountRole = "user" | "support" | "admin";

/** Public user projection. Never includes the password hash. */
export interface PublicUser {
  /** ULID. */
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  locale: Locale;
  timezone: string;
  accountRole: AccountRole;
  createdAt: string; // ISO 8601
  emailVerifiedAt: string | null;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: string; // ISO 8601
  createdAt: string;
  ipHash: string | null;
  uaHash: string | null;
}

export interface ApiKey {
  id: string;
  userId: string;
  /** Shown once on creation. The server stores only the SHA-256 hash. */
  prefix: string; // e.g. "mi_live_a1b2c3"
  label: string;
  scopes: ReadonlyArray<ApiKeyScope>;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export type ApiKeyScope =
  | "read:sites"
  | "write:sites"
  | "read:pages"
  | "write:pages"
  | "read:cms"
  | "write:cms"
  | "read:analytics"
  | "read:orders"
  | "write:orders"
  | "read:members"
  | "write:members";
