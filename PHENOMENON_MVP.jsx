import { useState, useEffect, useRef, useCallback } from "react";

const MODEL = "claude-sonnet-4-20250514";

const C = {
  bg: "#050508", panel: "#0c0c16", border: "#1c1c30", borderBright: "#2a2a45",
  gold: "#c9a84c", goldDim: "#7a6030", goldLight: "#e8c96a",
  cyan: "#38bdf8", purple: "#a78bfa", green: "#4ade80", orange: "#fb923c",
  red: "#f87171", pink: "#f472b6",
  text: "#e2e8f0", textMuted: "#64748b", textDim: "#2d3748",
  nda: "#818cf8", sla: "#4ade80", payment: "#34d399", ip: "#f472b6", dpa: "#38bdf8",
};

const TYPE_META = {
  NDA:     { label: "Non-Disclosure Agreement",    short: "NDA", color: C.nda,     icon: "◈", cascade: ["jurisdiction","expiryDate","partyA","partyB"] },
  SLA:     { label: "Service Level Agreement",     short: "SLA", color: C.sla,     icon: "◎", cascade: ["jurisdiction","effectiveDate","expiryDate","partyA","partyB"] },
  PAYMENT: { label: "Payment Terms Agreement",     short: "PAY", color: C.payment, icon: "◇", cascade: ["effectiveDate","expiryDate","partyA","partyB"] },
  IP:      { label: "IP Assignment Agreement",     short: "IP",  color: C.ip,      icon: "◆", cascade: ["jurisdiction","expiryDate","partyA","partyB"] },
  DPA:     { label: "Data Processing Agreement",   short: "DPA", color: C.dpa,     icon: "◉", cascade: ["jurisdiction","effectiveDate","expiryDate","partyA","partyB"] },
};

const MASTER_INIT = {
  id: "master-001", type: "MASTER", name: "Master Service Agreement", status: "ACTIVE",
  ess: { partyA: "Acme Corporation", partyB: "TechVenture Ltd", jurisdiction: "England & Wales", effectiveDate: "2025-01-01", expiryDate: "2027-12-31" },
  ag: { clauses: ["Services scope defined per attached Statement of Work","Either party may terminate with 90 days written notice","Aggregate liability capped at 12 months of fees paid"] },
  ia_instances: ["ad-actio","co-implication"],
  vectors: [{ lation:"binding", sense:"forward", direction:"F1→F2", position:"OPEN", plication:"implied" }],
  opus: { status:"ACTIVE", homologation:"VALID" },
  parentId: null, children: [],
};

const statusCol = s => ({ ACTIVE: C.green, MODIFIED: C.gold, NEEDS_REVIEW: C.orange, DRAFT: C.textMuted })[s] || C.textMuted;
const phaseCol  = p => ({ ESS:C.gold, AG:C.purple, IA:C.cyan, VEC:C.cyan, "F→IF":C.green, F:C.green, IF:C.green, "IF→":C.green, OPUS:C.goldLight, INIT:C.textMuted, CASCADE:C.orange, EVAL:C.orange, CREATE:C.gold, AI:C.purple, ERROR:C.red })[p] || C.textMuted;

const delay = ms => new Promise(r => setTimeout(r, ms));

