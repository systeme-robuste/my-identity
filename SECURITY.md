# Security Policy

> **My Identity** — coordinated disclosure, transparency, RGPD/DSA compliance.
> Last updated: 2026-07-11.

## Supported versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| `0.1.x` | ✅ Active          |
| `0.0.x` | ❌ End of life     |

## Reporting a vulnerability

**Please do not file a public issue for security problems.**

Send a private email to **security@myidentity.app** with:

- Subject: `[SECURITY] <one-line description>`
- Body: reproduction steps, affected versions, suggested fix (if any)
- PGP fingerprint: `4F6A 9C12 8B3D 7E45 2A91 0D34 5B67 8E12 9F03 1A2B` (key below)

We commit to:

| Step | SLA |
| ---- | --- |
| Acknowledge your report | **≤ 24 hours** |
| Initial triage + severity rating | **≤ 72 hours** |
| Status update at the halfway mark | **≤ 14 days** |
| Patch shipped for Critical / High | **≤ 30 days** |
| Public disclosure (CVE if applicable) | **after fix is live** |

We follow [coordinated disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure): we will not pursue legal action against security researchers acting in good faith and respecting this policy.

## PGP key

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
[Full key at https://myidentity.app/.well-known/pgp-key.asc]
-----END PGP PUBLIC KEY BLOCK-----
```

## Bug bounty

We do not currently run a paid bug bounty program. Researchers who submit
valid, original, unfixed vulnerabilities are credited in our
`SECURITY_HALL_OF_FAME.md` (opt-in) and may receive a My Identity
Lifetime plan as a thank-you gift.

## Security architecture (high level)

- **Encryption at rest**: Neon Postgres (AES-256), Cloudflare R2 (AES-256)
- **Encryption in transit**: TLS 1.3 (Cloudflare), HSTS preload
- **Authentication**: HttpOnly + Secure + SameSite=Strict cookies, Argon2id
  for password hashing, optional WebAuthn passkeys
- **Authorization**: RBAC + row-level security on all multi-tenant tables
- **Rate limiting**: per-IP + per-user, sliding window in KV
- **Audit log**: append-only, retained 365 days, queryable via admin API
- **Secrets**: Wrangler Secrets for production, `.env` ignored from git
- **DSA compliance**: designated DMCA agent, transparency report at
  <https://myidentity.app/transparency>
- **RGPD compliance**: data export, account deletion, DPA available on
  request

## Out of scope

- Denial-of-service attacks (we have Cloudflare WAF + rate limiting)
- Social engineering of staff
- Self-XSS (paste-JS-into-your-own-console tricks)
- Issues affecting outdated / unmaintained browser versions
- Theoretical vulnerabilities without a working PoC

## Acknowledgements

We thank the following researchers (with their consent) for responsible
disclosures:

- *No entries yet — be the first!*

## Contact

- **Security issues**: security@myidentity.app (PGP encouraged)
- **DMCA / copyright**: dmca@myidentity.app
- **Data protection officer (DPO)**: dpo@myidentity.app
- **General contact**: hello@myidentity.app

— *Califi Mwarabu, on behalf of the My Identity team*
