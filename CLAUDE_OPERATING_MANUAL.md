# CLAUDE_OPERATING_MANUAL.md

> **This file binds the agent.** Any Claude instance working on PHENOMENON must read this file at the start of every session and follow it. Violating any rule here without justification is a breach of protocol, recorded in `CLAUDE_PERFORMANCE.md`.

---

## 0. The Promise

The owner has said: *"I hope that I will not be able to find any bug before you do it and already resolved and logged it."*

This is the operating goal. Every rule below exists to make that goal real.

If the owner reports a bug that any pattern scan in `scripts/scans/` would have caught, **that is a system failure** — to be logged as a "scan miss" in `CLAUDE_PERFORMANCE.md` and used to design a new scan so it cannot recur.

---

## 1. Session Start Protocol — MANDATORY

Before doing anything the user asked, before reading a single file the user mentioned, run:

```bash
bash /c/Users/P/Documents/Claude/scripts/preflight.sh
```

Then:

1. Read `BUG_HUNT_QUEUE.md` — note the number of open items.
2. Read the last 3 entries of `AUDIT_LOG.md` (if it exists).
3. Read the last entry of `CLAUDE_PERFORMANCE.md` to know what behaviour drifted last session.
4. Report to the user, in **two sentences**: stack health + queue depth + most recent drift.

If preflight finds anything not-green, **flag it before touching the user's task**. Do not silently pass.

---

## 2. Definition of "Done"

A feature is **only** done when ALL of these are true:

| # | Check | How |
|---|---|---|
| 1 | Engine unit tests pass | `bash scripts/predone.sh` exits 0 |
| 2 | All pattern scans clean | included in predone |
| 3 | Full Playwright suite passes | included in predone |
| 4 | A count-invariant test exists if the feature operates over a collection | manual check + scan_count_invariants |
| 5 | Manual browser walkthrough completed if feature is UI-visible | document what you clicked |
| 6 | `phenomenon/CHANGES.md` updated | one entry with file paths |
| 7 | `SYSTEM_STATUS.md` updated if features/endpoints/files changed | per CLAUDE.md mandatory rule |
| 8 | `ERROR_DASHBOARD.md` updated if a bug was fixed | append to fixed-this-session table |
| 9 | At least one sentence stating what your tests would NOT have caught | written in the done-summary |
| 10 | If touching code, `BUG_HUNT_QUEUE.md` has a new entry for any unverified ripple effect | append to queue |

Saying "done" without item 9 is the highest-frequency violation. Catch yourself.

---

## 3. Pre-Task Protocol

For any non-trivial task:

1. **Grep for related code** before editing. If editing a shared module, list every caller.
2. **State the blast radius** in one sentence to the user. ("This touches App.jsx and the seguros panel; tests likely affected: 03, 07, 09.")
3. **Plan the invariant test** — what test would prove this works AND prove the inverse doesn't quietly pass? Write it FIRST or commit to writing it.
4. **Identify the failure-pattern category** (see §6). Apply that category's red-team checklist BEFORE coding, not after.

---

## 4. Mid-Task Protocol — when fixing a bug

When the user reports a bug:

1. **Reproduce it via API/CLI**, not the browser, before fixing. Capture exact reproduction commands.
2. **Find one sibling bug** before reporting back. The same pattern often exists elsewhere. (Verificar-todos was singular-master; check every other multi-entity handler.)
3. **Add the failing test before the fix**, then make it pass. Red-Green order.
4. **Add a pattern scan to `scripts/scans/`** if this bug class isn't already detectable. The scan must catch the bug you just fixed AND must run in `preflight.sh`/`predone.sh`.
5. **Log the bug, the sibling check result, and the new scan** in `CHANGES.md`.

---

## 5. End-of-Session Protocol

Before the session ends or context compacts:

1. Run `bash scripts/predone.sh` one final time on any work in progress.
2. Append a `CLAUDE_PERFORMANCE.md` entry — honest self-score against the rubric.
3. Add anything not-yet-audited to `BUG_HUNT_QUEUE.md`.
4. If the queue grew, plan to drain it next session.

---

## 6. Failure Pattern Library

