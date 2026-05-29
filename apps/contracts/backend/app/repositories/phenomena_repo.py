from sqlalchemy.orm import Session
from ..models import PhenomenonDB
from phenomenon_engine import PhenomenonRecord, EssFields, Vector, OpusState


def _to_record(obj: PhenomenonDB, children: list[str] | None = None) -> PhenomenonRecord:
    # PHENOMENON III fields are stored in ag_json["_ph3"] to avoid a DB migration.
    # Existing records without "_ph3" default to None/empty safely.
    ph3 = (obj.ag_json or {}).get("_ph3", {}) if isinstance(obj.ag_json, dict) else {}
    return PhenomenonRecord(
        id=obj.id,
        type=obj.type,
        name=obj.name,
        status=obj.status,
        ess=EssFields(**obj.ess_json),
        ag=obj.ag_json,
        ia_instances=obj.ia_instances or [],
        vectors=[Vector(**v) for v in (obj.vectors_json or [])],
        opus=OpusState(**obj.opus_json),
        parentId=obj.parent_id,
        children=children or [],
        phenomenological_phase=ph3.get("phenomenological_phase"),
        ferencia_sensual=ph3.get("ferencia_sensual"),
        sec_types=ph3.get("sec_types", []),
        legal_basis=ph3.get("legal_basis"),
        negaciones=ph3.get("negaciones", []),
        cst_trigger_id=ph3.get("cst_trigger_id"),
        culpable_trigger_id=ph3.get("culpable_trigger_id"),
    )


class PhenomenaRepository:
    def __init__(self, db: Session):
        self.db = db

    def _child_ids(self, parent_id: str) -> list[str]:
        return [
            r.id
            for r in self.db.query(PhenomenonDB.id)
            .filter(PhenomenonDB.parent_id == parent_id)
            .all()
        ]

    def get(self, id: str) -> PhenomenonRecord:
        obj = self.db.query(PhenomenonDB).filter(PhenomenonDB.id == id).first()
        if not obj:
            raise KeyError(f"Phenomenon {id!r} not found")
        return _to_record(obj, self._child_ids(id))

    def get_children(self, parent_id: str) -> list[PhenomenonRecord]:
        objs = self.db.query(PhenomenonDB).filter(PhenomenonDB.parent_id == parent_id).all()
        return [_to_record(o, self._child_ids(o.id)) for o in objs]

    def list_all(self) -> list[PhenomenonRecord]:
        objs = self.db.query(PhenomenonDB).all()
        return [_to_record(o, self._child_ids(o.id)) for o in objs]

    def save(self, record: PhenomenonRecord) -> PhenomenonRecord:
        obj = self.db.query(PhenomenonDB).filter(PhenomenonDB.id == record.id).first()
        # Persist PHENOMENON III fields in ag_json["_ph3"] — no DB migration needed.
        ag = dict(record.ag) if record.ag else {}
        ph3_data = {
            "phenomenological_phase": record.phenomenological_phase,
            "ferencia_sensual":       record.ferencia_sensual,
            "sec_types":              record.sec_types,
            "legal_basis":            record.legal_basis,
            "negaciones":             record.negaciones,
            "cst_trigger_id":         record.cst_trigger_id,
            "culpable_trigger_id":    record.culpable_trigger_id,
        }
        # Only write _ph3 if at least one field is set (keeps existing records clean)
        if any(v for v in ph3_data.values() if v):
            ag["_ph3"] = ph3_data
        data = {
            "status": record.status,
            "ess_json": record.ess.model_dump(),
            "ag_json": ag,
            "ia_instances": record.ia_instances,
            "vectors_json": [v.model_dump() for v in record.vectors],
            "opus_json": record.opus.model_dump(),
        }
        if obj:
            for k, v in data.items():
                setattr(obj, k, v)
            if record.name:
                obj.name = record.name
        else:
            obj = PhenomenonDB(
                id=record.id,
                name=record.name,
                type=record.type,
                parent_id=record.parentId,
                **data,
            )
            self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return _to_record(obj, self._child_ids(obj.id))

    def delete(self, id: str) -> None:
        obj = self.db.query(PhenomenonDB).filter(PhenomenonDB.id == id).first()
        if obj:
            self.db.delete(obj)
            self.db.commit()
