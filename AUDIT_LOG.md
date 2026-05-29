# Audit Log

Append-only log of proactive audit sweeps. One entry per sweep.

---

## 2026-05-21T22:45Z — First preflight ever run

**Trigger:** end-to-end smoke of the enforcement system itself.

**Result:** 3 categories of finding, 6 source-code locations.

### Pattern hits

**`scan_singular_master` — 6 hits:**

| # | File:line | Severity | Diagnosis |
|---|---|---|---|
| 1 | `IAEngineView.jsx:235` | **P1 functional** | Operadores tab uses `[master, ...subContracts]`. In Seguros (4 masters, 16 contracts), the user can only assign IA operators to the first master and its 3 subs. The remaining 12 contracts are unreachable via this tab. Same singular-master shape as the original Verificar-todos bug. |
| 2 | `IAEngineTab.jsx:91` | **P1 functional** | Same as above in alt component. (Confirm which is actually rendered.) |
| 3 | `App.jsx:313` | **P2 cosmetic** | Header dashboard stats (active / review / homologated counts) compute over the first master's set only. In Seguros, the header shows 4/4 when 16 contracts exist. |
| 4 | `LiveFeed.jsx:11` | **P2 cosmetic** | Live feed bottom strip "Contratos: N" badge shows `1 + subContracts.length` = always wrong for multi-master. |
| 5 | `CompactIAPanel.jsx:89` | **P2 cosmetic** | L2 read-only IA mini-map shows only first master's IA assignments. |
| 6 | `ContractGraph.jsx:552` | **By-design** | Graph is intentionally per-master in PHENOMENON; navigation between masters is via ProjectManager. Whitelist this in the scan. |

**`scan_count_invariants` — 1 hit:**
- UI label `¿Reiniciar? Se eliminarán todos los subcontratos y campos.` has no E2E test. This is the project-reset confirm dialog — destructive action without a test is risky. **P2 hardening.**

**`scan_doc_drift` — 1 hit:**
- Code changed 14 min after `SYSTEM_STATUS.md` was last updated. Caused by the operating-manual creation this session. **P3 — will resolve when I append to SYSTEM_STATUS at end of this session.**

### Actions taken this session
- Fix the P1 IA Operadores bug immediately (critical: user cannot manage IA for 75% of contracts in Seguros).
- Add E2E regression test.
- Add the P2 items to `BUG_HUNT_QUEUE.md` with file:line pointers so the next sweep picks them up.
- Whitelist `ContractGraph.jsx` in the scan (by-design).
- Resolve doc drift at end of session.

### Pattern learning
- The singular-master pattern is **endemic** in this codebase — at least 5 places have it. The Verificar-todos bug was not unique; it was the first noticed instance. Going forward: any new code touching collections must use `Object.values(contracts)`.
- The pattern scan correctly identified all 5 instances + 1 by-design use on first run. Effective.
