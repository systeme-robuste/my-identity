# @my-identity/marketing

The marketing site at `myidentity.app`. React 18 + Vite + Tailwind.

## Status

🚧 **Initial scaffold only.** Sections, i18n content, and components are stubbed. The visual reference (single-HTML 0-JS version) lives at `public/reference-landing.html` — it is the source of truth for copy and design.

## Architecture

- **React 18** with hooks (no class components)
- **Vite 5** for dev server and build
- **Tailwind CSS** with a dark-first theme (`bg-mi-bg`, `text-mi-fg`)
- **i18n**: fr (default), en, es — copy in `src/content/<lang>.json`
- **URL-based locale switch**: `?lang=fr|en|es` (no JS required for the switcher itself)

## Sections

1. **Nav** — logo + 4 links + "Commencer" CTA
2. **Hero** — "Au-delà de Carrd. Au-delà de Systeme.io. Au-delà de tout."
3. **Features** — "Tout ce que Carrd manque" (multi-page, CMS, A/B, etc.)
4. **Capabilities** — 6 feature cards
5. **Pricing** — Free / Pro $9/yr / Business $49/yr, monthly-annual toggle, USD
6. **Calculator** — input your stack → see what you'd save
7. **CaseStudy** — 1 founder, before/after, $ numbers
8. **FAQ** — 8 questions (in French)
9. **CTA** — final call to action
10. **Footer** — links + legal

## Local development

```bash
pnpm --filter @my-identity/marketing dev
# → http://localhost:5174
```

## Deployment

Deployed to **Cloudflare Pages** via `.github/workflows/deploy-dashboard.yml` (renamed in v2). The published reference version is the single-HTML 0-JS site at https://site.zapia.com/7bog68jb.
