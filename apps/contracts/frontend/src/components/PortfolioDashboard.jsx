/**
 * Portfolio Dashboard for AppC
 * Shows aggregate view of all contracts when none is selected.
 * Key dates, risk summary, exposure by party, contract health.
 */
import { C, font, SUB_META, OPUS_LEVELS, getOpusLevel, statusColor, statusLabel } from "../constants.js";
import { detectRisks, getRiskLevel, RISK_COLORS, RISK_ICONS } from "./RiskEngine.jsx";

function KeyDateRow({ name, date, type, color }) {
  if (!date) return null;
  const d = new Date(date);
  const days = Math.floor((d - new Date()) / 86400000);
  const urgency = days < 0 ? "expired" : days < 30 ? "critical" : days < 90 ? "warning" : "ok";
  const urgencyColor = { expired:"#7F1D1D", critical:C.red, warning:C.orange, ok:C.green }[urgency];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:7, background:C.white, border:`1px solid ${C.border}`, marginBottom:6 }}>
      <div style={{ width:40, height:40, borderRadius:7, background:`${urgencyColor}15`, border:`1.5px solid ${urgencyColor}40`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:13, fontWeight:700, color:urgencyColor, lineHeight:1 }}>{Math.abs(days)}</div>
        <div style={{ fontSize:7, color:urgencyColor, fontFamily:font.mono }}>días</div>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:C.textDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
        <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono }}>{type} · {date}</div>
      </div>
      <div style={{ fontSize:10, fontWeight:700, color:urgencyColor, fontFamily:font.mono, flexShrink:0 }}>
        {days < 0 ? "EXPIRADO" : days < 30 ? "URGENTE" : days < 90 ? "PRÓXIMO" : "OK"}
      </div>
    </div>
  );
}

