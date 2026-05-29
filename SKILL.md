# SKILL.md — PHENOMENON Application Skill

## Purpose
This skill file summarizes the PHENOMENON application for AI coding agents. It is intended to help agents understand the whole system, its architecture, and how to make changes safely.

## What this project is
PHENOMENON is a full-stack legal contract intelligence system.
- Backend: FastAPI + PostgreSQL in `phenomenon/apps/contracts/backend`
- Frontend: React + Vite in `phenomenon/apps/contracts/frontend`
- Core engine: Python `phenomenon_engine` in `phenomenon/packages/engine`
- E2E tests: Playwright in `phenomenon/e2e`
- Orchestration: `phenomenon/docker-compose.yml`

The system models contracts as hierarchical "phenomena" with stable identity (`ESS`), operational content (`AG`), and cascade propagation between related contracts.

## When to use this skill
- Adding or fixing backend API routes
- Modifying frontend contract builder UI or state management
- Changing cascade logic or contract modeling in the engine
- Updating or adding E2E test coverage
- Diagnosing how a contract change propagates across the system

## Run commands
From `phenomenon/`:
```powershell
docker compose up -d
```
Restart backend after backend code changes:
```powershell
docker compose up -d --force-recreate backend
```
Full rebuild when compose or dependencies change:
```powershell
docker compose build frontend backend && docker compose up -d
```
Run Playwright tests from `phenomenon/e2e`:
```powershell
npm test
```
Install browsers:
```powershell
npm run install:browsers
```

## Architecture overview
The application is split into four main layers:

1. `frontend` — React SPA, contract UI, domain templates, user interactions
2. `backend` — FastAPI routes, database access, Claude integration, demo endpoints
3. `engine` — PHENOMENON ontology, cascade logic, IA operators, contract models
4. `database` — PostgreSQL stores phenomenon records with JSON fields for flexible terms

The backend uses the engine package and exposes REST endpoints consumed by the frontend. E2E tests verify the end-to-end contract flows through the running Docker Compose stack.

## Key files and folders
- `phenomenon/apps/contracts/backend/app/main.py` — FastAPI app entry point
- `phenomenon/apps/contracts/backend/app/api/` — route handlers by domain
- `phenomenon/apps/contracts/backend/app/models.py` — ORM models
- `phenomenon/apps/contracts/backend/app/database.py` — DB engine and sessions
- `phenomenon/apps/contracts/frontend/src/App.jsx` — React root and tab navigation
- `phenomenon/apps/contracts/frontend/src/constants.js` — contract templates, field definitions, domain maps
- `phenomenon/apps/contracts/frontend/src/api/phenomenon.js` — API client
- `phenomenon/apps/contracts/frontend/src/hooks/usePhenomenon.js` — application state and cascade side effects
- `phenomenon/packages/engine/phenomenon_engine/cascade_engine.py` — cascade propagation logic
- `phenomenon/e2e/tests/` — Playwright scenario tests

## Development conventions
- Prefer existing docs: `SYSTEM_STATUS.md`, `PROJECT_TRACKER.md`, `AGENTS.md`, `CLAUDE.md`
- Do not duplicate the theory documents unless explicitly requested; link to them instead
- Use `http://localhost:8000/health` to confirm backend readiness
- Use the backend `.env` keys `ANTHROPIC_API_KEY` and `CLAUDE_MODEL` for AI features
- Keep changes minimal and respect the current Docker Compose development workflow

## How to approach tasks
1. Identify whether the task is frontend, backend, engine, or tests.
2. For backend changes, inspect `phenomenon/apps/contracts/backend/app/api/` and `models.py`.
3. For frontend changes, inspect `App.jsx`, `constants.js`, and `hooks/usePhenomenon.js`.
4. For cascade or contract logic, inspect `phenomenon/packages/engine/phenomenon_engine/cascade_engine.py` and related engine modules.
5. For UI contract cases, check `phenomenon/e2e/tests/` for existing scenario coverage.

## Notes
- This repository contains a full-stack demo with domain-specific contract scenarios (Seguros, KPMG corporate cases, etc.).
- The engine is intentionally decoupled and lives under `phenomenon/packages/engine/phenomenon_engine`.
- The frontend is a Vite React app with live reload in Docker development.

## References
- `SYSTEM_STATUS.md` — full system status and commands
- `PROJECT_TRACKER.md` — build status, pending work, and demo plans
- `AGENTS.md` — workspace AI coding guidance and workflow conventions
- `CLAUDE.md` — agent entry point and system theory summary
- `phenomenon/CHANGES.md` — app-specific change history
