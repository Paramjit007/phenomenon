# PHENOMENON Contract Intelligence System
## Master Build Skill File — v1.0

---

```
Φ PHENOMENON · Contract Intelligence Engine
"The Mind beneath the contract. The vector behind the clause."
```

---

## 1. What This Skill Covers

This skill guides the complete construction of the **PHENOMENON Contract Intelligence System** — a web application that uses the PHENOMENON philosophical-ontological framework as its structural engine, layered with Claude AI for language reasoning, to manage complex hierarchical contract systems with real-time cascading propagation.

**When to use this skill:**
- Building the PHENOMENON engine backend (Python/FastAPI)
- Building the contract creation and management frontend
- Wiring Claude API as the reasoning layer
- Implementing cascade propagation between related contracts
- Deploying any module of the PHENOMENON system

---

## 2. The PHENOMENON Framework — Contract Mapping

PHENOMENON models reality through **Phenomena** (entities with dual nature), **IA operators** (vectorized interactions), and **Phases** (F) connected by **Inter-Phenomenic transitions** (IF).

### Core Mapping Table

| PHENOMENON Concept | Legal Contract Equivalent | Engineering Role |
|---|---|---|
| **Phenomenon** | Any contract (master or sub) | Root aggregate object |
| **Ess** (stable being) | Contract identity: parties, dates, jurisdiction, governing law | Immutable identity fields |
| **Ag** (operational doing) | Clauses, obligations, rights, schedules | Mutable operational fields |
| **IA Instance** | Contractual operator: obligation, right, restriction, permission | Clause type + behavior rule |
| **Vector** | The "force" of a clause: binding, conditional, time-bound | Directionality + strength of obligation |
| **F (Phase)** | Contract lifecycle stage: Draft → Active → Amended → Terminated | State machine node |
| **IF (Inter-Phenomenic)** | Link between master and sub-contract | Cascade edge in the graph |
| **Homologation** | Contract validation against rules and standards | Compliance check engine |
| **Opus** | Final contract output/status | Compiled contract result |
| **Acetato** | The active operational plane | Current runtime state |

### The Cascade Rule (Core Business Logic)

```
Master Contract (Ess change)
    │
    └── IF Vector propagates →
            ├── NDA (jurisdiction updated)
            ├── SLA (dates cascaded)
            ├── Payment Terms (parties updated)
            ├── IP Assignment (jurisdiction updated)
            └── DPA (all Ess fields updated)

Each sub-contract evaluates:
  1. Which of its own Ess fields are derived from master
  2. Which IA instances are affected by the master change
  3. Whether homologation still holds (re-validate)
  4. Update opus status: ACTIVE → NEEDS_REVIEW → RE-VALIDATED
```

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│          React SPA — Contract Network + Builder + Engine Trace  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST / WebSocket
┌──────────────────────────────▼──────────────────────────────────┐
│                      FASTAPI BACKEND                            │
│   Routes: /phenomena  /simulate  /homologate  /cascade          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │IA Engine    │  │Vector Engine│  │Cascade Engine         │   │
│  │(operators)  │  │(propagation)│  │(IF graph traversal)   │   │
│  └─────────────┘  └─────────────┘  └──────────────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │Phase Engine │  │Homologation │  │Audit Log              │   │
│  │(F/IF states)│  │Engine       │  │(full traceability)    │   │
│  └─────────────┘  └─────────────┘  └──────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                     CLAUDE API (Anthropic)                      │
│  - Generates contract clause text from Ess+Ag structure        │
│  - Interprets cascade impact in natural language               │
│  - Validates clause consistency and legal coherence            │
│  - Answers "what happens if X changes?" queries               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    PostgreSQL + JSONB                           │
│  phenomena · ia_types · ia_instances · vectors                 │
│  phases · transitions · opus · simulation_runs · audit_logs    │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Split?

- **PHENOMENON Engine** → handles structure, state, graph, propagation (deterministic)
- **Claude API** → handles language, generation, interpretation, reasoning (probabilistic)
- **PostgreSQL + JSONB** → stores phenomenon objects with flexible IA/vector payloads

---

## 4. Folder Structure

