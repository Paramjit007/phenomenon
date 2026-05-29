# PHENOMENON — Honest & Complete Project Diagnosis

> **Living reference document.** Read this before doing any work on the project.
> Updated: 2026-05-20.
> Mirror in HTML: `PROJECT_DIAGNOSIS.html` (printable to PDF).
> This document supersedes informal explanations. When something contradicts the conversation, this file wins.

---

## How to use this file

- **For the user (Param):** plain-language explanation of what the engine is, what we have, what we don't, and what to build next. Read top to bottom once. Then use sections 7-9 as a working plan.
- **For Claude (future sessions):** load this file first. It contains the structural state of the project so you can pick up cold without re-asking. Don't trust verbal summaries — trust this file and verify against the live code.

---

## Table of contents

1. Executive summary in one page
2. The PHENOMENON engine — what it is, active layers, pending layers
3. Real-world applications that can be built on top of the engine
4. Is it really unique? Honest competitive analysis
5. The current application — end-to-end diagnosis
6. Concrete gaps vs. lawyers and Property Registrars
7. Build plan with timeline and checklist
8. End-to-end test framework with auto-repair
9. Claude Performance Dashboard
10. Decisions needed before any code is written

---

## 1 · Executive summary

| Metric | Value |
|---|---|
| Total lines of code | ~17,000 |
| Engine (Python) | 4,774 lines · 27 modules |
| Backend (FastAPI) | 2,692 lines · 6 route files |
| Frontend (React) | 9,138 lines · 24 components |
| REST endpoints | 29 |
| Theoretical layers active | 6 of 12 PARTIAL-or-better (Bloques I-III IMPLEMENTED · Bloques IV-IX, Base Cases, Language, Geometry PARTIAL · Enus/REC/AB-AZ PENDING) |
| End-to-end Playwright specs | 8 (smoke-level, not logic) |
| Python unit tests | 0 |

### Verdict in one sentence

The PHENOMENON engine is **conceptually original** and the contracts application is **functionally advanced for a demo**, but it is **not ready** to be shown today to the College of Property Registrars or to a law firm as a production tool. It needs three concrete things: engine test coverage, persistence of IF conditions, and a verifiable bridge to the real Registry (or a formal simulator that represents inscription).

### What works today

- Three loadable cases: **KPMG Hotel Mediterráneo**, **Insurance (4 types)**, **Land Purchase**.
- Automatic and traceable master→sub, sub→sibling and sub→master cascades.
- Per-contract and ecosystem-wide homologation with 6 consistency rules.
- Printable Spanish legal document (Reunidos / Exponen / Estipulan / Anexos / Firmas).
- Opus levels PARTIAL → COMPLETE → OPONIBLE with a registry simulation.

### What does NOT work or is missing

- IF conditions are stored in the browser, not in the database.
- Phase transitions (PhaseEngine F1→F2→F3) exist in Python but never reach the UI.
- No unit tests on the engine; the 8 e2e specs are smoke, they do not cover cascade logic.
- Theoretical Blocks VIII (Appropriation / Tentio / Usucapion / Crime) and IX (computable specification) are **PARTIAL** — substantive content exists but they are not exhibited in the UI; Block VIII needs deeper Enus-layer integration once that documentation arrives.
- No real integration with the Property Registry — the `register` button is a symbolic stamp that flips a field.
- No electronic signature, no time-stamping, no XAdES/CAdES export, no integrity hash.

---

## 2 · The PHENOMENON engine

### 2.1 What it is, in honest terms

The engine is an **ontological model of contracts as phenomena** (not as documents). Each contract has two parts: **ESS** (stable identity that cannot change without breaking identity: parties, jurisdiction, dates) and **AG** (operation: clauses and terms that can change). Contracts connect through **IF** (inter-phenomenic) links that propagate changes automatically. The **IA operators** (ad-actio, de-actio, non, co-implication) modulate direction, retroaction, exclusion and plication of the contractual vector.

