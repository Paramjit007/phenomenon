import { useState, useEffect, useRef, useCallback } from "react";
import { C, font, SUB_META, SUB_FIELDS, IA_TYPES, statusColor, statusLabel, theoreticalState, CAMPO_LABELS, OPUS_LEVELS, getOpusLevel, SUB_CASCADE_FIELDS } from "../constants.js";
import * as api from "../api/phenomenon.js";
import RiskPanel, { detectRisks, getRiskLevel, RISK_ICONS } from "./RiskEngine.jsx";
import ClauseLibrary from "./ClauseLibrary.jsx";

// ─── Sub-components ──────────────────────────────────────────────────────────

const ONTOLOGY_BADGES = {
  cosa:    { label: "COSA", color: "#92400E", bg: "#FFF7ED" },
  bien:    { label: "BIEN", color: "#1D4ED8", bg: "#EFF6FF" },
  neither: { label: "NEUTRO", color: "#6B7280", bg: "#F3F4F6" },
};

function FieldInput({ field, value, onChange }) {
  const [focused, setFocused] = useState(false);
  const empty = !value?.toString()?.trim();
  const borderColor = focused ? C.gold : empty ? C.orange : C.border;
  const base = {
    width: "100%", padding: "7px 10px", fontSize: 13, fontFamily: font.ui,
    border: `1px solid ${borderColor}`, borderRadius: 6,
    background: empty ? C.orangeBg : C.white, color: C.textDark,
    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: focused ? "0 0 0 3px rgba(201,168,76,0.2)" : empty ? `0 0 0 3px ${C.orange}18` : "none",
    lineHeight: 1.5,
    minHeight: 36,
    boxSizing: "border-box",
  };

  const focusHandlers = {
    onFocus: () => setFocused(true),
    onBlur:  () => setFocused(false),
  };

  if (field.type === "select") return (
    <select value={value ?? ""} onChange={e => onChange(e.target.value)} style={{ ...base, cursor: "pointer" }} {...focusHandlers}>
      <option value="">— seleccionar —</option>
      {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  if (field.type === "textarea") return (
    <textarea
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder ?? ""}
      rows={4}
      style={{ ...base, resize: "vertical", lineHeight: 1.65, minHeight: 80 }}
      {...focusHandlers}
    />
  );

  return (
    <input
      type={field.type ?? "text"}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder ?? ""}
      style={base}
      {...focusHandlers}
    />
  );
}

function FieldBadges({ field }) {
  const ontology = field.ontologyTag ? ONTOLOGY_BADGES[field.ontologyTag] : null;
  return (
    <>
      {ontology && (
        <span style={{ fontSize: 7.5, color: ontology.color, fontFamily: font.mono, background: ontology.bg, padding: "1px 4px", borderRadius: 3 }}>
          {ontology.label}
        </span>
      )}
      {field.key === "jurisdiction" && <span style={{ fontSize: 7.5, color: C.blue, fontFamily: font.mono, background: C.blueBg, padding: "1px 4px", borderRadius: 3 }}>IST·Espacio</span>}
      {(field.key === "effectiveDate" || field.key === "expiryDate") && <span style={{ fontSize: 7.5, color: C.blue, fontFamily: font.mono, background: C.blueBg, padding: "1px 4px", borderRadius: 3 }}>IST·Tiempo</span>}
    </>
  );
}

function FieldNote({ field }) {
  if (!field.note) return null;
  return (
    <div style={{ marginTop: 5, fontSize: 10, color: C.textMuted, fontFamily: font.ui, lineHeight: 1.55 }}>
      {field.note}
    </div>
  );
}

function SectionBlock({ title, subtitle, color, children, forceOpen = false, fieldCount }) {
  const [open, setOpen] = useState(true);
  const isOpen = open || forceOpen;
  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      marginBottom: 8,
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: C.bgAlt, border: "none",
          cursor: "pointer", padding: "8px 14px",
          borderRadius: isOpen ? "8px 8px 0 0" : 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 9, color, flexShrink: 0 }}>{color === C.gold ? "⬡" : color === C.purple ? "⊙" : color === C.blue ? "⚙" : "◈"}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.8px" }}>{title}</span>
          {subtitle && <span style={{ fontSize: 10, color: C.textLight, fontFamily: font.ui }}>{subtitle}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {fieldCount != null && (
            <span style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "1px 7px", fontSize: 9, color: C.textMuted, fontFamily: font.mono }}>
              {fieldCount}
            </span>
          )}
          <span style={{ fontSize: 11, color: C.textMuted }}>{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>
      <div style={{ display: isOpen ? "block" : "none" }}>
        {children}
      </div>
    </div>
  );
}

