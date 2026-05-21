"""
Bloque 7 §4 — Modulación de las operaciones (IA)

The five IA forms are not new operations — they are MODES OF EXECUTION
of the three fundamental operations (interrupt / continue / distribute).

  "Las operaciones fundamentales no se ejecutan de manera uniforme,
   sino que se modulan mediante formas estructurales de interacción (IA)."
   — Bloque 7, §4

Each IA form transforms the effect of an operation on a Phenomenon:

  RETROACTION → reverses the direction of the interaction (edge reversal)
  PLICATION   → replicates the interaction recursively (recursive clone)
  DIRECTION   → enforces a vector/directional constraint on the result
  POSITION    → alters the hierarchy of the affected nodes
  SENSE       → modifies the polarity of the interaction

Relationship to contract-domain labels (approximate mapping):
  DIRECTION   ≈ ad-actio       (positive forward obligation)
  RETROACTION ≈ de-actio       (removal / reversal)
  POSITION    ≈ non            (positional block / prohibition)
  PLICATION   ≈ co-implication (recursive mutual obligation)
  SENSE       → (not yet mapped; pending Bloque 6 clarification)
"""
from .enums import IAFormType, IAMode, IAPolarity
from .theoretical_models import IAInteraction, TheoreticalPhenomenon, OperationResult


