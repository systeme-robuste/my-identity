/**
 * i18n string tables. Keys are namespaced by feature (e.g. `auth.login.title`).
 * The dashboard, API error responses, and email templates all use these.
 *
 * For per-site content (e.g. a site's own copy), use the CMS — these tables
 * are only for the platform UI and email templates.
 */

import { fr } from "./fr.ts";
import { en } from "./en.ts";
import { es } from "./es.ts";
import type { Locale } from "../constants/locales.ts";

export type StringTable = Readonly<Record<string, string>>;
export type Tables = Readonly<Record<Locale, StringTable>>;

export const I18N_TABLES: Tables = { fr, en, es };

export function translate(locale: Locale, key: string, fallback?: string): string {
  const table = I18N_TABLES[locale] ?? I18N_TABLES.fr;
  const value = table[key];
  if (typeof value === "string") return value;
  // Fall back to French, then to the explicit fallback, then to the key.
  const fr = I18N_TABLES.fr[key];
  if (typeof fr === "string") return fr;
  return fallback ?? key;
}

export function format(locale: Locale, key: string, vars: Readonly<Record<string, string | number>>): string {
  const template = translate(locale, key);
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}
