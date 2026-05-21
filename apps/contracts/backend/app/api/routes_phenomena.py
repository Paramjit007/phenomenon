import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..repositories.phenomena_repo import PhenomenaRepository
from phenomenon_engine import PhenomenonRecord, EssFields, Vector, OpusState, VectorEngine, HomologationEngine

router = APIRouter()


# ─── Required specific fields per sub-contract type (stored in ag.terms) ─────
# These are checked IN ADDITION to the base ESS + clauses + IA checks.
# Regenerated 2026-05-21 to enforce EVERY UI field declared in constants.js
# (closes the third user-reported 'empty fields pass homologation' bug class).
# ─── _SUB_REQUIRED (MERGED, all UI fields enforced) ────────────────────────
_SUB_REQUIRED: dict[str, list[tuple[str, str]]] = {
    "AUDIT_REPORT": [
        ("auditScope", "Alcance de la Auditoría"),
        ("auditOpinion", "Opinión del Auditor"),
        ("auditReviewer", "Auditor Responsable"),
        ("auditDate", "Fecha del Informe"),
    ],
    "BOARD_RESOLUTION": [
        ("meetingDate", "Fecha de la Junta"),
        ("resolutionOutcome", "Resultado de la Resolución"),
        ("boardMembers", "Miembros del Consejo"),
        ("resolutionNotes", "Notas de la Resolución"),
    ],
    "CARGAS_URBANISTICAS": [
        ("chargesAllocation", "Responsable de las cargas urbanísticas"),
        ("itpRate", "Tipo ITP/AJD aplicable (%)"),
        ("iivtnu", "Plusvalía municipal (IIVTNU)"),
        ("executionSystem", "Sistema de Actuación Urbanística"),
        ("itpResponsibility", "ITP a cargo de"),
        ("notaryFees", "Gastos Notariales y Registrales"),
        ("urbanizationCost", "Coste Estimado de Urbanización (€/m²)"),
        ("urbanizationPlan", "Plan de Urbanización Vigente"),
    ],
    "CESION_CREDITO": [
        ("cedente", "Cedente del crédito"),
        ("cesionario", "Cesionario (quien recibe el crédito)"),
        ("monthlyRent", "Renta mensual cedida (€)"),
        ("annualRent", "Renta anual total cedida (€)"),
        ("cedidoIVA", "Devoluciones IVA cedidas"),
        ("cedidoRentas", "Descripción de rentas cedidas"),
        ("deudorCedido", "Deudor cedido (quien paga las rentas)"),
        ("garantiaCesion", "Garantía de la cesión"),
        ("ivaDevolution", "Importe estimado devolución IVA (€)"),
        ("notificationMethod", "Método de notificación al deudor"),
        ("oponibilidadCesion", "Oponibilidad de la cesión (Art. 1527 CC)"),
    ],
    "COBERTURA_CREDITO": [
        ("totalCoverageLimit", "Límite total de cobertura (€)"),
        ("unblockCondition", "Condición de desbloqueo IF_exclusion"),
        ("blockingReason", "Motivo de Bloqueo IF_exclusion"),
        ("coverageStatus", "Estado de la Cobertura"),
        ("coveredDebtors", "Deudores Cubiertos"),
        ("indemnityPercentage", "Porcentaje de Indemnización (%)"),
    ],
    "COBERTURA_DANOS": [
        ("insuredValue", "Valor asegurado en nuevo (€)"),
        ("coverageRisks", "Riesgos cubiertos"),
        ("coverageStatus", "Estado de la Cobertura Daños"),
        ("infravaluation", "Infraseguro (si valor real > valor asegurado)"),
        ("valueBasis", "Base de Valoración"),
    ],
    "COBERTURA_RC": [
        ("coverageLimit", "Límite máximo por siniestro (€)"),
        ("claimBasis", "Base de reclamación"),
        ("annualAggregateLimit", "Límite Agregado Anual (€)"),
        ("coverageScope", "Ámbito de la Cobertura"),
        ("coverageStatus", "Estado de la Cobertura RC"),
        ("retroactiveCoverage", "Cobertura Retroactiva"),
    ],
    "COBERTURA_VIDA": [
        ("coverageCapital", "Capital asegurado activo (€)"),
        ("activationCondition", "Condición IF para activación"),
        ("beneficiaryConfirmed", "Beneficiarios confirmados en escritura"),
        ("coverageActivationDate", "Fecha de Activación de la Cobertura"),
        ("coverageStatus", "Estado de la Cobertura"),
        ("waitingPeriodMonths", "Período de Carencia (meses)"),
    ],
    "COMPLIANCE_CHECK": [
        ("complianceCheckStatus", "Estado de la Verificación"),
        ("complianceOfficer", "Responsable de Compliance"),
        ("complianceScope", "Alcance de la Verificación"),
        ("reviewDeadline", "Plazo de Verificación"),
    ],
    "CONDICION_SOLAR": [
        ("solarDefinition", "Definición de «solar» según PGOU"),
        ("verificationMethod", "Forma de acreditación de la condición"),
        ("maxWaitPeriod", "Plazo máximo de espera (años)"),
        ("ifConditionFails", "Consecuencias si no se obtiene solar"),
        ("extensionRight", "Prórroga en caso de retraso ajeno a las partes"),
        ("retentionClause", "Cláusula Penal por Resolución"),
    ],
    "DPA": [
        ("processorRole", "Rol del encargado del tratamiento"),
        ("dataCategories", "Categorías de datos personales"),
        ("legalBasis", "Base jurídica del tratamiento (Art. RGPD)"),
        ("retentionPeriod", "Período de conservación de datos"),
        ("breachNotifH", "Plazo Notificación Brecha (horas)"),
        ("dataSubjects", "Categorías de Interesados"),
        ("internationalTransfer", "Transferencia Internacional"),
        ("processingPurpose", "Finalidad del Tratamiento"),
        ("securityMeasures", "Medidas de Seguridad Técnicas"),
        ("subprocessors", "Subencargados Autorizados"),
    ],
    "EXCLUSIONES_DANOS": [
        ("excludedRisks", "Riesgos excluidos"),
        ("blockingExclusion", "¿Alguna exclusión bloquea la cobertura?"),
        ("excludedProperty", "Bienes Excluidos"),
        ("maintenanceExclusion", "Exclusión por Falta de Mantenimiento"),
    ],
    "EXCLUSIONES_VIDA": [
        ("blockingStatus", "Efecto IF_exclusion sobre cobertura"),
        ("exclusionPeriod", "Período de Exclusión (meses)"),
        ("medicalExamDate", "Fecha del Reconocimiento Médico"),
        ("medicalExamRequired", "Reconocimiento Médico Previo"),
        ("preExistingConditions", "Enfermedades Preexistentes Excluidas"),
        ("riskActivities", "Actividades de Riesgo Excluidas"),
    ],
    "FINANCIACION": [
        ("capitalAmount", "Capital del servicio financiero (€)"),
        ("euriborRate", "Tipo EURIBOR de referencia (%)"),
        ("spread", "Diferencial sobre EURIBOR (%)"),
        ("termYears", "Plazo de devolución (años)"),
        ("amortizationMethod", "Sistema de Amortización"),
        ("circumcontractType", "Naturaleza legal (PHENOMENON CA2)"),
        ("earlyPayment", "Amortización Anticipada"),
        ("iban", "IBAN Cuenta de Abono de Cuotas"),
        ("interestReview", "Revisión del Tipo de Interés"),
        ("legalBasis", "Base legal específica"),
        ("linkedToLease", "Vinculación IF al Arrendamiento Principal"),
        ("monthlyPayment", "Cuota Mensual Calculada (€)"),
        ("swift", "BIC/SWIFT"),
    ],
    "FRANQUICIA_RC": [
        ("deductibleAmount", "Franquicia por siniestro (€)"),
        ("deductibleType", "Tipo de franquicia"),
        ("deductibleApplied", "Franquicia Aplicada al Último Siniestro"),
    ],
    "HIPOTECA_GARANTIA": [
        ("mortgageAmount", "Capital hipotecado (€)"),
        ("registryOffice", "Registro de la Propiedad competente"),
        ("fincaFutura", "Hipoteca sobre cosa futura (Art. 110 LH)"),
        ("additionalCoverage", "Cobertura adicional intereses/costas (%)"),
        ("ajdAmount", "Cuota AJD (€)"),
        ("ajdRate", "AJD Comunitat Valenciana (%)"),
        ("catastralReference", "Referencia Catastral"),
        ("cessionRights", "Cesión de la legitimación a terceros"),
        ("legitimacion", "Vía de reclamación judicial"),
        ("mortgagedProperty", "Descripción de la finca hipotecada"),
        ("registrationStatus", "Estado de Inscripción"),
        ("registrySection", "Sección / Tomo / Folio / Finca"),
        ("totalMortgage", "Responsabilidad hipotecaria total (€)"),
    ],
    "IP": [
        ("rightsType", "Tipo de derechos cedidos"),
        ("exclusivity", "Exclusividad de la cesión"),
        ("territory", "Territorio de la cesión"),
        ("duration", "Duración de la cesión"),
        ("assignmentPrice", "Precio de la Cesión (€)"),
        ("futureWorks", "Obras Futuras / Modificaciones"),
        ("moralRights", "Derechos Morales del Autor"),
        ("worksDescription", "Descripción de las Obras/Software"),
    ],
    "LIMITES_RC": [
        ("perClaimLimit", "Límite por reclamación (€)"),
        ("legalDefenseLimit", "Sublímite Defensa Jurídica (€)"),
        ("perPersonLimit", "Sublímite Daños Personales por Víctima (€)"),
        ("propertyDamageLimit", "Sublímite Daños Materiales (€)"),
    ],
    "NDA": [
        ("ndaType", "Tipo de acuerdo (unilateral / bilateral)"),
        ("confidentialityPeriod", "Plazo de confidencialidad (años)"),
        ("confidentialScope", "Alcance de la Información Protegida"),
        ("exclusions", "Exclusiones de la Obligación"),
        ("penaltyAmount", "Cláusula Penal (€)"),
        ("personalDataShared", "¿Implica Datos Personales?"),
    ],
    "PAGO_APLAZADO": [
        ("deferredAmount", "Importe del precio aplazado (€)"),
        ("paymentDaysAfterSolar", "Plazo de pago desde condición solar"),
        ("paymentMethod", "Forma de pago del precio aplazado"),
        ("guaranteeType", "Garantía del precio aplazado"),
        ("interestOnDeferred", "Interés del Aplazamiento (%/año)"),
        ("registryCondition", "Inscripción / Refuerzo Registral"),
    ],
    "PAYMENT": [
        ("baseAmount", "Importe base (€)"),
        ("paymentMethod", "Forma de pago"),
        ("paymentDays", "Plazo de pago (días)"),
        ("iban", "IBAN del beneficiario"),
        ("billingPeriod", "Período de Facturación"),
        ("irpfRetention", "Retención IRPF (%)"),
        ("lateInterestR", "Interés de Demora (BCE+8pp por Ley 3/2004)"),
        ("swift", "BIC/SWIFT (si aplica)"),
        ("vatRate", "Tipo de IVA (%)"),
    ],
    "PERITACION": [
        ("peritacionStatus", "Estado del proceso de peritación"),
        ("agreedIndemnity", "Indemnización Acordada (€)"),
        ("aseguradoPerito", "Perito del Asegurado (si contradicción)"),
        ("aseguradoraPerito", "Perito de la Aseguradora"),
        ("damageCause", "Causa del Siniestro"),
        ("estimatedDamage", "Daño Estimado (€)"),
        ("peritacionDeadline", "Plazo Máximo de Peritación (art. 38 LCS)"),
    ],
    "PRIMA_VIDA": [
        ("annualPremium", "Prima anual neta (€)"),
        ("paymentFrequency", "Periodicidad de pago"),
        ("fractionalSurcharge", "Recargo por Fraccionamiento (%)"),
        ("premiumIndexation", "Indexación de Prima"),
        ("premiumReviewDate", "Fecha de Próxima Revisión de Prima"),
    ],
    "REGULATORY_APPROVAL": [
        ("regulatoryBody", "Órgano Regulador"),
        ("approvalStatus", "Estado de la Aprobación"),
        ("approvalDate", "Fecha de Resolución"),
        ("approvalNotes", "Notas del Regulador"),
    ],
    "RIESGO_EMPRESARIAL": [
        ("riskCategory", "Categoría de riesgo"),
        ("paymentHistory", "Historial de Pagos (últimos 3 años)"),
        ("riskNotes", "Observaciones del Analista"),
        ("sectorRisk", "Riesgo Sectorial"),
    ],
    "SLA": [
        ("uptimeGuarantee", "Disponibilidad garantizada (%)"),
        ("criticalResponseH", "Tiempo de respuesta — Crítico (horas)"),
        ("highResponseH", "Tiempo de respuesta — Alto (horas)"),
        ("penaltyPercentPerPoint", "Penalización por caída de disponibilidad (%)"),
        ("criticalResolutionH", "Tiempo Resolución Crítico (horas)"),
        ("lowResponseH", "Tiempo Respuesta Bajo (horas lab.)"),
        ("maintenanceWindow", "Ventana de Mantenimiento Programado"),
        ("maxMonthlyPenalty", "Penalización Máxima Mensual (% factura)"),
        ("measurementPeriod", "Período de Medición"),
        ("mediumResponseH", "Tiempo Respuesta Medio (horas lab.)"),
        ("supportHours", "Horario de Soporte"),
    ],
    "VALIDACION_FINANCIERA": [
        ("debtorName", "Deudor validado"),
        ("financialRating", "Rating financiero del deudor"),
        ("blockingEffect", "Efecto IF_exclusion sobre cobertura de crédito"),
        ("annualRevenue", "Facturación Anual del Deudor (€)"),
        ("debtRatio", "Ratio de Endeudamiento (%)"),
        ("validationDate", "Fecha de Validación"),
        ("validationPending", "¿Validación Pendiente?"),
    ],
}
_MASTER_REQUIRED: dict[str, list[tuple[str, str]]] = {
    "AGENCIA": [
        ("agencyTerritory", "Zona/Territorio de Actuación"),
        ("commissionBase", "Base de Cálculo de la Comisión"),
        ("commissionRate", "Comisión sobre Ventas (%)"),
        ("exclusiveAgency", "Exclusividad del Agente"),
        ("indemnityNotice", "Preaviso para Denuncia (meses)"),
        ("minimumCommission", "Comisión Mínima Garantizada (€/mes)"),
        ("productRange", "Productos/Servicios a Promocionar"),
    ],
    "ARRENDAMIENTO": [
        ("allowedUse", "Uso Permitido del Local"),
        ("depositMonths", "Fianza (nº mensualidades)"),
        ("monthlyRent", "Renta Mensual (€/mes, sin IVA)"),
        ("propertyAddress", "Dirección del Local"),
        ("propertyArea", "Superficie Total (m²)"),
        ("reformsAllowed", "Obras de Adaptación"),
        ("rentReview", "Revisión de Renta"),
    ],
    "ARRENDAMIENTO_HOTEL_FUTURO": [
        ("hotelName", "Denominación del Hotel Futuro (Cosa)"),
        ("propertyAddress", "Dirección del Solar / Inmueble"),
        ("catastralReference", "Referencia Catastral del Solar"),
        ("rentalAmount", "Renta de Arrendamiento (€/mes)"),
        ("loanAmount", "Capital del Circumcontrato/Préstamo (€)"),
        ("loanTermYears", "Plazo del Circumcontrato (años)"),
        ("interestRate", "Tipo de Interés del Circumcontrato"),
        ("mortgageAmount", "Responsabilidad Hipotecaria (€)"),
        ("circumcontractNote", "Nota PHENOMENON: El circumcontrato es CA2"),
        ("cosaFuturaCondition", "Condición de Cosa Futura"),
    ],
    "COLABORACION": [
        ("governanceModel", "Órgano de Gobierno"),
        ("ipOwnership", "Titularidad de la PI Creada"),
        ("profitSplitA", "Participación Socio A (%)"),
        ("profitSplitB", "Participación Socio B (%)"),
        ("projectName", "Denominación del Proyecto"),
        ("projectScope", "Alcance del Proyecto"),
    ],
    "COMPRAVENTA_SOLAR": [
        ("totalPrice", "Precio total acordado (€)"),
        ("priceAtSigning", "Precio a pagar a la firma (€)"),
        ("catastralReference", "Referencia catastral"),
        ("ifTemporal", "IF temporal"),
        ("ifLogica", "IF lógica"),
        ("ifOposicion", "IF oposición"),
        ("urbanisticConditionType", "Naturaleza de la condición urbanística"),
        ("sellerObligations", "Prestaciones accesorias del vendedor"),
        ("tradicionType", "Traditio pactada"),
        ("deferredInterestRate", "Interés del Precio Aplazado (%/año)"),
        ("deferredPrice", "Precio Aplazado — al obtener Solar (€)"),
        ("iivtnuResponsibility", "Plusvalía Municipal (IIVTNU)"),
        ("itpRate", "Tipo ITP CCAA Aplicable (%)"),
        ("mortgageEncumbrance", "Cargas Hipotecarias sobre el Suelo"),
        ("propertyAddress", "Dirección del Suelo"),
        ("registryDiffusionRole", "Función del Registro en esta operación"),
        ("rightOfFirstRefusal", "Tanteo y Retracto Urbanístico"),
        ("solarConditionTrigger", "Condición Solar se Acredita Mediante"),
        ("urbanClassification", "Clasificación Urbanística Actual"),
        ("urbanizationCharges", "Cargas Urbanísticas a Cargo de"),
    ],
    "COMPRAVENTA_TERRENO": [
        ("totalPrice", "Precio total acordado (€)"),
        ("priceAtSigning", "Precio a pagar a la firma (€)"),
        ("deferredPrice", "Precio aplazado (€)"),
        ("paymentDeadlineDays", "Plazo del pago aplazado"),
        ("urbanisticConditionType", "Naturaleza de la condición urbanística"),
        ("sellerObligations", "Prestaciones accesorias del vendedor"),
        ("ifTemporal", "IF temporal"),
        ("ifLogica", "IF lógica"),
        ("ifOposicion", "IF oposición"),
        ("tradicionType", "Traditio pactada"),
        ("catastralReference", "Referencia catastral"),
        ("propertyAddress", "Dirección del Terreno"),
        ("registryDiffusionRole", "Función del Registro en esta operación"),
    ],
    "CONSULTORIA": [
        ("consultingScope", "Alcance de los Servicios de Consultoría"),
        ("deliverables", "Entregables Comprometidos"),
        ("expensesPolicy", "Política de Gastos de Desplazamiento"),
        ("hourlyRate", "Tarifa Horaria (€/h, sin IVA)"),
        ("maxHours", "Horas Máximas Autorizadas"),
        ("meetingFrequency", "Frecuencia de Reuniones de Seguimiento"),
    ],
    "CSM": [
        ("automaticRenewal", "Prórroga Automática"),
        ("baseAmount", "Importe Base (€/año)"),
        ("billingPeriod", "Período de Facturación"),
        ("contractObject", "Objeto del Contrato"),
        ("liabilityLimit", "Límite de Responsabilidad"),
        ("noticePeriod", "Preaviso para Resolución (días)"),
        ("paymentDays", "Plazo de Pago (días naturales)"),
        ("territory", "Territorio de Aplicación"),
        ("vatRate", "Tipo IVA (%)"),
    ],
    "DISTRIBUCION": [
        ("competitionClause", "Cláusula de No Competencia"),
        ("exclusivityType", "Tipo de Exclusividad"),
        ("minimumPurchase", "Compra Mínima Anual (€)"),
        ("paymentTerms", "Condiciones de Pago"),
        ("productRange", "Gama de Productos"),
        ("stockMinimum", "Stock Mínimo Obligatorio"),
        ("territory", "Territorio de Distribución"),
    ],
    "KPMG": [
        ("hotelName", "Denominación del Hotel"),
        ("catastralReference", "Referencia Catastral del Solar"),
        ("constructionTarget", "Fecha Límite Finalización Obra"),
        ("baseAmount", "Capital del Circumcontrato (€)"),
        ("euriborRate", "EURIBOR 12M de Referencia (%)"),
        ("spread", "Diferencial (Spread) sobre EURIBOR (%)"),
        ("termYears", "Plazo del Arrendamiento (años)"),
        ("monthlyRentHotel", "Renta Mensual del Hotel (€/mes)"),
        ("registryOffice", "Registro de la Propiedad competente"),
        ("buildingArea", "Superficie Construida (m²)"),
        ("hotelCategory", "Categoría del Hotel"),
        ("ivaDevolutionEst", "Estimación Devolución IVA Obras (€)"),
    ],
    "KPMG_CORPORATE": [
        ("approvalChain", "Cadena de Aprobación"),
        ("complianceOfficer", "Responsable de Compliance"),
        ("auditScope", "Alcance de la Auditoría"),
        ("regulatoryBody", "Órgano Regulador"),
        ("approvalDeadline", "Plazo de Aprobación"),
        ("boardMeetingDate", "Fecha de Junta de Aprobación"),
    ],
    "NDA_BILATERAL": [
        ("confidentialityPeriod", "Plazo de Confidencialidad (años)"),
        ("confidentialityScope", "Alcance de la Información Protegida"),
        ("ndaType", "Tipo de Acuerdo"),
        ("penaltyAmount", "Cláusula Penal por Incumplimiento (€)"),
        ("personalDataShared", "¿Se Comparten Datos Personales?"),
    ],
    "SAAS": [
        ("dataCenter", "Ubicación del Centro de Datos"),
        ("licenseType", "Tipo de Licencia"),
        ("monthlyFee", "Cuota Mensual (€/mes, sin IVA)"),
        ("paymentDays", "Plazo de Pago (días naturales)"),
        ("softwareName", "Nombre del Software/Plataforma"),
        ("storageGB", "Almacenamiento Incluido (GB)"),
        ("supportLevel", "Nivel de Soporte Incluido"),
        ("usersCount", "Nº de Usuarios Licenciados"),
    ],
    "SEGURO_CREDITO_COMERCIAL": [
        ("debtorName", "Deudor principal cubierto"),
        ("creditLimit", "Límite máximo por deudor (€)"),
        ("indemnityPct", "Porcentaje de indemnización (%)"),
        ("financialValidation", "Estado validación financiera deudor"),
        ("primaAnual", "Prima Anual (€)"),
        ("waitingPeriod", "Período de Espera (meses)"),
    ],
    "SEGURO_DANOS": [
        ("propertyValue", "Valor en nuevo del bien (€)"),
        ("coverageRisks", "Riesgos cubiertos"),
        ("primaAnual", "Prima anual (€)"),
        ("deductible", "Franquicia por Siniestro (%)"),
        ("peritacionMethod", "Método de Peritación"),
        ("propertyDescription", "Bien Asegurado"),
    ],
    "SEGURO_RC": [
        ("coverageLimit", "Límite por siniestro (€)"),
        ("primaAnual", "Prima anual (€)"),
        ("rcType", "Tipo de RC"),
        ("activityInsured", "Actividad Asegurada"),
        ("annualAggregateLimit", "Límite Agregado Anual (€)"),
        ("franquicia", "Franquicia por Siniestro (€)"),
    ],
    "SEGURO_VIDA": [
        ("insuredName", "Nombre del asegurado"),
        ("capitalDeceso", "Capital asegurado — fallecimiento (€)"),
        ("primaAnual", "Prima anual (€)"),
        ("medicalValidation", "Estado declaración de salud"),
        ("beneficiaries", "Beneficiarios Designados"),
        ("capitalInvalidez", "Capital Asegurado — Invalidez (€)"),
        ("coverageType", "Modalidad de Cobertura"),
        ("insuredAge", "Edad del Asegurado (años)"),
    ],
}



