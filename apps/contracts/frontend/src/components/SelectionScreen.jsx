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
      await api.seedSegurosDemo();
      // Load existing contracts — 4 insurance masters will appear
      if (onLoadExisting) {
        setTimeout(() => {
          onLoadExisting();
          setSeeding(null);
        }, 300);
      } else {
        setTimeout(() => {
          onSelect("SEGURO_VIDA", CONTRACT_TEMPLATES["SEGURO_VIDA"]);
          setSeeding(null);
        }, 300);
      }
    } catch (e) {
      setSeedError("Error cargando demo Seguros: " + e.message);
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

        {/* KPMG CORPORATE CARD */}
        <div style={{ flex:"1 1 320px", minWidth:300 }}>
          <div onClick={!isSeeding ? () => pick("KPMG_CORPORATE") : undefined}
            style={{ background:"linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#60A5FA 100%)",
              border:`2px solid #93C5FD`, borderRadius:16, padding:"22px 26px",
              cursor:isSeeding?"not-allowed":"pointer", position:"relative", overflow:"hidden",
              boxShadow:`0 24px 60px rgba(37,99,235,0.35)`, transition:"transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e=>{ if(!isSeeding){e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 40px 80px rgba(37,99,235,0.5)";} }}
            onMouseLeave={e=>{ e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 24px 60px rgba(37,99,235,0.35)" }}>
            <div style={{ position:"absolute", top:12, right:12, background:"#EFF6FF", color:"#1D4ED8", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20, fontFamily:font.mono }}>KPMG CORPORATE</div>
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
                <button disabled={isSeeding} style={{ padding:"8px 20px", background:isSeeding?"#1E40AF":"#2563EB", color:C.white, border:"none", borderRadius:7, cursor:isSeeding?"not-allowed":"pointer", fontSize:12, fontFamily:font.ui, fontWeight:700 }}>▶ Crear Proyecto Corporativo</button>
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
                <div style={{ fontSize:16, fontWeight:700, color:C.textWhite, marginBottom:3 }}>Caso Seguros — 4 Pólizas Simultáneas</div>
                <div style={{ fontSize:10, color:"#A7F3D0", marginBottom:10, lineHeight:1.6 }}>PHENOMENON combinatoria: Vida · RC · Daños · Crédito. Misma estructura, 4 modulaciones. IF_exclusion bloquea cobertura.</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                  {[["♡ Vida","#059669"],["◎ RC","#2563EB"],["⊕ Daños","#D97706"],["⬡ Crédito","#7C3AED"],["⛔ IF_excl.","#DC2626"]].map(([l,col])=>(
                    <span key={l} style={{ fontSize:9, color:C.white, background:`${col}50`, border:`1px solid ${col}80`, borderRadius:10, padding:"1px 7px", fontFamily:font.mono }}>{l}</span>
                  ))}
                </div>
                <button disabled={isSeeding} onClick={e=>{ e.stopPropagation(); loadSegurosDemo(); }}
                  style={{ padding:"8px 20px", background:seeding==="seguros"?"#065F46":"#059669", color:C.white, border:"none", borderRadius:7, cursor:isSeeding?"not-allowed":"pointer", fontSize:12, fontFamily:font.ui, fontWeight:700 }}>
                  {seeding==="seguros" ? "⟳ Cargando 16 contratos…" : "▶ Abrir Demo Seguros"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {seedError && <div style={{ marginBottom:16, fontSize:11, color:"#F87171", fontFamily:font.mono }}>{seedError}</div>}

      <div style={{ fontSize: 13, color: C.textNavy, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: font.mono, marginBottom: 10, animation: "fadeUp 0.6s ease 0.1s both" }}>
        ¿Qué tipo de acuerdo vas a crear?
      </div>
      <div style={{ fontSize: 28, fontWeight: 300, color: C.textWhite, marginBottom: 40, textAlign: "center", fontFamily: font.serif, animation: "fadeUp 0.6s ease 0.15s both" }}>
        Selecciona la base contractual
      </div>

      {/* Template grid — excludes isDemo templates (shown above as featured cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, maxWidth: 1320, width: "100%", animation: "fadeUp 0.6s ease 0.25s both" }}>
        {Object.entries(CONTRACT_TEMPLATES).filter(([, tmpl]) => !tmpl.isDemo).map(([key, tmpl]) => {
          const isH = hovered === key;
          const isSel = selected === key;
          return (
            <div
              key={key}
              onClick={() => pick(key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isH ? `${tmpl.color}14` : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${isH || isSel ? tmpl.color : "rgba(255,255,255,0.10)"}`,
                borderRadius: 12,
                padding: "28px 24px",
                cursor: "pointer",
                transform: isH ? "translateY(-6px)" : "none",
                boxShadow: isH ? `0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px ${tmpl.color}30` : "0 2px 12px rgba(0,0,0,0.2)",
                transition: "all 0.25s ease",
                opacity: isSel ? 0.6 : 1,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Top glow on hover */}
              {isH && <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 160, height: 160, borderRadius: "50%", background: `${tmpl.color}15`, pointerEvents: "none" }} />}

              {/* Complexity dots */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <span style={{ fontSize: 36, color: tmpl.color, lineHeight: 1 }}>{tmpl.icon}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= tmpl.complexity ? tmpl.color : "rgba(255,255,255,0.12)" }} />
                  ))}
                </div>
              </div>

              {/* Title */}
              <div style={{ fontSize: 17, fontWeight: 700, color: isH ? tmpl.color : C.textWhite, fontFamily: font.ui, marginBottom: 5, transition: "color 0.2s" }}>{tmpl.label}</div>
              <div style={{ fontSize: 11, color: tmpl.color, fontFamily: font.mono, letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>{tmpl.subtitle}</div>
              <div style={{ fontSize: 13, color: C.textNavy, lineHeight: 1.7, marginBottom: 18, minHeight: 58 }}>{tmpl.description}</div>

              {/* Law reference */}
              <div style={{ fontSize: 10, color: `${tmpl.color}80`, fontFamily: font.mono, marginBottom: 14, fontStyle: "italic" }}>{tmpl.law}</div>

              {/* Auto-generates */}
              {tmpl.autoGenerates.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, color: C.textNavy, fontFamily: font.mono, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 7 }}>Genera automáticamente</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {tmpl.autoGenerates.map(t => {
                      const m = SUB_META[t];
                      return (
                        <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: `1px solid ${m.color}50`, color: m.color, fontFamily: font.mono }}>
                          {m.icon} {m.short}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: C.textNavy, fontFamily: font.mono }}>{tmpl.requiredEss.length} campos requeridos</span>
                {isH && !isSel && <span style={{ fontSize: 12, color: tmpl.color, fontFamily: font.ui, fontWeight: 600 }}>Seleccionar →</span>}
                {isSel && loading && <span style={{ fontSize: 11, color: tmpl.color, fontFamily: font.mono, animation: "pulse 1s infinite" }}>⟳ Creando…</span>}
              </div>
            </div>
          );
        })}
      </div>

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
