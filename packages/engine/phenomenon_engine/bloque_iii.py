"""
BLOQUE III — Acción en PHENOMENON
(source: Bloque_III.docx)

Core axioms:
  1. Acción = IA vectorizada en el acetato
  2. Acción como flujo: circula, no ocurre
  3. Tiempo (IST) = continuidad del vector
  4. Duración y perduración
  5. Modulación: interrupción, suspensión, frecuencia
  6. Plicación: implicación y co-implicación
  7. Espacio y tiempo = relaciones (IST)

INTERPRETATION:

1. ACTION = VECTORIZED IA IN THE ACETATO:
   The action is not abstract — it is a SPECIFIC vectorized IA operating
   within a concrete phenomenon (acetato). The same IA template (librería)
   can produce different actions in different acetatos.

2. ACTION AS FLOW (not event):
   "Circula, no ocurre" — action is not a one-time event that happens and ends.
   It CIRCULATES continuously within the phenomenon.
   → This explains why our state machine has ACTIVE and STABLE (sustained states)
     rather than just "happened/didn't happen".

3. TIME (IST) = CONTINUITY OF THE VECTOR:
   IST = possibly "Instancia Sujeto-Temporal" or relational space-time.
   Time in PHENOMENON is not absolute — it is the CONTINUITY of the vector.
   A vector that persists through time IS time for that phenomenon.
   → effectiveDate/expiryDate in contracts define the IST of the contract vector.

4. DURATION vs ENDURANCE:
   Duración    = how long the phenomenon lasts (measured duration)
   Perduración = the phenomenon's capacity to persist despite perturbations
   → A valid contract has both: a defined duration AND the capacity to endure.

5. THREE MODULATION TYPES (critical — we were missing 2!):
   Interrupción  → PERMANENT halt (INTERRUPTED state) ✓ implemented
   Suspensión    → TEMPORARY pause (SUSPENDED state) — NOW ADDED to enums
   Frecuencia    → RHYTHMIC recurrence — interval/rate at which action repeats

6. PLICATION HAS TWO SUBTYPES:
   Implicación    → one-way fold: A implies B (A → B), B is bound to A
   Co-implicación → mutual fold: A and B imply each other (A ⇄ B)
   → Maps to: ad-actio (implication, one party acts), co-implication (mutual)

7. SPACE AND TIME = RELATIONS (IST):
   "Espacio y tiempo = relaciones (IST)"
   Neither space nor time is absolute in PHENOMENON.
   Both are RELATIONAL — they exist only as relations between phenomena.
   → Jurisdiction (space) and dates (time) are CA1 circumactions defining
     the relational context of the phenomenon, not absolute coordinates.
"""
from dataclasses import dataclass
from typing import Optional
from .enums import PhenomenonState, PlicationType


# ── Temporal model ────────────────────────────────────────────────────────────

@dataclass
class IST:
    """
    Bloque III — Relational Space-Time (IST).
    Space and time are relations, not absolute coordinates.

    In the contracts domain:
      spatial_relation  = jurisdiction (where the relation exists)
      temporal_start    = effectiveDate (when the vector begins)
      temporal_end      = expiryDate    (when the vector terminates)
    """
    spatial_relation: str  = ""   # jurisdiction, territory
    temporal_start:   str  = ""   # effectiveDate
    temporal_end:     str  = ""   # expiryDate
    duration_label:   str  = ""   # human description of duration
    perdurant:        bool = True  # can it endure perturbations?

    @property
    def is_defined(self) -> bool:
        return bool(self.spatial_relation and self.temporal_start and self.temporal_end)

    def to_dict(self) -> dict:
        return {
            "spatial_relation": self.spatial_relation,
            "temporal_start":   self.temporal_start,
            "temporal_end":     self.temporal_end,
            "perdurant":        self.perdurant,
            "ist_defined":      self.is_defined,
            "note": (
                "Bloque III: 'Espacio y tiempo = relaciones (IST).' "
                "Jurisdiction = spatial relation; dates = temporal boundaries of the vector."
            ),
        }


# ── Frequency modulation ──────────────────────────────────────────────────────

