/**
 * EcosystemPanel — advanced contract network dashboard.
 *
 * Shows the full ecosystem state: health score, contract statuses,
 * IF consistency issues, coverage gaps, party management, and
 * one-click ecosystem homologation with live progress.
 *
 * Bloque VI Estabilización · Bloque VIII Fractal · Bloque II IF
 */
import { useState, useEffect, useCallback } from "react";
import { C, font, SUB_META } from "../constants.js";
import * as api from "../api/phenomenon.js";

// ─── Available contract types for mid-lifecycle addition ──────────────────────
const ADDABLE_TYPES = [
  { type:"NDA",     label:"Acuerdo de Confidencialidad",    icon:"◈", color:C.colorNDA,     ia:["non","de-actio"] },
  { type:"SLA",     label:"Acuerdo de Nivel de Servicio",   icon:"◎", color:C.colorSLA,     ia:["ad-actio"] },
  { type:"PAYMENT", label:"Condiciones de Pago",            icon:"◇", color:C.colorPAYMENT, ia:["ad-actio"] },
  { type:"IP",      label:"Cesión Propiedad Intelectual",   icon:"◆", color:"#DB2777",      ia:["ad-actio"] },
  { type:"DPA",     label:"Acuerdo Tratamiento de Datos",   icon:"◉", color:C.colorDPA,     ia:["ad-actio","co-implication"] },
];

// ─── Health score ring ────────────────────────────────────────────────────────
function HealthRing({ score }) {
  const r     = 44;
  const circ  = 2 * Math.PI * r;
  const fill  = circ * (score / 100);
  const color = score >= 80 ? C.green : score >= 55 ? C.orange : C.red;
  return (
    <div style={{ position:"relative", width:110, height:110, flexShrink:0 }}>
      <svg width={110} height={110}>
        <circle cx={55} cy={55} r={r} fill="none" stroke={C.bgAlt} strokeWidth={10} />
        <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
          style={{ transition:"stroke-dasharray 1s ease" }} />
        <text x={55} y={50} textAnchor="middle" fontSize={22} fontWeight={700}
          fill={color} fontFamily="'Inter',sans-serif">{score}</text>
        <text x={55} y={66} textAnchor="middle" fontSize={9} fill={C.textMuted}
          fontFamily="'Inter',sans-serif">/ 100</text>
      </svg>
      <div style={{ position:"absolute", bottom:-2, left:0, right:0, textAlign:"center",
        fontSize:9, fontFamily:font.mono, color, fontWeight:700 }}>
        {score >= 80 ? "ESTABLE" : score >= 55 ? "PARCIAL" : "INVÁLIDO"}
      </div>
    </div>
  );
}

// ─── Contract row in the network tree ────────────────────────────────────────
function ContractRow({ contract, isMaster, onSelect }) {
  const meta  = isMaster ? null : SUB_META[contract.type];
  const color = isMaster ? C.gold : (meta?.color ?? C.textMuted);
  const homo  = contract.homologation;
  const homoColor = homo === "VALID" ? C.green : homo === "INVALID" ? C.red : C.orange;
  const homoIcon  = homo === "VALID" ? "✅" : homo === "INVALID" ? "❌" : "⏳";
  const statusColor = contract.status === "ACTIVE" ? C.green
    : contract.status === "NEEDS_REVIEW" ? C.orange
    : contract.status === "TERMINATED" ? C.textLight : C.textMuted;

  return (
    <div onClick={() => onSelect(contract.id)}
      style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
        background:C.white, border:`1px solid ${color}25`,
        borderLeft:`3px solid ${color}`, borderRadius:7, marginBottom:5,
        cursor:"pointer", transition:"box-shadow 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow=`0 2px 8px ${color}20`}
      onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
      <span style={{ fontSize:15, color }}>{isMaster ? "⬡" : (meta?.icon ?? "○")}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.textDark, overflow:"hidden",
          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {!isMaster && <span style={{ fontSize:9, color:C.textLight, marginRight:5 }}>└─</span>}
          {contract.name}
        </div>
        <div style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono, marginTop:1 }}>
          {contract.type}
        </div>
      </div>
      <span style={{ fontSize:10, color:statusColor, fontFamily:font.mono, flexShrink:0 }}>
        {contract.status === "NEEDS_REVIEW" ? "⚠ REVISIÓN" : contract.status}
      </span>
      <span style={{ fontSize:13, flexShrink:0 }}>{homoIcon}</span>
      <span style={{ fontSize:9, color:homoColor, fontFamily:font.mono, flexShrink:0, minWidth:40 }}>
        {homo}
      </span>
    </div>
  );
}

