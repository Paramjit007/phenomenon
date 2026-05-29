#!/usr/bin/env bash
# predone.sh — run BEFORE claiming any feature is "done".
# Hard gate: if anything fails, the feature is NOT done. Fix, then re-run.
#
# This is the enforcement of the definition-of-done from CLAUDE_OPERATING_MANUAL.md.
# An agent that claims "done" without this passing has violated protocol.

set -uo pipefail
ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")" && cd .. && pwd)}"
export PROJECT_ROOT="$ROOT"

echo "=========================================="
echo " PHENOMENON Pre-Done Gate — $(date -u +%FT%TZ)"
echo "=========================================="

fail=0
section() { echo; echo "── $1 ──"; }

# ── 1. Engine unit tests must be green ──────────────────────────────
section "1. Engine unit tests"
docker compose -f "$ROOT/phenomenon/docker-compose.yml" exec -T backend bash -c \
  "cd /workspace/packages/engine && python -m pytest tests/ -q 2>&1" | tail -3
if ! docker compose -f "$ROOT/phenomenon/docker-compose.yml" exec -T backend bash -c \
  "cd /workspace/packages/engine && python -m pytest tests/ -q" >/dev/null 2>&1; then
  echo "  ❌ engine tests failing"
  fail=$((fail+1))
fi

# ── 2. Pattern scans must be clean ──────────────────────────────────
section "2. Pattern scans"
for scan in "$ROOT"/scripts/scans/*.sh; do
  [ -f "$scan" ] || continue
  name=$(basename "$scan")
  if bash "$scan" >/tmp/_scan_out 2>&1; then
    echo "  ✓ $name"
  else
    echo "  ❌ $name — see output:"
    sed 's/^/      /' /tmp/_scan_out
    fail=$((fail+1))
  fi
done

# ── 3. Full Playwright suite must be green ──────────────────────────
section "3. Playwright full suite"
if [ -d "$ROOT/phenomenon/e2e" ]; then
  cd "$ROOT/phenomenon/e2e"
  out=$(npx playwright test --reporter=line 2>&1 | tail -3)
  echo "$out" | sed 's/^/  /'
  if echo "$out" | grep -qE 'failed|error'; then
    echo "  ❌ Playwright not all green"
    fail=$((fail+1))
  fi
  cd - >/dev/null
fi

# ── 4. Doc freshness ────────────────────────────────────────────────
section "4. Doc freshness (CHANGES.md / SYSTEM_STATUS.md / ERROR_DASHBOARD.md)"
bash "$ROOT/scripts/scans/scan_doc_drift.sh" 2>&1 | sed 's/^/  /'
bash "$ROOT/scripts/scans/scan_doc_drift.sh" >/dev/null 2>&1 || fail=$((fail+1))

# ── Result ──────────────────────────────────────────────────────────
echo
echo "=========================================="
if [ $fail -eq 0 ]; then
  echo " ✅ PRE-DONE GATE PASSED — feature may be reported as done."
else
  echo " ❌ PRE-DONE GATE FAILED ($fail check(s)). FEATURE IS NOT DONE."
  echo "    Fix the issues above, then re-run: bash scripts/predone.sh"
fi
echo "=========================================="

[ $fail -eq 0 ] || exit 1
exit 0
