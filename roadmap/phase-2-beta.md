# Phase 2: Beta (months 5-7, target 2026-12)

## Goal
Turn My Identity from a "page builder" into a true **platform** — automations, AI, analytics. Drive the conversion rate from 10% (free → Pro) to 15%.

## Deliverables

### 1. Automations
- [ ] 5 triggers: form.submit, cms.create, cms.update, payment.success, signup.create, manual
- [ ] 5 actions: email.send, webhook.fire, cms.update, tag.add, http.request
- [ ] Conditions (AND/OR)
- [ ] Limits: 10 active rules/site (Pro), 100 (Business)
- [ ] Delay: 1s (Pro) or 1min cron (Business)
- [ ] Anti-loop detection
- [ ] Run logs (100 most recent)
- [ ] Retry on failure (3 attempts, exponential backoff)

### 2. AI (Mistral integration)
- [ ] Text generation: blog post, email subject, social post, headline, summary, translate
- [ ] Image alt text generation
- [ ] Limits: 5,000/mo (Pro), 50,000/mo (Business)
- [ ] Overage: $0.001/gen (Pro), $0.0005 (Business)
- [ ] 20 starter prompt templates
- [ ] Cost tracking per request
- [ ] Anomaly detection (suspicious usage → soft cap)
- [ ] In-app prompt editor
- [ ] Fallback to local Llama 3 8B (when Mistral down)

### 3. Analytics
- [ ] Pageviews (cookie-less, RGPD-compliant)
- [ ] Unique visitors (hashed IP)
- [ ] Top pages, referrers, countries
- [ ] Conversion events (custom: form.submit, payment.success)
- [ ] Funnels (Pro+)
- [ ] Real-time (last 5 min)
- [ ] CSV export (Pro+)
- [ ] 90-day retention (Pro), 1-year (Business)
- [ ] Cloudflare Analytics Engine integration

### 4. A/B Testing
- [ ] 2-variant tests (headline, CTA, image)
- [ ] Statistical significance calculator
- [ ] Auto-pick winner after 1,000 visitors
- [ ] Result history
- [ ] Per-page tests

### 5. Webhooks
- [ ] Outgoing: site owner registers URL, HMAC-SHA256 signed
- [ ] 5 endpoints (Pro), 20 (Business)
- [ ] Retry: 3 attempts, exponential backoff
- [ ] Dead letter queue
- [ ] Incoming: form submissions, payment events
- [ ] Webhook logs in dashboard

### 6. Team
- [ ] 3 roles: owner, editor, viewer
- [ ] Invite by email
- [ ] Permissions per site
- [ ] 3 members (Pro), 10 (Business)
- [ ] Audit log per team action

### 7. API
- [ ] REST API v1 (full coverage)
- [ ] OpenAPI 3.1 spec
- [ ] Per-site API keys
- [ ] Rate limit: 60/min (Free), 1,000/min (Pro), 10,000/min (Business)
- [ ] SDK: TypeScript, Python

### 8. Zapier integration
- [ ] Zapier app: triggers (form.submit, payment.success, new CMS entry)
- [ ] Zapier app: actions (create CMS entry, send email, add subscriber)
- [ ] Public listing
- [ ] Make.com (Integromat) integration
- [ ] n8n community node

### 9. Multi-currency
- [ ] EUR, GBP, CDF, NGN, KES, ZAR
- [ ] Stripe multi-currency
- [ ] Per-site currency (not per-product)
- [ ] Auto-conversion in dashboard

### 10. Africa features
- [ ] SMS notifications (Twilio)
- [ ] Mobile money (M-Pesa, Airtel Money) — beta
- [ ] Low-bandwidth mode (CSS-only fallback)
- [ ] African edge PoP optimization (Lagos, Cape Town, Nairobi)
- [ ] African data residency (Cloudflare Regional Services)

### 11. Marketing
- [ ] 20+ additional templates
- [ ] Template marketplace (free + paid)
- [ ] Documentation site (Docusaurus)
- [ ] Blog (CMS-driven)
- [ ] Changelog
- [ ] Video tutorials (YouTube)
- [ ] Affiliate program

### 12. Compliance
- [ ] SOC 2 Type 1 audit
- [ ] Penetration test
- [ ] Bug bounty program (HackerOne)
- [ ] RGPD data processing agreement (DPA) template
- [ ] Terms of service v2
- [ ] Privacy policy v2

## Success criteria

- 500 paying users
- 15% free → Pro conversion
- $5,000 MRR
- 95% gross margin
- 99.95% uptime
- 4.6/5 user rating
- 50,000 AI generations/month
- 10,000 automations runs/month

## Out of scope (Phase 2)

- White-label for agencies
- Mobile app
- Course player
- Native booking
- Community features
