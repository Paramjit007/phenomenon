# PHENOMENON Contract Intelligence System — Complete Agent Reference

> **Read this first.** This document lets any new agent understand the full system state without re-reading the conversation history. Updated: 2026-05-19.
> **Also read:** `PROJECT_TRACKER.md` — current build status, checklist of done/pending features, 3-session plan, known bugs with fix status.
> For chronological change history see `phenomenon/CHANGES.md`.
> For framework theory see `PHENOMENON_SKILL.md` and `PHENOMENON_Integrated_Blocks_I_IX.docx`.

---

## 1. How to Run the System

```bash
# Start everything (database + backend + frontend)
docker compose up -d

# After ANY code changes to backend (Python) or new routes:
docker compose up -d --force-recreate backend

# After ANY code changes to frontend src/ — NOT needed (volume-mounted + HMR polling)
# Just save the file; Vite detects it automatically within ~1s

# Full rebuild (only needed if docker-compose.yml or package.json changed):
docker compose build frontend backend && docker compose up -d

# View logs
docker compose logs backend --tail=30
docker compose logs frontend --tail=30

# Run the tester agent
cd phenomenon
powershell -ExecutionPolicy Bypass .\run_tester_agent.ps1
```

**URLs:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

**Environment (`.env` in `phenomenon/`):**
```
ANTHROPIC_API_KEY=sk-ant-...
DB_PASSWORD=phenomenon
CLAUDE_MODEL=claude-sonnet-4-20250514
```

---

## 2. Repository Structure

```
C:\Users\P\Documents\Claude\
├── CLAUDE.md                          # Project instructions for agents
├── SYSTEM_STATUS.md                   # ← THIS FILE — full system reference
├── TESTER_AGENT.md                    # Dedicated QA / tester agent guide
├── CHANGES.md                         # Chronological change log (DO NOT use as reference)
├── phenomenon/                        # The full-stack application
│   ├── docker-compose.yml             # db + backend + frontend services
│   ├── CHANGES.md                     # App-specific change log
│   ├── packages/engine/               # Python PHENOMENON engine (pure, no HTTP)
│   │   └── phenomenon_engine/         # pip-installable package
│   └── apps/contracts/
│       ├── backend/                   # FastAPI + PostgreSQL
│       │   └── app/
│       │       ├── main.py            # Router registration
│       │       ├── models.py          # SQLAlchemy ORM (PhenomenonDB)
│       │       ├── database.py        # PostgreSQL connection
│       │       ├── repositories/      # phenomena_repo.py
│       │       ├── ai/                # claude_client.py, prompts.py
│       │       └── api/               # Route handlers (see Section 4)
│       └── frontend/                  # React + Vite
│           └── src/
│               ├── App.jsx            # Root component, tab routing, state
│               ├── constants.js       # ALL templates, field defs, IA types, maps
│               ├── api/phenomenon.js  # All API calls (single file)
│               ├── hooks/usePhenomenon.js  # All app state + auto-cascade logic
│               └── components/        # See Section 5
├── Caso_KPMG.docx                     # KPMG case (placeholder, no content)
├── Caso_Libia.docx                    # Libya case (placeholder, no content)
├── Caso_EDCO.docx                     # EDCO case (placeholder, no content)
├── PHENOMENON_Caso_KPMG_Completo.docx     # KPMG full spec (corporate validation)
├── PHENOMENON_Caso_Seguros_Completo.docx  # Insurance case full spec (4 types)
├── PHENOMENON_Compraventa_Terreno_Completo.docx  # Land purchase full spec
└── CONTRATO DE ARRENDAMIENTO Y DACIÓN DINERARIA.KPMG.docx  # Real KPMG contract
```

---

## 3. Data Model

**Single table: `phenomena`** (PostgreSQL via SQLAlchemy)

```python
class PhenomenonDB(Base):
    id: str (UUID primary key)
    name: str
    type: str          # "MASTER" | "NDA" | "SLA" | "PAYMENT" | "DPA" | "IP" |
                       # "FINANCIACION" | "HIPOTECA_GARANTIA" | "CESION_CREDITO" |
                       # "CONDICION_SOLAR" | "PAGO_APLAZADO" | "CARGAS_URBANISTICAS" |
                       # "SEGURO_CREDITO" | "AVAL_BANCARIO" | "CONTRATO_OBRA"
    status: str        # "DRAFT"|"ACTIVE"|"MODIFIED"|"NEEDS_REVIEW"|"SUSPENDED"|"TERMINATED"
    parent_id: str     # null for master contracts
    ess_json: dict     # {partyA, partyB, jurisdiction, effectiveDate, expiryDate}
    ag_json: dict      # {clauses: [...], terms: {templateKey, ...all fields...}}
    ia_instances: list # ["ad-actio", "co-implication", ...]
    vectors_json: list
    opus_json: dict    # {status: "ACTIVE", homologation: "PENDING"|"VALID"|"INVALID"}
```

