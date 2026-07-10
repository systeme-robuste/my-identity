# .github/_workflows/ (placeholder)

GitHub's Contents API refuses to create files inside `.github/workflows/`
(returns 404 Not Found). To ship the CI/CD YAML files, they have been
uploaded here under `_workflows/` (with a leading underscore).

## Restore the standard path

Once you have local git access (or via a subagent that has `git`):

```bash
cd projects/my-identity
mkdir -p .github/workflows
mv .github/_workflows/ci.yml            .github/workflows/
mv .github/_workflows/deploy-api.yml    .github/workflows/
mv .github/_workflows/deploy-dashboard.yml .github/workflows/
mv .github/_workflows/deploy-renderer.yml  .github/workflows/
rmdir .github/_workflows
git add .github/workflows
git commit -m "ci: restore standard workflows path"
git push
```

## Trigger events

- `ci.yml` — runs on push to main and on every PR (lint, typecheck, test).
- `deploy-api.yml` — deploys `apps/api` to production on tag `v*`.
- `deploy-dashboard.yml` — deploys `apps/dashboard` to production on tag `v*`.
- `deploy-renderer.yml` — deploys `apps/renderer` to Cloudflare Workers.

Until moved, these files exist on the default branch but GitHub Actions
will not detect them. They are tracked here for completeness and to
preserve the source of truth.
