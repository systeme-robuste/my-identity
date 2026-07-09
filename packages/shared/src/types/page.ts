/**
 * Page and block types. A site is a tree of pages, each page is a tree of
 * blocks. The renderer is responsible for converting this tree to HTML.
 *
 * The shape of `blocks` is intentionally an open union — the dashboard
 * knows the full set, the renderer only needs to handle a subset
 * (the "core" blocks: heading, paragraph, image, button, form, collection,
 * gated). New block types are added in `apps/dashboard/src/components/editor/blocks/`
 * and registered in `apps/renderer/src/render/html.ts`.
 */

export type PageStatus = "draft" | "published" | "archived";

/**
 * A block is a discriminated union. The discriminator is `type`. Unknown
 * block types are ignored by the renderer (and logged as a warning) so
 * that a page authored in a newer dashboard version still renders on an
 * older renderer.
 */
export type Block =
  | { id: string; type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string; anchor: string | null }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "image"; src: string; alt: string; width: number | null; height: number | null; caption: string | null }
  | { id: string; type: "button"; label: string; href: string; variant: "primary" | "secondary" | "ghost"; openInNewTab: boolean }
  | { id: string; type: "form"; formId: string }
  | { id: string; type: "collection"; collectionId: string; layout: "list" | "grid"; limit: number | null }
  | { id: string; type: "video"; provider: "youtube" | "vimeo" | "mp4"; src: string; poster: string | null }
  | { id: string; type: "embed"; html: string; sandbox: boolean }
  | { id: string; type: "divider" }
  | { id: string; type: "spacer"; height: number /* px */ }
  | { id: string; type: "code"; language: string; code: string }
  | { id: string; type: "quote"; text: string; attribution: string | null }
  | { id: string; type: "columns"; columns: ReadonlyArray<ReadonlyArray<Block>> }
  | { id: string; type: "gated"; blockIds: ReadonlyArray<string>; requiredTier: "free" | "pro" | "business" | "any" };

export interface Page {
  id: string;
  siteId: string;
  /** URL slug, e.g. "about". The home page uses "index" or empty string. */
  slug: string;
  title: string;
  description: string | null;
  /** Block tree. Always at least an empty array. */
  blocks: ReadonlyArray<Block>;
  /** Locale-specific variant, or null if this is the default-locale page. */
  locale: string | null;
  status: PageStatus;
  /** SEO overrides; fall back to site-level settings if null. */
  seo: {
    title: string | null;
    description: string | null;
    ogImageUrl: string | null;
    noindex: boolean;
    canonicalUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}
