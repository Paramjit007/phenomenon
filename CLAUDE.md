# CLAUDE.md — Agent Entry Point

**STOP. Before reading any other file, before touching any task:**

```bash
bash /c/Users/P/Documents/Claude/scripts/preflight.sh
```

Then read `CLAUDE_OPERATING_MANUAL.md` — it binds your behaviour for this session. It supersedes any conflict with prose in this file.

**Operating-system files (mandatory):**

- **`AGENT_CONSTITUTION.md`** — The 9 binding architectural principles (Clean Architecture, DDD, SOLID, Twelve-Factor, API-first, TDD, Observability-first, Immutable infra, Zero-trust security). Every agent inherits these. Every deliverable must respect them or be rejected.
- **`CLAUDE_OPERATING_MANUAL.md`** — Standing instructions: definition of done, pre-task/pre-done protocols, failure pattern library, standing permissions. Read at session start, every session.
- **`AUDIT_CHECKLIST.md`** — Per-feature-category red-team checklists. Consulted before declaring features done.
- **`BUG_HUNT_QUEUE.md`** — Persistent list of unaudited features. Drain proactively via `scripts/audit_sweep.sh`.
- **`CLAUDE_PERFORMANCE.md`** — Self-audit log. Append at session end with honest rubric scores.
- **`AUDIT_LOG.md`** — Append-only log of audit sweeps (auto-created by `audit_sweep.sh`).

**Project knowledge files (reference):**

00. **`PROJECT_DIAGNOSIS.md`** — Single source of truth. Honest end-to-end diagnosis of the engine and the application, with metrics, gaps vs. lawyers/Registrars, 3-horizon build plan with checklists, test framework with auto-repair design, and the Claude Performance Dashboard spec. **Always load this file first** — it answers "what is built, what is broken, what comes next" without conversation history. Mirror in `PROJECT_DIAGNOSIS.html` for printing.

0. **`ERROR_DASHBOARD.md`** — Current test status (66/66 passing), all errors found and fixed this session, pre-demo checklist, common error patterns with causes and fixes.

1. **`SYSTEM_STATUS.md`** — Complete technical reference: architecture, all API endpoints, all components, all implemented features, known issues, how to run. Full system knowledge without conversation history.

2. **`PROJECT_TRACKER.md`** — Current build status: checkboxes of what's done ✅ / in progress ⏳ / not started ❌, known bugs, session plan for the 3 remaining cases (Compraventa, Seguros, KPMG Corporate), testing sign-off checklist.

3. **`PRESENTACION_PHENOMENON.html`** — Presentación completa en español (22 diapositivas). Abrir en navegador → Imprimir → Guardar como PDF. Incluye: análisis competitivo, los 3 casos con detalle jurídico, arquitectura del motor, estado actual, roadmap, propuesta para Registradores, y cierre para inversores.

4. **`MY_APPLICATION_GUIDE.md`** — Written for the owner (Param). Plain language explanation of what the app does and what makes it unique. End-to-end walkthrough of all 3 cases: exactly where to click, what happens on screen, what to say to partners. Answers to questions partners will ask.

6. **`LEGAL_PROFESSIONAL_DEMO.md`** — Specifically for demonstrating to Registradores de la Propiedad and professional lawyers. Honest readiness assessment (are we ready? NO — here is exactly why and what to fix first). The 5 things that will go wrong. The 4 genuine strengths that WILL impress them. The specific hard questions they will ask and exactly what to answer. A different demo flow than the investor demo. Priority list of what to build before this presentation.

7. **`COMPLETE_REVIEW.md`** — Deep honest analysis: what each case proves and its intent, what can be built on top of each case, what is genuinely missing in the engine/frontend/backend, what the application IS and IS NOT today, full gap analysis, and the roadmap to commercial product.

4. **`DEMO_INVESTOR_CASES.md`** — Technical demo preparation for agents: competitive analysis, pre-demo API test checklists (curl commands), pitch messaging structure.

4. **`phenomenon/CHANGES.md`** — Chronological log of every change. Read if you need to understand WHY something was built a certain way.

---

## Mandatory Rule for All Agents

**After completing any task that changes the system, update `SYSTEM_STATUS.md`:**

- New feature built → add to "Features Fully Implemented" (Section 10)
- New file created → add to the file structure (Section 2) and component map (Section 5)
- New API endpoint → add to endpoint tables (Section 4)
- New constant/template → add to constants section (Section 8)
- Bug fixed → update "Known Issues" (Section 12)
- Feature started but not finished → add to "Features Pending" (Section 11)

Also append a summary entry to `phenomenon/CHANGES.md`.

This keeps the knowledge base current so any new agent starts with full context.

---

## Project Summary

**PHENOMENON Contract Intelligence System** — a full-stack legal contract management application running in Docker.

- **Engine**: Python PHENOMENON framework (ontological/philosophical) as the structural backbone
- **Backend**: FastAPI + PostgreSQL (port 8000)
- **Frontend**: React + Vite (port 5173, volume-mounted for HMR)
- **AI**: Claude API for clause generation and cascade impact analysis

The system models contracts as "phenomena" with ESS (stable identity) and AG (operational content). Contracts connect via IF (inter-phenomenic) links. Changes cascade through the network automatically. The ecosystem is validated as a single unit.

**Currently running:** `docker compose up -d` from `phenomenon/`

**Key entry files:**
- `phenomenon/apps/contracts/frontend/src/App.jsx` — React root
- `phenomenon/apps/contracts/frontend/src/constants.js` — ALL domain definitions
- `phenomenon/apps/contracts/backend/app/main.py` — API router registration
- `phenomenon/packages/engine/phenomenon_engine/cascade_engine.py` — cascade logic

---

## PHENOMENON Framework Concepts

| Concept | Implementation |
|---|---|
| Phenomenon | Any contract (PhenomenonRecord) |
| ESS | Stable identity: partyA, partyB, jurisdiction, dates |
| AG | Operations: clauses + all term fields (stored in ag_json.terms) |
| IA operators | ad-actio, de-actio, non, co-implication |
| IF | Master→sub (parent_id FK) + sibling links (SUB_CASCADE_MAP) |
| Opus | PARTIAL→COMPLETE→OPONIBLE (homologation levels) |
| Cascade | ESS change → propagates to all connected contracts |

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://phenomenon:phenomenon@db/phenomenon
CLAUDE_MODEL=claude-sonnet-4-20250514
```
