import { useState, useCallback, useRef, useEffect } from "react";
import { C, font, CONTRACT_TEMPLATES, FINAL_RULE, OPUS_LEVELS, getOpusLevel } from "./constants.js";
import { usePhenomenon }        from "./hooks/usePhenomenon.js";
import * as api                 from "./api/phenomenon.js";
import SelectionScreen          from "./components/SelectionScreen.jsx";
import PortfolioDashboard       from "./components/PortfolioDashboard.jsx";
import ContractGraph            from "./components/ContractGraph.jsx";
import CompactIAPanel           from "./components/CompactIAPanel.jsx";
import ContractDetailPanel      from "./components/ContractDetailPanel.jsx";
import IAEngineView             from "./components/IAEngineView.jsx";
import ContractPreviewTab       from "./components/ContractPreviewTab.jsx";
import ProjectManager           from "./components/ProjectManager.jsx";
import VerificationPanel        from "./components/VerificationPanel.jsx";
import RiskPanel, { detectRisks, getRiskLevel, RISK_ICONS } from "./components/RiskEngine.jsx";
import CascadeControlPanel from "./components/CascadeControlPanel.jsx";
import EcosystemPanel      from "./components/EcosystemPanel.jsx";
import KPMGDemoPanel       from "./components/KPMGDemoPanel.jsx";
import ApprovalChainView        from "./components/ApprovalChainView.jsx";
import SegurosComparativeView   from "./components/SegurosComparativeView.jsx";
import ImpactNotification       from "./components/ImpactNotification.jsx";
import ErrorBoundary            from "./components/ErrorBoundary.jsx";
import ErrorTriggerForTests     from "./components/ErrorTriggerForTests.jsx";
import CenterStage              from "./components/CenterStage.jsx";
import { DemoModeProvider, useDemoMode } from "./contexts/DemoModeContext.jsx";
import { INSURANCE_TEMPLATE_KEYS } from "./constants.js";

const RIGHT_TABS = [
  { key: "campos",     label: "Campos",     icon: "◈" },
  { key: "ecosistema", label: "Ecosistema", icon: "🌐" },
  { key: "kpmg-demo",  label: "Demo KPMG",  icon: "⭐" },
  { key: "kpmg-corp",  label: "Gobernanza", icon: "🏛" },
  { key: "seguros",    label: "Seguros",    icon: "🛡️" },
  { key: "riesgo",     label: "Riesgo",     icon: "⚠" },
  { key: "verificar",  label: "Verificar",  icon: "⊙" },
  { key: "red-if",     label: "Red IF",     icon: "⇄" },
  { key: "ia",         label: "Operadores", icon: "⬡" },
  { key: "documento",  label: "Documento",  icon: "◉" },
];