**Pydantic models** (`packages/engine/phenomenon_engine/models.py`):
- `EssFields` — 5 fixed fields: partyA, partyB, jurisdiction, effectiveDate, expiryDate
- `PhenomenonRecord` — full record with `parentId` (camelCase, maps to DB `parent_id`)
- `OpusState` — {status, homologation}

**Important:** `ag_json.terms` is a free-form dict storing ALL template-specific fields (EURIBOR rate, hotel name, catastral reference, additionalParties array, etc.). This avoids DB schema changes for new fields.

---

## 4. Backend API Endpoints

All routes registered in `phenomenon/apps/contracts/backend/app/main.py`.

### `/phenomena` — Core CRUD (`routes_phenomena.py`)

| Method | Path | Description |
|---|---|---|
| GET | `/phenomena/` | List all contracts |
| POST | `/phenomena/` | Create contract |
| PATCH | `/phenomena/{id}` | Update ESS/AG/IA/name/status |
| DELETE | `/phenomena/{id}` | Delete (cascade children) |
| POST | `/phenomena/{id}/homologate` | Run homologation checks |
| POST | `/phenomena/{id}/terminate` | Set TERMINATED, cascade NEEDS_REVIEW to siblings + master |
| GET | `/phenomena/{id}/opus` | Get opus level (PARTIAL/COMPLETE/OPONIBLE) |
| PATCH | `/phenomena/{id}/register` | Register in Registro de la Propiedad → OPONIBLE |
| POST | `/phenomena/{id}/reset` | Delete all children, reset ESS to blank |

**Homologation checks** (`routes_phenomena.py`): ESS fields, AG clauses, IA operators, type-specific terms for NDA/SLA/PAYMENT/DPA/IP/FINANCIACION/HIPOTECA_GARANTIA/CESION_CREDITO/CONDICION_SOLAR/PAGO_APLAZADO/CARGAS_URBANISTICAS.
- New KPMG corporate governance logic: `REGULATORY_APPROVAL` enters `WAITING` and is blocked until a sibling `COMPLIANCE_CHECK` contract is homologated VALID.

### `/cascade` — Cascade Engine (`routes_cascade.py`)

| Method | Path | Description |
|---|---|---|
| POST | `/cascade/trigger` | Master ESS change → propagate to sub-contracts |
| POST | `/cascade/sub-trigger` | Sub-contract term change → propagate to siblings |
| POST | `/cascade/reverse-trigger` | Sub-contract term change → propagate to master |
| GET | `/cascade/sub-map` | Returns SUB_CASCADE_MAP dict |
| GET | `/cascade/reverse-map` | Returns REVERSE_CASCADE_MAP dict |
| GET | `/cascade/preview` | Preview which contracts would be affected |

### `/ecosystem` — Ecosystem Management (`routes_ecosystem.py`)

| Method | Path | Description |
|---|---|---|
| GET | `/ecosystem/{master_id}` | Full ecosystem state (contracts, parties, consistency, health score) |
| POST | `/ecosystem/{master_id}/homologate` | Homologate ALL contracts in sequence + cross-contract consistency checks |
| POST | `/ecosystem/{master_id}/add-party` | Novación subjetiva — add party C/D/E, propagate to all contracts |
| POST | `/ecosystem/{master_id}/add-contract` | Add new sub-contract type mid-lifecycle |

### `/demo` — KPMG Demo (`routes_demo.py`)

| Method | Path | Description |
|---|---|---|
| POST | `/demo/kpmg/seed` | Pre-load full KPMG Hotel Mediterráneo Valencia 5* demo |
| GET | `/demo/amortization` | PMT calculator + amortization schedule |
| POST | `/demo/kpmg/update-euribor` | Update EURIBOR across all KPMG financial contracts |

### `/ai` — AI Generation (`routes_ai.py`)

| Method | Path | Description |
|---|---|---|
| POST | `/ai/generate-contract` | Generate clauses via Claude API (with fallback) |
| POST | `/ai/analyze-cascade` | Analyze cascade impact in Spanish |

### `/documents` — Document export (`routes_documents.py`)

---

## 5. Frontend Components Map

All in `phenomenon/apps/contracts/frontend/src/components/`.

