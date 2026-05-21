"""
Bloque VIII — Casos Base (Acetatos) — FULL STRUCTURAL DEFINITIONS
Source: PHENOMENON — Detailed Structural Mapping.txt

These are NOT simplified legal descriptions.
They are the PHENOMENON structural analysis of four fundamental legal phenomena.

Final Global Rule (from source document):
"IA are not words or labels. They are geometric-vectorial operators governing
 how information, operation and stabilization circulate inside PHENOMENON."
"""
from dataclasses import dataclass, field
from typing import Optional
from .enums import (
    PhenomenonState, PhenomenonType, ActionSubtype, ActionStatus,
    IAFormType, IAMode, IAPolarity, CircumactionLevel, CircumactionFunction,
)
from .theoretical_models import (
    TheoreticalPhenomenon, Action, IAInteraction, Circumaction,
)


@dataclass
class BaseCaseFlow:
    """
    Bloque VIII — The INPUT → PROCESO → OUTPUT structure for each base case.
    Now includes full PHENOMENON structural analysis.
    """
    case_name: str
    # PHENOMENON structural definition (not the legal definition)
    phenomenon_definition: str
    # Final Rule for this phenomenon
    final_rule: str
    # Full IA table with roles
    ia_table: list[dict]            # [{ia, role, formType}]
    # INPUT → PROCESO → OUTPUT
    input_description: str
    input_elements: list[str]
    process_operations: list[str]
    output_description: str
    output_elements: list[str]
    # Fractal sub-phenomena (if any)
    fractal_components: list[str] = field(default_factory=list)
    # Spanish law references
    legal_references: list[str] = field(default_factory=list)


# ─────────────────────────────────────────────────────────────────────────────
# BASE CASE 1: APROPIACIÓN
# "a structured Ess-Ag phenomenon where multiple IA and vectors converge to
#  stabilize a relation between a subject and a being through operative control,
#  projection and homologable persistence."
# ─────────────────────────────────────────────────────────────────────────────

APROPIACION = BaseCaseFlow(
    case_name="Apropiación",

    phenomenon_definition=(
        "Apropiación is NOT merely 'acquiring ownership'. "
        "It is a structured Ess-Ag phenomenon where multiple IA and vectors converge "
        "to stabilize a relation between a subject and a being through operative control, "
        "projection and homologable persistence."
    ),

    final_rule="Apropiación is not a static right but a stabilized vectorial-operational relation.",

    ia_table=[
        {"ia": "ad-actio",      "formType": "direction",   "role": "directional projection toward the being"},
        {"ia": "de-actio",      "formType": "retroaction",  "role": "separation from previous relation"},
        {"ia": "ob-actio",      "formType": "position",     "role": "operative surrounding / obligation layer"},
        {"ia": "co-implication","formType": "plication",    "role": "simultaneous coexistence of vectors"},
        {"ia": "non",           "formType": "position",     "role": "exclusion of incompatible relation"},
        {"ia": "IF",            "formType": "direction",    "role": "transition between F (inter-phenomenic)"},
        {"ia": "stabilization", "formType": "plication",    "role": "persistence of vector pattern"},
    ],

    # Real process structure (NOT simplified)
    input_description="Subject encounters a being (res nullius or res derelicta) and projects an ad-actio vector.",
    input_elements=[
        "Sujeto aprehensor (con capacidad de obrar — Ess)",
        "Ser susceptible de apropiación (res nullius o res derelicta)",
        "ad-actio: proyección vectorial directa hacia el ser",
    ],
    process_operations=[
        "TENTIO: el sujeto mantiene continuidad operativa (ad-actio persistente)",
        "USATIO: el sujeto hace uso operativo del ser (co-implicación: uso + control coexisten)",
        "CAPIO: el vector se estabiliza (ob-actio: capa de obligación operativa creada)",
        "ESTABILIZACIÓN: la pauta vectorial persiste (non: exclusión de relaciones incompatibles)",
        "Posible USUCAPIÓN: si la estabilización persiste en IST suficiente",
    ],
    output_description=(
        "A stabilized vectorial-operational relation between subject and being. "
        "Apropiación is FRACTAL: inside it may coexist use, protection, transfer, "
        "projection, exclusion, stabilization — each with its own IA structure."
    ),
    output_elements=[
        "Relación operativa estabilizada sujeto-ser (no necesariamente 'propiedad' en sentido tradicional)",
        "Opus parcial → completo según convergencia de vectores",
        "Posible proyección a USUCAPIÓN si la persistencia IST lo permite",
    ],
    fractal_components=["uso", "protección", "transferencia", "proyección", "exclusión", "estabilización"],
    legal_references=[
        "Art. 609 CC — modos de adquirir la propiedad",
        "Art. 610 CC — ocupación de bienes sin dueño",
        "Art. 464 CC — posesión de buena fe",
    ],
)


