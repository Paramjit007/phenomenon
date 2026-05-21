"""
BLOQUE II — Estructura del Fenómeno
(source: Bloque_II.docx)

Core axioms:
  1. Relación = resultado de IA vectorizada
  2. IA intrafenoménicas (dentro del F) e interfenoménicas IF (entre F)
  3. Vector: lación, sentido, dirección, posición, plicación
  4. Negación = desplazamiento a otro F
  5. Intermediación = triangulación que crea relación
  6. IA se superponen, no se suman

INTERPRETATION:

1. RELATION = VECTORIZED IA:
   A relation between two things is NOT primitive — it is always the RESULT
   of an IA (interaction) that has been vectorized (given direction and properties).
   Without IA, there is no relation. Every relation in the system is traceable
   to its generating IA.

2. INTRA vs INTER:
   IA INTRAFENOMÉNICA: within ONE phenomenon (A1 ↔ internal interactions)
   IF INTERFENOMÉNICA: between TWO phenomena (F1 ↔ F2 = cascade)
   → Our CascadeEngine IS the IF layer.

3. THE VECTOR HAS 5 PROPERTIES (NOT IA TYPES):
   lación      → the type of binding (binding/conditional/permissive/derived)
   sentido     → the sense/direction of flow (forward/reverse)
   dirección   → the directional target (F1→F2, IF→F, etc.)
   posición    → the positional relationship (OPEN/BLOCKED)
   plicación   → the fold type (implied/explicit/co-implied)

   These ARE the 5 fields in our Vector model — CONFIRMED CORRECT.
   The IA forms (RETROACTION, PLICATION, DIRECTION, POSITION, SENSE) correspond
   to WHICH property of the vector is being modulated by the IA.

4. NEGATION = DISPLACEMENT:
   "Non" (negation) does not simply mean polarity inversion.
   It means the phenomenon is DISPLACED to another phenomenon.
   In law: a prohibition is not just "no" — it redirects to a different
   legal regime (the prohibited thing exists in another phenomenal context).
   → Implication for the engine: POSITION modulation should track the TARGET
     phenomenon the negated phenomenon is displaced to.

5. INTERMEDIATION = TRIANGULATION:
   A mediation/intermediary is not just a middle element —
   it is a TRIANGULATION that CREATES a new relation.
   Without the intermediary, the relation would not exist.
   → In contracts: a guarantor (fiador) is not passive — it creates a NEW
     phenomenon (the guarantee) that wouldn't exist without it.

6. IA OVERLAP, NOT SUM:
   "IA se superponen, no se suman."
   Two IAs applied to the same phenomenon don't produce their arithmetic sum —
   they SUPERIMPOSE, potentially creating interference patterns.
   This is why incompatible IAs CANCEL or CONFLICT, not just "add up".
   → This is the formal justification for our compatibility checking engine.
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class VectorProperties:
    """
    Bloque II — The FIVE properties of every PHENOMENON vector.
    These are CONFIRMED as correct in our existing Vector model.

    lacion    (lación)    → binding type: how the obligation binds
    sentido   (sentido)   → directional sense: which way the vector flows
    direccion (dirección) → the target direction (node/relationship)
    posicion  (posición)  → the positional state (open/blocked/etc.)
    plicacion (plicación) → the plication type (how the fold occurs)
    """
    lacion:    str = "binding"    # binding | conditional | permissive | derived
    sentido:   str = "forward"    # forward | reverse
    direccion: str = "F1→F2"      # F1→F2 | IF→F | etc.
    posicion:  str = "OPEN"       # OPEN | BLOCKED
    plicacion: str = "explicit"   # implied | explicit | co-implied

    def is_active(self) -> bool:
        return self.posicion == "OPEN" and self.lacion != "derived"

    def to_dict(self) -> dict:
        return {
            "lacion": self.lacion, "sentido": self.sentido,
            "direccion": self.direccion, "posicion": self.posicion,
            "plicacion": self.plicacion,
        }


class IARelationEngine:
    """
    Bloque II — Formal relation model.
    A relation is ALWAYS the result of a vectorized IA, never primitive.
    """

    @staticmethod
    def ia_types() -> dict[str, str]:
        """
        Mapping of IA types to which vector property they primarily modulate.
        Bloque II §3: Vector = lación, sentido, dirección, posición, plicación.
        Bloque II §6: IA overlap, don't sum.
        """
        return {
            "retroaction": "sentido",    # modulates the SENSE/direction of flow
            "plication":   "plicacion",  # modulates the PLICATION (fold type)
            "direction":   "direccion",  # modulates the DIRECTION (target)
            "position":    "posicion",   # modulates the POSITION (open/blocked)
            "sense":       "sentido",    # modulates the SENSE (polarity of flow)
        }

    @staticmethod
    def negation_target(phenomenon_id: str, displaced_to_id: str) -> dict:
        """
        Bloque II §4: Negation = displacement to another phenomenon.
        When a phenomenon is negated, it doesn't disappear — it moves.
        Returns the displacement record.
        """
        return {
            "operation": "negation_displacement",
            "source_phenomenon": phenomenon_id,
            "displaced_to": displaced_to_id,
            "note": (
                "Bloque II: 'Negación = desplazamiento a otro F.' "
                "The negated phenomenon is not destroyed but relocated "
                "to a different phenomenal context."
            ),
        }

    @staticmethod
    def triangulation(
        f1_id: str,
        f2_id: str,
        intermediary_id: str,
    ) -> dict:
        """
        Bloque II §5: Intermediation = triangulation that creates relation.
        The intermediary is not passive — it actively creates the F1↔F2 relation.
        """
        return {
            "operation": "triangulation",
            "source": f1_id,
            "target": f2_id,
            "intermediary": intermediary_id,
            "creates_relation": True,
            "note": (
                "Bloque II: 'Intermediación = triangulación que crea relación.' "
                "Without the intermediary, the F1↔F2 relation cannot exist. "
                "In contracts: guarantor, notary, registry — each creates the relation."
            ),
        }

    @staticmethod
    def check_superimposition(ia_types_applied: list[str]) -> dict:
        """
        Bloque II §6: 'IA se superponen, no se suman.'
        Check whether the IA types superimpose coherently or produce conflict.
        Returns interference analysis.
        """
        # IA modulate different vector properties — check if any two
        # modulate the SAME property (potential conflict)
        property_map = IARelationEngine.ia_types()
        property_counts: dict[str, list[str]] = {}
        for ia in ia_types_applied:
            prop = property_map.get(ia, "unknown")
            property_counts.setdefault(prop, []).append(ia)

        conflicts = {prop: ias for prop, ias in property_counts.items() if len(ias) > 1}
        return {
            "ia_applied": ia_types_applied,
            "superimposition_pattern": property_counts,
            "conflicts": conflicts,
            "coherent": len(conflicts) == 0,
            "note": (
                "Bloque II: 'IA se superponen, no se suman.' "
                "Two IAs modulating the same vector property create interference/conflict."
            ),
        }
