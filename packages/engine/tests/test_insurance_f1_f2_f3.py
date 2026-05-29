"""
PHENOMENON III — F1/F2/F3 Insurance Chain Tests

Tests for open_f2_on_siniestro() and open_f3_on_culpable() in cascade_engine.py.

Covers:
  - F2 opens from a valid F1 phenomenon (happy path)
  - F2 carries correct negaciones (NOT-solventio, NOT-debt, NOT-auto-subrogation)
  - F2 carries correct legal_basis (Art. 1089 CC)
  - F2 guard: f1_id must exist
  - F2 guard: source must be phase F1 (or None — legacy records allowed)
  - F2 guard: F1 must be ACTIVE status
  - F3 opens from a valid F2 phenomenon (happy path)
  - F3 carries correct legal_basis (Art. 1902 CC)
  - F3 guard: f2_id must exist
  - F3 guard: source must be phase F2
  - F3 guard: culpable_party must not be empty
  - End-to-end: F1 → F2 → F3 chain
"""
import pytest

from phenomenon_engine.cascade_engine import (
    open_f2_on_siniestro,
    open_f3_on_culpable,
    F2OpenResult,
    F3OpenResult,
)
from phenomenon_engine.enums import InsuranceNegacion
from .conftest import InMemoryRepository, make_master, make_sub


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_f1(repo, type="SEGURO_VIDA_F1", status="ACTIVE"):
    """Create a valid F1 phenomenon and save it to repo."""
    f1 = make_master(template_key=type, status=status)
    # Patch in F1 phase and ferencia_sensual using model_copy
    f1 = f1.model_copy(update={
        "type": type,
        "phenomenological_phase": "F1",
        "ferencia_sensual": "life of test insured",
        "sec_types": ["DE", "DS", "OBC"],
        "legal_basis": None,
        "negaciones": [],
    })
    repo.save(f1)
    return f1


# ── F2 happy path ─────────────────────────────────────────────────────────────

def test_f2_opens_from_valid_f1(repo):
    f1 = make_f1(repo)
    result = open_f2_on_siniestro(f1.id, "Building fire destroyed insured property", 150_000.0, repo)

    assert isinstance(result, F2OpenResult)
    assert result.f1_id == f1.id
    assert result.f2_type == "SEGURO_VIDA_F2"
    assert result.cst_cause == "Building fire destroyed insured property"
    assert result.estimated_damage == 150_000.0


def test_f2_stored_in_repo(repo):
    f1 = make_f1(repo)
    result = open_f2_on_siniestro(f1.id, "Theft event", 50_000.0, repo)

    f2 = repo.get(result.f2_id)
    assert f2 is not None
    assert f2.phenomenological_phase == "F2"
    assert f2.cst_trigger_id == f1.id
    assert f2.parentId == f1.id


def test_f2_carries_correct_negaciones(repo):
    f1 = make_f1(repo)
    result = open_f2_on_siniestro(f1.id, "Water damage", 20_000.0, repo)

    assert InsuranceNegacion.NOT_SOLVENTIO.value in result.negaciones
    assert InsuranceNegacion.NOT_DEBT_PAYMENT.value in result.negaciones
    assert InsuranceNegacion.NOT_AUTO_SUBROGATION.value in result.negaciones


def test_f2_carries_art_1089_legal_basis(repo):
    f1 = make_f1(repo)
    result = open_f2_on_siniestro(f1.id, "Storm damage", 75_000.0, repo)

    f2 = repo.get(result.f2_id)
    assert "1089" in f2.legal_basis


def test_f2_inherits_ferencia_sensual_from_f1(repo):
    f1 = make_f1(repo)
    result = open_f2_on_siniestro(f1.id, "Loss event", 0.0, repo)

    f2 = repo.get(result.f2_id)
    assert f2.ferencia_sensual == "life of test insured"


def test_f2_type_derivation_from_f1_type(repo):
    """F1 type SEGURO_RC_F1 → F2 type SEGURO_RC_F2."""
    f1 = make_f1(repo, type="SEGURO_RC_F1")
    result = open_f2_on_siniestro(f1.id, "RC claim", 30_000.0, repo)
    assert result.f2_type == "SEGURO_RC_F2"


# ── F2 guards ─────────────────────────────────────────────────────────────────

def test_f2_guard_f1_must_exist(repo):
    with pytest.raises(ValueError, match="not found"):
        open_f2_on_siniestro("nonexistent-f1-id", "cause", 0.0, repo)


