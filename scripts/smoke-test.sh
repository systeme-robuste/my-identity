#!/usr/bin/env bash
# smoke-test.sh — Quick sanity check against a running API.
# Usage: ./scripts/smoke-test.sh [base_url]
#
# Default base URL: http://localhost:8787
# Exits 0 if all checks pass, 1 otherwise.

set -uo pipefail

BASE="${1:-http://localhost:8787}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
  local name="$1"
  local expected_status="$2"
  local actual_status="$3"
  if [ "$actual_status" = "$expected_status" ]; then
    echo -e "  ${GREEN}✓${NC} $name (HTTP $actual_status)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $name (expected HTTP $expected_status, got $actual_status)"
    FAIL=$((FAIL + 1))
  fi
}

call() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [ -n "$body" ]; then
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$path" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$path"
  fi
}

echo -e "${YELLOW}=== My Identity — Smoke Test ===${NC}"
echo "Target: $BASE"
echo

# 1. Health endpoints (public, no auth)
check "GET /" 200 "$(call GET /)"
check "GET /health" 200 "$(call GET /health)"

# 2. Public auth endpoints reject bad payloads
check "POST /v1/auth/signup without body" 400 "$(call POST /v1/auth/signup '')"
check "POST /v1/auth/signup with bad email" 400 "$(call POST /v1/auth/signup '{"email":"x","password":"weak","turnstileToken":"t"}')"
check "POST /v1/auth/login without body" 400 "$(call POST /v1/auth/login '')"
check "POST /v1/auth/forgot without body" 400 "$(call POST /v1/auth/forgot '')"

# 3. Authenticated endpoints return 401 without token
check "GET /v1/auth/me without cookie" 401 "$(call GET /v1/auth/me)"
check "GET /v1/sites without auth" 401 "$(call GET /v1/sites)"

# 4. Public API returns 404 on unknown route
check "GET /v1/nonexistent" 404 "$(call GET /v1/nonexistent)"
check "GET /nonexistent" 404 "$(call GET /nonexistent)"

# 5. CORS preflight
cors_status=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BASE/v1/sites" \
  -H "Origin: https://studio.myidentity.app" \
  -H "Access-Control-Request-Method: GET")
check "OPTIONS /v1/sites (CORS preflight)" 204 "$cors_status"

echo
echo -e "${YELLOW}=== Summary ===${NC}"
echo -e "  ${GREEN}Passed: $PASS${NC}"
if [ $FAIL -gt 0 ]; then
  echo -e "  ${RED}Failed: $FAIL${NC}"
  exit 1
else
  echo -e "  Failed: 0"
  echo
  echo -e "${GREEN}All smoke tests passed.${NC}"
  exit 0
fi
