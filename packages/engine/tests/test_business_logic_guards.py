"""
Locks in two more bugs found by audit round 3 (2026-05-21):

  4. effectiveDate AFTER expiryDate silently passed homologation.
  5. Negative numbers in monetary / percentage / duration fields
     silently passed homologation (e.g., premium of -1000 EUR).

Both are class-of-bug fixes: not specific to KPMG or Seguros, applied to
every contract type at the homologation layer.
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
        body_text = e.read().decode("utf-8", errors="replace") if e.fp else ""
        try:
            parsed = json.loads(body_text)
        except Exception:
            parsed = body_text
        return e.code, parsed


def _backend_up():
    try:
        urllib.request.urlopen(BASE + "/health", timeout=2)
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    not _backend_up(),
    reason="Backend not reachable",
)


def _seed():
    _http("POST", "/demo/seguros/seed")


def _any_master():
    _, data = _http("GET", "/phenomena/")
    return next(c for c in data if not c.get("parentId"))


def _danos_master():
    _, data = _http("GET", "/phenomena/")
    return next(c for c in data if c["ag"]["terms"].get("templateKey") == "SEGURO_DANOS")


# ── Date ordering ─────────────────────────────────────────────────────
def test_effective_after_expiry_flags_homologation():
    _seed()
    m = _any_master()
    _http("PATCH", f"/phenomena/{m['id']}", {
        "ess": {"effectiveDate": "2027-12-01", "expiryDate": "2025-01-01"}
    })
    _, r = _http("POST", f"/phenomena/{m['id']}/homologate")
    assert r["valid"] is False, "Contract with effectiveDate > expiryDate must NOT be VALID"
    assert any("posterior" in e or "incoherente" in e for e in r.get("errors", [])), (
        f"Error message must mention date ordering; got {r.get('errors')}"
    )
    _seed()


def test_same_day_effective_and_expiry_is_allowed():
    """Edge case: a one-day contract is legal."""
    _seed()
    m = _any_master()
    _http("PATCH", f"/phenomena/{m['id']}", {
        "ess": {"effectiveDate": "2026-09-01", "expiryDate": "2026-09-01"}
    })
    _, r = _http("POST", f"/phenomena/{m['id']}/homologate")
    date_errs = [e for e in r.get("errors", []) if "posterior" in e]
    assert not date_errs, f"Same-day effective/expiry should not be flagged as ordering issue; got {date_errs}"


# ── Negative numbers ──────────────────────────────────────────────────
def test_negative_property_value_rejected():
    _seed()
    m = _danos_master()
    _http("PATCH", f"/phenomena/{m['id']}", {
        "ag": {"terms": {**m["ag"]["terms"], "propertyValue": "-50000"},
               "clauses": m["ag"].get("clauses", [])}
    })
    _, r = _http("POST", f"/phenomena/{m['id']}/homologate")
    assert r["valid"] is False, "Negative propertyValue must produce INVALID"
    neg = [e for e in r.get("errors", []) if "negativo" in e and "propertyValue" in e]
    assert neg, f"Expected error mentioning negative propertyValue; got {r.get('errors')}"
    _seed()


def test_negative_prima_anual_rejected():
    _seed()
    m = _danos_master()
    _http("PATCH", f"/phenomena/{m['id']}", {
        "ag": {"terms": {**m["ag"]["terms"], "primaAnual": "-1000"},
               "clauses": m["ag"].get("clauses", [])}
    })
    _, r = _http("POST", f"/phenomena/{m['id']}/homologate")
    neg = [e for e in r.get("errors", []) if "negativo" in e and "primaAnual" in e]
    assert neg, f"Expected error mentioning negative primaAnual; got {r.get('errors')}"
    _seed()


def test_zero_is_allowed():
    """0 is a legitimate value for some fields (e.g., no deductible)."""
    _seed()
    m = _danos_master()
    _http("PATCH", f"/phenomena/{m['id']}", {
        "ag": {"terms": {**m["ag"]["terms"], "deductible": "0"},
               "clauses": m["ag"].get("clauses", [])}
    })
    _, r = _http("POST", f"/phenomena/{m['id']}/homologate")
    neg = [e for e in r.get("errors", []) if "negativo" in e]
    assert not neg, f"0 must not trigger negative check; got {neg}"
    _seed()


def test_positive_values_pass():
    _seed()
    m = _danos_master()
    _http("PATCH", f"/phenomena/{m['id']}", {
        "ag": {"terms": {**m["ag"]["terms"], "propertyValue": "750000", "primaAnual": "3150"},
               "clauses": m["ag"].get("clauses", [])}
    })
    _, r = _http("POST", f"/phenomena/{m['id']}/homologate")
    neg = [e for e in r.get("errors", []) if "negativo" in e]
    assert not neg, f"Positive values should pass; got {neg}"
