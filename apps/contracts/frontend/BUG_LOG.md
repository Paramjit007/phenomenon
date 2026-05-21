# PHENOMENON Frontend — Bug Log

> Append-only. Every bug found during the UI upgrade is recorded here with status and fix commit.

| # | Found in | Description | Severity | Status | Fixed in commit |
|---|---|---|---|---|---|
| — | — | No bugs logged yet — baseline established | — | — | v0-baseline |
| 1 | v1-layout | `getRiskLevel` and `RISK_ICONS` imported in App.jsx but never used directly — only used inside RiskPanel component. Pre-existing dead import, ESLint `no-unused-vars` would flag these. | minor | open — out of scope for v1 (removing could break tree-shaking assumptions; defer to TypeScript migration) | — |
| 2 | v1-layout | `getOpusLevel` imported in App.jsx but never called directly — OPUS_LEVELS object is used instead. Pre-existing unused import. | minor | open — out of scope for v1 | — |
| 3 | v1-layout | `makeHResize` in original App.jsx closed over `rightW` state via a stale reference: `const sw = setW === setRightW ? rightW : 0`. If `setW !== setRightW`, `sw` is always 0, making non-rightW resize incorrect. Not triggered in existing layout (only one horizontal grip existed) but the pattern is fragile. Replaced with explicit `startLeftResize` and `startRightResize` closures in v1-layout that capture the correct current width each time. | major | fixed — v1-layout |
| 4 | v1-layout | Log auto-show/auto-hide logic in original App.jsx referenced `logPinned` in the `useEffect` dep array implicitly through the closure but `logPinned` was missing from deps — potential stale-closure bug where the timer sees a stale `logPinned` value. Removed in v1-layout (floating log replaced by permanent strip). | minor | fixed — v1-layout (entire floating-log mechanism removed) |
| 5 | v2-cascade | `CenterStage.jsx` passed `onCascadeComplete` prop through to `CascadePlayground` but `App.jsx` was not supplying this prop to `CenterStage` — the callback would always be `undefined`, so executed cascades would never flash graph nodes. Fixed in v2-cascade by adding `onCascadeComplete` prop to the `CenterStage` call in `App.jsx`. | major | fixed — v2-cascade |
| 6 | v2-cascade | `analyzeCascade` in `api/phenomenon.js` returns `{ text, fallback }` — `text` is the AI-generated analysis string, not a structured per-contract impact list. Code review: callers that expect an array of `{ name, delta, status }` rows will get nothing useful. `CascadePlayground` was designed to consume the text directly and show sub-contract rows from the live `subContracts` prop instead, which is the correct pattern. No fix needed; documented for clarity. | minor | open — by design; documented |
| 7 | v2-cascade | `ecosystemHomologate` in `api/phenomenon.js` is the correct function name for ecosystem-level homologation (not `homologateEcosystem`). CascadePlayground uses the correct name. Pre-existing naming inconsistency between API spec and implementation — only the JS client matters and it is correct. | minor | open — naming inconsistency; no fix needed |
| 8 | v3-edge-animations | The Priority 3 brief referenced `C.warning` and `C.success` as design tokens for cascade pulse dot colour — these tokens do not exist in `constants.js`. Correct tokens are `C.orange` (warning/cascade colour) and `C.green` (success/homologated). Fixed in implementation: used `C.orange` for cascade pulse dots and `C.green` already exists as the success token. | major | fixed — v3-edge-animations |
| 9 | v3-edge-animations | `externalFlashIds` effect in `ContractGraph` calls `flashNodes` before `flashNodes` is defined in the function body (hoisting not applicable to `const`/`useCallback`). Pre-existing ordering issue — works at runtime because React batches effects after the first full render, so `flashNodes` is already defined by the time the effect fires. No runtime error, but fragile. Documented; fixing would require reordering or extracting `flashNodes` out of the callback chain. | minor | open — pre-existing, works at runtime |
| 10 | v3-edge-animations | The existing KPMG `<animateMotion>` particles used `<mpath href>` referencing `id="ep-${c.id}"` defined in `<defs>`. The new cascade pulse dot uses `path={d}` directly on `<animateMotion>` (inline path attribute) — this is correct per SVG spec and avoids an `href` lookup. However `href` (not `xlink:href`) is the modern SVG attribute; existing code already uses `href` (correct). No bug, verified as correct approach. | info | closed — verified correct |
| 11 | v4-clause-forge | `api/phenomenon.js` has no single-clause generation endpoint (no `generateClause`, `aiGenerate`, or `/ai/generate-clause`). The nearest function is `generateContract(contract_type, master_summary, ess)` which targets `/ai/generate-contract` and returns structured JSON for a full sub-contract, not a freeform prompt → clause flow. ClauseForge uses the specified fallback pattern: logs a console.warn, emits an addLog entry, simulates a 900ms delay, and renders demo clause text. Requires a backend endpoint `/ai/generate-clause` accepting `{ contractId, prompt }` and returning `{ text }` to activate full AI generation. Tracked for backend-engineering. | major | open — requires new backend endpoint /ai/generate-clause |
| 12 | v4-clause-forge | `CenterStage.jsx` did not receive `selectedContract` from `App.jsx` — the selected contract existed only as `contracts[selectedId]` in `App.jsx` scope and was not threaded through. Fixed in v4-clause-forge by adding `selectedContract` prop to `CenterStage` and passing `contracts[selectedId] ?? null` from App.jsx. | major | fixed — v4-clause-forge |
| 13 | v4-clause-forge | `ClauseForge` prompt rebuild fires on `contract?.id` and `master?.id` changes. If `selectedId` is null (no contract selected), both are undefined — useEffect correctly stays idle and prompt is rebuilt from null context. Empty-state guard (`if (!contract)`) renders a helpful "Selecciona un contrato" message rather than a broken layout. | info | closed — by design; verified |

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
