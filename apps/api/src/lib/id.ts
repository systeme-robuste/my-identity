/**
 * Re-export of ULID generation from `@my-identity/shared/utils/id` so the
 * API doesn't have to import from a deep path. Also exposes prefixed ID
 * helpers for things like session IDs and audit row keys.
 */

import { ulid, makeApiKeyPrefix } from "@my-identity/shared/utils/id";

export { ulid, makeApiKeyPrefix };

/** Generate a 32-byte URL-safe random ID for sessions. */
export function newSessionId(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Generate a per-webhook secret. */
export function newWebhookSecret(): string {
  return `whsec_${newSessionId()}`;
}
