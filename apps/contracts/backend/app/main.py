from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, SessionLocal
from .models import Base
from .api import routes_phenomena, routes_cascade, routes_ai, routes_documents, routes_ecosystem, routes_demo


def _seed_master() -> None:
    from .repositories.phenomena_repo import PhenomenaRepository
    from phenomenon_engine import PhenomenonRecord, EssFields, Vector, OpusState

    db = SessionLocal()
    try:
        repo = PhenomenaRepository(db)
        try:
            repo.get("master-001")
        except KeyError:
            repo.save(
                PhenomenonRecord(
                    id="master-001",
                    type="MASTER",
                    name="Master Service Agreement",
                    status="ACTIVE",
                    ess=EssFields(
                        partyA="Acme Corporation",
                        partyB="TechVenture Ltd",
                        jurisdiction="England & Wales",
                        effectiveDate="2025-01-01",
                        expiryDate="2027-12-31",
                    ),
                    ag={
                        "clauses": [
                            "Services scope defined per attached Statement of Work",
                            "Either party may terminate with 90 days written notice",
                            "Aggregate liability capped at 12 months of fees paid",
                        ]
                    },
                    ia_instances=["ad-actio", "co-implication"],
                    vectors=[
                        Vector(
                            lation="binding",
                            sense="forward",
                            direction="F1→F2",
                            position="OPEN",
                            plication="implied",
                        )
                    ],
                    opus=OpusState(status="ACTIVE", homologation="PENDING"),
                )
            )
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_master()
    yield


app = FastAPI(
    title="PHENOMENON Contracts API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_phenomena.router, prefix="/phenomena", tags=["phenomena"])
app.include_router(routes_cascade.router, prefix="/cascade", tags=["cascade"])
app.include_router(routes_ai.router, prefix="/ai", tags=["ai"])
app.include_router(routes_documents.router, prefix="/documents", tags=["documents"])
app.include_router(routes_ecosystem.router, prefix="/ecosystem", tags=["ecosystem"])
app.include_router(routes_demo.router,      prefix="/demo",      tags=["demo"])


@app.get("/health")
def health():
    from phenomenon_engine import get_status_summary, PHENOMENON_CONFIG
    theory = get_status_summary()
    return {
        "status": "ok",
        "engine": "phenomenon-engine@0.2.0",
        "theory_completion_pct": theory["completion_pct"],
        "active_layers": PHENOMENON_CONFIG["theory_layer"],
        "pending_layers": PHENOMENON_CONFIG["pending_layers"],
        "domains_active": [k.replace("domain_","") for k,v in PHENOMENON_CONFIG.items() if k.startswith("domain_") and v is True],
    }


@app.get("/theory/status")
def theory_status():
    """Returns full PHENOMENON theory implementation status."""
    from phenomenon_engine import get_status_summary, get_pending_layers, REGISTRY
    summary = get_status_summary()
    return {
        **summary,
        "entries": [
            {
                "key": e.key,
                "name": e.name,
                "status": e.status.value,
                "source": e.source,
                "engine_file": e.engine_file,
                "note": e.note[:100] + "..." if len(e.note) > 100 else e.note,
                "works_without": e.works_without,
            }
            for e in REGISTRY.values()
        ]
    }
