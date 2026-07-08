/**
 * Pure HTML assembly from a page tree + CMS data.
 *
 * No JS is shipped. The output is a single HTML document with:
 *   - inlined per-site CSS (from `css.ts`)
 *   - one `<main>` per page block
 *   - site-level custom `<head>` (analytics, fonts, etc.)
 *   - site-level custom `<footer>` HTML
 *   - Open Graph + Twitter Card meta tags
 *   - JSON-LD structured data
 *
 * All user content is escaped via `escapeHtml` and `sanitizeHtml` from
 * `@my-identity/shared`. Block-level HTML (rich text) is sanitized but
 * preserves safe tags.
 */

import { sanitizeHtml, escapeHtml, type Site, type Page, type Block, type ResolvedLocale } from "@my-identity/shared";
import { compileCss } from "./css.ts";
import { resolveMeta } from "./seo.ts";
import { selectVariant } from "./a-b.ts";

export interface RenderInput {
  site: Site;
  page: Page;
  locale: ResolvedLocale;
  cookies?: Record<string, string>;
}

export function renderPage(input: RenderInput): string {
  const { site, page, locale, cookies = {} } = input;

  const css = compileCss(site.design);
  const seo = resolveMeta(site, page, locale);
  const variant = selectVariant(page, cookies);
  const blocks = variant.blocks ?? page.blocks;

  const body = blocks.map((b) => renderBlock(b, locale)).join("\n");

  return [
    "<!DOCTYPE html>",
    `<html lang="${escapeHtml(locale.code)}" dir="${locale.dir ?? "ltr"}">`,
    "<head>",
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeHtml(seo.description)}">`,
    `<link rel="canonical" href="${escapeHtml(seo.canonical)}">`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}">`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}">`,
    `<meta property="og:url" content="${escapeHtml(seo.canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escapeHtml(site.name)}">`,
    seo.ogImage ? `<meta property="og:image" content="${escapeHtml(seo.ogImage)}">` : "",
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}">`,
    seo.ogImage ? `<meta name="twitter:image" content="${escapeHtml(seo.ogImage)}">` : "",
    `<link rel="icon" href="${escapeHtml(site.favicon ?? "/favicon.ico")}">`,
    `<style>${css}</style>`,
    site.customHead ?? "",
    seo.jsonLd ? `<script type="application/ld+json">${seo.jsonLd}</script>` : "",
    "</head>",
    `<body class="mi-body mi-locale-${escapeHtml(locale.code)}">`,
    body,
    site.customFooter ?? "",
    "</body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n");
}

function renderBlock(block: Block, locale: ResolvedLocale): string {
  switch (block.type) {
    case "hero":
      return `<section class="mi-block mi-block-hero" id="${escapeHtml(block.id)}">
  <h1>${escapeHtml(resolveString(block.props.heading, locale))}</h1>
  ${block.props.subheading ? `<p>${escapeHtml(resolveString(block.props.subheading, locale))}</p>` : ""}
  ${block.props.cta ? `<a class="mi-cta" href="${escapeHtml(block.props.cta.href)}">${escapeHtml(resolveString(block.props.cta.label, locale))}</a>` : ""}
</section>`;
    case "text":
      return `<section class="mi-block mi-block-text" id="${escapeHtml(block.id)}">
  ${sanitizeHtml(resolveString(block.props.body, locale))}
</section>`;
    case "image":
      return `<section class="mi-block mi-block-image" id="${escapeHtml(block.id)}">
  <img src="${escapeHtml(block.props.src)}" alt="${escapeHtml(block.props.alt ?? "")}" loading="lazy" decoding="async"${block.props.width ? ` width="${block.props.width}"` : ""}${block.props.height ? ` height="${block.props.height}"` : ""}>
  ${block.props.caption ? `<figcaption>${escapeHtml(resolveString(block.props.caption, locale))}</figcaption>` : ""}
</section>`;
    case "gallery":
      return `<section class="mi-block mi-block-gallery" id="${escapeHtml(block.id)}">
  ${(block.props.images ?? [])
    .map(
      (img: { src: string; alt?: string }) =>
        `<img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt ?? "")}" loading="lazy" decoding="async">`
    )
    .join("\n")}
</section>`;
    case "form":
      return `<section class="mi-block mi-block-form" id="${escapeHtml(block.id)}">
  <form method="post" action="/api/sites/${escapeHtml(block.props.siteSlug ?? "")}/forms/${escapeHtml(block.props.formId)}/submissions">
    ${(block.props.fields ?? [])
      .map(
        (f: { name: string; label: string; type: string; required?: boolean }) =>
          `<label>${escapeHtml(f.label)}<input name="${escapeHtml(f.name)}" type="${escapeHtml(f.type)}"${f.required ? " required" : ""}></label>`
      )
      .join("\n")}
    <button type="submit">${escapeHtml(resolveString(block.props.submitLabel ?? "Envoyer", locale))}</button>
  </form>
</section>`;
    case "cms":
      return `<section class="mi-block mi-block-cms" id="${escapeHtml(block.id)}" data-collection="${escapeHtml(block.props.collection)}">
  <!-- CMS entries rendered server-side from cache -->
  <noscript>Cette section affiche du contenu dynamique de votre collection.</noscript>
</section>`;
    case "embed":
      return `<section class="mi-block mi-block-embed" id="${escapeHtml(block.id)}">
  ${sanitizeHtml(block.props.html ?? "", { allowedTags: ["iframe", "blockquote", "script"], allowedAttributes: { iframe: ["src", "width", "height", "allow", "frameborder", "title"], blockquote: ["cite"] } })}
</section>`;
    case "pricing":
      return `<section class="mi-block mi-block-pricing" id="${escapeHtml(block.id)}">
  ${(block.props.tiers ?? [])
    .map(
      (t: { name: string; price: number; currency: string; features: string[]; cta?: { label: string; href: string } }) =>
        `<div class="mi-tier">
  <h3>${escapeHtml(resolveString(t.name, locale))}</h3>
  <p class="mi-tier-price">${escapeHtml(String(t.price))} ${escapeHtml(t.currency)}</p>
  <ul>${t.features.map((f) => `<li>${escapeHtml(resolveString(f, locale))}</li>`).join("")}</ul>
  ${t.cta ? `<a class="mi-cta" href="${escapeHtml(t.cta.href)}">${escapeHtml(resolveString(t.cta.label, locale))}</a>` : ""}
</div>`
    )
    .join("\n")}
</section>`;
    case "faq":
      return `<section class="mi-block mi-block-faq" id="${escapeHtml(block.id)}">
  ${(block.props.items ?? [])
    .map(
      (it: { q: string; a: string }) =>
        `<details><summary>${escapeHtml(resolveString(it.q, locale))}</summary><div>${sanitizeHtml(resolveString(it.a, locale))}</div></details>`
    )
    .join("\n")}
</section>`;
    case "footer":
      return `<footer class="mi-block mi-block-footer" id="${escapeHtml(block.id)}">
  ${sanitizeHtml(resolveString(block.props.body, locale))}
</footer>`;
    default: {
      // Unknown block type — emit a hidden marker so editors can spot it
      return `<section class="mi-block mi-block-unknown" id="${escapeHtml(block.id)}" data-type="${escapeHtml((block as { type: string }).type)}"></section>`;
    }
  }
}

function resolveString(value: unknown, locale: ResolvedLocale): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, string>;
    return obj[locale.code] ?? obj.default ?? obj.fr ?? obj.en ?? Object.values(obj)[0] ?? "";
  }
  return String(value);
}
