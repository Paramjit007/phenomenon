"""
Domain B: SIAC International Arbitration Co-pilot
SIAC Rules 2025 (7th Edition, in force 1 January 2025)

Source: SIAC Rules 2025, siac.org.sg
Research confirmed: SIAC Rules 2025 supersede 2016 Rules. No standalone 2022 edition.

IA mapping confirmed (Detailed Structural Mapping §5):
  ad-actio     = DIRECTION   → claim (positive assertion to tribunal)
  de-actio     = RETROACTION → defense / retroactive argument
  non          = POSITION    → preliminary objection / jurisdictional plea
  co-implication = PLICATION → mutual obligations under same contract/treaty

Disclaimer: structural analysis only — not legal advice.
No attorney-client relationship created. No legal obligations assumed.
"""
from phenomenon_engine.domain_adapter import (
    DomainAdapter, ESSFieldDef, IARoleMapping, OpusLevelDef, DisclaimerConfig
)


# ─── SIAC Rules 2025 — Key Provisions as CA2 Circumactions ────────────────────
# Source: SIAC Rules 2025 (siac.org.sg)
# CA2 = environmental/regulatory boundary wrapping the arbitral phenomenon

SIAC_CA2_RULES = {
    # ── Procedure type (amount-triggered, Rule 9 / Rule 13 / Schedule 2-3) ─────
    "procedure_type": {
        "label": "Procedure Type (SIAC Rules 2025)",
        "ca_level": "CA2",
        "ca_function": "BOUNDARY",
        "branches": [
            {"trigger": "amount <= SGD 1,000,000", "procedure": "Streamlined", "award_deadline_months": 3},
            {"trigger": "amount <= SGD 10,000,000 OR exceptional circumstances", "procedure": "Expedited", "award_deadline_months": 6},
            {"trigger": "urgent interim relief", "procedure": "EmergencyArbitrator", "award_deadline_days": 14},
            {"trigger": "default", "procedure": "Standard", "award_deadline_days": 90},  # 90 days to submit draft
        ],
    },

    # ── Timeline state machine ─────────────────────────────────────────────────
    "procedural_timeline": {
        "label": "Procedural Timeline (IST — temporal CA1)",
        "ca_level": "CA1",
        "ca_function": "CONDITION",
        "milestones": [
            {"day": 0,   "event": "Commencement", "trigger": "Complete NoA received by Registrar (Rule 3)"},
            {"day": 14,  "event": "Response deadline", "trigger": "Respondent files Response incl. counterclaims (Rule 7)"},
            {"day": 21,  "event": "Sole arbitrator nomination", "trigger": "Parties' joint nomination window (Rule 21)"},
            {"day": 28,  "event": "Co-arbitrator nominations", "trigger": "Party-nominated arbitrators (3-member) (Rule 22)"},
            {"day": 49,  "event": "Presiding arbitrator nomination", "trigger": "21 days after both co-arbitrators confirmed (Rule 22)"},
            {"day": "T+30post_last_submission", "event": "Award timeline disclosure", "trigger": "Tribunal discloses proposed schedule (Rule 52)"},
            {"day": "T+90post_last_submission", "event": "Draft award to SIAC scrutiny", "trigger": "Mandatory quality control (Rule 55)"},
        ],
        "emergency_arbitrator": [
            {"from_appointment": "24h", "event": "EA establishes procedural schedule (Rule 12, Schedule 1)"},
            {"from_appointment": "24h", "event": "Challenge to EA appointment (shortened from 2 days)"},
            {"from_appointment": "14d", "event": "EA must issue order/award (extendable by Registrar)"},
            {"from_noa":         "7d",  "event": "NoA must be filed after pre-commencement EA application"},
        ],
    },

    # ── Costs principles ───────────────────────────────────────────────────────
    "costs_allocation": {
        "label": "Costs Allocation (Rules 51, 56-58 SIAC 2025)",
        "ca_level": "CA2",
        "ca_function": "MODIFIER",
        "primary_rule": "Costs follow the event (losing party pays)",
        "modifiers": [
            "Tribunal discretion: proportionality, conduct, partial success",
            "Costs capping available (2025 innovation)",
            "Third-party funding: funder interest taken into account",
            "Security for costs: available against any claim/counterclaim (Rule 48)",
            "Legal costs: tribunal may order payment by any party (Rule 58)",
        ],
    },

    # ── Multi-party provisions ─────────────────────────────────────────────────
    "multi_party": {
        "label": "Multi-Party / Joinder / Consolidation (Rules 16-18)",
        "ca_level": "CA2",
        "ca_function": "CONTEXT",
        "options": [
            "Joinder: additional party bound by compatible arbitration agreement (Rule 18)",
            "Consolidation: same arbitration agreement OR same parties OR related transactions (Rule 16)",
            "Coordinated Proceedings: same tribunal, separate arbitrations (Rule 17, new in 2025)",
        ],
        "timing": {
            "pre_constitution": "President decides (President authority, not committee)",
            "post_constitution": "Tribunal decides",
        },
    },

    # ── Award requirements ─────────────────────────────────────────────────────
    "award_requirements": {
        "label": "Award Form and Enforcement (Rules 52-55 + New York Convention)",
        "ca_level": "CA2",
        "ca_function": "BOUNDARY",
        "requirements": [
            "Written, signed by all arbitrators (or majority)",
            "Reasons required (unless parties waived)",
            "Streamlined: reasons may be in summary form",
            "Seat stated — award deemed made at seat",
            "Submitted to SIAC scrutiny before issue (mandatory)",
        ],
        "post_award": [
            "Correction of errors: within 30 days of receipt (Rule 54)",
            "Additional award (omitted claim): within 30 days",
        ],
        "enforcement": "New York Convention 1958 — 170+ contracting states",
    },

    # ── Emergency Arbitrator ───────────────────────────────────────────────────
    "emergency_arbitrator": {
        "label": "Emergency Arbitrator (Rule 12, Schedule 1 SIAC 2025)",
        "ca_level": "CA2",
        "ca_function": "CONDITION",
        "trigger": "Urgent interim or conservatory relief needed",
        "new_2025": [
            "May be filed BEFORE commencement (NoA must follow within 7 days)",
            "Protective Preliminary Order (PPO): ex parte, granted within 24h of appointment",
            "PPO suspended if opposing party not heard within 2 days",
            "Challenge to EA: within 24 hours (from 2 days)",
        ],
        "fees": {"deposit": "SGD 30,000", "ea_fees": "SGD 25,000 fixed"},
    },

    # ── Seat as IST Spatial Relation ───────────────────────────────────────────
    "seat_of_arbitration": {
        "label": "Seat of Arbitration (IST — Spatial CA1)",
        "ca_level": "CA1",
        "ca_function": "BOUNDARY",
        "ist_role": "spatial",
        "effect": [
            "Award deemed made at seat (lex loci arbitri)",
            "Supervisory courts = courts of the seat",
            "Default seat: Singapore (if not agreed)",
        ],
        "enforcement_note": "Singapore awards enforceable via NYC in 170+ states",
    },
}


