"""
Coverage test: every master template and every sub-contract type known to
the frontend/engine must have a required-fields entry in the backend.

Without this, homologation passes regardless of which fields the user
leaves empty — the bug class the owner reported on KPMG ("Verificar todos
passes even though Capital del Circumcontrato, Fecha Límite Finalización
Obra, Registro de la Propiedad are empty").

These tests fail-loudly the moment a new template/sub-type is added without
a matching _MASTER_REQUIRED / _SUB_REQUIRED entry.
"""
import re
import pathlib
import pytest


def _find(*candidates: pathlib.Path) -> pathlib.Path | None:
    """Return the first candidate that exists, else None."""
    for p in candidates:
        if p.exists():
            return p
    return None


# Tests can run in two environments:
#   (a) backend Docker container — mounts /workspace/backend + /workspace/packages.
#       Frontend constants.js is NOT accessible here.
#   (b) host machine — full repo visible at parents[3].
_PKG = pathlib.Path(__file__).resolve().parents[1]  # packages/engine
_REPO = _PKG.parents[1]  # phenomenon/

ROUTES = _find(
    pathlib.Path("/workspace/backend/app/api/routes_phenomena.py"),
    _REPO / "apps" / "contracts" / "backend" / "app" / "api" / "routes_phenomena.py",
)
CONSTANTS = _find(
    pathlib.Path("/workspace/frontend/src/constants.js"),  # if ever mounted
    _REPO / "apps" / "contracts" / "frontend" / "src" / "constants.js",
)


def _need(path: pathlib.Path | None, name: str) -> pathlib.Path:
    if path is None:
        pytest.skip(f"{name} not accessible in this environment")
    return path


def _ui_template_keys() -> set[str]:
    path = _need(CONSTANTS, "constants.js")
    text = path.read_text(encoding="utf-8")
    m = re.search(r"export const CONTRACT_TEMPLATES\s*=\s*\{(.+?)\n\};", text, re.S)
    assert m, "Could not find CONTRACT_TEMPLATES block in constants.js"
    return set(re.findall(r"^\s{2}([A-Z_]+):\s*\{", m.group(1), re.M))


def _master_required_keys() -> set[str]:
    path = _need(ROUTES, "routes_phenomena.py")
    text = path.read_text(encoding="utf-8")
    m = re.search(r"_MASTER_REQUIRED.*?=\s*\{(.+?)^\}", text, re.M | re.S)
    assert m, "Could not find _MASTER_REQUIRED block in routes_phenomena.py"
    return set(re.findall(r'"([A-Z_]+)":\s*\[', m.group(1)))


def _sub_required_keys() -> set[str]:
    path = _need(ROUTES, "routes_phenomena.py")
    text = path.read_text(encoding="utf-8")
    keys: set[str] = set()
    for m in re.finditer(r"_SUB_REQUIRED.*?=\s*\{(.+?)^\}", text, re.M | re.S):
        keys.update(re.findall(r'"([A-Z_]+)":\s*\[', m.group(1)))
    for m in re.finditer(r"_SUB_REQUIRED\.update\(\{(.+?)^\}\)", text, re.M | re.S):
        keys.update(re.findall(r'"([A-Z_]+)":\s*\[', m.group(1)))
    return keys


# Templates that are intentionally empty (validity = ESS + clauses only).
_MASTER_WHITELIST = {"ARRENDAMIENTO"}

# Sub-types that are stubs in SUB_META with no UI fields yet, or that are
# routed through _MASTER_REQUIRED (insurance master keys appear in
# _ALL_SUB_TYPES for cascade purposes but their required fields belong to
# their master template).
_SUB_WHITELIST = {
    "SEGURO_VIDA", "SEGURO_RC", "SEGURO_DANOS",
    "SEGURO_CREDITO_COMERCIAL", "SEGURO_CREDITO",
    "AVAL_BANCARIO", "CONTRATO_OBRA",
}


def test_every_ui_template_has_master_required_entry():
    ui = _ui_template_keys()
    backend = _master_required_keys()
    missing = (ui - backend) - _MASTER_WHITELIST
    assert not missing, (
        f"UI templates with NO _MASTER_REQUIRED entry "
        f"(homologation would pass with empty fields): {sorted(missing)}"
    )