| File | Purpose | Key props/state |
|---|---|---|
| `App.jsx` | Root. Tab routing, all global state. | `rightTab`, `selectedId`, `impactData`, `pendingEditId`, `graphFlashIds` |
| `ContractGraph.jsx` | Left panel graph. Zoom/pan, flow particles, edge click → EdgePanel, node double-click → NodeQuickEdit, cascade flash. | `master`, `subContracts`, `selectedId`, `pendingEditId`, `externalFlashIds` |
| `ContractDetailPanel.jsx` | Right panel "Campos" tab. All field editing. Auto-cascade triggers. | `onFieldEditing` (instant graph signal), `onImpactDetected` (after save) |
| `ImpactNotification.jsx` | Floating panel top-left. Shows after any cascade: what changed, affected contracts (clickable), risks, recommendations. Auto-dismiss 12s. | `impact`, `onNavigate`, `onHomologate` |
| `EcosystemPanel.jsx` | "🌐 Ecosistema" tab. Health ring, contract tree, IF consistency, coverage, party management (add/edit), mid-lifecycle add contract. | `state` from `/ecosystem/{id}` endpoint |
| `KPMGDemoPanel.jsx` | "⭐ Demo KPMG" tab. EURIBOR/spread/term sliders, live PMT calculator, amortization table, demo action buttons (Crisis, Build Complete, Register Hipoteca), sensitivity analysis. | Calls `/demo/kpmg/update-euribor` on slider change |
| `RiskEngine.jsx` | Risk detection (pure client-side). Exports `detectRisks()`, `getRiskLevel()`, `RISK_COLORS`, `RISK_ICONS`. Default export: `RiskPanel` component. **Has `// @refresh reset` at top to suppress Vite Fast Refresh warning.** | `contract`, `subContracts`, `allContracts`, `onNavigate` |
| `SelectionScreen.jsx` | Template selection. Featured KPMG demo card at top. Calls `/demo/kpmg/seed` then navigates. Supports loading existing seeded demo without deleting it. | `onSelect`, `onLoadExisting` |
| `VerificationPanel.jsx` | Modal for "Verificar todos". Shows homologation progress. Errors clickable → navigate to field. | `results`, `isRunning`, `onNavigate` |
| `SelectionScreen.jsx` | Template grid + featured KPMG card. Auto-seeds demo via backend. | |
| `CascadeControlPanel.jsx` | "⇄ Red IF" tab. Edit any field in any contract, apply+propagate, see cascade trace. | |
| `ProjectManager.jsx` | Header dropdown for project switching/renaming/reset/delete. | |
| `CompactIAPanel.jsx` | Left panel bottom. IA operators drag-drop. | |
| `IAEngineView.jsx` | "⬡ Motor IA" tab. Full IA assignment interface. | |
| `ContractPreviewTab.jsx` | "◉ Documento" tab. Printable legal contract. Print CSS included. | |
| `ClauseLibrary.jsx` | Side panel in ContractDetailPanel. 40+ real Spanish clauses, drag-drop. | |
| `PortfolioDashboard.jsx` | Shown when no contract selected in "Campos" tab. | |
| `SegurosComparativeView.jsx` | "🛡️ Seguros" tab. **Staged reveal** (5 stages, localStorage-persisted): Vida→RC→Daños→Crédito→Comparativa. StageStepper, PolicyColumn with IA badges + cross-policy link badges, ComparisonTable at stage 4, TeachingCards. Siniestro + cross-policy cascade buttons. | `contracts`, `onSelectContract`, `onLoadContracts`, `addLog` |

---

## 6. State Management (`usePhenomenon.js`)

Single hook `usePhenomenon()` provides all app state.

**Key auto-behaviors** (added over time — important for new agents):
1. **Auto-cascade on field save** — when `updateContract` is called with ESS changes on a master → auto-calls `/cascade/trigger`. When called with AG.terms changes on a sub-contract → auto-calls `/cascade/sub-trigger` + `/cascade/reverse-trigger` for fields in `SUB_CASCADE_FIELDS`.
2. **Polling** — `loadContracts` runs every 4 seconds via `setInterval`.
3. **contractsRef** — a `useRef` that always has the latest contracts (avoids stale closures in `updateContract`).

**Exported functions:**
- `updateContract(id, changes)` — PATCH + auto-cascade
- `runSubCascade(sourceId, field, value)` — manual sub-cascade trigger
- `generateSubContract(type, parentEss, iaDefaults)` — creates sub-contract via AI
- `runCascade(field, value)` — master cascade
- `homologateContract(id)` — individual homologation
- `homologateAll()` — all contracts (subs first, master last)
- `deleteContract(id)`, `terminateContract` (via api directly)
- `startNewProject(templateKey, template)` — deletes all, creates fresh master
- `renameProject`, `resetProject`, `deleteProject`
- `addIAToContract`, `removeIAFromContract`

---

## 7. PHENOMENON Engine Modules

All in `phenomenon/packages/engine/phenomenon_engine/`.

**Domain layer** (used by backend API):
- `cascade_engine.py` — `CascadeEngine` (master→sub), `SubCascadeEngine` (sub→sibling), `ReverseCascadeEngine` (sub→master), with `CASCADE_MAP`, `SUB_CASCADE_MAP`, `REVERSE_CASCADE_MAP`
- `ecosystem_engine.py` — `EcosystemEngine` with 6 cross-contract consistency rules, coverage checker, health score (0-100)
- `homologation_engine.py` — `HomologationEngine.validate(record)` → (bool, list[str])
- `ia_engine.py` — `IAEngine.validate_set(instances)` → compatibility check
- `opus_engine.py` — `OpusEngine` → PARTIAL/COMPLETE/OPONIBLE level
- `oponibility_engine.py` — Registry-based oponibility (erga omnes vs. inter partes)
- `vector_engine.py`, `phase_engine.py`

