"""
Demo routes — KPMG case seeder and financial calculator.
Pre-loads the complete Hotel Mediterráneo Valencia 5* financing structure.
"""
import uuid
import math
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..repositories.phenomena_repo import PhenomenaRepository
from phenomenon_engine import PhenomenonRecord, EssFields, Vector, OpusState, VectorEngine

router = APIRouter()

# ─── Financial calculator ─────────────────────────────────────────────────────

def pmt(principal: float, annual_rate_pct: float, term_years: int) -> float:
    """Standard PMT formula: monthly payment for a constant annuity."""
    r = (annual_rate_pct / 100) / 12
    n = term_years * 12
    if r == 0:
        return principal / n
    return principal * r * math.pow(1 + r, n) / (math.pow(1 + r, n) - 1)


def amortization_schedule(principal: float, annual_rate_pct: float, term_years: int, months: int = 24):
    r = (annual_rate_pct / 100) / 12
    n = term_years * 12
    monthly = pmt(principal, annual_rate_pct, term_years)
    balance = principal
    schedule = []
    for i in range(1, min(months + 1, n + 1)):
        interest = balance * r
        capital  = monthly - interest
        balance  = max(0, balance - capital)
        schedule.append({
            "month":    i,
            "payment":  round(monthly, 2),
            "interest": round(interest, 2),
            "capital":  round(capital, 2),
            "balance":  round(balance, 2),
        })
    return schedule


@router.get("/amortization")
def get_amortization(
    principal: float = 100_000_000,
    euribor: float = 3.50,
    spread: float = 2.00,
    term_years: int = 20,
    months: int = 24,
):
    total_rate = euribor + spread
    monthly    = pmt(principal, total_rate, term_years)
    n          = term_years * 12
    total_paid = monthly * n
    schedule   = amortization_schedule(principal, total_rate, term_years, months)
    return {
        "principal":       round(principal, 2),
        "euribor":         euribor,
        "spread":          spread,
        "total_rate":      round(total_rate, 3),
        "term_years":      term_years,
        "term_months":     n,
        "monthly_payment": round(monthly, 2),
        "total_paid":      round(total_paid, 2),
        "total_interest":  round(total_paid - principal, 2),
        "schedule":        schedule,
    }


# ─── KPMG seeder ─────────────────────────────────────────────────────────────

KPMG_CLAUSES_MASTER = [
    "El arrendador, Promotora Hotel Mediterráneo Valencia S.L., cede en arrendamiento al arrendatario el futuro inmueble hotelero de categoría cinco estrellas (5*) a construir sobre el solar sito en Calle del Mar 15, Valencia (referencia catastral 7820517YJ2782A0001UB), con superficie total de 3.250 m². El presente arrendamiento recae sobre cosa futura al amparo del art. 1.461 CC en relación con el art. 1.554 CC.",
    "La eficacia plena del arrendamiento queda condicionada a la finalización de la obra de edificación del hotel y su entrega efectiva al arrendatario antes del 31 de diciembre de 2026. En caso de incumplimiento del plazo por causas imputables al arrendador, el arrendatario podrá resolver el contrato con derecho a la devolución de todas las cantidades entregadas más el interés legal del dinero.",
    "La renta mensual asciende a UN MILLÓN SESENTA Y CUATRO MIL QUINIENTOS OCHENTA Y TRES EUROS (1.064.583 €/mes), ajustable anualmente conforme a la variación del IPC publicado por el INE. La renta queda cedida en su integridad al Prestador del circumcontrato de financiación en virtud de la cesión de crédito regulada en documento independiente.",
    "Ambas partes reconocen y aceptan que el presente arrendamiento de cosa futura constituye el fenómeno principal (F1) del ecosistema contractual, del que dimanan el circumcontrato de financiación (CA2), la hipoteca sobre edificación futura y la cesión de crédito, todos ellos conexos por vínculos IF (inter-fenomécnicos) que determinan su extinción simultánea en caso de resolución del presente contrato.",
    "Cláusula de fuerza mayor: No constituirá incumplimiento la imposibilidad sobrevenida de ejecución de la obra derivada de causas ajenas a la voluntad de las partes, incluyendo fenómenos meteorológicos extraordinarios, actos de terrorismo, pandemias declaradas por la OMS o disposiciones administrativas de paralización de obras. El plazo de entrega se prorrogará automáticamente por el tiempo que dure la causa de fuerza mayor.",
]

KPMG_CLAUSES_FINANCIACION = [
    "El presente circumcontrato NO constituye préstamo conforme al art. 1.740 CC sino un arrendamiento de servicios financieros in faciendo conforme al art. 1.544 CC. Banco Mediterráneo de Inversiones S.A. (en adelante, el Prestador) no transmite la propiedad del dinero sino que presta el servicio de financiación continuada, siendo las cuotas mensuales de amortización la contraprestación del servicio prestado.",
    "El capital del servicio financiero asciende a CIEN MILLONES DE EUROS (100.000.000 €), a restituir mediante 240 cuotas mensuales iguales y consecutivas conforme al sistema de amortización francés (cuota constante de capital más intereses), calculadas aplicando el tipo resultante de sumar al EURIBOR a 12 meses el diferencial del DOS POR CIENTO (2,00%) anual.",
    "El tipo de interés es variable. Se revisará anualmente el 1 de enero de cada año, tomando como referencia el EURIBOR a 12 meses publicado por el Banco Central Europeo el último día hábil del mes de noviembre del año anterior. La cuota mensual resultante de la revisión se notificará al prestatario con un mínimo de 30 días de antelación.",
    "El prestatario podrá amortizar anticipadamente el capital pendiente, total o parcialmente, en cualquier momento, mediante transferencia bancaria a la cuenta designada y previo aviso escrito al prestador con 30 días de antelación. La amortización anticipada no devengará comisión alguna.",
    "Conforme a su naturaleza de CA2 (Circumacción Nivel 2 en el marco PHENOMENON), el presente circumcontrato queda vinculado IF al contrato de arrendamiento de cosa futura que constituye el fenómeno principal. Si dicho arrendamiento quedara resuelto por cualquier causa, el presente circumcontrato quedará sin efecto simultáneamente, procediéndose a la liquidación del capital pendiente en el plazo máximo de 90 días.",
]

KPMG_CLAUSES_HIPOTECA = [
    "En garantía del cumplimiento de las obligaciones derivadas del circumcontrato de financiación, Promotora Hotel Mediterráneo Valencia S.L. constituye hipoteca sobre el solar ubicado en Calle del Mar 15, Valencia (referencia catastral 7820517YJ2782A0001UB) y sobre la futura edificación hotelera que se construya sobre el mismo, de conformidad con lo previsto en el art. 110 de la Ley Hipotecaria para hipotecas sobre edificaciones futuras.",
    "La responsabilidad hipotecaria total asciende a CIENTO TREINTA MILLONES DE EUROS (130.000.000 €), distribuida: CIEN MILLONES (100.000.000 €) de capital garantizado, VEINTIOCHO MILLONES (28.000.000 €) de intereses ordinarios (3 años), UN MILLÓN QUINIENTOS MIL (1.500.000 €) de costas y gastos de ejecución.",
    "La hipoteca se constituye en escritura pública ante Notario e inscribirá en el Registro de la Propiedad de Valencia nº 5, siendo oponible erga omnes desde el momento de su inscripción registral. El coste de la inscripción (AJD) al tipo del 1,5% sobre la responsabilidad hipotecaria total en la Comunitat Valenciana asciende a UN MILLÓN NOVECIENTOS CINCUENTA MIL EUROS (1.950.000 €) a cargo del deudor.",
    "En caso de incumplimiento de las obligaciones garantizadas, el acreedor hipotecario queda investido de legitimación activa para el ejercicio de la acción de reclamación del crédito (actio pecuniae creditae) así como para instar el procedimiento de ejecución hipotecaria directa previsto en los arts. 681-698 LEC, con adjudicación del inmueble hipotecado en su caso.",
]

KPMG_CLAUSES_CESION = [
    "Promotora Hotel Mediterráneo Valencia S.L. (en adelante, Cedente) cede a Banco Mediterráneo de Inversiones S.A. (en adelante, Cesionario) todos los créditos presentes y futuros derivados del arrendamiento del hotel, incluyendo: (i) las rentas mensuales que pague Gestión Hotelera Costa Levante S.L. por importe de UN MILLÓN SESENTA Y CUATRO MIL QUINIENTOS OCHENTA Y TRES EUROS (1.064.583 €/mes), y (ii) las devoluciones del IVA soportado durante la ejecución de obras de edificación del hotel, estimadas en OCHO MILLONES CUATROCIENTOS MIL EUROS (8.400.000 €).",
    "La cesión se efectúa de conformidad con los arts. 1.526 a 1.536 del Código Civil, con garantía de existencia del crédito cedido por parte del Cedente. El Cesionario queda legitimado para reclamar directamente al deudor cedido (Gestión Hotelera Costa Levante S.L.) el importe de los créditos cedidos sin necesidad de intervención del Cedente.",
    "La oponibilidad de la cesión frente al deudor cedido se producirá mediante notificación fehaciente dirigida a Gestión Hotelera Costa Levante S.L., conforme al art. 1.527 CC, la cual deberá efectuarse en un plazo máximo de 5 días hábiles desde la firma del presente contrato. El Cedente se obliga a prestar toda la colaboración necesaria para facilitar dicha notificación.",
    "Las rentas cedidas serán ingresadas por el deudor cedido directamente en la cuenta IBAN ES91 2100 0418 4502 0005 1332 de titularidad del Cesionario, a partir de la fecha efectiva de notificación. El Cedente pierde, desde dicha fecha, la legitimación para exigir y percibir dichas rentas.",
]


def _delete_all_contracts(repo: PhenomenaRepository) -> None:
    """Delete all contracts children-first to avoid FK violations."""
    all_contracts = repo.list_all()
    sub = [c for c in all_contracts if c.parentId]
    masters_list = [c for c in all_contracts if not c.parentId]
    for c in sub + masters_list:
        try:
            repo.delete(c.id)
        except Exception:
            pass


