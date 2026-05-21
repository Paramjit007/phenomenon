/**
 * PHENOMENON Engine Process Visualizer
 * Shows the 8-stage engine pipeline animating live as a document is processed.
 *
 * Stages:
 *  1. UPLOAD   — Document received by engine
 *  2. OCR      — Text extraction (pdfplumber / Claude Vision)
 *  3. ESS      — Stable identity detected (Bloque I: Ser)
 *  4. AG       — Operative layer extracted (Bloque I: Ager)
 *  5. IA       — Vectorial operator classified (Bloque II)
 *  6. VECTOR   — Argument strength assessed (Bloque II)
 *  7. IF       — Inter-phenomenic links identified (Bloque II)
 *  8. OPUS     — Document processed, opus level determined (Bloque IV)
 */
import { C, font } from "./constants.js";

const STAGES = [
  { id:1, key:"upload",  icon:"📄", label:"UPLOAD",  color:C.navy,   bloqueRef:"Input",          desc:"Document received by PHENOMENON engine" },
  { id:2, key:"ocr",    icon:"🔍", label:"OCR",     color:C.cyan,   bloqueRef:"Pre-processing",  desc:"Text extracted (pdfplumber / Claude Vision)" },
  { id:3, key:"ess",    icon:"◈",  label:"ESS",     color:C.gold,   bloqueRef:"Bloque I · Ser",  desc:"Stable identity: parties, dates, jurisdiction" },
  { id:4, key:"ag",     icon:"◉",  label:"AG",      color:C.purple, bloqueRef:"Bloque I · Ager", desc:"Operative layer: clauses, obligations, amounts" },
  { id:5, key:"ia",     icon:"⬡",  label:"IA",      color:C.blue,   bloqueRef:"Bloque II · IA",  desc:"Vectorial operator: claim / objection / defense / mutual" },
  { id:6, key:"vector", icon:"→",  label:"VECTOR",  color:C.orange, bloqueRef:"Bloque II",       desc:"Argument strength: strong / moderate / weak" },
  { id:7, key:"if",     icon:"⇄",  label:"IF",      color:C.green,  bloqueRef:"Bloque II · IF",  desc:"Inter-phenomenic links to existing case phenomena" },
  { id:8, key:"opus",   icon:"⊙",  label:"OPUS",    color:C.gold,   bloqueRef:"Bloque IV",       desc:"Document processed — opus level determined" },
];

