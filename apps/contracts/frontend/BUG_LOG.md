# PHENOMENON Frontend — Bug Log

> Append-only. Every bug found during the UI upgrade is recorded here with status and fix commit.

| # | Found in | Description | Severity | Status | Fixed in commit |
|---|---|---|---|---|---|
| — | — | No bugs logged yet — baseline established | — | — | v0-baseline |
| 1 | v1-layout | `getRiskLevel` and `RISK_ICONS` imported in App.jsx but never used directly — only used inside RiskPanel component. Pre-existing dead import, ESLint `no-unused-vars` would flag these. | minor | open — out of scope for v1 (removing could break tree-shaking assumptions; defer to TypeScript migration) | — |
| 2 | v1-layout | `getOpusLevel` imported in App.jsx but never called directly — OPUS_LEVELS object is used instead. Pre-existing unused import. | minor | open — out of scope for v1 | — |
| 3 | v1-layout | `makeHResize` in original App.jsx closed over `rightW` state via a stale reference: `const sw = setW === setRightW ? rightW : 0`. If `setW !== setRightW`, `sw` is always 0, making non-rightW resize incorrect. Not triggered in existing layout (only one horizontal grip existed) but the pattern is fragile. Replaced with explicit `startLeftResize` and `startRightResize` closures in v1-layout that capture the correct current width each time. | major | fixed — v1-layout |
| 4 | v1-layout | Log auto-show/auto-hide logic in original App.jsx referenced `logPinned` in the `useEffect` dep array implicitly through the closure but `logPinned` was missing from deps — potential stale-closure bug where the timer sees a stale `logPinned` value. Removed in v1-layout (floating log replaced by permanent strip). | minor | fixed — v1-layout (entire floating-log mechanism removed) |

---

## How to use
- **Found in**: which priority step surfaced this bug (v1-layout, v2-cascade, etc.)
- **Severity**: `blocker` · `major` · `minor`
- **Status**: `open` · `in-progress` · `fixed`
- **Fixed in commit**: git commit hash or tag

## Rollback instructions
```bash
# Restore the physical backup (no git needed):
cp -r apps/contracts/frontend/src_backup_v0/* apps/contracts/frontend/src/

# OR roll back to any git checkpoint:
git checkout v0-baseline -- apps/contracts/frontend/src/
git checkout v1-layout   -- apps/contracts/frontend/src/
# etc.
```