@dataclass
class FrequencyModulation:
    """
    Bloque III §5 — Frequency as the third type of modulation.
    (Interruption and Suspension are covered in PhenomenonState.)

    Frequency = the rhythmic recurrence of an action within a phenomenon.
    A phenomenon with frequency is not one-time but periodic.

    Examples:
      - Monthly billing (PAYMENT contracts): frequency = monthly
      - Quarterly SLA reviews: frequency = quarterly
      - Annual contract renewal: frequency = annual
    """
    interval: str    = ""       # daily | weekly | monthly | quarterly | annual | custom
    count:    int    = 0        # how many repetitions (0 = indefinite)
    phase:    str    = ""       # at what point in the cycle does the action occur
    active:   bool   = True

    def to_dict(self) -> dict:
        return {
            "interval": self.interval,
            "count": self.count,
            "phase": self.phase,
            "active": self.active,
            "note": "Bloque III: 'Modulación: interrupción, suspensión, frecuencia.' Frequency = rhythmic recurrence of the action.",
        }


# ── Suspension operation ──────────────────────────────────────────────────────

class SuspensionEngine:
    """
    Bloque III §5 — Suspensión (temporary pause), distinct from Interrupción.

    SUSPENSION  → temporary; the phenomenon PAUSES but can RESUME
    INTERRUPTION → can be permanent; may require a restart

    In contracts:
      Suspension: force majeure clause activates → contract pauses → resumes
      Interruption: material breach → contract may terminate

    State transitions:
      ACTIVE → SUSPENDED → ACTIVE  (suspension lifecycle)
      ACTIVE → INTERRUPTED          (interruption — may not recover)
    """

    def suspend(
        self,
        current_state: PhenomenonState,
        reason: str = "",
    ) -> tuple[bool, PhenomenonState, str]:
        """
        Suspend a phenomenon temporarily.
        Returns (success, new_state, message).
        """
        if current_state not in (PhenomenonState.ACTIVE, PhenomenonState.STABLE):
            return False, current_state, (
                f"No se puede suspender desde el estado {current_state.value}. "
                "Solo desde ACTIVE o STABLE."
            )
        return True, PhenomenonState.SUSPENDED, (
            f"Fenómeno suspendido temporalmente. Motivo: {reason or 'no especificado'}. "
            "Puede reanudarse (→ ACTIVE)."
        )

    def resume(
        self,
        current_state: PhenomenonState,
    ) -> tuple[bool, PhenomenonState, str]:
        """Resume a suspended phenomenon."""
        if current_state != PhenomenonState.SUSPENDED:
            return False, current_state, (
                f"No se puede reanudar desde {current_state.value}. "
                "Solo desde SUSPENDED."
            )
        return True, PhenomenonState.ACTIVE, (
            "Fenómeno reanudado. Estado: SUSPENDED → ACTIVE."
        )


# ── Plication subtypes ────────────────────────────────────────────────────────

class PlicationEngine:
    """
    Bloque III §6 — Plicación: implicación y co-implicación.

    IMPLICATION (one-way):
      A vectorizes toward B.
      B is bound by A's action.
      A is the active party; B is the receiving party.
      → Contract domain: one party has an active obligation to the other.
        "ad-actio" maps to this.

    CO-IMPLICATION (mutual):
      A and B are mutually vectorized toward each other.
      Both are simultaneously active and receiving.
      → Contract domain: both parties are mutually bound.
        "co-implication" maps to this exactly.
    """

    @staticmethod
    def classify(ia_label: str) -> PlicationType:
        """Classify a contract-domain IA label into its plication type."""
        MUTUAL = {"co-implication"}
        ONE_WAY = {"ad-actio", "de-actio", "non"}
        if ia_label in MUTUAL:
            return PlicationType.CO_IMPLICATION
        if ia_label in ONE_WAY:
            return PlicationType.IMPLICATION
        return PlicationType.IMPLICATION  # default

    @staticmethod
    def describe(plication_type: PlicationType, party_a: str = "A", party_b: str = "B") -> str:
        if plication_type == PlicationType.CO_IMPLICATION:
            return (
                f"Co-implicación: {party_a} y {party_b} se implican mutuamente. "
                f"Ambas partes son simultáneamente activas y receptoras. "
                f"La obligación es recíproca e igualmente vinculante."
            )
        return (
            f"Implicación: {party_a} se implica hacia {party_b}. "
            f"{party_a} es la parte activa; {party_b} recibe la implicación. "
            f"La obligación fluye en una dirección."
        )
