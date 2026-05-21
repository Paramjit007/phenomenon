/**
 * ImpactNotification — slides in after any cascade fires.
 * Shows: what changed, what was affected (clickable), detected risks, recommendations.
 */
import { useState, useEffect, useRef } from "react";
import { C, font, SUB_META } from "../constants.js";
import { detectRisks, RISK_COLORS } from "./RiskEngine.jsx";

const AUTO_DISMISS_MS = 12000;

// Risk → specific recommendation text
const RECOMMENDATIONS = {
  jurisdiction:       "Verificar cláusula de sumisión expresa en todos los contratos del ecosistema.",
  euribor_critico:    "Negociar un techo de tipos (cap) o convertir a tipo fijo. Verificar cobertura de la cesión de crédito.",
  euribor_elevado:    "Monitorizar EURIBOR mensualmente. Considerar swap de tipo de interés.",
  cosa_futura_vencida:"Redactar addendum de prórroga urgente. Verificar cláusula penal de retraso.",
  cosa_futura_urgente:"Preparar addendum de prórroga preventiva. Confirmar estado de obra con constructora.",
  hipoteca_no_inscrita:"Elevar a escritura pública e inscribir en Registro de la Propiedad Valencia nº 5. AJD: 1.5% ≈ €1.950.000.",
  cesion_no_notificada:"Enviar burofax con acuse de recibo a Gestión Hotelera Costa Levante S.L. (Art. 1.527 CC).",
  ca2_if_sin_vincular: "Añadir cláusula de extinción vincuada al F principal en el circumcontrato (Bloque II CA2).",
  ajd_sin_prever:      "Provisionar €1.950.000 para AJD antes del otorgamiento notarial de la hipoteca.",
  liability:           "Incluir cláusula de límite de responsabilidad. Recomendado: 12 meses de capital.",
  jurisdiction_missing:"Añadir cláusula de sumisión expresa a los juzgados de Valencia.",
  morosidad:           "Reducir el plazo de pago a máximo 60 días (Ley 3/2004 Art. 4).",
  homo_pending:        "Ejecutar verificación PHENOMENON en la pestaña ⊙ Verificar.",
};

function getRec(riskKey) {
  return RECOMMENDATIONS[riskKey] ?? "Revisar el contrato afectado y homologar el ecosistema.";
}

function ContractBadge({ contract, isMaster, onClick }) {
  const meta  = isMaster ? null : SUB_META[contract?.type];
  const color = isMaster ? C.gold : (meta?.color ?? C.textMuted);
  const homo  = contract?.homologation ?? contract?.opus?.homologation ?? "PENDING";
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:8,
      padding:"7px 10px", background:C.white, border:`1px solid ${C.orange}30`,
      borderLeft:`3px solid ${C.orange}`, borderRadius:6, cursor:"pointer",
      transition:"box-shadow 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow=`0 2px 8px ${C.orange}20`}
      onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
      <span style={{ fontSize:14, color }}>{isMaster ? "⬡" : (meta?.icon ?? "○")}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.textDark, overflow:"hidden",
          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {contract?.name ?? contract?.type}
        </div>
        <div style={{ fontSize:9, color:C.orange, fontFamily:font.mono }}>
          ⚠ NEEDS_REVIEW → {homo}
        </div>
      </div>
      <span style={{ fontSize:10, color:C.blue, fontFamily:font.ui, flexShrink:0 }}>Ir →</span>
    </div>
  );
}

