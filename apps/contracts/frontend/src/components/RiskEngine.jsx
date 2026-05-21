// @refresh reset
/**
 * Risk Detection Engine for AppC
 * Analyses contracts for legal risks under Spanish law and PHENOMENON framework.
 * Pure client-side — no backend call needed for basic risk detection.
 *
 * Risk levels: HIGH (🔴) / MEDIUM (🟡) / LOW (🟢) / INFO (ℹ️)
 */
import { C, font, SUB_META } from "../constants.js";

// ─── Risk detection logic ─────────────────────────────────────────────────────

export function detectRisks(contract, subContracts = [], allContracts = []) {
  if (!contract) return [];
  const risks = [];
  const ess   = contract.ess ?? {};
  const terms = contract.ag?.terms ?? {};
  const clauses = (contract.ag?.clauses ?? []).join(" ").toLowerCase();
  const ia    = contract.ia_instances ?? [];
  const isMaster = !contract.parentId;
  const templateKey = terms.templateKey ?? "";
  const isLandSaleTemplate = isMaster && (templateKey === "COMPRAVENTA_SOLAR" || templateKey === "COMPRAVENTA_TERRENO");

  const hasPersonalData = clauses.includes("datos personales") || clauses.includes("personal data") ||
    clauses.includes("rgpd") || clauses.includes("gdpr") || clauses.includes("lopdgdd") ||
    clauses.includes("tratamiento") || clauses.includes("protección de datos");

  const daysUntilExpiry = ess.expiryDate
    ? Math.floor((new Date(ess.expiryDate) - new Date()) / 86400000) : null;

  const paymentDays = parseInt(terms.paymentDays);
  const baseAmount  = parseFloat(terms.baseAmount);

  // ── HIGH RISKS ────────────────────────────────────────────────────────────
  if (!ess.jurisdiction?.trim())
    risks.push({ level:"high", key:"jurisdiction", title:"Sin juzgados competentes definidos", desc:"No se especifican los juzgados competentes en caso de litigio. El contrato podría ser ineficaz. Añadir cláusula de sumisión expresa.", law:"Art. 54 LEC · Art. 1255 CC", tab:"campos", field:"jurisdiction" });

  if (!terms.liabilityLimit?.trim() && isMaster)
    risks.push({ level:"high", key:"liability", title:"Sin límite de responsabilidad (exposición ilimitada)", desc:"Sin cláusula limitativa, el art. 1.911 CC impone responsabilidad patrimonial universal. Riesgo de exposición ilimitada en caso de incumplimiento grave.", law:"Art. 1.911 CC · Art. 1.103 CC", tab:"campos" });

  if (hasPersonalData && !subContracts.some(s=>s.type==="DPA"))
    risks.push({ level:"high", key:"rgpd", title:"Datos personales sin Acuerdo de Tratamiento (DPA)", desc:"El contrato menciona datos personales pero no incluye un Acuerdo de Encargo de Tratamiento. Riesgo de sanción de la AEPD (hasta 20M€ o 4% facturación global).", law:"RGPD Art. 28 · LOPDGDD 3/2018 Art. 33", tab:null });

  if (!isNaN(paymentDays) && paymentDays > 60)
    risks.push({ level:"high", key:"morosidad", title:`Plazo de pago excesivo: ${paymentDays} días (máximo legal: 60)`, desc:`La Ley 3/2004 limita los plazos de pago en operaciones comerciales B2B a 60 días (30 por defecto). El plazo actual de ${paymentDays} días es nulo de pleno derecho.`, law:"Ley 3/2004 Art. 4 · Directiva 2011/7/UE", tab:"campos", field:"paymentDays" });

  if (daysUntilExpiry !== null && daysUntilExpiry < 30 && daysUntilExpiry > 0)
    risks.push({ level:"high", key:"expiry_urgent", title:`⏰ Contrato EXPIRA en ${daysUntilExpiry} días (${ess.expiryDate})`, desc:"El contrato vence próximamente. Iniciar negociación de renovación o notificar resolución según el período de preaviso pactado.", law:"Art. 1.255 CC · Cláusula de preaviso", tab:"campos", field:"expiryDate" });

  if (contract.opus?.homologation === "INVALID")
    risks.push({ level:"high", key:"homologation", title:"Contrato con errores de homologación PHENOMENON", desc:"El motor PHENOMENON ha detectado errores estructurales. El contrato no debe emitirse hasta que todos los checks de homologación pasen.", law:"PHENOMENON Engine · Bloque VI Estabilización", tab:null });

  if (isLandSaleTemplate && ess.effectiveDate && ess.expiryDate) {
    const start = new Date(ess.effectiveDate);
    const end = new Date(ess.expiryDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const diffDays = Math.floor((end - start) / 86400000);
      if (diffDays > 731) {
        risks.push({
          level:"high",
          key:"plazo_2_anios",
          title:"IF temporal superior a 2 años",
          desc:`El plazo entre la firma (${ess.effectiveDate}) y el límite del iter urbanístico (${ess.expiryDate}) supera 2 años. El caso base de PHENOMENON para compraventa de terreno exige un máximo estructural de 2 años.`,
          law:"Art. 1255 CC · Caso Compraventa Terreno §3 y §5",
          tab:"campos",
          field:"expiryDate",
        });
      }
    }
  }

  // ── MEDIUM RISKS ──────────────────────────────────────────────────────────
  if (daysUntilExpiry !== null && daysUntilExpiry >= 30 && daysUntilExpiry < 90)
    risks.push({ level:"medium", key:"expiry_soon", title:`Contrato expira en ${daysUntilExpiry} días (${ess.expiryDate})`, desc:"Pronto vence el contrato. Monitorear activamente y preparar renovación o preaviso de resolución.", law:"Art. 1.255 CC", tab:"campos", field:"expiryDate" });

  if (terms.automaticRenewal?.startsWith("Sí") && !terms.noticePeriod?.trim())
    risks.push({ level:"medium", key:"renewal", title:"Prórroga automática sin período de preaviso definido", desc:"La prórroga automática sin preaviso definido puede generar obligaciones no deseadas. Especificar el plazo de denuncia (recomendado: 30-90 días).", law:"Art. 1.256 CC", tab:"campos", field:"noticePeriod" });

  if (!ess.partyACIF?.trim() && isMaster)
    risks.push({ level:"medium", key:"cif", title:"CIF/NIF de las partes no registrado", desc:"Sin identificación registral de las partes, el contrato podría tener problemas de identificación y ejecutabilidad ante tribunales o notarios.", law:"Art. 1.261 CC · Normativa registral mercantil", tab:"campos", field:"partyACIF" });

  if (ia.includes("non") && !ia.includes("de-actio"))
    risks.push({ level:"medium", key:"ia_compat", title:"Operador NON sin DE-ACTIO complementario", desc:"El operador NON (umbral de exclusión posicional) es más efectivo cuando se combina con DE-ACTIO (retorno separativo) para cubrir tanto la prohibición como sus consecuencias.", law:"PHENOMENON Bloque II §6 — Superimposición IA", tab:null });

  if (!clauses.includes("fuerza mayor") && !clauses.includes("force majeure") && !clauses.includes("caso fortuito"))
    risks.push({ level:"medium", key:"force_majeure", title:"Sin cláusula de fuerza mayor", desc:"La ausencia de cláusula expresa de fuerza mayor deja las partes sujetas únicamente al art. 1.105 CC, que puede no cubrir todos los supuestos relevantes (pandemias, sanciones, cyberataques).", law:"Art. 1.105 CC · Rebus sic stantibus", tab:null });

  if (isMaster && !terms.contractObject?.trim())
    risks.push({ level:"medium", key:"object", title:"Objeto del contrato no definido", desc:"Sin definición clara del objeto, el contrato puede considerarse indeterminado. El art. 1.261 CC exige objeto cierto como requisito de validez.", law:"Art. 1.261 CC · Art. 1.273 CC", tab:"campos", field:"contractObject" });

  if (isLandSaleTemplate && terms.urbanisticConditionType?.includes("Obligación de resultado garantizada")) {
    risks.push({
      level:"medium",
      key:"condicion_no_garantizada",
      title:"Condición urbanística tratada como obligación garantizada",
      desc:"El caso base distingue la condición urbanística de la prestación accesoria. El vendedor puede asumir cuotas o deberes de prosecución sin garantizar ontológicamente que el terreno llegue a ser solar.",
      law:"Art. 1255 CC · Caso Compraventa Terreno §3 y §4",
      tab:"campos",
      field:"urbanisticConditionType",
    });
  }

  if (isLandSaleTemplate && terms.registryDiffusionRole?.includes("garantiza por sí sola la traditio real")) {
    risks.push({
      level:"medium",
      key:"registro_difusion_no_legitima",
      title:"La inscripción registral no sustituye la traditio real",
      desc:"El Registro difunde configuraciones documentales y bienes, pero no crea por sí solo legitimidad real ni prueba una traditio consumada. Evite tratar la inscripción como garantía suficiente de entrega real.",
      law:"Art. 1462 CC · Caso Compraventa Terreno §7",
      tab:"campos",
      field:"registryDiffusionRole",
    });
  }

  // ── LOW / INFORMATIONAL ───────────────────────────────────────────────────
  if (isMaster && !subContracts.some(s=>s.type==="NDA") && hasPersonalData)
    risks.push({ level:"low", key:"nda_missing", title:"Sin Acuerdo de Confidencialidad (NDA)", desc:"El contrato involucra información potencialmente sensible pero no tiene NDA. Considerar si los niveles de confidencialidad están adecuadamente cubiertos en el contrato marco.", law:"Ley 1/2019 de Secretos Empresariales", tab:null });

  if (!isNaN(baseAmount) && baseAmount > 100000 && !terms.guaranteeType?.trim() && !subContracts.some(s=>s.type==="HIPOTECA_GARANTIA"))
    risks.push({ level:"low", key:"guarantee", title:`Contrato de alto valor (€${baseAmount.toLocaleString()}) sin garantía específica`, desc:"Para contratos de importe elevado, considerar garantías adicionales: aval bancario, seguro de caución, retención de parte del precio, o hipoteca.", law:"Art. 1.255 CC · Ley de Garantías", tab:null });

  if (isMaster && !subContracts.some(s=>s.type==="SLA") && clauses.includes("servicio"))
    risks.push({ level:"low", key:"sla_missing", title:"Contrato de servicios sin Acuerdo de Nivel de Servicio (SLA)", desc:"El contrato menciona servicios pero no tiene SLA. Sin KPIs y penalizaciones definidas, el nivel de servicio queda indeterminado.", law:"Art. 1.091 CC", tab:null });

  if (contract.opus?.homologation === "PENDING")
    risks.push({ level:"low", key:"homo_pending", title:"Homologación PHENOMENON pendiente de verificación", desc:"El contrato no ha sido verificado por el motor PHENOMENON. Ejecutar '⊙ Verificar todos' para obtener el análisis estructural completo.", law:"PHENOMENON Engine · Bloque IV Opus", tab:null });

  if (isLandSaleTemplate) {
    risks.push({
      level:"info",
      key:"traditio_vs_escritura",
      title:"Traditio real e instrumental no son equivalentes",
      desc:"El artículo 1462 CC permite que la escritura opere como instrumento bastante de traditio, pero no convierte automáticamente la escritura ni la inscripción en traditio real consumada.",
      law:"Art. 1462 CC · Caso Compraventa Terreno §8",
      tab:"campos",
      field:"tradicionType",
    });
  }

  // ── KPMG-specific risks (Arrendamiento de Cosa Futura + Circumcontrato CA2) ─
  const isKPMGType = isMaster && (subContracts.some(s=>s.type==="FINANCIACION") || terms.templateKey === "KPMG");

  if (isKPMGType) {
    // Cosa futura deadline risk
    const constructionTarget = ess.constructionTarget || terms.constructionTarget;
    if (constructionTarget) {
      const daysToCompletion = Math.floor((new Date(constructionTarget) - new Date()) / 86400000);
      if (daysToCompletion < 0)
        risks.push({ level:"high", key:"cosa_futura_vencida", title:"⏰ Plazo de obra VENCIDO — Cosa futura sin entregar", desc:`El plazo límite de finalización de obra (${constructionTarget}) ha vencido. El arrendamiento de cosa futura puede resolverse. Art. 1.461 CC: si la cosa no existe, el contrato puede quedar sin efecto.`, law:"Art. 1.461 CC · Art. 1.101 CC · Art. 1.554 CC", tab:"campos", field:"constructionTarget" });
      else if (daysToCompletion < 180)
        risks.push({ level:"medium", key:"cosa_futura_urgente", title:`⏳ Obra a ${daysToCompletion} días del plazo límite`, desc:`La edificación debe entregarse antes del ${constructionTarget}. Con menos de 6 meses, iniciar gestión de riesgos constructivos y prever posible extensión de plazo.`, law:"Art. 1.461 CC · Art. 1.105 CC (fuerza mayor)", tab:"campos", field:"constructionTarget" });
    }

    // EURIBOR sensitivity risk
    const euriborRate = parseFloat(terms.euriborRate || "0");
    const spread = parseFloat(terms.spread || "2");
    const totalRate = euriborRate + spread;
    if (totalRate > 7)
      risks.push({ level:"high", key:"euribor_critico", title:`⚠ Tipo total CRÍTICO: ${totalRate.toFixed(2)}% (EURIBOR ${euriborRate}% + spread ${spread}%)`, desc:`Con un tipo total del ${totalRate.toFixed(2)}%, la cuota mensual puede exceder la renta de la cesión de crédito, generando déficit de cobertura. Riesgo de impago del circumcontrato.`, law:"Art. 1.544 CC · Circumcontrato CA2 · Art. 1.911 CC", tab:"campos", field:"euriborRate" });
    else if (totalRate > 5.5)
      risks.push({ level:"medium", key:"euribor_elevado", title:`Tipo de interés elevado: ${totalRate.toFixed(2)}% total`, desc:`El tipo actual (${totalRate.toFixed(2)}%) reduce el margen de cobertura de la cesión de crédito. Monitorizar EURIBOR y revisar cláusula de revisión anual.`, law:"Art. 1.544 CC · Circumcontrato CA2", tab:"campos", field:"euriborRate" });

    // Hipoteca registration pending
    const hipoteca = subContracts.find(s => s.type === "HIPOTECA_GARANTIA");
    if (hipoteca && hipoteca.opus?.homologation !== "VALID")
      risks.push({ level:"medium", key:"hipoteca_no_inscrita", title:"Hipoteca pendiente de inscripción — No es oponible", desc:"La hipoteca sobre la edificación futura aún no está inscrita en el Registro de la Propiedad. Sin inscripción, no es oponible erga omnes y el banco no goza de preferencia frente a terceros acreedores.", law:"Art. 1.875 CC · Art. 110 LH · AJD 1.5% (€1.950.000)", tab:null });

    // Cesión not notified
    const cesion = subContracts.find(s => s.type === "CESION_CREDITO");
    if (cesion) {
      const cesTerms = cesion.ag?.terms ?? {};
      if (!cesTerms.oponibilidadCesion?.includes("enviada"))
        risks.push({ level:"medium", key:"cesion_no_notificada", title:"Cesión de crédito sin notificar al deudor cedido", desc:"La cesión de rentas no ha sido notificada fehacientemente a Gestión Hotelera Costa Levante S.L. Sin notificación, el deudor cedido puede seguir pagando válidamente al cedente original (Art. 1.527 CC).", law:"Art. 1.527 CC · Notificación fehaciente", tab:null });
    }

    // CA2 IF link check
    const financiacion = subContracts.find(s => s.type === "FINANCIACION");
    if (financiacion) {
      const finTerms = financiacion.ag?.terms ?? {};
      if (!finTerms.linkedToLease?.includes("IF link"))
        risks.push({ level:"medium", key:"ca2_if_sin_vincular", title:"Circumcontrato CA2 sin vínculo IF explícito al F principal", desc:"El circumcontrato de financiación no especifica su extinción automática vinculada al arrendamiento principal. PHENOMENON requiere que el CA2 quede vinculado IF al fenómeno principal (Bloque II).", law:"PHENOMENON Bloque II CA2 · Art. 1.544 CC", tab:"campos", field:"linkedToLease" });
    }

    // AJD tax not provisioned
    if (!terms.ajdAmount && subContracts.some(s=>s.type==="HIPOTECA_GARANTIA"))
      risks.push({ level:"low", key:"ajd_sin_prever", title:"AJD hipotecario no cuantificado (est. €1.950.000)", desc:"La constitución de hipoteca sobre €130M de responsabilidad hipotecaria devengará AJD al 1,5% en la Comunitat Valenciana ≈ €1.950.000. Debe presupuestarse y provisionarse antes del otorgamiento notarial.", law:"Ley 22/2009 · DL 62/2017 Comunitat Valenciana · IAJD", tab:null });
  }

  return risks;
}

