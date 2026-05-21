"""
Bloque IV — Generation of the Opus

"Opus emerges from vector convergence.
 Title alone creates partial opus.
 Title plus mode creates complete opus."

The OPUS is the formal OUTPUT of a PHENOMENON — the result produced when
all vectors converge toward a stable configuration.

THREE LEVELS OF OPUS (from Bloque IV):
  PARTIAL  → ESS identity (title) is defined, but AG/IA are incomplete
             "Title alone creates partial opus"
  COMPLETE → ESS + AG (clauses) + IA (operators) all present and coherent
             "Title plus mode creates complete opus"
  OPONIBLE → Complete opus that has been registered/projected through IF
             (Bloque V: "Registry diffuses structures")

Relationship to domain concepts:
  PARTIAL  = contract with ESS filled but no clauses / no IA
  COMPLETE = fully homologated contract (VALID status)
  OPONIBLE = complete contract registered in appropriate registry
             (Registro de la Propiedad, Mercantil, OEPM, etc.)
"""
from dataclasses import dataclass
from enum import Enum
from .models import PhenomenonRecord


class OpusLevel(str, Enum):
    """
    Bloque IV — the three levels of opus generation.
    Extends the existing OpusState (homologation: VALID/INVALID/PENDING).
    """
    PARTIAL  = "PARTIAL"   # title (ESS) defined; mode (AG+IA) missing
    COMPLETE = "COMPLETE"  # all vectors converged; homologation VALID
    OPONIBLE = "OPONIBLE"  # complete + registered (Bloque V: IF→Registry)


@dataclass
class OpusResult:
    """The result of opus evaluation for a phenomenon."""
    level: OpusLevel
    title_complete: bool       # ESS fields all filled
    mode_complete:  bool       # AG clauses + IA operators present
    homologated:    bool       # VALID homologation
    oponible:       bool       # registered in a public registry
    registry:       str = ""   # which registry (if oponible)
    missing:        list = None

    def __post_init__(self):
        if self.missing is None:
            self.missing = []

    def label(self) -> str:
        labels = {
            OpusLevel.PARTIAL:  "Opus Parcial — título definido, modo incompleto",
            OpusLevel.COMPLETE: "Opus Completo — todos los vectores convergentes",
            OpusLevel.OPONIBLE: "Opus Oponible — completo y registrado ante terceros",
        }
        return labels.get(self.level, self.level.value)


class OpusEngine:
    """
    Bloque IV — evaluates the level of opus for a phenomenon.

    In the contracts domain:
      Title = the ESS identity (partyA, partyB, jurisdiction, dates)
      Mode  = the operational layer (clauses + IA operators)
      Registry = Registro de la Propiedad, Mercantil, OEPM, etc. (Bloque V)
    """

    def evaluate(self, record: PhenomenonRecord, registered_in: str = "") -> OpusResult:
        """
        Determine the opus level for a domain PhenomenonRecord.
        """
        ess = record.ess.model_dump()
        required_ess = {"partyA", "partyB", "jurisdiction", "effectiveDate", "expiryDate"}

        missing = []

        # Title check (Bloque IV: "title alone = partial opus")
        title_complete = all(bool(ess.get(f)) for f in required_ess)
        if not title_complete:
            missing += [f for f in required_ess if not ess.get(f)]

        # Mode check (Bloque IV: "title + mode = complete opus")
        has_clauses = bool(record.ag.get("clauses"))
        has_ia      = bool(record.ia_instances)
        mode_complete = has_clauses and has_ia
        if not has_clauses:
            missing.append("clauses (AG)")
        if not has_ia:
            missing.append("IA operators")

        homologated = record.opus.homologation == "VALID"

        # Opus level determination
        oponible = bool(registered_in) and homologated and mode_complete and title_complete
        if oponible:
            level = OpusLevel.OPONIBLE
        elif homologated and mode_complete and title_complete:
            level = OpusLevel.COMPLETE
        else:
            level = OpusLevel.PARTIAL

        return OpusResult(
            level=level,
            title_complete=title_complete,
            mode_complete=mode_complete,
            homologated=homologated,
            oponible=oponible,
            registry=registered_in,
            missing=missing,
        )

    def to_complete(self, record: PhenomenonRecord) -> list[str]:
        """
        What's needed to elevate from PARTIAL → COMPLETE opus.
        Returns a list of actionable steps.
        """
        result = self.evaluate(record)
        if result.level == OpusLevel.COMPLETE or result.level == OpusLevel.OPONIBLE:
            return []
        steps = []
        if not result.title_complete:
            steps.append(f"Completar campos ESS faltantes: {', '.join(result.missing)}")
        if not result.mode_complete:
            if "clauses (AG)" in result.missing:
                steps.append("Añadir cláusulas operativas (AG) al contrato")
            if "IA operators" in result.missing:
                steps.append("Asignar al menos un operador IA (ad-actio / co-implication recomendado)")
        if result.title_complete and result.mode_complete and not result.homologated:
            steps.append("Ejecutar la verificación PHENOMENON (homologar el contrato)")
        return steps

    def to_oponible(self, record: PhenomenonRecord) -> list[str]:
        """
        What's needed to elevate from COMPLETE → OPONIBLE opus (Bloque V).
        """
        result = self.evaluate(record)
        if result.level == OpusLevel.OPONIBLE:
            return []
        steps = self.to_complete(record)
        if not steps:
            steps.append(
                "Registrar el contrato en el registro correspondiente para hacerlo oponible a terceros: "
                "Registro de la Propiedad (inmuebles), Registro Mercantil (sociedades), "
                "OEPM (PI/patentes), Registro de la Propiedad Intelectual (obras)."
            )
        return steps
