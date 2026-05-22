/**
 * CascadePlayground — interactive cascade control for the right stage pane.
 *
 * User task: Let the user pick a field on the master contract, set a new value
 * (EURIBOR via slider, others via text input), preview the cascade impact via
 * the AI analyze endpoint with a 500ms debounce, then execute the real cascade
 * and optionally homologate the full ecosystem.
 *
 * A11y category: interactive form with live region for the feed, all controls
 * keyboard-reachable, labels wired to inputs.
 *
 * Perf budget: component itself is < 10KB gz; no new npm packages.
 *
 * @param {object} props
 * @param {object|null} props.master - the selected master PhenomenonRecord
 * @param {Array} props.subContracts - array of sub-contract records
 * @param {object} props.contracts - full contracts map { [id]: contract }
 * @param {(affectedIds: string[]) => void} props.onCascadeComplete - flash graph nodes
 * @param {(phase: string, msg: string, type?: string) => void} props.addLog
 * @param {() => Promise<void>} props.loadContracts
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { C, font, SUB_META } from "../constants.js";
import * as api from "../api/phenomenon.js";
import ErrorBoundary from "./ErrorBoundary.jsx";

// ─── PMT formula for EURIBOR preview (client-side) ───────────────────────────
function calcPMT(principal, annualRatePct, termYears) {
  const r = (annualRatePct / 100) / 12;
  const n = termYears * 12;
  if (r === 0 || n === 0) return principal / (n || 1);
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

function fmtEur(n) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  }).format(n);
}

function fmtTime() {
  return new Date().toLocaleTimeString("es-ES", { hour12: false });
}

// ─── Chip selector ────────────────────────────────────────────────────────────
const CASCADE_FIELDS = [
  { key: "euribor",      label: "EURIBOR 12M",    essOrTerms: "terms" },
  { key: "jurisdiction", label: "Jurisdiccion",   essOrTerms: "ess" },
  { key: "expiryDate",   label: "Vencimiento",    essOrTerms: "ess" },
  { key: "partyA",       label: "Parte A",        essOrTerms: "ess" },
  { key: "partyB",       label: "Parte B",        essOrTerms: "ess" },
];

function FieldChip({ field, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(field.key)}
      aria-pressed={selected}
      style={{
        padding: "5px 12px",
        borderRadius: 20,
        border: `1.5px solid ${selected ? C.gold : C.border}`,
        background: selected ? C.goldBg : C.bgAlt,
        color: selected ? C.goldDim : C.textMuted,
        fontSize: 11,
        fontFamily: font.ui,
        fontWeight: selected ? 700 : 500,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {field.label}
    </button>
  );
}

// ─── EURIBOR slider ───────────────────────────────────────────────────────────
function EuriborSlider({ value, originalValue, onChange }) {
  const color = value > 5 ? C.red : value > 3.5 ? C.orange : C.green;
  const delta = value - originalValue;
  const deltaSign = delta > 0 ? "+" : "";

  return (
    <div style={{ padding: "14px 16px", background: C.white, borderRadius: 10, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <label
          htmlFor="euribor-slider"
          style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.05em" }}
        >
          EURIBOR 12M
        </label>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: font.mono }}>
            {value.toFixed(2)}%
          </span>
          {Math.abs(delta) >= 0.01 && (
            <div style={{ fontSize: 10, color: delta > 0 ? C.red : C.green, fontFamily: font.mono }}>
              {deltaSign}{delta.toFixed(2)}% vs. {originalValue.toFixed(2)}% base
            </div>
          )}
        </div>
      </div>
      <input
        id="euribor-slider"
        type="range"
        min={0}
        max={10}
        step={0.25}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-valuetext={`${value.toFixed(2)} por ciento`}
        style={{ width: "100%", accentColor: color, cursor: "pointer", height: 4 }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textLight, fontFamily: font.mono, marginTop: 2 }}>
        <span>0%</span>
        <span style={{ color: C.textMuted }}>
          {value > 5 ? "Alto" : value < 2 ? "Bajo" : "Normal"}
        </span>
        <span>10%</span>
      </div>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      background: C.bgAlt, borderRadius: 8, marginBottom: 6, animation: "pulse 1.5s ease infinite" }}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.border, flexShrink: 0 }} />
      <div style={{ flex: 1, height: 10, background: C.border, borderRadius: 4 }} />
      <div style={{ width: 80, height: 10, background: C.border, borderRadius: 4 }} />
    </div>
  );
}

// ─── Impact row ───────────────────────────────────────────────────────────────
function ImpactRow({ contract, isMaster }) {
  const meta  = isMaster ? null : SUB_META[contract?.type];
  const color = isMaster ? C.gold : (meta?.color ?? C.textMuted);
  const icon  = isMaster ? "⬡" : (meta?.icon ?? "○");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
      background: `${color}08`, border: `1px solid ${color}25`,
      borderLeft: `3px solid ${color}`, borderRadius: 7, marginBottom: 5 }}>
      <span style={{ fontSize: 14, color, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textDark, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {contract?.name ?? contract?.type}
        </div>
        <div style={{ fontSize: 9, color: C.textMuted, fontFamily: font.mono }}>
          {isMaster ? "Contrato Marco" : (meta?.short ?? contract?.type)}
        </div>
      </div>
      <span style={{ fontSize: 9, color: C.orange, fontFamily: font.mono, background: `${C.orange}15`,
        padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>
        NEEDS_REVIEW
      </span>
    </div>
  );
}

// ─── Live feed entry ──────────────────────────────────────────────────────────
function FeedEntry({ entry }) {
  const col =
    entry.type === "error"   ? C.red    :
    entry.type === "ai"      ? C.purple :
    entry.type === "opus"    ? C.green  :
    entry.type === "cascade" ? C.orange : C.textNavy;
  return (
    <div style={{ display: "flex", gap: 8, padding: "2px 0", alignItems: "flex-start" }}>
      <span style={{ fontSize: 9, color: C.textNavy, fontFamily: font.mono, flexShrink: 0, minWidth: 50 }}>
        {entry.t}
      </span>
      <span style={{ fontSize: 10, color: col, fontFamily: font.ui, lineHeight: 1.4,
        flex: 1, wordBreak: "break-word" }}>
        {entry.msg}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function CascadePlaygroundInner({
  master,
  subContracts,
  contracts,
  onCascadeComplete,
  addLog,
  loadContracts,
}) {
  // ── Field selection ─────────────────────────────────────────────────────────
  const hasEuribor = master?.ag?.terms?.euribor !== undefined
    || master?.ag?.terms?.euriborRate !== undefined;

  const visibleFields = CASCADE_FIELDS.filter(f => {
    if (f.key === "euribor") return hasEuribor;
    return true;
  });

  const [selectedField, setSelectedField] = useState(() => {
    return hasEuribor ? "euribor" : "jurisdiction";
  });

  // ── Values ──────────────────────────────────────────────────────────────────
  const originalEuribor = parseFloat(
    master?.ag?.terms?.euribor ?? master?.ag?.terms?.euriborRate ?? 3.50
  );
  const [euriborValue, setEuriborValue] = useState(originalEuribor);
  const [textValue, setTextValue] = useState("");

  // Reset text value when switching fields
  useEffect(() => {
    if (selectedField !== "euribor" && master) {
      const fieldDef = CASCADE_FIELDS.find(f => f.key === selectedField);
      const cur = fieldDef?.essOrTerms === "ess"
        ? (master.ess?.[selectedField] ?? "")
        : (master.ag?.terms?.[selectedField] ?? "");
      setTextValue(String(cur));
    }
  }, [selectedField, master]);

  // ── Impact preview (debounced analyzeCascade) ────────────────────────────────
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const debounceRef = useRef(null);

  // Derive old/new values for analysis
  const currentValue = selectedField === "euribor"
    ? euriborValue
    : textValue;

  const originalValue = (() => {
    if (selectedField === "euribor") return originalEuribor;
    const fieldDef = CASCADE_FIELDS.find(f => f.key === selectedField);
    return fieldDef?.essOrTerms === "ess"
      ? (master?.ess?.[selectedField] ?? "")
      : (master?.ag?.terms?.[selectedField] ?? "");
  })();

  const hasChanged = String(currentValue) !== String(originalValue);
  const affectedTypes = subContracts.map(c => c.type).filter(Boolean);

  // Debounced impact preview
  useEffect(() => {
    if (!master || !hasChanged || affectedTypes.length === 0) {
      setAnalysisText(null);
      setAnalysisError(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setAnalyzing(true);
      setAnalysisError(null);
      try {
        const result = await api.analyzeCascade(
          selectedField,
          String(originalValue),
          String(currentValue),
          affectedTypes
        );
        setAnalysisText(result.text || null);
      } catch (e) {
        setAnalysisError("Error al analizar el impacto: " + e.message);
        setAnalysisText(null);
      } finally {
        setAnalyzing(false);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [selectedField, currentValue, master?.id]);

  // ── EURIBOR financial preview ─────────────────────────────────────────────
  const capital   = parseFloat(master?.ag?.terms?.baseAmount ?? master?.ag?.terms?.loanAmount ?? 100_000_000);
  const spread    = parseFloat(master?.ag?.terms?.spread ?? 2.0);
  const termYears = parseFloat(master?.ag?.terms?.termYears ?? master?.ag?.terms?.loanTermYears ?? 20);
  const basePMT   = calcPMT(capital, originalEuribor + spread, termYears);
  const newPMT    = calcPMT(capital, euriborValue + spread, termYears);
  const pmtDelta  = newPMT - basePMT;

  // ── Execution ────────────────────────────────────────────────────────────────
  const [executing, setExecuting] = useState(false);
  const [execError, setExecError] = useState(null);
  const [cascadeDone, setCascadeDone] = useState(false);
  const [affectedIds, setAffectedIds] = useState([]);

  // ── Homologation ──────────────────────────────────────────────────────────
  const [homologating, setHomologating] = useState(false);
  const [homoSuccess, setHomoSuccess] = useState(false);
  const [homoError, setHomoError] = useState(null);

  // ── Local live feed ───────────────────────────────────────────────────────
  const [feed, setFeed] = useState([]);

  const pushFeed = useCallback((msg, type = "cascade") => {
    const entry = { id: Date.now() + Math.random(), t: fmtTime(), msg, type };
    setFeed(prev => [...prev.slice(-7), entry]);
    addLog?.(type.toUpperCase(), msg, type);
  }, [addLog]);

  const feedRef = useRef(null);
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [feed.length]);

  const handleExecute = useCallback(async () => {
    if (!master || !hasChanged) return;
    setExecuting(true);
    setExecError(null);
    setCascadeDone(false);
    setAffectedIds([]);

    const fieldVal = selectedField === "euribor"
      ? String(euriborValue)
      : textValue;

    pushFeed(`Ejecutando cascada: ${selectedField} ${String(originalValue)} → ${fieldVal}`);

    try {
      // For EURIBOR, use updateEuribor which handles the cascade+subs atomically
      let result;
      if (selectedField === "euribor") {
        result = await api.updateEuribor({
          master_id: master.id,
          new_euribor: euriborValue,
          new_spread: spread,
          new_term_years: termYears,
        });
        pushFeed(`EURIBOR actualizado a ${euriborValue}% — propagando…`);
      } else {
        // ESS field change → standard cascade
        const fieldDef = CASCADE_FIELDS.find(f => f.key === selectedField);
        if (fieldDef?.essOrTerms === "ess") {
          await api.updatePhenomenon(master.id, { ess: { [selectedField]: fieldVal } });
        } else {
          const newAg = { ...master.ag, terms: { ...(master.ag?.terms ?? {}), [selectedField]: fieldVal } };
          await api.updatePhenomenon(master.id, { ag: newAg });
        }
        result = await api.triggerCascade(master.id, selectedField, fieldVal);
      }

      const ids = result?.affected_ids ?? [];
      setAffectedIds(ids);

      if (ids.length > 0) {
        pushFeed(`Cascada completada — ${ids.length} contrato(s) en NEEDS_REVIEW`, "cascade");
        ids.forEach(id => {
          const c = contracts[id];
          if (c) pushFeed(`opus  ${c.name} → NEEDS_REVIEW`, "opus");
        });
        onCascadeComplete?.(ids);
      } else {
        pushFeed("Cascada ejecutada — sin cambios propagados", "info");
      }

      await loadContracts();
      setCascadeDone(true);
    } catch (e) {
      setExecError("Error al ejecutar la cascada: " + e.message);
      pushFeed("Error en cascada: " + e.message, "error");
    } finally {
      setExecuting(false);
    }
  }, [master, hasChanged, selectedField, euriborValue, textValue, originalValue,
      spread, termYears, contracts, onCascadeComplete, loadContracts, pushFeed]);

  const handleCancel = useCallback(() => {
    if (selectedField === "euribor") {
      setEuriborValue(originalEuribor);
    } else {
      const fieldDef = CASCADE_FIELDS.find(f => f.key === selectedField);
      const cur = fieldDef?.essOrTerms === "ess"
        ? (master?.ess?.[selectedField] ?? "")
        : (master?.ag?.terms?.[selectedField] ?? "");
      setTextValue(String(cur));
    }
    setAnalysisText(null);
    setExecError(null);
    setCascadeDone(false);
    pushFeed("Cambios cancelados — valores restaurados", "info");
  }, [selectedField, originalEuribor, master]);

  const handleHomologate = useCallback(async () => {
    if (!master) return;
    setHomologating(true);
    setHomoSuccess(false);
    setHomoError(null);
    pushFeed("Iniciando homologacion del ecosistema…", "opus");
    try {
      await api.ecosystemHomologate(master.id);
      await loadContracts();
      setHomoSuccess(true);
      pushFeed("Ecosistema homologado correctamente", "opus");
    } catch (e) {
      setHomoError("Error en homologacion: " + e.message);
      pushFeed("Error en homologacion: " + e.message, "error");
    } finally {
      setHomologating(false);
    }
  }, [master, loadContracts, pushFeed]);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!master) {
    return (
      <div
        role="status"
        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 14, color: C.textMuted, fontFamily: font.ui,
          padding: 32, textAlign: "center" }}
      >
        <div style={{ fontSize: 36, opacity: 0.3 }}>⚡</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textLight }}>
          Selecciona un contrato master para ver el impacto
        </div>
        <div style={{ fontSize: 10, color: C.textLight, fontFamily: font.mono }}>
          CASCADA EN VIVO — Bloque II IF
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex",
      flexDirection: "column", gap: 14, background: C.white }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.textDark, display: "flex",
          alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ color: C.gold }}>⚡</span>
          CASCADA EN VIVO
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font.ui }}>
          <span style={{ fontWeight: 600 }}>{master.name}</span>
          {subContracts.length > 0 && (
            <span style={{ color: C.textLight }}>
              {" "}· {subContracts.length} sub-contrato{subContracts.length !== 1 ? "s" : ""} vinculado{subContracts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Campo selector chips ──────────────────────────────────────────── */}
      <section aria-labelledby="field-selector-label">
        <div id="field-selector-label" style={{ fontSize: 9, fontWeight: 700, color: C.textMuted,
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, fontFamily: font.ui }}>
          Campo a modificar
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="group" aria-label="Seleccionar campo de cascada">
          {visibleFields.map(f => (
            <FieldChip
              key={f.key}
              field={f}
              selected={selectedField === f.key}
              onClick={(key) => {
                setSelectedField(key);
                setAnalysisText(null);
                setExecError(null);
                setCascadeDone(false);
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Input control ──────────────────────────────────────────────────── */}
      <section aria-labelledby="input-control-label">
        <div id="input-control-label" style={{ fontSize: 9, fontWeight: 700, color: C.textMuted,
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, fontFamily: font.ui }}>
          Nuevo valor
        </div>

        {selectedField === "euribor" ? (
          <EuriborSlider
            value={euriborValue}
            originalValue={originalEuribor}
            onChange={v => {
              setEuriborValue(v);
              setExecError(null);
              setCascadeDone(false);
            }}
          />
        ) : (
          <div>
            <label
              htmlFor="cascade-field-input"
              style={{ fontSize: 10, fontWeight: 600, color: C.textMuted,
                fontFamily: font.ui, display: "block", marginBottom: 4 }}
            >
              {CASCADE_FIELDS.find(f => f.key === selectedField)?.label ?? selectedField}
            </label>
            <input
              id="cascade-field-input"
              type="text"
              value={textValue}
              onChange={e => {
                setTextValue(e.target.value);
                setExecError(null);
                setCascadeDone(false);
              }}
              style={{ width: "100%", padding: "8px 12px", fontSize: 13, fontFamily: font.ui,
                border: `1.5px solid ${hasChanged ? C.gold : C.border}`,
                borderRadius: 8, background: C.bgInput, color: C.textDark,
                outline: "none", transition: "border-color 0.15s" }}
              aria-describedby="cascade-field-hint"
            />
            <div id="cascade-field-hint" style={{ fontSize: 9, color: C.textLight,
              fontFamily: font.mono, marginTop: 3 }}>
              Valor actual: {String(originalValue) || "(vacío)"}
            </div>
          </div>
        )}

        {/* EURIBOR financial preview */}
        {selectedField === "euribor" && capital > 0 && Math.abs(pmtDelta) > 100 && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: `${C.purple}08`,
            border: `1px solid ${C.purple}20`, borderRadius: 8, display: "flex",
            justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font.ui }}>
              Cuota mensual estimada
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, fontFamily: font.mono }}>
                {fmtEur(newPMT)}
              </div>
              <div style={{ fontSize: 9, color: pmtDelta > 0 ? C.red : C.green, fontFamily: font.mono }}>
                {pmtDelta > 0 ? "+" : ""}{fmtEur(pmtDelta)}/mes vs. base
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Impact preview ─────────────────────────────────────────────────── */}
      {(analyzing || analysisText || analysisError || subContracts.length > 0) && (
        <section aria-labelledby="impact-label">
          <div id="impact-label" style={{ fontSize: 9, fontWeight: 700, color: C.textMuted,
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, fontFamily: font.ui,
            display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: C.orange }}>⚠</span>
            Impacto previsto
          </div>

          {/* Sub-contract impact rows */}
          {subContracts.length === 0 ? (
            <div style={{ padding: "10px 12px", background: C.bgAlt, borderRadius: 8,
              fontSize: 11, color: C.textLight, fontFamily: font.ui, textAlign: "center" }}>
              Sin sub-contratos vinculados
            </div>
          ) : (
            <div>
              {subContracts.map(c => (
                <ImpactRow key={c.id} contract={c} isMaster={false} />
              ))}
            </div>
          )}

          {/* AI analysis */}
          {analyzing && (
            <div style={{ marginTop: 8 }}>
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}

          {analysisText && !analyzing && (
            <div style={{ marginTop: 8, padding: "10px 12px", background: `${C.blue}08`,
              border: `1px solid ${C.blue}20`, borderLeft: `3px solid ${C.blue}`,
              borderRadius: 8, fontSize: 10, color: C.textBody, lineHeight: 1.65 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.blue, textTransform: "uppercase",
                letterSpacing: "0.06em", marginBottom: 4, fontFamily: font.ui }}>
                Analisis de Impacto IA
              </div>
              {analysisText}
            </div>
          )}

          {analysisError && !analyzing && (
            <div role="alert" style={{ marginTop: 6, padding: "8px 12px", background: C.redBg,
              border: `1px solid ${C.red}25`, borderRadius: 7, fontSize: 10, color: C.red }}>
              {analysisError}
            </div>
          )}

          {/* Risk alert when EURIBOR is high */}
          {selectedField === "euribor" && euriborValue > 6 && (
            <div role="alert" style={{ marginTop: 8, padding: "8px 12px", background: C.redBg,
              border: `1.5px solid ${C.red}40`, borderLeft: `3px solid ${C.red}`,
              borderRadius: 8, fontSize: 10, color: C.red, fontFamily: font.ui }}>
              ⛔ Riesgo alto: EURIBOR {euriborValue.toFixed(2)}% — cobertura de cesion de credito comprometida.
              Verificar ratio cuota/renta.
            </div>
          )}
        </section>
      )}

      {/* ── Execute / Cancel buttons ────────────────────────────────────────── */}
      {hasChanged && !cascadeDone && (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleExecute}
            disabled={executing}
            aria-busy={executing}
            style={{ flex: 1, padding: "11px 14px", background: executing ? C.navyHi : C.navy,
              color: C.gold, border: "none", borderRadius: 8, cursor: executing ? "not-allowed" : "pointer",
              fontSize: 13, fontFamily: font.ui, fontWeight: 700,
              transition: "background 0.15s", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6 }}
          >
            {executing ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>
                Ejecutando…
              </>
            ) : (
              <>⚡ Ejecutar cascada</>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={executing}
            style={{ padding: "11px 14px", background: "none", color: C.textMuted,
              border: `1px solid ${C.border}`, borderRadius: 8, cursor: executing ? "not-allowed" : "pointer",
              fontSize: 12, fontFamily: font.ui }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Inline error */}
      {execError && (
        <div role="alert" style={{ padding: "10px 12px", background: C.redBg,
          border: `1px solid ${C.red}40`, borderRadius: 8, fontSize: 11,
          color: C.red, fontFamily: font.ui }}>
          {execError}
        </div>
      )}

      {/* ── Live feed ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="live-feed-label">
        <div id="live-feed-label" style={{ fontSize: 9, fontWeight: 700, color: C.textMuted,
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
          fontFamily: font.ui, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: executing ? C.orange : C.green }} />
          Motor en vivo
        </div>
        <div
          ref={feedRef}
          role="log"
          aria-live="polite"
          aria-label="Actividad en tiempo real de la cascada"
          style={{ background: C.navyDeep, borderRadius: 8, padding: "10px 12px",
            minHeight: 80, maxHeight: 180, overflowY: "auto", fontFamily: font.mono,
            border: `1px solid ${C.borderDark}` }}
        >
          {feed.length === 0 ? (
            <div style={{ fontSize: 10, color: C.textNavy, opacity: 0.6, fontFamily: font.mono }}>
              Sin actividad — modifica un campo y ejecuta la cascada
            </div>
          ) : (
            feed.map(e => <FeedEntry key={e.id} entry={e} />)
          )}
        </div>
      </section>

      {/* ── Homologar ecosistema (shown after cascade completes) ─────────────── */}
      {cascadeDone && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          {!homoSuccess ? (
            <button
              onClick={handleHomologate}
              disabled={homologating}
              aria-busy={homologating}
              style={{ width: "100%", padding: "11px 14px",
                background: homologating ? C.bgAlt : C.greenBg,
                color: homologating ? C.textMuted : C.green,
                border: `1.5px solid ${homologating ? C.border : C.green}40`,
                borderRadius: 8, cursor: homologating ? "not-allowed" : "pointer",
                fontSize: 13, fontFamily: font.ui, fontWeight: 700,
                transition: "all 0.2s", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6 }}
            >
              {homologating ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>
                  Homologando…
                </>
              ) : (
                <>✓ Homologar ecosistema completo</>
              )}
            </button>
          ) : (
            <div role="status" style={{ padding: "11px 14px", background: C.greenBg,
              border: `1.5px solid ${C.green}40`, borderRadius: 8,
              color: C.green, fontSize: 13, fontFamily: font.ui, fontWeight: 700,
              textAlign: "center" }}>
              ✓ Ecosistema homologado correctamente
            </div>
          )}

          {homoError && (
            <div role="alert" style={{ marginTop: 8, padding: "8px 12px", background: C.redBg,
              border: `1px solid ${C.red}30`, borderRadius: 7,
              fontSize: 10, color: C.red, fontFamily: font.ui }}>
              {homoError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Exported wrapper with ErrorBoundary ──────────────────────────────────────
export default function CascadePlayground(props) {
  return (
    <ErrorBoundary scope="cascade-playground">
      <CascadePlaygroundInner {...props} />
    </ErrorBoundary>
  );
}
