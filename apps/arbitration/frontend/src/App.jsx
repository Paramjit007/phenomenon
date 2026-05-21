import { useState, useEffect, useCallback, useRef } from "react";
import { C, font, IA_CFG, CLAIM_TYPES, DISPUTE_TYPES, SIAC_PROCEDURES, SIAC_TIMELINES, siacFee, DISCLAIMER_EN, DISCLAIMER_ES, FINAL_RULE } from "./constants.js";
import EngineProcess from "./EngineProcess.jsx";

const BASE = "/api";
async function api(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, { headers:{"Content-Type":"application/json"}, ...opts, body:opts.body?JSON.stringify(opts.body):undefined });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

const inp = (empty, extra={}) => ({ width:"100%", padding:"9px 12px", fontSize:13, border:`1.5px solid ${empty?C.orange:C.border}`, borderRadius:7, background:empty?"#FFFBEB":C.bgInput, color:C.textDark, outline:"none", fontFamily:font.ui, lineHeight:1.5, transition:"all 0.2s", ...extra });
const sel = { padding:"9px 12px", fontSize:13, border:`1px solid ${C.border}`, borderRadius:7, background:C.bgInput, color:C.textDark, outline:"none", fontFamily:font.ui, width:"100%", cursor:"pointer" };
const lbl = (txt, req) => <label style={{ fontSize:10, fontWeight:600, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:4 }}>{txt}{req&&<span style={{ color:C.orange, marginLeft:3 }}>*</span>}</label>;
const secH = (title, color=C.navy, sub) => (
  <div style={{ marginBottom:12, paddingBottom:8, borderBottom:`2px solid ${color}25` }}>
    <div style={{ fontSize:11, fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.07em" }}>{title}</div>
    {sub&&<div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginTop:2 }}>{sub}</div>}
  </div>
);
const f2 = (label,val,onChange,type="text",req=false,ph="",rows) => (
  <div style={{ marginBottom:12 }}>
    {lbl(label,req)}
    {rows
      ? <textarea value={val||""} onChange={e=>onChange(e.target.value)} placeholder={ph} rows={rows} style={{ ...inp(req&&!val), resize:"vertical" }}/>
      : <input type={type} value={val||""} onChange={e=>onChange(e.target.value)} placeholder={ph} style={inp(req&&!val?.trim())}/>
    }
  </div>
);

// ── Verification Engine ─────────────────────────────────────────────────────
function verifySIACCase(ess, terms, claims) {
  const claimArgs = claims.filter(c=>c.ia==="ad-actio"||c.ia==="co-implication");
  const n = claimArgs.length;
  const withQtm    = claimArgs.filter(c=>parseFloat(c.quantum)>0).length;
  const withBasis  = claimArgs.filter(c=>c.legalBasis?.trim()).length;
  const withEvid   = claimArgs.filter(c=>c.evidence?.trim()).length;
  const fatalCount = claimArgs.filter(c=>c.strength==="fatal").length;
  const objCount   = claims.filter(c=>c.ia==="non").length;
  const docs       = (terms.documents||[]).length;

  return [
    // ESS — Case Identity
    { key:"partyA",   label:"Claimant identified",             group:"Case Identity (ESS)",       valid:!!ess.partyA?.trim(),           required:true,  tab:"parties",   field:"partyA" },
    { key:"partyB",   label:"Respondent identified",           group:"Case Identity (ESS)",       valid:!!ess.partyB?.trim(),           required:true,  tab:"parties",   field:"partyB" },
    { key:"seat",     label:"Seat of arbitration (IST·Space)", group:"Case Identity (IST)",       valid:!!ess.jurisdiction?.trim(),      required:true,  tab:"parties",   field:"jurisdiction" },
    { key:"noaDate",  label:"Notice of Arbitration date",      group:"Case Identity (IST)",       valid:!!ess.effectiveDate,            required:true,  tab:"parties",   field:"effectiveDate" },
    // Legal framework
    { key:"appLaw",   label:"Applicable law specified",        group:"Legal Framework",           valid:!!terms.applicableLaw?.trim(),   required:true,  tab:"parties" },
    { key:"arbCl",    label:"Arbitration clause referenced",   group:"Legal Framework",           valid:!!terms.arbitrationClause?.trim(),required:true, tab:"parties" },
    // Tribunal
    { key:"tribComp", label:"Tribunal composition specified",  group:"Tribunal Constitution",     valid:!!terms.arbitratorCount,        required:true,  tab:"parties" },
    // SIAC 2025 compliance
    { key:"tpf",      label:"Third-party funding disclosed (Rule 6.1 SIAC 2025)", group:"SIAC 2025 Compliance", valid:!!terms.tpf?.trim(), required:true, tab:"parties" },
    { key:"proc",     label:"Procedure type selected",         group:"SIAC 2025 Compliance",      valid:!!terms.procedure,              required:true,  tab:"procedure" },
    // Claims register
    { key:"claims",   label:`At least one claim registered (${n})`,  group:"Claims Register (AG·Ager)", valid:n>0,                   required:true,  tab:"claims" },
    { key:"quantum",  label:`Quantum specified (${withQtm}/${n})`,   group:"Claims Register (AG·Ager)", valid:withQtm===n&&n>0,       required:false, tab:"claims", note:"Unquantified claims weaken the case" },
    { key:"basis",    label:`Legal basis for all claims (${withBasis}/${n})`, group:"Claims Register (AG·Ager)", valid:withBasis===n&&n>0, required:true, tab:"claims" },
    { key:"evidence", label:`Evidence referenced (${withEvid}/${n})`, group:"Evidence & Documents",   valid:withEvid===n&&n>0,          required:false, tab:"claims" },
    // IA engine
    { key:"ia",       label:"IA operators assigned (PHENOMENON engine)", group:"IA — Vectores PHENOMENON", valid:claims.some(c=>c.ia), required:true, tab:"claims" },
    // Preliminary objections
    { key:"obj",      label:`Preliminary objections considered (${objCount} registered)`, group:"Procedural Compliance", valid:true, required:false, tab:"objections", note:"Non-jurisdictional issues are not waived if not raised at Response stage" },
    // Documents
    { key:"docs",     label:`Document registry (${docs} document${docs!==1?"s":""})`, group:"Evidence & Documents", valid:docs>0, required:false, tab:"documents" },
    // Fatal flaws
    ...(fatalCount>0?[{ key:"fatal", label:`Fatal flaws in ${fatalCount} argument(s) — reconsider strategy`, group:"Critical Warnings", valid:false, required:true, tab:"claims" }]:[]),
  ];
}

