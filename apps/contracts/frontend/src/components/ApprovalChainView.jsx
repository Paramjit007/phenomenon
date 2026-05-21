import { C, font, statusColor, statusLabel, SUB_META } from "../constants.js";

export default function ApprovalChainView({ master, subContracts }) {
  const contractMap = Object.fromEntries(subContracts.map(c => [c.type, c]));
  const compliance = contractMap.COMPLIANCE_CHECK;
  const audit = contractMap.AUDIT_REPORT;
  const regulatory = contractMap.REGULATORY_APPROVAL;
  const board = contractMap.BOARD_RESOLUTION;
  const complianceValid = compliance?.opus?.homologation === "VALID";
  const blocked = regulatory && !complianceValid;
  const approvalDeadline = master?.ag?.terms?.approvalDeadline;

  const steps = [
    { type: "COMPLIANCE_CHECK", label: "Compliance", description: "Revisión de cumplimiento legal y controles internos." },
    { type: "AUDIT_REPORT", label: "Auditoría", description: "Informe de auditoría de gobierno corporativo y riesgos." },
    { type: "REGULATORY_APPROVAL", label: "Aprobación Regulatoria", description: "Decisión del regulador sobre la operación." },
    { type: "BOARD_RESOLUTION", label: "Resolución del Consejo", description: "Votación final del consejo de administración." },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: C.blueBg, display: "grid", placeItems: "center", color: C.blue, fontSize: 18 }}>🏛</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.textDark }}>Cadena de gobernanza KPMG</div>
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font.mono }}>Bloque lógico: REGULATORY_APPROVAL solo puede activarse cuando COMPLIANCE_CHECK es VALID.</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ padding: "8px 12px", borderRadius: 8, background: C.body, color: C.textDark, fontSize: 12 }}>Operación: {master?.name ?? "Sin contrato maestro"}</div>
          {approvalDeadline && (
            <div style={{ padding: "8px 12px", borderRadius: 8, background: C.goldBg, color: C.gold, fontSize: 12 }}>Fecha límite de aprobación: {approvalDeadline}</div>
          )}
          {blocked && (
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(220,38,38,0.08)", color: C.red, fontSize: 12, fontWeight: 700 }}>BLOQUEO LÓGICO: Regulación pendiente de validación de compliance</div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          {steps.map(step => {
            const contract = contractMap[step.type];
            const status = contract?.status || "DRAFT";
            return (
              <div key={step.type} style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.white, boxShadow: "0 1px 3px rgba(15,23,42,0.06)", padding: 18, minHeight: 170, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 12, background: C.bgAlt, display: "grid", placeItems: "center", fontSize: 16 }}>{SUB_META[step.type]?.icon ?? "•"}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textDark }}>{step.label}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{SUB_META[step.type]?.law ?? ""}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: C.textDark }}>{step.description}</div>
                </div>
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, color: C.textMuted }}>Status</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: statusColor(status) }}>{statusLabel(status)}</span>
                  </div>
                  {contract && contract.type === "REGULATORY_APPROVAL" && blocked ? (
                    <div style={{ fontSize: 10, color: C.red, padding: "8px 10px", borderRadius: 10, background: "rgba(220,38,38,0.08)", textAlign: "center" }}>Esperando VALID compliance</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
