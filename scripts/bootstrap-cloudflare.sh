#!/usr/bin/env bash
# bootstrap-cloudflare.sh
# My Identity — Bootstrap Cloudflare infrastructure
# Creates: Workers (api + renderer), D1 (cache), R2 (media), KV (sessions, rate-limit, audit)
# Usage: ./scripts/bootstrap-cloudflare.sh [--api-token <token>] [--account-id <id>]
#
# Prerequisites:
#   1. Cloudflare account created (https://dash.cloudflare.com/sign-up)
#   2. API token with: Account.Workers:Edit, Account.D1:Edit, Account.R2:Edit, Account.KV:Edit
#   3. wrangler installed: npm i -g wrangler
#
# This script is idempotent: re-running it skips already-created resources.

set -euo pipefail

# --- Color helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "${BLUE}▶ $*${NC}"; }
ok() { echo -e "${GREEN}✓ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
err() { echo -e "${RED}✗ $*${NC}"; }

# --- Parse args ---
API_TOKEN=""
ACCOUNT_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-token) API_TOKEN="$2"; shift 2 ;;
    --account-id) ACCOUNT_ID="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--api-token <token>] [--account-id <id>]"
      echo ""
      echo "If --api-token and --account-id are not provided, uses 'wrangler whoami' output."
      exit 0
      ;;
    *) err "Unknown arg: $1"; exit 1 ;;
  esac
done

# --- Preflight ---
step "Preflight: checking dependencies..."
command -v wrangler >/dev/null 2>&1 || { err "wrangler not found. Install: npm i -g wrangler"; exit 1; }
command -v curl >/dev/null 2>&1 || { err "curl not found"; exit 1; }
command -v jq >/dev/null 2>&1 || { err "jq not found. Install: apt install jq (or brew install jq)"; exit 1; }
ok "Dependencies OK"

# --- Preflight: env vars ---
# Reject early with a clear message if the user forgot to pass credentials
# AND has no wrangler login on this machine. We allow either path (flag or
# env var) so CI can use CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
# directly without --api-token / --account-id.
step "Preflight: checking env vars..."
ENV_VARS_OK=1
if [[ -z "$API_TOKEN" && -z "$CLOUDFLARE_API_TOKEN" ]]; then
  if ! wrangler whoami >/dev/null 2>&1; then
    err "Missing Cloudflare credentials. Provide one of:"
    err "  --api-token <token>"
    err "  CLOUDFLARE_API_TOKEN=<token> env var"
    err "  OR run 'wrangler login' on this machine"
    ENV_VARS_OK=0
  fi
fi
if [[ -z "$ACCOUNT_ID" && -z "$CLOUDFLARE_ACCOUNT_ID" ]]; then
  if ! wrangler whoami >/dev/null 2>&1; then
    err "Missing Cloudflare account ID. Provide one of:"
    err "  --account-id <id>"
    err "  CLOUDFLARE_ACCOUNT_ID=<id> env var"
    err "  OR run 'wrangler whoami' to detect it automatically"
    ENV_VARS_OK=0
  fi
fi
if [[ $ENV_VARS_OK -eq 0 ]]; then
  exit 2
fi
# Backfill from env vars if the user prefers env-based config.
API_TOKEN="${API_TOKEN:-$CLOUDFLARE_API_TOKEN}"
ACCOUNT_ID="${ACCOUNT_ID:-$CLOUDFLARE_ACCOUNT_ID}"
ok "Env vars OK"

# --- Auth check ---
step "Auth: checking wrangler login..."
if [[ -z "$API_TOKEN" ]]; then
  if wrangler whoami >/dev/null 2>&1; then
    ok "Already logged in to Cloudflare via wrangler"
  else
    warn "Not logged in. Run: wrangler login"
    exit 1
  fi
else
  export CLOUDFLARE_API_TOKEN="$API_TOKEN"
  ok "Using API token from --api-token"
fi

# --- Get account ID ---
if [[ -z "$ACCOUNT_ID" ]]; then
  step "Detecting account ID from wrangler..."
  ACCOUNT_ID=$(wrangler whoami --json 2>/dev/null | jq -r '.accounts[0].id // empty' || true)
  if [[ -z "$ACCOUNT_ID" ]]; then
    err "Could not detect account ID. Pass --account-id <id>"
    exit 1
  fi
fi
ok "Account ID: $ACCOUNT_ID"

API_BASE="https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID"

# --- Auth header ---
auth_header() {
  if [[ -n "$API_TOKEN" ]]; then
    echo "Authorization: Bearer $API_TOKEN"
  else
    # wrangler stores token differently; use a temp token from wrangler env
    wrangler whoami --json 2>/dev/null | jq -r '.apiToken // empty' | head -1
  fi
}

CF_AUTH="Authorization: Bearer ${API_TOKEN:-$(wrangler whoami --json 2>/dev/null | jq -r '.apiToken // empty')}"

