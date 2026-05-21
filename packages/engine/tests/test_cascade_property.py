"""
Property tests — drains P4 queue items.

For EVERY entry in SUB_CASCADE_MAP and CONSISTENCY_RULES, confirms the rule
fires as documented. Catches the bug class: "a rule is in the map but does
nothing at runtime" (silent dead code).
"""
import pytest
from phenomenon_engine.cascade_engine import (
    SubCascadeEngine,
    SUB_CASCADE_MAP,
    _ALL_SUB_TYPES,
)
from phenomenon_engine.ecosystem_engine import (
    EcosystemEngine,
    CONSISTENCY_RULES,
    REQUIRED_COVERAGE,
)
from .conftest import make_master, make_sub


# ── Property test: every SUB_CASCADE_MAP rule actually fires ────────────
@pytest.mark.parametrize("source_type,field,targets", [
    (src, fld, tgts)
    for src, rules in SUB_CASCADE_MAP.items()
    for fld, tgts in rules.items()
])
def test_sub_cascade_rule_fires(repo, source_type, field, targets):
    """Every (source_type, field) → targets entry must produce a non-empty
    affected list when a sibling of each target type exists."""
    master = make_master()
    repo.save(master)
    source = make_sub(parent_id=master.id, type=source_type)
    repo.save(source)
    # Create one sibling of each target type
    for t in targets:
        repo.save(make_sub(parent_id=master.id, type=t))

    engine = SubCascadeEngine()
    result = engine.run(source.id, field, "new_value_xyz", repo)
    affected_types = {repo.get(aid).type for aid in result.affected_ids}
    expected_types = set(targets)
    missing = expected_types - affected_types
    assert not missing, (
        f"SUB_CASCADE_MAP[{source_type!r}][{field!r}] declares targets "
        f"{sorted(expected_types)} but engine only affected {sorted(affected_types)}"
    )


# ── Property test: every CONSISTENCY_RULE fires when violated ───────────
def _build_violating_ecosystem(repo, rule):
    """Build a minimal ecosystem that VIOLATES the given rule."""
    master = make_master(template_key="SAAS")
    repo.save(master)

    relation = rule["relation"]

    if relation == "lte_limit":
        # Source value > limit -> violate
        bad_value = float(rule["limit"]) + 10
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: bad_value}))
    elif relation == "gte_limit":
        bad_value = float(rule["limit"]) - 1
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: bad_value}))
    elif relation == "gte":
        # source < target -> violate (source must be >= target)
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: 1}))
        repo.save(make_sub(parent_id=master.id, type=rule["target_type"],
                            terms={rule["target_field"]: 10}))
    elif relation == "lte":
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: 10}))
        repo.save(make_sub(parent_id=master.id, type=rule["target_type"],
                            terms={rule["target_field"]: 1}))
    elif relation == "both_set_or_neither":
        # Set source, leave target empty -> violate
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: "X"}))
        repo.save(make_sub(parent_id=master.id, type=rule["target_type"],
                            terms={rule["target_field"]: ""}))
    elif relation == "if_source_then_target":
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: "set"}))
        repo.save(make_sub(parent_id=master.id, type=rule["target_type"],
                            terms={rule["target_field"]: ""}))


@pytest.mark.parametrize("rule", CONSISTENCY_RULES, ids=lambda r: r["id"])
def test_consistency_rule_fires_on_violation(repo, rule):
    _build_violating_ecosystem(repo, rule)
    master = next(c for c in repo.list_all() if not c.parentId)

    engine = EcosystemEngine()
    state = engine.evaluate(master.id, repo)
    rule_ids = [i.rule_id for i in state.consistency_issues]
    assert rule["id"] in rule_ids, (
        f"Rule {rule['id']!r} did NOT fire on a violating ecosystem. "
        f"Issues found: {rule_ids}"
    )


# ── Property test: every CONSISTENCY_RULE stays silent when satisfied ───
def _build_satisfying_ecosystem(repo, rule):
    """Build a minimal ecosystem that SATISFIES the given rule."""
    master = make_master(template_key="SAAS")
    repo.save(master)
    relation = rule["relation"]

    if relation == "lte_limit":
        good = float(rule["limit"]) - 1
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: good}))
    elif relation == "gte_limit":
        good = float(rule["limit"]) + 1
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: good}))
    elif relation == "gte":
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: 10}))
        repo.save(make_sub(parent_id=master.id, type=rule["target_type"],
                            terms={rule["target_field"]: 5}))
    elif relation == "lte":
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: 5}))
        repo.save(make_sub(parent_id=master.id, type=rule["target_type"],
                            terms={rule["target_field"]: 10}))
    elif relation == "both_set_or_neither":
        # Both empty -> satisfies
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: ""}))
        repo.save(make_sub(parent_id=master.id, type=rule["target_type"],
                            terms={rule["target_field"]: ""}))
    elif relation == "if_source_then_target":
        # Source empty -> rule doesn't apply -> satisfies trivially
        repo.save(make_sub(parent_id=master.id, type=rule["source_type"],
                            terms={rule["source_field"]: ""}))


@pytest.mark.parametrize("rule", CONSISTENCY_RULES, ids=lambda r: r["id"])
def test_consistency_rule_silent_when_satisfied(repo, rule):
    _build_satisfying_ecosystem(repo, rule)
    master = next(c for c in repo.list_all() if not c.parentId)

    engine = EcosystemEngine()
    state = engine.evaluate(master.id, repo)
    rule_ids = [i.rule_id for i in state.consistency_issues]
    assert rule["id"] not in rule_ids, (
        f"Rule {rule['id']!r} fired on a SATISFYING ecosystem (false positive). "
        f"Issues: {rule_ids}"
    )


# ── REQUIRED_COVERAGE: every template's required types are real sub-types ─
def test_required_coverage_types_are_known():
    """Every type listed in REQUIRED_COVERAGE must be a real sub-type the
    engine can cascade to. A typo here would silently make a coverage
    requirement unsatisfiable."""
    for template_key, required_types in REQUIRED_COVERAGE.items():
        unknown = set(required_types) - set(_ALL_SUB_TYPES)
        assert not unknown, (
            f"REQUIRED_COVERAGE[{template_key!r}] references unknown sub-types: {unknown}"
        )
