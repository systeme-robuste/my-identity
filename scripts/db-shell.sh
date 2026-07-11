#!/usr/bin/env bash
# db-shell.sh — Open a psql shell connected to the configured database.
#
# Usage: ./scripts/db-shell.sh [database_url]
#
# Defaults to $DATABASE_URL. Useful for local dev or prod incident response.

set -euo pipefail

URL="${1:-${DATABASE_URL:-}}"

if [ -z "$URL" ]; then
  echo "Database URL not set. Pass it as arg or set DATABASE_URL." >&2
  echo "Example: ./scripts/db-shell.sh 'postgresql://user:pass@host:5432/dbname'" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install PostgreSQL client tools." >&2
  exit 1
fi

echo "Connecting to $URL..."
echo "(Use \\q to quit)"
echo

psql "$URL" -v ON_ERROR_STOP=1