What a lawyer needs to understand: *when something changes in one contract of the ecosystem, the engine knows who else is affected and why, by formal rules — not by a human reviewing the whole file manually.*

### 2.2 Technical anatomy of the engine

| Layer | Modules | Lines | Status | Purpose |
|---|---|---|---|---|
| Domain · Contracts | cascade_engine, ecosystem_engine, homologation_engine, ia_engine, opus_engine, oponibility_engine, vector_engine, phase_engine | ~1,300 | **ACTIVE** | The logic powering the current app |
| Theoretical · Blocks I-III | bloque_i, bloque_ii, bloque_iii | ~545 | **ACTIVE** | Ontological axioms, IA, suspension/plication |
| Theoretical · Blocks IV-VII | operation_engine, ia_modulation_engine, circumaction_engine, event_engine, geometry_model, language_engine | ~1,280 | **PARTIAL** | CONTINUE/INTERRUPT/DISTRIBUTE operations, 5 IA forms, events. Wired to bridge but not exposed in UI |
| Theoretical · Block VIII | base_cases (Appropriation, Tentio, Usucapion, Crime) | ~470 | **PARTIAL** | 4 fully defined `BaseCaseFlow` entries with IA tables, input/process/output and legal references. Missing only deeper Enus-layer integration (blocked by Layer-0 documentation) |
| Theoretical · Block IX | theory_registry, validate_structure | ~265 | **PARTIAL** | Opus, Oponibility, Operations, Events implemented. Missing: pattern recognition, automation, prediction |
| Bridge & config | bridge, config, domain_adapter, theoretical_models | ~620 | **ACTIVE** | How the domain layer talks to theory |

Total engine: 4,774 lines across 27 Python modules. Declared version: 2.2.

### 2.3 What the engine can do (verifiable capabilities)

1. **Validate an individual contract** (homologation) against ESS, AG, IA, type-specific rules and vector superimposition.
2. **Validate a whole ecosystem** as a unit: 6 cross-contract consistency rules + coverage analysis.
3. **Propagate changes** in three directions: master → subs, sub → sibling, sub → master.
4. **Block flows** with IF_exclusion (the `non` operator) — implemented in Insurance and KPMG Governance.
5. **Opus levels**: PARTIAL → COMPLETE → OPONIBLE (with or without registry).
6. **Emit events**: ON_CREATE, ON_UPDATE, ON_INTERRUPT, ON_DISTRIBUTE, ON_TERMINATE (present in code, not listened to from UI).
7. **Compute circumaction geometry** CA1/CA2 — used conceptually in the KPMG financing contract.
8. **Detect vector conflicts**: two IAs modulating the same vector property = conflict.

### 2.4 What the engine CANNOT do (be honest about this)

- It does not simulate real public registries (neither Property nor Mercantile).
- It does not sign cryptographically nor time-stamp.
- It does not parse natural-language clauses — Claude generates them, it does not interpret them.
- There is no caselaw search.
- It does not simulate procedural deadlines (the PhaseEngine is about states, not civil calendars).
- It does not export to certified legal formats (XAdES, PAdES, eIDAS).

---

## 3 · Real-world applications that can be built

| Vertical | Use case | Fit with the engine | Effort |
|---|---|---|---|
| Real estate / Notarial | Land purchases with suspensive conditions, options, earnest money, deferred traditio | **Excellent** — the Land Purchase case already proves it | Low |
| Property Registry | Pre-validation of acts before inscription; detection of incompatibilities between charges, mortgages and sales | **Excellent** — IF + opposability fit exactly | Medium |
| Project Finance | Multi-contract structures (financing + mortgage + assignment + bond) with EURIBOR cascades | **Proven** with the KPMG case | Low |
| Corporate Insurance | Multi-coverage policies with exclusions and prior validations | **Proven** with the Insurance case | Low |
| Corporate Compliance | Approval chains with blocks (Compliance → Audit → Regulatory → Board) | **Proven** with KPMG Corporate | Low |
| SIAC Arbitration | Co-pilot for arbitrators: the repo has a skeleton `apps/arbitration` | **Partial** — flag active, UI missing | High |
| Mediation / Spanish 103 bis | Pre-procedural civil mediation flows | **Planned** in config.py | High |
| Public Procurement | Public contracts with specifications, lots, extensions, modifications | **Would fit** — no development yet | Medium-High |
| M&A | SPA + escrows + earn-outs + reps & warranties + non-competes | **Would fit** — needs a new template | Medium |
| Energy / Power Purchase | PPAs with curtailment, indexations, guarantees of origin | **Would fit** — good candidate for a 4th case | Medium |

