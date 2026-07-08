# Contributing

Thanks for your interest in My Identity. This is a young project, and we welcome thoughtful contributions.

## Code of conduct

Be respectful. Assume good faith. We follow the [Contributor Covenant](https://www.contributor-covenant.org/) (full text to be added before public launch).

## How to contribute

1. **Find an issue** to work on. Look for `good first issue` or `help wanted` labels, or open one first to discuss.
2. **Claim it** by leaving a comment ("I'll take this"). A maintainer will assign it.
3. **Fork & branch** from `main` (or a release branch for Phase 3 work).
4. **Implement** the change. Follow the conventions in [`docs/development.md`](./development.md).
5. **Test** locally: `pnpm lint && pnpm typecheck && pnpm test:unit`.
6. **Open a PR** using the [PR template](../.github/PULL_REQUEST_TEMPLATE.md). Link the issue with `Closes #123`.
7. **Iterate** on review feedback. Keep the PR scope small — one concern per PR.

## Commit message format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add collection reordering endpoint
fix(dashboard): prevent double-submit on publish
docs: clarify RGPD deletion grace period
chore(db): regenerate migration after schema tweak
```

Breaking changes must include a `!` and a `BREAKING CHANGE:` footer:

```
feat(api)!: rename /sites/:id/pages to /sites/:id/trees

BREAKING CHANGE: clients must call /trees instead of /pages. 12-month
overlap window during which /pages still works.
```

## Coding conventions

- **TypeScript strict** everywhere. No `any`. Use `unknown` + type guards.
- **Zod** for all input validation (shared in `packages/shared`).
- **Named exports** preferred; default exports only for React components.
- **JSDoc** on every exported function: a one-line summary, `@param`, `@returns`, `@throws` if relevant.
- **No secrets in code.** Use env vars. Use `.env.example` to document them.
- **i18n first**: user-facing strings in the dashboard and renderer go through the i18n keys, not hard-coded English/French.

## Pull request checks

CI runs on every PR:
- Lint (ESLint, Prettier check)
- Typecheck (`tsc --noEmit`)
- Unit tests (Vitest)
- Build (each app)

A maintainer review is required before merge. For changes touching `packages/db`, we additionally require a migration file and a Neon dry-run.

## Reporting security issues

**Do not** open a public issue. Email <security@myidentity.app> (PGP key on the website). See [`security.md`](./security.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE).
