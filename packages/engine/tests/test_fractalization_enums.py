"""
PHENOMENON III — Fractalization enum and model field tests.

Covers:
  - Every CoverageType member round-trips through PhenomenonRecord
  - Every FerenciaType member round-trips through PhenomenonRecord
  - Every ReclamacionType member round-trips through PhenomenonRecord
  - fractal_index format validation (valid + invalid)
  - Optional[str] intentional gap: arbitrary strings are accepted for *_type fields
    (validation is at the application route boundary, not the model layer)
  - None defaults leave all existing records unaffected
"""
import pytest
import pydantic

from phenomenon_engine.enums import CoverageType, FerenciaType, ReclamacionType
from phenomenon_engine.models import PhenomenonRecord
from .conftest import make_master


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def base_record():
    return make_master()


# ── CoverageType round-trips ──────────────────────────────────────────────────

@pytest.mark.parametrize("ct", list(CoverageType))
def test_coverage_type_roundtrip(ct, base_record):
    # model_validate used for future-validator safety; model_copy bypasses validators in Pydantic v2
    r = PhenomenonRecord.model_validate({**base_record.model_dump(), "coverage_type": ct.value})
    assert r.coverage_type == ct.value


def test_coverage_type_values_are_p1_prefixed():
    for member in CoverageType:
        assert member.value.startswith("P1."), f"{member.name} value should start with 'P1.'"


def test_coverage_type_has_five_members():
    assert len(CoverageType) == 5


# ── FerenciaType round-trips ──────────────────────────────────────────────────

@pytest.mark.parametrize("ft", list(FerenciaType))
def test_ferencia_type_roundtrip(ft, base_record):
    # model_validate used for future-validator safety; model_copy bypasses validators in Pydantic v2
    r = PhenomenonRecord.model_validate({**base_record.model_dump(), "ferencia_type": ft.value})
    assert r.ferencia_type == ft.value


def test_ferencia_type_values_are_p2_prefixed():
    for member in FerenciaType:
        assert member.value.startswith("P2."), f"{member.name} value should start with 'P2.'"


def test_ferencia_type_has_five_members():
    assert len(FerenciaType) == 5


# ── ReclamacionType round-trips ───────────────────────────────────────────────

@pytest.mark.parametrize("rt", list(ReclamacionType))
def test_reclamacion_type_roundtrip(rt, base_record):
    # model_validate used for future-validator safety; model_copy bypasses validators in Pydantic v2
    r = PhenomenonRecord.model_validate({**base_record.model_dump(), "reclamacion_type": rt.value})
    assert r.reclamacion_type == rt.value


def test_reclamacion_type_values_are_p3_prefixed():
    for member in ReclamacionType:
        assert member.value.startswith("P3."), f"{member.name} value should start with 'P3.'"


def test_reclamacion_type_has_five_members():
    assert len(ReclamacionType) == 5


# ── fractal_index validation ──────────────────────────────────────────────────

@pytest.mark.parametrize("valid_index", ["1.1", "1.5", "2.3", "3.1", "10.2"])
def test_fractal_index_valid_formats(valid_index, base_record):
    # Use model_validate so the field_validator fires (model_copy bypasses validators in Pydantic v2)
    r = PhenomenonRecord.model_validate({**base_record.model_dump(), "fractal_index": valid_index})
    assert r.fractal_index == valid_index


def test_fractal_index_none_is_valid(base_record):
    r = PhenomenonRecord.model_validate({**base_record.model_dump(), "fractal_index": None})
    assert r.fractal_index is None


@pytest.mark.parametrize("bad_index", ["abc", "1", ".2", "1.", "1-2", "P1.2", "1.2.3", ""])
def test_fractal_index_rejects_invalid_formats(bad_index, base_record):
    # model_validate is required here — model_copy skips validators in Pydantic v2
    with pytest.raises(pydantic.ValidationError):
        PhenomenonRecord.model_validate({**base_record.model_dump(), "fractal_index": bad_index})


# ── Optional[str] gap — intentional, documented ───────────────────────────────
# coverage_type / ferencia_type / reclamacion_type are Optional[str], not strict
# enum fields. This allows persisted JSON string values to be loaded without
# validation errors. Authoritative validation lives at the route layer.

def test_coverage_type_accepts_unknown_string(base_record):
    # Documents intentional behaviour: Optional[str] accepts any string value.
    # Validation is at the route layer, not the model layer.
    # If this field is ever tightened to Optional[CoverageType], remove this test.
    r = PhenomenonRecord.model_validate({**base_record.model_dump(), "coverage_type": "NOT_A_REAL_VALUE"})
    assert r.coverage_type == "NOT_A_REAL_VALUE"


def test_ferencia_type_accepts_unknown_string(base_record):
    r = PhenomenonRecord.model_validate({**base_record.model_dump(), "ferencia_type": "GARBAGE"})
    assert r.ferencia_type == "GARBAGE"


def test_reclamacion_type_accepts_unknown_string(base_record):
    r = PhenomenonRecord.model_validate({**base_record.model_dump(), "reclamacion_type": "GARBAGE"})
    assert r.reclamacion_type == "GARBAGE"


# ── None defaults — existing records unaffected ───────────────────────────────

def test_new_fields_default_to_none(base_record):
    assert base_record.coverage_type is None
    assert base_record.ferencia_type is None
    assert base_record.reclamacion_type is None
    assert base_record.fractal_index is None


def test_existing_record_construction_unchanged():
    """make_master() with no fractalization args must still work exactly as before."""
    r = make_master(template_key="CSM", status="DRAFT")
    assert r.coverage_type is None
    assert r.fractal_index is None
    assert r.type == "CSM"
