"""
Tests for ReverseCascadeEngine (sub → master) and EcosystemEngine (cross-contract
consistency, coverage gaps, and health score).
"""
import pytest

from phenomenon_engine.cascade_engine import (
    ReverseCascadeEngine,
    REVERSE_CASCADE_MAP,
)
from phenomenon_engine.ecosystem_engine import (
    EcosystemEngine,
    CONSISTENCY_RULES,
    REQUIRED_COVERAGE,
)
from .conftest import make_master, make_sub


# ───────────────────── ReverseCascade tests (21–23) ─────────────────────

# ── Test 21: PAYMENT.paymentDays change reverses to master ──
def test_payment_days_reverse_to_master(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    engine = ReverseCascadeEngine()
    result = engine.run(subs["PAYMENT"].id, "paymentDays", "45", repo)

    assert result.triggered, "Reverse cascade should fire for PAYMENT.paymentDays"
    assert result.master_id == master.id
    assert "Plazo de pago" in result.reason

    updated_master = repo.get(master.id)
    assert updated_master.status == "NEEDS_REVIEW"
    assert updated_master.opus.homologation == "PENDING"


# ── Test 22: unmapped field does NOT trigger reverse cascade ──
def test_unmapped_field_does_not_reverse(master_with_all_subs, repo):
    master, subs = master_with_all_subs
    original_status = repo.get(master.id).status

    engine = ReverseCascadeEngine()
    result = engine.run(subs["NDA"].id, "randomField", "x", repo)

    assert not result.triggered
    # Master must be unchanged
    assert repo.get(master.id).status == original_status


# ── Test 23: every REVERSE_CASCADE_MAP type+field combination triggers correctly ──
def test_all_reverse_cascade_entries_fire(repo):
    """Property test: iterate every entry in REVERSE_CASCADE_MAP and confirm
    each one actually triggers when invoked with a matching sub-contract."""
    engine = ReverseCascadeEngine()
    failures = []

    for sub_type, field_map in REVERSE_CASCADE_MAP.items():
        for field in field_map.keys():
            master = make_master()
            sub = make_sub(parent_id=master.id, type=sub_type)
            repo.save(master)
            repo.save(sub)

            result = engine.run(sub.id, field, "test-value", repo)
            if not result.triggered:
                failures.append(f"{sub_type}.{field}")

    assert not failures, f"These REVERSE_CASCADE_MAP entries did NOT fire: {failures}"


# ───────────────────── Ecosystem consistency tests (24–27) ─────────────────────

# ── Test 24: payment_days_legal rule fires when paymentDays > 60 ──
def test_payment_days_over_60_flagged(repo):
    master = make_master(template_key="CSM")
    repo.save(master)
    payment = make_sub(parent_id=master.id, type="PAYMENT", terms={"paymentDays": 90})
    nda = make_sub(parent_id=master.id, type="NDA", terms={"confidentialityPeriod": 5})
    dpa = make_sub(parent_id=master.id, type="DPA", terms={"dataRetention": 3})
    sla = make_sub(parent_id=master.id, type="SLA", terms={"availability": 99.5})
    for r in (payment, nda, dpa, sla):
        repo.save(r)

    engine = EcosystemEngine()
    state = engine.evaluate(master.id, repo)

    flagged_ids = [i.rule_id for i in state.consistency_issues]
    assert "payment_days_legal" in flagged_ids, (
        f"Expected payment_days_legal rule to fire; got {flagged_ids}"
    )


# ── Test 25: nda_dpa_retention fires when DPA retention > NDA confidentiality ──
def test_nda_dpa_retention_mismatch_flagged(repo):
    master = make_master(template_key="CSM")
    repo.save(master)
    nda = make_sub(parent_id=master.id, type="NDA", terms={"confidentialityPeriod": 3})
    dpa = make_sub(parent_id=master.id, type="DPA", terms={"dataRetention": 5})
    repo.save(nda)
    repo.save(dpa)

    engine = EcosystemEngine()
    state = engine.evaluate(master.id, repo)

    flagged = [i for i in state.consistency_issues if i.rule_id == "nda_dpa_retention"]
    assert flagged, "nda_dpa_retention should fire when retention > confidentialityPeriod"
    assert flagged[0].severity == "ERROR"


# ── Test 26: sla_availability_threshold WARNs when availability < 95% ──
def test_sla_low_availability_warned(repo):
    master = make_master(template_key="SAAS")
    repo.save(master)
    sla = make_sub(parent_id=master.id, type="SLA", terms={"availability": 90.0})
    repo.save(sla)

    engine = EcosystemEngine()
    state = engine.evaluate(master.id, repo)

    flagged = [i for i in state.consistency_issues if i.rule_id == "sla_availability_threshold"]
    assert flagged
    assert flagged[0].severity == "WARNING"


# ── Test 27: NO consistency issues fire when ecosystem is coherent ──
def test_no_issues_when_consistent(repo):
    master = make_master(template_key="SAAS")
    repo.save(master)
    nda = make_sub(parent_id=master.id, type="NDA",
                   terms={"confidentialityPeriod": 10, "confidentialScope": "broad"})
    dpa = make_sub(parent_id=master.id, type="DPA",
                   terms={"dataRetention": 5})
    payment = make_sub(parent_id=master.id, type="PAYMENT",
                       terms={"paymentDays": 30})
    sla = make_sub(parent_id=master.id, type="SLA",
                   terms={"availability": 99.9})
    ip = make_sub(parent_id=master.id, type="IP",
                  terms={"duration": 5})
    for r in (nda, dpa, payment, sla, ip):
        repo.save(r)

    engine = EcosystemEngine()
    state = engine.evaluate(master.id, repo)

    errors = [i for i in state.consistency_issues if i.severity == "ERROR"]
    assert not errors, f"Coherent ecosystem should produce no ERROR issues; got {errors}"


# ───────────────────── Coverage tests (28–29) ─────────────────────

# ── Test 28: missing required coverage type is flagged ──
def test_missing_required_coverage_flagged(repo):
    """SAAS requires NDA+SLA+PAYMENT+DPA+IP. Omitting IP should be a gap."""
    master = make_master(template_key="SAAS")
    repo.save(master)
    for t in ("NDA", "SLA", "PAYMENT", "DPA"):  # IP omitted
        repo.save(make_sub(parent_id=master.id, type=t))

    engine = EcosystemEngine()
    state = engine.evaluate(master.id, repo)

    missing = [c.contract_type for c in state.coverage if c.required and not c.present]
    assert "IP" in missing, f"IP should be reported missing; got {missing}"


# ── Test 29: full coverage produces no gaps ──
def test_full_coverage_no_gaps(repo):
    master = make_master(template_key="CSM")  # CSM needs NDA, SLA, PAYMENT, DPA
    repo.save(master)
    for t in REQUIRED_COVERAGE["CSM"]:
        repo.save(make_sub(parent_id=master.id, type=t))

    engine = EcosystemEngine()
    state = engine.evaluate(master.id, repo)

    missing = [c.contract_type for c in state.coverage if c.required and not c.present]
    assert missing == [], f"Full coverage should produce no gaps; got {missing}"


# ── Test 30: health score reflects ecosystem quality ──
def test_health_score_monotonic_with_issues(repo):
    """Health score: clean ecosystem ≥ 80, then drops with each issue/gap.
    This proves the scoring function is actually responsive to violations."""
    # Clean SAAS ecosystem
    master = make_master(template_key="SAAS")
    repo.save(master)
    for t in REQUIRED_COVERAGE["SAAS"]:
        repo.save(make_sub(
            parent_id=master.id, type=t,
            terms={"confidentialityPeriod": 10, "dataRetention": 5,
                   "paymentDays": 30, "availability": 99.9, "duration": 5},
            homologation="VALID",
            status="ACTIVE",
        ))

    engine = EcosystemEngine()
    clean_score = engine.evaluate(master.id, repo).health_score

    # Now break it: increase paymentDays to 90 → triggers payment_days_legal
    payment = next(c for c in repo.get_children(master.id) if c.type == "PAYMENT")
    repo.save(payment.model_copy(update={"ag": {"terms": {"paymentDays": 90}, "clauses": []}}))
    broken_score = engine.evaluate(master.id, repo).health_score

    assert clean_score >= 80, f"Clean ecosystem should score ≥ 80; got {clean_score}"
    assert broken_score < clean_score, (
        f"Broken ecosystem ({broken_score}) should score lower than clean ({clean_score})"
    )
