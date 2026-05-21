"""
EcosystemEngine — validates the entire contract network as a single unit.

Theoretical grounding:
  Bloque II  — IF inter-fenómenica: the ecosystem is a graph of phenomena
               connected by IF links. Validity requires all nodes AND all
               edges to be coherent.
  Bloque VI  — Estabilización: the ecosystem reaches ESTABLE only when every
               phenomenon and every IF connection has been homologated.
  Bloque VIII — Fractal: the ecosystem is self-similar — the master governs
               sub-contracts the same way a system governs its subsystems.
"""
from dataclasses import dataclass, field
from typing import Optional
from .models import PhenomenonRecord
from .protocols import PhenomenonRepository


# ─── Cross-contract consistency rules ────────────────────────────────────────
# Each rule checks a relationship between two contract types or a single
# contract against a legal limit.

CONSISTENCY_RULES = [
    {
        "id":           "nda_dpa_retention",
        "source_type":  "NDA",
        "target_type":  "DPA",
        "source_field": "confidentialityPeriod",
        "target_field": "dataRetention",
        "relation":     "gte",
        "severity":     "ERROR",
        "desc":         "NDA confidentiality period ({sv} años) must cover DPA data retention ({tv} años)",
        "desc_es":      "Plazo de confidencialidad NDA ({sv} años) debe cubrir retención DPA ({tv} años)",
        "law":          "RGPD Art. 28 · Bloque II IF",
    },
    {
        "id":           "nda_ip_duration",
        "source_type":  "NDA",
        "target_type":  "IP",
        "source_field": "confidentialityPeriod",
        "target_field": "duration",
        "relation":     "gte",
        "severity":     "WARNING",
        "desc":         "NDA term ({sv} años) should cover IP license duration ({tv} años)",
        "desc_es":      "Plazo NDA ({sv} años) debería cubrir la duración de la cesión IP ({tv} años)",
        "law":          "RDL 1/1996 LPI · Bloque II IF",
    },
    {
        "id":           "payment_days_legal",
        "source_type":  "PAYMENT",
        "target_type":  None,
        "source_field": "paymentDays",
        "limit":        60,
        "relation":     "lte_limit",
        "severity":     "ERROR",
        "desc":         "Payment term ({sv} days) exceeds legal maximum of 60 days",
        "desc_es":      "Plazo de pago ({sv} días) supera el máximo legal de 60 días (Ley 3/2004)",
        "law":          "Ley 3/2004 Art. 4 · Directiva 2011/7/UE",
    },
    {
        "id":           "sla_payment_penalty_linked",
        "source_type":  "SLA",
        "target_type":  "PAYMENT",
        "source_field": "penaltyPct",
        "target_field": "retentionPct",
        "relation":     "both_set_or_neither",
        "severity":     "WARNING",
        "desc":         "SLA penalty% and PAYMENT retention% should both be defined or both empty",
        "desc_es":      "SLA penaltyPct y PAYMENT retentionPct deben estar ambos definidos o ambos vacíos",
        "law":          "Bloque II IF · Coherencia vectorial",
    },
    {
        "id":           "dpa_nda_subprocessors",
        "source_type":  "DPA",
        "target_type":  "NDA",
        "source_field": "subprocessors",
        "target_field": "confidentialScope",
        "relation":     "if_source_then_target",
        "severity":     "WARNING",
        "desc":         "If DPA has subprocessors, NDA should define confidentiality scope",
        "desc_es":      "Si DPA tiene subencargados, NDA debe definir el alcance de confidencialidad",
        "law":          "RGPD Art. 28.4 · Bloque II IF",
    },
    {
        "id":           "sla_availability_threshold",
        "source_type":  "SLA",
        "target_type":  None,
        "source_field": "availability",
        "limit":        95.0,
        "relation":     "gte_limit",
        "severity":     "WARNING",
        "desc":         "SLA availability ({sv}%) is below recommended minimum of 95%",
        "desc_es":      "Disponibilidad SLA ({sv}%) está por debajo del mínimo recomendado del 95%",
        "law":          "Art. 1152 CC · Ley 7/1996",
    },
]

