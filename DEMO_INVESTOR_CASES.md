# PHENOMENON — Investor Demo Preparation
## Three Real Cases. One Engine. What No Other Application Can Do.

> **For agents running tests:** Go directly to Section 4 (Pre-Demo Test Checklists).
> **For the investor presentation:** Follow the demo scripts in Section 3.
> **System must be running:** `docker compose up -d` from `phenomenon/` before anything.

---

## Section 1: Honest Analysis — What Makes PHENOMENON Unique

### The Fundamental Difference

Every other legal technology system on the market — DocuSign, Ironclad, ContractPodAi, Juro, Luminance, Harvey — is built on one of three models:

| System Type | What it does | What it cannot do |
|---|---|---|
| **Document manager** (DocuSign, Adobe) | Signs and stores documents | Zero legal intelligence. Cannot detect inconsistencies. Cannot cascade. |
| **CLM (Contract Lifecycle)** (Ironclad, Juro) | Templates, approval workflows | Single-contract context. Cannot model CA2. Cannot cross-validate. |
| **AI reviewer** (Luminance, Harvey) | Reviews existing documents | Cannot structure new phenomena. No homologation. No engine. |
| **Domain software** (insurance CRM, real estate ERP) | Specific to one legal domain | Cannot apply the same engine to another domain. |

**PHENOMENON is none of these.** It is an ontological engine — it models legal reality structurally, at the level of the phenomenon itself, not the document that represents it.

### The Three Unique Capabilities

**1. Circumcontrato CA2 — Legal Distinction No Software Captures**

The KPMG case involves a €100M financial structure. Every bank system, every ERP, every CLM tool would call it a "loan" or "mortgage." They would be legally wrong. Under Spanish law (CC Art. 1544 vs. Art. 1740), this structure is an *arrendamiento de servicios financieros* — a service, not a loan. The difference has:
- Tax consequences (IVA vs. Actos Jurídicos Documentados)
- Insolvency consequences (concursal treatment differs)
- Regulatory consequences (LCCI does not apply)

PHENOMENON captures this through its CA2 (Circumacción Nivel 2) engine layer. No other system makes this legal ontological distinction. They would generate the wrong document.

**2. IF Cascade — The Entire Network Reacts to One Change**

When EURIBOR changes from 3.5% to 5.5%:
- No other system propagates this through a contract network automatically
- PHENOMENON triggers IF connections (inter-phenomenic links): master → FINANCIACION → HIPOTECA_GARANTIA → CESION_CREDITO — all recomputed, all flagged, all risk-assessed in under 2 seconds

When a NDA's confidentiality period is shorter than the DPA's data retention period:
- No other system detects this as a legal inconsistency
- PHENOMENON's ecosystem engine checks 6 cross-contract rules automatically

**3. Same Engine, Completely Different Domains**

PHENOMENON runs the same backend engine on:
- Insurance (Vida, RC, Daños, Crédito)
- Real estate (Compraventa, Hipoteca, Cesión)
- Corporate (Compliance, Audit, Regulatory)
- Arbitration (future)

This is architectural proof that PHENOMENON is universal. A CLM tool built for insurance cannot handle real estate. PHENOMENON handles both with the same engine, different modulaciones.

---

### Competitive Positioning Summary

```
"Our competitors store contracts. We model legal reality.
 Our competitors manage workflows. We propagate legal consequences.
 Our competitors review documents. We validate ecosystems.
 Our competitors work in one domain. We work in any domain."
```

---

## Section 2: Case-by-Case Engine Analysis

---

### CASE 1: Compraventa de Terreno

**What it demonstrates:** Spanish property law sophistication. The traditio vs. escritura distinction. Ser/Bien/Cosa ontology. Registro as diffusion, not legitimacy. Typed IF connections.

**The legal problem no other system handles:**

A buyer pays 1/5 of the price at signing and 4/5 when the land gets urban classification. The seller is obligated to pursue the classification but does NOT guarantee it. Two-year time limit.

Other systems would model this as: "payment in installments with a condition." Wrong. PHENOMENON models:
- `IF_temporal` — the 2-year deadline (time vector, IST·Tiempo)
- `IF_logica` — the urban classification (logical activation condition)
- `IF_oposicion` — non-payment blocking (opposition vector)
- `CONDICION_SOLAR` as a **prosecución lógica del fenómeno**, NOT a guaranteed delivery
- Seller's urban quota payment as **prestación accesoria**, not a core obligation
- Escritura pública as `tradicionType: "instrumental"` (Art. 1462 CC) ≠ real traditio

