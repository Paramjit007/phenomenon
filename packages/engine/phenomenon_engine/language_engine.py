"""
Bloque 6 — Lenguaje Estructural del Sistema PHENOMENON

"El sistema PHENOMENON no solo describe fenómenos, sino que permite expresarlos
 mediante un lenguaje propio. Este lenguaje no se basa en palabras arbitrarias,
 sino en estructuras geométricas y funcionales."

KEY PRINCIPLES:
  1. The minimal unit of meaning is not a word but a structural interaction
  2. Combinations of interactions generate compound meaning
  3. IA forms act as prefixes/suffixes (modulators of base interactions)
  4. Translation between languages = equivalence of structural forms
  5. Meaning is dynamic — depends on context (position + relations + dynamics)

CONNECTION TO AI (Bloque 6 §9):
  "El lenguaje estructural permite su implementación en sistemas informáticos
   ya que las unidades son definibles, las relaciones son formalizables,
   y las combinaciones son programables."
  → This is the bridge to NLP, LLMs, and semantic AI systems.
"""
from dataclasses import dataclass, field
from typing import Optional
from .enums import IAFormType, IAPolarity
from .theoretical_models import IAInteraction


@dataclass
class StructuralUnit:
    """
    Bloque 6 §3 — The minimal unit of meaning in PHENOMENON.
    One interaction = one unit of structural meaning.
    Meaning resides not in the element alone but in its:
      - function (what it does)
      - position (where it sits in the geometry)
      - effect (what it produces)
    """
    interaction: IAInteraction
    function: str   = ""   # what this unit does
    position: str   = ""   # CENTER / ORBIT / PERIPHERY
    effect: str     = ""   # the meaning it produces

    def describe(self) -> str:
        return (
            f"Unidad estructural [{self.interaction.form_type.value}] "
            f"| función: {self.function} "
            f"| posición: {self.position} "
            f"| efecto: {self.effect}"
        )


@dataclass
class CompoundStructure:
    """
    Bloque 6 §4 — A combination of structural units.
    Compound structures are analogous to compound words or sentences.
    The combination produces meaning that exceeds the sum of its parts.
    """
    units: list[StructuralUnit] = field(default_factory=list)
    label: str = ""

    def add(self, unit: StructuralUnit) -> "CompoundStructure":
        self.units.append(unit)
        return self

    def combined_meaning(self) -> str:
        parts = [u.effect or u.function for u in self.units if (u.effect or u.function)]
        return " + ".join(parts) if parts else "(sin significado definido)"

    def dominant_polarity(self) -> IAPolarity:
        """
        Bloque 6 §8 — The dominant polarity of a compound structure.
        Negative units cancel out in pairs (like double negation in language).
        """
        negatives = sum(1 for u in self.units if u.interaction.polarity == IAPolarity.NEGATIVE)
        if negatives % 2 == 0:
            return IAPolarity.POSITIVE
        return IAPolarity.NEGATIVE