def test_every_engine_sub_type_has_sub_required_entry():
    from phenomenon_engine.cascade_engine import _ALL_SUB_TYPES

    backend = _sub_required_keys()
    missing = (set(_ALL_SUB_TYPES) - backend) - _SUB_WHITELIST
    assert not missing, (
        f"Engine sub-types with NO _SUB_REQUIRED entry "
        f"(homologation would pass with empty fields): {sorted(missing)}"
    )


def test_kpmg_has_required_fields_for_the_owner_reported_bug():
    """Regression: the owner reported that 'Capital del Circumcontrato (€)',
    'Fecha Límite Finalización Obra', 'Registro de la Propiedad' could be
    empty and Verificar todos still passed. These fields MUST be required."""
    text = _need(ROUTES, "routes_phenomena.py").read_text(encoding="utf-8")
    kpmg_block_match = re.search(r'"KPMG":\s*\[(.+?)\]', text, re.S)
    assert kpmg_block_match, "_MASTER_REQUIRED has no 'KPMG' entry"
    kpmg_block = kpmg_block_match.group(1)
    for field in ("baseAmount", "constructionTarget", "registryOffice"):
        assert field in kpmg_block, (
            f"KPMG required-fields missing '{field}' — the owner-reported bug regressed"
        )


def test_arrendamiento_hotel_futuro_has_required_fields():
    """Sibling bug found by audit: same template family as KPMG; was also missing."""
    text = _need(ROUTES, "routes_phenomena.py").read_text(encoding="utf-8")
    assert '"ARRENDAMIENTO_HOTEL_FUTURO":' in text, (
        "_MASTER_REQUIRED has no 'ARRENDAMIENTO_HOTEL_FUTURO' entry"
    )


# ────────────────────────────────────────────────────────────────────────────
# FIELD-LEVEL coverage tests (added 2026-05-21 after 3rd "empty fields pass" report).
# Same intent as the type-level tests above but one level deeper: every (type, field)
# declared in the UI must be present in the backend required map (or in an explicit
# whitelist). Companion to `scripts/scans/scan_field_level_coverage.sh`.
# ────────────────────────────────────────────────────────────────────────────

# Whitelist: (TYPE, FIELD) pairs intentionally optional. Empty by user choice
# ("Maximal" enforcement). Populate only with a one-line comment justifying it.
_FIELD_WHITELIST: set[tuple[str, str]] = set()


def _ui_sub_fields() -> dict[str, set[str]]:
    """Map SUB_TYPE -> set of field keys declared in SUB_FIELDS in constants.js."""
    path = _need(CONSTANTS, "constants.js")
    text = path.read_text(encoding="utf-8")
    m = re.search(r"export const SUB_FIELDS\s*=\s*\{(.+?)\n\};", text, re.S)
    assert m, "Could not find SUB_FIELDS block in constants.js"
    body = m.group(1)
    result: dict[str, set[str]] = {}
    current = None
    for line in body.splitlines():
        type_m = re.match(r"^  ([A-Z_]+):", line)
        if type_m:
            current = type_m.group(1)
            result.setdefault(current, set())
            continue
        if current:
            key_m = re.search(r'key:\s*"([a-zA-Z_]+)"', line)
            if key_m:
                result[current].add(key_m.group(1))
    return result


def _ui_master_fields() -> dict[str, set[str]]:
    """Map TEMPLATE -> set of field keys declared in contractFields under that template."""
    path = _need(CONSTANTS, "constants.js")
    text = path.read_text(encoding="utf-8")
    m = re.search(r"export const CONTRACT_TEMPLATES\s*=\s*\{(.+?)\n\};", text, re.S)
    assert m, "Could not find CONTRACT_TEMPLATES block in constants.js"
    body = m.group(1)
    result: dict[str, set[str]] = {}
    current = None
    in_cf = False
    for line in body.splitlines():
        type_m = re.match(r"^  ([A-Z_]+):\s*\{", line)
        if type_m:
            current = type_m.group(1)
            result.setdefault(current, set())
            in_cf = False
            continue
        if "contractFields:" in line and "[" in line:
            in_cf = True
            continue
        if in_cf and re.match(r"^\s*\],", line):
            in_cf = False
            continue
        if current and in_cf:
            key_m = re.search(r'key:\s*"([a-zA-Z_]+)"', line)
            if key_m:
                result[current].add(key_m.group(1))
    return result


