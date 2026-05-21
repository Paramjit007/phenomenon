"""
BLOQUE I — Ontología Base de PHENOMENON
(source: Bloque_I.docx)

Core axioms:
  1. Distinción fundamental: Ser (Ess) y Ager (Ag)
  2. Infinito: no predicable, no caótico ni fluídico
  3. Mundo: caótico (sin geometría) y fluídico (sin cortes)
  4. Geometrización: ordena y jerarquiza
  5. Estereización: fija y estabiliza

INTERPRETATION:
  The world/reality exists in a raw chaotic+fluid state.
  PHENOMENON applies two operations to make it computable:
    GEOMETRIZATION  → gives it order and hierarchy (structure)
    STERIZATION     → fixes and stabilises it (makes it definite)

  The fundamental split of every phenomenon:
    ESS (Ser / Being)  → WHAT the phenomenon IS (stable, geometric, fixed)
    AG  (Ager / Doing) → WHAT the phenomenon DOES (operative, dynamic)

  This maps directly to the contracts domain:
    ESS → EssFields  (partyA, partyB, jurisdiction, dates — the stable identity)
    AG  → ag_json    (clauses, terms — the operative layer)

  And to the theoretical domain:
    ESS → the geometric structure (Bloque 5 — center, orbit, periphery)
    AG  → the dynamic operations (Bloque 4 — continue, interrupt, distribute)
"""

# ── Ontological primitives ────────────────────────────────────────────────────

class OntologicalAxioms:
    """
    The five foundational axioms of PHENOMENON (Bloque I).
    These are not implementations but formal statements that guide all
    other engine components.
    """

    AXIOM_1 = (
        "Distinción fundamental: Ser (Ess) y Ager (Ag). "
        "Every phenomenon has two inseparable aspects: its BEING (what it is) "
        "and its DOING (what it does). Neither can exist without the other."
    )

    AXIOM_2 = (
        "Infinito: no predicable, no caótico ni fluídico. "
        "The infinite/universal cannot be predicated (described in terms of properties), "
        "is neither chaotic (lacks geometry) nor fluid (lacks cuts/boundaries). "
        "It is beyond the phenomenal system — the system's outer limit."
    )

    AXIOM_3 = (
        "Mundo: caótico (sin geometría) y fluídico (sin cortes). "
        "Raw reality/matter is chaotic (no inherent geometry) and fluid (no inherent boundaries). "
        "PHENOMENON imposes geometry and boundaries on this raw material."
    )

    AXIOM_4 = (
        "Geometrización: ordena y jerarquiza. "
        "Geometrization is the operation that gives the phenomenon its STRUCTURE: "
        "it orders elements and establishes hierarchy (center > orbit > periphery). "
        "→ Bloque 5 (Geometry) is the operational form of this axiom."
    )

    AXIOM_5 = (
        "Estereización: fija y estabiliza. "
        "Sterization is the operation that FIXES the phenomenon in its state: "
        "it makes the Ess definite and stable. Without sterization, a phenomenon "
        "cannot persist across time. "
        "→ Homologation is the technical form of sterization in the software."
    )


class EssAgDuality:
    """
    The Ess/Ag duality from Bloque I.
    Every PHENOMENON entity splits along these two axes.

    ESS (Ser — Being):
      - The stable, defined, geometric aspect
      - Cannot change without the phenomenon becoming a different phenomenon
      - In contracts: partyA, partyB, jurisdiction, effectiveDate, expiryDate
      - In theory: the Action A1 node type, position, structure

    AG (Ager — Doing):
      - The operative, dynamic, action-driven aspect
      - Can change while the phenomenon retains its identity
      - In contracts: clauses, payment terms, SLA metrics
      - In theory: the Interaction IA nodes, the operations

    RELATION:
      ESS provides the CONTAINER (the phenomenon's identity)
      AG  provides the CONTENT  (the phenomenon's activity)
      Neither can exist without the other.
    """

    @staticmethod
    def classify(field_key: str) -> str:
        """
        Classify a field key as ESS or AG based on its nature.
        Returns 'ESS', 'AG', or 'CA' (circumaction).
        """
        ESS_FIELDS = {
            "partyA", "partyB", "partyACIF", "partyBCIF",
            "partyAAddress", "partyBAddress",
            "partyARepresentative", "partyBRepresentative",
            "jurisdiction", "effectiveDate", "expiryDate",
        }
        CA_FIELDS = {
            "governingLaw", "territory", "automaticRenewal",
            "noticePeriod", "liabilityLimit", "vatRate",
        }
        if field_key in ESS_FIELDS:
            return "ESS"
        if field_key in CA_FIELDS:
            return "CA"
        return "AG"

    @staticmethod
    def is_ess_complete(ess_dict: dict) -> bool:
        """A phenomenon cannot be homologated if any core ESS field is empty."""
        required = {"partyA", "partyB", "jurisdiction", "effectiveDate", "expiryDate"}
        return all(ess_dict.get(k, "").strip() for k in required)

    @staticmethod
    def geometrize(phenomenon_name: str, ess: dict, ag_clauses: list) -> dict:
        """
        Apply Axiom 4 (Geometrización) to a phenomenon.
        Returns a description of the phenomenon's ordered structure.
        """
        return {
            "name": phenomenon_name,
            "geometrization": "applied",
            "ess_complete": EssAgDuality.is_ess_complete(ess),
            "center": "Action A1 — the primary act of this phenomenon",
            "orbit": f"{len(ag_clauses)} operative clauses (AG interactions)",
            "periphery": f"{len([v for v in ess.values() if v])} ESS identity fields as CA1 boundaries",
            "note": (
                "Geometrization orders: center (A1) > orbit (IA/clauses) > periphery (ESS as CA). "
                "Sterization fixes this structure through homologation."
            ),
        }
