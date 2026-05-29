# PHENOMENON — Error Dashboard & Application Health

> **How to use:** Run `cd phenomenon/e2e && npm test` for UI E2E. Run `docker compose exec backend bash -c "cd /workspace/packages/engine && python -m pytest tests/"` for engine unit tests.
> Open `phenomenon/e2e/reports/html/index.html` in a browser for screenshots + videos of any failure.
> Last full run: **2026-05-20 — Engine 30/30 + UI E2E 66/66 PASSING ✅**

---

## 🟢 Current Status: ALL TESTS PASSING

**Engine unit (pytest):** 104/104 ✅ · 11 audit-found bug classes + 40 property tests + 2 field-coverage tests
**UI E2E (Playwright):** 73/73 ✅ (+1 induced-cascade test for the new all-valid-by-default demo loop)
**Demo health:** Seguros 16/16 + KPMG 4/4 = 20/20 VALID on fresh seed.
**Pattern scans:** 7 scans running in preflight + predone (added `scan_field_level_coverage.sh`)
**Field enforcement:** 180/180 sub-fields + 142/142 master fields enforced (was 81 + 58)
**Bug ledger:** 5 owner-found / 12 agent-found.
**Queue:** P1 5/5 drained, P2 9/11 drained, P4 drained via property tests.

| Suite | Tests | Status | Last Run |
|---|---|---|---|
| **Engine — Cascade master→sub** | 10/10 | ✅ All pass | 2026-05-20 |
| **Engine — Cascade sub→sibling** | 10/10 | ✅ All pass | 2026-05-20 |
| **Engine — Reverse + Ecosystem** | 10/10 | ✅ All pass | 2026-05-20 |
| 01 — Smoke (App health) | 5/5 | ✅ All pass | 2026-05-20 |
| 02 — SelectionScreen | 6/6 | ✅ All pass (1 flaky → retried) | 2026-05-20 |
| 03 — Caso Seguros | 13/13 | ✅ All pass | 2026-05-20 |
| 04 — KPMG Demo | 12/12 | ✅ All pass | 2026-05-20 |
| 05 — Contract Creation | 11/11 | ✅ All pass | 2026-05-20 |
| 06 — Verification | 5/5 | ✅ All pass | 2026-05-20 |
| 07 — Right Panel Tabs | 9/9 | ✅ All pass | 2026-05-20 |
| 08 — Cascade Engine | 5/5 | ✅ All pass | 2026-05-20 |
| **09 — Error Boundary (NEW)** | 4/4 | ✅ All pass | 2026-05-20 |

---

## 🐛 Errors Found and Fixed This Session

### FIELD-LEVEL COVERAGE GAP CLOSED — 2026-05-21 (3rd user "empty fields" report)
- **Symptom:** User reported "Condiciones económicas y comerciales fields empty but Verificar todos passes."
- **Root cause:** `_SUB_REQUIRED` and `_MASTER_REQUIRED` enforced only 81/180 sub-fields and 58/142 master fields. **98 sub-field gaps + 84 master-field gaps** allowed empty fields to pass homologation.
- **Fix:** Atomic replacement of both backend dicts with the union of UI fields ∪ existing backend keys. Labels verbatim from `constants.js`. Seeders updated for the 2 contracts that needed new field values.
- **Prevention:** `scripts/scans/scan_field_level_coverage.sh` + 2 pytest tests enforce that every UI field key is in the backend map (or whitelisted).
- **Live reproduction:** 4 different fields cleared via PATCH, each produced correct `[TYPE] Campo específico obligatorio: <Spanish label>` rejection.
- **Tests:** Engine 104/104 ✅, Playwright 72/72 ✅, scan green.

### 1 MORE BUG + 40 PROPERTY TESTS — 2026-05-21 (agent-found, round 7)
After draining P1/P2 queue, ran:
- 27 property tests over every `SUB_CASCADE_MAP` entry — all fire correctly ✓
- 12 property tests over every `CONSISTENCY_RULE` (violation+satisfaction) — all behave correctly ✓
- 1 property test over every `REQUIRED_COVERAGE` entry ✓
- Edge-value audit: unicode/numeric extremes/idempotency all clean

