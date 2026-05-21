import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..ai.claude_client import ClaudeClient
from ..ai.prompts import (
    CONTRACT_GENERATION_SYSTEM, contract_generation_user, cascade_analysis_user,
    FALLBACK_CLAUSES, _DEFAULT_CLAUSES,
)
from ..config import settings

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
