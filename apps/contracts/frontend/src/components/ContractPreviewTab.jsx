import { C, font, SUB_META } from "../constants.js";

const ANNEX = ["A","B","C","D","E","F","G"];

const MONTH_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function signatureDate() {
  const d = new Date();
  return `${d.getDate()} de ${MONTH_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function ContractPreviewTab({ master, subContracts }) {
  const ess = master?.ess ?? {};
  const today = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  if (!master) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.textMuted, fontFamily: font.ui, fontSize: 14 }}>
      Sin datos de contrato. Complete los campos y genere los subcontratos primero.
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── Sidebar TOC + print action (screen only) ── */}
      <div className="no-print" style={{ width: 200, borderRight: `1px solid ${C.border}`, padding: "20px 16px", overflowY: "auto", flexShrink: 0, background: C.white }}>
        <div style={{ fontSize:9, fontFamily:"'JetBrains Mono','Courier New',monospace", letterSpacing:"0.08em", color:"#64748b", background:"rgba(14,20,38,0.08)", padding:"2px 7px", borderRadius:3, marginBottom:12, display:"inline-block" }}>R3 · Documento</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16, fontFamily: font.ui }}>Índice</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 28 }}>
          <a href="#sec-partes"   style={{ fontSize: 13, color: C.textBody, fontFamily: font.ui, textDecoration: "none" }}>Partes e Identificación</a>
          <a href="#sec-exponen"  style={{ fontSize: 13, color: C.textBody, fontFamily: font.ui, textDecoration: "none" }}>Exponen</a>
          <a href="#sec-marco"    style={{ fontSize: 13, color: C.gold,     fontFamily: font.ui, textDecoration: "none" }}>Estipulaciones principales</a>
          {subContracts.map((c, i) => {
            const m = SUB_META[c.type];
            return m ? (
              <a key={c.id} href={`#sec-${c.id}`}
                style={{ fontSize: 13, color: m.color, fontFamily: font.ui, textDecoration: "none", paddingLeft: 12 }}>
                Anexo {ANNEX[i]} — {m.short}
              </a>
            ) : null;
          })}
          <a href="#sec-firmas" style={{ fontSize: 13, color: C.textMuted, fontFamily: font.ui, textDecoration: "none" }}>Firmas y Ratificación</a>
        </div>

        <button
          onClick={() => window.print()}
          style={{ width: "100%", background: C.navyDeep, color: C.white, border: "none", padding: "11px 12px", cursor: "pointer", fontSize: 13, fontFamily: font.ui, fontWeight: 700, borderRadius: 6 }}
        >
          🖨 Imprimir / Guardar PDF
        </button>

        <div style={{ marginTop: 20, padding: "12px", background: C.bgAlt, borderRadius: 6, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font.mono, marginBottom: 8, fontWeight: 600 }}>Documento</div>
          {[["Estado", master.status], ["Anexos", subContracts.length], ["Fecha", today]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: font.ui }}>{k}</span>
              <span style={{ fontSize: 11, color: C.textDark, fontFamily: font.mono }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contract document ── */}
      <div id="print-doc" style={{ flex: 1, overflowY: "auto", padding: "48px 72px", background: "#FAFAF8", fontFamily: "'Times New Roman', Georgia, serif" }}>

        {/* Print-only CSS */}
        <style>{`
          @media print {
            * { box-sizing: border-box; }
            body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
            .no-print { display: none !important; }
            #print-doc {
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
              background: white !important;
              overflow: visible !important;
            }
            .contract-page {
              width: 100%;
              padding: 2cm 2.5cm;
              background: white;
              color: black;
              font-family: 'Times New Roman', Times, serif;
              font-size: 11pt;
              line-height: 1.7;
            }
            .page-break { page-break-before: always; }
            @page {
              size: A4 portrait;
              margin: 2cm 2.5cm;
            }
            @page :first { margin-top: 2.5cm; }
          }
        `}</style>

        <div className="contract-page">

          {/* ══ LETTERHEAD ══ */}
          <div style={{ textAlign: "center", marginBottom: 40, paddingBottom: 24, borderBottom: "2px solid #1a1a1a" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#555", marginBottom: 12, fontFamily: "Arial, sans-serif" }}>
              Documento Contractual · Derecho Español
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#111", marginBottom: 8 }}>
              {master.name}
            </div>
            <div style={{ fontSize: 11, color: "#555", fontFamily: "Arial, sans-serif" }}>
              Ref.: PHEN-{master.id?.slice(0,8).toUpperCase() ?? "XXXXXXXX"} · {today}
            </div>
          </div>

          {/* ══ PARTES IDENTIFICACIÓN ══ */}
          <div id="sec-partes" style={{ marginBottom: 32 }}>
            <SectionTitle>Reunidos</SectionTitle>
            <p style={{ marginBottom: 16, textAlign: "justify" }}>
              <strong>DE UNA PARTE,</strong> {ess.partyA || "[PARTE A]"}{master.ag?.terms?.partyACIF ? `, con CIF ${master.ag.terms.partyACIF}` : ""}{master.ag?.terms?.partyAAddress ? `, con domicilio social en ${master.ag.terms.partyAAddress}` : ""}{master.ag?.terms?.partyARepresentative ? `, representada en este acto por ${master.ag.terms.partyARepresentative}` : ""}, en adelante <strong>«la Parte Contratante»</strong>.
            </p>
            <p style={{ marginBottom: 16, textAlign: "justify" }}>
              <strong>DE OTRA PARTE,</strong> {ess.partyB || "[PARTE B]"}{master.ag?.terms?.partyBCIF ? `, con CIF ${master.ag.terms.partyBCIF}` : ""}{master.ag?.terms?.partyBAddress ? `, con domicilio social en ${master.ag.terms.partyBAddress}` : ""}{master.ag?.terms?.partyBRepresentative ? `, representada en este acto por ${master.ag.terms.partyBRepresentative}` : ""}, en adelante <strong>«la Parte Prestadora»</strong>.
            </p>
            <p style={{ textAlign: "justify" }}>
              Ambas partes, reconociéndose mutuamente capacidad legal suficiente para contratar y obligarse,
            </p>
          </div>

          {/* ══ EXPONEN ══ */}
          <div id="sec-exponen" style={{ marginBottom: 32 }}>
            <SectionTitle>Exponen</SectionTitle>
            <OrderedList items={[
              `Que ${ess.partyA || "la Parte Contratante"} desea contratar los servicios de ${ess.partyB || "la Parte Prestadora"} en los términos y condiciones que se establecen en el presente contrato.`,
              `Que ${ess.partyB || "la Parte Prestadora"} está en condiciones de prestar dichos servicios con la debida profesionalidad y diligencia.`,
              `Que ambas partes, reconociéndose mutuamente plena capacidad jurídica y de obrar para suscribir el presente contrato, libre y voluntariamente,`,
            ]} />
          </div>

          {/* ══ ESTIPULAN ══ */}
          <div id="sec-marco" style={{ marginBottom: 36 }}>
            <SectionTitle>Estipulan</SectionTitle>

            {/* Contract metadata table */}
            <div style={{ marginBottom: 20, border: "1px solid #ccc", borderRadius: 2 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <tbody>
                  {[
                    ["Fecha de inicio", ess.effectiveDate || "—"],
                    ["Fecha de vencimiento", ess.expiryDate || "—"],
                    ["Juzgados competentes", ess.jurisdiction || "—"],
                    ["Ley aplicable", "Derecho español"],
                    ...(master.ag?.terms?.baseAmount ? [["Importe base", `${master.ag.terms.baseAmount} € (IVA no incluido)`]] : []),
                    ...(master.ag?.terms?.paymentDays ? [["Plazo de pago", `${master.ag.terms.paymentDays} días naturales (Ley 3/2004)`]] : []),
                    ...(master.ag?.terms?.territory ? [["Territorio", master.ag.terms.territory]] : []),
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "6px 12px", fontWeight: 700, width: "35%", background: "#f8f8f8", borderRight: "1px solid #eee" }}>{k}</td>
                      <td style={{ padding: "6px 12px" }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Main clauses */}
            {master.ag?.clauses?.length > 0 ? (
              master.ag.clauses.map((cl, i) => (
                <Clause key={i} n={`${i + 1}.`}>{cl}</Clause>
              ))
            ) : (
              <p style={{ color: "#888", fontStyle: "italic" }}>
                Genere los subcontratos para que el sistema complete las estipulaciones del contrato marco.
              </p>
            )}
          </div>

          {/* ══ ANNEXES ══ */}
          {subContracts.map((c, i) => {
            const m = SUB_META[c.type];
            const letter = ANNEX[i] || String(i + 2);
            if (!m) return null;
            return (
              <div key={c.id} id={`sec-${c.id}`} className={i === 0 ? "" : "page-break"} style={{ marginBottom: 40 }}>
                <div style={{ borderTop: "2px solid #1a1a1a", paddingTop: 28, marginBottom: 24 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", fontFamily: "Arial, sans-serif", marginBottom: 6 }}>
                    Anexo {letter}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 4 }}>
                    {c.name || m.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#777", fontFamily: "Arial, sans-serif" }}>
                    Base legal: {m.law}
                  </div>
                </div>

                {/* Sub-contract parties */}
                <p style={{ marginBottom: 16, textAlign: "justify", fontSize: 12 }}>
                  El presente Anexo {letter} forma parte integrante del contrato principal suscrito entre <strong>{c.ess?.partyA || ess.partyA || "—"}</strong> y <strong>{c.ess?.partyB || ess.partyB || "—"}</strong>, con vigencia desde el {c.ess?.effectiveDate || ess.effectiveDate || "—"} hasta el {c.ess?.expiryDate || ess.expiryDate || "—"}, y se rige por la legislación española aplicable.
                </p>

                {/* Sub-specific terms */}
                {c.ag?.terms && Object.keys(c.ag.terms).filter(k => k !== "templateKey" && c.ag.terms[k]).length > 0 && (
                  <div style={{ marginBottom: 16, border: "1px solid #ddd", borderRadius: 2 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                      <tbody>
                        {Object.entries(c.ag.terms).filter(([k, v]) => k !== "templateKey" && v).map(([k, v]) => (
                          <tr key={k} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "5px 10px", fontWeight: 700, width: "40%", background: "#f8f8f8", borderRight: "1px solid #eee", textTransform: "capitalize" }}>
                              {k.replace(/([A-Z])/g, " $1").trim()}
                            </td>
                            <td style={{ padding: "5px 10px" }}>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Clauses */}
                {(c.ag?.clauses ?? []).map((cl, j) => (
                  <Clause key={j} n={`${letter}.${j + 1}.`}>{cl}</Clause>
                ))}
                {!c.ag?.clauses?.length && (
                  <p style={{ color: "#888", fontStyle: "italic", fontSize: 12 }}>Cláusulas pendientes de generación.</p>
                )}
              </div>
            );
          })}

          {/* ══ SIGNATURES ══ */}
          <div id="sec-firmas" className="page-break" style={{ paddingTop: 28 }}>
            <div style={{ borderTop: "2px solid #1a1a1a", paddingTop: 28, marginBottom: 32 }}>
              <SectionTitle>Firmas y Ratificación del Acuerdo</SectionTitle>
              <p style={{ textAlign: "justify", marginBottom: 24 }}>
                Y en prueba de conformidad con todo lo anteriormente expuesto, ambas partes suscriben el presente contrato por duplicado y a un solo efecto, en el lugar y fecha que a continuación se indica.
              </p>

              {/* Date + place */}
              <p style={{ marginBottom: 40, fontSize: 13 }}>
                En {ess.jurisdiction || "__________________"}, a{" "}
                <span style={{ borderBottom: "1px solid #333", display: "inline-block", minWidth: 180, marginBottom: -2, paddingBottom: 2, color: "#333" }}>
                  &nbsp;{signatureDate()}&nbsp;
                </span>
              </p>

              {/* Signature columns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 60 }}>
                <SignatureBlock
                  label="Por la Parte Contratante"
                  party={ess.partyA || "[Parte A]"}
                  rep={master.ag?.terms?.partyARepresentative}
                  cif={master.ag?.terms?.partyACIF}
                />
                <SignatureBlock
                  label="Por la Parte Prestadora"
                  party={ess.partyB || "[Parte B]"}
                  rep={master.ag?.terms?.partyBRepresentative}
                  cif={master.ag?.terms?.partyBCIF}
                />
              </div>

              {/* RGPD footnote */}
              <div style={{ borderTop: "1px solid #ddd", paddingTop: 16, fontSize: 9, color: "#777", lineHeight: 1.6, fontFamily: "Arial, sans-serif" }}>
                <strong>Protección de datos:</strong> Los datos personales de los firmantes son tratados por ambas partes exclusivamente para la gestión de la presente relación contractual, de conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD). Los interesados pueden ejercer sus derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición mediante comunicación escrita a la dirección de la parte responsable del tratamiento.
              </div>
            </div>
          </div>

        </div>{/* end .contract-page */}
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", borderBottom: "1.5px solid #1a1a1a", paddingBottom: 6, marginBottom: 18, fontFamily: "Arial, sans-serif", color: "#111" }}>
      {children}
    </div>
  );
}

function Clause({ n, children }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 14, textAlign: "justify" }}>
      <span style={{ fontSize: 12, fontWeight: 700, flexShrink: 0, paddingTop: 2, minWidth: 28, fontFamily: "Arial, sans-serif", color: "#333" }}>{n}</span>
      <span style={{ fontSize: 12, lineHeight: 1.75 }}>{children}</span>
    </div>
  );
}

function OrderedList({ items }) {
  return (
    <ol style={{ paddingLeft: 24, margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 12, lineHeight: 1.75, marginBottom: 8, textAlign: "justify" }}>{item}</li>
      ))}
    </ol>
  );
}

