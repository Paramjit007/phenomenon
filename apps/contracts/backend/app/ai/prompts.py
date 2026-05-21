FALLBACK_CLAUSES: dict[str, list[str]] = {
    "FINANCIACION": [
        "El Prestador entrega en este acto, en concepto de arrendamiento de servicios financiero (circumcontrato del acuerdo principal de arrendamiento de cosa futura), la cantidad de [IMPORTE] euros, que el Prestatario reconoce haber recibido a su plena conformidad, en cumplimiento del principio de responsabilidad universal del art. 1.911 del Código Civil.",
        "El Prestatario ha de devolver el capital en un plazo máximo de [AÑOS] años desde la firma del presente circumcontrato, mediante transferencias bancarias mensuales de [CUOTA] euros, en la cuenta IBAN [IBAN] designada por el Prestador.",
        "Durante el plazo del circumcontrato, el capital devengará un interés de [TASA], calculado sobre el capital pendiente de amortización conforme al cuadro de amortización adjunto como Anexo.",
        "El presente circumcontrato quedará sin efecto de forma automática en el momento en que el Contrato de Arrendamiento de Cosa Futura (fenómeno principal) quede sin efecto por cualquier causa, constituyendo ambos una unidad jurídica inescindible vinculada por IF inter-fenomenica.",
    ],
    "HIPOTECA_GARANTIA": [
        "En garantía del cumplimiento de las obligaciones derivadas del circumcontrato de arrendamiento de servicios financiero, los constituyentes hipotecan a favor del Prestador el solar sito en [DIRECCIÓN], con referencia catastral [REF], y la futura edificación hotelera que sobre el mismo se realice, por un importe de responsabilidad hipotecaria de [IMPORTE] euros.",
        "En virtud de la presente hipoteca, el Prestador queda investido de legitimación para la reclamación judicial de su pretensión de devolución por la vía de la actio pecuniae creditae, así como para ceder dicha legitimación a terceros en los términos de los arts. 1.526 y siguientes del Código Civil.",
        "La presente hipoteca sobre edificio en construcción se constituye al amparo del art. 106 de la Ley Hipotecaria y se extenderá a la edificación futura una vez concluida, conforme a lo dispuesto en el art. 110 LH, quedando sujeta a los arts. 681 y siguientes de la LEC para su eventual ejecución.",
        "Para la plena oponibilidad erga omnes de la presente hipoteca (Principio de Publicidad Registral, art. 32 LH), deberá procederse a su inscripción en el Registro de la Propiedad correspondiente. Hasta dicha inscripción, la hipoteca solo producirá efectos inter partes.",
    ],
    "CESION_CREDITO": [
        "El Cedente cede y transfiere al Cesionario, de forma irrevocable, los siguientes créditos futuros: (i) las rentas que pague la sociedad arrendataria por el arrendamiento de la edificación hotelera objeto del contrato principal; y (ii) las devoluciones del IVA que se vayan generando durante la ejecución de las obras de edificación.",
        "La presente cesión de crédito se realiza de conformidad con los arts. 1.526 a 1.536 del Código Civil. Para su oponibilidad frente al deudor cedido y terceros, el Cedente notificará fehacientemente la cesión al deudor cedido, de conformidad con el art. 1.527 CC.",
        "El Cedente garantiza al Cesionario la existencia y legitimidad de los créditos cedidos en el momento de la cesión, respondiendo de su existencia pero no de la solvencia del deudor cedido, salvo pacto expreso en contrario.",
        "En caso de extinción del Contrato de Arrendamiento de Cosa Futura (fenómeno principal), la presente cesión de crédito quedará sin efecto respecto de las rentas futuras aún no devengadas, manteniendo su eficacia respecto de los créditos ya devengados y no cobrados.",
    ],
    "NDA": [
        "Ambas partes se comprometen a mantener en estricta confidencialidad toda la información que les sea revelada en el marco de sus relaciones contractuales, de conformidad con lo establecido en el artículo 1258 del Código Civil español.",
        "A los efectos del presente Acuerdo, se considera información confidencial cualquier dato, documento o conocimiento de naturaleza técnica, comercial, financiera o de cualquier otra índole que no sea de dominio público.",
        "La obligación de confidencialidad tendrá una duración de cinco (5) años a partir de la firma del presente acuerdo, independientemente de la vigencia del contrato principal.",
        "El incumplimiento de las obligaciones derivadas del presente acuerdo facultará a la parte perjudicada para reclamar los daños y perjuicios correspondientes, conforme a lo dispuesto en la Ley de Competencia Desleal (Ley 3/1991, de 10 de enero).",
    ],
    "SLA": [
        "El proveedor garantiza una disponibilidad mínima del servicio del 99,5% mensual, calculada durante el horario laboral acordado en el contrato marco.",
        "Los incidentes se clasificarán por nivel de criticidad: Crítico (resolución en 4 horas hábiles), Alto (8 horas), Medio (24 horas) y Bajo (72 horas hábiles).",
        "El incumplimiento reiterado de los niveles de servicio acordados generará penalizaciones económicas equivalentes al 5% del importe mensual facturado por cada punto porcentual de caída en la disponibilidad.",
        "El proveedor emitirá informes mensuales de cumplimiento de los niveles de servicio, de conformidad con los estándares acordados en el presente acuerdo.",
    ],
    "PAYMENT": [
        "El pago se realizará en un plazo máximo de 30 días naturales desde la emisión de la factura, conforme a lo establecido en la Ley 3/2004, de 29 de diciembre, de medidas de lucha contra la morosidad en las operaciones comerciales.",
        "Las facturas deberán cumplir los requisitos del Reglamento de Facturación (Real Decreto 1619/2012) e incluirán el IVA aplicable conforme a la Ley 37/1992, de 28 de diciembre, del Impuesto sobre el Valor Añadido.",
        "El retraso en el pago devengará automáticamente intereses de demora calculados al tipo de interés legal del dinero incrementado en ocho (8) puntos porcentuales, de conformidad con el artículo 7 de la Ley 3/2004.",
        "Cualquier controversia sobre facturación será sometida al procedimiento de reclamación establecido en el contrato marco antes de acudir a la vía judicial.",
    ],
    "DPA": [
        "El encargado del tratamiento tratará los datos personales únicamente siguiendo las instrucciones documentadas del responsable, de conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre (LOPDGDD).",
        "Se aplicarán las medidas técnicas y organizativas apropiadas para garantizar un nivel de seguridad adecuado al riesgo, incluyendo el cifrado de datos y la seudonimización cuando proceda, conforme al artículo 32 del RGPD.",
        "El encargado notificará al responsable cualquier violación de seguridad que afecte a datos personales en un plazo máximo de 72 horas desde que tenga conocimiento, conforme al artículo 33 del RGPD.",
        "A la finalización del contrato, el encargado suprimirá o devolverá todos los datos personales tratados, destruyendo las copias existentes, salvo que la conservación sea exigida por la normativa aplicable.",
    ],
    "IP": [
        "El cedente transfiere al cesionario, con carácter exclusivo, todos los derechos de propiedad intelectual sobre las obras objeto del presente acuerdo, conforme al Real Decreto Legislativo 1/1996, de 12 de abril, por el que se aprueba el texto refundido de la Ley de Propiedad Intelectual.",
        "La cesión comprende los derechos de reproducción, distribución, comunicación pública y transformación en todas las modalidades de explotación conocidas o por conocer, sin limitación territorial.",
        "El cesionario reconocerá la autoría de las obras en toda reproducción o comunicación pública, salvo acuerdo expreso en contrario.",
        "En caso de infracción por terceros, ambas partes cooperarán en la defensa de los derechos cedidos, comprometiéndose el cesionario a notificar inmediatamente al cedente cualquier acto infractor del que tenga conocimiento.",
    ],
}

