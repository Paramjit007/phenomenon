import { useState } from "react";
import { C, font, INSURANCE_POLICY_CONFIG, INSURANCE_TEMPLATE_KEYS, statusColor, statusLabel, SUB_META } from "../constants.js";
import * as api from "../api/phenomenon.js";

// Maps insurance template key to a short A1 label
const A1_LABEL = {
  SEGURO_VIDA:              "Cobertura estructural condicionada por riesgo personal",
  SEGURO_RC:                "Cobertura por daño causado a tercero",
  SEGURO_DANOS:             "Cobertura por daño material a bien asegurado",
  SEGURO_CREDITO_COMERCIAL: "Cobertura por incumplimiento de obligación dineraria",
};

function StatusBadge({ status }) {
  const bg = statusColor(status);
  const lbl = statusLabel(status);
  const isBlocked = status === "BLOCKED";
  return (
    <span style={{
      fontSize: 9, fontFamily: font.mono, fontWeight: 700, letterSpacing: "0.06em",
      padding: "2px 8px", borderRadius: 10,
      background: isBlocked ? C.redBg : `${bg}20`,
      color: bg, border: `1px solid ${bg}40`,
      animation: isBlocked ? "pulse 1.5s infinite" : "none",
    }}>
      {isBlocked ? "⛔ " : ""}{lbl?.toUpperCase() ?? status}
    </span>
  );
}

