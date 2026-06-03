import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class EssFields(BaseModel):
    partyA: str
    partyB: str
    jurisdiction: str
    effectiveDate: str
    expiryDate: str


class Vector(BaseModel):
    lation: str
    sense: str
    direction: str
    position: str
    plication: str


class OpusState(BaseModel):
    status: str
    homologation: str


class PhenomenonRecord(BaseModel):
    id: str
    type: str
    name: str
    status: str
    ess: EssFields
    ag: dict
    ia_instances: list[str] = Field(default_factory=list)
    vectors: list[Vector] = Field(default_factory=list)
    opus: OpusState
    parentId: Optional[str] = None
    children: list[str] = Field(default_factory=list)

    # ── PHENOMENON III insurance fields (all Optional — existing records unaffected) ──
    # Source: PHENOMENON_III_Flujograma_fenomenologico_del_seguro.docx
    phenomenological_phase: Optional[str] = None   # "F1" | "F2" | "F3"
    ferencia_sensual: Optional[str] = None          # the insured object (e.g. "life of Pedro García")
    sec_types: list[str] = Field(default_factory=list)   # ["DE","DS","OBC"]
    legal_basis: Optional[str] = None               # e.g. "Art. 1089 CC"
    negaciones: list[str] = Field(default_factory=list)  # ["NOT_SOLVENTIO_1158", ...]
    cst_trigger_id: Optional[str] = None            # ID of the F1 that this F2 was opened from
    culpable_trigger_id: Optional[str] = None       # ID of the F2 that this F3 was opened from

    # PHENOMENON III — fractalization fields (all Optional — existing records unaffected)
    # Source: PHENOMENON_III_Seguro_y_EDCO_EDCIB_fractalizado.docx
    coverage_type: Optional[str] = None    # CoverageType value — set on F1 sub-phenomena
    ferencia_type: Optional[str] = None    # FerenciaType value — set on F2 sub-phenomena
    reclamacion_type: Optional[str] = None # ReclamacionType value — set on F3 sub-phenomena
    fractal_index: Optional[str] = None    # e.g. "1.2" = sub-phenomenon 2 of phase 1

    @field_validator("fractal_index")
    @classmethod
    def _fractal_index_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.fullmatch(r"\d+\.\d+", v):
            raise ValueError(f"fractal_index must be '<phase>.<index>' (e.g. '1.2'); got {v!r}")
        return v
