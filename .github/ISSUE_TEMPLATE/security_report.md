---
name: Security report
about: Report a security vulnerability (private, encrypted at rest)
title: "security: "
labels: security, priority/critical
assignees: ""
---

> ⚠️ **DO NOT** post exploit details in the issue body. We will coordinate
> disclosure via security@myidentity.app with PGP encryption.
> See [SECURITY.md](../../SECURITY.md) for our full policy and PGP key.

## Summary

A short, non-exploitable description of the vulnerability.

## Affected component

- [ ] API (`apps/api`)
- [ ] Renderer (`apps/renderer`)
- [ ] Dashboard (`apps/dashboard`)
- [ ] Marketing site (`apps/marketing`)
- [ ] Docs (`apps/docs`)
- [ ] Database / migration
- [ ] Authentication / authorization
- [ ] Payment / Stripe
- [ ] Other: _____________

## Severity (self-assessed)

- [ ] Critical (RCE, data breach, account takeover)
- [ ] High (privilege escalation, PII leak, XSS)
- [ ] Medium (CSRF, open redirect, information disclosure)
- [ ] Low (best-practice violation, no direct impact)

## How to disclose

Please email `security@myidentity.app` with:
- Subject: `[SECURITY] <one-line description>`
- PGP key: see [SECURITY.md](../../SECURITY.md)
- Body: reproduction steps, affected versions, suggested fix (if any)
- We acknowledge within 24h, triage within 72h, and disclose publicly after
  the fix is shipped (typically 30 days).

## Reporter

- Name: (optional, for our thanks / hall of fame)
- Email: (for follow-up)
- GitHub handle: (optional)