---

## 4 · Is it really unique? Honest competitive analysis

| Tool | What it does | What it does NOT do that PHENOMENON does |
|---|---|---|
| DocuSign CLM, Ironclad, Icertis | Contract repositories with workflows and signatures | They do not model the contract as a network of phenomena with formal cascades; they do not validate ecosystems as a unit |
| Harvey, Spellbook, Lexis+ AI | Generative assistants for lawyers | They produce text but do not guarantee structural consistency between related contracts |
| Notion / Coda legal templates | Databases with templates | No propagation engine, no formal validation |
| Smart contracts (Ethereum / DAML) | On-chain execution | They execute, they do not validate Spanish legal structure nor speak to the Registry |
| Notarial systems (SIGNO) | Communication between notaries and Registries | They operate documentally, not structurally. They do not detect cascades |

### What is genuinely differentiating

1. **The ecosystem as a unit of validation.** Nobody else validates 16 contracts as a single coherent object.
2. **Cascades with semantic direction.** ad-actio, de-actio, non, co-implication have different formal consequences — this is new.
3. **Structural blocking by exclusion (IF_non).** COBERTURA_CREDITO does not activate **until** VALIDACION_FINANCIERA passes. This is contractual and formal, not an ad-hoc workflow.
4. **Cosa / Bien / Ser distinction and real vs. instrumental traditio.** Spanish civil-law concepts encoded in the engine — the Anglo legaltech SaaS world doesn't even know these exist.

### What is NOT unique yet

- The graph UI (ContractGraph) — many legaltech products have similar views.
- AI clause generation — Harvey and Spellbook do it better.
- Per-contract homologation — it is **good**, it is not **new**.

**Uniqueness lives in the engine, not in the screens. Sell the engine, not the UI.**

---

## 5 · The current application — end-to-end diagnosis

### 5.1 Real architecture

```
[Browser]  <-HMR->  [Vite + React + 24 components]
                          |
                          v axios
[FastAPI]  - /phenomena · /cascade · /ecosystem · /demo · /ai · /documents
   |                |
   |                +-> [phenomenon_engine (4,774 lines Python)]
   |
   +-> [PostgreSQL · 1 table `phenomena` · JSONB in ess_json / ag_json]
```

### 5.2 What works end-to-end (verified in the code)

| Flow | Status | Notes |
|---|---|---|
| Create project from template | OK | 10 templates + 2 demo cards |
| Generate sub-contracts via AI | OK | Claude API with Spanish fallback |
| Auto master→sub cascade | OK | Triggered on field save |
| Auto sub→sibling cascade | OK | SUB_CASCADE_MAP mirrored frontend + backend |
| Reverse sub→master cascade | OK | Marks master NEEDS_REVIEW |
| Per-contract homologation | OK | 2 passes: domain + theoretical |
| Ecosystem homologation | OK | Subs first, master last |
| Add party (novación subjetiva) | OK | Auto-suggests role C/D/E, propagates to all subs |
| Terminate contract with cascade | OK | Siblings + master receive NEEDS_REVIEW |
| Register in Registry (simulated) | **SIMULATED** | Flips Opus to OPONIBLE — not a real inscription |
| Printable legal document | OK | A4, Times, Reunidos/Exponen/Estipulan structure |
| KPMG demo: live EURIBOR slider | OK | 1.2s debounce + graph flash |
| Insurance demo: claim + unblock | OK | Phase transitions visible |
| Land Purchase demo: solar condition | OK | Base case |

