"""
CascadeEngine — propagates ESS changes from master to sub-contracts.

Theoretical grounding (via bridge):
  Bloque II  — IF (interfenoménica): the cascade IS the IF connection between phenomena.
               "IA interfenoménicas (entre F)" — this engine implements the IF layer.
  Bloque IV  — DISTRIBUTE operation: an ESS change in the master is distributed
               to child phenomena via IF links. Each child evaluates whether it
               is in the CASCADE_MAP for the changed field.
  Bloque III — The affected children transition to INTERRUPTED state (NEEDS_REVIEW)
               because the change interrupts their current operational continuity.

The cascade emits theoretical events (ON_DISTRIBUTE, ON_UPDATE) via the EventEngine.
"""
from dataclasses import dataclass, field
from .models import PhenomenonRecord
from .protocols import PhenomenonRepository

# All sub-contract types that can appear as children of any master.
# When a master ESS field changes, ALL child contracts of the listed types are flagged.
_ALL_SUB_TYPES = [
    "NDA", "SLA", "PAYMENT", "IP", "DPA",
    "FINANCIACION", "HIPOTECA_GARANTIA", "CESION_CREDITO",
    "CONDICION_SOLAR", "PAGO_APLAZADO", "CARGAS_URBANISTICAS",
    "SEGURO_VIDA", "SEGURO_RC", "SEGURO_DANOS", "SEGURO_CREDITO_COMERCIAL",
    "COBERTURA_VIDA", "EXCLUSIONES_VIDA", "PRIMA_VIDA",
    "COBERTURA_RC", "LIMITES_RC", "FRANQUICIA_RC",
    "COBERTURA_DANOS", "PERITACION", "EXCLUSIONES_DANOS",
    "COBERTURA_CREDITO", "VALIDACION_FINANCIERA", "RIESGO_EMPRESARIAL",
    "COMPLIANCE_CHECK", "AUDIT_REPORT", "REGULATORY_APPROVAL", "BOARD_RESOLUTION",
    "SEGURO_CREDITO", "AVAL_BANCARIO", "CONTRATO_OBRA",
]

CASCADE_MAP: dict[str, list[str]] = {
    "jurisdiction":  _ALL_SUB_TYPES,
    "effectiveDate": _ALL_SUB_TYPES,
    "expiryDate":    _ALL_SUB_TYPES,
    "partyA":        _ALL_SUB_TYPES,
    "partyB":        _ALL_SUB_TYPES,
    "governingLaw":  _ALL_SUB_TYPES,
}

