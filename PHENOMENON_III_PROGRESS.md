# PHENOMENON III — Integration Progress Tracker

> **READ THIS FIRST** if you are a new agent or resuming after a context reset.
> This file is the single source of truth for where the PHENOMENON III integration stands.
> Update the CURRENT STATE section every time a phase completes or fails.

---

## What we are doing

Integrating `PHENOMENON_III_Flujograma_fenomenologico_del_seguro.docx` into the Seguros case.
Core change: insurance is **3 connected phenomena** (F1 Coverage → F2 Claim → F3 Recovery),
not 1 master + 3 sub-contracts.

Full analysis in: `PHENOMENON_III_English_Analysis.html` (open in browser).

---

## Safety rules — NEVER break these

1. **Do NOT delete or modify** `routes_demo.py` endpoint `/demo/seguros/setup` — the working demo lives here
2. **Do NOT delete or modify** existing constants in `constants.js` (SEGURO_VIDA, SEGURO_RC, SEGURO_DANOS, SEGURO_CREDITO_COMERCIAL)
3. **Do NOT delete or modify** existing engine files — only ADD to them
4. **Run tests before committing each phase** — must stay at 104 passed, 3 skipped
5. **Feature flag** (`PHENOMENON_III_ENABLED` in `constants.js`) must be `false` until Phase 3 is visually verified in browser

---

## How to verify the system is healthy right now

```powershell
# 1. Tests
docker exec phenomenon-backend-1 python3 -m pytest /workspace/packages/engine/tests/ -q --tb=no

# 2. Backend alive
curl http://localhost:8000/health

# 3. Frontend alive
# Open http://localhost:5173 in browser

# 4. Seguros demo still works
curl -X POST http://localhost:8000/demo/seguros/setup
```

Expected: 104 passed, 3 skipped. If you get anything else, DO NOT continue — diagnose first.

---

## Baseline (recorded before any PHENOMENON III changes)

- **Date**: 2026-05-29
- **Tests**: 104 passed, 3 skipped
- **Git commit**: `baseline-pre-phenomenon-iii` (tag)
- **Docker**: phenomenon-backend-1, phenomenon-frontend-1, phenomenon-db-1 running
- **Current Seguros demo**: 16 phenomena (4 masters × 3 subs), flat structure, working

---

## CURRENT STATE

```
Phase 0 — Baseline commit + progress file   [ DONE ]
Phase 1 — constants.js + feature flag       [ NOT STARTED ]
Phase 2 — engine enums + model fields       [ NOT STARTED ]
Phase 3 — frontend F1/F2/F3 visual layer    [ NOT STARTED ]
Phase 4 — backend F2/F3 endpoints           [ NOT STARTED ]
Phase 5 — full F1/F2/F3 demo + cutover      [ NOT STARTED ]
```

**Feature flag location**: `phenomenon/apps/contracts/frontend/src/constants.js`
**Feature flag name**: `PHENOMENON_III_ENABLED`
**Feature flag current value**: `false` (set to true only in Phase 3 after visual verification)

---

## Phase 0 — DONE

### What was done
- Created this progress tracker file
- Created `PHENOMENON_III_English_Analysis.html` (full analysis with diagrams)
- Git commit: baseline committed with tag `baseline-pre-phenomenon-iii`

### How to verify Phase 0 is intact
```powershell
git log --oneline | head -3
git tag | grep baseline
```

### How to rollback Phase 0
Not applicable — Phase 0 is only the tracker file and analysis. Nothing functional changed.

---

## Phase 1 — NOT STARTED

### What Phase 1 does
Adds new constants to `constants.js` only. Zero backend changes. Zero component changes.
The feature flag starts as `false` — the UI is 100% identical to today.

### Files that change in Phase 1
- `phenomenon/apps/contracts/frontend/src/constants.js` — additive only

### What to add (exact keys)
1. `export const PHENOMENON_III_ENABLED = false;` — feature flag, controls all Phase 3 rendering
2. `export const PHENOMENON_PHASE_CFG` — F1/F2/F3 color/label/border config
3. `export const SEC_TYPES` — DE, DS, OBC definitions
4. `export const IF_TRIGGER_TYPES` — siniestro_cst, culpable_id
5. `export const INSURANCE_F1_F2_F3_TYPES` — the 12 new phenomenon type keys (4 insurances × 3 phases)

### How to verify Phase 1 worked
```powershell
# Frontend still loads (flag is false = visually identical)
# Open http://localhost:5173 → Seguros tab → looks EXACTLY the same as before
# No console errors in browser
# Tests still 104 passed
docker exec phenomenon-backend-1 python3 -m pytest /workspace/packages/engine/tests/ -q --tb=no
```

### How to rollback Phase 1
```bash
git diff constants.js   # see what changed
git checkout -- phenomenon/apps/contracts/frontend/src/constants.js
```

---

## Phase 2 — NOT STARTED

### What Phase 2 does
Adds new enums and optional fields to the Python engine. Non-breaking — all new values are
additions to existing enums or Optional fields with defaults.

### Files that change in Phase 2
- `phenomenon/packages/engine/phenomenon_engine/enums.py` — new enum values
- `phenomenon/packages/engine/phenomenon_engine/models.py` — new optional fields

### What to add (exact additions)
**enums.py**:
- `IAFormType.CO_ACTIVA = "co-activa"`
- `IAFormType.CO_OPERACTIO = "co-operactio"`
- New `SECType` enum: DE, DS, OBC
- New `IFTriggerType` enum: SINIESTRO, CULPABLE, MANUAL
- New `InsurancePhase` enum: F1, F2, F3

