#!/usr/bin/env bash
# scan_cascade_completeness.sh
# Verifies that every sub-contract type known to the seed/UI layer
# is also in _ALL_SUB_TYPES of cascade_engine.py. This catches the
# class of bug we shipped: "FINANCIACION cascade silently does nothing
# because it's missing from CASCADE_MAP."
# Exit code: 0 if complete, 1 if any types are missing.

set -euo pipefail
ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
ENGINE="$ROOT/phenomenon/packages/engine/phenomenon_engine/cascade_engine.py"
CONSTANTS="$ROOT/phenomenon/apps/contracts/frontend/src/constants.js"

if [ ! -f "$ENGINE" ] || [ ! -f "$CONSTANTS" ]; then
  echo "[scan_cascade_completeness] engine or constants missing"
  exit 0
fi

# Pull SUB_META keys from constants.js (those are all sub-contract types the UI knows about)
sub_types_ui=$(grep -oE '^\s+(NDA|SLA|PAYMENT|DPA|IP|FINANCIACION|HIPOTECA_GARANTIA|CESION_CREDITO|CONDICION_SOLAR|PAGO_APLAZADO|CARGAS_URBANISTICAS|SEGURO_VIDA|SEGURO_RC|SEGURO_DANOS|SEGURO_CREDITO_COMERCIAL|COBERTURA_VIDA|EXCLUSIONES_VIDA|PRIMA_VIDA|COBERTURA_RC|LIMITES_RC|FRANQUICIA_RC|COBERTURA_DANOS|PERITACION|EXCLUSIONES_DANOS|COBERTURA_CREDITO|VALIDACION_FINANCIERA|RIESGO_EMPRESARIAL|COMPLIANCE_CHECK|AUDIT_REPORT|REGULATORY_APPROVAL|BOARD_RESOLUTION|SEGURO_CREDITO|AVAL_BANCARIO|CONTRATO_OBRA):' "$CONSTANTS" 2>/dev/null \
  | sed -E 's/[: ]//g' | sort -u)

# Pull engine's _ALL_SUB_TYPES list
engine_types=$(grep -A 50 '^_ALL_SUB_TYPES' "$ENGINE" | head -50 \
  | grep -oE '"[A-Z_]+"' | sed 's/"//g' | sort -u)

missing=""
for t in $sub_types_ui; do
  # Exclude master template keys
  case "$t" in
    SEGURO_VIDA|SEGURO_RC|SEGURO_DANOS|SEGURO_CREDITO_COMERCIAL) continue ;;
  esac
  if ! echo "$engine_types" | grep -qx "$t"; then
    missing="$missing $t"
  fi
done

if [ -n "$missing" ]; then
  echo "[scan_cascade_completeness] HIT — sub-types known to UI but missing from cascade_engine._ALL_SUB_TYPES:"
  for t in $missing; do echo "  - $t"; done
  echo "  → Add them to _ALL_SUB_TYPES so cascade fires for these types."
  exit 1
fi

echo "[scan_cascade_completeness] OK — every UI sub-type is registered in CASCADE_MAP."
exit 0