# ─── Three Real SIAC Case Patterns (from confirmed case research) ──────────────
# Used as Bloque VIII acetatos for the arbitration domain

SIAC_CASE_TEMPLATES = {
    "infrastructure_guarantee": {
        "name": "Infrastructure / Guarantee Enforcement",
        "sector": "Energy / Infrastructure",
        "example": "Equipment supply + guarantee dispute (multi-party, jurisdictional waiver)",
        "typical_claims": ["Unpaid contract price", "Guarantee enforcement", "Interest on unpaid amounts"],
        "typical_defenses": ["Forgery / invalidity of arbitration agreement", "Lack of authority", "Jurisdictional waiver argument"],
        "key_legal_issues": ["Scope of arbitration clause", "Waiver of jurisdictional objections", "Multi-party guarantees"],
        "ia_operators": {
            "claimant": ["ad-actio", "co-implication"],   # claim + guarantee mutual obligation
            "respondent": ["non", "de-actio"],              # jurisdictional objection + separation argument
        },
        "typical_amount_range": "USD 50M–500M",
        "siac_rules_ref": "Multi-party; potential joinder (Rule 18); costs follow event",
    },

    "jv_nda_loss_of_chance": {
        "name": "JV / NDA / Loss of Chance",
        "sector": "Energy / Natural Resources / M&A",
        "example": "JV partnership NDA breach — probability-based damages for lost commercial opportunity",
        "typical_claims": ["Breach of NDA / non-circumvention", "Lost profits", "Loss of chance damages"],
        "typical_defenses": ["No proven loss", "Project too speculative", "Causation denied"],
        "key_legal_issues": ["NDA breach and scope", "Loss of chance doctrine", "Probabilistic damages methodology"],
        "ia_operators": {
            "claimant": ["ad-actio", "co-implication"],   # breach claim + mutual NDA obligations
            "respondent": ["non", "de-actio"],              # denial of liability + retroactive separation
        },
        "typical_amount_range": "USD 10M–500M",
        "siac_rules_ref": "Standard procedure; complex damages; expert evidence on quantum",
    },

    "ma_spa_breach": {
        "name": "M&A / Share Purchase Agreement Breach",
        "sector": "Corporate / Private Equity",
        "example": "SPA breach — unpaid tranches, put option enforcement, cross-border enforcement",
        "typical_claims": ["Unpaid purchase consideration", "Put option enforcement", "Interest", "Costs"],
        "typical_defenses": ["Illegality under foreign law (FEMA)", "Arbitration clause invalidity", "Non-arbitrability"],
        "key_legal_issues": ["SPA arbitration clause scope", "Put option vs loan", "Cross-border enforcement", "FEMA compliance"],
        "ia_operators": {
            "claimant": ["ad-actio", "co-implication"],   # payment claim + SPA mutual obligations
            "respondent": ["non"],                          # positional block: non-arbitrability / illegality
        },
        "typical_amount_range": "USD 5M–100M",
        "siac_rules_ref": "May consolidate multiple SPAs (Rule 16); potential Indian enforcement issues",
    },
}


