# BUG_HUNT_QUEUE.md

> Persistent list of features and code paths that have shipped without an invariant audit. The agent drains items here proactively (see `CLAUDE_OPERATING_MANUAL.md` §7). Format: `- [ ]` unaudited · `- [x]` audited (kept for history).
>
> **Owner-visible:** if you see an item here that worries you, tell me to audit it next. Otherwise the agent will rotate through them.

---

## P1 — Suspected silent bugs (audit first)

- [x] **Add-party-to-ecosystem** — propagation correct, no cross-master pollution. Audited 2026-05-21. CLEAN. + role-A/B reservation bug found and fixed.
- [x] **Add-contract mid-lifecycle** — attaches only to target master, no contamination. Audited 2026-05-21. CLEAN.
- [x] **Ecosystem homologation** scope — checks only target ecosystem, no cross-mutation. Audited 2026-05-21. CLEAN.
- [x] **Cascade triggered by ESS change** on non-first master — all 3 subs cascade correctly, no contamination of other masters. Audited 2026-05-21. CLEAN.
- [x] **Terminate cascades** — only the source's master gets NEEDS_REVIEW, no contamination. Audited 2026-05-21. CLEAN.

## P2 — Untested edge cases

- [x] **Empty-string vs null** — both treated as missing uniformly. Audited 2026-05-21. CLEAN.
- [x] **Select "— seleccionar —" sentinel** — correctly flagged as empty. Audited 2026-05-21. CLEAN.
- [x] **Insurance phase transitions** — SINIESTRO_PENDIENTE → ACTIVE via PATCH blocked (409). Audited 2026-05-21. CLEAN after fix.
- [x] **BLOCKED → ACTIVE** — fixed; PATCH returns 409, siniestro returns 409. Locked by `test_patch_state_machine_guards.py` and `test_lifecycle_guards.py`.
- [x] **IA operator compatibility** — `IAEngine.validate_set` is called and flags incompatible sets. Audited 2026-05-21. CLEAN.
- [x] **Cascade cycles** — NDA↔DPA, NDA↔IP, PAYMENT↔SLA cycles exist BY DESIGN (mutual dependencies). Engine's loop prevention (source not in affected_ids) prevents runtime infinite loops. Documented.
- [x] **Reverse cascade idempotency** — running twice yields same result. Audited 2026-05-21. CLEAN.
- [x] **Concurrent PATCHes** — 5 simultaneous writes return 200, last-write-wins, no DB corruption. INFO: not problematic for single-user MVP; flag for multi-user phase.
- [ ] **Form save with stale optimistic state** — frontend-only concern; not yet exercised by API audit. (Category E)
- [ ] **Graph rendering with 0 contracts** — frontend visual concern; tested implicitly by SelectionScreen tests. (Category G)
- [x] **Demo cross-pollution** — both `/demo/kpmg/seed` and `/demo/seguros/seed` call `_delete_all_contracts` first. Audited 2026-05-21. CLEAN.

## P3 — Cosmetic / hardening

- [ ] **Print CSS** — does the printable contract layout look like a real Spanish legal document or like a webpage screenshot? (Category F)
- [ ] **Mobile/tablet** — anything below 1200px viewport breaks? (Category F, G)
- [ ] **i18n** — Spanish-only strings are hardcoded everywhere; any future English version is currently impossible without find-and-replace. (Category C indirectly)
- [ ] **Toast/notification queue** — what happens if 5 cascade events fire simultaneously? Does ImpactNotification queue them or drop them? (Category F)
- [ ] **Long contract names** — do they overflow / truncate cleanly in the graph, the verify panel, and the right-panel header? (Category F, G)

## P4 — Engine / theory soundness

- [ ] **Property test: every SUB_CASCADE_MAP source.field → target propagates** — partial coverage today; turn into exhaustive parametrized test. (Category B)
- [ ] **Property test: every CONSISTENCY_RULE fires when violated AND does not fire when satisfied** — tested 3 of 6 rules; cover all 6. (Category E)
- [ ] **Bridge layer (`bridge.py`)** — converts engine events into the theoretical block model; any silent failure when emit fails? (Category B)
- [ ] **`IAEngine.validate_set` exhaustiveness** — every pair of IA operators tested for compatibility? (Category E)

---

## Audit completion summary — 2026-05-21

**P1 items drained:** 5/5 — all clean. The singular-master bug class was contained to Verificar-todos + Operadores (both fixed). Other multi-master code paths use `Object.values` / repo-based iteration correctly.

**P2 items drained:** 9/11 — 2 remaining are frontend visual concerns (form race, graph empty-state) appropriate for next UI session.

**Bugs found during P1/P2 audit (10 total):**
1. BLOCKED → ACTIVE silently via PATCH (state machine bypass)
2. effectiveDate accepts any string (no ISO validation)
3. partyA accepts `<script>` (XSS vector)
4. effectiveDate > expiryDate passed homologation
5. Negative € / % / duration values passed homologation
6. DELETE on non-existent returned 200 (silent)
7. Siniestro on TERMINATED contract accepted
8. Siniestro on non-coverage type (EXCLUSIONES, PRIMA) accepted
9. Double siniestro on same contract accepted
10. add-party with role 'A' / 'B' (collision with master partyA/B) accepted

**All 10 locked in by 23 new engine tests across 4 files. Zero Playwright regressions.**

## Field-level coverage gap — DRAINED 2026-05-21

Owner reported "empty fields pass Verificar todos" for the 3rd time. The previous two fixes were TYPE-level. This one closes the FIELD level:

- `_SUB_REQUIRED` now enforces 180/180 UI sub-fields (was 81 — 99 gaps closed)
- `_MASTER_REQUIRED` now enforces 142/142 UI master fields (was 58 — 84 gaps closed)
- New scan `scan_field_level_coverage.sh` in preflight + predone
- New pytest: `test_every_ui_sub_field_is_required_or_whitelisted`, `test_every_ui_master_field_is_required_or_whitelisted`

The class is now structurally closed at the field level.

---

## How items get drained

`bash scripts/audit_sweep.sh` picks the first `- [ ]` item in this file and runs all `scripts/scans/*.sh` against it, logging results to `AUDIT_LOG.md`. After the sweep, the item is marked `- [x]`.

If a sweep finds a real bug, the agent fixes it, writes a regression test, adds a scan if a new bug class is involved, and logs everything in `CHANGES.md`.

## How items get added

- Whenever a feature is shipped, the agent appends any unverified ripple effect here.
- Whenever a bug is reported, the agent appends "find sibling bug for [X]" here.
- The owner may add items by editing this file.