# ─────────────────────────────────────────────────────────────────────────────
# BASE CASE 2: TENTIO
# "operative maintenance of vector continuity over a being"
# ─────────────────────────────────────────────────────────────────────────────

TENTIO = BaseCaseFlow(
    case_name="Tentio",

    phenomenon_definition=(
        "Tentio is NOT possession. "
        "It is operative maintenance of vector continuity over a being."
    ),

    final_rule="Tentio is persistence of operative vector continuity, not ownership.",

    ia_table=[
        {"ia": "ad-actio",      "formType": "direction",  "role": "vector toward being — operative projection"},
        {"ia": "stabilization", "formType": "plication",  "role": "persistence of vector pattern"},
        {"ia": "non",           "formType": "position",   "role": "exclusion of incompatible vectors"},
        {"ia": "IF",            "formType": "direction",  "role": "possible transition (e.g. to Usucapión)"},
        {"ia": "co-implication","formType": "plication",  "role": "coexistence with other operations"},
    ],

    input_description=(
        "Subject maintains a persistent operative vector toward a being. "
        "Tentio does NOT require ownership, legitimacy, or homologation. "
        "Only: operative continuity."
    ),
    input_elements=[
        "Sujeto en contacto operativo con el ser",
        "Vector persistente (ad-actio continua)",
        "Continuidad operativa (no se requiere título ni legitimidad)",
    ],
    process_operations=[
        "ad-actio: proyección vectorial mantenida hacia el ser",
        "stabilization: la pauta vectorial persiste en el tiempo (IST)",
        "non: exclusión de vectores incompatibles (otros que pretenden el mismo ser)",
        "co-implication: posible coexistencia con uso, transferencia, comercialización",
        "IF: posible transición hacia Apropiación, Usucapión u otro F si los requisitos se cumplen",
    ],
    output_description=(
        "Operative continuity maintained. Tentio may be SIMPLE (only holding) or "
        "COMPLEX (combined with use, transfer, commercialization, projection). "
        "Example: restaurant takeaway — service + sale coexist through co-implication."
    ),
    output_elements=[
        "Tentio simple: solo continuidad operativa de holding",
        "Tentio compleja: holding + uso + transferencia + proyección (co-implicadas)",
        "Base para posible Usucapión si la persistencia IST lo permite",
    ],
    legal_references=[
        "Art. 430 CC — posesión natural y civil",
        "Art. 431 CC — posesión en concepto de dueño",
        "Art. 432 CC — posesión en nombre propio o ajeno",
    ],
)


# ─────────────────────────────────────────────────────────────────────────────
# BASE CASE 3: USUCAPIÓN
# "stabilized homologation of persistent vector continuity after iterative IST persistence"
# ─────────────────────────────────────────────────────────────────────────────