class CreatePhenomenonRequest(BaseModel):
    name: str
    type: str
    parentId: Optional[str] = None
    ess: dict
    ag: dict = {"clauses": []}
    ia_instances: list[str] = []


@router.get("/")
def list_phenomena(db: Session = Depends(get_db)):
    return PhenomenaRepository(db).list_all()


@router.post("/")
def create_phenomenon(req: CreatePhenomenonRequest, db: Session = Depends(get_db)):
    repo = PhenomenaRepository(db)
    vector = VectorEngine().generate(
        ia_type=req.ia_instances[0] if req.ia_instances else "ad-actio",
        is_sub=req.parentId is not None,
    )
    record = PhenomenonRecord(
        id=str(uuid.uuid4()),
        name=req.name,
        type=req.type,
        status="ACTIVE",
        ess=EssFields(**req.ess),
        ag=req.ag,
        ia_instances=req.ia_instances,
        vectors=[vector],
        # Always start as PENDING — must be explicitly homologated
        opus=OpusState(status="ACTIVE", homologation="PENDING"),
        parentId=req.parentId,
    )
    return repo.save(record)


@router.get("/{id}")
def get_phenomenon(id: str, db: Session = Depends(get_db)):
    try:
        return PhenomenaRepository(db).get(id)
    except KeyError:
        raise HTTPException(404, "Phenomenon not found")


