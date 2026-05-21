from enum import Enum


# ── Domain-level enums (contracts application) ────────────────────────────────

class ContractType(str, Enum):
    MASTER = "MASTER"
    NDA = "NDA"
    SLA = "SLA"
    PAYMENT = "PAYMENT"
    IP = "IP"
    DPA = "DPA"


class ContractStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    MODIFIED = "MODIFIED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    TERMINATED = "TERMINATED"


class Homologation(str, Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    PENDING = "PENDING"


class VectorLation(str, Enum):
    BINDING = "binding"
    CONDITIONAL = "conditional"
    PERMISSIVE = "permissive"
    DERIVED = "derived"


# Contract-domain IA labels (used by frontend / contracts app)
class IATypeCode(str, Enum):
    AD_ACTIO = "ad-actio"
    DE_ACTIO = "de-actio"
    NON = "non"
    CO_IMPLICATION = "co-implication"


# ── Theoretical PHENOMENON enums (Bloques 1-9) ───────────────────────────────
# Reference: PHENOMENON CORE — Data Model v1.0

class PhenomenonState(str, Enum):
    """
    Full state machine from Bloque 7 / Data Model §4.1.
    Extended with SUSPENSION from Bloque III.

    Bloque III — three modulation types:
      Interrupción  → the phenomenon STOPS permanently       → INTERRUPTED
      Suspensión    → the phenomenon PAUSES temporarily      → SUSPENDED (new)
      Frecuencia    → the phenomenon recurs rhythmically     → tracked via FrequencyModulation

    Maps to ContractStatus in the contracts domain:
      INITIALIZED  → DRAFT
      ACTIVE       → ACTIVE
      STABLE       → ACTIVE (sustained)
      SUSPENDED    → (paused, can resume — e.g. force majeure)
      INTERRUPTED  → NEEDS_REVIEW
      TERMINATED   → TERMINATED
    """
    INITIALIZED  = "INITIALIZED"
    ACTIVE       = "ACTIVE"
    STABLE       = "STABLE"
    SUSPENDED    = "SUSPENDED"    # Bloque III — temporary pause (suspensión)
    INTERRUPTED  = "INTERRUPTED"
    TERMINATED   = "TERMINATED"


class PlicationType(str, Enum):
    """
    Bloque III — Plicación has two subtypes:
      IMPLICATION    → one-way plication (the action folds toward one target)
      CO_IMPLICATION → mutual plication (both parties are equally bound)

    Maps to contracts domain:
      IMPLICATION    ≈ ad-actio  (one party has active obligation toward the other)
      CO_IMPLICATION ≈ co-implication (both parties mutually bound)
    """
    IMPLICATION    = "implication"
    CO_IMPLICATION = "co-implication"


class PhenomenonType(str, Enum):
    """Bloque 2 — the three fundamental phenomenon types."""
    ABSTRACT   = "ABSTRACT"    # purely conceptual phenomenon
    CONCRETE   = "CONCRETE"    # materially realised phenomenon
    SIMULATED  = "SIMULATED"   # projected / hypothetical phenomenon


class ActionSubtype(str, Enum):
    """
    Bloque 3 — Action (A1) subtypes.
    Every Phenomenon has exactly one PRIMARY action;
    secondary and derived actions emerge from interaction.
    """
    PRIMARY   = "PRIMARY"    # the foundational action of the phenomenon
    SECONDARY = "SECONDARY"  # emerges from interaction with another phenomenon
    DERIVED   = "DERIVED"    # produced by modulation (IA application)


class ActionStatus(str, Enum):
    """Bloque 3 — state of the A1 action node."""
    ACTIVE   = "ACTIVE"
    INACTIVE = "INACTIVE"
    BLOCKED  = "BLOCKED"


class IAFormType(str, Enum):
    """
    Bloque 7 §4 — theoretical IA forms (modulators of operations).
    These are HOW an operation executes, not what it does.
    Distinct from Level-1 operations (interrupt/continue/distribute).

    Mapping to contract-domain labels (approximate):
      DIRECTION  ≈ ad-actio   (forward obligation vector)
      RETROACTION≈ de-actio   (reversal / removal)
      POSITION   ≈ non        (positional prohibition)
      PLICATION  ≈ co-implication (recursive mutual replication)
      SENSE      — not yet mapped to contract domain
    """
    RETROACTION = "retroaction"   # reverses edge direction
    PLICATION   = "plication"     # replicates the interaction recursively
    DIRECTION   = "direction"     # enforces a vector/directional constraint
    POSITION    = "position"      # alters node hierarchy / positional relationship
    SENSE       = "sense"         # modifies polarity of the interaction
    OTHER       = "other"


class IAMode(str, Enum):
    """Bloque 7 — whether the interaction is active or passive."""
    ACTIVE  = "ACTIVE"
    PASSIVE = "PASSIVE"


class IAPolarity(str, Enum):
    """Bloque 7 — the polarity carried by an interaction."""
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    NEUTRAL  = "NEUTRAL"


class CircumactionLevel(str, Enum):
    """
    Bloque 2 — the two levels of circumaction (CA).
    CA1 = immediate boundary (directly wrapping the phenomenon)
    CA2 = contextual boundary (external environment/condition)
    """
    CA1 = "CA1"
    CA2 = "CA2"


class CircumactionFunction(str, Enum):
    """Bloque 2 — what the circumaction does."""
    BOUNDARY  = "BOUNDARY"   # defines the limits of the phenomenon
    CONDITION = "CONDITION"  # sets a condition for activation / resolution
    CONTEXT   = "CONTEXT"    # provides environmental context
    MODIFIER  = "MODIFIER"   # alters behaviour of enclosed elements


class OperationType(str, Enum):
    """
    Bloque 4 — the three universal operations of the motor.
    These are WHAT the motor does; IA forms are HOW it does it.
    """
    CONTINUE   = "continue"    # maintain the phenomenon in its current state
    INTERRUPT  = "interrupt"   # halt the phenomenon or a line of development
    DISTRIBUTE = "distribute"  # branch the phenomenon into multiple trajectories


class EventType(str, Enum):
    """Bloque 7 §7 — event types emitted by the motor."""
    ON_CREATE     = "ON_CREATE"
    ON_UPDATE     = "ON_UPDATE"
    ON_INTERRUPT  = "ON_INTERRUPT"
    ON_DISTRIBUTE = "ON_DISTRIBUTE"
    ON_TERMINATE  = "ON_TERMINATE"
