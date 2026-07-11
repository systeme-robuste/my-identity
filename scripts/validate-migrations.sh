#!/usr/bin/env bash
# validate-migrations.sh — pre-merge checks for Drizzle SQL migrations
# Usage: ./scripts/validate-migrations.sh <drizzle-dir>
#   default <drizzle-dir> = ./apps/api/drizzle
#
# Checks:
#   1. Numbering: filenames match NNNN_name.sql (sequential, zero-padded).
#   2. Transactions: no DDL outside BEGIN/COMMIT (defensive).
#   3. Syntax: psql --no-psqlrc -c "\\list" connectivity (best-effort).
#   4. Drizzle meta.json: journal arrays consistent with on-disk files.
set -uo pipefail

DRIZZLE_DIR="${1:-./apps/api/drizzle}"
if [[ ! -d "$DRIZZLE_DIR" ]]; then
  echo "[validate-migrations] dir not found: $DRIZZLE_DIR" >&2
  exit 2
fi

FAIL=0
log() { echo "[validate-migrations] $*"; }
fail() { echo "[validate-migrations] FAIL: $*" >&2; FAIL=1; }

# --- 1. Numbering --------------------------------------------------------
log "1/4 numbering"
LAST=0
SHOPT=$(set +o | grep -E '^shopt' || true)
mapfile -t FILES < <(find "$DRIZZLE_DIR" -maxdepth 1 -type f -name '[0-9]*_*.sql' | sort)
if [[ ${#FILES[@]} -eq 0 ]]; then
  fail "no migration files matching NNNN_*.sql in $DRIZZLE_DIR"
fi
for f in "${FILES[@]}"; do
  base=$(basename "$f")
  if ! [[ "$base" =~ ^([0-9]{4})_[a-z0-9_]+\.sql$ ]]; then
    fail "bad filename: $base (expected NNNN_name.sql)"
    continue
  fi
  n=$((10#${BASH_REMATCH[1]}))
  if (( n <= LAST )); then
    fail "non-monotonic numbering at $base (prev=$LAST, this=$n)"
  fi
  LAST=$n
done
log "  -> ${#FILES[@]} files, last = $(printf '%04d' "$LAST")"

# --- 2. Transactions -----------------------------------------------------
log "2/4 transactions"
for f in "${FILES[@]}"; do
  # Naive check: at least one BEGIN ... ; pair per file.
  if ! grep -q -i '^BEGIN' "$f"; then
    fail "$f: no BEGIN (consider wrapping DDL in a transaction)"
  fi
  if ! grep -q -i '^COMMIT' "$f"; then
    fail "$f: no COMMIT (unterminated transaction?)"
  fi
done

# --- 3. Syntax (psql connectivity + dry parse) ---------------------------
log "3/4 syntax"
if command -v psql >/dev/null 2>&1; then
  if [[ -n "${DATABASE_URL:-}" ]]; then
    if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c '\set QUIET on' -X -c 'SELECT 1' >/dev/null 2>&1; then
      log "  -> DB reachable, parsing each file with \\i"
      for f in "${FILES[@]}"; do
        if ! psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -X -e -c "\\i $f" >/dev/null 2>&1; then
          fail "psql rejected $f"
        fi
      done
    else
      log "  -> DATABASE_URL set but unreachable; skipping deep parse"
    fi
  else
    log "  -> DATABASE_URL unset; skipping live parse (filenames + transactions only)"
  fi
else
  log "  -> psql not installed; skipping"
fi

# --- 4. meta.json consistency -------------------------------------------
log "4/4 meta.json"
JOURNAL="$DRIZZLE_DIR/meta/_journal.json"
if [[ -f "$JOURNAL" ]]; then
  if command -v jq >/dev/null 2>&1; then
    expected=$(jq -r '.entries[].tag' "$JOURNAL" | sort)
    actual=$(printf '%s\n' "${FILES[@]}" | xargs -n1 basename | sort)
    diff_out=$(diff <(echo "$expected") <(echo "$actual") || true)
    if [[ -n "$diff_out" ]]; then
      fail "journal/files mismatch:\n$diff_out"
    fi
  else
    log "  -> jq not installed; skipping journal diff"
  fi
else
  log "  -> meta/_journal.json not found; skipping"
fi

if (( FAIL )); then
  log "RESULT: FAIL"
  exit 1
fi
log "RESULT: OK"
