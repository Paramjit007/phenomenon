// ─── Design tokens ──────────────────────────────────────────────────────────
export const C = {
  bg:           "#F5F3EE",
  bgAlt:        "#EDEAE3",
  bgInput:      "#FAFAF8",
  white:        "#FFFFFF",
  navy:         "#1E2B45",
  navyHi:       "#27374F",
  navyDeep:     "#141E30",
  gold:         "#C9A84C",
  goldLight:    "#E8C470",
  goldDim:      "#8B6F2E",
  goldBg:       "#FDF7E9",
  textDark:     "#111827",
  textBody:     "#374151",
  textMuted:    "#6B7280",
  textLight:    "#9CA3AF",
  textWhite:    "#F8FAFC",
  textNavy:     "#94A3B8",
  green:        "#059669",
  greenBg:      "#ECFDF5",
  orange:       "#D97706",
  orangeBg:     "#FFFBEB",
  red:          "#DC2626",
  redBg:        "#FEF2F2",
  blue:         "#2563EB",
  blueBg:       "#EFF6FF",
  purple:       "#7C3AED",
  purpleBg:     "#F5F3FF",
  cyan:         "#0891B2",
  border:       "#E5E0D8",
  borderStrong: "#C9C5BC",
  borderDark:   "#2D3F5A",
  colorNDA:     "#7C3AED",
  colorSLA:     "#059669",
  colorPAYMENT: "#0891B2",
  colorIP:      "#DB2777",
  colorDPA:     "#2563EB",
  colorMASTER:  "#C9A84C",
};

export const font = {
  ui:    "'Inter', system-ui, sans-serif",
  serif: "'Playfair Display', Georgia, serif",
  mono:  "'JetBrains Mono', 'Courier New', monospace",
};