export default function PhenomenonMVP() {
  const [contracts, setContracts] = useState({ "master-001": MASTER_INIT });
  const [selectedId, setSelectedId] = useState("master-001");
  const [view, setView] = useState("view");
  const [newType, setNewType] = useState("NDA");
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [affectedIds, setAffectedIds] = useState([]);
  const [cascadeField, setCascadeField] = useState("jurisdiction");
  const [cascadeVal, setCascadeVal] = useState("New York, USA");
  const [cascadeRunning, setCascadeRunning] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const logRef = useRef(null);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  const addLog = useCallback((phase, msg, type = "info") => {
    setLog(prev => [...prev, { id: Date.now() + Math.random(), phase, msg, type, t: new Date().toLocaleTimeString("en-GB", { hour12: false }) }]);
  }, []);

  const runTrace = useCallback(async (steps) => {
    for (const [phase, msg, type] of steps) {
      await delay(190);
      addLog(phase, msg, type || "info");
    }
  }, [addLog]);

  const createSubContract = useCallback(async () => {
    setLoading(true); setView("view"); setAiInsight("");
    const m = contracts["master-001"];
    const meta = TYPE_META[newType];
    addLog("CREATE", `Instantiating ${meta.label}…`, "init");

    await runTrace([
      ["INIT", "Phenomenon entity created", "init"],
      ["ESS",  `Ess stable identity loaded from master via IF`, "ess"],
      ["AG",   "Ag operational matrix initialized", "ag"],
      ["AG",   "Disolutes activated: SA → A1 → CA", "ag"],
      ["IA",   `IA operators assigned for ${meta.short}`, "ia"],
      ["IA",   "Compatibility check: PASS", "ia"],
      ["VEC",  "Vector generated: lation→derived, sense→forward", "vector"],
      ["F",    "Phase F1 activated: DRAFT", "phase"],
      ["F→IF", `Inter-phenomenic link established: Master → ${meta.short}`, "phase"],
    ]);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL, max_tokens: 1000,
          system: "You are a legal contract engine. Respond ONLY with valid JSON, no markdown or preamble.",
          messages: [{ role: "user", content:
            `Generate a ${meta.label} as a sub-contract of this Master Service Agreement.
Master: Party A: ${m.ess.partyA}, Party B: ${m.ess.partyB}, Jurisdiction: ${m.ess.jurisdiction}, Effective: ${m.ess.effectiveDate}, Expiry: ${m.ess.expiryDate}.
Return JSON: { "clauses": ["clause1","clause2","clause3","clause4"], "ia_instances": ["type1","type2"], "special_terms": "one sentence" }`
          }]
        })
      });
      const data = await res.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const id = `${newType.toLowerCase()}-${Date.now()}`;
      const newC = {
        id, type: newType, name: meta.label, status: "ACTIVE",
        ess: { ...m.ess },
        ag: { clauses: parsed.clauses || ["Clause generated by PHENOMENON engine"] },
        ia_instances: parsed.ia_instances || [],
        vectors: [{ lation:"derived", sense:"forward", direction:"IF→F", position:"OPEN", plication:"explicit" }],
        opus: { status:"ACTIVE", homologation:"VALID" },
        parentId: "master-001", children: [],
        special_terms: parsed.special_terms || "",
      };
      setContracts(prev => ({ ...prev, [id]: newC, "master-001": { ...prev["master-001"], children: [...prev["master-001"].children, id] } }));
      setSelectedId(id);
      addLog("OPUS", `Opus: ACTIVE | Homologation: VALID ✓`, "opus");
    } catch (e) {
      addLog("ERROR", `Engine error: ${e.message}`, "error");
    }
    setLoading(false);
  }, [contracts, newType, addLog, runTrace]);

  const executeCascade = useCallback(async () => {
    const children = contracts["master-001"].children;
    if (!children.length) return;
    setLoading(true); setCascadeRunning(true); setAiInsight("");
    const field = cascadeField;
    const val = cascadeVal;
    const impacted = children.filter(id => TYPE_META[contracts[id]?.type]?.cascade?.includes(field));
    setAffectedIds(impacted);

    await runTrace([
      ["CASCADE", `Change detected in Ess field: ${field} → "${val}"`, "cascade"],
      ["VEC",     "Vector propagation initiated from master phenomenon", "vector"],
      ["IF",      `Inter-phenomenic connectors activated: ${impacted.length} sub-contract(s)`, "ia"],
      ...impacted.map(id => ["IF→", `Propagating to: ${contracts[id].name}`, "cascade"]),
      ["EVAL",    "Evaluating IA compatibility across all affected phenomena", "cascade"],
    ]);

    setContracts(prev => {
      const u = { ...prev, "master-001": { ...prev["master-001"], ess: { ...prev["master-001"].ess, [field]: val }, status: "MODIFIED" } };
      impacted.forEach(id => { u[id] = { ...u[id], ess: { ...u[id].ess, [field]: val }, status: "NEEDS_REVIEW", opus: { ...u[id].opus, homologation: "PENDING" } }; });
      return u;
    });

    try {
      const types = impacted.map(id => contracts[id].type).join(", ");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL, max_tokens: 600,
          messages: [{ role: "user", content:
            `A Master Service Agreement changed its ${field} to "${val}". Affected sub-contracts: ${types}. Give 3 concise legal action points required. Each bullet starts with "•". Be specific.`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      setAiInsight(text);
      addLog("AI", "Impact analysis complete — see main panel", "ai");
    } catch (e) { addLog("ERROR", e.message, "error"); }

    addLog("OPUS", `Cascade complete. ${impacted.length} phenomena flagged NEEDS_REVIEW`, "opus");
    setLoading(false);
    setTimeout(() => { setCascadeRunning(false); setAffectedIds([]); }, 6000);
  }, [contracts, cascadeField, cascadeVal, addLog, runTrace]);

  const sel = contracts[selectedId];
  const children = contracts["master-001"]?.children || [];

  const s = {
    wrap: { display:"flex", flexDirection:"column", height:"100vh", background:C.bg, color:C.text, fontFamily:"Georgia, 'Times New Roman', serif", overflow:"hidden" },
    hdr:  { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 20px", borderBottom:`1px solid ${C.border}`, background:C.panel, flexShrink:0 },
    body: { display:"flex", flex:1, overflow:"hidden" },
    left: { width:230, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", background:C.panel, flexShrink:0, overflowY:"auto" },
    main: { flex:1, overflowY:"auto", padding:24 },
    right:{ width:260, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", background:C.panel, flexShrink:0 },
    card: { background:C.panel, border:`1px solid ${C.border}`, padding:"14px 16px", marginBottom:12, borderRadius:2 },
    panelTitle: { padding:"10px 14px", fontSize:10, color:C.textMuted, letterSpacing:"0.2em", textTransform:"uppercase", borderBottom:`1px solid ${C.border}`, fontFamily:"'Courier New', monospace" },
    lbl:  { fontSize:10, color:C.textMuted, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:4, display:"block", fontFamily:"'Courier New', monospace" },
    inp:  { background:"#080810", border:`1px solid ${C.border}`, color:C.text, padding:"7px 10px", fontSize:13, fontFamily:"Georgia, serif", width:"100%", boxSizing:"border-box", outline:"none" },
    sel:  { background:"#080810", border:`1px solid ${C.border}`, color:C.text, padding:"7px 10px", fontSize:13, width:"100%", boxSizing:"border-box", outline:"none" },
    btn:  (bg, col) => ({ background:bg, color:col, border:"none", padding:"8px 18px", cursor:"pointer", fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700, fontFamily:"'Courier New', monospace" }),
    btnO: { background:"transparent", color:C.gold, border:`1px solid ${C.goldDim}`, padding:"7px 16px", cursor:"pointer", fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'Courier New', monospace" },
    tag:  (col) => ({ display:"inline-block", padding:"2px 7px", fontSize:10, fontFamily:"'Courier New', monospace", color:col, border:`1px solid ${col}`, marginRight:4, marginBottom:4 }),
    pill: (col) => ({ display:"inline-block", padding:"2px 8px", fontSize:10, background:`${col}22`, color:col, borderRadius:2, fontFamily:"'Courier New', monospace" }),
  };

  return (
    <div style={s.wrap}>
      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        @keyframes cascadePulse { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 0 2px ${C.orange}} }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:${C.border}}
        select option { background:#0c0c16; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={s.hdr}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:34, height:34, border:`2px solid ${C.gold}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:C.gold, fontFamily:"serif" }}>Φ</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, letterSpacing:"0.2em", color:C.gold, textTransform:"uppercase" }}>PHENOMENON</div>
            <div style={{ fontSize:10, color:C.textMuted, letterSpacing:"0.2em", fontFamily:"'Courier New', monospace" }}>CONTRACT INTELLIGENCE ENGINE · MVP</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={s.btnO} onClick={() => { setView("create"); setAiInsight(""); }} disabled={loading}>+ New Sub-Contract</button>
          <button style={s.btn(C.orange,"#000")} onClick={() => { setView("cascade"); setAiInsight(""); }} disabled={loading}>⚡ Cascade Engine</button>
        </div>
        <div style={{ fontFamily:"'Courier New', monospace", fontSize:11, color:C.textMuted }}>
          <span style={{ color:C.green }}>●</span> {Object.keys(contracts).length} phenomena · {children.length} IF links
        </div>
      </div>

      <div style={s.body}>

        {/* ── LEFT PANEL – Contract Network ── */}
        <div style={s.left}>
          <div style={s.panelTitle}>◈ Contract Network</div>

          {/* Master node */}
          {(() => {
            const m = contracts["master-001"];
            const isAff = affectedIds.includes("master-001");
            return (
              <div onClick={() => { setSelectedId("master-001"); setView("view"); }} style={{ padding:"12px 14px", cursor:"pointer", borderLeft:`3px solid ${selectedId==="master-001"?C.gold:"transparent"}`, background:selectedId==="master-001"?`${C.gold}0d`:"transparent", animation:isAff?"cascadePulse 1.2s infinite":"none", transition:"all 0.2s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ color:C.gold, fontSize:18 }}>⬡</span>
                  <div>
                    <div style={{ fontSize:12, color:C.gold, fontWeight:600 }}>Master Agreement</div>
                    <div style={{ fontSize:10, fontFamily:"'Courier New', monospace", color:statusCol(m?.status) }}>● {m?.status}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Sub-contract nodes */}
          {children.map(id => {
            const c = contracts[id]; if (!c) return null;
            const meta = TYPE_META[c.type]; const isAff = affectedIds.includes(id); const isSel = selectedId === id;
            return (
              <div key={id} onClick={() => { setSelectedId(id); setView("view"); }} style={{ padding:"10px 14px 10px 28px", cursor:"pointer", borderLeft:`3px solid ${isSel?meta.color:"transparent"}`, background:isSel?`${meta.color}0d`:"transparent", animation:isAff?"cascadePulse 1s infinite":"none", transition:"all 0.2s" }}>
                <div style={{ fontSize:9, color:C.textMuted, fontFamily:"'Courier New', monospace", marginBottom:2 }}>└──</div>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ color:meta.color, fontSize:14 }}>{meta.icon}</span>
                  <div>
                    <div style={{ fontSize:11, color:meta.color, fontWeight:600 }}>{meta.short}</div>
                    <div style={{ fontSize:10, fontFamily:"'Courier New', monospace", color:isAff?C.orange:statusCol(c.status) }}>
                      {isAff ? "⚡ AFFECTED" : `● ${c.status}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!children.length && (
            <div style={{ padding:"24px 14px", fontSize:11, color:C.textDim, textAlign:"center", fontFamily:"'Courier New', monospace", lineHeight:1.8 }}>
              No sub-contracts<br/>instantiated.<br/><br/>Click <span style={{ color:C.gold }}>+ New Sub-Contract</span><br/>to begin.
            </div>
          )}

          {/* IF legend */}
          <div style={{ marginTop:"auto", padding:"12px 14px", borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:9, color:C.textDim, fontFamily:"'Courier New', monospace", marginBottom:6, letterSpacing:"0.15em" }}>IF CONNECTIONS</div>
            {[["—", C.gold, "Ess vector (stable)"], ["- -", C.orange, "Cascade flow (IF)"]].map(([sym,col,lbl]) => (
              <div key={lbl} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                <span style={{ color:col, fontFamily:"monospace", fontSize:12 }}>{sym}</span>
                <span style={{ fontSize:9, color:C.textMuted, fontFamily:"'Courier New', monospace" }}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER PANEL – Workspace ── */}
        <div style={s.main}>

          {/* VIEW */}
          {view === "view" && sel && (
            <div style={{ animation:"fadeSlide 0.3s ease" }}>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, color:C.textMuted, fontFamily:"'Courier New', monospace", marginBottom:4, letterSpacing:"0.2em" }}>
                  {sel.parentId ? "SUB-CONTRACT" : "MASTER CONTRACT"} · {sel.id}
                </div>
                <h1 style={{ margin:"0 0 10px", fontSize:22, fontWeight:400, color:sel.type==="MASTER"?C.gold:TYPE_META[sel.type]?.color||C.text, letterSpacing:"0.03em" }}>
                  {sel.name}
                </h1>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                  <span style={s.pill(statusCol(sel.status))}>{sel.status}</span>
                  <span style={s.pill(C.cyan)}>OPUS: {sel.opus?.homologation}</span>
                  {sel.ia_instances?.map(ia => <span key={ia} style={s.tag(C.purple)}>{ia}</span>)}
                </div>
              </div>

              {/* Ess */}
              <div style={s.card}>
                <div style={{ fontSize:11, color:C.gold, fontFamily:"'Courier New', monospace", letterSpacing:"0.15em", marginBottom:12 }}>◈ ESS — STABLE IDENTITY</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 20px" }}>
                  {[["Party A", sel.ess?.partyA],["Party B", sel.ess?.partyB],["Jurisdiction", sel.ess?.jurisdiction],["Effective Date", sel.ess?.effectiveDate],["Expiry Date", sel.ess?.expiryDate]].map(([k,v]) => (
                    <div key={k}>
                      <div style={s.lbl}>{k}</div>
                      <div style={{ fontSize:13, color:C.text }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ag */}
              <div style={s.card}>
                <div style={{ fontSize:11, color:C.purple, fontFamily:"'Courier New', monospace", letterSpacing:"0.15em", marginBottom:12 }}>◉ AG — OPERATIONAL CLAUSES</div>
                {sel.ag?.clauses?.map((cl,i) => (
                  <div key={i} style={{ padding:"9px 0", borderBottom:`1px solid ${C.border}`, fontSize:13, lineHeight:1.7, display:"flex", gap:10 }}>
                    <span style={{ color:C.textMuted, fontFamily:"'Courier New', monospace", flexShrink:0, fontSize:10, paddingTop:2 }}>{String(i+1).padStart(2,"0")}.</span>
                    <span style={{ color:C.text }}>{cl}</span>
                  </div>
                ))}
                {sel.special_terms && (
                  <div style={{ marginTop:12, padding:"8px 12px", background:`${C.purple}10`, borderLeft:`2px solid ${C.purple}`, fontSize:12, color:C.purple, fontStyle:"italic", lineHeight:1.6 }}>
                    ↳ {sel.special_terms}
                  </div>
                )}
              </div>

              {/* Vector */}
              <div style={s.card}>
                <div style={{ fontSize:11, color:C.cyan, fontFamily:"'Courier New', monospace", letterSpacing:"0.15em", marginBottom:10 }}>→ VECTOR STATE</div>
                {sel.vectors?.map((v,i) => (
                  <div key={i} style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {Object.entries(v).map(([k,val]) => (
                      <div key={k} style={{ fontFamily:"'Courier New', monospace", fontSize:11, padding:"3px 8px", border:`1px solid ${C.border}` }}>
                        <span style={{ color:C.textMuted }}>{k}: </span>
                        <span style={{ color:C.cyan }}>{val}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* AI Insight after cascade */}
              {aiInsight && selectedId === "master-001" && (
                <div style={{ ...s.card, borderColor:C.purple+"60", animation:"fadeSlide 0.4s ease" }}>
                  <div style={{ fontSize:11, color:C.purple, fontFamily:"'Courier New', monospace", letterSpacing:"0.15em", marginBottom:10 }}>Φ AI IMPACT ANALYSIS — CLAUDE</div>
                  <div style={{ fontSize:13, color:C.text, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{aiInsight}</div>
                </div>
              )}
            </div>
          )}

          {/* CREATE */}
          {view === "create" && (
            <div style={{ maxWidth:480, animation:"fadeSlide 0.3s ease" }}>
              <div style={{ fontSize:10, color:C.textMuted, fontFamily:"'Courier New', monospace", marginBottom:4, letterSpacing:"0.2em" }}>NEW SUB-CONTRACT</div>
              <h2 style={{ margin:"0 0 20px", fontSize:20, fontWeight:400, color:C.gold }}>Instantiate Phenomenon</h2>

              <div style={s.card}>
                <div style={{ marginBottom:16 }}>
                  <label style={s.lbl}>Contract Type</label>
                  <select style={s.sel} value={newType} onChange={e => setNewType(e.target.value)}>
                    {Object.entries(TYPE_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div style={{ padding:"10px 12px", background:`${C.gold}0a`, borderLeft:`2px solid ${C.goldDim}`, marginBottom:16, fontSize:12, lineHeight:1.7 }}>
                  <div style={{ color:C.gold, fontFamily:"'Courier New', monospace", fontSize:9, marginBottom:4, letterSpacing:"0.15em" }}>INHERITS VIA IF VECTOR</div>
                  <div style={{ color:C.textMuted }}>Parties, jurisdiction and dates propagate from the Master Agreement through the inter-phenomenic (IF) connection. Claude will generate legally coherent clauses.</div>
                </div>
                {TYPE_META[newType] && (
                  <div style={{ marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:20, color:TYPE_META[newType].color }}>{TYPE_META[newType].icon}</span>
                    <div>
                      <div style={{ fontSize:13, color:TYPE_META[newType].color }}>{TYPE_META[newType].label}</div>
                      <div style={{ fontSize:11, color:C.textMuted, fontFamily:"'Courier New', monospace" }}>Cascades on: {TYPE_META[newType].cascade.join(", ")}</div>
                    </div>
                  </div>
                )}
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ ...s.btn(C.gold,"#000"), opacity:loading?0.5:1 }} onClick={createSubContract} disabled={loading}>
                    {loading ? "⟳ Instantiating…" : "⬡ Instantiate via PHENOMENON"}
                  </button>
                  <button style={s.btnO} onClick={() => setView("view")}>Cancel</button>
                </div>
              </div>

              {loading && (
                <div style={{ ...s.card, borderColor:`${C.gold}40` }}>
                  <div style={{ color:C.gold, fontFamily:"'Courier New', monospace", fontSize:10, marginBottom:6, letterSpacing:"0.15em" }}>⟳ ENGINE RUNNING</div>
                  <div style={{ color:C.textMuted, fontSize:12, lineHeight:1.7 }}>PHENOMENON engine is instantiating the phenomenon and calling Claude API to generate legally coherent clauses. Watch the engine trace →</div>
                </div>
              )}
            </div>
          )}

          {/* CASCADE */}
          {view === "cascade" && (
            <div style={{ maxWidth:520, animation:"fadeSlide 0.3s ease" }}>
              <div style={{ fontSize:10, color:C.orange, fontFamily:"'Courier New', monospace", marginBottom:4, letterSpacing:"0.2em" }}>⚡ CASCADE ENGINE</div>
              <h2 style={{ margin:"0 0 8px", fontSize:20, fontWeight:400, color:C.text }}>Modify Master · Propagate via IF</h2>
              <p style={{ color:C.textMuted, fontSize:13, marginBottom:20, lineHeight:1.7 }}>
                Any change to the Master Agreement's Ess fields propagates through all inter-phenomenic (IF) connections. Affected sub-contracts are re-evaluated and flagged.
              </p>

              <div style={s.card}>
                <div style={{ marginBottom:14 }}>
                  <label style={s.lbl}>Ess Field to Modify</label>
                  <select style={s.sel} value={cascadeField} onChange={e => setCascadeField(e.target.value)}>
                    <option value="jurisdiction">Governing Jurisdiction</option>
                    <option value="effectiveDate">Effective Date</option>
                    <option value="expiryDate">Expiry Date</option>
                    <option value="partyA">Party A Name</option>
                    <option value="partyB">Party B Name</option>
                  </select>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={s.lbl}>New Value</label>
                  <input style={s.inp} value={cascadeVal} onChange={e => setCascadeVal(e.target.value)} placeholder="Enter new value…" />
                </div>

                {/* Impact preview */}
                {children.length > 0 && (
                  <div style={{ padding:"10px 12px", background:`${C.orange}0d`, borderLeft:`2px solid ${C.orange}60`, marginBottom:14 }}>
                    <div style={{ color:C.orange, fontFamily:"'Courier New', monospace", fontSize:9, marginBottom:6, letterSpacing:"0.15em" }}>IMPACT PREVIEW</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {children.map(id => {
                        const c = contracts[id]; const meta = TYPE_META[c?.type];
                        const will = meta?.cascade?.includes(cascadeField);
                        return (
                          <span key={id} style={{ ...s.tag(will ? C.orange : C.textMuted), opacity:will?1:0.4 }}>
                            {meta?.short} {will ? "⚡" : "✓"}
                          </span>
                        );
                      })}
                    </div>
                    <div style={{ fontSize:11, color:C.textMuted, marginTop:6, fontFamily:"'Courier New', monospace" }}>
                      {children.filter(id => TYPE_META[contracts[id]?.type]?.cascade?.includes(cascadeField)).length} of {children.length} sub-contract(s) affected
                    </div>
                  </div>
                )}

                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ ...s.btn(C.orange,"#000"), opacity:(loading||!children.length)?0.5:1 }} onClick={executeCascade} disabled={loading || !children.length}>
                    {loading ? "⟳ Propagating…" : "⚡ Execute Cascade"}
                  </button>
                  <button style={s.btnO} onClick={() => setView("view")}>Cancel</button>
                </div>
                {!children.length && <div style={{ marginTop:8, fontSize:11, color:C.textMuted, fontFamily:"'Courier New', monospace" }}>Add sub-contracts first to see cascade in action.</div>}
              </div>

              {aiInsight && (
                <div style={{ ...s.card, borderColor:`${C.orange}50`, animation:"fadeSlide 0.4s ease" }}>
                  <div style={{ fontSize:11, color:C.orange, fontFamily:"'Courier New', monospace", letterSpacing:"0.15em", marginBottom:10 }}>Φ CASCADE IMPACT — CLAUDE ANALYSIS</div>
                  <div style={{ fontSize:13, color:C.text, lineHeight:1.9, whiteSpace:"pre-wrap" }}>{aiInsight}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL – Engine Trace ── */}
        <div style={s.right}>
          <div style={{ ...s.panelTitle, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span>Φ Engine Trace</span>
            <button onClick={() => setLog([])} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:10, fontFamily:"'Courier New', monospace" }}>CLR</button>
          </div>

          <div ref={logRef} style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
            {!log.length && (
              <div style={{ padding:"20px 14px", color:C.textDim, fontSize:11, fontFamily:"'Courier New', monospace", lineHeight:1.8 }}>
                Awaiting phenomenon<br/>instantiation…
              </div>
            )}
            {log.map(e => (
              <div key={e.id} style={{ padding:"5px 14px 5px 16px", borderLeft:`2px solid ${phaseCol(e.phase)}`, marginLeft:6, marginBottom:3, animation:"fadeSlide 0.2s ease" }}>
                <div style={{ fontSize:9, color:phaseCol(e.phase), fontFamily:"'Courier New', monospace", marginBottom:2, letterSpacing:"0.1em" }}>
                  {e.t} · {e.phase}
                </div>
                <div style={{ fontSize:11, color:e.type==="error"?C.red:e.type==="ai"?C.purple:C.text, fontFamily:"'Courier New', monospace", lineHeight:1.5 }}>
                  {e.msg}
                </div>
              </div>
            ))}
          </div>

          {/* Status footer */}
          <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`, fontFamily:"'Courier New', monospace", fontSize:10 }}>
            {[["STATUS",   loading ? "⟳ RUNNING" : "● READY",     loading ? C.orange : C.green],
              ["PHENOMENA", Object.keys(contracts).length,           C.cyan],
              ["IF LINKS",  children.length,                         C.cyan],
              ["LOG STEPS", log.length,                              C.textMuted],
            ].map(([k,v,col]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ color:C.textMuted }}>{k}</span>
                <span style={{ color:col }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
