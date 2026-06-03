# PHENOMENON — Registro de Cambios

---

## [2026-05-31] — CircularMeter: per-metric detail panels + visual clarity + `buildPhaseDetails` extraction

**File:** `apps/contracts/frontend/src/components/SegurosComparativeView.jsx`

`buildPhaseDetails` extracted as a standalone function above `PhenomenonIIIFlowGraph`. Takes all 8 props; returns the F1/F2/F3 config object. Reduces the component body to a thin render shell with two state hooks and a builder call.

`CircularMeter` gains `active` prop (highlighted border + background when detail is open). `stopPropagation` removed (was dead code — card outer div has no onClick). `onClick` is now passed through directly.

Card header `onClick` updated to call both `setActivePhase` and `setActiveMetric(null)` — clicking the header clears any open metric detail panel before showing the sub-type list.

`detail` arrays added to all 12 `liveValues` entries (4 computed rows per metric from props). Per-metric detail panel rendered inside each card when `activeMetric` matches; each of the 4 meters now shows its own independent data on click instead of all triggering the same sub-type list.

**File:** `apps/contracts/frontend/src/components/SegurosComparativeView.test.jsx`

New test: "clicking the card header clears the active metric detail panel" — validates the two-state-machine interaction. Suite: 22 tests, all passing.

---

## [2026-05-31] — CircularMeter: resize + long-value truncation; remove Flujómetro mini-map bar

**File:** `apps/contracts/frontend/src/components/SegurosComparativeView.jsx`

`CircularMeter` scaled up: SVG 56×56 → 76×76, radius 22 → 30, center (28,28) → (38,38), strokeWidth 4.5 → 5. Icon fontSize 12 → 14 (y=32), value fontSize adaptive 12/10.5/9/8 based on display length (y=47). Label fontSize 7.5 → 9, maxWidth 60 → 80.

Long-value truncation added: values longer than 10 chars are sliced to 9 chars + "…" before rendering in the SVG `<text>` node, preventing ring overflow for F3 values like "P3.1 Causante directo" and "No (automática)".

Flujómetro mini-map bar removed from Cartera tab (dark navy header + F1/F2/F3 mini nodes, ~88 lines). It was overlapping content with no added value given the full Flujómetro tab.

**File:** `apps/contracts/frontend/src/components/SegurosComparativeView.test.jsx`

R constant updated 22 → 30. Two new tests: truncation of >10 char values renders "P3.1 Caus…", adaptive font-size=8 for truncated 10-char display. Suite grows to 19 tests, all passing.

---

## [2026-05-31] — CircularMeter gauges + remove Tres productos / quote bar

**File:** `apps/contracts/frontend/src/components/SegurosComparativeView.jsx`

New `CircularMeter` function component added (before `PhenomenonIIIFlowGraph`): SVG ring gauge with proportional `stroke-dasharray` fill clamped to [0, 100], icon + value centered inside the ring, hover highlight, 0.5 s ease transition on fill. Exported as a named export alongside `PhenomenonIIIFlowGraph`.

`pct` field added to every `liveValues` entry inside `PHASE_DETAILS` in `PhenomenonIIIFlowGraph`. Percentage semantics: F1 prima = premium/coverage ratio; pólizas = count/4; riesgo = direct %; F2 daño = damage/coverage; indemnización = indemnización/damage; booleans map to 0/100. All divisions guarded against zero denominator.

Flat text metric rows (with inline progress bars) replaced by a **2×2 `CircularMeter` grid** in each F1/F2/F3 phase card. Clicking any meter triggers the same phase expand/collapse as clicking the card.

Removed from `PhenomenonIIIPanel`: "Tres productos derivados" section (three product cards) and dark navy quote bar ("No calculamos solo cuánto cuesta un seguro…").

**File:** `apps/contracts/frontend/src/components/SegurosComparativeView.test.jsx`

`CircularMeter` added to named import. New `describe` block "CircularMeter — SVG ring geometry" with 6 tests: pct=0 zero-fill, pct=100 full-fill, negative pct clamped, pct>100 clamped, no NaN in dasharray, onClick fires. Two additional tests in FlowGraph block: SVG count ≥ 12, no NaN across all rings with zero props.

