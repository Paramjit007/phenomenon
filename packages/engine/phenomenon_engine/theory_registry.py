"""
PHENOMENON Theory Registry — single source of truth for what is implemented.

When new documentation arrives:
  1. Find the matching entry (or create one)
  2. Change status: PENDING → IMPLEMENTING → IMPLEMENTED
  3. Add the source document reference
  4. Implement in the engine
  5. Domains and frontend inherit automatically

Critical Rule (07_CRITICAL_WARNINGS.docx):
  "No congelar ontología demasiado pronto."
  This registry exists so the ontology never gets accidentally frozen.
"""
from dataclasses import dataclass, field
from enum import Enum


class TheoryStatus(str, Enum):
    PENDING        = "PENDING"         # known but not yet documented enough to implement
    PLANNED        = "PLANNED"         # confirmed direction, not started
    IMPLEMENTING   = "IMPLEMENTING"    # documentation received, being coded
    PARTIAL        = "PARTIAL"         # coded but incomplete — needs more source material
    IMPLEMENTED    = "IMPLEMENTED"     # fully coded and tested
    SUPERSEDED     = "SUPERSEDED"      # replaced by a better implementation


@dataclass
class TheoryEntry:
    key: str
    name: str
    status: TheoryStatus
    source: list[str]                  # which document(s) define this
    engine_file: str = ""              # which .py file implements this
    note: str = ""                     # what it means / what we know
    works_without: str = ""            # what still works even without this
    enables_when_ready: str = ""       # what this unlocks when implemented
    blocked_by: list[str] = field(default_factory=list)  # dependencies


REGISTRY_VERSION = "2.2"  # bump to force Docker cache invalidation

