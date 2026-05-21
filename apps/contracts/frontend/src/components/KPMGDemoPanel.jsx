/**
 * KPMGDemoPanel — Investor demonstration control center.
 *
 * Hotel Mediterráneo Valencia 5* — €100M financing structure
 * Live financial controls, cascade visualization, amortization, scenario analysis.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { C, font } from "../constants.js";
import * as api from "../api/phenomenon.js";

// ─── PMT formula (client-side, instant) ──────────────────────────────────────
function calcPMT(principal, annualRatePct, termYears) {
  const r = (annualRatePct / 100) / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

function fmtEur(n, decimals = 0) {
  return new Intl.NumberFormat("es-ES", { style:"currency", currency:"EUR", maximumFractionDigits: decimals }).format(n);
}

// ─── Slider control ───────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step, unit, onChange, color, description }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4 }}>
        <label style={{ fontSize:10, fontWeight:700, color:C.textMuted, fontFamily:font.ui, textTransform:"uppercase", letterSpacing:"0.05em" }}>
          {label}
        </label>
        <span style={{ fontSize:16, fontWeight:700, color, fontFamily:font.mono }}>
          {value}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width:"100%", accentColor:color, cursor:"pointer", height:4 }} />
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:C.textLight, fontFamily:font.mono, marginTop:2 }}>
        <span>{min}{unit}</span>
        {description && <span style={{ color:C.textMuted }}>{description}</span>}
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ─── Amortization mini-table ──────────────────────────────────────────────────
function AmortTable({ schedule }) {
  if (!schedule?.length) return null;
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10, fontFamily:font.mono }}>
        <thead>
          <tr style={{ background:C.bgAlt }}>
            {["Mes","Cuota","Interés","Capital","Saldo"].map(h => (
              <th key={h} style={{ padding:"4px 6px", textAlign:"right", color:C.textMuted, fontWeight:600, fontSize:9 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedule.map((row, i) => (
            <tr key={row.month} style={{ background: i%2===0?C.white:C.bgAlt, borderBottom:`1px solid ${C.border}` }}>
              <td style={{ padding:"3px 6px", textAlign:"right", color:C.textMuted }}>{row.month}</td>
              <td style={{ padding:"3px 6px", textAlign:"right", color:C.textDark }}>{fmtEur(row.payment)}</td>
              <td style={{ padding:"3px 6px", textAlign:"right", color:C.red }}>{fmtEur(row.interest)}</td>
              <td style={{ padding:"3px 6px", textAlign:"right", color:C.green }}>{fmtEur(row.capital)}</td>
              <td style={{ padding:"3px 6px", textAlign:"right", color:C.textMuted }}>{fmtEur(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, color, icon, delta }) {
  return (
    <div style={{ background:C.white, border:`1px solid ${color}25`, borderRadius:8,
      padding:"10px 12px", flex:1, minWidth:0 }}>
      <div style={{ fontSize:11, color:C.textMuted, fontFamily:font.ui, marginBottom:4, display:"flex", gap:5 }}>
        <span>{icon}</span><span>{label}</span>
      </div>
      <div style={{ fontSize:16, fontWeight:700, color, fontFamily:font.mono, lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontSize:9, color:C.textLight, fontFamily:font.mono, marginTop:2 }}>{sub}</div>}
      {delta && (
        <div style={{ fontSize:9, color:delta > 0 ? C.red : C.green, fontFamily:font.mono, marginTop:2 }}>
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)} €/mes vs. base
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function KPMGDemoPanel({ master, subContracts, loadContracts, addLog, onEuriborCascade }) {
  const BASE_EURIBOR = 3.50;
  const BASE_SPREAD  = 2.00;
  const BASE_TERM    = 20;
  const BASE_CAPITAL = 100_000_000;

  const [euribor,    setEuribor]    = useState(BASE_EURIBOR);
  const [spread,     setSpread]     = useState(BASE_SPREAD);
  const [termYears,  setTermYears]  = useState(BASE_TERM);
  const [capital,    setCapital]    = useState(BASE_CAPITAL);
  const [section,    setSection]    = useState("financiero");
  const [schedule,   setSchedule]   = useState([]);
  const [cascading,  setCascading]  = useState(false);
  const [crisisMode, setCrisisMode] = useState(false);
  const [step,       setStep]       = useState(0); // demo walkthrough step
  const [buildDone,  setBuildDone]  = useState(false);
  const [hipRegDone, setHipRegDone] = useState(false);
  const debounceRef = useRef(null);

  const totalRate    = euribor + spread;
  const monthlyPMT   = calcPMT(capital, totalRate, termYears);
  const basePMT      = calcPMT(BASE_CAPITAL, BASE_EURIBOR + BASE_SPREAD, BASE_TERM);
  const pmtDelta     = monthlyPMT - basePMT;
  const totalPaid    = monthlyPMT * termYears * 12;
  const totalInterest= totalPaid - capital;
  const monthlyRent  = 1_064_583;
  const rentCoverage = ((monthlyRent / monthlyPMT) * 100).toFixed(1);

  // Load amortization schedule from backend
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAmortization(capital, euribor, spread, termYears, 12);
        setSchedule(data.schedule ?? []);
      } catch (_) {}
    };
    load();
  }, [capital, euribor, spread, termYears]);

  // Debounced cascade trigger when EURIBOR/spread changes
  useEffect(() => {
    if (!master?.id) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (euribor === BASE_EURIBOR && spread === BASE_SPREAD) return;
      setCascading(true);
      try {
        const result = await api.updateEuribor({ master_id: master.id, new_euribor: euribor, new_spread: spread, new_term_years: termYears });
        if (result.affected_ids?.length > 0) {
          addLog?.("CASCADE", `EURIBOR → ${totalRate.toFixed(2)}% · Cuota: ${fmtEur(monthlyPMT)} · ${result.affected_ids.length} contratos NEEDS_REVIEW`, "cascade");
          onEuriborCascade?.(result.affected_ids);
          await loadContracts();
        }
      } catch (_) {}
      setCascading(false);
    }, 1200);
  }, [euribor, spread]);

  const triggerCrisis = useCallback(async () => {
    setCrisisMode(true);
    setEuribor(prev => {
      const newRate = Math.min(8, prev + 2);
      addLog?.("CASCADE", `⚠ CRISIS EURIBOR: +2% → ${(newRate + spread).toFixed(2)}% total. Cuota sube ${fmtEur(calcPMT(capital, newRate+spread, termYears) - calcPMT(capital, prev+spread, termYears))}/mes`, "error");
      return newRate;
    });
  }, [spread, capital, termYears, addLog]);

  const triggerBuildComplete = useCallback(async () => {
    if (!master?.id) return;
    setBuildDone(true);
    addLog?.("CASCADE", "🏗️ OBRA COMPLETADA — Cosa futura → Cosa real. F1 activa plenamente. Hipoteca a inscribir. Cesión de crédito operativa.", "cascade");
    try {
      await api.updatePhenomenon(master.id, { status: "ACTIVE" });
      await loadContracts();
    } catch (_) {}
  }, [master?.id, loadContracts, addLog]);

  const triggerRegisterHipoteca = useCallback(async () => {
    if (!master?.id) return;
    const hip = subContracts.find(c => c.type === "HIPOTECA_GARANTIA");
    if (!hip) return;
    setHipRegDone(true);
    addLog?.("OPUS", "⊙ Hipoteca inscrita en Registro de la Propiedad Valencia nº 5 — Opus → OPONIBLE erga omnes", "opus");
    try {
      await api.registerContract(hip.id, {
        registry: "Registro de la Propiedad de Valencia nº 5",
        registered_date: new Date().toISOString().split("T")[0],
        legal_basis: "Art. 1875 CC · LH · AJD 1.5% pagado (€1.950.000)",
      });
      await loadContracts();
    } catch (_) {}
  }, [master?.id, subContracts, loadContracts, addLog]);

  const resetToBase = useCallback(() => {
    setEuribor(BASE_EURIBOR);
    setSpread(BASE_SPREAD);
    setTermYears(BASE_TERM);
    setCapital(BASE_CAPITAL);
    setCrisisMode(false);
    setBuildDone(false);
    addLog?.("INIT", "Demo KPMG → parámetros base restaurados", "init");
  }, [addLog]);

  const DEMO_STEPS = [
    { title: "1. La Estructura", text: "Hotel Mediterráneo Valencia 5* — 4 contratos interconectados por vínculos IF. El motor PHENOMENON modela la estructura jurídica completa." },
    { title: "2. El Circumcontrato CA2", text: "€100M NO es un préstamo (Art. 1740 CC). Es un arrendamiento de servicios financieros (Art. 1544 CC). PHENOMENON detecta y verifica esta distinción jurídica crítica." },
    { title: "3. Impacto del EURIBOR", text: "Mueve el slider de EURIBOR. El motor propaga automáticamente el cambio a los 3 contratos financieros y ejecuta la verificación de ecosistema." },
    { title: "4. Crisis de Tipos", text: "Pulsa 'Crisis EURIBOR +2%' para simular un shock de mercado. Observa cómo el motor identifica el impacto sobre la cobertura de la cesión de crédito." },
    { title: "5. Obra Completada", text: "Al marcar la obra como completada, el arrendamiento de cosa futura pasa a ser efectivo. La hipoteca puede ahora inscribirse para ser oponible erga omnes." },
    { title: "6. Registro = Oponibilidad", text: "Al simular la inscripción de la hipoteca, el contrato salta de Opus PARCIAL a Opus OPONIBLE. En la realidad, la inscripción en el Registro de la Propiedad vincula a cualquier tercero (erga omnes)." },
  ];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", fontFamily:font.ui }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg, #1E1B4B 0%, #7C3AED 100%)", padding:"14px 18px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <div style={{ fontSize:22 }}>⊛</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.textWhite }}>KPMG Demo — Hotel Mediterráneo Valencia 5*</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)", fontFamily:font.mono }}>
              Banco Mediterráneo de Inversiones S.A. · Promotora Hotel Mediterráneo Valencia S.L.
            </div>
          </div>
          {cascading && (
            <div style={{ marginLeft:"auto", fontSize:10, color:"#A78BFA", fontFamily:font.mono, animation:"pulse 1s ease infinite" }}>
              ⟳ Propagando cascada…
            </div>
          )}
        </div>

        {/* KPI strip */}
        <div style={{ display:"flex", gap:6 }}>
          <KPICard icon="💶" label="Capital" value="€100M" color="rgba(255,255,255,0.9)" />
          <KPICard icon="📅" label="Cuota/mes"
            value={fmtEur(monthlyPMT)}
            sub={`${totalRate.toFixed(2)}% = E${euribor}+S${spread}`}
            color={totalRate > 6 ? "#F87171" : totalRate > 5 ? "#FBBF24" : "#34D399"}
            delta={Math.abs(pmtDelta) > 100 ? pmtDelta : null} />
          <KPICard icon="🏨" label="Cobertura"
            value={`${rentCoverage}%`}
            sub={`${fmtEur(monthlyRent)}/mes renta`}
            color={parseFloat(rentCoverage) > 130 ? "#34D399" : parseFloat(rentCoverage) > 100 ? "#FBBF24" : "#F87171"} />
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, background:C.white, flexShrink:0 }}>
        {[
          { key:"financiero", label:"💱 Financiero" },
          { key:"amortizacion", label:"📊 Amortización" },
          { key:"demo",       label:"🎬 Demo Story" },
          { key:"riesgos",    label:"⚠ Sensibilidad" },
        ].map(t => (
          <button key={t.key} onClick={() => setSection(t.key)}
            style={{ padding:"8px 14px", border:"none", background:"none", cursor:"pointer",
              fontSize:11, fontFamily:font.ui, fontWeight:500,
              color:section===t.key?C.textDark:C.textMuted,
              borderBottom:section===t.key?`2px solid #7C3AED`:"2px solid transparent",
              transition:"all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>

        {/* ── Financial Controls ── */}
        {section === "financiero" && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:14 }}>
              Parámetros del Circumcontrato CA2
            </div>

            <Slider label="EURIBOR 12M" value={euribor} min={0} max={8} step={0.25} unit="%"
              onChange={setEuribor} color={euribor > 5 ? C.red : euribor > 3.5 ? C.orange : C.green}
              description={euribor > 5 ? "⚠ Alto" : euribor < 2 ? "✓ Bajo" : "Normal"} />

            <Slider label="Diferencial (Spread)" value={spread} min={0.5} max={5} step={0.25} unit="%"
              onChange={setSpread} color={C.purple}
              description="Margen bancario pactado" />

            <Slider label="Plazo" value={termYears} min={5} max={30} step={1} unit=" años"
              onChange={setTermYears} color={C.blue}
              description={`${termYears * 12} cuotas mensuales`} />

            <Slider label="Capital" value={capital / 1_000_000} min={10} max={200} step={5} unit="M€"
              onChange={v => setCapital(v * 1_000_000)} color={C.gold}
              description="Importe del servicio financiero" />

            {/* Summary box */}
            <div style={{ padding:"12px 14px", background:`#7C3AED10`, border:`1px solid #7C3AED30`,
              borderRadius:8, marginTop:6 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#7C3AED", marginBottom:8, textTransform:"uppercase" }}>
                Cálculo en tiempo real (Sistema Francés)
              </div>
              {[
                ["Tipo total", `${totalRate.toFixed(2)}% (E${euribor.toFixed(2)}% + S${spread.toFixed(2)}%)`],
                ["Cuota mensual", fmtEur(monthlyPMT)],
                ["Total cuotas", fmtEur(monthlyPMT * termYears * 12)],
                ["Total intereses", fmtEur(totalInterest)],
                ["Cobertura cesión", `${rentCoverage}% (${fmtEur(monthlyRent)}/mes renta vs ${fmtEur(monthlyPMT)}/mes cuota)`],
              ].map(([k, v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:4,
                  fontSize:11, borderBottom:`1px solid #7C3AED15`, paddingBottom:4 }}>
                  <span style={{ color:C.textMuted }}>{k}</span>
                  <span style={{ fontFamily:font.mono, fontWeight:700, color:C.textDark }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>
                Acciones de Demostración
              </div>

              <button onClick={triggerCrisis} disabled={crisisMode}
                style={{ padding:"10px 14px", background:crisisMode?C.bgAlt:C.redBg, color:crisisMode?C.textMuted:C.red,
                  border:`1.5px solid ${crisisMode?C.border:C.red}40`, borderRadius:8,
                  cursor:crisisMode?"not-allowed":"pointer", fontSize:12, fontFamily:font.ui, fontWeight:700,
                  textAlign:"left", transition:"all 0.2s" }}>
                📉 Crisis EURIBOR (+2%) — Simular shock de mercado
                {crisisMode && <span style={{ marginLeft:8, fontSize:9, color:C.orange }}>⚠ Activo — sube slider para ver impacto</span>}
              </button>

              <button onClick={triggerBuildComplete} disabled={buildDone}
                style={{ padding:"10px 14px", background:buildDone?C.greenBg:C.orangeBg, color:buildDone?C.green:C.orange,
                  border:`1.5px solid ${buildDone?C.green:C.orange}40`, borderRadius:8,
                  cursor:buildDone?"not-allowed":"pointer", fontSize:12, fontFamily:font.ui, fontWeight:700,
                  textAlign:"left", transition:"all 0.2s" }}>
                🏗️ Obra Completada — {buildDone ? "✓ F1 Activo" : "Cosa futura → Cosa real"}
              </button>

              <button onClick={triggerRegisterHipoteca} disabled={hipRegDone}
                style={{ padding:"10px 14px", background:hipRegDone?C.goldBg:C.bgAlt, color:hipRegDone?C.goldDim:C.textMuted,
                  border:`1.5px solid ${hipRegDone?C.gold:C.border}`, borderRadius:8,
                  cursor:hipRegDone?"not-allowed":"pointer", fontSize:12, fontFamily:font.ui, fontWeight:700,
                  textAlign:"left", transition:"all 0.2s" }}>
                ⊙ Simular inscripción de Hipoteca — {hipRegDone ? "✓ Opus OPONIBLE" : "Opus PARCIAL → OPONIBLE"}
              </button>

              <button onClick={resetToBase}
                style={{ padding:"8px 14px", background:"none", color:C.textMuted,
                  border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer",
                  fontSize:11, fontFamily:font.ui }}>
                ↺ Restaurar parámetros base
              </button>
            </div>
          </div>
        )}

        {/* ── Amortization Table ── */}
        {section === "amortizacion" && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:10 }}>
              Cuadro de Amortización (primeras 12 cuotas) · Sistema Francés
            </div>
            <div style={{ padding:"8px 12px", background:`#7C3AED10`, borderRadius:7, marginBottom:10,
              fontSize:11, color:"#7C3AED", fontFamily:font.mono }}>
              EURIBOR {euribor}% + Spread {spread}% = {totalRate.toFixed(2)}% total · €{(capital/1e6).toFixed(0)}M · {termYears} años
            </div>
            <AmortTable schedule={schedule} />
            <div style={{ marginTop:12, padding:"10px 12px", background:C.bgAlt, borderRadius:7,
              fontSize:10, color:C.textMuted }}>
              Total intereses pagados en {termYears} años: <strong style={{ color:C.red }}>{fmtEur(totalInterest)}</strong>
              <br/>Total pagado (capital + intereses): <strong style={{ color:C.textDark }}>{fmtEur(totalPaid)}</strong>
            </div>
          </div>
        )}

        {/* ── Demo Story ── */}
        {section === "demo" && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:12 }}>
              Narrativa para Inversores — 7 minutos
            </div>

            {DEMO_STEPS.map((s, i) => (
              <div key={i}
                onClick={() => setStep(i)}
                style={{ padding:"12px 14px", background:step===i?`#7C3AED10`:C.white,
                  border:`1.5px solid ${step===i?"#7C3AED":C.border}`,
                  borderLeft:`4px solid ${step===i?"#7C3AED":C.borderStrong}`,
                  borderRadius:8, marginBottom:8, cursor:"pointer", transition:"all 0.15s" }}>
                <div style={{ fontSize:12, fontWeight:700, color:step===i?"#7C3AED":C.textDark, marginBottom:4 }}>
                  {s.title}
                </div>
                <div style={{ fontSize:11, color:C.textBody, lineHeight:1.65 }}>{s.text}</div>
              </div>
            ))}

            <div style={{ marginTop:14, padding:"12px 14px", background:C.navyDeep, borderRadius:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textWhite, marginBottom:6 }}>
                🎯 Mensaje clave para el inversor
              </div>
              <div style={{ fontSize:11, color:C.textNavy, lineHeight:1.7 }}>
                "Ningún sistema legaltech del mercado puede modelar un circumcontrato CA2. PHENOMENON sí. El engine entiende que este contrato NO es un préstamo desde la ontología jurídica, no desde una caja de texto. Eso es la diferencia entre inteligencia contractual real e inteligencia artificial genérica."
              </div>
            </div>
          </div>
        )}

        {/* ── Risk Sensitivity ── */}
        {section === "riesgos" && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:12 }}>
              Análisis de Sensibilidad — Riesgos KPMG
            </div>

            {[
              {
                title: "Riesgo EURIBOR — Sensibilidad de cuota",
                color: C.red,
                rows: [
                  ["EURIBOR 2%", fmtEur(calcPMT(capital, 2+spread, termYears)), "✅ Bajo"],
                  ["EURIBOR 3.5% (base)", fmtEur(calcPMT(capital, 3.5+spread, termYears)), "✅ Normal"],
                  ["EURIBOR 5%", fmtEur(calcPMT(capital, 5+spread, termYears)), "⚠ Elevado"],
                  ["EURIBOR 7%", fmtEur(calcPMT(capital, 7+spread, termYears)), "❌ Crítico"],
                ],
              },
              {
                title: "Cobertura de la cesión (renta vs. cuota)",
                color: C.blue,
                rows: [
                  ["Renta hotel: €1.064.583/mes", "", ""],
                  ["Cobertura a tipo base (5.5%)", `${((monthlyRent / calcPMT(capital, 5.5, termYears))*100).toFixed(1)}%`, parseFloat(rentCoverage) > 130 ? "✅" : "⚠"],
                  ["Cobertura tipo actual", `${rentCoverage}%`, parseFloat(rentCoverage) > 130 ? "✅" : parseFloat(rentCoverage)>100?"⚠":"❌"],
                  ["Break-even (cuota = renta)", `EURIBOR ${(((monthlyRent / capital) * 12 - spread/100) * 100).toFixed(1)}%`, ""],
                ],
              },
              {
                title: "Cosa futura — Riesgo de obra",
                color: C.orange,
                rows: [
                  ["Plazo límite obra", "31/12/2026", "⏳"],
                  ["Si obra no finaliza", "Resolución + devolución + interés legal", "❌"],
                  ["Penalización diaria acordada", "A negociar (no fijada)", "⚠"],
                  ["Cobertura seguro TRC obra", "Recomendado — no presente", "⚠"],
                ],
              },
            ].map(section => (
              <div key={section.title} style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:section.color, marginBottom:6 }}>{section.title}</div>
                <div style={{ background:C.white, border:`1px solid ${section.color}20`, borderRadius:8, overflow:"hidden" }}>
                  {section.rows.map((row, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                      padding:"6px 12px", borderBottom:`1px solid ${C.border}`,
                      background:i%2===0?C.white:C.bgAlt }}>
                      <span style={{ fontSize:10, color:C.textBody, flex:1 }}>{row[0]}</span>
                      <span style={{ fontSize:10, fontFamily:font.mono, color:C.textDark, minWidth:120, textAlign:"right" }}>{row[1]}</span>
                      <span style={{ fontSize:12, minWidth:20 }}>{row[2]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
