# AGENTS.md — AI Coding Agent Guidance

## Purpose
This file gives AI coding agents a fast, accurate summary of this workspace and how to contribute safely.

## What this project is
A full-stack legal contract intelligence system called PHENOMENON.
- Backend: FastAPI + PostgreSQL in `phenomenon/apps/contracts/backend`
- Frontend: React + Vite in `phenomenon/apps/contracts/frontend`
- Core engine: Python `phenomenon_engine` in `phenomenon/packages/engine`
- E2E tests: Playwright in `phenomenon/e2e`
- Orchestration: `phenomenon/docker-compose.yml`

## Canonical workflow
Always start from the `phenomenon/` folder.

### Run the app
```powershell
cd phenomenon
docker compose up -d
```

### Restart backend after backend code changes
```powershell
cd phenomenon
docker compose up -d --force-recreate backend
```

### Rebuild frontend/backend after Compose or dependency changes
```powershell
cd phenomenon
docker compose build frontend backend && docker compose up -d
```

### Run tests
```powershell
cd phenomenon\e2e
npm test
```

### Install Playwright browser for E2E locally
```powershell
cd phenomenon\e2e
npm run install:browsers
```

## Important docs
- `SYSTEM_STATUS.md` — primary source-of-truth for current commands, state, and architecture
- `PROJECT_TRACKER.md` — feature status, pending work, demo plans, and known issues
- `AGENTS.md` — workspace AI coding guidance and workflow conventions
- `SKILL.md` — holistic application skill summary for agents
- `CLAUDE.md` — project-level explanation and meta summary
- `phenomenon/CHANGES.md` — chronological log of app changes

## Key folders and files
- `phenomenon/apps/contracts/backend/app/main.py` — FastAPI app startup and router registration
- `phenomenon/apps/contracts/backend/app/api/` — API route handlers by domain
- `phenomenon/apps/contracts/backend/app/config.py` — backend settings
- `phenomenon/apps/contracts/backend/app/database.py` — PostgreSQL connection and SQLAlchemy engine
- `phenomenon/apps/contracts/backend/app/models.py` — DB model definitions
- `phenomenon/apps/contracts/frontend/src/App.jsx` — React application root and tab navigation
- `phenomenon/apps/contracts/frontend/src/constants.js` — all domain templates, field definitions, and contract maps
- `phenomenon/apps/contracts/frontend/src/api/phenomenon.js` — frontend API client surface
- `phenomenon/apps/contracts/frontend/src/hooks/usePhenomenon.js` — app state management and cascade logic
- `phenomenon/packages/engine/phenomenon_engine/` — core contract ontology and cascade engine
- `phenomenon/e2e/tests/` — Playwright scenario-based coverage

## Project conventions for agents
- Prefer internal docs over inventing conventions: read `SYSTEM_STATUS.md` and `PROJECT_TRACKER.md` first.
- Do not modify or duplicate the engineering theory documents unless explicitly asked; link to `PHENOMENON_SKILL.md` or `CLAUDE.md` instead.
- Keep changes minimal for exploratory fixes; preserve existing Docker and Compose patterns.
- Use the backend `health` route at `http://localhost:8000/health` to confirm service readiness.
- Be cautious with AI config: `.env` in `phenomenon/` is expected to contain `ANTHROPIC_API_KEY` and `CLAUDE_MODEL`.

## Notes for new tasks
- If the user requests a code change, verify whether it is backend, frontend, or engine first.
- For backend work, locate the relevant route in `phenomenon/apps/contracts/backend/app/api/` and the model mapping in `phenomenon/apps/contracts/backend/app/models.py`.
- For frontend work, the main app state is in `phenomenon/apps/contracts/frontend/src/hooks/usePhenomenon.js` and UI fields are defined in `phenomenon/apps/contracts/frontend/src/constants.js`.
- For cascade, use `phenomenon/packages/engine/phenomenon_engine/cascade_engine.py`.

## File created by agent
- `AGENTS.md` — root-level AI guidance for this workspace