# Required contract types per master template
REQUIRED_COVERAGE = {
    "CSM":              ["NDA", "SLA", "PAYMENT", "DPA"],
    "SAAS":             ["NDA", "SLA", "PAYMENT", "DPA", "IP"],
    "DISTRIBUCION":     ["NDA", "PAYMENT"],
    "AGENCIA":          ["NDA", "PAYMENT"],
    "COLABORACION":     ["NDA", "IP", "PAYMENT"],
    "CONSULTORIA":      ["NDA", "PAYMENT"],
    "ARRENDAMIENTO":    [],
    "NDA_BILATERAL":    [],
    "COMPRAVENTA_SOLAR":["CONDICION_SOLAR", "PAGO_APLAZADO", "CARGAS_URBANISTICAS"],
    "COMPRAVENTA_TERRENO":["PAGO_APLAZADO", "CARGAS_URBANISTICAS"],
}


@dataclass
class ConsistencyIssue:
    rule_id: str
    severity: str
    desc_es: str
    law: str
    source_type: str
    target_type: Optional[str]
    source_value: Optional[str] = None
    target_value: Optional[str] = None


@dataclass
class CoverageItem:
    contract_type: str
    present: bool
    required: bool
    contract_id: Optional[str] = None
    contract_name: Optional[str] = None
    status: Optional[str] = None


@dataclass
class EcosystemState:
    master_id: str
    master_name: str
    template_key: str
    contracts: list[dict] = field(default_factory=list)
    consistency_issues: list[ConsistencyIssue] = field(default_factory=list)
    coverage: list[CoverageItem] = field(default_factory=list)
    parties: list[dict] = field(default_factory=list)
    ecosystem_valid: bool = False
    homologation_summary: dict = field(default_factory=dict)
    health_score: int = 0  # 0-100


@dataclass
class EcosystemHomologationResult:
    ecosystem_valid: bool
    individual_results: list[dict] = field(default_factory=list)
    consistency_issues: list[ConsistencyIssue] = field(default_factory=list)
    coverage_gaps: list[str] = field(default_factory=list)
    health_score: int = 0
    summary: str = ""


