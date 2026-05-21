/**
 * CascadeControlPanel — interactive interface to manipulate contract conditions
 * and observe propagation across the full contract network (master ↔ sub ↔ sub).
 *
 * Implements Bloque II IF logic: any change in one phenomenon cascades through
 * its IF connections to siblings and the master, then triggers auto-homologation.
 */
import { useState, useCallback } from "react";
import { C, font, SUB_META, SUB_IF_EDGES, SUB_CASCADE_FIELDS, SUB_CASCADE_FIELD_LABELS } from "../constants.js";
import * as api from "../api/phenomenon.js";

// ─── Field definitions for each contract type ─────────────────────────────────
const CASCADE_CONTROL_FIELDS = {
  MASTER: [
    { key: "jurisdiction",  label: "Juzgados Competentes", group: "ESS", type: "text" },
    { key: "expiryDate",    label: "Fecha de Vencimiento", group: "ESS", type: "date" },
    { key: "partyA",        label: "Parte A",              group: "ESS", type: "text" },
    { key: "partyB",        label: "Parte B",              group: "ESS", type: "text" },
  ],
  NDA: [
    { key: "confidentialityPeriod", label: "Plazo Confidencialidad (años)", group: "AG", type: "number" },
    { key: "penaltyAmount",         label: "Cláusula Penal (€)",            group: "AG", type: "number" },
    { key: "noticePeriod",          label: "Preaviso (días)",               group: "AG", type: "number" },
  ],
  SLA: [
    { key: "availability",      label: "Disponibilidad Garantizada (%)", group: "AG", type: "number" },
    { key: "penaltyPct",        label: "Penalización por Caída (%)",     group: "AG", type: "number" },
    { key: "maxMonthlyPenalty", label: "Tope Mensual (%)",               group: "AG", type: "number" },
  ],
  PAYMENT: [
    { key: "paymentDays",  label: "Plazo de Pago (días)",  group: "AG", type: "number" },
    { key: "baseAmount",   label: "Importe Base (€)",      group: "AG", type: "number" },
    { key: "retentionPct", label: "Retención (%)",         group: "AG", type: "number" },
  ],
  DPA: [
    { key: "dataRetention",        label: "Retención de Datos (años)", group: "AG", type: "number" },
    { key: "internationalTransfer",label: "Transferencia Internacional", group: "AG",
      type: "select", options: ["No aplica","Cláusulas tipo UE (SCCs)","Decisión adecuación","Binding Corporate Rules"] },
    { key: "subprocessors",        label: "Subencargados autorizados",  group: "AG", type: "text" },
  ],
  IP: [
    { key: "exclusivity", label: "Exclusividad", group: "AG",
      type: "select", options: ["Exclusiva","No exclusiva","Exclusiva por canal","Selectiva"] },
    { key: "territory",   label: "Territorio", group: "AG",
      type: "select", options: ["España","Unión Europea","Mundial","A definir"] },
    { key: "duration",    label: "Duración (años)", group: "AG", type: "number" },
  ],
};

// Build a map of IF edges: type → list of types it connects to
function buildIfMap() {
  const map = {};
  SUB_IF_EDGES.forEach(({ a, b, dir }) => {
    if (!map[a]) map[a] = [];
    if (!map[b]) map[b] = [];
    if (dir !== "BA") map[a].push(b);
    if (dir !== "AB") map[b].push(a);
  });
  return map;
}
const IF_MAP = buildIfMap();

// ─── Impact preview ───────────────────────────────────────────────────────────
function ImpactBadge({ type, reason, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px",
      background:`${color}10`, border:`1px solid ${color}30`,
      borderLeft:`3px solid ${color}`, borderRadius:6, marginBottom:5 }}>
      <span style={{ fontSize:11, color, fontFamily:font.mono, fontWeight:700 }}>{type}</span>
      <span style={{ fontSize:10, color:C.textMuted, fontFamily:font.ui, flex:1 }}>{reason}</span>
      <span style={{ fontSize:9, color, fontFamily:font.mono }}>NEEDS_REVIEW →</span>
    </div>
  );
}