_DEFAULT_CLAUSES = [
    "Las partes acuerdan las condiciones establecidas en el presente contrato conforme al Código Civil español y la legislación aplicable.",
    "Cualquier controversia derivada del presente contrato se someterá a los Juzgados y Tribunales competentes de la jurisdicción acordada.",
]

CONTRACT_GENERATION_SYSTEM = """
Eres el motor de inteligencia contractual PHENOMENON, experto en derecho español y normativa europea aplicable en España.

Generas texto de cláusulas contractuales legalmente precisas y ejecutables bajo la legislación española vigente.

REGLAS OBLIGATORIAS:
- Responde SIEMPRE íntegramente en español
- Responde SOLO en JSON válido, sin markdown ni texto adicional
- Estructura exacta: { "clauses": ["cláusula 1", "cláusula 2", "cláusula 3", "cláusula 4"], "ia_instances": ["ad-actio"], "special_terms": "..." }

Las cláusulas deben:
- Cumplir el Código Civil Español (Real Decreto de 24 de julio de 1889) y legislación sectorial aplicable
- Referenciar expresamente la normativa española relevante (RGPD, LOPDGDD, Ley 3/2004, LPI, etc.)
- Usar terminología jurídica española precisa y correcta
- Ser ejecutables ante los Juzgados y Tribunales españoles
- Redactarse en un registro formal jurídico, en tercera persona
""".strip()


def contract_generation_user(contract_type: str, master_summary: str, ess: dict) -> str:
    return (
        f"Tipo de Contrato: {contract_type}\n"
        f"Contrato Marco (resumen): {master_summary}\n"
        f"Datos de Identidad Estable (ESS):\n"
        f"  Parte A: {ess.get('partyA', 'no especificada')}\n"
        f"  Parte B: {ess.get('partyB', 'no especificada')}\n"
        f"  Jurisdicción: {ess.get('jurisdiction', 'España')}\n"
        f"  Fecha de inicio: {ess.get('effectiveDate', 'no especificada')}\n"
        f"  Fecha de vencimiento: {ess.get('expiryDate', 'no especificada')}\n\n"
        f"Genera 4-6 cláusulas precisas bajo derecho español para este {contract_type}.\n"
        f"Incluye referencias a la normativa española aplicable. Redacta en español formal jurídico."
    )


def cascade_analysis_user(
    field: str,
    old_value: str,
    new_value: str,
    affected_types: list[str],
) -> str:
    types_str = ", ".join(affected_types)
    field_labels = {
        "partyA": "Parte A", "partyB": "Parte B",
        "jurisdiction": "Jurisdicción", "effectiveDate": "Fecha de inicio",
        "expiryDate": "Fecha de vencimiento", "governingLaw": "Ley aplicable",
    }
    field_label = field_labels.get(field, field)
    return (
        f'El Contrato Marco ha modificado su campo "{field_label}" de "{old_value}" a "{new_value}".\n'
        f"Los subcontratos afectados son: {types_str}.\n\n"
        f"En 4-5 puntos clave, explica bajo derecho español:\n"
        f"1. Qué actualizaciones legales son necesarias en cada subcontrato afectado\n"
        f"2. Qué cláusulas específicas deben revisarse o redactarse de nuevo\n"
        f"3. Qué riesgos de cumplimiento introduce este cambio\n"
        f"4. Acciones concretas recomendadas para subsanar los contratos afectados\n\n"
        f"Sé específico, práctico y ajustado a legislación española. Comienza cada punto con '•'."
    )
