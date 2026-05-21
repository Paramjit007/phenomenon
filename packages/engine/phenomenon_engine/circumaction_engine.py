"""
Bloque 2 — Circumaction (CA) Engine

Circumactions operate at the boundary of a Phenomenon.
Unlike Interactions (which connect specific nodes), Circumactions
modify multiple elements simultaneously without being directly linked to them.

  CA1 = immediate boundary (wraps the phenomenon directly)
  CA2 = contextual/environmental boundary

In the contracts domain:
  CA1 examples: jurisdiction, governing law, effective dates, liability cap
  CA2 examples: force majeure clauses, regulatory environment (RGPD, Ley 3/2004),
                market conditions, macro-legal framework

⚠️  PENDING FROM USER (Bloques 1 & 2):
  - Full taxonomy of CA1 vs CA2 in each domain
  - Rules for CA persistence across state transitions
  - Priority ordering when multiple CAs conflict
  - How CA interacts with the IA modulation layer
"""
from .enums import CircumactionLevel, CircumactionFunction, EventType
from .theoretical_models import Circumaction, TheoreticalPhenomenon, PhenomenonEvent
from datetime import datetime, timezone


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class CircumactionEngine:
    """
    Manages circumactions on a TheoreticalPhenomenon.

    Key properties of CAs (Data Model §2.4):
      - can operate without direct interaction linkage
      - may modify multiple entities simultaneously
      - persist across state changes (when persistence=True)
    """

    def apply(
        self,
        phenomenon: TheoreticalPhenomenon,
        circumaction: Circumaction,
    ) -> dict:
        """
        Apply a circumaction to a phenomenon.
        The CA is added to the phenomenon's CA list and its effect is described.
        Actual field-level modification depends on the domain adapter.
        """
        import uuid
        if not circumaction.id:
            circumaction.id = str(uuid.uuid4())
        if circumaction not in phenomenon.circumactions:
            phenomenon.circumactions.append(circumaction)

        return {
            "ca_id": circumaction.id,
            "level": circumaction.level.value,
            "function": circumaction.function.value,
            "affects": circumaction.affects_ids,
            "value": circumaction.value,
            "description": circumaction.description,
            "event": PhenomenonEvent(
                event_type=EventType.ON_UPDATE,
                phenomenon_id=phenomenon.id,
                source_operation="circumaction_applied",
                payload={"ca_id": circumaction.id, "function": circumaction.function.value},
                timestamp=_now(),
            ),
        }

    def get_active_circumactions(
        self,
        phenomenon: TheoreticalPhenomenon,
        level: CircumactionLevel | None = None,
        function: CircumactionFunction | None = None,
    ) -> list[Circumaction]:
        """
        Return circumactions matching optional level/function filters.
        Non-persistent CAs are excluded from results after state changes.
        """
        result = list(phenomenon.circumactions)
        if level:
            result = [ca for ca in result if ca.level == level]
        if function:
            result = [ca for ca in result if ca.function == function]
        return result

    def remove(
        self,
        phenomenon: TheoreticalPhenomenon,
        ca_id: str,
    ) -> bool:
        before = len(phenomenon.circumactions)
        phenomenon.circumactions = [ca for ca in phenomenon.circumactions if ca.id != ca_id]
        return len(phenomenon.circumactions) < before

    def evaluate_conditions(
        self,
        phenomenon: TheoreticalPhenomenon,
    ) -> list[dict]:
        """
        Evaluate all CONDITION-type CAs against the current phenomenon state.
        Returns a list of evaluation results.

        ⚠️  PENDING Bloque 8 (Casos Base): the full condition evaluation logic
        requires the base cases to define when a condition is met/unmet.
        """
        results = []
        for ca in self.get_active_circumactions(phenomenon, function=CircumactionFunction.CONDITION):
            results.append({
                "ca_id": ca.id,
                "description": ca.description,
                "value": ca.value,
                "status": "PENDING_EVALUATION",
                "note": "Evaluación completa pendiente — requiere Bloque 8 (Casos Base).",
            })
        return results

    # ── Contract-domain CA factory helpers ────────────────────────────────────

    @staticmethod
    def make_jurisdiction_ca(jurisdiction: str, phenomenon_id: str) -> Circumaction:
        """
        CA1 — jurisdiction is an immediate boundary on the contract phenomenon.
        It affects all interactions within the phenomenon.
        """
        import uuid
        return Circumaction(
            id=str(uuid.uuid4()),
            phenomenon_id=phenomenon_id,
            level=CircumactionLevel.CA1,
            function=CircumactionFunction.BOUNDARY,
            persistence=True,
            description=f"Jurisdicción competente: {jurisdiction}",
            value=jurisdiction,
        )

    @staticmethod
    def make_force_majeure_ca(phenomenon_id: str) -> Circumaction:
        """
        CA2 — force majeure is an external contextual condition
        that may interrupt any phenomenon without fault attribution.
        """
        import uuid
        return Circumaction(
            id=str(uuid.uuid4()),
            phenomenon_id=phenomenon_id,
            level=CircumactionLevel.CA2,
            function=CircumactionFunction.CONDITION,
            persistence=False,
            description="Fuerza mayor — Art. 1105 CC. Interrumpe el fenómeno sin atribución de culpa.",
            value="fuerza_mayor",
        )

    @staticmethod
    def make_regulatory_ca(regulation: str, phenomenon_id: str) -> Circumaction:
        """
        CA2 — regulatory environment (RGPD, Ley 3/2004, etc.).
        An external modifier that constrains what interactions are permitted.
        """
        import uuid
        return Circumaction(
            id=str(uuid.uuid4()),
            phenomenon_id=phenomenon_id,
            level=CircumactionLevel.CA2,
            function=CircumactionFunction.MODIFIER,
            persistence=True,
            description=f"Marco regulatorio: {regulation}",
            value=regulation,
        )