class IAModulationEngine:
    """
    Applies an IA form to the result of an operation, transforming it
    according to Bloque 7 §4 — the IA modulation layer.

    Input:
        base_result   : OperationResult from OperationEngine
        ia_form       : the IAFormType to apply
        phenomenon    : the TheoreticalPhenomenon being acted upon

    Output:
        ModulationResult with the transformed state and description
    """

    def apply(
        self,
        base_result: OperationResult,
        ia_form: IAFormType,
        phenomenon: TheoreticalPhenomenon,
        target_interaction: IAInteraction | None = None,
    ) -> dict:
        """
        Dispatch to the appropriate IA modulation method.
        Returns a dict describing the transformation applied.
        """
        handler = {
            IAFormType.RETROACTION: self._retroaction,
            IAFormType.PLICATION:   self._plication,
            IAFormType.DIRECTION:   self._direction,
            IAFormType.POSITION:    self._position,
            IAFormType.SENSE:       self._sense,
            IAFormType.OTHER:       self._other,
        }.get(ia_form, self._other)

        return handler(base_result, phenomenon, target_interaction)

    # ── RETROACTION ───────────────────────────────────────────────────────────

    def _retroaction(
        self,
        result: OperationResult,
        phenomenon: TheoreticalPhenomenon,
        target: IAInteraction | None,
    ) -> dict:
        """
        Reverses the edge direction of the affected interactions.
        source ↔ target are swapped.
        Effect: what was an outgoing obligation becomes an incoming one.

        Contract domain analogy: de-actio — removes or reverses an obligation.
        """
        if target:
            old_source = target.source_id
            old_target = target.target_id
            target.source_id = old_target
            target.target_id = old_source
            return {
                "form": IAFormType.RETROACTION,
                "applied_to": target.id,
                "transformation": f"Edge reversed: {old_source} ← {old_target}",
                "description": "La dirección de la interacción ha sido invertida (retroacción).",
            }
        # Apply to all interactions if no specific target
        for ia in phenomenon.interactions:
            ia.source_id, ia.target_id = ia.target_id, ia.source_id
        return {
            "form": IAFormType.RETROACTION,
            "applied_to": "all_interactions",
            "transformation": f"Reversed {len(phenomenon.interactions)} interaction(s)",
            "description": "Todas las interacciones del fenómeno han sido invertidas (retroacción global).",
        }

    # ── PLICATION ─────────────────────────────────────────────────────────────

    def _plication(
        self,
        result: OperationResult,
        phenomenon: TheoreticalPhenomenon,
        target: IAInteraction | None,
    ) -> dict:
        """
        Replicates the interaction recursively.
        Each replica is added as a new interaction with the same structure.
        The original persists alongside its replicas.

        Contract domain analogy: co-implication — mutual recursive obligation.
        Pending Bloque 6 clarification: how many recursive levels are allowed?
        """
        import uuid
        if target is None and phenomenon.interactions:
            target = phenomenon.interactions[0]
        if target is None:
            return {"form": IAFormType.PLICATION, "applied_to": None,
                    "transformation": "No interaction to replicate",
                    "description": "Sin interacciones para plicar."}

        replica = target.model_copy(update={
            "id": str(uuid.uuid4()),
            "description": f"[PLICACIÓN] Réplica de {target.id}",
        })
        phenomenon.interactions.append(replica)
        return {
            "form": IAFormType.PLICATION,
            "applied_to": target.id,
            "transformation": f"Replicated → {replica.id}",
            "description": "La interacción ha sido replicada (plicación). Ambas versiones son ahora activas.",
        }

    # ── DIRECTION ─────────────────────────────────────────────────────────────

    def _direction(
        self,
        result: OperationResult,
        phenomenon: TheoreticalPhenomenon,
        target: IAInteraction | None,
    ) -> dict:
        """
        Enforces a directional (vector) constraint on the interaction.
        Sets mode to ACTIVE and polarity to POSITIVE, creating a clear
        forward-moving obligation.

        Contract domain analogy: ad-actio — active positive obligation.
        Bloque 5 clarification needed: what specific vector directions exist?
        """
        targets = [target] if target else phenomenon.interactions
        for ia in targets:
            if ia:
                ia.mode = IAMode.ACTIVE
                ia.polarity = IAPolarity.POSITIVE
        return {
            "form": IAFormType.DIRECTION,
            "applied_to": target.id if target else "all_interactions",
            "transformation": "Mode → ACTIVE, Polarity → POSITIVE",
            "description": "La interacción tiene ahora dirección activa positiva (ad-actio / direction).",
        }

    # ── POSITION ──────────────────────────────────────────────────────────────

    def _position(
        self,
        result: OperationResult,
        phenomenon: TheoreticalPhenomenon,
        target: IAInteraction | None,
    ) -> dict:
        """
        Alters the positional hierarchy of the affected node.
        Sets polarity to NEGATIVE and mode to PASSIVE, creating a
        prohibitive/blocking relationship.

        Contract domain analogy: non — prohibition (positional block).
        Bloque 2 clarification needed: what are the full positional levels?
        """
        targets = [target] if target else phenomenon.interactions
        for ia in targets:
            if ia:
                ia.polarity = IAPolarity.NEGATIVE
                ia.mode = IAMode.PASSIVE
        return {
            "form": IAFormType.POSITION,
            "applied_to": target.id if target else "all_interactions",
            "transformation": "Polarity → NEGATIVE, Mode → PASSIVE",
            "description": "La interacción ha asumido posición negativa/prohibitiva (non / position).",
        }

    # ── SENSE ─────────────────────────────────────────────────────────────────

    def _sense(
        self,
        result: OperationResult,
        phenomenon: TheoreticalPhenomenon,
        target: IAInteraction | None,
    ) -> dict:
        """
        Modifies the polarity of the interaction without changing its direction.
        POSITIVE → NEGATIVE, NEGATIVE → POSITIVE, NEUTRAL → unchanged.

        ⚠️  PENDING: Bloque 6 (Lenguaje Estructural) needed to fully define
        what "sense" means in each domain (legal, physical, linguistic).
        Currently implemented as polarity inversion.
        """
        targets = [target] if target else phenomenon.interactions
        transformed = []
        for ia in targets:
            if ia:
                if ia.polarity == IAPolarity.POSITIVE:
                    ia.polarity = IAPolarity.NEGATIVE
                elif ia.polarity == IAPolarity.NEGATIVE:
                    ia.polarity = IAPolarity.POSITIVE
                transformed.append(ia.id)
        return {
            "form": IAFormType.SENSE,
            "applied_to": transformed,
            "transformation": "Polarity inverted",
            "description": "La polaridad de la interacción ha sido modificada (sentido). Pendiente: definición completa en Bloque 6.",
            "pending_clarification": "Bloque 6 — Lenguaje Estructural debe definir el espacio completo de sentidos.",
        }

    # ── OTHER / fallback ──────────────────────────────────────────────────────

    def _other(
        self,
        result: OperationResult,
        phenomenon: TheoreticalPhenomenon,
        target: IAInteraction | None,
    ) -> dict:
        return {
            "form": IAFormType.OTHER,
            "applied_to": None,
            "transformation": "No-op",
            "description": "Forma IA no reconocida. Sin transformación aplicada.",
        }

    # ── Utility: resolve contract-domain label to IAFormType ─────────────────

    @staticmethod
    def contract_label_to_ia_form(label: str) -> IAFormType:
        """
        Maps the contract-domain IA labels (ad-actio, de-actio, non, co-implication)
        to the theoretical IA forms.

        ⚠️  APPROXIMATE MAPPING — requires validation against Bloques 3 & 7.
        The full mapping will be confirmed once Bloques 5 & 6 are available.
        """
        mapping = {
            "ad-actio":      IAFormType.DIRECTION,
            "de-actio":      IAFormType.RETROACTION,
            "non":           IAFormType.POSITION,
            "co-implication":IAFormType.PLICATION,
        }
        return mapping.get(label, IAFormType.OTHER)
