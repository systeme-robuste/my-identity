#!/usr/bin/env bash
# seed-local.sh — Run the DB seed script against a local or staging database.
#
# Usage:
#   ./scripts/seed-local.sh [database_url]
#
# Defaults to $DATABASE_URL.

set -euo pipefail

URL="${1:-${DATABASE_URL:-}}"

if [ -z "$URL" ]; then
  echo "Database URL not set. Pass it as arg or set DATABASE_URL." >&2
  echo "Example: ./scripts/seed-local.sh 'postgresql://user:pass@localhost:5432/myidentity'" >&2
  exit 1
fi

ROOT="projects/my-identity"

if [ ! -d "$ROOT" ]; then
  echo "Project root not found: $ROOT" >&2
  exit 1
fi

cd "$ROOT" || exit 1

echo "Seeding $URL..."
DATABASE_URL="$URL" pnpm --filter @my-identity/db seed

echo
echo "Seed complete."
echo "Demo credentials: demo@myidentity.local / demo1234"