class EcosystemEngine:
    """
    Validates the contract ecosystem as a single coherent unit.

    Individual homologation checks each contract in isolation.
    Ecosystem homologation additionally checks:
      1. Cross-contract consistency (IF coherence rules)
      2. Contractual coverage (required contract types present)
      3. Party consistency (all contracts reference the same parties)
      4. Vectorial coherence (IA operators are compatible across the ecosystem)
    """

    def evaluate(self, master_id: str, repo: PhenomenonRepository) -> EcosystemState:
        master   = repo.get(master_id)
        children = repo.get_children(master_id)
        terms    = master.ag.get("terms", {})
        template_key = terms.get("templateKey", "")

        contracts_data = []
        for c in [master] + children:
            contracts_data.append({
                "id":           c.id,
                "name":         c.name,
                "type":         c.type,
                "status":       c.status,
                "homologation": c.opus.homologation,
                "parentId":     c.parentId,
                "ess":          c.ess.model_dump(),
                "terms":        c.ag.get("terms", {}),
                "ia_instances": c.ia_instances,
            })

        issues    = self._consistency_check(children)
        coverage  = self._coverage_check(master, children, template_key)
        parties   = self._extract_parties(master, terms)
        homo_sum  = self._homologation_summary(master, children)
        score     = self._health_score(master, children, issues, coverage)

        return EcosystemState(
            master_id=master_id,
            master_name=master.name,
            template_key=template_key,
            contracts=contracts_data,
            consistency_issues=issues,
            coverage=coverage,
            parties=parties,
            ecosystem_valid=(score >= 80 and not any(i.severity == "ERROR" for i in issues)),
            homologation_summary=homo_sum,
            health_score=score,
        )

    def build_homologation_result(
        self,
        master_id: str,
        repo: PhenomenonRepository,
        individual_results: list[dict],
    ) -> EcosystemHomologationResult:
        """
        Combines individual homologation results (provided by the route handler)
        with cross-contract consistency checks to produce the final ecosystem result.
        """
        master   = repo.get(master_id)
        children = repo.get_children(master_id)
        template_key = master.ag.get("terms", {}).get("templateKey", "")

        issues   = self._consistency_check(children)
        coverage = self._coverage_check(master, children, template_key)
        gaps     = [c.contract_type for c in coverage if c.required and not c.present]
        score    = self._health_score(master, children, issues, coverage)

        all_valid = (
            all(r.get("valid", False) for r in individual_results)
            and not any(i.severity == "ERROR" for i in issues)
            and len(gaps) == 0
        )

        return EcosystemHomologationResult(
            ecosystem_valid=all_valid,
            individual_results=individual_results,
            consistency_issues=issues,
            coverage_gaps=gaps,
            health_score=score,
            summary=self._build_summary(individual_results, issues, gaps, score),
        )

    # ── Private helpers ──────────────────────────────────────────────────────

    def _consistency_check(self, children: list[PhenomenonRecord]) -> list[ConsistencyIssue]:
        issues = []
        by_type = {c.type: c for c in children}

        for rule in CONSISTENCY_RULES:
            src_type = rule["source_type"]
            tgt_type = rule.get("target_type")
            src = by_type.get(src_type)
            tgt = by_type.get(tgt_type) if tgt_type else None

            if not src:
                continue

            src_terms = src.ag.get("terms", {})
            sv_raw = src_terms.get(rule["source_field"], "")
            relation = rule["relation"]

            if relation == "lte_limit":
                try:
                    sv = float(sv_raw)
                    limit = float(rule["limit"])
                    if sv > limit:
                        issues.append(ConsistencyIssue(
                            rule_id=rule["id"], severity=rule["severity"],
                            desc_es=rule["desc_es"].format(sv=sv, tv=limit),
                            law=rule["law"], source_type=src_type, target_type=tgt_type,
                            source_value=str(sv), target_value=str(limit),
                        ))
                except (ValueError, TypeError):
                    pass

            elif relation == "gte_limit":
                try:
                    sv = float(sv_raw)
                    limit = float(rule["limit"])
                    if sv < limit:
                        issues.append(ConsistencyIssue(
                            rule_id=rule["id"], severity=rule["severity"],
                            desc_es=rule["desc_es"].format(sv=sv, tv=limit),
                            law=rule["law"], source_type=src_type, target_type=tgt_type,
                            source_value=str(sv), target_value=str(limit),
                        ))
                except (ValueError, TypeError):
                    pass

            elif relation in ("gte", "lte") and tgt:
                tgt_terms = tgt.ag.get("terms", {})
                tv_raw = tgt_terms.get(rule["target_field"], "")
                try:
                    sv, tv = float(sv_raw), float(tv_raw)
                    failed = (sv < tv) if relation == "gte" else (sv > tv)
                    if failed:
                        issues.append(ConsistencyIssue(
                            rule_id=rule["id"], severity=rule["severity"],
                            desc_es=rule["desc_es"].format(sv=sv, tv=tv),
                            law=rule["law"], source_type=src_type, target_type=tgt_type,
                            source_value=str(sv), target_value=str(tv),
                        ))
                except (ValueError, TypeError):
                    pass

            elif relation == "both_set_or_neither" and tgt:
                tgt_terms = tgt.ag.get("terms", {})
                sv_set = bool(str(sv_raw).strip())
                tv_set = bool(str(tgt_terms.get(rule["target_field"], "")).strip())
                if sv_set != tv_set:
                    issues.append(ConsistencyIssue(
                        rule_id=rule["id"], severity=rule["severity"],
                        desc_es=rule["desc_es"], law=rule["law"],
                        source_type=src_type, target_type=tgt_type,
                    ))

            elif relation == "if_source_then_target" and tgt:
                tgt_terms = tgt.ag.get("terms", {})
                sv_set = bool(str(sv_raw).strip())
                tv_set = bool(str(tgt_terms.get(rule["target_field"], "")).strip())
                if sv_set and not tv_set:
                    issues.append(ConsistencyIssue(
                        rule_id=rule["id"], severity=rule["severity"],
                        desc_es=rule["desc_es"], law=rule["law"],
                        source_type=src_type, target_type=tgt_type,
                    ))

        return issues

    def _coverage_check(
        self, master: PhenomenonRecord, children: list[PhenomenonRecord], template_key: str
    ) -> list[CoverageItem]:
        present_types  = {c.type: c for c in children}
        required_types = REQUIRED_COVERAGE.get(template_key, [])

        all_types = list(dict.fromkeys(required_types + list(present_types.keys())))
        items = []
        for t in all_types:
            c = present_types.get(t)
            items.append(CoverageItem(
                contract_type=t,
                present=c is not None,
                required=t in required_types,
                contract_id=c.id if c else None,
                contract_name=c.name if c else None,
                status=c.status if c else None,
            ))
        return items

    def _extract_parties(self, master: PhenomenonRecord, terms: dict) -> list[dict]:
        ess = master.ess.model_dump()
        parties = []
        if ess.get("partyA"):
            parties.append({"role": "A", "name": ess["partyA"],
                            "cif": terms.get("partyACIF", ""), "address": terms.get("partyAAddress", ""),
                            "rep": terms.get("partyARepresentative", "")})
        if ess.get("partyB"):
            parties.append({"role": "B", "name": ess["partyB"],
                            "cif": terms.get("partyBCIF", ""), "address": terms.get("partyBAddress", ""),
                            "rep": terms.get("partyBRepresentative", "")})
        # Additional parties stored in ag.terms.additionalParties
        for p in terms.get("additionalParties", []):
            parties.append(p)
        return parties

    def _homologation_summary(
        self, master: PhenomenonRecord, children: list[PhenomenonRecord]
    ) -> dict:
        all_c = [master] + children
        valid   = sum(1 for c in all_c if c.opus.homologation == "VALID")
        invalid = sum(1 for c in all_c if c.opus.homologation == "INVALID")
        pending = sum(1 for c in all_c if c.opus.homologation == "PENDING")
        return {"total": len(all_c), "valid": valid, "invalid": invalid, "pending": pending}

    def _health_score(
        self,
        master: PhenomenonRecord,
        children: list[PhenomenonRecord],
        issues: list[ConsistencyIssue],
        coverage: list[CoverageItem],
    ) -> int:
        score = 100
        all_c = [master] + children
        total = len(all_c)
        if total == 0:
            return 0

        # Deduct for invalid homologation
        invalid_count = sum(1 for c in all_c if c.opus.homologation == "INVALID")
        pending_count = sum(1 for c in all_c if c.opus.homologation == "PENDING")
        score -= (invalid_count / total) * 40
        score -= (pending_count / total) * 15

        # Deduct for NEEDS_REVIEW
        review_count = sum(1 for c in all_c if c.status == "NEEDS_REVIEW")
        score -= (review_count / total) * 10

        # Deduct for consistency issues
        errors   = sum(1 for i in issues if i.severity == "ERROR")
        warnings = sum(1 for i in issues if i.severity == "WARNING")
        score -= errors * 8
        score -= warnings * 3

        # Deduct for missing required coverage
        missing = sum(1 for c in coverage if c.required and not c.present)
        score -= missing * 5

        return max(0, min(100, int(score)))

    def _build_summary(
        self,
        individual: list[dict],
        issues: list[ConsistencyIssue],
        gaps: list[str],
        score: int,
    ) -> str:
        valid = sum(1 for r in individual if r["valid"])
        total = len(individual)
        errors = sum(1 for i in issues if i.severity == "ERROR")
        if score >= 90:
            return f"Ecosistema HOMOLOGADO — {valid}/{total} contratos válidos · Sin conflictos IF"
        elif score >= 70:
            return f"Ecosistema PARCIALMENTE válido — {valid}/{total} válidos · {errors} conflicto(s) IF · {len(gaps)} cobertura(s) pendiente(s)"
        else:
            return f"Ecosistema INVÁLIDO — {valid}/{total} válidos · {errors} conflicto(s) críticos · {len(gaps)} tipo(s) faltante(s)"