export default function EngineProcess({ currentStage, result, compact = false }) {
  const completed = currentStage >= 8 && result;

  if (compact) {
    return (
      <div style={{ background: C.navyDeep, borderRadius: 8, padding: "10px 14px" }}>
        <div style={{ fontSize: 9, color: "#94A3B8", fontFamily: font.mono, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          Φ PHENOMENON Engine Pipeline
        </div>
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          {STAGES.map((s, i) => {
            const done = currentStage > s.id;
            const active = currentStage === s.id;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div title={`${s.label}: ${s.desc}`}
                  style={{ width: 28, height: 28, borderRadius: 5, background: done ? `${s.color}25` : active ? `${s.color}40` : "#1C2A3A", border: `1.5px solid ${done||active ? s.color : "#1C2A3A"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "all 0.4s", cursor: "default", boxShadow: active ? `0 0 0 3px ${s.color}30` : "none" }}>
                  <span style={{ fontSize: 10 }}>{done ? "✓" : active ? <span style={{ display:"inline-block", animation:"spin 0.8s linear infinite" }}>⟳</span> : s.icon}</span>
                </div>
                {i < STAGES.length - 1 && <div style={{ width: 6, height: 1, background: done ? s.color : "#1C2A3A", transition: "background 0.4s" }}/>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 6, fontSize: 8, color: "#64748B", fontFamily: font.mono }}>
          {currentStage === 0 ? "Ready" : currentStage >= 8 ? "✓ Complete — Opus Generated" : `Processing: ${STAGES[currentStage-1]?.label} — ${STAGES[currentStage-1]?.desc}`}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.navyDeep, borderRadius: 12, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes glow{0%,100%{opacity:1}50%{opacity:0.6}}@keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, background: C.gold + "20", border: `2px solid ${C.gold}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: C.gold }}>Φ</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", letterSpacing: "0.1em" }}>PHENOMENON Engine — Document Processing</div>
          <div style={{ fontSize: 9, color: "#64748B", fontFamily: font.mono }}>ESS → AG → IA → VECTOR → IF → OPUS · Bloques I-IV</div>
        </div>
        {currentStage >= 8 && result && (
          <div style={{ marginLeft: "auto", fontSize: 11, color: C.green, background: C.greenBg, padding: "4px 10px", borderRadius: 5, fontFamily: font.mono }}>✓ Opus Complete</div>
        )}
      </div>

      {/* Pipeline */}
      <div style={{ display: "flex", gap: 0, alignItems: "center", marginBottom: 20 }}>
        {STAGES.map((s, i) => {
          const done    = currentStage > s.id;
          const active  = currentStage === s.id;
          const pending = currentStage < s.id;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Stage node */}
                <div style={{ width: 48, height: 48, borderRadius: 10, background: done ? `${s.color}20` : active ? `${s.color}30` : "#1C2A3A", border: `2px solid ${done||active ? s.color : "#2D3F5A"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "all 0.4s ease", boxShadow: active ? `0 0 0 4px ${s.color}25, 0 0 20px ${s.color}20` : done ? `0 0 8px ${s.color}15` : "none", animation: active ? "glow 1.5s ease-in-out infinite" : "none" }}>
                  <span style={{ fontSize: done ? 16 : 14, transition: "all 0.3s", display: "inline-block", animation: active ? "spin 0.8s linear infinite" : "none" }}>
                    {done ? "✓" : active ? "⟳" : s.icon}
                  </span>
                </div>
                {/* Label */}
                <div style={{ marginTop: 6, fontSize: 8, fontWeight: 700, color: done||active ? s.color : "#475569", fontFamily: font.mono, textAlign: "center", letterSpacing: "0.08em" }}>{s.label}</div>
                <div style={{ fontSize: 7, color: "#475569", fontFamily: font.mono, textAlign: "center" }}>{s.bloqueRef}</div>
              </div>
              {/* Connector */}
              {i < STAGES.length - 1 && (
                <div style={{ width: 16, height: 2, background: done ? `linear-gradient(to right, ${s.color}, ${STAGES[i+1].color})` : "#1C2A3A", transition: "background 0.5s ease", flexShrink: 0, margin: "0 -4px", marginTop: -16 }}/>
              )}
            </div>
          );
        })}
      </div>

      {/* Current stage description */}
      {currentStage > 0 && currentStage <= 8 && (
        <div style={{ padding: "10px 14px", background: "#0F1729", borderRadius: 8, marginBottom: result ? 16 : 0, animation: "slideIn 0.3s ease" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: currentStage < 8 ? C.orange : C.green, animation: currentStage < 8 ? "glow 1s ease-in-out infinite" : "none", flexShrink: 0 }}/>
            <div>
              <div style={{ fontSize: 11, color: "#F1F5F9", fontFamily: font.mono, fontWeight: 600 }}>
                {currentStage < 8 ? `Processing: ${STAGES[currentStage-1]?.label}` : "Engine complete"}
              </div>
              <div style={{ fontSize: 10, color: "#64748B", fontFamily: font.ui, marginTop: 2 }}>
                {currentStage < 8 ? STAGES[currentStage-1]?.desc : "All 8 stages complete — document ready for case integration"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, animation: "slideIn 0.4s ease" }}>
          {[
            { label: "Document Type", value: result.document_type || "—", sub: result.document_subtype },
            { label: "IA Operator", value: result.ia_operator?.toUpperCase() || "—", sub: result.ia_reasoning?.slice(0,60)+"..." },
            { label: "Vector Strength", value: result.strength_assessment?.toUpperCase() || "—", sub: result.strength_reasoning?.slice(0,60)+"..." },
            { label: "Exhibit Suggested", value: result.exhibit_suggestion || "—", sub: `${(result.parties||[]).map(p=>p.name?.slice(0,15)).join(", ")||"Parties TBD"}` },
          ].map((r,i)=>(
            <div key={i} style={{ padding: "10px 12px", background: "#0F1729", borderRadius: 8 }}>
              <div style={{ fontSize: 8, color: "#64748B", fontFamily: font.mono, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 2 }}>{r.value}</div>
              {r.sub && <div style={{ fontSize: 9, color: "#64748B", lineHeight: 1.4 }}>{r.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