**Bug #11 found and fixed: Invalid calendar dates accepted** (2023-02-29, 2026-13-01, 2026-02-30 stored without rejection). `_sanitize_ess()` now uses `datetime.date.fromisoformat()` after shape check. Locked by 6 new tests.

### 5 MORE BUGS FOUND BY P1/P2 QUEUE AUDIT — 2026-05-21 (agent-found, round 2)
After draining the bug-hunt queue per operating manual, found 5 more silent bugs:
6. **DELETE returned 200 on missing record** — now 404 (`routes_phenomena.py`)
7. **Siniestro on TERMINATED policy** — now 409 (`routes_demo.py` precondition)
8. **Siniestro on non-coverage type** — now 400 (type whitelist)
9. **Double siniestro** — now 409 (status precondition)
10. **add-party with reserved role 'A'/'B'** — now 400 (`routes_ecosystem.py`)

All locked in `test_lifecycle_guards.py` (11 tests). Engine pytest 58/58 ✅. Playwright 72/72 ✅.

### 5 BUGS FOUND BY EXHAUSTIVE AUDIT — 2026-05-21 (agent-found)
After user instructed "make the application bug free uptill now", ran systematic 3-round backend audit covering ~15 bug classes. Found and fixed:
1. **BLOCKED → ACTIVE via PATCH** — IF_exclusion bypass; now returns 409.
2. **effectiveDate accepts non-ISO strings** — XSS-adjacent; now rejected with 400.
3. **partyA accepts `<script>` tags** — XSS prevention; now rejected with 400.
4. **effectiveDate > expiryDate passes homologation** — date ordering check added.
5. **Negative € / % / duration values pass homologation** — non-negativity check on 30+ field names.

All 5 locked in by 14 pytest tests (`test_patch_state_machine_guards.py`, `test_business_logic_guards.py`). All 72 Playwright tests still passing.

### HIGH: KPMG + ARRENDAMIENTO_HOTEL_FUTURO missing from _MASTER_REQUIRED — 2026-05-21 (user-found, 4th instance of same class)
- **Symptom:** KPMG homologation passed with Capital del Circumcontrato, Fecha Límite Finalización Obra, Registro de la Propiedad all empty.
- **Root cause:** `_MASTER_REQUIRED` had no `"KPMG"` entry; backend never enforced any of the 12 KPMG fields. ARRENDAMIENTO_HOTEL_FUTURO same.
- **Fix:** Added entries to `routes_phenomena.py` with the 9 most-critical fields each.
- **Live verification:** API repro confirmed empty fields now produce `valid=false` with enumerated errors.
- **Class-level prevention:** new scan `scan_required_fields_coverage.sh` + 4 new pytest tests catch this whole class.
- **Status:** ✅ Fixed and locked in. Operating manual updated: drain BUG_HUNT_QUEUE proactively to find next-class-of-bug before user.

### HIGH: Engine unit (pytest): 33/33 ✅ → updated count
### HIGH: Operadores tab unreachable for 12 of 16 contracts in Seguros — 2026-05-21 (found by automated preflight, not by user)
- **Symptom:** In any multi-master project (Seguros has 4), the Operadores tab listed only the first master + its 3 sub-contracts. The user could not drag IA operators onto the other 12 contracts.
- **Root cause:** `IAEngineView.jsx:235` used `[master, ...subContracts]`. `App.jsx` already passed `allContracts={contracts}` but the consumer ignored it.
- **Detection:** `scripts/scans/scan_singular_master.sh` ran in `scripts/preflight.sh`; flagged the file:line on first execution.
- **Fix:** IAEngineView now reads `allContracts` prop, falls back to master+subs only if not passed. Dead twin component `IAEngineTab.jsx` deleted.
- **Regression test:** `07-tabs.spec.js` — "Operadores tab shows contracts from every Seguros master" asserts presence of Vida/RC/Daños/Crédito names.
- **Status:** ✅ Fixed and locked in. Confirmed by re-running preflight.

