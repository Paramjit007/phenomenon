"""
Bloque 5 — Geometría del Sistema PHENOMENON

"El sistema PHENOMENON no es únicamente conceptual o lógico, sino esencialmente
 geométrico. Todo fenómeno puede representarse mediante una estructura espacial
 organizada, en la que cada elemento ocupa una posición determinada y cumple una
 función específica dentro del conjunto."

THREE GEOMETRIC LAYERS:
  CENTER    → Action A1 (the primary action; nucleus of the phenomenon)
  ORBIT     → Interactions IA (surround the nucleus; dynamic relationships)
  PERIPHERY → Circumactions CA (boundary; constraints; context)

KEY PRINCIPLE: "La posición define la función."
  → An element's layer determines what role it plays.

LIBRERÍA vs ACETATO:
  Librería = the abstract model (type definition, template)
  Acetato  = a concrete instance (one specific phenomenon in reality)

TECHNICAL TRANSLATION (from Bloque 5 §4):
  Center    → main node (A1)
  Orbit     → close relations (IA nodes)
  Periphery → constraints / conditions (CA nodes)

Example — a compraventa (from the conversation):
  Center    → act of exchange (the core action)
  Orbit     → will (voluntad), price, object
  Periphery → law (ley), context (context)

This directly corresponds to the contracts domain:
  Center    → the contract itself (master phenomenon)
  Orbit     → clauses (AG), IA operators
  Periphery → jurisdiction, governing law, dates (Ess fields as CA)
"""
from dataclasses import dataclass, field
from typing import Optional
from .theoretical_models import Action, IAInteraction, Circumaction, TheoreticalPhenomenon
from .enums import CircumactionLevel


@dataclass
class PhenomenonGeometry:
    """
    The spatial/geometric representation of a Phenomenon.
    Position = function. Layer = role.
    """
    phenomenon_id: str

    # CENTER — must have exactly one A1
    center: Optional[Action] = None

    # ORBIT — 0..N interactions surrounding the center
    orbit: list[IAInteraction] = field(default_factory=list)

    # PERIPHERY — 0..N circumactions at the boundary
    periphery: list[Circumaction] = field(default_factory=list)

    # Metadata
    is_libreria: bool = False   # True = abstract template; False = concrete acetato
    label: str = ""             # Human-readable name for this geometry instance

    def validate(self) -> tuple[bool, list[str]]:
        """
        Geometric consistency rules (Bloque 5):
          - Center must have exactly one A1 action
          - Orbit elements must reference the center
          - Periphery elements may be independent (CA can operate without direct IA link)
        """
        errors: list[str] = []
        if self.center is None:
            errors.append("Geometría inválida: el centro está vacío. Todo fenómeno necesita una acción A1 en el centro.")
        if self.center and not self.center.activation_flag:
            errors.append("Centro inactivo: la acción A1 no está activada — el fenómeno no puede operar.")
        for ia in self.orbit:
            if not ia.source_id and not ia.target_id:
                errors.append(f"IA {ia.id} en órbita sin source/target — las interacciones deben conectar elementos.")
        return len(errors) == 0, errors

    def layer_of(self, element_id: str) -> str:
        """Return which geometric layer an element belongs to."""
        if self.center and self.center.id == element_id:
            return "CENTER"
        if any(ia.id == element_id for ia in self.orbit):
            return "ORBIT"
        if any(ca.id == element_id for ca in self.periphery):
            return "PERIPHERY"
        return "UNKNOWN"

    def to_dict(self) -> dict:
        return {
            "phenomenon_id": self.phenomenon_id,
            "is_libreria": self.is_libreria,
            "label": self.label,
            "center": {"id": self.center.id, "subtype": self.center.subtype, "potency": self.center.potency_level} if self.center else None,
            "orbit_count": len(self.orbit),
            "periphery_count": len(self.periphery),
            "orbit": [{"id": ia.id, "form": ia.form_type, "polarity": ia.polarity} for ia in self.orbit],
            "periphery": [{"id": ca.id, "level": ca.level, "function": ca.function, "value": ca.value} for ca in self.periphery],
        }


