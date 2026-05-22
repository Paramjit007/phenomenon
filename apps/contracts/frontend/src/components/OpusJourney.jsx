/**
 * OpusJourney — Opus milestone tracker for the PHENOMENON system.
 *
 * User task: Show where a contract ecosystem stands on the path from
 *   PARTIAL (válido entre partes) → COMPLETE (homologado) → OPONIBLE (inscrito).
 *
 * A11y category: status / progress disclosure, no interactive keyboard trap.
 * Perf budget: pure CSS transitions, no external libs, <5KB gz.
 *
 * Props:
 *   master              — master PhenomenonRecord
 *   subContracts        — array of sub-contract records
 *   contracts           — full contracts map { [id]: contract }
 *   onRequestHomologate — () => void — triggers ecosystem homologation
 *   loadContracts       — () => Promise<void>
 *   addLog              — (phase, msg, type?) => void
 */
import { useState, useEffect, useCallback } from "react";
import { C, font, OPUS_LEVELS, getOpusLevel } from "../constants.js";

// ── useReducedMotion — honours prefers-reduced-motion ────────────────────────
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ── ESS field definitions ────────────────────────────────────────────────────
const ESS_KEYS = ["partyA", "partyB", "jurisdiction", "effectiveDate", "expiryDate"];
const ESS_LABELS = {
  partyA: "Parte A",
  partyB: "Parte B",
  jurisdiction: "Jurisdicción",
  effectiveDate: "Fecha de inicio",
  expiryDate: "Fecha de vencimiento",
};

// ── Opus level derivation ────────────────────────────────────────────────────
/**
 * Derive the current Opus level from the master record + sub-contract state.
 * Priority order:
 *   1. registryOffice field present → OPONIBLE
 *   2. opus.homologation === "VALID" → COMPLETE
 *   3. ag.terms.registry present → OPONIBLE
 *   4. All subs COMPLETE + ESS filled → COMPLETE
 *   5. Fallback → PARTIAL
 *
 * @param {object} master
 * @param {object[]} subContracts
 * @returns {"PARTIAL"|"COMPLETE"|"OPONIBLE"}
 */
function deriveOpusLevel(master, subContracts) {
  if (!master) return "PARTIAL";

  // Registry inscription → OPONIBLE (highest)
  const terms = master.ag?.terms ?? {};
  if (terms.registryOffice || terms.registry) return "OPONIBLE";

  // Check sub-contract registry inscription too (KPMG hipoteca)
  const anySubOponible = subContracts.some(
    (c) => c?.ag?.terms?.registryOffice || c?.ag?.terms?.registry,
  );
  if (anySubOponible) return "OPONIBLE";

  // Homologation valid → COMPLETE
  if (master.opus?.homologation === "VALID") return "COMPLETE";

  // All sub-contracts homologated AND ESS filled → COMPLETE
  const essFilledCount = ESS_KEYS.filter((k) => master.ess?.[k]?.trim()).length;
  if (
    essFilledCount === ESS_KEYS.length &&
    subContracts.length > 0 &&
    subContracts.every((c) => c?.opus?.homologation === "VALID" || c?.status === "ACTIVE")
  ) {
    return "COMPLETE";
  }

  return "PARTIAL";
}

// ── ESS completeness ──────────────────────────────────────────────────────────
function essCompleteness(master) {
  if (!master) return { filled: 0, total: ESS_KEYS.length };
  const filled = ESS_KEYS.filter((k) => master.ess?.[k]?.trim()).length;
  return { filled, total: ESS_KEYS.length };
}

// ── Milestone track ───────────────────────────────────────────────────────────
const MILESTONES = [
  { key: "PARTIAL",  icon: "✓", label: "PARTIAL",  subtitle: "Entre partes" },
  { key: "COMPLETE", icon: "◎", label: "COMPLETE", subtitle: "Homologado" },
  { key: "OPONIBLE", icon: "○", label: "OPONIBLE", subtitle: "Erga omnes" },
];
const MILESTONE_ORDER = { PARTIAL: 0, COMPLETE: 1, OPONIBLE: 2 };

// ── Progress bar colour ───────────────────────────────────────────────────────
function barColor(filled, total) {
  if (filled < 3) return C.red;
  if (filled < total) return C.orange;
  return C.green;
}

// ── Action step status ────────────────────────────────────────────────────────
/**
 * @typedef {"done"|"ready"|"blocked"} StepStatus
 */