# --- D1 databases ---
create_d1() {
  local name="$1"
  step "D1: creating database '$name'..."
  local existing
  existing=$(curl -s -H "$CF_AUTH" "$API_BASE/d1/database" | jq -r ".result[]? | select(.name==\"$name\") | .uuid // empty" | head -1)
  if [[ -n "$existing" ]]; then
    ok "D1 '$name' already exists (id: $existing)"
    echo "$existing"
    return 0
  fi
  local resp
  resp=$(curl -s -X POST -H "$CF_AUTH" -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\"}" \
    "$API_BASE/d1/database")
  local id
  id=$(echo "$resp" | jq -r '.result.uuid // empty')
  if [[ -z "$id" ]]; then
    err "Failed to create D1 '$name': $(echo "$resp" | jq -r '.errors[0].message // .errors // empty')"
    return 1
  fi
  ok "D1 '$name' created (id: $id)"
  echo "$id"
}

step "=== D1 databases ==="
D1_CACHE_ID=$(create_d1 "my-identity-cache")
D1_RENDERER_ID=$(create_d1 "my-identity-render-cache")

# --- KV namespaces ---
create_kv() {
  local title="$1"
  step "KV: creating namespace '$title'..."
  local resp
  resp=$(curl -s -X POST -H "$CF_AUTH" -H "Content-Type: application/json" \
    -d "{\"title\":\"$title\"}" \
    "$API_BASE/storage/kv/namespaces")
  local id
  id=$(echo "$resp" | jq -r '.result.id // empty')
  if [[ -z "$id" ]]; then
    # Check if already exists
    id=$(curl -s -H "$CF_AUTH" "$API_BASE/storage/kv/namespaces" | jq -r ".result[]? | select(.title==\"$title\") | .id" | head -1)
    if [[ -n "$id" ]]; then
      ok "KV '$title' already exists (id: $id)"
      echo "$id"
      return 0
    fi
    err "Failed to create KV '$title': $(echo "$resp" | jq -r '.errors[0].message // .errors // empty')"
    return 1
  fi
  ok "KV '$title' created (id: $id)"
  echo "$id"
}

step "=== KV namespaces ==="
KV_SESSIONS_ID=$(create_kv "my-identity-sessions")
KV_RATELIMIT_ID=$(create_kv "my-identity-rate-limit")
KV_AUDIT_ID=$(create_kv "my-identity-audit-log")
KV_RENDER_ID=$(create_kv "my-identity-render-cache")

# --- R2 bucket ---
create_r2() {
  local name="$1"
  step "R2: creating bucket '$name'..."
  local resp
  resp=$(curl -s -X PUT -H "$CF_AUTH" "$API_BASE/r2/buckets/$name")
  if echo "$resp" | jq -e '.success' >/dev/null 2>&1; then
    ok "R2 '$name' created"
  elif echo "$resp" | jq -e '.errors[0].message | test("already exists")' >/dev/null 2>&1; then
    ok "R2 '$name' already exists"
  else
    err "Failed to create R2 '$name': $(echo "$resp" | jq -r '.errors[0].message // .errors // empty')"
    return 1
  fi
}

step "=== R2 bucket ==="
create_r2 "my-identity-media"

# --- Workers projects ---
create_worker() {
  local name="$1"
  step "Worker: creating project '$name'..."
  if wrangler deployments list --name "$name" >/dev/null 2>&1; then
    ok "Worker '$name' already exists"
    return 0
  fi
  err "Worker '$name' must be created via 'wrangler deploy' from the project directory"
  return 1
}

step "=== Workers (skipped — deploy via wrangler) ==="
warn "Run manually:"
echo "  cd apps/api && wrangler deploy"
echo "  cd apps/renderer && wrangler deploy"

# --- Pages projects ---
step "=== Pages projects (skipped — deploy via wrangler) ==="
warn "Run manually:"
echo "  cd apps/dashboard && wrangler pages deploy dist --project-name=my-identity-studio"
echo "  cd apps/marketing && wrangler pages deploy dist --project-name=my-identity-marketing"
echo "  cd apps/docs && wrangler pages deploy dist --project-name=my-identity-docs"

# --- Summary ---
cat <<EOF

${GREEN}═══════════════════════════════════════════════════════════════
  Cloudflare bootstrap complete!
═══════════════════════════════════════════════════════════════${NC}

${BLUE}Resource IDs (save these!):${NC}
  D1 cache:        $D1_CACHE_ID
  D1 render cache: $D1_RENDERER_ID
  KV sessions:     $KV_SESSIONS_ID
  KV rate-limit:   $KV_RATELIMIT_ID
  KV audit:        $KV_AUDIT_ID
  KV render:       $KV_RENDER_ID
  R2 media:        my-identity-media

${YELLOW}Next steps:${NC}
  1. Update apps/api/wrangler.toml: replace the 00000... IDs with the real ones above
  2. Update apps/renderer/wrangler.toml: replace the 00000... IDs with the real ones above
  3. cd apps/api && wrangler deploy
  4. cd apps/renderer && wrangler deploy
  5. Setup custom domains via Cloudflare dashboard or wrangler

${GREEN}Done!${NC}
EOF
