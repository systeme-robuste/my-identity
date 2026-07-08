/**
 * Locale resolution.
 *
 * Order of precedence:
 *   1. `?lang=` query param (if in the supported set)
 *   2. `lang` cookie
 *   3. `Accept-Language` header (parsed, best match)
 *   4. Site's default locale
 *
 * Always returns a value — falls back to the first supported locale.
 */

import type { ResolvedLocale, Site } from "@my-identity/shared";
import { SUPPORTED_LOCALES } from "@my-identity/shared";

export function resolveLocale(req: Request, site: Site, cookies: Record<string, string> = {}): ResolvedLocale {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("lang");
  if (fromQuery && SUPPORTED_LOCALES.includes(fromQuery as ResolvedLocale["code"])) {
    return makeLocale(fromQuery);
  }
  const fromCookie = cookies.lang ?? cookies.MI_LANG;
  if (fromCookie && SUPPORTED_LOCALES.includes(fromCookie as ResolvedLocale["code"])) {
    return makeLocale(fromCookie);
  }
  const al = req.headers.get("Accept-Language");
  if (al) {
    const preferred = parseAcceptLanguage(al);
    for (const code of preferred) {
      if (SUPPORTED_LOCALES.includes(code as ResolvedLocale["code"])) {
        return makeLocale(code);
      }
    }
  }
  return makeLocale(site.locale);
}

function makeLocale(code: string): ResolvedLocale {
  const dir = code === "ar" || code === "he" || code === "fa" ? "rtl" : "ltr";
  return { code, dir };
}

function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .map((p) => p.tag);
}

export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(rest.join("="));
  }
  return out;
}
