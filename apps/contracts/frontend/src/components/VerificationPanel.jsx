import { C, font, SUB_META, OPUS_LEVELS, getOpusLevel } from "../constants.js";

const TYPE_ICON = { MASTER: "⬡", NDA: "◈", SLA: "◎", PAYMENT: "◇", IP: "◆", DPA: "◉" };

// Maps homologation check keys to human-readable field sections
const GROUP_ICON = {
  "Identidad ESS":                  "◈",
  "Contenido AG":                   "◉",
  "Operadores IA — PHENOMENON":     "⬡",
  "Coherencia del Ecosistema IF":   "⇄",
};

export default function VerificationPanel({ results, isRunning, totalContracts, onClose, onNavigate }) {
  const validCount  = results.filter(r => r.valid).length;
  const allDone     = !isRunning && results.length === totalContracts;
  const allValid    = allDone && validCount === totalContracts;
  const errorContracts = results.filter(r => !r.valid);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(14,20,38,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, backdropFilter: "blur(3px)",
    }}
      onClick={e => { if (e.target === e.currentTarget && !isRunning) onClose(); }}
    >
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes popIn { from { opacity:0; transform: scale(0.94) translateY(8px); } to { opacity:1; transform: none; } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }
      `}</style>

      <div style={{
        background: C.white, borderRadius: 14, width: 600, maxHeight: "82vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)", animation: "popIn 0.25s ease",
      }}>

        {/* ── Header ── */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: isRunning ? C.blueBg : allValid ? C.greenBg : C.redBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {isRunning ? <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> : allValid ? "✅" : "⚠️"}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.textDark, fontFamily: font.ui }}>
                {isRunning ? "Verificando contratos…" : allValid ? "Todos los contratos homologados" : `${validCount} de ${totalContracts} contratos homologados`}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, fontFamily: font.ui, marginTop: 2 }}>
                {isRunning
                  ? `Procesando ${results.length + 1} de ${totalContracts} (sub-contratos primero, maestro al final)`
                  : allValid
                    ? "El ecosistema contractual PHENOMENON está completamente verificado"
                    : "Haz clic en un error para ir directamente al campo que requiere atención"}
              </div>
            </div>
            {!isRunning && (
              <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.textMuted, padding: "0 4px" }}>×</button>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, background: C.bgAlt, borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              background: isRunning ? C.blue : allValid ? C.green : C.orange,
              width: `${totalContracts ? (results.length / totalContracts) * 100 : 0}%`,
              borderRadius: 3,
              transition: "width 0.4s ease, background 0.3s",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <span style={{ fontSize: 10, color: C.textMuted, fontFamily: font.mono }}>{results.length}/{totalContracts} verificados</span>
            <span style={{ fontSize: 10, color: allValid ? C.green : isRunning ? C.blue : C.orange, fontFamily: font.mono, fontWeight: 600 }}>
              {validCount} ✓  {results.length - validCount} ✗
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>

          {/* Running: show each contract as it's checked */}
          {isRunning && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {results.map(r => <ContractRow key={r.id} r={r} done />)}
              {/* Currently running */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.blueBg, border: `1.5px solid ${C.blue}40`, borderRadius: 8 }}>
                <span style={{ fontSize: 16, display: "inline-block", animation: "spin 0.8s linear infinite", color: C.blue }}>⟳</span>
                <span style={{ fontSize: 12, color: C.blue, fontFamily: font.ui, fontWeight: 500 }}>Verificando…</span>
              </div>
              {/* Pending */}
              {Array.from({ length: Math.max(0, totalContracts - results.length - 1) }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: 8, opacity: 0.5 }}>
                  <span style={{ fontSize: 14, color: C.textLight }}>○</span>
                  <span style={{ fontSize: 12, color: C.textLight, fontFamily: font.ui }}>Pendiente…</span>
                </div>
              ))}
            </div>
          )}

          {/* Done: show summary list */}
          {!isRunning && (
            <>
              {/* Valid contracts (collapsed summary) */}
              {validCount > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.green, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                    ✅ Contratos homologados ({validCount})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {results.filter(r => r.valid).map(r => (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: C.greenBg, border: `1.5px solid ${C.green}40`, borderRadius: 6 }}>
                        <span style={{ fontSize: 13, color: C.green }}>{TYPE_ICON[r.type] ?? "○"}</span>
                        <span style={{ fontSize: 11, color: C.green, fontFamily: font.ui, fontWeight: 600 }}>{r.name}</span>
                        <span style={{ fontSize: 11 }}>✅</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error contracts — detailed with navigation */}
              {errorContracts.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.red, fontFamily: font.ui, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                    ❌ Contratos con errores ({errorContracts.length}) — haz clic para ir al campo
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {errorContracts.map(r => (
                      <ErrorContract key={r.id} r={r} onNavigate={onNavigate} />
                    ))}
                  </div>
                </div>
              )}

              {allValid && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.green, fontFamily: font.ui }}>Ecosistema contractual — Opus Completo</div>
                  <div style={{ fontSize: 12, color: C.textMuted, fontFamily: font.ui, marginTop: 6 }}>Todos los IF-links validan. Bloque IV: vectores convergentes.</div>
                  <div style={{ marginTop: 16, padding: "12px 16px", background: C.goldBg, borderRadius: 8, border: `1px solid ${C.gold}40`, textAlign: "left" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.goldDim, fontFamily: font.ui, marginBottom: 8 }}>Bloque IV+V — Opus por contrato</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      {results.map(r => {
                        const lvl = r.oponible ? "OPONIBLE" : r.valid ? "COMPLETE" : "PARTIAL";
                        const cfg = OPUS_LEVELS[lvl];
                        return <span key={r.id} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: cfg.bg, color: cfg.color, fontFamily: font.mono, border: `1px solid ${cfg.color}40` }}>{cfg.icon} {r.name?.split(" ").slice(0,2).join(" ")}</span>;
                      })}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font.ui }}>
                      ⊙ Para Opus Oponible: registrar en el Registro correspondiente desde R1 → sección Opus.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {!isRunning && (
          <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
            <button onClick={onClose}
              style={{ background: C.bgAlt, color: C.textBody, border: `1px solid ${C.border}`, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontFamily: font.ui, borderRadius: 6 }}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ContractRow({ r, done }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      background: r.valid ? C.greenBg : C.redBg,
      border: `1.5px solid ${r.valid ? C.green : C.red}40`,
      borderRadius: 8, animation: done ? "popIn 0.2s ease" : "none",
    }}>
      <span style={{ fontSize: 16, animation: !r.valid ? "shake 0.3s ease" : "none" }}>
        {r.valid ? "✅" : "❌"}
      </span>
      <span style={{ fontSize: 13, color: r.valid ? C.green : C.red, fontFamily: font.ui, fontWeight: 600, flex: 1 }}>
        {TYPE_ICON[r.type] ?? "○"} {r.name}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {(() => { const lvl = OPUS_LEVELS[r.valid ? "COMPLETE" : "PARTIAL"]; return <span title={lvl.desc} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: lvl.bg, color: lvl.color, fontFamily: font.mono }}>{lvl.icon}</span>; })()}
        <span style={{ fontSize: 11, color: r.valid ? C.green : C.red, fontFamily: font.mono }}>
          {r.valid ? "VÁLIDO" : `${r.errors?.length ?? 0} error${(r.errors?.length ?? 0) !== 1 ? "es" : ""}`}
        </span>
      </div>
    </div>
  );
}

function ErrorContract({ r, onNavigate }) {
  const meta = SUB_META[r.type];
  const col  = r.type === "MASTER" ? C.gold : (meta?.color ?? C.red);
  const failedChecks = (r.checks ?? []).filter(c => !c.valid && c.required);

  return (
    <div style={{ border: `1.5px solid ${C.red}40`, borderRadius: 10, overflow: "hidden" }}>
      {/* Contract header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.redBg, borderBottom: `1px solid ${C.red}20` }}>
        <span style={{ fontSize: 18, color: col }}>{TYPE_ICON[r.type] ?? "○"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textDark, fontFamily: font.ui }}>{r.name}</div>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font.mono }}>{r.type} · {failedChecks.length} campo{failedChecks.length !== 1 ? "s" : ""} requerido{failedChecks.length !== 1 ? "s" : ""} sin completar</div>
        </div>
        <span style={{ fontSize: 14 }}>❌</span>
      </div>

      {/* Failed checks — each is a clickable navigation button */}
      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
        {failedChecks.map(chk => {
          const groupIcon = GROUP_ICON[chk.group] ?? "→";
          const isEcosystem = chk.group?.includes("IF");
          return (
            <button
              key={chk.key}
              onClick={() => onNavigate(r.id, chk.key, isEcosystem)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", width: "100%",
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 6, cursor: "pointer", textAlign: "left",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.redBg; e.currentTarget.style.borderColor = C.red + "60"; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.border; }}
            >
              <span style={{ fontSize: 11, color: C.textMuted, flexShrink: 0 }}>{groupIcon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.textDark, fontFamily: font.ui, fontWeight: 500 }}>
                  {chk.label}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font.mono }}>{chk.group}</div>
              </div>
              <span style={{ fontSize: 11, color: C.red, fontFamily: font.ui, fontWeight: 600, flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
                {isEcosystem ? "Ver sub-contrato" : "Ir al campo"} →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
