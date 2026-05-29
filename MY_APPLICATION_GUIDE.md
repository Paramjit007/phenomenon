# My Application — What It Does, How to Use It, How to Demonstrate It

## Written for: Param (the owner)
## Purpose: Understand your own application end-to-end + demonstrate to partners

---

# PART 1: What Is This Application and What Makes It Unique

## In simple terms

Your application is called **PHENOMENON Contract Intelligence System**.

Most legal software is one of these things:
- **A document creator** — you fill in a Word template, it produces a PDF
- **A signing tool** — like DocuSign, it sends documents for signatures
- **A storage system** — like SharePoint, it organizes contracts in folders
- **A workflow tool** — it moves documents from person A to person B for approval

**Your application is none of these.** It is something fundamentally different.

Your application **understands the legal structure underneath the contract** — not the document itself, but the reality the document is trying to describe. When something changes in one contract, the engine automatically understands what it means for every other connected contract and tells you instantly.

## The one sentence that explains it all

> "Other applications manage documents. PHENOMENON manages legal reality."

## Three things your application does that no other application does

**1. It understands how contracts connect to each other**

When you change the interest rate in a loan contract, your application automatically knows that:
- The monthly payment in the financial contract changes
- The guarantee (mortgage) needs to be reviewed
- The assigned rents (cesión de crédito) may no longer be sufficient
- Three different contracts need to be re-validated

No other application does this automatically. They would require a human to check each contract manually.

**2. It knows the legal difference between things that look the same**

Example from the KPMG case: €100 million is being transferred from a bank to a developer. Other applications would call this a "loan." Your application knows it is NOT a loan — it is a *circum-contract of financial services* (a completely different legal structure under Spanish law Art. 1544 CC). This distinction matters for taxes, for insolvency, for regulation. Your engine captures this distinction automatically.

**3. It validates the entire contract network in one click**

