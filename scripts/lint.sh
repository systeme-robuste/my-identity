#!/usr/bin/env bash
# lint.sh — Run ESLint, Prettier, and secret-scan on the whole monorepo.
#
# Usage: ./scripts/lint.sh [--fix]
#
# Exits 0 if clean, 1 otherwise.

set -uo pipefail

ROOT="projects/my-identity"
FIX="${1:-}"

if [ ! -d "$ROOT" ]; then
  echo "Project root not found: $ROOT" >&2
  exit 1
fi

cd "$ROOT" || exit 1

errors=0

echo "=== ESLint ==="
if [ -f "package.json" ] && grep -q '"lint"' package.json; then
  if [ "$FIX" = "--fix" ]; then
    pnpm run lint --fix || errors=$((errors + 1))
  else
    pnpm run lint || errors=$((errors + 1))
  fi
else
  echo "  no lint script found — skipping"
fi

echo
echo "=== Prettier ==="
if [ -f ".prettierrc.json" ] || [ -f ".prettierrc" ]; then
  if [ "$FIX" = "--fix" ]; then
    pnpm exec prettier --write "**/*.{ts,tsx,js,jsx,json,md,css}" 2>/dev/null || errors=$((errors + 1))
  else
    pnpm exec prettier --check "**/*.{ts,tsx,js,jsx,json,md,css}" 2>/dev/null || errors=$((errors + 1))
  fi
else
  echo "  no .prettierrc found — skipping"
fi

echo
echo "=== Secret scan ==="
# Grep for common secret patterns in the source
patterns=(
  "sk_live_[A-Za-z0-9]+"               # Stripe live secret
  "rk_live_[A-Za-z0-9]+"               # Stripe restricted key
  "AKIA[0-9A-Z]{16}"                   # AWS access key
  "ghp_[A-Za-z0-9]{36}"                # GitHub PAT
  "github_pat_[A-Za-z0-9_]{82}"        # GitHub fine-grained PAT
  "glpat-[A-Za-z0-9_-]{20,}"           # GitLab PAT
  "nfp_[A-Za-z0-9]{40,}"               # Netlify PAT
  "dop_v1_[A-Za-z0-9]{64,}"            # DigitalOcean PAT
  "-----BEGIN .* PRIVATE KEY-----"     # private key
)

found=0
for pat in "${patterns[@]}"; do
  if grep -rEn "$pat" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.md" --include="*.env*" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next . 2>/dev/null; then
    found=$((found + 1))
  fi
done

if [ $found -gt 0 ]; then
  echo "  ✗ Found $found suspicious pattern(s)!"
  errors=$((errors + 1))
else
  echo "  ✓ no secrets detected"
fi

echo
if [ $errors -gt 0 ]; then
  echo "Lint/scan failed: $errors issue(s)."
  exit 1
else
  echo "All clean."
fi
