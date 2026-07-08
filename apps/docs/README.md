# @my-identity/docs

Documentation site at `docs.myidentity.app`. Astro + Starlight.

## Status

🚧 **Initial scaffold only.** Content pages are stubbed with real markdown skeletons. Implementation is part of **Phase 1 — MVP**.

## Local development

```bash
pnpm --filter @my-identity/docs dev
# → http://localhost:4321
```

## Structure

- `src/content/docs/fr/` — French (default)
- `src/content/docs/en/` — English

## Deployment

Deployed to **Cloudflare Pages** via `.github/workflows/deploy-docs.yml` (to be added in Phase 1).
