#!/usr/bin/env bash
# reset-local-db.sh — Drop and recreate the local DB, then re-run migrations.
#
# CAUTION: this is destructive. Local/dev only.
#
# Usage:
#   ./scripts/reset-local-db.sh [database_url]

set -euo pipefail

URL="${1:-${DATABASE_URL:-}}"

if [ -z "$URL" ]; then
  echo "Database URL not set. Pass it as arg or set DATABASE_URL." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install PostgreSQL client tools." >&2
  exit 1
fi

ROOT="projects/my-identity"
if [ ! -d "$ROOT" ]; then
  echo "Project root not found: $ROOT" >&2
  exit 1
fi
cd "$ROOT" || exit 1

# Parse the URL: postgresql://user:pass@host:port/dbname
dbname=$(echo "$URL" | sed -E 's|.*/([^/?]+)(\?.*)?$|\1|')
echo "Dropping and recreating '$dbname'..."

# Drop and recreate (connecting to 'postgres' maintenance DB)
psql "postgres://${URL#postgresql://}" -d postgres -c "DROP DATABASE IF EXISTS $dbname;" -c "CREATE DATABASE $dbname;"

# Run all migrations in order
MIGRATIONS_DIR="packages/db/migrations"
for f in $(ls -1 "$MIGRATIONS_DIR"/*.sql | sort); do
  echo "  applying $(basename "$f")..."
  psql "$URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo
echo "Database reset + migrations applied."
echo "Run './scripts/seed-local.sh' next if you want demo data."