---

## [2026-05-31] — Flujómetro: rename, panel redesign, Cartera mini-map, AddPolicy highlight

**File:** `apps/contracts/frontend/src/components/SegurosComparativeView.jsx`

Tab renamed from "◈ PHENOMENON III" → "⚡ Flujómetro". Inactive tab now gold-tinted (was invisible). Panel heading redesigned: large "Flujómetro" (22px/900) with subtitle "Motor fenomenológico del seguro · F1 → F2 → F3". PHENOMENON III badge removed from visible UI.

Removed from `PhenomenonIIIPanel`: "Tesis central" gold banner, "Estructura de los tres planos" section (PLANES.map render), source document citation. Space replaced by the live FlowGraph which now shows all metric values always-visible on phase cards. Clicking a card expands sub-type detail panel.

`AddPolicyPanel` highlighted: gold gradient background, `2px solid ${C.gold}70` border, ➕ icon, bold heading.

Flujómetro mini-map added to Cartera tab (below policy columns): compact navy header + F1/F2/F3 node row with live premium, policy count, siniestro status. Clicking navigates to the Flujómetro tab.

**File:** `apps/contracts/frontend/src/components/SegurosComparativeView.test.jsx`

Test selectors updated to match renamed text (9 tests total, all passing).

---

## [2026-05-31] — PhenomenonIIIFlowGraph: live interactive phase graph

**File:** `apps/contracts/frontend/src/components/SegurosComparativeView.jsx`

New `PhenomenonIIIFlowGraph` sub-component (extracted from `PhenomenonIIIPanel`). Receives computed live values (premium, coverage, damage, indemnización, siniestro status, risk level) as props. Renders clickable F1/F2/F3 phase nodes; clicking toggles a sub-type detail panel showing P1.x/P2.x/P3.x active/inactive status.

`fmtEur` deduplicated to module level. `PhenomenonIIIFlowGraph` exported as named export for testability. Vitest + @testing-library/react test infrastructure added.

---

## [2026-05-31] — PhenomenonIIIPhaseBar: light-theme redesign (visibility fix)

**File:** `apps/contracts/frontend/src/components/SegurosComparativeView.jsx`

Lines 199–349 (`PhenomenonIIIPhaseBar` function, display-only replacement). Previous dark theme (`#0d1117`, 7–8px, `#8b949e` text) was invisible. New theme: `C.goldBg` container, navy title banner, compact F1/F2/F3 boxes, fractalization pills. `SEC_TYPES` unused import removed.

---

## [2026-05-31] — PHENOMENON III dedicated panel + tab navigation

**File:** `apps/contracts/frontend/src/components/SegurosComparativeView.jsx`

New `PhenomenonIIIPanel` component. Tab switcher (`phenomTab`: "cartera" | "phenom3"). Pills in `PhenomenonIIIPhaseBar` navigate to the Flujómetro tab. `onOpenPanel` prop added with `= null` default guard.

---

## [2026-05-31] — PHENOMENON III fractalization enums + model fields

**Source:** `PHENOMENON_III_Seguro_y_EDCO_EDCIB_fractalizado.docx` §V.1-V.3

Three new enums in `packages/engine/phenomenon_engine/enums.py`: `CoverageType` (P1.1–P1.5), `FerenciaType` (P2.1–P2.5), `ReclamacionType` (P3.1–P3.5). Four new Optional fields on `PhenomenonRecord`: `coverage_type`, `ferencia_type`, `reclamacion_type`, `fractal_index` (validated by Pydantic field_validator). All additive; no existing records affected.

New test file: `packages/engine/tests/test_fractalization_enums.py` — 35 tests.

---

## [2026-05-31] — PHENOMENON III frontend: fractalization badges + constants

**File:** `apps/contracts/frontend/src/constants.js`

Three new exported constants: `PHENOMENON_III_COVERAGE_TYPES`, `PHENOMENON_III_FERENCIA_TYPES`, `PHENOMENON_III_RECLAMACION_TYPES`. Six new `SUB_FIELDS` sections. P1.x/P2.x/P3.x badges on sub-contract rows. New "P1 PHENOMENON III" row in ComparisonTable.

---