**The investor punchline:**
> "If your lawyer generates a document where the seller 'guarantees' the solar classification, your contract is legally wrong. PHENOMENON detects that automatically. It flags it as a MEDIUM risk with the specific legal basis (Art. 1123 CC) and the recommendation to correct it."

---

### CASE 2: KPMG Hotel Mediterráneo Valencia 5*

**What it demonstrates:** Complex multi-contract financial structure. The circumcontrato CA2. Live financial cascade. Oponibilidad levels. Real-world €100M structure.

**The legal problem no other system handles:**

The financial structure has 4 interconnected contracts:
1. Arrendamiento de Cosa Futura (master — the hotel lease before the building exists)
2. Circumcontrato de Financiación CA2 (€100M — NOT a loan, a service)
3. Hipoteca sobre edificación futura (guarantee)
4. Cesión de crédito (hotel rents + IVA refunds assigned to the bank)

The KPMG structure is:
- CA2 circumaction means it operates AT A DIFFERENT LEVEL than the master contract. It wraps it structurally. No workflow tool models this.
- If EURIBOR changes, the monthly payment changes, the cesión coverage ratio changes, the risk exposure changes — across all 4 contracts simultaneously, with legal analysis.
- The hipoteca being on a "futura edificación" (Art. 110 LH) means it doesn't exist yet. It cannot be OPONIBLE until registered. PHENOMENON tracks this as PARTIAL opus until registration.

**The investor punchline:**
> "Change the EURIBOR from 3.5% to 5.5% and watch: 3 contracts immediately turn orange, the monthly payment recalculates from €687k to €765k, the engine detects that the cesión coverage drops but is still adequate, and shows you exactly which legal clause in which contract needs updating. In real time. Automatically."

---

### CASE 3: Caso Seguros — 4 Types Simultaneously

**What it demonstrates:** Engine combinatoria. The same deep structure handles 4 completely different insurance types. Blocking exclusions. Phase transitions (siniestro). Universal backend.

**The legal problem no other system handles:**

Four insurance policies — Vida, RC, Daños, Crédito — appear to be completely different products. But PHENOMENON shows they share:
- Same A1 structure: "Cobertura estructural condicionada"
- Same CA types: prima, validación, activación, siniestro, pago
- Same IF types: lógica (si no validación → no cobertura), exclusión (daño intencional → BLOCKED), temporal (plazo de validez)
- Different modulaciones: the risk vector, the validation requirements, the coverage trigger

The BLOCKED status is unique:
- `COBERTURA_CREDITO` cannot activate until `VALIDACION_FINANCIERA` = VALID
- This is not a workflow approval. It is a **legal blocking condition** (IF_exclusion, Bloque II §4: non operator = positional exclusion threshold)
- No CLM, no CRM, no insurance software models this at the engine level

**The investor punchline:**
> "Every insurance software in the world is built for one type of insurance. We show four completely different insurance types running on the same engine simultaneously. When you trigger a siniestro on the life insurance, it transitions from ACTIVE → SINIESTRO_PENDIENTE → INDEMNIZACION_PAGADA — and the engine automatically checks whether the medical validation that was required is still consistent with the claim. Other software would show you a form. PHENOMENON shows you the legal consequence."

---

## Section 3: Live Demo Scripts

---

### DEMO SCRIPT 1: Compraventa de Terreno (8 minutes)

**Setup before demo:** Open browser at `http://localhost:5173`. Have the COMPRAVENTA_TERRENO template ready to create.

---

**[Minute 0-1] The Setup**

**SAY:** "I'm going to show you how PHENOMENON handles a real Spanish property transaction — a land purchase where the payment is conditional on the land getting urban classification. This is a standard transaction in Valencia and Andalucía. Every notary sees dozens of these."

**DO:** Click "+ Nuevo Proyecto" → Select "Compraventa de Terreno" template

**THEY SEE:** The template loads with ESS fields (Vendedor, Comprador, Valencia jurisdiction, dates)

**POINT OUT:** "Notice the graph already shows the contract ecosystem: master + PAGO_APLAZADO + CARGAS_URBANISTICAS — three connected documents that PHENOMENON treats as a single unit."

---

**[Minute 1-3] The Distinctión That Matters**

**SAY:** "Let me show you something no other system handles. I'm going to fill in the fields."

