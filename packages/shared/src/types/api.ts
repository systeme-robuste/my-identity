/**
 * Generic API envelope types. Used by every endpoint to keep responses
 * consistent and easy to consume from the dashboard.
 */

/** Standard success envelope for a single resource. */
export interface ApiResource<T> {
  data: T;
}

/** Standard success envelope for a collection. */
export interface ApiCollection<T> {
  data: ReadonlyArray<T>;
  /** Opaque cursor; null when there is no next page. */
  nextCursor: string | null;
  /** Opaque cursor; null when there is no previous page. */
  prevCursor: string | null;
  /** Total count if known and cheap to compute. May be null on large collections. */
  total: number | null;
}

/** RFC 7807-ish error envelope. */
export interface ApiError {
  error: {
    /** Stable machine-readable code, e.g. "unauthorized", "validation_error", "rate_limited". */
    code: string;
    /** Human-readable message, already localized to the caller's locale. */
    message: string;
    /** Field-level details for validation errors. */
    details: ReadonlyArray<{ field: string; message: string }> | null;
    /** Optional request ID for support. */
    requestId: string | null;
  };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string; // ISO 8601
}

/** Standard query parameters for paginated endpoints. */
export interface PageQuery {
  cursor?: string;
  limit?: number;
}

export type Id = string; // ULID