**Theoretical layer** (Bloques I-IX, not yet wired to frontend):
- `bloque_i.py` — OntologicalAxioms, EssAgDuality
- `bloque_ii.py` — VectorProperties, IARelationEngine
- `bloque_iii.py` — IST, SuspensionEngine, FrequencyModulation, PlicationEngine
- `operation_engine.py` — CONTINUE/INTERRUPT/DISTRIBUTE operations
- `ia_modulation_engine.py` — 5 IA forms: Retroacción/Plicación/Dirección/Posición/Sentido
- `circumaction_engine.py` — CA1/CA2 circumactions
- `event_engine.py` — Event bus (ON_CREATE/ON_UPDATE/ON_INTERRUPT/ON_DISTRIBUTE/ON_TERMINATE)
- `base_cases.py` — Apropiación/Tentio/Usucapión/Delito (4 full `BaseCaseFlow` entries with IA tables and legal refs; PARTIAL per theory_registry — deeper Enus-layer integration pending Layer-0 docs)

---

## 8. Constants (`constants.js`) — Key Structures

This single file defines everything the frontend knows about the domain.

### Contract Templates (9 + KPMG)
- `CSM` — Contrato Marco de Servicios → generates NDA, SLA, PAYMENT, DPA
- `SAAS` — Contrato SaaS → generates NDA, SLA, IP, PAYMENT, DPA
- `DISTRIBUCION`, `AGENCIA`, `COLABORACION`, `CONSULTORIA`, `ARRENDAMIENTO`, `NDA_BILATERAL`
- `COMPRAVENTA_SOLAR` — generates CONDICION_SOLAR, PAGO_APLAZADO, CARGAS_URBANISTICAS
- `KPMG` — Hotel Mediterráneo Valencia 5* → generates FINANCIACION, HIPOTECA_GARANTIA, CESION_CREDITO. Has `isDemo: true`.

### Sub-contract types in `SUB_META`
NDA, SLA, PAYMENT, IP, DPA, FINANCIACION, HIPOTECA_GARANTIA, CESION_CREDITO, SEGURO_CREDITO, AVAL_BANCARIO, CONTRATO_OBRA, CONDICION_SOLAR, PAGO_APLAZADO, CARGAS_URBANISTICAS

### Cross-cascade maps (mirrors of backend Python dicts)
- `SUB_CASCADE_MAP` — which sub-contract term fields cascade to which sibling types
- `SUB_IF_EDGES` — graph edge definitions between sibling contracts (for visual IF lines)
- `SUB_CASCADE_FIELDS` — per-type list of fields that trigger cascades
- `REVERSE_CASCADE_MAP` (in ecosystem panel only, via API)

### IA Operators
`ad-actio` (direction), `de-actio` (retroaction), `non` (position/exclusion), `co-implication` (plication)
Compatibility: ad-actio + co-implication ✓, non + de-actio ✓. non + ad-actio ✗.

---

## 9. Right Panel Tabs (in order)

| Key | Icon | Label | Purpose |
|---|---|---|---|
| `campos` | ◈ | Campos | ContractDetailPanel — field editing |
| `ecosistema` | 🌐 | Ecosistema | EcosystemPanel — full network management |
| `kpmg-demo` | ⭐ | Demo KPMG | KPMGDemoPanel — live financial controls |
| `kpmg-corp` | 🏛 | Gobernanza | ApprovalChainView — KPMG Corporate (visible only for KPMG_CORPORATE template) |
| `seguros` | 🛡️ | Seguros | SegurosComparativeView — 4-column insurance comparative (visible only when insurance masters loaded) |
| `riesgo` | ⚠ | Riesgo | RiskPanel — risks + navigate to fields |
| `verificar` | ⊙ | Verificar | Homologation results |
| `red-if` | ⇄ | Red IF | CascadeControlPanel — edit any field, see trace |
| `ia` | ⬡ | Motor IA | IAEngineView — IA operator assignment |
| `documento` | ◉ | Documento | ContractPreviewTab — printable legal document |

---

## 10. Features Fully Implemented

### Demo Seed: All-Valid Initial State (2026-05-21 — user request)
- Seguros 16/16 VALID + KPMG 4/4 VALID on fresh seed (was 15/16 + 4/4)
- `COBERTURA_CREDITO` flipped from BLOCKED-by-default to ACTIVE-by-default
- VALIDACION_FINANCIERA rating: A (was D); pending: No (was Yes); blockingEffect: desbloquea (was bloquea)
- RIESGO_EMPRESARIAL: ACTIVE + Bajo (was NEEDS_REVIEW + Alto)
- Master Crédito Comercial: ACTIVE (was NEEDS_REVIEW)
- IF_exclusion demo is now USER-INDUCED: change rating to D → cascade flags COBERTURA_CREDITO → guidance shown → fix → re-validate
- 3 Playwright tests rewritten + 1 new induced-cascade test (73/73 ✅)
- 2 engine state-machine tests updated to construct BLOCKED state via PATCH (104/104 ✅)

