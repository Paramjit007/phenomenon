#!/usr/bin/env bash
# scan_required_fields_coverage.sh
# Detects: master templates defined in the UI (`CONTRACT_TEMPLATES`) that
# have NO entry in the backend's `_MASTER_REQUIRED` map. Such templates
# pass homologation regardless of which fields are empty — the bug class
# the owner reported on KPMG.
#
# Same check for sub-contract types in engine's _ALL_SUB_TYPES vs
# backend's _SUB_REQUIRED.
#
# Exit code: 0 if every UI template + every engine sub-type has required
# fields defined in the backend, 1 otherwise.

set -uo pipefail
ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
CONSTANTS="$ROOT/phenomenon/apps/contracts/frontend/src/constants.js"
ROUTES="$ROOT/phenomenon/apps/contracts/backend/app/api/routes_phenomena.py"
ENGINE="$ROOT/phenomenon/packages/engine/phenomenon_engine/cascade_engine.py"

if [ ! -f "$CONSTANTS" ] || [ ! -f "$ROUTES" ] || [ ! -f "$ENGINE" ]; then
  echo "[scan_required_fields_coverage] source files missing"
  exit 0
fi

# Templates that intentionally have no required field-level checks
# (e.g., simple bilateral NDAs whose validity is purely ESS + clauses).
WHITELIST_MASTERS="ARRENDAMIENTO"

# Extract CONTRACT_TEMPLATES top-level keys
templates=$(awk '
  /^export const CONTRACT_TEMPLATES = \{/{inblock=1; next}
  /^\};/ && inblock {inblock=0}
  inblock && /^  [A-Z_]+:[[:space:]]*\{/ {
    match($0, /[A-Z_]+/); print substr($0, RSTART, RLENGTH)
  }
' "$CONSTANTS" | sort -u)

# Extract _MASTER_REQUIRED keys
master_req=$(awk '/^_MASTER_REQUIRED/,/^\}/' "$ROUTES" \
  | grep -oE '"[A-Z_]+":[[:space:]]*\[' | grep -oE '"[A-Z_]+"' | tr -d '"' | sort -u)

# Templates missing from _MASTER_REQUIRED (excluding whitelist)
missing_master=$(comm -23 <(echo "$templates") <(echo "$master_req") \
  | grep -vE "^($WHITELIST_MASTERS)$" || true)

# Extract _ALL_SUB_TYPES from engine
sub_types=$(awk '/^_ALL_SUB_TYPES/,/^]/' "$ENGINE" \
  | grep -oE '"[A-Z_]+"' | tr -d '"' | sort -u)

# Extract _SUB_REQUIRED keys (initial + .update)
sub_req=$(awk '
  /_SUB_REQUIRED/ { capture=1 }
  capture { print }
  capture && /^\}\)?/ { capture=0 }
' "$ROUTES" | grep -oE '"[A-Z_]+":[[:space:]]*\[' | grep -oE '"[A-Z_]+"' | tr -d '"' | sort -u)

# Sub-types that exist only as master template keys (not actual sub-contract types)
# These are routed through _MASTER_REQUIRED, not _SUB_REQUIRED.
# AVAL_BANCARIO and CONTRATO_OBRA are stubs in SUB_META with no UI fields yet —
# if they ever get SUB_FIELDS entries, they must be moved out of this whitelist
# AND added to _SUB_REQUIRED. See BUG_HUNT_QUEUE.md.
SUB_WHITELIST="SEGURO_VIDA|SEGURO_RC|SEGURO_DANOS|SEGURO_CREDITO_COMERCIAL|SEGURO_CREDITO|AVAL_BANCARIO|CONTRATO_OBRA"

missing_sub=$(comm -23 <(echo "$sub_types") <(echo "$sub_req") \
  | grep -vE "^($SUB_WHITELIST)$" || true)

drift=0

if [ -n "$missing_master" ]; then
  echo "[scan_required_fields_coverage] HIT — UI master templates with NO required-field check in backend:"
  for t in $missing_master; do
    echo "  - $t  (homologation will pass even with all fields empty)"
  done
  echo "  → Add an entry to _MASTER_REQUIRED in routes_phenomena.py."
  drift=1
fi

if [ -n "$missing_sub" ]; then
  echo "[scan_required_fields_coverage] HIT — Engine sub-types with NO required-field check in backend:"
  for t in $missing_sub; do
    echo "  - $t"
  done
  echo "  → Add an entry to _SUB_REQUIRED in routes_phenomena.py."
  drift=1
fi

if [ $drift -eq 0 ]; then
  echo "[scan_required_fields_coverage] OK — every UI template + every engine sub-type has required-field checks."
fi
exit $drift