function RiskItem({ risk, onNavigate }) {
  const color = RISK_COLORS[risk.level] ?? C.textMuted;
  const icon  = risk.level === "high" ? "🔴" : risk.level === "medium" ? "🟡" : "🟢";
  const rec   = getRec(risk.key);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding:"7px 10px", background:risk.level==="high"?C.redBg:C.orangeBg,
      border:`1px solid ${color}25`, borderLeft:`3px solid ${color}`, borderRadius:6, marginBottom:5 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:7 }}>
        <span>{icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textDark, lineHeight:1.4 }}>
            {risk.title}
          </div>
          {open && (
            <div style={{ fontSize:10, color:C.textBody, marginTop:4, lineHeight:1.6 }}>
              {risk.desc}
            </div>
          )}
          <div style={{ marginTop:4, padding:"4px 8px", background:`${color}12`,
            borderRadius:4, fontSize:10, color, fontFamily:font.ui, lineHeight:1.5 }}>
            💡 {rec}
          </div>
          <div style={{ marginTop:3, fontSize:9, color, fontFamily:font.mono,
            display:"inline-block", background:`${color}10`, padding:"1px 5px", borderRadius:3 }}>
            {risk.law}
          </div>
        </div>
        <div style={{ display:"flex", gap:5, flexShrink:0 }}>
          {risk.tab && (
            <button onClick={() => onNavigate(risk.tab, risk.field)}
              style={{ fontSize:9, color:C.blue, background:"none", border:`1px solid ${C.blue}30`,
                borderRadius:4, padding:"2px 7px", cursor:"pointer", fontFamily:font.ui }}>
              Ir al campo →
            </button>
          )}
          <button onClick={() => setOpen(p=>!p)}
            style={{ fontSize:9, color:C.textMuted, background:"none", border:"none",
              cursor:"pointer" }}>
            {open ? "▲" : "▾"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImpactNotification({ impact, contracts, onNavigate, onHomologate, onClose }) {
  const [visible,  setVisible]  = useState(false);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef(null);
  const timerRef    = useRef(null);

  useEffect(() => {
    if (!impact) { setVisible(false); return; }
    setVisible(true);
    setProgress(100);

    // Progress bar countdown
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100));
    }, 100);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, AUTO_DISMISS_MS);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timerRef.current);
    };
  }, [impact]);

  const pauseDismiss = () => {
    clearInterval(intervalRef.current);
    clearTimeout(timerRef.current);
  };

  if (!impact || !visible) return null;

  const { fieldLabel, oldValue, newValue, affectedContracts, risks, contractId } = impact;
  const hasHigh   = risks?.some(r => r.level === "high");
  const hasMedium = risks?.some(r => r.level === "medium");
  const headerColor = hasHigh ? C.red : hasMedium ? C.orange : C.green;

  return (
    <div
      data-testid="impact-notification"
      onMouseEnter={pauseDismiss}
      style={{
        // Anchored bottom-left so it doesn't compete with the header
        // and stays out of the way of the form/graph in the center of the screen.
        position:"fixed", bottom:20, left:20, width:380, zIndex:9999,
        background:C.white, border:`2px solid ${headerColor}`,
        borderRadius:12, boxShadow:"0 8px 40px rgba(0,0,0,0.2)",
        fontFamily:font.ui, overflow:"hidden",
        animation:"slideInBottomLeft 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
      }}>
      <style>{`
        @keyframes slideInBottomLeft {
          from { transform:translate(-30%, 30%); opacity:0; }
          to   { transform:translate(0, 0);      opacity:1; }
        }
      `}</style>

      {/* Progress bar */}
      <div style={{ height:3, background:`${headerColor}20` }}>
        <div style={{ height:"100%", background:headerColor, width:`${progress}%`,
          transition:"width 0.1s linear" }} />
      </div>

      {/* Header */}
      <div style={{ background:`${headerColor}10`, padding:"10px 14px",
        display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${headerColor}20` }}>
        <span style={{ fontSize:18 }}>{hasHigh ? "🔴" : hasMedium ? "⚠️" : "✅"}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:700, color:headerColor }}>
            {hasHigh ? "Cambio con impacto crítico" : hasMedium ? "Cambio aplicado — revisar" : "Cambio aplicado correctamente"}
          </div>
          {fieldLabel && (
            <div style={{ fontSize:10, color:C.textMuted, fontFamily:font.mono, marginTop:1 }}>
              {fieldLabel}
              {oldValue && newValue && oldValue !== newValue && (
                <span> · <span style={{ color:C.red }}>{oldValue}</span> → <span style={{ color:C.green }}>{newValue}</span></span>
              )}
            </div>
          )}
        </div>
        <button onClick={() => { setVisible(false); onClose?.(); }}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:C.textMuted, padding:4 }}>✕</button>
      </div>

      <div style={{ maxHeight:420, overflowY:"auto", padding:"12px 14px" }}>

        {/* Affected contracts */}
        {affectedContracts?.length > 0 && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:6 }}>
              Contratos afectados ({affectedContracts.length})
            </div>
            {affectedContracts.map(c => (
              <div key={c.id} style={{ marginBottom:5 }}>
                <ContractBadge
                  contract={c}
                  isMaster={!c.parentId}
                  onClick={() => { onNavigate?.("campos", null, c.id); setVisible(false); onClose?.(); }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Risks and recommendations */}
        {risks?.length > 0 && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:6 }}>
              Riesgos detectados ({risks.length}) — click para recomendación
            </div>
            {risks.map(r => (
              <RiskItem key={r.key} risk={r}
                onNavigate={(tab, field) => { onNavigate?.(tab, field, contractId); setVisible(false); onClose?.(); }} />
            ))}
          </div>
        )}

        {risks?.length === 0 && affectedContracts?.length === 0 && (
          <div style={{ padding:"12px", textAlign:"center", color:C.green, fontSize:12 }}>
            ✅ Sin riesgos detectados. Ecosistema consistente.
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`,
        display:"flex", gap:8, background:C.bgAlt }}>
        <button onClick={() => { onHomologate?.(); setVisible(false); onClose?.(); }}
          style={{ flex:1, padding:"7px", background:C.purple, color:C.white,
            border:"none", borderRadius:6, cursor:"pointer", fontSize:11,
            fontFamily:font.ui, fontWeight:700 }}>
          ⊙ Homologar Ecosistema
        </button>
        <button onClick={() => { onNavigate?.("riesgo", null, contractId); setVisible(false); onClose?.(); }}
          style={{ flex:1, padding:"7px", background:"none", color:C.blue,
            border:`1px solid ${C.blue}30`, borderRadius:6, cursor:"pointer",
            fontSize:11, fontFamily:font.ui }}>
          Ver análisis completo ⚠
        </button>
      </div>
    </div>
  );
}
