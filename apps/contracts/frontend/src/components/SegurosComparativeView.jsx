import { useState, useEffect, useCallback, useRef } from "react";
import {
  C, font,
  INSURANCE_POLICY_CONFIG, INSURANCE_TEMPLATE_KEYS,
  CROSS_POLICY_IF_EDGES, SUB_META, statusColor, statusLabel,
  PHENOMENON_III_ENABLED, PHENOMENON_PHASE_CFG, F2_NEGACIONES,
} from "../constants.js";
import * as api from "../api/phenomenon.js";

// ─── Phenomenological CA type map (Flujograma § 6) ──────────────────────────
// CA-CD: displaces/gates the flow (excludes, thresholds)
// CA-CST: sustains/stabilises the flow (premiums, coverage, assessments)
const CA_TYPE_MAP = {
  COBERTURA_VIDA:       "CA-CST",
  COBERTURA_RC:         "CA-CST",
  COBERTURA_DANOS:      "CA-CST",
  COBERTURA_CREDITO:    "CA-CST",
  EXCLUSIONES_VIDA:     "CA-CD",
  EXCLUSIONES_DANOS:    "CA-CD",
  PRIMA_VIDA:           "CA-CST",
  LIMITES_RC:           "CA-CST",
  FRANQUICIA_RC:        "CA-CD",
  PERITACION:           "CA-CST",
  VALIDACION_FINANCIERA:"CA-CD",
  RIESGO_EMPRESARIAL:   "CA-CST",
};

function getPhase(contract) {
  const stored = contract?.ag?.terms?.phenomenological_phase;
  if (stored) return stored;
  const s = contract?.status;
  if (s === "SINIESTRO_PENDIENTE") return "SINIESTRO";
  if (s === "INDEMNIZACION_PAGADA") return "INDEMNIZACION";
  if (s === "RECHAZO")             return "RECHAZO";
  if (contract?.type?.startsWith("COBERTURA_") && s === "ACTIVE") return "COBERTURA_ACTIVA";
  return "SA1";
}

const PHASE_CFG = {
  SA1:              { label:"SA1",           color:"#6B7280", bg:"#F3F4F6" },
  COBERTURA_ACTIVA: { label:"COBERTURA",     color:"#059669", bg:"#ECFDF5" },
  SINIESTRO:        { label:"SINIESTRO ⚡",  color:"#D97706", bg:"#FFFBEB" },
  HIPOTESIS:        { label:"HIPÓTESIS",     color:"#7C3AED", bg:"#F5F3FF" },
  INDEMNIZACION:    { label:"INDEMNIZACIÓN", color:"#2563EB", bg:"#EFF6FF" },
  RECHAZO:          { label:"RECHAZADO",     color:"#DC2626", bg:"#FEF2F2" },
};

// ─── Policy build order ───────────────────────────────────────────────────────
const POLICY_ORDER = [
  "SEGURO_VIDA",
  "SEGURO_RC",
  "SEGURO_DANOS",
  "SEGURO_CREDITO_COMERCIAL",
];

// ─── Required fields for live local validation ────────────────────────────────
const VALIDATION_RULES = {
  SEGURO_VIDA: {
    master: [
      { key: "insuredName",      label: "Nombre del asegurado" },
      { key: "capitalDeceso",    label: "Capital — fallecimiento (€)" },
      { key: "capitalInvalidez", label: "Capital — invalidez (€)" },
      { key: "primaAnual",       label: "Prima anual (€)" },
      { key: "beneficiaries",    label: "Beneficiarios designados" },
      { key: "coverageType",     label: "Modalidad de cobertura" },
      { key: "medicalValidation",label: "Declaración de salud" },
      { key: "insuredAge",       label: "Edad del asegurado" },
    ],
    COBERTURA_VIDA:   [{ key:"coverageCapital",  label:"Capital activo (€)" }, { key:"coverageStatus", label:"Estado de la cobertura" }],
    EXCLUSIONES_VIDA: [{ key:"blockingStatus",   label:"Estado exclusiones" }, { key:"preExistingConditions", label:"Condiciones preexistentes" }],
    PRIMA_VIDA:       [{ key:"annualPremium",    label:"Prima (sub-contrato)" }, { key:"paymentFrequency", label:"Frecuencia de pago" }],
  },
  SEGURO_RC: {
    master: [
      { key: "activityInsured",      label: "Actividad asegurada" },
      { key: "coverageLimit",        label: "Límite por siniestro (€)" },
      { key: "annualAggregateLimit", label: "Límite agregado anual (€)" },
      { key: "franquicia",           label: "Franquicia (€)" },
      { key: "primaAnual",           label: "Prima anual (€)" },
      { key: "rcType",               label: "Tipo de RC" },
    ],
    COBERTURA_RC:  [{ key:"coverageLimit", label:"Límite cobertura RC" }, { key:"coverageStatus", label:"Estado cobertura" }, { key:"retroactiveCoverage", label:"Retroactividad" }, { key:"claimBasis", label:"Base reclamación" }],
    LIMITES_RC:    [{ key:"perClaimLimit", label:"Límite por siniestro" }, { key:"perPersonLimit", label:"Límite por persona" }],
    FRANQUICIA_RC: [{ key:"deductibleAmount", label:"Importe franquicia (€)" }, { key:"deductibleType", label:"Tipo franquicia" }],
  },
  SEGURO_DANOS: {
    master: [
      { key: "propertyDescription", label: "Descripción del bien asegurado" },
      { key: "propertyValue",        label: "Valor del bien (€)" },
      { key: "coverageRisks",        label: "Riesgos cubiertos" },
      { key: "primaAnual",           label: "Prima anual (€)" },
      { key: "deductible",           label: "Franquicia (%)" },
      { key: "peritacionMethod",     label: "Método de peritación" },
    ],
    COBERTURA_DANOS:  [{ key:"insuredValue", label:"Valor asegurado (€)" }, { key:"coverageStatus", label:"Estado cobertura" }],
    PERITACION:       [{ key:"peritacionStatus", label:"Estado peritación" }],
    EXCLUSIONES_DANOS:[{ key:"excludedRisks", label:"Riesgos excluidos" }, { key:"blockingExclusion", label:"Exclusión bloquea cobertura" }],
  },
  SEGURO_CREDITO_COMERCIAL: {
    master: [
      { key: "debtorName",          label: "Nombre del deudor" },
      { key: "creditLimit",         label: "Límite de crédito (€)" },
      { key: "indemnityPct",        label: "% de indemnización" },
      { key: "primaAnual",          label: "Prima anual (€)" },
      { key: "waitingPeriod",       label: "Período de espera (meses)" },
      { key: "financialValidation", label: "Validación financiera" },
    ],
    COBERTURA_CREDITO:       [{ key:"coveredDebtors", label:"Deudores cubiertos" }, { key:"coverageStatus", label:"Estado cobertura" }],
    VALIDACION_FINANCIERA:   [{ key:"financialRating", label:"Rating financiero" }, { key:"validationPending", label:"¿Validación pendiente?" }],
    RIESGO_EMPRESARIAL:      [{ key:"riskCategory", label:"Categoría de riesgo" }, { key:"paymentHistory", label:"Historial de pagos" }],
  },
};

function computeValidation(master, subs, templateKey) {
  const rules = VALIDATION_RULES[templateKey];
  if (!rules || !master) return { total: 0, filled: 0, errors: [], score: 0 };
  const errors = [];
  let total = 0, filled = 0;
  const masterTerms = master.ag?.terms ?? {};
  (rules.master ?? []).forEach(({ key, label }) => {
    total++;
    const val = masterTerms[key];
    const ok  = val && String(val).trim() !== "" && val !== "— seleccionar —";
    if (ok) filled++; else errors.push({ location: "Póliza principal", field: key, label });
  });
  (subs ?? []).forEach(sub => {
    if (!sub) return;
    (rules[sub.type] ?? []).forEach(({ key, label }) => {
      total++;
      const val = (sub.ag?.terms ?? {})[key];
      const ok  = val && String(val).trim() !== "" && val !== "— seleccionar —";
      if (ok) filled++; else errors.push({ location: SUB_META[sub.type]?.label ?? sub.type, field: key, label });
    });
  });
  return { total, filled, errors, score: total > 0 ? Math.round((filled / total) * 100) : 0 };
}

