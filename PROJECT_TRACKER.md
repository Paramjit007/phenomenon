# PHENOMENON — Project Tracker & Build Checklist

> **How to use this file:**
> - ✅ = Done and tested | 🔨 = Built but not tested | ⏳ = In progress | ❌ = Not started | 🐛 = Has known bug
> - Update this file after every session. Any agent can read it cold and know exactly where things stand.
> - Last updated: 2026-05-19

---

## 🚦 Current System Status

| Item | Status | Notes |
|---|---|---|
| App running (Docker) | ✅ | `docker compose up -d` from `phenomenon/` |
| Frontend HMR (auto-reload) | ✅ | Volume-mounted + Vite polling, changes live in ~1s |
| Backend HMR (auto-reload) | ✅ | uvicorn --reload watching both backend + engine dirs |
| Database (PostgreSQL) | ✅ | Persistent volume, survives restarts |
| Claude AI clauses | ✅ | Needs ANTHROPIC_API_KEY in .env |
| KPMG demo loadable | 🔨 | Seeder works; logic bug: startNewProject deletes seeded data after load |

---

## 📋 Master Feature Checklist

### Infrastructure
- [x] Docker Compose (db + backend + frontend)
- [x] FastAPI backend with PostgreSQL
- [x] React + Vite frontend
- [x] Volume mounts for hot-reload (frontend src/ + backend + engine)
- [x] Claude API integration with Spanish legal fallback
- [x] SYSTEM_STATUS.md (complete agent reference)
- [x] CLAUDE.md updated (mandatory read for all agents)

### Core Contract System
- [x] Multi-project management (switch, rename, reset, delete)
- [x] 10 contract templates (CSM, SAAS, DISTRIBUCION, AGENCIA, COLABORACION, CONSULTORIA, ARRENDAMIENTO, NDA_BILATERAL, COMPRAVENTA_SOLAR, KPMG)
- [x] Sub-contract generation via Claude AI (+ fallback clauses in Spanish)
- [x] All sub-contract types: NDA, SLA, PAYMENT, DPA, IP, FINANCIACION, HIPOTECA_GARANTIA, CESION_CREDITO, CONDICION_SOLAR, PAGO_APLAZADO, CARGAS_URBANISTICAS
- [x] Clause library (40+ real Spanish clauses, drag-drop)
- [x] Printable legal document (A4 Spanish format, print CSS)

### Cascade & Automation
- [x] Master→sub cascade (ESS change propagates)
- [x] Sub→sibling cascade (term change propagates between related types)
- [x] Sub→master reverse cascade (flags master for review)
- [x] Auto-cascade on field save (no manual trigger needed)
- [x] Cascade rules: SUB_CASCADE_MAP + REVERSE_CASCADE_MAP

### Homologation
- [x] Per-contract homologation (ESS + AG + IA + type-specific fields)
- [x] Ecosystem homologation (all contracts as one unit)
- [x] 6 cross-contract consistency rules (NDA≥DPA, payment days ≤60, etc.)
- [x] Coverage checker (required sub-contract types present?)
- [x] Opus levels: PARTIAL → COMPLETE → OPONIBLE

### Lifecycle
- [x] Terminate contract (TERMINATED status, cascades to dependents)
- [x] Add party mid-lifecycle (novación subjetiva, Art. 1203 CC)
- [x] Add contract mid-lifecycle
- [x] Party data propagated to ALL contracts on add
- [x] Additional parties shown in ContractDetailPanel fields
- [x] Auto-suggest next available role (C→D→E…) when adding party
- [x] Inline error when party role already exists

### Graph (Left Panel)
- [x] Draggable nodes, radial auto-layout
- [x] Master→sub IF edges (animated dashed, colored by type)
- [x] Sibling IF edges (dotted cyan)
- [x] Flow particles: gold (money out) + cyan (rent back) for KPMG
- [x] Zoom (scroll wheel + buttons) and pan (middle-mouse)
- [x] Click edge → EdgePanel (IF rules + condition builder)
- [x] Double-click node → NodeQuickEdit (edit fields + Apply & Propagate)
- [x] Pending edit state (yellow node while user types)
- [x] Cascade flash animation (orange pulse when cascade fires)
- [x] Financial amount labels on KPMG nodes
- [x] Lifecycle toolbar (Terminate / Edit buttons)
- [ ] Add contract from graph toolbar (not wired for all types)
- [ ] Edge conditions saved to backend (currently in-memory only)

