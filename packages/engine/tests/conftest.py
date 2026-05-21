"""
Shared test fixtures for the PHENOMENON engine test suite.

Provides:
  - InMemoryRepository : implements PhenomenonRepository protocol without a DB
  - make_master / make_sub : factory helpers producing valid PhenomenonRecord instances
  - master_with_subs : pre-built master + a set of sub-contracts for cascade tests
"""
from __future__ import annotations

import uuid
import pytest

from phenomenon_engine.models import (
    PhenomenonRecord,
    EssFields,
    OpusState,
)


# ───────────────────────── In-memory repository ────────────────────────────

class InMemoryRepository:
    """
    Minimal implementation of the PhenomenonRepository protocol used by all
    engine classes. Stores records in a dict, indexed by id, with O(n) lookup
    of children. This is deliberately simple — engine logic must work with
    *any* repo that conforms to the protocol.
    """

    def __init__(self) -> None:
        self._store: dict[str, PhenomenonRecord] = {}

    def get(self, id: str) -> PhenomenonRecord | None:
        return self._store.get(id)

    def get_children(self, parent_id: str) -> list[PhenomenonRecord]:
        return [r for r in self._store.values() if r.parentId == parent_id]

    def save(self, record: PhenomenonRecord) -> PhenomenonRecord:
        self._store[record.id] = record
        return record

    def list_all(self) -> list[PhenomenonRecord]:
        return list(self._store.values())

    def delete(self, id: str) -> None:
        self._store.pop(id, None)


# ───────────────────────── Factory helpers ─────────────────────────────────

def _default_ess(**overrides) -> EssFields:
    base = dict(
        partyA="Empresa A S.L.",
        partyB="Empresa B S.A.",
        jurisdiction="Madrid",
        effectiveDate="2026-01-01",
        expiryDate="2027-01-01",
    )
    base.update(overrides)
    return EssFields(**base)


def _default_opus(homologation: str = "PENDING") -> OpusState:
    return OpusState(status="PARTIAL", homologation=homologation)


def make_master(
    *,
    id: str | None = None,
    template_key: str = "CSM",
    terms: dict | None = None,
    ess: dict | None = None,
    status: str = "DRAFT",
) -> PhenomenonRecord:
    """Build a syntactically valid master contract record."""
    full_terms = {"templateKey": template_key}
    if terms:
        full_terms.update(terms)
    return PhenomenonRecord(
        id=id or f"master-{uuid.uuid4().hex[:8]}",
        type=template_key,
        name=f"{template_key} Master",
        status=status,
        ess=_default_ess(**(ess or {})),
        ag={"terms": full_terms, "clauses": []},
        opus=_default_opus(),
        parentId=None,
    )


def make_sub(
    *,
    parent_id: str,
    type: str,
    id: str | None = None,
    terms: dict | None = None,
    ess: dict | None = None,
    status: str = "ACTIVE",
    homologation: str = "VALID",
) -> PhenomenonRecord:
    """Build a syntactically valid sub-contract record linked to a parent."""
    return PhenomenonRecord(
        id=id or f"{type.lower()}-{uuid.uuid4().hex[:8]}",
        type=type,
        name=f"{type} Sub",
        status=status,
        ess=_default_ess(**(ess or {})),
        ag={"terms": terms or {}, "clauses": []},
        opus=_default_opus(homologation=homologation),
        parentId=parent_id,
    )


# ───────────────────────── Pytest fixtures ─────────────────────────────────

@pytest.fixture
def repo() -> InMemoryRepository:
    """Fresh empty repository for each test."""
    return InMemoryRepository()


@pytest.fixture
def master_with_all_subs(repo: InMemoryRepository):
    """
    Master + one sub of each common type (NDA, SLA, PAYMENT, DPA, IP).
    Returns (master, dict_of_subs_by_type).
    """
    master = make_master(template_key="SAAS")
    repo.save(master)
    subs = {}
    for t in ("NDA", "SLA", "PAYMENT", "DPA", "IP"):
        s = make_sub(parent_id=master.id, type=t)
        subs[t] = s
        repo.save(s)
    return master, subs


@pytest.fixture
def kpmg_ecosystem(repo: InMemoryRepository):
    """KPMG-style master with FINANCIACION + HIPOTECA_GARANTIA + CESION_CREDITO."""
    master = make_master(template_key="KPMG", terms={"euriborRate": "3.5"})
    repo.save(master)
    subs = {}
    for t in ("FINANCIACION", "HIPOTECA_GARANTIA", "CESION_CREDITO"):
        s = make_sub(parent_id=master.id, type=t)
        subs[t] = s
        repo.save(s)
    return master, subs


@pytest.fixture
def seguros_vida_ecosystem(repo: InMemoryRepository):
    """Insurance master with COBERTURA_VIDA + EXCLUSIONES_VIDA + PRIMA_VIDA."""
    master = make_master(template_key="SEGURO_VIDA")
    repo.save(master)
    subs = {}
    for t in ("COBERTURA_VIDA", "EXCLUSIONES_VIDA", "PRIMA_VIDA"):
        s = make_sub(parent_id=master.id, type=t)
        subs[t] = s
        repo.save(s)
    return master, subs