**DO:** Fill in:
- Vendedor: Promotora Valenciana del Suelo S.L.
- Comprador: Inmobiliaria Costa Este S.A.
- Jurisdicción: Valencia
- Dates: today + 2 years

**DO:** In contractFields, find `urbanisticConditionType` → select "Condición suspensiva (Art. 1123 CC) — NO es garantía del vendedor"

**SAY:** "This is the distinction that makes or breaks this contract legally. The urban classification is a CONDITION in the progression of the phenomenon — not something the seller guarantees. If your lawyer gets this wrong, the seller can be sued for non-delivery."

**THEY SEE:** After selecting, the risk engine immediately shows a GREEN indicator — the correct option is selected

**DO:** Change it to the wrong option: "Obligación garantizada del vendedor"

**THEY SEE:** Immediately, a MEDIUM risk appears: "Condición urbanística marcada como obligación garantizada — riesgo jurídico (Art. 1123 CC)"

**POINT OUT:** "The engine caught the legal error in real time. No lawyer needed at this stage. This is PHENOMENON detecting legal ontological mistakes automatically."

---

**[Minute 3-5] The Typed IF Connections**

**SAY:** "Now watch what happens when I look at the IF connections between these contracts."

**DO:** Click on the edge between the master contract and PAGO_APLAZADO in the graph

**THEY SEE:** The EdgePanel slides up showing: IF_temporal (2-year deadline), IF_logica (solar condition), IF_oposicion (non-payment)

**SAY:** "These aren't just arrows. Each connection has a type — temporal, logical, opposition. When the temporal deadline passes, PHENOMENON automatically flags all three contracts as NEEDS_REVIEW. When the logical condition is met, it triggers the deferred payment activation. This is the inter-phenomenic structure that no document management tool can model."

---

**[Minute 5-7] Registro as Diffusion**

**DO:** Click ⊙ Verificar todos → run homologation

**THEY SEE:** Each contract shows its validation status. The master gets a check for "Traditio instrumental (escritura) ≠ Traditio real"

**SAY:** "This is another distinction that matters. The escritura pública is NOT real traditio under Art. 1462 CC. Other systems generate a deed and consider the transaction complete. PHENOMENON distinguishes between the document of diffusion — the Registro — and the real legal act of transfer. A buyer could have a signed escritura and a registered deed and still not have real possession. Our engine knows this."

---

**[Minute 7-8] The Close**

**SAY:** "In 8 minutes, PHENOMENON structured a real Spanish property transaction, detected two legal errors automatically, modeled three different types of IF connections, and distinguished between registro diffusion and real traditio. Any other system would have given you a Word template. We gave you legal intelligence."

---

### DEMO SCRIPT 2: KPMG Hotel Mediterráneo (12 minutes)

**Setup before demo:** Click "⭐ Demo KPMG" on the SelectionScreen. Wait for seeder to load (3-5 seconds). All 4 contracts should be VALID and green.

---

**[Minute 0-2] The Structure**

**SAY:** "This is a real financing structure from Valencia. A 5-star hotel being financed with €100 million. KPMG-style. Four contracts, all legally interconnected."

**THEY SEE:** Graph with:
- Master: "Arrendamiento de Cosa Futura — Hotel Mediterráneo Valencia 5*"
- FINANCIACION: "Circumcontrato CA2 — €100M"
- HIPOTECA_GARANTIA: "Hipoteca sobre Solar y Edificación Futura"
- CESION_CREDITO: "Cesión de Crédito — Rentas €1.06M/mes + IVA"
- Gold particles flowing from master → FINANCIACION (money disbursed)
- Cyan particles flowing CESION_CREDITO → master (rent returning)

**SAY:** "Notice the animated particles. Gold: €100 million flowing from the bank to the developer. Cyan: €1,064,583 per month in hotel rents flowing back. This is the cash flow of the entire operation, modeled structurally in real time."

**POINT OUT:** "Click the edge between the master and the FINANCIACION contract."

**DO:** Click the master→FINANCIACION edge

**THEY SEE:** EdgePanel showing IF rules: "CA2 — si el arrendamiento de cosa futura (F1) queda sin efecto, este circumcontrato también queda sin efecto"

**SAY:** "This is the circumcontrato CA2. This financial structure is NOT a loan. Not a mortgage. It's an arrendamiento de servicios financieros — an entirely different legal structure under Art. 1544 CC. The tax treatment is different. The insolvency treatment is different. Every bank software, every ERP in the world would classify this as a mortgage. PHENOMENON knows it isn't."

