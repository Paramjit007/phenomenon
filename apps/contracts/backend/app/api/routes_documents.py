"""
Document Upload, OCR and PHENOMENON Engine Processing
Supports: PDF (text + scanned), images (via Claude Vision), plain text

PHENOMENON Engine Stages:
  1. UPLOAD   → Document received
  2. OCR      → Text extracted (pdfplumber / Claude vision)
  3. ESS      → Parties, dates, jurisdiction identified (Bloque I: Ser)
  4. AG       → Clauses and obligations extracted (Bloque I: Ager)
  5. IA       → IA operator type determined (Bloque II: claim/objection/defense)
  6. VECTOR   → Argument strength assessed (Bloque II: vectorial strength)
  7. IF       → Links to case phenomena identified (Bloque II: inter-phenomenic)
  8. OPUS     → Document processed and ready to save (Bloque IV)
"""
import io, json, base64
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# ── OCR / Text extraction ────────────────────────────────────────────────────

def extract_pdf_text(content: bytes) -> tuple[str, str]:
    """Extract text from PDF. Returns (text, method)."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages = []
            for page in pdf.pages:
                t = page.extract_text()
                if t: pages.append(t)
            text = "\n\n".join(pages)
            if text.strip():
                return text, "pdfplumber"
    except Exception:
        pass
    return "", "none"


def extract_text_file(content: bytes, encoding="utf-8") -> str:
    """Extract text from plain text files."""
    try:
        return content.decode(encoding, errors="ignore")
    except Exception:
        return content.decode("latin-1", errors="ignore")


# ── Claude AI document analysis ───────────────────────────────────────────────

DOCUMENT_ANALYSIS_SYSTEM = """
You are a PHENOMENON legal document analyst specialising in international arbitration (SIAC) and Spanish/English contract law.

Analyse the provided document through the PHENOMENON framework and extract structured information.

PHENOMENON ENGINE STAGES you must complete:
  ESS (Ser — Identidad Estable): parties, dates, jurisdiction, governing law — the STABLE IDENTITY
  AG (Ager — Capa Operativa): clauses, obligations, amounts — the OPERATIVE LAYER
  IA (Operadores Vectoriales): classify the document's legal function as one of:
    - ad-actio: creates a positive obligation / claim (contract, invoice, payment demand)
    - non: establishes a prohibition or exclusion (NDA, injunction, refusal)
    - de-actio: removes or reverses an obligation (termination notice, release, waiver)
    - co-implication: creates mutual reciprocal obligations (bilateral agreement, settlement)
  VECTOR STRENGTH: assess how strong/clear the legal position is (strong/moderate/weak)

