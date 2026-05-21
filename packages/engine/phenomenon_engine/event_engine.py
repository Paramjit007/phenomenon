"""
Bloque 7 §7 — Event System

Every motor operation emits events. Events trigger rule evaluation
and possible state mutation.

Event types: ON_CREATE, ON_UPDATE, ON_INTERRUPT, ON_DISTRIBUTE, ON_TERMINATE

⚠️  PENDING FROM USER:
  - Full rule set from Bloque 9 (Especificación Computable)
  - Domain-specific event handlers beyond contracts
  - Event persistence / audit trail requirements
"""
from dataclasses import dataclass, field
from typing import Callable
from .enums import EventType
from .theoretical_models import PhenomenonEvent


# Handler signature: (event: PhenomenonEvent) -> None
EventHandler = Callable[[PhenomenonEvent], None]


class EventEngine:
    """
    A simple synchronous event bus for the PHENOMENON motor.

    Usage:
        bus = EventEngine()
        bus.subscribe(EventType.ON_INTERRUPT, my_handler)
        bus.emit(event)
    """

    def __init__(self) -> None:
        self._handlers: dict[EventType, list[EventHandler]] = {
            event_type: [] for event_type in EventType
        }
        self._log: list[PhenomenonEvent] = []

    def subscribe(self, event_type: EventType, handler: EventHandler) -> None:
        self._handlers[event_type].append(handler)

    def unsubscribe(self, event_type: EventType, handler: EventHandler) -> None:
        self._handlers[event_type] = [h for h in self._handlers[event_type] if h != handler]

    def emit(self, event: PhenomenonEvent) -> None:
        self._log.append(event)
        for handler in self._handlers.get(event.event_type, []):
            handler(event)

    def emit_all(self, events: list[PhenomenonEvent]) -> None:
        for event in events:
            self.emit(event)

    @property
    def log(self) -> list[PhenomenonEvent]:
        """Full audit trail of all emitted events."""
        return list(self._log)

    def log_for_phenomenon(self, phenomenon_id: str) -> list[PhenomenonEvent]:
        return [e for e in self._log if e.phenomenon_id == phenomenon_id]

    def clear_log(self) -> None:
        self._log.clear()


# ── Built-in rule handlers (Bloque 9 — validation rules) ─────────────────────

def rule_no_new_connections_after_interrupt(event: PhenomenonEvent) -> None:
    """
    Data Model §9: "If an interaction is interrupted → it cannot generate new connections."
    ⚠️  Stub — full implementation requires repository access (Bloque 9 pending).
    """
    if event.event_type == EventType.ON_INTERRUPT:
        # TODO: query repo and block new interactions on the interrupted node
        pass


def rule_log_terminate(event: PhenomenonEvent) -> None:
    """Log termination events for audit."""
    if event.event_type == EventType.ON_TERMINATE:
        print(f"[PHENOMENON AUDIT] Terminated: {event.phenomenon_id} at {event.timestamp}")


# Default event bus singleton (optional — engines can instantiate their own)
default_bus = EventEngine()
default_bus.subscribe(EventType.ON_INTERRUPT, rule_no_new_connections_after_interrupt)
default_bus.subscribe(EventType.ON_TERMINATE, rule_log_terminate)
