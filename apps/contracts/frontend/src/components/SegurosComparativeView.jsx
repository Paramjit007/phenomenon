import { useState, useEffect, useCallback, useRef } from "react";
import {
  C, font,
  INSURANCE_POLICY_CONFIG, INSURANCE_TEMPLATE_KEYS,
  CROSS_POLICY_IF_EDGES, SUB_META, statusColor, statusLabel,
} from "../constants.js";
import * as api from "../api/phenomenon.js";

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

// ─── Policy builder column ────────────────────────────────────────────────────
function PolicyBuilderColumn({ policyKey, cfg, master, subs, validation, onSelect, onFill, onSiniestro, onCrossCascade, onDelete, filling, isCrossLinked, visibleKeys, addLog }) {
  const { label, color, icon } = cfg;
  const isValid    = validation.score === 100;
  const isBlocked  = master?.status === "BLOCKED" || subs.some(s => s?.status === "BLOCKED");
  const hasSin     = subs.some(s => s?.status === "SINIESTRO_PENDIENTE");
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
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:C.textBody, fontFamily:font.ui }}>{meta.label ?? meta.short ?? sub.type.slice(0,12)}</div>
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

          {/* Siniestro button (only when valid) */}
          {isValid && !hasSin && !isBlocked && (
            <button
              onClick={() => onSiniestro(subs.find(s => s?.type?.startsWith("COBERTURA_"))?.id)}
              style={{ padding:"8px 12px", fontFamily:font.ui, fontWeight:600, fontSize:11,
                background:`${C.orange}12`, color:"#92400E", border:`1px solid ${C.orange}50`, borderRadius:8, cursor:"pointer" }}>
              ⚡ Declarar siniestro
            </button>
          )}

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
      background:C.bgAlt, border:`1.5px dashed ${C.border}`, borderRadius:12,
      padding:"12px 14px", display:"flex", flexDirection:"column", gap:8,
    }}>
      <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.ui, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>
        Añadir siguiente póliza — {partyA}
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function SegurosComparativeView({ contracts, onSelectContract, onLoadContracts, addLog, isExpanded, onToggleExpand, expandLevel = 0 }) {
  const [creating, setCreating]   = useState(null);   // policy key being init'd
  const [fillingId, setFillingId] = useState(null);   // master_id being auto-filled
  const [processing, setProcessing] = useState(false);
  const [flashIds, setFlashIds]   = useState(new Set());
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

  async function handleSiniestro(contractId) {
    if (processing || !contractId) return;
    setProcessing(true);
    try {
      await api.declareSiniestro({ contract_id: contractId, resolution: "" });
      addLog?.("SINIESTRO", "Siniestro declarado", "cascade");
      await onLoadContracts();
    } catch (e) {
      addLog?.("ERROR", "Error siniestro: " + e.message, "error");
    } finally {
      setProcessing(false);
    }
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
      <div style={{ padding:"12px 16px 10px", borderBottom:`1px solid #1E3A5F`, flexShrink:0,
        background:"#0F1B2E" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>🛡️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", fontFamily:font.ui }}>
              {partyA}
            </div>
            <div style={{ fontSize:10, color:"#94A3B8", fontFamily:font.ui, marginTop:2 }}>
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
                  border:`1px solid ${expandLevel > 0 ? C.gold : C.white+"40"}`,
                  background: expandLevel === 2 ? `${C.gold}50` : expandLevel === 1 ? `${C.gold}25` : `${C.white}12`,
                  color: expandLevel > 0 ? C.gold : `${C.white}BB`,
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
        <div style={{ marginTop:10, height:4, borderRadius:3, background:"#1E3A5F", overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:3,
            background:`linear-gradient(to right, #059669, #C9A84C)`,
            width:`${policies.reduce((sum,p) => sum + p.validation.score, 0) / Math.max(policies.length,1)}%`,
            transition:"width 0.5s ease" }} />
        </div>
      </div>

      {/* ── Policy columns ── */}
      <div style={{ flex:1, overflowY:"auto", padding:10, display:"flex", flexDirection:"column", gap:8 }}>

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
      </div>
    </div>
  );
}
