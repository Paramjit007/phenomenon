"""
PHENOMENON Engine Configuration — Feature Flags for Theory Layers.

Each flag enables a theoretical layer when its documentation has been
received and fully implemented. Layers degrade gracefully when off.

Rule: NEVER set a flag to True until the corresponding theory_registry.py
entry has status=IMPLEMENTED. The Critical Warning is clear:
"No congelar ontología demasiado pronto."
"""

PHENOMENON_CONFIG: dict[str, bool | str] = {

    # ── Layer 0 — Pre-Core (pending documentation) ───────────────────────────
    "use_enus_layer":           False,   # 01_ONTOLOGY_CORE — PENDING
    "use_rec_matrix":           False,   # 02_REC_MATRIX — PENDING
    "use_language_morphology":  False,   # 03_LANGUAGE_BACKEND — PARTIAL
    "use_az_transformation":    False,   # 04_TRANSFORMATION_RULES — PENDING
    "use_circumenus_geometry":  False,   # 05_GEOMETRIC_RENDER — PARTIAL

    # ── Layer 1 — Bloques I-IX (active) ──────────────────────────────────────
    "use_bloques_i_ix":         True,
    "use_opus_engine":          True,
    "use_oponibility":          True,
    "use_bridge":               True,
    "use_base_cases":           True,
    "use_event_engine":         True,

    # ── Layer 2 — Domains ─────────────────────────────────────────────────────
    "domain_contracts":         True,
    "domain_arbitration":       True,    # SIAC — being built now
    "domain_mediation":         False,   # PLANNED
    "domain_103bis":            False,   # PLANNED

    # ── Languages ─────────────────────────────────────────────────────────────
    "language_spanish":         True,
    "language_english":         True,    # Required for SIAC

    # ── Disclaimers ───────────────────────────────────────────────────────────
    "disclaimer_legal_advice":  True,    # Always show: not legal advice
    "disclaimer_siac_specific": True,    # SIAC co-pilot specific disclaimer

    # ── Engine version ────────────────────────────────────────────────────────
    "engine_version":           "2.2",
    "theory_layer":             "Bloques_I-IX + Bridge + Opus + Oponibility",
    "pending_layers":           "Enus/Ensus/Exus/Entus, REC Matrix, AZ Transform",
}


def is_enabled(feature: str) -> bool:
    return bool(PHENOMENON_CONFIG.get(feature, False))


def get_active_layers() -> list[str]:
    return [k for k, v in PHENOMENON_CONFIG.items() if v is True]


def get_pending_layers() -> list[str]:
    from .theory_registry import REGISTRY, TheoryStatus
    return [e.name for e in REGISTRY.values() if e.status == TheoryStatus.PENDING]