// ─── Consistency issue row ────────────────────────────────────────────────────
function IssueRow({ issue }) {
  const color = issue.severity === "ERROR" ? C.red : C.orange;
  const icon  = issue.severity === "ERROR" ? "❌" : "⚠️";
  return (
    <div style={{ padding:"8px 12px", background:issue.severity==="ERROR"?C.redBg:C.orangeBg,
      border:`1px solid ${color}25`, borderLeft:`3px solid ${color}`,
      borderRadius:7, marginBottom:5 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
        <span style={{ fontSize:12, flexShrink:0 }}>{icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:C.textDark, lineHeight:1.5 }}>{issue.desc_es}</div>
          {issue.source_value && (
            <div style={{ fontSize:10, color:color, fontFamily:font.mono, marginTop:2 }}>
              {issue.source_type}: {issue.source_value}
              {issue.target_type && ` → ${issue.target_type}: ${issue.target_value}`}
            </div>
          )}
          <div style={{ fontSize:9, color:color, fontFamily:font.mono, marginTop:3,
            background:`${color}10`, padding:"1px 6px", borderRadius:3, display:"inline-block" }}>
            {issue.law}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Coverage item ────────────────────────────────────────────────────────────
function CoverageItem({ item, onAdd }) {
  const meta  = SUB_META[item.contract_type];
  const color = meta?.color ?? C.textMuted;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px",
      background:item.present ? C.white : (item.required ? C.redBg : C.bgAlt),
      border:`1px solid ${item.present ? color : item.required ? C.red : C.border}25`,
      borderRadius:6, marginBottom:4 }}>
      <span style={{ fontSize:14 }}>
        {item.present ? (item.status === "NEEDS_REVIEW" ? "⚠️" : item.status === "TERMINATED" ? "✕" : "✅") : (item.required ? "❌" : "○")}
      </span>
      <span style={{ fontSize:12, color, fontWeight:600, fontFamily:font.mono, minWidth:60 }}>{item.contract_type}</span>
      <span style={{ fontSize:11, color:C.textMuted, flex:1 }}>
        {item.present ? item.contract_name : (item.required ? "Requerido — no presente" : "Opcional — no presente")}
      </span>
      {!item.present && (
        <button onClick={() => onAdd(item.contract_type)}
          style={{ fontSize:10, color:C.blue, background:"none", border:`1px solid ${C.blue}40`,
            borderRadius:4, padding:"2px 8px", cursor:"pointer", fontFamily:font.ui }}>
          + Añadir
        </button>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function EcosystemPanel({ master, subContracts, contracts, loadContracts, onSelectContract, addLog }) {
  const [state,       setState]       = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [homologating,setHomologating]= useState(false);
  const [homoResult,  setHomoResult]  = useState(null);
  const [section,     setSection]     = useState("overview"); // overview | issues | coverage | parties | add
  const [addPartyForm,setAddPartyForm]= useState({ open:false, role:"C", name:"", cif:"", address:"", rep:"" });
  const [partyError,  setPartyError]  = useState(null);
  const [addContractType, setAddContractType] = useState(null);
  const [homoProgress, setHomoProgress] = useState([]);

  const load = useCallback(async () => {
    if (!master?.id) return;
    setLoading(true);
    try {
      const data = await api.getEcosystem(master.id);
      setState(data);
    } catch (_) {}
    setLoading(false);
  }, [master?.id]);

  useEffect(() => { load(); }, [load]);

  const runEcosystemHomologation = useCallback(async () => {
    setHomologating(true);
    setHomoResult(null);
    setHomoProgress([]);
    if (addLog) addLog("OPUS", "Iniciando homologación del ecosistema completo…", "opus");
    try {
      // Show progress: individual contracts being verified
      const all = [...subContracts, master];
      for (const c of all) {
        await new Promise(r => setTimeout(r, 300));
        setHomoProgress(p => [...p, { id: c.id, name: c.name, type: c.type, running: true }]);
      }
      const result = await api.ecosystemHomologate(master.id);
      setHomoResult(result);
      await loadContracts();
      await load();
      if (addLog) addLog("OPUS",
        result.ecosystem_valid
          ? `✓ Ecosistema HOMOLOGADO — score ${result.health_score}/100`
          : `✗ Ecosistema INVÁLIDO — ${result.consistency_issues?.length ?? 0} conflicto(s) IF · score ${result.health_score}/100`,
        result.ecosystem_valid ? "opus" : "error");
    } catch (e) {
      if (addLog) addLog("ERROR", `Error en homologación ecosistema: ${e.message}`, "error");
    }
    setHomologating(false);
  }, [master, subContracts, load, loadContracts, addLog]);

  const handleAddParty = useCallback(async () => {
    if (!addPartyForm.name.trim()) return;
    if (!addPartyForm.role.trim()) { setPartyError("El rol es obligatorio (C, D, E…)"); return; }
    setPartyError(null);
    try {
      const result = await api.addPartyToEcosystem(master.id, {
        role: addPartyForm.role.trim().toUpperCase(),
        name: addPartyForm.name,
        cif: addPartyForm.cif,
        address: addPartyForm.address,
        representative: addPartyForm.rep,
      });
      if (addLog) addLog("ESS", result.note, "cascade");
      // Auto-advance role for next party (C→D→E…)
      const nextRole = String.fromCharCode(addPartyForm.role.trim().toUpperCase().charCodeAt(0) + 1);
      setAddPartyForm({ open:false, role:nextRole, name:"", cif:"", address:"", rep:"" });
      await loadContracts();
      await load();
    } catch (e) {
      const msg = e.message?.includes("already exists")
        ? `El rol "${addPartyForm.role.toUpperCase()}" ya existe. Usa un rol diferente (p. ej. "${String.fromCharCode(addPartyForm.role.trim().toUpperCase().charCodeAt(0)+1)}")`
        : `Error: ${e.message}`;
      setPartyError(msg);
      if (addLog) addLog("ERROR", msg, "error");
    }
  }, [master?.id, addPartyForm, load, loadContracts, addLog]);

  const handleAddContract = useCallback(async (type) => {
    const meta = ADDABLE_TYPES.find(t => t.type === type);
    if (!meta) return;
    try {
      const result = await api.addContractToEcosystem(master.id, {
        contract_type: type, ia_defaults: meta.ia,
      });
      if (addLog) addLog("CREATE", result.note, "init");
      setAddContractType(null);
      await loadContracts();
      await load();
    } catch (e) {
      if (addLog) addLog("ERROR", e.message.includes("already exists") ? `El tipo ${type} ya existe en el ecosistema` : e.message, "error");
    }
  }, [master?.id, load, loadContracts, addLog]);

  if (!master) return null;

  const scoreColor = !state ? C.textMuted
    : state.health_score >= 80 ? C.green
    : state.health_score >= 55 ? C.orange : C.red;

  const tabs = [
    { key:"overview",  label:"Resumen",  icon:"⬡" },
    { key:"issues",    label:"Conflictos IF", icon:"⚠", badge: state?.consistency_issues?.length },
    { key:"coverage",  label:"Cobertura", icon:"◈", badge: state?.coverage?.filter(c=>c.required&&!c.present).length },
    { key:"parties",   label:"Partes",    icon:"◎", badge: state?.parties?.length },
    { key:"add",       label:"Añadir",    icon:"+" },
  ];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", fontFamily:font.ui }}>

      {/* Header with health score */}
      <div style={{ padding:"16px 20px", background:C.navyDeep, flexShrink:0,
        borderBottom:`1px solid ${C.borderDark}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <HealthRing score={state?.health_score ?? 0} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.textWhite, marginBottom:4 }}>
              Ecosistema — {master.name}
            </div>
            <div style={{ fontSize:10, color:C.textNavy, fontFamily:font.mono, marginBottom:8 }}>
              Bloque VI Estabilización · Bloque VIII Fractal · {state?.template_key ?? "…"}
            </div>
            {state && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[
                  [`${state.homologation_summary.valid}/${state.homologation_summary.total}`, "HOMOLOG.", C.green],
                  [`${state.homologation_summary.invalid}`, "INVÁLIDOS", C.red],
                  [`${state.homologation_summary.pending}`, "PENDIENTES", C.orange],
                  [`${state.consistency_issues?.length ?? 0}`, "CONFLICTOS IF", C.cyan],
                ].map(([val, lbl, col]) => (
                  <div key={lbl} style={{ textAlign:"center", padding:"4px 10px",
                    background:"rgba(255,255,255,0.07)", borderRadius:6 }}>
                    <div style={{ fontSize:16, fontWeight:700, color:col, fontFamily:font.mono }}>{val}</div>
                    <div style={{ fontSize:8, color:C.textNavy, letterSpacing:"0.07em" }}>{lbl}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ecosystem homologation button */}
        <button onClick={runEcosystemHomologation} disabled={homologating}
          style={{ marginTop:12, width:"100%", padding:"10px", fontFamily:font.ui, fontWeight:700,
            fontSize:13, border:"none", borderRadius:8, cursor:homologating?"not-allowed":"pointer",
            background:homologating?C.borderDark:scoreColor, color:C.white, transition:"background 0.3s" }}>
          {homologating ? "⟳ Homologando ecosistema…" : "⊙ Homologar Ecosistema Completo"}
        </button>

        {/* Homologation result banner */}
        {homoResult && !homologating && (
          <div style={{ marginTop:8, padding:"8px 12px", borderRadius:7,
            background:homoResult.ecosystem_valid?C.greenBg:C.redBg,
            border:`1px solid ${homoResult.ecosystem_valid?C.green:C.red}30` }}>
            <div style={{ fontSize:12, fontWeight:700, color:homoResult.ecosystem_valid?C.green:C.red }}>
              {homoResult.ecosystem_valid ? "✓ Ecosistema HOMOLOGADO — Bloque VI Estabilización completa" : "✗ Ecosistema INVÁLIDO — Revisar errores"}
            </div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{homoResult.summary}</div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, background:C.white, flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setSection(t.key)}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"8px 14px", border:"none",
              background:"none", cursor:"pointer", fontSize:11, fontFamily:font.ui, fontWeight:500,
              color:section===t.key?C.textDark:C.textMuted,
              borderBottom:section===t.key?`2px solid ${C.gold}`:"2px solid transparent",
              transition:"all 0.15s" }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.badge > 0 && (
              <span style={{ fontSize:9, background:t.key==="issues"?C.red:C.orange, color:C.white,
                borderRadius:8, padding:"0 5px", fontFamily:font.mono, fontWeight:700 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
        {loading && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", padding:"0 12px",
            fontSize:10, color:C.textMuted, fontFamily:font.mono }}>⟳ cargando…</div>
        )}
      </div>

      {/* Tab content */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>

        {/* ── Overview ── */}
        {section === "overview" && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:10 }}>Red Contractual</div>
            {state ? (
              <>
                {state.contracts.filter(c=>!c.parentId).map(m => (
                  <div key={m.id}>
                    <ContractRow contract={m} isMaster={true} onSelect={onSelectContract} />
                    {state.contracts.filter(c=>c.parentId===m.id).map(c => (
                      <div key={c.id} style={{ marginLeft:16 }}>
                        <ContractRow contract={c} isMaster={false} onSelect={onSelectContract} />
                      </div>
                    ))}
                  </div>
                ))}

                {/* IF topology summary */}
                <div style={{ marginTop:16, padding:"12px 14px", background:C.bgAlt,
                  borderRadius:8, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.textMuted,
                    textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
                    Conexiones Jurídicas entre Contratos del Ecosistema
                  </div>
                  {state.contracts.filter(c=>c.parentId).length === 0
                    ? <div style={{ fontSize:11, color:C.textLight }}>Sin subcontratos</div>
                    : (() => {
                        const types = new Set(state.contracts.filter(c=>c.parentId).map(c=>c.type));
                        const IF_EDGES = [
                          {a:"NDA",b:"DPA",label:"Retención datos"},{a:"NDA",b:"IP",label:"Plazo"},
                          {a:"SLA",b:"PAYMENT",label:"Penalización"},{a:"DPA",b:"NDA",label:"Subencargados"},
                          {a:"IP",b:"NDA",label:"Exclusividad"},
                        ];
                        const active = IF_EDGES.filter(e=>types.has(e.a)&&types.has(e.b));
                        if (active.length === 0) return <div style={{fontSize:11,color:C.textLight}}>Sin conexiones IF entre subcontratos</div>;
                        return active.map(e => (
                          <div key={`${e.a}-${e.b}`} style={{ display:"flex", gap:8, marginBottom:4,
                            fontSize:10, fontFamily:font.mono, alignItems:"center" }}>
                            <span style={{ color:SUB_META[e.a]?.color??C.textMuted }}>{e.a}</span>
                            <span style={{ color:C.cyan }}>⇄</span>
                            <span style={{ color:SUB_META[e.b]?.color??C.textMuted }}>{e.b}</span>
                            <span style={{ color:C.textLight, fontSize:9 }}>{e.label}</span>
                          </div>
                        ));
                      })()
                  }
                </div>
              </>
            ) : (
              <div style={{ color:C.textLight, fontSize:12 }}>Cargando ecosistema…</div>
            )}
          </div>
        )}

        {/* ── IF Consistency Issues ── */}
        {section === "issues" && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:10 }}>
              Conflictos IF entre Contratos ({state?.consistency_issues?.length ?? 0})
            </div>
            {(!state?.consistency_issues?.length) ? (
              <div style={{ padding:"20px", textAlign:"center", background:C.greenBg, borderRadius:10,
                border:`1px solid ${C.green}30`, color:C.green, fontSize:12 }}>
                ✅ Sin conflictos IF detectados — vectores coherentes
              </div>
            ) : (
              state.consistency_issues.map((issue, i) => <IssueRow key={i} issue={issue} />)
            )}

            {homoResult?.consistency_issues?.length > 0 && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:10, color:C.textMuted, marginBottom:6,
                  fontFamily:font.mono, textTransform:"uppercase" }}>
                  Del último análisis de homologación:
                </div>
                {homoResult.consistency_issues.map((issue, i) => <IssueRow key={i} issue={issue} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Coverage ── */}
        {section === "coverage" && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:10 }}>
              Cobertura Contractual — {state?.template_key}
            </div>
            {state?.coverage?.length === 0 && (
              <div style={{ color:C.textLight, fontSize:12 }}>Sin requisitos de cobertura para esta plantilla</div>
            )}
            {state?.coverage?.map(item => (
              <CoverageItem key={item.contract_type} item={item} onAdd={t => { setAddContractType(t); setSection("add"); }} />
            ))}

            {homoResult?.coverage_gaps?.length > 0 && (
              <div style={{ marginTop:12, padding:"10px 14px", background:C.redBg,
                border:`1px solid ${C.red}25`, borderRadius:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.red, marginBottom:6 }}>
                  Cobertura requerida faltante:
                </div>
                {homoResult.coverage_gaps.map(t => (
                  <div key={t} style={{ fontSize:11, color:C.textBody, marginBottom:4,
                    display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span>❌ {t} — no presente</span>
                    <button onClick={() => { setAddContractType(t); setSection("add"); }}
                      style={{ fontSize:10, color:C.blue, background:"none",
                        border:`1px solid ${C.blue}40`, borderRadius:4,
                        padding:"2px 8px", cursor:"pointer" }}>+ Añadir</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Party Management ── */}
        {section === "parties" && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:10 }}>
              Partes Contractuales (Novación — Art. 1203 CC)
            </div>

            {state?.parties?.map((party, i) => (
              <div key={i} style={{ padding:"12px 14px", background:C.white,
                border:`1px solid ${C.border}`, borderRadius:8, marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:C.gold,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:14, fontWeight:700, color:"#000" }}>
                    {party.role}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.textDark }}>{party.name}</div>
                    <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono }}>
                      Parte {party.role} · {party.cif || "CIF no registrado"}
                    </div>
                  </div>
                </div>
                {party.address && <div style={{ fontSize:11, color:C.textMuted, marginBottom:2 }}>📍 {party.address}</div>}
                {party.rep && <div style={{ fontSize:11, color:C.textMuted }}>👤 {party.rep}</div>}
              </div>
            ))}

            {/* Add party form */}
            {!addPartyForm.open ? (
              <button onClick={() => {
                // Auto-suggest next available role
                const usedRoles = new Set((state?.parties ?? []).map(p => p.role?.toUpperCase()));
                let nextRole = "C";
                while (usedRoles.has(nextRole) && nextRole <= "Z") {
                  nextRole = String.fromCharCode(nextRole.charCodeAt(0) + 1);
                }
                setPartyError(null);
                setAddPartyForm(f => ({...f, open:true, role:nextRole}));
              }} style={{ width:"100%", padding:"10px", background:"none",
                  border:`2px dashed ${C.gold}60`, borderRadius:8, cursor:"pointer",
                  fontSize:12, color:C.gold, fontFamily:font.ui, fontWeight:600 }}>
                + Añadir Nueva Parte (Novación subjetiva)
              </button>
            ) : (
              <div style={{ padding:"14px", background:C.goldBg, border:`1px solid ${C.gold}40`,
                borderRadius:8 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.goldDim, marginBottom:12 }}>
                  Nueva Parte — Art. 1203 CC Novación Subjetiva
                </div>

                {/* Inline error display */}
                {partyError && (
                  <div style={{ padding:"8px 12px", background:C.redBg, border:`1px solid ${C.red}30`,
                    borderRadius:6, marginBottom:12, fontSize:11, color:C.red, fontFamily:font.ui }}>
                    ⚠ {partyError}
                  </div>
                )}

                {[
                  ["Rol (C, D, E…)",        "role",    addPartyForm.role || "C"],
                  ["Razón Social / Nombre", "name",    "Empresa Tercera S.L."],
                  ["CIF/NIF",              "cif",     "B-12345678"],
                  ["Domicilio Social",     "address", "Calle Mayor 1, 28001 Madrid"],
                  ["Representante Legal",  "rep",     "D. Antonio López"],
                ].map(([label, key, ph]) => (
                  <div key={key} style={{ marginBottom:8 }}>
                    <div style={{ fontSize:9, fontWeight:600, color:C.textMuted,
                      textTransform:"uppercase", marginBottom:3 }}>{label}</div>
                    <input value={addPartyForm[key]}
                      onChange={e => { setPartyError(null); setAddPartyForm(f=>({...f,[key]:e.target.value})); }}
                      placeholder={ph}
                      style={{ width:"100%", padding:"7px 10px", fontSize:12, fontFamily:font.ui,
                        border:`1px solid ${partyError && key==="role" ? C.red : C.border}`,
                        borderRadius:5, background:C.white }} />
                  </div>
                ))}
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <button onClick={handleAddParty} disabled={!addPartyForm.name.trim()}
                    style={{ flex:1, padding:"8px", background:C.gold, color:"#000", border:"none",
                      borderRadius:6, cursor:"pointer", fontSize:12, fontFamily:font.ui, fontWeight:700 }}>
                    ⊙ Registrar Parte y Propagar al Ecosistema
                  </button>
                  <button onClick={() => { setAddPartyForm(f=>({...f,open:false})); setPartyError(null); }}
                    style={{ padding:"8px 12px", background:"none", border:`1px solid ${C.border}`,
                      borderRadius:6, cursor:"pointer", fontSize:11 }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Add Contract ── */}
        {section === "add" && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:10 }}>
              Añadir Contrato al Ecosistema (Mid-Lifecycle)
            </div>
            <div style={{ fontSize:11, color:C.textMuted, marginBottom:14, lineHeight:1.6 }}>
              Selecciona el tipo de contrato a incorporar. Heredará el ESS del contrato marco,
              se establecerán las conexiones IF automáticamente y el ecosistema se marcará
              NEEDS_REVIEW para re-verificación.
            </div>

            {(() => {
              const existing = new Set(subContracts.map(c=>c.type));
              return ADDABLE_TYPES.map(t => {
                const alreadyExists = existing.has(t.type);
                const isSelected    = addContractType === t.type;
                return (
                  <div key={t.type}
                    onClick={() => !alreadyExists && setAddContractType(isSelected ? null : t.type)}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                      background:isSelected ? `${t.color}10` : alreadyExists ? C.bgAlt : C.white,
                      border:`1.5px solid ${isSelected ? t.color : alreadyExists ? C.border : `${t.color}40`}`,
                      borderRadius:8, marginBottom:8,
                      cursor:alreadyExists?"not-allowed":"pointer",
                      opacity:alreadyExists?0.5:1, transition:"all 0.15s" }}>
                    <span style={{ fontSize:20, color:t.color }}>{t.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:C.textDark }}>{t.label}</div>
                      <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono, marginTop:1 }}>
                        {t.type} · IA: {t.ia.join(" + ")}
                      </div>
                    </div>
                    {alreadyExists
                      ? <span style={{ fontSize:10, color:C.green, fontFamily:font.mono }}>✓ PRESENTE</span>
                      : isSelected
                        ? <span style={{ fontSize:10, color:t.color, fontFamily:font.mono }}>SELECCIONADO ▶</span>
                        : null
                    }
                  </div>
                );
              });
            })()}

            {addContractType && (
              <div style={{ marginTop:12, padding:"12px 14px", background:C.blueBg,
                border:`1px solid ${C.blue}30`, borderRadius:8 }}>
                <div style={{ fontSize:12, color:C.blue, marginBottom:8 }}>
                  ¿Añadir <strong>{addContractType}</strong> al ecosistema?
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => handleAddContract(addContractType)}
                    style={{ flex:1, padding:"9px", background:C.blue, color:C.white, border:"none",
                      borderRadius:6, cursor:"pointer", fontSize:12, fontFamily:font.ui, fontWeight:700 }}>
                    ⊙ Confirmar y Añadir al Ecosistema
                  </button>
                  <button onClick={() => setAddContractType(null)}
                    style={{ padding:"9px 12px", background:"none", border:`1px solid ${C.border}`,
                      borderRadius:6, cursor:"pointer", fontSize:11 }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Homo progress overlay */}
        {homologating && homoProgress.length > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.textMuted,
              textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
              Progreso de Verificación
            </div>
            {homoProgress.map((c, i) => (
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10,
                padding:"6px 10px", background:C.bgAlt, borderRadius:6, marginBottom:4 }}>
                <span style={{ fontSize:14 }}>⟳</span>
                <span style={{ fontSize:11, color:C.textBody }}>{c.name}</span>
                <span style={{ fontSize:9, color:C.textMuted, fontFamily:font.mono }}>{c.type}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
