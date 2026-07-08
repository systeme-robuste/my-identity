/**
 * @my-identity/renderer
 *
 * Cloudflare Worker that serves published sites at their public URL.
 *
 *   GET /health                  — liveness
 *   GET /sites/:slug             — site root (resolves :index page)
 *   GET /sites/:slug/*           — any sub-path on the site
 *
 * Pages are fetched from the API (`/v1/api/sites/:slug/pages/:pageSlug`)
 * and cached in the `RENDER_CACHE` KV namespace. The render is pure
 * string assembly: HTML + inlined per-site CSS bundle. No JS is shipped
 * by default. Site-level custom `<head>` and `<footer>` HTML is inlined
 * verbatim from the database.
 */

import { Hono } from "hono";
import { renderPage } from "./render/html.ts";
import { getCachedPage, setCachedPage } from "./lib/cache.ts";
import { fetchPage, fetchSiteSummary } from "./lib/fetch.ts";

export interface Env {
  ENVIRONMENT: "development" | "staging" | "production";
  APP_NAME: string;
  APP_VERSION: string;
  API_BASE_URL: string;
  CACHE_TTL_SECONDS: string;
  CACHE_STALE_SECONDS: string;
  RENDER_CACHE: KVNamespace;
  CACHE_DB: D1Database;
}

type RendererContext = { Bindings: Env; executionCtx?: ExecutionContext };

const app = new Hono<RendererContext>();

app.get("/health", (c) =>
  c.json({ status: "ok", version: c.env.APP_VERSION, environment: c.env.ENVIRONMENT })
);

// 404 for the root of the renderer itself
app.get("/", (c) => c.text("My Identity Renderer — serve published sites at /sites/:slug", 404));

// Resolve a request for `/sites/:slug/<path>` to a rendered page.
app.get("/sites/:slug/*", async (c) => {
  const slug = c.req.param("slug");
  const rest = c.req.path.replace(/^\/sites\/[^/]+/, "") || "/";
  const pageSlug = rest === "/" || rest === "" ? "index" : rest.replace(/^\//, "").replace(/\/$/, "");
  const locale = c.req.query("lang") ?? null;
  const cacheKey = `${slug}:${locale ?? "default"}:${pageSlug}`;

  // 1. Stale-while-revalidate read
  const cached = await getCachedPage(c.env.RENDER_CACHE, c.env.CACHE_DB, cacheKey);
  if (cached && !cached.stale) {
    return new Response(cached.html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "X-Cache": "HIT" },
    });
  }

  // 2. Fetch fresh from API
  const [page, site] = await Promise.all([
    fetchPage(c.env.API_BASE_URL, slug, pageSlug, locale),
    fetchSiteSummary(c.env.API_BASE_URL, slug),
  ]);
  if (!site) return c.text("Not found", 404);
  if (!page) return c.text("Page not found", 404);

  const html = renderPage({ site, page, locale: locale ?? site.locale });

  // 3. Persist to cache (fire and forget when executionCtx is available)
  const persist = setCachedPage(c.env.RENDER_CACHE, c.env.CACHE_DB, cacheKey, html, Number(c.env.CACHE_TTL_SECONDS), Number(c.env.CACHE_STALE_SECONDS));
  if (c.executionCtx) {
    c.executionCtx.waitUntil(persist);
  } else {
    await persist;
  }

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Cache": cached ? "STALE" : "MISS" },
  });
});

export default app;