### HIGH: "Verificar todos" only verified the first master + its subs (multi-master cases) — 2026-05-21
- **Symptom (reported by user):** Seguros case had empty required fields (Valor en Nuevo del Bien, Riesgos Cubiertos, Método de Peritación) but "Verificar todos" reported all-valid.
- **Root cause:** `App.jsx` handler used `[...subContracts, master]` where `master = masters[0]`. Multi-master projects (Seguros has 4) had 12/16 contracts silently skipped. Backend `/homologate` was already correct.
- **Fix:** Iterate `Object.values(contracts)` — all subs first, then all masters, so the master coherence check sees fresh sub homologation states.
- **Files:** `apps/contracts/frontend/src/App.jsx`, `e2e/tests/06-verification.spec.js`, `e2e/helpers/api.js`.
- **Regression test:** Seeds Seguros → clears `propertyValue` on Daños master → Verificar todos → asserts Daños master ends up INVALID. (Would have falsely passed before the fix.)
- **Status:** ✅ Fixed and locked in.

### CRITICAL: Blank page when pressing Seguros buttons
- **Symptom:** Pressing "Declarar Siniestro" or "Desbloquear Cobertura" caused the entire application to go blank
- **Root cause:** `addLog` was called with an object `{ phase, msg }` as a single argument, but the function signature is `(phase, msg, type)`. React tried to render the object as a React child → uncaught TypeError → blank screen
- **File fixed:** `phenomenon/apps/contracts/frontend/src/components/SegurosComparativeView.jsx`
- **Fix:** Changed all `addLog?.({ phase: "X", msg: "..." })` calls to `addLog?.("X", "...", "cascade")`
- **Status:** ✅ Fixed

### HIGH: Cascade not firing for KPMG contract types
- **Symptom:** `POST /cascade/trigger` with `partyA` field change had no effect on KPMG contracts (FINANCIACION, HIPOTECA_GARANTIA, CESION_CREDITO)
- **Root cause:** `CASCADE_MAP` in `cascade_engine.py` only listed standard types (NDA, SLA, PAYMENT, IP, DPA). KPMG and Seguros contract types were missing.
- **File fixed:** `phenomenon/packages/engine/phenomenon_engine/cascade_engine.py`
- **Fix:** Updated `CASCADE_MAP` to include all sub-contract types via `_ALL_SUB_TYPES` list
- **Status:** ✅ Fixed

### MEDIUM: SegurosComparativeView `processing` state getting stuck
- **Symptom:** After a failed test run, the "Declarar Siniestro" or "Desbloquear" click was silently ignored (processing=true from previous attempt)
- **Root cause:** No safety timeout — if an API call hangs, `processing` would stay `true` indefinitely
- **File fixed:** `SegurosComparativeView.jsx`
- **Fix:** Added `setTimeout(() => setProcessing(false), 20000)` safety reset cleared in finally
- **Status:** ✅ Fixed

### LOW: Tab label "Motor IA" renamed to "Operadores" broke test
- **Symptom:** `07-tabs.spec.js` couldn't find the "Motor IA" tab
- **Root cause:** UI label change for legal professional audience; test not updated
- **File fixed:** `e2e/tests/07-tabs.spec.js`
- **Fix:** Changed `{ label: 'Motor IA' }` to `{ label: 'Operadores' }`
- **Status:** ✅ Fixed

### LOW: "Opus Completo" text renamed broke verification test
- **Symptom:** `06-verification.spec.js` couldn't find "Opus Completo" in the Verificar tab
- **Root cause:** UI label changed to "Plena eficacia inter partes"
- **File fixed:** `e2e/tests/06-verification.spec.js`
- **Status:** ✅ Fixed

### LOW: `.or()` strict mode violations in multiple tests
- **Symptom:** Tests failed with "strict mode violation: locator resolved to N elements"
- **Root cause:** Playwright's strict mode requires a single element. `.or()` combining multiple text patterns found multiple matches.
- **Files fixed:** `03-seguros-demo.spec.js`, `05-contract-creation.spec.js`, `06-verification.spec.js`
- **Fix:** Added `.first()` or simplified to single precise locators
- **Status:** ✅ Fixed

---

## ⚠️ Known Non-Critical Issues (Not Bugs)

