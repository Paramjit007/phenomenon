# ── Domain layer (contracts application) ─────────────────────────────────────
from .cascade_engine import (
    CascadeEngine, CascadeResult, CASCADE_MAP,
    SubCascadeEngine, SubCascadeResult, SUB_CASCADE_MAP,
    ReverseCascadeEngine, ReverseCascadeResult, REVERSE_CASCADE_MAP,
)
from .ecosystem_engine import (
    EcosystemEngine, EcosystemState, EcosystemHomologationResult,
    ConsistencyIssue, CoverageItem, CONSISTENCY_RULES, REQUIRED_COVERAGE,
)
from .ia_engine import IAEngine, IACompatibilityError, IA_COMPATIBILITY
from .vector_engine import VectorEngine
from .phase_engine import PhaseEngine, PHASE_ORDER, PHASE_LABELS
from .homologation_engine import HomologationEngine
from .models import EssFields, Vector, OpusState, PhenomenonRecord
from .enums import (
    ContractType, ContractStatus, Homologation, VectorLation, IATypeCode,
)
from .protocols import PhenomenonRepository

# ── Theoretical PHENOMENON layer (Bloques 1-9) ───────────────────────────────
from .enums import (
    PhenomenonState, PhenomenonType,
    ActionSubtype, ActionStatus,
    IAFormType, IAMode, IAPolarity,
    CircumactionLevel, CircumactionFunction,
    OperationType, EventType,
)
from .theoretical_models import (
    Action, IAInteraction, Circumaction,
    TheoreticalPhenomenon, PhenomenonEvent, OperationResult,
)
from .operation_engine import OperationEngine
from .ia_modulation_engine import IAModulationEngine
from .circumaction_engine import CircumactionEngine
from .event_engine import EventEngine, default_bus
from .geometry_model import PhenomenonGeometry, GeometryEngine
from .language_engine import StructuralUnit, CompoundStructure, LanguageEngine
from .base_cases import (
    BaseCaseFlow, BASE_CASES, get_base_case, list_base_cases, base_case_to_phenomenon,
    CONFIRMED_IA_MAPPING, EXTENDED_IA_TYPES,
)
from .theory_registry import REGISTRY, TheoryStatus, TheoryEntry, get_status_summary, what_new_doc_affects
from .config import PHENOMENON_CONFIG, is_enabled, get_active_layers, get_pending_layers
from .domain_adapter import DomainAdapter, ESSFieldDef, IARoleMapping, OpusLevelDef, DisclaimerConfig
from .opus_engine import OpusEngine, OpusLevel, OpusResult
from .oponibility_engine import OponibilityEngine, OponibilityStatus, RegistryType
from .bridge import (
    contract_to_theoretical, theoretical_to_contract_state,
    validate_record_theoretically, check_ia_superimposition,
)
# Bloques I, II, III (from source documents)
from .bloque_i   import OntologicalAxioms, EssAgDuality
from .bloque_ii  import VectorProperties, IARelationEngine
from .bloque_iii import IST, FrequencyModulation, SuspensionEngine, PlicationEngine
from .enums      import PlicationType

__all__ = [
    # ── Contracts domain ──────────────────────────────────────────────────────
    "CascadeEngine", "CascadeResult", "CASCADE_MAP",
    "SubCascadeEngine", "SubCascadeResult", "SUB_CASCADE_MAP",
    "ReverseCascadeEngine", "ReverseCascadeResult", "REVERSE_CASCADE_MAP",
    "IAEngine", "IACompatibilityError", "IA_COMPATIBILITY",
    "VectorEngine",
    "PhaseEngine", "PHASE_ORDER", "PHASE_LABELS",
    "HomologationEngine",
    "EssFields", "Vector", "OpusState", "PhenomenonRecord",
    "ContractType", "ContractStatus", "Homologation", "VectorLation", "IATypeCode",
    "PhenomenonRepository",
    # ── Theoretical PHENOMENON (Bloques 1-9) ─────────────────────────────────
    "PhenomenonState", "PhenomenonType",
    "ActionSubtype", "ActionStatus",
    "IAFormType", "IAMode", "IAPolarity",
    "CircumactionLevel", "CircumactionFunction",
    "OperationType", "EventType",
    "Action", "IAInteraction", "Circumaction",
    "TheoreticalPhenomenon", "PhenomenonEvent", "OperationResult",
    "OperationEngine",
    "IAModulationEngine",
    "CircumactionEngine",
    "EventEngine", "default_bus",
    "PhenomenonGeometry", "GeometryEngine",
    "StructuralUnit", "CompoundStructure", "LanguageEngine",
    "BaseCaseFlow", "BASE_CASES", "get_base_case", "list_base_cases", "base_case_to_phenomenon",
]
