"""
Ecosystem routes — validates and manages the full contract network as a unit.
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..repositories.phenomena_repo import PhenomenaRepository
from phenomenon_engine import (
    EcosystemEngine, PhenomenonRecord, EssFields, Vector, OpusState, VectorEngine,
)

router = APIRouter()


# ─── Ecosystem state ──────────────────────────────────────────────────────────

@router.get("/{master_id}")
def get_ecosystem(master_id: str, db: Session = Depends(get_db)):
    repo = PhenomenaRepository(db)
    try:
        state = EcosystemEngine().evaluate(master_id, repo)
    except KeyError:
        raise HTTPException(404, "Master contract not found")

    return {
        "master_id":           state.master_id,
        "master_name":         state.master_name,
        "template_key":        state.template_key,
        "contracts":           state.contracts,
        "consistency_issues":  [
            {
                "rule_id":      i.rule_id,
                "severity":     i.severity,
                "desc_es":      i.desc_es,
                "law":          i.law,
                "source_type":  i.source_type,
                "target_type":  i.target_type,
                "source_value": i.source_value,
                "target_value": i.target_value,
            }
            for i in state.consistency_issues
        ],
        "coverage":            [
            {
                "contract_type":  c.contract_type,
                "present":        c.present,
                "required":       c.required,
                "contract_id":    c.contract_id,
                "contract_name":  c.contract_name,
                "status":         c.status,
            }
            for c in state.coverage
        ],
        "parties":             state.parties,
        "ecosystem_valid":     state.ecosystem_valid,
        "homologation_summary":state.homologation_summary,
        "health_score":        state.health_score,
    }


# ─── Full ecosystem homologation ──────────────────────────────────────────────

@router.post("/{master_id}/homologate")
def ecosystem_homologate(master_id: str, db: Session = Depends(get_db)):
    """
    Homologates the entire contract ecosystem as a single unit.
    Runs individual homologation on each contract (sub-contracts first, then master),
    then runs cross-contract consistency checks and coverage verification.
    """
    from ..api.routes_phenomena import (
        _SUB_REQUIRED, _MASTER_REQUIRED,
    )
    from phenomenon_engine import IAEngine

    repo     = PhenomenaRepository(db)
    try:
        master = repo.get(master_id)
    except KeyError:
        raise HTTPException(404, "Master contract not found")

    children = repo.get_children(master_id)
    ordered  = children + [master]   # subs first so master's ecosystem check sees their states

    individual_results = []

    for record in ordered:
        errors: list[str] = []
        ess   = record.ess.model_dump()
        terms = record.ag.get("terms", {})
        is_sub = bool(record.parentId)

        # ── ESS checks ────────────────────────────────────────────────────────
        for key, label in [("partyA","Parte A"),("partyB","Parte B"),
                           ("jurisdiction","Juzgados"),("effectiveDate","Fecha inicio"),
                           ("expiryDate","Fecha vencimiento")]:
            if not ess.get(key):
                errors.append(f"[ESS] Campo obligatorio vacío: {label}")

        # ── AG + IA checks ────────────────────────────────────────────────────
        if not record.ag.get("clauses"):
            errors.append("[AG] Sin cláusulas operativas definidas")
        if not record.ia_instances:
            errors.append(f"[IA] Sin operadores IA asignados para {record.type}")
        elif len(record.ia_instances) > 1:
            ia_valid, ia_errors = IAEngine().validate_set(record.ia_instances)
            for e in ia_errors:
                errors.append(f"[IA] {e}")

        # ── Type-specific terms ───────────────────────────────────────────────
        required_terms = _SUB_REQUIRED.get(record.type, []) if is_sub else \
                         _MASTER_REQUIRED.get(terms.get("templateKey",""), [])
        for key, label in required_terms:
            val = terms.get(key)
            if not val or str(val).strip() in ("","— seleccionar —"):
                errors.append(f"[{record.type}] Campo específico obligatorio: {label}")

        # ── Ecosystem coherence (master only) ────────────────────────────────
        if not is_sub:
            # Re-read children fresh from DB — the children list is stale because
            # sub-contract homologations were saved inside this same loop above.
            db.expire_all()
            fresh_children = repo.get_children(master_id)
            not_valid = [c for c in fresh_children if c.opus.homologation != "VALID"]
            for child in not_valid:
                errors.append(
                    f"[IF] Sub-contrato no homologado: «{child.name}» "
                    f"({child.opus.homologation})"
                )

        valid = len(errors) == 0
        # Persist individual result
        repo.save(record.model_copy(update={
            "opus": record.opus.model_copy(update={"homologation": "VALID" if valid else "INVALID"})
        }))

        individual_results.append({
            "id":   record.id,
            "name": record.name,
            "type": record.type,
            "valid": valid,
            "errors": errors,
            "homologation": "VALID" if valid else "INVALID",
        })

    # ── Cross-contract consistency + coverage ─────────────────────────────────
    engine = EcosystemEngine()
    result = engine.build_homologation_result(master_id, repo, individual_results)

    return {
        "ecosystem_valid":     result.ecosystem_valid,
        "health_score":        result.health_score,
        "summary":             result.summary,
        "individual_results":  result.individual_results,
        "consistency_issues":  [
            {
                "rule_id":      i.rule_id,
                "severity":     i.severity,
                "desc_es":      i.desc_es,
                "law":          i.law,
                "source_type":  i.source_type,
                "target_type":  i.target_type,
                "source_value": i.source_value,
                "target_value": i.target_value,
            }
            for i in result.consistency_issues
        ],
        "coverage_gaps":       result.coverage_gaps,
    }


# ─── Add party to ecosystem ───────────────────────────────────────────────────

class AddPartyRequest(BaseModel):
    role: str           # e.g. "C", "D"
    name: str
    cif: Optional[str] = ""
    address: Optional[str] = ""
    representative: Optional[str] = ""


@router.post("/{master_id}/add-party")
def add_party(master_id: str, req: AddPartyRequest, db: Session = Depends(get_db)):
    """
    Novación subjetiva (Art. 1203 CC): adds a new party to the ecosystem.
    Stored in master.ag.terms.additionalParties. Marks all contracts NEEDS_REVIEW.
    """
    repo = PhenomenaRepository(db)
    try:
        master = repo.get(master_id)
    except KeyError:
        raise HTTPException(404, "Master contract not found")

    existing_ag    = master.ag or {}
    existing_terms = existing_ag.get("terms", {})
    additional     = list(existing_terms.get("additionalParties", []))  # safe copy

    # Roles "A" and "B" are reserved for the master's ess.partyA / ess.partyB.
    # Allowing a duplicate role-A would create incoherent party identity. Audit
    # 2026-05-21 found this accepted silently.
    if req.role in ("A", "B"):
        raise HTTPException(
            400,
            f"Role '{req.role}' is reserved for the master's partyA/partyB. "
            f"Use C, D, E, … for additional parties."
        )

    # Check role not already taken among additionalParties
    if any(p.get("role") == req.role for p in additional):
        raise HTTPException(400, f"Party role '{req.role}' already exists in this ecosystem")

    additional.append({
        "role": req.role, "name": req.name,
        "cif": req.cif, "address": req.address, "rep": req.representative,
    })
    new_terms = {**existing_terms, "additionalParties": additional}

    # Update master
    repo.save(master.model_copy(update={
        "ag":   {**existing_ag, "terms": new_terms},
        "status": "NEEDS_REVIEW",
        "opus": master.opus.model_copy(update={"homologation": "PENDING"}),
    }))

    # Propagate new party to all sub-contracts AND mark NEEDS_REVIEW
    children   = repo.get_children(master_id)
    affected   = []
    for child in children:
        child_ag    = child.ag or {}
        child_terms = {**child_ag.get("terms", {}), "additionalParties": additional}
        repo.save(child.model_copy(update={
            "ag": {**child_ag, "terms": child_terms},
            "status": "NEEDS_REVIEW",
            "opus":   child.opus.model_copy(update={"homologation": "PENDING"}),
        }))
        affected.append(child.id)

    return {
        "added":        True,
        "party":        {"role": req.role, "name": req.name},
        "affected_ids": affected,
        "note":         f"Novación subjetiva (Art. 1203 CC) — Parte {req.role} añadida. {len(affected)} sub-contrato(s) marcados NEEDS_REVIEW.",
    }


# ─── Add contract mid-lifecycle ───────────────────────────────────────────────

class AddContractRequest(BaseModel):
    contract_type: str
    ia_defaults: list[str] = ["ad-actio"]


@router.post("/{master_id}/add-contract")
def add_contract(master_id: str, req: AddContractRequest, db: Session = Depends(get_db)):
    """
    Adds a new sub-contract to an existing ecosystem mid-lifecycle.
    Inherits ESS from master, establishes IF connections to existing siblings,
    marks master NEEDS_REVIEW for re-verification.
    """
    from ..repositories.phenomena_repo import PhenomenaRepository

    repo = PhenomenaRepository(db)
    try:
        master = repo.get(master_id)
    except KeyError:
        raise HTTPException(404, "Master contract not found")

    children = repo.get_children(master_id)
    existing_types = {c.type for c in children}
    if req.contract_type in existing_types:
        raise HTTPException(400, f"Contract type '{req.contract_type}' already exists in this ecosystem")

    SUB_LABELS = {
        "NDA": "Acuerdo de Confidencialidad", "SLA": "Acuerdo de Nivel de Servicio",
        "PAYMENT": "Condiciones de Pago", "IP": "Cesión de Propiedad Intelectual",
        "DPA": "Acuerdo de Tratamiento de Datos",
        "CONDICION_SOLAR": "Condición Suspensiva", "PAGO_APLAZADO": "Precio Aplazado",
        "CARGAS_URBANISTICAS": "Cargas Urbanísticas",
    }
    name = SUB_LABELS.get(req.contract_type, req.contract_type)

    vector = VectorEngine().generate(
        ia_type=req.ia_defaults[0] if req.ia_defaults else "ad-actio",
        is_sub=True,
    )

    new_record = PhenomenonRecord(
        id=str(uuid.uuid4()),
        name=name,
        type=req.contract_type,
        status="ACTIVE",
        ess=master.ess,
        ag={"clauses": [f"Cláusula principal de {name}."], "terms": {}},
        ia_instances=req.ia_defaults,
        vectors=[vector],
        opus=OpusState(status="ACTIVE", homologation="PENDING"),
        parentId=master_id,
    )
    repo.save(new_record)

    # Mark master NEEDS_REVIEW (new IF connection added)
    repo.save(master.model_copy(update={
        "status": "NEEDS_REVIEW",
        "opus":   master.opus.model_copy(update={"homologation": "PENDING"}),
    }))

    return {
        "created":      True,
        "id":           new_record.id,
        "name":         name,
        "type":         req.contract_type,
        "note":         f"Subcontrato {name} añadido al ecosistema. Maestro marcado NEEDS_REVIEW.",
    }
