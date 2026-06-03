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


# ── PHENOMENON III — Insurance F1/F2/F3 enums ────────────────────────────────
# Source: PHENOMENON_III_Flujograma_fenomenologico_del_seguro.docx
#         PHENOMENON_III_Seguro_y_EDCO_EDCIB_fractalizado.docx (fractalization)
# These enums are purely additive — nothing above this line is changed.

class InsurancePhase(str, Enum):
    """
    PHENOMENON III §4-6 — the three connected phenomena of any insurance product.
    F1 always exists. F2 opens only when a CST (specific loss event) occurs.
    F3 is eventual — only if a culpable party is identified after F2.
    """
    F1 = "F1"  # Aseguramiento / Coverage (IA co-activa, always active)
    F2 = "F2"  # Siniestro / Indemnification (created on CST event, NOT debt payment)
    F3 = "F3"  # Reclamación / Recovery (eventual, Art. 1902 CC, own legal path)


class SECType(str, Enum):
    """
    PHENOMENON III §4.3-4.4 — Consequential Effect Classes (SEC).
    Modulation layers of F1 coverage. All three operate before any claim occurs.
    """
    DE  = "DE"   # Daño Emergente — direct loss, first modulation layer of coverage
    DS  = "DS"   # Daño Siguiente — consequential loss, second modulation layer
    OBC = "OBC"  # O(b)creencia — observed pro-sequences without direct causality


class IFTriggerType(str, Enum):
    """
    PHENOMENON III §5-6 — types of inter-phenomenon trigger for insurance chains.
    Distinct from standard IF links: these open NEW phenomena conditionally.
    """
    SINIESTRO = "siniestro_cst"  # CST event triggers creation of F2 from F1
    CULPABLE  = "culpable_id"    # Culpable party identified triggers creation of F3 from F2
    MANUAL    = "manual"         # Standard manually-created IF (existing behaviour)


class InsuranceNegacion(str, Enum):
    """
    PHENOMENON III §5.2 — explicit negations enforced in F2 indemnification.
    The engine uses these as guards: if any of these is attempted in F2, reject.
    """
    NOT_SOLVENTIO        = "NOT_SOLVENTIO_1158"      # NOT Art. 1158 CC solventio
    NOT_DEBT_PAYMENT     = "NOT_DEBT_PAYMENT"         # NOT paying another party's debt
    NOT_AUTO_SUBROGATION = "NOT_AUTO_SUBROGATION"     # NOT automatic subrogation into culpable's debt


class CoverageType(str, Enum):
    """
    PHENOMENON III — P1/F1 coverage sub-types (fractalization).
    Source: PHENOMENON_III_Seguro_y_EDCO_EDCIB_fractalizado.docx §V.1
    """
    P1_BIEN_PRINCIPAL    = "P1.1"  # Coverage of main asset/property
    P1_RESPONSABILIDAD   = "P1.2"  # Liability coverage (third-party claims)
    P1_CARGA_MERCANCIA   = "P1.3"  # Cargo/merchandise/associated value
    P1_DANO_SIGUIENTE    = "P1.4"  # Consequential loss / operational interruption
    P1_FINANCIERA        = "P1.5"  # Financial / parametric coverage


class FerenciaType(str, Enum):
    """
    PHENOMENON III — P2/F2 ferencia sub-types (fractalization).
    Source: PHENOMENON_III_Seguro_y_EDCO_EDCIB_fractalizado.docx §V.2
    These are the types of insured ferencia that a siniestro can actualise.

    Relationship to SECType (F1) — these are NOT duplicates:
      SECType.DE / DS / OBC (enums.py, above) model coverage modulation on F1.
      They represent risk expectations constituted BEFORE any siniestro occurs.
      FerenciaType members model actualized losses realized on F2 AFTER a CST event.
      Same legal labels (DE/DS), different phenomenological moment:
        F1 SECType  = potential coverage layer (the insurance is prepared for this)
        F2 FerenciaType = the actual ferencia that the siniestro has activated
      A siniestro that activates SECType.DE coverage on F1 produces a
      FerenciaType.DE_SINIESTRO_MATERIAL or DE_DANO_EMERGENTE ferencia on F2.
    """
    DE_SINIESTRO_MATERIAL  = "P2.1"  # Direct material loss (Daño Emergente principal)
    DE_DANO_EMERGENTE      = "P2.2"  # Immediate repair/replacement costs
    DS_DANO_SIGUIENTE      = "P2.3"  # Consequential loss (not identical to initial damage)
    INTERRUPCION_OPERATIVA = "P2.4"  # Functional/productive ferencia
    RECLAMACIONES_CRUZADAS = "P2.5"  # Cross-claims between multiple subjects/insurers


class ReclamacionType(str, Enum):
    """
    PHENOMENON III — P3/F3 post-claim recovery sub-types (fractalization).
    Source: PHENOMENON_III_Seguro_y_EDCO_EDCIB_fractalizado.docx §V.3
    """
    CAUSANTE_DIRECTO     = "P3.1"  # Direct culpable party
    OPERADOR_TERCERO     = "P3.2"  # Operator / transporter / maintainer
    CONTRACTUAL          = "P3.3"  # Contractual recovery basis
    EXTRACONTRACTUAL     = "P3.4"  # Extra-contractual (tort) recovery basis
    ENTRE_ASEGURADORAS   = "P3.5"  # Inter-insurer recovery / concurrence