### Field-Level Coverage Closed (2026-05-21 — 3rd "empty fields pass" report)
- `_SUB_REQUIRED` now enforces 180/180 UI sub-fields (was 81)
- `_MASTER_REQUIRED` now enforces 142/142 UI master fields (was 58)
- New scan `scripts/scans/scan_field_level_coverage.sh` running in preflight + predone
- 2 new field-level pytest tests (skip-on-container, run on host)
- Seeder seed values: 15/16 Seguros + 4/4 KPMG = VALID after seed
- Live reproduction: 4/4 cleared fields correctly produce `[TYPE] Campo específico obligatorio` errors

### Final Audit State (2026-05-21 — 7 rounds, 11 bugs fixed, 104 engine tests)
- **Engine pytest 104/104 ✅** including 40 property tests covering every cascade rule, every consistency rule, every required-coverage entry
- **Playwright 72/72 ✅** — zero regressions across 4 rounds of backend hardening
- **Bug ledger inverted: 4 owner / 12 agent** in 1 session
- Real calendar date validation via `datetime.date.fromisoformat()` (Feb-29-non-leap, month-13, day-30-Feb all rejected)
- P1 queue: 5/5 drained, all clean (add-party, add-contract, ecosystem-homo, cascade, terminate)
- P4 queue: drained via property tests

### Backend Hardening (added 2026-05-21 — 10 silent bugs fixed via exhaustive audit)
- [x] `_FORBIDDEN_DIRECT_TRANSITIONS` — PATCH cannot bypass state machine — 409
- [x] `_sanitize_ess()` — rejects non-ISO dates and `<script>` tokens — 400
- [x] ESS date-range check — `effectiveDate > expiryDate` flagged
- [x] `_NUMERIC_NONNEG_KEYS` — 30+ monetary/percentage/duration fields enforced ≥ 0
- [x] DELETE precondition — returns 404 on missing record (was silently 200)
- [x] Siniestro type whitelist — only COBERTURA_* contracts can have claims — 400
- [x] Siniestro status precondition — ACTIVE→PENDING and PENDING→resolution only — 409
- [x] add-party role reservation — 'A' / 'B' rejected (reserved for master ess.partyA/B) — 400
- [x] **23 new engine pytest tests across 4 files** locking the 10 bug classes
- [x] **Bug ledger:** 4 owner / 11 agent — fully inverted

### Automated Enforcement System (added 2026-05-21)
- [x] `scripts/preflight.sh` — session-start: health + tests + smoke + scans + queue depth
- [x] `scripts/predone.sh` — hard gate: full tests + scans + drift before claiming done
- [x] `scripts/audit_sweep.sh` — proactive: drains `BUG_HUNT_QUEUE.md`, logs to `AUDIT_LOG.md`
- [x] `scripts/health.sh` — one-line snapshot
- [x] `scripts/scans/scan_singular_master.sh` — catches `[master, ...subContracts]` pattern
- [x] `scripts/scans/scan_addLog_object.sh` — catches `addLog({...})` pattern
- [x] `scripts/scans/scan_cascade_completeness.sh` — UI sub-types ⊆ engine `_ALL_SUB_TYPES`
- [x] `scripts/scans/scan_doc_drift.sh` — code newer than docs warning
- [x] `scripts/scans/scan_count_invariants.sh` — `todos/all/every` labels need E2E
- [x] `CLAUDE_OPERATING_MANUAL.md` — binding session rules
- [x] `AUDIT_CHECKLIST.md` — per-feature-category red-team lists
- [x] `BUG_HUNT_QUEUE.md` — 24 seeded items (P1/P2/P3/P4)
- [x] `CLAUDE_PERFORMANCE.md` — running self-score; first entry 12/20
- [x] `AUDIT_LOG.md` — append-only sweep history
- [x] **First-run validation:** preflight found 1 real P1 bug (IA Operadores unreachable in Seguros) — fixed same session

### Error Boundaries (added 2026-05-20)
- [x] `frontend/src/components/ErrorBoundary.jsx` — reusable scoped class component with retry/reload/details
- [x] `frontend/src/components/ErrorTriggerForTests.jsx` — test-only render-error trigger
- [x] Top-level boundary in `main.jsx` (scope="app")
- [x] Boundary around `SelectionScreen`, `ContractGraph`, `CompactIAPanel`
- [x] Boundary around each of the 10 right-panel tabs (campos, riesgo, verificar, ecosistema, kpmg-demo, kpmg-corp, seguros, red-if, operadores, documento)
- [x] `e2e/tests/09-error-boundary.spec.js` — 4 tests (4/4 passing)
- [x] **Result:** local crashes stay local; the blank-page failure mode is closed

### Engine Test Suite (added 2026-05-20)
- [x] Pytest infrastructure in `packages/engine/` (pyproject.toml `[test]` extras + `[tool.pytest.ini_options]`)
- [x] `tests/conftest.py` — `InMemoryRepository`, factories `make_master`/`make_sub`, fixtures `repo`, `master_with_all_subs`, `kpmg_ecosystem`, `seguros_vida_ecosystem`
- [x] `tests/test_cascade_master_to_sub.py` — 10 tests (CASCADE_MAP completeness, KPMG regression, jurisdiction/expiry/party propagation, isolation)
- [x] `tests/test_cascade_sub_to_sibling.py` — 10 tests (NDA→DPA/IP, PAYMENT↔SLA, DPA→NDA, EXCLUSIONES→COBERTURA, loop prevention, ecosystem isolation)
- [x] `tests/test_reverse_and_ecosystem.py` — 10 tests (REVERSE_CASCADE_MAP exhaustive property test, 3 consistency rules, coverage gaps, health score monotonicity)
- [x] **Result:** 30/30 passing, 89% combined coverage on cascade_engine + ecosystem_engine
- [x] **Run:** `docker compose exec backend bash -c "cd /workspace/packages/engine && python -m pytest tests/"`