function PolicyColumn({ policyConfig, master, subContracts, onSelect, onSiniestro, onUnblock, flashing }) {
  const { label, color, icon } = policyConfig;
  const isBlocked     = master?.status === "BLOCKED" || subContracts.some(s => s?.status === "BLOCKED");
  const hasSiniestro  = subContracts.some(s => s?.status === "SINIESTRO_PENDIENTE");
  const templateKey   = master?.ag?.terms?.templateKey ?? "";

  // Find the main coverage sub-contract
  const coverageSub = subContracts.find(s =>
    s?.type?.startsWith("COBERTURA_") || s?.type === "PRIMA_VIDA"
  );
  const exclusionSub = subContracts.find(s =>
    s?.type?.startsWith("EXCLUSIONES_") || s?.type === "FRANQUICIA_RC"
  );
  const blockedSub = subContracts.find(s => s?.status === "BLOCKED");
  const siniestroSub = subContracts.find(s => s?.status === "SINIESTRO_PENDIENTE");

  // Coverage amount from terms
  const coverageAmt =
    master?.ag?.terms?.capitalDeceso ||
    master?.ag?.terms?.coverageLimit ||
    master?.ag?.terms?.propertyValue ||
    master?.ag?.terms?.creditLimit ||
    null;

  const primaAnual = master?.ag?.terms?.primaAnual;
  const activeExclusions = exclusionSub?.ag?.terms?.blockingStatus?.includes("bloquea") ? 1 : 0;

  const colBg = isBlocked ? `${C.red}08` : `${color}08`;
  const border = isBlocked ? `2px solid ${C.red}60` : flashing ? `2px solid ${color}` : `1.5px solid ${color}30`;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", gap: 0,
      background: colBg, border, borderRadius: 12, overflow: "hidden",
      opacity: isBlocked ? 0.85 : 1,
      transition: "all 0.3s",
      boxShadow: flashing ? `0 0 16px ${color}60` : isBlocked ? `0 0 8px ${C.red}30` : "none",
    }}>
      {/* Header */}
      <div style={{ background: isBlocked ? C.red : color, padding: "12px 14px", cursor: master ? "pointer" : "default" }}
        onClick={() => master && onSelect(master.id)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 20, color: C.white }}>{icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, fontFamily: font.ui }}>{label}</div>
            <div style={{ fontSize: 9, color: `${C.white}CC`, fontFamily: font.mono, letterSpacing: "0.06em" }}>
              {isBlocked ? "IF_EXCLUSION ACTIVA" : "ACTIVA"}
            </div>
          </div>
          {isBlocked && <span style={{ marginLeft: "auto", fontSize: 18 }}>⛔</span>}
        </div>
        {master && <StatusBadge status={master.status} />}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* A1 label */}
        <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font.ui, lineHeight: 1.5, fontStyle: "italic" }}>
          {A1_LABEL[templateKey] ?? "—"}
        </div>

        {/* Key metrics */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {coverageAmt && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: C.textMuted, fontFamily: font.mono }}>Capital / Límite</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: isBlocked ? C.red : C.textDark, fontFamily: font.ui }}>
                {parseInt(coverageAmt).toLocaleString("es-ES")} €
              </span>
            </div>
          )}
          {primaAnual && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: C.textMuted, fontFamily: font.mono }}>Prima anual</span>
              <span style={{ fontSize: 11, color: C.textDark, fontFamily: font.ui }}>
                {parseInt(primaAnual).toLocaleString("es-ES")} €
              </span>
            </div>
          )}
        </div>

        {/* Sub-contracts status list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 9, color: C.textMuted, fontFamily: font.mono, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
            Sub-contratos IF
          </div>
          {subContracts.map(sub => {
            if (!sub) return null;
            const meta = SUB_META[sub.type] ?? { label: sub.type, color: C.textMuted, icon: "◈" };
            const sc = statusColor(sub.status);
            return (
              <div key={sub.id} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "4px 8px",
                background: sub.status === "BLOCKED" ? `${C.red}15` : `${meta.color}10`,
                borderRadius: 6, cursor: "pointer",
                border: `1px solid ${sub.status === "BLOCKED" ? C.red : meta.color}30`,
              }}
                onClick={() => onSelect(sub.id)}>
                <span style={{ fontSize: 12, color: meta.color, flexShrink: 0 }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: C.textDark, fontFamily: font.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {meta.short ?? sub.type}
                  </div>
                </div>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>

        {/* Blocking explanation */}
        {isBlocked && blockedSub && (
          <div style={{ background: `${C.red}10`, border: `1px solid ${C.red}30`, borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.red, fontFamily: font.mono, marginBottom: 3 }}>
              ⛔ IF_EXCLUSION ACTIVA
            </div>
            <div style={{ fontSize: 9, color: C.red, fontFamily: font.ui, lineHeight: 1.5 }}>
              {blockedSub.ag?.terms?.blockingReason ?? "Condición IF_exclusion pendiente de resolución"}
            </div>
          </div>
        )}

        {/* Siniestro pending info */}
        {hasSiniestro && siniestroSub && (
          <div style={{ background: `#F59E0B15`, border: `1px solid #F59E0B40`, borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", fontFamily: font.mono, marginBottom: 3 }}>
              ⚠ SINIESTRO EN TRAMITACIÓN
            </div>
            <div style={{ fontSize: 9, color: C.textMuted, fontFamily: font.ui }}>
              {siniestroSub.name}
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Siniestro button — shown for active coverage */}
          {coverageSub && coverageSub.status === "ACTIVE" && !hasSiniestro && !isBlocked && (
            <button onClick={() => onSiniestro(coverageSub.id, "")}
              style={{ width: "100%", padding: "7px 0", background: `${color}20`, color, border: `1px solid ${color}50`, borderRadius: 7, cursor: "pointer", fontSize: 10, fontFamily: font.ui, fontWeight: 600 }}>
              ⚡ Declarar Siniestro
            </button>
          )}
          {/* Resolve siniestro buttons */}
          {hasSiniestro && siniestroSub && (
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => onSiniestro(siniestroSub.id, "INDEMNIZACION_PAGADA")}
                style={{ flex: 1, padding: "6px 0", background: C.greenBg, color: C.green, border: `1px solid ${C.green}40`, borderRadius: 6, cursor: "pointer", fontSize: 9, fontFamily: font.ui, fontWeight: 600 }}>
                ✅ Indemnizar
              </button>
              <button onClick={() => onSiniestro(siniestroSub.id, "RECHAZO")}
                style={{ flex: 1, padding: "6px 0", background: C.bgAlt, color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", fontSize: 9, fontFamily: font.ui, fontWeight: 600 }}>
                ✕ Rechazar
              </button>
            </div>
          )}
          {/* Unblock button — only when BLOCKED */}
          {blockedSub && (
            <button onClick={() => onUnblock(blockedSub.id)}
              style={{ width: "100%", padding: "7px 0", background: C.greenBg, color: C.green, border: `1px solid ${C.green}50`, borderRadius: 7, cursor: "pointer", fontSize: 10, fontFamily: font.ui, fontWeight: 600 }}>
              🔓 Desbloquear Cobertura
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SegurosComparativeView({ contracts, onSelectContract, onLoadContracts, addLog }) {
  const [flashing, setFlashing] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Find all insurance masters
  const insuranceMasters = Object.values(contracts).filter(c =>
    c.parentId === null && INSURANCE_TEMPLATE_KEYS.includes(c.ag?.terms?.templateKey)
  );

  // Build per-policy data: master + subs
  const policies = Object.entries(INSURANCE_POLICY_CONFIG).map(([key, cfg]) => {
    const master = insuranceMasters.find(m => m.ag?.terms?.templateKey === key);
    const subs   = master
      ? cfg.subs.map(subType => Object.values(contracts).find(c => c.parentId === master.id && c.type === subType))
      : [];
    return { key, cfg, master, subs };
  }).filter(p => p.master); // only show policies that are loaded

  if (policies.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 32 }}>
        <div style={{ fontSize: 32 }}>🛡️</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.textDark }}>Caso Seguros no cargado</div>
        <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center" }}>
          Carga el caso Seguros desde la pantalla de inicio para ver las 4 pólizas en paralelo.
        </div>
      </div>
    );
  }

  async function handleSiniestro(contractId, resolution) {
    if (processing) return;
    setProcessing(true);
    // Safety reset: if something goes wrong the processing lock never gets stuck
    const safetyReset = setTimeout(() => setProcessing(false), 20000);
    setFlashing(contractId);
    try {
      await api.declareSiniestro({ contract_id: contractId, resolution });
      addLog?.("SINIESTRO", resolution ? `Siniestro resuelto: ${resolution}` : "Siniestro declarado — pendiente de tramitación", "cascade");
      await onLoadContracts();
    } catch (e) {
      addLog?.("ERROR", "Error en tramitación: " + e.message, "error");
    } finally {
      clearTimeout(safetyReset);
      setProcessing(false);
      setTimeout(() => setFlashing(null), 2000);
    }
  }

  async function handleUnblock(contractId) {
    if (processing) return;
    setProcessing(true);
    const safetyReset = setTimeout(() => setProcessing(false), 20000);
    setFlashing(contractId);
    try {
      await api.unblockCoverage({ contract_id: contractId });
      addLog?.("IF_EXCLUSION", "Cobertura desbloqueada — IF_exclusion resuelta", "cascade");
      await onLoadContracts();
    } catch (e) {
      addLog?.("ERROR", "Error desbloqueando: " + e.message, "error");
    } finally {
      clearTimeout(safetyReset);
      setProcessing(false);
      setTimeout(() => setFlashing(null), 2000);
    }
  }

  const loadedCount = policies.length;
  const blockedCount = policies.filter(p => p.subs.some(s => s?.status === "BLOCKED")).length;
  const siniestroCount = policies.filter(p => p.subs.some(s => s?.status === "SINIESTRO_PENDIENTE")).length;

  return (
    <div data-testid="seguros-comparative-view" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>

      {/* Header */}
      <div style={{ padding: "14px 18px 10px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textDark, fontFamily: font.ui }}>
              Caso Seguros — Vista Comparativa
            </div>
            <div style={{ fontSize: 9, color: C.textMuted, fontFamily: font.mono, letterSpacing: "0.06em" }}>
              PHENOMENON combinatoria · {loadedCount} pólizas · misma estructura ESS/AG/IF/Opus · 4 modulaciones
            </div>
          </div>
        </div>
        {/* Summary stats */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            [loadedCount, "Pólizas", C.green, "stat-polizas"],
            [blockedCount, "IF_exclusión", C.red, "stat-blocked"],
            [siniestroCount, "Siniestros", "#F59E0B", "stat-siniestros"],
          ].map(([v, l, col, tid]) => (
            <div key={l} data-testid={tid} style={{ fontSize: 9, color: col, fontFamily: font.mono, background: `${col}15`, border: `1px solid ${col}30`, borderRadius: 8, padding: "2px 8px" }}>
              {v} {l}
            </div>
          ))}
          <div style={{ fontSize: 9, color: C.textMuted, fontFamily: font.mono, marginLeft: "auto" }}>
            Ley 50/1980 LCS · PHENOMENON Bloque II IF_exclusion
          </div>
        </div>
      </div>

      {/* Shared structure highlight */}
      <div style={{ padding: "8px 18px", background: C.goldBg, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: C.gold, fontFamily: font.mono, letterSpacing: "0.08em" }}>
          ESTRUCTURA COMÚN (ESS · AG · IF · Opus) —{" "}
          <span style={{ color: C.textMuted, fontWeight: 400 }}>
            partyA (tomador) · partyB (aseguradora) · jurisdiction · effectiveDate · expiryDate
          </span>
          {" "}·{" "}
          <span style={{ color: C.purple }}>IA: ad-actio (cobertura) + non (exclusión IF_posicional)</span>
        </div>
      </div>

      {/* 4-column grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(policies.length, 4)}, 1fr)`, gap: 12, minHeight: 0 }}>
          {policies.map(({ key, cfg, master, subs }) => (
            <PolicyColumn
              key={key}
              policyConfig={cfg}
              master={master}
              subContracts={subs}
              onSelect={onSelectContract}
              onSiniestro={handleSiniestro}
              onUnblock={handleUnblock}
              flashing={flashing && subs.some(s => s?.id === flashing)}
            />
          ))}
        </div>
      </div>

      {/* Footer: IF_exclusion legend */}
      <div style={{ padding: "8px 18px", borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.bgAlt }}>
        <div style={{ fontSize: 9, color: C.textMuted, fontFamily: font.mono, lineHeight: 1.6 }}>
          <span style={{ color: C.red, fontWeight: 700 }}>⛔ IF_EXCLUSION</span>: operador <em>non</em> (Bloque II §4) — el vector de cobertura no puede pasar hasta que la condición posicional (exclusión médica / rating insuficiente / exclusión de daños) sea resuelta.{" "}
          <span style={{ color: "#F59E0B", fontWeight: 700 }}>⚡ SINIESTRO</span>: fase ACTIVE → SINIESTRO_PENDIENTE → INDEMNIZACION_PAGADA | RECHAZO (Bloque III transición de estado).{" "}
          <span style={{ color: "#10B981", fontWeight: 700 }}>🔓 DESBLOQUEO</span>: resolución del IF_exclusion restaura el vector ad-actio sobre COBERTURA.
        </div>
      </div>
    </div>
  );
}
