# PHENOMENON Frontend — Bug Log

> Append-only. Every bug found during the UI upgrade is recorded here with status and fix commit.

| # | Found in | Description | Severity | Status | Fixed in commit |
|---|---|---|---|---|---|
| — | — | No bugs logged yet — baseline established | — | — | v0-baseline |

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