# Sub-contract IF connections: changes in one sub propagate NEEDS_REVIEW to siblings.
# Keys: (source_type, term_field) → list of sibling types affected.
# Theoretical grounding: Bloque II IF (inter-fenómenica) between sibling phenomena
# that share overlapping operational vectors.
SUB_CASCADE_MAP: dict[str, dict[str, list[str]]] = {
    "NDA": {
        "confidentialityPeriod": ["DPA", "IP"],   # NDA term bounds DPA retention + IP duration
        "noticePeriod":          ["DPA"],          # Notice period affects data deletion timing
        "penaltyAmount":         ["PAYMENT"],      # NDA breach penalty feeds financial exposure
    },
    "PAYMENT": {
        "paymentDays":     ["SLA"],               # Payment delay affects SLA penalty timelines
        "baseAmount":      ["SLA"],               # Contract value changes SLA penalty caps
        "retentionPct":    ["SLA"],               # Retention % ties to SLA penalty deductions
    },
    "SLA": {
        "availability":       ["PAYMENT"],         # Availability guarantees affect pricing
        "penaltyPct":         ["PAYMENT"],         # Penalty % directly impacts financial terms
        "maxMonthlyPenalty":  ["PAYMENT"],         # Cap on penalties affects PAYMENT exposure
    },
    "DPA": {
        "dataRetention":       ["NDA"],            # Data retention period must align with NDA term
        "internationalTransfer":["NDA"],           # International transfers need NDA coverage
        "subprocessors":       ["NDA"],            # Subprocessors require NDA-level protection
    },
    "IP": {
        "exclusivity": ["NDA"],                    # Exclusive IP requires stronger NDA scope
        "territory":   ["NDA"],                    # IP territory must match NDA geographic scope
        "duration":    ["NDA"],                    # IP term should not exceed NDA confidentiality
    },
    # ── Seguros: IF_exclusion blocking logic ─────────────────────────────────
    # When exclusion sub-contracts change, coverage sub-contracts are affected.
    # This models the IF_non (positional exclusion) from Bloque II:
    # the vector CANNOT PASS through an active exclusion → coverage is BLOCKED.
    "EXCLUSIONES_VIDA": {
        "blockingStatus":    ["COBERTURA_VIDA"],   # exclusion blocking status → coverage
        "medicalExamRequired":["COBERTURA_VIDA"],  # medical validation → coverage
    },
    "PRIMA_VIDA": {
        "annualPremium": ["COBERTURA_VIDA"],        # premium changes → coverage review
    },
    "VALIDACION_FINANCIERA": {
        "financialRating":   ["COBERTURA_CREDITO"], # rating determines if coverage blocked
        "validationPending": ["COBERTURA_CREDITO"], # pending → suspends coverage
        "blockingEffect":    ["COBERTURA_CREDITO"], # explicit blocking field
    },
    "RIESGO_EMPRESARIAL": {
        "riskCategory": ["VALIDACION_FINANCIERA", "COBERTURA_CREDITO"],
    },
    "PERITACION": {
        "peritacionStatus": ["COBERTURA_DANOS"],   # valuation process → coverage status
        "estimatedDamage":  ["COBERTURA_DANOS"],   # estimated damage → coverage amount
        "agreedIndemnity":  ["COBERTURA_DANOS"],   # final indemnity → closes coverage
    },
    "FRANQUICIA_RC": {
        "deductibleAmount":  ["COBERTURA_RC"],     # deductible → coverage activation
        "deductibleApplied": ["LIMITES_RC"],       # applied deductible → limits
    },
}

# Sub-to-master reverse cascade: changes in sub-contracts that require master review.
# Maps (source_type, term_field) → human-readable reason why master needs review.
REVERSE_CASCADE_MAP: dict[str, dict[str, str]] = {
    "PAYMENT": {
        "paymentDays":  "Plazo de pago modificado — verificar cláusula de pago en contrato marco",
        "baseAmount":   "Importe modificado — verificar límite de responsabilidad en contrato marco",
        "retentionPct": "Retención modificada — verificar exposición financiera en contrato marco",
    },
    "SLA": {
        "availability":      "Disponibilidad garantizada modificada — revisar objeto del contrato marco",
        "penaltyPct":        "Penalización SLA modificada — revisar cláusula de responsabilidad en maestro",
        "maxMonthlyPenalty": "Tope de penalización modificado — verificar límite de responsabilidad global",
    },
    "NDA": {
        "confidentialityPeriod": "Plazo de confidencialidad modificado — verificar vigencia del contrato marco",
        "penaltyAmount":         "Penalización NDA modificada — verificar exposición total en contrato marco",
    },
    "DPA": {
        "dataRetention":        "Retención de datos modificada — revisar obligaciones RGPD en contrato marco",
        "internationalTransfer":"Transferencia internacional modificada — revisar cláusula RGPD en maestro",
    },
    "IP": {
        "exclusivity": "Exclusividad IP modificada — revisar objeto y territorio en contrato marco",
        "territory":   "Territorio IP modificado — revisar alcance geográfico en contrato marco",
    },
    # Insurance reverse cascades (significant coverage changes → master policy review)
    "COBERTURA_VIDA": {
        "coverageStatus": "Estado de cobertura de vida modificado — revisar póliza maestra",
    },
    "EXCLUSIONES_VIDA": {
        "blockingStatus": "Exclusión IF_non activada en seguro vida — revisar póliza maestra urgente",
    },
    "COBERTURA_CREDITO": {
        "coverageStatus": "Estado de cobertura de crédito modificado — revisar póliza maestra",
    },
    "VALIDACION_FINANCIERA": {
        "financialRating": "Rating financiero del deudor modificado — revisar límites de crédito en póliza",
        "validationPending": "Validación financiera pendiente — cobertura puede estar bloqueada",
    },
    "PERITACION": {
        "peritacionStatus": "Proceso de peritación actualizado — revisar estado de indemnización en póliza",
        "agreedIndemnity":  "Indemnización acordada — actualizar póliza de daños",
    },
}