def test_f2_guard_source_must_not_be_f2(repo):
    """Cannot open F2 from a phenomenon that is already F2."""
    f1 = make_f1(repo)
    result = open_f2_on_siniestro(f1.id, "initial claim", 1000.0, repo)
    f2 = repo.get(result.f2_id)

    with pytest.raises(ValueError, match="not F1"):
        open_f2_on_siniestro(f2.id, "cannot open from F2", 0.0, repo)


def test_f2_guard_f1_must_be_active(repo):
    f1 = make_f1(repo, status="TERMINATED")
    with pytest.raises(ValueError, match="coverage must be active"):
        open_f2_on_siniestro(f1.id, "too late", 0.0, repo)


# ── F3 happy path ─────────────────────────────────────────────────────────────

def test_f3_opens_from_valid_f2(repo):
    f1 = make_f1(repo)
    f2_res = open_f2_on_siniestro(f1.id, "Loss event", 100_000.0, repo)
    result = open_f3_on_culpable(f2_res.f2_id, "Empresa Culpable S.L.", repo)

    assert isinstance(result, F3OpenResult)
    assert result.f2_id == f2_res.f2_id
    assert result.f3_type == "SEGURO_VIDA_F3"
    assert result.culpable_party == "Empresa Culpable S.L."


def test_f3_stored_in_repo(repo):
    f1 = make_f1(repo)
    f2_res = open_f2_on_siniestro(f1.id, "Loss", 50_000.0, repo)
    f3_res = open_f3_on_culpable(f2_res.f2_id, "Empresa X S.A.", repo)

    f3 = repo.get(f3_res.f3_id)
    assert f3 is not None
    assert f3.phenomenological_phase == "F3"
    assert f3.culpable_trigger_id == f2_res.f2_id
    assert f3.parentId == f2_res.f2_id


def test_f3_carries_art_1902_legal_basis(repo):
    f1 = make_f1(repo)
    f2_res = open_f2_on_siniestro(f1.id, "Loss", 0.0, repo)
    result = open_f3_on_culpable(f2_res.f2_id, "Culpable Party", repo)

    assert "1902" in result.legal_basis


def test_f3_is_independent_of_f1(repo):
    """F3's parentId must be F2, never F1 — F3 is independent."""
    f1 = make_f1(repo)
    f2_res = open_f2_on_siniestro(f1.id, "Loss", 0.0, repo)
    f3_res = open_f3_on_culpable(f2_res.f2_id, "Culpable", repo)

    f3 = repo.get(f3_res.f3_id)
    assert f3.parentId == f2_res.f2_id
    assert f3.parentId != f1.id


# ── F3 guards ─────────────────────────────────────────────────────────────────

def test_f3_guard_f2_must_exist(repo):
    with pytest.raises(ValueError, match="not found"):
        open_f3_on_culpable("nonexistent-f2-id", "Culpable", repo)


def test_f3_guard_source_must_be_f2(repo):
    """Cannot open F3 directly from F1."""
    f1 = make_f1(repo)
    with pytest.raises(ValueError, match="not F2"):
        open_f3_on_culpable(f1.id, "Culpable", repo)


def test_f3_guard_culpable_party_required(repo):
    f1 = make_f1(repo)
    f2_res = open_f2_on_siniestro(f1.id, "Loss", 0.0, repo)

    with pytest.raises(ValueError, match="culpable_party is required"):
        open_f3_on_culpable(f2_res.f2_id, "", repo)

    with pytest.raises(ValueError, match="culpable_party is required"):
        open_f3_on_culpable(f2_res.f2_id, "   ", repo)


# ── End-to-end chain ──────────────────────────────────────────────────────────

def test_full_f1_f2_f3_chain(repo):
    """Full chain: F1 (coverage) → F2 (claim on CST) → F3 (recovery from culpable)."""
    f1 = make_f1(repo, type="SEGURO_DANOS_F1")

    f2_res = open_f2_on_siniestro(f1.id, "Factory fire — total loss", 500_000.0, repo)
    assert f2_res.f2_type == "SEGURO_DANOS_F2"

    f3_res = open_f3_on_culpable(f2_res.f2_id, "Contractor Negligente S.L.", repo)
    assert f3_res.f3_type == "SEGURO_DANOS_F3"

    # Verify chain linkage
    f1_rec = repo.get(f1.id)
    f2_rec = repo.get(f2_res.f2_id)
    f3_rec = repo.get(f3_res.f3_id)

    assert f1_rec.phenomenological_phase == "F1"
    assert f2_rec.phenomenological_phase == "F2"
    assert f3_rec.phenomenological_phase == "F3"
    assert f2_rec.cst_trigger_id == f1.id
    assert f3_rec.culpable_trigger_id == f2_res.f2_id

    # Negaciones present in F2, absent in F3
    assert len(f2_rec.negaciones) == 3
    assert len(f3_rec.negaciones) == 0
