/**
 * Site-level types. A site is a single customer-facing presence (one or
 * more pages, optional CMS collections, forms, products, members).
 */

import type { Locale } from "../constants/locales.ts";

export type SiteStatus = "draft" | "published" | "archived";

/** A site as exposed to the dashboard and public API. */
export interface Site {
  id: string;
  ownerId: string;
  /** Subdomain on myidentity.app or a custom domain. */
  slug: string;
  customDomain: string | null;
  title: string;
  description: string | null;
  /** Default language; visitors without a language cookie get this. */
  defaultLocale: Locale;
  supportedLocales: ReadonlyArray<Locale>;
  /** Per-site price currency, always USD at MVP. */
  currency: "USD";
  status: SiteStatus;
  /** Snapshot of the current published version, used by the renderer for cache-busting. */
  publishedVersion: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** Site settings JSONB blob. Typed in the dashboard; opaque on the API. */
export interface SiteSettings {
  theme: "light" | "dark" | "auto";
  brandColor: string; // hex
  customCss: string | null;
  customHeadHtml: string | null;
  customFooterHtml: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  analyticsEnabled: boolean;
  seoIndexable: boolean;
}

export interface DomainVerificationStatus {
  domain: string;
  status: "pending" | "verified" | "failed";
  cnameTarget: string;
  txtRecord: string;
  lastCheckedAt: string | null;
}