// ── Permanent EngineLog strip (left rail, bottom 120px) ───────────────────────
function EngineLog({ log, loading }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log.length]);

  const lastSix = log.slice(-6);

  return (
    <div
      aria-label="Engine activity log"
      style={{
        height: 120,
        flexShrink: 0,
        background: C.navy,
        borderTop: `1px solid ${C.borderDark}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Log header */}
      <div
        style={{
          height: 22,
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: 6,
          borderBottom: `1px solid ${C.borderDark}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: loading ? C.orange : C.green,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 9,
            color: C.textNavy,
            fontFamily: font.mono,
            letterSpacing: "0.1em",
            flex: 1,
          }}
        >
          MOTOR · ACTIVIDAD
        </span>
        <span style={{ fontSize: 9, color: C.textNavy, fontFamily: font.mono }}>
          {log.length}
        </span>
      </div>

      {/* Log entries — last 6 */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", padding: "2px 0" }}
      >
        {lastSix.length === 0 ? (
          <div
            style={{
              padding: "8px 10px",
              fontSize: 10,
              color: C.textNavy,
              fontFamily: font.mono,
              opacity: 0.5,
            }}
          >
            Sin actividad registrada
          </div>
        ) : (
          lastSix.map((e) => {
            const col =
              e.type === "error"   ? C.red    :
              e.type === "ai"      ? C.purple :
              e.type === "opus"    ? C.green  :
              e.type === "cascade" ? C.orange : C.textWhite;
            return (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  gap: 6,
                  padding: "2px 10px",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    color: C.textNavy,
                    fontFamily: font.mono,
                    flexShrink: 0,
                    paddingTop: 2,
                    minWidth: 42,
                  }}
                >
                  {e.t}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: col,
                    fontFamily: font.ui,
                    lineHeight: 1.4,
                    flex: 1,
                    wordBreak: "break-word",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {e.msg}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Inner app (has access to DemoModeContext) ─────────────────────────────────
function AppInner() {
  const { demoMode, toggleDemo } = useDemoMode();

  // ── Layout state ───────────────────────────────────────────────────────────
  const [selectedId,   setSelectedId]   = useState(null);
  const [rightTab,     setRightTab]     = useState("campos");
  const [templateKey,  setTemplateKey]  = useState(null);
  const [newProject,   setNewProject]   = useState(false);
  // 3-pane widths: left rail (fixed), right stage (fixed), centre is flex:1
  const [leftW,        setLeftW]        = useState(220);
  const [stageW,       setStageW]       = useState(420);
  // Legacy rightW kept for S/M/L/XL snap buttons (hidden in demoMode but still functional)
  const [rightW,       setRightW]       = useState(580);
  const [iaH,          setIaH]          = useState(280);  // L2 panel height
  const [iaHover,      setIaHover]      = useState(false);
  const [leftGripHover,  setLeftGripHover]  = useState(false);
  const [rightGripHover, setRightGripHover] = useState(false);
  const [iaCollapsed,  setIaCollapsed]  = useState(false);
  const [homologating,   setHomologating]   = useState(false);
  const [graphFlashIds,  setGraphFlashIds]  = useState([]);
  const [pendingEditId,  setPendingEditId]  = useState(null);
  const [impactData,     setImpactData]     = useState(null);
  const pendingEditTimer = useRef(null);
  const [verifyOpen,     setVerifyOpen]     = useState(false);
  const [verifyResults,  setVerifyResults]  = useState([]);
  const [verifyTotal,    setVerifyTotal]    = useState(0);
  const [jumpToField,    setJumpToField]    = useState(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    contracts, master, masterId, subContracts, masters,
    activeMasterId, setActiveMasterId,
    log, loading, generating,
    addLog, loadContracts,
    startNewProject, updateContract,
    generateSubContract, runCascade, runSubCascade,
    addIAToContract, removeIAFromContract,
    deleteContract, homologateContract, homologateAll,
    renameProject, resetProject, deleteProject,
  } = usePhenomenon();

  const isKPMGCorporate = master?.ag?.terms?.templateKey === "KPMG_CORPORATE";
  const isSegurosCase   = Object.values(contracts).some(c =>
    c.parentId === null && INSURANCE_TEMPLATE_KEYS.includes(c.ag?.terms?.templateKey)
  );
  const visibleRightTabs = RIGHT_TABS.filter(t => {
    if (t.key === "kpmg-corp") return isKPMGCorporate;
    if (t.key === "seguros")   return isSegurosCase;
    return true;
  });

  useEffect(() => {
    if (!isKPMGCorporate && rightTab === "kpmg-corp") setRightTab("campos");
    if (!isSegurosCase   && rightTab === "seguros")   setRightTab("campos");
  }, [isKPMGCorporate, isSegurosCase, rightTab]);

  // ── Watch for cascade events → trigger impact notification ─────────────────
  const prevNeedsReview = useRef(new Set());
  useEffect(() => {
    const currentNR = new Set(Object.values(contracts).filter(c => c.status === "NEEDS_REVIEW").map(c => c.id));
    const newlyNR   = [...currentNR].filter(id => !prevNeedsReview.current.has(id));
    if (newlyNR.length > 0 && selectedId) {
      const contract = contracts[selectedId];
      if (contract) {
        const subs   = Object.values(contracts).filter(c => c.parentId === selectedId);
        const risks  = detectRisks(contract, subs, Object.values(contracts));
        const affected = newlyNR.map(id => contracts[id]).filter(Boolean);
        if (affected.length > 0 || risks.filter(r => r.level !== "low").length > 0) {
          setImpactData(prev => prev ? prev : {
            contractId: selectedId,
            fieldLabel: "Cascada automática",
            oldValue: "", newValue: "",
            affectedContracts: affected,
            risks: risks.filter(r => r.level !== "low"),
          });
        }
      }
    }
    prevNeedsReview.current = currentNR;
  }, [contracts]);

  // ── Resize helpers ─────────────────────────────────────────────────────────
  // Left rail splitter: dragging moves the left pane width
  function startLeftResize(e) {
    e.preventDefault();
    const sx = e.clientX;
    const sw = leftW;
    const move = (e2) => setLeftW(Math.min(400, Math.max(160, sw + (e2.clientX - sx))));
    const up   = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  // Right stage splitter: dragging moves the right pane width (from right edge)
  function startRightResize(e) {
    e.preventDefault();
    const sx = e.clientX;
    const sw = stageW;
    const move = (e2) => setStageW(Math.min(700, Math.max(160, sw - (e2.clientX - sx))));
    const up   = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function makeVResize(setH, min, max, currentH) {
    return (e) => {
      e.preventDefault();
      const sy = e.clientY;
      const sh = currentH;
      const move = (e2) => setH(Math.min(max, Math.max(min, sh - (e2.clientY - sy))));
      const up   = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    };
  }

  const startIaVResize = useCallback(makeVResize(setIaH, 80, 400, iaH), [iaH]);

  // ── Template resolution ────────────────────────────────────────────────────
  const template = CONTRACT_TEMPLATES[templateKey] ?? null;
  const hasContracts = !!master;

  if (!hasContracts || newProject) {
    return (
      <ErrorBoundary scope="selection-screen">
        <ErrorTriggerForTests scope="selection-screen" />
        <SelectionScreen
          loading={loading}
          onSelect={async (key, tmpl, opts = {}) => {
            setTemplateKey(key);
            setNewProject(false);
            setSelectedId(null);
            if (opts.skipNewProject) return;
            await startNewProject(key, tmpl);
          }}
          onLoadExisting={async () => {
            setNewProject(false);
            setSelectedId(null);
            await loadContracts();
          }}
        />
      </ErrorBoundary>
    );
  }

  const activeTemplate = template ?? (() => {
    // First try matching via ag.terms.templateKey (reliable for seeded demos)
    const tkFromTerms = master?.ag?.terms?.templateKey;
    if (tkFromTerms && CONTRACT_TEMPLATES[tkFromTerms]) {
      if (!templateKey) setTemplateKey(tkFromTerms);
      return CONTRACT_TEMPLATES[tkFromTerms];
    }
    const found = Object.entries(CONTRACT_TEMPLATES).find(([, t]) => t.label === master?.name);
    if (found && !templateKey) setTemplateKey(found[0]);
    return found?.[1] ?? CONTRACT_TEMPLATES.CSM;
  })();

  const tabBtn = (key) => ({
    padding: "0 12px", height: "100%", display: "flex", alignItems: "center", gap: 5,
    cursor: "pointer", fontSize: 12, fontFamily: font.ui, fontWeight: 500,
    color: rightTab === key ? C.textDark : C.textMuted,
    background: rightTab === key ? C.bg : "none",
    border: "none", borderBottom: rightTab === key ? `2px solid ${C.gold}` : "2px solid transparent",
    transition: "all 0.15s",
  });

  const gripH = (hover) => ({
    height: 10, cursor: "row-resize", flexShrink: 0,
    background: hover ? `${C.blue}20` : C.bgAlt,
    borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
    transition: "background 0.15s",
  });

  const gripV = (hover) => ({
    width: 8, cursor: "col-resize", flexShrink: 0,
    background: hover ? `${C.blue}20` : C.bgAlt,
    borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
    transition: "background 0.15s", userSelect: "none",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.bg, overflow: "hidden" }}>
      <style>{`* { box-sizing: border-box; } ::selection { background: ${C.gold}33; }`}</style>

      {/* ── Impact Notification (slide-in, bottom-right) ── */}
      <ImpactNotification
        impact={impactData}
        contracts={contracts}
        onNavigate={(tab, field, cid) => {
          if (cid) setSelectedId(cid);
          setRightTab(tab ?? "campos");
          if (field) setTimeout(() => setJumpToField(field + "_" + Date.now()), 150);
          setImpactData(null);
        }}
        onHomologate={async () => {
          const ordered = [...subContracts.filter(Boolean), master].filter(Boolean);
          setVerifyTotal(ordered.length);
          setVerifyResults([]);
          setVerifyOpen(true);
          setHomologating(true);
          const accumulated = [];
          for (const c of ordered) {
            await new Promise(r => setTimeout(r, 380));
            try {
              const result = await api.homologate(c.id);
              accumulated.push({ ...result, name: c.name, type: c.type });
              setVerifyResults([...accumulated]);
            } catch (_) {}
          }
          await loadContracts();
          setHomologating(false);
          setImpactData(null);
        }}
        onClose={() => setImpactData(null)}
      />

      {/* ── Verification Panel (modal) ── */}
      {verifyOpen && (
        <div data-testid="verify-panel" style={{ position:"fixed", inset:0, zIndex:1000 }}>
        <VerificationPanel
          results={verifyResults}
          isRunning={homologating}
          totalContracts={verifyTotal}
          onClose={() => { setVerifyOpen(false); setVerifyResults([]); }}
          onNavigate={(contractId, fieldKey, isEcosystem) => {
            setVerifyOpen(false);
            if (isEcosystem) {
              const failingSub = verifyResults.find(r => !r.valid && r.id !== contractId);
              const navId = failingSub?.id ?? contractId;
              setSelectedId(navId);
            } else {
              setSelectedId(contractId);
            }
            setRightTab("campos");
            setTimeout(() => setJumpToField(fieldKey + "_" + Date.now()), 200);
          }}
        />
        </div>
      )}

      {/* ── HEADER ── */}
      <div
        data-testid="phenomenon-header"
        style={{
          height: 54,
          background: "linear-gradient(to right, #FDF8EF, #F5F7FF)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 10,
          flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
          boxShadow: "0 1px 5px rgba(0,0,0,0.07)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, paddingRight: 14, borderRight: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, background: C.navyDeep, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: C.gold, borderRadius: 6 }}>Φ</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", color: C.textDark, fontFamily: font.ui }}>PHENOMENON</div>
            <div style={{ fontSize: 7.5, color: C.textMuted, letterSpacing: "0.08em", fontFamily: font.mono, lineHeight: 1.35 }} title={FINAL_RULE}>
              Contract Intelligence · Derecho Español
            </div>
          </div>
        </div>

        {/* Project manager */}
        <ProjectManager
          masters={masters}
          activeMaster={master}
          onSwitch={(id) => { setActiveMasterId(id); setSelectedId(null); }}
          onNew={() => setNewProject(true)}
          onRename={renameProject}
          onReset={resetProject}
          onDelete={deleteProject}
        />

        {/* Dashboard stats + project info */}
        {master && (() => {
          const all = [master, ...subContracts];
          const activeCount = all.filter(c => c?.status === "ACTIVE").length;
          const reviewCount = all.filter(c => c?.status === "NEEDS_REVIEW").length;
          const homoCount   = all.filter(c => c?.opus?.homologation === "VALID").length;
          const templateK   = master.ag?.terms?.templateKey ?? "";
          const jur         = master.ess?.jurisdiction;
          const requiredFields = activeTemplate?.requiredEss ?? [];
          const filled      = requiredFields.filter(f => master.ess?.[f.key]?.trim()).length;
          const pct         = requiredFields.length ? Math.round(filled / requiredFields.length * 100) : 100;
          return (
            <div style={{ display: "flex", alignItems: "stretch", borderLeft: `1px solid ${C.border}`, marginLeft: 4 }}>
              {[
                [1 + subContracts.length, "CONTRATOS", C.textDark],
                [activeCount, "ACTIVOS", C.green],
                ...(reviewCount > 0 ? [[reviewCount, "REVISIÓN", C.orange]] : []),
                [homoCount, "HOMOLOG.", C.blue],
              ].map(([val, lbl, col]) => (
                <div key={lbl} style={{ padding: "3px 12px", borderRight: `1px solid ${C.border}`, textAlign: "center", minWidth: 52 }}>
                  <div style={{ fontSize: 19, fontWeight: 700, color: col, lineHeight: 1.2, fontFamily: font.ui }}>{val}</div>
                  <div style={{ fontSize: 7.5, color: C.textMuted, letterSpacing: "0.07em", fontFamily: font.mono }}>{lbl}</div>
                </div>
              ))}
              <div style={{ padding: "4px 12px", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
                {templateK && <span style={{ fontSize: 9, color: C.gold, fontFamily: font.mono, fontWeight: 700, background: C.goldBg, borderRadius: 3, padding: "1px 5px" }}>{templateK}</span>}
                {jur && <span style={{ fontSize: 9, color: C.textMuted, fontFamily: font.ui }}>📍 {jur}</span>}
              </div>
              <div style={{ padding: "4px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                <svg width={28} height={28}>
                  <circle cx={14} cy={14} r={11} fill="none" stroke={C.border} strokeWidth={3} />
                  <circle cx={14} cy={14} r={11} fill="none"
                    stroke={pct === 100 ? C.green : pct > 50 ? C.gold : C.orange}
                    strokeWidth={3}
                    strokeDasharray={2 * Math.PI * 11}
                    strokeDashoffset={2 * Math.PI * 11 * (1 - pct / 100)}
                    transform="rotate(-90 14 14)"
                    style={{ transition: "stroke-dashoffset 0.5s" }}
                  />
                  <text x={14} y={17} textAnchor="middle" fontSize={7} fill={C.textMuted} fontFamily="sans-serif">{pct}%</text>
                </svg>
                <span style={{ fontSize: 7, color: C.textLight, fontFamily: font.mono }}>CAMPOS</span>
              </div>
            </div>
          );
        })()}

        <div style={{ flex: 1 }} />

        {/* Demo mode toggle + badge */}
        <button
          onClick={toggleDemo}
          aria-pressed={demoMode}
          title={demoMode ? "Desactivar modo demo" : "Activar modo demo"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 11px",
            borderRadius: 6,
            border: `1px solid ${demoMode ? C.gold : C.border}`,
            background: demoMode ? C.goldBg : "transparent",
            cursor: "pointer",
            fontFamily: font.mono,
            fontSize: 10,
            fontWeight: 700,
            color: demoMode ? C.goldDim : C.textMuted,
            letterSpacing: "0.07em",
            transition: "all 0.15s",
          }}
        >
          {demoMode && (
            <span style={{
              background: C.gold,
              color: C.navyDeep,
              borderRadius: 4,
              padding: "1px 6px",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.1em",
            }}>
              DEMO
            </span>
          )}
          {demoMode ? "DEMO ON" : "DEMO"}
        </button>

        {/* Verify button */}
        <button
          disabled={!master}
          onClick={async () => {
            const all = Object.values(contracts).filter(Boolean);
            const allSubs    = all.filter(c =>  c.parentId);
            const allMasters = all.filter(c => !c.parentId);
            const ordered = [...allSubs, ...allMasters];
            setVerifyTotal(ordered.length);
            setVerifyResults([]);
            setVerifyOpen(true);
            setHomologating(true);

            const accumulated = [];
            for (const c of ordered) {
              await new Promise(r => setTimeout(r, 380));
              try {
                const result = await api.homologate(c.id);
                accumulated.push({ ...result, name: c.name, type: c.type });
                setVerifyResults([...accumulated]);
              } catch (_) {}
            }
            await loadContracts();
            setHomologating(false);
          }}
          style={{ background: C.purpleBg, color: C.purple, border: `1px solid ${C.purple}40`, padding: "6px 13px", cursor: "pointer", fontSize: 12, fontFamily: font.ui, fontWeight: 600, borderRadius: 6 }}>
          ⊙ Verificar todos
        </button>
      </div>

      {/* ── BODY: 3-pane workspace ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT RAIL (~220px): graph + compact IA + permanent EngineLog ── */}
        <div
          style={{
            width: leftW,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
            minWidth: 160,
          }}
        >
          {/* Contract graph */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <ErrorBoundary scope="graph">
              <ContractGraph
                master={master}
                subContracts={subContracts}
                selectedId={selectedId}
                onSelect={(id) => { setSelectedId(id); if (id) setRightTab("campos"); }}
                cascadeRunning={loading}
                contractsMap={contracts}
                onContractChange={loadContracts}
                onTerminate={async (id) => { await loadContracts(); setSelectedId(null); }}
                onGenerateSub={(type, ess, ia) => generateSubContract(type, ess, ia)}
                externalFlashIds={graphFlashIds}
                pendingEditId={pendingEditId}
              />
            </ErrorBoundary>
          </div>

          {/* IA panel resize handle */}
          <div
            onMouseDown={startIaVResize}
            onMouseEnter={() => setIaHover(true)}
            onMouseLeave={() => setIaHover(false)}
            onDoubleClick={() => setIaCollapsed(p => !p)}
            title="Arrastra · Doble clic para colapsar"
            style={{ ...gripH(iaHover), cursor: "row-resize" }}
          >
            {iaCollapsed
              ? <span style={{ fontSize: 10, color: iaHover ? C.blue : C.textMuted, fontFamily: font.mono }}>⬡ Motor IA ▲</span>
              : [0,1,2,3].map(i => <div key={i} style={{ width: 18, height: 2, background: iaHover ? C.blue : C.borderStrong, borderRadius: 1 }} />)
            }
          </div>

          {/* Compact IA panel */}
          {!iaCollapsed && (
            <div style={{ height: iaH, flexShrink: 0, overflow: "hidden" }}>
              <ErrorBoundary scope="compact-ia">
                <CompactIAPanel
                  master={master}
                  subContracts={subContracts}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* Permanent EngineLog strip */}
          <ErrorBoundary scope="engine-log">
            <EngineLog log={log} loading={loading} />
          </ErrorBoundary>
        </div>

        {/* ── Drag splitter: left | centre ── */}
        <div
          role="separator"
          aria-label="Resize left rail"
          onMouseDown={startLeftResize}
          onMouseEnter={() => setLeftGripHover(true)}
          onMouseLeave={() => setLeftGripHover(false)}
          onDoubleClick={() => setLeftW(w => w > 240 ? 220 : 280)}
          title="Arrastra · Doble clic para ajustar"
          style={{ ...gripV(leftGripHover) }}
        >
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: leftGripHover ? C.blue : C.borderStrong }} />
          ))}
        </div>

        {/* ── CENTRE PANE: ContractDetailPanel (all existing tabs) ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: C.white,
            overflow: "hidden",
            minWidth: 160,
          }}
        >
          {/* Tab bar */}
          <div
            data-testid="right-panel-tabs"
            style={{
              height: 38,
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "stretch",
              flexShrink: 0,
              background: C.white,
              position: "relative",
            }}
          >
            <div style={{ position:"absolute", top:2, left:4, fontSize:8, fontFamily:"'JetBrains Mono','Courier New',monospace", letterSpacing:"0.08em", color:"#94A3B8", background:"rgba(14,20,38,0.06)", padding:"1px 5px", borderRadius:3, pointerEvents:"none", zIndex:1 }}>R-tabs</div>
            {visibleRightTabs.map(t => {
              let badge = null;
              try {
                if (t.key === "riesgo" && selectedId && contracts[selectedId]) {
                  const subs = Object.values(contracts).filter(x=>x.parentId===selectedId);
                  const risks = detectRisks(contracts[selectedId], subs, Object.values(contracts));
                  const highCount = risks.filter(x=>x.level==="high").length;
                  if (highCount > 0) badge = <span style={{ marginLeft:3, fontSize:9, color:C.white, background:C.red, borderRadius:8, padding:"0px 5px", fontFamily:font.mono, fontWeight:700 }}>{highCount}</span>;
                }
                if (t.key === "verificar") {
                  const needsVerify = Object.values(contracts).filter(c=>c.opus?.homologation==="INVALID"||c.opus?.homologation==="PENDING").length;
                  if (needsVerify > 0) badge = <span style={{ marginLeft:3, fontSize:9, color:C.white, background:C.orange, borderRadius:8, padding:"0px 5px", fontFamily:font.mono, fontWeight:700 }}>{needsVerify}</span>;
                }
              } catch(_) {}
              return (
                <button key={t.key} onClick={() => setRightTab(t.key)} style={{ ...tabBtn(t.key), display:"flex", alignItems:"center" }}>
                  <span>{t.icon}</span><span style={{ marginLeft:3 }}>{t.label}</span>{badge}
                </button>
              );
            })}
            {/* S/M/L/XL snap buttons — hidden in demoMode */}
            {!demoMode && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3, paddingRight: 10 }}>
                {[["S", 380], ["M", 580], ["L", 800], ["XL", 1100]].map(([lbl, w]) => (
                  <button key={lbl} onClick={() => setRightW(w)}
                    style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: `1px solid ${Math.abs(rightW - w) < 80 ? C.gold : C.border}`, background: Math.abs(rightW - w) < 80 ? C.goldBg : "none", color: Math.abs(rightW - w) < 80 ? C.goldDim : C.textMuted, cursor: "pointer", fontFamily: font.mono }}>
                    {lbl}
                  </button>
                ))}
                <span style={{ fontSize: 9, color: C.textLight, fontFamily: font.mono, marginLeft: 3 }}>{rightW}px</span>
              </div>
            )}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {rightTab === "campos" && (
              <ErrorBoundary scope="campos">{
              selectedId ? (
                <ContractDetailPanel
                  contractId={selectedId}
                  contracts={contracts}
                  master={master}
                  template={activeTemplate}
                  generating={generating}
                  onUpdateContract={updateContract}
                  onGenerateSub={(type, ess, ia) => generateSubContract(type, ess, ia)}
                  onDelete={async (id) => { await deleteContract(id); setSelectedId(null); }}
                  onHomologate={homologateContract}
                  onClose={() => setSelectedId(null)}
                  jumpToField={jumpToField ? jumpToField.split("_")[0] : null}
                  onJumpHandled={() => setJumpToField(null)}
                  allContracts={contracts}
                  onSubCascade={runSubCascade}
                  onFieldEditing={(cid, field) => {
                    setPendingEditId(cid);
                    clearTimeout(pendingEditTimer.current);
                    pendingEditTimer.current = setTimeout(() => setPendingEditId(null), 3000);
                  }}
                  onImpactDetected={({ contractId: cid, field, oldValue, newValue }) => {
                    const contract = contracts[cid];
                    if (!contract) return;
                    const subs = Object.values(contracts).filter(c => c.parentId === cid);
                    const allC = Object.values(contracts);
                    const risks = detectRisks(contract, subs, allC);
                    const affected = allC.filter(c =>
                      c.id !== cid && c.status === "NEEDS_REVIEW" &&
                      (c.parentId === cid || c.parentId === contract.parentId || c.id === contract.parentId)
                    );
                    setImpactData({ contractId: cid, fieldLabel: field, oldValue: String(oldValue ?? ""), newValue: String(newValue ?? ""), affectedContracts: affected, risks });
                  }}
                />
              ) : (
                <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
                  <PortfolioDashboard
                    contracts={contracts}
                    masters={masters ? [masters] : []}
                    subContracts={subContracts}
                    onSelect={id => { setSelectedId(id); setRightTab("campos"); }}
                    onNewProject={() => setNewProject(true)}
                  />
                </div>
              )
              }</ErrorBoundary>
            )}
            {rightTab === "riesgo" && selectedId && (
              <ErrorBoundary scope="riesgo">
              <div style={{ flex:1, overflowY:"auto", padding:"18px 20px" }}>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.textDark, marginBottom:4 }}>Análisis de Riesgo — {master?.name||"Contrato"}</div>
                  <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono }}>Derecho español · Ley 3/2004 · RGPD · Código Civil · PHENOMENON Engine</div>
                </div>
                <RiskPanel
                  contract={contracts[selectedId]}
                  subContracts={Object.values(contracts).filter(c=>c.parentId===selectedId)}
                  allContracts={Object.values(contracts)}
                  onNavigate={(tab, field) => {
                    setRightTab("campos");
                    if (field) setJumpToField(field + "_" + Date.now());
                  }}
                />
              </div>
              </ErrorBoundary>
            )}

            {rightTab === "verificar" && selectedId && contracts[selectedId] && (
              <ErrorBoundary scope="verificar">
              <div style={{ flex:1, overflowY:"auto", padding:"18px 20px" }}>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.textDark, marginBottom:4 }}>Verificación PHENOMENON — {contracts[selectedId]?.name||"Contrato"}</div>
                  <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono }}>Homologación · Bloque VI Estabilización · Opus</div>
                </div>
                {(() => {
                  const c = contracts[selectedId];
                  if (!c) return null;
                  const subs = Object.values(contracts).filter(x=>x.parentId===selectedId);
                  return (
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      <button onClick={async () => {
                        const ordered = [...subs, c].filter(Boolean);
                        setVerifyTotal(ordered.length);
                        setVerifyResults([]);
                        setVerifyOpen(true);
                        setHomologating(true);
                        const accumulated = [];
                        for (const ph of ordered) {
                          await new Promise(r=>setTimeout(r,380));
                          try {
                            const result = await api.homologate(ph.id);
                            accumulated.push({...result, name:ph.name, type:ph.type});
                            setVerifyResults([...accumulated]);
                          } catch(_) {}
                        }
                        await loadContracts();
                        setHomologating(false);
                      }} style={{ width:"100%", padding:13, background:C.purple, color:C.white, border:"none", borderRadius:10, cursor:"pointer", fontSize:14, fontFamily:font.ui, fontWeight:700 }}>
                        ⊙ Ejecutar Verificación PHENOMENON
                      </button>
                      {[c, ...subs].filter(Boolean).map(ph=>{
                        const h = ph.opus?.homologation;
                        const col = h==="VALID"?C.green:h==="INVALID"?C.red:C.orange;
                        const icon = h==="VALID"?"✅":h==="INVALID"?"❌":"⏳";
                        return (
                          <div key={ph.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:C.white, border:`1.5px solid ${col}30`, borderRadius:10, boxShadow:"0 1px 6px rgba(0,0,0,0.05)" }}>
                            <span style={{ fontSize:20 }}>{icon}</span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:C.textDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ph.name}</div>
                              <div style={{ fontSize:10, color:col, fontFamily:font.mono, marginTop:2 }}>
                                {h==="VALID"?"HOMOLOGADO — Opus Completo":h==="INVALID"?"NO HOMOLOGADO — Resolver errores":"PENDIENTE DE VERIFICACIÓN"}
                              </div>
                            </div>
                            {h==="INVALID"&&(
                              <button onClick={async ()=>{
                                const result = await api.homologate(ph.id);
                                await loadContracts();
                                const enriched = {...result, name:ph.name, type:ph.type};
                                setVerifyResults([enriched]);
                                setVerifyTotal(1);
                                setVerifyOpen(true);
                              }} style={{ background:C.orange, color:C.white, border:"none", borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:11, fontFamily:font.ui, fontWeight:600, flexShrink:0 }}>
                                Ver errores →
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:C.textDark, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Bloque IV — Opus del Ecosistema</div>
                        {[c,...subs].filter(Boolean).map(ph=>{
                          const lvl = ph.ag?.terms?.registry?"OPONIBLE":ph.opus?.homologation==="VALID"?"COMPLETE":"PARTIAL";
                          const cfg = OPUS_LEVELS[lvl];
                          return (
                            <div key={ph.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, padding:"8px 10px", background:C.bgAlt, borderRadius:7 }}>
                              <span style={{ fontSize:16 }}>{cfg.icon}</span>
                              <div style={{ flex:1, fontSize:11, color:C.textDark, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ph.name}</div>
                              <span style={{ fontSize:10, color:cfg.color, fontFamily:font.mono, fontWeight:700 }}>{lvl}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
              </ErrorBoundary>
            )}

            {rightTab === "ecosistema" && (
              <ErrorBoundary scope="ecosistema">
                <EcosystemPanel
                  master={master}
                  subContracts={subContracts}
                  contracts={contracts}
                  loadContracts={loadContracts}
                  addLog={addLog}
                  onSelectContract={(id) => { setSelectedId(id); setRightTab("campos"); }}
                />
              </ErrorBoundary>
            )}

            {rightTab === "kpmg-demo" && (
              <ErrorBoundary scope="kpmg-demo">
                <KPMGDemoPanel
                  master={master}
                  subContracts={subContracts}
                  loadContracts={loadContracts}
                  addLog={addLog}
                  onEuriborCascade={(ids) => {
                    setGraphFlashIds(ids);
                    setTimeout(() => setGraphFlashIds([]), 2500);
                  }}
                />
              </ErrorBoundary>
            )}

            {rightTab === "kpmg-corp" && (
              <ErrorBoundary scope="kpmg-corp">
                <ApprovalChainView master={master} subContracts={subContracts} />
              </ErrorBoundary>
            )}

            {rightTab === "seguros" && (
              <ErrorBoundary scope="seguros">
                {!demoMode && <ErrorTriggerForTests scope="seguros" />}
                <SegurosComparativeView
                  contracts={contracts}
                  onSelectContract={(id) => { setSelectedId(id); setRightTab("campos"); }}
                  onLoadContracts={loadContracts}
                  addLog={addLog}
                />
              </ErrorBoundary>
            )}

            {rightTab === "red-if" && (
              <ErrorBoundary scope="red-if">
                <CascadeControlPanel
                  master={master}
                  subContracts={subContracts}
                  contracts={contracts}
                  onLoadContracts={loadContracts}
                  onHomologate={homologateContract}
                  addLog={addLog}
                />
              </ErrorBoundary>
            )}
            {rightTab === "ia" && (
              <ErrorBoundary scope="operadores">
                <IAEngineView
                  master={master}
                  subContracts={subContracts}
                  allContracts={contracts}
                  onAddIA={addIAToContract}
                  onRemoveIA={removeIAFromContract}
                />
              </ErrorBoundary>
            )}
            {rightTab === "documento" && (
              <ErrorBoundary scope="documento">
                <ContractPreviewTab master={master} subContracts={subContracts} />
              </ErrorBoundary>
            )}
          </div>
        </div>

        {/* ── Drag splitter: centre | right stage ── */}
        <div
          role="separator"
          aria-label="Resize right stage"
          onMouseDown={startRightResize}
          onMouseEnter={() => setRightGripHover(true)}
          onMouseLeave={() => setRightGripHover(false)}
          onDoubleClick={() => setStageW(w => w > 500 ? 420 : 560)}
          title="Arrastra · Doble clic para ajustar"
          style={{ ...gripV(rightGripHover) }}
        >
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: rightGripHover ? C.blue : C.borderStrong }} />
          ))}
        </div>

        {/* ── RIGHT STAGE (~420px): CenterStage ── */}
        <div
          style={{
            width: stageW,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflow: "hidden",
            minWidth: 160,
          }}
        >
          <ErrorBoundary scope="center-stage">
            <CenterStage
              master={master}
              subContracts={subContracts}
              contracts={contracts}
              onLoadContracts={loadContracts}
              onHomologate={homologateContract}
              addLog={addLog}
              onCascadeComplete={(ids) => {
                setGraphFlashIds(ids);
                setTimeout(() => setGraphFlashIds([]), 2500);
              }}
            />
          </ErrorBoundary>
        </div>

      </div>
    </div>
  );
}

// ── Root export — wraps AppInner in DemoModeProvider ─────────────────────────
export default function App() {
  return (
    <DemoModeProvider>
      <AppInner />
    </DemoModeProvider>
  );
}
