"""
Theoretical PHENOMENON models — Bloques 1-9.
These are the full data model from PHENOMENON CORE v1.0.
They exist alongside the domain-specific PhenomenonRecord (contracts).

Bloque 2 — Structure: Phenomenon → Action(A1) + Interaction(IA) + Circumaction(CA)
Bloque 7 — Motor: three operations modulated by IA forms
"""
from typing import Optional
from pydantic import BaseModel, Field
from .enums import (
    PhenomenonState, PhenomenonType,
    ActionSubtype, ActionStatus,
    IAFormType, IAMode, IAPolarity,
    CircumactionLevel, CircumactionFunction,
    EventType,
)


# ── Action (A1 node) ──────────────────────────────────────────────────────────

class Action(BaseModel):
    """
    Bloque 3 — The A1 node.
    Every Phenomenon has exactly one PRIMARY action.
    Secondary and derived actions may emerge from interactions.
    Constraint: cannot exist without a parent Phenomenon.
    """
    id: str
    phenomenon_id: str
    subtype: ActionSubtype = ActionSubtype.PRIMARY
    status: ActionStatus   = ActionStatus.ACTIVE
    potency_level: float   = 1.0   # 0.0 → inactive, 1.0 → full potency
    activation_flag: bool  = True
    description: str       = ""


# ── Interaction (IA node / edge hybrid) ──────────────────────────────────────

class IAInteraction(BaseModel):
    """
    Bloque 7 §4 — The IA node.
    An interaction is both a node (entity with properties) and an edge
    (it connects a source to a target).  It modulates how an operation executes.

    source_id / target_id can reference: Action.id, IAInteraction.id,
    or Phenomenon.id (see Data Model §2.3).
    """
    id: str
    phenomenon_id: str
    form_type: IAFormType     = IAFormType.DIRECTION
    mode: IAMode              = IAMode.ACTIVE
    intensity: float          = 1.0   # 0.0–1.0
    polarity: IAPolarity      = IAPolarity.POSITIVE
    source_id: str            = ""
    target_id: str            = ""
    description: str          = ""


# ── Circumaction (CA node) ────────────────────────────────────────────────────

class Circumaction(BaseModel):
    """
    Bloque 2 — The CA node.
    Circumactions operate at the boundary of a Phenomenon without being
    directly linked to specific Actions or Interactions.  They can modify
    multiple entities simultaneously.

    CA1 = immediate boundary (wraps the phenomenon directly)
    CA2 = contextual/environmental boundary

    In the contracts domain:
      CA1 examples: jurisdiction, governing law, effective dates
      CA2 examples: force majeure, regulatory environment, market conditions
    """
    id: str
    phenomenon_id: str
    level: CircumactionLevel         = CircumactionLevel.CA1
    function: CircumactionFunction   = CircumactionFunction.BOUNDARY
    persistence: bool                = True   # True = persists across state changes
    affects_ids: list[str]           = Field(default_factory=list)
    description: str                 = ""
    value: Optional[str]             = None   # the concrete value (e.g. "España", "2026-01-01")


# ── Theoretical Phenomenon (full model) ──────────────────────────────────────

class TheoreticalPhenomenon(BaseModel):
    """
    Bloque 1+2 — The root node of the PHENOMENON system.
    A domain-agnostic phenomenon containing A1 + IA + CA.

    Constraints (Data Model §2.1):
      - must contain exactly one Action (subtype=PRIMARY)
      - must allow dynamic mutation of state
      - connected_to is the graph of related phenomena (IF links)
    """
    id: str
    name: str
    type: PhenomenonType         = PhenomenonType.CONCRETE
    state: PhenomenonState       = PhenomenonState.INITIALIZED
    action: Optional[Action]     = None          # A1 — exactly one PRIMARY required
    interactions: list[IAInteraction]  = Field(default_factory=list)
    circumactions: list[Circumaction]  = Field(default_factory=list)
    connected_to: list[str]      = Field(default_factory=list)  # IDs of related phenomena


# ── Event ─────────────────────────────────────────────────────────────────────

class PhenomenonEvent(BaseModel):
    """
    Bloque 7 §7 — An event emitted by the motor.
    Every operation generates at least one event.
    Events trigger rule evaluation and possible state mutation.
    """
    event_type: EventType
    phenomenon_id: str
    source_operation: str        = ""
    payload: dict                = Field(default_factory=dict)
    timestamp: str               = ""


# ── Operation result ──────────────────────────────────────────────────────────

class OperationResult(BaseModel):
    """
    Bloque 7 §5 — Structured result returned by every motor operation.
    """
    operation: str
    phenomenon_id: str
    success: bool
    previous_state: str
    new_state: str
    events_emitted: list[PhenomenonEvent] = Field(default_factory=list)
    message: str = ""