export function getRiskLevel(risks) {
  if (!risks?.length) return "none";
  if (risks.some(r=>r.level==="high")) return "high";
  if (risks.some(r=>r.level==="medium")) return "medium";
  if (risks.some(r=>r.level==="low")) return "low";
  if (risks.some(r=>r.level==="info")) return "info";
  return "low";
}

export const RISK_COLORS = { high: C.red, medium: C.orange, low: C.green, none: C.green, info: C.blue };
export const RISK_ICONS  = { high: "🔴", medium: "🟡", low: "🟢", none: "✅", info: "ℹ️" };

// ─── Risk display component ───────────────────────────────────────────────────

export default function RiskPanel({ contract, subContracts, allContracts, onNavigate }) {
  const risks = detectRisks(contract, subContracts, allContracts);
  const level = getRiskLevel(risks);

  const high   = risks.filter(r=>r.level==="high");
  const medium = risks.filter(r=>r.level==="medium");
  const low    = risks.filter(r=>r.level==="low");
  const info   = risks.filter(r=>r.level==="info");

  return (
    <div style={{ fontFamily: font.ui }}>
      {/* Summary header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:10, marginBottom:16, background: level==="high"?C.redBg:level==="medium"?C.orangeBg:level==="info"?C.blueBg:C.greenBg, border:`1px solid ${RISK_COLORS[level]}30` }}>
        <div style={{ fontSize:32 }}>{RISK_ICONS[level]}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:RISK_COLORS[level] }}>
            {level==="none"?"Sin riesgos detectados":level==="high"?`${high.length} riesgo${high.length!==1?"s":""} ALTO${high.length!==1?"S":""}`:level==="medium"?`${medium.length} riesgo${medium.length!==1?"s":""} medio${medium.length!==1?"s":""}`:level==="low"?"Riesgos menores detectados":level==="info"?"Contexto jurídico relevante detectado":""}
          </div>
          <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
            {risks.length} issue{risks.length!==1?"s":""} detectados · Motor PHENOMENON + Derecho Español
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:11, color:C.textMuted, fontFamily:font.mono }}>
            {high.length} Alto · {medium.length} Medio · {low.length} Bajo · {info.length} Info
          </div>
        </div>
      </div>

      {risks.length === 0 && (
        <div style={{ padding:"20px", textAlign:"center", color:C.textMuted, fontSize:12, background:C.greenBg, borderRadius:10, border:`1px solid ${C.green}30` }}>
          ✅ Sin riesgos detectados. El contrato cumple los requisitos básicos bajo derecho español y el motor PHENOMENON.
        </div>
      )}

      {/* Risk groups */}
      {[["🔴 Riesgos Altos — Acción Inmediata Requerida", high, C.red],
        ["🟡 Riesgos Medios — Revisar y Resolver", medium, C.orange],
        ["🟢 Riesgos Menores — Considerar", low, C.green],
        ["ℹ️ Contexto Jurídico — Marco Interpretativo", info, C.blue]].map(([title, group, color]) =>
        group.length > 0 && (
          <div key={title} style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:font.ui, marginBottom:8 }}>{title}</div>
            {group.map(risk => (
              <div key={risk.key}
                onClick={() => risk.tab && onNavigate(risk.tab, risk.field)}
                style={{ padding:"12px 14px", background:C.white, border:`1px solid ${color}30`, borderLeft:`4px solid ${color}`, borderRadius:8, marginBottom:8, cursor:risk.tab?"pointer":"default", transition:"box-shadow 0.15s" }}
                onMouseEnter={e=>{ if(risk.tab) e.currentTarget.style.boxShadow=`0 2px 8px ${color}20`; }}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:5 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.textDark }}>{risk.title}</div>
                  {risk.tab && <span style={{ fontSize:10, color, fontFamily:font.mono, flexShrink:0 }}>Ir al campo →</span>}
                </div>
                <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.6, marginBottom:5 }}>{risk.desc}</div>
                <div style={{ fontSize:9, color:color, fontFamily:font.mono, background:`${color}10`, padding:"1px 6px", borderRadius:3, display:"inline-block" }}>{risk.law}</div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Compliance footer */}
      <div style={{ padding:"10px 12px", background:C.bgAlt, borderRadius:8, border:`1px solid ${C.border}`, fontSize:10, color:C.textMuted, lineHeight:1.6 }}>
        Análisis basado en: Código Civil · Ley 3/2004 · RGPD + LOPDGDD · Ley 1/2019 · RDL 1/1996 · Motor PHENOMENON v2.2
      </div>
    </div>
  );
}