---

**[Minute 2-5] Live Financial Cascade**

**DO:** Click "⭐ Demo KPMG" tab in right panel → Financiero section

**THEY SEE:** EURIBOR slider at 3.50%, Spread 2.00%, total rate 5.50%, monthly payment ~€687,000

**SAY:** "Let me show you what happens in the real world when the ECB raises interest rates."

**DO:** Slowly drag EURIBOR slider from 3.50% → 5.50%

**THEY SEE:**
- Monthly payment updates live: €687k → €765k → real-time calculation
- After 1.2 seconds: 3 contract nodes in the graph flash orange (NEEDS_REVIEW)
- Coverage ratio updates: "Cobertura cesión: 139% → 126%"

**SAY:** "Three things happened simultaneously: the monthly payment recalculated using the French amortization system. Three contracts were automatically flagged for review because the interest rate affects their legal terms. And the coverage ratio — how well the hotel rents cover the monthly payment — updated instantly. This is one change cascading through a legal network in real time."

---

**[Minute 5-7] Crisis Demonstration**

**DO:** Click "📉 Crisis EURIBOR (+2%)" button

**THEY SEE:**
- EURIBOR jumps to 7.50%
- Monthly payment: ~€850k/month
- Coverage ratio: ~125% — still above 100% but with a risk warning
- Risk panel shows HIGH risk: "Tipo total CRÍTICO: 7.50%"

**SAY:** "This is the 2022-2023 rate crisis scenario. The engine immediately shows: the operation is still viable — the hotel rents cover the payment — but the margin has shrunk. It also shows you exactly which legal clause needs updating and what the legal recommendation is. No other system gives you this level of analysis automatically."

---

**[Minute 7-10] Registering the Hipoteca**

**DO:** Click "⊙ Inscribir Hipoteca en Registro" button

**THEY SEE:**
- HIPOTECA_GARANTIA node transitions: badge changes from "PARCIAL" to "OPONIBLE"
- Ecosystem health score increases

**SAY:** "Before registration, the mortgage was only binding between the parties — inter partes. The moment it's registered in the Registro de la Propiedad, it becomes oponible erga omnes — binding against the entire world, including future creditors, future buyers, the insolvency estate. PHENOMENON tracks this transition automatically. Your lawyer doesn't have to tell the system. The system tells your lawyer."

---

**[Minute 10-12] Ecosystem Homologation**

**DO:** Click 🌐 Ecosistema tab → "⊙ Homologar Ecosistema Completo"

**THEY SEE:** Progress bar running through all 4 contracts → health score shows → consistency checks appear

**SAY:** "In one click, PHENOMENON has verified: all 4 contracts against Spanish law, the IF connections between them, the coverage ratios, the registration status, the party identifications. It found [X] consistency issues and gives you the exact legal reference for each. A traditional due diligence would take a team of lawyers 3 days. PHENOMENON does it in 8 seconds."

---

### DEMO SCRIPT 3: Caso Seguros (12 minutes)

**Setup before demo:** Click "🛡️ Demo Seguros" on SelectionScreen. Wait for seeder (16 contracts created).

---

**[Minute 0-2] The Combinatoria Principle**

**SAY:** "I'm going to show you something that is impossible in any other insurance software in the world. Four completely different insurance products — life insurance, liability, property damage, credit insurance — running on the same engine at the same time."

**DO:** Click "🛡️ Seguros" tab in right panel

**THEY SEE:** 4-column comparative view:

```
SEGURO VIDA    | SEGURO RC     | SEGURO DAÑOS  | SEGURO CRÉDITO
──────────────────────────────────────────────────────────────
⬡ ACTIVE       | ⬡ ACTIVE      | ⬡ ACTIVE      | ⬡ WAITING
COBERTURA ✅   | COBERTURA ✅  | COBERTURA ✅  | COBERTURA ⛔
EXCLUSIONES ✅ | LIMITES ✅    | PERITACION ✅ | VALIDACION ⚠️
PRIMA ✅       | FRANQUICIA ✅ | EXCLUSIONES ✅| RIESGO ✅
```

**POINT OUT:** "The credit insurance column shows WAITING — a special status that means it cannot activate until something else happens. We'll come back to that."

**SAY:** "Look at the header row: every policy has the same deep structure — A1 (central action), SA (modulating agreement), CA (circumactions converging on A1), IF (inter-phenomenic conditions), Opus. Same engine. Four different legal domains. This is what PHENOMENON calls combinatoria."

