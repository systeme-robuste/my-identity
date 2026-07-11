#!/usr/bin/env bash
# restore-db.sh — restore a pg_dump archive into $DATABASE_URL
# Usage: ./scripts/restore-db.sh <path-to-backup.sql.gz> [--cancel-grace 5]
#   --cancel-grace  : seconds to wait before starting (default 5)
#
# Requires: psql + gunzip in $PATH, $DATABASE_URL exported.
set -euo pipefail

CANCEL_GRACE=5
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cancel-grace) CANCEL_GRACE="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,9p' "$0"; exit 0 ;;
    -*) echo "Unknown arg: $1" >&2; exit 2 ;;
    *)  BREAK_FILE="$1"; shift ;;
  esac
done

: "${DATABASE_URL:?DATABASE_URL must be exported (postgres://...)}"
: "${BREAK_FILE:?Usage: restore-db.sh <path-to-backup.sql.gz>}"

if [[ ! -f "$BREAK_FILE" ]]; then
  echo "[restore-db] file not found: $BREAK_FILE" >&2
  exit 1
fi

echo "[restore-db] WARNING: this will DROP and recreate all objects in"
echo "             $DATABASE_URL"
echo "             source: $BREAK_FILE"

if [[ "$CANCEL_GRACE" =~ ^[0-9]+$ ]] && [[ "$CANCEL_GRACE" -gt 0 ]]; then
  echo "[restore-db] starting in $CANCEL_GRACE seconds — Ctrl-C to abort..."
  sleep "$CANCEL_GRACE"
fi

# Drop and recreate the public schema for a clean restore.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

gunzip -c "$BREAK_FILE" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f -

echo "[restore-db] OK"