class UpdatePhenomenonRequest(BaseModel):
    name: Optional[str] = None
    ess: Optional[dict] = None
    ag: Optional[dict] = None
    ia_instances: Optional[list[str]] = None
    status: Optional[str] = None


# ── State-machine guards ────────────────────────────────────────────────────
# Status transitions are partially ordered. Some transitions must go through
# specific endpoints (e.g. BLOCKED → ACTIVE requires /demo/seguros/unblock-coverage
# or a similar unblock flow) and must NOT be reachable via raw PATCH.
# Without these guards, audit found a real bug: BLOCKED → ACTIVE silently via PATCH.
_FORBIDDEN_DIRECT_TRANSITIONS: dict[str, set[str]] = {
    # From BLOCKED: only TERMINATED is allowed via raw PATCH. ACTIVE / SINIESTRO_PENDIENTE
    # etc. require the explicit unblock endpoint that revalidates the IF_exclusion.
    "BLOCKED": {"ACTIVE", "MODIFIED", "SINIESTRO_PENDIENTE", "INDEMNIZACION_PAGADA"},
    # From SINIESTRO_PENDIENTE: ACTIVE bypasses claim resolution. Only resolution
    # endpoints may produce INDEMNIZACION_PAGADA / RECHAZO; raw PATCH back to ACTIVE
    # would erase a claim mid-flight.
    "SINIESTRO_PENDIENTE": {"ACTIVE"},
    # Terminal states must not silently re-activate.
    "TERMINATED": {"ACTIVE", "MODIFIED", "DRAFT"},
    "INDEMNIZACION_PAGADA": {"ACTIVE", "SINIESTRO_PENDIENTE"},
    "RECHAZO": {"ACTIVE", "SINIESTRO_PENDIENTE"},
}