class LanguageEngine:
    """
    Bloque 6 — Structural language operations.

    Implements:
      - Structural equivalence (translation between domains)
      - Prefix/suffix modulation (IA as language modifiers)
      - Compound structure assembly
      - Dynamic meaning generation
    """

    # ── IA forms as language operations (Bloque 6 §5+7) ──────────────────────
    # Each IA form modifies meaning like a prefix or suffix in natural language.
    _IA_MEANING: dict[str, dict] = {
        IAFormType.DIRECTION.value: {
            "role": "prefix",
            "effect": "asserts forward positive movement",
            "linguistic_analog": "ad- (toward)",
            "example_es": "ad-acción → obligación activa hacia adelante",
        },
        IAFormType.RETROACTION.value: {
            "role": "prefix",
            "effect": "reverses or removes the base meaning",
            "linguistic_analog": "de- / re- (back, removal)",
            "example_es": "de-acción → remoción, retroceso",
        },
        IAFormType.POSITION.value: {
            "role": "modifier",
            "effect": "blocks or prohibits the base interaction",
            "linguistic_analog": "non- / in- (negation)",
            "example_es": "non → prohibición, posición bloqueante",
        },
        IAFormType.PLICATION.value: {
            "role": "suffix",
            "effect": "replicates and folds the meaning recursively",
            "linguistic_analog": "-ply / -fold (multiply)",
            "example_es": "co-implicación → obligación mutua recursiva",
        },
        IAFormType.SENSE.value: {
            "role": "modifier",
            "effect": "shifts the polarity of the entire structure",
            "linguistic_analog": "un- / anti- (polarity shift)",
            "example_es": "sentido → cambio de polaridad del significado",
            "pending": "Bloque 6 full definition — requires confirmation from user",
        },
    }

    def ia_meaning(self, form_type: IAFormType) -> dict:
        """Return the linguistic meaning of an IA form."""
        return self._IA_MEANING.get(form_type.value, {"role": "unknown", "effect": "undefined"})

    def build_unit(self, interaction: IAInteraction, position: str = "ORBIT") -> StructuralUnit:
        """Convert an interaction into a structural unit with its semantic description."""
        meaning = self.ia_meaning(interaction.form_type)
        return StructuralUnit(
            interaction=interaction,
            function=meaning.get("role", ""),
            position=position,
            effect=meaning.get("example_es", meaning.get("effect", "")),
        )

    def assemble(self, interactions: list[IAInteraction]) -> CompoundStructure:
        """
        Bloque 6 §4 — Assemble a list of interactions into a compound structure.
        Order matters: interactions combine sequentially, each modifying the result.
        """
        compound = CompoundStructure(label="compound_" + "_".join(ia.form_type.value for ia in interactions))
        for ia in interactions:
            compound.add(self.build_unit(ia))
        return compound

    def translate(
        self,
        structure: CompoundStructure,
        target_domain: str,
    ) -> dict:
        """
        Bloque 6 §6 — Structural translation.
        Translates a compound structure from one domain to another by
        structural equivalence (same structure = same meaning).

        "La traducción no se realiza palabra por palabra, sino estructura por estructura."

        ⚠️ Full translation rules pending Bloque 6 complete Word document.
        Currently returns structural description that can be mapped to target domain.
        """
        return {
            "source_structure": structure.combined_meaning(),
            "dominant_polarity": structure.dominant_polarity().value,
            "target_domain": target_domain,
            "unit_count": len(structure.units),
            "structural_description": [u.describe() for u in structure.units],
            "translation_note": (
                f"Traducción estructural a dominio '{target_domain}'. "
                "Equivalencia: misma estructura geométrica = mismo significado funcional. "
                "Reglas completas pendientes del Bloque 6 (Word)."
            ),
        }

    def apply_prefix(
        self,
        base: StructuralUnit,
        prefix_form: IAFormType,
    ) -> CompoundStructure:
        """
        Bloque 6 §5 — Apply a prefix modifier to a base structural unit.
        Equivalent to adding a prefix in natural language.
        """
        import uuid
        from .theoretical_models import IAInteraction
        prefix_ia = IAInteraction(
            id=str(uuid.uuid4()),
            phenomenon_id=base.interaction.phenomenon_id,
            form_type=prefix_form,
            source_id=base.interaction.id,
            target_id=base.interaction.target_id,
        )
        prefix_unit = self.build_unit(prefix_ia, position="ORBIT_PREFIX")
        compound = CompoundStructure(label=f"{prefix_form.value}_{base.interaction.form_type.value}")
        compound.add(prefix_unit)
        compound.add(base)
        return compound

    def apply_suffix(
        self,
        base: StructuralUnit,
        suffix_form: IAFormType,
    ) -> CompoundStructure:
        """
        Bloque 6 §5 — Apply a suffix modifier to a base structural unit.
        Equivalent to adding a suffix in natural language.
        """
        import uuid
        from .theoretical_models import IAInteraction
        suffix_ia = IAInteraction(
            id=str(uuid.uuid4()),
            phenomenon_id=base.interaction.phenomenon_id,
            form_type=suffix_form,
            source_id=base.interaction.id,
            target_id=base.interaction.target_id,
        )
        suffix_unit = self.build_unit(suffix_ia, position="ORBIT_SUFFIX")
        compound = CompoundStructure(label=f"{base.interaction.form_type.value}_{suffix_form.value}")
        compound.add(base)
        compound.add(suffix_unit)
        return compound