```
phenomenon-contracts/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app entry
│   │   ├── config.py                  # Settings, DB URL, Claude API key
│   │   │
│   │   ├── api/
│   │   │   ├── routes_phenomena.py    # CRUD for phenomena
│   │   │   ├── routes_ia.py           # IA catalog + instantiation
│   │   │   ├── routes_simulation.py   # Run scenarios
│   │   │   ├── routes_cascade.py      # Cascade propagation endpoint
│   │   │   └── routes_ai.py           # Claude API bridge endpoints
│   │   │
│   │   ├── domain/
│   │   │   ├── models.py              # Pydantic models
│   │   │   ├── enums.py               # Status, IA types, phase codes
│   │   │   └── rules.py               # Homologation rules, cascade rules
│   │   │
│   │   ├── engines/
│   │   │   ├── ia_engine.py           # IA instantiation + compatibility
│   │   │   ├── vector_engine.py       # Vector generation + evaluation
│   │   │   ├── phase_engine.py        # F creation, IF transitions
│   │   │   ├── cascade_engine.py      # IF graph traversal + propagation
│   │   │   ├── homologation_engine.py # Validation against rules
│   │   │   └── simulation_engine.py   # Full scenario runner
│   │   │
│   │   ├── ai/
│   │   │   ├── claude_client.py       # Anthropic SDK wrapper
│   │   │   ├── contract_generator.py  # Generate clauses from Ess+Ag
│   │   │   ├── cascade_analyst.py     # Explain cascade impacts
│   │   │   └── prompts.py             # All system/user prompts
│   │   │
│   │   ├── repositories/
│   │   │   ├── phenomena_repo.py
│   │   │   ├── ia_repo.py
│   │   │   └── audit_repo.py
│   │   │
│   │   └── tests/
│   │       ├── test_cascade.py
│   │       ├── test_ia_engine.py
│   │       └── test_homologation.py
│   │
│   ├── alembic/                       # DB migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ContractNetwork.jsx    # SVG graph of contract tree
│   │   │   ├── ContractBuilder.jsx    # Create/edit contracts
│   │   │   ├── EngineTrace.jsx        # Live PHENOMENON engine log
│   │   │   ├── CascadePanel.jsx       # Trigger and visualize cascade
│   │   │   └── ContractViewer.jsx     # Ess/Ag/Vector/Opus display
│   │   ├── hooks/
│   │   │   ├── usePhenomenon.js       # Engine state management
│   │   │   └── useCascade.js          # Cascade state + animation
│   │   ├── api/
│   │   │   ├── phenomenon.js          # Backend API calls
│   │   │   └── claude.js              # Direct Claude API calls (demo)
│   │   └── styles/
│   │       └── tokens.js              # Design tokens
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 5. Database Schema

### Core Tables

```sql
-- Root aggregate: every contract is a phenomenon
CREATE TABLE phenomena (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(50) NOT NULL,           -- MASTER, NDA, SLA, PAYMENT, IP, DPA
    parent_id   UUID REFERENCES phenomena(id),  -- NULL for master
    f_id        VARCHAR(20) DEFAULT 'F1',
    ess_json    JSONB NOT NULL,                 -- {partyA, partyB, jurisdiction, dates}
    ag_json     JSONB NOT NULL,                 -- {clauses: [...]}
    status      VARCHAR(30) DEFAULT 'DRAFT',    -- DRAFT, ACTIVE, NEEDS_REVIEW, TERMINATED
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- IA operator catalog (generic definitions)
CREATE TABLE ia_types (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                 VARCHAR(50) UNIQUE NOT NULL,  -- ad-actio, de-actio, non, etc.
    class                VARCHAR(30),                   -- intra, inter
    description          TEXT,
    default_behavior_json JSONB
);

-- IA instances (specific operators in a phenomenon)
CREATE TABLE ia_instances (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phenomenon_id  UUID REFERENCES phenomena(id) ON DELETE CASCADE,
    ia_type_id     UUID REFERENCES ia_types(id),
    f_id           VARCHAR(20),
    behavior_json  JSONB,
    active         BOOLEAN DEFAULT TRUE
);

-- Vectors (directional operational movements)
CREATE TABLE vectors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ia_instance_id  UUID REFERENCES ia_instances(id),
    origin          VARCHAR(100),
    destination     VARCHAR(100),
    lation          VARCHAR(50),    -- binding, conditional, permissive
    sense           VARCHAR(20),    -- forward, reverse
    direction       VARCHAR(50),    -- F1→F2, IF→F
    position        VARCHAR(20),    -- OPEN, BLOCKED
    plication       VARCHAR(30),    -- implied, explicit, co-implied
    status          VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Lifecycle phases for each phenomenon
CREATE TABLE phases (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phenomenon_id  UUID REFERENCES phenomena(id) ON DELETE CASCADE,
    code           VARCHAR(20),     -- F1, F2, F3
    order_index    INTEGER,
    state_json     JSONB,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Inter-Phenomenic transitions (cascade edges)
CREATE TABLE transitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_f_id       UUID REFERENCES phases(id),
    to_f_id         UUID REFERENCES phases(id),
    if_type         VARCHAR(30),    -- cascade, inherit, block
    status          VARCHAR(20),    -- PASS, BLOCK, PENDING
    rule_result_json JSONB
);

-- Results of each phenomenon
CREATE TABLE opus (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phenomenon_id    UUID REFERENCES phenomena(id) ON DELETE CASCADE,
    f_id             VARCHAR(20),
    status           VARCHAR(30),     -- ACTIVE, NEEDS_REVIEW, BLOCKED, VALIDATED
    homologation     VARCHAR(20),     -- VALID, INVALID, PENDING
    output_json      JSONB,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Cascade event log
CREATE TABLE cascade_events (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_phenomenon_id UUID REFERENCES phenomena(id),
    changed_field        VARCHAR(100),
    old_value            TEXT,
    new_value            TEXT,
    affected_ids         UUID[],
    propagation_json     JSONB,       -- Full IF traversal trace
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Full audit / engine trace
CREATE TABLE audit_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phenomenon_id  UUID REFERENCES phenomena(id),
    run_id         UUID,
    step_index     INTEGER,
    phase          VARCHAR(20),      -- ESS, AG, IA, VEC, F, IF, OPUS
    message        TEXT,
    data_json      JSONB,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. API Endpoints

### Phenomena (Contracts)

```
POST   /phenomena                    Create phenomenon (contract)
GET    /phenomena                    List all phenomena
GET    /phenomena/{id}               Get phenomenon by ID
PATCH  /phenomena/{id}/ess           Update Ess fields (triggers cascade check)
DELETE /phenomena/{id}               Terminate phenomenon

POST   /phenomena/{id}/ia            Instantiate IA operator
POST   /phenomena/{id}/vectors       Generate vector
POST   /phenomena/{id}/phase         Advance phase (F1 → F2)
```

### Cascade Engine

```
POST   /cascade/trigger              Execute cascade from master
  Body: { master_id, field, new_value }
  Returns: { affected_ids, propagation_trace, ai_analysis }

GET    /cascade/{event_id}           Get cascade event detail
GET    /cascade/preview              Preview impact without executing
```

### IA Engine

```
GET    /ia-types                     List IA catalog
POST   /ia-types                     Add IA type
POST   /ia/validate                  Validate IA compatibility
```

### AI Bridge (Claude)

```
POST   /ai/generate-contract         Generate clauses from Ess+Ag
POST   /ai/analyze-cascade           Explain cascade impact
POST   /ai/validate-clauses          Check clause consistency
POST   /ai/query                     Free-form question about any phenomenon
```

### Simulation

```
POST   /simulate                     Run full scenario
GET    /simulate/{run_id}            Read simulation trace
```

---

## 7. Engine Implementation Guide

### 7.1 Cascade Engine (Most Critical)

```python
# engines/cascade_engine.py

class CascadeEngine:
    """
    Traverses the IF graph from a master phenomenon,
    propagates Ess field changes, and updates opus states.
    """

    CASCADE_MAP = {
        # field_name → list of sub-contract types affected
        "jurisdiction":   ["NDA", "SLA", "PAYMENT", "IP", "DPA"],
        "effectiveDate":  ["SLA", "PAYMENT", "DPA"],
        "expiryDate":     ["NDA", "SLA", "PAYMENT", "IP", "DPA"],
        "partyA":         ["NDA", "SLA", "PAYMENT", "IP", "DPA"],
        "partyB":         ["NDA", "SLA", "PAYMENT", "IP", "DPA"],
        "governingLaw":   ["NDA", "SLA", "IP", "DPA"],
    }

    def run(self, master_id: str, field: str, new_value: str, db) -> dict:
        master = db.get_phenomenon(master_id)
        old_value = master.ess_json.get(field)

        # 1. Update master Ess
        master.ess_json[field] = new_value
        master.status = "MODIFIED"
        db.save(master)

        # 2. Find affected sub-contracts via IF graph
        sub_contracts = db.get_children(master_id)
        affected_types = self.CASCADE_MAP.get(field, [])
        affected = [c for c in sub_contracts if c.type in affected_types]

        # 3. Propagate to each affected phenomenon
        trace = []
        for contract in affected:
            trace.append(self._propagate(contract, field, new_value, db))

        # 4. Log cascade event
        event = CascadeEvent(
            master_phenomenon_id=master_id,
            changed_field=field,
            old_value=old_value,
            new_value=new_value,
            affected_ids=[c.id for c in affected],
            propagation_json={"trace": trace},
        )
        db.save(event)

        return {
            "master_id": master_id,
            "field": field,
            "old_value": old_value,
            "new_value": new_value,
            "affected_count": len(affected),
            "affected_ids": [c.id for c in affected],
            "trace": trace,
        }

    def _propagate(self, contract, field: str, new_value: str, db) -> dict:
        contract.ess_json[field] = new_value
        contract.status = "NEEDS_REVIEW"
        contract.opus.homologation = "PENDING"
        db.save(contract)

        return {
            "phenomenon_id": contract.id,
            "name": contract.name,
            "field_updated": field,
            "new_status": "NEEDS_REVIEW",
            "vector": f"IF→{contract.type}",
        }
```

### 7.2 IA Engine

```python
# engines/ia_engine.py

IA_COMPATIBILITY = {
    # IA types that can co-exist in the same acetato
    "ad-actio":        ["co-implication", "ad-actio"],
    "de-actio":        ["non", "de-actio"],
    "non":             ["de-actio"],
    "co-implication":  ["ad-actio", "co-implication"],
}

class IAEngine:
    def instantiate(self, phenomenon_id, ia_type_code, behavior_overrides, db):
        ia_type = db.get_ia_type(ia_type_code)
        existing = db.get_ia_instances(phenomenon_id)

        # Compatibility check
        for existing_ia in existing:
            if ia_type_code not in IA_COMPATIBILITY.get(existing_ia.code, []):
                raise IACompatibilityError(
                    f"{ia_type_code} incompatible with {existing_ia.code}"
                )

        instance = IAInstance(
            phenomenon_id=phenomenon_id,
            ia_type_id=ia_type.id,
            behavior_json={**ia_type.default_behavior_json, **behavior_overrides},
            active=True
        )
        db.save(instance)
        return instance
```

### 7.3 Vector Engine

```python
# engines/vector_engine.py

class VectorEngine:
    def generate(self, ia_instance, ess_data: dict) -> Vector:
        """
        Derives vector properties from IA type + Ess context.
        """
        lation = self._compute_lation(ia_instance.behavior_json)
        sense = "forward" if ia_instance.active else "reverse"
        direction = self._compute_direction(ia_instance)
        position = "OPEN" if lation in ["binding", "permissive"] else "BLOCKED"
        plication = "co-implied" if "co-implication" in ia_instance.code else "explicit"

        return Vector(
            ia_instance_id=ia_instance.id,
            lation=lation,
            sense=sense,
            direction=direction,
            position=position,
            plication=plication,
            status="ACTIVE"
        )
```

---

## 8. Claude AI Integration

### System Prompt for Contract Generation

```python
CONTRACT_GENERATION_SYSTEM = """
You are the PHENOMENON Contract Intelligence Engine AI layer.
You receive structured contract data (Ess + Ag skeleton) and generate
legally coherent, precise clause text.

Always respond in valid JSON only. No markdown, no preamble.
Structure: { "clauses": [...], "ia_instances": [...], "special_terms": "..." }

Clauses should be:
- Legally precise and jurisdiction-aware
- Consistent with all Ess fields provided
- Derived from the parent contract context where relevant
"""

CONTRACT_GENERATION_USER = """
Contract Type: {contract_type}
Parent Master Agreement: {master_summary}
Ess (Stable Identity):
  Party A: {party_a}
  Party B: {party_b}
  Jurisdiction: {jurisdiction}
  Effective: {effective_date}
  Expiry: {expiry_date}

Generate 4-6 precise clauses for this {contract_type}.
"""
```

### Cascade Analysis Prompt

```python
CASCADE_ANALYSIS_USER = """
A Master Service Agreement changed its {field} from "{old_value}" to "{new_value}".
The following sub-contracts are affected: {affected_types}.

In 3-5 bullet points, explain:
1. What legal updates are now required in each affected sub-contract
2. Which specific clauses need to be reviewed or redrafted
3. Any compliance risks introduced by this change

Be specific, practical, and jurisdiction-aware.
"""
```

---

## 9. Frontend Component Architecture

### ContractNetwork.jsx
- SVG-based tree visualization
- Master node at top (gold hexagon)
- Sub-contract nodes below (colored by type)
- Bezier curves for IF connections
- Pulse animation on cascade-affected nodes
- Click to select and view

### EngineTrace.jsx
- Scrollable log panel (right sidebar)
- Color-coded by phase (ESS=gold, AG=purple, IA=cyan, VEC=cyan, F=green, OPUS=gold)
- Real-time append with `fadeIn` animation
- Phase badge + timestamp + message
- Auto-scroll to latest entry

### ContractBuilder.jsx
- Type selector (NDA, SLA, PAYMENT, IP, DPA)
- Ess fields form (parties auto-inherited from master)
- "Instantiate via PHENOMENON" button → calls backend → calls Claude API
- Shows engine trace in real-time during creation

### CascadePanel.jsx
- Field selector (jurisdiction, dates, parties)
- New value input
- Impact preview (how many sub-contracts affected)
- "Execute Cascade" button with confirmation
- Animated propagation visualization on network graph

---

## 10. Build Sequence (MVP to Production)

### Phase 1 — Core Engine (Week 1-2)
```
✓ FastAPI app skeleton
✓ Phenomena CRUD
✓ IA catalog seeded
✓ Cascade engine (rule-based)
✓ PostgreSQL schema + migrations
✓ Unit tests: cascade, IA, vector
```

### Phase 2 — AI Layer (Week 2-3)
```
✓ Claude API client
✓ Contract generation endpoint
✓ Cascade analysis endpoint
✓ Prompts tuned for legal domain
```

### Phase 3 — Frontend (Week 3-4)
```
✓ React SPA with 3-panel layout
✓ ContractNetwork SVG graph
✓ ContractBuilder with Claude generation
✓ EngineTrace real-time log
✓ CascadePanel with animations
```

### Phase 4 — Production Hardening
```
□ Auth (JWT, role-based: lawyer, admin, viewer)
□ WebSocket for real-time engine trace
□ PDF export of contracts
□ Version history (Ess diffs)
□ Multi-master support
□ Audit trail UI
□ White-label theming
```

---

## 11. Deployment

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: phenomenon
      POSTGRES_USER: phenomenon
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://phenomenon:${DB_PASSWORD}@db/phenomenon
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      VITE_API_URL: http://localhost:8000

volumes:
  pgdata:
```

### Environment Variables
```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
CLAUDE_MODEL=claude-sonnet-4-20250514
SECRET_KEY=...
CORS_ORIGINS=http://localhost:3000
```

---

## 12. Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Backend framework | FastAPI (Python) | Async, fast, PHENOMENON was designed in Python |
| Database | PostgreSQL + JSONB | Relational structure + flexible IA/vector payloads |
| Frontend | React + SVG | Network graph visualization, real-time updates |
| AI model | Claude Sonnet 4 | Best balance of legal reasoning + speed + cost |
| Cascade style | Synchronous (MVP) | Predictable, debuggable, auditable |
| Auth | JWT + RBAC | Standard, stateless, multi-tenant ready |
| State management | Zustand (frontend) | Lightweight, suitable for phenomenon state |

---

## 13. Investor Talking Points

- **The Problem**: Complex contract ecosystems (M&A, SaaS, construction, finance) have no engine that understands the structural relationships between contracts. Changes cascade manually, causing errors, legal risk, and expensive lawyer hours.
- **The Engine**: PHENOMENON provides a formal mathematical/philosophical model for contract relationships — not just a database, but an **operational interaction engine** with vectorized propagation.
- **The AI Layer**: Claude generates contract text, explains cascading impacts in plain language, and reasons about legal consistency — turning a structural engine into an intelligent assistant.
- **The Moat**: PHENOMENON is a proprietary ontological framework not replicated in any existing LegalTech product. It treats contracts as living phenomena with operational dynamics, not as static documents.
- **The Market**: Global contract lifecycle management (CLM) market: $3.5B (2024), growing to $9B by 2030. Average enterprise has 20,000–40,000 active contracts with hidden interdependencies.
- **The MVP proof**: Create a master contract, add 5 sub-contracts in 2 minutes, change the governing jurisdiction, watch all 5 cascade update in real-time with AI-generated impact analysis.

---

*PHENOMENON Contract Intelligence System — Skill File v1.0*
*Built on the PHENOMENON framework by [Author]. Claude AI integration by Anthropic.*