function deriveSteps(master, subContracts) {
  const { filled, total } = essCompleteness(master);
  const essDone = filled === total;
  const subsDone = subContracts.length > 0;
  const allSubsComplete = subContracts.every(
    (c) => c?.opus?.homologation === "VALID" || c?.status === "ACTIVE",
  );
  const registryFilled =
    master?.ag?.terms?.registryOffice ||
    master?.ag?.terms?.registry ||
    master?.ess?.registryOffice;

  return [
    {
      id: "registrar-ess",
      label: "Registrar campos ESS",
      sublabel: `${filled}/${total} campos`,
      status: essDone ? "done" : "ready",
    },
    {
      id: "generar-subs",
      label: "Generar contratos vinculados",
      sublabel: subsDone ? `${subContracts.length} subcontratos generados` : "Sin subcontratos",
      status: subsDone ? "done" : essDone ? "ready" : "blocked",
    },
    {
      id: "verificar",
      label: "Verificar ecosistema completo",
      sublabel: allSubsComplete ? "Todos verificados" : "Pendiente de homologación",
      status: allSubsComplete ? "done" : essDone && subsDone ? "ready" : "blocked",
      hasButton: !allSubsComplete && essDone && subsDone,
    },
    {
      id: "inscripcion",
      label: "Inscripción Registro Propiedad",
      sublabel: registryFilled
        ? `Ref: ${master?.ag?.terms?.registryOffice ?? "registrado"}`
        : "Referencia registral pendiente",
      status: registryFilled ? "done" : allSubsComplete ? "ready" : "blocked",
      hasInput: allSubsComplete && !registryFilled,
    },
  ];
}

