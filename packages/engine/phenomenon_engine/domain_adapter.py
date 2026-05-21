"""
PHENOMENON Domain Adapter — base class for all domain implementations.

Every domain (contracts, arbitration, mediation, 103bis) subclasses this.
The engine never changes. Only the adapter changes between domains.

Architecture rule (00_README_CORE.docx):
  "Prioridad absoluta del backend ontológico sobre frontend."
  The adapter defines what PHENOMENON concepts MEAN in a given domain.
  The frontend displays whatever the adapter exposes.

How to add a new domain:
  1. Create apps/<domain>/backend/adapters/<domain>_adapter.py
  2. Subclass DomainAdapter
  3. Implement the 5 required methods
  4. Register in PHENOMENON_CONFIG domain_<name> = True
  5. Frontend picks it up automatically

When Layer 0 theory arrives (Enus, REC Matrix, etc.):
  - Add the optional method to this base class (default: no-op)
  - Override in each adapter if the domain benefits from it
  - No adapter breaks; each can opt in when ready
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ESSFieldDef:
    """Definition of one ESS field for a domain."""
    key: str
    label_en: str
    label_es: str
    field_type: str = "text"           # text | date | number | select | textarea
    required: bool = True
    ist_role: str = ""                 # "spatial" | "temporal" | "" — Bloque III IST
    ontological_type: str = "ess"      # ess | ca1 | ca2
    placeholder_en: str = ""
    placeholder_es: str = ""
    options: list[str] = field(default_factory=list)


@dataclass
class IARoleMapping:
    """How a domain maps its IA operators to theoretical PHENOMENON forms."""
    domain_label: str          # e.g. "claim", "objection", "defense"
    theoretical_form: str      # "direction" | "retroaction" | "position" | "plication" | "sense"
    vector_property: str       # "dirección" | "sentido" | "posición" | "plicación"
    label_en: str
    label_es: str
    icon: str
    color: str
    desc_en: str
    desc_es: str
    compatible_with: list[str]
    confirmed: bool = False    # True when officially confirmed from documentation


@dataclass
class OpusLevelDef:
    """What PARTIAL/COMPLETE/OPONIBLE mean in a specific domain."""
    partial_label_en: str
    partial_label_es: str
    partial_desc_en: str
    complete_label_en: str
    complete_label_es: str
    complete_desc_en: str
    oponible_label_en: str
    oponible_label_es: str
    oponible_desc_en: str
    oponible_registry_en: str    # what registration grants oponibility in this domain


@dataclass
class DisclaimerConfig:
    """Disclaimer requirements for a domain."""
    show_not_legal_advice: bool = True
    show_not_binding: bool = True
    custom_disclaimer_en: str = ""
    custom_disclaimer_es: str = ""
    requires_session_acceptance: bool = False
    show_on_every_document: bool = True


class DomainAdapter(ABC):
    """
    Abstract base class for all PHENOMENON domain adapters.

    Required: implement the 5 abstract methods.
    Optional: override the Layer 0 methods when new theory arrives.
    """

    # ── Identity ──────────────────────────────────────────────────────────────

    @property
    @abstractmethod
    def domain_id(self) -> str:
        """Unique domain identifier. e.g. 'contracts', 'arbitration'"""

    @property
    @abstractmethod
    def domain_name_en(self) -> str:
        """Human-readable English domain name."""

    @property
    @abstractmethod
    def domain_name_es(self) -> str:
        """Human-readable Spanish domain name."""

    @property
    def languages(self) -> list[str]:
        """Default: both. Override to restrict."""
        return ["es", "en"]

    # ── The 5 required domain definitions ─────────────────────────────────────

    @abstractmethod
    def ess_fields(self) -> list[ESSFieldDef]:
        """
        What ESS (Ser — Stable Identity) means in this domain.
        Bloque I: ESS = what the phenomenon IS (cannot change without being a different phenomenon).
        """

    @abstractmethod
    def ag_structure(self) -> dict:
        """
        What AG (Ager — Operative Layer) means in this domain.
        Bloque I: AG = what the phenomenon DOES (can change while retaining ESS identity).
        Returns: { "clauses_label_en": str, "clauses_label_es": str, "sub_types": list }
        """

    @abstractmethod
    def ia_operators(self) -> list[IARoleMapping]:
        """
        Which IA operators apply in this domain and what they mean here.
        Bloque II: IA are the vectorial operators governing how phenomena interact.
        CONFIRMED mapping: ad-actio=DIRECTION, de-actio=RETROACTION, non=POSITION, co-implication=PLICATION
        """

    @abstractmethod
    def homologation_rules(self) -> list[dict]:
        """
        Domain-specific validation rules for homologation.
        Bloque VI: Homologation = stabilization. "Stability is persistence of vector patterns."
        Returns: list of { key, label_en, label_es, required, group, check_fn_name }
        """

    @abstractmethod
    def opus_levels(self) -> OpusLevelDef:
        """
        What PARTIAL → COMPLETE → OPONIBLE mean in this domain.
        Bloque IV: Opus emerges from vector convergence.
        Bloque V: OPONIBLE = registered/enforceable against third parties.
        """

    # ── Disclaimers ───────────────────────────────────────────────────────────

    def disclaimer_config(self) -> DisclaimerConfig:
        """Override to customise disclaimers per domain."""
        return DisclaimerConfig()

    # ── Claude AI prompts ─────────────────────────────────────────────────────

    def ai_system_prompt(self, language: str = "es") -> str:
        """System prompt for Claude AI when generating content in this domain."""
        return (
            "You are the PHENOMENON engine AI layer. "
            "Generate structured content based on the phenomenon's ESS, AG, and IA structure. "
            "Respond in valid JSON only."
        )

    def ai_generation_prompt(self, phenomenon_type: str, ess: dict, language: str = "es") -> str:
        """User prompt for generating sub-phenomenon content."""
        return f"Generate content for {phenomenon_type} with ESS: {ess}"

    # ── Optional Layer 0 methods (override when new theory arrives) ───────────

    def apply_enus_layer(self, phenomenon_data: dict) -> dict:
        """
        PENDING — 01_ONTOLOGY_CORE.docx
        When Enus/Ensus/Exus/Entus documentation arrives:
          Override this to type each phenomenon component with its LFP type.
        Default: no-op (returns unchanged).
        """
        return phenomenon_data

    def apply_rec_matrix(self, ia_set: list[str]) -> dict:
        """
        PENDING — 02_REC_MATRIX.docx
        When REC Matrix documentation arrives:
          Override to classify ia_set as Puro / Cebra.
        Default: falls back to binary compatible/incompatible check.
        """
        from .ia_engine import IAEngine
        valid, errors = IAEngine().validate_set(ia_set)
        return {
            "type": "puro" if valid else "incompatible",
            "valid": valid,
            "errors": errors,
            "rec_matrix_applied": False,
        }

    def parse_morphology(self, text: str, language: str = "es") -> dict:
        """
        PARTIAL — 03_LANGUAGE_BACKEND.docx
        When full morphological system is implemented:
          Override to parse text and map suffixes to ontological types.
        Default: basic keyword detection only.
        """
        return {
            "text": text,
            "morphology_applied": False,
            "note": "Full Language Backend pending 03_LANGUAGE_BACKEND.docx implementation",
        }

    def apply_az_transformation(self, source_id: str, phenomenon_ids: list[str]) -> dict:
        """
        PENDING — 04_TRANSFORMATION_RULES.docx
        When AZ transformation is implemented:
          Override for broadcast from one phenomenon to all related.
        Default: returns the source_id only (AB point-to-point).
        """
        return {
            "type": "AB",
            "source": source_id,
            "targets": phenomenon_ids,
            "az_applied": False,
            "note": "AZ broadcast pending 04_TRANSFORMATION_RULES.docx implementation",
        }

    # ── Utility ───────────────────────────────────────────────────────────────

    def validate(self) -> list[str]:
        """Check that all required methods are properly implemented."""
        errors = []
        if not self.ess_fields():
            errors.append(f"{self.domain_id}: ess_fields() returned empty")
        if not self.ia_operators():
            errors.append(f"{self.domain_id}: ia_operators() returned empty")
        if not self.homologation_rules():
            errors.append(f"{self.domain_id}: homologation_rules() returned empty")
        return errors

    def to_dict(self) -> dict:
        """Serialise adapter metadata for API responses."""
        return {
            "domain_id": self.domain_id,
            "name_en":   self.domain_name_en,
            "name_es":   self.domain_name_es,
            "languages": self.languages,
            "ess_field_count":       len(self.ess_fields()),
            "ia_operator_count":     len(self.ia_operators()),
            "homologation_rule_count": len(self.homologation_rules()),
        }