### Core System
- [x] Multi-project management (switch, rename, reset, delete)
- [x] 10 contract templates (CSM, SAAS, DISTRIBUCION, AGENCIA, COLABORACION, CONSULTORIA, ARRENDAMIENTO, NDA_BILATERAL, COMPRAVENTA_SOLAR, KPMG)
- [x] Sub-contract generation via Claude AI (with Spanish legal fallback clauses)
- [x] Master→sub cascade (ESS field change propagates to all relevant sub-contracts)
- [x] Sub→sibling cascade (term change propagates between related sub-contract types)
- [x] Sub→master reverse cascade (significant sub-contract change flags master for review)
- [x] Auto-cascade on field save (no manual trigger needed)
- [x] Homologation per contract (ESS + AG + IA + type-specific field checks)
- [x] Ecosystem homologation (all contracts + cross-contract consistency + coverage gaps)
- [x] 6 cross-contract consistency rules (NDA≥DPA retention, payment days ≤60, SLA/PAYMENT link, etc.)
- [x] Coverage checker per template (required sub-contract types present?)
- [x] KPMG Corporate governance layer (approval chain, compliance/audit/regulatory/board sub-contracts, blocking logic edge)
- [x] Terminate contract (TERMINATED status, cascades to dependents)
- [x] Add party mid-lifecycle (novación subjetiva, propagates additionalParties to all contracts)
- [x] Add contract mid-lifecycle
- [x] Opus levels: PARTIAL → COMPLETE → OPONIBLE (via registry registration)

### Graph (ContractGraph)
- [x] Draggable nodes, radial auto-layout
- [x] Master→sub IF edges (animated dashed lines with color per type)
- [x] Sibling IF edges (dotted cyan lines showing cross-cascade connections)
- [x] Flow particles: gold circles (money out to FINANCIACION) + cyan circles (rent back from CESION_CREDITO)
- [x] Zoom (scroll wheel + +/- buttons) and pan (middle-mouse drag)
- [x] Click edge → EdgePanel (shows IF rules + condition builder)
- [x] Double-click node → NodeQuickEdit (edit key fields, Apply & Propagate)
- [x] Pending edit state (yellow node when user is typing in ContractDetailPanel)
- [x] External flash (graph nodes flash orange when cascade fires from KPMGDemoPanel)
- [x] Lifecycle toolbar (Terminate, Edit buttons when node selected)
- [x] Financial amount labels on KPMG nodes (monthly payment, mortgage, rent)

### Right Panel
- [x] ContractDetailPanel: all field groups (ESS, party, contractFields, subFields, additionalParties, clauses, IA, opus, homologation)
- [x] Field highlight/navigate (click risk → orange pulse animation on target field)
- [x] ImpactNotification (top-left sliding panel after any cascade — risks + recommendations + clickable affected contracts)
- [x] RiskEngine: 20+ risk rules under Spanish law (Ley 3/2004, RGPD, CC, PHENOMENON engine). KPMG-specific risks (EURIBOR threshold, cosa futura deadline, hipoteca registration pending)
- [x] Clause library (40+ real Spanish clauses, drag-drop)
- [x] KPMGDemoPanel: EURIBOR/spread/term/capital sliders, live PMT, amortization table, sensitivity analysis, demo narrative, action buttons
- [x] EcosystemPanel: health ring 0-100, contract tree, IF consistency issues, coverage gaps, party management with auto-role suggestion, add contract selector
- [x] CascadeControlPanel: edit any field in any contract, cascade trace log, IF topology display
- [x] Printable legal document (A4, Times New Roman, Spanish legal structure with Reunidos/Exponen/Estipulan/Anexos/Firmas)

### KPMG Demo
- [x] Backend seeder: 4 pre-filled contracts with real legal clauses in Spanish
- [x] SelectionScreen featured card → one-click demo load (fixed: now uses onLoadExisting to avoid startNewProject deletion)
- [x] Live EURIBOR cascade (slider → debounce 1.2s → backend update → graph flash)
- [x] PMT formula (Sistema Francés, accurate)
- [x] Demo story (6-step investor narrative)

