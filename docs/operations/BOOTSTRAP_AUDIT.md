# Bootstrap Cloudflare — Audit

**Script:** `scripts/bootstrap-cloudflare.sh`
**Audited by:** Zapia
**Audit date:** 2026-07-11
**Verdict:** ✅ Functional with minor improvements possible.

---

## What the script does (in order)

1. Parses `--api-token` and `--account-id` flags (or detects from `wrangler whoami`)
2. Creates 2 D1 databases (`my-identity-cache`, `my-identity-render-cache`)
3. Creates 4 KV namespaces (`my-identity-sessions`, `my-identity-rate-limit`, `my-identity-audit-log`, `my-identity-render-cache`)
4. Creates 1 R2 bucket (`my-identity-media`)
5. **Skips** Workers creation (deployed via `wrangler deploy`)
6. **Skips** Pages projects (deployed via `wrangler pages deploy`)
7. Prints a summary of all created resource IDs

The script is **idempotent** — re-running skips already-created resources.

## Strengths

- ✅ Uses Cloudflare API directly via curl (no `wrangler` dependency for resource creation)
- ✅ Detects existing resources before creating (avoids 409 conflicts)
- ✅ Color output (BLUE/GREEN/YELLOW/RED) for readability
- ✅ `set -euo pipefail` for safety
- ✅ Prints final resource IDs in a copy-paste-ready format

## Issues found

### 🟡 Minor — dead code (line 114-121)

The `auth_header()` function is defined but never called. All calls use the `$CF_AUTH` variable directly (line 123).

**Recommendation:** remove `auth_header()` and inline its logic. **Not blocking.**

### 🟡 Minor — wrangler v3 compatibility (line 103, 119, 123)

`wrangler whoami --json | jq .apiToken` is no longer reliable in `wrangler` v3+. Cloudflare changed the auth model.

**Recommendation:** prefer `--api-token` flag always, or read from `CLOUDFLARE_API_TOKEN` env var. **Not blocking if user provides the token.**

### 🟢 Cosmetic — final summary doesn't include R2 (line 235-242)

The summary lists D1, KV, but not R2 (since R2 has no UUID to print — only bucket name). Easy to miss during operations.

**Recommendation:** add R2 to the summary block.

### 🟢 Cosmetic — D1 detection could be more robust (line 130)

Uses `select(.name=="$name")` which works for the current naming, but a quoting bug could break it if the name contains a `"` (won't happen in practice).

**Recommendation:** use `jq -r --arg n "$name" '.result[]? | select(.name==$n) | .uuid'` for safety.

## What the script does NOT do (and should)

- ❌ Does not configure **Workers routes** (e.g., `api.myidentity.app/*` → `my-identity-api` worker)
- ❌ Does not set **Workers secrets** (e.g., `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `DATABASE_URL`)
- ❌ Does not configure **custom domains** for Workers
- ❌ Does not enable **Cloudflare Access** (admin protection, recommended for `studio.myidentity.app`)
- ❌ Does not set up **R2 custom domain** (e.g., `media.myidentity.app`)

These are **post-bootstrap** steps that should be in a separate `bootstrap-routes.sh` and `bootstrap-secrets.sh` (or done via `wrangler`).

## Test plan

Once the script is run, verify:

```bash
# 1. List D1 databases
curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/d1/database" | jq '.result[].name'

# 2. List KV namespaces
curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/storage/kv/namespaces" | jq '.result[].title'

# 3. List R2 buckets
curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/r2/buckets" | jq '.result[].name'
```

Expected output:
- D1: `["my-identity-cache", "my-identity-render-cache"]`
- KV: `["my-identity-audit-log", "my-identity-rate-limit", "my-identity-render-cache", "my-identity-sessions"]`
- R2: `["my-identity-media"]`

## Recommended follow-ups (separate scripts)

1. **`scripts/bootstrap-routes.sh`** — creates Workers routes for the custom domain
2. **`scripts/bootstrap-secrets.sh`** — sets Workers secrets via `wrangler secret put`
3. **`scripts/bootstrap-pages.sh`** — creates the 3 Pages projects (studio, marketing, docs) and connects to Git for auto-deploy

These can be added in M1-S4 once the domain is live and the first Workers are deployed.

---

**Audit conclusion:** ship the script as-is. The minor issues can be addressed in a follow-up refactor.
