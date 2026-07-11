# My Identity — Domain Setup

**Status:** ⏳ pending purchase
**Owner:** Califi Mwarabu
**Last updated:** 2026-07-11
**Article:** [PHASE1.md § Item 1](./PHASE1.md)

---

## Decision Log

| Field | Value | Decided on |
|-------|-------|------------|
| Domain | _(to be filled)_ | — |
| TLD | _.app preferred; .dev as fallback_ | 2026-07-11 |
| Registrar | Cloudflare Registrar (preferred) or Namecheap | 2026-07-11 |
| Account | `robuste.blogs@gmail.com` (Google OAuth) | 2026-07-11 |

## Registrar Account

| Field | Value |
|-------|-------|
| Provider | Cloudflare / Namecheap |
| Account email | `robuste.blogs@gmail.com` |
| 2FA enabled | ☐ yes (TOTP via 1Password) |
| Payment method | _(card type, last 4 digits — never the full number)_ |

## DNS Records (Cloudflare-managed)

These are the canonical records for the production stack. **Do not** create them in the registrar dashboard — they live in Cloudflare DNS once the domain is added to Cloudflare.

| Type | Name | Target | Proxy | Notes |
|------|------|--------|-------|-------|
| A | `@` | `192.0.2.1` (placeholder) | Proxied | Catch-all, redirects to marketing site |
| AAAA | `@` | `100::` (placeholder) | Proxied | IPv6 catch-all |
| CNAME | `api` | `my-identity-api.<subdomain>.workers.dev` | Proxied | REST API |
| CNAME | `renderer` | `my-identity-renderer.<subdomain>.workers.dev` | Proxied | SSR HTML |
| CNAME | `studio` | `my-identity-studio.pages.dev` | Proxied | Dashboard (Pages) |
| CNAME | `app` | `my-identity-studio.pages.dev` | Proxied | User-facing dashboard |
| CNAME | `status` | `myidentity.betteruptime.com` | Proxied | Status page (M3) |
| TXT | `@` | `v=spf1 include:_spf.resend.com -all` | — | SPF for Resend (Item 3) |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSq...` | — | DKIM for Resend (Item 3) |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@myidentity.app` | — | DMARC (Item 3) |
| TXT | `stripe-verification` | `stripe-site-verification=...` | — | Stripe live (Item 2) |

## Security & Best Practices

- **DNSSEC:** ON (free at Cloudflare)
- **TLS:** Full (strict) — Cloudflare → origin via authenticated origin pulls
- **HSTS:** max-age=63072000; includeSubDomains; preload (after 1 month stable)
- **Minimum TLS version:** 1.2 (1.3 preferred)
- **Authenticated Origin Pulls:** ON (mTLS between Cloudflare and Workers)
- **Browser Integrity Check:** ON
- **Hotlink Protection:** ON (for media)

## Workers Routes

After the Workers are deployed, the following routes must be configured (one per Workers project):

| Pattern | Worker | Notes |
|---------|--------|-------|
| `api.myidentity.app/*` | `my-identity-api` | REST API |
| `renderer.myidentity.app/*` | `my-identity-renderer` | SSR HTML |
| `studio.myidentity.app/*` | `my-identity-studio` | Dashboard (Pages) |
| `app.myidentity.app/*` | `my-identity-studio` | User dashboard |

## Renewal & Lifecycle

| Field | Value |
|-------|-------|
| Registered on | _(to be filled)_ |
| Expires on | _(to be filled — 1 year from registration)_ |
| Auto-renewal | ON |
| Renew cadence | 1 year, 30-day advance reminder |
| Renewal cost | ~$12-15/year (`.app`) |

## Operational Contacts

| Role | Email |
|------|-------|
| Owner | `califi@myidentity.app` _(to be set up after domain is live)_ |
| Tech admin | `tech@myidentity.app` _(to be set up)_ |
| Security | `security@myidentity.app` _(to be set up)_ |
| DMARC reports | `dmarc@myidentity.app` _(to be set up)_ |

## Next Steps

1. ☐ Y purchases the domain on Cloudflare Registrar (or Namecheap)
2. ☐ Add the domain to Cloudflare (free plan is enough)
3. ☐ Enable DNSSEC, set Full (strict) TLS
4. ☐ Create DNS records (table above)
5. ☐ Verify propagation: `dig api.myidentity.app +short`
6. ☐ Update `wrangler.toml` in `apps/api` and `apps/renderer` with the custom routes
7. ☐ Run `./scripts/bootstrap-cloudflare.sh` (Item 6)
8. ☐ Update this file with the actual values

## Troubleshooting

- **DNS not propagating after 30 min?** — Check `dig` from multiple resolvers (`1.1.1.1`, `8.8.8.8`). If only some see it, propagation in progress.
- **DNSSEC errors?** — Disable DNSSEC at registrar, re-enable after Cloudflare takes over (Cloudflare manages DS records).
- **Workers route 404?** — Verify the pattern matches (`*` wildcard required) and the Worker is deployed.

---

_Last reviewed: 2026-07-11 — Y. Status: **awaiting domain purchase**._
