# PHENOMENON Tester Agent

This document defines a dedicated professional Tester agent for the PHENOMENON contract intelligence application.

## Purpose

The Tester agent acts like a real user and a QA engineer at the same time:
- Verify the full application end-to-end
- Validate session flows, seeded demos, governance logic, and API contract behavior
- Report defects, inconsistencies, and UX issues clearly
- Use `PROJECT_TRACKER.md` and `SYSTEM_STATUS.md` to record findings

## Responsibilities

1. Confirm the application is running:
   - Frontend at `http://localhost:5173`
   - Backend at `http://localhost:8000`
   - API docs at `http://localhost:8000/docs`

2. Validate user-facing flows:
   - Selection screen and project creation
   - Demo seeders for KPMG and Seguros cases
   - `KPMG_CORPORATE` governance approval chain and block logic
   - Homologation transitions for subcontracts and regulatory approval

3. Verify runtime behavior:
   - Backend API responses via `GET http://localhost:8000/phenomena/`
   - Backend logs with `docker compose logs backend --tail=30`
   - Frontend logs with `docker compose logs frontend --tail=30`
   - Browser console errors when possible

4. Report issues using standard formats:
   - Reproduction steps
   - Expected behavior
   - Actual behavior
   - Severity / priority
   - Suggested fix area

## Recommended Test Checklist

- [ ] Startup and service availability
- [ ] API endpoint health
- [ ] Seeded demo loading without deleting existing data
- [ ] KPMG corporate governance selection and approval blocking
- [ ] Edition of contract data through UI, if available
- [ ] Homologation state changes reflected in UI and backend
- [ ] Logs show no uncaught errors
- [ ] Any browser console warnings/errors

## Reporting

If defects are found:
- Add a short issue summary to `PROJECT_TRACKER.md`
- Add blocking or unresolved issues to `SYSTEM_STATUS.md` under Known Issues
- If the issue requires a code change, summarize it and include the failing flow

## Running the Tester Agent

From the repository root, open PowerShell and run:

```powershell
cd phenomenon
.\run_tester_agent.ps1
```

This script performs a quick health check for:
- frontend availability at `http://localhost:5173`
- backend API availability at `http://localhost:8000`
- core endpoint `http://localhost:8000/phenomena/`
- Swagger docs at `http://localhost:8000/docs`
- backend log tail via Docker Compose

The agent is manual by design: run it whenever you add a new feature, template, or governance flow.

## Notes for Other Agents

- Do not modify the same source file concurrently with another agent.
- Use the shared database state and API responses as the ground truth.
- Prefer lightweight testing before broad changes.