# Whitelisted ESS field shapes; backend rejects anything obviously invalid here
# instead of trusting client input (audit found `effectiveDate` accepting any string).
import re as _re
from datetime import date as _date
_ISO_DATE_RE = _re.compile(r"^\d{4}-\d{2}-\d{2}$")
_SCRIPT_TAG_RE = _re.compile(r"<\s*script", _re.IGNORECASE)


def _is_valid_iso_date(s: str) -> bool:
    """ISO YYYY-MM-DD shape AND a real calendar date.
    Audit 2026-05-21 found 2023-02-29, 2026-13-01, 2026-02-30 all accepted
    when only the shape was checked."""
    if not _ISO_DATE_RE.match(s):
        return False
    try:
        _date.fromisoformat(s)
        return True
    except ValueError:
        return False


def _sanitize_ess(ess: dict) -> dict:
    """Reject obviously invalid ESS payloads (date shape AND date validity,
    html injection). Returns the same dict on success; raises 400 on failure."""
    out: dict = {}
    for k, v in ess.items():
        if v is None:
            out[k] = v
            continue
        s = str(v)
        if k in ("effectiveDate", "expiryDate") and s != "" and not _is_valid_iso_date(s):
            raise HTTPException(
                400,
                f"ESS.{k} must be a valid ISO date (YYYY-MM-DD, real calendar date) or empty; got {s!r}"
            )
        if _SCRIPT_TAG_RE.search(s):
            raise HTTPException(400, f"ESS.{k} contains forbidden <script> token")
        out[k] = v
    return out


