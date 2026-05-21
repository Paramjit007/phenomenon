from .models import Vector


class VectorEngine:
    def generate(self, ia_type: str, is_sub: bool = False) -> Vector:
        lation = "derived" if is_sub else "binding"
        direction = "IF→F" if is_sub else "F1→F2"
        plication = "co-implied" if "co-implication" in ia_type else "explicit"
        position = "OPEN" if lation in ("binding", "permissive", "derived") else "BLOCKED"

        return Vector(
            lation=lation,
            sense="forward",
            direction=direction,
            position=position,
            plication=plication,
        )
