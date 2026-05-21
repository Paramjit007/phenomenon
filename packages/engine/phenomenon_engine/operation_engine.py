"""
Bloque 4 — Dinámica del Fenómeno
Bloque 7 — Motor Operacional del Sistema PHENOMENON

The three universal operations of the PHENOMENON motor.
These are WHAT the motor does; IA forms (ia_modulation_engine) are HOW it does it.

  CONTINUE   → maintain the phenomenon in its current state / evolution
  INTERRUPT  → halt the phenomenon or a specific interaction line
  DISTRIBUTE → branch the phenomenon into multiple trajectories / effects

Bloque 7 §8 — Condition of computability:
  "The system is computable because operations are defined, elements are
   identifiable, and transformations are reproducible."
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone

from .enums import PhenomenonState, OperationType, EventType
from .theoretical_models import (
    TheoreticalPhenomenon, PhenomenonEvent, OperationResult,
)

# ── Allowed state transitions (Bloque 7 §4.1) ────────────────────────────────
_TRANSITIONS: dict[PhenomenonState, set[PhenomenonState]] = {
    PhenomenonState.INITIALIZED: {PhenomenonState.ACTIVE},
    PhenomenonState.ACTIVE:      {PhenomenonState.STABLE, PhenomenonState.INTERRUPTED, PhenomenonState.TERMINATED},
    PhenomenonState.STABLE:      {PhenomenonState.TERMINATED},
    PhenomenonState.INTERRUPTED: {PhenomenonState.ACTIVE, PhenomenonState.TERMINATED},
    PhenomenonState.TERMINATED:  set(),
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _event(event_type: EventType, phenomenon_id: str, operation: str, payload: dict = {}) -> PhenomenonEvent:
    return PhenomenonEvent(
        event_type=event_type,
        phenomenon_id=phenomenon_id,
        source_operation=operation,
        payload=payload,
        timestamp=_now(),
    )


class OperationEngine:
    """
    Bloque 7 — The PHENOMENON motor.

    Implements the three universal operations over TheoreticalPhenomenon objects.
    Domain-specific repositories (like contracts) adapt these to their own persistence.

    Usage:
        engine = OperationEngine()
        result = engine.continue_operation(phenomenon)
        result = engine.interrupt_operation(phenomenon, target_interaction_id=None)
        result = engine.distribute(phenomenon, branch_count=2)
    """

    # ── Validation ─────────────────────────────────────────────────────────────

    def validate_transition(
        self,
        current: PhenomenonState,
        target: PhenomenonState,
    ) -> tuple[bool, str]:
        """Check whether a state transition is allowed by the state machine."""
        allowed = _TRANSITIONS.get(current, set())
        if target in allowed:
            return True, ""
        return False, (
            f"Transición no permitida: {current.value} → {target.value}. "
            f"Desde {current.value} se puede ir a: {[s.value for s in allowed] or ['ninguno']}."
        )

    def validate_structure(self, phenomenon: TheoreticalPhenomenon) -> tuple[bool, list[str]]:
        """
        Bloque 9 — Validation rules (Data Model §9):
          - No Phenomenon without Action
          - No Interaction without source + target
          - No orphan nodes allowed
          - State transitions must follow the defined graph
        """
        errors: list[str] = []
        if phenomenon.action is None:
            errors.append("Sin acción A1 — todo Fenómeno necesita exactamente una acción primaria.")
        if phenomenon.state == PhenomenonState.TERMINATED and phenomenon.action:
            if phenomenon.action.activation_flag:
                errors.append("Fenómeno TERMINATED pero su acción A1 sigue activa.")
        for ia in phenomenon.interactions:
            if not ia.source_id:
                errors.append(f"IA {ia.id}: source_id vacío — las interacciones deben tener origen.")
            if not ia.target_id:
                errors.append(f"IA {ia.id}: target_id vacío — las interacciones deben tener destino.")
        return len(errors) == 0, errors

    # ── Operation A: CONTINUE ─────────────────────────────────────────────────

    def continue_operation(
        self,
        phenomenon: TheoreticalPhenomenon,
    ) -> OperationResult:
        """
        Bloque 4 §3b / Bloque 7 §5.1 — CONTINUE_OPERATION
        Maintain the phenomenon in its current state or advance it to STABLE.
        Propagates all active interactions and updates timestamp.

        INITIALIZED → ACTIVE
        ACTIVE      → STABLE  (if all interactions are stable)
        INTERRUPTED → ACTIVE  (resume)
        """
        prev = phenomenon.state
        events: list[PhenomenonEvent] = []

        if prev == PhenomenonState.TERMINATED:
            return OperationResult(
                operation=OperationType.CONTINUE,
                phenomenon_id=phenomenon.id,
                success=False,
                previous_state=prev.value,
                new_state=prev.value,
                message="No se puede continuar un fenómeno TERMINADO.",
            )

        # Determine next state
        if prev == PhenomenonState.INITIALIZED:
            next_state = PhenomenonState.ACTIVE
        elif prev == PhenomenonState.INTERRUPTED:
            next_state = PhenomenonState.ACTIVE
        elif prev == PhenomenonState.ACTIVE:
            # Advance to STABLE if action potency is sufficient
            next_state = (
                PhenomenonState.STABLE
                if phenomenon.action and phenomenon.action.potency_level >= 0.7
                else PhenomenonState.ACTIVE
            )
        else:
            next_state = prev

        ok, msg = self.validate_transition(prev, next_state)
        if not ok and next_state != prev:
            return OperationResult(
                operation=OperationType.CONTINUE,
                phenomenon_id=phenomenon.id,
                success=False,
                previous_state=prev.value,
                new_state=prev.value,
                message=msg,
            )

        phenomenon.state = next_state
        events.append(_event(EventType.ON_UPDATE, phenomenon.id, OperationType.CONTINUE, {"new_state": next_state.value}))

        return OperationResult(
            operation=OperationType.CONTINUE,
            phenomenon_id=phenomenon.id,
            success=True,
            previous_state=prev.value,
            new_state=next_state.value,
            events_emitted=events,
            message=f"Fenómeno continuado: {prev.value} → {next_state.value}.",
        )

    # ── Operation B: INTERRUPT ────────────────────────────────────────────────

    def interrupt_operation(
        self,
        phenomenon: TheoreticalPhenomenon,
        target_interaction_id: str | None = None,
    ) -> OperationResult:
        """
        Bloque 4 §3a / Bloque 7 §5.2 — INTERRUPT_OPERATION
        Halt the phenomenon (or a specific interaction) and detach dependent edges.

        If target_interaction_id is given → interrupt only that IA node.
        If None → interrupt the entire phenomenon (ACTIVE → INTERRUPTED).

        Data Model §4.2:
          IF blocked_by_interaction → action.status = BLOCKED
        """
        prev = phenomenon.state
        events: list[PhenomenonEvent] = []

        if prev == PhenomenonState.TERMINATED:
            return OperationResult(
                operation=OperationType.INTERRUPT,
                phenomenon_id=phenomenon.id,
                success=False,
                previous_state=prev.value,
                new_state=prev.value,
                message="No se puede interrumpir un fenómeno TERMINADO.",
            )

        if target_interaction_id:
            # Interrupt a specific IA node
            target = next((ia for ia in phenomenon.interactions if ia.id == target_interaction_id), None)
            if not target:
                return OperationResult(
                    operation=OperationType.INTERRUPT,
                    phenomenon_id=phenomenon.id,
                    success=False,
                    previous_state=prev.value,
                    new_state=prev.value,
                    message=f"Interacción {target_interaction_id} no encontrada.",
                )
            from .enums import IAMode
            target.mode = IAMode.PASSIVE
            events.append(_event(EventType.ON_INTERRUPT, phenomenon.id, OperationType.INTERRUPT,
                                 {"interrupted_ia": target_interaction_id}))
            # Block action if all interactions are now passive
            if phenomenon.action and all(ia.mode == IAMode.PASSIVE for ia in phenomenon.interactions):
                from .enums import ActionStatus
                phenomenon.action.status = ActionStatus.BLOCKED
            new_state = prev  # phenomenon state unchanged for partial interrupt
        else:
            # Full phenomenon interrupt
            ok, msg = self.validate_transition(prev, PhenomenonState.INTERRUPTED)
            if not ok:
                return OperationResult(
                    operation=OperationType.INTERRUPT,
                    phenomenon_id=phenomenon.id,
                    success=False,
                    previous_state=prev.value,
                    new_state=prev.value,
                    message=msg,
                )
            phenomenon.state = PhenomenonState.INTERRUPTED
            if phenomenon.action:
                from .enums import ActionStatus
                phenomenon.action.activation_flag = False
                phenomenon.action.status = ActionStatus.BLOCKED
            events.append(_event(EventType.ON_INTERRUPT, phenomenon.id, OperationType.INTERRUPT))
            new_state = PhenomenonState.INTERRUPTED

        return OperationResult(
            operation=OperationType.INTERRUPT,
            phenomenon_id=phenomenon.id,
            success=True,
            previous_state=prev.value,
            new_state=new_state.value,
            events_emitted=events,
            message=f"Interrupción aplicada. Estado: {prev.value} → {new_state.value}.",
        )

    # ── Operation C: DISTRIBUTE ───────────────────────────────────────────────

    def distribute_operation(
        self,
        phenomenon: TheoreticalPhenomenon,
        branch_count: int = 2,
    ) -> tuple[OperationResult, list[TheoreticalPhenomenon]]:
        """
        Bloque 4 §3c / Bloque 7 §5.3 — DISTRIBUTE_OPERATION
        Branch the phenomenon into multiple trajectories.
        Returns the result and the list of new derived phenomena.

        Each branch:
          - inherits the structure of the source
          - gets a DERIVED action subtype
          - gets new IDs
          - starts in INITIALIZED state
        """
        import uuid
        prev = phenomenon.state
        events: list[PhenomenonEvent] = []
        branches: list[TheoreticalPhenomenon] = []

        if prev not in (PhenomenonState.ACTIVE, PhenomenonState.STABLE):
            return OperationResult(
                operation=OperationType.DISTRIBUTE,
                phenomenon_id=phenomenon.id,
                success=False,
                previous_state=prev.value,
                new_state=prev.value,
                message=f"Solo se puede distribuir desde ACTIVE o STABLE (estado actual: {prev.value}).",
            ), []

        for i in range(branch_count):
            branch_id = str(uuid.uuid4())
            branch_action = None
            if phenomenon.action:
                branch_action = phenomenon.action.model_copy(update={
                    "id": str(uuid.uuid4()),
                    "phenomenon_id": branch_id,
                    "subtype": "DERIVED",
                    "potency_level": phenomenon.action.potency_level * 0.7,
                })
            branch = TheoreticalPhenomenon(
                id=branch_id,
                name=f"{phenomenon.name} [Rama {i + 1}]",
                type=phenomenon.type,
                state=PhenomenonState.INITIALIZED,
                action=branch_action,
                connected_to=[phenomenon.id],
            )
            branches.append(branch)
            events.append(_event(EventType.ON_DISTRIBUTE, phenomenon.id, OperationType.DISTRIBUTE,
                                 {"branch_id": branch_id, "branch_index": i}))

        # Source phenomenon becomes STABLE after distributing
        phenomenon.state = PhenomenonState.STABLE

        return OperationResult(
            operation=OperationType.DISTRIBUTE,
            phenomenon_id=phenomenon.id,
            success=True,
            previous_state=prev.value,
            new_state=PhenomenonState.STABLE.value,
            events_emitted=events,
            message=f"Fenómeno distribuido en {branch_count} ramas. Fuente → STABLE.",
        ), branches