### 5.3 What is broken, incomplete, or inconsistent

| Problem | Severity | File | What it means in front of a Registrar |
|---|---|---|---|
| IF conditions in EdgePanel live in memory, not persisted | **High** | ContractGraph.jsx | On refresh, conditions disappear. First thing they will test |
| PhaseEngine in backend, not exposed in UI | Medium | phase_engine.py | The engine knows F1→F2→F3, the user does not see it |
| No engine unit tests | **High** | — | If asked "how do you know cascade works?", the answer is "because I tested it in the UI" |
| "Register" is a field flip, not an inscription | **High** | routes_phenomena.py /register | A Registrar will spot this in 30 seconds. Must be renamed "Inscription simulation" |
| Block VIII base cases empty | Medium | base_cases.py | If we brag about "complete ontological framework" and they peek here, there is a problem |
| Insurance risk rules not implemented | Medium | RiskEngine.jsx | Policies do not warn about solvency, exposure, etc. |
| Arbitration app is an empty skeleton | Low | apps/arbitration/ | Only matters if someone asks about SIAC |
| No integrity hash, no electronic signature | **High** | — | Impossible to sell as a system for legal acts without this |

### 5.4 End-to-end inspection verdict

The application is a **solid technical demonstration** with three complete cases. It is not a product. Distance to product, by increasing cost:

- **(a)** persist IF conditions and expose phases in the UI — **days**
- **(b)** engine test coverage — **days**
- **(c)** electronic signature and cryptographic integrity — **weeks**
- **(d)** real integration with SIGNO / Catastro / Registry — **months and depends on third parties**

---

## 6 · Concrete gaps vs. lawyers and Registrars

### 6.1 What a Registrar will look for (and whether you have it)

| Professional requirement | Do you have it? | What to do | Priority |
|---|---|---|---|
| Traceability: who changed what, when, why | **No** | Add `audit_log` append-only table. Chained hash | P1 |
| Integrity: cryptographic hash of the signed contract | **No** | SHA-256 of canonical JSON when transitioning to OPONIBLE | P1 |
| Electronic signature (eIDAS) or at least time stamp | **No** | Integrate with public TSA (Spanish FNMT) or clearly-labeled stub | P1 |
| Validated cadastral reference | Partial (field only) | Catastro API to verify the code (free) | P2 |
| Prior charges check | **No** | Model as sub-contract CARGAS_PREVIAS with mock Registry call | P2 |
| Presentation entry with 60-day deadline | **No** | Ideal case for PhaseEngine — expose it in the UI | P2 |
| Negative qualification with reasons | Partial | Homologation returns errors — convert to "qualification" format | P2 |
| Standard XML export (UBL/XBRL legal-like) | **No** | Generate structured XML following registry schemas | P3 |
| Multi-language (Spanish + Catalan + Basque at minimum) | **No** | Only Spanish today | P3 |

### 6.2 The five questions they will ask and the right answers

1. **"How do I know this doesn't tamper with the contract?"**
   Expected answer: visible SHA-256 hash, append-only audit log, signed XML export. *You don't have this today.*
2. **"Does this replace the Registry or complement it?"**
   It complements. It is a qualification assistant, not a Registry. Position it that way from the first sentence.
3. **"What if two contracts in the ecosystem contradict each other and the engine doesn't catch it?"**
   There are 6 consistency rules. At least 20 more are needed for real-estate cases. It is bounded, known work.
4. **"Where does the legal qualification of that cascade come from?"**
   From Block II of the PHENOMENON framework. It is documented. They will see it only if you show one concrete example, not theory.
5. **"Can I trust coverage?"**
   No, until there are engine unit tests with real cases. **This is blocking.**