You can have 16 contracts across 4 different types of insurance, all connected. Click one button. The engine verifies all 16 contracts simultaneously, checks that they are consistent with each other (e.g., that an NDA's confidentiality period covers the time period required by the data protection agreement), and tells you exactly what needs fixing, with the legal reference.

---

# PART 2: The Screen Layout (What You See When You Open the App)

Open your browser and go to: **http://localhost:5173**

## The Selection Screen (Homepage)
When you first open the app, you see a dark screen with:
- At the top: **two featured demo cards** (KPMG Hotel and Insurance Case) — these are your pre-built demonstrations
- Below: a grid of contract templates you can create from scratch

## The Main Application Screen
Once you select or create a project, you see:

**LEFT SIDE — The Graph**
This is where you see your contracts as connected circles (nodes). Lines between them show how they are connected. This is the most visual and impressive part for demonstrations.

**RIGHT SIDE — The Panels (tabs)**
This is where you see and edit the details. The tabs are:
- ◈ **Campos** — the contract fields (where you fill in names, dates, amounts)
- 🌐 **Ecosistema** — health check of the entire contract network
- ⭐ **Demo KPMG** — special controls for the KPMG financial demonstration
- ⚠ **Riesgo** — risk analysis (automatic legal risk detection)
- ⊙ **Verificar** — homologation (full legal validation)
- ⇄ **Red IF** — the cascade control center
- ⬡ **Motor IA** — the legal operator assignment

**BOTTOM LEFT — Live Feed**
A log showing everything the engine is doing in real time — every cascade, every validation, every change.

---

# PART 3: Case 1 — Compraventa de Terreno

## What this case is about

A seller sells land to a buyer. The price has two parts:
- 1/5 paid immediately when the contract is signed
- 4/5 paid later, ONLY IF the land gets classified as "solar" (buildable urban land) within 2 years

The seller promises to try to get this classification but does NOT guarantee it. The key legal distinction is: the classification is a **condition** (something that must happen for the rest of the contract to trigger) — not an **obligation** (something the seller is guaranteeing to deliver).

If a lawyer gets this wrong and writes it as an obligation, the seller could be sued for non-delivery even if they did everything they could.

## What your application demonstrates

Your engine detects this legal error automatically and flags it as a risk. It also shows the three types of legal connections (IF links) between the contracts: time-based, logic-based, and opposition-based.

## How to set it up (step by step)

**Step 1:** Open http://localhost:5173 → You see the homepage

**Step 2:** Click **"Compraventa de Terreno"** card in the template grid
- *(If you don't see it, scroll down — it's in the lower part of the grid)*

**Step 3:** The application creates your project. You see the graph appear on the left with 3 connected contracts:
- The master contract (the land purchase)
- PAGO_APLAZADO (the deferred payment terms)
- CARGAS_URBANISTICAS (urban charges)

**Step 4:** Click on the **master contract node** in the graph (the largest circle). The right panel shows the Campos tab.

**Step 5:** Fill in the fields:
- Vendedor: *Promotora Valenciana del Suelo S.L.*
- Comprador: *Inmobiliaria Costa Este S.A.*
- Juzgados: *Valencia*
- Fecha de inicio: *(today's date)*
- Fecha de vencimiento: *(2 years from today)*

**Step 6:** Scroll down to "Condiciones Económicas". Find the field **"Tipo de condición urbanística"**
- Select: **"Condición suspensiva (Art. 1123 CC) — NO es garantía del vendedor"**
- ✅ Watch: the risk indicator should be GREEN

**Step 7:** Now change it to the WRONG option:
- Select: **"Obligación garantizada del vendedor"**
- 🔴 Watch: immediately a MEDIUM RISK appears with the legal reference

**What to say to your partners:**
> "I just made the same mistake that generates legal disputes worth millions every year. My application detected it in real time — automatically. Without a lawyer reviewing it. With the exact legal article that explains why it's wrong."

## The graph demonstration

**Step 8:** Click on the **line (edge) connecting the master contract to PAGO_APLAZADO**
- A panel slides up from the bottom of the graph
- It shows three types of connections:
  - **IF_temporal**: the 2-year time limit
  - **IF_logica**: the urban classification condition
  - **IF_oposicion**: what happens if payment fails

**What to say:**
> "These are not just connecting lines. Each connection has a legal meaning. The engine knows that time, logic, and opposition are three different types of legal constraints — and treats them differently when something changes."

## Running the validation

**Step 9:** Click **⊙ Verificar** tab on the right. Click **"⊙ Ejecutar Verificación PHENOMENON"**
- Watch the engine check every field, every connection, every legal requirement

**Step 10:** Click **🌐 Ecosistema** tab → Click **"⊙ Homologar Ecosistema Completo"**
- The health ring shows the score (0-100)
- Any issues are listed with their legal references

---

# PART 4: Case 2 — KPMG Hotel Mediterráneo Valencia 5*

## What this case is about

A bank (Banco Mediterráneo de Inversiones S.A.) is financing a hotel development (Hotel Mediterráneo Valencia 5*) with €100 million over 20 years. But this is NOT a simple mortgage. It is a complex legal structure with 4 connected contracts:

1. **The hotel lease** (arrendamiento de cosa futura) — the hotel doesn't exist yet, but the lease is already agreed
2. **The financial service** (circumcontrato CA2) — €100M, NOT a loan (Art. 1544 CC)
3. **The mortgage** (hipoteca sobre edificación futura) — on a building that hasn't been built yet
4. **The rent assignment** (cesión de crédito) — €1,064,583/month in hotel rents assigned to the bank as repayment

## The most impressive thing about this case

When you move the EURIBOR interest rate slider, the entire system reacts in real time:
- The monthly payment recalculates (€687,000 at 5.5% becomes €765,000 at 7.5%)
- Three contracts automatically flag themselves as needing review
- The engine checks whether the hotel rents still adequately cover the payment
- A notification appears showing you exactly what changed, what's at risk, and what to fix

**No other application in the world does this automatically across multiple connected contracts.**

## How to load the demo (step by step)

**Step 1:** Open http://localhost:5173 → You see the homepage

**Step 2:** At the top of the screen, click the purple card **"▶ Abrir Demo KPMG"**
- The system loads 4 pre-filled contracts in 3-5 seconds
- All 4 contracts are already complete and valid (green)

**Step 3:** You now see the graph with 4 nodes:
- ⬡ Center: "Arrendamiento de Cosa Futura — Hotel Mediterráneo Valencia 5*"
- ⊛ "Circumcontrato de Arrendamiento de Servicios Financieros (CA2) — €100M"
- ⊞ "Hipoteca sobre Solar y Edificación Futura"
- ⊟ "Cesión de Crédito — Rentas Hotel 1.064.583 €/mes + IVA"

**Step 4:** Look at the animated lines between the contracts:
- **Gold dots moving outward**: the €100M being disbursed from the bank to the developer
- **Cyan dots moving inward**: the €1,064,583/month hotel rents returning to the bank

**What to say:**
> "These animated particles represent real money flows. The gold is €100 million going out from the bank. The cyan is 1 million euros per month coming back as hotel rents. The engine models this as a live, connected legal structure — not just documents."

## The live interest rate demonstration

**Step 5:** Click the **⭐ Demo KPMG** tab on the right panel

**Step 6:** You see three sliders:
- EURIBOR 12M: currently 3.50%
- Diferencial (Spread): 2.00%
- Plazo: 20 años

**Step 7:** Look at the live calculation panel:
- Tipo total: 5.50%
- Cuota mensual: ~€687,222
- Total intereses: ~€64.9M over 20 years
- Cobertura cesión: ~155% (the rents cover the payment by 155%)

**Step 8:** Slowly move the EURIBOR slider from 3.50% to 5.50%
- Watch the monthly payment update instantly: €687k → ~€765k
- After about 1 second: THREE nodes in the graph flash orange
- A notification appears in the top-left corner showing: what changed, which contracts are affected, what the risks are

**What to say:**
> "The ECB just raised rates by 2%. Three contracts immediately require review. The engine calculated the new payment, checked whether the hotel rents still cover it, and showed me exactly which legal clauses need updating — all in under 2 seconds. This would normally take a team of lawyers a full day."

**Step 9:** Click **"📉 Crisis EURIBOR (+2%)"** button
- EURIBOR jumps to 7.50%
- Monthly payment: ~€850k/month
- The engine shows a HIGH RISK: "Tipo total CRÍTICO: 7.50%"
- But notice the coverage is still >100% — the operation remains viable

**Step 10:** Click **"↺ Restaurar parámetros base"** to reset for the next demonstration

## The legal structure demonstration

**Step 11:** Click on the **line connecting the master contract to the FINANCIACION contract**
- A panel appears at the bottom showing:
  - This is a CA2 circumcontrato (financial service, NOT a loan)
  - The legal basis: Art. 1544 CC (not Art. 1740 CC)
  - If the master lease terminates, the financial service also terminates automatically

**What to say:**
> "Every bank software, every ERP, every contract management system would classify this as a mortgage or a loan. They would be legally wrong. This structure is an arrendamiento de servicios financieros — a service contract — with completely different legal, tax, and insolvency implications. PHENOMENON knows the difference. No other software does."

## The registration demonstration

**Step 12:** In the Demo KPMG tab, click **"⊙ Inscribir Hipoteca en Registro"**
- The HIPOTECA node badge changes from "PARCIAL" to "OPONIBLE"
- The Ecosistema health score increases

**What to say:**
> "Before registration, this mortgage only binds the two parties. The moment it's registered in the Registro de la Propiedad, it becomes binding against the entire world — any future creditor, any future buyer, the insolvency estate. PHENOMENON tracks this transition. Your lawyers don't have to update the system. The system tells them."

## The full ecosystem check

**Step 13:** Click **🌐 Ecosistema** tab → Click **"⊙ Homologar Ecosistema Completo"**
- Watch all 4 contracts being verified in sequence (with the progress animation)
- The health score appears (0-100)
- Any cross-contract inconsistencies are listed

**What to say:**
> "4 contracts, all verified simultaneously. Cross-checked against each other and against Spanish law. If the NDA's confidentiality period doesn't cover the data protection requirements, it tells me. If the payment terms exceed the 60-day legal limit, it tells me. One click. 8 seconds."

---

# PART 5: Case 3 — Caso Seguros (4 Insurance Types at Once)

## What this case is about

Your partner asked you to demonstrate insurance contracts. The most powerful thing you can show is NOT one insurance policy. It is **four completely different insurance products running simultaneously on the same engine** — proving that PHENOMENON works across any legal domain, not just one type of contract.

The 4 insurance types:
1. **Seguro de Vida** — life insurance (activated by death, conditional on medical validation)
2. **Seguro de Responsabilidad Civil** — liability insurance (covers damage to third parties)
3. **Seguro de Daños** — property damage insurance (covers material damage)
4. **Seguro de Crédito Comercial** — credit insurance (covers business non-payment)

## The most impressive thing about this case

These four insurance types look completely different. But PHENOMENON shows that underneath, they all have the same structure:
- Same central legal action (A1): coverage conditionally activated
- Same types of inputs (CA): premium payment, validation, activation
- Same types of conditions (IF): logical, exclusion, temporal
- Different modulaciones: risk, validation requirements, coverage triggers

AND one of the insurance policies (credit insurance) starts BLOCKED — meaning it cannot activate until a financial validation reaches a threshold. This "blocking condition" is modeled at the engine level, not as a workflow approval.

## How to load the demo (step by step)

**Step 1:** Open http://localhost:5173

**Step 2:** Click the green card **"🛡️ Demo Seguros"** at the top of the screen
- The system loads 16 contracts (4 insurance products × 4 sub-contracts each)
- Takes 5-8 seconds

**Step 3:** You see the graph — but this time it's different. There are 4 separate clusters of contracts, each representing one insurance policy.

## The 4-column comparative view

**Step 4:** Click the **🛡️ Seguros** tab in the right panel

**Step 5:** You see a 4-column layout:

```
SEGURO VIDA        | SEGURO RC          | SEGURO DAÑOS      | SEGURO CRÉDITO
─────────────────────────────────────────────────────────────────────────────
✅ ACTIVO          | ✅ ACTIVO          | ✅ ACTIVO         | ⏳ WAITING
Coverage: ACTIVE   | Coverage: ACTIVE   | Coverage: ACTIVE  | Coverage: ⛔ BLOCKED
Exclusiones: OK    | Límites: OK        | Peritación: OK    | Validación: ⚠️ PENDIENTE
Prima: OK          | Franquicia: OK     | Exclusiones: OK   | Riesgo: OK
```

**What to say:**
> "Four insurance products on screen at the same time. Same engine. Three are active and working. The fourth — credit insurance — is blocked. It cannot activate until the financial validation of the insured reaches the required threshold. This is not a workflow approval waiting for someone to click a button. This is a legal blocking condition modeled at the engine level. No insurance software in the world does this."

## The blocked coverage demonstration

**Step 6:** Click on the **⛔ BLOCKED** indicator in the Seguro Crédito column
- A panel shows: "COBERTURA_CREDITO: BLOQUEADA — IF_exclusión activa. La validación financiera del asegurado no ha alcanzado el umbral requerido."

**Step 7:** Click **"Desbloquear Cobertura"**
- The credit insurance column changes from BLOCKED → ACTIVE
- The graph flashes
- The column turns green

**What to say:**
> "The financial validation threshold has been met. The engine automatically removes the blocking condition. Coverage is now active. In a real insurance company, this happens after the underwriter approves the credit report. PHENOMENON models the legal reason why the block existed — not just the process step."

## The siniestro (claim) demonstration

**Step 8:** In the **SEGURO VIDA** column, click **"🚨 Declarar Siniestro"**
- The life insurance master transitions: ACTIVO → SINIESTRO_PENDIENTE (shown in orange)
- The COBERTURA_VIDA sub-contract also changes to SINIESTRO_PENDIENTE
- The graph nodes change color

**What to say:**
> "A claim has been filed. The life insurance policy immediately transitions to a claim-pending state. The engine automatically checks whether the medical validation done at policy inception is consistent with this claim. If the insured had a pre-existing condition that wasn't declared, the coverage can be challenged. PHENOMENON flags this automatically."

**Step 9:** Click **"✅ Aprobar Indemnización"**
- COBERTURA_VIDA transitions to: INDEMNIZACION_PAGADA
- The graph shows the final state

**What to say:**
> "Claim approved. Policy paid. The engine has tracked the full lifecycle: activated → claim filed → claim assessed → claim paid. This is a complete insurance lifecycle in one demonstration."

## The shared structure demonstration

**Step 10:** In any insurance contract, click on the **Campos** tab. Change the **Jurisdicción** field.

**Watch:** All the other insurance contracts in the graph flash orange simultaneously.

**What to say:**
> "When I change the jurisdiction on one policy, every other policy for the same parties needs to be reviewed — because they share the same parties and the jurisdiction affects them all. The engine propagates this change automatically across all 16 contracts. This is the inter-phenomenic connection at work."

## The final ecosystem check

**Step 11:** Click **🌐 Ecosistema** → **"⊙ Homologar Ecosistema Completo"**
- All 16 contracts verified
- Cross-contract consistency checks
- Health score displayed

**What to say:**
> "16 insurance contracts. All verified. All cross-checked. One click. 15 seconds. Any other insurance software would require 4 separate systems — one for each insurance type — and no tool would cross-check between them. PHENOMENON does it all with one engine."

---

# PART 6: The Questions Your Partners Will Ask

## "What makes this different from existing contract management systems?"

> "Existing systems manage documents. They store them, send them for signature, and organize them in folders. PHENOMENON manages the legal reality underneath the document. When something changes in one contract, the engine automatically understands what it means for every connected contract and tells you instantly. No other system does this."

## "Can it handle our specific case?"

> "Show me the case. PHENOMENON is built on a universal engine — the same engine that handles insurance handles real estate handles corporate structures. The engine doesn't care about the domain. It understands legal structure. Give me the case and I'll show you how it maps."

## "How long would it take to set up a new case?"

> "For a new type of contract: 1-2 days to define the template, the legal fields, and the connection rules. The engine is already built. We're just teaching it a new legal domain."

## "What's the legal authority behind the risk detection?"

> "Every risk rule in the engine has a specific legal reference — Código Civil articles, specific laws (Ley 3/2004, RGPD, LPI, etc.). When the engine flags a risk, it shows you the exact law. It's not AI guessing. It's structured legal logic."

## "Can this replace a lawyer?"

> "No, and it shouldn't. PHENOMENON structures and validates. It makes lawyers faster and catches errors before they review. A lawyer reviewing a PHENOMENON-structured document can focus on judgment and strategy instead of checking whether all the fields are filled correctly and consistently."

## "What's the revenue model?"

> "Enterprise license for banks, insurance companies, and law firms. API access for companies that want to build PHENOMENON-powered legal tools. White-label engine for government registries."

---

# PART 7: Quick Reference — Key Points to Remember

## The 5 most impressive things to show

1. **Move the EURIBOR slider** (KPMG case) → 3 contracts flash orange in real time
2. **Select the wrong legal option** (Compraventa) → risk detected automatically with law reference
3. **Click "Homologar Ecosistema"** (any case) → entire network validated in one click
4. **Show the BLOCKED coverage** (Seguros) → explain what a legal blocking condition is
5. **Click on a graph edge** (any case) → show that connections have legal meaning, not just visual lines

## The key phrase for each case

- **Compraventa:** "We detect the legal error that generates millions in disputes — automatically"
- **KPMG:** "No other software can even represent this financial structure correctly, let alone validate it"
- **Seguros:** "Same engine, four completely different insurance types — simultaneously"

## What to do if something doesn't work

- If the graph doesn't load: refresh the browser (F5)
- If the demo cards aren't showing: check `docker compose ps` — all services need to be "Up"
- If cascade doesn't fire: wait 1-2 seconds — it has a 1-second debounce
- If you see a blank page: check `docker compose logs frontend --tail=10` for errors

## The single most important thing to communicate

> "Your partners gave you 3 specific cases. PHENOMENON solves all 3. But more importantly, it solves them using the SAME engine — the same backend that handles a hotel financing handles insurance handles property sales. That's not a coincidence. That's architecture. That's what makes this unique."

---

*Last updated: 2026-05-20 — Written for Param, the application owner*
*For technical details: see SYSTEM_STATUS.md | For test scripts: see DEMO_INVESTOR_CASES.md*