// ─── Contract templates ──────────────────────────────────────────────────────
export const CONTRACT_TEMPLATES = {
  CSM: {
    label: "Contrato Marco de Servicios",
    subtitle: "Marco general de prestación de servicios",
    icon: "⬡", color: C.gold, complexity: 4,
    law: "Código Civil arts. 1544-1600 · Ley 7/1996",
    description: "Regula la relación comercial global entre empresa contratante y prestadora de servicios. Genera automáticamente NDA, SLA, Condiciones de Pago y Acuerdo RGPD.",
    requiredEss: [
      { key: "partyA",        label: "Empresa Contratante (Razón Social)", placeholder: "Acme Solutions S.L." },
      { key: "partyB",        label: "Empresa Prestadora (Razón Social)",  placeholder: "TechVenture España S.A." },
      { key: "jurisdiction",  label: "Juzgados Competentes (Ciudad)",       placeholder: "Madrid" },
      { key: "effectiveDate", label: "Fecha de Inicio",                     type: "date" },
      { key: "expiryDate",    label: "Fecha de Vencimiento",                type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",             label: "CIF/NIF Parte A",                    placeholder: "B-12345678" },
      { key: "partyAAddress",         label: "Domicilio Social Parte A",           placeholder: "Calle Gran Vía 1, 28013 Madrid" },
      { key: "partyARepresentative",  label: "Representante Legal Parte A",        placeholder: "D. Juan García López" },
      { key: "partyBCIF",             label: "CIF/NIF Parte B",                    placeholder: "A-87654321" },
      { key: "partyBAddress",         label: "Domicilio Social Parte B",           placeholder: "Avda. Diagonal 211, 08018 Barcelona" },
      { key: "partyBRepresentative",  label: "Representante Legal Parte B",        placeholder: "Dña. María Martínez Sánchez" },
    ],
    contractFields: [
      { key: "contractObject",   label: "Objeto del Contrato",              type: "textarea", placeholder: "Prestación de servicios de consultoría tecnológica..." },
      { key: "baseAmount",       label: "Importe Base (€/año)",             type: "number",   placeholder: "120000" },
      { key: "vatRate",          label: "Tipo IVA (%)",                     type: "select",   options: ["21%","10%","4%","0% (exento)"] },
      { key: "billingPeriod",    label: "Período de Facturación",           type: "select",   options: ["Mensual","Trimestral","Semestral","Anual","A la firma"] },
      { key: "paymentDays",      label: "Plazo de Pago (días naturales)",   type: "number",   placeholder: "30" },
      { key: "noticePeriod",     label: "Preaviso para Resolución (días)",  type: "number",   placeholder: "90" },
      { key: "automaticRenewal", label: "Prórroga Automática",              type: "select",   options: ["Sí, por períodos de igual duración","No, requiere acuerdo expreso"] },
      { key: "liabilityLimit",   label: "Límite de Responsabilidad",        type: "select",   options: ["12 meses de facturación","6 meses de facturación","Importe total del contrato","Sin limitación expresa"] },
      { key: "territory",        label: "Territorio de Aplicación",         type: "select",   options: ["España","Unión Europea","Mundial","A definir en cada proyecto"] },
    ],
    autoGenerates: ["NDA","SLA","PAYMENT","DPA"],
    iaDefaults: ["ad-actio","co-implication"],
  },

  SAAS: {
    label: "Contrato SaaS",
    subtitle: "Suscripción a software como servicio",
    icon: "◉", color: C.colorDPA, complexity: 5,
    law: "RDL 1/1996 LPI · RGPD · Ley 34/2002 LSSI-CE",
    description: "Acuerdo completo para servicios de software en la nube. Incluye licencia de uso, SLA, protección de datos y cesión de PI. Genera NDA, SLA, IP, DPA y Condiciones de Pago.",
    requiredEss: [
      { key: "partyA",        label: "Cliente (Razón Social)",               placeholder: "Empresa Compradora S.L." },
      { key: "partyB",        label: "Proveedor SaaS (Razón Social)",        placeholder: "Software Company España S.A." },
      { key: "jurisdiction",  label: "Juzgados Competentes (Ciudad)",        placeholder: "Barcelona" },
      { key: "effectiveDate", label: "Inicio de Suscripción",                type: "date" },
      { key: "expiryDate",    label: "Fin de Suscripción",                   type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",             label: "CIF/NIF Cliente",                 placeholder: "B-12345678" },
      { key: "partyAAddress",         label: "Domicilio Social Cliente",        placeholder: "Passeig de Gràcia 55, 08007 Barcelona" },
      { key: "partyARepresentative",  label: "Representante Legal Cliente",     placeholder: "D. Carlos López Pérez" },
      { key: "partyBCIF",             label: "CIF/NIF Proveedor",               placeholder: "A-11223344" },
      { key: "partyBAddress",         label: "Domicilio Social Proveedor",      placeholder: "Calle Serrano 100, 28006 Madrid" },
      { key: "partyBRepresentative",  label: "Representante Legal Proveedor",   placeholder: "Dña. Ana Fernández García" },
    ],
    contractFields: [
      { key: "softwareName",      label: "Nombre del Software/Plataforma",    placeholder: "MiApp SaaS v2.0" },
      { key: "licenseType",       label: "Tipo de Licencia",                  type: "select", options: ["Usuario nominado","Usuario concurrente","Por empresa (ilimitado)","Por módulo"] },
      { key: "usersCount",        label: "Nº de Usuarios Licenciados",        type: "number", placeholder: "50" },
      { key: "monthlyFee",        label: "Cuota Mensual (€/mes, sin IVA)",    type: "number", placeholder: "2500" },
      { key: "storageGB",         label: "Almacenamiento Incluido (GB)",      type: "number", placeholder: "500" },
      { key: "dataCenter",        label: "Ubicación del Centro de Datos",     type: "select", options: ["Unión Europea","España","Irlanda (AWS)","Países Bajos (Azure)","EE.UU. (cláusulas SCCs)"] },
      { key: "supportLevel",      label: "Nivel de Soporte Incluido",         type: "select", options: ["Básico (horario laboral)","Estándar (L-V 24h)","Premium (24/7)","Enterprise (SLA personalizado)"] },
      { key: "paymentDays",       label: "Plazo de Pago (días naturales)",    type: "number", placeholder: "30" },
    ],
    autoGenerates: ["NDA","SLA","IP","PAYMENT","DPA"],
    iaDefaults: ["ad-actio","co-implication"],
  },

  DISTRIBUCION: {
    label: "Contrato de Distribución",
    subtitle: "Red de distribución comercial exclusiva o no",
    icon: "⊕", color: "#059669", complexity: 4,
    law: "Código Civil · Código de Comercio · RD 201/2010",
    description: "Regula la distribución de productos o servicios a través de una red comercial. Puede ser exclusivo o no exclusivo, con o sin stock mínimo.",
    requiredEss: [
      { key: "partyA",        label: "Fabricante/Proveedor (Razón Social)", placeholder: "Fabricante España S.A." },
      { key: "partyB",        label: "Distribuidor (Razón Social)",          placeholder: "Distribuciones Sur S.L." },
      { key: "jurisdiction",  label: "Juzgados Competentes (Ciudad)",       placeholder: "Sevilla" },
      { key: "effectiveDate", label: "Fecha de Inicio",                     type: "date" },
      { key: "expiryDate",    label: "Fecha de Vencimiento",                type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",    label: "CIF/NIF Fabricante",     placeholder: "A-12345678" },
      { key: "partyAAddress",label: "Domicilio Fabricante",   placeholder: "Polígono Industrial Norte, Nave 5, 41012 Sevilla" },
      { key: "partyBCIF",    label: "CIF/NIF Distribuidor",   placeholder: "B-87654321" },
      { key: "partyBAddress",label: "Domicilio Distribuidor", placeholder: "Avda. de Europa 15, 41014 Sevilla" },
    ],
    contractFields: [
      { key: "exclusivityType",   label: "Tipo de Exclusividad",        type: "select", options: ["Exclusiva en territorio","No exclusiva","Exclusiva por canal","Selectiva"] },
      { key: "territory",         label: "Territorio de Distribución",  type: "select", options: ["España","Comunidad Autónoma (especificar)","Provincia (especificar)","Europa","Global"] },
      { key: "productRange",      label: "Gama de Productos",           type: "textarea", placeholder: "Todos los productos del catálogo vigente / Línea específica..." },
      { key: "minimumPurchase",   label: "Compra Mínima Anual (€)",     type: "number", placeholder: "50000" },
      { key: "paymentTerms",      label: "Condiciones de Pago",         type: "select", options: ["30 días fecha factura","60 días fecha factura","Pago anticipado","Pago contra entrega"] },
      { key: "stockMinimum",      label: "Stock Mínimo Obligatorio",    type: "text",   placeholder: "30 días de ventas medias" },
      { key: "competitionClause", label: "Cláusula de No Competencia",  type: "select", options: ["Sí, durante vigencia y 1 año tras vencimiento","Solo durante vigencia del contrato","No aplica"] },
    ],
    autoGenerates: ["NDA","PAYMENT"],
    iaDefaults: ["ad-actio"],
  },

  AGENCIA: {
    label: "Contrato de Agencia Comercial",
    subtitle: "Representación comercial independiente",
    icon: "⊗", color: "#D97706", complexity: 3,
    law: "Ley 12/1992 de 27 de mayo sobre Contrato de Agencia",
    description: "Regula la relación entre empresario y agente comercial independiente. Sujeto a la Ley 12/1992, con derechos mínimos irrenunciables del agente.",
    requiredEss: [
      { key: "partyA",        label: "Empresario Principal (Razón Social)", placeholder: "Principal S.A." },
      { key: "partyB",        label: "Agente Comercial (Nombre/Razón Social)", placeholder: "Agente Comercial S.L. o D. Pedro Gómez" },
      { key: "jurisdiction",  label: "Domicilio del Agente (Ciudad)", placeholder: "Valencia" },
      { key: "effectiveDate", label: "Fecha de Inicio",  type: "date" },
      { key: "expiryDate",    label: "Fecha de Vencimiento", type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",    label: "CIF/NIF Empresario",         placeholder: "A-12345678" },
      { key: "partyBCIF",    label: "NIF/CIF Agente",              placeholder: "B-87654321 o DNI" },
      { key: "partyBAddress",label: "Domicilio del Agente",       placeholder: "Calle Colón 25, 46002 Valencia" },
    ],
    contractFields: [
      { key: "agencyTerritory",     label: "Zona/Territorio de Actuación",      type: "text",   placeholder: "Comunitat Valenciana, Murcia y Baleares" },
      { key: "productRange",        label: "Productos/Servicios a Promocionar", type: "textarea",placeholder: "Catálogo completo de productos industriales..." },
      { key: "commissionRate",      label: "Comisión sobre Ventas (%)",         type: "number", placeholder: "5" },
      { key: "commissionBase",      label: "Base de Cálculo de la Comisión",    type: "select", options: ["Precio neto de venta (sin IVA)","Margen de contribución","Precio bruto de venta"] },
      { key: "minimumCommission",   label: "Comisión Mínima Garantizada (€/mes)",type: "number",placeholder: "1500" },
      { key: "exclusiveAgency",     label: "Exclusividad del Agente",           type: "select", options: ["Exclusivo en su zona (recomendado)","No exclusivo","Exclusivo por canal de cliente"] },
      { key: "indemnityNotice",     label: "Preaviso para Denuncia (meses)",    type: "select", options: ["1 mes (1er año)","2 meses (2º año)","3 meses (3 o más años)","6 meses (por acuerdo)"] },
    ],
    autoGenerates: ["NDA","PAYMENT"],
    iaDefaults: ["ad-actio"],
  },

  COLABORACION: {
    label: "Acuerdo de Colaboración Empresarial",
    subtitle: "Joint venture y alianza estratégica",
    icon: "◆", color: C.colorIP, complexity: 4,
    law: "Código Civil arts. 1665-1708 · Código de Comercio",
    description: "Define los términos de una colaboración o joint venture mercantil. Genera NDA, Cesión de PI y Condiciones de Pago.",
    requiredEss: [
      { key: "partyA",        label: "Socio A (Razón Social)",  placeholder: "Primera Empresa Colaboradora S.L." },
      { key: "partyB",        label: "Socio B (Razón Social)",  placeholder: "Segunda Empresa Colaboradora S.A." },
      { key: "jurisdiction",  label: "Juzgados Competentes",    placeholder: "Madrid" },
      { key: "effectiveDate", label: "Inicio de Colaboración",  type: "date" },
      { key: "expiryDate",    label: "Fin de Colaboración",     type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",            label: "CIF Socio A",                  placeholder: "B-12345678" },
      { key: "partyARepresentative", label: "Representante Legal Socio A",  placeholder: "D. Antonio Ruiz" },
      { key: "partyBCIF",            label: "CIF Socio B",                  placeholder: "A-87654321" },
      { key: "partyBRepresentative", label: "Representante Legal Socio B",  placeholder: "Dña. Elena Torres" },
    ],
    contractFields: [
      { key: "projectName",       label: "Denominación del Proyecto",      placeholder: "Proyecto Innovación Digital 2025" },
      { key: "projectScope",      label: "Alcance del Proyecto",           type: "textarea", placeholder: "Desarrollo conjunto de..." },
      { key: "profitSplitA",      label: "Participación Socio A (%)",      type: "number", placeholder: "50" },
      { key: "profitSplitB",      label: "Participación Socio B (%)",      type: "number", placeholder: "50" },
      { key: "governanceModel",   label: "Órgano de Gobierno",             type: "select", options: ["Comité de Dirección Conjunto","Decisiones por unanimidad","Decisiones por mayoría simple","Socio A como líder"] },
      { key: "ipOwnership",       label: "Titularidad de la PI Creada",    type: "select", options: ["Copropiedad a partes iguales","Proporcional a la contribución","Socio A titular (con licencia a B)","Socio B titular (con licencia a A)"] },
    ],
    autoGenerates: ["NDA","IP","PAYMENT"],
    iaDefaults: ["co-implication","ad-actio"],
  },

  CONSULTORIA: {
    label: "Contrato de Consultoría",
    subtitle: "Prestación de servicios profesionales",
    icon: "◎", color: C.colorSLA, complexity: 3,
    law: "Código Civil arts. 1544 y ss. · Ley 2/2007 Sociedades Prof.",
    description: "Regula la prestación de servicios de consultoría y asesoramiento profesional especializado.",
    requiredEss: [
      { key: "partyA",        label: "Cliente (Razón Social)",              placeholder: "Empresa Contratante S.L." },
      { key: "partyB",        label: "Consultor/a (Nombre o Razón Social)", placeholder: "Consultora Experta S.L.P." },
      { key: "jurisdiction",  label: "Juzgados Competentes",                placeholder: "Bilbao" },
      { key: "effectiveDate", label: "Fecha de Inicio",                     type: "date" },
      { key: "expiryDate",    label: "Fecha de Finalización",               type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",    label: "CIF/NIF Cliente",    placeholder: "B-12345678" },
      { key: "partyBCIF",    label: "CIF/NIF Consultor",  placeholder: "B-98765432 o DNI" },
      { key: "partyBAddress",label: "Domicilio Consultor",placeholder: "Gran Vía 20, 48001 Bilbao" },
    ],
    contractFields: [
      { key: "consultingScope",   label: "Alcance de los Servicios de Consultoría", type: "textarea", placeholder: "Asesoramiento en transformación digital, análisis de procesos..." },
      { key: "hourlyRate",        label: "Tarifa Horaria (€/h, sin IVA)",           type: "number", placeholder: "150" },
      { key: "maxHours",          label: "Horas Máximas Autorizadas",               type: "number", placeholder: "200" },
      { key: "deliverables",      label: "Entregables Comprometidos",               type: "textarea", placeholder: "Informe ejecutivo, plan de acción, sesiones de formación..." },
      { key: "meetingFrequency",  label: "Frecuencia de Reuniones de Seguimiento",  type: "select", options: ["Semanal","Quincenal","Mensual","A demanda"] },
      { key: "expensesPolicy",    label: "Política de Gastos de Desplazamiento",    type: "select", options: ["A cargo del Cliente (con factura)","Incluidos en tarifa","No aplicable (trabajo remoto)"] },
    ],
    autoGenerates: ["NDA","PAYMENT"],
    iaDefaults: ["ad-actio"],
  },

  ARRENDAMIENTO: {
    label: "Contrato de Arrendamiento de Local",
    subtitle: "Arrendamiento para uso distinto de vivienda",
    icon: "⌂", color: "#6B7280", complexity: 3,
    law: "LAU Arts. 29-35 · Código Civil arts. 1546 y ss.",
    description: "Regula el arrendamiento de inmuebles para uso comercial, industrial u otros usos distintos de vivienda, conforme a la Ley de Arrendamientos Urbanos.",
    requiredEss: [
      { key: "partyA",        label: "Arrendador (Razón Social o Nombre)", placeholder: "Inmuebles Madrid S.L." },
      { key: "partyB",        label: "Arrendatario (Razón Social o Nombre)", placeholder: "Comercial Sur S.L." },
      { key: "jurisdiction",  label: "Juzgados Competentes (Ciudad)",       placeholder: "Madrid" },
      { key: "effectiveDate", label: "Fecha de Inicio del Arrendamiento",   type: "date" },
      { key: "expiryDate",    label: "Fecha de Fin del Arrendamiento",      type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",    label: "CIF/NIF Arrendador",        placeholder: "B-12345678" },
      { key: "partyAAddress",label: "Domicilio Arrendador",      placeholder: "Calle Alcalá 50, 28014 Madrid" },
      { key: "partyBCIF",    label: "CIF/NIF Arrendatario",      placeholder: "B-87654321" },
      { key: "partyBAddress",label: "Domicilio Social Arrendatario",placeholder: "Avda. Castellana 200, 28046 Madrid" },
    ],
    contractFields: [
      { key: "propertyAddress", label: "Dirección del Local",              placeholder: "Calle Gran Vía 45, local 2, 28013 Madrid" },
      { key: "propertyArea",    label: "Superficie Total (m²)",            type: "number", placeholder: "250" },
      { key: "monthlyRent",     label: "Renta Mensual (€/mes, sin IVA)",   type: "number", placeholder: "3500" },
      { key: "depositMonths",   label: "Fianza (nº mensualidades)",        type: "select", options: ["1 mensualidad","2 mensualidades","3 mensualidades","Negociada"] },
      { key: "rentReview",      label: "Revisión de Renta",                type: "select", options: ["Anual según IPC","Fija durante vigencia","Según IGC (Índice de Garantía de Competitividad)","Sin revisión"] },
      { key: "allowedUse",      label: "Uso Permitido del Local",         placeholder: "Oficina administrativa y sede social" },
      { key: "reformsAllowed",  label: "Obras de Adaptación",             type: "select", options: ["Prohibidas sin autorización escrita","Permitidas obras menores","Permitidas con proyecto visado","Negociadas caso a caso"] },
    ],
    autoGenerates: [],
    iaDefaults: ["ad-actio"],
  },

  NDA_BILATERAL: {
    label: "Acuerdo de Confidencialidad Bilateral",
    subtitle: "Protección de secretos empresariales",
    icon: "◈", color: C.colorNDA, complexity: 2,
    law: "Ley 1/2019 de Secretos Empresariales · Art. 1258 CC",
    description: "Protege la información confidencial compartida entre ambas partes. Basado en la Ley 1/2019 de Secretos Empresariales. Acuerdo bilateral y recíproco.",
    requiredEss: [
      { key: "partyA",        label: "Parte Divulgadora A (Razón Social)", placeholder: "Empresa Divulgadora S.L." },
      { key: "partyB",        label: "Parte Receptora B (Razón Social)",   placeholder: "Empresa Receptora S.A." },
      { key: "jurisdiction",  label: "Juzgados Competentes (Ciudad)",      placeholder: "Bilbao" },
      { key: "effectiveDate", label: "Fecha de Inicio",                    type: "date" },
      { key: "expiryDate",    label: "Fecha de Vencimiento",               type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",    label: "CIF/NIF Parte A", placeholder: "B-12345678" },
      { key: "partyAAddress",label: "Domicilio Parte A",placeholder: "Calle Autonomía 52, 48012 Bilbao" },
      { key: "partyBCIF",    label: "CIF/NIF Parte B", placeholder: "A-87654321" },
      { key: "partyBAddress",label: "Domicilio Parte B",placeholder: "Gran Vía Don Diego López 5, 48001 Bilbao" },
    ],
    contractFields: [
      { key: "ndaType",              label: "Tipo de Acuerdo",                    type: "select",   options: ["Bilateral (ambas partes se obligan)","Unilateral (solo la receptora se obliga)"] },
      { key: "confidentialityScope", label: "Alcance de la Información Protegida",type: "textarea", placeholder: "Know-how, datos técnicos, información financiera, datos de clientes..." },
      { key: "confidentialityPeriod",label: "Plazo de Confidencialidad (años)",   type: "number",   placeholder: "5" },
      { key: "penaltyAmount",        label: "Cláusula Penal por Incumplimiento (€)",type: "number",  placeholder: "50000" },
      { key: "personalDataShared",   label: "¿Se Comparten Datos Personales?",    type: "select",   options: ["Sí (aplica RGPD/LOPDGDD)","No","Posiblemente (incluir cautela RGPD)"] },
    ],
    autoGenerates: [],
    iaDefaults: ["non","de-actio"],
  },

  ARRENDAMIENTO_HOTEL_FUTURO: {
    label: "Arrendamiento de Cosa Futura + Circumcontrato Financiero",
    subtitle: "Hotel futuro · Dación dineraria · Hipoteca · Cesión de crédito",
    icon: "⌂", color: "#7C3AED", complexity: 5,
    law: "CC arts. 1542-1545 (cosa futura) · Art. 1.911 CC · LH · Ley 2/1994",
    description: "Estructura compleja KPMG: arrendamiento de cosa futura (hotel en construcción) + circumcontrato de financiación + hipoteca + cesión de crédito de rentas futuras. El circumcontrato ES una Circumacción CA2 del fenómeno principal. Vinculados por IF: la extinción del arrendamiento extingue el circumcontrato.",
    requiredEss: [
      { key: "partyA",        label: "Deudor(es) / Arrendatario(s) (Razón Social)", placeholder: "Sociedad Hotelera SL" },
      { key: "partyB",        label: "Prestador / Arrendador / Financiador",          placeholder: "Fondo Inversión SA" },
      { key: "jurisdiction",  label: "Juzgados Competentes (Ciudad)",                 placeholder: "Valencia" },
      { key: "effectiveDate", label: "Fecha de Firma del Contrato",                   type: "date" },
      { key: "expiryDate",    label: "Fecha de Vencimiento del Arrendamiento",        type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",            label: "NIF/CIF Deudor Principal",              placeholder: "B-12345678" },
      { key: "partyAAddress",        label: "Domicilio Deudor Principal",             placeholder: "Calle Colón 1, 46002 Valencia" },
      { key: "partyARepresentative", label: "Representante Legal Deudor",             placeholder: "D. Nombre Apellidos" },
      { key: "deudor2Name",          label: "Deudor 2 (si existe)",                   placeholder: "Segunda Sociedad SL" },
      { key: "deudor2CIF",           label: "NIF/CIF Deudor 2",                       placeholder: "A-87654321" },
      { key: "partyBCIF",            label: "NIF/CIF Prestador/Financiador",          placeholder: "A-11223344" },
      { key: "partyBAddress",        label: "Domicilio Prestador",                    placeholder: "Paseo de la Castellana 100, 28046 Madrid" },
      { key: "partyBRepresentative", label: "Representante Legal Prestador",          placeholder: "Dña. Nombre Apellidos" },
    ],
    contractFields: [
      { key: "hotelName",          label: "Denominación del Hotel Futuro (Cosa)",       placeholder: "Hotel Valencia Grand · 4 estrellas" },
      { key: "propertyAddress",    label: "Dirección del Solar / Inmueble",             placeholder: "Avda. del Puerto 15, 46023 Valencia" },
      { key: "catastralReference", label: "Referencia Catastral del Solar",             placeholder: "4612301YJ2741A0001LB" },
      { key: "rentalAmount",       label: "Renta de Arrendamiento (€/mes)",             type: "number", placeholder: "50000" },
      { key: "loanAmount",         label: "Capital del Circumcontrato/Préstamo (€)",    type: "number", placeholder: "100000000" },
      { key: "loanTermYears",      label: "Plazo del Circumcontrato (años)",            type: "number", placeholder: "20" },
      { key: "interestRate",       label: "Tipo de Interés del Circumcontrato",         type: "select", options: ["EURIBOR + 2,00%","EURIBOR + 1,50%","Fijo 3,00%","Fijo 3,50%"] },
      { key: "mortgageAmount",     label: "Responsabilidad Hipotecaria (€)",            type: "number", placeholder: "100000000" },
      // PHENOMENON-specific: the circumcontract is explicitly a CA2
      { key: "circumcontractNote", label: "Nota PHENOMENON: El circumcontrato es CA2",  type: "select", options: ["CA2 — Circumacción nivel 2 (contexto financiero del F principal)","Sub-fenómeno IF vinculado al F principal"] },
      { key: "cosaFuturaCondition",label: "Condición de Cosa Futura",                   type: "select", options: ["Hotel en fase de proyecto (F: INITIALIZED)","Hotel en construcción (F: ACTIVE parcial)","Hotel terminado y entregado (F: ACTIVE completo)"] },
    ],
    // Sub-contracts: FINANCIACION (circumcontrato), HIPOTECA_GARANTIA, CESION_CREDITO
    autoGenerates: ["FINANCIACION", "HIPOTECA_GARANTIA", "CESION_CREDITO"],
    iaDefaults: ["ad-actio", "co-implication"],
    // PHENOMENON notes for this template
    phenomenonNotes: {
      mainContract: "F1 — Arrendamiento de Cosa Futura (hotel en construcción). Estado: INITIALIZED hasta entrega del hotel.",
      circumcontract: "CA2 — Circumcontrato de Arrendamiento de Servicios. Circunda el F1 financieramente. IF vinculante: extinción de F1 → extinción de CA2.",
      mortgage: "Hipoteca sobre solar y edificación futura. Bloque V: OPONIBILIDAD requiere inscripción en Registro de la Propiedad.",
      cesion: "Cesión de rentas futuras e IVA. IF transferencia: las rentas del F1 se proyectan al F del acreedor cesionario.",
    },
  },

  COMPRAVENTA_SOLAR: {
    label: "Compraventa Fractalizada — Suelo Urbano con Pago Aplazado",
    subtitle: "Condición solar · Pago aplazado al reclasificarse como solar",
    icon: "⬟", color: "#92400E", complexity: 5,
    law: "CC arts. 1445-1537 · RDL 7/2015 Ley del Suelo · IIVTNU · ITP CCAA",
    description: "Contrato de compraventa sobre suelo urbano no consolidado, con precio aplazado condicionado a la obtención de la calificación de «solar» (Art. 1123 CC, condición suspensiva). El motor PHENOMENON modela las fases F1→IF→F2→IF→F3 de la operación, propagando cambios en cascada entre precio, cargas urbanísticas y tributos. Diseñado según doctrina Cuatrecasas y Uría Menéndez para operaciones de suelo con gestión urbanística pendiente.",
    requiredEss: [
      { key: "partyA",        label: "Vendedor/a (Razón Social o Nombre)", placeholder: "Promotora Suelos S.L." },
      { key: "partyB",        label: "Comprador/a (Razón Social o Nombre)", placeholder: "Inversiones Inmobiliarias S.A." },
      { key: "jurisdiction",  label: "Juzgados Competentes (Ciudad)",        placeholder: "Málaga" },
      { key: "effectiveDate", label: "Fecha de Firma del Contrato",          type: "date" },
      { key: "expiryDate",    label: "Plazo Máximo para Condición Solar",    type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",            label: "NIF/CIF Vendedor",                      placeholder: "B-12345678" },
      { key: "partyAAddress",        label: "Domicilio Vendedor",                    placeholder: "Calle Larios 5, 29005 Málaga" },
      { key: "partyARepresentative", label: "Representante Legal Vendedor",          placeholder: "D. José Moreno Ruiz" },
      { key: "partyBCIF",            label: "NIF/CIF Comprador",                     placeholder: "A-87654321" },
      { key: "partyBAddress",        label: "Domicilio Comprador",                   placeholder: "Paseo de la Castellana 100, 28046 Madrid" },
      { key: "partyBRepresentative", label: "Representante Legal Comprador",         placeholder: "Dña. Carmen Jiménez López" },
      { key: "notarioName",          label: "Notario Autorizante (Acta de Reserva)", placeholder: "D. Francisco García Pérez, Notario de Málaga" },
    ],
    contractFields: [
      { key: "propertyAddress",      label: "Dirección del Suelo",                   placeholder: "Parcela 12, Unidad de Ejecución 3, Sector SUB-3, 29016 Málaga", ontologyTag: "cosa", note: "La cosa vendida sigue siendo el terreno. La condición urbanística posterior no sustituye este objeto físico." },
      { key: "catastralReference",   label: "Referencia Catastral",                  placeholder: "29067A012003400000LK", ontologyTag: "cosa", note: "Identifica la cosa y su soporte material, no la legitimidad real de la transmisión." },
      { key: "surfaceM2",            label: "Superficie Registral (m²)",             type: "number", placeholder: "1500", ontologyTag: "cosa" },
      { key: "urbanClassification",  label: "Clasificación Urbanística Actual",      type: "select", options: ["Suelo urbano no consolidado (SUNC)","Suelo urbanizable sectorizado","Suelo urbanizable no sectorizado","Suelo de núcleo rural con gestión pendiente"] },
      { key: "totalPrice",           label: "Precio Total Acordado (€)",            type: "number", placeholder: "450000" },
      { key: "priceAtSigning",       label: "Precio a Pagar a la Firma (€)",        type: "number", placeholder: "90000" },
      { key: "deferredPrice",        label: "Precio Aplazado — al obtener Solar (€)",type: "number", placeholder: "360000" },
      { key: "deferredInterestRate", label: "Interés del Precio Aplazado (%/año)",  type: "number", placeholder: "0" },
      { key: "ifTemporal",           label: "IF temporal — plazo máximo",            type: "select", options: ["Máximo 2 años desde la firma para verificar la condición urbanística","Plazo distinto pactado entre las partes"], note: "PHENOMENON distingue el plazo como modulación temporal. Si supera 2 años, el caso se aleja del supuesto estructural base." },
      { key: "ifLogica",             label: "IF lógica — condición de activación",   type: "select", options: ["Obtención de condición urbanística suficiente para operar como solar","Obtención de licencia o acto administrativo equivalente"], note: "La condición urbanística es prosecución lógica del fenómeno, no el objeto vendido." },
      { key: "ifOposicion",          label: "IF oposición — bloqueo / frustración",  type: "select", options: ["Impago del precio aplazado","Falta de prosecución urbanística razonable","Impago o falta de prosecución"], note: "Recoge el punto de oposición: impago o quiebra del iter pactado." },
      { key: "urbanisticConditionType", label: "Naturaleza de la condición urbanística", type: "select", options: ["Modulación lógica del fenómeno (no integra la cosa vendida)","Obligación de resultado garantizada por el vendedor"], note: "El documento fuente separa condición de ser y prestación accesoria: el vendedor puede asumir cuotas urbanísticas sin garantizar que el terreno llegue a ser solar." },
      { key: "sellerObligations",    label: "Prestaciones accesorias del vendedor",  type: "textarea", placeholder: "Pago de cuotas urbanísticas, cooperación documental, comparecencia notarial...", note: "Describa solo prestaciones accesorias o de prosecución. No confunda estas cargas con una garantía ontológica de que la condición se cumplirá." },
      { key: "solarConditionTrigger",label: "Condición Solar se Acredita Mediante", type: "select", options: ["Certificado de recepción de obras de urbanización","Licencia de obras de edificación concedida","Inscripción del proyecto de reparcelación en Registro de la Propiedad","Acta notarial de conformidad del Ayuntamiento"] },
      { key: "urbanizationCharges",  label: "Cargas Urbanísticas a Cargo de",       type: "select", options: ["Vendedor (se descuentan del precio aplazado)","Comprador (asume íntegramente)","Prorrateo proporcional a la superficie","Según cuotas de urbanización del Plan"] },
      { key: "itpRate",              label: "Tipo ITP CCAA Aplicable (%)",           type: "select", options: ["7% (Andalucía)","10% (Cataluña, Valencia, Madrid)","8% (País Vasco)","6% (Canarias)","Otro (a definir)"] },
      { key: "iivtnuResponsibility", label: "Plusvalía Municipal (IIVTNU)",          type: "select", options: ["A cargo del Vendedor (regla general)","A cargo del Comprador (por pacto expreso)","Exento por no incremento de valor (Art. 104.5 TRLHL)"] },
      { key: "tradicionType",        label: "Traditio pactada",                      type: "select", options: ["real","instrumental (Art. 1462 CC)"], ontologyTag: "bien", note: "La escritura puede operar como instrumento bastante de traditio, pero no equivale por sí sola a traditio real consumada." },
      { key: "registryDiffusionRole",label: "Función del Registro en esta operación",type: "select", options: ["Difusión registral del bien/documento, sin equivaler por sí sola a traditio real","Refuerzo documental de la transmisión instrumental","La inscripción garantiza por sí sola la traditio real"], ontologyTag: "bien", note: "El Registro difunde configuraciones documentales y factores patrimoniales; no crea legitimidad real ni sustituye la prosecución efectiva." },
      { key: "mortgageEncumbrance",  label: "Cargas Hipotecarias sobre el Suelo",   type: "select", options: ["Sin cargas hipotecarias","Hipoteca a subrogarse por el comprador","Hipoteca a cancelar con el precio de firma","Hipoteca a cancelar con el precio aplazado"], ontologyTag: "bien" },
      { key: "rightOfFirstRefusal",  label: "Tanteo y Retracto Urbanístico",        type: "select", options: ["No aplica (suelo privado sin derechos de tanteo público)","Ayuntamiento tiene derecho de tanteo (notificar antes de firmar)","Comunidad Autónoma tiene derecho de retracto","Verificar cargas en Registro de la Propiedad"], ontologyTag: "bien" },
    ],
    autoGenerates: ["CONDICION_SOLAR","PAGO_APLAZADO","CARGAS_URBANISTICAS"],
    iaDefaults: ["ad-actio","co-implication"],
  },

  COMPRAVENTA_TERRENO: {
    label: "Compraventa de Terreno — Pago Aplazado y Cargas",
    subtitle: "Compra directa del terreno · condición urbanística no garantizada",
    icon: "◭", color: "#7C2D12", complexity: 4,
    law: "CC arts. 1445-1537 · Art. 1462 CC · RDL 7/2015 Ley del Suelo",
    description: "Compraventa directa de terreno con precio parcialmente aplazado y reparto de cargas urbanísticas. Distingue entre la cosa vendida (el terreno), la condición urbanística futura como prosecución lógica, la traditio real o instrumental y la función meramente difusiva del Registro.",
    requiredEss: [
      { key: "partyA",        label: "Vendedor/a (Razón Social o Nombre)", placeholder: "Promotora Suelos S.L." },
      { key: "partyB",        label: "Comprador/a (Razón Social o Nombre)", placeholder: "Inversiones Territoriales S.A." },
      { key: "jurisdiction",  label: "Juzgados Competentes (Ciudad)",       placeholder: "Málaga" },
      { key: "effectiveDate", label: "Fecha de Firma del Contrato",         type: "date" },
      { key: "expiryDate",    label: "Fecha Límite del Iter Urbanístico",   type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",            label: "NIF/CIF Vendedor",              placeholder: "B-12345678" },
      { key: "partyAAddress",        label: "Domicilio Vendedor",            placeholder: "Calle Larios 5, 29005 Málaga" },
      { key: "partyARepresentative", label: "Representante Legal Vendedor",  placeholder: "D. José Moreno Ruiz" },
      { key: "partyBCIF",            label: "NIF/CIF Comprador",             placeholder: "A-87654321" },
      { key: "partyBAddress",        label: "Domicilio Comprador",           placeholder: "Paseo de la Castellana 100, 28046 Madrid" },
      { key: "partyBRepresentative", label: "Representante Legal Comprador", placeholder: "Dña. Carmen Jiménez López" },
      { key: "notarioName",          label: "Notario Autorizante",           placeholder: "D. Francisco García Pérez, Notario de Málaga" },
    ],
    contractFields: [
      { key: "propertyAddress",      label: "Dirección del Terreno",                 placeholder: "Parcela 12, Unidad de Ejecución 3, Sector SUB-3, 29016 Málaga", ontologyTag: "cosa", note: "La cosa vendida es el terreno mismo; la evolución urbanística futura no altera este núcleo objetual." },
      { key: "catastralReference",   label: "Referencia Catastral",                  placeholder: "29067A012003400000LK", ontologyTag: "cosa" },
      { key: "surfaceM2",            label: "Superficie Registral (m²)",             type: "number", placeholder: "1500", ontologyTag: "cosa" },
      { key: "totalPrice",           label: "Precio Total Acordado (€)",             type: "number", placeholder: "450000" },
      { key: "priceAtSigning",       label: "Precio a Pagar a la Firma (€)",         type: "number", placeholder: "90000" },
      { key: "deferredPrice",        label: "Precio Aplazado (€)",                   type: "number", placeholder: "360000" },
      { key: "paymentDeadlineDays",  label: "Plazo del Pago Aplazado (días)",        type: "number", placeholder: "30" },
      { key: "ifTemporal",           label: "IF temporal — plazo máximo",            type: "select", options: ["Máximo 2 años desde la firma para el hito urbanístico","Plazo distinto pactado entre las partes"], note: "El supuesto base del caso fija un techo de 2 años. Un plazo superior activa riesgo alto." },
      { key: "ifLogica",             label: "IF lógica — condición de activación",   type: "select", options: ["Obtención de condición urbanística suficiente para operar como solar","Obtención de licencia o acto administrativo equivalente"], note: "La condición urbanística pertenece a la prosecución lógica del fenómeno, no al objeto vendido." },
      { key: "ifOposicion",          label: "IF oposición — bloqueo / frustración",  type: "select", options: ["Impago del precio aplazado","Falta de prosecución urbanística razonable","Impago o falta de prosecución"] },
      { key: "urbanisticConditionType", label: "Naturaleza de la condición urbanística", type: "select", options: ["Modulación lógica del fenómeno (no integra la cosa vendida)","Obligación de resultado garantizada por el vendedor"], note: "Use la primera opción cuando la urbanización sea una condición externa o accesoria, no una garantía de resultado." },
      { key: "sellerObligations",    label: "Prestaciones accesorias del vendedor",  type: "textarea", placeholder: "Pago de cuotas urbanísticas, cooperación documental, comparecencia notarial...", note: "Describe prestaciones accesorias como pago de cuotas o colaboración urbanística, sin convertirlas en promesa ontológica de transformar el terreno en solar." },
      { key: "tradicionType",        label: "Traditio pactada",                      type: "select", options: ["real","instrumental (Art. 1462 CC)"], ontologyTag: "bien", note: "La traditio instrumental puede articularse mediante escritura, pero no se identifica automáticamente con traditio real." },
      { key: "registryDiffusionRole",label: "Función del Registro en esta operación",type: "select", options: ["Difusión registral del bien/documento, sin equivaler por sí sola a traditio real","Refuerzo documental de la transmisión instrumental","La inscripción garantiza por sí sola la traditio real"], ontologyTag: "bien", note: "El Registro difunde configuraciones documentales y factores relativos a bienes; no crea legitimidad real ni sustituye la prosecución consumada." },
    ],
    autoGenerates: ["PAGO_APLAZADO","CARGAS_URBANISTICAS"],
    iaDefaults: ["ad-actio","co-implication"],
  },

  KPMG: {
    label: "Arrendamiento de Cosa Futura (KPMG)",
    subtitle: "Hotel Mediterráneo Valencia 5* · Estructura fractal PHENOMENON",
    icon: "⊛", color: "#7C3AED", complexity: 5,
    law: "CC arts. 1544 · 1461 · 1875 · 1526-1536 · LH · LCCI",
    description: "Estructura jurídica compleja: arrendamiento de cosa futura sobre hotel 5* + circumcontrato de financiación (CA2, €100M) + hipoteca edificación futura + cesión de crédito rentas/IVA. Caso real KPMG Valencia.",
    requiredEss: [
      { key: "partyA",        label: "Prestador / Entidad Financiadora",    placeholder: "Banco Mediterráneo de Inversiones S.A." },
      { key: "partyB",        label: "Promotora / Arrendataria",            placeholder: "Promotora Hotel Mediterráneo Valencia S.L." },
      { key: "jurisdiction",  label: "Juzgados Competentes",                placeholder: "Valencia" },
      { key: "effectiveDate", label: "Fecha de Firma del Arrendamiento",    type: "date" },
      { key: "expiryDate",    label: "Vencimiento del Arrendamiento",       type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",            label: "CIF Entidad Financiadora",            placeholder: "A-46123456" },
      { key: "partyAAddress",        label: "Domicilio Entidad Financiadora",      placeholder: "Paseo de la Alameda 45, 46010 Valencia" },
      { key: "partyARepresentative", label: "Representante Entidad Financiadora",  placeholder: "D. Carlos Mendoza Ruiz, Consejero Delegado" },
      { key: "partyBCIF",            label: "CIF Promotora",                       placeholder: "B-46987654" },
      { key: "partyBAddress",        label: "Domicilio Promotora",                 placeholder: "Calle del Mar 15, 46001 Valencia" },
      { key: "partyBRepresentative", label: "Representante Promotora",             placeholder: "D. Antonio García Pérez, Administrador Único" },
    ],
    contractFields: [
      { key: "hotelName",           label: "Denominación del Hotel",             placeholder: "Hotel Mediterráneo Valencia 5*" },
      { key: "catastralReference",  label: "Referencia Catastral del Solar",     placeholder: "7820517YJ2782A0001UB" },
      { key: "buildingArea",        label: "Superficie Construida (m²)",         type: "number", placeholder: "3250" },
      { key: "constructionTarget",  label: "Fecha Límite Finalización Obra",     type: "date" },
      { key: "baseAmount",          label: "Capital del Circumcontrato (€)",     type: "number", placeholder: "100000000" },
      { key: "euriborRate",         label: "EURIBOR 12M de Referencia (%)",      type: "number", placeholder: "3.50" },
      { key: "spread",              label: "Diferencial (Spread) sobre EURIBOR (%)", type: "number", placeholder: "2.00" },
      { key: "termYears",           label: "Plazo del Arrendamiento (años)",     type: "number", placeholder: "20" },
      { key: "monthlyRentHotel",    label: "Renta Mensual del Hotel (€/mes)",   type: "number", placeholder: "1064583" },
      { key: "ivaDevolutionEst",    label: "Estimación Devolución IVA Obras (€)", type: "number", placeholder: "8400000" },
      { key: "hotelCategory",       label: "Categoría del Hotel",               type: "select", options: ["5 Estrellas Gran Lujo","5 Estrellas","4 Estrellas Superior","4 Estrellas"] },
      { key: "registryOffice",      label: "Registro de la Propiedad",          placeholder: "Registro de la Propiedad de Valencia nº 5" },
    ],
    autoGenerates: ["FINANCIACION","HIPOTECA_GARANTIA","CESION_CREDITO"],
    iaDefaults: ["ad-actio","co-implication"],
    isDemo: true,
  },

  // ─── CASO SEGUROS: 4 insurance types ────────────────────────────────────────
  SEGURO_VIDA: {
    label: "Seguro de Vida",
    subtitle: "Cobertura vital · Riesgo personal",
    icon: "♡", color: "#059669", complexity: 4,
    law: "Ley 50/1980 LCS arts. 83-99 · TRLOSSP RDL 6/2004",
    description: "Póliza de seguro de vida individual. IF_exclusion: exclusiones médicas BLOQUEAN la cobertura. Genera cláusula de cobertura, tabla de exclusiones y cuadro de primas.",
    requiredEss: [
      { key: "partyA", label: "Tomador del Seguro (Nombre/Razón Social)", placeholder: "D. Pedro García López" },
      { key: "partyB", label: "Entidad Aseguradora (Razón Social)", placeholder: "AXA Vida S.A." },
      { key: "jurisdiction", label: "Juzgados Competentes (Ciudad)", placeholder: "Madrid" },
      { key: "effectiveDate", label: "Fecha de Efecto de la Póliza", type: "date" },
      { key: "expiryDate", label: "Fecha de Vencimiento", type: "date" },
    ],
    partyFields: [
      { key: "partyACIF", label: "NIF Tomador", placeholder: "12345678-A" },
      { key: "partyAAddress", label: "Domicilio Tomador", placeholder: "Calle Mayor 10, 28001 Madrid" },
      { key: "partyBCIF", label: "CIF Aseguradora", placeholder: "A-28123456" },
      { key: "partyBAddress", label: "Domicilio Social Aseguradora", placeholder: "Paseo de la Castellana 33, 28046 Madrid" },
    ],
    contractFields: [
      { key: "insuredName", label: "Nombre del Asegurado", placeholder: "D. Pedro García López" },
      { key: "insuredAge", label: "Edad del Asegurado (años)", type: "number", placeholder: "45" },
      { key: "capitalDeceso", label: "Capital Asegurado — Fallecimiento (€)", type: "number", placeholder: "300000" },
      { key: "capitalInvalidez", label: "Capital Asegurado — Invalidez (€)", type: "number", placeholder: "300000" },
      { key: "primaAnual", label: "Prima Anual (€)", type: "number", placeholder: "1850" },
      { key: "beneficiaries", label: "Beneficiarios Designados", placeholder: "Cónyuge e hijos por partes iguales" },
      { key: "coverageType", label: "Modalidad de Cobertura", type: "select", options: ["Fallecimiento e invalidez absoluta permanente","Solo fallecimiento","Vida entera","Mixto (ahorro + riesgo)"] },
      { key: "medicalValidation", label: "Estado Declaración de Salud", type: "select", options: ["Completada y aceptada por aseguradora","Pendiente de valoración médica","Aprobada sin exclusiones","Aprobada con exclusión médica específica"] },
    ],
    autoGenerates: ["COBERTURA_VIDA","EXCLUSIONES_VIDA","PRIMA_VIDA"],
    iaDefaults: ["ad-actio","co-implication"],
    isDemo: true,
  },

  SEGURO_RC: {
    label: "Seguro de Responsabilidad Civil",
    subtitle: "Cobertura por daño a terceros · RC general",
    icon: "◎", color: "#2563EB", complexity: 4,
    law: "Ley 50/1980 LCS arts. 73-76 · Código Civil art. 1902",
    description: "Póliza de RC que cubre al asegurado frente a daños causados a terceros. Franquicia como IF_posición: limita la activación de la cobertura. Genera cobertura, límites de indemnización y franquicia.",
    requiredEss: [
      { key: "partyA", label: "Tomador (Razón Social o Nombre)", placeholder: "Asesoría Jurídica Mediterránea S.L." },
      { key: "partyB", label: "Aseguradora (Razón Social)", placeholder: "Mapfre S.A." },
      { key: "jurisdiction", label: "Juzgados Competentes (Ciudad)", placeholder: "Barcelona" },
      { key: "effectiveDate", label: "Fecha de Efecto", type: "date" },
      { key: "expiryDate", label: "Fecha de Vencimiento", type: "date" },
    ],
    partyFields: [
      { key: "partyACIF", label: "NIF/CIF Tomador", placeholder: "B-08123456" },
      { key: "partyAAddress", label: "Domicilio Tomador", placeholder: "Passeig de Gràcia 55, 08007 Barcelona" },
      { key: "partyBCIF", label: "CIF Aseguradora", placeholder: "A-28765432" },
      { key: "partyBAddress", label: "Domicilio Aseguradora", placeholder: "Carretera de Pozuelo 52, 28220 Majadahonda" },
    ],
    contractFields: [
      { key: "activityInsured", label: "Actividad Asegurada", type: "textarea", placeholder: "Prestación de servicios jurídicos y asesoramiento empresarial" },
      { key: "coverageLimit", label: "Límite por Siniestro (€)", type: "number", placeholder: "600000" },
      { key: "annualAggregateLimit", label: "Límite Agregado Anual (€)", type: "number", placeholder: "1200000" },
      { key: "franquicia", label: "Franquicia por Siniestro (€)", type: "number", placeholder: "3000" },
      { key: "primaAnual", label: "Prima Anual (€)", type: "number", placeholder: "4200" },
      { key: "rcType", label: "Tipo de RC", type: "select", options: ["RC Profesional (errores y omisiones)","RC General (explotación)","RC Patronal","RC Productos"] },
    ],
    autoGenerates: ["COBERTURA_RC","LIMITES_RC","FRANQUICIA_RC"],
    iaDefaults: ["ad-actio","co-implication"],
    isDemo: true,
  },

  SEGURO_DANOS: {
    label: "Seguro de Daños Materiales",
    subtitle: "Cobertura por daño al bien asegurado",
    icon: "⊕", color: "#D97706", complexity: 4,
    law: "Ley 50/1980 LCS arts. 25-60 · art. 38 (peritación)",
    description: "Póliza que cubre daños materiales al bien asegurado. El proceso de peritación es el IF que determina el importe de la indemnización. Genera cobertura, procedimiento de peritación y exclusiones.",
    requiredEss: [
      { key: "partyA", label: "Tomador/Propietario del Bien", placeholder: "Comerciales del Levante S.L." },
      { key: "partyB", label: "Entidad Aseguradora", placeholder: "Allianz S.A." },
      { key: "jurisdiction", label: "Juzgados Competentes (Ciudad)", placeholder: "Valencia" },
      { key: "effectiveDate", label: "Fecha de Efecto", type: "date" },
      { key: "expiryDate", label: "Fecha de Vencimiento", type: "date" },
    ],
    partyFields: [
      { key: "partyACIF", label: "NIF/CIF Tomador", placeholder: "B-46123456" },
      { key: "partyAAddress", label: "Domicilio del Bien", placeholder: "Polígono Industrial Norte, Nave 12, 46015 Valencia" },
      { key: "partyBCIF", label: "CIF Aseguradora", placeholder: "A-28765432" },
      { key: "partyBAddress", label: "Domicilio Aseguradora", placeholder: "Gran Vía 24, 28001 Madrid" },
    ],
    contractFields: [
      { key: "propertyDescription", label: "Bien Asegurado", type: "textarea", placeholder: "Nave industrial de 1.500 m², estructura metálica, cubierta de hormigón prefabricado..." },
      { key: "propertyValue", label: "Valor en Nuevo del Bien (€)", type: "number", placeholder: "750000" },
      { key: "coverageRisks", label: "Riesgos Cubiertos", type: "select", options: ["Incendio y daños por agua","Todo riesgo (all-risk)","Robo y expoliación","Daños eléctricos y averías"] },
      { key: "primaAnual", label: "Prima Anual (€)", type: "number", placeholder: "3150" },
      { key: "deductible", label: "Franquicia por Siniestro (%)", type: "number", placeholder: "10" },
      { key: "peritacionMethod", label: "Método de Peritación", type: "select", options: ["Perito de aseguradora","Perito de parte + árbitro (art. 38 LCS)","Tasación pericial contradictoria","Valoración rápida (< 3.000 €)"] },
    ],
    autoGenerates: ["COBERTURA_DANOS","PERITACION","EXCLUSIONES_DANOS"],
    iaDefaults: ["ad-actio","co-implication"],
    isDemo: true,
  },

  SEGURO_CREDITO_COMERCIAL: {
    label: "Seguro de Crédito Comercial",
    subtitle: "Cobertura por incumplimiento de obligación dineraria",
    icon: "⬡", color: "#7C3AED", complexity: 5,
    law: "Ley 50/1980 LCS arts. 69-72 · Ley 22/2003 Concursal",
    description: "Póliza que cubre al asegurado frente al impago de deudores comerciales. La validación financiera del deudor es IF_exclusion: si el rating es insuficiente, la cobertura queda BLOQUEADA. Genera cobertura, validación financiera y análisis de riesgo empresarial.",
    requiredEss: [
      { key: "partyA", label: "Acreedor Asegurado (Razón Social)", placeholder: "Exportaciones Ibéricas S.A." },
      { key: "partyB", label: "Entidad Aseguradora", placeholder: "Mapfre Crédito y Caución S.A." },
      { key: "jurisdiction", label: "Juzgados Competentes (Ciudad)", placeholder: "Madrid" },
      { key: "effectiveDate", label: "Fecha de Efecto de la Póliza", type: "date" },
      { key: "expiryDate", label: "Fecha de Vencimiento", type: "date" },
    ],
    partyFields: [
      { key: "partyACIF", label: "CIF Acreedor", placeholder: "A-28123456" },
      { key: "partyAAddress", label: "Domicilio Acreedor", placeholder: "Calle Serrano 100, 28006 Madrid" },
      { key: "partyBCIF", label: "CIF Aseguradora", placeholder: "A-28765000" },
      { key: "partyBAddress", label: "Domicilio Aseguradora", placeholder: "Carretera de Pozuelo 52, 28220 Majadahonda" },
    ],
    contractFields: [
      { key: "debtorName", label: "Deudor Principal Cubierto", placeholder: "Distribuciones Sur S.L." },
      { key: "creditLimit", label: "Límite Máximo por Deudor (€)", type: "number", placeholder: "500000" },
      { key: "indemnityPct", label: "Porcentaje de Indemnización (%)", type: "number", placeholder: "85" },
      { key: "primaAnual", label: "Prima Anual (€)", type: "number", placeholder: "8750" },
      { key: "waitingPeriod", label: "Período de Espera (meses)", type: "number", placeholder: "6" },
      { key: "financialValidation", label: "Estado Validación Financiera Deudor", type: "select", options: ["Superada — Rating A o B (cobertura activa)","En proceso de revisión (cobertura en espera)","Rechazada — Rating C o D (cobertura BLOQUEADA)","Pendiente de primera calificación"] },
    ],
    autoGenerates: ["COBERTURA_CREDITO","VALIDACION_FINANCIERA","RIESGO_EMPRESARIAL"],
    iaDefaults: ["ad-actio"],
    isDemo: true,
  },

  KPMG_CORPORATE: {
    label: "Validación Corporativa KPMG",
    subtitle: "Gobierno, cumplimiento y aprobación de operaciones corporativas",
    icon: "🏛", color: "#2563EB", complexity: 4,
    law: "Ley 22/2015 Sociedades de Capital · Código de Comercio · Ley 10/2010 Prevención Blanqueo",
    description: "Capa de gobernanza corporativa sobre una operación KPMG: compliance, auditoría, aprobación regulatoria y resolución del consejo.",
    requiredEss: [
      { key: "partyA",        label: "Entidad Solicitante / Socio A",       placeholder: "Promotora Hotel Mediterráneo Valencia S.L." },
      { key: "partyB",        label: "Entidad Evaluadora / Socio B",        placeholder: "KPMG Corporate Advisory S.L." },
      { key: "jurisdiction",  label: "Jurisdicción de la Operación",         placeholder: "Valencia" },
      { key: "effectiveDate", label: "Fecha de Inicio de la Validación",    type: "date" },
      { key: "expiryDate",    label: "Fecha Límite de Aprobación",         type: "date" },
    ],
    partyFields: [
      { key: "partyACIF",            label: "CIF Solicitante",                      placeholder: "B-46987654" },
      { key: "partyARepresentative", label: "Responsable del Proyecto",             placeholder: "D. Antonio García Pérez" },
      { key: "partyBCIF",            label: "CIF Evaluador",                        placeholder: "B-12345678" },
      { key: "partyBRepresentative", label: "Compliance Officer / Auditor",        placeholder: "D. Laura Torres Ramírez" },
    ],
    contractFields: [
      { key: "approvalChain",      label: "Cadena de Aprobación",                 placeholder: "Compliance → Auditoría → Regulador → Junta" },
      { key: "complianceOfficer",  label: "Responsable de Cumplimiento",         placeholder: "D. Laura Torres Ramírez" },
      { key: "auditScope",         label: "Alcance de la Auditoría",              type: "textarea", placeholder: "Revisión de gobierno corporativo, control interno, cumplimiento normativo y gestión de riesgos." },
      { key: "regulatoryBody",     label: "Órgano Regulador",                     placeholder: "Comisión Nacional del Mercado de Valores" },
      { key: "approvalDeadline",   label: "Plazo de Aprobación",                 type: "date" },
      { key: "boardMeetingDate",   label: "Fecha de Junta de Aprobación",        type: "date" },
    ],
    autoGenerates: ["COMPLIANCE_CHECK","AUDIT_REPORT","REGULATORY_APPROVAL","BOARD_RESOLUTION"],
    iaDefaults: ["ad-actio","co-implication"],
  },
};

// ─── Sub-contract metadata ────────────────────────────────────────────────────
export const SUB_META = {
  NDA:                  { label: "Acuerdo de Confidencialidad",         short: "NDA",      color: C.colorNDA,     icon: "◈", law: "Ley 1/2019 · Art. 1258 CC" },
  SLA:                  { label: "Acuerdo de Nivel de Servicio",        short: "SLA",      color: C.colorSLA,     icon: "◎", law: "Art. 1152 CC · Ley 7/1996" },
  PAYMENT:              { label: "Condiciones de Pago",                  short: "PAGO",     color: C.colorPAYMENT, icon: "◇", law: "Ley 3/2004 · IVA Ley 37/1992" },
  IP:                   { label: "Cesión de Propiedad Intelectual",      short: "PI",       color: C.colorIP,      icon: "◆", law: "RDL 1/1996 LPI · Ley 24/2015" },
  DPA:                  { label: "Acuerdo de Tratamiento de Datos",      short: "DPA",      color: C.colorDPA,     icon: "◉", law: "RGPD Art. 28 · LOPDGDD 3/2018" },
  // Arrendamiento de cosa futura (KPMG structure)
  FINANCIACION:         { label: "Circumcontrato de Financiación (CA2)",        short: "CIRCUM", color: "#7C3AED", icon: "⊛", law: "CC art. 1753 · LCCI · Ley 2/1994" },
  HIPOTECA_GARANTIA:    { label: "Hipoteca sobre Solar y Edificación Futura",   short: "HIPOT.", color: "#92400E", icon: "⊞", law: "Art. 1875 CC · LH · AJD" },
  CESION_CREDITO:       { label: "Cesión de Crédito — Rentas Futuras + IVA",    short: "CESIÓN", color: "#0891B2", icon: "⊟", law: "Arts. 1526-1536 CC" },
  COMPLIANCE_CHECK:     { label: "Verificación de Compliance",                short: "COMPLIANCE", color: "#2563EB", icon: "✔", law: "Ley 10/2010 · Código de Comercio art. 44" },
  AUDIT_REPORT:         { label: "Informe de Auditoría",                     short: "AUDIT",     color: "#7C3AED", icon: "🧾", law: "Ley 22/2015 · NIA 315" },
  REGULATORY_APPROVAL:  { label: "Aprobación Regulatoria",                    short: "REGULADOR", color: "#DC2626", icon: "✕", law: "Ley 47/2003 del Mercado de Valores · CNMV" },
  BOARD_RESOLUTION:     { label: "Resolución del Consejo",                   short: "JUNTA",     color: "#92400E", icon: "🏛", law: "Ley 22/2015 Sociedades de Capital" },
  // KPMG add-on contracts (mid-lifecycle additions)
  SEGURO_CREDITO:    { label: "Seguro de Crédito sobre la Operación",   short: "SEGURO", color: "#059669", icon: "◑", law: "Ley 50/1980 LCS · Art. 1255 CC" },
  AVAL_BANCARIO:     { label: "Aval Bancario a Primer Requerimiento",   short: "AVAL",   color: "#2563EB", icon: "⊕", law: "Art. 1822 CC · UCP 600 ICC" },
  CONTRATO_OBRA:     { label: "Contrato de Obra — Edificación Hotel",    short: "OBRA",   color: "#D97706", icon: "⊗", law: "Art. 1588-1600 CC · LOE Ley 38/1999" },
  // Compraventa fractalizada
  CONDICION_SOLAR:      { label: "Condición Suspensiva — Obtención de Solar", short: "SOLAR",  color: "#92400E", icon: "⬟", law: "Art. 1123 CC · RDL 7/2015 Ley Suelo" },
  PAGO_APLAZADO:        { label: "Precio Aplazado y Garantías",          short: "APLAZ.",   color: "#B45309", icon: "◈", law: "Art. 1462 CC · Ley 3/2004" },
  CARGAS_URBANISTICAS:  { label: "Distribución de Cargas Urbanísticas",  short: "CARGAS",   color: "#78350F", icon: "◉", law: "RDL 7/2015 · Plan Parcial" },
  // Seguros — 4 insurance policy types
  COBERTURA_VIDA:          { label: "Cláusula de Cobertura — Vida",              short: "COB.VIDA",   color: "#059669", icon: "♡", law: "LCS arts. 83-85" },
  EXCLUSIONES_VIDA:        { label: "Tabla de Exclusiones — Vida",               short: "EXCL.VIDA",  color: "#DC2626", icon: "✕", law: "LCS art. 89" },
  PRIMA_VIDA:              { label: "Cuadro de Primas — Vida",                   short: "PRIMA.VIDA", color: "#0891B2", icon: "◇", law: "LCS art. 14" },
  COBERTURA_RC:            { label: "Cláusula de Cobertura — RC",                short: "COB.RC",     color: "#2563EB", icon: "◎", law: "LCS arts. 73-76" },
  LIMITES_RC:              { label: "Límites de Indemnización — RC",             short: "LÍMIT.RC",   color: "#1D4ED8", icon: "⊞", law: "LCS art. 74" },
  FRANQUICIA_RC:           { label: "Franquicia — RC",                           short: "FRANQ.RC",   color: "#3B82F6", icon: "⊟", law: "LCS art. 73" },
  COBERTURA_DANOS:         { label: "Cláusula de Cobertura — Daños",             short: "COB.DAÑOS",  color: "#D97706", icon: "⊕", law: "LCS arts. 43-44" },
  PERITACION:              { label: "Proceso de Peritación",                      short: "PERIT.",     color: "#B45309", icon: "◈", law: "LCS art. 38" },
  EXCLUSIONES_DANOS:       { label: "Exclusiones — Daños Materiales",            short: "EXCL.DAÑOS", color: "#DC2626", icon: "✕", law: "LCS art. 76a" },
  COBERTURA_CREDITO:       { label: "Cobertura — Crédito Comercial",             short: "COB.CRÉD.",  color: "#7C3AED", icon: "⬡", law: "LCS arts. 69-72" },
  VALIDACION_FINANCIERA:   { label: "Validación Financiera del Deudor",          short: "VAL.FIN.",   color: "#6D28D9", icon: "⊛", law: "LCS art. 69" },
  RIESGO_EMPRESARIAL:      { label: "Análisis de Riesgo Empresarial",            short: "RIESGO.EMP", color: "#5B21B6", icon: "◆", law: "LCS arts. 70-71" },
};

// ─── Sub-contract specific fields (stored in ag_json.terms) ──────────────────
export const SUB_FIELDS = {
  NDA: [
    { section: "Configuración del Acuerdo", fields: [
      { key: "ndaType",               label: "Tipo de Obligación",               type: "select", options: ["Bilateral (ambas partes)","Unilateral (solo receptora)"] },
      { key: "confidentialityPeriod", label: "Plazo de Confidencialidad (años)", type: "number", placeholder: "5" },
      { key: "penaltyAmount",         label: "Cláusula Penal (€)",               type: "number", placeholder: "50000" },
      { key: "personalDataShared",    label: "¿Implica Datos Personales?",        type: "select", options: ["Sí (RGPD/LOPDGDD aplica)","No"] },
    ]},
    { section: "Definición de Información", fields: [
      { key: "confidentialScope",  label: "Alcance de la Información Protegida", type: "textarea", placeholder: "Know-how, datos financieros, listas de clientes, estrategia comercial..." },
      { key: "exclusions",         label: "Exclusiones de la Obligación",        type: "textarea", placeholder: "Información ya pública, conocida con anterioridad, obtenida de tercero..." },
    ]},
  ],

  SLA: [
    { section: "Disponibilidad y Métricas", fields: [
      { key: "uptimeGuarantee",      label: "Disponibilidad Garantizada (%)",      type: "number", placeholder: "99.5" },
      { key: "measurementPeriod",    label: "Período de Medición",                 type: "select", options: ["Mensual","Trimestral","Anual"] },
      { key: "supportHours",         label: "Horario de Soporte",                  placeholder: "L-V 9:00-18:00 (CET)" },
      { key: "maintenanceWindow",    label: "Ventana de Mantenimiento Programado", placeholder: "Domingos 02:00-06:00 CET, previo aviso 48h" },
    ]},
    { section: "Tiempos de Respuesta", fields: [
      { key: "criticalResponseH",  label: "Tiempo Respuesta Crítico (horas)",  type: "number", placeholder: "4" },
      { key: "criticalResolutionH",label: "Tiempo Resolución Crítico (horas)", type: "number", placeholder: "8" },
      { key: "highResponseH",      label: "Tiempo Respuesta Alto (horas)",     type: "number", placeholder: "8" },
      { key: "mediumResponseH",    label: "Tiempo Respuesta Medio (horas lab.)",type: "number",placeholder: "24" },
      { key: "lowResponseH",       label: "Tiempo Respuesta Bajo (horas lab.)", type: "number", placeholder: "72" },
    ]},
    { section: "Penalizaciones", fields: [
      { key: "penaltyPercentPerPoint", label: "Penalización por Punto de Caída (% factura)", type: "number", placeholder: "5" },
      { key: "maxMonthlyPenalty",      label: "Penalización Máxima Mensual (% factura)",      type: "number", placeholder: "30" },
    ]},
  ],

  PAYMENT: [
    { section: "Importes y Tributación", fields: [
      { key: "baseAmount",    label: "Importe Base (€, sin IVA)",             type: "number", placeholder: "10000" },
      { key: "vatRate",       label: "Tipo de IVA (%)",                        type: "select", options: ["21%","10%","4%","0% (exento)","1.4% (IGIC Canarias)"] },
      { key: "irpfRetention", label: "Retención IRPF (%)",                     type: "select", options: ["No aplica (S.A./S.L.)","15% (profesional)","7% (inicio actividad)","19% (no residente UE)"] },
      { key: "billingPeriod", label: "Período de Facturación",                 type: "select", options: ["Mensual anticipado","Mensual vencido","Trimestral","Semestral","Anual","Por hito"] },
    ]},
    { section: "Condiciones de Pago", fields: [
      { key: "paymentMethod",  label: "Forma de Pago",                          type: "select", options: ["Transferencia bancaria (SEPA)","Domiciliación bancaria (SEPA)","Confirming","Pagaré","Cheque bancario"] },
      { key: "iban",           label: "IBAN del Beneficiario",                  placeholder: "ES91 2100 0418 4502 0005 1332" },
      { key: "swift",          label: "BIC/SWIFT (si aplica)",                  placeholder: "CAIXESBBXXX" },
      { key: "paymentDays",    label: "Plazo de Pago (días naturales)",          type: "number", placeholder: "30" },
      { key: "lateInterestR",  label: "Interés de Demora (BCE+8pp por Ley 3/2004)", type: "text", placeholder: "Automático según Ley 3/2004" },
    ]},
  ],

  DPA: [
    { section: "Roles y Datos", fields: [
      { key: "processorRole",   label: "Rol del Encargado",                    type: "select", options: ["Encargado del Tratamiento (Art. 28 RGPD)","Corresponsable del Tratamiento (Art. 26 RGPD)"] },
      { key: "dataCategories",  label: "Categorías de Datos Personales",       type: "textarea", placeholder: "Datos identificativos, datos de contacto, datos económicos, datos de navegación..." },
      { key: "dataSubjects",    label: "Categorías de Interesados",            type: "textarea", placeholder: "Empleados del cliente, clientes finales, proveedores..." },
      { key: "processingPurpose",label: "Finalidad del Tratamiento",           type: "textarea", placeholder: "Prestación del servicio contratado y gestión de la relación comercial" },
    ]},
    { section: "Base Jurídica y Conservación", fields: [
      { key: "legalBasis",      label: "Base Jurídica del Tratamiento",        type: "select", options: ["Ejecución de contrato (Art. 6.1.b RGPD)","Interés legítimo (Art. 6.1.f RGPD)","Consentimiento (Art. 6.1.a RGPD)","Obligación legal (Art. 6.1.c RGPD)"] },
      { key: "retentionPeriod", label: "Período de Conservación de Datos",     placeholder: "Durante vigencia del contrato + 5 años (prescripción civil)" },
      { key: "internationalTransfer", label: "Transferencia Internacional",    type: "select", options: ["No (datos en UE/EEE)","Sí, con Cláusulas Contractuales Tipo (SCCs)","Sí, país con decisión de adecuación","Sí, con garantías específicas"] },
    ]},
    { section: "Seguridad", fields: [
      { key: "securityMeasures",  label: "Medidas de Seguridad Técnicas",      type: "textarea", placeholder: "Cifrado AES-256, control de acceso por roles, autenticación 2FA, copias de seguridad diarias cifradas..." },
      { key: "subprocessors",     label: "Subencargados Autorizados",          type: "textarea", placeholder: "AWS (Irlanda, UE), Google Workspace (UE), Stripe (UE/SCCs)..." },
      { key: "breachNotifH",      label: "Plazo Notificación Brecha (horas)",  type: "number", placeholder: "72" },
    ]},
  ],

  IP: [
    { section: "Derechos Cedidos", fields: [
      { key: "rightsType",      label: "Tipo de Derechos Cedidos",             type: "textarea", placeholder: "Reproducción, distribución, comunicación pública, transformación..." },
      { key: "exclusivity",     label: "Exclusividad",                         type: "select", options: ["Cesión exclusiva (Art. 47 LPI)","Cesión no exclusiva (Art. 48 LPI)"] },
      { key: "territory",       label: "Territorio de la Cesión",              type: "select", options: ["Mundial","Unión Europea","España","Comunidad Autónoma específica"] },
      { key: "duration",        label: "Duración de la Cesión",                type: "select", options: ["Mientras dure el contrato principal","Indefinida (máximo legal)","5 años","10 años","15 años"] },
    ]},
    { section: "Obras y Precio", fields: [
      { key: "worksDescription", label: "Descripción de las Obras/Software",   type: "textarea", placeholder: "Código fuente de la aplicación X, documentación técnica, manuales de usuario, bases de datos..." },
      { key: "moralRights",      label: "Derechos Morales del Autor",          type: "select", options: ["Se reconoce la autoría en toda explotación","Uso anónimo autorizado por acuerdo expreso","A determinar caso a caso"] },
      { key: "assignmentPrice",  label: "Precio de la Cesión (€)",             type: "number", placeholder: "0 (incluido en precio del servicio)" },
      { key: "futureWorks",      label: "Obras Futuras / Modificaciones",      type: "select", options: ["Incluidas en la cesión (dentro del alcance)","Requieren acuerdo adicional","Excluidas expresamente"] },
    ]},
  ],

  // KPMG Arrendamiento Hotel Futuro sub-contract fields
  FINANCIACION: [
    { section: "Circumcontrato CA2 — Naturaleza Jurídica", fields: [
      { key: "circumcontractType", label: "Naturaleza legal (PHENOMENON CA2)",   type: "select", options: ["CA2 — Arrendamiento de Servicios Financieros (art. 1544 CC) — NO es préstamo","CA1 — Circumacción operativa estándar","Contrato mixto con elementos de préstamo (art. 1740 CC)"] },
      { key: "legalBasis",         label: "Base legal específica",               type: "textarea", placeholder: "No es préstamo (art. 1.740 CC) sino arrendamiento de servicios financieros in faciendo (art. 1.544 CC). El prestador no transmite la propiedad del dinero sino que presta el servicio de financiación." },
    ]},
    { section: "Parámetros Financieros", fields: [
      { key: "capitalAmount",   label: "Capital del Servicio Financiero (€)",  type: "number", placeholder: "100000000" },
      { key: "euriborRate",     label: "EURIBOR 12M de Referencia (%)",        type: "number", placeholder: "3.50" },
      { key: "spread",          label: "Diferencial (Spread) (%)",             type: "number", placeholder: "2.00" },
      { key: "termYears",       label: "Plazo de Devolución (años)",           type: "number", placeholder: "20" },
      { key: "monthlyPayment",  label: "Cuota Mensual Calculada (€)",          type: "number", placeholder: "687222" },
      { key: "amortizationMethod", label: "Sistema de Amortización",          type: "select", options: ["Cuota constante — Sistema Francés (capital + intereses)","Cuota de capital constante — Sistema Alemán","Al vencimiento (bullet)","Acordado entre partes"] },
      { key: "interestReview",  label: "Revisión del Tipo de Interés",        type: "select", options: ["Anual (1 de enero, EURIBOR publicado por BCE)","Semestral","Trimestral","Fijo durante toda la vigencia"] },
    ]},
    { section: "Cuenta y Garantías Adicionales", fields: [
      { key: "iban",            label: "IBAN Cuenta de Abono de Cuotas",       placeholder: "ES91 2100 0418 4502 0005 1332" },
      { key: "swift",           label: "BIC/SWIFT",                            placeholder: "CAIXESBBXXX" },
      { key: "earlyPayment",    label: "Amortización Anticipada",              type: "select", options: ["Permitida en cualquier momento, previo aviso 30 días","Permitida con comisión del 0.5% sobre capital amortizado anticipadamente","No permitida durante los primeros 5 años"] },
      { key: "linkedToLease",   label: "Vinculación IF al Arrendamiento Principal", type: "select", options: ["Sí — si el arrendamiento de cosa futura queda sin efecto, este CA2 también queda sin efecto (IF link Bloque II)","No — subsiste con independencia del contrato principal"] },
    ]},
  ],

  HIPOTECA_GARANTIA: [
    { section: "Finca Hipotecada (Cosa Futura)", fields: [
      { key: "mortgageAmount",      label: "Capital hipotecado (€)",             type: "number", placeholder: "100000000" },
      { key: "additionalCoverage",  label: "Cobertura adicional intereses/costas (%)", type: "number", placeholder: "30" },
      { key: "totalMortgage",       label: "Responsabilidad hipotecaria total (€)", type: "number", placeholder: "130000000" },
      { key: "mortgagedProperty",   label: "Descripción de la finca hipotecada", type: "textarea", placeholder: "Solar urbano + futura edificación hotelera de 5 estrellas (3.250 m²) a construir sobre el mismo. Ref. catastral: 7820517YJ2782A0001UB" },
      { key: "catastralReference",  label: "Referencia Catastral",               placeholder: "7820517YJ2782A0001UB" },
      { key: "fincaFutura",         label: "Hipoteca sobre cosa futura",         type: "select", options: ["Sí — la edificación aún no existe (Art. 110 LH · hipoteca edificación futura)","No — sobre finca ya edificada"] },
    ]},
    { section: "Registro de la Propiedad (Bloque V Oponibilidad)", fields: [
      { key: "registryOffice",    label: "Registro de la Propiedad competente",  placeholder: "Registro de la Propiedad de Valencia nº 5" },
      { key: "registrySection",   label: "Sección / Tomo / Folio / Finca",      placeholder: "Tomo 1234, Libro 56, Folio 78, Finca nº 9012" },
      { key: "ajdRate",           label: "AJD Comunitat Valenciana (%)",         type: "number", placeholder: "1.5" },
      { key: "ajdAmount",         label: "Cuota AJD (€)",                        type: "number", placeholder: "1950000" },
      { key: "registrationStatus",label: "Estado de Inscripción",                type: "select", options: ["Pendiente de inscripción — Opus PARCIAL","En trámite notarial","Inscrita — Opus OPONIBLE (erga omnes)"] },
    ]},
    { section: "Legitimación del Acreedor Hipotecario", fields: [
      { key: "legitimacion",      label: "Vía de reclamación judicial",          type: "select", options: ["Actio pecuniae creditae (art. 1111 CC + arts. 1526 ss CC)","Ejecución hipotecaria directa (LEC arts. 681-698)","Ambas vías acumulativamente"] },
      { key: "cessionRights",     label: "Cesión de la legitimación a terceros", type: "select", options: ["Permitida libremente (Arts. 1.526 y ss CC)","Solo con consentimiento previo del deudor","Limitada a entidades financieras del mismo grupo"] },
    ]},
  ],

  CESION_CREDITO: [
    { section: "Partes de la Cesión", fields: [
      { key: "cedente",         label: "Cedente (quien cede el crédito)",       placeholder: "Promotora Hotel Mediterráneo Valencia S.L." },
      { key: "cesionario",      label: "Cesionario (quien recibe el crédito)",  placeholder: "Banco Mediterráneo de Inversiones S.A." },
      { key: "deudorCedido",    label: "Deudor cedido (quien paga las rentas)", placeholder: "Gestión Hotelera Costa Levante S.L." },
    ]},
    { section: "Rentas Cedidas (Cláusula 5 KPMG)", fields: [
      { key: "monthlyRent",     label: "Renta mensual cedida al cesionario (€)", type: "number", placeholder: "1064583" },
      { key: "annualRent",      label: "Renta anual total cedida (€)",            type: "number", placeholder: "12775000" },
      { key: "cedidoRentas",    label: "Descripción de rentas cedidas",           type: "textarea", placeholder: "Rentas que pague mensualmente Gestión Hotelera Costa Levante S.L. en virtud del arrendamiento del hotel a favor de Promotora Hotel Mediterráneo Valencia S.L." },
      { key: "cedidoIVA",       label: "Devoluciones IVA cedidas",               type: "textarea", placeholder: "Devoluciones del IVA de inversión (21%) generadas durante la ejecución de obras de edificación del hotel. Importe estimado: 8.400.000 €." },
      { key: "ivaDevolution",   label: "Importe estimado devolución IVA (€)",    type: "number", placeholder: "8400000" },
    ]},
    { section: "Oponibilidad y Efectos IF", fields: [
      { key: "oponibilidadCesion", label: "Oponibilidad de la cesión (Art. 1527 CC)", type: "select", options: ["Notificación fehaciente al deudor cedido (Art. 1527 CC) — notificación enviada","Inscripción registral (máxima oponibilidad)","Notificación pendiente de envío"] },
      { key: "garantiaCesion",     label: "Garantía de la cesión",               type: "select", options: ["Garantía de existencia del crédito (cedente responde de que el crédito existe)","Cesión pro soluto (sin garantía de cobro)","Con garantía solidaria del cedente"] },
      { key: "notificationMethod", label: "Método de notificación al deudor",    type: "select", options: ["Burofax con acuse de recibo","Acta notarial de notificación","Carta certificada con AR"] },
    ]},
  ],

  CONDICION_SOLAR: [
    { section: "Definición de la Condición Suspensiva", fields: [
      { key: "solarDefinition",   label: "Definición de «Solar» según PGOU aplicable",     type: "textarea", placeholder: "Se entenderá por solar la parcela urbanizada que cuente con acceso rodado, abastecimiento de agua, evacuación de aguas residuales, suministro de energía eléctrica y encuadrada entre viales ejecutados, conforme al Art. 12 de la Ley del Suelo..." },
      { key: "verificationMethod",label: "Forma de Acreditación de la Condición",          type: "select",   options: ["Certificado municipal de recepción de obras de urbanización","Concesión de licencia de obras de edificación","Inscripción del proyecto de reparcelación","Escritura notarial de finalización de urbanización"] },
      { key: "maxWaitPeriod",     label: "Plazo Máximo de Espera (años)",                  type: "number",   placeholder: "5" },
      { key: "extensionRight",    label: "Prórroga en caso de retraso ajeno a las partes", type: "select",   options: ["Sí, hasta 2 años adicionales por fuerza mayor","No, el contrato se resuelve automáticamente","A negociar en el momento","Sí, prorrogable indefinidamente por acuerdo"] },
    ]},
    { section: "Consecuencias del Incumplimiento de la Condición", fields: [
      { key: "ifConditionFails",  label: "Si No Se Obtiene Solar en el Plazo",            type: "select",   options: ["El contrato se resuelve y se devuelve el precio de firma + intereses","El comprador mantiene el derecho de compra con el mismo precio","El precio aplazado se renegocia","El vendedor devuelve el precio de firma sin intereses"] },
      { key: "retentionClause",   label: "Cláusula Penal por Resolución",                 type: "number",   placeholder: "0" },
    ]},
  ],

  PAGO_APLAZADO: [
    { section: "Estructura del Precio Aplazado", fields: [
      { key: "deferredAmount",     label: "Importe del Precio Aplazado (€)",               type: "number", placeholder: "360000" },
      { key: "paymentDaysAfterSolar", label: "Plazo de Pago desde el Hito Pactado (días)", type: "number", placeholder: "30", note: "Puede ser la condición solar o un hito equivalente pactado en la compraventa del terreno." },
      { key: "interestOnDeferred", label: "Interés del Aplazamiento (%/año)",              type: "number", placeholder: "0" },
      { key: "paymentMethod",      label: "Forma de Pago del Precio Aplazado",             type: "select", options: ["Transferencia bancaria (SEPA)","Elevación a escritura pública con entrega de cheque bancario","Pagaré garantizado con hipoteca","Cheque certificado en Notaría"] },
    ]},
    { section: "Garantías del Precio Aplazado", fields: [
      { key: "guaranteeType",      label: "Garantía del Precio Aplazado",                  type: "select", options: ["Condición resolutoria expresa inscrita en Registro (Art. 1504 CC)","Hipoteca sobre la propia finca en garantía del aplazado","Aval bancario a primer requerimiento","Garantía personal del administrador solidario"] },
      { key: "registryCondition",  label: "Inscripción / Refuerzo Registral",              type: "select", options: ["Condición resolutoria inscrita en el momento de la compraventa","Se inscribe al cumplirse el hito urbanístico pactado","No se inscribe (acuerdo privado)"], ontologyTag: "bien", note: "La inscripción refuerza la difusión y la oponibilidad del pacto resolutorio, pero no sustituye por sí sola la traditio real." },
    ]},
  ],

  CARGAS_URBANISTICAS: [
    { section: "Cargas de Urbanización", fields: [
      { key: "urbanizationCost",   label: "Coste Estimado de Urbanización (€/m²)",         type: "number", placeholder: "120" },
      { key: "chargesAllocation",  label: "Responsable de las Cargas Urbanísticas",        type: "select", options: ["Íntegramente el Vendedor","Íntegramente el Comprador","Proporcional a la superficie (50/50)","Descontadas del precio aplazado"] },
      { key: "urbanizationPlan",   label: "Plan de Urbanización Vigente",                  type: "textarea", placeholder: "Plan Parcial del Sector SUB-3, aprobado por Acuerdo del Pleno de [Municipio] de fecha..." },
      { key: "executionSystem",    label: "Sistema de Actuación Urbanística",               type: "select", options: ["Compensación (junta de compensación)","Cooperación (Ayuntamiento actúa)","Expropiación","Concurrencia"] },
    ]},
    { section: "Tributos y Gastos", fields: [
      { key: "itpRate",           label: "Tipo ITP/AJD CCAA aplicable (%)",                type: "number", placeholder: "7" },
      { key: "itpResponsibility", label: "ITP a cargo de",                                 type: "select", options: ["Comprador (regla general)","Vendedor (por pacto)","Compartido"] },
      { key: "iivtnu",            label: "Plusvalía Municipal (IIVTNU)",                   type: "select", options: ["A cargo del Vendedor (Art. 104 TRLHL)","A cargo del Comprador (pacto)","Exento: no hay incremento de valor (acreditar)"] },
      { key: "notaryFees",        label: "Gastos Notariales y Registrales",               type: "select", options: ["A cargo del Comprador (regla general)","Compartidos al 50%","A cargo del Vendedor (por pacto)"] },
    ]},
  ],

  // ─── Insurance sub-contract fields ─────────────────────────────────────────
  COBERTURA_VIDA: [
    { section: "Cobertura Principal", fields: [
      { key: "coverageCapital", label: "Capital Asegurado Activo (€)", type: "number", placeholder: "300000" },
      { key: "coverageActivationDate", label: "Fecha de Activación de la Cobertura", type: "date" },
      { key: "waitingPeriodMonths", label: "Período de Carencia (meses)", type: "number", placeholder: "0" },
      { key: "coverageStatus", label: "Estado de la Cobertura", type: "select", options: ["ACTIVA — Sin exclusiones activas","BLOQUEADA — Exclusión médica pendiente","EN_REVISIÓN — Declaración de salud en valoración"] },
    ]},
    { section: "Condiciones de Activación (IF)", fields: [
      { key: "activationCondition", label: "Condición IF para activación", type: "select", options: ["Declaración de salud aceptada (sin exclusiones)","Superado período de carencia","Pago de prima en vigor","Todas las condiciones cumplidas"] },
      { key: "beneficiaryConfirmed", label: "Beneficiarios confirmados en escritura", type: "select", options: ["Sí","No — pendiente confirmación"] },
    ]},
  ],

  EXCLUSIONES_VIDA: [
    { section: "Exclusiones Aplicables (IF_exclusion)", fields: [
      { key: "preExistingConditions", label: "Enfermedades Preexistentes Excluidas", type: "textarea", placeholder: "Diabetes mellitus tipo 2, hipertensión arterial con tratamiento..." },
      { key: "riskActivities", label: "Actividades de Riesgo Excluidas", type: "textarea", placeholder: "Deportes de montaña de alta dificultad, submarinismo, pilotar aeronaves..." },
      { key: "exclusionPeriod", label: "Período de Exclusión (meses)", type: "number", placeholder: "24" },
      { key: "blockingStatus", label: "Efecto IF_exclusion sobre Cobertura", type: "select", options: ["No bloquea la cobertura principal","BLOQUEA parcialmente (exclusión específica)","BLOQUEA totalmente (no asegurable)"] },
    ]},
    { section: "Validación Médica", fields: [
      { key: "medicalExamRequired", label: "Reconocimiento Médico Previo", type: "select", options: ["No requerido (suma < 300.000 €)","Requerido — pendiente de realizar","Realizado y aceptado","Realizado y denegado"] },
      { key: "medicalExamDate", label: "Fecha del Reconocimiento Médico", type: "date" },
    ]},
  ],

  PRIMA_VIDA: [
    { section: "Cuadro de Primas", fields: [
      { key: "annualPremium", label: "Prima Anual Neta (€)", type: "number", placeholder: "1850" },
      { key: "fractionalSurcharge", label: "Recargo por Fraccionamiento (%)", type: "number", placeholder: "3" },
      { key: "paymentFrequency", label: "Periodicidad de Pago", type: "select", options: ["Anual","Semestral","Trimestral","Mensual"] },
      { key: "premiumReviewDate", label: "Fecha de Próxima Revisión de Prima", type: "date" },
      { key: "premiumIndexation", label: "Indexación de Prima", type: "select", options: ["IPC anual","Prima constante (vida entera)","Revisión actuarial quinquenal","Sin indexación"] },
    ]},
  ],

  COBERTURA_RC: [
    { section: "Cobertura de RC", fields: [
      { key: "coverageLimit", label: "Límite Máximo por Siniestro (€)", type: "number", placeholder: "600000" },
      { key: "annualAggregateLimit", label: "Límite Agregado Anual (€)", type: "number", placeholder: "1200000" },
      { key: "coverageScope", label: "Ámbito de la Cobertura", type: "select", options: ["Daños personales y materiales","Solo daños personales","Solo daños materiales","Daños personales, materiales y perjuicios económicos"] },
      { key: "retroactiveCoverage", label: "Cobertura Retroactiva", type: "select", options: ["Sin retroactividad","Desde fecha de contratación","Desde fecha acordada"] },
    ]},
    { section: "Activación de la Cobertura", fields: [
      { key: "claimBasis", label: "Base de Reclamación", type: "select", options: ["Claims made (reclamación durante vigencia)","Loss occurrence (daño durante vigencia)","Combinado"] },
      { key: "coverageStatus", label: "Estado de la Cobertura RC", type: "select", options: ["ACTIVA","BLOQUEADA por franquicia no pagada","SINIESTRO_PENDIENTE","EN_REVISIÓN"] },
    ]},
  ],

  LIMITES_RC: [
    { section: "Límites y Sublímites", fields: [
      { key: "perClaimLimit", label: "Límite por Reclamación (€)", type: "number", placeholder: "600000" },
      { key: "perPersonLimit", label: "Sublímite Daños Personales por Víctima (€)", type: "number", placeholder: "300000" },
      { key: "propertyDamageLimit", label: "Sublímite Daños Materiales (€)", type: "number", placeholder: "200000" },
      { key: "legalDefenseLimit", label: "Sublímite Defensa Jurídica (€)", type: "number", placeholder: "30000" },
    ]},
  ],

  FRANQUICIA_RC: [
    { section: "Franquicia (IF_posición)", fields: [
      { key: "deductibleAmount", label: "Franquicia por Siniestro (€)", type: "number", placeholder: "3000" },
      { key: "deductibleType", label: "Tipo de Franquicia", type: "select", options: ["Absoluta (siempre a cargo del asegurado)","Relativa (si supera umbral, aseguradora paga todo)","Temporal (por período de espera)"] },
      { key: "deductibleApplied", label: "Franquicia Aplicada al Último Siniestro", type: "select", options: ["No aplica (sin siniestros)","Aplicada — pagada por asegurado","Pendiente de aplicar"] },
    ]},
  ],

  COBERTURA_DANOS: [
    { section: "Cobertura de Daños Materiales", fields: [
      { key: "insuredValue", label: "Valor Asegurado en Nuevo (€)", type: "number", placeholder: "750000" },
      { key: "coverageRisks", label: "Riesgos Cubiertos", type: "textarea", placeholder: "Incendio, explosión, daños por agua, robo, daños eléctricos..." },
      { key: "coverageStatus", label: "Estado de la Cobertura Daños", type: "select", options: ["ACTIVA","SINIESTRO_PENDIENTE","EN_PERITACION","BLOQUEADA por exclusión activa"] },
    ]},
    { section: "Condiciones Especiales", fields: [
      { key: "infravaluation", label: "Infraseguro (si valor real > valor asegurado)", type: "select", options: ["Sin infraseguro declarado","Infraseguro detectado — regla proporcional aplicable (art. 30 LCS)","Cobertura a primer riesgo (sin regla proporcional)"] },
      { key: "valueBasis", label: "Base de Valoración", type: "select", options: ["Valor en nuevo","Valor real (con depreciación)","Valor acordado","Valor de reposición"] },
    ]},
  ],

  PERITACION: [
    { section: "Proceso de Peritación (IF determinante de indemnización)", fields: [
      { key: "peritacionStatus", label: "Estado del Proceso", type: "select", options: ["Sin siniestro activo","PERITACIÓN_INICIADA — perito designado","PERITACIÓN_COMPLETADA — informe emitido","EN_CONTRADICCIÓN — perito de parte nombrado","ARBITRAJE — árbitro de dirimir designado"] },
      { key: "aseguradoraPerito", label: "Perito de la Aseguradora", placeholder: "D. Francisco Ruiz Sánchez, Arquitecto Tasador" },
      { key: "aseguradoPerito", label: "Perito del Asegurado (si contradicción)", placeholder: "D. Carlos Martín López, Ingeniero Industrial" },
      { key: "damageCause", label: "Causa del Siniestro", type: "textarea", placeholder: "Incendio originado en cuadro eléctrico, detectado el..." },
      { key: "estimatedDamage", label: "Daño Estimado (€)", type: "number", placeholder: "0" },
      { key: "agreedIndemnity", label: "Indemnización Acordada (€)", type: "number", placeholder: "0" },
      { key: "peritacionDeadline", label: "Plazo Máximo de Peritación (art. 38 LCS)", type: "date" },
    ]},
  ],

  EXCLUSIONES_DANOS: [
    { section: "Exclusiones de la Póliza de Daños", fields: [
      { key: "excludedRisks", label: "Riesgos Excluidos", type: "textarea", placeholder: "Guerra, terrorismo, desgaste normal, daño intencional del asegurado..." },
      { key: "excludedProperty", label: "Bienes Excluidos", type: "textarea", placeholder: "Dinero en efectivo, documentos, joyas no declaradas, vehículos a motor..." },
      { key: "maintenanceExclusion", label: "Exclusión por Falta de Mantenimiento", type: "select", options: ["Aplica (daños por no mantenimiento excluidos)","No aplica","Aplica con franquicia especial de 20%"] },
      { key: "blockingExclusion", label: "¿Alguna exclusión bloquea la cobertura?", type: "select", options: ["No — cobertura activa","Sí — exclusión total activa (BLOQUEADA)","Parcialmente — solo para riesgos específicos"] },
    ]},
  ],

  COBERTURA_CREDITO: [
    { section: "Cobertura de Crédito Comercial (IF_exclusion)", fields: [
      { key: "coveredDebtors", label: "Deudores Cubiertos", type: "textarea", placeholder: "Distribuciones Sur S.L. — Límite: 500.000 €; Comercial Norte S.A. — Límite: 200.000 €" },
      { key: "totalCoverageLimit", label: "Límite Total de Cobertura (€)", type: "number", placeholder: "1000000" },
      { key: "indemnityPercentage", label: "Porcentaje de Indemnización (%)", type: "number", placeholder: "85" },
      { key: "coverageStatus", label: "Estado de la Cobertura", type: "select", options: ["ACTIVA — validación financiera superada","BLOQUEADA — validación financiera pendiente o rechazada","SINIESTRO_PENDIENTE","EN_REVISIÓN"] },
    ]},
    { section: "Condición IF: Validación Financiera", fields: [
      { key: "blockingReason", label: "Motivo de Bloqueo IF_exclusion", type: "textarea", placeholder: "La cobertura de crédito queda BLOQUEADA hasta que VALIDACION_FINANCIERA confirme rating mínimo A o B del deudor principal." },
      { key: "unblockCondition", label: "Condición de Desbloqueo", type: "select", options: ["Validación financiera con rating A o B","Aval bancario alternativo aportado","Autorización manual del suscriptor"] },
    ]},
  ],

  VALIDACION_FINANCIERA: [
    { section: "Rating y Validación del Deudor", fields: [
      { key: "debtorName", label: "Deudor Validado", placeholder: "Distribuciones Sur S.L." },
      { key: "financialRating", label: "Rating Financiero del Deudor", type: "select", options: ["A — Excelente (cobertura activa)","B — Bueno (cobertura activa)","C — Aceptable (cobertura limitada)","D — Riesgo alto (cobertura BLOQUEADA)","Sin calificación — pendiente"] },
      { key: "validationDate", label: "Fecha de Validación", type: "date" },
      { key: "validationPending", label: "¿Validación Pendiente?", type: "select", options: ["No — validación completada","Sí — BLOQUEA la cobertura hasta completar","Sí — en proceso (cobertura en espera)"] },
      { key: "annualRevenue", label: "Facturación Anual del Deudor (€)", type: "number", placeholder: "5000000" },
      { key: "debtRatio", label: "Ratio de Endeudamiento (%)", type: "number", placeholder: "35" },
    ]},
    { section: "Efecto IF sobre Cobertura de Crédito", fields: [
      { key: "blockingEffect", label: "Efecto IF_exclusion", type: "select", options: ["Desbloquea COBERTURA_CREDITO (rating suficiente)","BLOQUEA COBERTURA_CREDITO (rating insuficiente)","En evaluación — cobertura suspendida temporalmente"] },
    ]},
  ],

  RIESGO_EMPRESARIAL: [
    { section: "Análisis de Riesgo del Deudor", fields: [
      { key: "riskCategory", label: "Categoría de Riesgo", type: "select", options: ["Bajo — sector estable, historial de pagos impecable","Medio — sector volátil o historial incompleto","Alto — indicadores de dificultad financiera","Muy alto — recomendación de no asegurar"] },
      { key: "sectorRisk", label: "Riesgo Sectorial", type: "select", options: ["Alimentación y distribución — riesgo bajo","Construcción — riesgo medio-alto","Exportación — riesgo variable","Tecnología — riesgo medio","Hostelería — riesgo alto"] },
      { key: "paymentHistory", label: "Historial de Pagos (últimos 3 años)", type: "select", options: ["Sin incidencias","1-2 retrasos justificados","Más de 3 retrasos o impagos menores","Impago grave o procedimiento concursal"] },
      { key: "riskNotes", label: "Observaciones del Analista", type: "textarea", placeholder: "El deudor presenta ratios de liquidez adecuados pero alta concentración sectorial..." },
    ]},
  ],

  COMPLIANCE_CHECK: [
    { section: "Resultado del Compliance", fields: [
      { key: "complianceCheckStatus", label: "Estado de la Verificación", type: "select", options: ["PENDIENTE","VALID","INVALID"], note: "Regulatory Approval se desbloquea solo cuando el estado es VALID." },
      { key: "complianceOfficer", label: "Responsable de Compliance", placeholder: "D. Laura Torres Ramírez" },
      { key: "complianceScope", label: "Alcance de la Verificación", type: "textarea", placeholder: "Revisión de políticas internas, controles anti-blanqueo y cumplimiento de reporting." },
      { key: "reviewDeadline", label: "Plazo de Verificación", type: "date" },
    ]},
  ],

  AUDIT_REPORT: [
    { section: "Informe de Auditoría", fields: [
      { key: "auditScope", label: "Alcance de la Auditoría", type: "textarea", placeholder: "Gobierno corporativo, control interno, cumplimiento de políticas y evidencias de transacciones." },
      { key: "auditOpinion", label: "Opinión del Auditor", type: "select", options: ["Favorable","Con Salvedades","Adversa","Pendiente de emisión"] },
      { key: "auditReviewer", label: "Auditor Responsable", placeholder: "D. Javier Fernández" },
      { key: "auditDate", label: "Fecha del Informe", type: "date" },
    ]},
  ],

  REGULATORY_APPROVAL: [
    { section: "Aprobación Regulatoria", fields: [
      { key: "regulatoryBody", label: "Órgano Regulador", placeholder: "Comisión Nacional del Mercado de Valores" },
      { key: "approvalStatus", label: "Estado de la Aprobación", type: "select", options: ["PENDIENTE","APROBADA","DENEGADA"], note: "Se desbloquea cuando Compliance indica VALID." },
      { key: "approvalNotes", label: "Notas del Regulador", type: "textarea", placeholder: "Comentarios de la resolución regulatoria y condiciones adicionales." },
      { key: "approvalDate", label: "Fecha de Resolución", type: "date" },
    ]},
  ],

  BOARD_RESOLUTION: [
    { section: "Resolución del Consejo", fields: [
      { key: "meetingDate", label: "Fecha de la Junta", type: "date" },
      { key: "resolutionOutcome", label: "Resultado de la Resolución", type: "select", options: ["Aprobada","Rechazada","Aplazada"], placeholder: "Aprobada" },
      { key: "boardMembers", label: "Miembros del Consejo", type: "textarea", placeholder: "D. José Martínez; Dña. Elena Muñoz; D. Álvaro Pérez" },
      { key: "resolutionNotes", label: "Notas de la Resolución", type: "textarea", placeholder: "Condiciones de seguimiento, KPIs, plazos y observaciones de cumplimiento." },
    ]},
  ],
};

// ─── IA operator types ────────────────────────────────────────────────────────
// IA_TYPES: contract-domain labels enriched with theoretical grounding (Bloques II + III)
// formType     → the theoretical IAFormType from Bloque VII
// vectorProp   → which of the 5 vector properties (Bloque II §3) this IA modulates
// plicationType → implicación (one-way) or co-implicación (mutual) — Bloque III §6
export const IA_TYPES = {
  "ad-actio": {
    label: "Obligación Activa", subtitle: "Una parte se obliga activamente hacia la otra",
    icon: "→", color: C.gold,
    compatible: ["co-implication","ad-actio"],
    desc: "Establece una obligación de prestación activa (dare, facere, praestare). Una parte se obliga a realizar una conducta positiva hacia la otra. Fundamento de la mayoría de contratos bilaterales (Art. 1088 CC).",
    formType: "direction", vectorProp: "dirección",
    plicationType: "implicación",
    bloqueRef: "Art. 1088 CC · Art. 1254 CC",
  },
  "de-actio": {
    label: "Obligación Pasiva", subtitle: "Obligación de no hacer o de retorno / separación",
    icon: "←", color: "#6B7280",
    compatible: ["non","de-actio"],
    desc: "Establece una obligación de no hacer (non facere) o de restitución y separación de una relación previa. Propio de resolución contractual, liquidación de relaciones y cláusulas de no competencia (Art. 1101 CC · Art. 1124 CC).",
    formType: "retroaction", vectorProp: "sentido",
    plicationType: "implicación inversa",
    bloqueRef: "Art. 1101 CC · Art. 1124 CC · Art. 1088 CC",
  },
  "non": {
    label: "Prohibición / Exclusión", subtitle: "Impide que una conducta, derecho o pretensión tenga efecto",
    icon: "✕", color: C.red,
    compatible: ["de-actio"],
    desc: "Establece una prohibición o cláusula de exclusión. Un derecho o conducta no puede activarse mientras este operador esté vigente. Fundamento de exclusiones en seguros, condiciones resolutorias y prohibiciones convencionales (Art. 1255 CC · Art. 1123 CC).",
    formType: "position", vectorProp: "posición",
    plicationType: "exclusión posicional",
    bloqueRef: "Art. 1255 CC · Art. 1123 CC · Ley 50/1980 (seguros)",
  },
  "co-implication": {
    label: "Obligación Recíproca", subtitle: "Ambas partes se obligan mutuamente con la misma intensidad",
    icon: "⇄", color: C.purple,
    compatible: ["ad-actio","co-implication"],
    desc: "Establece obligaciones recíprocas simultáneas: ambas partes asumen compromisos activos mutuos. Fundamento de contratos sinalagmáticos (compraventa, arrendamiento, permuta). La incidencia de uno afecta al otro (Art. 1256 CC · exceptio non adimpleti contractus).",
    formType: "plication", vectorProp: "plicación",
    plicationType: "co-implicación",
    bloqueRef: "Art. 1256 CC · Art. 1124 CC · contratos sinalagmáticos",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Domain status ↔ Theoretical PhenomenonState mapping (Bloque III + bridge.py)
export const statusColor = s => ({
  ACTIVE:                 C.green,
  MODIFIED:               C.gold,
  NEEDS_REVIEW:           C.orange,    // theoretical: INTERRUPTED
  DRAFT:                  C.textMuted, // theoretical: INITIALIZED
  SUSPENDED:              C.blue,      // theoretical: SUSPENDED (Bloque III)
  WAITING:                "#6366F1",   // KPMG Corporate: pending predecessor
  TERMINATED:             C.red,
  // Insurance statuses (Seguros — IF_exclusion engine)
  BLOCKED:                C.red,             // IF_exclusion prevents activation
  SINIESTRO_PENDIENTE:    "#F59E0B",          // claim filed, pending resolution
  INDEMNIZACION_PAGADA:   "#10B981",          // claim resolved, indemnization paid
  RECHAZO:                "#6B7280",          // claim rejected
})[s] ?? C.textMuted;

export const statusLabel = s => ({
  ACTIVE:                 "Activo",
  MODIFIED:               "Modificado",
  NEEDS_REVIEW:           "Requiere revisión",
  DRAFT:                  "Borrador",
  SUSPENDED:              "Suspendido",
  WAITING:                "En espera",
  TERMINATED:             "Terminado",
  // Insurance statuses
  BLOCKED:                "BLOQUEADO — IF exclusión activa",
  SINIESTRO_PENDIENTE:    "Siniestro pendiente",
  INDEMNIZACION_PAGADA:   "Indemnización pagada",
  RECHAZO:                "Siniestro rechazado",
})[s] ?? s;

// Theoretical state label (Bloque III state machine)
export const theoreticalState = domainStatus => ({
  DRAFT:               "INITIALIZED",
  ACTIVE:              "ACTIVE",
  MODIFIED:            "ACTIVE",
  NEEDS_REVIEW:        "INTERRUPTED",
  SUSPENDED:           "SUSPENDED",
  TERMINATED:          "TERMINATED",
  WAITING:             "INTERRUPTED",
  BLOCKED:             "INTERRUPTED",       // IF_exclusion = positional block (non)
  SINIESTRO_PENDIENTE: "INTERRUPTED",
  INDEMNIZACION_PAGADA:"TERMINATED",
  RECHAZO:             "TERMINATED",
})[domainStatus] ?? "ACTIVE";
export const phaseColor  = p => ({ ESS: C.gold, AG: C.purple, IA: C.blue, VEC: C.blue, CASCADE: C.orange, EVAL: C.orange, CREATE: C.gold, AI: C.purple, ERROR: C.red, OPUS: C.green, INIT: C.textMuted, IF: C.green, "IF→": C.green })[p] ?? C.textMuted;
// ── Opus levels (Bloque IV) ───────────────────────────────────────────────────
export const OPUS_LEVELS = {
  PARTIAL:  { label: "Eficacia entre partes",      icon: "◌", color: "#9CA3AF", bg: "#F3F4F6", desc: "Contrato válido entre las partes. Pendiente de verificación completa de todos los elementos esenciales." },
  COMPLETE: { label: "Plena eficacia inter partes", icon: "✓", color: C.green,   bg: C.greenBg, desc: "Todos los elementos jurídicos verificados y homologados. Plena eficacia entre las partes contratantes." },
  OPONIBLE: { label: "Oponible erga omnes",         icon: "⊙", color: C.gold,    bg: C.goldBg,  desc: "Inscrito en Registro. Oponible frente a terceros (Art. 32 LH). Fe pública registral." },
};

export function getOpusLevel(contract) {
  if (contract?.ag?.terms?.registry) return "OPONIBLE";
  if (contract?.opus?.homologation === "VALID") return "COMPLETE";
  return "PARTIAL";
}

// The Final Rule (Bloque I — Regla Final del Sistema)
export const FINAL_RULE = "PHENOMENON transforma la realidad caótica y fluídica en sistemas geométricamente estructurados y vectorialmente operables.";

export const CAMPO_LABELS = { partyA: "Parte A", partyB: "Parte B", jurisdiction: "Jurisdicción", effectiveDate: "Fecha de inicio", expiryDate: "Fecha de vencimiento", governingLaw: "Ley aplicable" };

// ─── Sub-contract IF edges (cross-cascade connections for graph display) ───────
// Each entry: [typeA, typeB, direction]
// direction: "AB" = A→B only, "BA" = B→A only, "both" = bidirectional
export const SUB_IF_EDGES = [
  { a: "NDA",     b: "DPA",     dir: "both", label: "Retención datos" },
  { a: "NDA",     b: "IP",      dir: "both", label: "Plazo confidencialidad" },
  { a: "SLA",     b: "PAYMENT", dir: "both", label: "Penalización / Importe" },
  { a: "NDA",     b: "PAYMENT", dir: "AB",   label: "Cláusula penal" },
  { a: "DPA",     b: "NDA",     dir: "AB",   label: "Subencargados / Retención" },
  { a: "IP",      b: "NDA",     dir: "AB",   label: "Exclusividad / Territorio" },
  { a: "COMPLIANCE_CHECK", b: "REGULATORY_APPROVAL", dir: "AB", label: "Desbloqueo regulatorio", type: "logic" },
  // Insurance IF_exclusion edges (blocking type)
  { a: "EXCLUSIONES_VIDA",      b: "COBERTURA_VIDA",      dir: "AB", label: "IF_exclusion — bloquea cobertura", type: "exclusion" },
  { a: "PRIMA_VIDA",            b: "COBERTURA_VIDA",      dir: "AB", label: "Prima vigente", type: "logic" },
  { a: "FRANQUICIA_RC",         b: "COBERTURA_RC",        dir: "AB", label: "Franquicia — IF_posición", type: "exclusion" },
  { a: "LIMITES_RC",            b: "COBERTURA_RC",        dir: "AB", label: "Límites de cobertura", type: "logic" },
  { a: "PERITACION",            b: "COBERTURA_DANOS",     dir: "both", label: "Valor pericial ↔ cobertura", type: "logic" },
  { a: "EXCLUSIONES_DANOS",     b: "COBERTURA_DANOS",     dir: "AB", label: "IF_exclusion — daños", type: "exclusion" },
  { a: "VALIDACION_FINANCIERA", b: "COBERTURA_CREDITO",   dir: "AB", label: "IF_exclusion — bloqueo rating", type: "exclusion" },
  { a: "RIESGO_EMPRESARIAL",    b: "COBERTURA_CREDITO",   dir: "AB", label: "Análisis riesgo → cobertura", type: "logic" },
  { a: "RIESGO_EMPRESARIAL",    b: "VALIDACION_FINANCIERA", dir: "both", label: "Rating ↔ riesgo", type: "logic" },
];

// ─── Sub-cascade map (frontend mirror of backend SUB_CASCADE_MAP) ─────────────
// Maps source_type → { field → [target_types] } for cross-sibling cascades.
export const SUB_CASCADE_MAP = {
  NDA:     {
    confidentialityPeriod: ["DPA", "IP"],
    noticePeriod:          ["DPA"],
    penaltyAmount:         ["PAYMENT"],
  },
  PAYMENT: {
    paymentDays:  ["SLA"],
    baseAmount:   ["SLA"],
    retentionPct: ["SLA"],
  },
  SLA:     {
    availability:      ["PAYMENT"],
    penaltyPct:        ["PAYMENT"],
    maxMonthlyPenalty: ["PAYMENT"],
  },
  DPA:     {
    dataRetention:        ["NDA"],
    internationalTransfer:["NDA"],
    subprocessors:        ["NDA"],
  },
  IP:      {
    exclusivity: ["NDA"],
    territory:   ["NDA"],
    duration:    ["NDA"],
  },
  // Insurance cascade: exclusions → coverage (IF_exclusion blocking)
  EXCLUSIONES_VIDA: {
    blockingStatus:   ["COBERTURA_VIDA"],    // exclusion blocking status propagates
    medicalExamRequired: ["COBERTURA_VIDA"],
  },
  PRIMA_VIDA: {
    annualPremium: ["COBERTURA_VIDA"],       // premium changes affect coverage
  },
  VALIDACION_FINANCIERA: {
    financialRating:    ["COBERTURA_CREDITO"],   // rating determines blocking
    validationPending:  ["COBERTURA_CREDITO"],
    blockingEffect:     ["COBERTURA_CREDITO"],
  },
  RIESGO_EMPRESARIAL: {
    riskCategory:    ["VALIDACION_FINANCIERA", "COBERTURA_CREDITO"],
  },
  PERITACION: {
    peritacionStatus: ["COBERTURA_DANOS"],
    estimatedDamage:  ["COBERTURA_DANOS"],
    agreedIndemnity:  ["COBERTURA_DANOS"],
  },
  FRANQUICIA_RC: {
    deductibleAmount:  ["COBERTURA_RC"],     // deductible affects coverage activation
    deductibleApplied: ["LIMITES_RC"],
  },
};

// ─── Sub-cascade field map (frontend mirror of backend SUB_CASCADE_MAP) ────────
// Used by ContractDetailPanel to know which term fields trigger cross-cascades.
export const SUB_CASCADE_FIELDS = {
  NDA:                   ["confidentialityPeriod", "noticePeriod", "penaltyAmount"],
  PAYMENT:               ["paymentDays", "baseAmount", "retentionPct"],
  SLA:                   ["availability", "penaltyPct", "maxMonthlyPenalty"],
  DPA:                   ["dataRetention", "internationalTransfer", "subprocessors"],
  IP:                    ["exclusivity", "territory", "duration"],
  // Insurance cascade fields
  EXCLUSIONES_VIDA:      ["blockingStatus", "medicalExamRequired"],
  PRIMA_VIDA:            ["annualPremium"],
  VALIDACION_FINANCIERA: ["financialRating", "validationPending", "blockingEffect"],
  RIESGO_EMPRESARIAL:    ["riskCategory"],
  PERITACION:            ["peritacionStatus", "estimatedDamage", "agreedIndemnity"],
  FRANQUICIA_RC:         ["deductibleAmount", "deductibleApplied"],
};

// Sub-cascade field label for UX display in the live feed
export const SUB_CASCADE_FIELD_LABELS = {
  confidentialityPeriod: "Plazo confidencialidad", noticePeriod: "Preaviso", penaltyAmount: "Penalización",
  paymentDays: "Plazo de pago", baseAmount: "Importe base", retentionPct: "Retención",
  availability: "Disponibilidad", penaltyPct: "Penalización %", maxMonthlyPenalty: "Tope mensual",
  dataRetention: "Retención datos", internationalTransfer: "Transferencia int.", subprocessors: "Subencargados",
  exclusivity: "Exclusividad", territory: "Territorio", duration: "Duración",
  // Insurance labels
  blockingStatus: "Estado bloqueo IF_exclusion", medicalExamRequired: "Reconocimiento médico",
  annualPremium: "Prima anual", financialRating: "Rating financiero deudor",
  validationPending: "Validación pendiente", blockingEffect: "Efecto bloqueo",
  riskCategory: "Categoría de riesgo", peritacionStatus: "Estado peritación",
  estimatedDamage: "Daño estimado", agreedIndemnity: "Indemnización acordada",
  deductibleAmount: "Franquicia", deductibleApplied: "Franquicia aplicada",
};

// ─── Insurance helpers ────────────────────────────────────────────────────────
export const INSURANCE_TEMPLATE_KEYS = ["SEGURO_VIDA","SEGURO_RC","SEGURO_DANOS","SEGURO_CREDITO_COMERCIAL"];

export const INSURANCE_POLICY_CONFIG = {
  SEGURO_VIDA:             { label: "Vida",      color: "#059669", icon: "♡", subs: ["COBERTURA_VIDA","EXCLUSIONES_VIDA","PRIMA_VIDA"] },
  SEGURO_RC:               { label: "RC",        color: "#2563EB", icon: "◎", subs: ["COBERTURA_RC","LIMITES_RC","FRANQUICIA_RC"] },
  SEGURO_DANOS:            { label: "Daños",     color: "#D97706", icon: "⊕", subs: ["COBERTURA_DANOS","PERITACION","EXCLUSIONES_DANOS"] },
  SEGURO_CREDITO_COMERCIAL:{ label: "Crédito",   color: "#7C3AED", icon: "⬡", subs: ["COBERTURA_CREDITO","VALIDACION_FINANCIERA","RIESGO_EMPRESARIAL"] },
};

// ─── Cross-policy IF edges (inter-group connections in the live graph) ────────
// These represent real legal/operational interdependencies between insurance
// policies held by the same company (shared tomador / partyA).
export const CROSS_POLICY_IF_EDGES = [
  // ── Tomador identity backbone: shared company across all 4 masters ──────────
  { aPolicyKey: "SEGURO_VIDA",             aType: "master",
    bPolicyKey: "SEGURO_RC",               bType: "master",
    label: "Tomador compartido",  type: "identity",  color: "#C9A84C",
    arcDir: "above",
    description: "Misma persona jurídica — cambio de partyA afecta a todas las pólizas" },
  { aPolicyKey: "SEGURO_RC",               aType: "master",
    bPolicyKey: "SEGURO_DANOS",            bType: "master",
    label: "Tomador compartido",  type: "identity",  color: "#C9A84C",
    arcDir: "above",
    description: "Misma persona jurídica — cambio de partyA afecta a todas las pólizas" },
  { aPolicyKey: "SEGURO_DANOS",            aType: "master",
    bPolicyKey: "SEGURO_CREDITO_COMERCIAL",bType: "master",
    label: "Tomador compartido",  type: "identity",  color: "#C9A84C",
    arcDir: "above",
    description: "Misma persona jurídica — cambio de partyA afecta a todas las pólizas" },
  // ── Risk correlation: credit risk → property damage assessment ───────────────
  { aPolicyKey: "SEGURO_CREDITO_COMERCIAL", aType: "RIESGO_EMPRESARIAL",
    bPolicyKey: "SEGURO_DANOS",             bType: "PERITACION",
    label: "Riesgo → valoración", type: "risk",      color: "#D97706",
    arcDir: "below",
    description: "Rating crediticio del tomador afecta la valoración del bien asegurado" },
  // ── Medical exclusion → RC risk profile ─────────────────────────────────────
  { aPolicyKey: "SEGURO_VIDA",  aType: "EXCLUSIONES_VIDA",
    bPolicyKey: "SEGURO_RC",    bType: "COBERTURA_RC",
    label: "Exclusión → RC",    type: "exclusion",  color: "#DC2626",
    arcDir: "below",
    description: "Exclusión médica activa en Vida modifica el perfil de riesgo RC del mismo asegurado" },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHENOMENON III — F1/F2/F3 Insurance Structure
// Source: PHENOMENON_III_Flujograma_fenomenologico_del_seguro.docx
// Integration tracked in: PHENOMENON_III_PROGRESS.md
//
// FEATURE FLAG: set to true only after Phase 3 visual verification in browser.
// When false, nothing in the UI changes — this block is data-only.
// To instantly revert all Phase 3 visual changes: set this back to false.
// ─────────────────────────────────────────────────────────────────────────────

export const PHENOMENON_III_ENABLED = true;

// F1/F2/F3 phase display config — colors, labels, border style for rendering
export const PHENOMENON_PHASE_CFG = {
  F1: {
    label:       "F1 — Coverage",
    sublabel:    "Active coverage (IA co-activa) — always exists",
    color:       "#3b82f6",
    borderStyle: "solid",
    opacity:     1.0,
    icon:        "◉",
    description: "The insurer is currently providing the coverage service. The premium pays for this present operation, not a future payment. The insured object (ferencia sensual) is covered but not yet damaged.",
  },
  F2: {
    label:       "F2 — Claim / Indemnification",
    sublabel:    "Opens ONLY when a specific loss event (CST) occurs",
    color:       "#f97316",
    borderStyle: "solid",
    opacity:     1.0,
    icon:        "⚡",
    description: "F2 does not pre-exist. It is created when the loss event actualises the insured object. Legal basis: Art. 1089 CC. NOT a debt payment. NOT solventio (Art. 1158 CC). NOT automatic subrogation.",
  },
  F3: {
    label:       "F3 — Recovery",
    sublabel:    "Eventual — only if a culpable party is identified",
    color:       "#a855f7",
    borderStyle: "dashed",
    opacity:     0.72,
    icon:        "⬡",
    description: "F3 is optional and independent. It is its own legal path via Art. 1902 CC + Art. 1089 CC. Do not confuse with F2. Do not treat as automatic subrogation.",
  },
};

// SEC (Consequential Effect Classes) — modulation layers of F1 coverage
export const SEC_TYPES = {
  DE: {
    label: "DE — Daño Emergente",
    labelEn: "Direct Loss",
    color: "#60a5fa",
    description: "First modulation layer of F1 coverage. The immediate direct loss to the insured object.",
  },
  DS: {
    label: "DS — Daño Siguiente",
    labelEn: "Consequential Loss",
    color: "#34d399",
    description: "Second modulation layer. Consequential damages that follow from the primary loss.",
  },
  OBC: {
    label: "OBC — O(b)creencia",
    labelEn: "Observed Sequence (non-causal)",
    color: "#f59e0b",
    description: "Pro-sequences observed by the observer without imposing direct causation between events. Prevents confusing temporal sequence with legal causality. Example: second tower did not fall BECAUSE of the first — it was a separate CST event.",
  },
};

// IF trigger types — how phenomena connect conditionally
export const IF_TRIGGER_TYPES = {
  siniestro_cst: {
    label:       "CST Trigger → F2",
    description: "A specific loss event (CST) triggers the creation of F2. F2 does not exist before this event.",
    color:       "#f97316",
    conditional: true,
    eventual:    false,
    arrowStyle:  "solid",
  },
  culpable_id: {
    label:       "Culpable → F3",
    description: "Identification of a liable third party triggers optional creation of F3. F3 does not always exist.",
    color:       "#a855f7",
    conditional: true,
    eventual:    true,
    arrowStyle:  "dashed",
  },
  manual: {
    label:       "Manual IF",
    description: "Standard manually-created inter-phenomenon link (existing behaviour).",
    color:       "#8b949e",
    conditional: false,
    eventual:    false,
    arrowStyle:  "solid",
  },
};

// F1/F2/F3 phenomenon types per insurance product
// Key: phenomenon type string stored in DB / used in CONTRACT_TEMPLATES
// These are the NEW types for the v2 demo structure — existing types (SEGURO_VIDA etc.) are UNCHANGED
export const INSURANCE_F1_F2_F3_TYPES = {
  // Life insurance
  SEGURO_VIDA_F1:    { policy: "SEGURO_VIDA",             phase: "F1", label: "Life — Coverage",         icon: "♡", color: "#3b82f6" },
  SEGURO_VIDA_F2:    { policy: "SEGURO_VIDA",             phase: "F2", label: "Life — Claim",             icon: "⚡", color: "#f97316" },
  SEGURO_VIDA_F3:    { policy: "SEGURO_VIDA",             phase: "F3", label: "Life — Recovery",          icon: "⬡", color: "#a855f7" },
  // RC insurance
  SEGURO_RC_F1:      { policy: "SEGURO_RC",               phase: "F1", label: "RC — Coverage",            icon: "◎", color: "#3b82f6" },
  SEGURO_RC_F2:      { policy: "SEGURO_RC",               phase: "F2", label: "RC — Claim",               icon: "⚡", color: "#f97316" },
  SEGURO_RC_F3:      { policy: "SEGURO_RC",               phase: "F3", label: "RC — Recovery",            icon: "⬡", color: "#a855f7" },
  // Property damage insurance
  SEGURO_DANOS_F1:   { policy: "SEGURO_DANOS",            phase: "F1", label: "Property — Coverage",      icon: "⊕", color: "#3b82f6" },
  SEGURO_DANOS_F2:   { policy: "SEGURO_DANOS",            phase: "F2", label: "Property — Claim",         icon: "⚡", color: "#f97316" },
  SEGURO_DANOS_F3:   { policy: "SEGURO_DANOS",            phase: "F3", label: "Property — Recovery",      icon: "⬡", color: "#a855f7" },
  // Credit insurance
  SEGURO_CREDITO_F1: { policy: "SEGURO_CREDITO_COMERCIAL", phase: "F1", label: "Credit — Coverage",       icon: "◑", color: "#3b82f6" },
  SEGURO_CREDITO_F2: { policy: "SEGURO_CREDITO_COMERCIAL", phase: "F2", label: "Credit — Claim",          icon: "⚡", color: "#f97316" },
  SEGURO_CREDITO_F3: { policy: "SEGURO_CREDITO_COMERCIAL", phase: "F3", label: "Credit — Recovery",       icon: "⬡", color: "#a855f7" },
};

// Negations enforced in F2 — what an insurance indemnification is NOT
// Used by engine guards and displayed in the F2 detail panel
export const F2_NEGACIONES = [
  { id: "NOT_SOLVENTIO",             label: "NOT solventio (Art. 1158 CC)",     description: "The insurer does not pay another party's debt on their behalf." },
  { id: "NOT_DEBT_PAYMENT",          label: "NOT payment of another's debt",    description: "Insurance indemnifies its own insured object — it does not step into the culpable party's debt." },
  { id: "NOT_AUTO_SUBROGATION",      label: "NOT automatic subrogation",        description: "Recovery (F3) is a separate legal path that does not follow automatically from indemnification (F2)." },
];

// Legal basis references used in F2 and F3
export const INSURANCE_LEGAL_BASIS = {
  F2: "Art. 1089 CC (origin of obligations, applied to indemnification hypothesis)",
  F3: "Art. 1902 CC (extra-contractual liability) · Art. 1089 CC",
};

// Helper: given a phenomenon type string, return its phase config or null
export function getInsurancePhase(phenomenonType) {
  const entry = INSURANCE_F1_F2_F3_TYPES[phenomenonType];
  if (!entry) return null;
  return { ...entry, ...PHENOMENON_PHASE_CFG[entry.phase] };
}

// Helper: given a base policy key, return its 3 F1/F2/F3 type keys
export function getPolicyF1F2F3Keys(policyKey) {
  return Object.entries(INSURANCE_F1_F2_F3_TYPES)
    .filter(([, v]) => v.policy === policyKey)
    .map(([k]) => k);
}
