"""
Bridge — connects the domain layer (contracts) to the theoretical layer (Bloques I-IX).

The domain layer (PhenomenonRecord) is an APPLICATION of PHENOMENON theory
to the contracts domain. This module formalises that relationship so that:

  1. HomologationEngine uses theoretical validate_structure() — rigorous
  2. IAEngine uses superimposition semantics from Bloque II — precise
  3. CascadeEngine maps to DISTRIBUTE/INTERRUPT operations — coherent
  4. ContractStatus maps to PhenomenonState — consistent state machine

WITHOUT this bridge the theoretical models are unused dead code.
WITH this bridge the domain layer is formally grounded in Bloques I-IX.
"""
import uuid as _uuid
from .models import PhenomenonRecord
from .enums import (
    PhenomenonState, PhenomenonType,
    ActionSubtype, ActionStatus,
    IAFormType, IAMode, IAPolarity,
    CircumactionLevel, CircumactionFunction,
    ContractStatus,
)
from .theoretical_models import (
    TheoreticalPhenomenon, Action, IAInteraction, Circumaction,
)
from .ia_modulation_engine import IAModulationEngine


# ── Status mapping (Bloque III state machine) ─────────────────────────────────
_STATUS_MAP: dict[str, PhenomenonState] = {
    ContractStatus.DRAFT:         PhenomenonState.INITIALIZED,
    ContractStatus.ACTIVE:        PhenomenonState.ACTIVE,
    ContractStatus.MODIFIED:      PhenomenonState.ACTIVE,   # modified but still active
    ContractStatus.NEEDS_REVIEW:  PhenomenonState.INTERRUPTED,
    ContractStatus.TERMINATED:    PhenomenonState.TERMINATED,
    # New state from Bloque III (force majeure, pause):
    "SUSPENDED":                  PhenomenonState.SUSPENDED,
}

_REVERSE_STATUS_MAP: dict[PhenomenonState, str] = {
    PhenomenonState.INITIALIZED: ContractStatus.DRAFT,
    PhenomenonState.ACTIVE:      ContractStatus.ACTIVE,
    PhenomenonState.STABLE:      ContractStatus.ACTIVE,
    PhenomenonState.SUSPENDED:   "SUSPENDED",
    PhenomenonState.INTERRUPTED: ContractStatus.NEEDS_REVIEW,
    PhenomenonState.TERMINATED:  ContractStatus.TERMINATED,
}


def contract_to_theoretical(record: PhenomenonRecord) -> TheoreticalPhenomenon:
    """
    Convert a domain PhenomenonRecord to a TheoreticalPhenomenon.

    Bloque I  — Ess = being (partyA/B, jurisdiction, dates → CA1 circumactions)
    Bloque II — Ag clauses become IA interactions; each IA label maps to IAFormType
    Bloque V  — Center=A1, Orbit=IA interactions, Periphery=CA circumactions
    """
    ph_id = record.id

    # CENTER (A1) — the primary contractual act (Bloque I: Ager)
    # Potency reflects how complete the contract is (Bloque III: IST)
    ess = record.ess.model_dump()
    ess_complete = all(bool(v) for v in ess.values())
    has_clauses  = bool(record.ag.get("clauses"))

    center = Action(
        id=str(_uuid.uuid4()),
        phenomenon_id=ph_id,
        subtype=ActionSubtype.PRIMARY,
        status=ActionStatus.ACTIVE if ess_complete and has_clauses else ActionStatus.INACTIVE,
        potency_level=1.0 if ess_complete and has_clauses else 0.4,
        activation_flag=ess_complete,
        description=f"Acto contractual: {record.name}",
    )

    # ORBIT (IA interactions) — each IA label → theoretical IAFormType (Bloque II)
    interactions: list[IAInteraction] = []
    for ia_label in (record.ia_instances or []):
        form = IAModulationEngine.contract_label_to_ia_form(ia_label)
        polarity = (
            IAPolarity.POSITIVE if form in (IAFormType.DIRECTION, IAFormType.PLICATION)
            else IAPolarity.NEGATIVE
        )
        interactions.append(IAInteraction(
            id=str(_uuid.uuid4()),
            phenomenon_id=ph_id,
            form_type=form,
            mode=IAMode.ACTIVE,
            intensity=1.0,
            polarity=polarity,
            source_id=center.id,
            # Bloque II: IA intrafenoménica — target is the phenomenon itself.
            # The obligation applies WITHIN this phenomenon (looping back to the
            # action node). IF connections (between phenomena) set a different target.
            target_id=ph_id,
            description=f"Operador contractual intrafenoménico: {ia_label} ({form.value})",
        ))

    # PERIPHERY (CA circumactions) — ESS fields as CA1 (Bloque I+II+III)
    # Bloque III: jurisdiction = spatial relation (CA1), dates = temporal continuity (CA1)
    periphery: list[Circumaction] = []
    ca1_fields = {
        "partyA": "Parte A (Ser — identidad contractual)",
        "partyB": "Parte B (Ser — identidad contractual)",
        "jurisdiction": "Jurisdiccion (IST — relacion espacial)",
        "effectiveDate": "Fecha inicio (IST — inicio de la continuidad del vector)",
        "expiryDate": "Fecha vencimiento (IST — termino de la continuidad del vector)",
    }
    for field, desc in ca1_fields.items():
        val = ess.get(field, "")
        periphery.append(Circumaction(
            id=str(_uuid.uuid4()),
            phenomenon_id=ph_id,
            level=CircumactionLevel.CA1,
            function=CircumactionFunction.BOUNDARY,
            persistence=True,
            description=desc,
            value=str(val) if val else "",
        ))

    # State mapping (Bloque III state machine)
    theo_state = _STATUS_MAP.get(record.status, PhenomenonState.ACTIVE)

    return TheoreticalPhenomenon(
        id=ph_id,
        name=record.name,
        type=PhenomenonType.CONCRETE,
        state=theo_state,
        action=center,
        interactions=interactions,
        circumactions=periphery,
        connected_to=[],
    )


def theoretical_to_contract_state(state: PhenomenonState) -> str:
    """Map a theoretical state back to a ContractStatus string."""
    return _REVERSE_STATUS_MAP.get(state, ContractStatus.ACTIVE)


def validate_record_theoretically(record: PhenomenonRecord) -> tuple[bool, list[str]]:
    """
    Run theoretical validation on a domain record.
    Uses OperationEngine.validate_structure() from Bloque IX.

    Returns (is_valid, list_of_errors).
    Called by HomologationEngine to formally ground domain validation
    in the theoretical model.
    """
    from .operation_engine import OperationEngine
    theoretical = contract_to_theoretical(record)
    return OperationEngine().validate_structure(theoretical)


def check_ia_superimposition(ia_labels: list[str]) -> dict:
    """
    Check IA superimposition using Bloque II semantics.
    "IA se superponen, no se suman."

    Each IA modulates ONE vector property (Bloque II §3).
    Two IAs modulating the SAME property create interference/conflict.

    This is STRICTER than the simple compatibility list in IAEngine.
    Returns the superimposition analysis dict.
    """
    from .bloque_ii import IARelationEngine
    theo_forms = [IAModulationEngine.contract_label_to_ia_form(ia).value for ia in ia_labels]
    return IARelationEngine.check_superimposition(theo_forms)