@dataclass
class CascadeResult:
    master_id: str
    field: str
    old_value: str
    new_value: str
    affected_ids: list[str] = field(default_factory=list)
    trace: list[dict] = field(default_factory=list)


class CascadeEngine:
    def run(
        self,
        master_id: str,
        field: str,
        new_value: str,
        repo: PhenomenonRepository,
    ) -> "CascadeResult":
        master = repo.get(master_id)
        old_value = str(master.ess.model_dump().get(field, ""))

        updated_master = master.model_copy(
            update={
                "ess": master.ess.model_copy(update={field: new_value}),
                "status": "MODIFIED",
            }
        )
        repo.save(updated_master)

        children = repo.get_children(master_id)
        affected_types = CASCADE_MAP.get(field, [])
        affected = [c for c in children if c.type in affected_types]

        trace = []
        for contract in affected:
            updated = contract.model_copy(
                update={
                    "ess": contract.ess.model_copy(update={field: new_value}),
                    "status": "NEEDS_REVIEW",
                    "opus": contract.opus.model_copy(update={"homologation": "PENDING"}),
                }
            )
            repo.save(updated)
            trace.append({
                "phenomenon_id": contract.id,
                "name": contract.name,
                "field_updated": field,
                "new_status": "NEEDS_REVIEW",
                "vector": f"IF→{contract.type}",
            })

        result = CascadeResult(
            master_id=master_id,
            field=field,
            old_value=old_value,
            new_value=new_value,
            affected_ids=[c.id for c in affected],
            trace=trace,
        )

        # ── Emit theoretical events via bridge ────────────────────────────────
        # Bloque IV: this is a DISTRIBUTE operation in theoretical terms.
        # Bloque III: affected children are INTERRUPTED (NEEDS_REVIEW) by the change.
        try:
            from .bridge import contract_to_theoretical
            from .event_engine import default_bus
            from .theoretical_models import PhenomenonEvent
            from .enums import EventType
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat()
            default_bus.emit(PhenomenonEvent(
                event_type=EventType.ON_DISTRIBUTE,
                phenomenon_id=master_id,
                source_operation="cascade_distribute",
                payload={"field": field, "old": old_value, "new": new_value,
                         "affected_count": len(affected),
                         "theoretical_operation": "DISTRIBUTE (Bloque IV IF)"},
                timestamp=now,
            ))
            for c in affected:
                default_bus.emit(PhenomenonEvent(
                    event_type=EventType.ON_INTERRUPT,
                    phenomenon_id=c.id,
                    source_operation="cascade_interrupt",
                    payload={"reason": f"IF cascade: {field} changed in master",
                             "new_state": "INTERRUPTED (NEEDS_REVIEW)"},
                    timestamp=now,
                ))
        except Exception:
            pass  # Event emission is non-blocking — never fails the cascade

        return result


@dataclass
class SubCascadeResult:
    source_id: str
    source_type: str
    field: str
    new_value: str
    affected_ids: list[str] = field(default_factory=list)
    trace: list[dict] = field(default_factory=list)