---

## 7 · Build plan with timeline and checklist

Three horizons. Each one with measurable exit criteria. **Do not advance to the next without meeting the current one.**

### Horizon 1 · Technical solidity (1 week)

- [ ] Persist IF conditions in the backend (new `if_conditions` table or a field in `ag_json`)
- [ ] Engine unit tests: cascade_engine, ecosystem_engine, homologation_engine, ia_engine, opus_engine — minimum 80% coverage
- [ ] API integration tests: pytest + httpx, one spec per critical endpoint
- [ ] Audit log: append-only table with user, timestamp, contract_id, action, before_json, after_json, hash
- [ ] SHA-256 hash of the canonical JSON of the contract on transition to OPONIBLE; show the hash in the UI
- [ ] Rename "Register" button to "Inscription Simulation" everywhere in the UI
- [ ] Fix bug #2 in the tracker (edge conditions not persisted)

**Exit criteria:** `pytest --cov` ≥ 80% on `phenomenon_engine` and `backend/app`.

### Horizon 2 · Demonstrable to professionals (2-3 weeks)

- [ ] New case: **Land Purchase with prior charges** — a scenario a Registrar will recognize immediately
- [ ] Time stamp with a real TSA (Spanish FNMT-RCM has a free API) or stub labeled "not valid for legal traffic"
- [ ] Cadastral reference validation against Catastro API
- [ ] Export to structured XML (proprietary schema, with field "not an official registry standard")
- [ ] Expose PhaseEngine in the UI with timeline and presentation-entry deadlines
- [ ] 20 additional real-estate consistency rules and 15 insurance risk rules
- [ ] "Qualification" mode that renders the homologation output as a negative registry qualification
- [ ] Minimum internationalization (i18n) for at least Spanish + English

**Exit criteria:** a Registrar can use the system for 30 minutes without a visible error and without relying on a verbal demo explanation.

### Horizon 3 · Product (2-3 months)

- [ ] eIDAS-compatible electronic signature (XAdES-T minimum)
- [ ] Real integration with SIGNO (if there is an agreement) or simulated inscription engine with official schemas
- [ ] Complete Block IX: computable specification derivable from Blocks I-VIII with theoretical regression tests
- [ ] Multi-tenant, SSO authentication, per-firm RBAC
- [ ] Dashboards: per project, per portfolio, per risk
- [ ] Audited export (PDF/A + signed XML + hash + optional blockchain)
- [ ] Mobile consultation app (read-only)

**Exit criteria:** acceptance ratio ≥ 1 pilot firm + 1 pilot Registry signing an NDA and starting to use it.

---

## 8 · End-to-end test framework with auto-repair

The complaint is legitimate: today a fault is only found when the user points it out. The root cause has three layers: no engine tests, no API coverage, and the 8 Playwright specs are "smoke", not "logic". The plan fixes all three.

### 8.1 Proposed test pyramid

| Layer | Tool | What it covers | Target count |
|---|---|---|---|
| Engine unit | pytest | cascade, ecosystem, homologation, ia, opus, oponibility, vector | ~120 tests · 80% coverage |
| API integration | pytest + httpx + Postgres in Docker | each endpoint with happy path + 2 edge cases | ~60 tests |
| UI logic | Playwright (8 existing + 12 new) | full flows per case: KPMG, Insurance, Land Purchase, Corporate | ~20 specs |
| Production smoke | Headless Playwright every 30 min | app boots, demo loads, no console errors | 1 looping spec |
| Property-based (later) | Hypothesis | cascades and homologation with random generators | ~10 properties |

### 8.2 Detection and auto-repair loop

