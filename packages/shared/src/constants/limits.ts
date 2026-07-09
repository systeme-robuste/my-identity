/**
 * Hard platform limits. The API enforces these in addition to plan quotas.
 * They are absolute: even Business plans cannot exceed them at MVP.
 */

export const LIMITS = {
  /** Maximum size of a single uploaded media file, in bytes. */
  maxMediaFileBytes: 25 * 1024 * 1024,
  /** Maximum size of a single JSON request body, in bytes. */
  maxJsonRequestBytes: 1 * 1024 * 1024,
  /** Maximum number of blocks per page. */
  maxBlocksPerPage: 500,
  /** Maximum number of fields per CMS collection. */
  maxFieldsPerCollection: 100,
  /** Maximum length of a single text field, in characters. */
  maxTextFieldLength: 2000,
  /** Maximum length of a long-text field, in characters. */
  maxLongTextFieldLength: 100_000,
  /** Maximum total HTML output of a rendered page, in bytes. */
  maxRenderedHtmlBytes: 100 * 1024,
  /** Cache TTL for rendered HTML in KV, in seconds. */
  renderCacheTtlSeconds: 300,
  /** Stale-while-revalidate window for rendered HTML, in seconds. */
  renderCacheStaleSeconds: 86_400,
  /** Rate-limit window for anonymous requests, in seconds. */
  anonRateLimitWindowSeconds: 60,
  /** Rate-limit window for authenticated requests, in seconds. */
  authedRateLimitWindowSeconds: 60,
  /** Rate-limit window for auth endpoints (login/signup/forgot), in seconds. */
  authRateLimitWindowSeconds: 60,
  /** Number of days an account is kept in the deletion grace period. */
  accountDeletionGraceDays: 30,
  /** Number of days before an unauthenticated session is reaped. */
  sessionTtlDays: 30,
  /** Max number of custom domains per site. */
  maxCustomDomainsPerSite: 1,
  /** Max number of API keys per user. */
  maxApiKeysPerUser: 10,
  /** Max number of webhooks per site. */
  maxWebhooksPerSite: 20,
  /** Max number of automations per site (Phase 2). */
  maxAutomationsPerSite: 50,
  /** Max age of a Turnstile token, in seconds. */
  turnstileMaxAgeSeconds: 300,
} as const;

export type Limits = typeof LIMITS;