// ─── Shared currency formatter — used by PhenomenonIIIPanel and SiniestroWizard ──
const fmtEur = (v) => {
  const n = parseFloat(v || 0);
  return n > 0 ? n.toLocaleString("es-ES", { style:"currency", currency:"EUR", maximumFractionDigits:0 }) : "—";
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function StatusDot({ status, size = 7 }) {
  const col = statusColor(status);
  return (
    <span style={{ position:"relative", display:"inline-block", width:size, height:size }}>
      <span style={{ display:"block", width:size, height:size, borderRadius:"50%", background:col,
        animation:["ACTIVE","SINIESTRO_PENDIENTE","BLOCKED"].includes(status)?"statusPing 2s ease-out infinite":"none"
      }} />
    </span>
  );
}

// ─── Radial progress circle ───────────────────────────────────────────────────
function ScoreRing({ score, color, size = 44 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}22`} strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition:"stroke-dasharray 0.5s ease" }}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fontSize={10} fontWeight={700} fill={color}
        style={{ transform:"rotate(90deg)", transformOrigin:`${size/2}px ${size/2}px` }}>
        {score}%
      </text>
    </svg>
  );
}

// ─── Checklist row ────────────────────────────────────────────────────────────
function CheckRow({ ok, label, location, animate }) {
  return (
    <div style={{
      display:"flex", alignItems:"flex-start", gap:7, padding:"4px 0",
      animation: animate ? "checkFlip 0.3s ease-out" : "none",
    }}>
      <span style={{
        fontSize:10, fontWeight:700, width:16, height:16,
        borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
        background: ok ? `${C.green}18` : `${C.red}15`,
        color: ok ? C.green : "#EF4444",
        border: `1.5px solid ${ok ? C.green+"50" : "#EF444450"}`,
        flexShrink:0, marginTop:1,
      }}>
        {ok ? "✓" : "✗"}
      </span>
      <span style={{ fontSize:10, color: ok ? C.textMuted : "#374151", fontFamily:font.ui, flex:1, lineHeight:1.4 }}>
        {location !== "Póliza principal" && (
          <span style={{ color:C.textLight, marginRight:3, fontSize:9 }}>{location} ·</span>
        )}
        {label}
      </span>
    </div>
  );
}

// ─── PHENOMENON III — F1/F2/F3 phase bar ─────────────────────────────────────
function PhenomenonIIIPhaseBar({ policyLabel, hasSiniestro, onOpenPanel = null }) {
  const f1 = PHENOMENON_PHASE_CFG.F1;
  const f2 = PHENOMENON_PHASE_CFG.F2;
  const f3 = PHENOMENON_PHASE_CFG.F3;
  const f2Active = hasSiniestro;

  return (
    <div style={{
      margin:"10px 0 6px",
      borderRadius:10,
      border:`2px solid ${C.gold}60`,
      background:C.goldBg,
      overflow:"hidden",
    }}>
      {/* Title bar */}
      <div style={{
        background:`linear-gradient(135deg, ${C.navy} 0%, #1E3A5F 100%)`,
        padding:"8px 12px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:14 }}>◈</span>
          <span style={{ fontSize:11, fontWeight:800, color:C.white, fontFamily:font.ui, letterSpacing:"0.04em" }}>
            PHENOMENON III
          </span>
          <span style={{ fontSize:10, color:`${C.white}99`, fontFamily:font.ui }}>
            Estructura fenomenológica del seguro
          </span>
        </div>
        {f2Active && (
          <span style={{ fontSize:10, fontWeight:700, color:"#FCD34D", fontFamily:font.mono,
            background:"rgba(0,0,0,0.3)", padding:"2px 8px", borderRadius:10,
            border:"1px solid #FCD34D60" }}>
            ⚡ F2 activo
          </span>
        )}
      </div>

      {/* Phase chain + fractalization in one compact row */}
      <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>

        {/* F1 → F2 ⤳ F3 */}
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>

          {/* F1 */}
          <div style={{
            flex:1, padding:"7px 6px", borderRadius:7, textAlign:"center",
            background:`${f1.color}15`, border:`2px solid ${f1.color}`,
          }}>
            <div style={{ fontSize:14, fontWeight:900, color:f1.color, fontFamily:font.mono, lineHeight:1 }}>F1</div>
            <div style={{ fontSize:10, fontWeight:700, color:C.textDark, fontFamily:font.ui, marginTop:2 }}>Cobertura</div>
            <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.ui, marginTop:1 }}>Art. 1089 CC</div>
          </div>

          <span style={{ fontSize:13, color: f2Active ? f2.color : C.textLight, fontWeight:700, flexShrink:0 }}>
            {f2Active ? "⚡" : "→"}
          </span>

          {/* F2 */}
          <div style={{
            flex:1, padding:"7px 6px", borderRadius:7, textAlign:"center",
            background: f2Active ? `${f2.color}15` : C.bgAlt,
            border:`2px ${f2Active ? "solid" : "dashed"} ${f2Active ? f2.color : C.border}`,
            opacity: f2Active ? 1 : 0.65,
          }}>
            <div style={{ fontSize:14, fontWeight:900, color: f2Active ? f2.color : C.textMuted, fontFamily:font.mono, lineHeight:1 }}>F2</div>
            <div style={{ fontSize:10, fontWeight:700, color:C.textDark, fontFamily:font.ui, marginTop:2 }}>
              {f2Active ? "Indemnización" : "Siniestro"}
            </div>
            <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.ui, marginTop:1 }}>
              {f2Active ? "activo" : "latente"}
            </div>
          </div>

          <span style={{ fontSize:13, color:C.textLight, fontWeight:700, flexShrink:0 }}>⤳</span>

          {/* F3 */}
          <div style={{
            flex:1, padding:"7px 6px", borderRadius:7, textAlign:"center",
            background:`${f3.color}10`, border:`2px dashed ${f3.color}70`,
            opacity:0.75,
          }}>
            <div style={{ fontSize:14, fontWeight:900, color:f3.color, fontFamily:font.mono, lineHeight:1 }}>F3</div>
            <div style={{ fontSize:10, fontWeight:700, color:C.textDark, fontFamily:font.ui, marginTop:2 }}>Reclamación</div>
            <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.ui, marginTop:1 }}>eventual</div>
          </div>
        </div>

        {/* Fractalization + F2 negations in one row */}
        <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
          {[
            { label:"P1.1–P1.5", color:"#2563EB" },
            { label:"P2.1–P2.5", color:"#D97706" },
            { label:"P3.1–P3.5", color:"#7C3AED" },
          ].map(({ label, color }) => (
            <button key={label} onClick={onOpenPanel || undefined} style={{
              fontSize:10, fontWeight:800, color, fontFamily:font.mono,
              padding:"2px 8px", borderRadius:12,
              background:`${color}12`, border:`1.5px solid ${color}50`,
              cursor: onOpenPanel ? "pointer" : "default",
            }}>
              {label}
            </button>
          ))}
          <span style={{ fontSize:9, color:C.textMuted, fontFamily:font.ui }}>fractalización</span>
          {f2Active && F2_NEGACIONES.map(n => (
            <span key={n.id} style={{
              fontSize:9, fontFamily:font.mono, padding:"2px 6px",
              borderRadius:5, background:`${C.red}10`, color:C.red,
              border:`1px solid ${C.red}35`, fontWeight:700,
            }}>
              {n.label}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── Circular meter gauge ─────────────────────────────────────────────────────
function CircularMeter({ label, value, icon, pct, color, onClick, active }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(Math.max(pct, 0), 100) / 100;
  const vStr = String(value);
  const display = vStr.length > 10 ? vStr.slice(0, 9) + "…" : vStr;
  const vSize = display.length <= 3 ? 16 : display.length <= 5 ? 13 : display.length <= 8 ? 11 : 9;
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 4, padding: "6px 4px", borderRadius: 8,
        flex: "1 1 0", minWidth: 0, transition: "background 0.15s",
        background: active ? `${color}18` : "transparent",
        border: active ? `1.5px solid ${color}60` : "1.5px solid transparent",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${color}10`; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <svg width={84} height={84} viewBox="0 0 84 84">
        <circle cx={42} cy={42} r={r} fill="none" stroke={`${color}20`} strokeWidth={6} />
        <circle cx={42} cy={42} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 42 42)"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
        <text x={42} y={42} textAnchor="middle" dominantBaseline="middle"
          fontSize={vSize} fontWeight={800} fill={color} fontFamily="monospace">{display}</text>
      </svg>
      <div style={{ display:"flex", alignItems:"center", gap:3, justifyContent:"center" }}>
        <span style={{ fontSize:12, lineHeight:1 }}>{icon}</span>
        <span style={{ fontSize:9.5, color:C.textBody, fontFamily:font.ui,
          textAlign:"center", lineHeight:1.2, maxWidth:72 }}>{label}</span>
      </div>
    </div>
  );
}

// ─── Phase detail data builder ────────────────────────────────────────────────
function buildPhaseDetails({ policies, hasSiniestro, indemnizacionPagada,
  totalPremium, totalCoverage, totalDamage, totalIndemnizacion, riskLevel }) {
  return {
    F1: {
      color:"#2563EB",
      title:"F1 — Aseguramiento y Cobertura",
      liveValues:[
        { label:"Prima total anual",   value: fmtEur(totalPremium),     icon:"💶", pct: totalCoverage > 0 ? Math.min(totalPremium / totalCoverage * 100, 100) : (totalPremium > 0 ? 100 : 0),
          detail:[
            { k:"Importe anual",       v: fmtEur(totalPremium) },
            { k:"Prima media/póliza",  v: policies.length > 0 ? fmtEur(totalPremium / policies.length) : "—" },
            { k:"Tasa s/cobertura",    v: totalCoverage > 0 ? (totalPremium / totalCoverage * 100).toFixed(2) + "%" : "—" },
            { k:"Origen",              v: "Suma de primas contratadas" },
          ],
        },
        { label:"Cobertura total",     value: fmtEur(totalCoverage),    icon:"🛡",  pct: totalCoverage > 0 ? 100 : 0,
          detail:[
            { k:"Capital asegurado",   v: fmtEur(totalCoverage) },
            { k:"Franquicia",          v: "5% del siniestro" },
            { k:"Infraseguro",         v: "Proporcional" },
            { k:"Estado",              v: totalCoverage > 0 ? "Cobertura vigente" : "Sin cobertura" },
          ],
        },
        { label:"Pólizas activas",     value: `${policies.length} / 4`, icon:"◉",  pct: policies.length / 4 * 100,
          detail:[
            { k:"Activas",             v: `${policies.length} de 4` },
            { k:"F1 Cobertura",        v: policies.length > 0 ? "✓ Activa" : "—" },
            { k:"F2 Siniestro",        v: hasSiniestro ? "⚡ Activo" : "Latente" },
            { k:"F3 Reclamación",      v: indemnizacionPagada ? "⤳ Activada" : "Eventual" },
          ],
        },
        { label:"Nivel de riesgo",     value: `${riskLevel}%`,          icon:"⚠",  pct: riskLevel,
          detail:[
            { k:"Índice",              v: `${riskLevel}%` },
            { k:"Categoría",           v: riskLevel < 25 ? "Bajo ✓" : riskLevel < 60 ? "Medio ⚠" : "Alto ⚡" },
            { k:"Siniestros activos",  v: hasSiniestro ? "1" : "0" },
            { k:"Pólizas expuestas",   v: `${policies.length}` },
          ],
        },
      ],
      subtypes:[
        { code:"P1.1", name:"Bien principal",   active: policies.some(p => p.key === "SEGURO_DANOS") },
        { code:"P1.2", name:"Responsabilidad",  active: policies.some(p => p.key === "SEGURO_RC") },
        { code:"P1.3", name:"Carga/mercancía",  active: false },
        { code:"P1.4", name:"Daño siguiente",   active: policies.some(p => p.key === "SEGURO_DANOS") },
        { code:"P1.5", name:"Financiera",       active: policies.some(p => p.key === "SEGURO_CREDITO_COMERCIAL") },
      ],
    },
    F2: {
      color:"#f97316",
      title:"F2 — Siniestro e Indemnización",
      liveValues:[
        { label:"Daño estimado",       value: fmtEur(totalDamage),              icon:"🔥", pct: totalCoverage > 0 ? Math.min(totalDamage / totalCoverage * 100, 100) : (totalDamage > 0 ? 100 : 0),
          detail:[
            { k:"Importe del daño",    v: fmtEur(totalDamage) },
            { k:"% de la cobertura",   v: totalCoverage > 0 ? (totalDamage / totalCoverage * 100).toFixed(1) + "%" : "—" },
            { k:"Estado",              v: totalDamage > 0 ? "Cuantificado" : "Sin daño declarado" },
            { k:"Origen",              v: "Declaración de siniestro" },
          ],
        },
        { label:"Indemnización",       value: fmtEur(totalIndemnizacion),       icon:"✅", pct: totalDamage > 0 ? Math.min(totalIndemnizacion / totalDamage * 100, 100) : 0,
          detail:[
            { k:"Importe aprobado",    v: fmtEur(totalIndemnizacion) },
            { k:"Cobertura del daño",  v: totalDamage > 0 ? (totalIndemnizacion / totalDamage * 100).toFixed(1) + "%" : "—" },
            { k:"Estado de pago",      v: indemnizacionPagada ? "Pagada ✓" : "Pendiente" },
            { k:"Cálculo",             v: "Daño − franquicia" },
          ],
        },
        { label:"Siniestro activo",    value: hasSiniestro ? "SÍ ⚡" : "No",    icon:"⚡", pct: hasSiniestro ? 100 : 0,
          detail:[
            { k:"Estado",              v: hasSiniestro ? "Siniestro declarado" : "Sin siniestro" },
            { k:"Tipo P2.x",           v: hasSiniestro ? "P2.1 Material" : "—" },
            { k:"Cascada desde F1",    v: "Vía IA operator" },
            { k:"Apertura",            v: "Automática" },
          ],
        },
        { label:"Indemniz. pagada",    value: indemnizacionPagada ? "SÍ" : "No", icon:"💳", pct: indemnizacionPagada ? 100 : 0,
          detail:[
            { k:"Pago realizado",      v: indemnizacionPagada ? "Sí" : "No" },
            { k:"Importe pagado",      v: indemnizacionPagada ? fmtEur(totalIndemnizacion) : "—" },
            { k:"Efecto en F3",        v: indemnizacionPagada ? "Activa subrogación" : "Sin efecto" },
            { k:"Operador IA",         v: "de-actio sobre deuda" },
          ],
        },
      ],
      subtypes:[
        { code:"P2.1", name:"Siniestro material",  active: hasSiniestro },
        { code:"P2.2", name:"Daño emergente",      active: totalDamage > 0 },
        { code:"P2.3", name:"Daño siguiente",      active: false },
        { code:"P2.4", name:"Interrupción operativa", active: false },
        { code:"P2.5", name:"Reclamaciones cruzadas", active: false },
      ],
    },
    F3: {
      color:"#7c3aed",
      title:"F3 — Reclamación Posterior",
      liveValues:[
        { label:"Reclamación abierta", value: "No (automática)",                                     icon:"⤳", pct: 0,
          detail:[
            { k:"Tipo",                v: "Automática (no manual)" },
            { k:"Condición",           v: "Indemnización pagada" },
            { k:"Activada ahora",      v: indemnizacionPagada ? "Sí" : "No" },
            { k:"Acción",              v: "Subrogación por pago" },
          ],
        },
        { label:"Base legal",          value: "Art. 1902 CC",                                        icon:"⚖",  pct: 100,
          detail:[
            { k:"Artículo",            v: "Art. 1902 CC" },
            { k:"Régimen",             v: "Resp. extracontractual" },
            { k:"Acción",              v: "Repetición vs culpable" },
            { k:"Prescripción",        v: "1 año desde el pago" },
          ],
        },
        { label:"Tipo principal",      value: "P3.1 Causante directo",                               icon:"👤", pct: 100,
          detail:[
            { k:"Tipo activo",         v: "P3.1 Causante directo" },
            { k:"Definición",          v: "Responsable del daño" },
            { k:"Legitimado",          v: "Asegurador (subrogado)" },
            { k:"Otros tipos",         v: "P3.2–P3.5 inactivos" },
          ],
        },
        { label:"Recuperabilidad",     value: indemnizacionPagada ? fmtEur(totalIndemnizacion) : "—", icon:"↩", pct: indemnizacionPagada ? 100 : 0,
          detail:[
            { k:"Importe recuperable", v: indemnizacionPagada ? fmtEur(totalIndemnizacion) : "—" },
            { k:"Condición",           v: indemnizacionPagada ? "Pagada" : "Pendiente pago" },
            { k:"Acción legal",        v: indemnizacionPagada ? "Demanda preparada" : "—" },
            { k:"Estimación recupero", v: indemnizacionPagada ? "60–80% del daño" : "—" },
          ],
        },
      ],
      subtypes:[
        { code:"P3.1", name:"Causante directo",    active: indemnizacionPagada },
        { code:"P3.2", name:"Operador/transportista", active: false },
        { code:"P3.3", name:"Contractual",         active: false },
        { code:"P3.4", name:"Extracontractual",    active: false },
        { code:"P3.5", name:"Entre aseguradoras",  active: false },
      ],
    },
  };
}

/**
 * Interactive F1/F2/F3 flow graph for the PHENOMENON III panel.
 */
function PhenomenonIIIFlowGraph({ policies, hasSiniestro, indemnizacionPagada,
  totalPremium, totalCoverage, totalDamage, totalIndemnizacion, riskLevel }) {

  const [activePhase, setActivePhase] = useState(null); // null | "F1" | "F2" | "F3"
  const [activeMetric, setActiveMetric] = useState(null); // null | { phase, label }

  const PHASE_DETAILS = buildPhaseDetails({ policies, hasSiniestro, indemnizacionPagada,
    totalPremium, totalCoverage, totalDamage, totalIndemnizacion, riskLevel });

  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
        letterSpacing:"0.06em", marginBottom:12 }}>
        Flujómetro en vivo — clic en un plano para ver sub-tipos
      </div>

      {/* ── Phase map ── */}
      <div style={{ display:"flex", alignItems:"stretch", gap:0 }}>

        {["F1","F2","F3"].map((phase, i) => {
          const cfg    = PHASE_DETAILS[phase];
          const isAct  = activePhase === phase;
          const isF2   = phase === "F2";
          const isF3   = phase === "F3";
          const dimmed = (isF2 && !hasSiniestro) || isF3;

          return (
            <div key={phase} style={{ display:"flex", alignItems:"stretch", flex:1 }}>

              {/* Arrow connector */}
              {i > 0 && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", padding:"0 8px", flexShrink:0 }}>
                  <span style={{ fontSize:18, color: (i===1 && hasSiniestro) ? "#f97316" : C.textLight,
                    fontWeight:700, lineHeight:1 }}>
                    {i===1 && hasSiniestro ? "⚡" : i===1 ? "→" : "⤳"}
                  </span>
                  <span style={{ fontSize:8, color:C.textMuted, fontFamily:font.mono,
                    whiteSpace:"nowrap", marginTop:2 }}>
                    {i===1 ? "siniestro" : "culpable?"}
                  </span>
                </div>
              )}

              {/* Phase card */}
              <div
                style={{
                  flex:1, borderRadius:12, overflow:"hidden",
                  border:`2.5px ${isF3 ? "dashed" : "solid"} ${isAct ? cfg.color : cfg.color+"55"}`,
                  background: isAct ? `${cfg.color}12` : `${cfg.color}06`,
                  opacity: dimmed && !isAct ? 0.65 : 1,
                  boxShadow: isAct ? `0 6px 24px ${cfg.color}30` : "none",
                  transition:"all 0.2s",
                }}
              >
                {/* Card header — click to expand sub-types */}
                <div
                  onClick={() => { setActivePhase(isAct ? null : phase); setActiveMetric(null); }}
                  style={{
                    background: isAct ? `${cfg.color}25` : `${cfg.color}15`,
                    padding:"10px 12px",
                    borderBottom:`1px solid ${cfg.color}20`,
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    cursor:"pointer",
                  }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:18, fontWeight:900, color:cfg.color,
                      fontFamily:font.mono, lineHeight:1 }}>
                      {phase}
                    </span>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textDark, fontFamily:font.ui }}>
                        {phase==="F1" ? "Cobertura" : phase==="F2" ? (hasSiniestro ? "Siniestro ⚡" : "Siniestro") : "Reclamación"}
                      </div>
                      <div style={{ fontSize:8, color:C.textMuted, fontFamily:font.mono }}>
                        {phase==="F1" ? "siempre activo" : phase==="F2" ? (hasSiniestro ? "activo" : "latente") : "eventual"}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize:11, color: isAct ? cfg.color : C.textMuted, fontFamily:font.mono }}>
                    {isAct ? "▲" : "▼"}
                  </span>
                </div>

                {/* Round meters — 2×2 grid */}
                <div style={{ padding:"10px 8px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                  {cfg.liveValues.map(({ label, value, icon, pct }) => {
                    const isMetricActive = activeMetric?.phase === phase && activeMetric?.label === label;
                    return (
                      <CircularMeter
                        key={label}
                        label={label}
                        value={value}
                        icon={icon}
                        pct={pct}
                        color={cfg.color}
                        active={isMetricActive}
                        onClick={() => setActiveMetric(prev =>
                          prev?.phase === phase && prev?.label === label ? null : { phase, label }
                        )}
                      />
                    );
                  })}
                </div>

                {/* Per-metric detail panel */}
                {activeMetric?.phase === phase && (() => {
                  const mc = cfg.liveValues.find(m => m.label === activeMetric.label);
                  if (!mc?.detail) return null;
                  return (
                    <div style={{
                      margin:"0 8px 8px", borderRadius:8, overflow:"hidden",
                      border:`1.5px solid ${cfg.color}50`,
                      background:`${cfg.color}08`,
                      animation:"fadeSlideIn 0.15s ease-out",
                    }}>
                      <div style={{
                        background:`${cfg.color}20`, padding:"5px 10px",
                        borderBottom:`1px solid ${cfg.color}25`,
                        fontSize:10, fontWeight:700, color:cfg.color, fontFamily:font.ui,
                      }}>
                        {activeMetric.label}
                      </div>
                      <div style={{ padding:"8px 10px", display:"flex", flexDirection:"column", gap:4 }}>
                        {mc.detail.map(({ k, v }) => (
                          <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8 }}>
                            <span style={{ fontSize:9, color:C.textMuted, fontFamily:font.ui }}>{k}</span>
                            <span style={{ fontSize:10.5, fontWeight:700, color:C.textDark, fontFamily:font.mono, textAlign:"right" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Sub-type chips — always visible at bottom of card */}
                <div style={{ padding:"0 12px 10px", display:"flex", gap:3, flexWrap:"wrap" }}>
                  {cfg.subtypes.map(({ code, active }) => (
                    <span key={code} style={{
                      fontSize:8, fontWeight:700, fontFamily:font.mono,
                      padding:"1px 6px", borderRadius:8,
                      background: active ? `${cfg.color}18` : C.bgAlt,
                      color: active ? cfg.color : C.textLight,
                      border:`1px solid ${active ? cfg.color+"50" : C.border}`,
                    }}>
                      {code}{active ? " ✓" : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Expanded sub-type detail ── */}
      {activePhase && (() => {
        const cfg = PHASE_DETAILS[activePhase];
        return (
          <div style={{
            marginTop:10, borderRadius:10,
            border:`2px solid ${cfg.color}`,
            background:`${cfg.color}06`, overflow:"hidden",
            animation:"fadeSlideIn 0.2s ease-out",
          }}>
            <div style={{ background:`${cfg.color}18`, padding:"8px 14px",
              borderBottom:`1px solid ${cfg.color}25`,
              fontSize:11, fontWeight:700, color:cfg.color, fontFamily:font.ui }}>
              {cfg.title} — sub-tipos detallados
            </div>
            <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:6 }}>
              {cfg.subtypes.map(({ code, name, active }) => (
                <div key={code} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 10px",
                  borderRadius:7,
                  background: active ? `${cfg.color}10` : C.bgAlt,
                  border:`1px solid ${active ? cfg.color+"40" : C.border}`,
                  opacity: active ? 1 : 0.55,
                }}>
                  <span style={{ fontSize:11, fontWeight:800, color: active ? cfg.color : C.textLight,
                    fontFamily:font.mono, minWidth:36 }}>{code}</span>
                  <span style={{ fontSize:11, color: active ? C.textDark : C.textMuted,
                    fontFamily:font.ui, flex:1 }}>{name}</span>
                  {active && <span style={{ fontSize:12, color:cfg.color }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── PHENOMENON III — Dedicated information panel ────────────────────────────
/**
 * Full PHENOMENON III information panel: three-plane matrix, live FlowGraph,
 * fractal tree, parametric variables table, and derived products.
 */
function PhenomenonIIIPanel({ onClose, policies = [] }) {

  const PLANES = [
    {
      id:"P1", phase:"F1", label:"Plano P1 / F1 — Aseguramiento y Cobertura",
      color:"#2563EB", borderStyle:"solid",
      principle:"La cobertura no indemniza por sí misma. Prepara la posibilidad de indemnizar.",
      legalBasis:"Prima + Riesgo + OBC → Cobertura vigente",
      types:[
        { code:"P1.1", name:"Bien principal",         desc:"Protege la cosa, nave, instalación o activo central.", law:"Art. 1 LCS" },
        { code:"P1.2", name:"Responsabilidad",         desc:"Protege frente a reclamaciones de terceros por daños causados.", law:"Art. 73 LCS" },
        { code:"P1.3", name:"Carga y mercancía",       desc:"Protege bienes vinculados al activo principal en tránsito o almacén.", law:"Art. 54 LCS" },
        { code:"P1.4", name:"Daño siguiente / interrupción", desc:"Protege consecuencias operativas o económicas derivadas del daño.", law:"Art. 63 LCS" },
        { code:"P1.5", name:"Financiera / paramétrica",desc:"Incorpora variables: riesgo, Euribor, prima, exposición.", law:"Art. 1255 CC" },
      ],
    },
    {
      id:"P2", phase:"F2", label:"Plano P2 / F2 — Siniestro e Indemnización",
      color:"#f97316", borderStyle:"solid",
      principle:"El seguro no paga una deuda ajena. Indemniza una ferencia asegurada actualizada por siniestro.",
      legalBasis:"Cobertura previa + Siniestro cubierto = Ferencia actualizada → Indemnización (Art. 1089 CC)",
      types:[
        { code:"P2.1", name:"Siniestro material directo",  desc:"Actualiza la ferencia principal sobre el bien asegurado.", law:"Art. 38 LCS" },
        { code:"P2.2", name:"Daño emergente",              desc:"Actualiza costes inmediatos de reparación, pérdida o sustitución.", law:"Art. 1106 CC" },
        { code:"P2.3", name:"Daño siguiente",              desc:"Actualiza consecuencias posteriores no idénticas al daño inicial.", law:"Art. 1107 CC" },
        { code:"P2.4", name:"Interrupción operativa",      desc:"Actualiza una ferencia funcional o productiva (pérdida de negocio).", law:"Art. 63 LCS" },
        { code:"P2.5", name:"Reclamaciones cruzadas",      desc:"Actualiza ferencias relacionales entre varios sujetos o aseguradoras.", law:"Art. 32 LCS" },
      ],
    },
    {
      id:"P3", phase:"F3", label:"Plano P3 / F3 — Reclamación Posterior",
      color:"#7c3aed", borderStyle:"dashed",
      principle:"La reclamación posterior no retrocede para explicar la indemnización. F3 es eventual e independiente.",
      legalBasis:"Indemnización asegurativa → Posible reclamación posterior → Recuperación (Art. 1902 CC)",
      types:[
        { code:"P3.1", name:"Causante directo",       desc:"Busca recuperación frente al responsable principal del siniestro.", law:"Art. 1902 CC" },
        { code:"P3.2", name:"Operador / transportista",desc:"Conecta con el sujeto funcionalmente vinculado al daño.", law:"Art. 1903 CC" },
        { code:"P3.3", name:"Reclamación contractual", desc:"Se apoya en una relación previa de prestación o garantía.", law:"Art. 1124 CC" },
        { code:"P3.4", name:"Extracontractual",        desc:"Se apoya en daño causado fuera de contrato (tort).", law:"Art. 1902 CC" },
        { code:"P3.5", name:"Entre aseguradoras",      desc:"Ordena recuperaciones, concurrencias o compensaciones entre aseguradoras.", law:"Art. 32 LCS" },
      ],
    },
  ];

  const PARAMETRIC = [
    { var:"Risk",     phenom:"F1 — nivel de exposición",     type:"float 0–1",    desc:"Grado de posibilidad de actualización de la ferencia." },
    { var:"Euribor",  phenom:"CA2 sobre F1 (modulador)",     type:"float %",      desc:"Variable financiera externa. Condiciona el coste de cobertura." },
    { var:"Premium",  phenom:"F1 — expresión económica",     type:"€/año",        desc:"El precio de la cobertura. NOT el precio del siniestro." },
    { var:"Damage",   phenom:"F2 — ferencia actualizada",    type:"€",            desc:"Pérdida o daño materializado. Se activa en F2, no en F1." },
    { var:"Claim",    phenom:"F3 — apertura de reclamación", type:"bool",         desc:"Si existe culpable identificado y se abre vía de recuperación." },
    { var:"Recovery", phenom:"F3 — reducción de exposición", type:"€ / %",        desc:"Recuperabilidad neta posterior a la indemnización." },
  ];

  // ── Compute live values from loaded contracts ──────────────────────────────
  const totalPremium = policies.reduce((sum, p) => sum + parseFloat(p.master?.ag?.terms?.primaAnual || 0), 0);
  const totalCoverage = policies.reduce((sum, p) => sum + parseFloat(p.master?.ag?.terms?.coverageCapital || p.master?.ag?.terms?.coverageLimit || p.master?.ag?.terms?.totalCoverageLimit || 0), 0);
  const totalDamage   = policies.reduce((sum, p) => {
    const perit = p.subs?.find(s => s?.type === "PERITACION");
    return sum + parseFloat(perit?.ag?.terms?.estimatedDamage || 0);
  }, 0);
  const totalIndemnizacion = policies.reduce((sum, p) => {
    const perit = p.subs?.find(s => s?.type === "PERITACION");
    return sum + parseFloat(perit?.ag?.terms?.agreedIndemnity || 0);
  }, 0);
  const hasSiniestro  = policies.some(p => p.subs?.some(s => ["SINIESTRO_PENDIENTE","INDEMNIZACION_PAGADA"].includes(s?.status)));
  const indemnizacionPagada = policies.some(p => p.subs?.some(s => s?.status === "INDEMNIZACION_PAGADA"));
  const completedPolicies = policies.filter(p => p.validation?.score === 100).length;
  const riskLevel = policies.length > 0 ? Math.round(((policies.length - completedPolicies) / Math.max(policies.length, 1)) * 100) : 0;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"16px 14px", display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <span style={{ fontSize:24 }}>⚡</span>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:C.textDark, fontFamily:font.ui,
                letterSpacing:"-0.02em", lineHeight:1 }}>
                Flujómetro
              </div>
              <div style={{ marginTop:3 }}>
                <span style={{ fontSize:10, color:C.textMuted, fontFamily:font.ui }}>
                  Motor fenomenológico del seguro · F1 → F2 → F3
                </span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ padding:"5px 12px", fontFamily:font.ui, fontSize:11, fontWeight:600,
          background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:7, cursor:"pointer", color:C.textMuted }}>
          ← Volver a Cartera
        </button>
      </div>

      {/* ── Live interactive graph ── */}
      <PhenomenonIIIFlowGraph
        policies={policies}
        hasSiniestro={hasSiniestro}
        indemnizacionPagada={indemnizacionPagada}
        totalPremium={totalPremium}
        totalCoverage={totalCoverage}
        totalDamage={totalDamage}
        totalIndemnizacion={totalIndemnizacion}
        riskLevel={riskLevel}
      />

      {/* Fractalización visual */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
          letterSpacing:"0.06em", marginBottom:10 }}>
          Fractalización — caso EDCO/EDCIB
        </div>
        <div style={{ padding:"12px 14px", borderRadius:10, background:C.white, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.ui, marginBottom:12, lineHeight:1.6 }}>
            Un caso complejo no exige abandonar el modelo, sino <strong>repetirlo por escalas</strong>. EDCO/EDCIB demuestra que cada plano P1/P2/P3 puede fractalizarse en hasta 5 sub-fenómenos, cada uno conservando el patrón cobertura → actualización → indemnización → reclamación.
          </div>
          {/* Fractal tree */}
          {PLANES.map(plane => (
            <div key={plane.id} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
              <div style={{ width:40, padding:"4px 6px", borderRadius:6, textAlign:"center",
                background:`${plane.color}15`, border:`2px solid ${plane.color}`,
                fontSize:12, fontWeight:900, color:plane.color, fontFamily:font.mono, flexShrink:0 }}>
                {plane.id}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {plane.types.map((t, i) => (
                    <div key={t.code} style={{ display:"flex", alignItems:"center", gap:0 }}>
                      {i > 0 && <span style={{ fontSize:10, color:C.textLight, margin:"0 2px" }}>·</span>}
                      <div style={{ padding:"4px 8px", borderRadius:6,
                        background:`${plane.color}10`, border:`1px solid ${plane.color}40` }}>
                        <div style={{ fontSize:10, fontWeight:800, color:plane.color, fontFamily:font.mono }}>{t.code}</div>
                        <div style={{ fontSize:9, color:C.textDark, fontFamily:font.ui, marginTop:1 }}>{t.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parametric variables */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
          letterSpacing:"0.06em", marginBottom:10 }}>
          Variables paramétricas — Dynamic Insurance Flowmeter (MVP)
        </div>
        <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}` }}>
          {/* Table header */}
          <div style={{ display:"grid", gridTemplateColumns:"80px 160px 80px 1fr",
            background:C.navy, padding:"8px 12px" }}>
            {["Variable","Posición PHENOMENON","Tipo","Significado"].map(h => (
              <div key={h} style={{ fontSize:9, fontWeight:700, color:`${C.white}CC`,
                fontFamily:font.mono, textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</div>
            ))}
          </div>
          {PARAMETRIC.map((row, i) => (
            <div key={row.var} style={{ display:"grid", gridTemplateColumns:"80px 160px 80px 1fr",
              padding:"8px 12px", borderTop:`1px solid ${C.border}`,
              background: i % 2 === 0 ? C.white : C.bgAlt }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.gold, fontFamily:font.mono }}>{row.var}</div>
              <div style={{ fontSize:10, color:"#2563EB", fontFamily:font.mono }}>{row.phenom}</div>
              <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono }}>{row.type}</div>
              <div style={{ fontSize:10, color:C.textBody, fontFamily:font.ui }}>{row.desc}</div>
            </div>
          ))}
          <div style={{ padding:"8px 12px", background:C.goldBg, borderTop:`1px solid ${C.gold}40`,
            fontSize:10, color:C.goldDim, fontFamily:font.ui, fontStyle:"italic" }}>
            "La prima deja de ser una cifra opaca y pasa a ser el resultado visible, ajustable y explicable de una estructura de riesgo."
          </div>
        </div>
      </div>


    </div>
  );
}