```
Cron 0 */1 * * *  (every hour)
  |
  v
[Local CI runner]
  +- pytest packages/engine/ --cov                 (minimum 80%)
  +- pytest apps/contracts/backend/                (every endpoint)
  +- npx playwright test --reporter=json           (full e2e suite)
  +- curl smoke: list, create, cascade, homologate (sanity)
  |
  v
[JSON report]  ->  test_results/YYYY-MM-DD-HH.json
  |
  v
[Analyzer] (Python script)
  +- Computes deltas vs. previous run
  +- If a new failure -> opens a local issue in ERROR_DASHBOARD.md
  +- Tags by module, severity, traceback fingerprint
  +- Spawns a Claude agent with failure context IF inside the auto-fixable patterns list
  |
  v
[Auto-fix loop] (bounded and supervised)
  +- Only on files marked "autofix-allowed"
  +- Only one attempt per failure
  +- Creates branch, commit, opens PR — NEVER auto-merges
  +- Notifies the human to review
```

**Important.** "Auto-repair" means **proposing** a patch, not **applying** it. The loop has a 1-attempt cap, requires human PR review, and only operates on pre-approved files. Anything else is dangerous.

### 8.3 Concrete test cases missing today

1. Master EURIBOR cascade → financing → mortgage: verify all three update and ON_DISTRIBUTE is emitted.
2. Sub-cascade PAYMENT.paymentDays > 60 → must emit a Ley 3/2004 warning.
3. IF_exclusion block: COBERTURA_CREDITO cannot activate with VALIDACION_FINANCIERA pending.
4. Subject novation: adding party C propagates additionalParties to ALL subs.
5. Ecosystem homologation with NDA.confidentialityPeriod < DPA.dataRetention → inconsistency.
6. Terminate master: all subs must receive NEEDS_REVIEW.
7. Reverse cascade: critical change in sub must flag master NEEDS_REVIEW.
8. Opus PARTIAL→COMPLETE→OPONIBLE only if it passes homologation VALID.
9. IA superimposition: ad-actio + non on the same property must fail.
10. Project reset: deletes all children, leaves master untouched.

---

## 9 · Claude Performance Dashboard

The complaint "you don't detect until I point it out" is a process failure, not a capability failure. The fix is not to promise better behavior, it is to **measure** it. Design for a Dashboard that logs every turn, every error, every correction.

### 9.1 What is measured

| Metric | How it is captured | Why it matters |
|---|---|---|
| Proactive detection rate | Tickets/issues I open vs. ones you flag | Whether I improve at catching them before you |
| Regression rate | Tests broken after my changes / total changes | Whether I break things while fixing others |
| Time to first error | Minutes between commit and first CI failure | Immediate quality |
| Coverage delta per change | Coverage delta per feature | If I add code without tests, it shows |
| Tool calls per task | Counter per conversation | Efficiency: fewer calls = better planning |
| Broken promises | Manual flag of "you said you would do X and didn't" | Quantified honesty |
| Repeated errors by category | Clustering by traceback / error fingerprint | Pattern detection |

### 9.2 Dashboard sketch

```
+-----------------------------------------------------------------------+
| CLAUDE PERFORMANCE · Week of 2026-05-13 to 2026-05-19                 |
+-----------------------------------------------------------------------+
| Sessions:        14    Commits made:        37     Bugs found:        |
|                                                       by me:  4       |
| Tests added:     0     Tests passing:       66/66    by you: 9        |
| Engine coverage: —     Backend coverage:     —                        |
+-----------------------------------------------------------------------+
| PROACTIVE DETECTION RATE:   30%  ####............  (target: >=70%)    |
| REGRESSION RATE:             8%  #...............  (target: <=5%)     |
| TIME TO FIRST ERROR:         —   (no CI yet)                          |
+-----------------------------------------------------------------------+
| TOP FAILURE CATEGORIES                                                |
|   1. Frontend imports from constants.js before it is defined  (3x)    |
|   2. parent_id vs parentId confusion in Python                (2x)    |
|   3. Forgot to update SYSTEM_STATUS.md after feature          (5x)    |
|   4. Did not test in the browser before marking done          (4x)    |
+-----------------------------------------------------------------------+
| PENDING PROMISES (said and not closed)                                |
|   - Persist IF conditions                                             |
|   - Engine unit tests                                                 |
|   - Insurance risk rules                                              |
+-----------------------------------------------------------------------+
```