USUCAPION = BaseCaseFlow(
    case_name="Usucapión",

    phenomenon_definition=(
        "Usucapión is NOT 'time creating ownership'. "
        "It is: stabilized homologation of persistent vector continuity "
        "after iterative IST persistence."
    ),

    final_rule="Usucapión is homologated stabilization of persistent operative vectors.",

    ia_table=[
        {"ia": "ad-actio",      "formType": "direction",  "role": "operative continuity (persistent ad-actio)"},
        {"ia": "stabilization", "formType": "plication",  "role": "persistence across IST"},
        {"ia": "IF",            "formType": "direction",  "role": "transition to new homologated F"},
        {"ia": "non",           "formType": "position",   "role": "exclusion of incompatible relation"},
        {"ia": "co-implication","formType": "plication",  "role": "coexistence of vectors"},
        {"ia": "de-actio",      "formType": "retroaction","role": "separation from previous homologated relation"},
    ],

    input_description=(
        "CRITICAL RULE: Time does NOT create the result. "
        "IST only measures persistence of vector stability. "
        "Real structure: Tentio → Persistence → Stabilization → Homologation"
    ),
    input_elements=[
        "Tentio preexistente (continuidad operativa mantenida)",
        "IST: duración y perduración del vector — NO el tiempo per se",
        "Vectores incompatibles ausentes o fallidos (non opera correctamente)",
        "Buena fe y justo título (para Usucapión ordinaria — CA1 circumacciones)",
    ],
    process_operations=[
        "TENTIO persistente: ad-actio continua sobre el ser en IST suficiente",
        "PERSISTENCIA: la pauta vectorial resiste perturbaciones (perduración)",
        "Los vectores incompatibles desaparecen o fallan (non los excluye)",
        "ESTABILIZACIÓN: consolidación de la pauta — homologación se hace posible",
        "IF: transición al nuevo F homologado (nuevo estatuto jurídico del ser)",
        "HOMOLOGACIÓN: el nuevo F se estabiliza — ergo USUCAPIÓN consumada",
        "de-actio: separación del anterior titular (su relación vectorial queda disuelta)",
    ],
    output_description="New homologated F: the subject becomes the operative-legal holder through stabilized persistence.",
    output_elements=[
        "Nuevo F homologado: relación operativa-jurídica estabilizada (propiedad por prescripción)",
        "Opus Oponible si se inscribe en el Registro de la Propiedad (Bloque V)",
        "Extinción del derecho anterior del titular (de-actio resuelve la relación anterior)",
    ],
    legal_references=[
        "Arts. 1930-1960 CC — prescripción adquisitiva",
        "Art. 1940 CC — requisitos Usucapión ordinaria",
        "Art. 1959 CC — Usucapión extraordinaria",
        "Art. 36 Ley Hipotecaria — Usucapión contra tabulas",
    ],
)


# ─────────────────────────────────────────────────────────────────────────────
# BASE CASE 4: DELITO
# "IA-based destabilizing phenomenon producing vectorial conflict inside or across F"
# ─────────────────────────────────────────────────────────────────────────────

