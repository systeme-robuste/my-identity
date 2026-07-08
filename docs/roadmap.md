# Roadmap

> 3 phases to GA, 9 months total. See the per-phase docs for detailed milestones.

## Phase 1 — MVP (Foundations) · Months 1–3

**Goal:** internal + closed alpha. End-to-end vertical slice: signup → create site → multi-page edit → publish → visit on a custom domain. RGPD-compliant from day 1.

See [`/roadmap/phase-1-mvp.md`](../roadmap/phase-1-mvp.md).

Highlights:
- Auth (email + password, OAuth stub)
- Sites, pages, blocks
- Native CMS (collections + entries)
- Forms + form submissions
- Email (Resend)
- Edge SSR renderer
- 5 locales (fr, en, es, de, pt)
- USD pricing wired to Stripe
- RGPD export + delete endpoints
- Dashboard with 10 main sections (stubs for Phase 2)
- Marketing site (the one at <https://site.zapia.com/7bog68jb>)

## Phase 2 — Beta (Scale) · Months 4–6

**Goal:** public beta. Add e-commerce, memberships, automations, A/B testing, AI workflows, observability.

See [`/roadmap/phase-2-beta.md`](../roadmap/phase-2-beta.md).

Highlights:
- Products, orders, refunds
- Members + gated content
- A/B testing (edge-bucketed, statistically valid)
- Automations (event-driven workflows, Mistral-backed)
- Webhooks (incoming + outgoing)
- API keys + public REST API
- Observability (Sentry, OTel)
- Public marketing site
- Docs site (Astro + Starlight)
- Onboarding (4-step wizard)
- Help center

## Phase 3 — GA (Public launch) · Months 7–9

**Goal:** public launch, billing live, marketplace foundations.

See [`/roadmap/phase-3-ga.md`](../roadmap/phase-3-ga.md).

Highlights:
- Hardening (load test 1M req/min, 50k concurrent renders)
- Compliance (DSA statement of reasons, DMCA agent registration)
- Template marketplace (Phase 3.1)
- GraphQL gateway (Phase 3.2)
- Mobile editor (React Native, Phase 3.3)
- Bug bounty program
- SOC 2 Type I (target)
- Public status page

## Tracking

- GitHub milestones: `Phase 1 — MVP (Foundations)`, `Phase 2 — Beta (Scale)`, `Phase 3 — GA (Public launch)`
- GitHub labels: `phase-1-mvp`, `phase-2-beta`, `phase-3-ga`
- Progress: see the GitHub Projects board
