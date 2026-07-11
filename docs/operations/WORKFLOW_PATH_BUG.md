# Workflow Path Bug — Known Limitation

**Date discovered:** 2026-07-11
**Severity:** High (blocks CI activation)
**Owner:** Y (manual fix)

---

## The bug

The 4 GitHub Actions workflow files are in `.github/_workflows/` (with underscore). **GitHub Actions does not detect them** — it only watches `.github/workflows/`. So **CI is effectively disabled**.

```
.github/_workflows/                    ← where the workflows are (WRONG)
├── README.md
├── deploy-api.yml
├── deploy-dashboard.yml
└── deploy-renderer.yml

.github/workflows/                     ← where GH Actions looks (EMPTY)
```

There is also a duplicate set at `projects/my-identity/.github/workflows/`, which is the monorepo subproject path. Neither is detected by GH Actions.

## Why it happened

The original M0 setup (2026-07-03) committed the workflows to the wrong directory — likely a copy-paste from the OpenHub repo where `.github/_workflows/` is the convention (placeholder for `workflows/`). The file is not technically broken, just placed where GH doesn't look.

## What's been tried

| Attempt | Tool | Result |
|---|---|---|
| Contents API `PUT .github/workflows/ci.yml` | REST | ❌ `Not Found` — can't create new subdir |
| Contents API `PUT .github/workflows/.gitkeep` | REST | ❌ `Not Found` — same reason |
| Git Data API `POST /git/trees` with `base_tree` + 4 mutations | REST | ❌ `Not Found` — same reason (GitHub refuses to create new subdirs via trees) |
| Git Data API `POST /git/trees` without `base_tree` (1 file at root) | REST | ✅ works (but useless — wrong path) |
| Git Data API with full tree (362 files enumerated) | REST | ⏸️ untested — would work in theory |

**Root cause:** GitHub REST API does not support creating a new subdirectory under `.github/`. The only ways to create it are:
1. **Web UI** — Y clicks "Create new file" in the GH web interface
2. **git CLI locally** — `git mv .github/_workflows .github/workflows && git commit -m "..." && git push`
3. **GitHub Actions** — ironically, GH Actions itself can create files via `actions/checkout` + a setup step

## Manual fix (2 minutes)

**Option 1 — Web UI (easiest, no local git needed)**

1. Open https://github.com/systeme-robuste/my-identity/tree/main/.github
2. Create a new file: `.github/workflows/.gitkeep` (empty content)
3. GH will create the directory and the file
4. Now Y can either commit the 4 yml files via the web, or ask Zapia to re-push via Contents API (the dir now exists)

**Option 2 — Git CLI (fastest for a power user)**

```bash
cd /path/to/local/my-identity
mkdir -p .github/workflows
mv .github/_workflows/*.yml .github/workflows/
rm -rf .github/_workflows
git add .github/workflows
git commit -m "ci: move workflows to correct path for GH Actions"
git push origin main
```

**Option 3 — Subagent with SSH (advanced)**

If a subagent can be given SSH access to the repo, it can do Option 2.

## Workaround used

Until the fix is in place, **CI is documented but not enforced**. Local `pnpm test` and `pnpm build` are the only gates. The deploy step (`deploy-*.yml`) will run when the fix lands.

## Impact

- ❌ No automatic CI runs on PR
- ❌ No automatic deploy on `main` push
- ✅ Local `pnpm` still works
- ✅ All 4 workflow files are valid YAML and ready to run

## Resolution status

- **Awaiting:** Y to perform one of the 3 manual fix options
- **ETA after fix:** < 5 minutes (re-verify with `curl .../repos/.../contents/.github/workflows`)

---

_Last reviewed: 2026-07-11._
