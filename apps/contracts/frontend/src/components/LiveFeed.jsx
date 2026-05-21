import { useRef, useEffect } from "react";
import { C, font, phaseColor, statusColor, statusLabel, SUB_META } from "../constants.js";

const PHASE_ES = { ESS:"ESS", AG:"AG", IA:"IA", CASCADE:"CASCADA", AI:"IA-CLAUDE", ERROR:"ERROR", OPUS:"VALIDACIÓN", INIT:"INICIO", IF:"IF→", CREATE:"CREAR" };

export default function LiveFeed({ log, master, subContracts, loading, collapsed = false, onToggle = () => {} }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [log]);

  const total     = 1 + subContracts.length;
  const active    = [master, ...subContracts].filter(c => c?.status === "ACTIVE").length;
  const review    = subContracts.filter(c => c?.status === "NEEDS_REVIEW").length;

  if (collapsed) {
    return (
      <div style={{ height: 40, background: C.navy, borderTop: `1px solid ${C.borderDark}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 20, flexShrink: 0, cursor: "pointer" }} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: loading ? C.orange : C.green }} />
          <span style={{ fontSize: 12, color: loading ? C.orange : C.green, fontFamily: font.mono }}>{loading ? "PROCESANDO" : "EN VIVO"}</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[["Contratos", total, C.textNavy], ["Activos", active, C.green], review > 0 ? ["Revisión", review, C.orange] : null].filter(Boolean).map(([l, v, c]) => (
            <span key={l} style={{ fontSize: 12, color: c, fontFamily: font.mono }}>{l}: <strong>{v}</strong></span>
          ))}
        </div>
        {log.length > 0 && (
          <span style={{ fontSize: 11, color: C.textNavy, fontFamily: font.mono, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {log[log.length - 1]?.msg?.slice(0, 60)}…
          </span>
        )}
        <span style={{ fontSize: 11, color: C.textNavy, fontFamily: font.mono, marginLeft: "auto" }}>▲ Feed</span>
      </div>
    );
  }

  return (
    <div style={{ height: 280, background: C.navy, borderTop: `1px solid ${C.borderDark}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 20px", borderBottom: `1px solid ${C.borderDark}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: loading ? C.orange : C.green }} />
          <span style={{ fontSize:9, fontFamily:"'JetBrains Mono','Courier New',monospace", letterSpacing:"0.08em", color:"#64748b", background:"rgba(255,255,255,0.06)", padding:"1px 6px", borderRadius:3 }}>R-log</span>
          <span style={{ fontSize: 11, color: C.textNavy, fontFamily: font.mono, letterSpacing: "0.1em" }}>ACTIVIDAD EN VIVO</span>
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: 20, marginLeft: 24 }}>
          {[["Contratos", total, C.textNavy], ["Activos", active, C.green], ["Revisión", review, review > 0 ? C.orange : C.textNavy], ["Eventos", log.length, C.textNavy]].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: c, fontFamily: font.mono }}>{v}</div>
              <div style={{ fontSize: 9, color: C.textNavy, fontFamily: font.mono, textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Contract pills */}
        <div style={{ display: "flex", gap: 6, marginLeft: 24 }}>
          {master && (
            <span style={{ fontSize: 10, padding: "2px 8px", background: `${C.gold}20`, border: `1px solid ${C.gold}40`, color: C.gold, borderRadius: 4, fontFamily: font.mono }}>⬡ MASTER</span>
          )}
          {subContracts.map(c => {
            const m = SUB_META[c.type];
            return m ? (
              <span key={c.id} style={{ fontSize: 10, padding: "2px 8px", background: `${m.color}15`, border: `1px solid ${m.color}30`, color: m.color, borderRadius: 4, fontFamily: font.mono }}>
                {m.icon} {m.short}
              </span>
            ) : null;
          })}
        </div>
        <button onClick={onToggle} style={{ marginLeft: "auto", background: "none", border: "none", color: C.textNavy, cursor: "pointer", fontSize: 11, fontFamily: font.mono }}>▼ Contraer</button>
      </div>

      {/* Log */}
      <div ref={ref} style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {!log.length ? (
          <div style={{ padding: "16px 20px", color: C.borderDark, fontSize: 12, fontFamily: font.mono }}>Esperando actividad del motor…</div>
        ) : log.map(e => (
          <div key={e.id} style={{ display: "flex", gap: 10, padding: "4px 20px", alignItems: "flex-start" }}>
            <span style={{ fontSize: 10, color: phaseColor(e.phase), fontFamily: font.mono, flexShrink: 0, paddingTop: 1 }}>{PHASE_ES[e.phase] || e.phase}</span>
            <span style={{ fontSize: 10, color: C.textNavy, fontFamily: font.mono, flexShrink: 0 }}>{e.t}</span>
            <span style={{ fontSize: 12, color: e.type === "error" ? C.red : e.type === "ai" ? C.purple : e.type === "opus" ? C.green : C.textWhite, fontFamily: font.ui, lineHeight: 1.45, flex: 1 }}>{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