Concrete patterns this codebase has actually exhibited. Each has a scan. Each scan runs in preflight + predone.

| # | Pattern | Symptom | Detector |
|---|---|---|---|
| 1 | Singular `master` assumed when project supports many | "Verificar todos" only verifies 4/16 contracts in Seguros | `scan_singular_master.sh` |
| 2 | `addLog` called with object literal | Blank page on Seguros buttons (React tried to render object) | `scan_addLog_object.sh` |
| 3 | Sub-type missing from `_ALL_SUB_TYPES` | Cascade silently does nothing for KPMG types | `scan_cascade_completeness.sh` |
| 4 | Doc drift — code newer than `CHANGES.md`/`SYSTEM_STATUS.md` | Next agent reads stale docs and gets the wrong mental model | `scan_doc_drift.sh` |
| 5 | UI button labeled "todos/all/every" without a count-invariant E2E test | Feature appears to work but only processes a subset | `scan_count_invariants.sh` |

**Adding new patterns:** every newly fixed bug must end with a scan in this list. The first sign of repeat: same scan absent.

---

## 7. Standing Permissions — the agent does not need to ask

These are blanket pre-authorized:

- Run `preflight.sh`, `predone.sh`, `health.sh`, `audit_sweep.sh`, and any `scans/*.sh` at any time.
- Run engine `pytest` and Playwright suites.
- Read any file under the project root.
- Update `CHANGES.md`, `SYSTEM_STATUS.md`, `ERROR_DASHBOARD.md`, `BUG_HUNT_QUEUE.md`, `AUDIT_LOG.md`, `CLAUDE_PERFORMANCE.md` without confirmation.
- Add new pattern scans under `scripts/scans/`.
- Spend up to one hour per session draining `BUG_HUNT_QUEUE.md` between user tasks, without asking. Log it.
- Write missing tests for features that lack invariant coverage.

These do **not** require permission:

- Restarting/seeding via demo endpoints in a dev container.
- Patching contracts in the local DB during reproduction.

These **do** require confirmation:

- Deleting code paths whose purpose is unclear.
- Database schema migrations.
- Modifying test assertions to make a failing test pass without first understanding why it failed.

---

## 8. Trust-Building Behaviors

These are positive behaviors the agent must default to. Not optional.

| Behavior | Why |
|---|---|
| Reproduce before fixing | A fix without reproduction is a guess. |
| Find one sibling bug per reported bug | Patterns repeat; surface them all. |
| Write the failing test before the fix | Proves the test would have caught it. |
| State what tests would NOT catch | Forces honest gap-finding. |
| Add a scan after every new bug class | Compound interest on diagnostic capacity. |
| Update queue + log after every audit | Visible work; survives compaction. |
| Score honestly in CLAUDE_PERFORMANCE.md | Drift is only fixable if visible. |

---

## 9. What to Memorize (persistent across sessions)

These memory entries are saved in the auto-memory store:

- **Standing rule:** at session start, run `scripts/preflight.sh` before anything else.
- **Standing rule:** before saying "done," run `scripts/predone.sh` — it is the enforcement of §2.
- **Failure pattern:** multi-entity features must verify count invariants (singular `master` is a trap).
- **Failure pattern:** any UI button labeled `todos/all/every` requires a count-invariant E2E test.
- **Failure pattern:** `addLog` is `(phase, msg, type)` — never an object literal.

If session compaction strips this manual from context, the memory entries restore the critical rules.

---

## 10. The Failure Mode We Are Designing Against

The owner observed: *"only after I mention or show you are able to detect, resolve it."*

The system in this manual exists to invert that:

```
Old loop:  user finds bug → reports it → agent fixes it → user finds the next bug
New loop:  agent runs scans → finds bug → fixes it → adds scan to prevent recurrence
           → user sees a clean log and trusts the system
```

Every part of this manual exists to push the loop from old to new. If you, future Claude, are reading this and find yourself defaulting to reactive mode — stop, run `audit_sweep.sh`, and shift back to proactive.

---

*Last revised: 2026-05-21. Owner: the project. Edits by agents are allowed and expected — improve the manual as you discover new patterns.*
