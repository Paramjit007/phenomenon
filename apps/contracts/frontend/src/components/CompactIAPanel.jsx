/**
 * L2 — IA Status Panel (left column, bottom)
 * Read-only visualization: compact bipartite IA map + contract assignment status.
 * Motor IA drag-drop lives exclusively in R2 (Motor IA tab, right column).
 */
import { C, font, IA_TYPES, SUB_META } from "../constants.js";

function iaStatus(instances) {
  if (!instances?.length) return "missing";
  for (let i = 0; i < instances.length; i++)
    for (let j = 0; j < i; j++) {
      const def = IA_TYPES[instances[i]];
      if (def && !def.compatible.includes(instances[j])) return "error";
    }
  return "valid";
}

const STATUS_CFG = {
  missing: { icon: "⚠️", color: C.orange, label: "Sin IA" },
  error:   { icon: "❌", color: C.red,    label: "Conflicto" },
  valid:   { icon: "✅", color: C.green,  label: "OK" },
};

// ── Compact bipartite SVG ─────────────────────────────────────────────────────
function BipartiteMap({ allContracts }) {
  const iaKeys = Object.keys(IA_TYPES);
  const rows   = Math.max(iaKeys.length, allContracts.length);
  const H      = 20 + rows * 22;         // scale with content, min ~108px
  const W      = 280;
  const LX = 72, RX = W - 60;
  const iaY  = (i) => 14 + i * (H - 20) / Math.max(iaKeys.length - 1, 1);
  const conY = (i) => 14 + i * (H - 20) / Math.max(allContracts.length - 1, 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }}>
      {/* Curves */}
      {allContracts.map((c, ci) =>
        (c.ia_instances ?? []).map(ia => {
          const ii = iaKeys.indexOf(ia);
          if (ii < 0) return null;
          const def = IA_TYPES[ia];
          const st  = iaStatus(c.ia_instances);
          const col = st === "error" ? C.red : (def?.color ?? C.green);
          const y1  = iaY(ii), y2 = conY(ci);
          return (
            <path key={`${c.id}-${ia}`}
              d={`M${LX + 8},${y1} C${LX + 50},${y1} ${RX - 50},${y2} ${RX - 8},${y2}`}
              stroke={col} strokeWidth={1.8} fill="none" opacity={0.6}
              strokeDasharray={st === "error" ? "4 3" : "none"} />
          );
        })
      )}

      {/* IA operator nodes (left) */}
      {iaKeys.map((key, i) => {
        const def = IA_TYPES[key]; const y = iaY(i);
        return (
          <g key={key}>
            <circle cx={LX} cy={y} r={8} fill={`${def.color}20`} stroke={def.color} strokeWidth={1.5} />
            <text x={LX} y={y + 4} textAnchor="middle" fontSize={9} fill={def.color} fontFamily="sans-serif">{def.icon}</text>
            <text x={LX - 12} y={y + 4} textAnchor="end" fontSize={9} fill={C.textMuted} fontFamily="sans-serif">{def.label}</text>
          </g>
        );
      })}

      {/* Contract nodes (right) */}
      {allContracts.map((c, i) => {
        const isMaster = !c.parentId;
        const meta = isMaster ? null : SUB_META[c.type];
        const col  = isMaster ? C.gold : (meta?.color ?? C.textMuted);
        const y    = conY(i);
        const st   = iaStatus(c.ia_instances);
        const ring = st === "valid" ? C.green : st === "error" ? C.red : C.orange;
        return (
          <g key={c.id}>
            <circle cx={RX} cy={y} r={9} fill={`${col}14`} stroke={col} strokeWidth={1.5} />
            <circle cx={RX} cy={y} r={13} fill="none" stroke={ring} strokeWidth={1} strokeDasharray="3 2" opacity={0.55} />
            <text x={RX} y={y + 4} textAnchor="middle" fontSize={9} fill={col}>{isMaster ? "⬡" : (meta?.icon ?? "○")}</text>
            <text x={RX + 16} y={y + 4} textAnchor="start" fontSize={9} fill={C.textMuted} fontFamily="sans-serif">{isMaster ? "MASTER" : meta?.short}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CompactIAPanel({ master, subContracts }) {
  const all = [master, ...subContracts].filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: C.white, borderTop: `1px solid ${C.border}` }}>

      {/* Panel label */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 12px 4px", borderBottom:`1px solid ${C.border}`, flexShrink:0, background:C.bgAlt }}>
        <span style={{ fontSize:9, fontFamily:"'JetBrains Mono','Courier New',monospace", letterSpacing:"0.08em", color:"#64748b", background:"rgba(14,20,38,0.08)", padding:"2px 7px", borderRadius:3 }}>L2 · Mapa IA</span>
        <span style={{ fontSize:9, color:C.textLight, fontFamily:font.ui }}>Solo lectura · Editar en R2 Motor IA →</span>
      </div>

      {/* Bipartite map */}
      {all.length > 0 ? (
        <div style={{ padding: "8px 12px 6px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <BipartiteMap allContracts={all} />
        </div>
      ) : (
        <div style={{ padding: "12px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: C.textLight, fontFamily: font.ui }}>Sin contratos — genera subcontratos primero</span>
        </div>
      )}

      {/* Contract status list — read-only */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
        {all.map(c => {
          const isMaster  = !c.parentId;
          const meta      = isMaster ? null : SUB_META[c.type];
          const col       = isMaster ? C.gold : (meta?.color ?? C.textMuted);
          const instances = c.ia_instances ?? [];
          const st        = iaStatus(instances);
          const cfg       = STATUS_CFG[st];
          return (
            <div key={c.id}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, marginBottom: 4, background: C.white, border: `1.5px solid ${C.border}` }}
            >
              <span style={{ fontSize: 15, color: col, flexShrink: 0 }}>{isMaster ? "⬡" : (meta?.icon ?? "○")}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textDark, fontFamily: font.ui, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {isMaster ? "Contrato Marco" : meta?.label ?? c.type}
                </div>
                <div style={{ display: "flex", gap: 3, marginTop: 2, flexWrap: "wrap" }}>
                  {instances.length === 0 ? (
                    <span style={{ fontSize: 10, color: C.orange, fontFamily: font.ui }}>Sin operadores IA</span>
                  ) : instances.map(ia => {
                    const def = IA_TYPES[ia];
                    return (
                      <span key={ia} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: `${def?.color ?? C.textMuted}15`, color: def?.color ?? C.textMuted, fontFamily: font.mono, border: `1px solid ${def?.color ?? C.textMuted}30` }}>
                        {def?.icon} {ia}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14 }}>{cfg.icon}</div>
                <div style={{ fontSize: 9, color: cfg.color, fontFamily: font.mono, marginTop: 1 }}>{cfg.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
