#!/usr/bin/env bash
# preflight.sh — run at the START of every session.
# Verifies the system is in a known-good state and reports anything
# suspicious BEFORE work begins. Forms the baseline against which any
# regression introduced this session will stand out.
#
# Exit code: 0 if all green. Nonzero is informational, not blocking —
# but the agent MUST read the output and report what it found.

set -uo pipefail
ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")" && cd .. && pwd)}"
export PROJECT_ROOT="$ROOT"

echo "=========================================="
echo " PHENOMENON Preflight — $(date -u +%FT%TZ)"
echo "=========================================="

fail=0

# ── 1. Docker containers up? ────────────────────────────────────────
echo
echo "[1/6] Docker containers"
ps_output=$(docker compose -f "$ROOT/phenomenon/docker-compose.yml" ps 2>&1 || true)
echo "$ps_output" | tail -n +2 | awk '{print "  "$1" "$5" "$6}'
running=$(echo "$ps_output" | grep -c "Up" || true)
if [ "$running" -lt 3 ]; then
  echo "  ⚠ fewer than 3 containers running — start with: docker compose up -d"
  fail=$((fail+1))
fi

# ── 2. Backend health endpoint ──────────────────────────────────────
echo
echo "[2/6] Backend health"
health=$(curl -s -m 5 http://host.docker.internal:8000/health 2>&1 || echo "UNREACHABLE")
echo "  $health"
echo "$health" | grep -q '"status":"ok"' || { echo "  ⚠ backend not healthy"; fail=$((fail+1)); }

# ── 3. Engine unit tests ────────────────────────────────────────────
echo
echo "[3/6] Engine pytest (must be all green)"
test_out=$(docker compose -f "$ROOT/phenomenon/docker-compose.yml" exec -T backend bash -c \
  "cd /workspace/packages/engine && python -m pytest tests/ -q 2>&1" || true)
echo "$test_out" | tail -3 | sed 's/^/  /'
echo "$test_out" | grep -qE 'failed|error' && { echo "  ⚠ engine tests not all passing"; fail=$((fail+1)); } || true

# ── 4. Smoke (Playwright suite 01) ──────────────────────────────────
echo
echo "[4/6] Playwright smoke"
if [ -d "$ROOT/phenomenon/e2e" ]; then
  smoke_out=$(cd "$ROOT/phenomenon/e2e" && npx playwright test tests/01-smoke.spec.js --reporter=line 2>&1 | tail -2 || true)
  echo "$smoke_out" | sed 's/^/  /'
  echo "$smoke_out" | grep -qE 'failed|error' && fail=$((fail+1)) || true
fi

# ── 5. Pattern scans (silent-bug detectors) ─────────────────────────
echo
echo "[5/6] Pattern scans"
for scan in "$ROOT"/scripts/scans/*.sh; do
  [ -f "$scan" ] || continue
  bash "$scan" 2>&1 | sed 's/^/  /'
  bash "$scan" >/dev/null 2>&1 || fail=$((fail+1))
done

# ── 6. Bug-hunt queue & doc drift ───────────────────────────────────
echo
echo "[6/6] Queue + drift"
if [ -f "$ROOT/BUG_HUNT_QUEUE.md" ]; then
  open_items=$(grep -cE '^\s*-\s*\[\s*\]' "$ROOT/BUG_HUNT_QUEUE.md" 2>/dev/null || echo 0)
  echo "  BUG_HUNT_QUEUE: $open_items unaudited item(s) pending"
  [ "$open_items" -gt 0 ] && echo "  → consider running: bash scripts/audit_sweep.sh"
fi

echo
echo "=========================================="
if [ $fail -eq 0 ]; then
  echo " ✅ PREFLIGHT GREEN — safe to begin work"
else
  echo " ⚠️  PREFLIGHT: $fail check(s) need attention"
  echo "    Address them BEFORE starting the user's task."
fi
echo "=========================================="

exit 0