---

**[Minute 2-5] Blocking Exclusion**

**DO:** Click on the "⛔ BLOCKED" indicator in the Seguro Crédito column

**THEY SEE:** Panel explaining: "COBERTURA_CREDITO: BLOCKED — IF_exclusion activo. La VALIDACION_FINANCIERA del asegurado no ha alcanzado el umbral requerido. Fundamento: Bloque II §4 — non operator = umbral de exclusión posicional."

**SAY:** "This is a blocking exclusion — a concept from the theoretical PHENOMENON framework. The credit insurance coverage CANNOT activate until the financial validation of the insured passes its threshold. This is not a workflow approval. This is a structural legal condition modeled at the engine level. It physically prevents the coverage from activating."

**DO:** Click "Desbloquear Cobertura" button

**THEY SEE:** COBERTURA_CREDITO transitions from BLOCKED → ACTIVE. The graph flashes. The column updates.

**SAY:** "The financial validation threshold has been met. The engine removed the blocking condition. The coverage is now active. In a real insurance system, this would happen after the underwriter reviews the credit report. PHENOMENON models the legal reason why — not just the workflow step."

---

**[Minute 5-8] The Siniestro Phase Transition**

**SAY:** "Now let's model a real claim on the life insurance."

**DO:** Click "🚨 Declarar Siniestro" in the SEGURO VIDA column

**THEY SEE:**
- SEGURO_VIDA master transitions: ACTIVE → SINIESTRO_PENDIENTE (orange)
- COBERTURA_VIDA sub-contract: ACTIVE → SINIESTRO_PENDIENTE
- Graph node changes color and shows new phase label
- A cascade fires: checking whether medical validation is still consistent with the claim

**SAY:** "The engine detected that a life insurance siniestro requires cross-checking the medical validation that was done at policy inception. If the medical history shows a pre-existing condition that was not declared, the coverage can be challenged. PHENOMENON flags this automatically."

**DO:** Click "✅ Indemnización Aprobada" 

**THEY SEE:** COBERTURA_VIDA transitions: SINIESTRO_PENDIENTE → INDEMNIZACION_PAGADA

**POINT OUT:** "Notice that SEGURO_RC, SEGURO_DANOS, and SEGURO_CREDITO are completely unaffected. Each insurance ecosystem is independent. But they all run on the same PHENOMENON engine."

---

**[Minute 8-10] The Shared Structure**

**SAY:** "Let me show you the most powerful demonstration of PHENOMENON's universality."

**DO:** In any insurance contract's Campos tab, change the jurisdiction field

**THEY SEE:** All 3 remaining insurance masters flash orange simultaneously — cascade fired across all 4 insurance ecosystems because they share the same party relationships

**SAY:** "When I change the jurisdiction on the life insurance, the engine recognizes that the liability insurance and the property insurance for the same parties also need to be reviewed. The IF connections between the insurance policies and the underlying party relationships cascade automatically."

---

**[Minute 10-12] Ecosystem Homologation Across All 4**

**SAY:** "Final demonstration. One-click verification of all 16 contracts simultaneously."

**DO:** Click any insurance master → 🌐 Ecosistema → "⊙ Homologar Ecosistema Completo"

**THEY SEE:** All 16 contracts verified in sequence. Cross-contract consistency checks across all 4 insurance types. Health score. Coverage gaps.

**SAY:** "16 insurance contracts. 6 types of cross-contract consistency checks. Validated against Spanish insurance law, RGPD, and the PHENOMENON engine simultaneously. In under 15 seconds. This is what PHENOMENON can do that no insurance software in the world currently does."

---

## Section 4: Pre-Demo Test Checklists

**Run these before every demo. Fix any failures before showing to investors.**

---

### TEST CHECKLIST A: System Health

```bash
# 1. Verify all containers running
docker compose ps

# Expected: db, backend, frontend all showing "Up"

# 2. Check backend is healthy
curl http://localhost:8000/health

# Expected: {"status":"ok","engine":"phenomenon-engine@0.2.0",...}

# 3. Check frontend is loading
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173

# Expected: 200
```

**PASS criteria:** All 3 commands return expected output.

---

### TEST CHECKLIST B: Compraventa Terreno

