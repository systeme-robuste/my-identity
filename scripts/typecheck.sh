#!/usr/bin/env bash
# typecheck.sh — Run TypeScript type checking on the whole monorepo.
#
# Usage: ./scripts/typecheck.sh [--strict]
#
# Exits 0 if no errors, 1 otherwise.

set -uo pipefail

ROOT="projects/my-identity"

if [ ! -d "$ROOT" ]; then
  echo "Project root not found: $ROOT" >&2
  exit 1
fi

cd "$ROOT" || exit 1

echo "Running TypeScript typecheck..."

# Find all tsconfig.json files (excluding node_modules and dist)
tsconfigs=$(find . -name "tsconfig.json" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.next/*")

errors=0
for tsconfig in $tsconfigs; do
  echo "  → $tsconfig"
  if ! npx --no-install tsc -p "$tsconfig" --noEmit 2>&1; then
    errors=$((errors + 1))
  fi
done

if [ $errors -gt 0 ]; then
  echo
  echo "Typecheck failed in $errors config(s)."
  exit 1
fi

echo
echo "Typecheck OK."
