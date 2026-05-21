/**
 * CenterStage — the right pane of the 3-pane workspace.
 *
 * Renders a nav bar with 4 pill buttons:
 *   "Inicio"  ·  "Cascada" (active by default)  ·  "Forja IA"  ·  "Opus"
 *
 * The "Cascada" tab renders the existing CascadeControlPanel.
 * The other 3 tabs show a "Coming soon" placeholder.
 *
 * This component will be filled out in later priorities.
 *
 * Props:
 *   master         — master contract object
 *   subContracts   — array of sub-contract objects
 *   contracts      — contracts map { [id]: contract }
 *   onLoadContracts — () => Promise<void>  callback to refresh contracts
 *   onHomologate   — (id) => Promise<void>
 *   addLog         — (phase, msg, type?) => void
 */
import { useState } from "react";
import { C, font } from "../constants.js";
import ErrorBoundary from "./ErrorBoundary.jsx";
import CascadeControlPanel from "./CascadeControlPanel.jsx";

const STAGE_TABS = [
  { key: "inicio",   label: "Inicio",    icon: "◎" },
  { key: "cascada",  label: "Cascada",   icon: "⚡" },
  { key: "forja",    label: "Forja IA",  icon: "✦" },
  { key: "opus",     label: "Opus",      icon: "◎" },
];

function ComingSoon({ label }) {
  return (
    <div
      role="status"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: C.textMuted,
        fontFamily: font.ui,
        padding: 32,
      }}
    >
      <div style={{ fontSize: 32, opacity: 0.35 }}>✦</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.textLight }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: C.textLight, fontFamily: font.mono }}>
        Próximamente — Priority 2+
      </div>
    </div>
  );
}

export default function CenterStage({
  master,
  subContracts,
  contracts,
  onLoadContracts,
  onHomologate,
  addLog,
}) {
  const [activeTab, setActiveTab] = useState("cascada");

  const navPill = (key) => ({
    padding: "5px 14px",
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: font.ui,
    fontWeight: activeTab === key ? 700 : 500,
    background: activeTab === key ? C.navy : "transparent",
    color: activeTab === key ? C.gold : C.textMuted,
    transition: "background 0.15s, color 0.15s",
    outline: "none",
    display: "flex",
    alignItems: "center",
    gap: 5,
    whiteSpace: "nowrap",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: C.bgAlt,
        overflow: "hidden",
      }}
    >
      {/* Nav bar */}
      <div
        role="tablist"
        aria-label="Stage navigation"
        style={{
          height: 42,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 12px",
          background: C.navyDeep,
          flexShrink: 0,
          borderBottom: `1px solid ${C.borderDark}`,
        }}
      >
        {STAGE_TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            style={navPill(t.key)}
          >
            <span aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        role="tabpanel"
        style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {activeTab === "cascada" && (
          <ErrorBoundary scope="center-stage-cascada">
            <CascadeControlPanel
              master={master}
              subContracts={subContracts}
              contracts={contracts}
              onLoadContracts={onLoadContracts}
              onHomologate={onHomologate}
              addLog={addLog}
            />
          </ErrorBoundary>
        )}
        {activeTab === "inicio" && <ComingSoon label="Inicio — Vista general del proyecto" />}
        {activeTab === "forja" && <ComingSoon label="Forja IA — Generación asistida de cláusulas" />}
        {activeTab === "opus" && <ComingSoon label="Opus — Registro y homologación" />}
      </div>
    </div>
  );
}