@router.patch("/{id}")
def update_phenomenon(id: str, req: UpdatePhenomenonRequest, db: Session = Depends(get_db)):
    repo = PhenomenaRepository(db)
    try:
        record = repo.get(id)
    except KeyError:
        raise HTTPException(404, "Phenomenon not found")
    updates = {}
    if req.name is not None:
        updates["name"] = req.name
    if req.ess is not None:
        updates["ess"] = record.ess.model_copy(update=_sanitize_ess(req.ess))
    if req.ag is not None:
        updates["ag"] = req.ag
        # Any content change resets homologation — must re-verify
        updates["opus"] = record.opus.model_copy(update={"homologation": "PENDING"})
    if req.ia_instances is not None:
        updates["ia_instances"] = req.ia_instances
        updates["opus"] = record.opus.model_copy(update={"homologation": "PENDING"})
    if req.status is not None:
        # Block transitions that must go through dedicated endpoints.
        forbidden = _FORBIDDEN_DIRECT_TRANSITIONS.get(record.status, set())
        if req.status in forbidden:
            raise HTTPException(
                409,
                f"Cannot transition {record.status} → {req.status} via PATCH. "
                f"Use the dedicated lifecycle endpoint (e.g. /demo/seguros/unblock-coverage)."
            )
        updates["status"] = req.status
    if updates:
        return repo.save(record.model_copy(update=updates))
    return record


