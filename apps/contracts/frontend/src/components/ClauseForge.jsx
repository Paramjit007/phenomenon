/**
 * ClauseForge — Forja IA tab panel.
 *
 * User task: given a selected contract, let the user generate a legal clause
 * via AI, review it, and insert it directly into the contract's AG clauses array.
 *
 * A11y category: form interaction + live region (aria-live="polite" on output).
 * Perf budget: no new npm packages; no chunk additions; shimmer is pure CSS.
 *
 * Layout: 3 equal-height columns — Context (ESS chips) | Prompt (textarea) | Output.
 * Below 500px right-pane width, columns stack vertically.
 *
 * Props:
 *   selectedContract  — the contract the user has selected (contracts[selectedId])
 *   master            — master contract (may equal selectedContract)
 *   contracts         — full contracts map { [id]: contract }
 *   addLog            — addLog(entry)
 *   loadContracts     — () => Promise<void>
 *   onClauseInserted  — (contractId, clauseText) => void  (optional)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { C, font, SUB_META, CONTRACT_TEMPLATES } from "../constants.js";
import { updatePhenomenon, generateClause } from "../api/phenomenon.js";
import ErrorBoundary from "./ErrorBoundary.jsx";

// ─── Strings (i18n-ready) ─────────────────────────────────────────────────────
const S = {
  colContextTitle:    "CONTEXTO ESS",
  colPromptTitle:     "PROMPT",
  colOutputTitle:     "SALIDA",
  partyA:             "Parte A",
  partyB:             "Parte B",
  jurisdiction:       "Jurisdicción",
  effectiveDate:      "Inicio",
  expiryDate:         "Vencimiento",
  leyAplicable:       "Ley aplicable",
  interpolationNote:  "Valores interpolados automáticamente en el prompt →",
  emptyOutput:        "La cláusula generada aparecerá aquí",
  generateBtn:        "✦ Generar cláusula",
  insertBtn:          "↓ Insertar en contrato",
  regenBtn:           "↺ Regenerar",
  discardBtn:         "✕ Descartar",
  successMsg:         "✓ Cláusula insertada",
  generatingLabel:    "Generando cláusula…",
  insertingLabel:     "Insertando…",
  noContractSelected: "Selecciona un contrato en el grafo para usar la Forja IA.",
  errorGeneration:    "Error al generar: ",
  errorInsert:        "Error al insertar: ",
  demoFallback:       "Cláusula generada (demo): Esta cláusula ha sido generada en modo de demostración. En producción, el motor IA de PHENOMENON generará una cláusula jurídicamente precisa conforme al Derecho español aplicable.",
  durationDays:       "días",
};

// ─── useReducedMotion — honours prefers-reduced-motion media query ─────────────
// Copied inline from ContractGraph.jsx (14-line pattern).
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
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

// ─── Utility: compute duration in days between two date strings ───────────────
function daysBetween(a, b) {
  if (!a || !b) return null;
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  if (isNaN(msA) || isNaN(msB)) return null;
  return Math.round(Math.abs(msB - msA) / 86400000);
}

// ─── Utility: look up the applicable law string via SUB_META ─────────────────
// Checks the contract's type field against SUB_META keys, then falls back
// to CONTRACT_TEMPLATES[templateKey].law.
function resolveApplicableLaw(contract) {
  if (!contract) return null;
  // Sub-contract type (e.g. "NDA", "SLA", "PAYMENT")
  const type = contract.type || contract.ag?.terms?.subType;
  if (type && SUB_META[type]) return SUB_META[type].law;
  // Master template key
  const tk = contract.ag?.terms?.templateKey;
  if (tk && CONTRACT_TEMPLATES[tk]) return CONTRACT_TEMPLATES[tk].law;
  return null;
}

// ─── Utility: derive a human-readable clause type label from contract type ────
function clauseTypeLabel(contract) {
  if (!contract) return "confidencialidad";
  const type = contract.type || contract.ag?.terms?.subType;
  if (type && SUB_META[type]) return SUB_META[type].label.toLowerCase();
  const tk = contract.ag?.terms?.templateKey;
  if (tk && CONTRACT_TEMPLATES[tk]) return CONTRACT_TEMPLATES[tk].label.toLowerCase();
  return "obligaciones contractuales";
}

// ─── Smart prompt builder ─────────────────────────────────────────────────────
function buildSmartPrompt(contract, master) {
  const src = contract || master;
  if (!src) return "";

  const ess      = src.ess || {};
  const partyA   = ess.partyA       || "";
  const partyB   = ess.partyB       || "";
  const jur      = ess.jurisdiction  || "";
  const effDate  = ess.effectiveDate || "";
  const expDate  = ess.expiryDate    || "";
  const days     = daysBetween(effDate, expDate);
  const law      = resolveApplicableLaw(src);
  const clause   = clauseTypeLabel(src);

  let prompt = `Genera una cláusula de ${clause} para un acuerdo entre ${partyA || "[Parte A]"} y ${partyB || "[Parte B]"} bajo jurisdicción de ${jur || "[jurisdicción]"}.`;

  if (law) {
    prompt += `\n\nDerecho español. ${law}.`;
  }

  if (days !== null) {
    prompt += `\n\nPlazo: ${days} ${S.durationDays}.`;
  }

  return prompt;
}

// ─── Shimmer skeleton — pure CSS, no external library ─────────────────────────
const SHIMMER_STYLE_ID = "clause-forge-shimmer";

function ensureShimmerStyles() {
  if (document.getElementById(SHIMMER_STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = SHIMMER_STYLE_ID;
  el.textContent = `
    @keyframes clause-forge-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    .cf-shimmer-line {
      background: linear-gradient(
        90deg,
        ${C.border} 25%,
        ${C.bgAlt} 50%,
        ${C.border} 75%
      );
      background-size: 800px 100%;
      animation: clause-forge-shimmer 1.4s ease-in-out infinite;
      border-radius: 4px;
    }
    @media (prefers-reduced-motion: reduce) {
      .cf-shimmer-line {
        animation: none;
        background: ${C.border};
      }
    }
  `;
  document.head.appendChild(el);
}

function ShimmerSkeleton() {
  useEffect(() => { ensureShimmerStyles(); }, []);
  return (
    <div
      aria-label={S.generatingLabel}
      style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}
    >
      <div className="cf-shimmer-line" style={{ height: 14, width: "95%" }} />
      <div className="cf-shimmer-line" style={{ height: 14, width: "80%" }} />
      <div className="cf-shimmer-line" style={{ height: 14, width: "88%" }} />
    </div>
  );
}

// ─── ESS chip ─────────────────────────────────────────────────────────────────
function EssChip({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 9,
        fontFamily: font.mono,
        color: C.textMuted,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: 2,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 12,
        fontWeight: 700,
        color: C.textDark,
        fontFamily: font.ui,
        wordBreak: "break-word",
      }}>
        {value}
      </div>
    </div>
  );
}

// ─── Column wrapper ───────────────────────────────────────────────────────────
function Column({ title, accent, children }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      borderRight: `1px solid ${C.border}`,
    }}>
      {/* Column header */}
      <div style={{
        padding: "8px 12px",
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
        background: C.navyDeep,
      }}>
        <span style={{
          fontSize: 9,
          fontFamily: font.mono,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: accent || C.gold,
          textTransform: "uppercase",
        }}>
          {title}
        </span>
      </div>
      {/* Column body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main ClauseForge component ───────────────────────────────────────────────
/**
 * @param {{ selectedContract: object|null, master: object|null, contracts: object, addLog: Function, loadContracts: Function, onClauseInserted?: Function }} props
 */
export default function ClauseForge({
  selectedContract,
  master,
  contracts,
  addLog,
  loadContracts,
  onClauseInserted,
}) {
  const reducedMotion = useReducedMotion();

  // Resolve the contract to display — fall back to master if nothing selected
  const contract = selectedContract || master || null;

  // ── Prompt state ───────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState(() => buildSmartPrompt(contract, master));

  // ── Output states: idle | loading | generated ──────────────────────────────
  const [outputState, setOutputState]       = useState("idle");   // "idle" | "loading" | "generated"
  const [generatedText, setGeneratedText]   = useState("");       // full AI text
  const [displayCount, setDisplayCount]     = useState(0);        // characters revealed so far
  const [successMsg, setSuccessMsg]         = useState(false);
  const [errorMsg, setErrorMsg]             = useState(null);
  const [inserting, setInserting]           = useState(false);
  const intervalRef = useRef(null);

  // ── Rebuild prompt when contract changes ──────────────────────────────────
  useEffect(() => {
    setPrompt(buildSmartPrompt(contract, master));
    // Reset output when contract selection changes
    setOutputState("idle");
    setGeneratedText("");
    setDisplayCount(0);
    setErrorMsg(null);
    setSuccessMsg(false);
  }, [contract?.id, master?.id]);

  // ── Progressive reveal: start interval when generatedText arrives ─────────
  useEffect(() => {
    if (outputState !== "generated" || !generatedText) return;

    // If reduced motion: show immediately
    if (reducedMotion) {
      setDisplayCount(generatedText.length);
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayCount(0);

    intervalRef.current = setInterval(() => {
      setDisplayCount((prev) => {
        if (prev >= generatedText.length) {
          clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 15);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // Only re-run when we get new generatedText
  }, [generatedText, outputState, reducedMotion]);

  // ── Generation ─────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setOutputState("loading");
    setGeneratedText("");
    setDisplayCount(0);
    setErrorMsg(null);
    setSuccessMsg(false);

    try {
      addLog && addLog({
        id: Date.now(),
        t: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        msg: "Forja IA: generando cláusula…",
        type: "ai",
      });

      const result = await generateClause({ contractId: contract.id, prompt });
      const text = result?.text || "";

      if (result?.error && !text) {
        throw new Error(result.error);
      }

      setGeneratedText(text);
      setOutputState("generated");

      addLog && addLog({
        id: Date.now(),
        t: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        msg: "Forja IA: cláusula generada correctamente",
        type: "ai",
      });
    } catch (err) {
      setOutputState("idle");
      setErrorMsg(S.errorGeneration + (err?.message || String(err)));
      addLog && addLog({
        id: Date.now(),
        t: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        msg: "Forja IA: error al generar — " + (err?.message || String(err)),
        type: "error",
      });
    }
  }, [prompt, contract, master, addLog]);

  // ── Insert into contract ───────────────────────────────────────────────────
  const handleInsert = useCallback(async () => {
    if (!generatedText || !contract?.id) return;
    setInserting(true);
    setErrorMsg(null);

    try {
      const existing = contract?.ag?.clauses || [];
      await updatePhenomenon(contract.id, {
        ag: { clauses: [...existing, generatedText] },
      });
      await loadContracts();
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2000);
      onClauseInserted && onClauseInserted(contract.id, generatedText);
      addLog && addLog({
        id: Date.now(),
        t: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        msg: `Forja IA: cláusula insertada en contrato ${contract.name || contract.id}`,
        type: "opus",
      });
    } catch (err) {
      setErrorMsg(S.errorInsert + (err?.message || String(err)));
      addLog && addLog({
        id: Date.now(),
        t: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        msg: "Forja IA: error al insertar — " + (err?.message || String(err)),
        type: "error",
      });
    } finally {
      setInserting(false);
    }
  }, [generatedText, contract, loadContracts, onClauseInserted, addLog]);

  const handleRegenerate = useCallback(() => {
    setOutputState("idle");
    setGeneratedText("");
    setDisplayCount(0);
    setSuccessMsg(false);
    setErrorMsg(null);
    // Trigger generation on next tick so UI flashes to idle first
    setTimeout(handleGenerate, 0);
  }, [handleGenerate]);

  const handleDiscard = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setOutputState("idle");
    setGeneratedText("");
    setDisplayCount(0);
    setSuccessMsg(false);
    setErrorMsg(null);
  }, []);

  // ── Empty state: no contract ──────────────────────────────────────────────
  if (!contract) {
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
          padding: 32,
          color: C.textMuted,
          fontFamily: font.ui,
          fontSize: 13,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.3 }}>✦</div>
        <div>{S.noContractSelected}</div>
      </div>
    );
  }

  // ── Resolve ESS ───────────────────────────────────────────────────────────
  const ess    = contract.ess  || master?.ess  || {};
  const law    = resolveApplicableLaw(contract);
  const days   = daysBetween(ess.effectiveDate, ess.expiryDate);
  const visibleText = outputState === "generated"
    ? generatedText.slice(0, displayCount)
    : "";

  // ── Action button styles ─────────────────────────────────────────────────
  const btnBase = {
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 11,
    fontFamily: font.ui,
    fontWeight: 600,
    padding: "6px 12px",
    transition: "opacity 0.15s",
  };

  return (
    <ErrorBoundary scope="clause-forge">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          background: C.bg,
        }}
      >
        {/* ── 3-column body ─────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
          }}
        >

          {/* ── Column 1: CONTEXTO ESS ─────────────────────────────────── */}
          <Column title={S.colContextTitle} accent={C.gold}>
            <EssChip label={S.partyA}       value={ess.partyA} />
            <EssChip label={S.partyB}       value={ess.partyB} />
            <EssChip label={S.jurisdiction} value={ess.jurisdiction} />
            <EssChip label={S.effectiveDate} value={ess.effectiveDate} />
            <EssChip label={S.expiryDate}   value={ess.expiryDate} />
            {days !== null && (
              <EssChip label="Duración" value={`${days} ${S.durationDays}`} />
            )}
            {law && (
              <div style={{ marginTop: 8, marginBottom: 10 }}>
                <div style={{
                  fontSize: 9,
                  fontFamily: font.mono,
                  color: C.textMuted,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}>
                  {S.leyAplicable}
                </div>
                <div style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.gold,
                  fontFamily: font.mono,
                  background: C.goldBg,
                  border: `1px solid ${C.goldLight}60`,
                  borderRadius: 4,
                  padding: "2px 7px",
                  wordBreak: "break-word",
                }}>
                  {law}
                </div>
              </div>
            )}
            <div style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: `1px dashed ${C.border}`,
              fontSize: 9,
              color: C.textLight,
              fontFamily: font.ui,
              lineHeight: 1.5,
            }}>
              {S.interpolationNote}
            </div>
          </Column>

          {/* ── Column 2: PROMPT ─────────────────────────────────────────── */}
          <Column title={S.colPromptTitle} accent={C.cyan}>
            <label
              htmlFor="clause-forge-prompt"
              style={{
                display: "block",
                fontSize: 10,
                fontFamily: font.ui,
                color: C.textMuted,
                marginBottom: 6,
              }}
            >
              Instrucción para el motor IA
            </label>
            <textarea
              id="clause-forge-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={10}
              disabled={outputState === "loading"}
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: 12,
                fontFamily: font.mono,
                color: C.textDark,
                background: C.bgInput,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                resize: "vertical",
                outline: "none",
                lineHeight: 1.55,
                boxSizing: "border-box",
                opacity: outputState === "loading" ? 0.6 : 1,
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.target.style.borderColor = C.gold; }}
              onBlur={(e)  => { e.target.style.borderColor = C.border; }}
              aria-label="Prompt para generación de cláusula"
            />

            {/* Error message from generation */}
            {errorMsg && (
              <div
                role="alert"
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  background: C.redBg,
                  border: `1px solid ${C.red}40`,
                  borderRadius: 6,
                  fontSize: 11,
                  color: C.red,
                  fontFamily: font.ui,
                  lineHeight: 1.4,
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={outputState === "loading" || !prompt.trim()}
              aria-busy={outputState === "loading"}
              style={{
                ...btnBase,
                marginTop: 10,
                width: "100%",
                background: outputState === "loading" ? C.borderStrong : C.navy,
                color: outputState === "loading" ? C.textMuted : C.gold,
                fontSize: 12,
                padding: "9px 12px",
                cursor: outputState === "loading" || !prompt.trim() ? "not-allowed" : "pointer",
                opacity: !prompt.trim() ? 0.5 : 1,
              }}
            >
              {outputState === "loading" ? S.generatingLabel : S.generateBtn}
            </button>
          </Column>

          {/* ── Column 3: SALIDA ─────────────────────────────────────────── */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              // No right border — it's the last column
            }}
          >
            {/* Column header */}
            <div style={{
              padding: "8px 12px",
              borderBottom: `1px solid ${C.border}`,
              flexShrink: 0,
              background: C.navyDeep,
            }}>
              <span style={{
                fontSize: 9,
                fontFamily: font.mono,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: C.green,
                textTransform: "uppercase",
              }}>
                {S.colOutputTitle}
              </span>
            </div>

            {/* Output area — aria-live so screen readers announce new text */}
            <div
              role="status"
              aria-live="polite"
              aria-label="Cláusula generada"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 12,
              }}
            >
              {outputState === "idle" && (
                <div
                  style={{
                    height: "100%",
                    minHeight: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px dashed ${C.border}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: C.textLight,
                    fontFamily: font.ui,
                    textAlign: "center",
                    padding: 16,
                    boxSizing: "border-box",
                  }}
                >
                  {S.emptyOutput}
                </div>
              )}

              {outputState === "loading" && <ShimmerSkeleton />}

              {outputState === "generated" && (
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: font.ui,
                    color: C.textDark,
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    minHeight: 80,
                  }}
                >
                  {visibleText}
                  {/* Blinking cursor while still revealing (unless reduced motion) */}
                  {!reducedMotion && displayCount < generatedText.length && (
                    <span
                      aria-hidden="true"
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: "1em",
                        background: C.gold,
                        marginLeft: 2,
                        verticalAlign: "text-bottom",
                        animation: "none", // intentionally no blink — motion already reduced by not being a full animation
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Action buttons — only when generated text is present */}
            {outputState === "generated" && (
              <div
                style={{
                  padding: "8px 12px",
                  borderTop: `1px solid ${C.border}`,
                  flexShrink: 0,
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  alignItems: "center",
                  background: C.bgAlt,
                }}
              >
                {/* Success message */}
                {successMsg && (
                  <span
                    role="status"
                    aria-live="polite"
                    style={{
                      fontSize: 11,
                      color: C.green,
                      fontFamily: font.ui,
                      fontWeight: 700,
                      marginRight: 4,
                    }}
                  >
                    {S.successMsg}
                  </span>
                )}

                <button
                  onClick={handleInsert}
                  disabled={inserting || !contract?.id}
                  aria-busy={inserting}
                  style={{
                    ...btnBase,
                    background: C.green,
                    color: C.white,
                    cursor: inserting || !contract?.id ? "not-allowed" : "pointer",
                    opacity: inserting ? 0.7 : 1,
                  }}
                >
                  {inserting ? S.insertingLabel : S.insertBtn}
                </button>

                <button
                  onClick={handleRegenerate}
                  disabled={outputState === "loading"}
                  style={{
                    ...btnBase,
                    background: C.navy,
                    color: C.textNavy,
                    cursor: "pointer",
                  }}
                >
                  {S.regenBtn}
                </button>

                <button
                  onClick={handleDiscard}
                  style={{
                    ...btnBase,
                    background: "transparent",
                    color: C.textMuted,
                    border: `1px solid ${C.border}`,
                    cursor: "pointer",
                  }}
                >
                  {S.discardBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
