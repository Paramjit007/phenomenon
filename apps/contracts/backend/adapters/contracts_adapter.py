"""
Domain A: Legal Contracts (Spanish Law) — Adapter
Wraps the existing contracts application as a formal PHENOMENON DomainAdapter.

This adapter makes the existing system compliant with the extensibility
architecture so that new domains (SIAC, Mediation, 103bis) can be added
without changing any existing code.

Languages: Spanish primary, English secondary.
IA mapping: CONFIRMED (Detailed Structural Mapping §5)
"""
from phenomenon_engine.domain_adapter import (
    DomainAdapter, ESSFieldDef, IARoleMapping, OpusLevelDef, DisclaimerConfig
)


class ContractsDomainAdapter(DomainAdapter):
    """Domain A: Contratos Jurídicos bajo Derecho Español."""

    @property
    def domain_id(self) -> str: return "contracts"

    @property
    def domain_name_en(self) -> str: return "Legal Contracts (Spanish Law)"

    @property
    def domain_name_es(self) -> str: return "Contratos Jurídicos — Derecho Español"

    @property
    def languages(self) -> list[str]: return ["es"]

    def ess_fields(self) -> list[ESSFieldDef]:
        return [
            ESSFieldDef(
                key="partyA", label_en="Party A (Legal Name)", label_es="Parte A (Razón Social)",
                required=True, ontological_type="ess",
                placeholder_es="Acme Solutions S.L.", placeholder_en="Acme Solutions S.L.",
            ),
            ESSFieldDef(
                key="partyB", label_en="Party B (Legal Name)", label_es="Parte B (Razón Social)",
                required=True, ontological_type="ess",
                placeholder_es="TechVenture España S.A.", placeholder_en="TechVenture España S.A.",
            ),
            ESSFieldDef(
                key="jurisdiction", label_en="Competent Courts (City)", label_es="Juzgados Competentes (Ciudad)",
                required=True, ontological_type="ca1", ist_role="spatial",
                placeholder_es="Madrid", placeholder_en="Madrid",
            ),
            ESSFieldDef(
                key="effectiveDate", label_en="Effective Date", label_es="Fecha de Inicio",
                field_type="date", required=True, ontological_type="ca1", ist_role="temporal",
            ),
            ESSFieldDef(
                key="expiryDate", label_en="Expiry Date", label_es="Fecha de Vencimiento",
                field_type="date", required=True, ontological_type="ca1", ist_role="temporal",
            ),
        ]

    def ag_structure(self) -> dict:
        return {
            "clauses_label_en": "Operative Clauses",
            "clauses_label_es": "Cláusulas Operativas (AG — Ager)",
            "sub_types": ["NDA", "SLA", "PAYMENT", "IP", "DPA",
                          "FINANCIACION", "HIPOTECA_GARANTIA", "CESION_CREDITO",
                          "CONDICION_SOLAR", "PAGO_APLAZADO", "CARGAS_URBANISTICAS"],
        }

    def ia_operators(self) -> list[IARoleMapping]:
        """
        IA operators confirmed by Detailed Structural Mapping §5.
        All four mappings officially confirmed.
        """
        return [
            IARoleMapping(
                domain_label="ad-actio",
                theoretical_form="direction", vector_property="dirección",
                label_en="Ad-Actio — Active Implication",
                label_es="Ad-Actio — Implicación Activa",
                icon="→", color="#C9A84C",
                desc_en="Creates a positive obligation: one party projects a binding vector toward the other (A ───→ B).",
                desc_es="Crea una obligación positiva: una parte proyecta un vector vinculante hacia la otra (A ───→ B).",
                compatible_with=["co-implication", "ad-actio"],
                confirmed=True,
            ),
            IARoleMapping(
                domain_label="de-actio",
                theoretical_form="retroaction", vector_property="sentido",
                label_en="De-Actio — Separative Return",
                label_es="De-Actio — Retorno Separativo",
                icon="←", color="#6B7280",
                desc_en="Separative return: the vector separates or reverses away from a prior structure (A ←─── B).",
                desc_es="Retorno separativo: el vector se aleja o separa de la estructura previa (A ←─── B).",
                compatible_with=["non", "de-actio"],
                confirmed=True,
            ),
            IARoleMapping(
                domain_label="non",
                theoretical_form="position", vector_property="posición",
                label_en="Non — Positional Exclusion Threshold",
                label_es="Non — Umbral de Exclusión Posicional",
                icon="✕", color="#DC2626",
                desc_en="NOT pure negation. A positional exclusion threshold: the vector cannot pass here. Displacement to another F is the consequence of this block.",
                desc_es="NO es pura negación. Umbral de exclusión posicional: el vector no puede pasar aquí. El desplazamiento a otro F es la consecuencia de este bloqueo.",
                compatible_with=["de-actio"],
                confirmed=True,
            ),
            IARoleMapping(
                domain_label="co-implication",
                theoretical_form="plication", vector_property="plicación",
                label_en="Co-Implication — Mutual Recursive Binding",
                label_es="Co-Implicación — Obligación Mutua Recíproca",
                icon="⇄", color="#7C3AED",
                desc_en="Simultaneous folding of vectors into one operational structure: both parties are equally and mutually bound (A ⇄ B).",
                desc_es="Plegamiento simultáneo de vectores: ambas partes están mutua y recíprocamente vinculadas (A ⇄ B).",
                compatible_with=["ad-actio", "co-implication"],
                confirmed=True,
            ),
        ]

    def homologation_rules(self) -> list[dict]:
        return [
            {"key": "partyA",        "label_es": "Parte A (Razón Social)",     "label_en": "Party A", "required": True,  "group": "Identidad ESS"},
            {"key": "partyB",        "label_es": "Parte B (Razón Social)",     "label_en": "Party B", "required": True,  "group": "Identidad ESS"},
            {"key": "jurisdiction",  "label_es": "Juzgados competentes",        "label_en": "Courts",  "required": True,  "group": "Identidad ESS"},
            {"key": "effectiveDate", "label_es": "Fecha de inicio",             "label_en": "Start",   "required": True,  "group": "Identidad ESS"},
            {"key": "expiryDate",    "label_es": "Fecha de vencimiento",        "label_en": "Expiry",  "required": True,  "group": "Identidad ESS"},
            {"key": "clauses",       "label_es": "Cláusulas operativas (AG)",   "label_en": "Clauses", "required": True,  "group": "Contenido AG"},
            {"key": "ia",            "label_es": "Operadores IA asignados",     "label_en": "IA ops",  "required": True,  "group": "Operadores IA — PHENOMENON"},
        ]

    def opus_levels(self) -> OpusLevelDef:
        return OpusLevelDef(
            partial_label_en="Partial Opus",       partial_label_es="Opus Parcial",
            partial_desc_en="ESS identity defined. AG/IA missing.",
            complete_label_en="Complete Opus",     complete_label_es="Opus Completo",
            complete_desc_en="All vectors converged. Homologated.",
            oponible_label_en="Enforceable Opus",  oponible_label_es="Opus Oponible",
            oponible_desc_en="Registered. Enforceable against third parties (erga omnes).",
            oponible_registry_en="Registro de la Propiedad / Registro Mercantil / OEPM",
        )

    def disclaimer_config(self) -> DisclaimerConfig:
        return DisclaimerConfig(
            show_not_legal_advice=True,
            show_not_binding=True,
            custom_disclaimer_es="Este sistema es una herramienta de análisis estructural. No constituye asesoramiento jurídico.",
            custom_disclaimer_en="This is a structural analysis tool. It does not constitute legal advice.",
            requires_session_acceptance=False,
            show_on_every_document=True,
        )

    def ai_system_prompt(self, language: str = "es") -> str:
        if language == "es":
            return (
                "Eres el motor de inteligencia contractual PHENOMENON, experto en derecho español. "
                "Genera cláusulas contractuales en español bajo legislación española vigente. "
                "Responde SOLO en JSON válido. Sin markdown ni texto adicional."
            )
        return (
            "You are the PHENOMENON contract intelligence engine, expert in Spanish law. "
            "Generate contract clauses in English following Spanish legal requirements. "
            "Respond ONLY in valid JSON."
        )
