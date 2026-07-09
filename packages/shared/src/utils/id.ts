/**
 * ULID generation. ULIDs are 26-character Crockford base-32 strings
 * (e.g. `01ARZ3NDEKTSV4RRFFQ69G5FAV`) — sortable, URL-safe, and
 * monotonically increasing within the same millisecond. We use them
 * for every primary key.
 */

import { ulid as ulidImpl } from "ulid";

export function ulid(): string {
  return ulidImpl();
}

/** A `mi_` prefixed public ID for API keys, used in the dashboard. */
export function makeApiKeyPrefix(environment: "live" | "test"): string {
  const env = environment === "live" ? "live" : "test";
  const random = ulid().toLowerCase().slice(0, 12);
  return `mi_${env}_${random}`;
}

/** Validate that a string is a well-formed ULID. */
export function isULID(value: string): boolean {
  return /^[0-9A-HJKMNP-TV-Z]{26}$/.test(value);
}
