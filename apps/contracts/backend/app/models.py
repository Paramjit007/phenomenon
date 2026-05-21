from sqlalchemy import Column, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import DeclarativeBase
import uuid
from datetime import datetime, timezone


class Base(DeclarativeBase):
    pass


class PhenomenonDB(Base):
    __tablename__ = "phenomena"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    parent_id = Column(String, ForeignKey("phenomena.id"), nullable=True)
    status = Column(String, default="DRAFT")
    ess_json = Column(JSON, nullable=False)
    ag_json = Column(JSON, nullable=False, default=lambda: {"clauses": []})
    ia_instances = Column(JSON, nullable=False, default=list)
    vectors_json = Column(JSON, nullable=False, default=list)
    opus_json = Column(JSON, nullable=False, default=lambda: {"status": "DRAFT", "homologation": "PENDING"})
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
