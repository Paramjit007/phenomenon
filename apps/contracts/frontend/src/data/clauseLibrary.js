// Real Spanish-law clauses for drag-and-drop use in the PHENOMENON engine.
// Based on: Código Civil, Ley 1/2019, RGPD/LOPDGDD, Ley 3/2004, RDL 1/1996, Ley 12/1992.

export const CLAUSE_LIBRARY = {
  NDA: [
    {
      id: "nda-001",
      category: "Confidencialidad",
      title: "Obligación general de confidencialidad",
      law: "Ley 1/2019 Art. 1 · Art. 1258 CC",
      text: "Las Partes se obligan recíprocamente a guardar secreto y confidencialidad acerca de toda la Información Confidencial que en el marco de sus relaciones comerciales reciban de la otra Parte, de conformidad con lo establecido en la Ley 1/2019, de 20 de febrero, de Secretos Empresariales, comprometiéndose a no revelar, publicar, difundir ni transmitir dicha información a terceros sin el previo consentimiento escrito de la Parte divulgadora.",
    },
    {
      id: "nda-002",
      category: "Confidencialidad",
      title: "Definición de información confidencial",
      law: "Ley 1/2019 Art. 1.1",
      text: "A los efectos del presente Acuerdo, se entenderá por «Información Confidencial» cualquier dato, documento, información o material, en cualquier formato o soporte, de naturaleza técnica, comercial, industrial, financiera o estratégica que no sea de dominio público, incluyendo, sin carácter limitativo: know-how, fórmulas, procesos, diseños, planos, modelos, bases de datos, listas de clientes y proveedores, estrategias comerciales, información financiera, planes de negocio y cualquier otro dato identificado expresamente como confidencial.",
    },
    {
      id: "nda-003",
      category: "Confidencialidad",
      title: "Exclusiones de la obligación de confidencialidad",
      law: "Ley 1/2019 Art. 3",
      text: "La obligación de confidencialidad no será de aplicación a aquella información que: (i) sea o pase a ser de dominio público sin que medie incumplimiento del presente Acuerdo; (ii) fuese conocida por la Parte receptora con anterioridad a su divulgación, acreditándolo documentalmente; (iii) sea obtenida legítimamente de un tercero que no esté obligado a guardar confidencialidad; o (iv) deba revelarse en virtud de exigencia legal, reglamentaria o resolución judicial o administrativa firme, previa notificación inmediata a la Parte divulgadora.",
    },
    {
      id: "nda-004",
      category: "Sanciones",
      title: "Cláusula penal por incumplimiento",
      law: "Art. 1152 CC · Ley 1/2019 Art. 8",
      text: "En caso de incumplimiento de las obligaciones de confidencialidad establecidas en el presente Acuerdo, la Parte infractora vendrá obligada a satisfacer a la Parte perjudicada una indemnización pactada de [IMPORTE] euros, sin perjuicio de la reclamación de los daños y perjuicios que excedan de dicha cuantía, incluyendo el lucro cesante, el daño emergente y el daño reputacional, de conformidad con los artículos 1.152 y siguientes del Código Civil español y el artículo 8 de la Ley 1/2019.",
    },
    {
      id: "nda-005",
      category: "Obligaciones",
      title: "Medidas de seguridad para proteger la información",
      law: "RGPD Art. 32 · Ley 1/2019",
      text: "La Parte receptora se compromete a adoptar, respecto a la Información Confidencial, las mismas medidas de seguridad y diligencia que aplique a su propia información confidencial, que en ningún caso podrán ser inferiores a las medidas de seguridad razonables para la naturaleza de la información, incluyendo cuando la Información Confidencial incluya datos de carácter personal, las medidas técnicas y organizativas exigidas por el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).",
    },
    {
      id: "nda-006",
      category: "Obligaciones",
      title: "Devolución y destrucción de información",
      law: "Ley 1/2019 · Art. 1258 CC",
      text: "A la terminación del presente Acuerdo, por cualquier causa, o a requerimiento de la Parte divulgadora, la Parte receptora deberá, a elección de la Parte divulgadora: (i) devolver de forma inmediata toda la Información Confidencial recibida, en cualquier soporte, así como todas las copias, extractos o reproducciones; o (ii) destruir de forma segura dicha Información Confidencial, acreditándolo mediante certificado de destrucción, conforme a los estándares de seguridad aplicables.",
    },
    {
      id: "nda-007",
      category: "Sanciones",
      title: "Acciones legales ante incumplimiento",
      law: "Ley 1/2019 Arts. 8-12 · LEC Art. 721",
      text: "En caso de incumplimiento o amenaza inminente de incumplimiento de las obligaciones del presente Acuerdo, la Parte perjudicada podrá, sin perjuicio de la reclamación de daños y perjuicios, solicitar ante los Juzgados y Tribunales competentes la adopción de medidas cautelares urgentes, incluyendo la cesación inmediata de los actos constitutivos de violación del secreto empresarial, conforme a lo establecido en la Ley 1/2019, de 20 de febrero, de Secretos Empresariales y la Ley 1/2000, de Enjuiciamiento Civil.",
    },
  ],

  SLA: [
    {
      id: "sla-001",
      category: "Disponibilidad",
      title: "Disponibilidad mínima garantizada",
      law: "Art. 1152 CC · Ley 7/1996",
      text: "El Proveedor garantiza una disponibilidad mínima del Servicio del [PORCENTAJE]% mensual, calculada mediante la fórmula: Disponibilidad (%) = ((Minutos totales del período − Minutos de indisponibilidad no programada) / Minutos totales del período) × 100, excluyendo expresamente las ventanas de mantenimiento programado notificadas con antelación mínima de 48 horas y los supuestos de fuerza mayor o caso fortuito conforme al artículo 1.105 del Código Civil.",
    },
    {
      id: "sla-002",
      category: "Incidentes",
      title: "Clasificación de incidentes por criticidad",
      law: "Art. 1544 CC",
      text: "A efectos del presente Acuerdo, los incidentes se clasificarán según los siguientes niveles de criticidad: (i) Nivel Crítico: el Servicio no está disponible o existe pérdida de datos; (ii) Nivel Alto: impacto grave en la operativa del Cliente sin alternativa de trabajo disponible; (iii) Nivel Medio: impacto moderado con alternativa de trabajo disponible; (iv) Nivel Bajo: impacto mínimo o meramente estético, sin consecuencias operativas significativas.",
    },
    {
      id: "sla-003",
      category: "Incidentes",
      title: "Tiempos de respuesta y resolución garantizados",
      law: "Art. 1091 CC",
      text: "Los tiempos máximos de respuesta inicial y resolución definitiva para cada nivel de criticidad son: Crítico: respuesta en [X] horas, resolución en [Y] horas; Alto: respuesta en [A] horas, resolución en [B] horas; Medio: respuesta en [C] horas laborables, resolución en [D] horas laborables; Bajo: respuesta en [E] horas laborables. El incumplimiento de estos plazos activará automáticamente el mecanismo de penalizaciones establecido en el presente Acuerdo.",
    },
    {
      id: "sla-004",
      category: "Penalizaciones",
      title: "Cláusula penal por incumplimiento del SLA",
      law: "Art. 1152 CC · OBCP jurisprudencia TS",
      text: "Por cada punto porcentual de disponibilidad mensual por debajo del nivel garantizado, el Proveedor aplicará al Cliente un crédito de servicio equivalente al [PORCENTAJE]% del importe de la factura mensual correspondiente, con un máximo del [MÁXIMO]% de la factura mensual. Dichos créditos se aplicarán automáticamente en la siguiente facturación y constituirán la única compensación por incumplimiento del nivel de disponibilidad, sin perjuicio de los supuestos de dolo o culpa grave.",
    },
    {
      id: "sla-005",
      category: "Exclusiones",
      title: "Exclusiones del acuerdo de nivel de servicio",
      law: "Art. 1105 CC · Rebus sic stantibus",
      text: "Quedan expresamente excluidos del cómputo de disponibilidad y de la aplicación de penalizaciones: (i) los períodos de mantenimiento programado notificados con antelación mínima de 48 horas; (ii) las interrupciones causadas por fuerza mayor o caso fortuito, conforme al artículo 1.105 del Código Civil; (iii) las interrupciones causadas por acciones u omisiones del Cliente o de terceros bajo su responsabilidad; (iv) los ataques de denegación de servicio (DDoS) de magnitud extraordinaria; y (v) los fallos de infraestructura de internet ajenos al control del Proveedor.",
    },
    {
      id: "sla-006",
      category: "Disponibilidad",
      title: "Informes de cumplimiento y revisión del SLA",
      law: "Art. 1258 CC",
      text: "El Proveedor emitirá mensualmente, dentro de los cinco (5) primeros días hábiles del mes siguiente, un informe de cumplimiento del nivel de servicio que incluirá: disponibilidad real del período, número y clasificación de incidentes, tiempos medios de respuesta y resolución, créditos aplicados si hubiere, y plan de mejora en caso de incumplimiento. Ambas Partes podrán solicitar una revisión del nivel de servicio cada doce (12) meses.",
    },
  ],

  PAYMENT: [
    {
      id: "pay-001",
      category: "Precio",
      title: "Precio, IVA y condiciones económicas",
      law: "Ley 37/1992 · RD 1619/2012",
      text: "El precio por los servicios objeto del presente contrato asciende a [IMPORTE] euros netos anuales/mensuales (IVA excluido). Sobre dicho importe se aplicará el Impuesto sobre el Valor Añadido (IVA) al tipo vigente en cada momento, conforme a lo establecido en la Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido. El precio indicado incluye todos los gastos, costes y tributos necesarios para la correcta ejecución del objeto del contrato, salvo el IVA.",
    },
    {
      id: "pay-002",
      category: "Morosidad",
      title: "Plazo de pago y lucha contra la morosidad",
      law: "Ley 3/2004 Art. 4 · Art. 1100 CC",
      text: "El pago se realizará en un plazo máximo de treinta (30) días naturales desde la fecha de recepción de la factura correspondiente, en estricto cumplimiento de lo establecido en la Ley 3/2004, de 29 de diciembre, de medidas de lucha contra la morosidad en las operaciones comerciales. La mera recepción de la factura constituirá requerimiento fehaciente a los efectos del artículo 1.100 del Código Civil.",
    },
    {
      id: "pay-003",
      category: "Morosidad",
      title: "Intereses de demora automáticos",
      law: "Ley 3/2004 Art. 7 · Directiva 2011/7/UE",
      text: "El impago en el plazo establecido devengará automáticamente, sin necesidad de requerimiento previo ni intimación judicial, intereses de demora calculados al tipo de interés de referencia del Banco Central Europeo aplicable en el primer día hábil del semestre natural en que se produzca el devengo, incrementado en ocho (8) puntos porcentuales, de conformidad con el artículo 7 de la Ley 3/2004 y la Directiva 2011/7/UE.",
    },
    {
      id: "pay-004",
      category: "Facturación",
      title: "Facturación electrónica obligatoria",
      law: "RD 1619/2012 · Ley 25/2013",
      text: "Las facturas se emitirán en formato electrónico conforme al Real Decreto 1619/2012, de 30 de noviembre, por el que se regulan las obligaciones de facturación, y la Ley 25/2013, de 27 de diciembre, de impulso de la factura electrónica. Las facturas deberán contener los requisitos legalmente exigidos, incluyendo NIF de ambas partes, desglose del IVA, fecha de operación y número de referencia del pedido o contrato.",
    },
    {
      id: "pay-005",
      category: "Precio",
      title: "Revisión anual de precios (IPC)",
      law: "Art. 1255 CC · INE",
      text: "Los precios establecidos en el presente contrato podrán revisarse anualmente, en el mes de enero de cada año de vigencia, aplicando la variación porcentual del Índice de Precios al Consumo (IPC) General publicado por el Instituto Nacional de Estadística (INE) para los doce meses anteriores. La revisión deberá notificarse a la otra Parte con al menos treinta (30) días de antelación a su aplicación.",
    },
    {
      id: "pay-006",
      category: "Incumplimiento",
      title: "Suspensión del servicio por impago",
      law: "Art. 1124 CC",
      text: "El incumplimiento del pago de dos (2) o más facturas consecutivas o alternativas facultará al Prestador para, previa notificación fehaciente con antelación mínima de quince (15) días hábiles, suspender temporalmente la prestación del servicio hasta la regularización de la deuda, sin que dicha suspensión genere derecho a indemnización alguna a favor del Contratante, de conformidad con el principio de excepción de incumplimiento contractual del artículo 1.124 del Código Civil.",
    },
  ],

  DPA: [
    {
      id: "dpa-001",
      category: "Roles y obligaciones",
      title: "Instrucciones del responsable del tratamiento",
      law: "RGPD Art. 28 · LOPDGDD Art. 33",
      text: "El Encargado del Tratamiento tratará los datos personales a los que tenga acceso en el marco del presente Acuerdo única y exclusivamente siguiendo las instrucciones documentadas del Responsable del Tratamiento, de conformidad con lo establecido en el artículo 28 del Reglamento (UE) 2016/679 (RGPD) y el artículo 33 de la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD). El Encargado informará inmediatamente al Responsable si, en su opinión, alguna instrucción infringe la normativa aplicable.",
    },
    {
      id: "dpa-002",
      category: "Seguridad",
      title: "Medidas de seguridad técnicas y organizativas",
      law: "RGPD Art. 32 · ENS",
      text: "El Encargado aplicará las medidas técnicas y organizativas apropiadas para garantizar un nivel de seguridad adecuado al riesgo, teniendo en cuenta el estado de la técnica, los costes de aplicación y la naturaleza, alcance, contexto y fines del tratamiento. Tales medidas incluirán, como mínimo: (i) cifrado de datos personales; (ii) garantía de la confidencialidad, integridad y disponibilidad del tratamiento; (iii) capacidad de restaurar el acceso a los datos en caso de incidente; y (iv) proceso de verificación y evaluación periódica de las medidas, conforme al artículo 32 del RGPD.",
    },
    {
      id: "dpa-003",
      category: "Incidentes",
      title: "Notificación de violaciones de seguridad (72 horas)",
      law: "RGPD Art. 33 · LOPDGDD Art. 34",
      text: "El Encargado notificará al Responsable del Tratamiento, sin dilación indebida y, a ser posible, dentro de las setenta y dos (72) horas siguientes a que tenga constancia de ello, cualquier violación de la seguridad de los datos personales bajo su custodia, conforme al artículo 33 del RGPD. La notificación deberá incluir: la naturaleza de la violación, categorías y número aproximado de interesados afectados, posibles consecuencias y las medidas adoptadas o propuestas.",
    },
    {
      id: "dpa-004",
      category: "Subencargados",
      title: "Subencargados del tratamiento autorizados",
      law: "RGPD Art. 28.2 · Art. 28.4",
      text: "El Encargado no contratará a otro encargado (subencargado) sin la autorización escrita previa, específica o general, del Responsable. En caso de autorización general, el Encargado informará al Responsable de cualquier cambio previsto en la incorporación o sustitución de otros encargados, dando al Responsable la oportunidad de oponerse a dichos cambios. Cuando el Encargado recurra a otro encargado, impondrá a este, mediante contrato, las mismas obligaciones de protección de datos que las establecidas en el presente Acuerdo, conforme al artículo 28.4 del RGPD.",
    },
    {
      id: "dpa-005",
      category: "Derechos de los interesados",
      title: "Asistencia al responsable para el ejercicio de derechos ARCO+",
      law: "RGPD Arts. 15-22 · LOPDGDD",
      text: "El Encargado asistirá al Responsable, en la medida de lo posible, mediante medidas técnicas y organizativas apropiadas, para que este pueda cumplir su obligación de responder las solicitudes de ejercicio de los derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición de los interesados, conforme a los artículos 15 a 22 del RGPD. Dicha asistencia se prestará en un plazo máximo de cinco (5) días hábiles desde la solicitud.",
    },
    {
      id: "dpa-006",
      category: "Roles y obligaciones",
      title: "Supresión o devolución de datos al finalizar",
      law: "RGPD Art. 28.3.g · AEPD",
      text: "A la finalización del presente Acuerdo, por cualquier causa, el Encargado, a elección del Responsable, suprimirá o devolverá todos los datos personales y suprimirá las copias existentes, salvo que el Derecho de la Unión Europea o de los Estados miembros exija la conservación de los datos. El Encargado acreditará documentalmente la destrucción o devolución de los datos en un plazo máximo de treinta (30) días desde la terminación.",
    },
  ],

  IP: [
    {
      id: "ip-001",
      category: "Cesión",
      title: "Objeto y alcance de la cesión de derechos",
      law: "RDL 1/1996 Art. 43 · Art. 88",
      text: "Por virtud del presente Acuerdo, el Cedente transmite al Cesionario, con carácter [exclusivo/no exclusivo] y plena eficacia jurídica, todos los derechos de explotación de propiedad intelectual sobre las obras y creaciones objeto del presente contrato, de conformidad con el artículo 43 del Real Decreto Legislativo 1/1996, de 12 de abril, por el que se aprueba el Texto Refundido de la Ley de Propiedad Intelectual. La cesión se realiza para todos los territorios y por toda la duración legal de los derechos.",
    },
    {
      id: "ip-002",
      category: "Cesión",
      title: "Derechos de explotación incluidos en la cesión",
      law: "RDL 1/1996 Arts. 17-23",
      text: "Los derechos cedidos comprenden, de forma no limitativa: (i) el derecho de reproducción en cualquier soporte y por cualquier medio; (ii) el derecho de distribución al público, incluyendo venta, alquiler y préstamo; (iii) el derecho de comunicación pública en cualquier modalidad, incluida la puesta a disposición interactiva; y (iv) el derecho de transformación, incluyendo la traducción, adaptación y cualquier modificación. Esta cesión abarca todas las modalidades de explotación conocidas o que puedan conocerse en el futuro.",
    },
    {
      id: "ip-003",
      category: "Garantías",
      title: "Garantía de titularidad y no infracción",
      law: "RDL 1/1996 · Art. 1475 CC",
      text: "El Cedente garantiza que es el único y exclusivo titular de todos los derechos de propiedad intelectual objeto del presente Acuerdo, o que cuenta con las facultades necesarias para su cesión, y que dichas obras no infringen derechos de propiedad intelectual, industrial o de cualquier otro tipo de terceros. El Cedente mantendrá indemne al Cesionario frente a cualquier reclamación, demanda, acción o procedimiento de terceros que traiga causa de la infracción de los citados derechos.",
    },
    {
      id: "ip-004",
      category: "Derechos morales",
      title: "Reconocimiento de los derechos morales del autor",
      law: "RDL 1/1996 Arts. 14-16",
      text: "La presente cesión de derechos de explotación no afecta a los derechos morales irrenunciables del autor, conforme a los artículos 14 a 16 del Real Decreto Legislativo 1/1996. No obstante, el autor autoriza expresamente al Cesionario para que las obras puedan divulgarse sin mención de su nombre cuando ello sea necesario para el uso comercial habitual, salvo que se acuerde expresamente lo contrario por escrito.",
    },
    {
      id: "ip-005",
      category: "Protección",
      title: "Defensa ante infracciones por terceros",
      law: "RDL 1/1996 Art. 138 · LEC Art. 249",
      text: "En caso de infracción de los derechos cedidos por parte de terceros, ambas Partes cooperarán de buena fe en la defensa de dichos derechos. El Cesionario quedará facultado para ejercer, en nombre propio, las acciones civiles y penales oportunas para hacer cesar la infracción y obtener la correspondiente indemnización. El Cedente se compromete a prestar toda la colaboración necesaria, incluyendo la aportación de documentación y comparecencia como testigo o perito si fuere requerido.",
    },
    {
      id: "ip-006",
      category: "Cesión",
      title: "Sublicenciamiento y cesión a terceros",
      law: "RDL 1/1996 Art. 48",
      text: "El Cesionario [podrá / no podrá] sublicenciar o ceder a terceros los derechos adquiridos en virtud del presente Acuerdo, sin el previo consentimiento escrito del Cedente. En caso de estar autorizado el sublicenciamiento, el Cesionario será responsable ante el Cedente del cumplimiento por parte del sublicenciatario de todas las obligaciones derivadas del presente Acuerdo, de conformidad con el artículo 48 del Real Decreto Legislativo 1/1996.",
    },
  ],

  GENERAL: [
    {
      id: "gen-001",
      category: "General",
      title: "Fuerza mayor y caso fortuito",
      law: "Art. 1105 CC · Rebus sic stantibus",
      text: "Ninguna de las Partes será responsable del incumplimiento de sus obligaciones cuando dicho incumplimiento sea consecuencia de circunstancias de fuerza mayor o caso fortuito, entendiendo por tales los hechos imprevisibles e inevitables ajenos a la voluntad de las Partes, conforme al artículo 1.105 del Código Civil español. La Parte afectada deberá notificar fehacientemente a la otra Parte la existencia de la causa de fuerza mayor en el plazo máximo de cinco (5) días desde su conocimiento, indicando su naturaleza, duración estimada y efectos previstos.",
    },
    {
      id: "gen-002",
      category: "General",
      title: "Resolución anticipada por incumplimiento",
      law: "Art. 1124 CC",
      text: "Cualquiera de las Partes podrá resolver el presente contrato con efectos inmediatos, mediante notificación fehaciente a la otra Parte, en los casos de: (i) incumplimiento grave o reiterado de las obligaciones esenciales del contrato; (ii) declaración de concurso de acreedores o insolvencia de la otra Parte; (iii) incumplimiento del deber de confidencialidad; (iv) cesión del contrato sin consentimiento; o (v) fuerza mayor que se prolongue más de [DÍAS] días consecutivos. La resolución no exime del pago de las cantidades devengadas hasta la fecha.",
    },
    {
      id: "gen-003",
      category: "General",
      title: "Notificaciones y comunicaciones",
      law: "Art. 1258 CC · Ley 34/2002 LSSI",
      text: "Todas las notificaciones, comunicaciones o requerimientos derivados del presente contrato deberán realizarse por escrito y se considerarán válidamente efectuados cuando se realicen mediante: (i) correo certificado con acuse de recibo; (ii) burofax con certificación de contenido; (iii) acta notarial; o (iv) correo electrónico con acuse de recibo y verificación de entrega, conforme a la Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información, a las direcciones indicadas en el encabezamiento del presente contrato.",
    },
    {
      id: "gen-004",
      category: "General",
      title: "Legislación aplicable y jurisdicción",
      law: "Art. 1255 CC · Art. 22 LOPJ",
      text: "El presente contrato se rige e interpreta de conformidad con la legislación española vigente. Para la resolución de cualquier controversia, discrepancia o reclamación derivada o relacionada con el presente contrato, las Partes, con renuncia expresa a cualquier otro fuero que pudiera corresponderles, se someten a la jurisdicción exclusiva de los Juzgados y Tribunales de [CIUDAD], de conformidad con lo establecido en la Ley Orgánica del Poder Judicial.",
    },
    {
      id: "gen-005",
      category: "General",
      title: "Nulidad parcial y conservación del contrato",
      law: "Art. 1261 CC · Art. 10 LCGC",
      text: "Si cualquier cláusula del presente contrato fuera declarada nula, inválida o inaplicable por resolución judicial o administrativa firme, dicha nulidad no afectará a las demás cláusulas, que conservarán plena vigencia y eficacia. Las Partes se comprometen a sustituir la cláusula nula por otra que, siendo válida, se aproxime en la mayor medida posible a la finalidad económica perseguida por la cláusula anulada, de conformidad con el principio de conservación del negocio jurídico.",
    },
    {
      id: "gen-006",
      category: "General",
      title: "Modificación del contrato",
      law: "Art. 1203 CC",
      text: "Cualquier modificación, enmienda o adenda al presente contrato deberá constar por escrito y ser suscrita por los representantes legales debidamente apoderados de ambas Partes. Los acuerdos verbales o por correo electrónico no constituirán modificación del contrato, salvo que sean confirmados por escrito en el plazo de cinco (5) días hábiles y firmados por ambas Partes.",
    },
    {
      id: "gen-007",
      category: "General",
      title: "Vigencia y prórroga automática",
      law: "Art. 1256 CC",
      text: "El presente contrato entrará en vigor en la fecha de su firma por ambas Partes y tendrá una duración de [DURACIÓN]. Salvo que cualquiera de las Partes notifique a la otra su voluntad de no prorrogarlo con una antelación mínima de [DÍAS] días antes de la fecha de vencimiento, el contrato se prorrogará automáticamente por períodos sucesivos de igual duración.",
    },
  ],

  MASTER: [
    {
      id: "master-001",
      category: "Objeto",
      title: "Objeto y alcance de los servicios",
      law: "Art. 1544 CC",
      text: "El objeto del presente contrato es la prestación por parte del Prestador al Contratante de los servicios descritos en el Anexo de Alcance, que se incorpora al presente contrato como parte integrante del mismo. El Prestador se obliga a prestar los servicios con la diligencia propia de un profesional cualificado del sector, conforme a los estándares y buenas prácticas aplicables, y de conformidad con las instrucciones razonables que el Contratante pueda impartir durante la vigencia del contrato.",
    },
    {
      id: "master-002",
      category: "Obligaciones",
      title: "Obligaciones esenciales del prestador",
      law: "Art. 1091 CC",
      text: "El Prestador se obliga a: (i) prestar los servicios contratados con la diligencia y profesionalidad requeridas; (ii) asignar al contrato el personal con la cualificación necesaria; (iii) mantener durante toda la vigencia del contrato los seguros de responsabilidad civil exigibles; (iv) notificar al Contratante, con la mayor brevedad posible, cualquier circunstancia que pueda afectar a la correcta prestación de los servicios; y (v) cumplir con la normativa laboral, fiscal y de seguridad social aplicable a su actividad.",
    },
    {
      id: "master-003",
      category: "Responsabilidad",
      title: "Limitación de responsabilidad civil",
      law: "Art. 1103 CC · Sentencias TS",
      text: "La responsabilidad máxima del Prestador derivada del presente contrato, por cualquier concepto, incluyendo daños directos e indirectos, quedará limitada al importe total facturado y efectivamente cobrado durante los doce (12) meses anteriores al evento generador de responsabilidad. Quedan expresamente excluidos de la responsabilidad del Prestador los daños indirectos, pérdidas de beneficios, pérdida de datos o daño reputacional, salvo en caso de dolo o culpa grave.",
    },
    {
      id: "master-004",
      category: "Personal",
      title: "Independencia laboral y prohibición de cesión ilegal",
      law: "ET Art. 43 · Ley 14/1994",
      text: "El personal que el Prestador destine a la ejecución del contrato dependerá exclusivamente de este, sin que entre dicho personal y el Contratante se genere relación laboral alguna. El Prestador asumirá íntegramente las obligaciones en materia de Seguridad Social y tributarias derivadas de su personal. El Contratante no podrá impartir órdenes de trabajo directas al personal del Prestador sin la intermediación de este, a fin de evitar incurrir en la cesión ilegal de trabajadores prohibida por el artículo 43 del Estatuto de los Trabajadores.",
    },
    {
      id: "master-005",
      category: "Resolución",
      title: "Subcontratación y cesión del contrato",
      law: "Art. 1255 CC",
      text: "El Prestador no podrá subcontratar ni ceder total o parcialmente el presente contrato a terceros sin el previo consentimiento escrito del Contratante, que no podrá ser denegado de forma arbitraria. En caso de subcontratación autorizada, el Prestador responderá frente al Contratante de la actuación del subcontratista como si se tratara de la suya propia, sin que ello exima al subcontratista de la aplicación directa de las obligaciones pertinentes del presente contrato.",
    },
  ],

  CONDICION_SOLAR: [
    {
      id: "solar-001",
      category: "Condición Suspensiva",
      title: "Condición suspensiva de obtención de la calificación de solar",
      law: "Art. 1123 CC · RDL 7/2015 Art. 11",
      text: "La presente compraventa queda subordinada a la condición suspensiva de que el suelo objeto del contrato obtenga la calificación de «solar» en el sentido del artículo 11 del Real Decreto Legislativo 7/2015, de 30 de octubre, por el que se aprueba el texto refundido de la Ley del Suelo, esto es, cuando cuente con todos los servicios urbanísticos exigibles (acceso rodado, agua potable, evacuación de aguas y suministro eléctrico) y esté encuadrada entre viales ejecutados y recibidos por el Ayuntamiento, todo ello conforme al planeamiento vigente. Mientras no se cumpla la condición, no se producirá la transmisión del dominio ni se devengará el precio aplazado.",
    },
    {
      id: "solar-002",
      category: "Condición Suspensiva",
      title: "Plazo máximo para el cumplimiento de la condición solar",
      law: "Art. 1117 CC · Art. 1504 CC",
      text: "La condición suspensiva deberá cumplirse en el plazo máximo de [AÑOS] años desde la fecha de firma del presente contrato. Si transcurrido dicho plazo no se hubiere obtenido la calificación de solar por causas no imputables al Vendedor, el Comprador podrá, a su elección: (i) resolver el contrato con devolución del precio de firma más los intereses legales del dinero desde la fecha de entrega; o (ii) prorrogar el plazo por períodos sucesivos de [AÑOS] años mediante acuerdo escrito. Si las causas del retraso fueren imputables al Vendedor, el Comprador tendrá derecho a una indemnización adicional por daños y perjuicios.",
    },
    {
      id: "solar-003",
      category: "Precio Aplazado",
      title: "Precio aplazado condicionado y garantía mediante condición resolutoria",
      law: "Arts. 1462, 1504 CC · DGRN",
      text: "El precio aplazado de [IMPORTE] euros se abonará en el plazo de [DÍAS] días naturales desde la fecha en que el Vendedor acredite fehacientemente ante el Comprador la obtención de la calificación de solar mediante [documento]. En garantía del pago del precio aplazado, se hace constar expresamente la condición resolutoria establecida en el artículo 1.504 del Código Civil, siendo voluntad de las Partes su inscripción en el Registro de la Propiedad, surtiendo plenos efectos frente a terceros.",
    },
    {
      id: "solar-004",
      category: "Cargas Urbanísticas",
      title: "Distribución de cargas y cuotas de urbanización",
      law: "RDL 7/2015 Arts. 18-21 · Ley Urbanística CCAA",
      text: "Las cargas urbanísticas derivadas de la gestión del suelo, incluyendo las cuotas de urbanización correspondientes a la parcela objeto del presente contrato en el sistema de [compensación/cooperación], serán sufragadas íntegramente por [el Vendedor/el Comprador], que asumirá personalmente la condición de propietario-promotor a efectos urbanísticos. En caso de que las cuotas de urbanización deban abonarse antes de la obtención de la condición solar, el [Vendedor/Comprador] las abonará directamente a la Junta de Compensación o al Ayuntamiento, sin que ello suponga alteración del precio acordado.",
    },
    {
      id: "solar-005",
      category: "Tributación",
      title: "Tributación: ITP, AJD, IIVTNU y plusvalía",
      law: "TRLITPAJD · Art. 104 TRLHL · IIVTNU",
      text: "El Impuesto de Transmisiones Patrimoniales (ITP) al tipo del [%] vigente en la Comunidad Autónoma de [CCAA], así como el Impuesto sobre Actos Jurídicos Documentados (AJD), serán satisfechos íntegramente por el Comprador. El Impuesto sobre el Incremento de Valor de los Terrenos de Naturaleza Urbana (IIVTNU), conocido como plusvalía municipal, será satisfecho por el Vendedor conforme al artículo 104.1 del Texto Refundido de la Ley Reguladora de las Haciendas Locales, salvo que se acredite que no existe incremento de valor (Art. 104.5 TRLHL), en cuyo caso se incorporará al contrato el informe pericial de valoración correspondiente.",
    },
    {
      id: "solar-006",
      category: "Estructura PHENOMENON",
      title: "Estructura de fases (F) e inter-fenómenica (IF) — PHENOMENON Engine",
      law: "Arts. 1113-1124 CC — Obligaciones condicionales",
      text: "A los efectos de la trazabilidad jurídica y seguimiento de la operación mediante el motor PHENOMENON, las Partes reconocen y aceptan la siguiente estructura de fases: F1 (Firma del contrato privado con entrega del precio de señal); IF1 (Condición suspensiva: obtención de calificación de solar); F2 (Cumplimiento de la condición: abono del precio aplazado y elevación a escritura pública); IF2 (Verificación registral: inscripción en el Registro de la Propiedad a favor del Comprador); F3 (Plena transmisión del dominio y liquidación de tributos). El incumplimiento de cualquier IF activa la cascada de consecuencias previstas en el presente contrato.",
    },
  ],
};

// Helper: get all clauses for a contract type, including GENERAL ones
export function getClausesForType(contractType) {
  // Map sub-contract types back to their clause category
  const typeMap = {
    CONDICION_SOLAR: "CONDICION_SOLAR",
    PAGO_APLAZADO:   "CONDICION_SOLAR",
    CARGAS_URBANISTICAS: "CONDICION_SOLAR",
  };
  const resolvedType = typeMap[contractType] ?? contractType;
  const specific = CLAUSE_LIBRARY[resolvedType] ?? CLAUSE_LIBRARY.MASTER ?? [];
  const general  = CLAUSE_LIBRARY.GENERAL ?? [];
  return [...specific, ...general];
}

// All categories for a given set of clauses
export function getCategories(clauses) {
  return [...new Set(clauses.map(c => c.category))];
}
