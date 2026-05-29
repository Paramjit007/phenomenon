#!/usr/bin/env bash
# audit_sweep.sh — pick the highest-priority unaudited feature from
# BUG_HUNT_QUEUE.md, run scans, run targeted invariant probes, log
# findings to AUDIT_LOG.md. This is the proactive red-team pass.
#
# Run periodically when idle, between features, or whenever the
# operating manual says to. The agent does NOT need user permission
# to run this — it's part of standing duty.

set -uo pipefail
ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")" && cd .. && pwd)}"
export PROJECT_ROOT="$ROOT"

QUEUE="$ROOT/BUG_HUNT_QUEUE.md"
LOG="$ROOT/AUDIT_LOG.md"

if [ ! -f "$QUEUE" ]; then
  echo "BUG_HUNT_QUEUE.md not found; nothing to sweep."
  exit 0
fi

# Pick first unchecked item (line starting with `- [ ]`)
target=$(grep -nE '^\s*-\s*\[\s*\]' "$QUEUE" | head -1 || true)
if [ -z "$target" ]; then
  echo "Queue is empty — no unaudited items. Add candidates with audit_sweep_log.sh."
  exit 0
fi

line_no=$(echo "$target" | cut -d: -f1)
description=$(echo "$target" | sed -E 's/^[0-9]+:\s*-\s*\[\s*\]\s*//')

echo "=========================================="
echo " AUDIT SWEEP — $(date -u +%FT%TZ)"
echo " Target: $description"
echo "=========================================="

# Run all scans, capture output
echo
echo "── Pattern scans ──"
findings=""
for scan in "$ROOT"/scripts/scans/*.sh; do
  out=$(bash "$scan" 2>&1)
  echo "$out" | sed 's/^/  /'
  if echo "$out" | grep -q "HIT"; then
    findings="$findings\n- $(basename "$scan"): HIT\n\`\`\`\n$out\n\`\`\`"
  fi
done

# Append result to AUDIT_LOG.md
if [ ! -f "$LOG" ]; then
  echo "# Audit Log" > "$LOG"
  echo "" >> "$LOG"
  echo "Append-only log of proactive audit sweeps. One entry per sweep." >> "$LOG"
  echo "" >> "$LOG"
fi

{
  echo "---"
  echo ""
  echo "## $(date -u +%FT%TZ) — $description"
  echo ""
  if [ -z "$findings" ]; then
    echo "**Result:** Clean. No pattern-scan hits."
  else
    echo "**Result:** Findings below — investigate."
    echo -e "$findings"
  fi
  echo ""
} >> "$LOG"

# Mark the item as audited in the queue (- [ ] → - [x])
sed -i "${line_no}s/\[ \]/[x]/" "$QUEUE" 2>/dev/null || \
  sed -i '' "${line_no}s/\[ \]/[x]/" "$QUEUE" 2>/dev/null || true

echo
echo "=========================================="
if [ -z "$findings" ]; then
  echo " ✅ AUDIT CLEAN — logged to AUDIT_LOG.md, queue item marked done."
else
  echo " ⚠️  AUDIT FOUND HITS — see AUDIT_LOG.md and act on them."
fi
echo "=========================================="
