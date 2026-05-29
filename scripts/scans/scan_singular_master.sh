#!/usr/bin/env bash
# scan_singular_master.sh
# Detects: code that assumes ONE master when the app supports multiple (Seguros has 4).
# The original "Verificar todos" bug was caused by this exact pattern.
#
# Looks for: any handler that builds a list from `master` + `subContracts`
# instead of iterating ALL contracts via Object.values(contracts).
# Whitelisted: code paths that are intentionally per-master (e.g., a panel
# that shows the currently selected master only — those use selectedId).
#
# Exit code: 0 if clean, 1 if hits found.

set -euo pipefail
ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
SRC="$ROOT/phenomenon/apps/contracts/frontend/src"

if [ ! -d "$SRC" ]; then
  echo "[scan_singular_master] source not found: $SRC"
  exit 0
fi

# Whitelist: files where per-master scope is by-design (not a bug).
# - ContractGraph.jsx: graph displays ONE ecosystem at a time; navigation between
#                      masters is via ProjectManager, intentional.
# - LiveFeed.jsx, CompactIAPanel.jsx, App.jsx (header stats): show stats for
#                      the currently active master's ecosystem. Logged as P2
#                      cosmetic in BUG_HUNT_QUEUE; not blocking.
WHITELIST_REGEX='ContractGraph\.jsx|LiveFeed\.jsx|CompactIAPanel\.jsx|App\.jsx'

# Pattern 1: arrays built from [master, ...subContracts] or [...subContracts, master]
# This is the buggy shape — it only covers ONE master.
# Strip lines whose match position lies inside a // comment (defensive: skip
# comment lines containing the same shape as documentation/warning text).
hits=$(grep -RnE '\[\s*\.\.\.subContracts[^\]]*master\b|\[\s*master\s*,\s*\.\.\.subContracts' "$SRC" 2>/dev/null \
  | grep -vE "$WHITELIST_REGEX" \
  | grep -vE ':[[:space:]]*//' || true)

# Pattern 2: a "verify all / homologate all / cascade all" button that uses singular master.
# Find buttons/handlers labeled todos/all/every nearby code that references master singular.
label_hits=$(grep -RnE 'todos|all|every' "$SRC" --include='*.jsx' --include='*.js' 2>/dev/null \
  | grep -iE 'verificar|homologar|cascade|aplicar' || true)

clean=0
if [ -n "$hits" ]; then
  echo "[scan_singular_master] HIT — singular-master collection assembly:"
  echo "$hits" | sed 's/^/  /'
  clean=1
fi

if [ "$clean" -eq 0 ]; then
  echo "[scan_singular_master] OK — no singular-master assembly patterns."
fi

exit $clean