function SignatureBlock({ label, party, rep, cif }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "Arial, sans-serif", color: "#333" }}>
        {label}
      </div>
      <div style={{ fontSize: 11, marginBottom: 4 }}><strong>{party}</strong></div>
      {cif && <div style={{ fontSize: 10, color: "#555", marginBottom: 16 }}>CIF/NIF: {cif}</div>}

      {/* Signature space */}
      <div style={{ height: 70, border: "1px dashed #bbb", borderRadius: 2, marginBottom: 8, display: "flex", alignItems: "flex-end", padding: "6px 10px" }}>
        <span style={{ fontSize: 9, color: "#ccc", fontFamily: "Arial, sans-serif" }}>Firma y sello</span>
      </div>

      {/* Name line */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ borderBottom: "1px solid #333", minWidth: "100%", marginBottom: 3, paddingBottom: 2 }}>
          <span style={{ fontSize: 10, color: "#999" }}>{rep || " "}</span>
        </div>
        <div style={{ fontSize: 9, color: "#777", fontFamily: "Arial, sans-serif" }}>Nombre completo y cargo del firmante</div>
      </div>

      {/* DNI/NIF line */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ borderBottom: "1px solid #333", marginBottom: 3, paddingBottom: 2 }}>
          <span style={{ fontSize: 10, color: "#ccc" }}>&nbsp;</span>
        </div>
        <div style={{ fontSize: 9, color: "#777", fontFamily: "Arial, sans-serif" }}>DNI/NIF del firmante</div>
      </div>

      {/* Date line */}
      <div>
        <div style={{ borderBottom: "1px solid #333", marginBottom: 3, paddingBottom: 2 }}>
          <span style={{ fontSize: 10, color: "#ccc" }}>&nbsp;</span>
        </div>
        <div style={{ fontSize: 9, color: "#777", fontFamily: "Arial, sans-serif" }}>Fecha de firma</div>
      </div>
    </div>
  );
}
