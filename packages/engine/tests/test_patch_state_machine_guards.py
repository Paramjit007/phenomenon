"""
Locks in three bugs found by the 2026-05-21 exhaustive audit:

  1. BLOCKED status was silently bypassable via raw PATCH (status=ACTIVE).
     The COBERTURA_CREDITO contract in the Seguros demo is intentionally
     BLOCKED until the IF_exclusion is resolved; PATCH must reject the
     direct transition.
  2. ESS.effectiveDate accepted any string. Must reject non-ISO dates.
  3. ESS.partyA accepted <script> tokens. Must reject.

These tests hit the real running backend via HTTP so they cover the
full request → Pydantic → SQLAlchemy → response loop.
"""
import json
import urllib.request
import urllib.error
import pytest


BASE = "http://localhost:8000"


def _http(method: str, path: str, body=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(BASE + path, method=method, data=data, headers=headers)
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read() or b"null")
    except urllib.error.HTTPError as e:
        return e.code, (json.loads(e.read() or b"null") if e.headers.get("content-type", "").startswith("application/json") else None)


def _backend_up() -> bool:
    try:
        urllib.request.urlopen(BASE + "/health", timeout=2)
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    not _backend_up(),
    reason="Backend not reachable at localhost:8000 (these tests run inside the backend container)",
)


def _seed_seguros():
    _http("POST", "/demo/seguros/seed")


def _all():
    _, data = _http("GET", "/phenomena/")
    return data


def _any_master():
    return next(c for c in _all() if not c.get("parentId"))


def _create_blocked() -> dict:
    """Seed → pick COBERTURA_CREDITO → PATCH status to BLOCKED (ACTIVE→BLOCKED
    is allowed; this sets up the precondition for the forbidden-from-BLOCKED tests).

    Updated 2026-05-21: prior seed had this contract BLOCKED by default. The
    seed now starts all-VALID; tests construct the BLOCKED state explicitly.
    """
    _seed_seguros()
    cc = next(c for c in _all() if c["type"] == "COBERTURA_CREDITO")
    code, _ = _http("PATCH", f"/phenomena/{cc['id']}", {"status": "BLOCKED"})
    assert code == 200, f"ACTIVE→BLOCKED setup must succeed; got {code}"
    return next(c for c in _all() if c["id"] == cc["id"])


# ── 1. BLOCKED → ACTIVE via PATCH must be rejected ─────────────────────
def test_blocked_to_active_via_patch_is_rejected():
    b = _create_blocked()
    code, _ = _http("PATCH", f"/phenomena/{b['id']}", {"status": "ACTIVE"})
    assert code == 409, (
        f"BLOCKED→ACTIVE direct PATCH must return 409; got {code}. "
        "Without this guard, IF_exclusion can be bypassed silently."
    )
    _seed_seguros()  # restore clean state


def test_blocked_to_terminated_via_patch_is_allowed():
    """Sanity: not all transitions from BLOCKED are forbidden — TERMINATED is allowed."""
    b = _create_blocked()
    code, _ = _http("PATCH", f"/phenomena/{b['id']}", {"status": "TERMINATED"})
    assert code == 200, f"BLOCKED→TERMINATED should be allowed; got {code}"
    _seed_seguros()  # restore


# ── 2. ESS.effectiveDate must be ISO date ──────────────────────────────
def test_patch_rejects_non_iso_date_in_effective_date():
    _seed_seguros()
    m = _any_master()
    code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"effectiveDate": "not-a-date-at-all"}})
    assert code == 400, f"PATCH with garbage date must 400; got {code}"


def test_patch_accepts_valid_iso_date():
    _seed_seguros()
    m = _any_master()
    code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"effectiveDate": "2026-09-01"}})
    assert code == 200


def test_patch_accepts_empty_string_date_for_clearing():
    """Clearing a date by setting it to '' must remain allowed (otherwise the
    UI cannot blank a field for the user to refill)."""
    _seed_seguros()
    m = _any_master()
    code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"effectiveDate": ""}})
    assert code == 200


# ── 3. ESS must reject <script> tokens ─────────────────────────────────
def test_patch_rejects_script_tag_in_party_a():
    _seed_seguros()
    m = _any_master()
    code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"partyA": "<script>alert(1)</script>"}})
    assert code == 400, f"<script> token must be rejected; got {code}"


def test_patch_rejects_script_tag_case_insensitive():
    _seed_seguros()
    m = _any_master()
    code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"partyB": "evil <SCRIPT >stuff</SCRIPT>"}})
    assert code == 400


def test_patch_accepts_normal_party_name_with_punctuation():
    """Spanish legal names contain accents, ampersands, dashes — must pass."""
    _seed_seguros()
    m = _any_master()
    code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"partyA": "Müller & López S.A. — Asesoría jurídica"}})
    assert code == 200


# ── Real-date validation (not just shape) ──────────────────────────────
# Audit 2026-05-21 round 7 found 2023-02-29, 2026-13-01, 2026-02-30 all
# stored when the sanitizer only checked the YYYY-MM-DD shape.

def test_patch_rejects_feb_29_in_non_leap_year():
    _seed_seguros()
    m = _any_master()
    code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"effectiveDate": "2023-02-29"}})
    assert code == 400, f"Feb 29 in non-leap year must be rejected; got {code}"


def test_patch_accepts_feb_29_in_leap_year():
    _seed_seguros()
    m = _any_master()
    code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"effectiveDate": "2024-02-29"}})
    assert code == 200


def test_patch_rejects_month_13():
    _seed_seguros()
    m = _any_master()
    code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"effectiveDate": "2026-13-01"}})
    assert code == 400


def test_patch_rejects_day_30_of_february():
    _seed_seguros()
    m = _any_master()
    code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"effectiveDate": "2026-02-30"}})
    assert code == 400


def test_patch_rejects_day_00():
    _seed_seguros()
    m = _any_master()
    code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"effectiveDate": "2026-01-00"}})
    assert code == 400


def test_patch_accepts_valid_extreme_dates():
    """Far-future and distant-past valid dates should still pass."""
    _seed_seguros()
    m = _any_master()
    for d in ("1900-01-01", "9999-12-31"):
        code, _ = _http("PATCH", f"/phenomena/{m['id']}", {"ess": {"effectiveDate": d}})
        assert code == 200, f"valid extreme date {d} rejected with {code}"