@router.post("/kpmg/seed")
def seed_kpmg(db: Session = Depends(get_db)):
    """
    Seeds the complete KPMG Hotel Mediterráneo Valencia 5* financing structure.
    Deletes all existing contracts and creates 4 pre-filled, homologated contracts.
    """
    repo = PhenomenaRepository(db)

    # Delete all existing contracts (children first to avoid FK violations)
    _delete_all_contracts(repo)

    master_id  = str(uuid.uuid4())
    fin_id     = str(uuid.uuid4())
    hip_id     = str(uuid.uuid4())
    ces_id     = str(uuid.uuid4())

    euribor, spread = 3.50, 2.00
    total_rate      = euribor + spread
    principal       = 100_000_000.0
    term_years      = 20
    monthly         = pmt(principal, total_rate, term_years)

    ess_master = EssFields(
        partyA="Banco Mediterráneo de Inversiones S.A.",
        partyB="Promotora Hotel Mediterráneo Valencia S.L.",
        jurisdiction="Valencia",
        effectiveDate="2024-01-15",
        expiryDate="2044-01-15",
    )

    base_terms = dict(
        templateKey="KPMG",
        partyACIF="A-46123456",
        partyAAddress="Paseo de la Alameda 45, 46010 Valencia",
        partyARepresentative="D. Carlos Mendoza Ruiz, Consejero Delegado",
        partyBCIF="B-46987654",
        partyBAddress="Calle del Mar 15, 46001 Valencia",
        partyBRepresentative="D. Antonio García Pérez, Administrador Único",
        hotelName="Hotel Mediterráneo Valencia 5*",
        catastralReference="7820517YJ2782A0001UB",
        buildingArea="3250",
        constructionTarget="2026-12-31",
        baseAmount=str(int(principal)),
        euriborRate=str(euribor),
        spread=str(spread),
        termYears=str(term_years),
        monthlyRentHotel="1064583",
        ivaDevolutionEst="8400000",
        hotelCategory="5 Estrellas",
        registryOffice="Registro de la Propiedad de Valencia nº 5",
    )

    vec = lambda: VectorEngine().generate(ia_type="ad-actio", is_sub=False)
    vec_sub = lambda ia: VectorEngine().generate(ia_type=ia, is_sub=True)

    # ── Master: Arrendamiento de Cosa Futura ──────────────────────────────────
    master = PhenomenonRecord(
        id=master_id,
        name="Arrendamiento de Cosa Futura — Hotel Mediterráneo Valencia 5*",
        type="MASTER",
        status="ACTIVE",
        ess=ess_master,
        ag={"clauses": KPMG_CLAUSES_MASTER, "terms": base_terms},
        ia_instances=["ad-actio", "co-implication"],
        vectors=[vec()],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=None,
    )
    repo.save(master)

    # ── F2: Circumcontrato de Financiación (CA2) ──────────────────────────────
    financiacion_terms = dict(
        circumcontractType="CA2 — Arrendamiento de Servicios Financieros (art. 1544 CC) — NO es préstamo",
        legalBasis="No es préstamo (art. 1.740 CC) sino arrendamiento de servicios financieros in faciendo (art. 1.544 CC). El prestador no transmite la propiedad del dinero sino que presta el servicio de financiación.",
        capitalAmount=str(int(principal)),
        euriborRate=str(euribor),
        spread=str(spread),
        termYears=str(term_years),
        monthlyPayment=str(round(monthly, 0)),
        amortizationMethod="Cuota constante — Sistema Francés (capital + intereses)",
        interestReview="Anual (1 de enero, EURIBOR publicado por BCE)",
        iban="ES91 2100 0418 4502 0005 1332",
        swift="CAIXESBBXXX",
        earlyPayment="Permitida en cualquier momento, previo aviso 30 días",
        linkedToLease="Sí — si el arrendamiento de cosa futura queda sin efecto, este CA2 también queda sin efecto (IF link Bloque II)",
    )
    financiacion = PhenomenonRecord(
        id=fin_id,
        name="Circumcontrato de Arrendamiento de Servicios Financieros (CA2) — €100M",
        type="FINANCIACION",
        status="ACTIVE",
        ess=ess_master,
        ag={"clauses": KPMG_CLAUSES_FINANCIACION, "terms": financiacion_terms},
        ia_instances=["ad-actio"],
        vectors=[vec_sub("ad-actio")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=master_id,
    )
    repo.save(financiacion)

    # ── F3: Hipoteca sobre Solar y Edificación Futura ─────────────────────────
    hipoteca_terms = dict(
        mortgageAmount=str(int(principal)),
        additionalCoverage="30",
        totalMortgage="130000000",
        mortgagedProperty="Solar urbano + futura edificación hotelera 5* (3.250 m²) a construir sobre el mismo. Referencia catastral: 7820517YJ2782A0001UB. Calle del Mar 15, 46001 Valencia.",
        catastralReference="7820517YJ2782A0001UB",
        fincaFutura="Sí — la edificación aún no existe (Art. 110 LH · hipoteca edificación futura)",
        registryOffice="Registro de la Propiedad de Valencia nº 5",
        registrySection="Pendiente de inscripción — Opus PARCIAL",
        ajdRate="1.5",
        ajdAmount="1950000",
        registrationStatus="Pendiente de inscripción — Opus PARCIAL",
        legitimacion="Actio pecuniae creditae (art. 1111 CC + arts. 1526 ss CC)",
        cessionRights="Permitida libremente (Arts. 1.526 y ss CC)",
    )
    hipoteca = PhenomenonRecord(
        id=hip_id,
        name="Hipoteca sobre Solar y Edificación Futura — €100M + 30% costas",
        type="HIPOTECA_GARANTIA",
        status="ACTIVE",
        ess=ess_master,
        ag={"clauses": KPMG_CLAUSES_HIPOTECA, "terms": hipoteca_terms},
        ia_instances=["non", "de-actio"],
        vectors=[vec_sub("non")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=master_id,
    )
    repo.save(hipoteca)

    # ── F4: Cesión de Crédito — Rentas + IVA ─────────────────────────────────
    cesion_terms = dict(
        cedente="Promotora Hotel Mediterráneo Valencia S.L.",
        cesionario="Banco Mediterráneo de Inversiones S.A.",
        deudorCedido="Gestión Hotelera Costa Levante S.L.",
        monthlyRent="1064583",
        annualRent="12775000",
        cedidoRentas="Rentas que pague mensualmente Gestión Hotelera Costa Levante S.L. en virtud del arrendamiento del hotel a favor de Promotora Hotel Mediterráneo Valencia S.L., por importe de 1.064.583 €/mes.",
        cedidoIVA="Devoluciones del IVA de inversión (21%) generadas durante la ejecución de obras de edificación del hotel. Importe estimado: 8.400.000 €.",
        ivaDevolution="8400000",
        oponibilidadCesion="Notificación fehaciente al deudor cedido (Art. 1527 CC) — notificación enviada",
        garantiaCesion="Garantía de existencia del crédito (cedente responde de que el crédito existe)",
        notificationMethod="Burofax con acuse de recibo",
    )
    cesion = PhenomenonRecord(
        id=ces_id,
        name="Cesión de Crédito — Rentas Hotel 1.064.583 €/mes + IVA 8.400.000 €",
        type="CESION_CREDITO",
        status="ACTIVE",
        ess=ess_master,
        ag={"clauses": KPMG_CLAUSES_CESION, "terms": cesion_terms},
        ia_instances=["de-actio"],
        vectors=[vec_sub("de-actio")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=master_id,
    )
    repo.save(cesion)

    return {
        "seeded": True,
        "master_id": master_id,
        "sub_ids": {
            "financiacion": fin_id,
            "hipoteca":     hip_id,
            "cesion":       ces_id,
        },
        "summary": {
            "hotel":          "Hotel Mediterráneo Valencia 5*",
            "principal":      "€100.000.000",
            "monthly_pmt":    f"€{round(monthly):,}".replace(",", "."),
            "total_interest": f"€{round(monthly * term_years * 12 - principal):,}".replace(",", "."),
            "parties": {
                "financiador": "Banco Mediterráneo de Inversiones S.A.",
                "promotora":   "Promotora Hotel Mediterráneo Valencia S.L.",
            },
        },
    }


class EuriborUpdateRequest(BaseModel):
    master_id: str
    new_euribor: float
    new_spread: float = 2.00
    new_term_years: int = 20


@router.post("/kpmg/update-euribor")
def update_euribor(req: EuriborUpdateRequest, db: Session = Depends(get_db)):
    """
    Updates EURIBOR rate across all KPMG financial contracts and cascades NEEDS_REVIEW.
    Used by the demo panel EURIBOR slider.
    """
    from ..repositories.phenomena_repo import PhenomenaRepository
    from phenomenon_engine.cascade_engine import SubCascadeEngine, ReverseCascadeEngine

    repo = PhenomenaRepository(db)
    children = repo.get_children(req.master_id)

    total_rate = req.new_euribor + req.new_spread
    monthly    = pmt(100_000_000, total_rate, req.new_term_years)

    affected = []
    for c in children:
        if c.type in ("FINANCIACION", "HIPOTECA_GARANTIA", "CESION_CREDITO"):
            terms = dict(c.ag.get("terms", {}))
            terms["euriborRate"]    = str(req.new_euribor)
            terms["spread"]         = str(req.new_spread)
            terms["monthlyPayment"] = str(round(monthly, 0))
            updated = c.model_copy(update={
                "ag":     {**c.ag, "terms": terms},
                "status": "NEEDS_REVIEW",
                "opus":   c.opus.model_copy(update={"homologation": "PENDING"}),
            })
            repo.save(updated)
            affected.append(c.id)

    # Mark master NEEDS_REVIEW
    master = repo.get(req.master_id)
    repo.save(master.model_copy(update={
        "status": "NEEDS_REVIEW",
        "opus":   master.opus.model_copy(update={"homologation": "PENDING"}),
    }))

    new_amort = get_amortization(100_000_000, req.new_euribor, req.new_spread, req.new_term_years, 6)

    return {
        "updated":         True,
        "new_euribor":     req.new_euribor,
        "new_spread":      req.new_spread,
        "total_rate":      total_rate,
        "new_monthly_pmt": round(monthly, 2),
        "affected_ids":    affected + [req.master_id],
        "amortization":    new_amort,
    }


class FillKPMGFieldsRequest(BaseModel):
    master_id: str


@router.post("/kpmg/fill-demo-fields")
def fill_kpmg_demo_fields(req: FillKPMGFieldsRequest, db: Session = Depends(get_db)):
    """
    Fills all KPMG contracts with demo field data and resets homologation to PENDING.
    Enables the PARTIAL → COMPLETE homologation demonstration flow.
    """
    from ..repositories.phenomena_repo import PhenomenaRepository

    repo    = PhenomenaRepository(db)
    master  = repo.get(req.master_id)
    if not master:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Master not found")

    euribor, spread = 3.50, 2.00
    term_years      = 20
    principal       = 100_000_000.0
    monthly         = pmt(principal, euribor + spread, term_years)

    base_terms = dict(
        templateKey="KPMG",
        partyACIF="A-46123456",
        partyAAddress="Paseo de la Alameda 45, 46010 Valencia",
        partyARepresentative="D. Carlos Mendoza Ruiz, Consejero Delegado",
        partyBCIF="B-46987654",
        partyBAddress="Calle del Mar 15, 46001 Valencia",
        partyBRepresentative="D. Antonio García Pérez, Administrador Único",
        hotelName="Hotel Mediterráneo Valencia 5*",
        catastralReference="7820517YJ2782A0001UB",
        buildingArea="3250",
        constructionTarget="2026-12-31",
        baseAmount=str(int(principal)),
        euriborRate=str(euribor),
        spread=str(spread),
        termYears=str(term_years),
        monthlyRentHotel="1064583",
        ivaDevolutionEst="8400000",
        hotelCategory="5 Estrellas",
        registryOffice="Registro de la Propiedad de Valencia nº 5",
    )

    updated_master = master.model_copy(update={
        "ag":     {**master.ag, "terms": {**master.ag.get("terms", {}), **base_terms}},
        "opus":   master.opus.model_copy(update={"homologation": "PENDING"}),
        "status": "ACTIVE",
    })
    repo.save(updated_master)
    updated_ids = [master.id]

    for child in repo.get_children(req.master_id):
        terms = dict(child.ag.get("terms", {}))
        if child.type == "FINANCIACION":
            terms.update(
                circumcontractType="CA2 — Arrendamiento de Servicios Financieros (art. 1544 CC) — NO es préstamo",
                legalBasis="No es préstamo (art. 1.740 CC) sino arrendamiento de servicios financieros in faciendo (art. 1.544 CC).",
                capitalAmount=str(int(principal)),
                euriborRate=str(euribor),
                spread=str(spread),
                termYears=str(term_years),
                monthlyPayment=str(round(monthly, 0)),
                amortizationMethod="Cuota constante — Sistema Francés (capital + intereses)",
                interestReview="Anual (1 de enero, EURIBOR publicado por BCE)",
                iban="ES91 2100 0418 4502 0005 1332",
                swift="CAIXESBBXXX",
                earlyPayment="Permitida en cualquier momento, previo aviso 30 días",
                linkedToLease="Sí — si el arrendamiento queda sin efecto, este CA2 también queda sin efecto (IF link Bloque II)",
            )
        elif child.type == "HIPOTECA_GARANTIA":
            terms.update(
                mortgageAmount=str(int(principal)),
                additionalCoverage="30",
                totalMortgage="130000000",
                mortgagedProperty="Solar urbano + futura edificación hotelera 5* (3.250 m²). Referencia catastral: 7820517YJ2782A0001UB.",
                catastralReference="7820517YJ2782A0001UB",
                fincaFutura="Sí — la edificación aún no existe (Art. 110 LH · hipoteca edificación futura)",
                registryOffice="Registro de la Propiedad de Valencia nº 5",
                registrySection="Pendiente de inscripción",
                ajdRate="1.5",
                ajdAmount="1950000",
                registrationStatus="Pendiente de inscripción — Opus PARCIAL",
                legitimacion="Actio pecuniae creditae (art. 1111 CC + arts. 1526 ss CC)",
                cessionRights="Permitida libremente (Arts. 1.526 y ss CC)",
            )
        elif child.type == "CESION_CREDITO":
            terms.update(
                cedente="Promotora Hotel Mediterráneo Valencia S.L.",
                cesionario="Banco Mediterráneo de Inversiones S.A.",
                deudorCedido="Gestión Hotelera Costa Levante S.L.",
                monthlyRent="1064583",
                annualRent="12775000",
                cedidoRentas="Rentas que pague mensualmente Gestión Hotelera Costa Levante S.L., 1.064.583 €/mes.",
                cedidoIVA="Devoluciones del IVA de inversión (21%) generadas durante la ejecución de obras. Importe estimado: 8.400.000 €.",
                ivaDevolution="8400000",
                oponibilidadCesion="Notificación fehaciente al deudor cedido (Art. 1527 CC) — notificación enviada",
                garantiaCesion="Garantía de existencia del crédito (cedente responde de que el crédito existe)",
                notificationMethod="Burofax con acuse de recibo",
            )
        updated_child = child.model_copy(update={
            "ag":     {**child.ag, "terms": terms},
            "opus":   child.opus.model_copy(update={"homologation": "PENDING"}),
            "status": "ACTIVE",
        })
        repo.save(updated_child)
        updated_ids.append(child.id)

    return {"filled": True, "updated_ids": updated_ids, "count": len(updated_ids)}


# ─── Seguros seeder ───────────────────────────────────────────────────────────
# Seeds 4 insurance master contracts simultaneously, each with 3 sub-contracts.
# Demonstrates PHENOMENON combinatoria: same ESS/AG/IF/Opus engine, 4 modulaciones.
# SEGURO_VIDA → COBERTURA_VIDA, EXCLUSIONES_VIDA, PRIMA_VIDA
# SEGURO_RC   → COBERTURA_RC, LIMITES_RC, FRANQUICIA_RC
# SEGURO_DANOS→ COBERTURA_DANOS, PERITACION, EXCLUSIONES_DANOS
# SEGURO_CREDITO_COMERCIAL → COBERTURA_CREDITO, VALIDACION_FINANCIERA, RIESGO_EMPRESARIAL
#
# Key demo scenario: COBERTURA_CREDITO starts BLOCKED because VALIDACION_FINANCIERA
# has pending rating — demonstrating IF_exclusion (non operator, Bloque II §4).

@router.post("/seguros/seed")
def seed_seguros(db: Session = Depends(get_db)):
    """
    Seeds all 4 insurance policies simultaneously.
    Deletes existing contracts and creates 16 pre-filled contracts (4 masters × 4 subs).
    """
    repo = PhenomenaRepository(db)

    # Clean slate (children first to avoid FK violations)
    _delete_all_contracts(repo)

    vec_m   = lambda: VectorEngine().generate(ia_type="ad-actio", is_sub=False)
    vec_s   = lambda ia: VectorEngine().generate(ia_type=ia, is_sub=True)

    # ── 1. SEGURO_VIDA — AXA Vida S.A. ───────────────────────────────────────
    vida_id  = str(uuid.uuid4())
    cv_id    = str(uuid.uuid4())  # COBERTURA_VIDA
    ev_id    = str(uuid.uuid4())  # EXCLUSIONES_VIDA
    pv_id    = str(uuid.uuid4())  # PRIMA_VIDA

    ess_vida = EssFields(
        partyA="Comerciales del Levante S.L.",
        partyB="AXA Vida S.A.",
        jurisdiction="Valencia",
        effectiveDate="2024-01-01",
        expiryDate="2044-01-01",
    )

    repo.save(PhenomenonRecord(
        id=vida_id, name="Seguro de Vida — Comerciales del Levante S.L. / AXA Vida S.A.",
        type="MASTER", status="ACTIVE", ess=ess_vida,
        ag={"clauses": [
            "El asegurador AXA Vida S.A. garantiza el pago del capital asegurado de TRESCIENTOS MIL EUROS (300.000 €) a los beneficiarios designados en caso de fallecimiento o invalidez absoluta y permanente del asegurado D. Javier Martínez Pérez (Consejero Delegado), ocurridos durante la vigencia de la póliza. Tomador: Comerciales del Levante S.L.",
            "La cobertura queda condicionada a la aceptación de la declaración de salud por parte del asegurador y al pago puntual de la prima anual. Cualquier ocultación o inexactitud dolosa en la declaración de salud faculta al asegurador a reducir la indemnización proporcionalmente (art. 10 LCS).",
            "Se designan como beneficiarios: la propia empresa Comerciales del Levante S.L. como tomador, con subrogación a los herederos del asegurado en caso de disolución. El asegurado puede modificar la designación de beneficiarios en cualquier momento mediante comunicación fehaciente al asegurador.",
        ], "terms": {
            "templateKey": "SEGURO_VIDA",
            "partyACIF": "B-46123456",
            "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
            "partyBCIF": "A-28123456",
            "partyBAddress": "Paseo de la Castellana 33, 28046 Madrid",
            "insuredName": "D. Javier Martínez Pérez (Consejero Delegado)",
            "insuredAge": "48",
            "capitalDeceso": "300000",
            "capitalInvalidez": "300000",
            "primaAnual": "1850",
            "beneficiaries": "Cónyuge e hijos por partes iguales",
            "coverageType": "Fallecimiento e invalidez absoluta permanente",
            "medicalValidation": "Aprobada sin exclusiones",
        }},
        ia_instances=["ad-actio", "co-implication"],
        vectors=[vec_m()],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=None,
    ))

    repo.save(PhenomenonRecord(
        id=cv_id, name="Cobertura de Vida — Capital 300.000 € — Activa",
        type="COBERTURA_VIDA", status="ACTIVE", ess=ess_vida,
        ag={"clauses": [
            "La cobertura de vida está ACTIVA. Declaración de salud aceptada sin exclusiones. Capital asegurado: 300.000 €. Condición IF cumplida: prima en vigor y declaración de salud aceptada.",
        ], "terms": {
            "coverageCapital": "300000",
            "coverageActivationDate": "2024-01-01",
            "waitingPeriodMonths": "0",
            "coverageStatus": "ACTIVA — Sin exclusiones activas",
            "activationCondition": "Todas las condiciones cumplidas",
            "beneficiaryConfirmed": "Sí",
        }},
        ia_instances=["ad-actio"],
        vectors=[vec_s("ad-actio")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=vida_id,
    ))

    repo.save(PhenomenonRecord(
        id=ev_id, name="Exclusiones Vida — Sin exclusiones activas",
        type="EXCLUSIONES_VIDA", status="ACTIVE", ess=ess_vida,
        ag={"clauses": [
            "No existen exclusiones médicas activas. La declaración de salud fue aceptada íntegramente por el servicio médico de AXA Vida S.A. el 15 de diciembre de 2023. El asegurado no practica actividades de riesgo excluidas por condiciones generales.",
            "Exclusiones generales de la póliza (no vinculadas al asegurado concreto): suicidio durante los primeros 12 meses desde el inicio de la póliza; muerte causada por participación activa en conflictos armados; actos dolosos del beneficiario.",
        ], "terms": {
            "preExistingConditions": "Ninguna — declaración de salud aceptada sin exclusiones",
            "riskActivities": "Ninguna — no practica deportes de alto riesgo",
            "exclusionPeriod": "0",
            "blockingStatus": "No bloquea la cobertura principal",
            "medicalExamRequired": "No requerido (suma < 300.000 €)",
            "medicalExamDate": "2023-12-15",  # date of declaración de salud aceptada
        }},
        ia_instances=["non", "de-actio"],
        vectors=[vec_s("non")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=vida_id,
    ))

    repo.save(PhenomenonRecord(
        id=pv_id, name="Prima Vida — 1.850 €/año — Pago anual",
        type="PRIMA_VIDA", status="ACTIVE", ess=ess_vida,
        ag={"clauses": [
            "La prima anual neta es de MIL OCHOCIENTOS CINCUENTA EUROS (1.850 €/año), pagadera anualmente por domiciliación bancaria en la cuenta designada. El impago de la prima no produce la resolución automática del contrato sino la suspensión de la cobertura previo requerimiento fehaciente (art. 15 LCS).",
        ], "terms": {
            "annualPremium": "1850",
            "fractionalSurcharge": "0",
            "paymentFrequency": "Anual",
            "premiumReviewDate": "2025-01-01",
            "premiumIndexation": "IPC anual",
        }},
        ia_instances=["ad-actio"],
        vectors=[vec_s("ad-actio")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=vida_id,
    ))

    # ── 2. SEGURO_RC — Mapfre S.A. ───────────────────────────────────────────
    rc_id    = str(uuid.uuid4())
    crc_id   = str(uuid.uuid4())  # COBERTURA_RC
    lrc_id   = str(uuid.uuid4())  # LIMITES_RC
    frc_id   = str(uuid.uuid4())  # FRANQUICIA_RC

    ess_rc = EssFields(
        partyA="Comerciales del Levante S.L.",
        partyB="Mapfre S.A.",
        jurisdiction="Valencia",
        effectiveDate="2024-03-01",
        expiryDate="2025-03-01",
    )

    repo.save(PhenomenonRecord(
        id=rc_id, name="Seguro RC Profesional — Comerciales del Levante S.L. / Mapfre S.A.",
        type="MASTER", status="ACTIVE", ess=ess_rc,
        ag={"clauses": [
            "Mapfre S.A. asegura la responsabilidad civil profesional de Comerciales del Levante S.L. frente a daños causados a terceros derivados del ejercicio de su actividad de distribución comercial e importación, hasta el límite de SEISCIENTOS MIL EUROS (600.000 €) por siniestro y UN MILLÓN DOSCIENTOS MIL EUROS (1.200.000 €) en agregado anual.",
            "La póliza tiene base claims made: cubre las reclamaciones presentadas durante la vigencia de la póliza por hechos acaecidos en dicha vigencia o durante el período de retroactividad acordado. Franquicia por siniestro: TRES MIL EUROS (3.000 €) a cargo del asegurado.",
        ], "terms": {
            "templateKey": "SEGURO_RC",
            "partyACIF": "B-46123456",
            "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
            "partyBCIF": "A-28765432",
            "partyBAddress": "Carretera de Pozuelo 52, 28220 Majadahonda",
            "activityInsured": "Distribución comercial e importación de productos industriales",
            "coverageLimit": "600000",
            "annualAggregateLimit": "1200000",
            "franquicia": "3000",
            "primaAnual": "4200",
            "rcType": "RC Profesional (errores y omisiones)",
        }},
        ia_instances=["ad-actio", "co-implication"],
        vectors=[vec_m()],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=None,
    ))

    repo.save(PhenomenonRecord(
        id=crc_id, name="Cobertura RC — 600.000 € por siniestro — Activa",
        type="COBERTURA_RC", status="ACTIVE", ess=ess_rc,
        ag={"clauses": [
            "Cobertura RC profesional ACTIVA. Cubre daños personales, materiales y perjuicios económicos causados a terceros en el ejercicio de la actividad asegurada. Base claims made. Límite: 600.000 €/siniestro.",
        ], "terms": {
            "coverageLimit": "600000",
            "annualAggregateLimit": "1200000",
            "coverageScope": "Daños personales, materiales y perjuicios económicos",
            "retroactiveCoverage": "Desde fecha de contratación",
            "claimBasis": "Claims made (reclamación durante vigencia)",
            "coverageStatus": "ACTIVA",
        }},
        ia_instances=["ad-actio", "co-implication"],
        vectors=[vec_s("ad-actio")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=rc_id,
    ))

    repo.save(PhenomenonRecord(
        id=lrc_id, name="Límites RC — 600.000 €/siniestro · 1.200.000 €/año",
        type="LIMITES_RC", status="ACTIVE", ess=ess_rc,
        ag={"clauses": [
            "Límites de indemnización: SEISCIENTOS MIL EUROS (600.000 €) por siniestro individual. UN MILLÓN DOSCIENTOS MIL EUROS (1.200.000 €) como agregado anual. Sublímite defensa jurídica: TREINTA MIL EUROS (30.000 €) por expediente.",
        ], "terms": {
            "perClaimLimit": "600000",
            "perPersonLimit": "300000",
            "propertyDamageLimit": "200000",
            "legalDefenseLimit": "30000",
        }},
        ia_instances=["ad-actio"],
        vectors=[vec_s("ad-actio")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=rc_id,
    ))

    repo.save(PhenomenonRecord(
        id=frc_id, name="Franquicia RC — 3.000 € por siniestro (IF_posición)",
        type="FRANQUICIA_RC", status="ACTIVE", ess=ess_rc,
        ag={"clauses": [
            "Franquicia absoluta de TRES MIL EUROS (3.000 €) por siniestro, a cargo del asegurado en todos los casos. La franquicia actúa como IF_posición (umbral posicional, Bloque II §4): el vector de cobertura no se activa hasta que el daño supera este umbral.",
        ], "terms": {
            "deductibleAmount": "3000",
            "deductibleType": "Absoluta (siempre a cargo del asegurado)",
            "deductibleApplied": "No aplica (sin siniestros)",
        }},
        ia_instances=["non"],
        vectors=[vec_s("non")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=rc_id,
    ))

    # ── 3. SEGURO_DANOS — Allianz S.A. ───────────────────────────────────────
    danos_id  = str(uuid.uuid4())
    cd_id     = str(uuid.uuid4())  # COBERTURA_DANOS
    per_id    = str(uuid.uuid4())  # PERITACION
    ed_id     = str(uuid.uuid4())  # EXCLUSIONES_DANOS

    ess_danos = EssFields(
        partyA="Comerciales del Levante S.L.",
        partyB="Allianz S.A.",
        jurisdiction="Valencia",
        effectiveDate="2024-01-15",
        expiryDate="2025-01-15",
    )

    repo.save(PhenomenonRecord(
        id=danos_id, name="Seguro Daños — Nave Industrial / Allianz S.A.",
        type="MASTER", status="ACTIVE", ess=ess_danos,
        ag={"clauses": [
            "Allianz S.A. asegura los daños materiales que sufra la nave industrial sita en Polígono Industrial Norte, Nave 12, 46015 Valencia, valorada en SETECIENTOS CINCUENTA MIL EUROS (750.000 €) en valor de nuevo, frente a los riesgos de incendio, explosión, daños por agua, robo y daños eléctricos.",
            "En caso de siniestro, el valor de los daños se determinará mediante peritación conforme al art. 38 LCS. Si existe discrepancia entre el perito del asegurado y el de la aseguradora, se nombrará un árbitro de dirimir por turno de los colegios profesionales competentes.",
            "Franquicia del DIEZ POR CIENTO (10%) sobre el importe de cada siniestro, con un mínimo de 1.500 €. No aplica a los siniestros de incendio total (pérdida superior al 80% del valor asegurado).",
        ], "terms": {
            "templateKey": "SEGURO_DANOS",
            "partyACIF": "B-46123456",
            "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
            "partyBCIF": "A-28765432",
            "partyBAddress": "Gran Vía 24, 28001 Madrid",
            "propertyDescription": "Nave industrial de 1.500 m², estructura metálica, cubierta de hormigón prefabricado, instalación eléctrica trifásica. Polígono Industrial Norte, Nave 12, 46015 Valencia.",
            "propertyValue": "750000",
            "coverageRisks": "Todo riesgo (all-risk)",
            "primaAnual": "3150",
            "deductible": "10",
            "peritacionMethod": "Perito de parte + árbitro (art. 38 LCS)",
        }},
        ia_instances=["ad-actio", "co-implication"],
        vectors=[vec_m()],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=None,
    ))

    repo.save(PhenomenonRecord(
        id=cd_id, name="Cobertura Daños — Todo Riesgo — 750.000 € en nuevo",
        type="COBERTURA_DANOS", status="ACTIVE", ess=ess_danos,
        ag={"clauses": [
            "Cobertura todo riesgo sobre la nave industrial. Valor en nuevo: 750.000 €. Riesgos cubiertos: incendio, explosión, daños por agua, robo, daños eléctricos y avería de maquinaria. Franquicia: 10% por siniestro (mín. 1.500 €).",
        ], "terms": {
            "insuredValue": "750000",
            "coverageRisks": "Incendio, explosión, daños por agua, robo, daños eléctricos",
            "coverageStatus": "ACTIVA",
            "infravaluation": "Sin infraseguro declarado",
            "valueBasis": "Valor en nuevo",
        }},
        ia_instances=["ad-actio", "co-implication"],
        vectors=[vec_s("ad-actio")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=danos_id,
    ))

    repo.save(PhenomenonRecord(
        id=per_id, name="Peritación — Sin siniestro activo",
        type="PERITACION", status="ACTIVE", ess=ess_danos,
        ag={"clauses": [
            "No existe siniestro activo en la fecha de emisión. El proceso de peritación se activará en el momento en que se produzca un siniestro cubierto. El perito de la aseguradora será designado en un plazo máximo de 5 días hábiles desde la comunicación del siniestro.",
        ], "terms": {
            "peritacionStatus": "Sin siniestro activo",
            # Default values for pre-siniestro state. On declarar_siniestro these fields
            # are typically overwritten with the real perito names and damage data.
            "aseguradoraPerito": "Pendiente de designación (5 días hábiles desde siniestro)",
            "aseguradoPerito": "No aplica — sin contradicción activa",
            "damageCause": "No aplica — sin siniestro activo",
            "estimatedDamage": "0",
            "agreedIndemnity": "0",
            "peritacionDeadline": "2026-12-31",  # generic deadline (art. 38 LCS = 40 días desde siniestro)
        }},
        ia_instances=["ad-actio"],
        vectors=[vec_s("ad-actio")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=danos_id,
    ))

    repo.save(PhenomenonRecord(
        id=ed_id, name="Exclusiones Daños — Desgaste normal, guerra, dolo",
        type="EXCLUSIONES_DANOS", status="ACTIVE", ess=ess_danos,
        ag={"clauses": [
            "Quedan excluidos de la cobertura: el desgaste normal y progresivo de los bienes; los daños causados dolosamente por el asegurado; los daños causados por guerra, terrorismo o convulsión social; los daños por falta de mantenimiento acreditada; los bienes en tránsito fuera de la ubicación asegurada.",
        ], "terms": {
            "excludedRisks": "Desgaste normal, dolo del asegurado, guerra, terrorismo, daños en tránsito",
            "excludedProperty": "Bienes en tránsito, efectivo, joyas no declaradas",
            "maintenanceExclusion": "Aplica (daños por no mantenimiento excluidos)",
            "blockingExclusion": "No — cobertura activa",
        }},
        ia_instances=["non"],
        vectors=[vec_s("non")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=danos_id,
    ))

    # ── 4. SEGURO_CREDITO_COMERCIAL — Mapfre Crédito ─────────────────────────
    # KEY DEMO: COBERTURA_CREDITO starts BLOCKED because VALIDACION_FINANCIERA
    # has not confirmed the debtor rating → IF_exclusion (non) is active.
    cred_id   = str(uuid.uuid4())
    ccred_id  = str(uuid.uuid4())  # COBERTURA_CREDITO (BLOCKED)
    vf_id     = str(uuid.uuid4())  # VALIDACION_FINANCIERA
    re_id     = str(uuid.uuid4())  # RIESGO_EMPRESARIAL

    ess_cred = EssFields(
        partyA="Comerciales del Levante S.L.",
        partyB="Mapfre Crédito y Caución S.A.",
        jurisdiction="Valencia",
        effectiveDate="2024-02-01",
        expiryDate="2025-02-01",
    )

    repo.save(PhenomenonRecord(
        id=cred_id, name="Seguro Crédito Comercial — Comerciales del Levante S.L. / Mapfre Crédito",
        type="MASTER", status="ACTIVE", ess=ess_cred,
        ag={"clauses": [
            "Mapfre Crédito y Caución S.A. asegura a Comerciales del Levante S.L. frente al impago de su deudor principal Distribuciones Sur S.L., hasta el límite de QUINIENTOS MIL EUROS (500.000 €), con un porcentaje de indemnización del OCHENTA Y CINCO POR CIENTO (85%) sobre las facturas impagas transcurrido el período de espera.",
            "Cobertura ACTIVA: la validación financiera del deudor Distribuciones Sur S.L. concluyó con rating A. La cobertura está plenamente operativa. El operador 'non' (IF_exclusion, Bloque II §4) permanece latente — se activará automáticamente si la calificación crediticia se degrada a C o D, bloqueando la cobertura por cascada.",
        ], "terms": {
            "templateKey": "SEGURO_CREDITO_COMERCIAL",
            "partyACIF": "B-46123456",
            "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
            "partyBCIF": "A-28765000",
            "partyBAddress": "Carretera de Pozuelo 52, 28220 Majadahonda",
            "debtorName": "Distribuciones Sur S.L.",
            "creditLimit": "500000",
            "indemnityPct": "85",
            "primaAnual": "8750",
            "waitingPeriod": "6",
            "financialValidation": "Completada — rating A (cobertura activa)",
        }},
        ia_instances=["ad-actio"],
        vectors=[vec_m()],
        opus=OpusState(status="ACTIVE", homologation="PENDING"),
        parentId=None,
    ))

    # COBERTURA_CREDITO: ACTIVE — validación financiera completada con rating A.
    # Demo flow: change financialRating to "D" in VALIDACION_FINANCIERA to see
    # the IF_exclusion trigger and this coverage become BLOQUEADA via cascade.
    repo.save(PhenomenonRecord(
        id=ccred_id, name="Cobertura Crédito — Distribuciones Sur — Activa",
        type="COBERTURA_CREDITO", status="ACTIVE", ess=ess_cred,
        ag={"clauses": [
            "Cobertura de crédito comercial sobre el deudor principal Distribuciones Sur S.L. activada tras superar la validación financiera con rating A. Límite total de cobertura: 500.000 €. Indemnización al 85% del crédito impagado tras franquicia temporal de 90 días.",
            "PHENOMENON: la cobertura está activa porque el operador 'non' (IF_exclusion, Bloque II §4) no se ha disparado — el rating A despeja la posición de bloqueo. Si VALIDACION_FINANCIERA degrada el rating a C o D, el operador 'non' se activa y este vector de cobertura queda automáticamente BLOQUEADO por cascada.",
        ], "terms": {
            "coveredDebtors": "Distribuciones Sur S.L. — límite 500.000 € — rating A",
            "totalCoverageLimit": "500000",
            "indemnityPercentage": "85",
            "coverageStatus": "ACTIVA — validación financiera superada",
            "blockingReason": "Sin bloqueo activo — rating A vigente. Se activará IF_exclusion si el rating cae a C o D.",
            "unblockCondition": "Validación financiera con rating A o B",
        }},
        ia_instances=["ad-actio"],
        vectors=[vec_s("ad-actio")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=cred_id,
    ))

    # VALIDACION_FINANCIERA: completed with rating A. Changing this rating
    # to D triggers SUB_CASCADE_MAP[VALIDACION_FINANCIERA][financialRating]
    # which flags COBERTURA_CREDITO for NEEDS_REVIEW — the IF_exclusion demo.
    repo.save(PhenomenonRecord(
        id=vf_id, name="Validación Financiera — Distribuciones Sur — Rating A",
        type="VALIDACION_FINANCIERA", status="ACTIVE", ess=ess_cred,
        ag={"clauses": [
            "El departamento de riesgo de Mapfre Crédito ha completado la calificación crediticia de Distribuciones Sur S.L. Calificación final: A (excelente). Ratios financieros sólidos: endeudamiento 35%, liquidez 1.8, historial de pagos sin incidencias en los últimos 36 meses. La cobertura de crédito queda HABILITADA sin restricciones adicionales.",
        ], "terms": {
            "debtorName": "Distribuciones Sur S.L.",
            "financialRating": "A — Excelente (cobertura activa)",
            "validationDate": "2026-01-15",
            "validationPending": "No — validación completada",
            "annualRevenue": "5800000",
            "debtRatio": "35",
            "blockingEffect": "Desbloquea COBERTURA_CREDITO (rating suficiente)",
        }},
        ia_instances=["non", "de-actio"],
        vectors=[vec_s("non")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=cred_id,
    ))

    repo.save(PhenomenonRecord(
        id=re_id, name="Riesgo Empresarial — Distribuciones Sur — Riesgo BAJO",
        type="RIESGO_EMPRESARIAL", status="ACTIVE", ess=ess_cred,
        ag={"clauses": [
            "El análisis de riesgo empresarial de Distribuciones Sur S.L. arroja indicadores favorables: ratio de endeudamiento del 35% (por debajo del umbral del 50%); historial de pagos sin incidencias en los últimos 36 meses; sector distribución estable con márgenes recurrentes. CONCLUSIÓN: riesgo BAJO. La cobertura puede activarse sin garantías adicionales.",
        ], "terms": {
            "riskCategory": "Bajo — sector estable, historial de pagos impecable",
            "sectorRisk": "Alimentación y distribución — riesgo bajo",
            "paymentHistory": "Sin incidencias",
            "riskNotes": "Ratio endeudamiento 35% (saludable). Sin retrasos en 36 meses. Cobertura activada sin necesidad de aval bancario complementario.",
        }},
        ia_instances=["ad-actio"],
        vectors=[vec_s("ad-actio")],
        opus=OpusState(status="ACTIVE", homologation="VALID"),
        parentId=cred_id,
    ))

    return {
        "seeded": True,
        "masters": {
            "seguro_vida":             vida_id,
            "seguro_rc":               rc_id,
            "seguro_danos":            danos_id,
            "seguro_credito_comercial":cred_id,
        },
        "sub_contracts": {
            "cobertura_vida":      cv_id,
            "exclusiones_vida":    ev_id,
            "prima_vida":          pv_id,
            "cobertura_rc":        crc_id,
            "limites_rc":          lrc_id,
            "franquicia_rc":       frc_id,
            "cobertura_danos":     cd_id,
            "peritacion":          per_id,
            "exclusiones_danos":   ed_id,
            "cobertura_credito":   ccred_id,
            "validacion_financiera":vf_id,
            "riesgo_empresarial":  re_id,
        },
        "demo_scenario": "Todo el ecosistema está homologado y válido. Para demostrar IF_exclusion: cambia el financialRating en VALIDACION_FINANCIERA a 'D — Riesgo alto (cobertura BLOQUEADA)'; el cascade marcará COBERTURA_CREDITO como NEEDS_REVIEW y la homologación fallará con guía específica.",
        "total_contracts": 16,
    }


class SiniestroRequest(BaseModel):
    contract_id: str
    resolution: str = ""  # "INDEMNIZACION_PAGADA" | "RECHAZO" | "" (just filing)


# Only these contract types can have a siniestro declared.
# Filing a "claim" on an EXCLUSIONES or PRIMA contract is semantically wrong;
# audit 2026-05-21 found that being accepted silently.
_SINIESTRO_ELIGIBLE_TYPES = {
    "COBERTURA_VIDA", "COBERTURA_RC", "COBERTURA_DANOS", "COBERTURA_CREDITO",
}

# Statuses from which siniestro can be declared. Filing a claim on a policy
# that is TERMINATED, already SINIESTRO_PENDIENTE, or already resolved
# (INDEMNIZACION_PAGADA / RECHAZO) is incoherent.
# When resolution is "INDEMNIZACION_PAGADA" or "RECHAZO", current status must
# be SINIESTRO_PENDIENTE (resolving an existing claim).
_SINIESTRO_FROM_ALLOWED = {"ACTIVE"}
_RESOLUTION_FROM_ALLOWED = {"SINIESTRO_PENDIENTE"}


@router.post("/seguros/siniestro")
def declare_siniestro(req: SiniestroRequest, db: Session = Depends(get_db)):
    """
    Transitions an insurance coverage contract through the siniestro lifecycle:
    ACTIVE → SINIESTRO_PENDIENTE → INDEMNIZACION_PAGADA | RECHAZO
    Also triggers cascade to the master policy (NEEDS_REVIEW).
    """
    from fastapi import HTTPException
    repo = PhenomenaRepository(db)
    try:
        contract = repo.get(req.contract_id)
    except KeyError:
        raise HTTPException(404, "Contract not found")

    # Type precondition: only coverage contracts can have claims.
    if contract.type not in _SINIESTRO_ELIGIBLE_TYPES:
        raise HTTPException(
            400,
            f"Siniestro can only be declared on COBERTURA_* contracts; "
            f"got type={contract.type}"
        )

    # Status precondition: starting a claim requires ACTIVE.
    # Resolving (INDEMNIZACION_PAGADA / RECHAZO) requires SINIESTRO_PENDIENTE.
    if req.resolution in ("INDEMNIZACION_PAGADA", "RECHAZO"):
        new_status = req.resolution
        if contract.status not in _RESOLUTION_FROM_ALLOWED:
            raise HTTPException(
                409,
                f"Cannot resolve siniestro from status={contract.status}; "
                f"requires SINIESTRO_PENDIENTE."
            )
    else:
        new_status = "SINIESTRO_PENDIENTE"
        if contract.status not in _SINIESTRO_FROM_ALLOWED:
            raise HTTPException(
                409,
                f"Cannot declare siniestro from status={contract.status}; "
                f"requires ACTIVE. (Currently in this state: cannot file new claim.)"
            )

    updated = contract.model_copy(update={
        "status": new_status,
        "opus": contract.opus.model_copy(update={"homologation": "PENDING"}),
    })
    repo.save(updated)

    # Cascade NEEDS_REVIEW to master
    if contract.parentId:
        try:
            master = repo.get(contract.parentId)
            repo.save(master.model_copy(update={
                "status": "NEEDS_REVIEW",
                "opus": master.opus.model_copy(update={"homologation": "PENDING"}),
            }))
        except Exception:
            pass

    return {
        "contract_id": req.contract_id,
        "new_status": new_status,
        "master_flagged": bool(contract.parentId),
    }


@router.post("/seguros/unblock-coverage")
def unblock_coverage(req: SiniestroRequest, db: Session = Depends(get_db)):
    """
    Unblocks a BLOCKED coverage contract by setting it to ACTIVE.
    Used when the validacion_financiera is resolved with a positive rating.
    """
    repo = PhenomenaRepository(db)
    try:
        contract = repo.get(req.contract_id)
    except KeyError:
        from fastapi import HTTPException
        raise HTTPException(404, "Contract not found")

    updated = contract.model_copy(update={
        "status": "ACTIVE",
        "opus": contract.opus.model_copy(update={"homologation": "PENDING"}),
    })
    repo.save(updated)

    if contract.parentId:
        try:
            master = repo.get(contract.parentId)
            repo.save(master.model_copy(update={
                "status": "NEEDS_REVIEW",
                "opus": master.opus.model_copy(update={"homologation": "PENDING"}),
            }))
        except Exception:
            pass

    return {"contract_id": req.contract_id, "new_status": "ACTIVE", "unblocked": True}


# ─── Step-by-step demo seeders ────────────────────────────────────────────────

class InitOnePolicyRequest(BaseModel):
    policy_type: str = "SEGURO_VIDA"  # SEGURO_VIDA | SEGURO_RC | SEGURO_DANOS | SEGURO_CREDITO_COMERCIAL
    party_a: str = "Comerciales del Levante S.L."
    clear_existing: bool = True  # if True, delete all existing contracts first


@router.post("/seguros/init-one-policy")
def init_one_policy(req: InitOnePolicyRequest, db: Session = Depends(get_db)):
    """
    Creates ONE insurance policy (master + 3 subs) with intentionally incomplete data
    so that validation errors are visible in the UI.  Supports step-by-step demos
    where the user fills in the data afterwards via /seguros/fill-policy-data.
    """
    from fastapi import HTTPException

    _VALID_TYPES = {
        "SEGURO_VIDA", "SEGURO_RC", "SEGURO_DANOS", "SEGURO_CREDITO_COMERCIAL",
    }
    if req.policy_type not in _VALID_TYPES:
        raise HTTPException(
            400,
            f"policy_type must be one of {sorted(_VALID_TYPES)}; got {req.policy_type!r}",
        )

    repo = PhenomenaRepository(db)

    if req.clear_existing:
        _delete_all_contracts(repo)

    vec_m = lambda: VectorEngine().generate(ia_type="ad-actio", is_sub=False)
    vec_s = lambda ia: VectorEngine().generate(ia_type=ia, is_sub=True)

    master_id = str(uuid.uuid4())
    sub1_id   = str(uuid.uuid4())
    sub2_id   = str(uuid.uuid4())
    sub3_id   = str(uuid.uuid4())

    opus_pending = OpusState(status="ACTIVE", homologation="PENDING")

    if req.policy_type == "SEGURO_VIDA":
        ess = EssFields(
            partyA=req.party_a,
            partyB="AXA Vida S.A.",
            jurisdiction="Valencia",
            effectiveDate="2024-01-01",
            expiryDate="2044-01-01",
        )
        master = PhenomenonRecord(
            id=master_id,
            name=f"Seguro de Vida — {req.party_a} / AXA Vida S.A.",
            type="MASTER", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "El asegurador AXA Vida S.A. garantiza el pago del capital asegurado a los beneficiarios "
                "designados en caso de fallecimiento o invalidez absoluta y permanente del asegurado. "
                "PENDIENTE: datos del asegurado, capital y prima por completar.",
            ], "terms": {
                "templateKey": "SEGURO_VIDA",
                "partyACIF": "B-46123456",
                "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
                "partyBCIF": "A-28123456",
                "partyBAddress": "Paseo de la Castellana 33, 28046 Madrid",
                "insuredName": "",
                "insuredAge": "",
                "capitalDeceso": "",
                "capitalInvalidez": "",
                "primaAnual": "",
                "beneficiaries": "",
                "coverageType": "",
                "medicalValidation": "",
            }},
            ia_instances=["ad-actio", "co-implication"],
            vectors=[vec_m()],
            opus=opus_pending,
            parentId=None,
        )
        repo.save(master)

        repo.save(PhenomenonRecord(
            id=sub1_id, name="Cobertura de Vida — PENDIENTE de datos",
            type="COBERTURA_VIDA", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Cobertura pendiente de configurar. Complete los datos del asegurado y el capital.",
            ], "terms": {
                "coverageCapital": "",
                "coverageActivationDate": "",
                "waitingPeriodMonths": "",
                "coverageStatus": "PENDIENTE — sin datos",
                "activationCondition": "",
                "beneficiaryConfirmed": "",
            }},
            ia_instances=["ad-actio"],
            vectors=[vec_s("ad-actio")],
            opus=opus_pending,
            parentId=master_id,
        ))

        repo.save(PhenomenonRecord(
            id=sub2_id, name="Exclusiones Vida — PENDIENTE revisión médica",
            type="EXCLUSIONES_VIDA", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Exclusiones pendientes de revisión médica. Se requiere declaración de salud completa.",
            ], "terms": {
                "preExistingConditions": "",
                "riskActivities": "",
                "exclusionPeriod": "",
                "blockingStatus": "Bloquea — pendiente revisión médica",
                "medicalExamRequired": "",
                "medicalExamDate": "",
            }},
            ia_instances=["non", "de-actio"],
            vectors=[vec_s("non")],
            opus=opus_pending,
            parentId=master_id,
        ))

        repo.save(PhenomenonRecord(
            id=sub3_id, name="Prima Vida — PENDIENTE de cálculo",
            type="PRIMA_VIDA", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Prima pendiente de cálculo actuarial. Complete los datos del asegurado.",
            ], "terms": {
                "annualPremium": "",
                "fractionalSurcharge": "",
                "paymentFrequency": "",
                "premiumReviewDate": "",
                "premiumIndexation": "",
            }},
            ia_instances=["ad-actio"],
            vectors=[vec_s("ad-actio")],
            opus=opus_pending,
            parentId=master_id,
        ))

        sub_ids = {
            "COBERTURA_VIDA": sub1_id,
            "EXCLUSIONES_VIDA": sub2_id,
            "PRIMA_VIDA": sub3_id,
        }
        errors_seeded = 8  # insuredName, insuredAge, capitalDeceso, capitalInvalidez, primaAnual,
                           # beneficiaries, coverageType, medicalValidation

    elif req.policy_type == "SEGURO_RC":
        ess = EssFields(
            partyA=req.party_a,
            partyB="Mapfre S.A.",
            jurisdiction="Valencia",
            effectiveDate="2024-03-01",
            expiryDate="2025-03-01",
        )
        master = PhenomenonRecord(
            id=master_id,
            name=f"Seguro RC Profesional — {req.party_a} / Mapfre S.A.",
            type="MASTER", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Mapfre S.A. asegura la responsabilidad civil profesional del tomador frente a daños "
                "causados a terceros derivados del ejercicio de su actividad. "
                "PENDIENTE: actividad asegurada, límites y prima por completar.",
            ], "terms": {
                "templateKey": "SEGURO_RC",
                "partyACIF": "B-46123456",
                "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
                "partyBCIF": "A-28765432",
                "partyBAddress": "Carretera de Pozuelo 52, 28220 Majadahonda",
                "activityInsured": "",
                "coverageLimit": "",
                "annualAggregateLimit": "",
                "franquicia": "",
                "primaAnual": "",
                "rcType": "",
            }},
            ia_instances=["ad-actio", "co-implication"],
            vectors=[vec_m()],
            opus=opus_pending,
            parentId=None,
        )
        repo.save(master)

        repo.save(PhenomenonRecord(
            id=sub1_id, name="Cobertura RC — PENDIENTE de datos",
            type="COBERTURA_RC", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Cobertura RC pendiente de configurar. Complete los límites y alcance.",
            ], "terms": {
                "coverageLimit": "",
                "annualAggregateLimit": "",
                "coverageScope": "",
                "retroactiveCoverage": "",
                "claimBasis": "",
                "coverageStatus": "PENDIENTE",
            }},
            ia_instances=["ad-actio"],
            vectors=[vec_s("ad-actio")],
            opus=opus_pending,
            parentId=master_id,
        ))

        repo.save(PhenomenonRecord(
            id=sub2_id, name="Límites RC — PENDIENTE de datos",
            type="LIMITES_RC", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Límites de indemnización pendientes de configurar.",
            ], "terms": {
                "perClaimLimit": "",
                "perPersonLimit": "",
                "propertyDamageLimit": "",
                "legalDefenseLimit": "",
            }},
            ia_instances=["ad-actio"],
            vectors=[vec_s("ad-actio")],
            opus=opus_pending,
            parentId=master_id,
        ))

        repo.save(PhenomenonRecord(
            id=sub3_id, name="Franquicia RC — PENDIENTE de datos",
            type="FRANQUICIA_RC", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Franquicia pendiente de configurar.",
            ], "terms": {
                "deductibleAmount": "",
                "deductibleType": "",
                "deductibleApplied": "",
            }},
            ia_instances=["non", "de-actio"],
            vectors=[vec_s("non")],
            opus=opus_pending,
            parentId=master_id,
        ))

        sub_ids = {
            "COBERTURA_RC": sub1_id,
            "LIMITES_RC": sub2_id,
            "FRANQUICIA_RC": sub3_id,
        }
        errors_seeded = 8  # activityInsured, coverageLimit, annualAggregateLimit, franquicia,
                           # primaAnual, rcType, perClaimLimit, deductibleAmount

    elif req.policy_type == "SEGURO_DANOS":
        ess = EssFields(
            partyA=req.party_a,
            partyB="Allianz S.A.",
            jurisdiction="Valencia",
            effectiveDate="2024-01-15",
            expiryDate="2025-01-15",
        )
        master = PhenomenonRecord(
            id=master_id,
            name=f"Seguro Daños — {req.party_a} / Allianz S.A.",
            type="MASTER", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Allianz S.A. asegura los daños materiales que sufra la propiedad del tomador. "
                "PENDIENTE: descripción del inmueble, valor, riesgos cubiertos y prima por completar.",
            ], "terms": {
                "templateKey": "SEGURO_DANOS",
                "partyACIF": "B-46123456",
                "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
                "partyBCIF": "A-28765432",
                "partyBAddress": "Gran Vía 24, 28001 Madrid",
                "propertyDescription": "",
                "propertyValue": "",
                "coverageRisks": "",
                "primaAnual": "",
                "deductible": "",
                "peritacionMethod": "",
            }},
            ia_instances=["ad-actio", "co-implication"],
            vectors=[vec_m()],
            opus=opus_pending,
            parentId=None,
        )
        repo.save(master)

        repo.save(PhenomenonRecord(
            id=sub1_id, name="Cobertura Daños — PENDIENTE de datos",
            type="COBERTURA_DANOS", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Cobertura de daños pendiente de configurar. Complete el valor asegurado y riesgos.",
            ], "terms": {
                "insuredValue": "",
                "coverageRisks": "",
                "coverageStatus": "PENDIENTE",
                "infravaluation": "",
                "valueBasis": "",
            }},
            ia_instances=["ad-actio"],
            vectors=[vec_s("ad-actio")],
            opus=opus_pending,
            parentId=master_id,
        ))

        repo.save(PhenomenonRecord(
            id=sub2_id, name="Peritación — Sin siniestro activo",
            type="PERITACION", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "No existe siniestro activo. El proceso de peritación se activará cuando se produzca "
                "un siniestro cubierto.",
            ], "terms": {
                "peritacionStatus": "Sin siniestro activo",
                "aseguradoraPerito": "Pendiente de designación (5 días hábiles desde siniestro)",
                "aseguradoPerito": "",
                "damageCause": "No aplica",
                "estimatedDamage": "0",
                "agreedIndemnity": "0",
                "peritacionDeadline": "2026-12-31",
            }},
            ia_instances=["ad-actio"],
            vectors=[vec_s("ad-actio")],
            opus=opus_pending,
            parentId=master_id,
        ))

        repo.save(PhenomenonRecord(
            id=sub3_id, name="Exclusiones Daños — PENDIENTE de datos",
            type="EXCLUSIONES_DANOS", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Exclusiones pendientes de configurar.",
            ], "terms": {
                "excludedRisks": "",
                "excludedProperty": "",
                "maintenanceExclusion": "",
                "blockingExclusion": "",
            }},
            ia_instances=["non"],
            vectors=[vec_s("non")],
            opus=opus_pending,
            parentId=master_id,
        ))

        sub_ids = {
            "COBERTURA_DANOS": sub1_id,
            "PERITACION": sub2_id,
            "EXCLUSIONES_DANOS": sub3_id,
        }
        errors_seeded = 8  # propertyDescription, propertyValue, coverageRisks, primaAnual,
                           # deductible, peritacionMethod, insuredValue, excludedRisks

    else:  # SEGURO_CREDITO_COMERCIAL
        ess = EssFields(
            partyA=req.party_a,
            partyB="Mapfre Crédito y Caución S.A.",
            jurisdiction="Valencia",
            effectiveDate="2024-02-01",
            expiryDate="2025-02-01",
        )
        master = PhenomenonRecord(
            id=master_id,
            name=f"Seguro Crédito Comercial — {req.party_a} / Mapfre Crédito",
            type="MASTER", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Mapfre Crédito y Caución S.A. asegura al tomador frente al impago de su deudor principal. "
                "PENDIENTE: nombre del deudor, límite de crédito, porcentaje de indemnización y validación "
                "financiera por completar.",
            ], "terms": {
                "templateKey": "SEGURO_CREDITO_COMERCIAL",
                "partyACIF": "B-46123456",
                "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
                "partyBCIF": "A-28765000",
                "partyBAddress": "Carretera de Pozuelo 52, 28220 Majadahonda",
                "debtorName": "",
                "creditLimit": "",
                "indemnityPct": "",
                "primaAnual": "",
                "waitingPeriod": "",
                "financialValidation": "",
            }},
            ia_instances=["ad-actio", "co-implication"],
            vectors=[vec_m()],
            opus=opus_pending,
            parentId=None,
        )
        repo.save(master)

        repo.save(PhenomenonRecord(
            id=sub1_id, name="Cobertura Crédito — PENDIENTE de validación financiera",
            type="COBERTURA_CREDITO", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Cobertura de crédito pendiente de validación financiera del deudor.",
            ], "terms": {
                "coveredDebtors": "",
                "totalCoverageLimit": "",
                "indemnityPercentage": "",
                "coverageStatus": "PENDIENTE — sin validación",
                "blockingReason": "Sin validación financiera",
                "unblockCondition": "",
            }},
            ia_instances=["ad-actio"],
            vectors=[vec_s("ad-actio")],
            opus=opus_pending,
            parentId=master_id,
        ))

        repo.save(PhenomenonRecord(
            id=sub2_id, name="Validación Financiera — PENDIENTE",
            type="VALIDACION_FINANCIERA", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Validación financiera del deudor pendiente de completar.",
            ], "terms": {
                "debtorName": "",
                "financialRating": "Pendiente — sin calificación",
                "validationDate": "",
                "validationPending": "Sí — validación pendiente",
                "annualRevenue": "",
                "debtRatio": "",
                "blockingEffect": "Bloquea COBERTURA_CREDITO hasta completar validación",
            }},
            ia_instances=["non", "de-actio"],
            vectors=[vec_s("non")],
            opus=opus_pending,
            parentId=master_id,
        ))

        repo.save(PhenomenonRecord(
            id=sub3_id, name="Riesgo Empresarial — PENDIENTE de evaluación",
            type="RIESGO_EMPRESARIAL", status="ACTIVE", ess=ess,
            ag={"clauses": [
                "Evaluación de riesgo empresarial del deudor pendiente de completar.",
            ], "terms": {
                "riskCategory": "Pendiente evaluación",
                "sectorRisk": "",
                "paymentHistory": "",
                "riskNotes": "",
            }},
            ia_instances=["ad-actio"],
            vectors=[vec_s("ad-actio")],
            opus=opus_pending,
            parentId=master_id,
        ))

        sub_ids = {
            "COBERTURA_CREDITO": sub1_id,
            "VALIDACION_FINANCIERA": sub2_id,
            "RIESGO_EMPRESARIAL": sub3_id,
        }
        errors_seeded = 8  # debtorName, creditLimit, indemnityPct, primaAnual, waitingPeriod,
                           # financialValidation, coveredDebtors, totalCoverageLimit

    return {
        "master_id": master_id,
        "sub_ids": sub_ids,
        "policy_type": req.policy_type,
        "party_a": req.party_a,
        "errors_seeded": errors_seeded,
        "cleared_existing": req.clear_existing,
    }


