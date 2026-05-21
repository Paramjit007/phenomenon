"""
HomologationEngine — validates a PhenomenonRecord for homologation.

Now grounded in PHENOMENON theory via the bridge layer:
  - Bloque I  (Esterización): homologation IS the sterization operation
  - Bloque II (Superimposición): IA compatibility uses vector-property superimposition
  - Bloque IX (Reglas de validación): validate_structure() from OperationEngine
"""
from .models import PhenomenonRecord

REQUIRED_ESS_FIELDS = {"partyA", "partyB", "jurisdiction", "effectiveDate", "expiryDate"}


class HomologationEngine:
    """
    Bloque I — Estereización: "fija y estabiliza."
    Homologation is the technical act of sterization: the phenomenon is fixed
    and stabilised into a verifiable, computable form.

    Validation runs in two passes:
      Pass 1 — Domain rules (ESS fields, AG clauses, IA assigned)
      Pass 2 — Theoretical rules via bridge (Bloque IX validate_structure +
                                              Bloque II superimposition check)

    The union of both passes is the complete validity determination.
    """

    def validate(self, record: PhenomenonRecord) -> tuple[bool, list[str]]:
        """
        Full homologation validation.
        Combines domain-level checks (backward compatible)
        with theoretical-level checks (Bloques I-IX).
        """
        errors: list[str] = []

        # ── Pass 1: Domain checks (unchanged from original) ───────────────────
        ess = record.ess.model_dump()

        for f in REQUIRED_ESS_FIELDS:
            if not ess.get(f):
                errors.append(f"Missing required Ess field: {f}")

        if not record.ag.get("clauses"):
            errors.append("No Ag clauses defined")

        if not record.ia_instances:
            errors.append("No IA instances assigned")

        # ── Pass 2: Theoretical validation via bridge ─────────────────────────
        try:
            from .bridge import validate_record_theoretically, check_ia_superimposition

            # Bloque IX — structural validation (Action A1 required, no orphan nodes, etc.)
            theo_valid, theo_errors = validate_record_theoretically(record)
            if not theo_valid:
                for err in theo_errors:
                    # Only add if not already caught by domain check
                    if not any(err.lower() in e.lower() for e in errors):
                        errors.append(f"[PHENOMENON] {err}")

            # Bloque II — superimposition check ("IA se superponen, no se suman")
            # Each IA modulates one vector property; two IAs on the same property conflict
            if record.ia_instances and len(record.ia_instances) > 1:
                sup = check_ia_superimposition(record.ia_instances)
                if not sup.get("coherent", True):
                    for prop, conflicting_ias in sup.get("conflicts", {}).items():
                        errors.append(
                            f"[BLOQUE II] Superimposicion conflictiva en propiedad vectorial '{prop}': "
                            f"{', '.join(conflicting_ias)} modulan la misma propiedad del vector. "
                            f"Las IA se superponen, no se suman (Bloque II)."
                        )

        except ImportError:
            # Bridge not available — degrade gracefully to domain-only validation
            pass

        return len(errors) == 0, errors
