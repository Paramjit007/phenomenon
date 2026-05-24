import { useState, useRef, useEffect, useCallback } from "react";
import { C, font, SUB_META, statusColor, statusLabel, OPUS_LEVELS, getOpusLevel, SUB_IF_EDGES, SUB_CASCADE_MAP, SUB_CASCADE_FIELDS, INSURANCE_POLICY_CONFIG, CROSS_POLICY_IF_EDGES } from "../constants.js";
import { detectRisks, getRiskLevel } from "./RiskEngine.jsx";
import * as api from "../api/phenomenon.js";

// ─── useReducedMotion — honours prefers-reduced-motion media query ─────────────
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

const MASTER_W = 190; const MASTER_H = 110;
const NODE_W   = 160; const NODE_H   = 95;
const CX = 520; const CY = 300; const RADIUS = 230;

// ─── KPMG financial label extraction ─────────────────────────────────────────
function kpmgLabel(contract) {
  const t = contract?.ag?.terms ?? {};
  switch (contract?.type) {
    case "FINANCIACION":
      return t.monthlyPayment ? `${Math.round(parseFloat(t.monthlyPayment)/1000)}k€/mes` : null;
    case "HIPOTECA_GARANTIA":
      return t.mortgageAmount ? `€${(parseFloat(t.mortgageAmount)/1e6).toFixed(0)}M hipoteca` : null;
    case "CESION_CREDITO":
      return t.monthlyRent ? `${Math.round(parseFloat(t.monthlyRent)/1000)}k€/mes renta` : null;
    default: return null;
  }
}

// ─── Quick-edit fields per contract type ──────────────────────────────────────
const QUICK_FIELDS = {
  MASTER:  [
    { key:"jurisdiction", label:"Juzgados competentes",   group:"ess",   type:"text" },
    { key:"expiryDate",   label:"Fecha de vencimiento",   group:"ess",   type:"date" },
    { key:"partyA",       label:"Parte A",                group:"ess",   type:"text" },
    { key:"partyB",       label:"Parte B",                group:"ess",   type:"text" },
  ],
  NDA:     [
    { key:"confidentialityPeriod", label:"Plazo confidencialidad (años)", group:"terms", type:"number" },
    { key:"penaltyAmount",         label:"Cláusula penal (€)",            group:"terms", type:"number" },
    { key:"noticePeriod",          label:"Preaviso (días)",               group:"terms", type:"number" },
  ],
  SLA:     [
    { key:"availability",      label:"Disponibilidad garantizada (%)", group:"terms", type:"number" },
    { key:"penaltyPct",        label:"Penalización por caída (%)",     group:"terms", type:"number" },
    { key:"maxMonthlyPenalty", label:"Tope mensual (%)",               group:"terms", type:"number" },
  ],
  PAYMENT: [
    { key:"paymentDays", label:"Plazo de pago (días naturales)", group:"terms", type:"number" },
    { key:"baseAmount",  label:"Importe base (€)",               group:"terms", type:"number" },
    { key:"retentionPct",label:"Retención (%)",                  group:"terms", type:"number" },
  ],
  DPA:     [
    { key:"dataRetention",        label:"Retención de datos (años)",    group:"terms", type:"number" },
    { key:"internationalTransfer",label:"Transferencia internacional",   group:"terms", type:"select",
      options:["No aplica","Cláusulas tipo UE (SCCs)","Decisión adecuación"] },
  ],
  IP:      [
    { key:"exclusivity", label:"Exclusividad", group:"terms", type:"select",
      options:["Exclusiva","No exclusiva","Exclusiva por canal","Selectiva"] },
    { key:"territory",   label:"Territorio",   group:"terms", type:"select",
      options:["España","Unión Europea","Mundial","A definir"] },
    { key:"duration",    label:"Duración (años)", group:"terms", type:"number" },
  ],
};

