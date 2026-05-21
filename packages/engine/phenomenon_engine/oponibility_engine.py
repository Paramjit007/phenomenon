"""
Bloque V — Projection and O(b)ponibility

"O(b)ponibility is an IF threshold.
 Vectors project through IF.
 Registry diffuses structures."

O(b)PONIBILITY (oponibilidad in Spanish law) = the capacity of a legal
phenomenon to be enforceable AGAINST THIRD PARTIES — not just between
the contracting parties.

KEY PRINCIPLE:
  A contract vector exists WITHIN the phenomenon (intra-fenomenico).
  For it to affect third parties, it must PROJECT through an IF connection
  to an external Registry phenomenon.
  The Registry DIFFUSES the vector structure to the general legal space.

  Without registration → the vector is only oponible between parties.
  With registration    → the vector is oponible erga omnes (against everyone).

SPANISH LAW EXAMPLES:
  - Sale of real estate: not oponible to third-party buyers until registered
    in Registro de la Propiedad (Art. 32 Ley Hipotecaria)
  - Company constitution: not oponible to third parties until registered
    in Registro Mercantil (Art. 21 Código de Comercio)
  - IP transfer: not fully oponible without record in OEPM or RPInt.
  - Mortgage: only oponible after registration (Art. 1875 CC)

PHENOMENON MODELING:
  The Registry is itself a Phenomenon (F_registry).
  The IF connection: F_contract → IF_registration → F_registry
  Once connected via IF, the contract vector is diffused through the Registry.

⚠️  This concept is completely NEW in the integrated document —
    not present in the HTML conversation or the Bloque Word files.
"""
from dataclasses import dataclass, field
from typing import Optional
from .enums import CircumactionLevel, CircumactionFunction, EventType
from .theoretical_models import Circumaction, TheoreticalPhenomenon, PhenomenonEvent


class RegistryType(str):
    """Known Spanish public registries that confer oponibilidad."""
    REGISTRO_PROPIEDAD  = "Registro de la Propiedad"       # real estate
    REGISTRO_MERCANTIL  = "Registro Mercantil"              # companies
    OEPM                = "OEPM (Patentes y Marcas)"         # IP/patents
    RPInt               = "Registro de la Propiedad Intelectual"  # copyright
    REGISTRO_CIVIL      = "Registro Civil"                  # civil status
    REGISTRO_CONCURSAL  = "Registro Público Concursal"      # insolvency
    REGISTRO_CONTRATOS  = "Registro de Contratos"           # contracts (PoC)


@dataclass
class OponibilityStatus:
    """
    Bloque V — the oponibility status of a phenomenon.
    """
    is_oponible:    bool  = False    # True if vector has crossed IF→Registry
    registry:       str   = ""       # which registry conferred oponibility
    registered_date: str  = ""       # when registration occurred
    oponible_since:  str  = ""       # date from which erga omnes effect applies
    legal_basis:     str  = ""       # Spanish law article conferring oponibility
    missing:         list = field(default_factory=list)

    def summary(self) -> str:
        if self.is_oponible:
            return (
                f"Oponible erga omnes desde {self.oponible_since}. "
                f"Registro: {self.registry}. Base legal: {self.legal_basis}."
            )
        return (
            f"No oponible a terceros. "
            f"Para hacerlo oponible: {'; '.join(self.missing) or 'registrar en el registro correspondiente'}."
        )


class OponibilityEngine:
    """
    Bloque V — evaluates and manages the oponibility of phenomena.

    "O(b)ponibility is an IF threshold."
    The engine checks whether a phenomenon's vectors have projected
    through an IF connection to a Registry phenomenon.
    """

    # Which contract types require which registries for oponibility
    _REGISTRY_MAP: dict[str, dict] = {
        "MASTER": {
            "optional_registry": RegistryType.REGISTRO_MERCANTIL,
            "legal_basis": "Art. 21 Código de Comercio",
            "note": "Contratos comerciales no requieren registro obligatorio para oponibilidad inter partes",
        },
        "IP": {
            "required_registry": RegistryType.RPInt,
            "legal_basis": "Art. 145 RDL 1/1996 LPI",
            "note": "La cesión de derechos de autor se recomienda inscribir para plena oponibilidad",
        },
        "CONDICION_SOLAR": {
            "required_registry": RegistryType.REGISTRO_PROPIEDAD,
            "legal_basis": "Art. 1504 CC · Art. 11 LH · Art. 32 LH",
            "note": "La condición resolutoria debe inscribirse en el Registro de la Propiedad para ser oponible a terceros adquirentes",
        },
        "PAGO_APLAZADO": {
            "required_registry": RegistryType.REGISTRO_PROPIEDAD,
            "legal_basis": "Art. 1504 CC · Art. 11 Ley Hipotecaria",
            "note": "El precio aplazado garantizado con condición resolutoria expresa debe inscribirse",
        },
        "NDA": {
            "optional_registry": None,
            "legal_basis": "Ley 1/2019 de Secretos Empresariales",
            "note": "Los acuerdos de confidencialidad son oponibles inter partes sin registro; los secretos empresariales se protegen sin necesidad de registro formal",
        },
        "SLA": {
            "optional_registry": None,
            "legal_basis": "Art. 1258 CC",
            "note": "Los SLA son contratos privados oponibles entre partes; no requieren registro para su eficacia",
        },
    }

    def evaluate(self, contract_type: str, registered_in: str = "", registered_date: str = "") -> OponibilityStatus:
        """
        Evaluate the oponibility status for a given contract type.
        """
        config = self._REGISTRY_MAP.get(contract_type, {})
        required = config.get("required_registry")
        optional = config.get("optional_registry")
        legal_basis = config.get("legal_basis", "Art. 1258 CC")
        note = config.get("note", "")

        if registered_in:
            return OponibilityStatus(
                is_oponible=True,
                registry=registered_in,
                registered_date=registered_date,
                oponible_since=registered_date,
                legal_basis=legal_basis,
            )

        missing = []
        if required and not registered_in:
            missing.append(f"OBLIGATORIO: Inscribir en {required} ({legal_basis})")
        elif optional:
            missing.append(f"RECOMENDADO: Inscribir en {optional} para plena oponibilidad erga omnes ({legal_basis})")
        else:
            missing.append(f"Oponible inter partes sin registro. {note}")

        return OponibilityStatus(
            is_oponible=False,
            registry="",
            legal_basis=legal_basis,
            missing=missing,
        )

    def as_circumaction(self, status: OponibilityStatus, phenomenon_id: str) -> Circumaction:
        """
        Represent the oponibility status as a CA2 circumaction.

        Bloque V: "Registry diffuses structures" — the registry is an external
        CA2 (contextual/environmental) circumaction that diffuses the vector.
        """
        import uuid
        return Circumaction(
            id=str(uuid.uuid4()),
            phenomenon_id=phenomenon_id,
            level=CircumactionLevel.CA2,
            function=(
                CircumactionFunction.BOUNDARY if status.is_oponible
                else CircumactionFunction.CONDITION
            ),
            persistence=True,
            description=(
                f"Oponibilidad: {'OPONIBLE erga omnes' if status.is_oponible else 'Solo inter partes'}. "
                f"Registro: {status.registry or 'no inscrito'}."
            ),
            value=status.registry if status.is_oponible else "pendiente_registro",
        )
