"""
Tests for SubCascadeEngine — sub-contract → sibling propagation via IF.

These rules implement Bloque II IF inter-fenómenica between siblings sharing
overlapping operational vectors (e.g., NDA.confidentialityPeriod → DPA.dataRetention).
"""
from phenomenon_engine.cascade_engine import (
    SubCascadeEngine,
    SUB_CASCADE_MAP,
)
from .conftest import make_sub


# ── Test 11: NDA confidentialityPeriod cascades to DPA + IP ──
def test_nda_confidentiality_cascades_to_dpa_and_ip(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    engine = SubCascadeEngine()
    result = engine.run(subs["NDA"].id, "confidentialityPeriod", "5", repo)

    affected_types = {repo.get(aid).type for aid in result.affected_ids}
    assert "DPA" in affected_types, "DPA should be affected by NDA confidentialityPeriod"
    assert "IP" in affected_types, "IP should be affected by NDA confidentialityPeriod"

    for aid in result.affected_ids:
        sibling = repo.get(aid)
        assert sibling.status == "NEEDS_REVIEW"
        assert sibling.opus.homologation == "PENDING"


# ── Test 12: PAYMENT.paymentDays cascades to SLA ──
def test_payment_days_cascades_to_sla(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    engine = SubCascadeEngine()
    result = engine.run(subs["PAYMENT"].id, "paymentDays", "45", repo)

    affected_types = {repo.get(aid).type for aid in result.affected_ids}
    assert affected_types == {"SLA"}, f"Expected only SLA, got {affected_types}"


# ── Test 13: SLA.penaltyPct cascades to PAYMENT ──
def test_sla_penalty_cascades_to_payment(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    engine = SubCascadeEngine()
    result = engine.run(subs["SLA"].id, "penaltyPct", "10", repo)

    affected_types = {repo.get(aid).type for aid in result.affected_ids}
    assert affected_types == {"PAYMENT"}


# ── Test 14: DPA.dataRetention cascades back to NDA ──
def test_dpa_retention_cascades_to_nda(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    engine = SubCascadeEngine()
    result = engine.run(subs["DPA"].id, "dataRetention", "10", repo)

    affected_types = {repo.get(aid).type for aid in result.affected_ids}
    assert "NDA" in affected_types


# ── Test 15: orphan sub (no parent) returns empty result safely ──
def test_orphan_sub_does_not_crash(repo):
    """A sub-contract with no parentId should produce an empty result, not a 500."""
    orphan = make_sub(parent_id="nonexistent-parent", type="NDA")
    # Don't save it — repo.get returns None → engine returns early
    engine = SubCascadeEngine()
    # Save orphan but parent_id points to nonexistent master
    repo.save(orphan)
    result = engine.run(orphan.id, "confidentialityPeriod", "3", repo)
    # The engine should still run (orphan has parentId, just no siblings)
    # but affected_ids must be empty because there are no siblings to cascade to
    assert result.affected_ids == []


# ── Test 16: unmapped (type, field) combination returns empty result ──
def test_unmapped_sub_field_does_nothing(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    engine = SubCascadeEngine()
    result = engine.run(subs["NDA"].id, "totallyUnknownField", "x", repo)
    assert result.affected_ids == []


# ── Test 17: cascade does NOT propagate to the source itself (no infinite loop) ──
def test_cascade_does_not_loop_on_source(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    engine = SubCascadeEngine()
    result = engine.run(subs["NDA"].id, "confidentialityPeriod", "5", repo)

    # NDA itself should NOT be in affected_ids
    assert subs["NDA"].id not in result.affected_ids


# ── Test 18: insurance — EXCLUSIONES_VIDA.blockingStatus cascades to COBERTURA_VIDA ──
def test_exclusion_cascades_to_coverage(seguros_vida_ecosystem, repo):
    master, subs = seguros_vida_ecosystem
    engine = SubCascadeEngine()
    result = engine.run(subs["EXCLUSIONES_VIDA"].id, "blockingStatus", "ACTIVE", repo)

    affected_types = {repo.get(aid).type for aid in result.affected_ids}
    assert affected_types == {"COBERTURA_VIDA"}


# ── Test 19: every SUB_CASCADE_MAP target type is real / not a typo ──
def test_sub_cascade_map_target_types_are_known():
    """Sanity: every target type listed in SUB_CASCADE_MAP must also be
    a known sub-type the engine can actually handle."""
    from phenomenon_engine.cascade_engine import _ALL_SUB_TYPES

    all_targets = set()
    for source_rules in SUB_CASCADE_MAP.values():
        for target_list in source_rules.values():
            all_targets.update(target_list)

    unknown = all_targets - set(_ALL_SUB_TYPES)
    assert not unknown, (
        f"SUB_CASCADE_MAP references unknown sub-types: {unknown}. "
        f"Either typo, or _ALL_SUB_TYPES is missing entries."
    )


# ── Test 20: cascade affects only siblings of source's parent, not other masters ──
def test_cascade_isolates_to_parent_ecosystem(repo):
    """If two unrelated masters both have NDA+DPA, changing the first NDA must NOT
    cascade to the second master's DPA."""
    from .conftest import make_master

    m1 = make_master()
    m2 = make_master()
    repo.save(m1)
    repo.save(m2)

    nda1 = make_sub(parent_id=m1.id, type="NDA")
    dpa1 = make_sub(parent_id=m1.id, type="DPA")
    nda2 = make_sub(parent_id=m2.id, type="NDA")
    dpa2 = make_sub(parent_id=m2.id, type="DPA")
    for r in (nda1, dpa1, nda2, dpa2):
        repo.save(r)

    engine = SubCascadeEngine()
    result = engine.run(nda1.id, "confidentialityPeriod", "5", repo)

    assert dpa1.id in result.affected_ids, "Same-master DPA should be affected"
    assert dpa2.id not in result.affected_ids, "Other-master DPA must NOT be affected"

    updated_dpa2 = repo.get(dpa2.id)
    assert updated_dpa2.status == "ACTIVE", "Foreign DPA must remain ACTIVE"
