#!/usr/bin/env bash
# backup-db.sh — pg_dump Neon Postgres + 30-day local retention
# Usage: ./scripts/backup-db.sh [--remote] [--keep-days N]
#   --remote     : scp to BACKUP_REMOTE_HOST (must be set)
#   --keep-days  : retention in days (default 30)
#
# Requires: pg_dump in $PATH, $DATABASE_URL exported, optionally $BACKUP_REMOTE_HOST,
#           $BACKUP_REMOTE_USER, $BACKUP_REMOTE_DIR.
set -euo pipefail

REMOTE=false
KEEP_DAYS=30
while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote)   REMOTE=true; shift ;;
    --keep-days) KEEP_DAYS="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

: "${DATABASE_URL:?DATABASE_URL must be exported (postgres://...)}"

TS=$(date -u +%Y%m%dT%H%M%SZ)
OUT_DIR="${BACKUP_LOCAL_DIR:-$PWD/.backups}"
OUT_FILE="$OUT_DIR/my-identity-${TS}.sql.gz"
mkdir -p "$OUT_DIR"

echo "[backup-db] dumping $DATABASE_URL -> $OUT_FILE"
pg_dump --no-owner --no-privileges --clean --if-exists "$DATABASE_URL" \
  | gzip -9 > "$OUT_FILE"

echo "[backup-db] size: $(du -h "$OUT_FILE" | cut -f1)"

# Retention: delete local files older than $KEEP_DAYS
if [[ "$KEEP_DAYS" =~ ^[0-9]+$ ]] && [[ "$KEEP_DAYS" -gt 0 ]]; then
  find "$OUT_DIR" -maxdepth 1 -type f -name 'my-identity-*.sql.gz' -mtime +"$KEEP_DAYS" -print -delete \
    | sed 's/^/[backup-db] pruned /'
fi

# Optional remote copy
if $REMOTE; then
  : "${BACKUP_REMOTE_HOST:?BACKUP_REMOTE_HOST required for --remote}"
  : "${BACKUP_REMOTE_USER:?BACKUP_REMOTE_USER required for --remote}"
  : "${BACKUP_REMOTE_DIR:?BACKUP_REMOTE_DIR required for --remote}"
  echo "[backup-db] scp -> ${BACKUP_REMOTE_USER}@${BACKUP_REMOTE_HOST}:${BACKUP_REMOTE_DIR}/"
  scp -q "$OUT_FILE" "${BACKUP_REMOTE_USER}@${BACKUP_REMOTE_HOST}:${BACKUP_REMOTE_DIR}/"
fi

echo "[backup-db] OK"
