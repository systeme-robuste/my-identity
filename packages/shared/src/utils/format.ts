/**
 * Formatting helpers for user-facing display. Locale-aware where it
 * matters; otherwise pure.
 */

const NUMBER_FORMATTERS = new Map<string, Intl.NumberFormat>();

function getNumberFormatter(locale: string, options: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
  const key = locale + JSON.stringify(options);
  let f = NUMBER_FORMATTERS.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, options);
    NUMBER_FORMATTERS.set(key, f);
  }
  return f;
}

export function formatCurrency(cents: number, currency: "USD" = "USD", locale = "en-US"): string {
  return getNumberFormatter(locale, { style: "currency", currency }).format(cents / 100);
}

export function formatNumber(n: number, locale = "en-US"): string {
  return getNumberFormatter(locale).format(n);
}

export function formatCompact(n: number, locale = "en-US"): string {
  return getNumberFormatter(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatBytes(bytes: number, locale = "en-US"): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB", "PB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[i]}`;
}

const DATE_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

export function formatDate(iso: string, locale = "en-US", opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }): string {
  const key = locale + JSON.stringify(opts);
  let f = DATE_FORMATTERS.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opts);
    DATE_FORMATTERS.set(key, f);
  }
  return f.format(new Date(iso));
}

export function formatRelative(iso: string, locale = "en-US"): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.round((now - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const ranges: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "second"],
    [3600, "minute"],
    [86_400, "hour"],
    [604_800, "day"],
    [2_629_800, "week"],
    [31_557_600, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let last = 1;
  for (const [bound, unit] of ranges) {
    if (Math.abs(diffSec) < bound) {
      const value = Math.round(diffSec / last);
      return rtf.format(-value, unit);
    }
    last = bound;
  }
  return iso;
}
