/**
 * Typed fetch wrapper for talking to the API.
 *
 * The renderer never talks to Postgres directly — it asks the API for
 * site summaries, pages, and CMS entries. All responses are typed
 * envelopes; we project out the `.data` field here.
 */

export interface SiteSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  locale: string;
  customDomain: string | null;
}

export interface RenderedPage {
  id: string;
  siteSlug: string;
  slug: string;
  title: string;
  description: string | null;
  blocks: ReadonlyArray<unknown>;
  locale: string | null;
  seo: {
    title?: string | null;
    description?: string | null;
    ogImageUrl?: string | null;
    noindex?: boolean;
    canonicalUrl?: string | null;
  };
  publishedAt: string | null;
}

interface ApiEnvelope<T> {
  data: T;
  error?: { code: string; message: string };
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: signal ?? AbortSignal.timeout(5_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Upstream ${res.status} for ${url}`);
  }
  const body = (await res.json()) as ApiEnvelope<T>;
  return body.data;
}

export async function fetchSiteSummary(apiBaseUrl: string, slug: string, signal?: AbortSignal): Promise<SiteSummary | null> {
  return getJson<SiteSummary>(`${apiBaseUrl.replace(/\/$/, "")}/v1/api/sites/${encodeURIComponent(slug)}`, signal);
}

export async function fetchPage(
  apiBaseUrl: string,
  slug: string,
  pageSlug: string,
  locale: string | null,
  signal?: AbortSignal
): Promise<RenderedPage | null> {
  const params = new URLSearchParams();
  if (locale) params.set("locale", locale);
  const qs = params.toString();
  return getJson<RenderedPage>(
    `${apiBaseUrl.replace(/\/$/, "")}/v1/api/sites/${encodeURIComponent(slug)}/pages/${encodeURIComponent(pageSlug)}${qs ? `?${qs}` : ""}`,
    signal
  );
}
