/**
 * Supported UI / content locales. The default is `fr`; the marketing site
 * and the studio are localized to all five. The renderer is localized per
 * site (each site has a `defaultLocale` + `supportedLocales`).
 */

export const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "pt"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  pt: "Português",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(value);
}