class FillPolicyRequest(BaseModel):
    master_id: str


@router.post("/seguros/fill-policy-data")
def fill_policy_data(req: FillPolicyRequest, db: Session = Depends(get_db)):
    """
    Fills in all intentionally-blank fields for a policy previously created by
    /seguros/init-one-policy.  Reads the master's templateKey to determine which
    complete data set to apply, then patches master + all 3 sub-contracts.
    """
    from fastapi import HTTPException

    repo = PhenomenaRepository(db)

    try:
        master = repo.get(req.master_id)
    except KeyError:
        raise HTTPException(404, f"Master contract {req.master_id!r} not found")

    template_key: str = master.ag.get("terms", {}).get("templateKey", "")

    _VALID_KEYS = {
        "SEGURO_VIDA", "SEGURO_RC", "SEGURO_DANOS", "SEGURO_CREDITO_COMERCIAL",
    }
    if template_key not in _VALID_KEYS:
        raise HTTPException(
            400,
            f"Master templateKey {template_key!r} is not a recognised seguros type. "
            f"Expected one of {sorted(_VALID_KEYS)}.",
        )

    opus_valid = OpusState(status="ACTIVE", homologation="VALID")
    children   = repo.get_children(req.master_id)

    # Index children by type for easy lookup.
    child_by_type: dict[str, PhenomenonRecord] = {c.type: c for c in children}

    updated_count = 0

    if template_key == "SEGURO_VIDA":
        new_ess = EssFields(
            partyA=master.ess.partyA,
            partyB="AXA Vida S.A.",
            jurisdiction="Valencia",
            effectiveDate="2024-01-01",
            expiryDate="2044-01-01",
        )
        new_master_terms = {
            "templateKey": "SEGURO_VIDA",
            "partyACIF": "B-46123456",
            "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
            "partyBCIF": "A-28123456",
            "partyBAddress": "Paseo de la Castellana 33, 28046 Madrid",
            "insuredName": "D. Javier Martínez Pérez (Consejero Delegado)",
            "insuredAge": "48",
            "capitalDeceso": "300000",
            "capitalInvalidez": "300000",
            "primaAnual": "1850",
            "beneficiaries": "La empresa tomadora y herederos del asegurado",
            "coverageType": "Fallecimiento e invalidez absoluta permanente",
            "medicalValidation": "Aprobada sin exclusiones",
        }
        new_master_clauses = [
            "El asegurador AXA Vida S.A. garantiza el pago del capital asegurado de TRESCIENTOS MIL EUROS "
            "(300.000 €) a los beneficiarios designados en caso de fallecimiento o invalidez absoluta y "
            "permanente del asegurado D. Javier Martínez Pérez (Consejero Delegado), ocurridos durante la "
            "vigencia de la póliza. Tomador: " + master.ess.partyA + ".",
            "La cobertura queda condicionada a la aceptación de la declaración de salud por parte del "
            "asegurador y al pago puntual de la prima anual. Cualquier ocultación o inexactitud dolosa en "
            "la declaración de salud faculta al asegurador a reducir la indemnización proporcionalmente "
            "(art. 10 LCS).",
            "Se designan como beneficiarios: la propia empresa " + master.ess.partyA + " como tomador, "
            "con subrogación a los herederos del asegurado en caso de disolución.",
        ]
        repo.save(master.model_copy(update={
            "name": f"Seguro de Vida — {master.ess.partyA} / AXA Vida S.A.",
            "ess": new_ess,
            "ag": {**master.ag, "clauses": new_master_clauses, "terms": new_master_terms},
            "opus": opus_valid,
        }))
        updated_count += 1

        sub_data: dict[str, dict] = {
            "COBERTURA_VIDA": {
                "name": "Cobertura de Vida — Capital 300.000 € — Activa",
                "clauses": [
                    "La cobertura de vida está ACTIVA. Declaración de salud aceptada sin exclusiones. "
                    "Capital asegurado: 300.000 €. Condición IF cumplida: prima en vigor y declaración "
                    "de salud aceptada.",
                ],
                "terms": {
                    "coverageCapital": "300000",
                    "coverageActivationDate": "2024-01-01",
                    "waitingPeriodMonths": "0",
                    "coverageStatus": "ACTIVA — Sin exclusiones activas",
                    "activationCondition": "Todas las condiciones cumplidas",
                    "beneficiaryConfirmed": "Sí",
                },
            },
            "EXCLUSIONES_VIDA": {
                "name": "Exclusiones Vida — Sin exclusiones activas",
                "clauses": [
                    "No existen exclusiones médicas activas. La declaración de salud fue aceptada "
                    "íntegramente. El asegurado no practica actividades de riesgo excluidas.",
                    "Exclusiones generales de la póliza: suicidio durante los primeros 12 meses; "
                    "muerte causada por participación activa en conflictos armados; actos dolosos "
                    "del beneficiario.",
                ],
                "terms": {
                    "preExistingConditions": "Ninguna — declaración de salud aceptada sin exclusiones",
                    "riskActivities": "Ninguna — no practica deportes de alto riesgo",
                    "exclusionPeriod": "0",
                    "blockingStatus": "No bloquea la cobertura principal",
                    "medicalExamRequired": "No requerido (suma < 300.000 €)",
                    "medicalExamDate": "2023-12-15",
                },
            },
            "PRIMA_VIDA": {
                "name": "Prima Vida — 1.850 €/año — Pago anual",
                "clauses": [
                    "La prima anual neta es de MIL OCHOCIENTOS CINCUENTA EUROS (1.850 €/año), "
                    "pagadera anualmente por domiciliación bancaria. El impago de la prima no produce "
                    "la resolución automática del contrato sino la suspensión de la cobertura previo "
                    "requerimiento fehaciente (art. 15 LCS).",
                ],
                "terms": {
                    "annualPremium": "1850",
                    "fractionalSurcharge": "0",
                    "paymentFrequency": "Anual",
                    "premiumReviewDate": "2025-01-01",
                    "premiumIndexation": "IPC anual",
                },
            },
        }

    elif template_key == "SEGURO_RC":
        new_ess = EssFields(
            partyA=master.ess.partyA,
            partyB="Mapfre S.A.",
            jurisdiction="Valencia",
            effectiveDate="2024-03-01",
            expiryDate="2025-03-01",
        )
        new_master_terms = {
            "templateKey": "SEGURO_RC",
            "partyACIF": "B-46123456",
            "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
            "partyBCIF": "A-28765432",
            "partyBAddress": "Carretera de Pozuelo 52, 28220 Majadahonda",
            "activityInsured": "Distribución comercial e importación de productos industriales",
            "coverageLimit": "600000",
            "annualAggregateLimit": "1200000",
            "franquicia": "3000",
            "primaAnual": "4200",
            "rcType": "RC Profesional (errores y omisiones)",
        }
        new_master_clauses = [
            "Mapfre S.A. asegura la responsabilidad civil profesional de " + master.ess.partyA +
            " frente a daños causados a terceros derivados del ejercicio de su actividad de "
            "distribución comercial e importación, hasta el límite de SEISCIENTOS MIL EUROS "
            "(600.000 €) por siniestro y UN MILLÓN DOSCIENTOS MIL EUROS (1.200.000 €) en agregado anual.",
            "La póliza tiene base claims made: cubre las reclamaciones presentadas durante la vigencia "
            "de la póliza por hechos acaecidos en dicha vigencia o durante el período de retroactividad "
            "acordado. Franquicia por siniestro: TRES MIL EUROS (3.000 €) a cargo del asegurado.",
        ]
        repo.save(master.model_copy(update={
            "name": f"Seguro RC Profesional — {master.ess.partyA} / Mapfre S.A.",
            "ess": new_ess,
            "ag": {**master.ag, "clauses": new_master_clauses, "terms": new_master_terms},
            "opus": opus_valid,
        }))
        updated_count += 1

        sub_data = {
            "COBERTURA_RC": {
                "name": "Cobertura RC — 600.000 € por siniestro — Activa",
                "clauses": [
                    "Cobertura RC profesional ACTIVA. Cubre daños personales, materiales y perjuicios "
                    "económicos causados a terceros en el ejercicio de la actividad asegurada. "
                    "Base claims made. Límite: 600.000 €/siniestro.",
                ],
                "terms": {
                    "coverageLimit": "600000",
                    "annualAggregateLimit": "1200000",
                    "coverageScope": "Daños personales, materiales y perjuicios económicos",
                    "retroactiveCoverage": "Desde fecha de contratación",
                    "claimBasis": "Claims made (reclamación durante vigencia)",
                    "coverageStatus": "ACTIVA",
                },
            },
            "LIMITES_RC": {
                "name": "Límites RC — 600.000 €/siniestro · 1.200.000 €/año",
                "clauses": [
                    "Límites de indemnización: SEISCIENTOS MIL EUROS (600.000 €) por siniestro "
                    "individual. UN MILLÓN DOSCIENTOS MIL EUROS (1.200.000 €) como agregado anual. "
                    "Sublímite defensa jurídica: TREINTA MIL EUROS (30.000 €) por expediente.",
                ],
                "terms": {
                    "perClaimLimit": "600000",
                    "perPersonLimit": "300000",
                    "propertyDamageLimit": "200000",
                    "legalDefenseLimit": "30000",
                },
            },
            "FRANQUICIA_RC": {
                "name": "Franquicia RC — 3.000 € por siniestro (IF_posición)",
                "clauses": [
                    "Franquicia absoluta de TRES MIL EUROS (3.000 €) por siniestro, a cargo del "
                    "asegurado en todos los casos.",
                ],
                "terms": {
                    "deductibleAmount": "3000",
                    "deductibleType": "Absoluta (siempre a cargo del asegurado)",
                    "deductibleApplied": "No aplica (sin siniestros)",
                },
            },
        }

    elif template_key == "SEGURO_DANOS":
        new_ess = EssFields(
            partyA=master.ess.partyA,
            partyB="Allianz S.A.",
            jurisdiction="Valencia",
            effectiveDate="2024-01-15",
            expiryDate="2025-01-15",
        )
        new_master_terms = {
            "templateKey": "SEGURO_DANOS",
            "partyACIF": "B-46123456",
            "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
            "partyBCIF": "A-28765432",
            "partyBAddress": "Gran Vía 24, 28001 Madrid",
            "propertyDescription": (
                "Nave industrial de 1.500 m², estructura metálica, cubierta de hormigón prefabricado, "
                "instalación eléctrica trifásica. Polígono Industrial Norte, Nave 12, 46015 Valencia."
            ),
            "propertyValue": "750000",
            "coverageRisks": "Todo riesgo (all-risk)",
            "primaAnual": "3150",
            "deductible": "10",
            "peritacionMethod": "Perito de parte + árbitro (art. 38 LCS)",
        }
        new_master_clauses = [
            "Allianz S.A. asegura los daños materiales que sufra la nave industrial sita en "
            "Polígono Industrial Norte, Nave 12, 46015 Valencia, valorada en SETECIENTOS CINCUENTA MIL "
            "EUROS (750.000 €) en valor de nuevo, frente a los riesgos de incendio, explosión, daños "
            "por agua, robo y daños eléctricos.",
            "En caso de siniestro, el valor de los daños se determinará mediante peritación conforme "
            "al art. 38 LCS. Si existe discrepancia entre los peritos, se nombrará un árbitro.",
            "Franquicia del DIEZ POR CIENTO (10%) sobre el importe de cada siniestro, con un mínimo "
            "de 1.500 €.",
        ]
        repo.save(master.model_copy(update={
            "name": f"Seguro Daños — {master.ess.partyA} / Allianz S.A.",
            "ess": new_ess,
            "ag": {**master.ag, "clauses": new_master_clauses, "terms": new_master_terms},
            "opus": opus_valid,
        }))
        updated_count += 1

        sub_data = {
            "COBERTURA_DANOS": {
                "name": "Cobertura Daños — Todo Riesgo — 750.000 € en nuevo",
                "clauses": [
                    "Cobertura todo riesgo sobre la nave industrial. Valor en nuevo: 750.000 €. "
                    "Riesgos cubiertos: incendio, explosión, daños por agua, robo, daños eléctricos "
                    "y avería de maquinaria. Franquicia: 10% por siniestro (mín. 1.500 €).",
                ],
                "terms": {
                    "insuredValue": "750000",
                    "coverageRisks": "Incendio, explosión, daños por agua, robo, daños eléctricos",
                    "coverageStatus": "ACTIVA",
                    "infravaluation": "Sin infraseguro declarado",
                    "valueBasis": "Valor en nuevo",
                },
            },
            "PERITACION": {
                "name": "Peritación — Sin siniestro activo",
                "clauses": [
                    "No existe siniestro activo en la fecha de emisión. El proceso de peritación se "
                    "activará en el momento en que se produzca un siniestro cubierto. El perito de la "
                    "aseguradora será designado en un plazo máximo de 5 días hábiles.",
                ],
                "terms": {
                    "peritacionStatus": "Sin siniestro activo",
                    "aseguradoraPerito": "Pendiente de designación (5 días hábiles desde siniestro)",
                    "aseguradoPerito": "No aplica — sin contradicción activa",
                    "damageCause": "No aplica — sin siniestro activo",
                    "estimatedDamage": "0",
                    "agreedIndemnity": "0",
                    "peritacionDeadline": "2026-12-31",
                },
            },
            "EXCLUSIONES_DANOS": {
                "name": "Exclusiones Daños — Desgaste normal, guerra, dolo",
                "clauses": [
                    "Quedan excluidos de la cobertura: el desgaste normal y progresivo de los bienes; "
                    "los daños causados dolosamente por el asegurado; los daños causados por guerra, "
                    "terrorismo o convulsión social; los daños por falta de mantenimiento acreditada.",
                ],
                "terms": {
                    "excludedRisks": "Desgaste normal, dolo del asegurado, guerra, terrorismo, daños en tránsito",
                    "excludedProperty": "Bienes en tránsito, efectivo, joyas no declaradas",
                    "maintenanceExclusion": "Aplica (daños por no mantenimiento excluidos)",
                    "blockingExclusion": "No — cobertura activa",
                },
            },
        }

    else:  # SEGURO_CREDITO_COMERCIAL
        new_ess = EssFields(
            partyA=master.ess.partyA,
            partyB="Mapfre Crédito y Caución S.A.",
            jurisdiction="Valencia",
            effectiveDate="2024-02-01",
            expiryDate="2025-02-01",
        )
        new_master_terms = {
            "templateKey": "SEGURO_CREDITO_COMERCIAL",
            "partyACIF": "B-46123456",
            "partyAAddress": "Polígono Industrial Norte, Nave 12, 46015 Valencia",
            "partyBCIF": "A-28765000",
            "partyBAddress": "Carretera de Pozuelo 52, 28220 Majadahonda",
            "debtorName": "Distribuciones Sur S.L.",
            "creditLimit": "500000",
            "indemnityPct": "85",
            "primaAnual": "8750",
            "waitingPeriod": "6",
            "financialValidation": "Completada — rating A (cobertura activa)",
        }
        new_master_clauses = [
            "Mapfre Crédito y Caución S.A. asegura a " + master.ess.partyA +
            " frente al impago de su deudor principal Distribuciones Sur S.L., hasta el límite de "
            "QUINIENTOS MIL EUROS (500.000 €), con un porcentaje de indemnización del OCHENTA Y CINCO "
            "POR CIENTO (85%) sobre las facturas impagas transcurrido el período de espera.",
            "Cobertura ACTIVA: la validación financiera del deudor Distribuciones Sur S.L. concluyó "
            "con rating A. La cobertura está plenamente operativa.",
        ]
        repo.save(master.model_copy(update={
            "name": f"Seguro Crédito Comercial — {master.ess.partyA} / Mapfre Crédito",
            "ess": new_ess,
            "ag": {**master.ag, "clauses": new_master_clauses, "terms": new_master_terms},
            "opus": opus_valid,
        }))
        updated_count += 1

        sub_data = {
            "COBERTURA_CREDITO": {
                "name": "Cobertura Crédito — Distribuciones Sur — Activa",
                "clauses": [
                    "Cobertura de crédito comercial sobre el deudor principal Distribuciones Sur S.L. "
                    "activada tras superar la validación financiera con rating A. Límite total de "
                    "cobertura: 500.000 €. Indemnización al 85% del crédito impagado.",
                    "PHENOMENON: la cobertura está activa porque el operador 'non' (IF_exclusion, "
                    "Bloque II §4) no se ha disparado — el rating A despeja la posición de bloqueo.",
                ],
                "terms": {
                    "coveredDebtors": "Distribuciones Sur S.L. — límite 500.000 € — rating A",
                    "totalCoverageLimit": "500000",
                    "indemnityPercentage": "85",
                    "coverageStatus": "ACTIVA — validación financiera superada",
                    "blockingReason": "Sin bloqueo activo — rating A vigente.",
                    "unblockCondition": "Validación financiera con rating A o B",
                },
            },
            "VALIDACION_FINANCIERA": {
                "name": "Validación Financiera — Distribuciones Sur — Rating A",
                "clauses": [
                    "El departamento de riesgo de Mapfre Crédito ha completado la calificación "
                    "crediticia de Distribuciones Sur S.L. Calificación final: A (excelente). "
                    "La cobertura de crédito queda HABILITADA sin restricciones adicionales.",
                ],
                "terms": {
                    "debtorName": "Distribuciones Sur S.L.",
                    "financialRating": "A — Excelente (cobertura activa)",
                    "validationDate": "2026-01-15",
                    "validationPending": "No — validación completada",
                    "annualRevenue": "5800000",
                    "debtRatio": "35",
                    "blockingEffect": "Desbloquea COBERTURA_CREDITO (rating suficiente)",
                },
            },
            "RIESGO_EMPRESARIAL": {
                "name": "Riesgo Empresarial — Distribuciones Sur — Riesgo BAJO",
                "clauses": [
                    "El análisis de riesgo empresarial de Distribuciones Sur S.L. arroja indicadores "
                    "favorables: ratio de endeudamiento del 35%; historial de pagos sin incidencias en "
                    "los últimos 36 meses. CONCLUSIÓN: riesgo BAJO.",
                ],
                "terms": {
                    "riskCategory": "Bajo — sector estable, historial de pagos impecable",
                    "sectorRisk": "Alimentación y distribución — riesgo bajo",
                    "paymentHistory": "Sin incidencias",
                    "riskNotes": "Ratio endeudamiento 35% (saludable). Sin retrasos en 36 meses.",
                },
            },
        }

    # Apply sub-contract patches.
    for sub_type, data in sub_data.items():
        child = child_by_type.get(sub_type)
        if child is None:
            continue  # sub not present — skip gracefully
        repo.save(child.model_copy(update={
            "name": data["name"],
            "ess": new_ess,
            "ag": {**child.ag, "clauses": data["clauses"], "terms": data["terms"]},
            "opus": opus_valid,
        }))
        updated_count += 1

    return {
        "success": True,
        "policy_type": template_key,
        "master_id": req.master_id,
        "updated_count": updated_count,
        "party_a": master.ess.partyA,
    }


