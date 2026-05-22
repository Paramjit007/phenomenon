import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..ai.claude_client import ClaudeClient
from ..ai.prompts import (
    CONTRACT_GENERATION_SYSTEM, contract_generation_user, cascade_analysis_user,
    FALLBACK_CLAUSES, _DEFAULT_CLAUSES,
)
from ..config import settings
from ..database import get_db
from ..repositories.phenomena_repo import PhenomenaRepository

router = APIRouter()


def _claude() -> ClaudeClient:
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY no configurada")
    return ClaudeClient(api_key=settings.anthropic_api_key, model=settings.claude_model)


class GenerateContractRequest(BaseModel):
    contract_type: str
    master_summary: str
    ess: dict


class AnalyzeCascadeRequest(BaseModel):
    field: str
    old_value: str
    new_value: str
    affected_types: list[str]


@router.post("/generate-contract")
async def generate_contract(req: GenerateContractRequest):
    # Resolve contract type key from label or code
    type_key = req.contract_type.upper().split()[0]  # crude match: "Acuerdo de Confidencialidad" → "ACUERDO" — handled by fallback
    fallback = FALLBACK_CLAUSES.get(type_key, None)
    for k, v in FALLBACK_CLAUSES.items():
        if k in req.contract_type.upper() or req.contract_type.upper() in k:
            fallback = v
            break

    if not settings.anthropic_api_key:
        clauses = fallback or _DEFAULT_CLAUSES
        return {"result": json.dumps({
            "clauses": clauses,
            "ia_instances": ["ad-actio"],
            "special_terms": "Cláusulas generadas automáticamente. Configure ANTHROPIC_API_KEY para generación personalizada mediante IA.",
        }), "fallback": True}

    prompt = contract_generation_user(req.contract_type, req.master_summary, req.ess)
    try:
        result = await _claude().complete(CONTRACT_GENERATION_SYSTEM, prompt, max_tokens=1200)
        return {"result": result, "fallback": False}
    except Exception as e:
        clauses = fallback or _DEFAULT_CLAUSES
        return {"result": json.dumps({
            "clauses": clauses,
            "ia_instances": ["ad-actio"],
            "special_terms": f"Generación IA no disponible: {str(e)[:80]}",
        }), "fallback": True, "error": str(e)}


@router.post("/analyze-cascade")
async def analyze_cascade(req: AnalyzeCascadeRequest):
    if not settings.anthropic_api_key:
        types = ", ".join(req.affected_types)
        return {"analysis": (
            f"• Los subcontratos de tipo {types} deben actualizarse para reflejar el cambio en '{req.field}'.\n"
            f"• Revise las cláusulas que hacen referencia explícita al campo modificado.\n"
            f"• Verifique que el cambio no genera inconsistencias con la normativa española aplicable.\n"
            f"• Configure ANTHROPIC_API_KEY para obtener un análisis detallado generado por IA."
        ), "fallback": True}

    prompt = cascade_analysis_user(req.field, req.old_value, req.new_value, req.affected_types)
    try:
        result = await _claude().complete("", prompt, max_tokens=700)
        return {"analysis": result, "fallback": False}
    except Exception as e:
        return {"analysis": f"Análisis no disponible: {str(e)[:120]}", "fallback": True, "error": str(e)}


class GenerateClauseRequest(BaseModel):
    contract_id: str
    prompt: str


@router.post("/generate-clause")
async def generate_clause(req: GenerateClauseRequest, db: Session = Depends(get_db)):
    """Generate a single legal clause for a contract using Claude.

    Fetches the contract's ESS fields to provide context, then forwards the
    user's prompt as the human turn with a concise system prompt built from
    ESS.  Returns ``{"text": str}`` on success or ``{"text": "", "error": str}``
    on failure (HTTP 200 in both cases so the frontend error display path fires).
    """
    # ── Fetch contract ────────────────────────────────────────────────────────
    try:
        repo = PhenomenaRepository(db)
        contract = repo.get(req.contract_id)
    except KeyError:
        return {"text": "", "error": f"Contrato '{req.contract_id}' no encontrado"}

    # ── Build concise ESS system prompt (<400 tokens) ─────────────────────────
    ess = contract.ess
    law_hint = ""
    ag_terms = (contract.ag or {}).get("terms", {})
    for field in ("law", "ley", "applicableLaw", "ley_aplicable"):
        if ag_terms.get(field):
            law_hint = f" Ley aplicable: {ag_terms[field]}."
            break

    system_prompt = (
        f"Eres un redactor jurídico experto en Derecho español e internacional. "
        f"El contrato tiene las siguientes partes e identidad estable (ESS):\n"
        f"- Parte A: {ess.partyA or 'No especificada'}\n"
        f"- Parte B: {ess.partyB or 'No especificada'}\n"
        f"- Jurisdicción: {ess.jurisdiction or 'No especificada'}\n"
        f"- Fecha de inicio: {ess.effectiveDate or 'No especificada'}\n"
        f"- Fecha de vencimiento: {ess.expiryDate or 'No especificada'}\n"
        f"{law_hint}\n"
        f"Genera únicamente la cláusula solicitada, en español, con redacción jurídica precisa y concisa. "
        f"No añadas explicaciones fuera del texto de la cláusula."
    ).strip()

    # ── No API key: return graceful fallback ─────────────────────────────────
    if not settings.anthropic_api_key:
        return {
            "text": (
                f"[Demo] Cláusula para {ess.partyA or 'Parte A'} y {ess.partyB or 'Parte B'} "
                f"bajo jurisdicción {ess.jurisdiction or 'no especificada'}. "
                f"Configure ANTHROPIC_API_KEY para generación real mediante IA."
            ),
            "fallback": True,
        }

    # ── Call Claude ───────────────────────────────────────────────────────────
    try:
        text = await _claude().complete(system_prompt, req.prompt, max_tokens=800)
        return {"text": text}
    except Exception as e:
        return {"text": "", "error": str(e)}