### Right Panel
- [x] Campos tab: all field groups (ESS, party, contract, sub, additionalParties, clauses, IA, opus)
- [x] Campos tab: field highlight with orange pulse when navigated from risk/error
- [x] Ecosistema tab: health ring 0-100, contract tree, IF consistency, coverage, party mgmt
- [x] Demo KPMG tab: EURIBOR/spread/term sliders, live PMT, amortization, sensitivity
- [x] Riesgo tab: 20+ risk rules, KPMG-specific risks, navigate to field on click
- [x] Verificar tab: homologation results, clickable errors → navigate to field
- [x] Red IF tab: edit any field, cascade trace log, topology display
- [x] Motor IA tab: IA operator assignment with compatibility check
- [x] Documento tab: printable legal contract
- [x] ImpactNotification: top-left slide-in after cascade — risks + recommendations + clickable contracts

### KPMG Demo Case
- [x] Backend seeder: 4 pre-filled contracts with real Spanish legal clauses
- [x] SelectionScreen featured card (one-click demo load)
- [x] Live EURIBOR cascade (slider → 1.2s debounce → backend update → graph flash)
- [x] PMT calculator (Sistema Francés, accurate)
- [x] Amortization table (12 months)
- [x] Demo story (6-step investor narrative)
- [x] Crisis button (+2% EURIBOR shock)
- [x] Build Complete button (cosa futura → cosa real)
- [x] Register Hipoteca button (Opus PARCIAL → OPONIBLE)
- [x] Sensitivity analysis (EURIBOR thresholds, coverage analysis, cosa futura risk)
- [x] KPMG-specific risk rules (EURIBOR threshold, deadline, hipoteca pending, cesión not notified)
- 🐛 Demo load logic bug: `startNewProject` deletes seeded data. Need `onLoadExistingProject` callback.

---

## 🏗️ The 3 Cases To Build (Sessions Plan)

---

### SESSION 1 — Compraventa de Terreno (Refinement)

**Estimated effort:** Small (1–2 hours) | **Status:** ❌ Not started

The base case (COMPRAVENTA_SOLAR) is 80% done. This session adds philosophical depth from the Word document.

#### To Build:
- [ ] **Typed IF fields** — distinguish `IF_temporal` (2-year deadline), `IF_logica` (urbanistic condition), `IF_oposicion` (non-payment) in the template and homologation
- [ ] **Traditio field** — `tradicionType: "real" | "instrumental (Art. 1462 CC)"` — real traditio ≠ escritura pública
- [ ] **Ser/Bien/Cosa annotation** — fields tagged as belonging to "cosa" (physical object), "bien" (property right), or neither
- [ ] **Registro = diffusion, not legitimacy** — risk rule: warn when user treats inscription as guarantee of real traditio
- [ ] **New risk rules:**
  - `condicion_no_garantizada` — warn if user marks condición urbanística as guaranteed obligation
  - `traditio_vs_escritura` — info rule explaining Art. 1462 CC distinction
  - `plazo_2_anios` — high risk if construction target > 2 years from contract date
- [ ] **New template: `COMPRAVENTA_TERRENO`** — simpler than COMPRAVENTA_SOLAR (no solar suspended condition, direct purchase with deferred payment only)
  - ESS: same 5 fields
  - contractFields: totalPrice, priceAtSigning, deferredPrice, paymentDeadlineDays, urbanisticConditionType, sellerObligations
  - autoGenerates: PAGO_APLAZADO, CARGAS_URBANISTICAS (no CONDICION_SOLAR)
- [ ] **Update SYSTEM_STATUS.md**
- [ ] **Update PROJECT_TRACKER.md**
- [ ] **Append CHANGES.md**

#### Testing Checklist:
- [ ] Create project with COMPRAVENTA_TERRENO template
- [ ] Fill all fields → run homologation → should pass
- [ ] Test PAGO_APLAZADO + CARGAS_URBANISTICAS generation
- [ ] Check risk engine shows the new traditio/conditon rules
- [ ] Verify no JS console errors

---

### SESSION 2 — Caso Seguros (Insurance — 4 Types Simultaneously)

**Estimated effort:** Large (3–5 hours) | **Status:** ✅ Built — seeder tested (16 contracts, BLOCKED status confirmed)

The most strategically important case. Demonstrates PHENOMENON's combinatoria by showing 4 insurance types with the same deep engine structure but different modulaciones.

#### Built:

**Backend:**
- [x] New type-specific homologation checks for insurance types in `_SUB_REQUIRED` (routes_phenomena.py)
- [x] New cascade rules for insurance (EXCLUSIONES → COBERTURA, VALIDACION_FINANCIERA → COBERTURA_CREDITO, etc.)
- [x] New demo seeder: `POST /demo/seguros/seed` — seeds all 4 insurances simultaneously (16 contracts)
- [x] `POST /demo/seguros/siniestro` — phase transition: ACTIVE → SINIESTRO_PENDIENTE → INDEMNIZACION_PAGADA | RECHAZO
- [x] `POST /demo/seguros/unblock-coverage` — resolves IF_exclusion and activates blocked coverage
- [x] Bug fix: `_delete_all_contracts()` deletes sub-contracts before masters (FK violation fix)
- [ ] Risk scoring for insurance in RiskEngine.jsx — not yet added (low priority)