```bash
# 1. Verify COMPRAVENTA_TERRENO template exists (check via frontend constants)
# Open http://localhost:5173 → SelectionScreen should show "Compraventa de Terreno" card

# 2. Create project via API
curl -s -X POST http://localhost:8000/phenomena/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Compraventa","type":"MASTER","parentId":null,
       "ess":{"partyA":"Vendedor Test S.L.","partyB":"Comprador Test S.A.",
              "jurisdiction":"Valencia","effectiveDate":"2024-01-01",
              "expiryDate":"2026-01-01"},
       "ag":{"clauses":["Cláusula de prueba"],"terms":{"templateKey":"COMPRAVENTA_TERRENO",
             "totalPrice":"500000","priceAtSigning":"100000","deferredPrice":"400000",
             "paymentDeadlineDays":"730","urbanisticConditionType":"Condición suspensiva (Art. 1123 CC) — NO es garantía del vendedor"}},
       "ia_instances":["ad-actio","co-implication"]}' | python3 -m json.tool

# Expected: JSON with id, status:"ACTIVE", opus:{homologation:"PENDING"}

# 3. Store the master ID for next steps
MASTER_ID=$(curl -s http://localhost:8000/phenomena/ | python3 -c "import sys,json; d=json.load(sys.stdin); print([x for x in d if x['type']=='MASTER'][0]['id'])")

# 4. Run homologation
curl -s -X POST http://localhost:8000/phenomena/$MASTER_ID/homologate | python3 -m json.tool

# Expected: valid:true OR valid:false with specific error list (not a 500)

# 5. Check risk rules fire correctly
# (Manual browser test) — open the project, fill urbanisticConditionType with wrong value
# → Risk engine should show MEDIUM risk about Art. 1123 CC

# 6. Cleanup
curl -s -X DELETE http://localhost:8000/phenomena/$MASTER_ID
```

**PASS criteria:**
- [ ] Step 2 returns 201 with contract data (no 500 error)
- [ ] Step 4 returns homologation result (valid or invalid with reason, not exception)
- [ ] No 500 errors in `docker compose logs backend --tail=20`

---

### TEST CHECKLIST C: KPMG Demo

```bash
# 1. Seed the KPMG demo
curl -s -X POST http://localhost:8000/demo/kpmg/seed | python3 -m json.tool

# Expected: {"seeded":true,"master_id":"...","sub_ids":{...},"summary":{...}}

# 2. Store master ID
KPMG_MASTER=$(curl -s -X POST http://localhost:8000/demo/kpmg/seed | python3 -c "import sys,json; print(json.load(sys.stdin)['master_id'])")

# 3. Verify 4 contracts exist
curl -s http://localhost:8000/phenomena/ | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} contracts: {[x[\"type\"] for x in d]}')"

# Expected: 4 contracts: ['MASTER', 'FINANCIACION', 'HIPOTECA_GARANTIA', 'CESION_CREDITO']

# 4. Verify all start as VALID
curl -s http://localhost:8000/phenomena/ | python3 -c "import sys,json; d=json.load(sys.stdin); print({x['type']:x['opus']['homologation'] for x in d})"

# Expected: all VALID

# 5. Test EURIBOR cascade
curl -s -X POST http://localhost:8000/demo/kpmg/update-euribor \
  -H "Content-Type: application/json" \
  -d "{\"master_id\":\"$KPMG_MASTER\",\"new_euribor\":5.5,\"new_spread\":2.0,\"new_term_years\":20}" | python3 -m json.tool

# Expected: {"updated":true,"new_euribor":5.5,"new_monthly_pmt":765XXX.XX,"affected_ids":[...]}

# 6. Verify cascade: contracts should now be NEEDS_REVIEW
curl -s http://localhost:8000/phenomena/ | python3 -c "import sys,json; d=json.load(sys.stdin); print({x['type']:x['status'] for x in d})"

# Expected: FINANCIACION, HIPOTECA_GARANTIA, CESION_CREDITO → NEEDS_REVIEW

# 7. Test amortization calculator
curl -s "http://localhost:8000/demo/amortization?principal=100000000&euribor=3.5&spread=2.0&term_years=20&months=12" | python3 -m json.tool

# Expected: monthly_payment ~687000, schedule with 12 rows

# 8. Test ecosystem state
curl -s http://localhost:8000/ecosystem/$KPMG_MASTER | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Health: {d[\"health_score\"]}, Valid: {d[\"ecosystem_valid\"]}, Parties: {len(d[\"parties\"])}')"

# Expected: Health: 0-100 number, parties count ≥ 2

# 9. Test ecosystem homologation
curl -s -X POST http://localhost:8000/ecosystem/$KPMG_MASTER/homologate | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Valid:{d[\"ecosystem_valid\"]}, Score:{d[\"health_score\"]}, Individual:{len(d[\"individual_results\"])} contracts')"

# Expected: 4 individual results, no 500

# 10. Browser test: load the KPMG demo
echo "BROWSER TEST: Open http://localhost:5173 → Click 'Demo KPMG' → Verify 4 nodes appear with particles"
echo "BROWSER TEST: Move EURIBOR slider → Verify nodes flash orange"
echo "BROWSER TEST: Click ⊙ Inscribir Hipoteca → Verify HIPOTECA badge changes to OPONIBLE"
```

