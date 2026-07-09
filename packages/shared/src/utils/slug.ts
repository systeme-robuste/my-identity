/**
 * Slugify a string. Transliterates accents to ASCII (best-effort), lower-cases,
 * replaces non-alphanumerics with a single dash, trims leading/trailing dashes.
 *
 * @example
 *   slugify("Crème Brûlée!") // "creme-brulee"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s);
}

/** Reserved slugs that cannot be used for sites or pages. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "www",
  "api",
  "studio",
  "dashboard",
  "admin",
  "auth",
  "docs",
  "help",
  "support",
  "billing",
  "static",
  "public",
  "assets",
  "media",
  "cdn",
  "status",
  "legal",
  "privacy",
  "terms",
  "about",
  "pricing",
  "blog",
  "root",
  "test",
  "dev",
  "staging",
]);