// ── Step icon + colour ────────────────────────────────────────────────────────
const STEP_STYLE = {
  done: { icon: "✓", color: C.green, bg: C.greenBg, border: C.green },
  ready: { icon: "→", color: C.blue, bg: C.blueBg, border: C.blue },
  blocked: { icon: "○", color: C.textLight, bg: C.bgAlt, border: C.border },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function OpusJourney({
  master,
  subContracts,
  contracts,
  onRequestHomologate,
  loadContracts,
  addLog,
}) {
  const reducedMotion = useReducedMotion();

  const [verifying,    setVerifying]    = useState(false);
  const [registryRef,  setRegistryRef]  = useState("");
  const [savingRef,    setSavingRef]    = useState(false);
  const [savedRef,     setSavedRef]     = useState(false);

  const opusLevel    = deriveOpusLevel(master, subContracts ?? []);
  const milestoneIdx = MILESTONE_ORDER[opusLevel] ?? 0;
  const { filled, total } = essCompleteness(master);
  const pct  = total > 0 ? Math.round((filled / total) * 100) : 0;
  const col  = barColor(filled, total);
  const steps = deriveSteps(master, subContracts ?? []);

  // Pre-fill registry ref from master data if available
  useEffect(() => {
    const existing = master?.ag?.terms?.registryOffice ?? master?.ag?.terms?.registry ?? "";
    if (existing && !registryRef) setRegistryRef(existing);
  }, [master?.id]);

  const handleVerify = useCallback(async () => {
    if (verifying) return;
    setVerifying(true);
    try {
      if (addLog) addLog("OPUS", "Iniciando verificación del ecosistema desde OpusJourney…", "opus");
      if (onRequestHomologate) await onRequestHomologate();
      if (loadContracts) await loadContracts();
    } finally {
      setVerifying(false);
    }
  }, [verifying, onRequestHomologate, loadContracts, addLog]);

  const handleSaveRegistry = useCallback(async () => {
    if (!registryRef.trim() || savingRef || !master?.id) return;
    setSavingRef(true);
    try {
      // Import api lazily to avoid circular dep; the import path follows existing pattern
      const { updatePhenomenon } = await import("../api/phenomenon.js");
      await updatePhenomenon(master.id, {
        ag: {
          ...(master.ag ?? {}),
          terms: { ...(master.ag?.terms ?? {}), registryOffice: registryRef.trim() },
        },
      });
      if (addLog) addLog("OPUS", `Ref. registral guardada: ${registryRef.trim()}`, "opus");
      if (loadContracts) await loadContracts();
      setSavedRef(true);
      setTimeout(() => setSavedRef(false), 2000);
    } catch (e) {
      if (addLog) addLog("ERROR", `Error guardando ref. registral: ${e.message}`, "error");
    } finally {
      setSavingRef(false);
    }
  }, [registryRef, savingRef, master, loadContracts, addLog]);

  // ── Milestone track layout constants ───────────────────────────────────────
  // Track has 3 fixed stop positions; we compute the cursor offset
  const TRACK_STOPS = [0, 50, 100]; // percentage positions for PARTIAL, COMPLETE, OPONIBLE
  const cursorPct   = TRACK_STOPS[milestoneIdx] ?? 0;

  if (!master) {
    return (
      <div
        role="status"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.textMuted,
          fontFamily: font.ui,
          fontSize: 13,
        }}
      >
        Sin contrato marco activo.
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        fontFamily: font.ui,
      }}
    >
      {/* ── Header ── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.gold,
            fontFamily: font.mono,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          ◎ OPUS JOURNEY
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.textDark, lineHeight: 1.3 }}>
          {master.name}
        </div>
        {master.ess?.jurisdiction && (
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            📍 {master.ess.jurisdiction}
          </div>
        )}
      </div>

      {/* ── Milestone track ── */}
      <div
        aria-label={`Nivel Opus actual: ${opusLevel}`}
        style={{
          background: C.navyDeep,
          borderRadius: 12,
          padding: "18px 20px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: C.textNavy,
            fontFamily: font.mono,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Bloque IV — Opus del Fenómeno
        </div>

        {/* Track bar + cursor */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          {/* Background rail */}
          <div
            style={{
              height: 4,
              background: C.borderDark,
              borderRadius: 2,
              position: "relative",
            }}
          >
            {/* Fill up to current milestone */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${cursorPct}%`,
                background: OPUS_LEVELS[opusLevel]?.color ?? C.green,
                borderRadius: 2,
                transition: reducedMotion ? "none" : "width 0.6s ease",
              }}
            />
          </div>

          {/* Milestone stops */}
          {MILESTONES.map((m, i) => {
            const isCurrent = i === milestoneIdx;
            const isDone    = i < milestoneIdx;
            const cfg       = OPUS_LEVELS[m.key];
            const leftPct   = TRACK_STOPS[i];
            return (
              <div
                key={m.key}
                style={{
                  position: "absolute",
                  top: -14,
                  left: `${leftPct}%`,
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {/* Circle marker */}
                <div
                  aria-current={isCurrent ? "step" : undefined}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: `2px solid ${isCurrent || isDone ? cfg.color : C.borderDark}`,
                    background: isDone
                      ? cfg.color
                      : isCurrent
                        ? cfg.bg
                        : C.navyDeep,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    color: isDone ? C.white : isCurrent ? cfg.color : C.textNavy,
                    fontWeight: 700,
                    transition: reducedMotion ? "none" : "background 0.4s, border-color 0.4s",
                    flexShrink: 0,
                  }}
                >
                  {isDone ? "✓" : m.icon}
                </div>

                {/* Label block (below track) */}
                <div style={{ textAlign: "center", marginTop: 6 }}>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? cfg.color : isDone ? cfg.color : C.textNavy,
                      fontFamily: font.mono,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {m.label}
                  </div>
                  <div style={{ fontSize: 8, color: C.textNavy, marginTop: 1 }}>
                    {m.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current level badge */}
        {(() => {
          const cfg = OPUS_LEVELS[opusLevel];
          return (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                marginTop: 6,
                padding: "5px 12px",
                background: `${cfg.color}18`,
                border: `1px solid ${cfg.color}50`,
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 15, color: cfg.color }}>{cfg.icon}</span>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: cfg.color,
                    fontFamily: font.mono,
                  }}
                >
                  {opusLevel}
                </div>
                <div style={{ fontSize: 9, color: C.textNavy }}>{cfg.label}</div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── ESS completeness bar ── */}
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDark }}>
            Campos ESS del contrato marco
          </div>
          <div
            style={{
              fontSize: 11,
              color: col,
              fontFamily: font.mono,
              fontWeight: 700,
            }}
          >
            {filled}/{total}
          </div>
        </div>

        {/* Bar */}
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Campos ESS completados: ${filled} de ${total}`}
          style={{
            height: 8,
            background: C.bgAlt,
            borderRadius: 4,
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: col,
              borderRadius: 4,
              transition: reducedMotion ? "none" : "width 0.5s ease",
            }}
          />
        </div>

        {/* ESS field breakdown */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ESS_KEYS.map((k) => {
            const isFilled = !!master.ess?.[k]?.trim();
            return (
              <div
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 5,
                  background: isFilled ? C.greenBg : C.bgAlt,
                  border: `1px solid ${isFilled ? C.green : C.border}`,
                  fontSize: 10,
                  color: isFilled ? C.green : C.textMuted,
                  fontFamily: font.ui,
                }}
              >
                <span>{isFilled ? "✓" : "○"}</span>
                <span>{ESS_LABELS[k]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Action steps ── */}
      <div
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 12,
          }}
        >
          Pasos de activación — Opus
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {steps.map((step, idx) => {
            const s = STEP_STYLE[step.status];
            return (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 14px",
                  background: s.bg,
                  border: `1.5px solid ${s.border}30`,
                  borderRadius: 8,
                  borderLeft: `3px solid ${s.border}`,
                }}
              >
                {/* Step number + icon */}
                <div
                  aria-hidden="true"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: step.status === "done" ? s.color : "transparent",
                    border: `2px solid ${s.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: step.status === "done" ? C.white : s.color,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: step.status === "blocked" ? C.textLight : C.textDark,
                      marginBottom: 2,
                    }}
                  >
                    {step.label}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font.mono }}>
                    {step.sublabel}
                  </div>

                  {/* Verify button */}
                  {step.hasButton && (
                    <button
                      onClick={handleVerify}
                      disabled={verifying}
                      aria-label="Verificar ecosistema completo y ejecutar homologación"
                      style={{
                        marginTop: 8,
                        padding: "7px 14px",
                        background: verifying ? C.borderStrong : C.blue,
                        color: C.white,
                        border: "none",
                        borderRadius: 6,
                        cursor: verifying ? "not-allowed" : "pointer",
                        fontSize: 11,
                        fontFamily: font.ui,
                        fontWeight: 700,
                        transition: "background 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {verifying ? (
                        <>
                          <span aria-hidden="true">⟳</span>
                          <span>Verificando…</span>
                        </>
                      ) : (
                        <>
                          <span aria-hidden="true">⊙</span>
                          <span>Verificar ahora</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Registry input */}
                  {step.hasInput && (
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <label
                        htmlFor="opus-registry-ref"
                        style={{
                          fontSize: 9,
                          color: C.textMuted,
                          fontFamily: font.mono,
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        Ref. registral:
                      </label>
                      <input
                        id="opus-registry-ref"
                        type="text"
                        value={registryRef}
                        onChange={(e) => setRegistryRef(e.target.value)}
                        placeholder="Registro de la Propiedad nº…"
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          fontSize: 11,
                          fontFamily: font.ui,
                          border: `1.5px solid ${C.border}`,
                          borderRadius: 5,
                          background: C.bgInput,
                          color: C.textDark,
                          minWidth: 0,
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRegistry();
                        }}
                      />
                      <button
                        onClick={handleSaveRegistry}
                        disabled={savingRef || !registryRef.trim()}
                        aria-label="Guardar referencia registral"
                        style={{
                          padding: "5px 10px",
                          background: savedRef ? C.green : C.gold,
                          color: "#000",
                          border: "none",
                          borderRadius: 5,
                          cursor: savingRef || !registryRef.trim() ? "not-allowed" : "pointer",
                          fontSize: 11,
                          fontFamily: font.ui,
                          fontWeight: 700,
                          flexShrink: 0,
                          transition: "background 0.2s",
                        }}
                      >
                        {savedRef ? "✓" : savingRef ? "⟳" : "Guardar"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Right status badge */}
                <div
                  style={{
                    fontSize: 10,
                    color: s.color,
                    fontFamily: font.mono,
                    fontWeight: 700,
                    flexShrink: 0,
                    paddingTop: 2,
                  }}
                >
                  {step.status === "done"
                    ? "✓ Hecho"
                    : step.status === "ready"
                      ? "→ Ahora"
                      : "Bloqueado"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sub-contract summary ── */}
      {subContracts.length > 0 && (
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 10,
            }}
          >
            Contratos vinculados — {subContracts.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {subContracts.map((c) => {
              if (!c) return null;
              const level = getOpusLevel(c);
              const cfg   = OPUS_LEVELS[level];
              const isValid = c.opus?.homologation === "VALID" || c.status === "ACTIVE";
              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 10px",
                    background: isValid ? C.greenBg : C.bgAlt,
                    border: `1px solid ${isValid ? C.green : C.border}30`,
                    borderRadius: 7,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      color: cfg.color,
                      fontFamily: font.mono,
                      fontWeight: 700,
                      background: `${cfg.color}15`,
                      padding: "1px 5px",
                      borderRadius: 3,
                      flexShrink: 0,
                    }}
                  >
                    {level === "OPONIBLE" ? "OPO." : level === "COMPLETE" ? "COMP." : "PARC."}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: C.textDark,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: isValid ? C.green : C.orange,
                      fontFamily: font.mono,
                      flexShrink: 0,
                    }}
                  >
                    {isValid ? "✓" : "⏳"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