### Caso Seguros (Session 2 — 2026-05-19)
- [x] 4 insurance templates: SEGURO_VIDA, SEGURO_RC, SEGURO_DANOS, SEGURO_CREDITO_COMERCIAL
- [x] 12 insurance sub-contract types with full SUB_FIELDS: COBERTURA_VIDA/RC/DANOS/CREDITO, EXCLUSIONES_VIDA/DANOS, PRIMA_VIDA, LIMITES_RC, FRANQUICIA_RC, PERITACION, VALIDACION_FINANCIERA, RIESGO_EMPRESARIAL
- [x] BLOCKED status: IF_exclusion (non operator) prevents COBERTURA_CREDITO from activating until VALIDACION_FINANCIERA passes
- [x] New statuses: BLOCKED, SINIESTRO_PENDIENTE, INDEMNIZACION_PAGADA, RECHAZO (in statusColor, statusLabel, theoreticalState)
- [x] Backend seeder: POST /demo/seguros/seed → 16 contracts (4 masters × 4 subs); unified tomador "Comerciales del Levante S.L." across all 4 policies
- [x] POST /demo/seguros/siniestro → phase transition (ACTIVE → SINIESTRO_PENDIENTE → resolution)
- [x] POST /demo/seguros/unblock-coverage → resolves IF_exclusion, activates blocked coverage
- [x] POST /demo/seguros/cross-policy-cascade → cross-policy IF cascade: partyA change on one master marks 3 sibling masters NEEDS_REVIEW; sub field changes propagate via CROSS_POLICY_CASCADE_MAP
- [x] SegurosComparativeView.jsx: **staged reveal** (5 stages, localStorage), StageStepper, PolicyColumn, ComparisonTable, TeachingCards, cross-policy cascade button
- [x] ContractGraph FullNetworkView: **5 cross-policy IF arcs** (gold tomador-identity, orange risk-correlation, red exclusion) with animated bezier paths, arrowheads, glow tracks
- [x] CROSS_POLICY_IF_EDGES constant (5 edges) + CrossPolicyCascadeEngine in cascade_engine.py
- [x] Insurance masters now render with policy-specific colors in FullNetworkView (was using generic palette)
- [x] 🛡️ Seguros tab in right panel (visible only when insurance masters loaded)
- [x] SelectionScreen dual featured cards (KPMG + Seguros side by side)
- [x] Insurance cascade rules in cascade_engine.py (SUB_CASCADE_MAP + REVERSE_CASCADE_MAP)
- [x] Insurance homologation checks in routes_phenomena.py (_SUB_REQUIRED + _MASTER_REQUIRED + _IA_RECOMMENDED)
- [x] SUB_IF_EDGES with type: "exclusion" for blocking IFs
- [x] INSURANCE_TEMPLATE_KEYS + INSURANCE_POLICY_CONFIG exported from constants.js
- [x] `_delete_all_contracts()` helper in routes_demo.py fixes FK violation on demo reload

---

## 11. Features Pending / Not Yet Built

### Cases from Word Documents
- [x] **Caso Seguros** — BUILT 2026-05-19 (Session 2)
- [ ] **Caso Libia** — international/multi-jurisdiction. Content not yet written.
- [ ] **Caso EDCO** — energy/engineering. Content not yet written.

### Engine Features
- [x] **Blocking IF** — `IF_exclusion` type implemented via BLOCKED status + non operator in seeder (demo-level, not engine-level full automation)
- [ ] **Full IF_exclusion engine automation** — currently BLOCKED status set by seeder; should auto-propagate from cascade rules
- [ ] **Phase transitions in UI** — PhaseEngine (F1→F2→F3) exists in backend but not wired to frontend
- [ ] **Edge condition persistence** — conditions set in EdgePanel are in-memory only (not saved to backend)
- [ ] **Theoretical Bloque VIII exhibition** — Apropiación/Tentio/Usucapión/Delito have full structural content in base_cases.py; not yet exhibited in the UI and not exhibited in demos until deeper Enus-layer integration arrives
- [ ] **Bloque IX** — computable specification document not provided yet
- [ ] **Multi-language** — currently Spanish only

### UI Features
- [ ] **Add contract from graph toolbar** — button exists conceptually but not fully wired for all types
- [ ] **Ecosystem conditions persistence** — EdgePanel conditions stored in React state, lost on refresh
- [ ] **Arbitration app** — `apps/arbitration/` exists as a scaffold with `EngineProcess.jsx` and `App.jsx` but is essentially empty
- [ ] **Risk rules for insurance** — RiskEngine.jsx doesn't yet have insurance-specific risk rules (solvency, medical validation)

---

## 12. Known Issues & Gotchas

1. **RiskEngine Fast Refresh** — `RiskEngine.jsx` exports both a component (default) and utilities (named). Has `// @refresh reset` at line 1 to suppress Vite warning. Don't remove it.

2. **EssFields model is strict** — only 5 fields (partyA, partyB, jurisdiction, effectiveDate, expiryDate). All other per-contract fields go in `ag.terms`. If you add ESS fields, you need a DB migration.

3. **Cascade parentId** — Python model uses `parentId` (camelCase). DB column is `parent_id`. The repo maps between them. Always use `record.parentId` in Python engine code, never `record.parent_id`.

4. **additionalParties** — stored as array in `ag.terms.additionalParties`. Propagated to all sub-contracts when added via ecosystem endpoint. Shown in ContractDetailPanel under "Partes Adicionales" section.