@router.patch("/{id}/ess")
def update_ess(id: str, ess_update: dict, db: Session = Depends(get_db)):
    repo = PhenomenaRepository(db)
    try:
        record = repo.get(id)
    except KeyError:
        raise HTTPException(404, "Phenomenon not found")
    # ESS change resets homologation
    updated = record.model_copy(update={
        "ess": record.ess.model_copy(update=ess_update),
        "opus": record.opus.model_copy(update={"homologation": "PENDING"}),
    })
    return repo.save(updated)


@router.post("/{id}/homologate")
def homologate_phenomenon(id: str, db: Session = Depends(get_db)):
    repo = PhenomenaRepository(db)
    try:
        record = repo.get(id)
    except KeyError:
        raise HTTPException(404, "Phenomenon not found")

    errors: list[str] = []
    ess = record.ess.model_dump()
    terms = record.ag.get("terms", {})
    is_sub = bool(record.parentId)

    # ── 1. Base ESS checks ────────────────────────────────────────────────────
    ess_checks = [
        {"key": "partyA",        "label": "Parte A (Razón Social)",     "valid": bool(ess.get("partyA")),        "required": True,  "group": "Identidad ESS"},
        {"key": "partyB",        "label": "Parte B (Razón Social)",     "valid": bool(ess.get("partyB")),        "required": True,  "group": "Identidad ESS"},
        {"key": "jurisdiction",  "label": "Juzgados competentes",       "valid": bool(ess.get("jurisdiction")),  "required": True,  "group": "Identidad ESS"},
        {"key": "effectiveDate", "label": "Fecha de inicio",            "valid": bool(ess.get("effectiveDate")), "required": True,  "group": "Identidad ESS"},
        {"key": "expiryDate",    "label": "Fecha de vencimiento",       "valid": bool(ess.get("expiryDate")),    "required": True,  "group": "Identidad ESS"},
    ]
    for c in ess_checks:
        if not c["valid"]:
            errors.append(f"[ESS] Campo obligatorio vacío: {c['label']}")

    # ── 1b. ESS date-range coherence ──────────────────────────────────────────
    # effectiveDate must be <= expiryDate. A contract that starts after it ends
    # is logically impossible. Audit 2026-05-21 found this passing silently.
    eff = ess.get("effectiveDate", "")
    exp = ess.get("expiryDate", "")
    if eff and exp and eff > exp:  # ISO YYYY-MM-DD compares lexicographically
        ess_checks.append({
            "key": "date_range", "label": "Fecha de inicio anterior al vencimiento",
            "valid": False, "required": True, "group": "Identidad ESS",
        })
        errors.append(
            f"[ESS] Fecha de inicio ({eff}) es posterior a la fecha de vencimiento ({exp}) — incoherente"
        )

    # ── 2. AG + IA checks ────────────────────────────────────────────────────────
    # IA operators are REQUIRED in PHENOMENON: they define the behavioral semantics
    # of every clause (obligation, prohibition, mutual commitment, removal).
    # A contract without IA has text but no operational logic — incomplete.
    has_clauses = bool(record.ag.get("clauses"))
    has_ia      = bool(record.ia_instances)

    # Per-type IA recommendation for the error message
    _IA_RECOMMENDED: dict[str, str] = {
        "MASTER":           "ad-actio + co-implication",
        "NDA":              "non + de-actio",
        "SLA":              "ad-actio",
        "PAYMENT":          "ad-actio",
        "DPA":              "ad-actio + co-implication",
        "IP":               "ad-actio",
        "CONDICION_SOLAR":  "ad-actio + co-implication",
        "PAGO_APLAZADO":    "ad-actio",
        "CARGAS_URBANISTICAS": "ad-actio + co-implication",
        # Insurance: IF_exclusion (non) is key for coverage blocking
        "COBERTURA_VIDA":      "ad-actio",
        "EXCLUSIONES_VIDA":    "non + de-actio",  # IF_exclusion = non (positional block)
        "PRIMA_VIDA":          "ad-actio",
        "COBERTURA_RC":        "ad-actio + co-implication",
        "LIMITES_RC":          "ad-actio",
        "FRANQUICIA_RC":       "non",              # franquicia = positional threshold
        "COBERTURA_DANOS":     "ad-actio + co-implication",
        "PERITACION":          "ad-actio",
        "EXCLUSIONES_DANOS":   "non",
        "COBERTURA_CREDITO":   "ad-actio",
        "VALIDACION_FINANCIERA":"non + de-actio",   # IF_exclusion gate: blocks coverage when rating fails
        "RIESGO_EMPRESARIAL":  "ad-actio",
    }
    ia_recommendation = _IA_RECOMMENDED.get(record.type, "ad-actio")

    ag_checks = [
        {"key": "clauses", "label": "Cláusulas operativas (AG)", "valid": has_clauses, "required": True,  "group": "Contenido AG"},
        {
            "key": "ia",
            "label": f"Operadores IA asignados (recomendado: {ia_recommendation})",
            "valid": has_ia,
            "required": True,
            "group": "Operadores IA — PHENOMENON",
        },
    ]
    if not has_clauses:
        errors.append("[AG] Sin cláusulas operativas definidas")
    if not has_ia:
        errors.append(
            f"[IA] Sin operadores IA — el motor PHENOMENON no puede verificar el comportamiento "
            f"de las cláusulas sin operadores. Para {record.type} se recomienda: {ia_recommendation}."
        )

    # ── 2b. IA compatibility check ────────────────────────────────────────────
    # Use the engine's IAEngine to verify the assigned set is coherent.
    if has_ia:
        from phenomenon_engine import IAEngine
        ia_valid, ia_errors = IAEngine().validate_set(record.ia_instances)
        if not ia_valid:
            conflict_check = {
                "key": "ia_compat",
                "label": "Compatibilidad entre operadores IA",
                "valid": False,
                "required": True,
                "group": "Operadores IA — PHENOMENON",
            }
            ag_checks.append(conflict_check)
            for err in ia_errors:
                errors.append(f"[IA] {err}")
        else:
            ag_checks.append({
                "key": "ia_compat",
                "label": "Compatibilidad entre operadores IA",
                "valid": True,
                "required": True,
                "group": "Operadores IA — PHENOMENON",
            })

    # ── 2c. Numeric field non-negativity ──────────────────────────────────────
    # Fields whose name implies monetary amount, percentage, count, or duration
    # must be ≥ 0. A premium of −1000 € or a property value of −50000 € is
    # nonsense. Audit 2026-05-21 found these passing silently.
    _NUMERIC_NONNEG_KEYS = (
        # Monetary
        "baseAmount", "totalPrice", "priceAtSigning", "deferredPrice",
        "monthlyFee", "monthlyRent", "monthlyRentHotel", "hourlyRate",
        "loanAmount", "mortgageAmount", "rentalAmount", "primaAnual",
        "annualPremium", "propertyValue", "insuredValue", "creditLimit",
        "totalCoverageLimit", "coverageLimit", "coverageCapital",
        "capitalDeceso", "deductibleAmount", "perClaimLimit",
        "agreedIndemnity", "estimatedDamage", "buildingArea",
        "ivaDevolutionEst", "capitalAmount", "mortgageAmount",
        # Percentages / rates
        "euriborRate", "spread", "interestRate", "indemnityPct",
        "indemnityPercentage", "commissionRate", "profitSplitA",
        "retentionPct", "penaltyPct", "deductible",
        # Durations / counts
        "confidentialityPeriod", "noticePeriod", "termYears",
        "loanTermYears", "paymentDays", "paymentDaysAfterSolar",
        "maxWaitPeriod", "dataRetention", "duration", "reviewDeadline",
        "availability",
    )
    for key in _NUMERIC_NONNEG_KEYS:
        v = terms.get(key)
        if v in (None, "", "— seleccionar —"):
            continue
        try:
            f = float(v)
        except (TypeError, ValueError):
            continue
        if f < 0:
            errors.append(
                f"[{record.type}] Campo numérico negativo no permitido: {key}={v}"
            )

    # ── 3. Type-specific terms checks ─────────────────────────────────────────
    type_checks: list[dict] = []
    if is_sub:
        required_terms = _SUB_REQUIRED.get(record.type, [])
    else:
        # Use the template key stored at creation time to pick the right checks
        template_key = terms.get("templateKey", "")
        required_terms = _MASTER_REQUIRED.get(template_key, [])

    for key, label in required_terms:
        val = terms.get(key)
        is_valid = bool(val) and str(val).strip() not in ("", "— seleccionar —")
        type_checks.append({
            "key": key, "label": label, "valid": is_valid,
            "required": True, "group": f"Campos específicos — {record.type}",
        })
        if not is_valid:
            errors.append(f"[{record.type}] Campo específico obligatorio: {label}")

    # ── 4. Sub-contract coherence check (master only) ─────────────────────────
    # In PHENOMENON, the master governs all sub-contracts via IF (inter-phenomenic)
    # connections. If any sub-contract is INVALID or PENDING, the overall contractual
    # ecosystem is incomplete — the master cannot be considered fully homologated.
    ecosystem_checks: list[dict] = []
    if not is_sub:
        children = repo.get_children(id)
        if children:
            not_valid = [c for c in children if c.opus.homologation != "VALID"]
            valid_count = len(children) - len(not_valid)
            all_children_ok = len(not_valid) == 0
            ecosystem_checks.append({
                "key": "children_homologated",
                "label": f"Sub-contratos homologados ({valid_count}/{len(children)} verificados)",
                "valid": all_children_ok,
                "required": True,
                "group": "Coherencia del Ecosistema IF",
            })
            if not all_children_ok:
                for child in not_valid:
                    child_state = child.opus.homologation
                    errors.append(
                        f"[IF] Sub-contrato no homologado: «{child.name}» "
                        f"({child_state}) — verifique este contrato antes de homologar el maestro."
                    )

    # ── 4b. KPMG corporate governance blocking logic ──────────────────────────
    # Regulatory approval cannot be homologated until the compliance check sub-contract
    # is valid. This represents a governance-style IF dependency with a WAITING state.
    if record.type == "REGULATORY_APPROVAL" and record.parentId:
        parent = None
        try:
            parent = repo.get(record.parentId)
        except KeyError:
            parent = None
        if parent:
            compliance_child = next(
                (c for c in repo.get_children(parent.id) if c.type == "COMPLIANCE_CHECK"),
                None,
            )
            if compliance_child and compliance_child.opus.homologation != "VALID":
                errors.append(
                    "[IF] REGULATORY_APPROVAL bloqueado: el control de cumplimiento debe ser homologado primero."
                )
                updated = record.model_copy(update={
                    "status": "WAITING",
                    "opus": record.opus.model_copy(update={"homologation": "INVALID"}),
                })
                repo.save(updated)
                return {
                    "id": id,
                    "valid": False,
                    "homologation": updated.opus.homologation,
                    "errors": errors,
                    "checks": ess_checks + ag_checks + type_checks + ecosystem_checks,
                }

    # ── Final result ──────────────────────────────────────────────────────────
    all_checks = ess_checks + ag_checks + type_checks + ecosystem_checks
    valid = len(errors) == 0

    updated_fields = {
        "opus": record.opus.model_copy(update={"homologation": "VALID" if valid else "INVALID"})
    }
    if valid and record.status == "WAITING":
        updated_fields["status"] = "ACTIVE"

    updated = record.model_copy(update=updated_fields)
    repo.save(updated)

    return {
        "id": id,
        "valid": valid,
        "homologation": updated.opus.homologation,
        "errors": errors,
        "checks": all_checks,
    }