class SubCascadeEngine:
    """
    Propagates AG.terms changes between sibling sub-contracts via IF connections.

    Bloque II: IF inter-fenómenica between siblings sharing overlapping vectors.
    When NDA.confidentialityPeriod changes, DPA retention vectors are interrupted.
    When SLA.penaltyPct changes, PAYMENT financial vectors need re-evaluation.
    """

    def run(
        self,
        source_id: str,
        field: str,
        new_value: str,
        repo: PhenomenonRepository,
    ) -> SubCascadeResult:
        source = repo.get(source_id)
        if not source or not source.parentId:
            return SubCascadeResult(source_id=source_id, source_type="UNKNOWN", field=field, new_value=new_value)

        target_types = SUB_CASCADE_MAP.get(source.type, {}).get(field, [])
        if not target_types:
            return SubCascadeResult(source_id=source_id, source_type=source.type, field=field, new_value=new_value)

        siblings = [c for c in repo.get_children(source.parentId) if c.id != source_id]
        affected = [s for s in siblings if s.type in target_types]

        trace = []
        for sibling in affected:
            updated = sibling.model_copy(
                update={
                    "status": "NEEDS_REVIEW",
                    "opus": sibling.opus.model_copy(update={"homologation": "PENDING"}),
                }
            )
            repo.save(updated)
            trace.append({
                "phenomenon_id": sibling.id,
                "name": sibling.name,
                "triggered_by": source.type,
                "field": field,
                "new_status": "NEEDS_REVIEW",
                "vector": f"IF({source.type}→{sibling.type})",
            })

        try:
            from .bridge import contract_to_theoretical
            from .event_engine import default_bus
            from .theoretical_models import PhenomenonEvent
            from .enums import EventType
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat()
            for s in affected:
                default_bus.emit(PhenomenonEvent(
                    event_type=EventType.ON_INTERRUPT,
                    phenomenon_id=s.id,
                    source_operation="sub_cascade_interrupt",
                    payload={"reason": f"IF sibling cascade: {source.type}.{field} changed",
                             "source_id": source_id, "new_state": "INTERRUPTED (NEEDS_REVIEW)"},
                    timestamp=now,
                ))
        except Exception:
            pass

        return SubCascadeResult(
            source_id=source_id,
            source_type=source.type,
            field=field,
            new_value=new_value,
            affected_ids=[s.id for s in affected],
            trace=trace,
        )


@dataclass
class CrossPolicyCascadeResult:
    source_id: str
    source_type: str
    field: str
    new_value: str
    affected_ids: list[str] = field(default_factory=list)
    trace: list[dict] = field(default_factory=list)


# Cross-policy cascade map: sub-type + field → target sub-types in OTHER policy trees.
# Connections are resolved at runtime by finding contracts of the target type
# whose master shares the same partyA as the source contract's master.
CROSS_POLICY_CASCADE_MAP: dict[str, dict[str, list[str]]] = {
    # RIESGO_EMPRESARIAL (Crédito) → PERITACION (Daños)
    # Business risk level affects property damage assessment for the same company.
    "RIESGO_EMPRESARIAL": {
        "riskCategory": ["PERITACION"],
    },
    # EXCLUSIONES_VIDA → COBERTURA_RC
    # Medical exclusion on life policy means same insured's RC risk profile changes.
    "EXCLUSIONES_VIDA": {
        "blockingStatus": ["COBERTURA_RC"],
    },
    # Master-level: any master's partyA change → all sibling insurance masters NEEDS_REVIEW.
    # Handled separately in CrossPolicyCascadeEngine.run_partyA_change().
}


