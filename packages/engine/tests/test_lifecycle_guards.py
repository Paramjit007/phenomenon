"""
Locks in 4 bugs found by audit rounds 4-5 (2026-05-21):

  6. DELETE on a non-existent contract returned 200 (silent failure).
  7. /demo/seguros/siniestro accepted claims on TERMINATED contracts.
  8. /demo/seguros/siniestro accepted claims on non-coverage types.
  9. /demo/seguros/siniestro accepted a SECOND claim on a contract
     already in SINIESTRO_PENDIENTE (double-filing).
"""
import json
import urllib.request
import urllib.error
import pytest

BASE = "http://localhost:8000"


def _http(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(BASE + path, method=method, data=data, headers=headers)
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read() or b"null")
    except urllib.error.HTTPError as e:
        return e.code, None


def _up():
    try:
        urllib.request.urlopen(BASE + "/health", timeout=2)
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _up(), reason="Backend not reachable")


def _seed():
    _http("POST", "/demo/seguros/seed")


def _all():
    _, data = _http("GET", "/phenomena/")
    return data


# ── DELETE idempotency ───────────────────────────────────────────────
def test_delete_nonexistent_returns_404():
    code, _ = _http("DELETE", "/phenomena/totally-fake-uuid-zzzzz")
    assert code == 404


def test_double_delete_returns_404_on_second():
    _seed()
    sub = next(c for c in _all() if c.get("parentId"))
    code1, _ = _http("DELETE", f"/phenomena/{sub['id']}")
    code2, _ = _http("DELETE", f"/phenomena/{sub['id']}")
    assert code1 == 200
    assert code2 == 404, f"Second DELETE must 404; got {code2}"
    _seed()


# ── Siniestro: type precondition ─────────────────────────────────────
def test_siniestro_rejected_on_non_coverage_type():
    _seed()
    excl = next(c for c in _all() if c["type"] == "EXCLUSIONES_VIDA")
    code, _ = _http("POST", "/demo/seguros/siniestro",
                    {"contract_id": excl["id"], "resolution": ""})
    assert code == 400, f"Siniestro on EXCLUSIONES_VIDA must 400; got {code}"


def test_siniestro_rejected_on_prima_type():
    _seed()
    prima = next(c for c in _all() if c["type"] == "PRIMA_VIDA")
    code, _ = _http("POST", "/demo/seguros/siniestro",
                    {"contract_id": prima["id"], "resolution": ""})
    assert code == 400


# ── Siniestro: status precondition ──────────────────────────────────
def test_siniestro_rejected_on_terminated_contract():
    _seed()
    cv = next(c for c in _all() if c["type"] == "COBERTURA_VIDA")
    _http("POST", f"/phenomena/{cv['id']}/terminate")
    code, _ = _http("POST", "/demo/seguros/siniestro",
                    {"contract_id": cv["id"], "resolution": ""})
    assert code == 409, f"Siniestro on TERMINATED must 409; got {code}"
    _seed()


def test_double_siniestro_rejected():
    _seed()
    cv = next(c for c in _all() if c["type"] == "COBERTURA_VIDA" and c["status"] == "ACTIVE")
    code1, _ = _http("POST", "/demo/seguros/siniestro",
                     {"contract_id": cv["id"], "resolution": ""})
    code2, _ = _http("POST", "/demo/seguros/siniestro",
                     {"contract_id": cv["id"], "resolution": ""})
    assert code1 == 200
    assert code2 == 409, f"Second siniestro must 409; got {code2}"
    _seed()


# ── Resolution precondition ─────────────────────────────────────────
def test_resolution_requires_siniestro_pending():
    """Resolving (INDEMNIZACION_PAGADA / RECHAZO) on an ACTIVE contract
    that has no pending claim must be rejected."""
    _seed()
    cv = next(c for c in _all() if c["type"] == "COBERTURA_VIDA" and c["status"] == "ACTIVE")
    code, _ = _http("POST", "/demo/seguros/siniestro",
                    {"contract_id": cv["id"], "resolution": "INDEMNIZACION_PAGADA"})
    assert code == 409, f"Resolving without pending claim must 409; got {code}"


# ── Party role conflicts ────────────────────────────────────────────
def test_add_party_rejects_role_A():
    """Role 'A' is reserved for the master's partyA. Adding another role-A
    creates incoherent party identity. Audit 2026-05-21 found this silent."""
    _seed()
    m = next(c for c in _all() if not c.get("parentId"))
    code, _ = _http("POST", f"/ecosystem/{m['id']}/add-party",
                    {"name": "Duplicate A", "role": "A"})
    assert code == 400


def test_add_party_rejects_role_B():
    _seed()
    m = next(c for c in _all() if not c.get("parentId"))
    code, _ = _http("POST", f"/ecosystem/{m['id']}/add-party",
                    {"name": "Duplicate B", "role": "B"})
    assert code == 400


def test_add_party_accepts_role_C():
    """Sanity: legitimate additional party (role C) still works."""
    _seed()
    m = next(c for c in _all() if not c.get("parentId"))
    code, _ = _http("POST", f"/ecosystem/{m['id']}/add-party",
                    {"name": "Tercero Cesionario", "role": "C", "cif": "B-12345678"})
    assert code == 200
    _seed()


def test_normal_siniestro_lifecycle_still_works():
    """Sanity: ACTIVE → SINIESTRO_PENDIENTE → INDEMNIZACION_PAGADA still works."""
    _seed()
    cv = next(c for c in _all() if c["type"] == "COBERTURA_VIDA" and c["status"] == "ACTIVE")
    c1, _ = _http("POST", "/demo/seguros/siniestro",
                  {"contract_id": cv["id"], "resolution": ""})
    c2, _ = _http("POST", "/demo/seguros/siniestro",
                  {"contract_id": cv["id"], "resolution": "INDEMNIZACION_PAGADA"})
    assert c1 == 200, f"declare must succeed; got {c1}"
    assert c2 == 200, f"resolve from SINIESTRO_PENDIENTE must succeed; got {c2}"
    final = next(c for c in _all() if c["id"] == cv["id"])
    assert final["status"] == "INDEMNIZACION_PAGADA"
    _seed()