| Issue | Severity | Details |
|---|---|---|
| RiskEngine Fast Refresh warning | Info | `// @refresh reset` is present but Vite still logs the warning. Not a runtime error. Smoke test explicitly ignores it. |
| Edge conditions not persisted | Medium | Conditions set in EdgePanel (graph) are stored in React state only — lost on page refresh. Backend persistence not yet built. |
| ~~No global error boundary~~ | ~~Medium~~ | ✅ **CLOSED 2026-05-20** — boundaries on every panel + 4 E2E tests. Blank-page failure mode is no longer possible. |
| KPMG demo load logic | Low | Fixed previously. `onLoadExisting` avoids `startNewProject` deleting seeded data. |
| `addLog` signature inconsistency | Low | Some components call `addLog("phase", "msg", "type")` correctly, others may still pass objects. Monitor if new components are added. |

---

## 🔧 How to Run Tests

```bash
# Engine unit tests (pytest, ~0.5s)
docker compose exec backend bash -c "cd /workspace/packages/engine && python -m pytest tests/ -v"

# Engine tests with coverage
docker compose exec backend bash -c "cd /workspace/packages/engine && python -m pytest tests/ --cov=phenomenon_engine.cascade_engine --cov=phenomenon_engine.ecosystem_engine --cov-report=term"

# UI E2E — all 66 tests (takes ~5 minutes)
cd phenomenon/e2e
npm test

# Individual suites
npm run test:smoke        # 01 — Quick health check (30 seconds)
npm run test:seguros      # 03 — Seguros demo full flow
npm run test:kpmg         # 04 — KPMG financial demo
npm run test:contracts    # 05 — Contract creation
npm run test:verify       # 06 — Verification/homologation
npm run test:tabs         # 07 — All right panel tabs
npm run test:cascade      # 08 — Cascade engine

# View last HTML report (with screenshots + videos of failures)
npm run report
# Opens: phenomenon/e2e/reports/html/index.html
```

---

## 📋 Backend Error Monitoring

```bash
# Check for Python errors in backend
docker compose logs backend --tail=50 2>&1 | grep -iE "error|exception|traceback|500"

# Check for frontend errors
docker compose logs frontend --tail=20 2>&1 | grep -iE "error|SyntaxError|cannot find|failed"

# Backend health check
# Open: http://localhost:8000/health
# Expected: {"status":"ok","engine":"phenomenon-engine@0.2.0",...}
```

---

## 🚦 Pre-Demo Checklist

Run this before any investor/partner demonstration:

```bash
# 1. Verify all containers running
docker compose ps
# Expected: db, backend, frontend — all "Up"

# 2. Run smoke tests only (fastest check)
cd phenomenon/e2e && npm run test:smoke
# Expected: 5 passed

# 3. Seed KPMG demo
# (from the browser) Click "Demo KPMG" on SelectionScreen

# 4. Run KPMG-specific tests
npm run test:kpmg
# Expected: 12 passed

# 5. If anything fails
docker compose logs backend --tail=20
docker compose logs frontend --tail=10
```

---

## 📊 Error Pattern Reference

These are the most common errors and their causes:

| Error message | Cause | Fix |
|---|---|---|
| "Objects are not valid as a React child" | Component passed an object `{}` to JSX render | Check `addLog` calls — must be `addLog("phase", "msg", "type")` not `addLog({phase,msg})` |
| "Identifier has already been declared" | Duplicate import in JS file | Check for duplicate `import { X }` for the same name from the same module |
| "Could not Fast Refresh (RISK_COLORS incompatible)" | RiskEngine.jsx mixes component + utility exports | `// @refresh reset` is at top of file — this is expected, not an error |
| Blank page after button click | React error boundary triggered | Open browser DevTools → Console → look for the error before the blank |
| "parentId" not found (Python 500) | Used `record.parent_id` instead of `record.parentId` | Always use camelCase `parentId` in Python engine code |
| Cascade fires but nothing updates | Contract type not in CASCADE_MAP | Add type to `_ALL_SUB_TYPES` in `cascade_engine.py` |
| "strict mode violation" (Playwright) | `.or()` locator matched multiple elements | Add `.first()` or use more specific locator |

---

*Last updated: 2026-05-20 — 66/66 tests passing*
*To regenerate this file after a test run: `cd phenomenon/e2e && npm test` then review `reports/results.json`*