DELITO = BaseCaseFlow(
    case_name="Delito",

    phenomenon_definition=(
        "Delito is NOT an isolated action. "
        "It is an IA-based destabilizing phenomenon producing vectorial conflict "
        "inside or across F. "
        "CRITICAL: the delito itself is an interaction (IA), not merely an action."
    ),

    final_rule="Delito is vectorial destabilization generated through conflictive IA structures.",

    ia_table=[
        {"ia": "ad-actio",       "formType": "direction",   "role": "projection toward target"},
        {"ia": "de-actio",       "formType": "retroaction",  "role": "destructive separation"},
        {"ia": "non",            "formType": "position",     "role": "exclusion / negation of target's vectors"},
        {"ia": "co-implication", "formType": "plication",    "role": "coexistence of operative vectors"},
        {"ia": "IF",             "formType": "direction",    "role": "transition between F (e.g. innocent→accused)"},
        {"ia": "obstruction IA", "formType": "position",     "role": "blocking of target's operative continuity"},
        {"ia": "destabilization","formType": "retroaction",  "role": "pattern disruption of target's F"},
    ],

    input_description=(
        "Traditional systems analyze: action → consequence. "
        "PHENOMENON analyzes: interaction → vector conflict → destabilization. "
        "The delito IS the conflictive IA, not a separate action."
    ),
    input_elements=[
        "Sujeto activo A (con capacidad operativa — ad-actio)",
        "IA conflictiva (la conducta típica ES la IA, no un acto separado)",
        "Sujeto B / Sistema / Estructura (afectado por el conflicto vectorial)",
        "Nexo vectorial: la IA conflictiva produce el conflicto en el F del sujeto B",
    ],
    process_operations=[
        "ad-actio: A proyecta su vector hacia B/sistema (conducta activa)",
        "IA conflictiva: el vector de A entra en conflicto con el F establecido de B",
        "obstruction IA / non: el vector de B es bloqueado o excluido",
        "de-actio destructiva: separación destructiva de la relación operativa de B",
        "destabilization: la pauta vectorial del F de B es perturbada",
        "IF: transición del F de A (inocente → imputado → condenado) y de B (intacto → dañado)",
        "co-implication: múltiples consecuencias coexisten (responsabilidad penal + civil)",
    ],
    output_description=(
        "Examples: Theft = conflictive vector replacing operative relation (not 'taking object'). "
        "Homicide = vectorial interruption of operative continuity (not merely 'kill'). "
        "The delito produces a new unstable F requiring legal intervention to restabilize."
    ),
    output_elements=[
        "Nuevo F inestable: el sistema jurídico debe intervenir para restabilizar",
        "Responsabilidad penal de A (Art. 10 CP): IF activa consecuencias punitivas",
        "Responsabilidad civil derivada (Arts. 109-122 CP): co-implicación con daños",
        "Posible persona jurídica responsable (Art. 31 bis CP): extensión del IF",
    ],
    legal_references=[
        "Art. 10 CP — concepto de delito",
        "Arts. 109-122 CP — responsabilidad civil derivada del delito",
        "Art. 31 bis CP — responsabilidad penal personas jurídicas",
    ],
)


# ─────────────────────────────────────────────────────────────────────────────
# CONFIRMED IA MAPPING (from Detailed Structural Mapping §5)
# ─────────────────────────────────────────────────────────────────────────────