export default function PortfolioDashboard({ contracts, masters, subContracts, onSelect, onNewProject }) {
  const allPhenomena = Object.values(contracts);
  const allMasters   = allPhenomena.filter(c => !c.parentId);
  const allSubs      = allPhenomena.filter(c => c.parentId);

  // Aggregate stats
  const totalValue = allMasters.reduce((s,c) => s + (parseFloat(c.ag?.terms?.baseAmount||0) || parseFloat(c.ag?.terms?.monthlyFee||0)*12 || 0), 0);
  const byStatus   = allPhenomena.reduce((acc,c) => { acc[c.status] = (acc[c.status]||0)+1; return acc; }, {});
  const byType     = allSubs.reduce((acc,c) => { acc[c.type] = (acc[c.type]||0)+1; return acc; }, {});
  const homol      = { valid: allPhenomena.filter(c=>c.opus?.homologation==="VALID").length, invalid: allPhenomena.filter(c=>c.opus?.homologation==="INVALID").length, pending: allPhenomena.filter(c=>c.opus?.homologation==="PENDING").length };

  // Key dates from all masters
  const keyDates = allMasters.flatMap(m => [
    m.ess?.expiryDate && { name:m.name, date:m.ess.expiryDate, type:"Vencimiento", color:C.red, id:m.id },
    m.ess?.effectiveDate && (() => { const d=new Date(m.ess.effectiveDate); const diff=Math.floor((d-new Date())/86400000); return diff > 0 && diff < 180 ? {name:m.name,date:m.ess.effectiveDate,type:"Inicio próximo",color:C.blue,id:m.id} : null; })(),
  ].filter(Boolean)).sort((a,b) => {
    const da = Math.abs(Math.floor((new Date(a.date)-new Date())/86400000));
    const db = Math.abs(Math.floor((new Date(b.date)-new Date())/86400000));
    return da - db;
  }).slice(0, 8);

  // Party exposure
  const partyExposure = {};
  allMasters.forEach(m => {
    const party = m.ess?.partyB;
    if (party) {
      if (!partyExposure[party]) partyExposure[party] = { value:0, contracts:0, risks:[] };
      partyExposure[party].value += parseFloat(m.ag?.terms?.baseAmount||0) || 0;
      partyExposure[party].contracts++;
    }
  });

  // Risk summary across all contracts
  const allRisks = allMasters.flatMap(m => {
    const subs = allSubs.filter(s => (m.children||[]).includes(s.id));
    return detectRisks(m, subs, allMasters).map(r => ({...r, contractName:m.name, contractId:m.id}));
  });
  const highRisks = allRisks.filter(r=>r.level==="high");

  // Smart suggestions
  const suggestions = [];
  allMasters.forEach(m => {
    const subs = allSubs.filter(s => (m.children||[]).includes(s.id));
    const subTypes = subs.map(s=>s.type);
    if (!subTypes.includes("NDA")) suggestions.push({ for:m.name, text:"Añadir NDA para proteger información compartida", icon:"◈", color:C.colorNDA });
    if (!subTypes.includes("DPA") && (m.ag?.clauses||[]).join(" ").toLowerCase().includes("datos")) suggestions.push({ for:m.name, text:"Añadir Acuerdo DPA (RGPD obligatorio para datos personales)", icon:"◉", color:C.colorDPA });
    if (!m.ag?.terms?.baseAmount && !m.ag?.terms?.monthlyFee) suggestions.push({ for:m.name, text:"Definir importe económico para el análisis de portfolio", icon:"◇", color:C.colorPAYMENT });
  });

  return (
    <div style={{ padding:"0 4px", fontFamily:font.ui }}>

      {/* Portfolio header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:C.textDark, marginBottom:4 }}>Portfolio de Contratos</div>
          <div style={{ fontSize:12, color:C.textMuted }}>{allMasters.length} contratos marco · {allSubs.length} subcontratos · Motor PHENOMENON</div>
        </div>
        {allMasters.length === 0 && (
          <button onClick={onNewProject} style={{ background:C.navyDeep, color:C.white, border:"none", borderRadius:8, padding:"10px 18px", cursor:"pointer", fontSize:13, fontFamily:font.ui, fontWeight:700 }}>+ Nuevo Proyecto</button>
        )}
      </div>

      {allMasters.length === 0 ? (
        <div style={{ textAlign:"center", padding:"48px 32px", background:C.white, borderRadius:12, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:56, opacity:0.12, marginBottom:16 }}>⬡</div>
          <div style={{ fontSize:18, fontWeight:700, color:C.textDark, marginBottom:8 }}>Sin contratos en el portfolio</div>
          <div style={{ fontSize:13, color:C.textMuted, marginBottom:24, lineHeight:1.7 }}>Crea tu primer contrato seleccionando una plantilla. El motor PHENOMENON modelará la estructura jurídica completa.</div>
          <button onClick={onNewProject} style={{ background:C.gold, color:"#000", border:"none", borderRadius:8, padding:"12px 24px", cursor:"pointer", fontSize:14, fontFamily:font.ui, fontWeight:700 }}>⬡ Crear Primer Contrato</button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

          {/* Left column */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Portfolio metrics */}
            <div style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, padding:"18px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:14 }}>Métricas del Portfolio</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  ["Valor Total", totalValue>0?`€${totalValue>=1000000?(totalValue/1000000).toFixed(1)+"M":(totalValue/1000).toFixed(0)+"K"}`:"Sin valor definido", C.gold],
                  ["Contratos Marco", allMasters.length, C.blue],
                  ["Subcontratos", allSubs.length, C.purple],
                  ["Homologados", `${homol.valid}/${allPhenomena.length}`, homol.invalid>0?C.orange:C.green],
                ].map(([l,v,col])=>(
                  <div key={l} style={{ padding:"12px 14px", background:C.bgAlt, borderRadius:8 }}>
                    <div style={{ fontSize:9, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{l}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:col }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk summary */}
            <div style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, padding:"18px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>
                Resumen de Riesgos {highRisks.length>0&&<span style={{ color:C.red }}>({highRisks.length} ALTOS)</span>}
              </div>
              {allRisks.length === 0 ? (
                <div style={{ fontSize:12, color:C.green }}>✅ Sin riesgos detectados en el portfolio</div>
              ) : (
                <>
                  {highRisks.slice(0,4).map((r,i)=>(
                    <div key={i} onClick={()=>onSelect(r.contractId)}
                      style={{ display:"flex", gap:8, padding:"8px 10px", marginBottom:6, background:C.redBg, border:`1px solid ${C.red}20`, borderRadius:7, cursor:"pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#FEE2E2"}
                      onMouseLeave={e=>e.currentTarget.style.background=C.redBg}>
                      <span>🔴</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:C.textDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div>
                        <div style={{ fontSize:9, color:C.textMuted }}>{r.contractName}</div>
                      </div>
                      <span style={{ fontSize:10, color:C.red, flexShrink:0 }}>→</span>
                    </div>
                  ))}
                  {allRisks.filter(r=>r.level==="medium").length>0&&<div style={{ fontSize:10, color:C.orange, marginTop:6 }}>+ {allRisks.filter(r=>r.level==="medium").length} riesgos medios</div>}
                </>
              )}
            </div>

            {/* Party exposure */}
            {Object.keys(partyExposure).length > 0 && (
              <div style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, padding:"18px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Exposición por Contraparte</div>
                {Object.entries(partyExposure).sort((a,b)=>b[1].value-a[1].value).slice(0,5).map(([party,data])=>(
                  <div key={party} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <div style={{ fontSize:11, color:C.textBody, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{party}</div>
                    <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono }}>{data.contracts} contrato{data.contracts!==1?"s":""}</div>
                    {data.value>0&&<div style={{ fontSize:11, fontWeight:700, color:C.gold, fontFamily:font.mono }}>€{data.value>=1000000?(data.value/1000000).toFixed(1)+"M":(data.value/1000).toFixed(0)+"K"}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Smart suggestions */}
            {suggestions.length>0&&(
              <div style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, padding:"18px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>💡 Sugerencias Inteligentes</div>
                {suggestions.slice(0,5).map((s,i)=>(
                  <div key={i} style={{ display:"flex", gap:8, padding:"8px 10px", marginBottom:6, background:C.goldBg, border:`1px solid ${C.gold}30`, borderRadius:7 }}>
                    <span style={{ color:s.color, fontSize:14, flexShrink:0 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:11, color:C.textDark, lineHeight:1.5 }}>{s.text}</div>
                      <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginTop:2 }}>Para: {s.for?.slice(0,30)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Key dates tracker */}
            <div style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, padding:"18px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>⏰ Fechas Clave y Vencimientos</div>
              {keyDates.length===0 ? (
                <div style={{ fontSize:12, color:C.textMuted }}>No hay fechas próximas relevantes.</div>
              ) : (
                keyDates.map((kd,i)=><KeyDateRow key={i} {...kd}/>)
              )}
            </div>

            {/* Contract list with health */}
            <div style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, padding:"18px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Estado de Contratos</div>
              {allMasters.map(m => {
                const subs = allSubs.filter(s => (m.children||[]).includes(s.id));
                const risks = detectRisks(m, subs, allMasters);
                const riskLvl = getRiskLevel(risks);
                const opus = getOpusLevel(m);
                const opusCfg = OPUS_LEVELS[opus];
                return (
                  <div key={m.id} onClick={()=>onSelect(m.id)}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, marginBottom:6, background:C.bgAlt, border:`1px solid ${C.border}`, cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.borderColor=C.gold;}}
                    onMouseLeave={e=>{e.currentTarget.style.background=C.bgAlt;e.currentTarget.style.borderColor=C.border;}}>
                    <div style={{ fontSize:22 }}>{RISK_ICONS[riskLvl]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:C.textDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</div>
                      <div style={{ display:"flex", gap:6, marginTop:3 }}>
                        <span style={{ fontSize:9, color:statusColor(m.status), fontFamily:font.mono }}>{statusLabel(m.status)}</span>
                        <span style={{ fontSize:9, color:opusCfg?.color, fontFamily:font.mono }}>{opusCfg?.icon} {opus}</span>
                        <span style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono }}>{subs.length} sub{subs.length!==1?"s":""}</span>
                      </div>
                    </div>
                    {risks.filter(r=>r.level==="high").length>0&&<span style={{ fontSize:9, color:C.red, background:C.redBg, padding:"1px 6px", borderRadius:3, fontFamily:font.mono, flexShrink:0 }}>{risks.filter(r=>r.level==="high").length} alto</span>}
                    <span style={{ fontSize:12, color:C.textMuted }}>→</span>
                  </div>
                );
              })}
            </div>

            {/* Sub-contract breakdown */}
            {Object.keys(byType).length>0&&(
              <div style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, padding:"18px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Desglose de Subcontratos</div>
                {Object.entries(byType).map(([type,count])=>{
                  const meta = SUB_META[type];
                  if (!meta) return null;
                  return (
                    <div key={type} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:16, color:meta.color }}>{meta.icon}</span>
                      <div style={{ flex:1, fontSize:11, color:C.textBody }}>{meta.label}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:meta.color }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