**PASS criteria:**
- [ ] Step 1: seeder returns 200 with all 4 contract IDs
- [ ] Step 3: exactly 4 contracts listed
- [ ] Step 4: all VALID homologation
- [ ] Step 5: returns updated monthly payment (not 500)
- [ ] Step 6: FINANCIACION/HIPOTECA_GARANTIA/CESION_CREDITO status = NEEDS_REVIEW
- [ ] Step 7: amortization table with 12 rows returned
- [ ] Step 8: ecosystem state returns valid JSON
- [ ] Step 9: 4 individual results returned
- [ ] No 500 errors in `docker compose logs backend --tail=20`

---

### TEST CHECKLIST D: Caso Seguros

```bash
# 1. Seed all 4 insurance types simultaneously
curl -s -X POST http://localhost:8000/demo/seguros/seed | python3 -m json.tool

# Expected: {"seeded":true,"masters":["SEGURO_VIDA","SEGURO_RC","SEGURO_DANOS","SEGURO_CREDITO_COMERCIAL"],"total_contracts":16,...}

# 2. Verify 16 contracts
curl -s http://localhost:8000/phenomena/ | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} contracts'); types={}; [types.update({x[\"type\"]:types.get(x[\"type\"],0)+1}) for x in d]; print(types)"

# Expected: 16 contracts with types breakdown

# 3. Verify COBERTURA_CREDITO is BLOCKED
curl -s http://localhost:8000/phenomena/ | python3 -c "import sys,json; d=json.load(sys.stdin); blocked=[x for x in d if x.get('status')=='BLOCKED']; print(f'BLOCKED contracts: {[x[\"type\"] for x in blocked]}')"

# Expected: ['COBERTURA_CREDITO'] (or similar blocked coverage type)

# 4. Store IDs for further tests
VIDA_MASTER=$(curl -s http://localhost:8000/phenomena/ | python3 -c "import sys,json; d=json.load(sys.stdin); vida=[x for x in d if x['type']=='MASTER' and 'vida' in x['name'].lower()]; print(vida[0]['id'] if vida else 'NOT_FOUND')")

# 5. Test siniestro transition
COBERTURA_VIDA=$(curl -s http://localhost:8000/phenomena/ | python3 -c "import sys,json; d=json.load(sys.stdin); cv=[x for x in d if x['type']=='COBERTURA_VIDA']; print(cv[0]['id'] if cv else 'NOT_FOUND')")

curl -s -X POST http://localhost:8000/demo/seguros/siniestro \
  -H "Content-Type: application/json" \
  -d "{\"contract_id\":\"$COBERTURA_VIDA\",\"resolution\":\"SINIESTRO_PENDIENTE\"}" | python3 -m json.tool

# Expected: {"updated":true,"new_status":"SINIESTRO_PENDIENTE",...}

# 6. Test unblock coverage
COBERTURA_CREDITO=$(curl -s http://localhost:8000/phenomena/ | python3 -c "import sys,json; d=json.load(sys.stdin); cc=[x for x in d if x['type']=='COBERTURA_CREDITO']; print(cc[0]['id'] if cc else 'NOT_FOUND')")

curl -s -X POST http://localhost:8000/demo/seguros/unblock-coverage \
  -H "Content-Type: application/json" \
  -d "{\"contract_id\":\"$COBERTURA_CREDITO\"}" | python3 -m json.tool

# Expected: {"unblocked":true,"new_status":"ACTIVE",...}

# 7. Verify unblock worked
curl -s http://localhost:8000/phenomena/$COBERTURA_CREDITO | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Status: {d[\"status\"]}')"

# Expected: Status: ACTIVE

# 8. Browser test checklist
echo "BROWSER TEST: Open http://localhost:5173 → Click 'Demo Seguros'"
echo "BROWSER TEST: 🛡️ Seguros tab visible → 4-column comparative view loads"
echo "BROWSER TEST: Seguro Crédito column shows ⛔ BLOCKED indicator"
echo "BROWSER TEST: Click 'Desbloquear' → credit coverage becomes ACTIVE"
echo "BROWSER TEST: Click 'Declarar Siniestro' on Vida → phase transition visible"
```