def _backend_sub_field_keys() -> dict[str, set[str]]:
    """Map SUB_TYPE -> set of field keys in _SUB_REQUIRED (initial dict + .update)."""
    path = _need(ROUTES, "routes_phenomena.py")
    text = path.read_text(encoding="utf-8")
    result: dict[str, set[str]] = {}
    for m in re.finditer(r"_SUB_REQUIRED.*?=\s*\{(.+?)^\}", text, re.M | re.S):
        for entry in re.finditer(r'"([A-Z_]+)":\s*\[(.+?)\]', m.group(1), re.S):
            keys = set(re.findall(r'\(\s*"([a-zA-Z_]+)"', entry.group(2)))
            result.setdefault(entry.group(1), set()).update(keys)
    for m in re.finditer(r"_SUB_REQUIRED\.update\(\{(.+?)^\}\)", text, re.M | re.S):
        for entry in re.finditer(r'"([A-Z_]+)":\s*\[(.+?)\]', m.group(1), re.S):
            keys = set(re.findall(r'\(\s*"([a-zA-Z_]+)"', entry.group(2)))
            result.setdefault(entry.group(1), set()).update(keys)
    return result


def _backend_master_field_keys() -> dict[str, set[str]]:
    """Map TEMPLATE -> set of field keys in _MASTER_REQUIRED."""
    path = _need(ROUTES, "routes_phenomena.py")
    text = path.read_text(encoding="utf-8")
    m = re.search(r"_MASTER_REQUIRED.*?=\s*\{(.+?)^\}", text, re.M | re.S)
    assert m, "Could not find _MASTER_REQUIRED block"
    result: dict[str, set[str]] = {}
    for entry in re.finditer(r'"([A-Z_]+)":\s*\[(.+?)\]', m.group(1), re.S):
        keys = set(re.findall(r'\(\s*"([a-zA-Z_]+)"', entry.group(2)))
        result[entry.group(1)] = keys
    return result


def test_every_ui_sub_field_is_required_or_whitelisted():
    """For every sub-type known to the UI, every field key it declares must be
    in the backend's `_SUB_REQUIRED` for that type (or whitelisted). Otherwise
    a user can leave the field blank and Verificar todos still passes."""
    ui = _ui_sub_fields()
    backend = _backend_sub_field_keys()
    missing: list[tuple[str, str]] = []
    for typ, keys in ui.items():
        be_keys = backend.get(typ, set())
        for k in sorted(keys - be_keys):
            if (typ, k) in _FIELD_WHITELIST:
                continue
            missing.append((typ, k))
    assert not missing, (
        f"{len(missing)} UI sub-field(s) not enforced by _SUB_REQUIRED:\n  "
        + "\n  ".join(f"{t}.{k}" for t, k in missing[:30])
        + ("\n  ... (truncated)" if len(missing) > 30 else "")
    )


def test_every_ui_master_field_is_required_or_whitelisted():
    """For every master template's `contractFields`, every key must be in
    `_MASTER_REQUIRED` (or whitelisted)."""
    ui = _ui_master_fields()
    backend = _backend_master_field_keys()
    missing: list[tuple[str, str]] = []
    for tmpl, keys in ui.items():
        be_keys = backend.get(tmpl, set())
        for k in sorted(keys - be_keys):
            if (tmpl, k) in _FIELD_WHITELIST:
                continue
            missing.append((tmpl, k))
    assert not missing, (
        f"{len(missing)} UI master field(s) not enforced by _MASTER_REQUIRED:\n  "
        + "\n  ".join(f"{t}.{k}" for t, k in missing[:30])
        + ("\n  ... (truncated)" if len(missing) > 30 else "")
    )