@router.get("/{id}/opus")
def get_opus_level(id: str, db: Session = Depends(get_db)):
    """
    Bloque IV+V — evaluate opus level (PARTIAL/COMPLETE/OPONIBLE) and oponibility status.
    """
    from phenomenon_engine import OpusEngine, OponibilityEngine
    repo = PhenomenaRepository(db)
    try:
        record = repo.get(id)
    except KeyError:
        raise HTTPException(404, "Phenomenon not found")

    terms = record.ag.get("terms", {})
    registered_in   = terms.get("registry", "")
    registered_date = terms.get("registeredDate", "")

    opus    = OpusEngine()
    opus_r  = opus.evaluate(record, registered_in=registered_in)
    opon    = OponibilityEngine()
    opon_r  = opon.evaluate(record.type, registered_in, registered_date)

    return {
        "id":              id,
        "opus_level":      opus_r.level.value,
        "opus_label":      opus_r.label(),
        "title_complete":  opus_r.title_complete,
        "mode_complete":   opus_r.mode_complete,
        "homologated":     opus_r.homologated,
        "oponible":        opus_r.oponible,
        "missing":         opus_r.missing,
        "steps_to_complete": opus.to_complete(record),
        "steps_to_oponible": opus.to_oponible(record),
        "oponibility": {
            "is_oponible":  opon_r.is_oponible,
            "registry":     opon_r.registry,
            "legal_basis":  opon_r.legal_basis,
            "registered_date": opon_r.registered_date,
            "missing":      opon_r.missing,
            "summary":      opon_r.summary(),
        },
    }