class CrossPolicyCascadeEngine:
    """
    Propagates changes ACROSS insurance policy trees that share the same tomador (partyA).

    Bloque II IF inter-fenómenica: policies held by the same legal entity are
    structurally linked — changes in one policy's risk sub-contracts propagate
    to the corresponding sub-contracts in sibling policies.

    Three cascade types:
      1. partyA change on any master → all sibling insurance masters NEEDS_REVIEW
      2. RIESGO_EMPRESARIAL.riskCategory → PERITACION in the Daños policy
      3. EXCLUSIONES_VIDA.blockingStatus → COBERTURA_RC in the RC policy
    """

    _INSURANCE_MASTER_TYPES = {
        "SEGURO_VIDA", "SEGURO_RC", "SEGURO_DANOS", "SEGURO_CREDITO_COMERCIAL",
    }

    @staticmethod
    def _template_key(contract) -> str:
        try:
            return contract.ag.get("terms", {}).get("templateKey", "") or ""
        except Exception:
            return ""

    def run_partyA_change(
        self,
        source_master_id: str,
        new_partyA: str,
        repo: PhenomenonRepository,
    ) -> CrossPolicyCascadeResult:
        """
        When partyA (tomador) changes on one insurance master:
          - Updates partyA on all sibling insurance masters that share the same original tomador
          - Cascades partyA down to all sub-contracts of each sibling master
        """
        source = repo.get(source_master_id)
        source_template = self._template_key(source)

        all_contracts = repo.list_all() if hasattr(repo, "list_all") else []
        sibling_masters = [
            c for c in all_contracts
            if c.id != source_master_id
            and c.parentId is None
            and self._template_key(c) in self._INSURANCE_MASTER_TYPES
        ]

        sub_engine = CascadeEngine()
        trace = []
        all_affected_ids = []
        for master in sibling_masters:
            m_template = self._template_key(master)
            # Use CascadeEngine to update partyA on the sibling master AND all its subs
            result = sub_engine.run(master.id, "partyA", new_partyA, repo)
            all_affected_ids.append(master.id)
            all_affected_ids.extend(result.affected_ids)
            trace.append({
                "phenomenon_id": master.id,
                "name": master.name,
                "type": m_template or master.type,
                "triggered_by": f"cross-policy partyA change on {source_template or source.type}",
                "new_status": "MODIFIED",
                "vector": f"IF_cross_policy(tomador:{source_template}→{m_template})",
                "subs_updated": len(result.affected_ids),
            })

        return CrossPolicyCascadeResult(
            source_id=source_master_id,
            source_type=source_template or source.type,
            field="partyA",
            new_value=new_partyA,
            affected_ids=all_affected_ids,
            trace=trace,
        )

    def run_sub_change(
        self,
        source_id: str,
        field: str,
        new_value: str,
        repo: PhenomenonRepository,
    ) -> CrossPolicyCascadeResult:
        """
        When a sub-contract field changes, check CROSS_POLICY_CASCADE_MAP for
        target sub-types in other policy trees with the same tomador.
        """
        source = repo.get(source_id)
        if not source or not source.parentId:
            return CrossPolicyCascadeResult(
                source_id=source_id, source_type="UNKNOWN", field=field, new_value=new_value
            )

        target_types = CROSS_POLICY_CASCADE_MAP.get(source.type, {}).get(field, [])
        if not target_types:
            return CrossPolicyCascadeResult(
                source_id=source_id, source_type=source.type, field=field, new_value=new_value
            )

        source_master = repo.get(source.parentId)
        original_partyA = source_master.ess.partyA

        all_contracts = repo.list_all() if hasattr(repo, "list_all") else []
        targets = [
            c for c in all_contracts
            if c.type in target_types
            and c.parentId is not None
            and c.id != source_id
        ]
        # Filter to same tomador (partyA on the target's master must match)
        same_tomador_targets = []
        for t in targets:
            t_master = repo.get(t.parentId)
            if t_master and t_master.ess.partyA == original_partyA:
                same_tomador_targets.append(t)

        trace = []
        for target in same_tomador_targets:
            updated = target.model_copy(update={
                "status": "NEEDS_REVIEW",
                "opus": target.opus.model_copy(update={"homologation": "PENDING"}),
            })
            repo.save(updated)
            trace.append({
                "phenomenon_id": target.id,
                "name": target.name,
                "type": target.type,
                "triggered_by": f"cross-policy {source.type}.{field} change",
                "new_status": "NEEDS_REVIEW",
                "vector": f"IF_cross_policy({source.type}→{target.type})",
            })

        return CrossPolicyCascadeResult(
            source_id=source_id,
            source_type=source.type,
            field=field,
            new_value=new_value,
            affected_ids=[t.id for t in same_tomador_targets],
            trace=trace,
        )


@dataclass
class ReverseCascadeResult:
    source_id: str
    source_type: str
    field: str
    master_id: str
    reason: str
    triggered: bool = False