function ClauseEditor({ clauses, onChange, contractType, showLibrary, onToggleLibrary }) {
  const dropRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function update(i, val) { const n = [...clauses]; n[i] = val; onChange(n); }
  function remove(i) { onChange(clauses.filter((_, j) => j !== i)); }
  function add(text = "") { onChange([...clauses, text]); }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type === "clause" && data.text) add(data.text);
    } catch (_) {}
  }

  return (
    <div>
      {/* Clause list with drop zone */}
      <div
        ref={dropRef}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          minHeight: 60,
          border: dragOver ? `2px dashed ${C.blue}` : "2px dashed transparent",
          borderRadius: 6,
          background: dragOver ? C.blueBg : "transparent",
          transition: "all 0.2s",
          padding: dragOver ? 8 : 0,
        }}
      >
        {dragOver && (
          <div style={{ textAlign: "center", fontSize: 12, color: C.blue, fontFamily: font.ui, padding: "12px 0" }}>
            Suelta aquí para añadir la cláusula
          </div>
        )}

        {!dragOver && clauses.map((cl, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: font.mono, paddingTop: 11, minWidth: 24, textAlign: "right", flexShrink: 0 }}>
              {i + 1}.
            </span>
            <textarea
              value={cl}
              onChange={e => update(i, e.target.value)}
              rows={Math.max(2, Math.ceil(cl.length / 90))}
              style={{ flex: 1, padding: "8px 10px", fontSize: 13, fontFamily: font.serif, border: `1px solid ${C.border}`, borderRadius: 6, background: C.bgInput, color: C.textDark, resize: "vertical", outline: "none", lineHeight: 1.65 }}
            />
            <button onClick={() => remove(i)} title="Eliminar"
              style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 18, paddingTop: 8, flexShrink: 0, opacity: 0.6 }}>×</button>
          </div>
        ))}
      </div>

      {!dragOver && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={() => add()}
            style={{ fontSize: 12, color: C.blue, background: "none", border: `1px dashed ${C.blue}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontFamily: font.ui, flex: 1 }}>
            + Añadir cláusula vacía
          </button>
          <button onClick={onToggleLibrary}
            style={{ fontSize: 12, color: showLibrary ? C.blue : C.textMuted, background: showLibrary ? C.blueBg : "none", border: `1px solid ${showLibrary ? C.blue : C.border}`, borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontFamily: font.ui, whiteSpace: "nowrap" }}>
            📚 {showLibrary ? "Cerrar biblioteca" : "Abrir biblioteca"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function ContractDetailPanel({ contractId, contracts, master, template, onUpdateContract, onGenerateSub, onClose, onDelete, onHomologate, generating, jumpToField, onJumpHandled, allContracts, onSubCascade, onFieldEditing, onImpactDetected }) {
  const contract = contracts[contractId];
  const isMaster = contract && !contract.parentId;
  const meta     = contract ? (SUB_META[contract.type] ?? null) : null;
  const color    = isMaster ? C.gold : (meta?.color ?? C.textMuted);
  const subFields = !isMaster ? (SUB_FIELDS[contract?.type] ?? []) : [];

  const [panelWidth, setPanelWidth] = useState(560);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showExpandDrawer, setShowExpandDrawer] = useState(false);
  const [resizeHover, setResizeHover] = useState(false);
  const resizeRef = useRef({ active: false, startX: 0, startW: 0 });

  const [localEss,     setLocalEss]     = useState({});
  const [localTerms,   setLocalTerms]   = useState({});
  const [localClauses, setLocalClauses] = useState([]);
  const [localIA,      setLocalIA]      = useState([]);
  const [saving,        setSaving]       = useState(false);
  const [saved,         setSaved]        = useState(false);
  const [error,         setError]        = useState(null);
  const [homoResult,    setHomoResult]   = useState(null);
  const [homoRunning,   setHomoRunning]  = useState(false);
  const [opusData,      setOpusData]     = useState(null);
  const [regForm,       setRegForm]      = useState({ open: false, registry: "", date: "", legal: "" });
  const [regSaving,     setRegSaving]    = useState(false);
  const [iaEdited,      setIaEdited]     = useState(false); // tracks if user changed IA
  const [highlightKey,  setHighlightKey] = useState(null);
  const fieldRefs  = useRef({});
  const scrollBody = useRef(null);
  const debounce = useRef({});

  useEffect(() => {
    if (!contract) return;
    setLocalEss(contract.ess ?? {});
    setLocalTerms(contract.ag?.terms ?? {});
    setLocalClauses(contract.ag?.clauses ?? []);
    setLocalIA(contract.ia_instances ?? []);
    setError(null);
    setHomoResult(null);
    setOpusData(null);
    setRegForm({ open: false, registry: "", date: "", legal: "" });
    setIaEdited(false);
  }, [contractId, contract?.status]);

  // Auto-navigate when parent passes a jumpToField (from VerificationPanel)
  useEffect(() => {
    if (jumpToField) {
      navigateToField(jumpToField);
      onJumpHandled?.();
    }
  }, [jumpToField]);

  // Navigate to a specific field (from clicking a check error or risk item)
  const navigateToField = useCallback((key) => {
    setHighlightKey(key);
    // Delay scroll so forceOpen can re-render any collapsed section first
    setTimeout(() => {
      const el = fieldRefs.current[key];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus?.();
      }
    }, 200);
    setTimeout(() => setHighlightKey(null), 3000);
  }, []);

  // Resize handlers — drag left edge, range 300–1400px
  const startResize = useCallback((e) => {
    e.preventDefault();
    resizeRef.current = { active: true, startX: e.clientX, startW: panelWidth };
    const move = (e2) => {
      if (!resizeRef.current.active) return;
      const delta = resizeRef.current.startX - e2.clientX;
      setPanelWidth(Math.min(1400, Math.max(300, resizeRef.current.startW + delta)));
    };
    const up = () => {
      resizeRef.current.active = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, [panelWidth]);

  // Double-click handle → toggle between comfortable (560) and maximised (1200)
  const toggleMaximise = useCallback(() => {
    setPanelWidth(w => w >= 900 ? 560 : 1200);
  }, []);

  // Responsive grid columns — more columns when panel is wide
  const gridCols = panelWidth < 480 ? "1fr" : panelWidth > 780 ? "1fr 1fr 1fr" : "1fr 1fr";

  const activeTemplate = isMaster ? template : null;
  const requiredFields = isMaster ? (activeTemplate?.requiredEss ?? []) : [
    { key: "partyA",        label: "Parte A",            placeholder: "—" },
    { key: "partyB",        label: "Parte B",            placeholder: "—" },
    { key: "jurisdiction",  label: "Jurisdicción",        placeholder: "Madrid" },
    { key: "effectiveDate", label: "Fecha de Inicio",    type: "date" },
    { key: "expiryDate",    label: "Fecha de Vencimiento", type: "date" },
  ];
  const partyFields    = isMaster ? (activeTemplate?.partyFields ?? [])    : [];
  const contractFields = isMaster ? (activeTemplate?.contractFields ?? []) : [];

  const filled   = requiredFields.filter(f => localEss[f.key]?.toString()?.trim()).length;
  const allFilled = filled === requiredFields.length && requiredFields.length > 0;

  function handleEssChange(key, val) {
    const oldVal = localEss[key] ?? "";
    setLocalEss(prev => ({ ...prev, [key]: val }));
    // Signal graph IMMEDIATELY (no debounce) — instant visual feedback
    onFieldEditing?.(contractId, key, val);
    clearTimeout(debounce.current[key]);
    debounce.current[key] = setTimeout(async () => {
      try {
        await onUpdateContract(contractId, { ess: { [key]: val } });
        // Notify impact panel after save completes
        onImpactDetected?.({ contractId, field: key, fieldLabel: key, oldValue: oldVal, newValue: val, group: "ess" });
      }
      catch (e) { setError(e.message); }
    }, 700);
  }

  function handleTermChange(key, val) {
    const oldVal = localTerms[key] ?? "";
    setLocalTerms(prev => ({ ...prev, [key]: val }));
    // Signal graph IMMEDIATELY
    onFieldEditing?.(contractId, key, val);
    clearTimeout(debounce.current["term_" + key]);
    debounce.current["term_" + key] = setTimeout(async () => {
      const newAg = { clauses: localClauses, terms: { ...localTerms, [key]: val } };
      try {
        await onUpdateContract(contractId, { ag: newAg });
        const contract = contracts[contractId];
        if (contract?.parentId && onSubCascade) {
          const cascadeFields = SUB_CASCADE_FIELDS[contract.type] ?? [];
          if (cascadeFields.includes(key)) onSubCascade(contractId, key, val);
        }
        // Notify impact panel after save completes
        onImpactDetected?.({ contractId, field: key, fieldLabel: key, oldValue: oldVal, newValue: val, group: "terms" });
      } catch (e) { setError(e.message); }
    }, 700);
  }

  async function handleSave() {
    setSaving(true); setError(null);
    try {
      // Only include ia_instances if the user explicitly interacted with them
      // (iaEdited flag). This prevents accidentally clearing them on a plain field save.
      const payload = {
        ess: localEss,
        ag: { clauses: localClauses, terms: localTerms },
        ...(iaEdited ? { ia_instances: localIA } : {}),
      };
      await onUpdateContract(contractId, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function addIA(type) {
    const def = IA_TYPES[type];
    if (!def) return;
    const incompatible = localIA.filter(e => !def.compatible.includes(e));
    if (incompatible.length) { setError(`"${type}" incompatible con: ${incompatible.join(", ")}. Operadores compatibles: ${def.compatible.join(", ")}.`); return; }
    setLocalIA(prev => [...prev, type]);
    setIaEdited(true);
    setError(null);
  }

  const existingTypes  = (master?.children ?? []).map(id => contracts[id]?.type).filter(Boolean);
  const pendingTypes   = isMaster ? (template?.autoGenerates ?? []).filter(t => !existingTypes.includes(t)) : [];
  const contractType   = isMaster ? "MASTER" : (contract?.type ?? "GENERAL");

  if (!contract) return null;

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100%", flex: 1, overflow: "hidden" }}>

      {/* Main panel — fills the parent (App controls total width via rightW) */}
      <div style={{ flex: 1, background: C.white, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: C.white, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, borderBottom: `1px solid ${C.border}`, minHeight: 56 }}>
          <span style={{ fontSize: 20, color }}>{isMaster ? "⬡" : (meta?.icon ?? "○")}</span>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.textDark, fontFamily: font.ui, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contract.name}</div>
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font.ui, marginTop: 2 }}>
              {isMaster
                ? `Master · ${(Object.values(contracts).filter(c => c.parentId === contractId).length)} sub-contratos vinculados`
                : (meta?.law ?? contractType)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Opus status badge */}
            {(() => {
              const level = contract.opus?.status ?? "PARTIAL";
              const isOponible = level === "OPONIBLE";
              const isComplete = level === "COMPLETE";
              const badgeBg    = isOponible ? C.greenBg  : isComplete ? C.goldBg  : C.orangeBg;
              const badgeBdr   = isOponible ? `${C.green}44` : isComplete ? `${C.gold}44` : `${C.orange}44`;
              const badgeColor = isOponible ? C.green    : isComplete ? C.goldDim : C.orange;
              const badgeLabel = isOponible ? "● OPONIBLE" : isComplete ? "● COMPLETO" : "● PARCIAL";
              return (
                <span style={{ background: badgeBg, border: `1px solid ${badgeBdr}`, color: badgeColor, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, fontFamily: font.ui, whiteSpace: "nowrap" }}>
                  {badgeLabel}
                </span>
              );
            })()}
            <button
              onClick={() => setShowExpandDrawer(true)}
              style={{
                background: C.bgAlt,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                color: C.textMuted,
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: font.ui,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              ⤢ Expandir
            </button>
            <button onClick={onClose} style={{ background: C.bgAlt, border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        </div>

        {/* Needs-review alert */}
        {contract.status === "NEEDS_REVIEW" && (
          <div style={{ background: C.orangeBg, borderBottom: `1px solid ${C.orange}30`, padding: "10px 18px", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: C.orange, fontSize: 15 }}>⚠</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.orange, fontFamily: font.ui }}>Requiere revisión</div>
                <div style={{ fontSize: 12, color: C.textBody, fontFamily: font.ui, marginTop: 2, lineHeight: 1.5 }}>
                  Un campo del contrato marco ha cambiado. Revise las cláusulas y regenere si es necesario.
                </div>
              </div>
              {!isMaster && (
                <button onClick={async () => {
                  await onDelete(contractId);
                  onGenerateSub(contract.type, master?.ess ?? localEss, template?.iaDefaults);
                  onClose();
                }} style={{ background: C.orange, color: C.white, border: "none", borderRadius: 5, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontFamily: font.ui, fontWeight: 600, whiteSpace: "nowrap" }}>
                  ⟳ Regenerar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error panel */}
        {error && (
          <div style={{ background: C.redBg, borderBottom: `1px solid ${C.red}20`, padding: "10px 18px", flexShrink: 0 }}>
            <div style={{ fontSize: 13, color: C.red, fontFamily: font.ui, fontWeight: 600, marginBottom: 3 }}>Error</div>
            <div style={{ fontSize: 12, color: C.textBody, fontFamily: font.ui, lineHeight: 1.5 }}>{error}</div>
            {(error.includes("503") || error.includes("API") || error.includes("api_key")) && (
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font.mono, marginTop: 5, padding: "6px 8px", background: C.white, borderRadius: 4, border: `1px solid ${C.border}` }}>
                <strong>Solución:</strong> Añada ANTHROPIC_API_KEY en el archivo .env y ejecute <code>docker compose restart backend</code>
              </div>
            )}
            {error.includes("incompatible") && (
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font.ui, marginTop: 5 }}>
                Sugerencia: Elimine los operadores IA en conflicto antes de añadir el nuevo.
              </div>
            )}
            <button onClick={() => setError(null)} style={{ marginTop: 6, fontSize: 10, color: C.red, background: "none", border: "none", cursor: "pointer", fontFamily: font.ui }}>Cerrar ×</button>
          </div>
        )}

        {/* Progress bar */}
        <div style={{ padding: "10px 18px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: font.ui }}>
              {filled}/{requiredFields.length} campos obligatorios
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: allFilled ? C.green : C.gold, fontFamily: font.mono }}>
              {requiredFields.length ? Math.round(filled / requiredFields.length * 100) : 0}%
            </span>
          </div>
          <div style={{ height: 4, background: C.bgAlt, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", background: allFilled ? C.green : C.gold, width: `${requiredFields.length ? (filled / requiredFields.length) * 100 : 0}%`, borderRadius: 2, transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={scrollBody} style={{ flex: 1, overflowY: "auto", padding: "18px 22px", background: C.bg }}>
        <style>{`
          @keyframes fieldPulse {
            0%   { box-shadow: 0 0 0 0 ${C.orange}80; }
            50%  { box-shadow: 0 0 0 8px ${C.orange}20; }
            100% { box-shadow: 0 0 0 0 ${C.orange}00; }
          }
        `}</style>

          {/* Elementos Esenciales del Contrato */}
          <SectionBlock
            title="ESS — Identidad Estable"
            subtitle="Art. 1261 CC · novación si se modifican"
            color={color}
            forceOpen={!!highlightKey}
            fieldCount={`${filled}/${requiredFields.length} · ${allFilled ? "todos ✓" : "pendientes"}`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "10px 14px" }}>
              {requiredFields.map(f => {
                const isHl = highlightKey === f.key;
                return (
                  <div key={f.key}
                    ref={el => { if (el) fieldRefs.current[f.key] = el; }}
                    style={{ gridColumn: f.type === "textarea" ? "1/-1" : undefined, borderRadius: 8, outline: isHl ? `3px solid ${C.orange}` : "none", outlineOffset: 3, animation: isHl ? "fieldPulse 0.7s ease 3" : "none", transition: "outline 0.2s", background: isHl ? `${C.orange}10` : "transparent", padding: isHl ? "8px" : "0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: isHl ? C.orange : C.textMuted, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.3px" }}>{f.label}</label>
                        <FieldBadges field={f} />
                      </div>
                      {!localEss[f.key]?.toString()?.trim() && <span style={{ fontSize: 10, color: C.orange, fontFamily: font.mono }}>Requerido</span>}
                    </div>
                    <FieldInput field={f} value={localEss[f.key] ?? ""} onChange={v => handleEssChange(f.key, v)} />
                    <FieldNote field={f} />
                  </div>
                );
              })}
            </div>
          </SectionBlock>

          {/* Party details */}
          {partyFields.length > 0 && (
            <SectionBlock title="AG — Datos Registrales de las Partes" color={C.textMuted} forceOpen={!!highlightKey} fieldCount={partyFields.length}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 14px" }}>
                {partyFields.map(f => {
                  const isHl = highlightKey === f.key;
                  return (
                    <div key={f.key} ref={el => { if (el) fieldRefs.current[f.key] = el; }}
                      style={{ gridColumn: f.type === "textarea" ? "1/-1" : undefined, borderRadius: 8, outline: isHl ? `3px solid ${C.orange}` : "none", outlineOffset: 3, animation: isHl ? "fieldPulse 0.7s ease 3" : "none", background: isHl ? `${C.orange}10` : "transparent", padding: isHl ? "8px" : "0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: isHl ? C.orange : C.textMuted, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.3px", display: "block" }}>{f.label}</label>
                        <FieldBadges field={f} />
                      </div>
                      <FieldInput field={f} value={localTerms[f.key] ?? ""} onChange={v => handleTermChange(f.key, v)} />
                      <FieldNote field={f} />
                    </div>
                  );
                })}
              </div>
            </SectionBlock>
          )}

          {/* Additional parties (novación subjetiva — added via Ecosystem panel) */}
          {(localTerms.additionalParties ?? []).length > 0 && (
            <SectionBlock
              title={`Partes Adicionales — Novación Subjetiva (${(localTerms.additionalParties ?? []).length})`}
              subtitle="Art. 1203 CC · Partes añadidas al ecosistema contractual"
              color={C.purple}
              forceOpen={!!highlightKey}
              fieldCount={(localTerms.additionalParties ?? []).length}>
              <div style={{ padding: "10px 14px" }}>
              {(localTerms.additionalParties ?? []).map((party, idx) => (
                <div key={idx} style={{ marginBottom:14, padding:"12px 14px", background:`${C.purple}06`,
                  border:`1px solid ${C.purple}25`, borderRadius:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:C.purple,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:13, fontWeight:700, color:C.white, flexShrink:0 }}>
                      {party.role}
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.purple }}>
                      Parte {party.role}{party.name ? ` — ${party.name}` : ""}
                    </div>
                    <div style={{ marginLeft:"auto", fontSize:9, color:C.purple, fontFamily:font.mono,
                      background:`${C.purple}15`, padding:"2px 7px", borderRadius:4 }}>
                      Novación subjetiva
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:gridCols, gap:10 }}>
                    {[
                      { key:"name",    label:"Razón Social / Nombre" },
                      { key:"cif",     label:"CIF / NIF" },
                      { key:"address", label:"Domicilio Social" },
                      { key:"rep",     label:"Representante Legal" },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize:10, fontWeight:600, color:C.textMuted, fontFamily:font.ui,
                          textTransform:"uppercase", letterSpacing:"0.04em", display:"block", marginBottom:3 }}>
                          {f.label}
                        </label>
                        <input
                          value={party[f.key] ?? ""}
                          placeholder={`${f.label} de Parte ${party.role}`}
                          onChange={e => {
                            const updated = (localTerms.additionalParties ?? []).map((p, i) =>
                              i === idx ? { ...p, [f.key]: e.target.value } : p
                            );
                            handleTermChange("additionalParties", updated);
                          }}
                          style={{ width:"100%", padding:"8px 10px", fontSize:13, fontFamily:font.ui,
                            border:`1.5px solid ${C.purple}30`, borderRadius:6,
                            background:party[f.key]?.trim() ? C.bgInput : "#FAF5FF",
                            color:C.textDark, outline:"none" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.ui, marginTop:4, lineHeight:1.6 }}>
                Para añadir o eliminar partes, usa la pestaña <strong>🌐 Ecosistema → Partes</strong>.
              </div>
              </div>
            </SectionBlock>
          )}

          {/* Master-specific contract terms */}
          {contractFields.length > 0 && (
            <SectionBlock title="AG — Campos Operativos" color={C.blue} forceOpen={!!highlightKey} fieldCount={contractFields.length}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 14px" }}>
                {contractFields.map(f => {
                  const isHl = highlightKey === f.key;
                  const isCascadeUpdated = f.key === "euriborRate" || f.key === "spread";
                  return (
                    <div key={f.key} ref={el => { if (el) fieldRefs.current[f.key] = el; }}
                      style={{ gridColumn: f.type === "textarea" ? "1/-1" : undefined, borderRadius: 8, outline: isHl ? `3px solid ${C.orange}` : "none", outlineOffset: 3, animation: isHl ? "fieldPulse 0.7s ease 3" : "none", background: isHl ? `${C.orange}10` : "transparent", padding: isHl ? "8px" : "0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, flexWrap: "wrap" }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: isHl ? C.orange : isCascadeUpdated ? C.orange : C.textMuted, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.3px", display: "block" }}>{f.label}</label>
                        {isCascadeUpdated && <span style={{ fontSize: 8, color: C.orange, background: C.orangeBg, border: `1px solid ${C.orange}40`, borderRadius: 4, padding: "1px 5px", fontFamily: font.mono, fontWeight: 700 }}>⚡ ACTUALIZADO</span>}
                        <FieldBadges field={f} />
                      </div>
                      <FieldInput field={f} value={localTerms[f.key] ?? ""} onChange={v => handleTermChange(f.key, v)} />
                      <FieldNote field={f} />
                    </div>
                  );
                })}
              </div>
            </SectionBlock>
          )}

          {/* Sub-contract specific fields */}
          {subFields.map(section => (
            <SectionBlock key={section.section} title={section.section} color={meta?.color ?? C.textMuted} forceOpen={!!highlightKey} fieldCount={section.fields.length}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 14px" }}>
                {section.fields.map(f => {
                  const isHl = highlightKey === f.key;
                  return (
                    <div key={f.key} ref={el => { if (el) fieldRefs.current[f.key] = el; }}
                      style={{ gridColumn: f.type === "textarea" ? "1/-1" : undefined, borderRadius: 8, outline: isHl ? `3px solid ${C.orange}` : "none", outlineOffset: 3, animation: isHl ? "fieldPulse 0.7s ease 3" : "none", background: isHl ? `${C.orange}10` : "transparent", padding: isHl ? "8px" : "0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, flexWrap: "wrap" }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: isHl ? C.orange : C.textMuted, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.3px", display: "block" }}>{f.label}</label>
                        <FieldBadges field={f} />
                      </div>
                      <FieldInput field={f} value={localTerms[f.key] ?? ""} onChange={v => handleTermChange(f.key, v)} />
                      <FieldNote field={f} />
                    </div>
                  );
                })}
              </div>
            </SectionBlock>
          ))}

          {/* Sub-contract generation (master only) */}
          {isMaster && pendingTypes.length > 0 && (
            <SectionBlock title="Sub-contratos IF a Generar" color={C.gold} fieldCount={pendingTypes.length}>
              <div style={{ padding: "10px 14px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {pendingTypes.map(t => {
                  const m = SUB_META[t]; const st = generating[t];
                  return (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: C.white, border: `1.5px solid ${st === "done" ? m.color : C.border}`, borderRadius: 8 }}>
                      <span style={{ color: m.color, fontSize: 13 }}>{m.icon}</span>
                      <span style={{ fontSize: 12, color: m.color, fontFamily: font.ui, fontWeight: 600 }}>{m.label}</span>
                      {st === "pending" && <span style={{ fontSize: 10, color: C.orange }}>⟳</span>}
                      {st === "done"    && <span style={{ fontSize: 10, color: C.green }}>✓</span>}
                      {st === "error"   && <span style={{ fontSize: 10, color: C.red }}>✗</span>}
                    </div>
                  );
                })}
              </div>
              <button
                disabled={!allFilled}
                onClick={() => pendingTypes.forEach(t => onGenerateSub(t, localEss, template?.iaDefaults))}
                style={{ width: "100%", padding: "10px", background: allFilled ? C.gold : C.bgAlt, color: allFilled ? "#000" : C.textMuted, border: "none", borderRadius: 6, cursor: allFilled ? "pointer" : "not-allowed", fontSize: 13, fontFamily: font.ui, fontWeight: 600 }}
              >
                {allFilled ? `⬡ Generar ${pendingTypes.length} subcontrato${pendingTypes.length > 1 ? "s" : ""} vía PHENOMENON` : "Complete los campos obligatorios primero"}
              </button>
              </div>
            </SectionBlock>
          )}

          {/* ── Opus level + Oponibility (Bloques IV + V) ─────────────── */}
          <SectionBlock
            title="Eficacia del Contrato · Oponibilidad"
            subtitle="Art. 32 LH · Opus PARCIAL → COMPLETO → OPONIBLE"
            color={C.gold}>
            <div style={{ padding: "10px 14px" }}>
            {(() => {
              const level = getOpusLevel(contract);
              const cfg   = OPUS_LEVELS[level];
              const steps = [
                ["PARCIAL",   "COMPLETO",  !!(contract.ess?.partyA && contract.ag?.clauses?.length && contract.ia_instances?.length)],
                ["COMPLETO",  "OPONIBLE",  contract.opus?.homologation === "VALID"],
                ["OPONIBLE",  null,        !!contract.ag?.terms?.registry],
              ];
              return (
                <>
                  {/* Progress bar */}
                  <div style={{ display: "flex", gap: 0, marginBottom: 14, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
                    {Object.entries(OPUS_LEVELS).map(([key, l]) => {
                      const active = key === level;
                      const past   = (key === "PARTIAL" && (level === "COMPLETE" || level === "OPONIBLE")) ||
                                     (key === "COMPLETE" && level === "OPONIBLE");
                      return (
                        <div key={key} style={{ flex: 1, padding: "8px 6px", background: active ? l.color : past ? `${l.color}40` : C.bgAlt, textAlign: "center", borderRight: `1px solid ${C.border}`, transition: "background 0.3s" }}>
                          <div style={{ fontSize: 16 }}>{l.icon}</div>
                          <div style={{ fontSize: 9, color: active ? C.white : past ? l.color : C.textMuted, fontFamily: font.mono, fontWeight: active ? 700 : 400 }}>{l.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: 12, color: cfg.color, fontFamily: font.ui, marginBottom: 8, fontWeight: 600 }}>
                    {cfg.icon} {cfg.label} — {cfg.desc}
                  </div>

                  {/* Load full opus data */}
                  {!opusData ? (
                    <button onClick={async () => { const d = await api.getOpusLevel(contractId); setOpusData(d); }}
                      style={{ fontSize: 11, color: C.blue, background: "none", border: `1px dashed ${C.blue}`, borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontFamily: font.ui }}>
                      Cargar análisis completo de Opus →
                    </button>
                  ) : (
                    <div>
                      {/* Steps needed */}
                      {opusData.steps_to_oponible?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Para alcanzar Opus Oponible:</div>
                          {opusData.steps_to_oponible.map((s, i) => (
                            <div key={i} style={{ fontSize: 11, color: C.textBody, fontFamily: font.ui, marginBottom: 4, display: "flex", gap: 7 }}>
                              <span style={{ color: C.orange, flexShrink: 0 }}>{i + 1}.</span>{s}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Oponibility status */}
                      <div style={{ padding: "10px 12px", background: opusData.oponible ? C.goldBg : C.bgAlt, border: `1px solid ${opusData.oponible ? C.gold : C.border}`, borderRadius: 6, marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: opusData.oponible ? C.goldDim : C.textDark, fontFamily: font.ui, marginBottom: 4 }}>
                          {opusData.oponible ? "⊙ Oponible erga omnes" : "◌ Solo oponible inter partes"}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font.ui }}>{opusData.oponibility?.summary}</div>
                        {opusData.oponibility?.legal_basis && (
                          <div style={{ fontSize: 9, color: C.blue, fontFamily: font.mono, marginTop: 4 }}>{opusData.oponibility.legal_basis}</div>
                        )}
                      </div>

                      {/* Registration form */}
                      {!opusData.oponible && opusData.homologated && (
                        regForm.open ? (
                          <div style={{ padding: "12px", background: C.goldBg, borderRadius: 6, border: `1px solid ${C.gold}40` }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: C.goldDim, fontFamily: font.ui, marginBottom: 4 }}>Simulación de inscripción registral</div>
                            <div style={{ fontSize: 9, color: C.textMuted, fontFamily: font.ui, marginBottom: 10, fontStyle: "italic" }}>Demostración didáctica. No constituye inscripción real en el Registro de la Propiedad.</div>
                            {[["Registro", "registry", "Registro de la Propiedad de Madrid"], ["Fecha de inscripción", "date", "2026-06-01", "date"], ["Base legal (opcional)", "legal", "Art. 1504 CC · Art. 11 LH"]].map(([lbl, key, ph, tp]) => (
                              <div key={key} style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, fontFamily: font.ui, textTransform: "uppercase", display: "block", marginBottom: 3 }}>{lbl}</label>
                                <input type={tp || "text"} value={regForm[key]} onChange={e => setRegForm(p => ({...p, [key]: e.target.value}))}
                                  placeholder={ph}
                                  style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 5, fontFamily: font.ui }} />
                              </div>
                            ))}
                            <div style={{ display: "flex", gap: 8 }}>
                              <button disabled={!regForm.registry || !regForm.date || regSaving}
                                onClick={async () => {
                                  setRegSaving(true);
                                  await api.registerContract(contractId, { registry: regForm.registry, registered_date: regForm.date, legal_basis: regForm.legal });
                                  const d = await api.getOpusLevel(contractId);
                                  setOpusData(d);
                                  setRegForm({ open: false, registry: "", date: "", legal: "" });
                                  setRegSaving(false);
                                  onUpdateContract(contractId, {});
                                }}
                                style={{ background: C.gold, color: "#000", border: "none", borderRadius: 5, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontFamily: font.ui, fontWeight: 700 }}>
                                {regSaving ? "⟳ Simulando inscripción…" : "⊙ Simular inscripción (Oponible)"}
                              </button>
                              <button onClick={() => setRegForm(p => ({...p, open: false}))}
                                style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontFamily: font.ui }}>Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setRegForm(p => ({...p, open: true}))}
                            style={{ fontSize: 11, color: C.goldDim, background: C.goldBg, border: `1px solid ${C.gold}50`, borderRadius: 5, padding: "6px 14px", cursor: "pointer", fontFamily: font.ui, fontWeight: 600 }}>
                            ⊙ Simular inscripción registral (Oponible erga omnes) →
                          </button>
                        )
                      )}
                    </div>
                  )}
                </>
              );
            })()}
            </div>
          </SectionBlock>

          {/* ── Homologation summary (full panel in ⊙ Verificar tab) ──────── */}
          <SectionBlock title="Verificación Jurídica del Contrato" color={C.purple} subtitle="Para análisis completo: pestaña ⊙ Verificar">
            <div style={{ padding: "10px 14px" }}>
            {/* Current opus status */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: contract.opus?.homologation === "VALID" ? C.greenBg : contract.opus?.homologation === "INVALID" ? C.redBg : C.orangeBg, borderRadius: 8, marginBottom: 14, border: `1px solid ${contract.opus?.homologation === "VALID" ? C.green : contract.opus?.homologation === "INVALID" ? C.red : C.orange}30` }}>
              <span style={{ fontSize: 22 }}>
                {contract.opus?.homologation === "VALID"   ? "✅" :
                 contract.opus?.homologation === "INVALID" ? "❌" : "⏳"}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: contract.opus?.homologation === "VALID" ? C.green : contract.opus?.homologation === "INVALID" ? C.red : C.orange, fontFamily: font.ui }}>
                  {contract.opus?.homologation === "VALID"   ? "Contrato Homologado — VÁLIDO" :
                   contract.opus?.homologation === "INVALID" ? "Homologación INVÁLIDA — Corrija los errores" :
                   "Pendiente de verificación"}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font.ui, marginTop: 2 }}>
                  Motor PHENOMENON · {contract.type} · Opus: {contract.opus?.status ?? "—"}
                </div>
              </div>
            </div>

            {/* Checklist after running */}
            {homoResult && (
              <div style={{ marginBottom: 14 }}>
                {/* Group checks by section */}
                {(() => {
                  const groups = {};
                  (homoResult.checks ?? []).forEach(chk => {
                    const g = chk.group ?? "General";
                    if (!groups[g]) groups[g] = [];
                    groups[g].push(chk);
                  });
                  return Object.entries(groups).map(([group, chks]) => (
                    <div key={group} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
                        {group}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {chks.map(chk => (
                          <div
                            key={chk.key}
                            onClick={() => !chk.valid && navigateToField(chk.key)}
                            title={!chk.valid ? "Clic para ir al campo" : ""}
                            style={{
                              display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                              background: chk.valid ? C.greenBg : chk.required ? C.redBg : C.orangeBg,
                              borderRadius: 6, border: `1px solid ${chk.valid ? C.green : chk.required ? C.red : C.orange}25`,
                              cursor: !chk.valid ? "pointer" : "default",
                              transition: "opacity 0.15s",
                            }}
                            onMouseEnter={e => { if (!chk.valid) e.currentTarget.style.opacity = "0.8"; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                          >
                            <span style={{ fontSize: 14, flexShrink: 0 }}>{chk.valid ? "✅" : chk.required ? "❌" : "⚠️"}</span>
                            <span style={{ fontSize: 12, color: chk.valid ? C.green : chk.required ? C.red : C.orange, fontFamily: font.ui, fontWeight: 500, flex: 1 }}>{chk.label}</span>
                            {!chk.valid && (
                              <span style={{ fontSize: 10, color: chk.required ? C.red : C.orange, fontFamily: font.mono, flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
                                {chk.required ? "REQUERIDO" : "opcional"} <span style={{ fontSize: 11 }}>→</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}

                {homoResult.errors.length > 0 && (
                  <div style={{ marginTop: 10, padding: "12px 14px", background: C.redBg, borderRadius: 6, border: `1px solid ${C.red}20` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.red, fontFamily: font.ui, marginBottom: 8 }}>
                      {homoResult.errors.length} campo{homoResult.errors.length !== 1 ? "s" : ""} a corregir antes de homologar:
                    </div>
                    {homoResult.errors.map((e, i) => (
                      <div key={i} style={{ fontSize: 12, color: C.textBody, fontFamily: font.ui, marginBottom: 4, display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ color: C.red, flexShrink: 0 }}>→</span>
                        <span>{e.replace(/^\[[A-Z_]+\]\s*/, "")}</span>
                      </div>
                    ))}
                  </div>
                )}
                {homoResult.valid && (
                  <div style={{ marginTop: 10, padding: "12px 14px", background: C.greenBg, borderRadius: 6, border: `1px solid ${C.green}30`, textAlign: "center" }}>
                    <div style={{ fontSize: 14, color: C.green, fontFamily: font.ui, fontWeight: 700 }}>
                      ✓ Contrato homologado por el motor PHENOMENON
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font.ui, marginTop: 4 }}>
                      Todos los campos ESS, AG y específicos verificados · Homologación VÁLIDA
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={async () => {
                setHomoRunning(true);
                const r = await onHomologate(contractId);
                setHomoResult(r);
                setHomoRunning(false);
              }}
              disabled={homoRunning}
              style={{ width: "100%", padding: "10px", background: homoRunning ? C.bgAlt : C.purple, color: homoRunning ? C.textMuted : C.white, border: "none", borderRadius: 6, cursor: homoRunning ? "not-allowed" : "pointer", fontSize: 13, fontFamily: font.ui, fontWeight: 600 }}
            >
              {homoRunning ? "⟳ Verificando con motor PHENOMENON…" : "⊙ Ejecutar Verificación (Homologar)"}
            </button>
            </div>
          </SectionBlock>

          {/* Cláusulas y Condiciones del Contrato */}
          <SectionBlock
            title={`Cláusulas — Contenido Obligacional`}
            subtitle={`${localClauses.length} cláusula${localClauses.length !== 1 ? "s" : ""}`}
            color={color}
            fieldCount={localClauses.length}
            forceOpen={highlightKey === "clauses" || !!highlightKey}>
            <div style={{ padding: "10px 14px" }}>
            <div ref={el => { if (el) fieldRefs.current["clauses"] = el; fieldRefs.current["ia"] = el; }}
              style={{ outline: (highlightKey === "clauses" || highlightKey === "ia") ? `3px solid ${C.orange}` : "none", outlineOffset: 4, borderRadius: 8, animation: (highlightKey === "clauses" || highlightKey === "ia") ? "fieldPulse 0.7s ease 3" : "none" }} />
            <ClauseEditor
              clauses={localClauses}
              onChange={setLocalClauses}
              contractType={contractType}
              showLibrary={showLibrary}
              onToggleLibrary={() => setShowLibrary(p => !p)}
            />
            </div>
          </SectionBlock>

          {/* Operadores Jurídicos del Contrato */}
          <SectionBlock
            title="Operadores IA del Contrato"
            subtitle="ad-actio · de-actio · non · co-implication"
            color={C.purple}
            fieldCount={localIA.length}>
            <div style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {localIA.map(ia => {
                const def = IA_TYPES[ia];
                return (
                  <div key={ia}
                    title={def ? `${def.label} — ${def.desc?.slice(0,80)}` : ia}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: `${def?.color ?? C.textMuted}10`, border: `1px solid ${def?.color ?? C.textMuted}40`, borderRadius: 6 }}>
                    <span style={{ color: def?.color, fontSize: 12 }}>{def?.icon}</span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 11, color: def?.color, fontFamily: font.ui, fontWeight: 600 }}>{def?.label ?? ia}</span>
                      </div>
                      <div style={{ fontSize: 9, color: C.textLight, fontFamily: font.ui }}>
                        {def?.subtitle ?? ""}
                      </div>
                    </div>
                    <button onClick={() => { setLocalIA(p => p.filter(x => x !== ia)); setIaEdited(true); }} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, marginLeft: 4 }}>×</button>
                  </div>
                );
              })}
              {!localIA.length && <span style={{ fontSize: 12, color: C.textLight, fontFamily: font.ui }}>Sin operadores IA asignados</span>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {Object.entries(IA_TYPES).filter(([k]) => !localIA.includes(k)).map(([k, def]) => (
                <button key={k} onClick={() => addIA(k)}
                  title={def.desc}
                  style={{ fontSize: 11, padding: "4px 9px", background: "none", border: `1px solid ${def.color}50`, color: def.color, borderRadius: 5, cursor: "pointer", fontFamily: font.ui }}>
                  {def.icon} {def.label}
                </button>
              ))}
            </div>
            </div>
          </SectionBlock>

          {/* Risk & Verification moved to dedicated tabs (⚠ Riesgo / ⊙ Verificar) */}
          {(() => {
            const subs = Object.values(contracts).filter(c => c.parentId === contractId);
            const risks = detectRisks(contract, subs, Object.values(contracts));
            const highCount = risks.filter(r=>r.level==="high").length;
            const invalidCount = [contract,...subs].filter(c=>c.opus?.homologation==="INVALID").length;
            return (highCount > 0 || invalidCount > 0) && (
              <div style={{ padding:"10px 12px", background:C.redBg, border:`1px solid ${C.red}30`, borderRadius:8, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:16 }}>{highCount>0?"🔴":"🟡"}</span>
                <div style={{ flex:1, fontSize:11, color:C.red }}>
                  {highCount>0?`${highCount} riesgo${highCount>1?"s":""} alto${highCount>1?"s":""} detectado${highCount>1?"s":""}`:""}{invalidCount>0?` · ${invalidCount} contrato${invalidCount>1?"s":""} sin homologar`:""} — ver pestaña ⚠ Riesgo / ⊙ Verificar
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer actions */}
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, flexShrink: 0, background: C.white, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: "9px 20px", background: saving ? C.bgAlt : C.navy, color: saving ? C.textMuted : C.gold, border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontSize: 12, fontFamily: font.ui, fontWeight: 800, minWidth: 100 }}>
            {saving ? "⟳ Guardando…" : saved ? "✓ Guardado" : "💾 Guardar cambios"}
          </button>
          <button
            onClick={async () => {
              setHomoRunning(true);
              const r = await onHomologate(contractId);
              setHomoResult(r);
              setHomoRunning(false);
            }}
            disabled={homoRunning}
            style={{ padding: "8px 16px", background: homoRunning ? C.bgAlt : C.greenBg, color: homoRunning ? C.textMuted : C.green, border: `1.5px solid ${homoRunning ? C.border : C.green + "66"}`, borderRadius: 8, cursor: homoRunning ? "not-allowed" : "pointer", fontSize: 11, fontFamily: font.ui, fontWeight: 700, whiteSpace: "nowrap" }}>
            {homoRunning ? "⟳ Verificando…" : "✓ Homologar ecosistema"}
          </button>
          {!isMaster && (
            <button
              onClick={async () => {
                await onDelete(contractId);
                onGenerateSub(contract.type, master?.ess ?? localEss, template?.iaDefaults);
                onClose();
              }}
              title="Elimina este subcontrato y genera uno nuevo con los datos actuales del maestro"
              style={{ padding: "9px 12px", background: C.white, color: C.textBody, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: font.ui }}>
              ⟳ Regenerar
            </button>
          )}
          {!isMaster && (
            <button
              onClick={async () => {
                if (!window.confirm(`¿Eliminar "${contract.name}"? Esta acción no se puede deshacer.`)) return;
                await onDelete(contractId);
                onClose();
              }}
              style={{ padding: "9px 12px", background: C.redBg, color: C.red, border: `1px solid ${C.red}30`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: font.ui, fontWeight: 600 }}>
              🗑 Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Clause library panel (side panel) */}
      {showLibrary && (
        <div style={{ width: 300, borderLeft: `1px solid ${C.border}`, background: C.white, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          <ClauseLibrary
            contractType={contractType}
            onAddClause={text => setLocalClauses(prev => [...prev, text])}
          />
        </div>
      )}

      {/* Expand drawer overlay */}
      {showExpandDrawer && (
        <div
          onClick={() => setShowExpandDrawer(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)', zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 700, height: '100%',
              background: C.white,
              display: 'flex', flexDirection: 'column',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
            }}
          >
            {/* Drawer header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 20px',
              borderBottom: `1px solid ${C.border}`,
              background: C.bgAlt,
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.textDark, fontFamily: font.ui }}>
                {master?.ess?.partyA || 'Contrato'} — Todos los campos
              </div>
              <button
                onClick={() => setShowExpandDrawer(false)}
                style={{
                  marginLeft: 'auto',
                  background: C.bgAlt, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: '5px 12px',
                  fontSize: 12, color: C.textMuted, cursor: 'pointer', fontWeight: 600,
                  fontFamily: font.ui,
                }}
              >
                ✕ Cerrar
              </button>
            </div>
            {/* Drawer body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, fontFamily: font.ui }}>
                Vista expandida — todos los campos del contrato en una sola pantalla.
                Los cambios realizados aquí se reflejan en el panel principal al cerrar.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ gridColumn: '1/-1', padding: '20px', background: C.bgAlt, borderRadius: 8, border: `1px solid ${C.border}`, textAlign: 'center', color: C.textMuted, fontSize: 12, fontFamily: font.ui }}>
                  Use el panel principal para editar campos. Esta vista expandida muestra el contrato completo sin las limitaciones de espacio del panel lateral.
                </div>
              </div>
            </div>
            {/* Drawer footer */}
            <div style={{ flexShrink: 0, padding: '12px 20px', borderTop: `1px solid ${C.border}`, background: C.bgAlt, display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowExpandDrawer(false)}
                style={{ background: C.navy, color: C.gold, border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: font.ui }}
              >
                ✓ Cerrar vista expandida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