# ─── SIAC Domain Adapter ──────────────────────────────────────────────────────

class SIACArbitrationAdapter(DomainAdapter):
    """
    Domain B: SIAC International Arbitration Co-pilot.

    Languages: English (primary) + Spanish (secondary)
    Rules: SIAC Rules 2025 (7th Edition, in force 1 January 2025)
    IA confirmed: ad-actio=claim, non=objection, de-actio=defense, co-implication=mutual obligation
    Disclaimer: structural analysis only, not legal advice.
    """

    @property
    def domain_id(self) -> str: return "arbitration"

    @property
    def domain_name_en(self) -> str: return "SIAC International Arbitration Co-pilot"

    @property
    def domain_name_es(self) -> str: return "Co-piloto de Arbitraje Internacional SIAC"

    @property
    def languages(self) -> list[str]: return ["en", "es"]

    def ess_fields(self) -> list[ESSFieldDef]:
        """
        ESS = the stable facts of the dispute that cannot change without the case becoming different.
        Bloque I: ESS = what the dispute IS.
        """
        return [
            ESSFieldDef(
                key="claimant",
                label_en="Claimant (Full Legal Name)",
                label_es="Demandante (Nombre Legal Completo)",
                required=True, ontological_type="ess",
                placeholder_en="Shanghai Electric Group Co., Ltd.",
                placeholder_es="Sociedad Demandante S.A.",
            ),
            ESSFieldDef(
                key="respondent",
                label_en="Respondent (Full Legal Name)",
                label_es="Demandado (Nombre Legal Completo)",
                required=True, ontological_type="ess",
                placeholder_en="Reliance Infrastructure Limited",
                placeholder_es="Sociedad Demandada Ltd.",
            ),
            ESSFieldDef(
                key="seat",
                label_en="Seat of Arbitration",
                label_es="Sede del Arbitraje",
                required=True, ontological_type="ca1", ist_role="spatial",
                field_type="select",
                options=["Singapore (SIAC default)", "London", "Paris", "Hong Kong", "New York", "Geneva", "Dubai", "Other"],
                placeholder_en="Singapore (SIAC default)",
            ),
            ESSFieldDef(
                key="applicable_law",
                label_en="Applicable Law (lex contractus)",
                label_es="Ley Aplicable (lex contractus)",
                required=True, ontological_type="ca2",
                placeholder_en="English law / Singapore law / Indian law",
                placeholder_es="Ley inglesa / Ley de Singapur / Ley india",
            ),
            ESSFieldDef(
                key="arbitration_clause_ref",
                label_en="Arbitration Clause Reference",
                label_es="Referencia de la Cláusula Arbitral",
                required=True, ontological_type="ess",
                placeholder_en="Clause 23.1 of the Equipment Supply Agreement dated 15 June 2008",
            ),
            ESSFieldDef(
                key="filing_date",
                label_en="Date of Notice of Arbitration (Commencement)",
                label_es="Fecha de Notificación de Arbitraje (Inicio del procedimiento)",
                field_type="date", required=True, ontological_type="ca1", ist_role="temporal",
            ),
            ESSFieldDef(
                key="claim_amount_usd",
                label_en="Claim Amount (USD or equivalent)",
                label_es="Cuantía Reclamada (USD o equivalente)",
                field_type="number", required=True, ontological_type="ess",
                placeholder_en="147000000",
            ),
        ]

    def ag_structure(self) -> dict:
        return {
            "clauses_label_en": "Claims, Defenses & Legal Arguments",
            "clauses_label_es": "Pretensiones, Defensas y Argumentos Jurídicos",
            "sub_types": [
                "MAIN_CLAIM",        # primary claim (ad-actio)
                "PRELIMINARY_OBJECTION",  # jurisdictional/admissibility (non)
                "DEFENSE",           # substantive defense (de-actio)
                "COUNTERCLAIM",      # counterclaim (ad-actio reversed)
                "QUANTUM",           # damages quantum (co-implication with liability)
                "COSTS",             # costs application (follows event)
            ],
            "siac_rules": SIAC_CA2_RULES,
            "case_templates": SIAC_CASE_TEMPLATES,
        }

    def ia_operators(self) -> list[IARoleMapping]:
        """
        IA operators in the arbitration domain.
        All four confirmed by Detailed Structural Mapping §5.
        Domain meaning: what each operator represents in a legal dispute context.
        """
        return [
            IARoleMapping(
                domain_label="ad-actio",
                theoretical_form="direction", vector_property="dirección",
                label_en="Claim — Positive Assertion to Tribunal",
                label_es="Pretensión — Afirmación Positiva al Tribunal",
                icon="→", color="#C9A84C",
                desc_en=(
                    "A claim is a directional vector: the claimant projects a positive assertion "
                    "toward the respondent via the tribunal. In SIAC: each head of claim is an "
                    "ad-actio with its own vector strength (strength of legal basis + evidence)."
                ),
                desc_es=(
                    "Una pretensión es un vector direccional: el demandante proyecta una afirmación "
                    "positiva hacia el demandado a través del tribunal. En SIAC: cada pretensión "
                    "es un ad-actio con su propia fuerza vectorial."
                ),
                compatible_with=["co-implication", "ad-actio"],
                confirmed=True,
            ),
            IARoleMapping(
                domain_label="de-actio",
                theoretical_form="retroaction", vector_property="sentido",
                label_en="Defense — Retroactive Separation Argument",
                label_es="Defensa — Argumento de Separación Retroactiva",
                icon="←", color="#6B7280",
                desc_en=(
                    "A defense reverses the claimant's vector: 'your claim fails because X "
                    "pre-existed/negates it.' In SIAC: force majeure, prior breach by claimant, "
                    "limitation period expired, contract termination before breach alleged."
                ),
                desc_es=(
                    "Una defensa invierte el vector del demandante: 'tu pretensión falla porque X "
                    "preexistía o la niega.' En SIAC: fuerza mayor, incumplimiento previo del "
                    "demandante, prescripción, resolución del contrato antes del incumplimiento."
                ),
                compatible_with=["non", "de-actio"],
                confirmed=True,
            ),
            IARoleMapping(
                domain_label="non",
                theoretical_form="position", vector_property="posición",
                label_en="Preliminary Objection — Jurisdictional / Admissibility Block",
                label_es="Objeción Preliminar — Bloqueo de Jurisdicción / Admisibilidad",
                icon="✕", color="#DC2626",
                desc_en=(
                    "NOT simple denial — a positional exclusion threshold: 'the tribunal's "
                    "jurisdiction/competence cannot reach here.' In SIAC (Rule 7): preliminary "
                    "objections to jurisdiction, non-arbitrability, time bar, invalid arbitration "
                    "clause. CRITICAL: must raise in Response or risk waiver (Shanghai Electric precedent)."
                ),
                desc_es=(
                    "NO es simple negación — umbral de exclusión posicional: 'la jurisdicción/competencia "
                    "del tribunal no puede llegar aquí.' En SIAC: objeciones preliminares a la "
                    "jurisdicción, inarbitrabilidad, prescripción, cláusula arbitral inválida. "
                    "CRÍTICO: debe plantearse en la Respuesta o se arriesga a renuncia (precedente Shanghai Electric)."
                ),
                compatible_with=["de-actio"],
                confirmed=True,
            ),
            IARoleMapping(
                domain_label="co-implication",
                theoretical_form="plication", vector_property="plicación",
                label_en="Mutual Obligation — Bilateral Contractual / Treaty Binding",
                label_es="Obligación Mutua — Vinculación Contractual / Convencional Bilateral",
                icon="⇄", color="#7C3AED",
                desc_en=(
                    "Both parties are bound by the same instrument simultaneously. In SIAC: "
                    "the underlying contract/treaty creates mutual obligations — one party's "
                    "breach triggers the other's remedies. Counterclaims fold into the same "
                    "operational structure (GPE/Twarit: SPA created co-implicative obligations)."
                ),
                desc_es=(
                    "Ambas partes están vinculadas simultáneamente por el mismo instrumento. "
                    "En SIAC: el contrato/tratado subyacente crea obligaciones mutuas. "
                    "Las contrademandas se pliegan en la misma estructura operativa."
                ),
                compatible_with=["ad-actio", "co-implication"],
                confirmed=True,
            ),
        ]

    def homologation_rules(self) -> list[dict]:
        """
        A 'homologated' arbitration case = structurally complete legal theory.
        More rigorous than contracts — legal arguments need full ESS + AG + IA.
        """
        return [
            # ESS checks
            {"key": "claimant",             "label_en": "Claimant identified",          "label_es": "Demandante identificado",      "required": True,  "group": "Case Identity (ESS)"},
            {"key": "respondent",           "label_en": "Respondent identified",         "label_es": "Demandado identificado",       "required": True,  "group": "Case Identity (ESS)"},
            {"key": "seat",                 "label_en": "Seat of arbitration",           "label_es": "Sede del arbitraje",           "required": True,  "group": "Case Identity (ESS)", "ist_role": "spatial"},
            {"key": "applicable_law",       "label_en": "Applicable law confirmed",      "label_es": "Ley aplicable confirmada",     "required": True,  "group": "Case Identity (ESS)"},
            {"key": "arbitration_clause_ref","label_en": "Arbitration clause referenced","label_es": "Cláusula arbitral referenciada","required": True,  "group": "Case Identity (ESS)"},
            {"key": "filing_date",          "label_en": "Commencement date",             "label_es": "Fecha de inicio",              "required": True,  "group": "Case Identity (ESS)", "ist_role": "temporal"},
            {"key": "claim_amount_usd",     "label_en": "Claim amount specified",        "label_es": "Cuantía especificada",         "required": True,  "group": "Case Identity (ESS)"},
            # AG checks
            {"key": "claims",               "label_en": "Claims / heads of relief",      "label_es": "Pretensiones / fundamentos",   "required": True,  "group": "Case Content (AG)"},
            {"key": "legal_basis",          "label_en": "Legal basis for each claim",    "label_es": "Fundamento jurídico de cada pretensión", "required": True, "group": "Case Content (AG)"},
            # IA checks
            {"key": "ia",                   "label_en": "IA operators assigned",         "label_es": "Operadores IA asignados",      "required": True,  "group": "IA — PHENOMENON"},
            {"key": "preliminary_objections","label_en": "Preliminary objections considered (non)", "label_es": "Objeciones preliminares consideradas", "required": False, "group": "IA — PHENOMENON"},
            # Procedural checks (CA2)
            {"key": "procedure_type",       "label_en": "Procedure type selected",       "label_es": "Tipo de procedimiento seleccionado", "required": True, "group": "SIAC Rules 2025 (CA2)"},
        ]

    def opus_levels(self) -> OpusLevelDef:
        return OpusLevelDef(
            partial_label_en="Partial Analysis",
            partial_label_es="Análisis Parcial",
            partial_desc_en="Case identity defined (ESS). Claims/legal arguments not yet fully structured.",
            complete_label_en="Complete Legal Theory",
            complete_label_es="Teoría Jurídica Completa",
            complete_desc_en="All claims structured, legal basis confirmed, IA operators assigned. Ready for tribunal.",
            oponible_label_en="Award Enforceable",
            oponible_label_es="Laudo Ejecutable (Oponible Erga Omnes)",
            oponible_desc_en="Award issued + registered under New York Convention. Enforceable in 170+ states.",
            oponible_registry_en="New York Convention 1958 / ICSID Convention (investment treaties) / SICC enforcement (Singapore)",
        )

    def disclaimer_config(self) -> DisclaimerConfig:
        return DisclaimerConfig(
            show_not_legal_advice=True,
            show_not_binding=True,
            custom_disclaimer_en=(
                "PHENOMENON Arbitration Co-pilot is a structural analysis tool based on the "
                "PHENOMENON framework. It does not constitute legal advice, creates no "
                "attorney-client relationship, and confers no legal obligations on any party. "
                "All analysis must be reviewed and verified by qualified legal counsel before "
                "use in any arbitral or court proceeding. SIAC Rules 2025 references are "
                "provided for structural analysis purposes only."
            ),
            custom_disclaimer_es=(
                "El Co-piloto de Arbitraje PHENOMENON es una herramienta de análisis estructural "
                "basada en el marco PHENOMENON. No constituye asesoramiento jurídico, no crea "
                "ninguna relación abogado-cliente y no genera ninguna obligación legal para "
                "ninguna parte. Todo análisis debe ser revisado y verificado por letrado "
                "cualificado antes de su uso en cualquier procedimiento arbitral o judicial."
            ),
            requires_session_acceptance=True,   # SIAC domain requires explicit acceptance
            show_on_every_document=True,
        )

    def ai_system_prompt(self, language: str = "en") -> str:
        if language == "en":
            return (
                "You are the PHENOMENON Arbitration Co-pilot AI layer, specialised in "
                "international arbitration under SIAC Rules 2025. "
                "You provide structural analysis of legal arguments using the PHENOMENON framework. "
                "You are NOT providing legal advice. Your analysis is structural only. "
                "Map each claim to: ESS (undisputed facts), AG (legal basis), IA operator (argument type). "
                "Respond in valid JSON only. No markdown. No preamble. "
                "Always include a disclaimer that this is structural analysis, not legal advice."
            )
        return (
            "Eres el co-piloto de arbitraje PHENOMENON, especializado en arbitraje internacional "
            "bajo las SIAC Rules 2025. Proporcionas análisis estructural de argumentos jurídicos "
            "usando el marco PHENOMENON. NO proporcionas asesoramiento jurídico. "
            "Tu análisis es únicamente estructural. Responde SOLO en JSON válido."
        )

    def ai_generation_prompt(self, phenomenon_type: str, ess: dict, language: str = "en") -> str:
        if language == "en":
            return (
                f"Arbitration case type: {phenomenon_type}\n"
                f"Claimant: {ess.get('claimant', 'N/A')}\n"
                f"Respondent: {ess.get('respondent', 'N/A')}\n"
                f"Seat: {ess.get('seat', 'Singapore')}\n"
                f"Applicable law: {ess.get('applicable_law', 'N/A')}\n"
                f"Claim amount: USD {ess.get('claim_amount_usd', 'N/A')}\n\n"
                f"Generate 3-5 structural legal arguments for {phenomenon_type} under SIAC Rules 2025. "
                f"Each argument must include: the claim/defense type (IA operator), the legal basis, "
                f"and the vector strength assessment. Identify any preliminary objections the "
                f"respondent might raise (non operators). "
                f"DISCLAIMER: This is structural analysis only, not legal advice."
            )
        return (
            f"Tipo de caso: {phenomenon_type}\n"
            f"Demandante: {ess.get('claimant', 'N/A')}\n"
            f"Demandado: {ess.get('respondent', 'N/A')}\n"
            f"Sede: {ess.get('seat', 'Singapur')}\n"
            f"Cuantía: USD {ess.get('claim_amount_usd', 'N/A')}\n\n"
            f"Genera 3-5 argumentos jurídicos estructurales para {phenomenon_type} "
            f"bajo SIAC Rules 2025. DISCLAIMER: Solo análisis estructural, no asesoramiento jurídico."
        )
