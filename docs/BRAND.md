# My Identity — Brand Guidelines

> **Source of truth** for design tokens, voice & tone, accessibility.
> Anyone touching the marketing site, dashboard, or docs must follow this.
> Last updated: 2026-07-11.

---

## 1. Design tokens

### Colors

| Token | Value | Usage |
| ----- | ----- | ----- |
| `--brand-primary` | `#0A0A0A` | Body text, dark backgrounds |
| `--brand-accent` | `#F5C518` | CTAs, highlights, link hover |
| `--brand-bg` | `#FFFFFF` | Default page background |
| `--brand-bg-alt` | `#F8F9FA` | Section dividers, card surfaces |
| `--brand-text` | `#0A0A0A` | Body |
| `--brand-text-muted` | `#6B7280` | Captions, helper text |
| `--brand-border` | `#E5E7EB` | Inputs, dividers |
| `--brand-success` | `#10B981` | Success toasts, "online" pills |
| `--brand-warning` | `#F59E0B` | Warnings, degraded states |
| `--brand-danger` | `#EF4444` | Errors, destructive actions |
| `--brand-info` | `#3B82F6` | Info banners, links |

**Contrast** — all text/background pairs meet WCAG AA (4.5:1) and AAA (7:1)
for body text. Verified with `axe-core` in CI.

### Typography

- **Display / Headings**: `Inter`, system-ui fallback, `font-weight: 700`
- **Body**: `Inter`, system-ui fallback, `font-weight: 400`
- **Code / Mono**: `JetBrains Mono`, monospace fallback
- **Base size**: 16px / 1rem
- **Scale**: 1.125 (Major Second) — `1rem`, `1.125rem`, `1.266rem`, `1.424rem`, `1.602rem`, `1.802rem`, `2.027rem`, `2.281rem`, `2.566rem`, `2.887rem`
- **Line height**: 1.5 body, 1.2 headings
- **Tracking**: `-0.02em` on h1/h2 for tighter, modern feel

### Spacing

4px base unit. Use the Tailwind scale: `0`, `1` (4px), `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px), `12` (48px), `16` (64px), `24` (96px), `32` (128px).

### Radius

| Token | Value | Usage |
| ----- | ----- | ----- |
| `--radius-sm` | `4px` | Tags, badges |
| `--radius-md` | `8px` | Inputs, buttons |
| `--radius-lg` | `16px` | Cards, modals |
| `--radius-full` | `9999px` | Pills, avatars |

### Shadow

- `--shadow-sm`: `0 1px 2px rgba(0,0,0,0.05)`
- `--shadow-md`: `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)`
- `--shadow-lg`: `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)`

### Motion

- `ease-standard`: `cubic-bezier(0.4, 0, 0.2, 1)` (default)
- `ease-decelerate`: `cubic-bezier(0, 0, 0.2, 1)` (enter)
- `ease-accelerate`: `cubic-bezier(0.4, 0, 1, 1)` (exit)
- Durations: `150ms` (small), `250ms` (medium), `400ms` (large)
- Respect `prefers-reduced-motion` — disable non-essential animation

---

## 2. Logo

- **Wordmark** "My Identity" with a single dot accent over the "i" in gold (`#F5C518`)
- **Icon** (square) — capital M inside a rounded square, monochrome
- **Clear space** = `2x` the height of the dot
- **Minimum size** — wordmark: 96px wide, icon: 24px
- **On dark backgrounds** — invert: white wordmark, gold dot
- **Don't**: stretch, recolor the dot, place on busy backgrounds

Full logo files in `apps/marketing/public/brand/` (PNG, SVG, PDF).

---

## 3. Voice & tone

### We are

- **Confident, not cocky** — we ship, we say so, but we let the product speak
- **Plain-spoken** — short sentences, no jargon, no fluff
- **Sovereign** — your data, your site, your rules. We mean it.
- **Helpful** — every error message tells the user what to do next

### We are not

- "Disruptive", "synergistic", "best-in-class", "revolutionary"
- We don't use emoji in product UI (we do use them in marketing sparingly)
- We don't talk down to the user. Ever.

### Example copy

| ❌ Don't | ✅ Do |
| -------- | ----- |
| "Leverage our cutting-edge platform to unlock synergies" | "Build a site. Publish. Done." |
| "Something went wrong" | "We couldn't save your changes. Check your connection and try again." |
| "Revolutionary AI-powered solution" | "Mistral writes your bio. You approve it." |

---

## 4. Accessibility (WCAG 2.2 AA minimum)

- **Keyboard**: every interactive element reachable, visible focus ring (`outline: 2px solid var(--brand-accent)`)
- **Screen reader**: ARIA labels on icon-only buttons, `role="alert"` on toasts
- **Color**: never the only signal (use icon + color for state)
- **Motion**: `prefers-reduced-motion` respected
- **Forms**: explicit `<label>`, inline error text linked via `aria-describedby`
- **Skip link**: `<a href="#main">Skip to content</a>` as first focusable element
- **Contrast**: verified in CI with `axe-core`, target 0 violations

---

## 5. Iconography

- Lucide icons (https://lucide.dev) — open-source, consistent stroke
- Stroke width: `1.5px`, 24×24 viewbox by default
- Color: inherits `currentColor`

---

## 6. Imagery

- **Photography**: people at work, hands on keyboards, real environments. No stock-photo "diversity grid".
- **Illustrations**: linear, monochrome with single accent color
- **Screenshots**: taken in real product, never mocked, always annotated
- **Aspect ratios**: 16:9 (hero), 4:3 (features), 1:1 (avatars, OG cards)

---

## 7. Don'ts

- ❌ Don't use a colour outside the palette
- ❌ Don't use a typeface outside Inter / JetBrains Mono
- ❌ Don't put a coloured "i" dot anywhere else
- ❌ Don't claim "100% private" or "military-grade encryption"
- ❌ Don't add emoji to product UI
- ❌ Don't ship a feature without an empty state, loading state, and error state

---

*Questions / additions? Open a PR against this file. Owner: Califi Mwarabu.*