5. **updateContract auto-cascade** — `usePhenomenon.js` `updateContract` uses a `contractsRef` (useRef) to read latest contracts without stale closure. If you modify `updateContract`, preserve this pattern.

6. **KPMG seeder vs. startNewProject** — loading the KPMG demo calls `seedKPMGDemo()` (backend seeds 4 contracts) then `onSelect("KPMG", template)` which calls `startNewProject` which DELETES everything then creates a blank master. This is a known logic bug — the seeder runs first, startNewProject deletes it. Need to add `onLoadExistingProject` callback that just calls `loadContracts()` without creating a new project.

7. **Volume mounts** — frontend `src/` is volume-mounted (HMR works). Backend `apps/contracts/backend/` AND `packages/engine/` are both volume-mounted. Uvicorn watches both directories (`--reload-dir` on both). Python changes hot-reload in ~1s.

8. **SUB_CASCADE_FIELDS vs SUB_CASCADE_MAP** — Both exist. `SUB_CASCADE_FIELDS` is a flat array (used to check IF a field triggers cascade). `SUB_CASCADE_MAP` is a nested dict (used to find WHICH siblings are targeted). Both mirror their Python counterparts in the backend.

---

## 13. How Parallel Agents Should Work

**Agent A (Feature Builder):**
- Read SYSTEM_STATUS.md first
- Make changes to files in `phenomenon/`
- HMR handles frontend. Backend auto-reloads.
- Update SYSTEM_STATUS.md "Features Fully Implemented" when done
- Append to `phenomenon/CHANGES.md`

**Agent B (Tester/Checker):**
- Read SYSTEM_STATUS.md first
- Can run tests by calling the API directly: `curl http://localhost:8000/phenomena/`
- Can check backend logs: `docker compose logs backend --tail=20`
- Can check frontend errors: `docker compose logs frontend --tail=20`
- Reports issues back to Agent A via SYSTEM_STATUS.md "Known Issues" section

**Shared state:** The PostgreSQL database is the source of truth at runtime. Both agents see the same data via the API.

**DO NOT** have two agents modify the same file simultaneously.

---

## 14. PHENOMENON Framework → Application Mapping (Quick Reference)

| PHENOMENON Concept | Application Implementation |
|---|---|
| **Phenomenon (F)** | Any contract (master or sub), stored as `PhenomenonRecord` |
| **ESS (stable identity)** | `ess_json`: partyA, partyB, jurisdiction, dates. Cannot change without changing the phenomenon. |
| **AG (operational doing)** | `ag_json.clauses` + `ag_json.terms`. Can change without changing identity. |
| **IA operators** | `ia_instances`: ad-actio (direction), de-actio (retroaction), non (position), co-implication (plication) |
| **Vector** | `vectors_json`: 5 properties (lation, sense, direction, position, plication) |
| **IF (inter-phenomenic)** | `parent_id` FK = master→sub link. `SUB_CASCADE_MAP` = sibling links. Graph edges = visual IFs. |
| **Opus** | `opus_json.homologation`: PENDING → VALID/INVALID. PARTIAL/COMPLETE/OPONIBLE levels. |
| **F-Phase** | `status`: DRAFT→ACTIVE→NEEDS_REVIEW→TERMINATED (PhaseEngine exists, not fully wired to UI) |
| **CA2 Circumaction** | FINANCIACION type contract (the €100M financial service wrapping the hotel lease) |
| **Homologation** | Running all engine checks → VALID or INVALID with error list |
| **Oponibilidad erga omnes** | After registry registration → Opus = OPONIBLE |
| **Ecosystem** | The full master+subs network checked as a unit by EcosystemEngine |

---

## 15. Next Planned Build: Caso Seguros

When building the insurance case, here is the design:

**4 templates to create:**
- `SEGURO_VIDA` → generates: COBERTURA_VIDA, EXCLUSIONES_VIDA, PRIMA_VIDA
- `SEGURO_RC` → generates: COBERTURA_RC, LIMITES_RC, FRANQUICIA_RC
- `SEGURO_DANOS` → generates: COBERTURA_DANOS, PERITACION, EXCLUSIONES_DANOS
- `SEGURO_CREDITO` → generates: COBERTURA_CREDITO, VALIDACION_FINANCIERA, RIESGO_EMPRESARIAL

**New engine feature needed:**
- `IF_exclusion` type — a blocking condition that PREVENTS activation (not just NEEDS_REVIEW)
- New status: `BLOCKED` (cannot proceed until blocking IF is resolved)

**New UI needed:**
- Comparative 4-panel view showing all 4 insurance types side-by-side
- Siniestro (claim) event that transitions: ACTIVE_COVERAGE → SINIESTRO_PENDIENTE → INDEMNIZACION_PAGADA | RECHAZO
- Shared structure highlight (show what A1/SA/CA/IF is common across all 4)

**A1 central for each:**
- Vida: "Cobertura estructural condicionada por riesgo personal"
- RC: "Cobertura por daño causado a tercero"
- Daños: "Cobertura por daño material a bien asegurado"
- Crédito: "Cobertura por incumplimiento de obligación dineraria"