**Constants (constants.js):**
- [x] Template `SEGURO_VIDA` → generates: COBERTURA_VIDA, EXCLUSIONES_VIDA, PRIMA_VIDA
- [x] Template `SEGURO_RC` → generates: COBERTURA_RC, LIMITES_RC, FRANQUICIA_RC
- [x] Template `SEGURO_DANOS` → generates: COBERTURA_DANOS, PERITACION, EXCLUSIONES_DANOS
- [x] Template `SEGURO_CREDITO_COMERCIAL` → generates: COBERTURA_CREDITO, VALIDACION_FINANCIERA, RIESGO_EMPRESARIAL
- [x] Sub-contract fields for all 12 types (full SUB_FIELDS entries)
- [x] SUB_META entries for all 12 new types
- [x] SUB_IF_EDGES for insurance IF connections (type: "exclusion" + "logic")
- [x] SUB_CASCADE_MAP, SUB_CASCADE_FIELDS, SUB_CASCADE_FIELD_LABELS extendidos
- [x] New statuses: BLOCKED, SINIESTRO_PENDIENTE, INDEMNIZACION_PAGADA, RECHAZO
- [x] INSURANCE_TEMPLATE_KEYS, INSURANCE_POLICY_CONFIG helpers exported

**Engine (cascade_engine.py):**
- [x] Insurance cascade rules in SUB_CASCADE_MAP (EXCLUSIONES_VIDA→COBERTURA_VIDA, VALIDACION_FINANCIERA→COBERTURA_CREDITO, etc.)
- [x] BLOCKED status used in seeder and siniestro endpoints
- [x] Insurance REVERSE_CASCADE_MAP entries

**New UI Component: `SegurosComparativeView.jsx`**
- [x] 4-column layout showing all 4 insurance types side-by-side
- [x] Shared structure highlighted (ESS/AG/IF/Opus common pattern shown in header)
- [x] Each column: policy status, coverage amount, sub-contract list with status dots
- [x] Siniestro button → ACTIVE → SINIESTRO_PENDIENTE → INDEMNIZACION_PAGADA | RECHAZO
- [x] BLOCKED column with ⛔ indicator + blocking reason + Desbloquear button
- [x] IF_exclusion footer explaining non operator (Bloque II §4)

**New Right Panel Tab: `🛡️ Seguros`**
- [x] Visible only when insurance masters are loaded (`isSegurosCase`)
- [x] Shows SegurosComparativeView with all 4 policies
- [x] Navigates to contract detail on sub-contract click

**SelectionScreen:**
- [x] Featured Seguros demo card (green, side by side with KPMG card)
- [x] `POST /demo/seguros/seed` loads all 4 simultaneously via `onLoadExisting`
- [x] Grid filter updated: `!tmpl.isDemo` excludes all demo templates
- [x] KPMG bug fixed: also uses `onLoadExisting` to avoid startNewProject deletion

**SYSTEM_STATUS.md + PROJECT_TRACKER.md + CHANGES.md:**
- [x] Full update

#### Testing Checklist:
- [x] POST /demo/seguros/seed → 16 contracts created (4 masters, 12 subs)
- [x] COBERTURA_CREDITO shows BLOCKED status in seeded data
- [ ] Load all 4 insurance types in browser → comparative view appears
- [ ] Click "Declarar Siniestro" → phase transition visible
- [ ] Click "Desbloquear Cobertura" → COBERTURA_CREDITO becomes ACTIVE
- [ ] Ecosystem homologation runs across all 4
- [ ] No JS console errors

---

### SESSION 3 — KPMG Corporate (Governance Layer)

**Estimated effort:** Medium (2–3 hours) | **Status:** ✅ Built — implementation complete, pending selective testing

Adds corporate approval/compliance/audit workflow on top of the existing KPMG financial structure. Different purpose: governance, not finance.

#### To Build:

**New Template: `KPMG_CORPORATE`**
- [x] A1: "Validación estructural corporativa"
- [x] Sub-contracts: COMPLIANCE_CHECK, AUDIT_REPORT, REGULATORY_APPROVAL, BOARD_RESOLUTION
- [x] Fields: approvalChain, complianceOfficer, auditScope, regulatoryBody, approvalDeadline
- [x] autoGenerates: COMPLIANCE_CHECK, AUDIT_REPORT, REGULATORY_APPROVAL