class GeometryEngine:
    """
    Builds and manages the geometric model of a TheoreticalPhenomenon.
    Converts the abstract model (Librería) into concrete instances (Acetatos).
    """

    def from_phenomenon(self, ph: TheoreticalPhenomenon, is_libreria: bool = False) -> PhenomenonGeometry:
        """Build a PhenomenonGeometry from a TheoreticalPhenomenon."""
        return PhenomenonGeometry(
            phenomenon_id=ph.id,
            center=ph.action,
            orbit=list(ph.interactions),
            periphery=list(ph.circumactions),
            is_libreria=is_libreria,
            label=ph.name,
        )

    def make_acetato(self, libreria: PhenomenonGeometry, concrete_name: str) -> PhenomenonGeometry:
        """
        Bloque 5 §6 — Instantiate a Librería (abstract) as an Acetato (concrete).
        The acetato inherits the structure but has its own identity and values.
        """
        import uuid, copy
        acetato = PhenomenonGeometry(
            phenomenon_id=str(uuid.uuid4()),
            center=copy.deepcopy(libreria.center),
            orbit=[copy.deepcopy(ia) for ia in libreria.orbit],
            periphery=[copy.deepcopy(ca) for ca in libreria.periphery],
            is_libreria=False,
            label=concrete_name,
        )
        # Assign new IDs to all copied elements
        if acetato.center:
            acetato.center.id = str(uuid.uuid4())
            acetato.center.phenomenon_id = acetato.phenomenon_id
        for ia in acetato.orbit:
            ia.id = str(uuid.uuid4())
            ia.phenomenon_id = acetato.phenomenon_id
        for ca in acetato.periphery:
            ca.id = str(uuid.uuid4())
            ca.phenomenon_id = acetato.phenomenon_id
        return acetato

    def add_to_orbit(self, geometry: PhenomenonGeometry, interaction: IAInteraction) -> None:
        """Add an interaction to the orbit layer."""
        geometry.orbit.append(interaction)

    def add_to_periphery(self, geometry: PhenomenonGeometry, circumaction: Circumaction) -> None:
        """Add a circumaction to the periphery layer."""
        geometry.periphery.append(circumaction)

    def promote_to_center(self, geometry: PhenomenonGeometry, action: Action) -> None:
        """Set the center A1 action (replaces any existing center)."""
        geometry.center = action

    def contracts_geometry(self, contract_name: str, ess: dict, clauses: list[str], ia_types: list[str]) -> PhenomenonGeometry:
        """
        Map the contracts domain to the geometric model.
          Center    → the contract's primary action (existence of the agreement)
          Orbit     → clauses as IA interactions
          Periphery → ESS identity fields as CA1 + regulatory framework as CA2
        """
        import uuid
        from .enums import ActionSubtype, ActionStatus, IAFormType, IAMode, IAPolarity
        from .enums import CircumactionFunction
        from .ia_modulation_engine import IAModulationEngine

        ph_id = str(uuid.uuid4())

        # CENTER: the contract act itself
        center = Action(
            id=str(uuid.uuid4()),
            phenomenon_id=ph_id,
            subtype=ActionSubtype.PRIMARY,
            status=ActionStatus.ACTIVE,
            potency_level=1.0 if all(ess.get(k) for k in ("partyA", "partyB", "jurisdiction")) else 0.5,
            activation_flag=True,
            description=f"Acto contractual: {contract_name}",
        )

        # ORBIT: each IA operator type as an interaction
        orbit = []
        for ia_label in ia_types:
            form = IAModulationEngine.contract_label_to_ia_form(ia_label)
            orbit.append(IAInteraction(
                id=str(uuid.uuid4()),
                phenomenon_id=ph_id,
                form_type=form,
                mode=IAMode.ACTIVE,
                intensity=1.0,
                polarity=IAPolarity.POSITIVE if form.value in ("direction", "plication") else IAPolarity.NEGATIVE,
                source_id=center.id,
                target_id="",
                description=f"Operador contractual: {ia_label} ({form.value})",
            ))

        # PERIPHERY CA1: ESS identity fields
        periphery = []
        for field_key, field_val in ess.items():
            if field_val:
                periphery.append(Circumaction(
                    id=str(uuid.uuid4()),
                    phenomenon_id=ph_id,
                    level=CircumactionLevel.CA1,
                    function=CircumactionFunction.BOUNDARY,
                    persistence=True,
                    description=f"ESS: {field_key}",
                    value=str(field_val),
                ))

        return PhenomenonGeometry(
            phenomenon_id=ph_id,
            center=center,
            orbit=orbit,
            periphery=periphery,
            is_libreria=False,
            label=contract_name,
        )