**models.py** (all Optional with defaults):
- `ferencia_sensual: Optional[str] = None`
- `sec_types: list[str] = Field(default_factory=list)`
- `legal_basis: Optional[str] = None`
- `negaciones: list[str] = Field(default_factory=list)`
- `phenomenological_phase: Optional[str] = None`

### How to verify Phase 2 worked
```powershell
# Rebuild backend
docker compose -f phenomenon/docker-compose.yml up -d --force-recreate backend

# Tests must still pass
docker exec phenomenon-backend-1 python3 -m pytest /workspace/packages/engine/tests/ -q --tb=no
# Expected: 104 passed, 3 skipped — SAME AS BASELINE

# Import check
docker exec phenomenon-backend-1 python3 -c "
from phenomenon_engine.enums import IAFormType, SECType, IFTriggerType, InsurancePhase
from phenomenon_engine.models import PhenomenonRecord
print('CO_ACTIVA:', IAFormType.CO_ACTIVA)
print('OBC:', SECType.OBC)
print('F1:', InsurancePhase.F1)
print('ferencia field exists:', hasattr(PhenomenonRecord.model_fields, 'ferencia_sensual'))
print('ALL OK')
"
```

### How to rollback Phase 2
```bash
git checkout -- phenomenon/packages/engine/phenomenon_engine/enums.py
git checkout -- phenomenon/packages/engine/phenomenon_engine/models.py
# Then rebuild backend
docker compose -f phenomenon/docker-compose.yml up -d --force-recreate backend
```

---

## Phase 3 — NOT STARTED

### What Phase 3 does
Adds the F1/F2/F3 visual layer to `SegurosComparativeView.jsx`. Gated behind
`PHENOMENON_III_ENABLED` flag. When flag = false: identical to today. When flag = true:
F1/F2/F3 phase badges appear above each policy, F3 nodes get dashed borders.

NO new API calls in Phase 3 — uses existing data, just renders it differently.

### Files that change in Phase 3
- `phenomenon/apps/contracts/frontend/src/components/SegurosComparativeView.jsx`

### BEFORE flipping the flag to true
- Test in browser with flag = false (must be identical to today)
- Then flip flag to true
- Test in browser: F1/F2/F3 badges visible, F3 dashed, no console errors
- Only after visual verification: commit

### How to rollback Phase 3 instantly (without git)
In `constants.js`, change: `PHENOMENON_III_ENABLED = true` → `PHENOMENON_III_ENABLED = false`
The UI reverts immediately (Vite HMR, no rebuild needed).

### How to rollback Phase 3 via git
```bash
git checkout -- phenomenon/apps/contracts/frontend/src/components/SegurosComparativeView.jsx
git checkout -- phenomenon/apps/contracts/frontend/src/constants.js
```

---

## Phase 4 — NOT STARTED

### What Phase 4 does
Adds backend endpoints for triggering F2 (loss event) and F3 (recovery).
New endpoint: `POST /phenomena/{id}/siniestro`
New endpoint: `POST /phenomena/{id}/reclamacion`
New engine function: `open_f2_on_siniestro()` in cascade_engine.py
New api call: `triggerSiniestro()` in api/phenomenon.js

### Safety
- Old endpoints untouched
- New endpoints are additive
- The "Trigger Loss Event" button in the frontend only appears when Phase 4 is done AND `PHENOMENON_III_ENABLED = true`

### How to verify Phase 4 worked
```powershell
# Manual test
curl -X POST http://localhost:8000/phenomena/TEST_F1_ID/siniestro -H "Content-Type: application/json" -d '{"cst_type": "loss-event", "description": "Test loss"}'
# Expected: new F2 phenomenon returned in JSON

# Tests: must still be 104+, plus new F1/F2/F3 tests
docker exec phenomenon-backend-1 python3 -m pytest /workspace/packages/engine/tests/ -q --tb=no
```

---

## Phase 5 — NOT STARTED

### What Phase 5 does
- New demo endpoint: `POST /demo/seguros/setup-v2` creating F1/F2/F3 structure
- ContractGraph.jsx: dashed F3 node borders
- App.jsx: demo v2 toggle
- New test file: `test_insurance_f1_f2_f3.py`

### Safety
- Original `/demo/seguros/setup` endpoint stays forever until Phase 5 is visually perfect
- Only add a UI toggle between v1 (old) and v2 (new) — never remove v1 access

---

## Rollback master command

If something goes wrong at any phase and you need to get back to working state immediately:

```bash
# Nuclear option — reverts ALL file changes to last commit
git stash

# Or for individual files:
git checkout -- <filepath>

# Check which commit is the last known good state
git log --oneline

# Go back to baseline tag
git checkout baseline-pre-phenomenon-iii
```

---

## Key file locations

| What | Path |
|---|---|
| Feature flag | `phenomenon/apps/contracts/frontend/src/constants.js` → `PHENOMENON_III_ENABLED` |
| Engine enums | `phenomenon/packages/engine/phenomenon_engine/enums.py` |
| Engine models | `phenomenon/packages/engine/phenomenon_engine/models.py` |
| Cascade engine | `phenomenon/packages/engine/phenomenon_engine/cascade_engine.py` |
| Seguros view | `phenomenon/apps/contracts/frontend/src/components/SegurosComparativeView.jsx` |
| Graph view | `phenomenon/apps/contracts/frontend/src/components/ContractGraph.jsx` |
| API calls | `phenomenon/apps/contracts/frontend/src/api/phenomenon.js` |
| Demo routes | `phenomenon/apps/contracts/backend/app/api/routes_demo.py` |
| Tests | `phenomenon/packages/engine/tests/` |

---

*Last updated: 2026-05-29 — Phase 0 complete. Next: Phase 1 (constants.js additions).*