class RegisterRequest(BaseModel):
    registry: str
    registered_date: str
    legal_basis: str = ""


@router.patch("/{id}/register")
def register_phenomenon(id: str, req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Bloque V — register a phenomenon in a public registry → grants oponibility erga omnes.
    Stores registry info in ag.terms and resets homologation to PENDING (must re-verify).
    """
    repo = PhenomenaRepository(db)
    try:
        record = repo.get(id)
    except KeyError:
        raise HTTPException(404, "Phenomenon not found")

    existing_ag   = record.ag or {}
    existing_terms = existing_ag.get("terms", {})
    new_terms = {
        **existing_terms,
        "registry":       req.registry,
        "registeredDate": req.registered_date,
        "legalBasis":     req.legal_basis,
    }
    updated = record.model_copy(update={
        "ag": {**existing_ag, "terms": new_terms},
        "opus": record.opus.model_copy(update={"homologation": "PENDING"}),
    })
    repo.save(updated)
    return {"registered": True, "registry": req.registry, "date": req.registered_date}


@router.post("/{id}/reset")
def reset_project(id: str, db: Session = Depends(get_db)):
    """Delete all sub-contracts and reset master ESS to blank (keeps name and templateKey)."""
    repo = PhenomenaRepository(db)
    try:
        master = repo.get(id)
    except KeyError:
        raise HTTPException(404, "Project not found")
    # Delete all descendants
    def delete_tree(pid: str) -> None:
        for child in repo.get_children(pid):
            delete_tree(child.id)
            repo.delete(child.id)
    delete_tree(id)
    # Reset master to blank state, preserve name + templateKey
    template_key = master.ag.get("terms", {}).get("templateKey", "")
    reset = master.model_copy(update={
        "status": "DRAFT",
        "ess": master.ess.model_copy(update={"partyA": "", "partyB": "", "jurisdiction": "", "effectiveDate": "", "expiryDate": ""}),
        "ag": {"clauses": [], "terms": {"templateKey": template_key}},
        "opus": master.opus.model_copy(update={"status": "DRAFT", "homologation": "PENDING"}),
    })
    repo.save(reset)
    return {"reset": True, "id": id}


@router.post("/{id}/terminate")
def terminate_phenomenon(id: str, db: Session = Depends(get_db)):
    """
    Bloque III — Terminación: transitions a sub-contract to TERMINATED state.
    Cascades NEEDS_REVIEW to all sibling sub-contracts that have IF connections
    to the terminated type, and flags the master for re-verification.
    """
    from phenomenon_engine.cascade_engine import SUB_CASCADE_MAP
    repo = PhenomenaRepository(db)
    try:
        record = repo.get(id)
    except KeyError:
        raise HTTPException(404, "Phenomenon not found")

    # Terminate the contract
    repo.save(record.model_copy(update={
        "status": "TERMINATED",
        "opus": record.opus.model_copy(update={"homologation": "PENDING"}),
    }))

    affected_ids = []
    # Flag siblings that depend on this type via IF connections
    if record.parentId:
        siblings = repo.get_children(record.parentId)
        for sib in siblings:
            if sib.id == id:
                continue
            # Check if terminated type appears as a source in SUB_CASCADE_MAP → sib.type is a target
            dependent = any(
                sib.type in targets
                for field_targets in SUB_CASCADE_MAP.get(record.type, {}).values()
                for targets in [field_targets]
            )
            if dependent:
                repo.save(sib.model_copy(update={
                    "status": "NEEDS_REVIEW",
                    "opus": sib.opus.model_copy(update={"homologation": "PENDING"}),
                }))
                affected_ids.append(sib.id)

        # Flag master for re-verification
        try:
            master = repo.get(record.parentId)
            repo.save(master.model_copy(update={
                "status": "NEEDS_REVIEW",
                "opus": master.opus.model_copy(update={"homologation": "PENDING"}),
            }))
            affected_ids.append(record.parentId)
        except KeyError:
            pass

    return {"terminated": id, "affected_ids": affected_ids, "status": "TERMINATED"}


@router.delete("/{id}")
def delete_phenomenon(id: str, db: Session = Depends(get_db)):
    repo = PhenomenaRepository(db)
    # Verify existence first — silent success on a missing record hides
    # client bugs (e.g., double-delete after a race). Audit 2026-05-21
    # found 2nd DELETE returning 200; now correctly 404.
    try:
        repo.get(id)
    except KeyError:
        raise HTTPException(404, f"Phenomenon {id} not found")

    # Cascade-delete all children first
    def delete_tree(pid: str) -> None:
        for child in repo.get_children(pid):
            delete_tree(child.id)
            repo.delete(child.id)
    delete_tree(id)
    repo.delete(id)
    return {"deleted": id}
