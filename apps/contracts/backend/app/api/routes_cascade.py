from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..repositories.phenomena_repo import PhenomenaRepository
from phenomenon_engine import CascadeEngine, SubCascadeEngine, ReverseCascadeEngine
from phenomenon_engine.cascade_engine import CASCADE_MAP, SUB_CASCADE_MAP, REVERSE_CASCADE_MAP

router = APIRouter()


class CascadeTriggerRequest(BaseModel):
    master_id: str
    field: str
    new_value: str


@router.post("/trigger")
def trigger_cascade(req: CascadeTriggerRequest, db: Session = Depends(get_db)):
    result = CascadeEngine().run(req.master_id, req.field, req.new_value, PhenomenaRepository(db))
    return {
        "master_id": result.master_id,
        "field": result.field,
        "old_value": result.old_value,
        "new_value": result.new_value,
        "affected_count": len(result.affected_ids),
        "affected_ids": result.affected_ids,
        "trace": result.trace,
    }


class SubCascadeTriggerRequest(BaseModel):
    source_id: str
    field: str
    new_value: str


@router.post("/sub-trigger")
def trigger_sub_cascade(req: SubCascadeTriggerRequest, db: Session = Depends(get_db)):
    result = SubCascadeEngine().run(req.source_id, req.field, req.new_value, PhenomenaRepository(db))
    return {
        "source_id": result.source_id,
        "source_type": result.source_type,
        "field": result.field,
        "affected_count": len(result.affected_ids),
        "affected_ids": result.affected_ids,
        "trace": result.trace,
    }


@router.get("/sub-map")
def get_sub_cascade_map():
    return SUB_CASCADE_MAP


class ReverseCascadeTriggerRequest(BaseModel):
    source_id: str
    field: str
    new_value: str


@router.post("/reverse-trigger")
def trigger_reverse_cascade(req: ReverseCascadeTriggerRequest, db: Session = Depends(get_db)):
    result = ReverseCascadeEngine().run(req.source_id, req.field, req.new_value, PhenomenaRepository(db))
    return {
        "source_id": result.source_id,
        "source_type": result.source_type,
        "field": result.field,
        "master_id": result.master_id,
        "reason": result.reason,
        "triggered": result.triggered,
    }


@router.get("/reverse-map")
def get_reverse_cascade_map():
    return REVERSE_CASCADE_MAP


@router.get("/preview")
def preview_cascade(master_id: str, field: str, db: Session = Depends(get_db)):
    children = PhenomenaRepository(db).get_children(master_id)
    affected_types = CASCADE_MAP.get(field, [])
    affected = [c for c in children if c.type in affected_types]
    return {
        "field": field,
        "affected_count": len(affected),
        "affected_ids": [c.id for c in affected],
        "affected_types": [c.type for c in affected],
    }
