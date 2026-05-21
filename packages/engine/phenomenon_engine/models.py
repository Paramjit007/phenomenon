from typing import Optional
from pydantic import BaseModel, Field


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
