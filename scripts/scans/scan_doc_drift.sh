#!/usr/bin/env bash
# scan_doc_drift.sh
# Warns when CHANGES.md / SYSTEM_STATUS.md / ERROR_DASHBOARD.md
# are older than the most recent code change. This catches the
# "I shipped a feature and forgot to update docs" failure mode.
# Exit code: 0 if up-to-date, 1 if drift detected.

set -euo pipefail
ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"

last_code_change=$(find "$ROOT/phenomenon" -type f \( -name '*.py' -o -name '*.jsx' -o -name '*.js' \) \
  -not -path '*/node_modules/*' -not -path '*/__pycache__/*' -not -path '*/reports/*' \
  -printf '%T@\n' 2>/dev/null | sort -nr | head -1)

drift=0
for doc in "$ROOT/phenomenon/CHANGES.md" "$ROOT/SYSTEM_STATUS.md" "$ROOT/ERROR_DASHBOARD.md"; do
  if [ ! -f "$doc" ]; then continue; fi
  doc_time=$(stat -c %Y "$doc" 2>/dev/null || stat -f %m "$doc" 2>/dev/null)
  if [ -z "$doc_time" ]; then continue; fi
  # Round to seconds for comparison
  code_int=${last_code_change%.*}
  if [ "$code_int" -gt "$doc_time" ]; then
    age_min=$(( (code_int - doc_time) / 60 ))
    echo "[scan_doc_drift] HIT — code changed $age_min min after $(basename "$doc") was updated."
    drift=1
  fi
done

if [ $drift -eq 0 ]; then
  echo "[scan_doc_drift] OK — docs are at least as fresh as code."
fi
exit $drift