// ── Disclaimer ──────────────────────────────────────────────────────────────
function DisclaimerScreen({ onAccept }) {
  const [lang, setLang] = useState("en");
  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg,${C.navyDeep},${C.navy})`, display:"flex", alignItems:"center", justifyContent:"center", padding:32, fontFamily:font.ui }}>
      <div style={{ maxWidth:620, background:C.white, borderRadius:16, padding:"40px 44px", boxShadow:"0 32px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
          <div style={{ width:52, height:52, background:C.navyDeep, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, color:C.gold, borderRadius:12 }}>Φ</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:22, fontWeight:700, color:C.textDark }}>PHENOMENON</div>
            <div style={{ fontSize:11, color:C.gold, fontFamily:font.mono, letterSpacing:"0.12em" }}>SIAC INTERNATIONAL ARBITRATION CO-PILOT</div>
            <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono }}>SIAC Rules 2025 · Structural Analysis · PHENOMENON Engine v2.2</div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {["en","es"].map(l=><button key={l} onClick={()=>setLang(l)} style={{ background:lang===l?C.navyDeep:"none", color:lang===l?C.white:C.textMuted, border:`1px solid ${lang===l?C.navyDeep:C.border}`, borderRadius:5, padding:"4px 11px", cursor:"pointer", fontSize:11, fontFamily:font.mono }}>{l.toUpperCase()}</button>)}
          </div>
        </div>
        <div style={{ background:C.redBg, border:`1px solid ${C.red}30`, borderRadius:10, padding:"16px 20px", marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.red, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>{lang==="en"?"Important Disclaimer — Not Legal Advice":"Aviso Legal Importante — No es Asesoramiento Jurídico"}</div>
          <div style={{ fontSize:13, color:C.textBody, lineHeight:1.75 }}>{lang==="en"?DISCLAIMER_EN:DISCLAIMER_ES}</div>
        </div>
        <div style={{ padding:"14px 18px", background:C.goldBg, border:`1px solid ${C.gold}40`, borderRadius:10, marginBottom:24 }}>
          <div style={{ fontSize:12, color:C.goldDim, fontFamily:font.serif, fontStyle:"italic", lineHeight:1.65 }}>"{FINAL_RULE}"</div>
        </div>
        <button onClick={onAccept} style={{ width:"100%", padding:15, background:C.navyDeep, color:C.white, border:"none", borderRadius:10, cursor:"pointer", fontSize:15, fontFamily:font.ui, fontWeight:700 }}>
          {lang==="en"?"I understand — Open PHENOMENON AppS":"Entiendo — Abrir PHENOMENON AppS"}
        </button>
      </div>
    </div>
  );
}

// ── Argument Network SVG ────────────────────────────────────────────────────
function ArgumentNetwork({ caseData, claims, onSelect, selected }) {
  const dtype = DISPUTE_TYPES[caseData?.type]??DISPUTE_TYPES.SIAC_COMMERCIAL;
  const n=claims.length; const CX=300,CY=185,R=n<=3?120:n<=5?145:165;
  const pos=i=>{const a=(2*Math.PI*i/Math.max(n,1))-Math.PI/2;return{x:CX+R*Math.cos(a),y:CY+R*Math.sin(a)};};
  const sc=s=>s==="strong"?C.green:s==="moderate"?C.orange:s==="weak"?C.red:s==="fatal"?"#7F1D1D":C.textMuted;
  const total=claims.reduce((s,c)=>s+(parseFloat(c.quantum)||0),0);
  return (
    <div style={{ background:C.white, borderRadius:12, border:`1px solid ${C.border}`, padding:"14px 18px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em" }}>Live Argument Network — PHENOMENON Engine</div>
          <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono }}>{n} argument{n!==1?"s":""} · Total quantum: USD {total>0?total.toLocaleString():"TBD"} · {claims.filter(c=>c.strength==="strong").length} strong · {claims.filter(c=>c.strength==="weak"||c.strength==="fatal").length} weak/fatal</div>
        </div>
        <div style={{ fontSize:9, color:C.green, background:C.greenBg, padding:"2px 8px", borderRadius:3, fontFamily:font.mono }}>● LIVE</div>
      </div>
      <svg width="100%" viewBox="0 0 600 370" style={{ overflow:"visible" }}>
        <pattern id="dg" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill={C.border} opacity="0.5"/></pattern>
        <rect width="600" height="370" fill="url(#dg)"/>
        <style>{`@keyframes dash{to{stroke-dashoffset:-18}}`}</style>
        {claims.map((cl,i)=>{const p=pos(i);const col=IA_CFG[cl.ia||"ad-actio"]?.color??C.textMuted;return <path key={i} d={`M${CX},${CY} L${p.x},${p.y}`} stroke={col} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.45} style={{animation:"dash 2s linear infinite"}}/>;} )}
        <polygon points={`${CX},${CY-36} ${CX+31},${CY-18} ${CX+31},${CY+18} ${CX},${CY+36} ${CX-31},${CY+18} ${CX-31},${CY-18}`} fill={`${dtype.color}18`} stroke={dtype.color} strokeWidth={2.5}/>
        <text x={CX} y={CY-6} textAnchor="middle" fontSize={20} fill={dtype.color}>{dtype.icon}</text>
        <text x={CX} y={CY+10} textAnchor="middle" fontSize={7} fill={dtype.color} fontWeight="700" fontFamily="sans-serif">CASE</text>
        <text x={CX} y={CY+20} textAnchor="middle" fontSize={6} fill={C.textMuted} fontFamily="sans-serif">{caseData?.name?.slice(0,18)}</text>
        {claims.map((cl,i)=>{const p=pos(i);const ia=cl.ia||"ad-actio";const col=IA_CFG[ia]?.color??C.textMuted;const scCol=sc(cl.strength);const sel_=selected===i;const qtm=parseFloat(cl.quantum)||0;const r=sel_?28:qtm>10000000?26:qtm>1000000?22:18;
          return <g key={i} style={{cursor:"pointer"}} onClick={()=>onSelect(sel_?null:i)}>
            <circle cx={p.x} cy={p.y} r={r+5} fill="none" stroke={scCol} strokeWidth={1} strokeDasharray="3 2" opacity={0.5}/>
            <circle cx={p.x} cy={p.y} r={r} fill={`${col}18`} stroke={col} strokeWidth={sel_?2.5:1.5} style={{filter:sel_?`drop-shadow(0 0 10px ${col}60)`:qtm>5000000?`drop-shadow(0 0 4px ${col}40)`:"none",transition:"all 0.2s"}}/>
            <text x={p.x} y={p.y-5} textAnchor="middle" fontSize={13} fill={col}>{IA_CFG[ia]?.icon}</text>
            <text x={p.x} y={p.y+6} textAnchor="middle" fontSize={7} fill={col} fontFamily="sans-serif" fontWeight="700">{cl.claimId||`C${i+1}`}</text>
            <text x={p.x} y={p.y+15} textAnchor="middle" fontSize={6} fill={C.textMuted} fontFamily="sans-serif">{qtm>0?`USD ${qtm>=1000000?(qtm/1000000).toFixed(1)+"M":(qtm/1000).toFixed(0)+"K"}`:"TBD"}</text>
            {cl.strength&&<text x={p.x} y={p.y+24} textAnchor="middle" fontSize={6} fill={scCol} fontFamily="sans-serif">{cl.strength?.toUpperCase()}</text>}
          </g>;
        })}
        {claims.length===0&&<text x={CX} y={CY+80} textAnchor="middle" fontSize={11} fill={C.textLight} fontFamily="sans-serif">Add claims in the Claims Register to see the argument network</text>}
        <g transform="translate(460,20)">
          <text fontSize={8} fill={C.textMuted} fontFamily="sans-serif" fontWeight="700" letterSpacing="0.07">IA OPERATORS</text>
          {Object.entries(IA_CFG).map(([k,v],i)=><g key={k} transform={`translate(0,${14+i*17})`}><circle cx={7} cy={7} r={6} fill={`${v.color}20`} stroke={v.color} strokeWidth={1.3}/><text x={7} y={10} textAnchor="middle" fontSize={7} fill={v.color}>{v.icon}</text><text x={17} y={10} fontSize={9} fill={v.color} fontFamily="sans-serif" fontWeight="600">{v.label}</text></g>)}
        </g>
      </svg>
    </div>
  );
}

// ── Bipartite IA Map ─────────────────────────────────────────────────────────
function IABipartite({ claims }) {
  const iaList=Object.keys(IA_CFG);const W=320,H=90;
  const iaY=i=>12+i*(H-14)/Math.max(iaList.length-1,1);
  const clY=i=>12+i*(H-14)/Math.max(claims.length-1,1);
  const LX=58,RX=W-52;
  return (
    <div style={{ background:C.white, borderRadius:10, border:`1px solid ${C.border}`, padding:"12px 16px", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ fontSize:10, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em" }}>IA Assignment Map · Bloque II IF</div>
        <div style={{ fontSize:8, color:C.green, fontFamily:font.mono }}>● Real-time</div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
        {claims.map((c,ci)=>{const ia=c.ia||"ad-actio";const ii=iaList.indexOf(ia);const col=IA_CFG[ia]?.color??C.textMuted;const y1=iaY(ii),y2=clY(ci);return <path key={ci} d={`M${LX+6},${y1} C${LX+40},${y1} ${RX-40},${y2} ${RX-6},${y2}`} stroke={col} strokeWidth={1.3} fill="none" opacity={0.55}/>;} )}
        {iaList.map((k,i)=>{const def=IA_CFG[k];const active=claims.some(c=>(c.ia||"ad-actio")===k);return <g key={k}><circle cx={LX} cy={iaY(i)} r={active?7:4.5} fill={active?`${def.color}22`:"#F3F4F6"} stroke={active?def.color:C.border} strokeWidth={1.2}/><text x={LX} y={iaY(i)+3} textAnchor="middle" fontSize={active?8:6} fill={active?def.color:C.textLight}>{def.icon}</text><text x={LX-9} y={iaY(i)+3} textAnchor="end" fontSize={7} fill={active?def.color:C.textLight} fontFamily="sans-serif">{def.label?.slice(0,7)}</text></g>;})}
        {claims.map((c,i)=>{const ia=c.ia||"ad-actio";const col=IA_CFG[ia]?.color??C.textMuted;return <g key={i}><circle cx={RX} cy={clY(i)} r={5.5} fill={`${col}15`} stroke={col} strokeWidth={1.2}/><text x={RX+9} y={clY(i)+3} fontSize={7} fill={C.textMuted} fontFamily="sans-serif">{c.claimId||`A${i+1}`}: {c.text?.slice(0,15)||"argument"}...</text></g>;})}
        {claims.length===0&&<text x={W/2} y={H/2+3} textAnchor="middle" fontSize={9} fill={C.textLight} fontFamily="sans-serif">No arguments registered</text>}
      </svg>
    </div>
  );
}

// ── Timeline ────────────────────────────────────────────────────────────────
function SIACTimeline({ filingDate, procedure }) {
  const start=filingDate?new Date(filingDate):null;const today=new Date();
  const days=start?Math.floor((today-start)/86400000):null;
  const proc=SIAC_PROCEDURES[procedure||"standard"];
  return (
    <div style={{ background:C.white, borderRadius:10, border:`1px solid ${C.border}`, padding:"12px 16px", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ fontSize:10, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em" }}>SIAC 2025 Timeline (IST·Temporal CA1)</div>
        {proc&&<span style={{ fontSize:9, color:proc.color, background:`${proc.color}15`, padding:"2px 8px", borderRadius:3, fontFamily:font.mono }}>{proc.label}</span>}
      </div>
      <div style={{ display:"flex", gap:0, position:"relative" }}>
        <div style={{ position:"absolute", top:10, left:0, right:0, height:1.5, background:`linear-gradient(to right,${C.gold},${C.orange})`, zIndex:0 }}/>
        {SIAC_TIMELINES.filter(t=>typeof t.day==="number").map((t,i,arr)=>{
          const past=days!==null&&days>=t.day;const cur=past&&(i===arr.length-1||days<arr[i+1].day);
          return <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", position:"relative", zIndex:1 }} title={t.desc}>
            <div style={{ width:12, height:12, borderRadius:"50%", background:past?t.color:C.border, border:`2px solid ${C.white}`, boxShadow:cur?`0 0 0 3px ${t.color}40`:"none", marginBottom:4, transition:"all 0.3s" }}/>
            <div style={{ fontSize:8, fontWeight:700, color:past?t.color:C.textLight, fontFamily:font.mono, textAlign:"center" }}>D{t.day}</div>
            <div style={{ fontSize:7, color:C.textMuted, textAlign:"center", lineHeight:1.3, maxWidth:58 }}>{t.event}</div>
            {cur&&<div style={{ fontSize:7, color:C.green, background:C.greenBg, padding:"0px 4px", borderRadius:2, fontFamily:font.mono, marginTop:1 }}>NOW</div>}
          </div>;
        })}
      </div>
    </div>
  );
}

// ── Claim Row ────────────────────────────────────────────────────────────────
function ClaimRow({ claim, idx, onChange, onDelete }) {
  const ia=claim.ia||"ad-actio";const def=IA_CFG[ia];
  const sc={"strong":C.green,"moderate":C.orange,"weak":C.red,"fatal":"#7F1D1D"};
  return (
    <div style={{ background:C.bgAlt, border:`1px solid ${def?.color}30`, borderRadius:10, padding:"14px 16px", marginBottom:10, borderLeft:`4px solid ${def?.color}` }}>
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
        <div style={{ background:`${def?.color}15`, color:def?.color, fontFamily:font.mono, fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:5 }}>{claim.claimId||`A${idx+1}`}</div>
        <select value={ia} onChange={e=>onChange({...claim,ia:e.target.value})} style={{ ...sel, width:"auto", fontSize:11, padding:"3px 8px" }}>
          {Object.entries(IA_CFG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <select value={claim.type||"breach"} onChange={e=>onChange({...claim,type:e.target.value})} style={{ ...sel, width:"auto", fontSize:11, padding:"3px 8px" }}>
          {CLAIM_TYPES.map(t=><option key={t.key} value={t.key}>{t.icon} {t.label}</option>)}
        </select>
        <select value={claim.strength||"moderate"} onChange={e=>onChange({...claim,strength:e.target.value})} style={{ ...sel, width:"auto", fontSize:11, padding:"3px 8px", color:sc[claim.strength||"moderate"] }}>
          {["strong","moderate","weak","fatal"].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <button onClick={onDelete} style={{ marginLeft:"auto", background:C.redBg, color:C.red, border:`1px solid ${C.red}30`, borderRadius:6, padding:"3px 9px", cursor:"pointer", fontSize:12, flexShrink:0 }}>✕</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:10, marginBottom:8 }}>
        <div>
          {lbl("Factual & Legal Basis")}
          <textarea value={claim.text||""} rows={2} onChange={e=>onChange({...claim,text:e.target.value})} placeholder="Factual basis and applicable law provisions (e.g. Clause 14.3; FIDIC 20.1; BIT Art. 4)..." style={{ ...inp(false), resize:"vertical", minHeight:56 }}/>
        </div>
        <div>
          {lbl("Quantum (USD)")}
          <input type="number" value={claim.quantum||""} onChange={e=>onChange({...claim,quantum:e.target.value})} placeholder="e.g. 25000000" style={inp(false)}/>
          {claim.quantum&&<div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginTop:3 }}>USD {parseFloat(claim.quantum).toLocaleString()}</div>}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div>
          {lbl("Applicable Law / Provision")}
          <input value={claim.legalBasis||""} onChange={e=>onChange({...claim,legalBasis:e.target.value})} placeholder="Art. 1124 CC; Clause 23 SPA; BIT Art. 4(1)" style={inp(false)}/>
        </div>
        <div>
          {lbl("Key Documents / Exhibits")}
          <input value={claim.evidence||""} onChange={e=>onChange({...claim,evidence:e.target.value})} placeholder="C-1: SPA dated...; C-2: Email..." style={inp(false)}/>
        </div>
      </div>
      {claim.strength==="fatal"&&<div style={{ marginTop:8, padding:"6px 10px", background:"#7F1D1D15", border:"1px solid #7F1D1D30", borderRadius:6, fontSize:11, color:"#7F1D1D" }}>⚠ Fatal flaw — this argument has a structural defect. Consider withdrawing or fundamentally rethinking the legal theory.</div>}
    </div>
  );
}

// ── Verification Panel (modal) ───────────────────────────────────────────────
function VerificationModal({ checks, isRunning, onClose, onNavigate }) {
  const failed=checks.filter(c=>!c.valid&&c.required);
  const warnings=checks.filter(c=>!c.valid&&!c.required);
  const passed=checks.filter(c=>c.valid);
  const allOk=failed.length===0;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, backdropFilter:"blur(3px)" }} onClick={e=>{if(e.target===e.currentTarget&&!isRunning)onClose();}}>
      <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:none}}`}</style>
      <div style={{ background:C.white, borderRadius:14, width:620, maxHeight:"84vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 80px rgba(0,0,0,0.3)", animation:"popIn 0.25s ease" }}>
        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <div style={{ width:38, height:38, borderRadius:8, background:allOk?C.greenBg:failed.length>0?C.redBg:C.orangeBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
              {isRunning?"⟳":allOk?"✅":failed.length>0?"❌":"⚠️"}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:700, color:C.textDark }}>
                {isRunning?"Verifying SIAC Case…":allOk?"Case Fully Structured — Opus Complete":failed.length>0?`${failed.length} Required Issue${failed.length!==1?"s":""} to Resolve`:`${warnings.length} Recommendation${warnings.length!==1?"s":""}`}
              </div>
              <div style={{ fontSize:11, color:C.textMuted }}>
                {passed.length}/{checks.length} checks passed · PHENOMENON Engine v2.2
              </div>
            </div>
            {!isRunning&&<button onClick={onClose} style={{ background:C.bgAlt, border:"none", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:16, color:C.textMuted }}>×</button>}
          </div>
          <div style={{ height:6, background:C.bgAlt, borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", background:allOk?C.green:failed.length>0?C.orange:C.green, width:`${(passed.length/checks.length)*100}%`, borderRadius:3, transition:"width 0.4s ease" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
            <span style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono }}>{passed.length}/{checks.length} passed</span>
            <span style={{ fontSize:10, color:allOk?C.green:C.orange, fontFamily:font.mono, fontWeight:700 }}>{passed.length} ✓  {failed.length} ✗  {warnings.length} ⚠</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 24px" }}>
          {/* Errors */}
          {failed.length>0&&(
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.red, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>❌ Required — {failed.length} issue{failed.length!==1?"s":""} to resolve</div>
              {failed.map(chk=>(
                <button key={chk.key} onClick={()=>onNavigate(chk.tab,chk.field)}
                  style={{ display:"flex", alignItems:"center", gap:10, width:"100%", background:C.redBg, border:`1px solid ${C.red}25`, borderRadius:8, padding:"10px 12px", cursor:"pointer", marginBottom:6, textAlign:"left" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="#FEE2E2";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=C.redBg;}}>
                  <span style={{ fontSize:14, flexShrink:0 }}>❌</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.textDark }}>{chk.label}</div>
                    <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono }}>{chk.group}</div>
                  </div>
                  <span style={{ fontSize:11, color:C.red, fontFamily:font.ui, fontWeight:600, flexShrink:0 }}>Go to field →</span>
                </button>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length>0&&(
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.orange, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>⚠ Recommendations ({warnings.length})</div>
              {warnings.map(chk=>(
                <button key={chk.key} onClick={()=>onNavigate(chk.tab,chk.field)}
                  style={{ display:"flex", alignItems:"center", gap:10, width:"100%", background:C.orangeBg, border:`1px solid ${C.orange}25`, borderRadius:8, padding:"10px 12px", cursor:"pointer", marginBottom:6, textAlign:"left" }}>
                  <span style={{ fontSize:14 }}>⚠️</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:C.textDark }}>{chk.label}</div>
                    {chk.note&&<div style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono, marginTop:2 }}>{chk.note}</div>}
                  </div>
                  <span style={{ fontSize:10, color:C.orange, fontFamily:font.mono }}>→</span>
                </button>
              ))}
            </div>
          )}

          {/* All passed */}
          {allOk&&(
            <div style={{ textAlign:"center", padding:"28px 0" }}>
              <div style={{ fontSize:52, marginBottom:10 }}>✅</div>
              <div style={{ fontSize:18, fontWeight:700, color:C.green, marginBottom:6 }}>Opus Complete — Case Fully Structured</div>
              <div style={{ fontSize:13, color:C.textMuted, lineHeight:1.7, maxWidth:400, margin:"0 auto" }}>All PHENOMENON checks pass. The case has a structurally coherent legal theory. Ready for legal counsel review before any filing.</div>
              <div style={{ marginTop:16, padding:"12px 16px", background:C.goldBg, border:`1px solid ${C.gold}30`, borderRadius:8, textAlign:"left" }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.goldDim, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5 }}>Bloque IV — Opus Level</div>
                <div style={{ fontSize:13, color:C.gold }}>◌ PARCIAL → ✓ COMPLETE ← You are here</div>
                <div style={{ fontSize:10, color:C.textMuted, marginTop:4 }}>For Opus OPONIBLE: obtain the SIAC award, then register for enforcement under the New York Convention (170+ states).</div>
              </div>
            </div>
          )}

          {/* Passed checks */}
          {passed.length>0&&!allOk&&(
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>✓ Passed ({passed.length})</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {passed.map(chk=><span key={chk.key} style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:C.greenBg, color:C.green, fontFamily:font.mono, border:`1px solid ${C.green}30` }}>✓ {chk.label}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isRunning&&(
          <div style={{ padding:"12px 24px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"flex-end", flexShrink:0, background:C.bgAlt }}>
            <button onClick={onClose} style={{ background:C.navyDeep, color:C.white, border:"none", borderRadius:6, padding:"8px 18px", cursor:"pointer", fontSize:13, fontFamily:font.ui, fontWeight:600 }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Documents Tab with Upload + OCR + Engine Process ─────────────────────────
function DocumentsTab({ terms, updT, selId, ess }) {
  const [engineStage,  setEngineStage]  = useState(0);
  const [engineResult, setEngineResult] = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const [uploadError,  setUploadError]  = useState(null);
  const [pendingDoc,   setPendingDoc]   = useState(null); // extracted data awaiting save confirmation
  const fileRef = useRef(null);

  async function processFile(file) {
    setUploading(true); setEngineStage(1); setEngineResult(null); setUploadError(null); setPendingDoc(null);

    try {
      // Stage 1 → 2: Upload + OCR
      setEngineStage(2);
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/documents/upload", { method:"POST", body:formData });
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
      const uploaded = await uploadRes.json();

      // Stage 3: ESS detection
      setEngineStage(3);
      await new Promise(r=>setTimeout(r,400));

      // Stage 4: AG extraction
      setEngineStage(4);
      await new Promise(r=>setTimeout(r,400));

      // Stage 5-6: IA + Vector (send to analysis)
      setEngineStage(5);
      const caseCtx = `Case: ${ess?.partyA||"Claimant"} v ${ess?.partyB||"Respondent"}, Seat: ${ess?.jurisdiction||"Singapore"}`;
      const analyseRes = await fetch("/api/documents/analyse", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          filename: file.name,
          text: uploaded.text || "",
          base64_content: uploaded.base64 || "",
          content_type: file.type || "",
          case_context: caseCtx,
        }),
      });
      const result = analyseRes.ok ? await analyseRes.json() : null;

      setEngineStage(6); await new Promise(r=>setTimeout(r,300));
      setEngineStage(7); await new Promise(r=>setTimeout(r,300));
      setEngineStage(8);
      setEngineResult(result);
      setPendingDoc({ file: file.name, size: file.size, result });
    } catch(e) {
      setUploadError(e.message);
      setEngineStage(0);
    }
    setUploading(false);
  }

  function saveDocument() {
    if (!pendingDoc?.result) return;
    const r = pendingDoc.result;
    const existing = terms.documents || [];
    const claimantCount = existing.filter(d=>d.party==="Claimant").length;
    const respondentCount = existing.filter(d=>d.party==="Respondent").length;
    const newDoc = {
      id: Date.now().toString(),
      name: r.document_subtype || r.document_type || pendingDoc.file,
      filename: pendingDoc.file,
      type: r.document_type || "Document",
      party: (r.parties||[]).find(p=>p.role==="Respondent")?"Respondent":"Claimant",
      exhibitNo: r.exhibit_suggestion || `C-${claimantCount+1}`,
      description: r.summary || "",
      date: (r.key_dates||[])[0]?.date || "",
      ia_operator: r.ia_operator || "ad-actio",
      strength: r.strength_assessment || "moderate",
      legal_significance: r.legal_significance || "",
      ess_extracted: r.ess_extraction || {},
      ag_extracted: r.ag_extraction || {},
      key_provisions: r.key_provisions || [],
      monetary_amounts: r.monetary_amounts || [],
      fallback: r.fallback || false,
    };
    updT("documents", [...existing, newDoc]);
    setPendingDoc(null); setEngineStage(0); setEngineResult(null);
  }

  const docs = terms.documents || [];

  return (
    <div>
      {/* Engine pipeline (always visible) */}
      <div style={{ marginBottom:16 }}>
        <EngineProcess currentStage={engineStage} result={engineResult} compact={false}/>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)processFile(f);}}
        onClick={()=>!uploading&&fileRef.current?.click()}
        style={{ border:`2px dashed ${dragOver?C.blue:uploading?C.gold:C.border}`, borderRadius:12, padding:"24px 20px", textAlign:"center", cursor:uploading?"not-allowed":"pointer", background:dragOver?C.blueBg:uploading?C.goldBg:C.bgAlt, transition:"all 0.2s", marginBottom:16 }}>
        <input ref={fileRef} type="file" style={{ display:"none" }} accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={e=>{const f=e.target.files[0];if(f)processFile(f);e.target.value="";}}/>
        <div style={{ fontSize:32, marginBottom:8 }}>{uploading?"⟳":"📎"}</div>
        <div style={{ fontSize:13, fontWeight:600, color:C.textDark, marginBottom:4 }}>
          {uploading?"PHENOMENON engine processing…":"Drop document here or click to upload"}
        </div>
        <div style={{ fontSize:11, color:C.textMuted }}>
          {uploading?"Extracting text → identifying ESS → mapping IA operator → assessing vector strength":"PDF, Word, Images, Plain text · OCR + Claude AI extraction · PHENOMENON engine analysis"}
        </div>
      </div>

      {uploadError&&<div style={{ padding:"8px 12px", background:C.redBg, border:`1px solid ${C.red}25`, borderRadius:8, fontSize:11, color:C.red, marginBottom:12 }}>⚠ Error: {uploadError}</div>}

      {/* Pending document — review extracted data before saving */}
      {pendingDoc?.result&&(
        <div style={{ background:C.goldBg, border:`1.5px solid ${C.gold}50`, borderRadius:12, padding:"16px 18px", marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.goldDim, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>⊙ OPUS Generated — Review Extracted Data</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            {[
              ["Document Type",   pendingDoc.result.document_type + (pendingDoc.result.document_subtype?` — ${pendingDoc.result.document_subtype}`:"")],
              ["IA Operator",     (pendingDoc.result.ia_operator||"—").toUpperCase() + " — " + (IA_CFG[pendingDoc.result.ia_operator]?.label||"")],
              ["Vector Strength", (pendingDoc.result.strength_assessment||"—").toUpperCase()],
              ["Exhibit",        pendingDoc.result.exhibit_suggestion||"C-1"],
              ["Jurisdiction",   pendingDoc.result.ess_extraction?.jurisdiction||"—"],
              ["Governing Law",  pendingDoc.result.governing_law||"—"],
            ].map(([l,v])=>(
              <div key={l} style={{ padding:"8px 10px", background:C.white, borderRadius:7, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:8, color:C.textMuted, fontFamily:font.mono, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>{l}</div>
                <div style={{ fontSize:12, fontWeight:600, color:C.textDark }}>{v}</div>
              </div>
            ))}
          </div>

          {/* ESS extracted */}
          {pendingDoc.result.ess_extraction&&Object.values(pendingDoc.result.ess_extraction).some(v=>v)&&(
            <div style={{ padding:"10px 12px", background:C.white, borderRadius:8, border:`1px solid ${C.border}`, marginBottom:10 }}>
              <div style={{ fontSize:9, color:C.gold, fontFamily:font.mono, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>ESS Extracted (Bloque I · Ser)</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:11, color:C.textBody }}>
                {Object.entries(pendingDoc.result.ess_extraction).filter(([,v])=>v).map(([k,v])=>(
                  <div key={k}><span style={{ color:C.textMuted, fontFamily:font.mono, fontSize:9 }}>{k}: </span>{v}</div>
                ))}
              </div>
            </div>
          )}

          {/* Key provisions */}
          {(pendingDoc.result.key_provisions||[]).length>0&&(
            <div style={{ padding:"10px 12px", background:C.white, borderRadius:8, border:`1px solid ${C.border}`, marginBottom:10 }}>
              <div style={{ fontSize:9, color:C.purple, fontFamily:font.mono, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Key Provisions (AG · Ager)</div>
              {pendingDoc.result.key_provisions.slice(0,4).map((p,i)=>(
                <div key={i} style={{ fontSize:11, color:C.textBody, marginBottom:4, paddingLeft:10, borderLeft:`2px solid ${C.purple}40` }}>{p}</div>
              ))}
            </div>
          )}

          {/* Monetary amounts */}
          {(pendingDoc.result.monetary_amounts||[]).length>0&&(
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
              {pendingDoc.result.monetary_amounts.map((a,i)=>(
                <span key={i} style={{ fontSize:11, padding:"3px 8px", borderRadius:5, background:C.greenBg, color:C.green, border:`1px solid ${C.green}30`, fontFamily:font.mono }}>
                  {a.currency} {parseFloat(a.amount||0).toLocaleString()} — {a.description}
                </span>
              ))}
            </div>
          )}

          {pendingDoc.result.fallback&&<div style={{ fontSize:9, color:C.orange, fontFamily:font.mono, marginBottom:10 }}>⚠ Placeholder extraction — configure ANTHROPIC_API_KEY for full Claude AI OCR analysis</div>}

          <div style={{ fontSize:11, color:C.textMuted, fontFamily:font.ui, marginBottom:12, lineHeight:1.5 }}>{pendingDoc.result.summary}</div>

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={saveDocument} style={{ flex:1, background:C.navyDeep, color:C.white, border:"none", borderRadius:8, padding:"10px", cursor:"pointer", fontSize:13, fontFamily:font.ui, fontWeight:700 }}>⊙ Save to Document Registry</button>
            <button onClick={()=>{setPendingDoc(null);setEngineStage(0);setEngineResult(null);}} style={{ padding:"10px 14px", background:"none", border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer", fontSize:12, color:C.textMuted, fontFamily:font.ui }}>Discard</button>
          </div>
        </div>
      )}

      {/* Document registry */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        {secH(`Document Registry (${docs.length})`,C.navy,"All documents, evidence and exhibits")}
        <button onClick={()=>{const d=[...docs,{id:Date.now().toString(),name:"",type:"Contract",party:"Claimant",exhibitNo:`C-${docs.filter(x=>x.party==="Claimant").length+1}`,description:"",date:"",ia_operator:"ad-actio",strength:"moderate"}];updT("documents",d);}}
          style={{ background:C.bgAlt, color:C.textMuted, border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:11, fontFamily:font.ui, flexShrink:0, marginBottom:12 }}>+ Manual</button>
      </div>

      {docs.length===0&&<div style={{ padding:24, textAlign:"center", color:C.textMuted, fontSize:12, background:C.bgAlt, borderRadius:10, border:`1px dashed ${C.border}`, marginBottom:12 }}>No documents yet. Upload a file above or add manually.</div>}

      {docs.map((doc,i)=>{
        const iaDef = IA_CFG[doc.ia_operator||"ad-actio"];
        return (
          <div key={doc.id||i} style={{ background:C.bgAlt, border:`1px solid ${iaDef?.color}30`, borderLeft:`4px solid ${iaDef?.color}`, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
              <div style={{ fontFamily:font.mono, fontSize:11, fontWeight:700, color:C.navy, background:C.white, border:`1px solid ${C.border}`, padding:"2px 8px", borderRadius:4, flexShrink:0 }}>{doc.exhibitNo||`DOC-${i+1}`}</div>
              <div style={{ flex:1, fontSize:12, fontWeight:600, color:C.textDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.name||"Unnamed document"}</div>
              <span style={{ fontSize:10, color:iaDef?.color, background:`${iaDef?.color}15`, padding:"1px 6px", borderRadius:3, fontFamily:font.mono, flexShrink:0 }}>{iaDef?.icon} {iaDef?.label}</span>
              <span style={{ fontSize:9, color:doc.strength==="strong"?C.green:doc.strength==="weak"?C.red:C.orange, fontFamily:font.mono, flexShrink:0 }}>{doc.strength?.toUpperCase()}</span>
              <button onClick={()=>updT("documents",docs.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:14, flexShrink:0 }}>✕</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:8 }}>
              <div>
                {lbl("Type")}
                <select value={doc.type||"Contract"} onChange={e=>{const d=[...docs];d[i]={...d[i],type:e.target.value};updT("documents",d);}} style={{ ...sel, fontSize:11, padding:"4px 8px" }}>
                  {["Contract","Correspondence","Evidence","Legal","Expert Report","Witness Statement","Pleading","Award","Bank Record","Other"].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                {lbl("Party")}
                <select value={doc.party||"Claimant"} onChange={e=>{const d=[...docs];d[i]={...d[i],party:e.target.value};updT("documents",d);}} style={{ ...sel, fontSize:11, padding:"4px 8px" }}>
                  {["Claimant","Respondent","Tribunal","Both"].map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                {lbl("Exhibit No.")}
                <input value={doc.exhibitNo||""} onChange={e=>{const d=[...docs];d[i]={...d[i],exhibitNo:e.target.value};updT("documents",d);}} placeholder="C-1, R-2, T-1" style={{ ...inp(false), fontSize:11, padding:"4px 8px" }}/>
              </div>
            </div>
            {doc.description&&<div style={{ fontSize:10, color:C.textMuted, lineHeight:1.5, marginBottom:4 }}>{doc.description}</div>}
            {doc.legal_significance&&<div style={{ fontSize:10, color:C.blue, fontFamily:font.ui, fontStyle:"italic" }}>{doc.legal_significance}</div>}
            {(doc.key_provisions||[]).length>0&&<div style={{ marginTop:6, fontSize:9, color:C.textMuted, fontFamily:font.mono }}>Key provisions: {doc.key_provisions.slice(0,2).join(" · ")}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [accepted,   setAccepted]   = useState(false);
  const [cases,      setCases]      = useState([]);
  const [selId,      setSelId]      = useState(null);
  const [lang,       setLang]       = useState("en");
  const [rightTab,   setRightTab]   = useState("parties");
  const [selClaim,   setSelClaim]   = useState(null);
  const [showNew,    setShowNew]    = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [editName,   setEditName]   = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyChecks,setVerifyChecks] = useState([]);
  const [analysing,  setAnalysing]  = useState(false);
  const [analysis,   setAnalysis]   = useState(null);
  // Local state
  const [ess,    setEss]    = useState({});
  const [terms,  setTerms]  = useState({});
  const [claims, setClaims] = useState([]);
  // Panel widths (resizable)
  const [leftW,  setLeftW]  = useState(260);
  const [rightW, setRightW] = useState(480);
  const [lHover, setLHover] = useState(false);
  const [rHover, setRHover] = useState(false);
  const debounce = useRef({});

  const loadCases = useCallback(async()=>{try{const all=await api("/phenomena/");setCases(all.filter(p=>!p.parentId&&p.type?.startsWith("SIAC_")));}catch(_){}}, []);
  useEffect(()=>{if(accepted){loadCases();const t=setInterval(loadCases,5000);return()=>clearInterval(t);}},[accepted,loadCases]);

  const selected = cases.find(c=>c.id===selId)??null;
  const dtype = DISPUTE_TYPES[selected?.type]??DISPUTE_TYPES.SIAC_COMMERCIAL;

  useEffect(()=>{
    if(selected){
      setEss(selected.ess??{});
      setTerms(selected.ag?.terms??{});
      setClaims((selected.ag?.clauses??[]).map((text,i)=>{
        const s=(selected.ag?.claimData||[])[i]||{};
        return{text,ia:s.ia||"ad-actio",type:s.type||"breach",quantum:s.quantum||"",strength:s.strength||"moderate",evidence:s.evidence||"",legalBasis:s.legalBasis||"",claimId:s.claimId||`A${i+1}`};
      }));
      setAnalysis(null);
    }
  },[selId,selected?.status]);

  function updE(k,v){setEss(prev=>({...prev,[k]:v}));clearTimeout(debounce.current[k]);debounce.current[k]=setTimeout(()=>api(`/phenomena/${selId}`,{method:"PATCH",body:{ess:{[k]:v}}}).then(loadCases),700);}
  function updT(k,v){setTerms(prev=>({...prev,[k]:v}));clearTimeout(debounce.current["t"+k]);debounce.current["t"+k]=setTimeout(()=>{api(`/phenomena/${selId}`,{method:"PATCH",body:{ag:{clauses:claims.map(c=>c.text||""),terms:{...terms,[k]:v},templateKey:selected?.type}}}).then(loadCases);},700);}
  async function saveClaims(nc){setClaims(nc);await api(`/phenomena/${selId}`,{method:"PATCH",body:{ag:{clauses:nc.map(c=>c.text||""),terms:{...terms,claimData:nc}},ia_instances:[...new Set(nc.map(c=>c.ia||"ad-actio"))]}});loadCases();}
  async function createCase(type){const d=DISPUTE_TYPES[type];const c=await api("/phenomena/",{method:"POST",body:{name:`${d.label} — ${new Date().toLocaleDateString("en-GB")}`,type,parentId:null,ess:{partyA:"",partyB:"",jurisdiction:"Singapore",effectiveDate:"",expiryDate:""},ag:{clauses:[],terms:{templateKey:type,procedure:"standard",arbitratorCount:"1",tpf:"None"}},ia_instances:d.iaDefaults}});await loadCases();setSelId(c.id);setShowNew(false);setRightTab("parties");}
  async function renameCase(){if(!editName.trim())return;await api(`/phenomena/${editingId}`,{method:"PATCH",body:{name:editName}});await loadCases();setEditingId(null);}
  async function deleteCase(id){await api(`/phenomena/${id}`,{method:"DELETE"});await loadCases();if(selId===id)setSelId(null);setConfirmDel(null);}

  function runVerification(){
    const checks=verifySIACCase(ess,terms,claims);
    setVerifyChecks(checks);
    setShowVerify(true);
  }
  function handleVerifyNavigate(tab,field){
    setShowVerify(false);
    setRightTab(tab||"parties");
    // scroll to field after tab switch
    if(field){setTimeout(()=>{const el=document.getElementById(`field_${field}`);if(el){el.scrollIntoView({behavior:"smooth",block:"center"});el.focus();}},200);}
  }

  // Resize handlers
  function makeResize(setW,startW,dir){
    return (e)=>{e.preventDefault();const sx=e.clientX,sw=startW;const move=(e2)=>setW(Math.min(600,Math.max(200,sw+(dir==="left"?e2.clientX-sx:sx-e2.clientX))));const up=()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);};window.addEventListener("mousemove",move);window.addEventListener("mouseup",up);};
  }

  const total=claims.reduce((s,c)=>s+(parseFloat(c.quantum)||0),0);
  const siacFeeAmt=siacFee(total);
  const failCount=verifySIACCase(ess,terms,claims).filter(c=>!c.valid&&c.required).length;

  const rightTabs=[
    {key:"parties",    label:"Parties & Tribunal"},
    {key:"claims",     label:`Claims (${claims.filter(c=>c.ia==="ad-actio"||c.ia==="co-implication").length})`},
    {key:"objections", label:`Objections (${claims.filter(c=>c.ia==="non").length})`},
    {key:"defenses",   label:`Defenses (${claims.filter(c=>c.ia==="de-actio").length})`},
    {key:"documents",  label:`Documents (${(terms.documents||[]).length})`},
    {key:"procedure",  label:"Procedure"},
    {key:"notes",      label:"Notes & Review"},
    {key:"analysis",   label:"Analysis"},
  ];

  async function runAnalysis(){
    setAnalysing(true);
    try{const r=await api("/ai/generate-contract",{method:"POST",body:{contract_type:`SIAC ${dtype.label} Arbitration`,master_summary:`${ess.partyA||"Claimant"} v ${ess.partyB||"Respondent"}, Seat: ${ess.jurisdiction||"Singapore"}, ${claims.length} arguments, USD ${total.toLocaleString()}, SIAC Rules 2025`,ess}});const p=JSON.parse((r.result||"{}").replace(/```json|```/g,"").trim());setAnalysis({claims:p.clauses||[],special:p.special_terms||"",fallback:r.fallback});}
    catch(e){setAnalysis({error:e.message});}
    setAnalysing(false);
  }

  if(!accepted) return <DisclaimerScreen onAccept={()=>setAccepted(true)}/>;

  const gripStyle=(hover)=>({width:10,cursor:"col-resize",flexShrink:0,background:hover?`${C.blue}20`:C.bgAlt,borderLeft:`1px solid ${C.border}`,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,transition:"background 0.15s",userSelect:"none"});

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:C.bg, fontFamily:font.ui, overflow:"hidden" }}>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.borderStrong};border-radius:2px}select option{background:#1E2B45;color:white}@keyframes dash{to{stroke-dashoffset:-18}}@keyframes popIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:none}}`}</style>

      {/* Verification Modal */}
      {showVerify&&<VerificationModal checks={verifyChecks} isRunning={false} onClose={()=>setShowVerify(false)} onNavigate={handleVerifyNavigate}/>}

      {/* Delete confirm */}
      {confirmDel&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1999 }}>
          <div style={{ background:C.white, borderRadius:12, padding:28, width:380, boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.textDark, marginBottom:8 }}>Delete Case?</div>
            <div style={{ fontSize:13, color:C.textMuted, marginBottom:20, lineHeight:1.6 }}>This will permanently delete "{cases.find(c=>c.id===confirmDel)?.name}". This action cannot be undone.</div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>deleteCase(confirmDel)} style={{ flex:1, background:C.red, color:C.white, border:"none", borderRadius:8, padding:10, cursor:"pointer", fontSize:13, fontFamily:font.ui, fontWeight:700 }}>Delete permanently</button>
              <button onClick={()=>setConfirmDel(null)} style={{ flex:1, background:C.bgAlt, color:C.textBody, border:`1px solid ${C.border}`, borderRadius:8, padding:10, cursor:"pointer", fontSize:13, fontFamily:font.ui }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ height:56, background:C.white, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", padding:"0 18px", gap:12, flexShrink:0, boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
        <div style={{ width:34, height:34, background:C.navyDeep, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:C.gold, borderRadius:8 }}>Φ</div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:C.textDark, letterSpacing:"0.14em" }}>PHENOMENON</div>
          <div style={{ fontSize:8, color:C.textMuted, fontFamily:font.mono, letterSpacing:"0.1em" }}>SIAC Arbitration Co-pilot · Rules 2025</div>
        </div>
        {selected&&(
          <>
            <div style={{ width:1, height:26, background:C.border }}/>
            <div style={{ fontSize:13, fontWeight:600, color:C.textDark, maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{selected.name}</div>
            <div style={{ fontSize:10, color:dtype.color, background:`${dtype.color}12`, border:`1px solid ${dtype.color}30`, padding:"2px 8px", borderRadius:5, fontFamily:font.mono, flexShrink:0 }}>{dtype.label}</div>
            {total>0&&<div style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono }}>USD {total.toLocaleString()}</div>}
            {siacFeeAmt&&<div style={{ fontSize:9, color:C.purple, fontFamily:font.mono }}>SIAC: SGD {siacFeeAmt.toLocaleString()}</div>}
          </>
        )}
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          {selected&&(
            <button onClick={runVerification}
              style={{ background:failCount>0?C.orange:C.green, color:C.white, border:"none", borderRadius:7, padding:"6px 14px", cursor:"pointer", fontSize:12, fontFamily:font.ui, fontWeight:700 }}>
              ⊙ Verify Case {failCount>0?`(${failCount} issues)`:""}
            </button>
          )}
          {["en","es"].map(l2=><button key={l2} onClick={()=>setLang(l2)} style={{ background:lang===l2?C.navyDeep:"none", color:lang===l2?C.white:C.textMuted, border:`1px solid ${lang===l2?C.navyDeep:C.border}`, borderRadius:5, padding:"3px 9px", cursor:"pointer", fontSize:10, fontFamily:font.mono }}>{l2.toUpperCase()}</button>)}
          <div style={{ fontSize:9, color:C.red, background:C.redBg, border:`1px solid ${C.red}25`, padding:"2px 8px", borderRadius:3, fontFamily:font.mono, flexShrink:0 }}>NOT LEGAL ADVICE</div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* Left sidebar */}
        <div style={{ width:leftW, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", background:C.white, flexShrink:0, overflow:"hidden" }}>
          <div style={{ padding:"10px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:C.bgAlt, flexShrink:0 }}>
            <div>
              <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, textTransform:"uppercase", letterSpacing:"0.1em" }}>SIAC Cases</div>
              <div style={{ fontSize:8, color:C.textLight, fontFamily:font.mono }}>{cases.length} case{cases.length!==1?"s":""}</div>
            </div>
            <button onClick={()=>{setShowNew(p=>!p);setSelId(null);}} style={{ fontSize:11, color:C.white, background:C.navyDeep, border:"none", borderRadius:6, padding:"5px 12px", cursor:"pointer", fontFamily:font.ui, fontWeight:600 }}>+ New</button>
          </div>

          {showNew&&(
            <div style={{ padding:14, borderBottom:`1px solid ${C.border}`, background:C.goldBg, flexShrink:0 }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.textDark, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.07em" }}>Select Dispute Type</div>
              {Object.entries(DISPUTE_TYPES).map(([k,v])=>(
                <button key={k} onClick={()=>createCase(k)} style={{ display:"block", width:"100%", textAlign:"left", padding:"9px 12px", marginBottom:5, background:C.white, border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=v.color;e.currentTarget.style.background=`${v.color}08`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.white;}}>
                  <div style={{ fontSize:12, fontWeight:700, color:v.color, marginBottom:1 }}>{v.icon} {v.label}</div>
                  <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono }}>{v.siacRule?.slice(0,36)}</div>
                </button>
              ))}
              <button onClick={()=>setShowNew(false)} style={{ fontSize:11, color:C.textMuted, background:"none", border:"none", cursor:"pointer", marginTop:4 }}>Cancel</button>
            </div>
          )}

          <div style={{ flex:1, overflowY:"auto" }}>
            {cases.length===0&&!showNew&&(
              <div style={{ padding:28, textAlign:"center", color:C.textMuted, fontSize:12, lineHeight:1.8 }}>
                No cases yet.<br/><span style={{ color:C.gold, cursor:"pointer", fontWeight:600 }} onClick={()=>setShowNew(true)}>+ Create first SIAC case</span>
              </div>
            )}
            {cases.map(c=>{
              const dt=DISPUTE_TYPES[c.type]??DISPUTE_TYPES.SIAC_COMMERCIAL;
              const active=selId===c.id;
              const clCount=(c.ag?.claimData||c.ag?.clauses||[]).length;
              const isEditing=editingId===c.id;
              return (
                <div key={c.id} onClick={()=>{if(!isEditing){setSelId(c.id);setShowNew(false);setRightTab("parties");}}}
                  style={{ padding:"10px 14px", cursor:"pointer", borderLeft:`3px solid ${active?dt.color:"transparent"}`, background:active?`${dt.color}08`:C.white, borderBottom:`1px solid ${C.border}`, transition:"all 0.15s" }}>
                  {isEditing ? (
                    <div style={{ display:"flex", gap:6 }} onClick={e=>e.stopPropagation()}>
                      <input autoFocus value={editName} onChange={e=>setEditName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")renameCase();if(e.key==="Escape")setEditingId(null);}} style={{ ...inp(false), fontSize:11, padding:"4px 8px", flex:1 }}/>
                      <button onClick={renameCase} style={{ background:C.gold, color:"#000", border:"none", borderRadius:5, padding:"4px 8px", cursor:"pointer", fontSize:11, fontFamily:font.mono }}>✓</button>
                    </div>
                  ) : (
                    <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:16, color:dt.color, marginTop:1, flexShrink:0 }}>{dt.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:C.textDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</div>
                        <div style={{ fontSize:9, color:dt.color, fontFamily:font.mono, marginTop:1 }}>{dt.label?.slice(0,22)}</div>
                        <div style={{ fontSize:9, color:C.textMuted, marginTop:2 }}>{clCount} arg{clCount!==1?"s":""} · {c.ess?.partyA?.slice(0,10)||"—"} v {c.ess?.partyB?.slice(0,10)||"—"}</div>
                      </div>
                      {active&&(
                        <div style={{ display:"flex", gap:4, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>{setEditingId(c.id);setEditName(c.name);}} title="Rename" style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:C.textMuted, padding:"0 2px" }}>✏</button>
                          <button onClick={()=>setConfirmDel(c.id)} title="Delete" style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:C.red, padding:"0 2px" }}>🗑</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ padding:"8px 14px", borderTop:`1px solid ${C.border}`, fontSize:8, color:C.textLight, lineHeight:1.5, flexShrink:0 }}>Not legal advice. Review all output with qualified counsel before any filing.</div>
        </div>

        {/* ── Resize left ── */}
        <div onMouseDown={makeResize(setLeftW,leftW,"left")} onMouseEnter={()=>setLHover(true)} onMouseLeave={()=>setLHover(false)} style={gripStyle(lHover)}>
          {[0,1,2,3,4].map(i=><div key={i} style={{ width:2.5, height:2.5, borderRadius:"50%", background:lHover?C.blue:C.borderStrong }}/>)}
        </div>

        {/* Center: graphical engine */}
        <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:12, minWidth:280 }}>
          {selected ? (
            <>
              {/* Summary cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                {[
                  ["Total Quantum",    total>0?`USD ${total>=1000000?(total/1000000).toFixed(1)+"M":(total/1000).toFixed(0)+"K"}`:"TBD", C.gold],
                  ["Claims",          `${claims.filter(c=>c.ia==="ad-actio"||c.ia==="co-implication").length}`, C.blue],
                  ["Def. / Obj.",     `${claims.filter(c=>c.ia==="non"||c.ia==="de-actio").length}`, C.red],
                  ["SIAC Fee (est.)", siacFeeAmt?`SGD ${siacFeeAmt.toLocaleString()}`:"—", C.purple],
                ].map(([l,v,col],i)=>(
                  <div key={i} style={{ background:C.white, borderRadius:10, border:`1px solid ${C.border}`, padding:"12px 14px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                    <div style={{ fontSize:9, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{l}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:col }}>{v}</div>
                  </div>
                ))}
              </div>
              <ArgumentNetwork caseData={selected} claims={claims} onSelect={setSelClaim} selected={selClaim}/>
              {/* Compact engine pipeline — always visible in center */}
              <EngineProcess currentStage={0} result={null} compact={true}/>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <IABipartite claims={claims}/>
                <SIACTimeline filingDate={ess?.effectiveDate} procedure={terms?.procedure}/>
              </div>
              {selClaim!==null&&claims[selClaim]&&(
                <div style={{ background:C.white, borderRadius:12, border:`1px solid ${IA_CFG[claims[selClaim].ia||"ad-actio"]?.color}40`, padding:"16px 18px", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.textDark, marginBottom:8 }}>Selected: {claims[selClaim].claimId||`A${selClaim+1}`} · {IA_CFG[claims[selClaim].ia||"ad-actio"]?.label}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, fontSize:12 }}>
                    <div><div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginBottom:3 }}>FACTUAL BASIS</div><div style={{ color:C.textBody, lineHeight:1.5 }}>{claims[selClaim].text||"—"}</div></div>
                    <div><div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginBottom:3 }}>LEGAL BASIS</div><div style={{ color:C.textBody }}>{claims[selClaim].legalBasis||"—"}</div></div>
                    <div><div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginBottom:3 }}>EVIDENCE</div><div style={{ color:C.textBody }}>{claims[selClaim].evidence||"—"}</div></div>
                  </div>
                </div>
              )}
            </>
          ):(
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:18, padding:40, textAlign:"center" }}>
              <div style={{ fontSize:72, opacity:0.08 }}>Φ</div>
              <div style={{ fontSize:22, fontWeight:700, color:C.textDark }}>PHENOMENON Arbitration Co-pilot</div>
              <div style={{ fontSize:13, color:C.textMuted, maxWidth:460, lineHeight:1.8 }}>Create a SIAC case to begin. The PHENOMENON engine will map your legal arguments to vectorial operators and verify case completeness.</div>
              <div style={{ padding:"14px 20px", background:C.goldBg, border:`1px solid ${C.gold}40`, borderRadius:12, maxWidth:500 }}>
                <div style={{ fontSize:13, color:C.goldDim, fontFamily:font.serif, fontStyle:"italic", lineHeight:1.65 }}>"{FINAL_RULE}"</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Resize right ── */}
        <div onMouseDown={makeResize(setRightW,rightW,"right")} onMouseEnter={()=>setRHover(true)} onMouseLeave={()=>setRHover(false)} style={gripStyle(rHover)}>
          {[0,1,2,3,4].map(i=><div key={i} style={{ width:2.5, height:2.5, borderRadius:"50%", background:rHover?C.blue:C.borderStrong }}/>)}
        </div>

        {/* Right: multi-tab panel */}
        {selected&&(
          <div style={{ width:rightW, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", background:C.white, flexShrink:0 }}>
            <div style={{ display:"flex", overflowX:"auto", borderBottom:`1px solid ${C.border}`, background:C.bgAlt, flexShrink:0 }}>
              {rightTabs.map(t=>(
                <button key={t.key} onClick={()=>setRightTab(t.key)}
                  style={{ padding:"9px 11px", fontSize:10, fontFamily:font.ui, fontWeight:rightTab===t.key?700:400, border:"none", cursor:"pointer", background:rightTab===t.key?C.white:"none", color:rightTab===t.key?C.textDark:C.textMuted, borderBottom:`2px solid ${rightTab===t.key?dtype.color:"transparent"}`, whiteSpace:"nowrap", flexShrink:0, transition:"all 0.15s" }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>

              {/* ── PARTIES ── */}
              {rightTab==="parties"&&(
                <div>
                  <div style={{ marginBottom:16 }}>
                    {secH("Claimant",C.gold,"ESS — Ser (Identidad Estable · Bloque I)")}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div id="field_partyA">{f2("Full Legal Name *",ess.partyA,v=>updE("partyA",v),"text",true,"Company Ltd.")}</div>
                      <div>{f2("Registration / CIF",terms.claimantCIF||"",v=>updT("claimantCIF",v),"text",false,"UEN / CIF / Company No.")}</div>
                      <div>{f2("Registered Address",terms.claimantAddress||"",v=>updT("claimantAddress",v),"text",false,"123 Main Street, Singapore")}</div>
                      <div>{f2("Jurisdiction of Incorporation",terms.claimantJurisdiction||"",v=>updT("claimantJurisdiction",v),"text",false,"Singapore / England / India")}</div>
                      <div>{f2("Lead Counsel",terms.claimantCounsel||"",v=>updT("claimantCounsel",v),"text",false,"Ms Jane Smith")}</div>
                      <div>{f2("Law Firm",terms.claimantFirm||"",v=>updT("claimantFirm",v),"text",false,"Allen & Gledhill LLP")}</div>
                    </div>
                    {f2("Counsel Email",terms.claimantEmail||"",v=>updT("claimantEmail",v),"email",false,"jsmith@firm.com")}
                  </div>
                  <div style={{ marginBottom:16 }}>
                    {secH("Respondent",C.red,"ESS — Ser (Identidad Estable · Bloque I)")}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div id="field_partyB">{f2("Full Legal Name *",ess.partyB,v=>updE("partyB",v),"text",true,"Counterparty Ltd.")}</div>
                      <div>{f2("Registration / CIF",terms.respondentCIF||"",v=>updT("respondentCIF",v),"text",false,"Company registration no.")}</div>
                      <div>{f2("Registered Address",terms.respondentAddress||"",v=>updT("respondentAddress",v),"text",false,"Respondent address")}</div>
                      <div>{f2("Jurisdiction",terms.respondentJurisdiction||"",v=>updT("respondentJurisdiction",v),"text",false,"India / UK / UAE")}</div>
                      <div>{f2("Lead Counsel",terms.respondentCounsel||"",v=>updT("respondentCounsel",v),"text",false,"Mr John Doe")}</div>
                      <div>{f2("Law Firm",terms.respondentFirm||"",v=>updT("respondentFirm",v),"text",false,"Rajah & Tann LLP")}</div>
                    </div>
                    <div style={{ padding:"8px 12px", background:C.redBg, border:`1px solid ${C.red}25`, borderRadius:7, fontSize:10, color:C.red, marginTop:4 }}>
                      ⚠ Respondent must raise ALL jurisdictional objections in the Response (Rule 7 SIAC 2025). Failure = waiver (Shanghai Electric v Reliance, SGCA Dec 2024).
                    </div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    {secH("Third-Party Funding — Rule 6.1 SIAC 2025",C.orange)}
                    <div>{lbl("Funder (mandatory disclosure)",true)}</div>
                    <input id="field_tpf" value={terms.tpf||""} onChange={e=>updT("tpf",e.target.value)} placeholder="Funder name and contact — or 'None'" style={inp(!terms.tpf?.trim())}/>
                    <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginTop:4 }}>SIAC 2025 Rule 6.1: TPF disclosure is mandatory in the Notice of Arbitration.</div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    {secH("Arbitral Tribunal",C.blue)}
                    <div style={{ marginBottom:10 }}>
                      {lbl("Number of Arbitrators")}
                      <select value={terms.arbitratorCount||"1"} onChange={e=>updT("arbitratorCount",e.target.value)} style={sel}>
                        <option value="1">1 — Sole Arbitrator (default / expedited)</option>
                        <option value="3">3 — Three-Member Tribunal</option>
                      </select>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:terms.arbitratorCount==="3"?"1fr 1fr 1fr":"1fr", gap:10 }}>
                      {[0,1,2].slice(0,terms.arbitratorCount==="3"?3:1).map(i=>(
                        <div key={i}>
                          {lbl(i===0&&terms.arbitratorCount==="3"?"Claimant's Arb.":i===1?"Respondent's Arb.":terms.arbitratorCount==="3"?"Presiding Arb.":"Sole Arbitrator")}
                          <input value={terms[`arb${i}`]||""} onChange={e=>updT(`arb${i}`,e.target.value)} placeholder="Arbitrator name" style={{ ...inp(false), marginBottom:5 }}/>
                          <input type="date" value={terms[`arb${i}date`]||""} onChange={e=>updT(`arb${i}date`,e.target.value)} style={{ ...inp(false), fontSize:11 }}/>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    {secH("Arbitration Agreement",C.navy,"IST — Space + Time (Bloque III)")}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div id="field_jurisdiction">{f2("Seat of Arbitration (IST·Space) *",ess.jurisdiction,v=>updE("jurisdiction",v),"text",true,"Singapore")}</div>
                      <div id="field_applicableLaw">{f2("Applicable Law *",terms.applicableLaw||"",v=>updT("applicableLaw",v),"text",true,"English law / Singapore law")}</div>
                      <div id="field_effectiveDate">{f2("Notice of Arbitration Date (IST·Time) *",ess.effectiveDate,v=>updE("effectiveDate",v),"date",true)}</div>
                      <div>{f2("Underlying Contract Date",terms.contractDate||"",v=>updT("contractDate",v),"date")}</div>
                    </div>
                    <div id="field_arbitrationClause">{f2("Arbitration Clause Reference *",terms.arbitrationClause||"",v=>updT("arbitrationClause",v),"text",true,"e.g. Clause 23.1 of SPA dated 15 June 2020")}</div>
                  </div>
                </div>
              )}

              {/* ── CLAIMS ── */}
              {rightTab==="claims"&&(
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em" }}>Claims & Counterclaims Register</div>
                      <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono }}>IA: ad-actio (Claim) / co-implication (Counterclaim) — AG·Ager (Bloque I)</div>
                    </div>
                    <button onClick={()=>saveClaims([...claims,{text:"",ia:"ad-actio",type:"breach",quantum:"",strength:"moderate",evidence:"",legalBasis:"",claimId:`C${claims.filter(c=>c.ia==="ad-actio"||c.ia==="co-implication").length+1}`}])}
                      style={{ background:C.navyDeep, color:C.white, border:"none", borderRadius:7, padding:"7px 14px", cursor:"pointer", fontSize:12, fontFamily:font.ui, fontWeight:600 }}>+ Add Claim</button>
                  </div>
                  {claims.filter(c=>c.ia==="ad-actio"||c.ia==="co-implication").length===0&&<div style={{ padding:24, textAlign:"center", color:C.textMuted, fontSize:12, background:C.bgAlt, borderRadius:10, border:`1px dashed ${C.border}`, marginBottom:14 }}>No claims yet. Click "+ Add Claim" to build the claims register.</div>}
                  {claims.map((c,i)=>(c.ia==="ad-actio"||c.ia==="co-implication")&&<ClaimRow key={i} claim={c} idx={i} onChange={nc=>{const n=[...claims];n[i]=nc;saveClaims(n);}} onDelete={()=>saveClaims(claims.filter((_,j)=>j!==i))}/>)}
                  {total>0&&<div style={{ padding:"10px 14px", background:C.goldBg, border:`1px solid ${C.gold}40`, borderRadius:8, marginTop:4 }}>
                    <div style={{ fontSize:9, color:C.goldDim, fontFamily:font.mono, marginBottom:2 }}>AGGREGATE QUANTUM</div>
                    <div style={{ fontSize:18, fontWeight:700, color:C.gold }}>USD {total.toLocaleString()}</div>
                    {siacFeeAmt&&<div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginTop:2 }}>Est. SIAC admin fee: SGD {siacFeeAmt.toLocaleString()}</div>}
                  </div>}
                </div>
              )}

              {/* ── OBJECTIONS ── */}
              {rightTab==="objections"&&(
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em" }}>Preliminary Objections Register</div>
                      <div style={{ fontSize:9, color:C.red, fontFamily:font.mono }}>IA: non — Positional Exclusion Threshold (Bloque II §5)</div>
                    </div>
                    <button onClick={()=>saveClaims([...claims,{text:"",ia:"non",type:"other",quantum:"",strength:"moderate",evidence:"",legalBasis:"",claimId:`O${claims.filter(c=>c.ia==="non").length+1}`}])}
                      style={{ background:C.red, color:C.white, border:"none", borderRadius:7, padding:"7px 14px", cursor:"pointer", fontSize:12, fontFamily:font.ui, fontWeight:600 }}>+ Add Objection</button>
                  </div>
                  <div style={{ padding:"10px 14px", background:C.redBg, border:`1px solid ${C.red}30`, borderRadius:8, marginBottom:14, fontSize:11, color:C.textBody, lineHeight:1.6 }}>
                    <strong style={{ color:C.red }}>⚠ Critical:</strong> All jurisdictional objections MUST be raised in the Response (Rule 7 SIAC 2025). Failure = waiver — <em>Shanghai Electric v Reliance</em> (SGCA, Dec 2024).
                  </div>
                  {claims.filter(c=>c.ia==="non").length===0&&<div style={{ padding:24, textAlign:"center", color:C.textMuted, fontSize:12, background:C.bgAlt, borderRadius:10, border:`1px dashed ${C.border}` }}>No preliminary objections registered.</div>}
                  {claims.map((c,i)=>c.ia==="non"&&<ClaimRow key={i} claim={c} idx={i} onChange={nc=>{const n=[...claims];n[i]=nc;saveClaims(n);}} onDelete={()=>saveClaims(claims.filter((_,j)=>j!==i))}/>)}
                </div>
              )}

              {/* ── DEFENSES ── */}
              {rightTab==="defenses"&&(
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em" }}>Defenses Register</div>
                      <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono }}>IA: de-actio — Separative Return / Retroactive Argument (Bloque II)</div>
                    </div>
                    <button onClick={()=>saveClaims([...claims,{text:"",ia:"de-actio",type:"other",quantum:"",strength:"moderate",evidence:"",legalBasis:"",claimId:`D${claims.filter(c=>c.ia==="de-actio").length+1}`}])}
                      style={{ background:C.textMuted, color:C.white, border:"none", borderRadius:7, padding:"7px 14px", cursor:"pointer", fontSize:12, fontFamily:font.ui, fontWeight:600 }}>+ Add Defense</button>
                  </div>
                  {claims.filter(c=>c.ia==="de-actio").length===0&&<div style={{ padding:24, textAlign:"center", color:C.textMuted, fontSize:12, background:C.bgAlt, borderRadius:10, border:`1px dashed ${C.border}`, marginBottom:14 }}>No defenses registered.</div>}
                  {claims.map((c,i)=>c.ia==="de-actio"&&<ClaimRow key={i} claim={c} idx={i} onChange={nc=>{const n=[...claims];n[i]=nc;saveClaims(n);}} onDelete={()=>saveClaims(claims.filter((_,j)=>j!==i))}/>)}
                  <div style={{ padding:"8px 12px", background:C.purpleBg, border:`1px solid ${C.purple}30`, borderRadius:7, fontSize:10, color:C.purple }}>Counterclaims (co-implication) carry no filing fee under SIAC Rules 2025. Add them in the Claims tab with "Counterclaim" IA type.</div>
                </div>
              )}

              {/* ── DOCUMENTS + UPLOAD + ENGINE ── */}
              {rightTab==="documents"&&<DocumentsTab terms={terms} updT={updT} selId={selId} ess={ess}/>}

              {/* ── PROCEDURE ── */}
              {rightTab==="procedure"&&(
                <div>
                  <div style={{ marginBottom:16 }}>
                    {secH("Procedure Type — CA2 Circumaction (SIAC 2025)",C.blue)}
                    {Object.entries(SIAC_PROCEDURES).map(([k,p])=>(
                      <div key={k} onClick={()=>updT("procedure",k)}
                        style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", marginBottom:8, border:`1.5px solid ${terms.procedure===k?p.color:C.border}`, borderRadius:8, cursor:"pointer", background:terms.procedure===k?`${p.color}08`:C.bgAlt, transition:"all 0.15s" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:p.color, marginTop:4, flexShrink:0 }}/>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:p.color }}>{p.label} {terms.procedure===k?"✓":""}</div>
                          <div style={{ fontSize:10, color:C.textMuted }}>{p.rule}</div>
                          {p.awardMonths&&<div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginTop:2 }}>Award deadline: {p.awardMonths} months from constitution</div>}
                          {p.awardDays&&<div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginTop:2 }}>Award deadline: {p.awardDays} days from appointment</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom:16 }}>
                    {secH("Cost Estimate",C.purple)}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      {[["Claim Quantum",`USD ${total>0?total.toLocaleString():"TBD"}`,C.gold],["SIAC Admin Fee",siacFeeAmt?`SGD ${siacFeeAmt.toLocaleString()}`:"TBD",C.purple],["Arb. Fees (est.)",total>0?`SGD ${Math.round(total*0.003+50000).toLocaleString()}`:"TBD",C.blue],["Total (est.)",siacFeeAmt&&total>0?`SGD ${Math.round(siacFeeAmt+total*0.003+50000).toLocaleString()}`:"TBD",C.red]].map(([l,v,col],i)=>(
                        <div key={i} style={{ padding:"10px 12px", background:C.bgAlt, borderRadius:8 }}>
                          <div style={{ fontSize:9, color:C.textMuted, marginBottom:3 }}>{l}</div>
                          <div style={{ fontSize:15, fontWeight:700, color:col }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop:8, fontSize:9, color:C.textMuted, fontFamily:font.mono }}>Based on SIAC 2025 Schedule of Fees. Legal costs separate (typically 2-3× arbitration costs).</div>
                  </div>
                  <div>
                    {secH("Emergency Arbitrator Checklist — Schedule 1 SIAC 2025",C.red)}
                    {["Urgent relief required before tribunal constitution","Application + SGD 30,000 deposit filed with Registrar","EA appointed — challenge window: 24 hours only","EA establishes procedural schedule within 24h of appointment","PPO (Protective Preliminary Order) available ex parte within 24h","EA order/award within 14 days of appointment","If pre-commencement: NoA must follow within 7 days"].map((item,i)=>(
                      <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:11, color:C.textBody }}>
                        <input type="checkbox" style={{ marginTop:2, flexShrink:0, cursor:"pointer" }}/>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── NOTES & REVIEW ── */}
              {rightTab==="notes"&&(
                <div>
                  {secH("Internal Case Notes & Review",C.navy,"For lawyer use only — not legal advice to client")}
                  <div style={{ marginBottom:14 }}>
                    {lbl("Case Strategy Notes")}
                    <textarea value={terms.strategyNotes||""} rows={5} onChange={e=>updT("strategyNotes",e.target.value)} placeholder="Overall case strategy, key risks, preferred outcomes, settlement parameters..." style={{ ...inp(false), resize:"vertical" }}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    {lbl("Jurisdictional Risk Assessment")}
                    <textarea value={terms.jurisdictionNotes||""} rows={3} onChange={e=>updT("jurisdictionNotes",e.target.value)} placeholder="Any concerns about the validity of the arbitration clause, seat selection, or enforcement jurisdiction..." style={{ ...inp(false), resize:"vertical" }}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    {lbl("Quantum Assessment")}
                    <textarea value={terms.quantumNotes||""} rows={3} onChange={e=>updT("quantumNotes",e.target.value)} placeholder="Basis for quantum calculation, expert evidence needed, loss of chance probability..." style={{ ...inp(false), resize:"vertical" }}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    {lbl("Enforcement Strategy (NYC)")}
                    <textarea value={terms.enforcementNotes||""} rows={3} onChange={e=>updT("enforcementNotes",e.target.value)} placeholder="Respondent's assets, enforcement jurisdiction, NYC registration strategy..." style={{ ...inp(false), resize:"vertical" }}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    {lbl("Settlement Parameters (Confidential)")}
                    <textarea value={terms.settlementNotes||""} rows={3} onChange={e=>updT("settlementNotes",e.target.value)} placeholder="Minimum acceptable settlement, BATNA, mediation strategy (SIAC-SIMC AMA Protocol)..." style={{ ...inp(false), resize:"vertical" }}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    {lbl("Next Actions")}
                    <textarea value={terms.nextActions||""} rows={3} onChange={e=>updT("nextActions",e.target.value)} placeholder="Immediate steps: file Response by [date], serve documents by [date], instruct expert by [date]..." style={{ ...inp(false), resize:"vertical" }}/>
                  </div>
                  <div style={{ padding:"10px 12px", background:C.redBg, border:`1px solid ${C.red}25`, borderRadius:7, fontSize:10, color:C.red }}>
                    These notes are internal working documents. They do not constitute legal advice and must not be shared with clients as analysis.
                  </div>
                </div>
              )}

              {/* ── ANALYSIS ── */}
              {rightTab==="analysis"&&(
                <div>
                  <div style={{ padding:"12px 14px", background:C.redBg, border:`1px solid ${C.red}25`, borderRadius:10, marginBottom:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.red, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Disclaimer — Not Legal Advice</div>
                    <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.55 }}>{DISCLAIMER_EN}</div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    {secH("PHENOMENON Structural Assessment",C.navy)}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {[["Strong claims",claims.filter(c=>c.strength==="strong"&&(c.ia==="ad-actio"||c.ia==="co-implication")).length,C.green],["Moderate",claims.filter(c=>c.strength==="moderate"&&(c.ia==="ad-actio"||c.ia==="co-implication")).length,C.orange],["Weak / Fatal",claims.filter(c=>(c.strength==="weak"||c.strength==="fatal")&&(c.ia==="ad-actio"||c.ia==="co-implication")).length,C.red],["Defensive",claims.filter(c=>c.ia==="non"||c.ia==="de-actio").length,C.textMuted]].map(([l,v,col],i)=>(
                        <div key={i} style={{ padding:"10px 12px", background:C.bgAlt, borderRadius:8, border:`1px solid ${C.border}` }}>
                          <div style={{ fontSize:9, color:C.textMuted, marginBottom:3 }}>{l}</div>
                          <div style={{ fontSize:22, fontWeight:700, color:col }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={runAnalysis} disabled={analysing}
                    style={{ width:"100%", padding:13, background:analysing?C.bgAlt:C.navyDeep, color:analysing?C.textMuted:C.white, border:"none", borderRadius:10, cursor:analysing?"not-allowed":"pointer", fontSize:14, fontFamily:font.ui, fontWeight:700, marginBottom:16 }}>
                    {analysing?"⟳ Running PHENOMENON Analysis…":"⊙ Run Structural Second Opinion (PHENOMENON Engine)"}
                  </button>
                  {analysis&&!analysis.error&&(
                    <div>
                      {analysis.fallback&&<div style={{ fontSize:9, color:C.orange, fontFamily:font.mono, marginBottom:10, padding:"6px 10px", background:C.orangeBg, borderRadius:6 }}>⚠ Placeholder — add ANTHROPIC_API_KEY for full Claude AI second opinion</div>}
                      {(analysis.claims||[]).map((cl,i)=>(
                        <div key={i} style={{ display:"flex", gap:10, marginBottom:10, padding:"12px 14px", background:C.bgAlt, borderRadius:8, border:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:11, color:C.gold, fontFamily:font.mono, flexShrink:0, paddingTop:1 }}>{i+1}.</span>
                          <span style={{ fontSize:12, color:C.textBody, lineHeight:1.65 }}>{cl}</span>
                        </div>
                      ))}
                      {analysis.special&&<div style={{ padding:"12px 14px", background:C.goldBg, border:`1px solid ${C.gold}30`, borderRadius:8 }}><div style={{ fontSize:9, color:C.goldDim, fontFamily:font.mono, marginBottom:4 }}>STRUCTURAL NOTE</div><div style={{ fontSize:12, color:C.textMuted, lineHeight:1.55 }}>{analysis.special}</div></div>}
                    </div>
                  )}
                  {analysis?.error&&<div style={{ color:C.red, fontSize:12, padding:10, background:C.redBg, borderRadius:8 }}>Error: {analysis.error}</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
