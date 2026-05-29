# AUDIT_CHECKLIST.md

> Per-feature-category red-team checklists. Before declaring any feature done, identify its category and walk the checklist. Used by `audit_sweep.sh` and by the agent during pre-done review.

---

## A. Multi-Entity Feature (collections, "todos/all/every" actions)

A feature that operates on more than one entity at a time. Examples: Verificar todos, Apply cascade to all, Add party to ecosystem.

- [ ] Does the handler use `Object.values(contracts)` or equivalent, NOT just `master + subContracts`?
- [ ] If the project supports multiple masters (Seguros: 4), is each one in the iteration?
- [ ] Does the iteration order matter (subs-before-masters for coherence checks)?
- [ ] Is there an E2E test that PATCHes a field on the SECOND or THIRD master and asserts the handler catches it?
- [ ] Does the UI label match the actual scope? ("todos" must touch all.)
- [ ] If items can fail, are failures aggregated and reported, not silently swallowed?
- [ ] Are there tests for: 0 items, 1 item, N items, N>typical (e.g. 100)?

## B. Cascade / Propagation Feature

A feature where a change in one record fires changes in linked records.

- [ ] Is every sub-type in the engine's `_ALL_SUB_TYPES`? Run `scan_cascade_completeness.sh`.
- [ ] Is the propagation loop-safe? (Source is not in `affected_ids`.)
- [ ] Does a change propagate ONLY to the intended scope (same parent / same ecosystem), not across unrelated projects?
- [ ] Is there a property test: every entry in `CASCADE_MAP` / `SUB_CASCADE_MAP` / `REVERSE_CASCADE_MAP` actually fires?
- [ ] Does the cascade fail closed (everything NEEDS_REVIEW) rather than fail open (silently skip)?
- [ ] Is the cascade observable? (Trace, log, or UI badge?)

## C. AI-Generated Content Feature

A feature where the AI (Claude) produces content (clauses, summaries, recommendations).

- [ ] Is there a deterministic fallback for when the AI is unreachable / quota-blocked?
- [ ] Is the prompt versioned? (At minimum, comment with date + intent.)
- [ ] Are outputs validated against expected shape (length bounds, Spanish for ES content, no obvious hallucinations)?
- [ ] Is the cost/token usage logged or rate-limited?
- [ ] If the output is shown to lawyers/registrars, is there a disclaimer that it is AI-generated?

## D. State Machine / Lifecycle Feature

A feature where a record transitions through statuses (ACTIVE → SINIESTRO_PENDIENTE → INDEMNIZACION_PAGADA | RECHAZO).

- [ ] Are illegal transitions blocked at the backend? (Not just hidden in UI.)
- [ ] Is BLOCKED a separate, immovable state? (Cannot become ACTIVE without an explicit unblock.)
- [ ] Are all transitions tested (pytest + Playwright)?
- [ ] Does the state survive a page reload?
- [ ] Is there a "rollback" path if a transition was made in error?

## E. Form / Field Validation Feature

A feature where the user fills in fields and submits.

- [ ] Are required fields enforced at the BACKEND, not just the frontend? (Trust nothing from the client.)
- [ ] Does the homologation endpoint correctly reject empty required fields? (Test by PATCH'ing empty + calling homologate.)
- [ ] Are select dropdowns' "— seleccionar —" treated as empty?
- [ ] Are numeric fields validated for type (no "abc" in a number field)?
- [ ] Are dates validated (start before end, reasonable bounds)?
- [ ] Is there feedback on save failure (not silent)?

## F. UI Panel / Tab Feature

A feature exposed as a new panel or tab in the right column.

- [ ] Wrapped in an `ErrorBoundary` with a scope?
- [ ] Renders correctly when the user has NO contract selected?
- [ ] Renders correctly when the master is incomplete?
- [ ] Does NOT crash if `master.ag.terms.X` is undefined? (Optional chaining everywhere?)
- [ ] Has a `data-testid` for E2E?
- [ ] Tab itself is conditionally visible only when relevant (e.g. Seguros tab only when insurance data present)?

## G. Graph / Visual Feature

A feature affecting the contract graph (nodes, edges, particles).

- [ ] Renders with 0 contracts? With 1 master + 0 subs? With 16 contracts?
- [ ] Performance acceptable with 100+ contracts? (Lazy render, virtualization?)
- [ ] Zoom/pan still work after the change?
- [ ] Does NOT crash on incomplete data (missing parentId, missing children array)?
- [ ] Edge animations and particles do not leak memory across re-renders?

## H. External API / Integration Feature

A feature that calls an external system (Catastro, BOE, FNMT, signature provider).

- [ ] Network failure is handled gracefully (timeout + retry + user-visible error)?
- [ ] Real API is mocked in tests (no flaky CI from external dependencies)?
- [ ] Credentials are env-vars, not committed?
- [ ] Rate limits are respected (exponential backoff)?
- [ ] Response is validated against expected shape before use?

## I. Authentication / Authorization Feature (future)

When we add auth.

- [ ] Every write endpoint requires authentication?
- [ ] Multi-tenant isolation enforced at DB query level (not just in app code)?
- [ ] Sessions expire?
- [ ] Audit trail records user identity on every mutation?

---

## How to apply

When auditing a feature:
1. Identify which category(ies) it falls into (often more than one).
2. For each category, walk the checklist.
3. For every "no" or "unsure" item, write a test that exercises the gap.
4. Log findings to `AUDIT_LOG.md`.
5. If a new failure pattern emerges, add a scan to `scripts/scans/` and add the pattern to `CLAUDE_OPERATING_MANUAL.md` §6.
