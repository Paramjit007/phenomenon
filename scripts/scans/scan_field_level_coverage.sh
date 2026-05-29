#!/usr/bin/env bash
# scan_field_level_coverage.sh
# Detects: a field declared in `SUB_FIELDS[type]` or `CONTRACT_TEMPLATES[template].contractFields`
# in the frontend constants.js that is NOT enforced in the backend's `_SUB_REQUIRED` /
# `_MASTER_REQUIRED` (and not on the explicit whitelist).
#
# This is the FIELD-level companion to `scan_required_fields_coverage.sh` (which is
# TYPE-level). Third instance of the same bug class motivated this scan — the user
# reported "Verificar todos passes with empty fields" three separate times before the
# field-level gap was systematically closed.
#
# Exit code: 0 if every UI field is enforced (or whitelisted), 1 otherwise.

set -uo pipefail
ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
CONSTANTS="$ROOT/phenomenon/apps/contracts/frontend/src/constants.js"
ROUTES="$ROOT/phenomenon/apps/contracts/backend/app/api/routes_phenomena.py"

if [ ! -f "$CONSTANTS" ] || [ ! -f "$ROUTES" ]; then
  echo "[scan_field_level_coverage] sources missing"
  exit 0
fi

# Whitelist: (TYPE|FIELD) tuples that are intentionally optional.
# Empty by default (user chose "Maximal" enforcement). Add only with a
# one-line comment explaining why.
WHITELIST_TUPLES=""

# ── Extract UI sub-fields ──────────────────────────────────────────────
ui_sub=$(awk '
  /^export const SUB_FIELDS = \{/ { inblock=1; next }
  /^\};/ && inblock { inblock=0 }
  inblock && match($0, /^  ([A-Z_]+):/, m) { current = m[1]; next }
  inblock && current && match($0, /key:[[:space:]]*"([a-zA-Z_]+)"/, m) {
    print current "|" m[1]
  }
' "$CONSTANTS" | sort -u)

# ── Extract backend _SUB_REQUIRED ──────────────────────────────────────
be_sub=$(awk '
  /^_SUB_REQUIRED.*=/ { inblock=1; next }
  inblock && /^\}/ { inblock=0; next }
  inblock && match($0, /^[[:space:]]+"([A-Z_]+)":/, m) { current = m[1]; next }
  inblock && current && match($0, /\("([a-zA-Z_]+)",/, m) {
    print current "|" m[1]
  }
  /^_SUB_REQUIRED\.update/ { inblock=1; next }
' "$ROUTES" | sort -u)

# ── UI master fields ──────────────────────────────────────────────────
ui_master=$(awk '
  /^export const CONTRACT_TEMPLATES = \{/ { inblock=1; next }
  /^\};/ && inblock { inblock=0 }
  inblock && match($0, /^  ([A-Z_]+):[[:space:]]*\{/, m) { current = m[1]; in_cf=0; next }
  inblock && /contractFields:[[:space:]]*\[/ { in_cf=1; next }
  inblock && in_cf && /^[[:space:]]*\],/ { in_cf=0; next }
  inblock && in_cf && current && match($0, /key:[[:space:]]*"([a-zA-Z_]+)"/, m) {
    print current "|" m[1]
  }
' "$CONSTANTS" | sort -u)

be_master=$(awk '
  /^_MASTER_REQUIRED.*=/ { inblock=1; next }
  inblock && /^\}/ { inblock=0; next }
  inblock && match($0, /^[[:space:]]+"([A-Z_]+)":/, m) { current = m[1]; next }
  inblock && current && match($0, /\("([a-zA-Z_]+)",/, m) {
    print current "|" m[1]
  }
' "$ROUTES" | sort -u)

# Apply whitelist filter
filter_whitelist() {
  if [ -z "$WHITELIST_TUPLES" ]; then cat; else
    grep -vFx "$WHITELIST_TUPLES" || true
  fi
}

drift=0

missing_sub=$(comm -23 <(echo "$ui_sub") <(echo "$be_sub") | filter_whitelist | grep -v '^$' || true)
if [ -n "$missing_sub" ]; then
  echo "[scan_field_level_coverage] HIT — UI sub-fields NOT enforced in _SUB_REQUIRED:"
  echo "$missing_sub" | awk -F'|' '{printf "  - %-30s . %s\n", $1, $2}'
  drift=1
fi

missing_master=$(comm -23 <(echo "$ui_master") <(echo "$be_master") | filter_whitelist | grep -v '^$' || true)
if [ -n "$missing_master" ]; then
  echo "[scan_field_level_coverage] HIT — UI master fields NOT enforced in _MASTER_REQUIRED:"
  echo "$missing_master" | awk -F'|' '{printf "  - %-30s . %s\n", $1, $2}'
  drift=1
fi

if [ $drift -eq 0 ]; then
  ui_sub_n=$(echo "$ui_sub" | wc -l)
  ui_master_n=$(echo "$ui_master" | wc -l)
  echo "[scan_field_level_coverage] OK — $ui_sub_n sub-fields + $ui_master_n master fields all enforced."
fi
exit $drift