# ─── Cross-policy cascade ─────────────────────────────────────────────────────

class CrossPolicyCascadeRequest(BaseModel):
    source_contract_id: str   # ID of the sub-contract or master that changed
    field: str                # field that changed (e.g. "riskCategory", "blockingStatus", "partyA")
    new_value: str            # new value (informational; state change already applied by caller)


_INSURANCE_MASTER_TYPES = {
    "SEGURO_VIDA", "SEGURO_RC", "SEGURO_DANOS", "SEGURO_CREDITO_COMERCIAL",
}


@router.post("/seguros/cross-policy-cascade")
def cross_policy_cascade(req: CrossPolicyCascadeRequest, db: Session = Depends(get_db)):
    """
    Propagates a change ACROSS insurance policy trees that share the same tomador.

    Two scenarios handled:
      1. field == "partyA" and source is a master → all sibling insurance masters NEEDS_REVIEW
      2. source is a sub-contract in CROSS_POLICY_CASCADE_MAP → target subs in sibling policies
    """
    from phenomenon_engine.cascade_engine import CrossPolicyCascadeEngine
    repo = PhenomenaRepository(db)

    try:
        source = repo.get(req.source_contract_id)
    except KeyError:
        from fastapi import HTTPException
        raise HTTPException(404, "Source contract not found")

    engine = CrossPolicyCascadeEngine()

    source_template_key = (source.ag or {}).get("terms", {}).get("templateKey", "")
    if req.field == "partyA" and source_template_key in _INSURANCE_MASTER_TYPES:
        result = engine.run_partyA_change(
            source_master_id=req.source_contract_id,
            new_partyA=req.new_value,
            repo=repo,
        )
    else:
        result = engine.run_sub_change(
            source_id=req.source_contract_id,
            field=req.field,
            new_value=req.new_value,
            repo=repo,
        )

    return {
        "source_id": result.source_id,
        "source_type": result.source_type,
        "field": result.field,
        "affected_count": len(result.affected_ids),
        "affected_ids": result.affected_ids,
        "trace": result.trace,
        "cross_policy": True,
    }


@router.post("/seguros/clear")
def clear_seguros(db: Session = Depends(get_db)):
    """Deletes all contracts and returns to clean state (triggers SelectionScreen on frontend)."""
    repo = PhenomenaRepository(db)
    _delete_all_contracts(repo)
    return {"cleared": True, "message": "All contracts deleted. Frontend will show SelectionScreen."}
