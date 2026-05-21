PHASE_ORDER = ["F1", "F2", "F3"]
PHASE_LABELS = {"F1": "DRAFT", "F2": "ACTIVE", "F3": "TERMINATED"}


class PhaseEngine:
    def advance(self, current_phase: str) -> str:
        idx = PHASE_ORDER.index(current_phase) if current_phase in PHASE_ORDER else 0
        if idx + 1 >= len(PHASE_ORDER):
            raise ValueError(f"Cannot advance beyond {current_phase}")
        return PHASE_ORDER[idx + 1]

    def label(self, phase: str) -> str:
        return PHASE_LABELS.get(phase, "UNKNOWN")