Return ONLY valid JSON with this exact structure:
{
  "document_type": "Contract|Email|Invoice|Court Decision|Arbitral Award|Expert Report|Witness Statement|Legal Opinion|Regulatory Filing|Bank Record|Other",
  "document_subtype": "more specific description e.g. Share Purchase Agreement, Payment Demand Letter",
  "language": "en|es|bilingual",
  "parties": [{"name": "...", "role": "Claimant|Respondent|Third Party|Tribunal|Other", "registration": "..."}],
  "key_dates": [{"date": "YYYY-MM-DD", "event": "description of what this date represents"}],
  "monetary_amounts": [{"amount": 0, "currency": "USD", "description": "what this amount represents"}],
  "jurisdiction": "country or city",
  "governing_law": "applicable law",
  "key_provisions": ["key clause or provision text (max 100 chars each)"],
  "relevant_claims": ["breach of contract", "non-payment", "guarantee enforcement", etc],
  "ess_extraction": {
    "partyA": "full name of primary claimant/party",
    "partyB": "full name of primary respondent/counterparty",
    "jurisdiction": "seat or governing jurisdiction",
    "effectiveDate": "YYYY-MM-DD or empty",
    "expiryDate": "YYYY-MM-DD or empty"
  },
  "ag_extraction": {
    "clauses": ["key clause 1", "key clause 2"],
    "obligations": ["obligation 1", "obligation 2"],
    "amounts": ["amount description 1"]
  },
  "ia_operator": "ad-actio|non|de-actio|co-implication",
  "ia_reasoning": "why this IA operator applies to this document",
  "strength_assessment": "strong|moderate|weak",
  "strength_reasoning": "why this strength level — e.g. clear legal basis, good evidence, or ambiguous",
  "exhibit_suggestion": "C-1 for claimant document, R-1 for respondent, T-1 for tribunal",
  "legal_significance": "1-2 sentences on why this document matters to the case",
  "summary": "2-3 sentence summary of what this document is and its legal relevance"
}
""".strip()


def document_analysis_user(text: str, filename: str, context: str = "") -> str:
    ctx = f"\n\nCase context: {context}" if context else ""
    return (
        f"Document filename: {filename}{ctx}\n\n"
        f"Document content (first 8000 characters):\n"
        f"{text[:8000]}\n\n"
        f"Analyse this document through the PHENOMENON engine framework."
    )


def fallback_analysis(text: str, filename: str) -> dict:
    """Fallback analysis when no API key is configured."""
    filename_lower = filename.lower()
    if "contract" in filename_lower or "agreement" in filename_lower:
        doc_type, ia = "Contract", "co-implication"
    elif "invoice" in filename_lower or "payment" in filename_lower:
        doc_type, ia = "Invoice", "ad-actio"
    elif "nda" in filename_lower or "confidential" in filename_lower:
        doc_type, ia = "Contract", "non"
    elif "termination" in filename_lower or "notice" in filename_lower:
        doc_type, ia = "Legal Notice", "de-actio"
    elif "email" in filename_lower or "letter" in filename_lower:
        doc_type, ia = "Correspondence", "ad-actio"
    elif "award" in filename_lower or "decision" in filename_lower:
        doc_type, ia = "Arbitral Award", "co-implication"
    else:
        doc_type, ia = "Document", "ad-actio"

    words = text.split()[:500]
    return {
        "document_type": doc_type,
        "document_subtype": f"Uploaded {doc_type}",
        "language": "en",
        "parties": [],
        "key_dates": [],
        "monetary_amounts": [],
        "jurisdiction": "",
        "governing_law": "",
        "key_provisions": [" ".join(words[i:i+20]) for i in range(0,min(len(words),60),20)][:3],
        "relevant_claims": [],
        "ess_extraction": {"partyA":"","partyB":"","jurisdiction":"","effectiveDate":"","expiryDate":""},
        "ag_extraction": {"clauses":[" ".join(words[:30])],"obligations":[],"amounts":[]},
        "ia_operator": ia,
        "ia_reasoning": f"Classified as {ia} based on filename '{filename}'. Configure ANTHROPIC_API_KEY for precise classification.",
        "strength_assessment": "moderate",
        "strength_reasoning": "Manual review required — AI analysis not available.",
        "exhibit_suggestion": "C-1",
        "legal_significance": f"Document '{filename}' uploaded. AI analysis unavailable — add ANTHROPIC_API_KEY for automatic extraction.",
        "summary": f"File '{filename}' processed. Text extracted ({len(text)} characters). Configure Claude API for full PHENOMENON analysis.",
        "fallback": True,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Stage 1+2: Upload document and extract text (OCR stage).
    Returns the extracted text and file metadata.
    """
    content = await file.read()
    filename = file.filename or "document"
    size = len(content)
    content_type = file.content_type or ""

    # Extract text
    text = ""
    ocr_method = "none"

    if "pdf" in content_type or filename.lower().endswith(".pdf"):
        text, ocr_method = extract_pdf_text(content)
        if not text.strip():
            # Scanned PDF — return base64 for Claude vision analysis
            return {
                "filename": filename,
                "size": size,
                "ocr_method": "vision_required",
                "text": "",
                "text_length": 0,
                "is_scanned": True,
                "base64": base64.b64encode(content).decode(),
                "content_type": content_type,
            }
    elif content_type.startswith("image/") or filename.lower().endswith((".png",".jpg",".jpeg",".webp",".gif")):
        # Image — needs Claude vision
        return {
            "filename": filename,
            "size": size,
            "ocr_method": "vision_required",
            "text": "",
            "text_length": 0,
            "is_scanned": True,
            "base64": base64.b64encode(content).decode(),
            "content_type": content_type,
        }
    else:
        text = extract_text_file(content)
        ocr_method = "text"

    return {
        "filename": filename,
        "size": size,
        "ocr_method": ocr_method,
        "text": text,
        "text_length": len(text),
        "is_scanned": False,
        "preview": text[:300],
    }


class AnalyseRequest(BaseModel):
    filename: str
    text: str = ""
    base64_content: str = ""
    content_type: str = ""
    case_context: str = ""


@router.post("/analyse")
async def analyse_document(req: AnalyseRequest):
    """
    Stages 3-8: Run PHENOMENON engine analysis on extracted text.
    ESS → AG → IA → VECTOR → IF → OPUS
    Uses Claude AI if API key configured, otherwise fallback.
    """
    from ..config import settings

    text = req.text

    # If image/scanned PDF, use Claude vision
    if not text.strip() and req.base64_content:
        if not settings.anthropic_api_key:
            return {**fallback_analysis("scanned document", req.filename), "stages_completed": 2}
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
            msg = await client.messages.create(
                model=settings.claude_model,
                max_tokens=2000,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type":"image","source":{"type":"base64","media_type":req.content_type or "image/jpeg","data":req.base64_content}},
                        {"type":"text","text":document_analysis_user("(image/scanned document — use vision to extract text and analyse)",req.filename,req.case_context)},
                    ],
                }],
                system=DOCUMENT_ANALYSIS_SYSTEM,
            )
            result = json.loads(msg.content[0].text.replace("```json","").replace("```","").strip())
            result["stages_completed"] = 8
            return result
        except Exception as e:
            return {**fallback_analysis("scanned", req.filename), "error": str(e), "stages_completed": 2}

    if not text.strip():
        raise HTTPException(400, "No text content to analyse")

    if not settings.anthropic_api_key:
        return {**fallback_analysis(text, req.filename), "stages_completed": 3}

    try:
        from ..ai.claude_client import ClaudeClient
        client = ClaudeClient(api_key=settings.anthropic_api_key, model=settings.claude_model)
        raw = await client.complete(
            DOCUMENT_ANALYSIS_SYSTEM,
            document_analysis_user(text, req.filename, req.case_context),
            max_tokens=2000,
        )
        result = json.loads(raw.replace("```json","").replace("```","").strip())
        result["stages_completed"] = 8
        return result
    except json.JSONDecodeError:
        return {**fallback_analysis(text, req.filename), "stages_completed": 3, "parse_error": True}
    except Exception as e:
        return {**fallback_analysis(text, req.filename), "error": str(e)[:200], "stages_completed": 3}