CONFIRMED_IA_MAPPING = {
    "ad-actio": {
        "formType": "direction",
        "confirmed": True,
        "canonical_meaning": "DIRECTION — vector moves toward (A ───→ B). Pure directional projection.",
    },
    "de-actio": {
        "formType": "retroaction",
        "confirmed": True,
        "canonical_meaning": (
            "RETROACTION / SEPARATIVE RETURN — vector separates or returns away from prior structure. "
            "(A ←─── B). Operative distancing or reverse separation."
        ),
    },
    "non": {
        "formType": "position",
        "confirmed": True,
        "canonical_meaning": (
            "POSITION — positional exclusion threshold (NOT pure negation). "
            "Meaning: 'vector cannot pass here'. "
            "The displacement to another F (Bloque II §4) is the CONSEQUENCE of this positional block."
        ),
    },
    "co-implication": {
        "formType": "plication",
        "confirmed": True,
        "canonical_meaning": (
            "PLICATION — simultaneous folding of vectors into one operational structure. "
            "co-implication produces coexistence of vectors (e.g. service + sale inside same phenomenon)."
        ),
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# NEW IA TYPES (from base case analysis)
# ─────────────────────────────────────────────────────────────────────────────

EXTENDED_IA_TYPES = {
    "ob-actio": {
        "label": "Ob-Actio",
        "subtitle": "Capa de Obligación Operativa",
        "icon": "○→",
        "formType": "position",
        "vectorProp": "posición",
        "desc": (
            "Operative surrounding / obligation layer. "
            "Creates an operative context (ob = around/against) that wraps the phenomenon. "
            "Used in Apropiación: establishes the obligation layer surrounding the relation."
        ),
        "compatible": ["ad-actio", "co-implication"],
        "bloqueRef": "Bloque VIII — Apropiación IA table",
    },
    "stabilization": {
        "label": "Estabilización",
        "subtitle": "Persistencia de Pauta Vectorial",
        "icon": "═",
        "formType": "plication",
        "vectorProp": "plicación",
        "desc": (
            "Persistence of vector pattern. "
            "In PHENOMENON: stabilization IS the technical homologation operation. "
            "A phenomenon cannot be homologated without prior stabilization of its vectors."
        ),
        "compatible": ["ad-actio", "co-implication", "ob-actio"],
        "bloqueRef": "Bloque VIII — Tentio + Usucapión · Bloque VI (Stabilization)",
    },
    "obstruction_ia": {
        "label": "Obstrucción IA",
        "subtitle": "Bloqueo Vectorial",
        "icon": "⊗",
        "formType": "position",
        "vectorProp": "posición",
        "desc": (
            "Blocking — obstructs the operative continuity of a target phenomenon. "
            "Used in Delito: the conflictive IA blocks the target's vector flow."
        ),
        "compatible": ["non", "de-actio"],
        "bloqueRef": "Bloque VIII — Delito IA table",
    },
    "destabilization": {
        "label": "Desestabilización",
        "subtitle": "Perturbación de Pauta",
        "icon": "≋",
        "formType": "retroaction",
        "vectorProp": "sentido",
        "desc": (
            "Pattern disruption. Opposite of stabilization. "
            "Used in Delito: produces vectorial conflict that disrupts the target's established F."
        ),
        "compatible": ["de-actio", "obstruction_ia"],
        "bloqueRef": "Bloque VIII — Delito IA table",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# Registry and helpers
# ─────────────────────────────────────────────────────────────────────────────

BASE_CASES: dict[str, BaseCaseFlow] = {
    "apropiacion":  APROPIACION,
    "tentio":       TENTIO,
    "usucapion":    USUCAPION,
    "delito":       DELITO,
}


def get_base_case(name: str) -> Optional[BaseCaseFlow]:
    return BASE_CASES.get(name.lower())


def list_base_cases() -> list[str]:
    return list(BASE_CASES.keys())


def base_case_to_phenomenon(case: BaseCaseFlow) -> TheoreticalPhenomenon:
    """Convert a BaseCaseFlow to a TheoreticalPhenomenon for engine processing."""
    import uuid
    ph_id = str(uuid.uuid4())

    center = Action(
        id=str(uuid.uuid4()),
        phenomenon_id=ph_id,
        subtype=ActionSubtype.PRIMARY,
        description=case.phenomenon_definition,
    )

    # Map IA table to IAInteraction objects
    ia_form_map = {
        "direction":  IAFormType.DIRECTION,
        "retroaction":IAFormType.RETROACTION,
        "plication":  IAFormType.PLICATION,
        "position":   IAFormType.POSITION,
        "sense":      IAFormType.SENSE,
    }
    interactions = []
    for ia_entry in case.ia_table:
        form = ia_form_map.get(ia_entry.get("formType", ""), IAFormType.DIRECTION)
        interactions.append(IAInteraction(
            id=str(uuid.uuid4()),
            phenomenon_id=ph_id,
            form_type=form,
            source_id=center.id,
            target_id=ph_id,
            description=f"{ia_entry['ia']}: {ia_entry['role']}",
        ))

    periphery = [
        Circumaction(
            id=str(uuid.uuid4()),
            phenomenon_id=ph_id,
            level=CircumactionLevel.CA2,
            function=CircumactionFunction.CONTEXT,
            persistence=True,
            description=ref,
            value=ref,
        )
        for ref in case.legal_references
    ]

    return TheoreticalPhenomenon(
        id=ph_id,
        name=case.case_name,
        type=PhenomenonType.CONCRETE,
        state=PhenomenonState.ACTIVE,
        action=center,
        interactions=interactions,
        circumactions=periphery,
    )
