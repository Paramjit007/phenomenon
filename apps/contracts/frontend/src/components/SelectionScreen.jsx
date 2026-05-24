import { useState } from "react";
import { C, font, CONTRACT_TEMPLATES, SUB_META, FINAL_RULE } from "../constants.js";
import * as api from "../api/phenomenon.js";

export default function SelectionScreen({ onSelect, onLoadExisting, loading }) {
  const [hovered,       setHovered]       = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [seeding,       setSeeding]       = useState(null); // null | "kpmg" | "seguros"
  const [seedError,     setSeedError]     = useState(null);

  function pick(key) {
    setSelected(key);
    setTimeout(() => onSelect(key, CONTRACT_TEMPLATES[key]), 250);
  }

  async function loadKPMGDemo() {
    setSeeding("kpmg");
    setSeedError(null);
    try {
      await api.seedKPMGDemo();
      // Use onLoadExisting so seeded data is not overwritten by startNewProject
      if (onLoadExisting) {
        setTimeout(() => {
          onLoadExisting();
          setSeeding(null);
        }, 300);
      } else {
        setTimeout(() => {
          onSelect("KPMG", CONTRACT_TEMPLATES["KPMG"], { skipNewProject: true });
          setSeeding(null);
        }, 300);
      }
    } catch (e) {
      setSeedError("Error cargando demo KPMG: " + e.message);
      setSeeding(null);
    }
  }

  async function loadSegurosDemo() {
    setSeeding("seguros");
    setSeedError(null);
    try {
      // Create ONE empty Seguro de Vida — user builds the portfolio from here
      await api.initOnePolicy({
        policy_type: "SEGURO_VIDA",
        party_a: "Comerciales del Levante S.L.",
        clear_existing: true,
      });
      if (onLoadExisting) {
        setTimeout(() => {
          onLoadExisting();
          setSeeding(null);
        }, 300);
      } else {
        setTimeout(() => setSeeding(null), 300);
      }
    } catch (e) {
      setSeedError("Error iniciando demo Seguros: " + e.message);
      setSeeding(null);
    }
  }

  const isSeeding = seeding !== null;

  return (
    <div data-testid="selection-screen" style={{ minHeight: "100vh", background: C.navyDeep, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", fontFamily: font.ui }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: none; } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes shimmer { 0%,100%{opacity:0.7} 50%{opacity:1} }
      `}</style>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40, animation: "fadeUp 0.6s ease both" }}>
        <div style={{ width: 56, height: 56, border: `2px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: C.gold, borderRadius: 4 }}>Φ</div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.22em", color: C.gold, fontFamily: font.ui }}>PHENOMENON</div>
          <div style={{ fontSize: 11, color: C.textNavy, letterSpacing: "0.18em", fontFamily: font.mono, marginTop: 2 }}>MOTOR DE INTELIGENCIA CONTRACTUAL · DERECHO ESPAÑOL</div>
        </div>
      </div>

      {/* ── FEATURED DEMO CASES ─────────────────────────────────────────────── */}
      <div style={{ maxWidth:1100, width:"100%", marginBottom:32, animation:"fadeUp 0.6s ease 0.1s both", display:"flex", gap:20, flexWrap:"wrap" }}>

        {/* KPMG DEMO CARD */}
        <div style={{ flex:"1 1 320px", minWidth:300 }}>
          <div onClick={!isSeeding ? loadKPMGDemo : undefined}
            style={{ background:"linear-gradient(135deg,#1E1B4B 0%,#4C1D95 50%,#7C3AED 100%)",
              border:`2px solid #A78BFA`, borderRadius:16, padding:"22px 26px",
              cursor:isSeeding?"not-allowed":"pointer", position:"relative", overflow:"hidden",
              boxShadow:`0 24px 60px rgba(124,58,237,0.35)`, transition:"transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e=>{ if(!isSeeding){e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 40px 80px rgba(124,58,237,0.5)";} }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 24px 60px rgba(124,58,237,0.35)" }}>

            <div style={{ position:"absolute", top:12, right:12, background:"#F59E0B", color:"#000", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20, fontFamily:font.mono, animation:"shimmer 2s ease infinite" }}>⭐ CASO REAL</div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
              <div style={{ fontSize:36, flexShrink:0 }}>⊛</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.textWhite, marginBottom:3 }}>Hotel Mediterráneo Valencia 5* — KPMG</div>
                <div style={{ fontSize:10, color:"#C4B5FD", marginBottom:10, lineHeight:1.6 }}>Arrendamiento de Cosa Futura + Circumcontrato CA2 (€100M) + Hipoteca + Cesión. EURIBOR en tiempo real.</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                  {[["⊛ CA2","#7C3AED"],["⊞ Hipoteca","#92400E"],["💶 €100M","#C9A84C"],["🏨 5★","#059669"]].map(([l,col])=>(
                    <span key={l} style={{ fontSize:9, color:C.white, background:`${col}50`, border:`1px solid ${col}80`, borderRadius:10, padding:"1px 7px", fontFamily:font.mono }}>{l}</span>
                  ))}
                </div>
                <button disabled={isSeeding} onClick={e=>{ e.stopPropagation(); loadKPMGDemo(); }}
                  style={{ padding:"8px 20px", background:seeding==="kpmg"?"#4C1D95":"#7C3AED", color:C.white, border:"none", borderRadius:7, cursor:isSeeding?"not-allowed":"pointer", fontSize:12, fontFamily:font.ui, fontWeight:700 }}>
                  {seeding==="kpmg" ? "⟳ Cargando…" : "▶ Abrir Demo KPMG"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPMG CORPORATE CARD — disabled, coming soon */}
        <div style={{ flex:"1 1 320px", minWidth:300 }}>
          <div style={{ background:"linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#60A5FA 100%)",
              border:`2px solid #93C5FD`, borderRadius:16, padding:"22px 26px",
              cursor:"default", position:"relative", overflow:"hidden", opacity:0.45,
              boxShadow:`0 24px 60px rgba(37,99,235,0.15)`, pointerEvents:"none" }}>
            <div style={{ position:"absolute", top:12, right:12, background:"#334155", color:"#94A3B8", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20, fontFamily:font.mono }}>PRÓXIMAMENTE</div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
              <div style={{ fontSize:36, flexShrink:0 }}>🏛</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.white, marginBottom:3 }}>Gobernanza Corporativa</div>
                <div style={{ fontSize:10, color:"#CFE2FF", marginBottom:10, lineHeight:1.6 }}>Configura compliance, auditoría, aprobación regulatoria y resolución del consejo para un proyecto KPMG.</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                  {[ ["✔ Compliance","#2563EB"], ["🧾 Auditoría","#7C3AED"], ["✕ Regulador","#DC2626"], ["🏛 Junta","#92400E"] ].map(([l,col])=>(
                    <span key={l} style={{ fontSize:9, color:C.white, background:`${col}40`, border:`1px solid ${col}80`, borderRadius:10, padding:"1px 7px", fontFamily:font.mono }}>{l}</span>
                  ))}
                </div>
                <button disabled style={{ padding:"8px 20px", background:"#1E40AF", color:C.white, border:"none", borderRadius:7, cursor:"not-allowed", fontSize:12, fontFamily:font.ui, fontWeight:700 }}>▶ Crear Proyecto Corporativo</button>
              </div>
            </div>
          </div>
        </div>

        {/* SEGUROS DEMO CARD */}
        <div style={{ flex:"1 1 460px", minWidth:300 }}>
          <div onClick={!isSeeding ? loadSegurosDemo : undefined}
            style={{ background:"linear-gradient(135deg,#064E3B 0%,#065F46 50%,#059669 100%)",
              border:`2px solid #6EE7B7`, borderRadius:16, padding:"22px 26px",
              cursor:isSeeding?"not-allowed":"pointer", position:"relative", overflow:"hidden",
              boxShadow:`0 24px 60px rgba(5,150,105,0.35)`, transition:"transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e=>{ if(!isSeeding){e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 40px 80px rgba(5,150,105,0.5)";} }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 24px 60px rgba(5,150,105,0.35)"; }}>
            <div style={{ position:"absolute", top:12, right:12, background:"#F59E0B", color:"#000", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20, fontFamily:font.mono, animation:"shimmer 2s ease infinite" }}>🛡️ CASO REAL</div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
              <div style={{ fontSize:36, flexShrink:0 }}>🛡️</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.textWhite, marginBottom:3 }}>Caso Seguros — Cartera Interactiva</div>
                <div style={{ fontSize:10, color:"#A7F3D0", marginBottom:10, lineHeight:1.6 }}>Construye póliza por póliza. Sistema valida en tiempo real. Relleno auto · IF live · Cascada cross-póliza.</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                  {[["♡ Vida","#059669"],["◎ RC","#2563EB"],["⊕ Daños","#D97706"],["⬡ Crédito","#7C3AED"],["⛔ IF_excl.","#DC2626"]].map(([l,col])=>(
                    <span key={l} style={{ fontSize:9, color:C.white, background:`${col}50`, border:`1px solid ${col}80`, borderRadius:10, padding:"1px 7px", fontFamily:font.mono }}>{l}</span>
                  ))}
                </div>
                <button disabled={isSeeding} onClick={e=>{ e.stopPropagation(); loadSegurosDemo(); }}
                  style={{ padding:"8px 20px", background:seeding==="seguros"?"#065F46":"#059669", color:C.white, border:"none", borderRadius:7, cursor:isSeeding?"not-allowed":"pointer", fontSize:12, fontFamily:font.ui, fontWeight:700 }}>
                  {seeding==="seguros" ? "⟳ Iniciando cartera…" : "▶ Construir Cartera Seguros"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {seedError && <div style={{ marginBottom:16, fontSize:11, color:"#F87171", fontFamily:font.mono }}>{seedError}</div>}


      {/* The Final Rule — Regla Final del Sistema */}
      <div style={{ marginTop: 48, textAlign: "center", animation: "fadeUp 0.6s ease 0.5s both" }}>
        <div style={{ fontSize: 13, color: C.gold, fontFamily: font.serif, fontStyle: "italic", maxWidth: 700, lineHeight: 1.6, marginBottom: 12 }}>
          "{FINAL_RULE}"
        </div>
        <div style={{ fontSize: 11, color: C.textNavy, fontFamily: font.mono }}>
          Basado en legislación española vigente · Garrigues · Cuatrecasas · Uría Menéndez · Los contratos se guardan automáticamente
        </div>
      </div>
    </div>
  );
}
