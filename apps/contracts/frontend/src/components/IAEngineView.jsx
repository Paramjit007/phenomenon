import { useState } from "react";
import { C, font, IA_TYPES, SUB_META, statusColor, statusLabel } from "../constants.js";

// ─── Compatibility helper ─────────────────────────────────────────────────────
function iaStatus(instances) {
  if (!instances?.length) return { status: "missing", conflicts: [] };
  const conflicts = [];
  for (let i = 0; i < instances.length; i++)
    for (let j = 0; j < i; j++) {
      const def = IA_TYPES[instances[i]];
      if (def && !def.compatible.includes(instances[j])) conflicts.push([instances[i], instances[j]]);
    }
  return { status: conflicts.length ? "error" : "valid", conflicts };
}

const STATUS_CFG = {
  missing: { icon: "⚠️", label: "SIN IA",    bg: C.orangeBg, border: C.orange, text: C.orange },
  error:   { icon: "❌", label: "CONFLICTO", bg: C.redBg,    border: C.red,    text: C.red    },
  valid:   { icon: "✅", label: "VÁLIDO",    bg: C.greenBg,  border: C.green,  text: C.green  },
};

// ─── Left column: draggable IA cards ─────────────────────────────────────────
function IAColumn({ dragging, onDragStart, onDragEnd }) {
  return (
    <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", background: C.white, overflow: "hidden" }}>

      {/* Column header */}
      <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
          <span style={{ fontSize:9, fontFamily:"'JetBrains Mono','Courier New',monospace", letterSpacing:"0.08em", color:"#64748b", background:"rgba(14,20,38,0.08)", padding:"2px 7px", borderRadius:3 }}>R2 · Motor IA</span>
          <span style={{ fontSize:8, color:C.green, fontFamily:"'JetBrains Mono','Courier New',monospace", background:C.greenBg, padding:"1px 5px", borderRadius:3, border:`1px solid ${C.green}30` }}>✓ Mapping confirmado</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textDark, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Operadores IA — Vectores PHENOMENON</div>
        <div style={{ fontSize: 9, color: C.textMuted, fontFamily: font.ui }}>Mapping canónico confirmado · PHENOMENON Detailed Structural Mapping §5</div>
      </div>

      {/* IA cards — stacked vertically, fills height */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(IA_TYPES).map(([key, def]) => {
          const isDrag = dragging === key;
          return (
            <div key={key}
              draggable
              onDragStart={e => { e.dataTransfer.setData("ia-type", key); onDragStart(key); }}
              onDragEnd={onDragEnd}
              style={{
                padding: "10px 12px",
                background: isDrag ? `linear-gradient(135deg,${def.color}30,${def.color}15)` : `linear-gradient(135deg,${def.color}10,${def.color}04)`,
                border: `2px solid ${isDrag ? def.color : `${def.color}40`}`,
                borderRadius: 10, cursor: "grab", userSelect: "none",
                transform: isDrag ? "scale(0.95) rotate(-1deg)" : "scale(1)",
                boxShadow: isDrag ? `0 8px 20px ${def.color}35` : "0 1px 4px rgba(0,0,0,0.05)",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: `${def.color}18`, border: `1.5px solid ${def.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: def.color, flexShrink: 0 }}>
                  {def.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.textDark, fontFamily: font.ui }}>{def.label}</div>
                  <div style={{ fontSize: 9, color: def.color, fontFamily: font.mono, textTransform: "uppercase", letterSpacing: "0.07em" }}>{def.subtitle}</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font.ui, lineHeight: 1.45 }}>{def.desc}</div>
              <div style={{ marginTop: 5, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                <span style={{ fontSize: 8, color: C.textLight, fontFamily: font.mono }}>✓ {def.compatible.join(", ")}</span>
                {def.formType && <span style={{ fontSize: 8, color: C.green, fontFamily: font.mono, background: C.greenBg, padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>✓ {def.formType}</span>}
              </div>
              {def.vectorProp && (
                <div style={{ fontSize: 7.5, color: C.blue, fontFamily: font.mono, marginTop: 2 }}>
                  modula: {def.vectorProp}
                  {def.plicationType && <span style={{ marginLeft: 6, color: C.textLight }}>· {def.plicationType}</span>}
                </div>
              )}
              {def.bloqueRef && (
                <div style={{ fontSize: 7, color: C.textLight, fontFamily: font.mono, marginTop: 2, fontStyle: "italic" }}>{def.bloqueRef}</div>
              )}
              <div style={{ marginTop: 5, fontSize: 9, color: isDrag ? def.color : C.textLight, fontFamily: font.mono, textAlign: "center", borderTop: `1px dashed ${C.border}`, paddingTop: 5 }}>
                {isDrag ? "soltando…" : "⠿ arrastra →"}
              </div>
            </div>
          );
        })}

        {/* Compatibility rules */}
        <div style={{ marginTop: 4, padding: "10px 12px", background: C.bgAlt, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Compatibilidad</div>
          {Object.entries(IA_TYPES).map(([k, def]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: def.color, width: 18 }}>{def.icon}</span>
              <span style={{ fontSize: 9, color: C.textMuted, fontFamily: font.mono }}>
                + {def.compatible.map(c => IA_TYPES[c]?.icon).join(" ")} {def.compatible.join(", ")}
              </span>
            </div>
          ))}
        </div>

        {/* Final Global Rule */}
        <div style={{ margin: "8px 10px 8px", padding: "8px 10px", background: C.bgAlt, borderRadius: 6, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 7.5, color: C.textLight, fontFamily: font.mono, fontStyle: "italic", lineHeight: 1.5 }}>
            "IA are not words or labels. They are geometric-vectorial operators governing how information, operation and stabilization circulate inside PHENOMENON."
          </div>
          <div style={{ fontSize: 7, color: C.textLight, fontFamily: font.mono, marginTop: 3 }}>— Final Global Rule · Detailed Structural Mapping</div>
        </div>
      </div>
    </div>
  );
}

// ─── Right column: contract drop targets ─────────────────────────────────────
function ContractColumn({ allContracts, dragging, onDrop, onRemoveIA }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [feedback,  setFeedback]  = useState({});

  async function handleDrop(e, contractId) {
    e.preventDefault();
    const ia = e.dataTransfer.getData("ia-type");
    if (!ia) return;
    setHoveredId(null);
    const ok = await onDrop(contractId, ia);
    const key = `${contractId}-${ia}`;
    setFeedback(p => ({ ...p, [key]: ok === false ? "err" : "ok" }));
    setTimeout(() => setFeedback(p => { const n = { ...p }; delete n[key]; return n; }), 2500);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Column header */}
      <div style={{ padding: "10px 16px 8px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.white }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textDark, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Contratos — Zona de Suelte</div>
        <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font.ui }}>Suelta un operador IA sobre un contrato para asignarlo · × para quitar</div>
      </div>

      {/* Contract cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, background: C.bg }}>
        {!allContracts.length ? (
          <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13, fontFamily: font.ui, paddingTop: 40 }}>
            Sin contratos. Genera subcontratos desde R1 (Campos).
          </div>
        ) : allContracts.map(c => {
          const isMaster  = !c.parentId;
          const meta      = isMaster ? null : SUB_META[c.type];
          const col       = isMaster ? C.gold : (meta?.color ?? C.textMuted);
          const instances = c.ia_instances ?? [];
          const { status, conflicts } = iaStatus(instances);
          const cfg       = STATUS_CFG[status];
          const isHover   = hoveredId === c.id;

          return (
            <div key={c.id}
              onDragOver={e => { e.preventDefault(); setHoveredId(c.id); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setHoveredId(null); }}
              onDrop={e => handleDrop(e, c.id)}
              style={{
                background: isHover ? `${col}10` : C.white,
                border: `2px solid ${isHover ? col : C.border}`,
                borderRadius: 10, padding: "13px 15px",
                transition: "all 0.2s",
                boxShadow: isHover ? `0 0 0 4px ${col}20, 0 4px 16px rgba(0,0,0,0.08)` : "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              {/* Contract header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20, color: col }}>{isMaster ? "⬡" : (meta?.icon ?? "○")}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textDark, fontFamily: font.ui }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: statusColor(c.status), fontFamily: font.mono }}>{statusLabel(c.status)}</div>
                </div>
                {/* IA status badge */}
                <div style={{ padding: "4px 10px", background: cfg.bg, border: `1.5px solid ${cfg.border}40`, borderRadius: 6, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                  <span style={{ fontSize: 13 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 10, color: cfg.text, fontFamily: font.mono, fontWeight: 700 }}>{cfg.label}</span>
                </div>
              </div>

              {/* Assigned IA instances */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 32, alignItems: "center" }}>
                {instances.length === 0 ? (
                  <div style={{ width: "100%", border: `1.5px dashed ${isHover ? col : C.border}`, borderRadius: 6, padding: "6px 12px", textAlign: "center", fontSize: 12, color: isHover ? col : C.textMuted, fontFamily: font.ui, transition: "all 0.15s" }}>
                    {isHover && dragging ? `↓ Suelta «${dragging}» aquí` : "Arrastra un operador IA desde la izquierda"}
                  </div>
                ) : instances.map(ia => {
                  const def = IA_TYPES[ia];
                  const isConflict = conflicts.some(([a, b]) => a === ia || b === ia);
                  const fbKey = `${c.id}-${ia}`;
                  const fb = feedback[fbKey];
                  return (
                    <div key={ia}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
                        background: fb === "err" ? C.redBg : fb === "ok" ? C.greenBg : isConflict ? C.redBg : `${def?.color ?? C.textMuted}10`,
                        border: `1.5px solid ${fb === "err" ? C.red : fb === "ok" ? C.green : isConflict ? C.red : def?.color ?? C.textMuted}50`,
                        borderRadius: 7, transition: "all 0.2s",
                      }}
                    >
                      <span style={{ fontSize: 14, color: isConflict ? C.red : def?.color }}>
                        {fb === "err" ? "✗" : fb === "ok" ? "✓" : isConflict ? "⚠" : def?.icon}
                      </span>
                      <span style={{ fontSize: 11, fontFamily: font.mono, color: isConflict ? C.red : def?.color, fontWeight: 600 }}>{ia}</span>
                      <span style={{ fontSize: 10, color: C.textMuted, fontFamily: font.ui }}>· {def?.subtitle}</span>
                      <button onClick={() => onRemoveIA(c.id, ia)}
                        title={`Quitar ${ia}`}
                        style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 2px", marginLeft: 2 }}>×</button>
                    </div>
                  );
                })}
                {isHover && instances.length > 0 && dragging && (
                  <div style={{ fontSize: 11, color: col, fontFamily: font.ui, padding: "4px 8px", background: `${col}10`, borderRadius: 5, border: `1px dashed ${col}` }}>
                    + {dragging}
                  </div>
                )}
              </div>

              {/* Conflict details */}
              {status === "error" && conflicts.length > 0 && (
                <div style={{ marginTop: 8, padding: "7px 10px", background: C.redBg, borderRadius: 6, fontSize: 11, color: C.red, fontFamily: font.ui, lineHeight: 1.5 }}>
                  <strong>Conflicto:</strong>{" "}
                  {conflicts.map(([a, b]) => `«${a}» y «${b}» son incompatibles`).join(" · ")}.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── R2 — Motor IA (main export) ─────────────────────────────────────────────
export default function IAEngineView({ master, subContracts, allContracts, onAddIA, onRemoveIA }) {
  const [dragging, setDragging] = useState(null);

  // Prefer the full contracts map (covers multi-master projects like Seguros);
  // fall back to master + subs only if allContracts wasn't passed.
  // Without this, multi-master projects had 12 of 16 contracts unreachable here.
  const fromAll = allContracts
    ? (Array.isArray(allContracts) ? allContracts : Object.values(allContracts))
    : null;
  const fallback = [master].concat(subContracts || []).filter(Boolean);
  const contractsList = (fromAll && fromAll.length > 0)
    ? fromAll.filter(Boolean)
    : fallback;

  async function handleDrop(contractId, iaType) {
    return await onAddIA(contractId, iaType);
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* R2 label strip */}
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 5, pointerEvents: "none" }} />

      {/* LEFT: IA operator cards */}
      <IAColumn
        dragging={dragging}
        onDragStart={setDragging}
        onDragEnd={() => setDragging(null)}
      />

      {/* RIGHT: Contract drop targets */}
      <ContractColumn
        allContracts={contractsList}
        dragging={dragging}
        onDrop={handleDrop}
        onRemoveIA={onRemoveIA}
      />
    </div>
  );
}