REGISTRY: dict[str, TheoryEntry] = {

    # ════════════════════════════════════════════════════════
    # LAYER 0 — Pre-Core (Master Blocks)
    # Source: PHENOMENON_MASTER_BLOCKS/
    # ════════════════════════════════════════════════════════

    "enus_ensus_exus_entus": TheoryEntry(
        key="enus_ensus_exus_entus",
        name="Four Ontological Primitives (LFP)",
        status=TheoryStatus.PENDING,
        source=["01_ONTOLOGY_CORE.docx"],
        note=(
            "Enus (existence-in-form), Ensus (entity-as-state), "
            "Exus (extraction/exit = Opus), Entus (entry/engagement = A1 action). "
            "These are MORE fundamental than Ess/Ag. "
            "P1 = immaterial structure (librería level). "
            "P2 = structural/material reunification (acetato level). "
            "When received: will refine/replace the Ess/Ag duality in models.py."
        ),
        works_without="All current domains work with Ess/Ag — Enus layer will enrich them",
        enables_when_ready="Full LFP logic, morphological parsing, deeper homologation",
    ),

    "rec_matrix": TheoryEntry(
        key="rec_matrix",
        name="REC Matrix — Puro / Cebra Compatibility",
        status=TheoryStatus.PENDING,
        source=["02_REC_MATRIX.docx"],
        note=(
            "Extends binary compatible/incompatible IA check to three types: "
            "Puro = single unmixed IA structure (currently 'valid'). "
            "Cebra = hybrid/alternating mixed IA (currently not modelled — would be 'valid' even though mixed). "
            "Continuidad IF = IF connections maintain vector continuity across phenomena. "
            "When received: will refine ia_engine.py validate_set() and bridge.py check_ia_superimposition()."
        ),
        works_without="Basic binary IA compatibility still works and catches conflicts",
        enables_when_ready="Richer IA interaction model — cebra phenomena become explicitly valid",
    ),

    "language_backend_morphology": TheoryEntry(
        key="language_backend_morphology",
        name="Linguistic Morphology → Ontology Mapping",
        status=TheoryStatus.PARTIAL,
        source=["03_LANGUAGE_BACKEND.docx", "Bloque VI (language_engine.py)"],
        engine_file="language_engine.py",
        note=(
            "Suffix system: -ado/-ado = Trapecio (past/completed state), "
            "-to/-ción = Opus (result/output), "
            "-nt/-ante = Entus (active engaging participant), "
            "-en = Enus (existence state). "
            "Verbo (verb) = word/sign of action. Sustantivo (noun) = structural axis. "
            "Currently: basic IA form semantic meanings in language_engine.py. "
            "MISSING: morphological parser that reads Spanish/English text and "
            "maps word suffixes to ontological types automatically."
        ),
        works_without="Manual IA assignment works; semantic descriptions work",
        enables_when_ready="NLP auto-parsing of legal texts into PHENOMENON structures — critical for SIAC co-pilot",
    ),

    "transformation_rules_ab_az": TheoryEntry(
        key="transformation_rules_ab_az",
        name="AB/AZ Transformation Rules",
        status=TheoryStatus.PENDING,
        source=["04_TRANSFORMATION_RULES.docx"],
        note=(
            "AB = traslado de valor — directional point-to-point value transfer (A→B). "
            "Currently: our cascade_engine implements AB (master→sub-contract). "
            "AZ = complemento basal — A to ALL (the entire phenomenal space). "
            "MISSING: AZ transformation — the broadcast from one phenomenon to all related. "
            "This is the formal basis for oponibilidad erga omnes (Bloque V). "
            "Persistencia orbital = the IA orbit persists even when A1 core transforms. "
            "Currently: we reset homologation to PENDING on ESS change — correct for AB. "
            "AZ would mean: one change broadcasts to the entire ecosystem simultaneously."
        ),
        works_without="AB cascade works correctly; basic oponibility engine works",
        enables_when_ready="True erga omnes broadcast, full oponibility model, registry diffusion",
    ),

    "geometric_render_full": TheoryEntry(
        key="geometric_render_full",
        name="Full Geometric Render (Nested Orbits, Trapecios, Circumenus)",
        status=TheoryStatus.PARTIAL,
        source=["05_GEOMETRIC_RENDER.docx", "Bloque V (geometry_model.py)"],
        engine_file="geometry_model.py",
        note=(
            "Implemented: Center(A1) → Orbit(IA) → Periphery(CA), Librería/Acetato. "
            "MISSING: "
            "Órbitas anidadas (nested orbits formally defined — we have fractal but informally). "
            "Circumenus = CA crystallised into its own Enus existence form — depends on Enus layer. "
            "Trapecios = geometric form of -ado (past/completed) structures — asymmetric stable shape. "
            "Ess-agia = ESS in active operative mode. "
            "Agessia = AG in its existence state. "
            "These two compound forms suggest ESS and AG can exchange operational roles."
        ),
        works_without="Basic geometry works; ContractGraph renders correctly",
        enables_when_ready="Full geometric computation, trapecio rendering, Ess-agia/Agessia role exchange",
        blocked_by=["enus_ensus_exus_entus"],
    ),

    # ════════════════════════════════════════════════════════
    # LAYER 1 — Bloques I-IX (current engine)
    # ════════════════════════════════════════════════════════

    "bloques_i_iii": TheoryEntry(
        key="bloques_i_iii",
        name="Bloques I-III (Ontology, Structure, Action)",
        status=TheoryStatus.IMPLEMENTED,
        source=["Bloque_I.docx", "Bloque_II.docx", "Bloque_III.docx", "Detailed Structural Mapping.txt"],
        engine_file="bloque_i.py, bloque_ii.py, bloque_iii.py",
        note="IA mapping CONFIRMED. Suspension/Frequency/IST/Plication implemented.",
    ),

    "bloques_iv_ix": TheoryEntry(
        key="bloques_iv_ix",
        name="Bloques IV-IX (Opus, Oponibility, Stabilization, Product, Scaling, Intelligence)",
        status=TheoryStatus.PARTIAL,
        source=["PHENOMENON_Integrated_Blocks_I_IX.docx", "PHENOMENON CORE — DATA MODEL v1.docx"],
        engine_file="opus_engine.py, oponibility_engine.py, operation_engine.py, ia_modulation_engine.py, event_engine.py",
        note=(
            "Implemented: Opus (PARTIAL/COMPLETE/OPONIBLE), Oponibilidad, Operations, Events. "
            "MISSING from Bloque VII Product Layer: Timeline, Simulation Console, IA Library. "
            "MISSING from Bloque IX: Pattern recognition, automation, prediction."
        ),
    ),

    "base_cases_full": TheoryEntry(
        key="base_cases_full",
        name="Bloque VIII Base Cases — Full Structural Definitions",
        status=TheoryStatus.PARTIAL,
        source=["PHENOMENON — Detailed Structural Mapping.txt"],
        engine_file="base_cases.py",
        note=(
            "Implemented: Apropiación, Tentio, Usucapión, Delito with full IA tables. "
            "CONFIRMED mapping: ad-actio=DIRECTION, de-actio=RETROACTION, non=POSITION, co-implication=PLICATION. "
            "NEW IA types added: ob-actio, stabilization, obstruction_ia, destabilization. "
            "MISSING: deeper integration with Enus layer when available."
        ),
        blocked_by=["enus_ensus_exus_entus"],
    ),

    # ════════════════════════════════════════════════════════
    # LAYER 2 — Domain Adapters
    # ════════════════════════════════════════════════════════

    "domain_contracts": TheoryEntry(
        key="domain_contracts",
        name="Domain A: Legal Contracts (Spanish Law)",
        status=TheoryStatus.IMPLEMENTED,
        source=["apps/contracts/"],
        engine_file="bridge.py, homologation_engine.py, cascade_engine.py",
        note=(
            "9 contract templates, 5 sub-contract types, homologation with 4 check groups, "
            "Opus PARCIAL/COMPLETO/OPONIBLE, oponibilidad by registry type, "
            "Bridge from domain to theoretical layer. "
            "Language: Spanish. IA: contract-domain labels."
        ),
    ),

    "domain_arbitration_siac": TheoryEntry(
        key="domain_arbitration_siac",
        name="Domain B: SIAC International Arbitration Co-pilot",
        status=TheoryStatus.IMPLEMENTING,
        source=["06_MVP_LEGAL.docx", "SIAC Rules 2022", "web research"],
        note=(
            "Confirmed by 06_MVP_LEGAL.docx. "
            "Languages: English + Spanish (bilingual). "
            "IA confirmed: ad-actio=claim, non=objection/preliminary plea, "
            "de-actio=defense/retroactive argument, co-implication=mutual obligation. "
            "SIAC Rules 2022 encoded as CA2 circumactions. "
            "Disclaimer: structural analysis only, not legal advice."
        ),
    ),

    "domain_mediation": TheoryEntry(
        key="domain_mediation",
        name="Domain C: Mediation",
        status=TheoryStatus.PLANNED,
        source=["06_MVP_LEGAL.docx"],
        note="Listed in 06_MVP_LEGAL. Simpler than arbitration. Higher volume. Build after SIAC.",
    ),

    "domain_103bis_lh": TheoryEntry(
        key="domain_103bis_lh",
        name="Domain D: Art. 103 bis LH (Court-supervised mortgage restructuring)",
        status=TheoryStatus.PLANNED,
        source=["06_MVP_LEGAL.docx"],
        note=(
            "Art. 103 bis Ley Hipotecaria — allows mortgage debtors to request "
            "court-supervised sale instead of foreclosure. High demand in Spain. "
            "Build after Mediation."
        ),
    ),
}


def get_status_summary() -> dict:
    """Returns a summary of theory implementation status."""
    from collections import Counter
    counts = Counter(e.status.value for e in REGISTRY.values())
    pending = [e.name for e in REGISTRY.values() if e.status == TheoryStatus.PENDING]
    return {
        "counts": dict(counts),
        "pending_items": pending,
        "total": len(REGISTRY),
        "completion_pct": round(
            100 * sum(1 for e in REGISTRY.values()
                      if e.status in (TheoryStatus.IMPLEMENTED, TheoryStatus.PARTIAL))
            / len(REGISTRY), 1
        ),
    }


def what_new_doc_affects(doc_filename: str) -> list[TheoryEntry]:
    """Given a new document filename, returns which theory entries it might affect."""
    return [
        e for e in REGISTRY.values()
        if any(doc_filename.lower() in s.lower() for s in e.source)
        or e.status == TheoryStatus.PENDING
    ]
