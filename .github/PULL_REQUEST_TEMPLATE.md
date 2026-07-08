## Summary

<!-- One-paragraph description of what this PR does and why. -->

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Refactor / chore
- [ ] Security fix

## Phase

- [ ] Phase 1 — MVP
- [ ] Phase 2 — Beta
- [ ] Phase 3 — GA
- [ ] Post-GA

## Affected surface

- [ ] `apps/api`
- [ ] `apps/renderer`
- [ ] `apps/dashboard`
- [ ] `apps/marketing`
- [ ] `apps/docs`
- [ ] `packages/shared`
- [ ] `packages/db` (Drizzle schema / migration)
- [ ] `packages/ui`
- [ ] `packages/config`
- [ ] `docs/`
- [ ] `roadmap/`
- [ ] CI / deploy workflows

## DB migration

- [ ] No DB change
- [ ] New migration added to `packages/db/migrations/`
- [ ] I have run `pnpm db:generate` and committed the result

## How to test

<!-- Step-by-step instructions for the reviewer. -->

## Checklist

- [ ] My code follows the project's style guide (`pnpm lint`)
- [ ] I have added tests that prove my fix/feature works (`pnpm test:unit`)
- [ ] New and existing unit tests pass locally
- [ ] I have updated relevant documentation
- [ ] My changes generate no new warnings (`pnpm typecheck`)
- [ ] I have checked for breaking changes and noted them above
- [ ] No secrets, tokens, or `.env` files with real values are included