**Logic Gate IF (new engine feature):**
- [x] `IF_logic_gate` — a blocking condition between two sub-contracts
- [x] Example: REGULATORY_APPROVAL cannot activate until COMPLIANCE_CHECK = VALID
- [x] Show in graph as a red blocking edge (not dashed, solid red with ✗)
- [x] New node state: `WAITING` (pending a predecessor)

**New UI: `ApprovalChainView.jsx`**
- [x] Horizontal DAG showing approval steps (left → right flow)
- [x] Each step: document type, responsible person, status, deadline
- [x] Blocked steps grayed out with "Awaiting [predecessor]" label
- [ ] Timeline bar showing days elapsed vs. deadline

**Graph Enhancement:**
- [ ] Horizontal layout option (for DAG-style approval chains) vs. current radial
- [ ] Toggle button: "Radial / Chain view"

**SelectionScreen:**
- [x] KPMG section with two sub-options: "Financial Structure" and "Corporate Governance"
- [x] Preserve seeded KPMG demo without deleting existing contracts
- [x] KPMG corporate selection card added to the featured case row

**SYSTEM_STATUS.md + PROJECT_TRACKER.md + CHANGES.md:**
- [x] Full update

#### Testing Checklist:
- [ ] Create KPMG_CORPORATE project
- [ ] Generate all 4 sub-contracts
- [ ] REGULATORY_APPROVAL shows WAITING until COMPLIANCE_CHECK = VALID
- [ ] Logic gate edge visible in graph (red blocking edge)
- [ ] Approve COMPLIANCE_CHECK → REGULATORY_APPROVAL unblocks
- [ ] Ecosystem homologation validates the full approval chain
- [ ] No JS console errors

---

## 🐛 Known Bugs (Fix Priority)

| # | Bug | Severity | File | Status |
|---|---|---|---|---|
| 1 | KPMG demo load: `startNewProject` deletes seeded data | High | `SelectionScreen.jsx` + `App.jsx` | ✅ Fixed |
| 2 | Edge conditions not persisted to backend (in-memory only) | Medium | `ContractGraph.jsx` | ❌ Not fixed |
| 3 | `// @refresh reset` needed in RiskEngine.jsx (Vite Fast Refresh warning) | Low | `RiskEngine.jsx` | ✅ Fixed |
| 4 | Duplicate `detectRisks` import in App.jsx | Critical | `App.jsx` | ✅ Fixed |
| 5 | `parentId` vs `parent_id` in SubCascadeEngine/ReverseCascadeEngine | Critical | `cascade_engine.py` | ✅ Fixed |
| 6 | Regenerate button created duplicate sub-contracts | High | `ContractDetailPanel.jsx` | ✅ Fixed |
| 7 | ImpactNotification covered fields (bottom-right → moved top-left) | Medium | `ImpactNotification.jsx` | ✅ Fixed |
| 8 | Add party always defaulted to role "C" (no auto-suggest, no inline error) | Medium | `EcosystemPanel.jsx` | ✅ Fixed |

---

## 📅 Session Timeline

| Session | Case | Estimated Date | Status | Blocked By |
|---|---|---|---|---|
| Session 1 | Compraventa Terreno refinement | 2026-05-19 | ✅ Built (pending browser test) | Nothing |
| Session 2 | Caso Seguros (4 insurance types) | 2026-05-19 | 🔨 Built, seeder tested (16 contracts) | Nothing |
| Session 3 | KPMG Corporate governance | 2026-05-19 | 🔨 Built (pending browser test) | Nothing |
| Bug Fix | KPMG demo load bug (#1) | 2026-05-19 | ✅ Fixed (onLoadExisting callback) | Nothing |

---

## ✅ Testing Sign-Off

Before marking a feature as ✅ (fully tested), confirm:

1. No JS errors in browser console (F12 → Console)
2. No red Vite overlay in browser
3. Backend logs show no 500 errors (`docker compose logs backend --tail=20`)
4. The specific feature works as described
5. Existing features still work (regression check: create a project, generate sub-contracts, homologate)

---

## 📝 Notes for Next Agent

- **Start here:** Read `SYSTEM_STATUS.md` for full technical reference, then read `PROJECT_TRACKER.md` (this file) for current status
- **To run the app:** `docker compose up -d` from `phenomenon/` directory
- **To test the API:** `http://localhost:8000/docs` (Swagger UI)
- **After any work:** Update the checkboxes in this file + append to `phenomenon/CHANGES.md`
- **If context fills:** Update this file with exactly what was done/not done before stopping