### 9.3 Proposed implementation

- File `CLAUDE_PERFORMANCE.json` in the repo, updated at the end of each session.
- HTML page `performance.html` rendering it (no server required).
- Git hook `post-commit` adding entries automatically.
- Command `/audit-me` running the analysis and showing my performance at the end of each session.
- "Broken promises" list extracted from CHANGES.md by keyword (TODO, pending, will be done).

**Why this solves the root problem.** The promise to "be more professional" is not fulfilled by intent. When there is a visible metric — *proactive detection rate* — behavior shifts because every session is recorded. This is exactly the feedback loop missing today.

---

## 10 · Decisions needed before any code is written

Before I start implementing Horizons 1-2-3 and the Dashboard, confirm or prioritize these points. If you say "all of it", I do them in the proposed order. If you want to re-order, do so.

1. **Do we ship engine tests before any new feature?** My recommendation: yes, a full week on this alone. Without it, everything we add sits on sand.
2. **Which presentation comes first: investors or Registrars?** Changes the order of Horizon 2. Registrars first: traditio, charges, time stamp, XML export. Investors first: polish KPMG and Insurance, add an M&A case.
3. **Do we build the Claude Dashboard as the first deliverable?** Light (one day) and gives us the measurement frame for everything else.
4. **Do we rename "Register" to "Inscription Simulation" everywhere right now?** Five minutes and removes the risk of a professional believing this replaces the real Registry.
5. **Do you accept that Block VIII and IX stubs stay documented as pending and we do not exhibit them until we have content?**
6. **Should I keep this file alive** (update it every time we close a horizon) or treat it as a one-shot?

---

## Quick reference: how to run the project

```powershell
# Start everything
cd phenomenon
docker compose up -d

# After backend Python changes
docker compose up -d --force-recreate backend

# Frontend changes: not needed, HMR handles it (~1 second)

# Logs
docker compose logs backend --tail=30
docker compose logs frontend --tail=30
```

URLs:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

---

## Quick reference: critical files map

| Layer | File | Why it matters |
|---|---|---|
| Frontend root | `apps/contracts/frontend/src/App.jsx` | Tab routing, global state |
| Domain config | `apps/contracts/frontend/src/constants.js` | All templates, IA types, cascade maps |
| Frontend state | `apps/contracts/frontend/src/hooks/usePhenomenon.js` | All app state + auto-cascade logic |
| Backend entry | `apps/contracts/backend/app/main.py` | Router registration |
| Cascade logic | `packages/engine/phenomenon_engine/cascade_engine.py` | Master→sub, sub→sibling, reverse |
| Ecosystem | `packages/engine/phenomenon_engine/ecosystem_engine.py` | 6 consistency rules + coverage |
| Homologation | `packages/engine/phenomenon_engine/homologation_engine.py` | Validation in 2 passes |
| Config flags | `packages/engine/phenomenon_engine/config.py` | Which theoretical layers are active |

---

---

## Corrections log

This section tracks self-corrections — places where a previous version of this document was wrong and was fixed against ground-truth in the code. Maintained as the "proactive detection" trace the Claude Performance Dashboard will measure.

| Date | Section | Correction | How it was caught |
|---|---|---|---|
| 2026-05-20 | §2.2 — engine anatomy | Block VIII and IX were tagged STUB. Ground truth in `base_cases.py` (4 full BaseCaseFlow defs with IA tables) and `theory_registry.py` (status PARTIAL with explicit gaps listed) shows PARTIAL is correct. Tags and metric "4 of 9 theoretical layers active" both updated. | While starting task #6 (verify stubs documented as pending), I read the actual files instead of trusting recall. Caught before user pointed it out |

---

*End of document. Last updated: 2026-05-20.*
