"""
Tests for CascadeEngine — master ESS → sub propagation.

These tests catch the exact class of bug that caused production failures:
  "CASCADE_MAP missing KPMG types" — fixed by adding _ALL_SUB_TYPES.
If any sub-type is missing from _ALL_SUB_TYPES, several of these tests fail.
"""
from phenomenon_engine.cascade_engine import (
    CascadeEngine,
    CASCADE_MAP,
    _ALL_SUB_TYPES,
)


# ── Test 1: every cascade-eligible ESS field is mapped to all sub-types ──
def test_cascade_map_covers_all_ess_fields():
    """All five ESS fields that should cascade are present in CASCADE_MAP."""
    expected_fields = {"jurisdiction", "effectiveDate", "expiryDate",
                       "partyA", "partyB", "governingLaw"}
    assert expected_fields.issubset(set(CASCADE_MAP.keys())), (
        f"Missing cascade fields: {expected_fields - set(CASCADE_MAP.keys())}"
    )


# ── Test 2: every sub-type is included in the cascade map ──
def test_cascade_map_includes_kpmg_sub_types():
    """Regression test: FINANCIACION, HIPOTECA_GARANTIA, CESION_CREDITO
    must all be cascade targets (the original bug)."""
    for sub_type in ("FINANCIACION", "HIPOTECA_GARANTIA", "CESION_CREDITO"):
        for field in ("jurisdiction", "effectiveDate", "expiryDate", "partyA"):
            assert sub_type in CASCADE_MAP[field], (
                f"{sub_type} not in CASCADE_MAP[{field}]"
            )


# ── Test 3: every insurance sub-type is cascade-eligible ──
def test_cascade_map_includes_insurance_sub_types():
    insurance_subs = (
        "COBERTURA_VIDA", "EXCLUSIONES_VIDA", "PRIMA_VIDA",
        "COBERTURA_RC", "LIMITES_RC", "FRANQUICIA_RC",
        "COBERTURA_DANOS", "PERITACION", "EXCLUSIONES_DANOS",
        "COBERTURA_CREDITO", "VALIDACION_FINANCIERA", "RIESGO_EMPRESARIAL",
    )
    for sub_type in insurance_subs:
        assert sub_type in CASCADE_MAP["partyA"], (
            f"Insurance sub-type {sub_type} missing from CASCADE_MAP"
        )


# ── Test 4: jurisdiction change cascades to all CSM children ──
def test_jurisdiction_cascade_flags_all_subs(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    engine = CascadeEngine()
    result = engine.run(master.id, "jurisdiction", "Barcelona", repo)

    assert len(result.affected_ids) == 5, "Expected 5 subs (NDA, SLA, PAYMENT, DPA, IP) to be affected"
    for sub in subs.values():
        updated = repo.get(sub.id)
        assert updated.status == "NEEDS_REVIEW", f"{sub.type} should be NEEDS_REVIEW after jurisdiction cascade"
        assert updated.ess.jurisdiction == "Barcelona", f"{sub.type}.jurisdiction should be Barcelona"


# ── Test 5: expiryDate change updates every sub's ESS ──
def test_expiry_date_cascade_updates_ess(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    engine = CascadeEngine()
    new_date = "2030-12-31"
    engine.run(master.id, "expiryDate", new_date, repo)

    for sub in subs.values():
        updated = repo.get(sub.id)
        assert updated.ess.expiryDate == new_date, f"{sub.type}.expiryDate not updated"


# ── Test 6: partyA cascade reaches KPMG sub-types ──
def test_kpmg_party_cascade(kpmg_ecosystem, repo):
    """Regression: this is the bug we shipped — KPMG subs didn't receive partyA changes."""
    master, subs = kpmg_ecosystem
    engine = CascadeEngine()
    result = engine.run(master.id, "partyA", "Nuevo Promotor S.A.", repo)

    assert len(result.affected_ids) == 3
    for sub in subs.values():
        updated = repo.get(sub.id)
        assert updated.ess.partyA == "Nuevo Promotor S.A."
        assert updated.status == "NEEDS_REVIEW"


# ── Test 7: master itself transitions to MODIFIED after cascade ──
def test_master_status_modified_after_cascade(master_with_all_subs, repo):
    master, _ = master_with_all_subs
    engine = CascadeEngine()
    engine.run(master.id, "jurisdiction", "Valencia", repo)

    updated_master = repo.get(master.id)
    assert updated_master.status == "MODIFIED"
    assert updated_master.ess.jurisdiction == "Valencia"


# ── Test 8: cascade on a NON-mapped field does NOT affect children ──
def test_non_cascade_field_does_not_propagate(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    engine = CascadeEngine()
    # "templateKey" is not in CASCADE_MAP — it's an AG term, not an ESS field
    # We craft a phony field name to assert isolation
    result = engine.run(master.id, "notACascadeField", "x", repo)

    assert result.affected_ids == [], "No subs should be affected by unmapped field"
    for sub in subs.values():
        updated = repo.get(sub.id)
        assert updated.status == "ACTIVE", f"{sub.type} should remain ACTIVE"


# ── Test 9: every sub flagged transitions opus.homologation to PENDING ──
def test_cascade_resets_homologation_to_pending(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    # Pre-set all subs to VALID
    for s in subs.values():
        repo.save(s.model_copy(update={"opus": s.opus.model_copy(update={"homologation": "VALID"})}))

    engine = CascadeEngine()
    engine.run(master.id, "effectiveDate", "2026-06-01", repo)

    for sub in subs.values():
        updated = repo.get(sub.id)
        assert updated.opus.homologation == "PENDING", (
            f"{sub.type}.opus.homologation should reset to PENDING after cascade"
        )


# ── Test 10: cascade result trace contains one entry per affected sub ──
def test_cascade_trace_completeness(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    engine = CascadeEngine()
    result = engine.run(master.id, "jurisdiction", "Sevilla", repo)

    assert len(result.trace) == len(result.affected_ids)
    affected_types = {t["vector"].split("→")[1] for t in result.trace}
    assert affected_types == {"NDA", "SLA", "PAYMENT", "DPA", "IP"}
    assert result.old_value == "Madrid"
    assert result.new_value == "Sevilla"