// ─── Condition trigger/action labels ─────────────────────────────────────────
const TRIGGER_OPTIONS = [
  { value:"ON_CHANGE",    label:"Cuando cualquier campo cambia" },
  { value:"ON_TERMINATE", label:"Cuando se termina el contrato" },
  { value:"ON_EXPIRY",    label:"Cuando vence (expiryDate)" },
];
const ACTION_OPTIONS = [
  { value:"NEEDS_REVIEW", label:"→ Marcar como NEEDS_REVIEW" },
  { value:"TERMINATED",   label:"→ Terminar el contrato" },
  { value:"BLOCK_HOMO",   label:"→ Bloquear homologación" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function radialPos(index, total, w, h) {
  const angle = (2 * Math.PI * index / Math.max(total, 1)) - Math.PI / 2;
  return { x: CX + RADIUS * Math.cos(angle) - w / 2, y: CY + RADIUS * Math.sin(angle) - h / 2 };
}

function midPoint(d) {
  const m = d.match(/M\s*([\d.]+)\s+([\d.]+)/);
  const e = d.match(/([\d.]+)\s+([\d.]+)$/);
  if (!m || !e) return { x: 0, y: 0 };
  return { x: (parseFloat(m[1]) + parseFloat(e[1])) / 2, y: (parseFloat(m[2]) + parseFloat(e[2])) / 2 - 6 };
}

// ─── Node card ────────────────────────────────────────────────────────────────
function NodeCard({ id, contract, meta, pos, selected, isMaster, onClick, onDoubleClick, onMouseDown, flash, pendingEdit, allContracts }) {
  const color = isMaster ? C.gold : (meta?.color ?? C.textMuted);
  const subs  = allContracts ? Object.values(allContracts).filter(c => c.parentId === id) : [];
  const risks = detectRisks(contract, subs, allContracts ? Object.values(allContracts) : []);
  const riskLevel  = getRiskLevel(risks);
  const riskBadge  = { high:"🔴", medium:"🟡", low:"", none:"" }[riskLevel];
  const w = isMaster ? MASTER_W : NODE_W;
  const h = isMaster ? MASTER_H : NODE_H;
  const isReview     = contract.status === "NEEDS_REVIEW";
  const isTerminated = contract.status === "TERMINATED";

  return (
    <div
      onMouseDown={e => { e.preventDefault(); onMouseDown(id, e); }}
      onClick={e => { e.stopPropagation(); onClick(id); }}
      onDoubleClick={e => { e.stopPropagation(); onDoubleClick(id); }}
      title="Clic: seleccionar · Doble clic: edición rápida"
      style={{
        position: "absolute", left: pos.x, top: pos.y, width: w, height: h,
        background: isTerminated ? "#F3F4F6" : pendingEdit ? `#FEF9C3` : selected ? `${color}10` : C.white,
        border: `2px solid ${isTerminated ? C.textLight : pendingEdit ? "#CA8A04" : selected ? color : isReview ? C.orange : `${color}60`}`,
        borderRadius: 10,
        boxShadow: pendingEdit
          ? `0 0 0 4px #FDE04760, 0 8px 24px rgba(202,138,4,0.2)`
          : flash
            ? `0 0 0 6px ${C.orange}40, 0 12px 32px rgba(0,0,0,0.15)`
            : selected
              ? `0 0 0 4px ${color}25, 0 12px 32px rgba(0,0,0,0.15)`
            : "0 3px 10px rgba(0,0,0,0.09)",
        cursor: "grab", userSelect: "none", overflow: "hidden",
        display: "flex", flexDirection: "column",
        opacity: isTerminated ? 0.55 : 1,
        transition: "box-shadow 0.3s, border-color 0.2s, opacity 0.3s",
      }}
    >
      <div style={{ height: 5, background: isTerminated ? C.textLight : color, flexShrink: 0 }} />
      <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: isMaster ? 18 : 15, color: isTerminated ? C.textLight : color, lineHeight: 1 }}>
            {isTerminated ? "✕" : isMaster ? "⬡" : (meta?.icon ?? "○")}
          </span>
          <span style={{ fontSize: isMaster ? 12 : 11, fontWeight: 700, color: isTerminated ? C.textLight : C.textDark, fontFamily: font.ui, letterSpacing: "0.03em", textTransform: "uppercase" }}>
            {isMaster ? "Contrato Marco" : (meta?.short ?? contract.type)}
          </span>
          {isReview     && <span style={{ marginLeft:"auto", fontSize:11, color:C.orange }}>⚠</span>}
          {isTerminated && <span style={{ marginLeft:"auto", fontSize:9, color:C.textLight, fontFamily:font.mono }}>TERM.</span>}
        </div>
        <div style={{ fontSize:11, color:C.textMuted, fontFamily:font.ui, lineHeight:1.35 }}>
          {contract.name?.split(" ").slice(0,5).join(" ")}
        </div>
        {riskBadge && (
          <div style={{ position:"absolute", top:-5, right:-5, fontSize:12, zIndex:2, filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.25))" }}>{riskBadge}</div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:"auto", flexWrap:"wrap" }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background: isTerminated ? C.textLight : statusColor(contract.status), flexShrink:0 }} />
          <span style={{ fontSize:10, color: isTerminated ? C.textLight : statusColor(contract.status), fontFamily:font.mono }}>
            {isTerminated ? "Terminado" : statusLabel(contract.status)}
          </span>
          {(() => {
            const level = getOpusLevel(contract);
            const cfg = OPUS_LEVELS[level];
            return (
              <span title={cfg.desc} style={{ fontSize:9, padding:"1px 6px", borderRadius:3, background:cfg.bg, color:cfg.color, fontFamily:font.mono, fontWeight:700, border:`1px solid ${cfg.color}50`, marginLeft:"auto" }}>
                {cfg.icon} {level === "OPONIBLE" ? "OPO." : level === "COMPLETE" ? "COMP." : "PARC."}
              </span>
            );
          })()}
        </div>
        {/* Pending edit indicator */}
        {pendingEdit && (
          <div style={{ position:"absolute", top:4, right:4, fontSize:10, zIndex:5,
            background:"#FDE047", borderRadius:4, padding:"1px 5px",
            fontFamily:font.mono, color:"#78350F", fontWeight:700,
            animation:"contractPulse 1s ease infinite" }}>
            ✎ editando…
          </div>
        )}
        {/* KPMG financial amount label */}
        {(() => {
          const lbl = kpmgLabel(contract);
          return lbl ? (
            <div style={{ position:"absolute", top:-10, left:0, right:0, textAlign:"center",
              fontSize:8, color:C.white, fontFamily:font.mono, fontWeight:700,
              background:color, borderRadius:"4px 4px 0 0", padding:"1px 4px", opacity:0.9 }}>
              {lbl}
            </div>
          ) : null;
        })()}
        {/* Double-click hint when selected */}
        {selected && !isTerminated && (
          <div style={{ position:"absolute", bottom:4, left:0, right:0, textAlign:"center", fontSize:8, color:color, fontFamily:font.mono, opacity:0.7 }}>
            ✎ doble clic para editar
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Node quick-edit floating card ───────────────────────────────────────────
function NodeQuickEdit({ contract, isMaster, pos, w, h, onClose, onApply, onTerminate }) {
  const fields   = QUICK_FIELDS[isMaster ? "MASTER" : (contract?.type ?? "MASTER")] ?? [];
  const color    = isMaster ? C.gold : (SUB_META[contract?.type]?.color ?? C.textMuted);
  const meta     = isMaster ? null : SUB_META[contract?.type];
  const [vals, setVals] = useState(() => {
    const v = {};
    fields.forEach(f => {
      v[f.key] = f.group === "ess"
        ? (contract?.ess?.[f.key] ?? "")
        : (contract?.ag?.terms?.[f.key] ?? "");
    });
    return v;
  });
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);

  // Position the card: try right of node, if too far right go left
  const cardW = 260, cardH = fields.length * 62 + 100;
  const rightX = pos.x + w + 12;
  const leftX  = pos.x - cardW - 12;
  const useLeft = rightX + cardW > 1100;
  const cardX = useLeft ? leftX : rightX;
  const cardY = Math.max(10, Math.min(pos.y, 550 - cardH));

  const handleApply = useCallback(async () => {
    setApplying(true);
    try {
      for (const f of fields) {
        const val = vals[f.key];
        if (val === undefined || val === "") continue;
        if (f.group === "ess") {
          await api.updatePhenomenon(contract.id, { ess: { [f.key]: val } });
          if (!isMaster) { /* sub-contracts don't usually trigger master cascade from ESS */ }
        } else {
          const newTerms = { ...(contract.ag?.terms ?? {}), [f.key]: val };
          await api.updatePhenomenon(contract.id, { ag: { ...(contract.ag ?? {}), terms: newTerms } });
          if (contract.parentId) {
            const cascadeFields = SUB_CASCADE_FIELDS[contract.type] ?? [];
            if (cascadeFields.includes(f.key)) {
              await Promise.all([
                api.triggerSubCascade(contract.id, f.key, val).catch(() => {}),
                api.triggerReverseCascade(contract.id, f.key, val).catch(() => {}),
              ]);
            }
          }
        }
      }
      if (isMaster) {
        // Fire master cascade for ESS fields that changed
        for (const f of fields.filter(x => x.group === "ess")) {
          const val = vals[f.key];
          if (val) await api.triggerCascade(contract.id, f.key, val).catch(() => {});
        }
      }
      await onApply();
      setDone(true);
      setTimeout(onClose, 800);
    } catch (e) {
      setApplying(false);
    }
  }, [vals, fields, contract, isMaster, onApply, onClose]);

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position:"absolute", left:cardX, top:cardY, width:cardW, zIndex:100,
        background:C.white, border:`2px solid ${color}`, borderRadius:12,
        boxShadow:`0 8px 32px rgba(0,0,0,0.18), 0 0 0 4px ${color}15`,
        fontFamily:font.ui, overflow:"hidden",
      }}
    >
      {/* Header */}
      <div style={{ background:color, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:16, color:C.white }}>{isMaster?"⬡":(meta?.icon??"○")}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.white }}>Edición rápida</div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.75)", fontFamily:font.mono }}>
            {isMaster?"MASTER":contract?.type} · doble clic en Apply para propagar
          </div>
        </div>
        <button onClick={onClose}
          style={{ background:"rgba(255,255,255,0.2)", border:"none", color:C.white, borderRadius:5, width:22, height:22, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
      </div>

      {/* Fields */}
      <div style={{ padding:"12px 14px" }}>
        {fields.map(f => (
          <div key={f.key} style={{ marginBottom:10 }}>
            <div style={{ fontSize:9, fontWeight:600, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3, display:"flex", justifyContent:"space-between" }}>
              <span>{f.label}</span>
              <span style={{ color:color, fontFamily:font.mono, fontSize:8 }}>{f.group.toUpperCase()}</span>
            </div>
            {f.type === "select" ? (
              <select value={vals[f.key] ?? ""} onChange={e => setVals(v => ({...v, [f.key]:e.target.value}))}
                style={{ width:"100%", padding:"5px 8px", fontSize:12, fontFamily:font.ui, border:`1.5px solid ${color}40`, borderRadius:5, background:C.bgInput, color:C.textDark }}>
                <option value="">— seleccionar —</option>
                {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type ?? "text"} value={vals[f.key] ?? ""} onChange={e => setVals(v => ({...v, [f.key]:e.target.value}))}
                style={{ width:"100%", padding:"5px 8px", fontSize:12, fontFamily:f.type==="number"?font.mono:font.ui, border:`1.5px solid ${color}40`, borderRadius:5, background:C.bgInput, color:C.textDark }} />
            )}
          </div>
        ))}

        {/* Buttons */}
        <div style={{ display:"flex", gap:6, marginTop:8 }}>
          <button onClick={handleApply} disabled={applying || done}
            style={{ flex:1, padding:"8px", background:done?C.green:color, color:isMaster?"#000":C.white, border:"none", borderRadius:6, cursor:"pointer", fontSize:12, fontFamily:font.ui, fontWeight:700, transition:"background 0.2s" }}>
            {done ? "✓ Aplicado" : applying ? "⟳ Guardando…" : "▶ Aplicar y Propagar"}
          </button>
          {!isMaster && contract?.status !== "TERMINATED" && (
            <button onClick={() => { onTerminate(contract.id); onClose(); }}
              style={{ padding:"8px 10px", background:C.redBg, color:C.red, border:`1px solid ${C.red}30`, borderRadius:6, cursor:"pointer", fontSize:11, fontFamily:font.ui, fontWeight:600, whiteSpace:"nowrap" }}>
              Terminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edge condition panel ─────────────────────────────────────────────────────
function EdgePanel({ edge, subContracts, conditions, onAddCondition, onRemoveCondition, onClose }) {
  const [form, setForm] = useState({ trigger:"ON_CHANGE", action:"NEEDS_REVIEW", triggerField:"" });
  const [showForm, setShowForm] = useState(false);

  const isMasterSub = edge.kind === "master-sub";
  const fromColor   = isMasterSub ? C.gold : (SUB_META[edge.fromType]?.color ?? C.textMuted);
  const toColor     = SUB_META[edge.toType]?.color ?? C.textMuted;
  const edgeKey     = `${edge.fromType}→${edge.toType}`;

  // Get predefined cascade rules for this edge
  const predefined = isMasterSub
    ? ["ESS: partyA, partyB, jurisdiction, effectiveDate, expiryDate → NEEDS_REVIEW"]
    : Object.entries(SUB_CASCADE_MAP[edge.fromType] ?? {})
        .filter(([, targets]) => targets.includes(edge.toType))
        .map(([field, targets]) => `${field} cambia → ${targets.join(", ")}: NEEDS_REVIEW`);

  const edgeConditions = conditions.filter(c => c.edgeKey === edgeKey);

  return (
    <div onClick={e => e.stopPropagation()}
      style={{ position:"absolute", bottom:0, left:0, right:0, background:C.white,
        border:`1px solid ${C.border}`, borderTop:`2px solid ${fromColor}`,
        borderRadius:"12px 12px 0 0", boxShadow:"0 -4px 20px rgba(0,0,0,0.12)",
        padding:"14px 18px", maxHeight:240, zIndex:50,
        display:"flex", flexDirection:"column", fontFamily:font.ui }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:12, color:fromColor, fontWeight:700, fontFamily:font.mono }}>
            {edge.fromType}
          </span>
          <span style={{ fontSize:14, color:C.cyan }}>{isMasterSub ? "⟶" : "⇄"}</span>
          <span style={{ fontSize:12, color:toColor, fontWeight:700, fontFamily:font.mono }}>
            {edge.toType}
          </span>
        </div>
        <div style={{ flex:1 }}>
          <span style={{ fontSize:10, color:C.textMuted }}>
            {isMasterSub ? "Conexión IF Maestro → Subcontrato" : `IF·${edge.edgeDef?.label ?? "Sibling"}`}
          </span>
        </div>
        <button onClick={onClose}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:C.textMuted }}>✕</button>
      </div>

      <div style={{ display:"flex", gap:16, overflow:"hidden", flex:1 }}>
        {/* Left: predefined rules */}
        <div style={{ flex:1, overflow:"auto" }}>
          <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
            Conexiones jurídicas entre contratos
          </div>
          {predefined.length === 0
            ? <div style={{ fontSize:10, color:C.textLight, fontStyle:"italic" }}>Sin reglas predefinidas para esta conexión</div>
            : predefined.map((r, i) => (
              <div key={i} style={{ fontSize:10, color:C.textBody, marginBottom:4, display:"flex", gap:6, padding:"4px 8px", background:C.bgAlt, borderRadius:5 }}>
                <span style={{ color:fromColor, flexShrink:0 }}>⇒</span>{r}
              </div>
            ))
          }
        </div>

        {/* Right: custom conditions */}
        <div style={{ width:280, overflow:"auto", flexShrink:0 }}>
          <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span>Condiciones personalizadas</span>
            <button onClick={() => setShowForm(p => !p)}
              style={{ fontSize:10, color:C.blue, background:"none", border:`1px solid ${C.blue}40`, borderRadius:4, padding:"1px 7px", cursor:"pointer" }}>
              {showForm ? "✕" : "+ Añadir"}
            </button>
          </div>

          {showForm && (
            <div style={{ background:C.bgAlt, borderRadius:7, padding:"8px 10px", marginBottom:8, border:`1px solid ${C.border}` }}>
              <div style={{ marginBottom:5 }}>
                <div style={{ fontSize:9, color:C.textMuted, marginBottom:2 }}>Disparador</div>
                <select value={form.trigger} onChange={e => setForm(f => ({...f, trigger:e.target.value}))}
                  style={{ width:"100%", fontSize:10, fontFamily:font.ui, padding:"3px 6px", border:`1px solid ${C.border}`, borderRadius:4, background:C.white }}>
                  {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:9, color:C.textMuted, marginBottom:2 }}>Acción</div>
                <select value={form.action} onChange={e => setForm(f => ({...f, action:e.target.value}))}
                  style={{ width:"100%", fontSize:10, fontFamily:font.ui, padding:"3px 6px", border:`1px solid ${C.border}`, borderRadius:4, background:C.white }}>
                  {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <button onClick={() => { onAddCondition({ ...form, edgeKey, id: Date.now() }); setShowForm(false); setForm({ trigger:"ON_CHANGE", action:"NEEDS_REVIEW", triggerField:"" }); }}
                style={{ width:"100%", padding:"5px", background:C.blue, color:C.white, border:"none", borderRadius:5, cursor:"pointer", fontSize:10, fontFamily:font.ui, fontWeight:700 }}>
                Guardar condición
              </button>
            </div>
          )}

          {edgeConditions.length === 0 && !showForm && (
            <div style={{ fontSize:10, color:C.textLight, fontStyle:"italic" }}>Sin condiciones personalizadas</div>
          )}
          {edgeConditions.map(cond => {
            const triggerLabel = TRIGGER_OPTIONS.find(o => o.value === cond.trigger)?.label ?? cond.trigger;
            const actionLabel  = ACTION_OPTIONS.find(o => o.value === cond.action)?.label ?? cond.action;
            return (
              <div key={cond.id} style={{ display:"flex", alignItems:"flex-start", gap:6, marginBottom:5, padding:"5px 8px", background:C.white, border:`1px solid ${C.border}`, borderRadius:5 }}>
                <div style={{ flex:1, fontSize:9, color:C.textBody, lineHeight:1.5 }}>
                  <span style={{ color:C.orange }}>{triggerLabel}</span>
                  <br /><span style={{ color:C.blue }}>{actionLabel}</span>
                </div>
                <button onClick={() => onRemoveCondition(cond.id)}
                  style={{ background:"none", border:"none", color:C.textLight, cursor:"pointer", fontSize:12, flexShrink:0 }}>✕</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Full-network layout helpers ─────────────────────────────────────────────
// Colour palette for master groups in full-network view
const MASTER_PALETTE = [C.gold, C.cyan, "#059669", "#7C3AED", "#D97706", "#DB2777"];

/**
 * Build groups: each master and its subs form a group.
 * Returns array of { master, subs, color }
 */
function buildGroups(contractsMap) {
  const all = Object.values(contractsMap ?? {});
  const masters = all.filter(c => !c.parentId);
  return masters.map((m, i) => {
    const templateKey = m.ag?.terms?.templateKey;
    const insuranceCfg = INSURANCE_POLICY_CONFIG?.[templateKey];
    return {
      master: m,
      subs: all.filter(c => c.parentId === m.id),
      color: insuranceCfg?.color ?? MASTER_PALETTE[i % MASTER_PALETTE.length],
      templateKey: templateKey ?? null,
    };
  });
}

/**
 * Full-network view — renders all contract groups side by side.
 * Each group: a coloured header box, master circle, sub circles in a row.
 * Clicking a node still calls onSelectNode(id).
 */
function FullNetworkView({
  contractsMap,
  selectedId,
  onSelectNode,
  flashIds,
  reducedMotion,
  pendingEditId,
}) {
  const [hoverTooltip, setHoverTooltip] = useState(null); // { id, x, y }

  const groups = buildGroups(contractsMap);
  if (groups.length === 0) return null;

  // Layout: groups side by side, each group 200px wide
  const GROUP_W = 200;
  const GROUP_PAD = 20;
  const MASTER_R = 24;
  const SUB_R = 14;
  const HEADER_H = 40;
  const MASTER_Y = HEADER_H + 50;
  const SUB_Y = MASTER_Y + 90;
  const TOTAL_H = SUB_Y + SUB_R * 2 + GROUP_PAD * 2;

  const svgW = Math.max(groups.length * (GROUP_W + GROUP_PAD) + GROUP_PAD, 400);
  const svgH = TOTAL_H;

  // Pre-compute node positions for IF edge drawing
  const nodePos = {}; // id → { cx, cy, r }
  groups.forEach((g, gi) => {
    const groupX = GROUP_PAD + gi * (GROUP_W + GROUP_PAD);
    const masterCX = groupX + GROUP_W / 2;
    nodePos[g.master.id] = { cx: masterCX, cy: MASTER_Y + MASTER_R, r: MASTER_R };
    g.subs.forEach((sub, si) => {
      const subCount = g.subs.length;
      const spacing = Math.min(GROUP_W / Math.max(subCount, 1), 36);
      const totalW = (subCount - 1) * spacing;
      const subCX = groupX + GROUP_W / 2 - totalW / 2 + si * spacing;
      nodePos[sub.id] = { cx: subCX, cy: SUB_Y + SUB_R, r: SUB_R };
    });
  });

  // Render a circle node
  function renderNode(id, contract, pos, color, isMaster) {
    if (!pos) return null;
    const { cx, cy, r } = pos;
    const isSelected = selectedId === id;
    const isFlash    = flashIds.has(id);
    const isPending  = pendingEditId === id;
    const opusLevel  = getOpusLevel(contract);
    const opusCfg    = OPUS_LEVELS[opusLevel];
    const meta       = isMaster ? null : SUB_META[contract.type];
    const nodeColor  = isMaster ? color : (meta?.color ?? color);

    // Opus ring radii
    const ringR = r + 5;

    return (
      <g
        key={id}
        style={{ cursor: "pointer" }}
        onClick={(e) => { e.stopPropagation(); onSelectNode(id); }}
        onMouseEnter={(e) => {
          const svgRect = e.currentTarget.closest("svg")?.getBoundingClientRect();
          if (!svgRect) return;
          setHoverTooltip({ id, x: cx, y: cy - r - 10, contract });
        }}
        onMouseLeave={() => setHoverTooltip(null)}
        aria-label={contract.name}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectNode(id); } }}
      >
        {/* Opus ring */}
        {opusLevel === "OPONIBLE" && (
          <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={C.gold} strokeWidth={2} opacity={0.85} />
        )}
        {opusLevel === "COMPLETE" && (
          <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={C.green} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />
        )}
        {opusLevel === "PARTIAL" && contract.status === "NEEDS_REVIEW" && (
          <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={C.orange} strokeWidth={2} opacity={0.8}>
            {!reducedMotion && (
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite" />
            )}
          </circle>
        )}

        {/* Main circle */}
        <circle
          cx={cx} cy={cy} r={r}
          fill={isFlash || isPending ? C.orange + "30" : isSelected ? nodeColor + "25" : C.bgAlt}
          stroke={isSelected ? nodeColor : isFlash ? C.orange : nodeColor + "90"}
          strokeWidth={isSelected ? 2.5 : 1.5}
          style={{
            transition: reducedMotion ? "none" : "stroke 0.2s, fill 0.2s",
          }}
        />

        {/* Contract type label (short) */}
        <text
          x={cx} y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={isMaster ? 9 : 7}
          fontWeight={700}
          fill={nodeColor}
          fontFamily="'JetBrains Mono','Courier New',monospace"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {isMaster ? "M" : (SUB_META[contract.type]?.short?.slice(0, 4) ?? contract.type?.slice(0, 4))}
        </text>

        {/* Flash highlight */}
        {isFlash && (
          <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke={C.orange} strokeWidth={2} opacity={0.5}>
            {!reducedMotion && (
              <animate attributeName="opacity" values="0.5;0;0.5" dur="0.8s" repeatCount="3" />
            )}
          </circle>
        )}
      </g>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "auto" }}>
      <svg
        width={svgW}
        height={svgH}
        style={{ display: "block", minWidth: "100%" }}
        onClick={() => onSelectNode(null)}
        aria-label="Vista completa de la red contractual"
        role="img"
      >
        {/* Background dots + cross-policy markers */}
        <defs>
          <pattern id="fn-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill={C.borderStrong} opacity="0.35" />
          </pattern>
          {/* Arrowhead markers for cross-policy edges */}
          {["#C9A84C","#D97706","#DC2626"].map(col => (
            <marker key={col} id={`cp-arrow-${col.slice(1)}`}
              markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
              <path d="M0,0 L0,5 L6,2.5 z" fill={col} opacity="0.7" />
            </marker>
          ))}
          <style>{`
            @keyframes cpFlow {
              from { stroke-dashoffset: 20; }
              to   { stroke-dashoffset: 0; }
            }
            @keyframes cpPulse {
              0%,100% { opacity: 0.55; }
              50%      { opacity: 0.9; }
            }
          `}</style>
        </defs>
        <rect width="100%" height="100%" fill="url(#fn-dots)" />

        {/* ── Cross-policy IF arcs (rendered before groups so they're behind nodes) ── */}
        {(() => {
          // Build policyKey → group lookup
          const policyMap = {};
          groups.forEach(g => { if (g.templateKey) policyMap[g.templateKey] = g; });

          const getPos = (policyKey, nodeType) => {
            const g = policyMap[policyKey];
            if (!g) return null;
            if (nodeType === "master") return nodePos[g.master.id];
            const sub = g.subs.find(s => s.type === nodeType);
            return sub ? nodePos[sub.id] : null;
          };

          return CROSS_POLICY_IF_EDGES.map((edge, ei) => {
            const p1 = getPos(edge.aPolicyKey, edge.aType);
            const p2 = getPos(edge.bPolicyKey, edge.bType);
            if (!p1 || !p2) return null;

            const isAbove = edge.arcDir === "above";
            const ctrl = isAbove
              ? { y: MASTER_Y - 28, x1: p1.cx, x2: p2.cx }
              : { y: SUB_Y + SUB_R + 42, x1: p1.cx, x2: p2.cx };

            const startY = isAbove ? p1.cy - p1.r : p1.cy + p1.r;
            const endY   = isAbove ? p2.cy - p2.r : p2.cy + p2.r;
            const midX   = (p1.cx + p2.cx) / 2;
            const midY   = isAbove ? ctrl.y - 4 : ctrl.y + 4;

            const d = `M ${p1.cx},${startY} C ${ctrl.x1},${ctrl.y} ${ctrl.x2},${ctrl.y} ${p2.cx},${endY}`;
            const markerId = `cp-arrow-${edge.color.slice(1)}`;

            return (
              <g key={`cp-${ei}`} style={{ pointerEvents: "none" }}>
                {/* Glow track */}
                <path d={d} fill="none"
                  stroke={edge.color} strokeWidth={4} opacity={0.08} />
                {/* Animated dash line */}
                <path d={d} fill="none"
                  stroke={edge.color} strokeWidth={1.5}
                  strokeDasharray="6 4"
                  markerEnd={`url(#${markerId})`}
                  opacity={0.55}
                  style={{
                    animation: "cpFlow 1.8s linear infinite, cpPulse 3s ease-in-out infinite",
                  }}
                />
                {/* Label at midpoint */}
                <rect x={midX - 32} y={midY - 8} width={64} height={14}
                  rx={4} fill={C.white} opacity={0.85} />
                <text x={midX} y={midY + 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fontWeight={600} fill={edge.color}
                  fontFamily="'JetBrains Mono','Courier New',monospace"
                  style={{ pointerEvents: "none", userSelect: "none" }}>
                  {edge.label}
                </text>
              </g>
            );
          });
        })()}

        {/* Groups */}
        {groups.map((g, gi) => {
          const groupX = GROUP_PAD + gi * (GROUP_W + GROUP_PAD);
          return (
            <g key={g.master.id}>
              {/* Group background */}
              <rect
                x={groupX}
                y={GROUP_PAD}
                width={GROUP_W}
                height={svgH - GROUP_PAD * 2}
                rx={10}
                ry={10}
                fill={g.color + "08"}
                stroke={g.color + "30"}
                strokeWidth={1.5}
              />

              {/* Group header */}
              <rect
                x={groupX}
                y={GROUP_PAD}
                width={GROUP_W}
                height={HEADER_H}
                rx={10}
                ry={10}
                fill={g.color + "20"}
              />
              {/* Bottom of header (square corners) */}
              <rect
                x={groupX}
                y={GROUP_PAD + HEADER_H - 10}
                width={GROUP_W}
                height={10}
                fill={g.color + "20"}
              />
              <text
                x={groupX + GROUP_W / 2}
                y={GROUP_PAD + HEADER_H / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fontWeight={700}
                fill={g.color}
                fontFamily="'JetBrains Mono','Courier New',monospace"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {g.master.name?.slice(0, 20)}
              </text>

              {/* Master → sub IF lines */}
              {g.subs.map(sub => {
                const mp = nodePos[g.master.id];
                const sp = nodePos[sub.id];
                if (!mp || !sp) return null;
                const isFlash = flashIds.has(sub.id) || flashIds.has(g.master.id);
                return (
                  <line
                    key={`ms-${sub.id}`}
                    x1={mp.cx} y1={mp.cy + mp.r}
                    x2={sp.cx} y2={sp.cy - sp.r}
                    stroke={g.color}
                    strokeWidth={isFlash ? 2 : 1}
                    strokeDasharray="5 4"
                    opacity={isFlash ? 0.9 : 0.4}
                    style={{ animation: isFlash ? undefined : "dashFlow 2.5s linear infinite" }}
                  />
                );
              })}

              {/* Sub → sub IF dashed edges (cross-sibling) */}
              {SUB_IF_EDGES.flatMap(edge => {
                const srcSubs = g.subs.filter(c => c.type === edge.a);
                const dstSubs = g.subs.filter(c => c.type === edge.b);
                return srcSubs.flatMap(src =>
                  dstSubs.map(dst => {
                    const sp = nodePos[src.id];
                    const dp = nodePos[dst.id];
                    if (!sp || !dp) return null;
                    const col = edge.type === "logic" ? C.red : C.cyan;
                    const isFlash = flashIds.has(src.id) || flashIds.has(dst.id);
                    return (
                      <line
                        key={`sib-fn-${src.id}-${dst.id}`}
                        x1={sp.cx} y1={sp.cy}
                        x2={dp.cx} y2={dp.cy}
                        stroke={col}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        opacity={isFlash ? 0.8 : 0.3}
                      />
                    );
                  })
                );
              })}

              {/* Master node */}
              {renderNode(g.master.id, g.master, nodePos[g.master.id], g.color, true)}

              {/* Sub nodes */}
              {g.subs.map(sub =>
                renderNode(sub.id, sub, nodePos[sub.id], g.color, false)
              )}
            </g>
          );
        })}

        {/* Hover tooltip (rendered last so it sits on top) */}
        {hoverTooltip && (() => {
          const { contract, x, y } = hoverTooltip;
          const opusLevel = getOpusLevel(contract);
          const opusCfg   = OPUS_LEVELS[opusLevel];
          const W = 150, H = 54;
          const tx = Math.min(x - W / 2, svgW - W - 4);
          const ty = Math.max(y - H - 4, 4);
          return (
            <g style={{ pointerEvents: "none" }}>
              <rect x={tx} y={ty} width={W} height={H} rx={7} ry={7}
                fill={C.navyDeep} stroke={C.borderDark} strokeWidth={1}
                opacity={0.95} />
              <text x={tx + 10} y={ty + 16}
                fontSize={9} fontWeight={700} fill={C.textWhite}
                fontFamily="'Inter',system-ui,sans-serif"
                style={{ userSelect: "none" }}>
                {contract.name?.slice(0, 22)}
              </text>
              <text x={tx + 10} y={ty + 30}
                fontSize={8} fill={opusCfg.color}
                fontFamily="'JetBrains Mono','Courier New',monospace"
                style={{ userSelect: "none" }}>
                {opusLevel}
              </text>
              <text x={tx + 10} y={ty + 44}
                fontSize={8} fill={C.textNavy}
                fontFamily="'JetBrains Mono','Courier New',monospace"
                style={{ userSelect: "none" }}>
                {contract.status ?? "—"}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ─── Main graph component ─────────────────────────────────────────────────────
// Props: master, subContracts, selectedId, onSelect, cascadeRunning,
//        contractsMap (contracts keyed by id), onContractChange, onTerminate,
//        onGenerateSub, externalFlashIds (keep prop name), pendingEditId,
//        viewMode ("radial" | "full") — controlled externally by CenterStage/App
export default function ContractGraph({ master, subContracts, selectedId, onSelect, cascadeRunning, contractsMap, onContractChange, onTerminate, onGenerateSub, externalFlashIds, pendingEditId, viewMode: externalViewMode }) {
  const reducedMotion = useReducedMotion();

  const [positions,    setPositions]    = useState({});
  const [legendVisible,setLegendVisible]= useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [quickEditId,  setQuickEditId]  = useState(null);
  const [flashIds,     setFlashIds]     = useState(new Set());
  const [conditions,   setConditions]   = useState([]);
  const [zoom,         setZoom]         = useState(0.65);
  const [pan,          setPan]          = useState({ x: 0, y: 0 });
  const [isPanning,    setIsPanning]    = useState(false);
  // Replay button: stores last non-empty externalFlashIds for re-trigger
  const lastFlashRef    = useRef([]);
  const [hasLastFlash,  setHasLastFlash]  = useState(false);
  const [replayActive,  setReplayActive]  = useState(false);
  const panStart = useRef(null);
  const dragging   = useRef(null);
  const containerRef = useRef(null);

  // internalViewMode is the single source of truth.
  // External prop seeds the initial value and can sync later (e.g. Red tab).
  const [internalViewMode, setInternalViewMode] = useState(externalViewMode ?? "radial");
  const viewMode = internalViewMode;                       // ← local state wins always
  const toggleViewMode = useCallback(() => {
    setInternalViewMode(prev => prev === "radial" ? "full" : "radial");
  }, []);

  // Allow external (App.jsx / CenterStage Red tab) to override local state
  useEffect(() => {
    if (externalViewMode) setInternalViewMode(externalViewMode);
  }, [externalViewMode]);

  // Accept external flash IDs (from EURIBOR cascade in demo panel)
  // Also keep lastFlashRef up-to-date for the Replay button
  useEffect(() => {
    if (externalFlashIds?.length > 0) {
      lastFlashRef.current = externalFlashIds;
      setHasLastFlash(true);
      flashNodes(externalFlashIds);
    }
  }, [externalFlashIds]);

  // Zoom via scroll wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      setZoom(prev => Math.min(2.5, Math.max(0.3, prev + (e.deltaY < 0 ? 0.1 : -0.1))));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Pan via middle-mouse drag
  const onPanStart = useCallback((e) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan]);
  const onPanMove = useCallback((e) => {
    if (!isPanning || !panStart.current) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, [isPanning]);
  const onPanEnd = useCallback(() => { setIsPanning(false); panStart.current = null; }, []);

  // Auto-position new nodes
  useEffect(() => {
    if (!master) return;
    setPositions(prev => {
      const next = { ...prev };
      if (!next[master.id]) next[master.id] = { x: CX - MASTER_W / 2, y: CY - MASTER_H / 2 };
      subContracts.forEach((c, i) => {
        if (!next[c.id]) next[c.id] = radialPos(i, subContracts.length, NODE_W, NODE_H);
      });
      return next;
    });
  }, [master?.id, subContracts.map(c => c.id).join(",")]);

  // ── Auto-fit: zoom+pan so all nodes are visible in the container ────────────
  // The transform is: scale(zoom) translate(pan.x/zoom, pan.y/zoom)
  // with transformOrigin "center center".
  // CSS applies right-to-left: first translate (in pre-scale space), then scale around center.
  // Visible position of a content point px:
  //   visX = containerCX + (px - containerCX) * zoom + pan.x
  // To center the bounding box: pan.x = (containerCX - contentCX) * zoom
  const fitAll = useCallback(() => {
    if (!master || !containerRef.current) return;
    const allIds = [master.id, ...subContracts.map(c => c.id)];
    // Use a local snapshot of positions from the ref-captured closure.
    // We read via setPositions's functional form to get the latest value.
    setPositions(current => {
      if (!allIds.every(id => current[id])) return current; // positions not ready
      const containerW = containerRef.current?.offsetWidth ?? 0;
      const containerH = containerRef.current?.offsetHeight ?? 0;
      if (!containerW || !containerH) return current;

      let x1 = Infinity, x2 = -Infinity, y1 = Infinity, y2 = -Infinity;
      allIds.forEach(id => {
        const p = current[id];
        if (!p) return;
        const w = id === master.id ? MASTER_W : NODE_W;
        const h = id === master.id ? MASTER_H : NODE_H;
        x1 = Math.min(x1, p.x);
        x2 = Math.max(x2, p.x + w);
        y1 = Math.min(y1, p.y);
        y2 = Math.max(y2, p.y + h);
      });

      const PAD = 32;
      const contentW = (x2 - x1) + PAD * 2;
      const contentH = (y2 - y1) + PAD * 2;
      const fitZoom = Math.min(
        containerW / contentW,
        containerH / contentH,
        0.92
      );
      const contentCX = (x1 + x2) / 2;
      const contentCY = (y1 + y2) / 2;
      // pan needed to center bounding box in container
      const panX = (containerW / 2 - contentCX) * fitZoom;
      const panY = (containerH / 2 - contentCY) * fitZoom;

      setZoom(fitZoom);
      setPan({ x: panX, y: panY });
      return current; // positions unchanged
    });
  }, [master, subContracts]);

  // Run auto-fit once after positions are populated
  useEffect(() => {
    if (!master || !containerRef.current) return;
    const allIds = [master.id, ...subContracts.map(c => c.id)];
    if (!allIds.every(id => positions[id])) return;
    fitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [master?.id, subContracts.length, Object.keys(positions).join(',')]);

  // ResizeObserver: re-fit when container size changes (e.g. left rail dragged)
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => { fitAll(); });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [fitAll]);

  // Flash animation helper
  const flashNodes = useCallback((ids) => {
    setFlashIds(new Set(ids));
    setTimeout(() => setFlashIds(new Set()), 2000);
  }, []);

  // Drag handlers
  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const { id, startX, startY, origX, origY } = dragging.current;
    setPositions(prev => ({ ...prev, [id]: { x: origX + e.clientX - startX, y: origY + e.clientY - startY } }));
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = null;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = useCallback((id, e) => {
    const pos = positions[id];
    if (!pos) return;
    dragging.current = { id, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [positions, onMouseMove, onMouseUp]);

  // Edge path helper
  function edgePath(fromId, toId, fw, fh, tw, th, curveBias = -20) {
    const f = positions[fromId], t = positions[toId];
    if (!f || !t) return null;
    const x1 = f.x + fw / 2, y1 = f.y + fh / 2;
    const x2 = t.x + tw / 2, y2 = t.y + th / 2;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return `M ${x1} ${y1} Q ${mx} ${my + curveBias} ${x2} ${y2}`;
  }

  // Apply + propagate from NodeQuickEdit
  const handleNodeApply = useCallback(async () => {
    if (onContractChange) await onContractChange();
    else {
      // Just reload — the NodeQuickEdit does its own API calls
    }
    // Flash the edited node + its connections
    if (quickEditId) flashNodes([quickEditId]);
  }, [quickEditId, onContractChange, flashNodes]);

  const handleTerminate = useCallback(async (id) => {
    try {
      const result = await api.terminateContract(id);
      flashNodes([id, ...(result.affected_ids ?? [])]);
      if (onTerminate) onTerminate(id);
    } catch (_) {}
  }, [flashNodes, onTerminate]);

  if (!master) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:C.textMuted, fontFamily:font.ui }}>
        Sin contratos — selecciona una plantilla para comenzar.
      </div>
    );
  }

  const allContracts = [master, ...subContracts];
  const quickEditContract = quickEditId ? (contractsMap?.[quickEditId] ?? null) : null;
  const quickEditIsMaster = quickEditId === master?.id;
  const quickEditPos = quickEditId ? (positions[quickEditId] ?? null) : null;

  const zBtn = { background:"none", border:"none", cursor:"pointer", fontSize:13, color:C.textMuted,
    padding:"2px 6px", borderRadius:4, fontFamily:font.mono, fontWeight:700,
    transition:"background 0.1s", lineHeight:1 };

  // Is this a KPMG ecosystem? (determines whether to show flow particles)
  const isKPMG = subContracts.some(c => ["FINANCIACION","HIPOTECA_GARANTIA","CESION_CREDITO"].includes(c.type));
  const finContract = subContracts.find(c => c.type === "FINANCIACION");
  const cesContract = subContracts.find(c => c.type === "CESION_CREDITO");

  // ── Full-network view (viewMode === "full") ─────────────────────────────────
  if (viewMode === "full") {
    return (
      <div style={{ flex:1, position:"relative", overflow:"hidden", background:C.bg, display:"flex", flexDirection:"column" }}>
        <style>{`@keyframes dashFlow { to { stroke-dashoffset:-24; } }`}</style>

        {/* Top bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:20, display:"flex", alignItems:"center",
          gap:6, padding:"6px 10px", background:"rgba(14,20,38,0.85)", borderBottom:`1px solid ${C.borderDark}` }}>
          <div style={{ fontSize:9, color:"#94A3B8", fontFamily:font.mono, letterSpacing:"0.1em", flex:1 }}>
            ◈ Vista completa · Red Contractual
          </div>
          <button
            aria-label="Volver a vista radial"
            onClick={() => setInternalViewMode("radial")}
            style={{ padding:"3px 10px", background:C.cyan + "25", color:C.cyan, border:`1px solid ${C.cyan}40`,
              borderRadius:5, cursor:"pointer", fontSize:10, fontFamily:font.ui, fontWeight:600 }}>
            ◉ Vista simple
          </button>
        </div>

        {/* Full network canvas */}
        <div style={{ flex:1, marginTop:32, overflow:"hidden" }}>
          <FullNetworkView
            contractsMap={contractsMap ?? {}}
            selectedId={selectedId}
            onSelectNode={(id) => { onSelect(id); }}
            flashIds={flashIds}
            reducedMotion={reducedMotion}
            pendingEditId={pendingEditId}
          />
        </div>
      </div>
    );
  }

  // ── Radial view (default) ───────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{ flex:1, position:"relative", overflow:"hidden", background:C.bg, cursor: isPanning ? "grabbing" : "default" }}
      onClick={() => { onSelect(null); setSelectedEdge(null); setQuickEditId(null); }}
      onMouseDown={onPanStart}
      onMouseMove={onPanMove}
      onMouseUp={onPanEnd}
      onMouseLeave={onPanEnd}
    >
      <style>{`
        @keyframes contractPulse { 0%,100% { box-shadow:0 3px 10px rgba(0,0,0,0.09); } 50% { box-shadow:0 0 0 6px ${C.orange}22,0 12px 32px rgba(0,0,0,0.12); } }
        @keyframes dashFlow { to { stroke-dashoffset:-24; } }
        @keyframes edgeFlash { 0%,100% { opacity:0.45; } 50% { opacity:1; } }
        @keyframes edgeFlashSib { 0%,100% { opacity:0.3; } 50% { opacity:0.8; } }
        @keyframes particleFlow { 0% { offset-distance:0%; opacity:0; } 10% { opacity:0.9; } 90% { opacity:0.9; } 100% { offset-distance:100%; opacity:0; } }
        @keyframes opusNeedsReviewPulse { 0%,100% { opacity:1; } 50% { opacity:0.2; } }
      `}</style>

      {/* Zoom controls */}
      <div onClick={e => e.stopPropagation()}
        style={{ position:"absolute", top:10, left:"50%", transform:"translateX(-50%)", zIndex:30,
          display:"flex", gap:4, background:C.white, border:`1px solid ${C.border}`,
          borderRadius:8, padding:"3px 6px", boxShadow:"0 1px 6px rgba(0,0,0,0.1)" }}>
        <button onClick={() => setZoom(p => Math.min(2.5, p+0.2))}
          style={{ ...zBtn }}>+</button>
        <button onClick={() => setZoom(1)}
          style={{ ...zBtn, minWidth:48, fontSize:9 }}>{Math.round(zoom*100)}%</button>
        <button onClick={() => setZoom(p => Math.max(0.3, p-0.2))}
          style={{ ...zBtn }}>−</button>
        <button onClick={() => { setZoom(1); setPan({x:0,y:0}); }}
          style={{ ...zBtn, fontSize:9 }}>⊞</button>
        <button
          onClick={fitAll}
          title="Ajustar todo — ver todos los contratos"
          style={{ ...zBtn, minWidth: 48, fontSize: 9 }}
        >⊡ Todo</button>
        <span style={{ fontSize:8, color:C.textLight, fontFamily:font.mono, alignSelf:"center", paddingLeft:4 }}>
          scroll · drag med
        </span>
      </div>

      {/* Panel label */}
      <div style={{ position:"absolute", top:10, left:10, zIndex:10, background:"rgba(14,20,38,0.75)", color:"#94A3B8", fontSize:9, fontFamily:font.mono, letterSpacing:"0.1em", padding:"3px 8px", borderRadius:4, pointerEvents:"none" }}>
        L1 · Red Contractual
      </div>

      {/* ◈ Vista completa toggle button */}
      <button
        aria-label="Cambiar a vista completa de la red"
        onClick={e => { e.stopPropagation(); toggleViewMode(); }}
        style={{
          position: "absolute", top: 50, left: 10, zIndex: 25,
          padding: "4px 10px",
          background: C.white,
          color: C.cyan,
          border: `1px solid ${C.cyan}50`,
          borderRadius: 6, cursor: "pointer",
          fontSize: 10, fontFamily: font.ui, fontWeight: 600,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          transition: "background 0.15s",
        }}
      >
        ◈ Vista completa
      </button>

      {/* Replay button — visible only after at least one cascade has flashed */}
      {hasLastFlash && (
        <button
          aria-label="Reproducir última cascada"
          onClick={e => {
            e.stopPropagation();
            if (replayActive) return;
            setReplayActive(true);
            flashNodes(lastFlashRef.current);
            setTimeout(() => setReplayActive(false), 3000);
          }}
          style={{
            position: "absolute", top: 50, right: 10, zIndex: 25,
            padding: "4px 10px",
            background: replayActive ? C.orange : C.white,
            color: replayActive ? C.white : C.orange,
            border: `1px solid ${C.orange}60`,
            borderRadius: 6, cursor: replayActive ? "default" : "pointer",
            fontSize: 11, fontFamily: font.ui, fontWeight: 600,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            transition: "background 0.2s, color 0.2s",
            opacity: replayActive ? 0.8 : 1,
          }}
        >
          {replayActive ? "⟳ Reproduciendo…" : "↺ Replay"}
        </button>
      )}

      {/* Toolbar: lifecycle actions */}
      {selectedId && selectedId !== master?.id && contractsMap?.[selectedId]?.status !== "TERMINATED" && (
        <div onClick={e => e.stopPropagation()}
          style={{ position:"absolute", top:10, right:10, zIndex:20, display:"flex", gap:6 }}>
          <button onClick={() => handleTerminate(selectedId)}
            style={{ padding:"5px 12px", background:C.redBg, color:C.red, border:`1px solid ${C.red}30`, borderRadius:6, cursor:"pointer", fontSize:11, fontFamily:font.ui, fontWeight:600, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
            ✕ Terminar
          </button>
          <button onClick={() => setQuickEditId(selectedId)}
            style={{ padding:"5px 12px", background:C.white, color:C.blue, border:`1px solid ${C.blue}30`, borderRadius:6, cursor:"pointer", fontSize:11, fontFamily:font.ui, fontWeight:600, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
            ✎ Editar
          </button>
        </div>
      )}
      {selectedId === master?.id && (
        <div onClick={e => e.stopPropagation()}
          style={{ position:"absolute", top:10, right:10, zIndex:20 }}>
          <button onClick={() => setQuickEditId(master.id)}
            style={{ padding:"5px 12px", background:C.white, color:C.gold, border:`1px solid ${C.gold}40`, borderRadius:6, cursor:"pointer", fontSize:11, fontFamily:font.ui, fontWeight:600, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
            ✎ Editar Marco
          </button>
        </div>
      )}

      {/* Dot grid — not zoomed, always covers container */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
        <defs>
          <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill={C.borderStrong} opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* ── Zoomable + pannable content ── */}
      <div style={{
        position:"absolute", inset:0,
        transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
        transformOrigin:"center center",
        transition: isPanning ? "none" : "transform 0.15s ease",
      }}>

      {/* SVG connection lines */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
        <defs>
          {subContracts.map(c => {
            const d = edgePath(master.id, c.id, MASTER_W, MASTER_H, NODE_W, NODE_H);
            return d ? <path key={`def-${c.id}`} id={`ep-${c.id}`} d={d} fill="none" /> : null;
          })}
        </defs>

        {/* Master → sub-contract IF edges */}
        {subContracts.map(c => {
          const meta = SUB_META[c.type];
          const d    = edgePath(master.id, c.id, MASTER_W, MASTER_H, NODE_W, NODE_H);
          if (!d) return null;
          const col      = meta?.color ?? C.textMuted;
          // activeFlashIds: edge is active when this sub-contract is in the current flash set
          const isFlash  = flashIds.has(c.id) || flashIds.has(master.id);
          const isSel    = selectedEdge?.kind === "master-sub" && selectedEdge?.toId === c.id;
          const mid      = midPoint(d);

          // Opus ring data for this sub-contract node
          const subContract  = contractsMap?.[c.id] ?? c;
          const opusLevel    = getOpusLevel(subContract);
          const subPos       = positions[c.id];
          const nodeR        = 8; // visual ring reference radius (rings are around the node card, rendered in SVG space)

          return (
            <g key={c.id} style={{ cursor:"pointer", pointerEvents:"all" }}
               onClick={e => { e.stopPropagation(); setSelectedEdge({ kind:"master-sub", fromId:master.id, toId:c.id, fromType:"MASTER", toType:c.type }); setQuickEditId(null); }}>
              <path d={d} stroke="transparent" strokeWidth={20} fill="none" />
              {isSel && <path d={d} stroke={col} strokeWidth={8} fill="none" opacity={0.15} />}

              {/* Active cascade: thicker highlight line (fallback for reduced-motion) */}
              {isFlash && reducedMotion && (
                <path d={d} stroke={C.orange} strokeWidth={3} fill="none" opacity={0.7} />
              )}

              {/* glow halo */}
              <path d={d} stroke={col} strokeWidth={8} fill="none" opacity={isFlash ? 0.25 : 0.1} />
              {/* main edge */}
              <path d={d} stroke={col} strokeWidth={isSel ? 3.5 : 2.5}
                strokeDasharray={isFlash ? "none" : "10 5"} fill="none"
                opacity={isFlash ? 1 : isSel ? 1 : 0.75}
                style={{ animation: isFlash ? "edgeFlash 0.5s ease 4" : "dashFlow 2.5s linear infinite" }} />
              {/* arrowhead at target end */}
              {mid && <path d={`M ${mid.x - 6} ${mid.y - 4} L ${mid.x + 2} ${mid.y} L ${mid.x - 6} ${mid.y + 4}`}
                stroke={col} strokeWidth={1.5} fill="none" opacity={0.8} />}
              {/* label pill */}
              <rect x={mid.x - 12} y={mid.y - 9} width={24} height={14} rx={4}
                fill={col} opacity={isSel ? 0.9 : 0.8} />
              <text x={mid.x} y={mid.y + 1} textAnchor="middle" fontSize={9} fill="#fff"
                fontFamily="'JetBrains Mono','Courier New',monospace" fontWeight="800">IF</text>

              {/* ── Cascade edge pulse dot (travels master → sub while edge is active) ── */}
              {isFlash && !reducedMotion && (
                <circle r={5} fill={C.orange} opacity={0.9} pointerEvents="none">
                  <animateMotion
                    dur="1.2s"
                    repeatCount="indefinite"
                    path={d}
                  />
                </circle>
              )}

              {/* KPMG money-out particles (gold → FINANCIACION) */}
              {isKPMG && c.type === "FINANCIACION" && !reducedMotion && [0, 1.1, 2.2].map((delay, i) => (
                <circle key={i} r={4} fill="#C9A84C" opacity={0.9}>
                  <animateMotion dur="2.8s" begin={`${delay}s`} repeatCount="indefinite" rotate="auto">
                    <mpath href={`#ep-${c.id}`} />
                  </animateMotion>
                </circle>
              ))}
              {/* KPMG rent-back particles (cyan ← CESION_CREDITO, reversed) */}
              {isKPMG && c.type === "CESION_CREDITO" && !reducedMotion && [0, 1.4, 2.8].map((delay, i) => (
                <circle key={i} r={3.5} fill={C.cyan} opacity={0.85}>
                  <animateMotion dur="3.5s" begin={`${delay}s`} repeatCount="indefinite" rotate="auto" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                    <mpath href={`#ep-${c.id}`} />
                  </animateMotion>
                </circle>
              ))}

              {/* ── Opus-level ring around the sub-contract node ── */}
              {subPos && opusLevel === "OPONIBLE" && (
                <rect
                  x={subPos.x - 4} y={subPos.y - 4}
                  width={NODE_W + 8} height={NODE_H + 8}
                  rx={14} ry={14}
                  fill="none"
                  stroke={C.gold} strokeWidth={2}
                  pointerEvents="none"
                  opacity={0.85}
                />
              )}
              {subPos && opusLevel === "COMPLETE" && (
                <rect
                  x={subPos.x - 4} y={subPos.y - 4}
                  width={NODE_W + 8} height={NODE_H + 8}
                  rx={14} ry={14}
                  fill="none"
                  stroke={C.white} strokeWidth={1}
                  strokeDasharray="4 4"
                  pointerEvents="none"
                  opacity={0.6}
                />
              )}
              {subPos && opusLevel === "PARTIAL" && subContract.status === "NEEDS_REVIEW" && (
                <rect
                  x={subPos.x - 4} y={subPos.y - 4}
                  width={NODE_W + 8} height={NODE_H + 8}
                  rx={14} ry={14}
                  fill="none"
                  stroke={C.orange} strokeWidth={2}
                  pointerEvents="none"
                >
                  {!reducedMotion && (
                    <animate
                      attributeName="opacity"
                      values="1;0.2;1"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  )}
                </rect>
              )}
            </g>
          );
        })}

        {/* Sub → Sub IF edges (sibling connections) */}
        {SUB_IF_EDGES.flatMap(edge => {
          const srcList = subContracts.filter(c => c.type === edge.a);
          const dstList = subContracts.filter(c => c.type === edge.b);
          return srcList.flatMap(src =>
            dstList.map(dst => {
              const srcPos = positions[src.id], dstPos = positions[dst.id];
              if (!srcPos || !dstPos) return null;
              const x1 = srcPos.x + NODE_W / 2, y1 = srcPos.y + NODE_H / 2;
              const x2 = dstPos.x + NODE_W / 2, y2 = dstPos.y + NODE_H / 2;
              const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
              const d  = `M ${x1} ${y1} Q ${mx} ${my + 50} ${x2} ${y2}`;
              const isFlash = flashIds.has(src.id) || flashIds.has(dst.id);
              const isSel   = selectedEdge?.kind === "sibling" && selectedEdge?.fromId === src.id && selectedEdge?.toId === dst.id;
              const mid     = midPoint(d);
              const col     = edge.type === "logic" ? C.red : C.cyan;
              const dash    = edge.type === "logic" ? "" : "4 4";
              const animation = isFlash ? "edgeFlashSib 0.5s ease 4" : "dashFlow 3.5s linear infinite reverse";
              return (
                <g key={`sib-${src.id}-${dst.id}`} style={{ cursor:"pointer", pointerEvents:"all" }}
                   onClick={e => { e.stopPropagation(); setSelectedEdge({ kind:"sibling", fromId:src.id, toId:dst.id, fromType:edge.a, toType:edge.b, edgeDef:edge }); setQuickEditId(null); }}>
                  <path d={d} stroke="transparent" strokeWidth={18} fill="none" />
                  {isSel && <path d={d} stroke={col} strokeWidth={6} fill="none" opacity={0.2} />}
                  {/* glow halo */}
                  <path d={d} stroke={col} strokeWidth={6} fill="none" opacity={isFlash ? 0.3 : 0.12} />
                  {/* main sibling IF edge */}
                  <path d={d} stroke={col} strokeWidth={isSel ? 3 : 2.5} strokeDasharray={dash}
                    fill="none"
                    opacity={isFlash ? 1 : isSel ? 1 : 0.7}
                    style={{ animation: isFlash ? animation : edge.type === "logic" ? undefined : animation }} />
                  {/* label pill */}
                  <rect x={mid.x - 22} y={mid.y + 6} width={44} height={14} rx={4}
                    fill={col} opacity={0.85} />
                  <text x={mid.x} y={mid.y + 17} textAnchor="middle" fontSize={8} fill="#fff"
                    fontFamily="'JetBrains Mono','Courier New',monospace" fontWeight="700">
                    IF·{(edge.label ?? "").slice(0, 6)}
                  </text>
                </g>
              );
            })
          );
        })}

        {/* ── Opus-level ring for the MASTER node ── */}
        {(() => {
          const masterPos   = positions[master.id];
          const masterOpus  = getOpusLevel(contractsMap?.[master.id] ?? master);
          if (!masterPos) return null;
          if (masterOpus === "OPONIBLE") {
            return (
              <rect
                x={masterPos.x - 4} y={masterPos.y - 4}
                width={MASTER_W + 8} height={MASTER_H + 8}
                rx={14} ry={14}
                fill="none"
                stroke={C.gold} strokeWidth={2}
                pointerEvents="none"
                opacity={0.85}
              />
            );
          }
          if (masterOpus === "COMPLETE") {
            return (
              <rect
                x={masterPos.x - 4} y={masterPos.y - 4}
                width={MASTER_W + 8} height={MASTER_H + 8}
                rx={14} ry={14}
                fill="none"
                stroke={C.white} strokeWidth={1}
                strokeDasharray="4 4"
                pointerEvents="none"
                opacity={0.6}
              />
            );
          }
          if (master.status === "NEEDS_REVIEW") {
            return (
              <rect
                x={masterPos.x - 4} y={masterPos.y - 4}
                width={MASTER_W + 8} height={MASTER_H + 8}
                rx={14} ry={14}
                fill="none"
                stroke={C.orange} strokeWidth={2}
                pointerEvents="none"
              >
                {!reducedMotion && (
                  <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
                )}
              </rect>
            );
          }
          return null;
        })()}
      </svg>

      {/* Contract nodes */}
      {allContracts.map(c => {
        const isMaster = c.id === master.id;
        const meta  = isMaster ? null : SUB_META[c.type];
        const pos   = positions[c.id];
        if (!pos) return null;
        return (
          <NodeCard
            key={c.id}
            id={c.id}
            contract={c}
            meta={meta}
            pos={pos}
            isMaster={isMaster}
            selected={selectedId === c.id}
            flash={flashIds.has(c.id) || (cascadeRunning && c.status === "NEEDS_REVIEW")}
            pendingEdit={pendingEditId === c.id}
            onClick={id => { onSelect(id); setSelectedEdge(null); setQuickEditId(null); }}
            onDoubleClick={id => { setQuickEditId(id); onSelect(id); setSelectedEdge(null); }}
            onMouseDown={onMouseDown}
            allContracts={contractsMap}
          />
        );
      })}

      {/* Floating NodeQuickEdit card */}
      {quickEditId && quickEditContract && quickEditPos && (
        <NodeQuickEdit
          contract={quickEditContract}
          isMaster={quickEditIsMaster}
          pos={quickEditPos}
          w={quickEditIsMaster ? MASTER_W : NODE_W}
          h={quickEditIsMaster ? MASTER_H : NODE_H}
          onClose={() => setQuickEditId(null)}
          onApply={handleNodeApply}
          onTerminate={handleTerminate}
        />
      )}

      {/* Hint */}
      {subContracts.length === 0 && master && (
        <div style={{ position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)", fontSize:13, color:C.textMuted, fontFamily:font.ui, textAlign:"center", pointerEvents:"none" }}>
          Completa los campos del contrato marco y genera los subcontratos →
        </div>
      )}

      {/* KPMG legend: particle flows */}
      {isKPMG && (
        <div style={{ position:"absolute", bottom:selectedEdge?248:20, left:14, zIndex:60,
          background:C.navyDeep, borderRadius:8, padding:"7px 10px", fontSize:9,
          fontFamily:font.mono, boxShadow:"0 2px 8px rgba(0,0,0,0.2)" }}>
          <div style={{ color:C.gold, marginBottom:3 }}>● Flujo de capital (€100M salida)</div>
          <div style={{ color:C.cyan }}>● Rentas + IVA (€1.06M/mes entrada)</div>
        </div>
      )}

      {/* Close zoom container */}
      </div>

      {/* Legend toggle */}
      <button onClick={e => { e.stopPropagation(); setLegendVisible(p => !p); }}
        style={{ position:"absolute", bottom: selectedEdge ? 248 : 20, right:20, background:C.white, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 11px", cursor:"pointer", fontSize:11, fontFamily:font.ui, color:C.textMuted, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", transition:"bottom 0.25s", zIndex:60 }}>
        {legendVisible ? "Ocultar leyenda ▾" : "Leyenda ▸"}
      </button>

      {legendVisible && (
        <div style={{ position:"absolute", bottom: selectedEdge ? 288 : 58, right:20, background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", boxShadow:"0 2px 8px rgba(0,0,0,0.08)", zIndex:60, transition:"bottom 0.25s" }}>
          <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.ui, fontWeight:600, marginBottom:7, textTransform:"uppercase", letterSpacing:"0.05em" }}>Leyenda</div>
          {[["Activo",C.green],["Modificado",C.gold],["Requiere revisión",C.orange],["Terminado",C.textLight]].map(([lbl,col]) => (
            <div key={lbl} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:col }} />
              <span style={{ fontSize:11, color:C.textMuted, fontFamily:font.ui }}>{lbl}</span>
            </div>
          ))}
          <div style={{ marginTop:6, borderTop:`1px solid ${C.border}`, paddingTop:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
              <div style={{ width:20, height:2, background:C.gold, borderRadius:1, borderTop:"2px dashed" }} />
              <span style={{ fontSize:10, color:C.textMuted }}>Vínculo jurídico Maestro → Subcontrato</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:20, height:2, background:C.cyan, borderRadius:1, borderTop:"1px dashed" }} />
              <span style={{ fontSize:10, color:C.textMuted }}>Conexión entre subcontratos</span>
            </div>
          </div>
          <div style={{ marginTop:6, fontSize:9, color:C.textLight, fontFamily:font.ui }}>
            Clic en arista · Doble clic en nodo
          </div>
        </div>
      )}

      {/* Edge condition panel (slides up from bottom) */}
      {selectedEdge && (
        <EdgePanel
          edge={selectedEdge}
          subContracts={subContracts}
          conditions={conditions}
          onAddCondition={c => setConditions(prev => [...prev, c])}
          onRemoveCondition={id => setConditions(prev => prev.filter(c => c.id !== id))}
          onClose={() => setSelectedEdge(null)}
        />
      )}
    </div>
  );
}
