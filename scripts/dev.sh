#!/usr/bin/env bash
# dev.sh — Local development bootstrap.
# Starts docker-compose (postgres + redis + mailpit), runs migrations,
# seeds the DB, and starts the dev server for all apps in parallel.
#
# Prerequisites:
#   - pnpm >= 9
#   - docker + docker compose
#   - .env file (copy from .env.example)
#
# Usage:
#   ./scripts/dev.sh                # full bootstrap
#   SKIP_ENV_CHECK=1 ./scripts/dev.sh   # skip .env placeholder detection
#   SKIP_DOCKER=1 ./scripts/dev.sh      # don't start docker (use remote DB)

set -euo pipefail

cd "$(dirname "$0")/.."
ROOT=$(pwd)

# 1) Banner
echo -e "\033[1;36m=== My Identity — Local Dev ===\033[0m"
echo "Root: $ROOT"
echo

# 2) Check .env
if [ ! -f .env ]; then
  echo -e "\033[1;33m[.env] missing\033[0m — copying from .env.example"
  cp .env.example .env
  echo -e "\033[1;32m[.env] created. Edit it before continuing.\033[0m"
  echo "  Required: AUTH_SECRET, MISTRAL_API_KEY, STRIPE_SECRET_KEY, RESEND_API_KEY"
  echo
fi

# 2b) Check for placeholder values in .env
PLACEHOLDER_COUNT=0
for var in AUTH_SECRET MISTRAL_API_KEY STRIPE_SECRET_KEY RESEND_API_KEY DATABASE_URL; do
  if grep -qE "^${var}=(replace_me|changeme|CHANGEME|TODO|xxx|your-key-here)?$" .env 2>/dev/null; then
    echo -e "\033[1;33m[.env] ${var} is empty or placeholder\033[0m"
    PLACEHOLDER_COUNT=$((PLACEHOLDER_COUNT + 1))
  fi
done
if [ $PLACEHOLDER_COUNT -gt 0 ]; then
  echo -e "\033[1;31m[.env] $PLACEHOLDER_COUNT vars need values. Edit .env then re-run.\033[0m"
  if [ "${SKIP_ENV_CHECK:-0}" != "1" ]; then
    exit 1
  fi
fi

# 3) Check required CLIs
MISSING_CLI=0
for cmd in pnpm docker psql; do
  if ! command -v $cmd >/dev/null 2>&1; then
    echo -e "\033[1;31m[deps] $cmd not found. Install it before continuing.\033[0m"
    MISSING_CLI=1
  fi
done
if [ $MISSING_CLI -eq 1 ]; then
  exit 1
fi

# 4) Install deps
if [ ! -d node_modules ]; then
  echo -e "\033[1;36m[deps] installing...\033[0m"
  pnpm install
fi

# 5) Start docker (unless skipped)
if [ "${SKIP_DOCKER:-0}" != "1" ]; then
  echo -e "\033[1;36m[docker] starting postgres + redis + mailpit...\033[0m"
  docker compose up -d postgres redis mailpit

  # 6) Wait for postgres
  echo -e "\033[1;36m[postgres] waiting for ready...\033[0m"
  for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U myidentity >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

# 7) Run migrations
echo -e "\033[1;36m[migrations] running...\033[0m"
pnpm db:migrate

# 8) Seed (optional)
if [ -f packages/db/seed.ts ]; then
  echo -e "\033[1;36m[seed] running...\033[0m"
  pnpm db:seed
fi

# 9) Start dev servers
echo
echo -e "\033[1;32m=== READY ===\033[0m"
echo "  API:        http://localhost:8787"
echo "  Renderer:   http://localhost:8788"
echo "  Dashboard:  http://localhost:5173"
echo "  Marketing:  http://localhost:5174"
echo "  Mailpit:    http://localhost:8025"
echo "  Postgres:   postgresql://myidentity:myidentity_dev@localhost:5432/myidentity_dev"
echo
echo -e "\033[1;36m[dev] starting all apps (Ctrl+C to stop)...\033[0m"
pnpm dev
