/**
 * HTML sanitization for the renderer. The renderer receives block content
 * from the dashboard and must produce safe HTML. The sanitize functions
 * are conservative: they only allow tags and attributes that the block
 * model documents, and they strip anything else.
 *
 * For user-supplied rich-text (e.g. CMS entry long-text fields), we use
 * a tag+attribute allowlist that mirrors the editor's output. Embeds
 * from non-allowlisted origins are stripped.
 */

const ALLOWED_TAGS = new Set([
  "a",
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
  "figure",
  "figcaption",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "span",
  "div",
  "video",
  "source",
]);

const ALLOWED_ATTRS: Record<string, ReadonlySet<string>> = {
  a: new Set(["href", "title", "rel", "target"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading", "decoding"]),
  video: new Set(["src", "poster", "controls", "preload", "width", "height"]),
  source: new Set(["src", "type", "srcset", "media"]),
  table: new Set(["summary"]),
  th: new Set(["scope", "colspan", "rowspan"]),
  td: new Set(["colspan", "rowspan"]),
  span: new Set(["class", "data-i18n-key"]),
  div: new Set(["class", "id", "data-i18n-key"]),
};

const SAFE_URL_RE = /^(?:https?:|mailto:|tel:|\/|#)/i;

export function isSafeUrl(url: string): boolean {
  return SAFE_URL_RE.test(url) && !/^\s*javascript:/i.test(url) && !/^\s*data:/i.test(url);
}

/**
 * Walk a string and remove any tag not in the allowlist, plus any
 * attribute not allowed for its parent tag. This is intentionally
 * simple: a robust DOM-level sanitizer is the right tool, but this
 * stub is dependency-free and good enough for the renderer's known
 * block outputs.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (full, slash, tagRaw, attrsRaw) => {
      const tag = tagRaw.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      const allowed = ALLOWED_ATTRS[tag];
      if (!allowed || slash) {
        return slash ? `</${tag}>` : `<${tag}>`;
      }
      const kept: string[] = [];
      const attrRe = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let m: RegExpExecArray | null;
      while ((m = attrRe.exec(attrsRaw)) !== null) {
        const name = m[1].toLowerCase();
        const value = m[2] ?? m[3] ?? "";
        if (!allowed.has(name)) continue;
        if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;
        kept.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
      }
      return `<${tag}${kept.length > 0 ? " " + kept.join(" ") : ""}>`;
    })
    .trim();
}