// ─── Policy builder column ────────────────────────────────────────────────────
function PolicyBuilderColumn({ policyKey, cfg, master, subs, validation, onSelect, onFill, onSiniestro, onCrossCascade, onDelete, filling, isCrossLinked, visibleKeys, addLog, onOpenPanel }) {
  const { label, color, icon } = cfg;
  const isValid    = validation.score === 100;
  const isBlocked  = master?.status === "BLOCKED" || subs.some(s => s?.status === "BLOCKED");
  const SINIESTRO_STATUSES = ["SINIESTRO_PENDIENTE", "INDEMNIZACION_PAGADA", "RECHAZO"];
  const hasSin     = subs.some(s => SINIESTRO_STATUSES.includes(s?.status));
  const activeCrossLinks = CROSS_POLICY_IF_EDGES.filter(e =>
    (e.aPolicyKey === policyKey || e.bPolicyKey === policyKey) &&
    visibleKeys.includes(e.aPolicyKey) && visibleKeys.includes(e.bPolicyKey)
  );

  const headerBg = isBlocked  ? C.red
    : isValid    ? `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`
    :              `linear-gradient(135deg, ${color}88 0%, ${color}55 100%)`;

  return (
    <div style={{
      flex:"1 1 0", minWidth:0, display:"flex", flexDirection:"column",
      background: isBlocked ? `${C.red}06` : `${color}06`,
      border: `1.5px solid ${isBlocked ? C.red+"60" : isValid ? color+"80" : color+"30"}`,
      borderRadius:12, overflow:"hidden",
      boxShadow: isValid ? `0 4px 20px ${color}25` : `0 2px 8px ${color}10`,
      transition:"all 0.35s ease",
    }}>
      <style>{`
        @keyframes statusPing { 0%{box-shadow:0 0 0 0 currentColor;opacity:1} 70%{box-shadow:0 0 0 5px transparent;opacity:0.7} 100%{box-shadow:0 0 0 0 transparent;opacity:1} }
        @keyframes checkFlip  { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes fillPulse  { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes shimmerBg  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* Header */}
      <div style={{ background:headerBg, padding:"12px 14px", cursor:"pointer" }} onClick={() => master && onSelect(master.id)}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <span style={{ fontSize:22, lineHeight:1 }}>{icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.white, fontFamily:font.ui, lineHeight:1.3 }}>{label}</div>
            <div style={{ fontSize:10, color:`${C.white}CC`, fontFamily:font.ui, marginTop:2 }}>
              {isBlocked ? "⛔ IF-Exclusión activa" : isValid ? "✓ Completo · Válido" : `${validation.filled}/${validation.total} campos completados`}
            </div>
          </div>
          <ScoreRing score={validation.score} color={isBlocked ? "#FCA5A5" : "#FFFFFF"} size={46} />
        </div>

        {/* IA badges */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {["ad-actio","non","Bloque II IF"].map(ia => (
            <span key={ia} style={{ fontSize:9, fontFamily:font.mono, padding:"2px 7px", borderRadius:10,
              background:`${C.white}20`, color:C.white, border:`1px solid ${C.white}30` }}>{ia}</span>
          ))}
          {isValid && <span style={{ fontSize:9, fontFamily:font.mono, padding:"2px 7px", borderRadius:10,
            background:`${C.green}40`, color:"#D1FAE5", border:`1px solid ${C.green}60` }}>OPONIBLE ⊙</span>}
        </div>
      </div>

      <div style={{ flex:1, padding:"12px 14px", display:"flex", flexDirection:"column", gap:10, overflowY:"auto" }}>

        {/* PHENOMENON III phase bar — hidden unless flag is true */}
        {PHENOMENON_III_ENABLED && (
          <PhenomenonIIIPhaseBar
            policyLabel={cfg.label}
            hasSiniestro={hasSin}
            onOpenPanel={onOpenPanel}
          />
        )}

        {/* Sub-contracts status */}
        <div>
          <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.ui, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
            Sub-contratos IF ({subs.filter(Boolean).length}/3)
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {subs.map((sub, i) => {
              if (!sub) return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 6px", borderRadius:5,
                  background:`${C.red}08`, border:`1px solid ${C.red}20` }}>
                  <span style={{ fontSize:7, color:C.red }}>✗</span>
                  <span style={{ fontSize:8, fontFamily:font.mono, color:C.red }}>Sub-contrato no encontrado</span>
                </div>
              );
              const meta = SUB_META[sub.type] ?? { label:sub.type, icon:"◈", color:C.textMuted };
              const sc   = statusColor(sub.status);
              const subRules = (VALIDATION_RULES[policyKey]?.[sub.type] ?? []);
              const subFilled = subRules.filter(({key}) => {
                const v = sub.ag?.terms?.[key];
                return v && String(v).trim() !== "" && v !== "— seleccionar —";
              }).length;
              const subOk = subFilled === subRules.length;
              return (
                <div key={sub.id} onClick={() => onSelect(sub.id)} style={{
                  display:"flex", alignItems:"center", gap:7, padding:"6px 9px", borderRadius:6, cursor:"pointer",
                  background: subOk ? `${C.green}08` : `${color}08`,
                  border:`1px solid ${subOk ? C.green+"40" : color+"25"}`,
                  transition:"all 0.2s",
                }}>
                  <span style={{ fontSize:12, color:meta.color }}>{meta.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.textBody, fontFamily:font.ui }}>{meta.label ?? meta.short ?? sub.type.slice(0,12)}</div>
                    <div style={{ display:"flex", gap:3, marginTop:2, flexWrap:"wrap" }}>
                      {/* CA-type badge */}
                      {CA_TYPE_MAP[sub.type] && (() => {
                        const isCD = CA_TYPE_MAP[sub.type] === "CA-CD";
                        return (
                          <span style={{ fontSize:8, fontFamily:"monospace", padding:"1px 5px", borderRadius:6,
                            background: isCD ? "#FEF2F2" : "#F0FDF4",
                            color: isCD ? "#DC2626" : "#16A34A",
                            border: `1px solid ${isCD ? "#FECACA" : "#86EFAC"}`,
                            fontWeight:700 }}>
                            {CA_TYPE_MAP[sub.type]}
                          </span>
                        );
                      })()}
                      {/* Phase badge */}
                      {(() => {
                        const ph = getPhase(sub);
                        const cfg = PHASE_CFG[ph] ?? PHASE_CFG.SA1;
                        return (
                          <span style={{ fontSize:8, fontFamily:"monospace", padding:"1px 5px", borderRadius:6,
                            background:cfg.bg, color:cfg.color,
                            border:`1px solid ${cfg.color}40`, fontWeight:600 }}>
                            {cfg.label}
                          </span>
                        );
                      })()}
                      {/* P1.x coverage sub-type badge */}
                      {sub.ag?.terms?.coverageSubType && (() => {
                        const prefix = sub.ag.terms.coverageSubType.split(" — ")[0];
                        return (
                          <span style={{ fontSize:8, fontFamily:"monospace", padding:"1px 5px", borderRadius:6,
                            background:"#EFF6FF", color:"#2563EB", border:"1px solid #BFDBFE", fontWeight:700 }}>
                            {prefix}
                          </span>
                        );
                      })()}
                      {/* P2.x ferencia sub-type badge */}
                      {sub.ag?.terms?.ferenciaType && (() => {
                        const prefix = sub.ag.terms.ferenciaType.split(" — ")[0];
                        return (
                          <span style={{ fontSize:8, fontFamily:"monospace", padding:"1px 5px", borderRadius:6,
                            background:"#FFF7ED", color:"#D97706", border:"1px solid #FED7AA", fontWeight:700 }}>
                            {prefix}
                          </span>
                        );
                      })()}
                      {/* P3.x reclamacion sub-type badge */}
                      {sub.ag?.terms?.reclamacionType && (() => {
                        const prefix = sub.ag.terms.reclamacionType.split(" — ")[0];
                        return (
                          <span style={{ fontSize:8, fontFamily:"monospace", padding:"1px 5px", borderRadius:6,
                            background:"#F5F3FF", color:"#7C3AED", border:"1px solid #DDD6FE", fontWeight:700 }}>
                            {prefix}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <StatusDot status={sub.status} size={7} />
                  {subRules.length > 0 && (
                    <span style={{ fontSize:10, fontFamily:font.mono, fontWeight:600, color: subOk ? C.green : C.orange }}>
                      {subFilled}/{subRules.length}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation checklist */}
        {!isValid && validation.errors.length > 0 && (
          <div style={{ background:"#FEF2F2", border:`1.5px solid #FECACA`, borderRadius:10, padding:"10px 12px" }}>
            <div style={{ fontSize:10, color:"#DC2626", fontFamily:font.ui, fontWeight:700, marginBottom:7, display:"flex", alignItems:"center", gap:5 }}>
              <span>⚠</span> {validation.errors.length} campo{validation.errors.length !== 1 ? "s" : ""} pendiente{validation.errors.length !== 1 ? "s" : ""}
            </div>
            <div style={{ maxHeight:130, overflowY:"auto" }}>
              {validation.errors.map((e, i) => (
                <CheckRow key={i} ok={false} label={e.label} location={e.location} />
              ))}
            </div>
          </div>
        )}

        {/* Success state */}
        {isValid && (
          <div style={{ background:"#F0FDF4", border:`1.5px solid #86EFAC`, borderRadius:10, padding:"10px 12px" }}>
            <div style={{ fontSize:11, color:"#16A34A", fontFamily:font.ui, fontWeight:700, marginBottom:5 }}>
              ✓ Póliza completamente homologada
            </div>
            <div style={{ fontSize:10, color:"#4B5563", fontFamily:font.ui, lineHeight:1.6 }}>
              ESS · AG · IF · Opus VALID<br/>
              {master?.ag?.terms?.primaAnual && `Prima: ${parseInt(master.ag.terms.primaAnual).toLocaleString("es-ES")} €/año`}
            </div>
          </div>
        )}

        {/* Cross-policy connections */}
        {activeCrossLinks.length > 0 && (
          <div>
            <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.ui, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>
              Conexiones cross-póliza
            </div>
            {activeCrossLinks.map((e, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 8px", borderRadius:6,
                background:`${e.color}10`, border:`1px solid ${e.color}35`, marginBottom:3 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:e.color, flexShrink:0 }} />
                <span style={{ fontSize:10, fontFamily:font.mono, color:e.color, fontWeight:700 }}>{e.label}</span>
                <span style={{ fontSize:10, fontFamily:font.ui, color:C.textMuted, flex:1 }}>
                  {e.type === "identity" ? "Tomador compartido" : e.type === "risk" ? "Correlación de riesgo" : "Exclusión vinculante"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:"auto", paddingTop:6 }}>

          {/* Auto-fill button (only when incomplete) */}
          {!isValid && (
            <button
              disabled={filling}
              onClick={() => onFill(master.id, policyKey)}
              style={{
                padding:"9px 12px", fontFamily:font.ui, fontWeight:700, fontSize:11,
                background: filling
                  ? `linear-gradient(90deg, ${color}60 0%, ${color}90 50%, ${color}60 100%)`
                  : `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
                backgroundSize: filling ? "200% 100%" : "100% 100%",
                animation: filling ? "shimmerBg 1.5s linear infinite" : "none",
                color:C.white, border:"none", borderRadius:8, cursor:filling?"wait":"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              }}
            >
              {filling ? "⟳ Rellenando…" : "⚡ Relleno automático"}
            </button>
          )}

          {/* Siniestro button — only when valid, no siniestro of any kind, not blocked,
              AND the coverage sub-contract is specifically ACTIVE (not NEEDS_REVIEW etc.) */}
          {isValid && !hasSin && !isBlocked && (() => {
            const cobertura = subs.find(s => s?.type?.startsWith("COBERTURA_"));
            if (!cobertura) return null;
            if (cobertura.status === "ACTIVE") {
              return (
                <button
                  onClick={() => onSiniestro(cobertura.id, cobertura.type)}
                  style={{ padding:"8px 12px", fontFamily:font.ui, fontWeight:600, fontSize:11,
                    background:`${C.orange}12`, color:"#92400E", border:`1px solid ${C.orange}50`, borderRadius:8, cursor:"pointer" }}>
                  ⚡ Declarar siniestro
                </button>
              );
            }
            // Coverage exists but is not ACTIVE (e.g. NEEDS_REVIEW after cascade)
            return (
              <div style={{ padding:"8px 12px", borderRadius:8, background:"#FFF7ED",
                border:`1px solid #FED7AA`, display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:13 }}>⚠</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#92400E", fontFamily:font.ui }}>
                    Cobertura en revisión
                  </div>
                  <div style={{ fontSize:9, color:"#78350F", fontFamily:font.ui }}>
                    Estado: {cobertura.status} — regenera o completa la póliza antes de declarar siniestro
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Resolved siniestro badges — shown instead of button when already processed */}
          {subs.some(s => s?.status === "INDEMNIZACION_PAGADA") && (
            <div style={{ padding:"8px 12px", borderRadius:8, background:"#F0FDF4",
              border:`1px solid #86EFAC`, display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ fontSize:14 }}>✅</span>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#16A34A", fontFamily:font.ui }}>
                  Indemnización pagada
                </div>
                <div style={{ fontSize:9, color:"#4B5563", fontFamily:font.ui }}>
                  Ciclo fenomenológico completo · F1→F2 cerrado
                </div>
              </div>
            </div>
          )}
          {subs.some(s => s?.status === "RECHAZO") && (
            <div style={{ padding:"8px 12px", borderRadius:8, background:"#FEF2F2",
              border:`1px solid #FECACA`, display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ fontSize:14 }}>⛔</span>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#DC2626", fontFamily:font.ui }}>
                  Siniestro rechazado
                </div>
                <div style={{ fontSize:9, color:"#4B5563", fontFamily:font.ui }}>
                  Art. 1902 CC — impugnación disponible (nueva órbita)
                </div>
              </div>
            </div>
          )}

          {/* Resolve siniestro — opens wizard at step 2 with existing hypothesis */}
          {hasSin && (() => {
            const pendingSub = subs.find(s => s?.status === "SINIESTRO_PENDIENTE");
            if (!pendingSub) return null;
            const pt = pendingSub?.ag?.terms ?? {};
            const existingHypothesis = pt.hipotesis_status === "PENDING" ? {
              cause: pt.siniestro_cause ?? "",
              estimated_damage: parseFloat(pt.estimated_damage ?? 0),
              franquicia_applied: parseFloat(pt.franquicia_applied ?? 0),
              indemnizacion_derivada: parseFloat(pt.indemnizacion_derivada ?? 0),
              notes: pt.hipotesis_notes ?? "",
            } : null;
            return (
              <button
                onClick={() => onSiniestro(pendingSub.id, pendingSub.type, existingHypothesis)}
                style={{ padding:"8px 12px", fontFamily:font.ui, fontWeight:600, fontSize:11,
                  background:`${C.orange}22`, color:"#92400E", border:`1px solid ${C.orange}80`,
                  borderRadius:8, cursor:"pointer", animation:"fillPulse 2s ease infinite" }}>
                ⚡ Resolver siniestro pendiente →
              </button>
            );
          })()}

          {/* Cross-policy cascade (only when valid and 2+ policies) */}
          {isValid && isCrossLinked && (
            <button
              onClick={() => onCrossCascade(policyKey, master.id)}
              style={{ padding:"8px 12px", fontFamily:font.ui, fontWeight:600, fontSize:11,
                background:`${C.gold}12`, color:C.goldDim, border:`1px solid ${C.gold}50`, borderRadius:8, cursor:"pointer" }}>
              ⬡ Cascade cross-póliza
            </button>
          )}

          {/* Delete policy */}
          <button
            onClick={() => { if (window.confirm(`¿Eliminar póliza "${cfg.label}"?\nSe borrarán el master y los 3 sub-contratos.`)) onDelete(master.id); }}
            style={{ padding:"6px 12px", fontFamily:font.ui, fontWeight:600, fontSize:10,
              background:"transparent", color:"#EF4444", border:`1px solid #FCA5A5`,
              borderRadius:8, cursor:"pointer", marginTop:2 }}>
            🗑 Eliminar póliza
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add-next-policy panel ────────────────────────────────────────────────────
function AddPolicyPanel({ remainingTypes, onAdd, creating, partyA }) {
  if (remainingTypes.length === 0) return null;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.goldBg} 0%, ${C.white} 100%)`,
      border:`2px solid ${C.gold}70`,
      borderRadius:14,
      padding:"14px 16px",
      display:"flex", flexDirection:"column", gap:10,
      boxShadow:`0 4px 16px ${C.gold}20`,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:16 }}>➕</span>
        <div>
          <div style={{ fontSize:12, fontWeight:800, color:C.textDark, fontFamily:font.ui }}>
            Añadir siguiente póliza
          </div>
          <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.ui }}>{partyA}</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {remainingTypes.map(key => {
          const cfg = INSURANCE_POLICY_CONFIG[key];
          const isCreating = creating === key;
          return (
            <button
              key={key}
              disabled={!!creating}
              onClick={() => onAdd(key)}
              style={{
                display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
                background: isCreating ? `${cfg.color}15` : C.white,
                border:`1.5px solid ${isCreating ? cfg.color : cfg.color+"50"}`,
                borderRadius:10, cursor:creating?"wait":"pointer",
                transition:"all 0.2s",
                flex:"1 1 auto",
              }}
            >
              <span style={{ fontSize:18 }}>{cfg.icon}</span>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontSize:11, fontWeight:700, color:cfg.color, fontFamily:font.ui }}>
                  {isCreating ? "⟳ Creando…" : cfg.label}
                </div>
                <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.ui }}>
                  {isCreating ? "Un momento…" : "Empezar póliza vacía"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Comparison table (all 4 valid) ──────────────────────────────────────────
function ComparisonTable({ policies }) {
  const rows = [
    { label:"Riesgo cubierto",     values:{ SEGURO_VIDA:"Muerte / Invalidez", SEGURO_RC:"Daño a terceros", SEGURO_DANOS:"Daño al bien", SEGURO_CREDITO_COMERCIAL:"Impago del deudor" }},
    { label:"IF condición",         values:{ SEGURO_VIDA:"Exclusión médica", SEGURO_RC:"Franquicia por siniestro", SEGURO_DANOS:"Peritación art.38 LCS", SEGURO_CREDITO_COMERCIAL:"Rating financiero" }},
    { label:"IF operador",          values:{ SEGURO_VIDA:"non ⛔", SEGURO_RC:"non ⛔", SEGURO_DANOS:"non ⛔", SEGURO_CREDITO_COMERCIAL:"non ⛔" }},
    { label:"Sub-contratos",        values:{ SEGURO_VIDA:"3", SEGURO_RC:"3", SEGURO_DANOS:"3", SEGURO_CREDITO_COMERCIAL:"3" }},
    { label:"P1 PHENOMENON III",    values:{ SEGURO_VIDA:"P1.1 — Vida", SEGURO_RC:"P1.2 — RC", SEGURO_DANOS:"P1.1+P1.4", SEGURO_CREDITO_COMERCIAL:"P1.5 — Fin." }},
    { label:"Motor PHENOMENON",     values:{ SEGURO_VIDA:"✓", SEGURO_RC:"✓", SEGURO_DANOS:"✓", SEGURO_CREDITO_COMERCIAL:"✓" }, highlight:true },
  ];
  const cols = policies.map(p => p.key);
  return (
    <div style={{ borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}`, fontSize:8, fontFamily:font.mono, flexShrink:0 }}>
      <div style={{ display:"grid", gridTemplateColumns:`110px repeat(${cols.length}, 1fr)`, background:C.navy }}>
        <div style={{ padding:"5px 8px" }} />
        {cols.map(key => {
          const cfg = INSURANCE_POLICY_CONFIG[key];
          return (
            <div key={key} style={{ padding:"5px 6px", color:cfg.color, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
              {cfg.icon} {cfg.label.replace("Seguro ","").replace(" Comercial","")}
            </div>
          );
        })}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display:"grid", gridTemplateColumns:`110px repeat(${cols.length}, 1fr)`,
          background: row.highlight ? C.goldBg : ri%2===0 ? C.white : C.bgAlt,
          borderTop:`1px solid ${C.border}` }}>
          <div style={{ padding:"4px 8px", color:C.textMuted, fontWeight:600, fontSize:7 }}>{row.label}</div>
          {cols.map(key => (
            <div key={key} style={{ padding:"4px 6px", color:row.highlight ? C.gold : C.textBody, fontWeight:row.highlight?700:400 }}>
              {row.values[key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Siniestro Wizard Modal ───────────────────────────────────────────────────
function SiniestroWizard({ wizard, onClose, onLoadContracts, addLog }) {
  const existing = wizard.existingHypothesis ?? null;
  const [cause,        setCause]        = useState("");
  const [damage,       setDamage]       = useState("");
  const [step,         setStep]         = useState(existing ? 2 : 1);
  const [hypothesis,   setHypothesis]   = useState(existing);
  const [rejecting,    setRejecting]    = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBasis,  setRejectBasis]  = useState("");
  const [busy,         setBusy]         = useState(false);
  const [result,       setResult]       = useState(null);
  const [wizardError,  setWizardError]  = useState(null);

  const { contractId, contractType } = wizard;
  const isVida = contractType === "COBERTURA_VIDA";

  async function handleInitiate() {
    setWizardError(null);
    setBusy(true);
    try {
      const res = await api.initiateSiniestro({
        contract_id: contractId,
        cause: cause.trim() || "Siniestro declarado",
        estimated_damage: isVida ? 0 : (parseFloat(damage) || 0),
      });
      setHypothesis(res.hypothesis);
      setStep(2);
      addLog?.("SINIESTRO", `⚡ Siniestro ${res.siniestro_id} — ID Justificación creado.`, "cascade");
      await onLoadContracts();
    } catch (e) {
      const msg = e.message || "Error desconocido";
      setWizardError(msg);
      addLog?.("ERROR", "Error iniciando siniestro: " + msg, "error");
    }
    setBusy(false);
  }

  async function handleConfirm() {
    setWizardError(null);
    setBusy(true);
    try {
      const res = await api.confirmSiniestro({ contract_id: contractId });
      setResult({ type: "confirmed", indemnizacion: res.indemnizacion, id: res.siniestro_id });
      setStep(3);
      addLog?.("OPUS", `✅ Indemnización ${parseFloat(res.indemnizacion).toLocaleString("es-ES")} € emitida.`, "opus");
      await onLoadContracts();
    } catch (e) {
      const msg = e.message || "Error desconocido";
      setWizardError(msg);
      addLog?.("ERROR", "Error confirmando: " + msg, "error");
    }
    setBusy(false);
  }

  async function handleReject() {
    setWizardError(null);
    setBusy(true);
    try {
      const res = await api.rejectSiniestro({ contract_id: contractId, reason: rejectReason.trim() || "Motivo no especificado", legal_basis: rejectBasis.trim() });
      setResult({ type: "rejected", reason: rejectReason, basis: rejectBasis, id: res.siniestro_id });
      setStep(3);
      addLog?.("SINIESTRO", `⛔ Siniestro ${res.siniestro_id} RECHAZADO — ${rejectReason}`, "error");
      await onLoadContracts();
    } catch (e) {
      const msg = e.message || "Error desconocido";
      setWizardError(msg);
      addLog?.("ERROR", "Error rechazando: " + msg, "error");
    }
    setBusy(false);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.6)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:C.white, borderRadius:16, width:"100%", maxWidth:480,
        boxShadow:"0 24px 60px rgba(0,0,0,0.3)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#92400E 0%,#D97706 100%)", padding:"16px 20px",
          display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:24 }}>⚡</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.white }}>Siniestro — ID Justificación</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.75)", fontFamily:"monospace" }}>
              SA1 → YA → SINIESTRO → ID → HIPÓTESIS → INDEMNIZACIÓN
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {[1,2,3].map(n => (
              <div key={n} style={{ width:24, height:24, borderRadius:"50%", display:"flex",
                alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700,
                background: step >= n ? C.white : "rgba(255,255,255,0.25)",
                color: step >= n ? "#92400E" : C.white }}>
                {n}
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:C.white,
            borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>

        <div style={{ padding:"20px 24px" }}>

          {/* ── Step 1: Input ── */}
          {step === 1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.6 }}>
                <strong style={{ color:C.textDark }}>Paso 1 — Declarar Siniestro</strong><br/>
                El motor crea un <strong>ID Justificación</strong> y calcula la hipótesis de indemnización antes de que el asegurador decida.
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
                  letterSpacing:"0.05em", display:"block", marginBottom:5 }}>
                  Causa del siniestro *
                </label>
                <textarea value={cause} onChange={e => setCause(e.target.value)} rows={3}
                  placeholder="Describe el evento que origina la reclamación…"
                  style={{ width:"100%", padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:7,
                    fontSize:12, fontFamily:"inherit", resize:"vertical", boxSizing:"border-box" }} />
              </div>
              {!isVida && (
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
                    letterSpacing:"0.05em", display:"block", marginBottom:5 }}>
                    Daño reclamado (€) *
                  </label>
                  <input type="number" value={damage} onChange={e => setDamage(e.target.value)} min={0}
                    placeholder="Importe estimado del daño…"
                    style={{ width:"100%", padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:7,
                      fontSize:12, fontFamily:"monospace", boxSizing:"border-box" }} />
                </div>
              )}
              {isVida && (
                <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:8, padding:"10px 12px",
                  fontSize:11, color:"#92400E" }}>
                  Seguro de Vida: la indemnización es el capital pactado — sin franquicia (art. 25 LCS).
                </div>
              )}
              <button disabled={busy}
                onClick={handleInitiate}
                style={{ padding:"11px", background: busy ? C.orange+"99" : C.orange, color:C.white, border:"none",
                  borderRadius:8, cursor: busy ? "wait" : "pointer", fontSize:13, fontFamily:"inherit", fontWeight:700 }}>
                {busy ? "⟳ Creando ID Justificación…" : "⚡ Iniciar Siniestro → Calcular Hipótesis"}
              </button>
              {wizardError && (
                <div style={{ padding:"10px 12px", background:"#FEF2F2", border:"1px solid #FECACA",
                  borderRadius:8, fontSize:11, color:C.red, fontFamily:"monospace", wordBreak:"break-word" }}>
                  <strong>Error:</strong> {wizardError}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Hypothesis review ── */}
          {step === 2 && hypothesis && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.6 }}>
                <strong style={{ color:C.textDark }}>Paso 2 — Revisar Hipótesis</strong><br/>
                El motor ha calculado la indemnización derivada. El asegurador decide confirmar o rechazar.
              </div>

              {/* Hypothesis card */}
              <div style={{ background:"#F5F3FF", border:"1.5px solid #A78BFA", borderRadius:10, padding:"14px 16px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#7C3AED", marginBottom:10,
                  textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  ID Justificación — Hipótesis de Indemnización
                </div>
                {[
                  ["Causa del siniestro", hypothesis.cause],
                  hypothesis.estimated_damage > 0 && ["Daño reclamado", fmtEur(hypothesis.estimated_damage)],
                  hypothesis.franquicia_applied > 0 && ["Franquicia aplicada", `− ${fmtEur(hypothesis.franquicia_applied)}`],
                  ["Indemnización derivada", fmtEur(hypothesis.indemnizacion_derivada)],
                ].filter(Boolean).map(([label, value], i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
                    padding:"5px 0", borderBottom:i < 3 ? `1px solid #DDD6FE` : "none" }}>
                    <span style={{ fontSize:11, color:"#6B21A8" }}>{label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#4C1D95", fontFamily:"monospace" }}>{value}</span>
                  </div>
                ))}
                <div style={{ marginTop:8, fontSize:10, color:"#7C3AED", lineHeight:1.5,
                  background:"#EDE9FE", borderRadius:6, padding:"6px 8px" }}>
                  {hypothesis.notes}
                </div>
              </div>

              {!rejecting ? (
                <div style={{ display:"flex", gap:8 }}>
                  <button disabled={busy} onClick={handleConfirm}
                    style={{ flex:1, padding:"11px", background: busy ? C.green+"99" : C.green, color:C.white,
                      border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 }}>
                    {busy ? "⟳ Confirmando…" : `✅ Confirmar — Emitir ${fmtEur(hypothesis.indemnizacion_derivada)}`}
                  </button>
                  <button disabled={busy} onClick={() => { setRejecting(true); setWizardError(null); }}
                    style={{ flex:1, padding:"11px", background:"#FEF2F2", color:C.red,
                      border:`1px solid #FECACA`, borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 }}>
                    ⛔ Rechazar Siniestro
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"12px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.red, marginBottom:8 }}>Motivo del rechazo *</div>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                      placeholder="Razón del rechazo (ej: daño por desgaste normal)…"
                      style={{ width:"100%", padding:"7px 9px", border:`1px solid #FECACA`, borderRadius:6,
                        fontSize:11, fontFamily:"inherit", resize:"none", boxSizing:"border-box", marginBottom:6 }} />
                    <input value={rejectBasis} onChange={e => setRejectBasis(e.target.value)}
                      placeholder="Base legal (ej: art. 20 LCS — exclusión por desgaste)"
                      style={{ width:"100%", padding:"7px 9px", border:`1px solid #FECACA`, borderRadius:6,
                        fontSize:11, fontFamily:"monospace", boxSizing:"border-box" }} />
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => setRejecting(false)}
                      style={{ flex:1, padding:"9px", background:C.bgAlt, color:C.textMuted,
                        border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer", fontSize:11 }}>
                      ← Volver
                    </button>
                    <button disabled={busy || !rejectReason.trim()} onClick={handleReject}
                      style={{ flex:2, padding:"9px", background: busy ? C.red+"99" : C.red, color:C.white,
                        border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 }}>
                      {busy ? "⟳ Rechazando…" : "⛔ Confirmar Rechazo"}
                    </button>
                  </div>
                </div>
              )}
              {wizardError && (
                <div style={{ padding:"10px 12px", background:"#FEF2F2", border:"1px solid #FECACA",
                  borderRadius:8, fontSize:11, color:C.red, fontFamily:"monospace", wordBreak:"break-word" }}>
                  <strong>Error:</strong> {wizardError}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Result ── */}
          {step === 3 && result && (
            <div style={{ display:"flex", flexDirection:"column", gap:14, textAlign:"center" }}>
              {result.type === "confirmed" ? (
                <>
                  <div style={{ fontSize:40 }}>✅</div>
                  <div style={{ fontSize:16, fontWeight:700, color:C.green }}>Indemnización Emitida</div>
                  <div style={{ fontSize:28, fontWeight:800, color:C.green, fontFamily:"monospace" }}>
                    {fmtEur(result.indemnizacion)}
                  </div>
                  <div style={{ fontSize:11, color:C.textMuted }}>
                    {result.id} · Estado: INDEMNIZACION_PAGADA · Fase: INDEMNIZACIÓN
                  </div>
                  <div style={{ fontSize:10, color:C.textMuted, lineHeight:1.6, background:C.bgAlt,
                    borderRadius:8, padding:"10px 12px" }}>
                    El contrato de cobertura ha completado el ciclo fenomenológico:<br/>
                    <strong>SA1 → A1 → COBERTURA → SINIESTRO → ID → HIPÓTESIS → INDEMNIZACIÓN</strong>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:40 }}>⛔</div>
                  <div style={{ fontSize:16, fontWeight:700, color:C.red }}>Siniestro Rechazado</div>
                  <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8,
                    padding:"12px", textAlign:"left" }}>
                    <div style={{ fontSize:11, color:C.red, fontWeight:700, marginBottom:4 }}>Motivo</div>
                    <div style={{ fontSize:12, color:"#7F1D1D" }}>{result.reason}</div>
                    {result.basis && (
                      <div style={{ fontSize:10, color:C.red, fontFamily:"monospace", marginTop:6 }}>{result.basis}</div>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:C.textMuted }}>
                    {result.id} · Estado: RECHAZO · Fase: RECHAZO<br/>
                    El asegurado puede impugnar (art. 1902 CC — nueva órbita fenomenológica)
                  </div>
                </>
              )}
              <button onClick={onClose}
                style={{ padding:"10px", background:C.navy, color:C.white, border:"none",
                  borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 }}>
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SegurosComparativeView({ contracts, onSelectContract, onLoadContracts, addLog, isExpanded, onToggleExpand, expandLevel = 0 }) {
  const [creating,       setCreating]       = useState(null);
  const [fillingId,      setFillingId]      = useState(null);
  const [processing,     setProcessing]     = useState(false);
  const [flashIds,       setFlashIds]       = useState(new Set());
  const [siniestroWizard,setSiniestroWizard]= useState(null); // null | {contractId, contractType}
  const [phenomTab,      setPhenomTab]      = useState("cartera"); // "cartera" | "phenom3"
  const safetyTimer = useRef(null);

  // ── Parse policies ─────────────────────────────────────────────────────────
  const insuranceMasters = Object.values(contracts).filter(c =>
    !c.parentId && INSURANCE_TEMPLATE_KEYS.includes(c.ag?.terms?.templateKey)
  );

  const policies = POLICY_ORDER.map(key => {
    const master = insuranceMasters.find(m => m.ag?.terms?.templateKey === key);
    if (!master) return null;
    const cfg  = INSURANCE_POLICY_CONFIG[key];
    const subs = (cfg.subs ?? []).map(subType =>
      Object.values(contracts).find(c => c.parentId === master.id && c.type === subType)
    );
    const validation = computeValidation(master, subs, key);
    return { key, cfg, master, subs, validation };
  }).filter(Boolean);

  const loadedKeys    = policies.map(p => p.key);
  const remainingTypes = POLICY_ORDER.filter(k => !loadedKeys.includes(k));
  const allValid      = policies.length === 4 && policies.every(p => p.validation.score === 100);
  const partyA        = insuranceMasters[0]?.ess?.partyA ?? "Comerciales del Levante S.L.";

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleAddPolicy(policyKey) {
    if (creating) return;
    setCreating(policyKey);
    try {
      await api.initOnePolicy({ policy_type: policyKey, party_a: partyA, clear_existing: false });
      addLog?.("IF", `Nueva póliza creada: ${INSURANCE_POLICY_CONFIG[policyKey].label}`, "cascade");
      await onLoadContracts();
    } catch (e) {
      addLog?.("ERROR", "Error creando póliza: " + e.message, "error");
    } finally {
      setCreating(null);
    }
  }

  async function handleFill(masterId, policyKey) {
    if (fillingId) return;
    setFillingId(masterId);
    clearTimeout(safetyTimer.current);
    safetyTimer.current = setTimeout(() => setFillingId(null), 15000);
    try {
      await api.fillPolicyData({ master_id: masterId });
      addLog?.("IF", `Póliza ${INSURANCE_POLICY_CONFIG[policyKey]?.label} completada automáticamente`, "cascade");
      await onLoadContracts();
    } catch (e) {
      addLog?.("ERROR", "Error en relleno: " + e.message, "error");
    } finally {
      clearTimeout(safetyTimer.current);
      setFillingId(null);
    }
  }

  function handleSiniestro(contractId, contractType, existingHypothesis = null) {
    if (!contractId) return;
    setSiniestroWizard({ contractId, contractType, existingHypothesis });
  }

  async function handleCrossCascade(policyKey, masterId) {
    if (processing || !masterId) return;
    setProcessing(true);
    try {
      const result = await api.crossPolicyCascade({ source_contract_id: masterId, field: "partyA", new_value: partyA });
      addLog?.("IF", `Cross-cascade: ${result.affected_count} pólizas afectadas`, "cascade");
      await onLoadContracts();
    } catch (e) {
      addLog?.("ERROR", "Error cross-cascade: " + e.message, "error");
    } finally {
      setProcessing(false);
    }
  }

  async function handleDelete(masterId) {
    try {
      await api.deletePhenomenon(masterId); // backend cascade-deletes subs
      addLog?.("IF", `Póliza eliminada`, "info");
      await onLoadContracts();
    } catch (e) {
      addLog?.("ERROR", "Error eliminando: " + e.message, "error");
    }
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (policies.length === 0) {
    return (
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        flexDirection:"column", gap:12, padding:32, background:C.bg }}>
        <div style={{ fontSize:32 }}>🛡️</div>
        <div style={{ fontSize:13, fontWeight:700, color:C.textDark }}>Caso Seguros no iniciado</div>
        <div style={{ fontSize:10, color:C.textMuted, textAlign:"center", maxWidth:260, lineHeight:1.6 }}>
          Vuelve a la pantalla de inicio y pulsa<br/>
          <strong>Construir Cartera Seguros</strong><br/>
          para empezar póliza por póliza.
        </div>
      </div>
    );
  }

  // ── Builder / comparison view ──────────────────────────────────────────────
  const completedCount = policies.filter(p => p.validation.score === 100).length;
  const totalErrors    = policies.reduce((n, p) => n + p.validation.errors.length, 0);

  return (
    <div data-testid="seguros-comparative-view"
      style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:C.bg }}>
      <style>{`
        @keyframes statusPing { 0%{box-shadow:0 0 0 0 currentColor;opacity:1} 70%{box-shadow:0 0 0 5px transparent;opacity:0.7} 100%{box-shadow:0 0 0 0 transparent;opacity:1} }
        @keyframes shimmerBg  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes checkFlip  { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes fadeSlideIn{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding:"12px 16px 10px", borderBottom:`1px solid ${C.border}`, flexShrink:0,
        background:C.white }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>🛡️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.textDark, fontFamily:font.ui }}>
              {partyA}
            </div>
            <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.ui, marginTop:2 }}>
              {policies.length} póliza{policies.length!==1?"s":""} · {completedCount} completada{completedCount!==1?"s":""} · {CROSS_POLICY_IF_EDGES.length} conexiones IF
            </div>
          </div>
          {/* Stats chips */}
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            {[
              [completedCount, "✓ Valid", C.green],
              [totalErrors,    "⚠ Errores", C.red],
              [policies.length - completedCount, "⟳ Pending", C.orange],
            ].map(([v, l, col]) => v > 0 ? (
              <div key={l} style={{ fontSize:10, color:col, fontFamily:font.ui, fontWeight:600,
                background:`${col}20`, border:`1px solid ${col}40`,
                borderRadius:8, padding:"3px 8px" }}>
                {v} {l}
              </div>
            ) : null)}
            {/* Stage expand/collapse button — 3 levels */}
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                title={expandLevel === 0 ? "Ampliar: ocultar gráfico" : expandLevel === 1 ? "Pantalla completa" : "Restaurar 3 paneles"}
                style={{
                  width:26, height:26, borderRadius:5,
                  border:`1px solid ${expandLevel > 0 ? C.gold : C.border}`,
                  background: expandLevel === 2 ? `${C.gold}50` : expandLevel === 1 ? `${C.gold}25` : C.bgAlt,
                  color: expandLevel > 0 ? C.gold : C.textMuted,
                  cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0,
                }}
              >
                {expandLevel === 2 ? "⊠" : expandLevel === 1 ? "⊟" : "⊞"}
              </button>
            )}
          </div>
        </div>

        {/* Overall progress bar */}
        <div style={{ marginTop:10, height:4, borderRadius:3, background:C.bgAlt, overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:3,
            background:`linear-gradient(to right, #059669, #C9A84C)`,
            width:`${policies.reduce((sum,p) => sum + p.validation.score, 0) / Math.max(policies.length,1)}%`,
            transition:"width 0.5s ease" }} />
        </div>

        {/* Tab switcher */}
        <div style={{ display:"flex", gap:0, marginTop:8, borderRadius:7, overflow:"hidden",
          border:`1px solid ${C.border}`, alignSelf:"flex-start" }}>
          {[
            { key:"cartera",  label:"🛡 Cartera" },
            { key:"phenom3",  label:"⚡ Flujómetro" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setPhenomTab(key)} style={{
              padding:"5px 18px", fontFamily:font.ui, fontSize:12,
              fontWeight: phenomTab === key ? 800 : 600,
              background: phenomTab === key ? C.gold : `${C.gold}18`,
              color: phenomTab === key ? C.navy : C.goldDim,
              border:"none", cursor:"pointer", transition:"all 0.15s",
              letterSpacing: phenomTab === key ? "0.02em" : "0",
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Policy columns / PHENOMENON III panel ── */}
      <div style={{ flex:1, overflowY:"auto", padding:10, display:"flex", flexDirection:"column", gap:8 }}>

        {phenomTab === "cartera" ? (
          <>
            <div style={{ display:"flex", gap:8, alignItems:"stretch", minHeight:0 }}>
              {policies.map(p => (
                <PolicyBuilderColumn
                  key={p.key}
                  policyKey={p.key}
                  cfg={p.cfg}
                  master={p.master}
                  subs={p.subs}
                  validation={p.validation}
                  onSelect={onSelectContract}
                  onFill={handleFill}
                  onSiniestro={handleSiniestro}
                  onCrossCascade={handleCrossCascade}
                  onDelete={handleDelete}
                  filling={fillingId === p.master.id}
                  isCrossLinked={policies.length > 1}
                  visibleKeys={loadedKeys}
                  addLog={addLog}
                  onOpenPanel={() => setPhenomTab("phenom3")}
                />
              ))}
            </div>


            {/* Add next policy */}
            {remainingTypes.length > 0 && (
              <div style={{ animation:"fadeSlideIn 0.3s ease-out" }}>
                <AddPolicyPanel
                  remainingTypes={remainingTypes}
                  onAdd={handleAddPolicy}
                  creating={creating}
                  partyA={partyA}
                />
              </div>
            )}

            {/* Comparison table when all 4 valid */}
            {allValid && (
              <div style={{ animation:"fadeSlideIn 0.4s ease-out" }}>
                <div style={{ fontSize:8, color:C.gold, fontFamily:font.mono, fontWeight:700,
                  letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6, textAlign:"center" }}>
                  ✓ Cartera completa — Análisis comparativo PHENOMENON
                </div>
                <ComparisonTable policies={policies} />
              </div>
            )}

            {/* Cross-policy connections summary */}
            {policies.length >= 2 && (
              <div style={{ background:C.goldBg, border:`1px solid ${C.gold}30`, borderRadius:8,
                padding:"8px 12px", flexShrink:0 }}>
                <div style={{ fontSize:7, color:C.goldDim, fontFamily:font.mono, textTransform:"uppercase",
                  letterSpacing:"0.07em", marginBottom:4 }}>
                  Conexiones IF cross-póliza activas
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {CROSS_POLICY_IF_EDGES
                    .filter(e => loadedKeys.includes(e.aPolicyKey) && loadedKeys.includes(e.bPolicyKey))
                    .map((e, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:4, padding:"2px 8px",
                        borderRadius:8, background:`${e.color}15`, border:`1px solid ${e.color}35` }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:e.color }} />
                        <span style={{ fontSize:7, fontFamily:font.mono, color:e.color, fontWeight:600 }}>
                          {e.label}
                        </span>
                      </div>
                    ))}
                  {CROSS_POLICY_IF_EDGES.filter(e => loadedKeys.includes(e.aPolicyKey) && loadedKeys.includes(e.bPolicyKey)).length === 0 && (
                    <span style={{ fontSize:7, color:C.textMuted, fontFamily:font.mono }}>
                      Añade más pólizas para ver conexiones cross-póliza
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <PhenomenonIIIPanel onClose={() => setPhenomTab("cartera")} policies={policies} />
        )}
      </div>

      {/* Siniestro wizard modal */}
      {siniestroWizard && (
        <SiniestroWizard
          wizard={siniestroWizard}
          onClose={() => setSiniestroWizard(null)}
          onLoadContracts={onLoadContracts}
          addLog={addLog}
        />
      )}
    </div>
  );
}

export { PhenomenonIIIFlowGraph, CircularMeter };