// ─── Single contract control block ───────────────────────────────────────────
function ContractBlock({ contract, isMaster, fields, onApplyChange, applying, recentlyAffected }) {
  const [editField, setEditField] = useState(null);
  const [editVal, setEditVal] = useState("");
  const meta = isMaster ? null : SUB_META[contract.type];
  const color = isMaster ? C.gold : (meta?.color ?? C.textMuted);
  const isAffected = recentlyAffected.includes(contract.id);

  const handleApply = useCallback(async () => {
    if (!editField || editVal === "") return;
    await onApplyChange(contract, editField, editVal, isMaster);
    setEditField(null);
    setEditVal("");
  }, [contract, editField, editVal, isMaster, onApplyChange]);

  if (!fields) return null;
  return (
    <div style={{
      background: isAffected ? `${C.orange}08` : C.white,
      border: `1.5px solid ${isAffected ? C.orange : color}30`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 10, padding: "14px 16px", marginBottom: 12,
      transition: "border-color 0.4s, background 0.4s",
      animation: isAffected ? "blockPulse 1s ease" : "none",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <span style={{ fontSize:18, color }}>{isMaster ? "⬡" : (meta?.icon ?? "○")}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.textDark, fontFamily:font.ui }}>
            {contract.name}
          </div>
          <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginTop:1 }}>
            {isMaster ? "Contrato Marco" : (meta?.short ?? contract.type)}
            {isAffected && <span style={{ marginLeft:8, color:C.orange }}>⚠ NEEDS_REVIEW</span>}
          </div>
        </div>
        {/* IF connections badge */}
        {!isMaster && IF_MAP[contract.type]?.length > 0 && (
          <div style={{ fontSize:9, color:C.cyan, fontFamily:font.mono, background:`${C.cyan}10`,
            padding:"2px 7px", borderRadius:4, border:`1px solid ${C.cyan}30` }}>
            IF→ {IF_MAP[contract.type].join(", ")}
          </div>
        )}
      </div>

      {/* Field controls */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {fields.map(f => {
          const isEditing = editField === f.key;
          const currentVal = f.group === "ESS"
            ? (contract.ess?.[f.key] ?? "")
            : (contract.ag?.terms?.[f.key] ?? "");
          return (
            <div key={f.key} style={{ gridColumn: f.type === "select" ? "1/-1" : undefined }}>
              <div style={{ fontSize:9, fontWeight:600, color:C.textMuted, fontFamily:font.ui,
                textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:3 }}>
                {f.label}
                <span style={{ marginLeft:5, fontSize:8, color:color, fontFamily:font.mono,
                  background:`${color}15`, padding:"0 4px", borderRadius:3 }}>{f.group}</span>
              </div>
              {isEditing ? (
                <div style={{ display:"flex", gap:5 }}>
                  {f.type === "select" ? (
                    <select value={editVal} onChange={e => setEditVal(e.target.value)}
                      style={{ flex:1, padding:"5px 8px", fontSize:12, fontFamily:font.ui,
                        border:`1.5px solid ${color}`, borderRadius:5, background:C.bgInput }}>
                      <option value="">— seleccionar —</option>
                      {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type ?? "text"}
                      value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      autoFocus
                      style={{ flex:1, padding:"5px 8px", fontSize:12, fontFamily:f.type==="number"?font.mono:font.ui,
                        border:`1.5px solid ${color}`, borderRadius:5, background:C.bgInput, color:C.textDark }}
                    />
                  )}
                  <button onClick={handleApply} disabled={applying}
                    style={{ padding:"5px 10px", background:color, color:isMaster?"#000":C.white,
                      border:"none", borderRadius:5, cursor:"pointer", fontSize:11, fontFamily:font.ui, fontWeight:700, flexShrink:0 }}>
                    {applying ? "⟳" : "▶ Aplicar"}
                  </button>
                  <button onClick={() => { setEditField(null); setEditVal(""); }}
                    style={{ padding:"5px 8px", background:"none", border:`1px solid ${C.border}`,
                      borderRadius:5, cursor:"pointer", fontSize:11, color:C.textMuted }}>✕</button>
                </div>
              ) : (
                <button onClick={() => { setEditField(f.key); setEditVal(String(currentVal)); }}
                  style={{ width:"100%", textAlign:"left", padding:"6px 10px",
                    background:currentVal ? C.bgAlt : `${C.orange}08`,
                    border:`1px solid ${currentVal ? C.border : C.orange}40`,
                    borderRadius:5, cursor:"pointer", fontFamily:f.type==="number"?font.mono:font.ui,
                    fontSize:12, color:currentVal ? C.textBody : C.textLight }}>
                  {currentVal || <span style={{ color:C.textLight, fontStyle:"italic" }}>Sin valor — click para editar</span>}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function CascadeControlPanel({ master, subContracts, contracts, onLoadContracts, onHomologate, addLog }) {
  const [applying, setApplying] = useState(false);
  const [recentlyAffected, setRecentlyAffected] = useState([]);
  const [cascadeTrace, setCascadeTrace] = useState([]);
  const [autoHomologate, setAutoHomologate] = useState(true);

  const flashAffected = useCallback((ids) => {
    setRecentlyAffected(ids);
    setTimeout(() => setRecentlyAffected([]), 4000);
  }, []);

  const addTrace = useCallback((entry) => {
    setCascadeTrace(prev => [entry, ...prev].slice(0, 50));
  }, []);

  const applyChange = useCallback(async (contract, field, value, isMaster) => {
    setApplying(true);
    const affected = [];
    try {
      if (isMaster) {
        // ESS change → master cascade (master → all subs)
        await api.updatePhenomenon(contract.id, { ess: { [field]: value } });
        const result = await api.triggerCascade(contract.id, field, value);
        affected.push(...result.affected_ids);
        addTrace({ t: new Date().toLocaleTimeString("es-ES",{hour12:false}), type:"master→sub",
          from:"MASTER", field, value, affected: result.affected_count });
        if (addLog) addLog("CASCADE", `Master.${field}="${value}" → ${result.affected_count} subcontrato(s)`, "cascade");
      } else {
        // AG term change in sub-contract → sub-to-sub + sub-to-master cascades
        const newAg = { ...contract.ag, terms: { ...(contract.ag?.terms ?? {}), [field]: value } };
        await api.updatePhenomenon(contract.id, { ag: newAg });

        const cascadeFields = SUB_CASCADE_FIELDS[contract.type] ?? [];
        if (cascadeFields.includes(field)) {
          const [sibResult, revResult] = await Promise.all([
            api.triggerSubCascade(contract.id, field, value),
            api.triggerReverseCascade(contract.id, field, value),
          ]);
          affected.push(...sibResult.affected_ids);
          if (sibResult.affected_count > 0) {
            addTrace({ t: new Date().toLocaleTimeString("es-ES",{hour12:false}), type:"sub→sibling",
              from:contract.type, field, value, affected: sibResult.affected_count,
              names: sibResult.trace.map(t=>t.name).join(", ") });
            if (addLog) addLog("IF", `${contract.type}→sibling: ${field}="${value}" → ${sibResult.trace.map(t=>t.name).join(", ")}`, "cascade");
          }
          if (revResult.triggered) {
            affected.push(revResult.master_id);
            addTrace({ t: new Date().toLocaleTimeString("es-ES",{hour12:false}), type:"sub→master",
              from:contract.type, field, value, affected:1, reason: revResult.reason });
            if (addLog) addLog("IF", `${contract.type}→master: ${revResult.reason}`, "cascade");
          }
        }
      }

      await onLoadContracts();
      if (affected.length > 0) flashAffected(affected);

      // Auto-homologate all affected + source
      if (autoHomologate && (affected.length > 0 || true)) {
        const toVerify = [...new Set([contract.id, ...affected])];
        for (const id of toVerify) {
          try { await api.homologate(id); } catch (_) {}
        }
        await onLoadContracts();
        if (addLog && toVerify.length > 0) addLog("OPUS", `Auto-homologación: ${toVerify.length} contrato(s) verificados`, "opus");
      }
    } catch (e) {
      if (addLog) addLog("ERROR", `Error aplicando cambio: ${e.message}`, "error");
    } finally {
      setApplying(false);
    }
  }, [autoHomologate, flashAffected, addTrace, addLog, onLoadContracts]);

  if (!master) return null;

  const allContracts = [{ ...master, _isMaster: true }, ...subContracts];

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"18px 20px", display:"flex", gap:16 }}>
      <style>{`
        @keyframes blockPulse {
          0%   { box-shadow: 0 0 0 0 ${C.orange}60; }
          50%  { box-shadow: 0 0 0 10px ${C.orange}10; }
          100% { box-shadow: 0 0 0 0 ${C.orange}00; }
        }
      `}</style>

      {/* Left: contract blocks */}
      <div style={{ flex:1, minWidth:0 }}>
        {/* Header */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.textDark, marginBottom:4 }}>
            Control de Condiciones — Red Contractual
          </div>
          <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono, marginBottom:10 }}>
            Bloque II IF · Modifica cualquier campo y la cascada se propaga automáticamente
          </div>
          {/* Auto-homologate toggle */}
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer",
            padding:"7px 12px", background:autoHomologate?C.greenBg:C.bgAlt,
            border:`1px solid ${autoHomologate?C.green:C.border}`, borderRadius:7 }}>
            <input type="checkbox" checked={autoHomologate} onChange={e => setAutoHomologate(e.target.checked)}
              style={{ width:14, height:14, accentColor:C.green, cursor:"pointer" }} />
            <span style={{ fontSize:11, fontFamily:font.ui, color:autoHomologate?C.green:C.textMuted, fontWeight:600 }}>
              Auto-homologar tras cada cambio
            </span>
            <span style={{ fontSize:9, fontFamily:font.mono, color:C.textMuted, marginLeft:"auto" }}>
              {autoHomologate ? "⊙ Activo" : "○ Desactivado"}
            </span>
          </label>
        </div>

        {allContracts.map(c => {
          const isMaster = !!c._isMaster;
          const fields = CASCADE_CONTROL_FIELDS[isMaster ? "MASTER" : (c.type ?? "MASTER")] ?? [];
          return (
            <ContractBlock
              key={c.id}
              contract={c}
              isMaster={isMaster}
              fields={fields}
              onApplyChange={applyChange}
              applying={applying}
              recentlyAffected={recentlyAffected}
            />
          );
        })}
      </div>

      {/* Right: cascade trace log */}
      <div style={{ width:240, flexShrink:0 }}>
        <div style={{ position:"sticky", top:0 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textDark, marginBottom:10,
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>Traza IF en tiempo real</span>
            {cascadeTrace.length > 0 && (
              <button onClick={() => setCascadeTrace([])}
                style={{ fontSize:9, color:C.textMuted, background:"none", border:"none", cursor:"pointer", fontFamily:font.mono }}>
                Limpiar
              </button>
            )}
          </div>

          {cascadeTrace.length === 0 ? (
            <div style={{ padding:"16px 12px", background:C.bgAlt, borderRadius:8,
              fontSize:11, color:C.textLight, fontFamily:font.ui, textAlign:"center" }}>
              Modifica un campo para ver la propagación IF
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {cascadeTrace.map((entry, i) => {
                const typeColors = {
                  "master→sub": C.gold,
                  "sub→sibling": C.cyan,
                  "sub→master": C.orange,
                };
                const col = typeColors[entry.type] ?? C.textMuted;
                return (
                  <div key={i} style={{ padding:"8px 10px", background:C.white,
                    border:`1px solid ${col}25`, borderLeft:`3px solid ${col}`,
                    borderRadius:7, fontSize:10 }}>
                    <div style={{ fontFamily:font.mono, color:C.textLight, marginBottom:3 }}>
                      {entry.t} · <span style={{ color:col, fontWeight:700 }}>{entry.type}</span>
                    </div>
                    <div style={{ color:C.textDark, fontFamily:font.ui, marginBottom:2 }}>
                      <span style={{ color:col }}>{entry.from}</span>
                      <span style={{ color:C.textMuted }}>.{SUB_CASCADE_FIELD_LABELS[entry.field] ?? entry.field}</span>
                      <span style={{ color:C.textMuted }}> = </span>
                      <span style={{ fontFamily:font.mono, color:C.textDark }}>{String(entry.value).slice(0,20)}</span>
                    </div>
                    <div style={{ color:C.textMuted, fontFamily:font.ui }}>
                      {entry.affected} afectado(s){entry.names ? `: ${entry.names}` : ""}
                      {entry.reason && <div style={{ marginTop:2, color:col, fontSize:9 }}>{entry.reason.slice(0,60)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* IF topology diagram */}
          <div style={{ marginTop:16, padding:"10px 12px", background:C.bgAlt, borderRadius:8,
            border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.06em", marginBottom:8, fontFamily:font.ui }}>
              Topología IF activa
            </div>
            {SUB_IF_EDGES.map((edge, i) => {
              const hasA = subContracts.some(c => c.type === edge.a);
              const hasB = subContracts.some(c => c.type === edge.b);
              if (!hasA || !hasB) return null;
              const arrow = edge.dir === "both" ? "⇄" : edge.dir === "AB" ? "→" : "←";
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4,
                  fontSize:9, fontFamily:font.mono, color:C.cyan }}>
                  <span style={{ color:SUB_META[edge.a]?.color ?? C.textMuted }}>{edge.a}</span>
                  <span>{arrow}</span>
                  <span style={{ color:SUB_META[edge.b]?.color ?? C.textMuted }}>{edge.b}</span>
                  <span style={{ color:C.textLight, fontSize:8, flex:1 }}>{edge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
