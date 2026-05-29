#!/usr/bin/env bash
# scan_addLog_object.sh
# Detects: addLog called with an object instead of (phase, msg, type) — the
# bug that caused the Seguros blank-page failure.
# Exit code: 0 if clean, 1 if hits found.

set -euo pipefail
ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
SRC="$ROOT/phenomenon/apps/contracts/frontend/src"

if [ ! -d "$SRC" ]; then
  echo "[scan_addLog_object] source not found"
  exit 0
fi

# Bad pattern: addLog?.({ ... }) or addLog({ ... })
hits=$(grep -RnE 'addLog\??\s*\(\s*\{' "$SRC" 2>/dev/null || true)

if [ -n "$hits" ]; then
  echo "[scan_addLog_object] HIT — addLog called with object literal:"
  echo "$hits" | sed 's/^/  /'
  echo "  → Correct shape: addLog(\"PHASE\", \"message\", \"type\")"
  exit 1
fi

echo "[scan_addLog_object] OK — addLog calls use positional args."
exit 0
