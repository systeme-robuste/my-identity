# Templates — 8 sites de référence

> My Identity embarque 8 templates prêts à l'emploi, conçus pour la performance (Lighthouse 100/100/100/100 par défaut) et l'édition sans JS. Chaque template est un **bundle statique** (HTML + CSS inliné) servi par le renderer edge.

---

## Les 8 templates

### 1. **Aura** — Portfolio minimal
**Slug** : `aura`
**Catégorie** : Portfolio · Créatif
**Pour qui** : Photographes, designers, illustrateurs, artisans
**Pages** : 5 (Home, Work, About, Contact, Journal)
**Blocks** : Hero (image plein écran), Gallery (grid CSS), About (2 colonnes), Testimonials, Contact form
**Style** : Typographie serif + images, scroll-snap, dark mode auto
**Lighthouse** : 100/100/100/100

### 2. **Helix** — Agence / Studio
**Slug** : `helix`
**Catégorie** : Agence · Services
**Pour qui** : Agences, studios de design, cabinets de conseil
**Pages** : 7 (Home, Services, Projects, About, Team, Blog, Contact)
**Blocks** : Hero (split image+text), Services (cards), Case studies, Team grid, Blog
**Style** : Bold typography, accent color, 12-column grid
**Lighthouse** : 100/100/100/100

### 3. **Lumen** — SaaS landing
**Slug** : `lumen`
**Catégorie** : SaaS · Product
**Pour qui** : Founders, startups, indie hackers
**Pages** : 5 (Home, Pricing, Features, Docs link, Signup CTA)
**Blocks** : Hero (with CTA), Features (3-column), Pricing (3 tiers), FAQ, Footer
**Style** : Conversion-optimized, single accent color, sticky CTA
**Lighthouse** : 100/100/100/100

### 4. **Scholar** — Educateur / Formateur
**Slug** : `scholar`
**Catégorie** : Education · Course creator
**Pour qui** : Formateurs, coachs, professeurs, écoles en ligne
**Pages** : 6 (Home, Courses, About, Testimonials, FAQ, Contact)
**Blocks** : Hero (with course preview), Course cards, Instructor bio, Pricing
**Style** : Friendly, focus on content, large readable text
**Lighthouse** : 100/100/100/100

### 5. **Codex** — Documentation / Wiki
**Slug** : `codex`
**Catégorie** : Documentation · API
**Pour qui** : Développeurs, projets open-source, équipes tech
**Pages** : Sidebar layout (1 page, many sections)
**Blocks** : Search, TOC, Code blocks, Callouts, Versioning
**Style** : Monospace accents, syntax highlight CSS, dark mode
**Lighthouse** : 100/100/100/100

### 6. **Vitrine** — Petit commerce / Boutique
**Slug** : `vitrine`
**Catégorie** : E-commerce · Boutique
**Pour qui** : Artisans, e-commerce simple, marques locales
**Pages** : 6 (Home, Shop, Product, About, Cart, Contact)
**Blocks** : Hero, Product grid, Product detail, Cart, Checkout (Stripe)
**Style** : Clean, product-first, gallery-led
**Lighthouse** : 100/100/100/100 (avec images optimisées)

### 7. **Quill** — Blog / Magazine
**Slug** : `quill`
**Catégorie** : Blog · Editorial
**Pour qui** : Blogueurs, journalistes, magazines, newsletters
**Pages** : 4 (Home, Article, Archive, About)
**Blocks** : Hero, Article card, Article reading view (typography), Newsletter
**Style** : Serif body, generous spacing, reading-optimized
**Lighthouse** : 100/100/100/100

### 8. **Cercle** — Communauté / Membership
**Slug** : `cercle`
**Catégorie** : Community · Membership
**Pour qui** : Créateurs de communautés, cours privés, masterminds
**Pages** : 5 (Home, Inside, Members, Pricing, Login)
**Blocks** : Hero (locked CTA), Member grid, Benefits, Pricing (with auth gate)
**Style** : Exclusive, dark by default, member-only sections
**Lighthouse** : 100/100/100/100

---

## Structure d'un template

Chaque template est un dossier dans `apps/renderer/templates/<slug>/` :

```
templates/
  aura/
    config.json          # metadata (name, category, pages, blocks)
    tokens.css           # design tokens (colors, fonts, spacing)
    pages/
      home.html          # HTML statique avec placeholders {{title}}, {{blocks}}
      work.html
      ...
    blocks/
      hero.html
      gallery.html
      ...
    assets/
      fonts/             # si custom
      images/            # placeholders open-source
```

## Configuration (`config.json`)

```json
{
  "slug": "aura",
  "name": "Aura",
  "category": "portfolio",
  "description": "Portfolio minimal pour créatifs",
  "thumbnail": "https://cdn.myidentity.app/templates/aura/thumb.webp",
  "version": "1.0.0",
  "blocks": ["hero", "gallery", "text", "form"],
  "pages": ["home", "work", "about", "contact"],
  "tokens": {
    "color.primary": "#0f172a",
    "color.accent": "#f59e0b",
    "font.body": "Inter",
    "font.heading": "Playfair Display"
  },
  "pricing": {
    "free": true,
    "pro": true,
    "business": true
  }
}
```

## Rendu côté renderer

Le renderer fait :
1. Charge `config.json` à l'init (cache KV).
2. Pour chaque requête, charge la page HTML depuis `pages/<slug>.html`.
3. Remplace `{{blocks.X}}` par le HTML du block X (depuis `blocks/X.html`).
4. Remplace `{{site.title}}` par les vraies données (titre, owner, custom domain).
5. Injecte les `tokens.css` + un `<style>` inliné avec les variables CSS du site.
6. **0 JavaScript** : aucun script n'est ajouté. Tout est pur HTML + CSS.

## Lancer un template localement

```bash
# Démarrer docker (postgres)
docker compose up -d postgres

# Démarrer le renderer
cd apps/renderer
wrangler dev

# Visiter http://localhost:8788/sites/aura (ou un autre slug)
```

## Personnalisation

Tous les templates sont éditables via le dashboard :
- **Tokens** : couleurs, fonts, spacing (sliders + hex inputs)
- **Blocks** : réordonnancement, ajout/suppression, contenu
- **Pages** : ajout de pages (jusqu'à 25 en Pro, illimité en Business)
- **Domaines custom** : un CNAME, c'est tout

## Critères de qualité

Pour ajouter un template à My Identity, il doit :
- ✅ Atteindre Lighthouse 100/100/100/100 sur la démo
- ✅ Charger en < 50 Ko total (HTML + CSS inlinés, hors images)
- ✅ Être 0-JS par défaut
- ✅ Supporter dark mode automatique via `prefers-color-scheme`
- ✅ Être responsive (320px → 1920px+)
- ✅ Supporter les principaux navigateurs (2 dernières versions majeures)
- ✅ Être traduisible (i18n via `<html lang>` + variables de template)
- ✅ Être accessible (WCAG 2.1 AA minimum)
- ✅ Avoir un design original (pas copié de Carrd, Webflow, Framer)

## Roadmap templates (Phase 1 → 3)

- **Phase 1 (MVP)** : 8 templates ci-dessus + 1 template "blank"
- **Phase 2 (Beta)** : marketplace communautaire (uploader son propre template)
- **Phase 3 (GA)** : 30+ templates, AI-generated templates (Mistral), template import depuis Figma

---

*Document vivant. Dernière mise à jour : 2026-07-11 04:15 WAT.*