**PASS criteria:**
- [ ] Step 1: returns 16 total contracts
- [ ] Step 3: COBERTURA_CREDITO (or similar) shows BLOCKED status
- [ ] Step 5: siniestro endpoint returns new status (not 500)
- [ ] Step 6: unblock endpoint returns (not 500)
- [ ] Step 7: ACTIVE status after unblock
- [ ] No 500 errors in backend logs

---

### TEST CHECKLIST E: Cross-System Regression

**Run these to verify existing features haven't broken:**

```bash
# 1. Create a standard CSM project
curl -s -X POST http://localhost:8000/phenomena/ \
  -H "Content-Type: application/json" \
  -d '{"name":"CSM Regression Test","type":"MASTER","parentId":null,
       "ess":{"partyA":"Test A S.L.","partyB":"Test B S.A.","jurisdiction":"Madrid",
              "effectiveDate":"2024-01-01","expiryDate":"2025-01-01"},
       "ag":{"clauses":["Test clause"],"terms":{"templateKey":"CSM"}},
       "ia_instances":["ad-actio"]}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('MASTER_ID:', d['id'])"

# 2. Run cascade endpoint  
# (use the master ID from step 1)
# curl -X POST http://localhost:8000/cascade/trigger -d '{"master_id":"...","field":"jurisdiction","new_value":"Barcelona"}'

# 3. Check ecosystem endpoint works
# curl http://localhost:8000/ecosystem/{master_id}

# 4. Check homologation works
# curl -X POST http://localhost:8000/phenomena/{master_id}/homologate
```

**PASS criteria:**
- [ ] Standard CSM template still creates correctly
- [ ] Cascade still fires
- [ ] No regression in existing features

---

## Section 5: Demo Day Checklist

**The night before:**
- [ ] Run ALL test checklists (A through E)
- [ ] Restart Docker: `docker compose down && docker compose up -d`
- [ ] Run seeders fresh: POST /demo/kpmg/seed + POST /demo/seguros/seed
- [ ] Open browser at localhost:5173, verify all 3 demo cards are visible
- [ ] Test EURIBOR slider moves smoothly
- [ ] Test siniestro transition works
- [ ] Screenshot of working system as backup

**30 minutes before:**
- [ ] `docker compose ps` — all services Up
- [ ] Open http://localhost:5173 in a clean browser window (no previous state)
- [ ] Load KPMG demo fresh
- [ ] Load Seguros demo and verify 4-column view
- [ ] Have Compraventa Terreno ready to create from scratch (more impactful live)

**During demo:**
- [ ] Keep browser DevTools closed (audiences see console errors)
- [ ] Use zoom controls on the graph (scroll wheel) for better visibility
- [ ] Keep the Live Feed panel visible (shows cascade events happening in real time)

---

## Section 6: The Investor Pitch — Key Messages

### Opening (30 seconds)
> "Every legal technology company in the world has built better versions of the same thing: document storage, workflow automation, template generation. We built something different. We built an engine that models legal reality itself — not the documents that represent it."

### The Three Proofs (2 minutes each)
1. **Compraventa:** "We detect legal errors your lawyers might miss — automatically, in real time."
2. **KPMG:** "We handle financial structures that no other software can even represent, let alone validate."
3. **Seguros:** "We show four completely different legal domains running on the same engine simultaneously."

### The Closing Argument (1 minute)
> "PHENOMENON is not a better legaltech. It is a new category: a universal legal ontology engine. Our moat is not the code — it's the framework. The PHENOMENON theoretical structure is original and patentable. Building what we have would take any competitor 3-4 years of academic work before writing a single line of production code. We've already done both."

### The Revenue Model (if asked)
- Enterprise license (banks, insurance companies, law firms): €50k-200k/year
- API access for legal software companies: transaction-based
- White-label engine for governments/registries (Catastro, Registro de la Propiedad): custom

---

*Document prepared: 2026-05-20 | For technical questions: see SYSTEM_STATUS.md | For build status: see PROJECT_TRACKER.md*