class ReverseCascadeEngine:
    """
    Propagates AG.terms changes from a sub-contract back up to the master.

    Bloque II: the master phenomenon absorbs operational changes from its children
    via the IF layer — the master's Opus is affected when sub-contract operational
    vectors shift significantly. The master gets NEEDS_REVIEW (not ESS overwrite)
    so the user must consciously validate the change at the top level.
    """

    def run(
        self,
        source_id: str,
        field: str,
        new_value: str,
        repo: PhenomenonRepository,
    ) -> ReverseCascadeResult:
        source = repo.get(source_id)
        if not source or not source.parentId:
            return ReverseCascadeResult(source_id=source_id, source_type="UNKNOWN",
                                        field=field, master_id="", reason="")

        reason = REVERSE_CASCADE_MAP.get(source.type, {}).get(field, "")
        if not reason:
            return ReverseCascadeResult(source_id=source_id, source_type=source.type,
                                        field=field, master_id=source.parentId, reason="")

        master = repo.get(source.parentId)
        if not master:
            return ReverseCascadeResult(source_id=source_id, source_type=source.type,
                                        field=field, master_id=source.parent_id, reason=reason)

        updated_master = master.model_copy(
            update={
                "status": "NEEDS_REVIEW",
                "opus": master.opus.model_copy(update={"homologation": "PENDING"}),
            }
        )
        repo.save(updated_master)

        try:
            from .event_engine import default_bus
            from .theoretical_models import PhenomenonEvent
            from .enums import EventType
            from datetime import datetime, timezone
            default_bus.emit(PhenomenonEvent(
                event_type=EventType.ON_INTERRUPT,
                phenomenon_id=master.id,
                source_operation="reverse_cascade_interrupt",
                payload={"reason": f"Reverse IF: {source.type}.{field} changed",
                         "source_id": source_id, "new_state": "INTERRUPTED (NEEDS_REVIEW)"},
                timestamp=datetime.now(timezone.utc).isoformat(),
            ))
        except Exception:
            pass

        return ReverseCascadeResult(
            source_id=source_id,
            source_type=source.type,
            field=field,
            master_id=master.id,
            reason=reason,
            triggered=True,
        )


# ─────────────────────────────────────────────────────────────────────────────
# PHENOMENON III — F1/F2/F3 Insurance Chain Functions
# Source: PHENOMENON_III_Flujograma_fenomenologico_del_seguro.docx
#
# These functions implement the three-phenomenon structure of any insurance
# product. They are standalone (not methods on CascadeEngine) and purely additive.
# All existing cascade logic above is untouched.
# ─────────────────────────────────────────────────────────────────────────────

from dataclasses import dataclass as _dc
import uuid as _uuid


@_dc
class F2OpenResult:
    """Result of opening an F2 Claim phenomenon from an F1 Coverage phenomenon."""
    f1_id: str
    f2_id: str
    f2_type: str
    cst_cause: str
    estimated_damage: float
    negaciones: list


@_dc
class F3OpenResult:
    """Result of opening an F3 Recovery phenomenon from an F2 Claim phenomenon."""
    f2_id: str
    f3_id: str
    f3_type: str
    culpable_party: str
    legal_basis: str


def open_f2_on_siniestro(
    f1_id: str,
    cst_cause: str,
    estimated_damage: float,
    repo: "PhenomenonRepository",
) -> F2OpenResult:
    """
    PHENOMENON III §5 — Open F2 (Claim/Indemnification) from F1 (Coverage).

    F2 is NOT pre-existing. It is created only when a specific loss event (CST)
    actualises the ferencia sensual of F1. This is not a debt payment, not
    solventio (Art. 1158 CC), and not automatic subrogation.

    Legal basis: Art. 1089 CC (origin of obligations).

    Guards enforced:
    - F1 must exist and have phenomenological_phase = "F1"
    - F1 must be ACTIVE (coverage must be live)
    - F2 negaciones are stored on the new record for downstream enforcement
    """
    from .enums import InsuranceNegacion

    f1 = repo.get(f1_id)
    if f1 is None:
        raise ValueError(f"F1 phenomenon {f1_id} not found — cannot open F2")

    if f1.phenomenological_phase not in ("F1", None):
        raise ValueError(
            f"Phenomenon {f1_id} has phase '{f1.phenomenological_phase}', not F1 — "
            "F2 can only be opened from an F1 coverage phenomenon"
        )

    if f1.status not in ("ACTIVE", "DRAFT", "MODIFIED"):
        raise ValueError(
            f"F1 phenomenon {f1_id} has status '{f1.status}' — "
            "coverage must be active to open a claim"
        )

    # Derive F2 type from F1 type (e.g. SEGURO_VIDA_F1 → SEGURO_VIDA_F2)
    f1_type = f1.type
    if f1_type.endswith("_F1"):
        f2_type = f1_type[:-3] + "_F2"
    else:
        f2_type = f1_type + "_F2"

    negaciones = [
        InsuranceNegacion.NOT_SOLVENTIO.value,
        InsuranceNegacion.NOT_DEBT_PAYMENT.value,
        InsuranceNegacion.NOT_AUTO_SUBROGATION.value,
    ]

    f2 = PhenomenonRecord(
        id=f"f2-{_uuid.uuid4().hex[:10]}",
        type=f2_type,
        name=f"F2 — {f1.name.replace('F1 — ', '').replace('F1', '').strip()} — Claim",
        status="ACTIVE",
        ess=f1.ess,
        ag={
            "clauses": [
                f"Indemnification opened by CST event: {cst_cause}",
                "Art. 1089 CC — basis for obligation (bajando a hipótesis)",
                "NOT Art. 1158 CC solventio — insurer does not pay another party's debt",
                "NOT automatic subrogation — F3 is a separate eventual phenomenon",
            ],
            "terms": {
                "cst_cause": cst_cause,
                "estimated_damage": str(estimated_damage),
                "f1_id": f1_id,
                "opened_from": "CST_trigger",
            },
        },
        ia_instances=["ad-actio"],
        opus=f1.opus.model_copy(update={"homologation": "PENDING"}),
        parentId=f1_id,
        phenomenological_phase="F2",
        ferencia_sensual=f1.ferencia_sensual,
        legal_basis="Art. 1089 CC (origin of obligations, indemnification hypothesis)",
        negaciones=negaciones,
        cst_trigger_id=f1_id,
    )

    repo.save(f2)

    return F2OpenResult(
        f1_id=f1_id,
        f2_id=f2.id,
        f2_type=f2_type,
        cst_cause=cst_cause,
        estimated_damage=estimated_damage,
        negaciones=negaciones,
    )


