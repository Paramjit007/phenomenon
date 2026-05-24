import { useState, useCallback, useRef, useEffect } from "react";
import { C, font, CONTRACT_TEMPLATES, FINAL_RULE, OPUS_LEVELS, SUB_IF_EDGES, SUB_META } from "./constants.js";
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
import RiskPanel, { detectRisks } from "./components/RiskEngine.jsx";
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
  { key: "riesgo",     label: "Riesgo",     icon: "⚠" },
  { key: "verificar",  label: "Verificar",  icon: "⊙" },
  { key: "red-if",     label: "Red IF",     icon: "⇄" },
  { key: "ia",         label: "Operadores", icon: "⬡" },
  { key: "documento",  label: "Documento",  icon: "◉" },
];

// ── IF Link Map (left rail, between graph and log) ────────────────────────────
function IFLinkMap({ master, subContracts, onSelectNode }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!master || subContracts.length === 0) return null;

  const subTypes = new Set(subContracts.map(c => c.type));

  // Master → sub links
  const masterLinks = subContracts.map(c => ({
    from: master.name ?? master.type ?? "Master",
    to:   c.name ?? c.type ?? c.id,
    toId: c.id,
    kind: "master-sub",
    color: SUB_META[c.type]?.color ?? C.textMuted,
  }));

  // Sibling IF links (only where both contract types exist in this project)
  const siblingLinks = SUB_IF_EDGES
    .filter(e => subTypes.has(e.a) && subTypes.has(e.b))
    .map(e => {
      const src = subContracts.find(c => c.type === e.a);
      const dst = subContracts.find(c => c.type === e.b);
      return {
        from:   src?.name ?? e.a,
        to:     dst?.name ?? e.b,
        fromId: src?.id,
        toId:   dst?.id,
        label:  e.label,
        kind:   e.type ?? "if",
        color:  e.type === "exclusion" ? C.red : e.type === "logic" ? C.cyan : C.textMuted,
      };
    });

  const kindIcon = { "master-sub": "⬡", "exclusion": "⊗", "logic": "⇄", "if": "⇌" };

  return (
    <div style={{ flexShrink: 0, borderTop: `1px solid ${C.borderDark}`, background: C.navyDeep }}>
      {/* header */}
      <div
        onClick={() => setCollapsed(p => !p)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "5px 10px", cursor: "pointer",
          background: C.navyDeep,
          borderBottom: collapsed ? "none" : `1px solid ${C.borderDark}50`,
        }}
      >
        <span style={{ fontSize: 11, color: C.cyan }}>⇄</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#CBD5E1", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: font.ui }}>
          Red IF
        </span>
        <span style={{ fontSize: 10, color: "#64748B", fontFamily: font.mono }}>
          {masterLinks.length + siblingLinks.length}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#64748B" }}>{collapsed ? "▲" : "▼"}</span>
      </div>

      {/* body */}
      {!collapsed && (
        <div style={{ maxHeight: 170, overflowY: "auto", padding: "3px 0" }}>
          {/* master → sub rows */}
          {masterLinks.map((lnk, i) => (
            <div
              key={`ms-${i}`}
              onClick={() => lnk.toId && onSelectNode(lnk.toId)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 10px", cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#ffffff10"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 10, color: lnk.color, flexShrink: 0 }}>⬡</span>
              <span style={{ fontSize: 10, color: "#CBD5E1", fontFamily: font.ui, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lnk.from}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 800, color: "#fff",
                background: lnk.color, borderRadius: 3, padding: "1px 5px", flexShrink: 0,
              }}>IF</span>
              <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: font.ui, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                {lnk.to}
              </span>
            </div>
          ))}

          {/* sibling rows */}
          {siblingLinks.map((lnk, i) => (
            <div
              key={`sib-${i}`}
              onClick={() => lnk.fromId && onSelectNode(lnk.fromId)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 10px", cursor: "pointer",
                borderTop: `1px solid ${C.borderDark}40`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#ffffff10"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 10, color: lnk.color, flexShrink: 0 }}>{kindIcon[lnk.kind] ?? "⇌"}</span>
              <span style={{ fontSize: 10, color: "#CBD5E1", fontFamily: font.ui, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lnk.from}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, color: lnk.color,
                border: `1px solid ${lnk.color}`, borderRadius: 3,
                padding: "1px 4px", flexShrink: 0, whiteSpace: "nowrap",
                maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {lnk.label}
              </span>
              <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: font.ui, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                {lnk.to}
              </span>
            </div>
          ))}

          {siblingLinks.length === 0 && masterLinks.length === 0 && (
            <div style={{ padding: "10px", fontSize: 10, color: "#64748B", textAlign: "center", fontFamily: font.ui }}>
              Sin conexiones IF activas
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
        height: 100,
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
          height: 24,
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: 7,
          borderBottom: `1px solid ${C.borderDark}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: loading ? C.orange : C.green,
            flexShrink: 0,
            boxShadow: loading ? `0 0 5px ${C.orange}80` : `0 0 5px ${C.green}80`,
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: "#CBD5E1",
            fontFamily: font.ui,
            fontWeight: 600,
            letterSpacing: "0.04em",
            flex: 1,
          }}
        >
          Motor · Actividad
        </span>
        <span style={{ fontSize: 10, color: "#64748B", fontFamily: font.mono }}>
          {log.length}
        </span>
      </div>

      {/* Log entries — last 6 */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", padding: "3px 0" }}
      >
        {lastSix.length === 0 ? (
          <div
            style={{
              padding: "8px 10px",
              fontSize: 10,
              color: "#64748B",
              fontFamily: font.ui,
            }}
          >
            Sin actividad registrada
          </div>
        ) : (
          lastSix.map((e) => {
            const col =
              e.type === "error"   ? "#F87171" :
              e.type === "ai"      ? "#A78BFA" :
              e.type === "opus"    ? "#34D399" :
              e.type === "cascade" ? "#FBB34A" : "#E2E8F0";
            return (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  gap: 6,
                  padding: "3px 10px",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "#475569",
                    fontFamily: font.mono,
                    flexShrink: 0,
                    paddingTop: 2,
                    minWidth: 44,
                  }}
                >
                  {e.t}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: col,
                    fontFamily: font.ui,
                    lineHeight: 1.4,
                    flex: 1,
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
  const [leftW,        setLeftW]        = useState(380);
  const [stageW,       setStageW]       = useState(420);
  // Legacy rightW kept for S/M/L/XL snap buttons (hidden in demoMode but still functional)
  const [rightW,       setRightW]       = useState(580);
  const [iaH,          setIaH]          = useState(160);  // L2 panel height — start small so graph is visible
  const [iaHover,      setIaHover]      = useState(false);
  const [leftGripHover,  setLeftGripHover]  = useState(false);
  const [rightGripHover, setRightGripHover] = useState(false);
  const [iaCollapsed,  setIaCollapsed]  = useState(true);  // collapsed by default — graph visible immediately
  const [homologating,   setHomologating]   = useState(false);
  const [graphFlashIds,  setGraphFlashIds]  = useState([]);
  const [pendingEditId,  setPendingEditId]  = useState(null);
  const [graphViewMode,  setGraphViewMode]  = useState("radial"); // "radial" | "full"
  // null | "stage-wide" | "stage-full" | "centre-wide" | "centre-full" | "left-wide" | "left-full"
  // stage-wide   → hide left; stage fills rest; centre shrinks to 280px
  // stage-full   → hide left + centre; stage full width
  // centre-wide  → hide stage; left + centre fill screen
  // centre-full  → hide left + stage; centre full width
  // left-wide    → hide stage; left + centre fill screen (left resizable)
  // left-full    → hide centre + stage; left full width
  const [expandedPanel,  setExpandedPanel]  = useState(null);
  const hideLeft    = ["stage-wide","stage-full","centre-full"].includes(expandedPanel);
  const hideCentre  = expandedPanel === "stage-full" || expandedPanel === "left-full";
  const hideStage   = ["centre-wide","centre-full","left-wide","left-full"].includes(expandedPanel);
  const stageIsWide = expandedPanel === "stage-wide";
  const leftIsWide  = expandedPanel === "left-wide";
  const leftIsFull  = expandedPanel === "left-full";
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
    if (t.key === "kpmg-demo") return !isSegurosCase;
    return true;
  });

  useEffect(() => {
    if (!isKPMGCorporate && rightTab === "kpmg-corp") setRightTab("campos");
  }, [isKPMGCorporate, rightTab]);

  // Auto-switch to full network when seguros case is loaded; auto-widen right stage
  useEffect(() => {
    if (isSegurosCase) {
      setGraphViewMode("full");
      setStageW(580);
    } else {
      setGraphViewMode("radial");
      setStageW(420);
      setExpandedPanel(null);
    }
  }, [isSegurosCase]);

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
    const move = (e2) => setLeftW(Math.min(700, Math.max(160, sw + (e2.clientX - sx))));
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
    cursor: "pointer", fontSize: 12, fontFamily: font.ui, fontWeight: 600,
    color: rightTab === key ? C.textDark : C.textMuted,
    background: "none",
    border: "none", borderBottom: rightTab === key ? `2.5px solid ${C.gold}` : "2.5px solid transparent",
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
    width: 14, cursor: "col-resize", flexShrink: 0,
    background: hover ? C.gold : C.bgAlt,
    borderLeft: `1px solid ${C.border}`,
    borderRight: `1px solid ${C.border}`,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
    transition: "background 0.15s", userSelect: "none",
    zIndex: 10,
    position: "relative",
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

      {/* ── UPGRADE BANNER ── */}
      <div style={{ background: "#C9A84C", color: "#141E30", textAlign: "center", padding: "4px", fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
        ✦ PHENOMENON v9 — NOVA INTERFACE ACTIVA ✦
      </div>

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

        {/* Inicio button — only in seguros mode */}
        {isSegurosCase && (
          <button
            onClick={async () => {
              try { await api.clearSeguros(); } catch (_) {}
              await loadContracts();
              setSelectedId(null);
              setRightTab("campos");
              setExpandedPanel(null);
            }}
            title="Borrar seguros y volver a la pantalla de inicio"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 11px", borderRadius: 6,
              border: `1px solid #ef444440`,
              background: "#fef2f2",
              cursor: "pointer", fontFamily: font.mono,
              fontSize: 10, fontWeight: 700,
              color: "#dc2626", letterSpacing: "0.07em",
            }}
          >
            ⟵ Inicio
          </button>
        )}

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
      <div style={{ flex: 1, display: "flex", overflow: "hidden", background: C.bg }}>

        {/* ── LEFT RAIL (~380px): graph + compact IA + permanent EngineLog ── */}
        <div
          style={{
            width: hideLeft ? 0 : leftIsFull ? undefined : leftW,
            flex: hideLeft ? undefined : leftIsFull ? 1 : "none",
            display: hideLeft ? "none" : "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: hideLeft ? undefined : leftIsFull ? 1 : 0,
            minWidth: hideLeft ? 0 : leftIsFull ? 0 : 200,
          }}
        >
          {/* ── Left rail header with expand button ── */}
          <div style={{
            height: 30, flexShrink: 0,
            background: C.navyDeep,
            borderBottom: `1px solid ${C.borderDark}`,
            display: "flex", alignItems: "center",
            padding: "0 10px", gap: 8,
          }}>
            <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: font.ui, fontWeight: 600, flex: 1, letterSpacing: "0.04em" }}>
              Grafo · IF · Motor
            </span>
            <button
              onClick={() => setExpandedPanel(p => {
                if (!p || p.startsWith("stage") || p.startsWith("centre")) return "left-wide";
                if (p === "left-wide") return "left-full";
                return null;
              })}
              title={leftIsFull ? "Restaurar 3 paneles" : leftIsWide ? "Pantalla completa" : "Ampliar grafo"}
              style={{
                width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                border: `1px solid ${leftIsFull || leftIsWide ? C.gold : "#2D3F5A"}`,
                background: leftIsFull ? `${C.gold}40` : leftIsWide ? `${C.gold}20` : "transparent",
                color: leftIsFull || leftIsWide ? C.gold : "#64748B",
                cursor: "pointer", fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {leftIsFull ? "⊠" : leftIsWide ? "⊟" : "⊞"}
            </button>
          </div>

          {/* Contract graph */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
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
                viewMode={graphViewMode}
              />
            </ErrorBoundary>
          </div>

          {/* IA panel resize handle — thin when collapsed */}
          <div
            onMouseDown={iaCollapsed ? undefined : startIaVResize}
            onMouseEnter={() => setIaHover(true)}
            onMouseLeave={() => setIaHover(false)}
            onDoubleClick={() => setIaCollapsed(p => !p)}
            title="Doble clic para expandir Motor IA"
            style={{
              height: iaCollapsed ? 18 : 10,
              flexShrink: 0,
              background: iaHover ? `${C.blue}18` : C.bgAlt,
              borderTop: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: iaCollapsed ? "pointer" : "row-resize",
              transition: "height 0.2s",
              gap: 4,
            }}
          >
            {iaCollapsed
              ? <span style={{ fontSize: 9, color: iaHover ? C.blue : C.textLight, fontFamily: font.mono, letterSpacing: 1 }}>⬡ IA ▲</span>
              : [0,1,2,3].map(i => <div key={i} style={{ width: 14, height: 2, background: iaHover ? C.blue : C.borderStrong, borderRadius: 1 }} />)
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
        {!hideLeft && !hideCentre && !leftIsFull && <div
          role="separator"
          aria-label="Resize left rail"
          onMouseDown={startLeftResize}
          onMouseEnter={() => setLeftGripHover(true)}
          onMouseLeave={() => setLeftGripHover(false)}
          onDoubleClick={() => setLeftW(w => w > 300 ? 160 : 520)}
          title="⟺ Arrastra para redimensionar · Doble clic: expandir/colapsar"
          style={{ ...gripV(leftGripHover) }}
        >
          <div style={{ fontSize: 11, color: leftGripHover ? C.navyDeep : C.textMuted, letterSpacing: 0, lineHeight: 1, transform: "rotate(90deg)", fontWeight: 700 }}>⟺</div>
          {[0,1,2,3,4,5,6].map(i => (
            <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: leftGripHover ? C.navyDeep : C.borderStrong }} />
          ))}
        </div>}

        {/* ── CENTRE PANE: ContractDetailPanel (all existing tabs) ── */}
        {!hideCentre && <div
          style={{
            flex: stageIsWide ? "0 0 280px" : 1,
            display: "flex",
            flexDirection: "column",
            background: C.white,
            overflow: "hidden",
            minWidth: stageIsWide ? 0 : 160,
          }}
        >
          {/* Tab bar */}
          <div
            data-testid="right-panel-tabs"
            style={{
              height: 40,
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
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3, paddingRight: 6 }}>
                {[["S", 380], ["M", 580], ["L", 800], ["XL", 1100]].map(([lbl, w]) => (
                  <button key={lbl} onClick={() => setRightW(w)}
                    style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: `1px solid ${Math.abs(rightW - w) < 80 ? C.gold : C.border}`, background: Math.abs(rightW - w) < 80 ? C.goldBg : "none", color: Math.abs(rightW - w) < 80 ? C.goldDim : C.textMuted, cursor: "pointer", fontFamily: font.mono }}>
                    {lbl}
                  </button>
                ))}
                <span style={{ fontSize: 9, color: C.textLight, fontFamily: font.mono, marginLeft: 3, marginRight: 6 }}>{rightW}px</span>
              </div>
            )}
            {/* L2 expand / collapse button */}
            {(() => {
              const lvl = expandedPanel === "centre-full" ? 2 : expandedPanel === "centre-wide" ? 1 : 0;
              const nextTitle = lvl === 0 ? "Ampliar: ocultar derecho" : lvl === 1 ? "Ampliar: pantalla completa" : "Restaurar 3 paneles";
              const icon = lvl === 2 ? "⊠" : lvl === 1 ? "⊟" : "⊞";
              const active = lvl > 0;
              return (
                <button
                  onClick={() => setExpandedPanel(p => {
                    if (!p || p.startsWith("stage")) return "centre-wide";
                    if (p === "centre-wide") return "centre-full";
                    return null;
                  })}
                  title={nextTitle}
                  style={{
                    marginLeft: demoMode ? "auto" : 0,
                    marginRight: 8, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 26, height: 26,
                    border: `1px solid ${active ? C.gold : C.border}`,
                    borderRadius: 5,
                    background: active ? C.goldBg : "transparent",
                    color: active ? C.goldDim : C.textMuted,
                    cursor: "pointer", fontSize: 13,
                  }}
                >
                  {icon}
                </button>
              );
            })()}
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
                  onEssCascade={async (cid, field, val) => {
                    const c = contracts[cid];
                    if (!c || c.parentId || field !== "partyA") return;
                    if (!INSURANCE_TEMPLATE_KEYS.includes(c.ag?.terms?.templateKey)) return;
                    try {
                      const res = await api.triggerCascade(cid, field, val);
                      addLog("IF", `Tomador → ${res.affected_count} subcontrato(s) actualizado(s)`, "cascade");
                      await api.crossPolicyCascade({ source_contract_id: cid, field, new_value: val });
                      addLog("IF", `Tomador propagado a todas las pólizas: "${val}"`, "cascade");
                      await loadContracts();
                    } catch (e) {
                      addLog("ERROR", "Cascade tomador: " + e.message, "error");
                    }
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
        </div>}

        {/* ── Drag splitter: centre | right stage ── */}
        {!hideLeft && !hideStage && !hideCentre && <div
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
        </div>}

        {/* ── RIGHT STAGE (~420-580px): Seguros builder OR CenterStage ── */}
        {!hideStage && <div
          style={{
            width: (hideCentre || stageIsWide) ? undefined : stageW,
            flex: (hideCentre || stageIsWide) ? 1 : "none",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflow: "hidden",
            minWidth: 200,
          }}
        >
          <ErrorBoundary scope="right-stage">
            {isSegurosCase ? (
              <SegurosComparativeView
                contracts={contracts}
                onSelectContract={(id) => { setSelectedId(id); setRightTab("campos"); }}
                onLoadContracts={loadContracts}
                addLog={addLog}
                isExpanded={expandedPanel === "stage-wide" || expandedPanel === "stage-full"}
                expandLevel={expandedPanel === "stage-full" ? 2 : expandedPanel === "stage-wide" ? 1 : 0}
                onToggleExpand={() => setExpandedPanel(p => {
                  if (!p || p.startsWith("centre")) return "stage-wide";
                  if (p === "stage-wide") return "stage-full";
                  return null;
                })}
              />
            ) : (
              <CenterStage
                master={master}
                subContracts={subContracts}
                contracts={contracts}
                selectedContract={selectedId ? contracts[selectedId] ?? null : null}
                onLoadContracts={loadContracts}
                onHomologate={homologateContract}
                addLog={addLog}
                onCascadeComplete={(ids) => {
                  setGraphFlashIds(ids);
                  setTimeout(() => setGraphFlashIds([]), 2500);
                }}
                onClauseInserted={(contractId, clauseText) => {
                  addLog({
                    id: Date.now(),
                    t: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                    msg: `Cláusula insertada en contrato ${contractId}`,
                    type: "opus",
                  });
                }}
                onViewModeChange={(mode) => setGraphViewMode(mode)}
              />
            )}
          </ErrorBoundary>
        </div>}

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
