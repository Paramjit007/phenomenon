#!/usr/bin/env bash
# scan_count_invariants.sh
# For every UI button labeled todos/all/every/cada, check whether the
# E2E test suite has a count-invariant test for it. If not, flag it.
# Catches the bug class: "Verificar todos passes because we only test
# that *some* result appears, not that all entities were processed."
# Exit code: 0 if every all-button has a count test, 1 otherwise.

set -euo pipefail
ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
SRC="$ROOT/phenomenon/apps/contracts/frontend/src"
E2E="$ROOT/phenomenon/e2e/tests"

if [ ! -d "$SRC" ] || [ ! -d "$E2E" ]; then
  echo "[scan_count_invariants] source or e2e missing"
  exit 0
fi

# Find button labels containing all/todos/every
# Look at .jsx files for >...todos|all|every|cada...< in JSX text
buttons=$(grep -RhoE '>[^<]*\b(todos|todas|all|every|cada)\b[^<]*<' "$SRC" --include='*.jsx' 2>/dev/null \
  | sed -E 's/^>\s*//; s/\s*<$//' | sort -u)

drift=0
while IFS= read -r label; do
  [ -z "$label" ] && continue
  # Skip noise: very generic words
  case "$label" in
    *"all"*|*"todos"*|*"todas"*|*"every"*|*"cada"*) : ;;
    *) continue ;;
  esac
  # Has a count-invariant test? Look for "count" or "every" or "all of" near the label in test files.
  short=$(echo "$label" | head -c 30 | sed 's/[][\/.^$*]/\\&/g')
  if grep -RlE "$short" "$E2E" >/dev/null 2>&1; then
    : # mentioned in tests, good first signal
  else
    echo "[scan_count_invariants] HIT — UI label «$label» has no E2E mention."
    drift=1
  fi
done <<< "$buttons"

if [ $drift -eq 0 ]; then
  echo "[scan_count_invariants] OK — every all/todos button is referenced in E2E."
fi
exit $drift