def open_f3_on_culpable(
    f2_id: str,
    culpable_party: str,
    repo: "PhenomenonRepository",
    legal_basis: str = "Art. 1902 CC · Art. 1089 CC",
) -> F3OpenResult:
    """
    PHENOMENON III §6 — Open F3 (Recovery) from F2 (Claim).

    F3 is EVENTUAL and INDEPENDENT. It opens only after F2 exists AND a culpable
    third party has been identified. It is its own legal path via Art. 1902 CC —
    NOT a reflex of F2 and NOT automatic subrogation.

    Guards enforced:
    - F2 must exist and have phenomenological_phase = "F2"
    - culpable_party must be provided (non-empty)
    - F3 is linked to F2 via culpable_trigger_id, NOT to F1
    """
    f2 = repo.get(f2_id)
    if f2 is None:
        raise ValueError(f"F2 phenomenon {f2_id} not found — cannot open F3")

    if f2.phenomenological_phase != "F2":
        raise ValueError(
            f"Phenomenon {f2_id} has phase '{f2.phenomenological_phase}', not F2 — "
            "F3 can only be opened from an F2 claim phenomenon"
        )

    if not culpable_party or not culpable_party.strip():
        raise ValueError("culpable_party is required to open F3 — F3 is conditional on identification of a liable party")

    f2_type = f2.type
    if f2_type.endswith("_F2"):
        f3_type = f2_type[:-3] + "_F3"
    else:
        f3_type = f2_type + "_F3"

    f3 = PhenomenonRecord(
        id=f"f3-{_uuid.uuid4().hex[:10]}",
        type=f3_type,
        name=f"F3 — Recovery — {culpable_party}",
        status="ACTIVE",
        ess=f2.ess,
        ag={
            "clauses": [
                f"Recovery claim against culpable party: {culpable_party}",
                f"Legal basis: {legal_basis}",
                "INDEPENDENT legal path — NOT a reflex of F2 indemnification",
                "NOT automatic subrogation — this is a separate phenomenon (F3)",
            ],
            "terms": {
                "culpable_party": culpable_party,
                "f2_id": f2_id,
                "legal_basis": legal_basis,
                "opened_from": "culpable_trigger",
            },
        },
        ia_instances=["ad-actio"],
        opus=f2.opus.model_copy(update={"homologation": "PENDING"}),
        parentId=f2_id,
        phenomenological_phase="F3",
        ferencia_sensual=f2.ferencia_sensual,
        legal_basis=legal_basis,
        negaciones=[],
        culpable_trigger_id=f2_id,
    )

    repo.save(f3)

    return F3OpenResult(
        f2_id=f2_id,
        f3_id=f3.id,
        f3_type=f3_type,
        culpable_party=culpable_party,
        legal_basis=legal_basis,
    )
