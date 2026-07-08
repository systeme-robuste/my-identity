/**
 * SEO meta-tag + JSON-LD assembly.
 */

import type { Site, Page, ResolvedLocale } from "@my-identity/shared";

export interface SeoMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage: string | null;
  jsonLd: string | null;
}

export function resolveMeta(site: Site, page: Page, locale: ResolvedLocale): SeoMeta {
  const title = page.seo?.title ?? `${page.title} — ${site.name}`;
  const description = page.seo?.description ?? site.description ?? "";
  const canonical = new URL(page.slug === "index" ? `/${locale.code}/` : `/${locale.code}/${page.slug}`, site.url).toString();
  const ogImage = page.seo?.ogImage ?? site.ogImage ?? null;

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonical,
    inLanguage: locale.code,
    isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
  };

  return {
    title,
    description,
    canonical,
    ogImage,
    jsonLd: JSON.stringify(ld),
  };
}
