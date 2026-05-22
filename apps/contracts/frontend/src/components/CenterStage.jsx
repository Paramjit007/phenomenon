/**
 * CenterStage — the right pane of the 3-pane workspace.
 *
 * Renders a nav bar with 5 pill buttons:
 *   "Inicio"  ·  "Cascada" (active by default)  ·  "Forja IA"  ·  "Opus"  ·  "Red"
 *
 * The "Cascada" tab renders CascadePlayground — a full interactive cascade
 * control with field selector, EURIBOR slider, impact preview, live feed
 * and ecosystem homologation.
 *
 * The "Forja IA" tab renders ClauseForge — AI-assisted clause generation
 * with ESS context, editable prompt, and progressive text reveal.
 *
 * The "Opus" tab renders OpusJourney — PARTIAL→COMPLETE→OPONIBLE milestone track.
 *
 * The "Red" tab signals ContractGraph to toggle to full-network view.
 * CenterStage calls onViewModeChange("full"|"radial") which App.jsx threads
 * down to ContractGraph as the viewMode prop.
 *
 * Props:
 *   master            — master contract object
 *   subContracts      — array of sub-contract objects
 *   contracts         — contracts map { [id]: contract }
 *   selectedContract  — the contract currently selected by the user (may be null)
 *   onLoadContracts   — () => Promise<void>  callback to refresh contracts
 *   onHomologate      — (id) => Promise<void>
 *   addLog            — (phase, msg, type?) => void
 *   onCascadeComplete — (affectedIds: string[]) => void  (flash graph nodes)
 *   onClauseInserted  — (contractId, clauseText) => void  (optional)
 *   onViewModeChange  — (mode: "radial"|"full") => void  (optional)
 */
import { useState, useCallback } from "react";
import { C, font } from "../constants.js";
import ErrorBoundary from "./ErrorBoundary.jsx";
import CascadePlayground from "./CascadePlayground.jsx";
import ClauseForge from "./ClauseForge.jsx";
import OpusJourney from "./OpusJourney.jsx";

const STAGE_TABS = [
  { key: "inicio",   label: "Inicio",    icon: "◎" },
  { key: "cascada",  label: "Cascada",   icon: "⚡" },
  { key: "forja",    label: "Forja IA",  icon: "✦" },
  { key: "opus",     label: "Opus",      icon: "◎" },
  { key: "red",      label: "Red",       icon: "◈" },
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
        Proximamente — Priority 3+
      </div>
    </div>
  );
}

export default function CenterStage({
  master,
  subContracts,
  contracts,
  selectedContract,
  onLoadContracts,
  onHomologate,
  addLog,
  onCascadeComplete,
  onClauseInserted,
  onViewModeChange,
}) {
  const [activeTab, setActiveTab] = useState("cascada");

  // When the Red tab is activated, signal ContractGraph to enter full-network view.
  // When leaving the Red tab, signal return to radial view.
  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
    if (key === "red") {
      if (onViewModeChange) onViewModeChange("full");
    } else if (activeTab === "red") {
      if (onViewModeChange) onViewModeChange("radial");
    }
  }, [activeTab, onViewModeChange]);

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
            aria-controls={`stage-panel-${t.key}`}
            id={`stage-tab-${t.key}`}
            onClick={() => handleTabChange(t.key)}
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
        id={`stage-panel-${activeTab}`}
        aria-labelledby={`stage-tab-${activeTab}`}
        style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {activeTab === "cascada" && (
          <ErrorBoundary scope="center-stage-cascada">
            <CascadePlayground
              master={master}
              subContracts={subContracts}
              contracts={contracts}
              onCascadeComplete={onCascadeComplete}
              addLog={addLog}
              loadContracts={onLoadContracts}
            />
          </ErrorBoundary>
        )}
        {activeTab === "inicio" && <ComingSoon label="Inicio — Vista general del proyecto" />}
        {activeTab === "forja" && (
          <ErrorBoundary scope="center-stage-forja">
            <ClauseForge
              selectedContract={selectedContract}
              master={master}
              contracts={contracts}
              addLog={addLog}
              loadContracts={onLoadContracts}
              onClauseInserted={onClauseInserted}
            />
          </ErrorBoundary>
        )}
        {activeTab === "opus" && (
          <ErrorBoundary scope="center-stage-opus">
            <OpusJourney
              master={master}
              subContracts={subContracts}
              contracts={contracts}
              onRequestHomologate={async () => {
                // Homologate sub-contracts first, then master (correct order)
                const ordered = [...(subContracts ?? []).filter(Boolean), master].filter(Boolean);
                for (const c of ordered) {
                  await new Promise(r => setTimeout(r, 300));
                  try { await onHomologate(c.id); } catch (_) {}
                }
              }}
              loadContracts={onLoadContracts}
              addLog={addLog}
            />
          </ErrorBoundary>
        )}
        {activeTab === "red" && (
          <div
            role="region"
            aria-label="Vista completa de la red contractual"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              fontFamily: font.ui,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 24, color: C.cyan, opacity: 0.7 }}>◈</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textDark }}>
                  Vista completa de la red
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font.mono }}>
                  La red se muestra en el panel izquierdo
                </div>
              </div>
            </div>

            {/* Colour coding legend — master group palette */}
            <div style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "14px 16px",
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 12,
              }}>
                Codificación por colores — Grupos maestro
              </div>
              {[
                { color: C.gold,    label: "Grupo maestro 1" },
                { color: C.cyan,    label: "Grupo maestro 2" },
                { color: "#059669", label: "Grupo maestro 3" },
                { color: "#7C3AED", label: "Grupo maestro 4" },
              ].map(({ color, label }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, color: C.textBody }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Opus ring legend */}
            <div style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "14px 16px",
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 12,
              }}>
                Anillos Opus
              </div>
              {[
                { color: C.gold,    dash: false,  label: "OPONIBLE — inscrito en Registro" },
                { color: C.green,   dash: true,   label: "COMPLETE — homologado" },
                { color: C.orange,  dash: false,  label: "NEEDS_REVIEW — requiere revisión" },
              ].map(({ color, dash, label }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <svg width={20} height={20} aria-hidden="true" focusable="false">
                    <circle
                      cx={10} cy={10} r={7}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray={dash ? "4 3" : undefined}
                    />
                  </svg>
                  <span style={{ fontSize: 11, color: C.textBody }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Link types */}
            <div style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "14px 16px",
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 12,
              }}>
                Tipos de conexión
              </div>
              {[
                { color: C.gold,           label: "Maestro → subcontrato (IF)",  dash: "5 4" },
                { color: C.textMuted,      label: "IF entre subcontratos",         dash: "4 4" },
              ].map(({ color, label, dash }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <svg width={28} height={12} aria-hidden="true" focusable="false">
                    <line
                      x1={0} y1={6} x2={28} y2={6}
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray={dash}
                    />
                  </svg>
                  <span style={{ fontSize: 11, color: C.textBody }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
