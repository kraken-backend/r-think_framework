<p align="center">
  <img src="docs/pictures/logo.png" alt="R-Think Logo" width="200">
</p>

# R-Think Runtime

> **Cognitive Reasoning Algorithm, Protocol, Runtime, and Evidence-Governed Execution System**

R-Think bukan prompt dan bukan checklist teori. R-Think Runtime adalah software yang mengendalikan state kognitif operasional, metode, evidence, authority, transition, failure, discovery, dan evolution secara observable serta dapat diuji.

![R-Think Flow](docs/pictures/rthink_flow.png)

---

## Table of Contents

- [What is R-Think](#what-is-r-think)
- [The Problem It Solves](#the-problem-it-solves)
- [Canonical R-Think Algorithm](#canonical-r-think-algorithm)
- [State Machine](#state-machine)
- [Non-Negotiable Principles](#non-negotiable-principles)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Current Status](#current-status)
- [Runtime Roadmap](#runtime-roadmap)
- [Development](#development)
- [Authority](#authority)
- [License](#license)

---

## What is R-Think

R-Think berangkat dari **Iqra/Perhatikan**: kemampuan untuk memperhatikan realitas sebelum memutuskan. Urutannya bukan ritual, melainkan **discipline** agar pemahaman, validasi, hubungan, challenge, discovery, dan evolution tidak dipotong oleh dorongan untuk segera menghasilkan jawaban.

R-Think is a **Guardian reasoning framework**: Observe (Iqra) → Understand → Question → Validate → Connect → Challenge → Discover → Evolve. This blueprint transforms that framework into an **executable system** that governs AI/agent operational processes — without claiming to read all internal hidden reasoning of the model.

R-Think Runtime **controls what can be controlled**: work state, input, artifact, method, tool, evidence, transition, authority, action, actual result, contradiction, completion, and evolution.

The system stands alone. **CG OS** is the primary consumer, **OpenCode** can be an executor, and projects like OCR/DIP or KDAP can provide domain blueprints and tools. Models can be changed without altering R-Think identity and protocol.

### Product Forms

| Form | Definition |
|------|-----------|
| **R-Think Algorithm** | Rules for selecting and running processes from observation to evolution |
| **R-Think Protocol (RTP)** | Message contract between runtime, model, executor, tool, verifier, and human |
| **R-Think Runtime** | Engine managing mission, state, transitions, artifacts, evidence, authority, and recovery |
| **R-Think Artifact Standard** | Schema for observation, claim, hypothesis, validation, challenge, discovery, decision, evolution |
| **R-Think Evidence Graph** | Traceable relationships: source → claim → evidence → decision → result → contradiction |
| **R-Think SDK** | Library/API/CLI for application integration |
| **R-Think Inspector** | UI for viewing process, evidence, gaps, transitions, and status |

---

## The Problem It Solves

| Problem | How R-Think Addresses It |
|---------|-------------------------|
| Models appear to follow frameworks by generating 8-stage narratives | Enforces observable state transitions with artifact gates |
| Executors skip observation, inject assumptions, claim completion | Requires evidence before completion; artifacts before transition |
| Prompts don't guarantee persistence, recovery, authority, or evidence | Runtime maintains operational state independently of chat history |
| Chat history is not factual mission state | Event-sourced operational history with replay |
| Vector memory doesn't prove claim-evidence relationships | Evidence Graph with traceable source→claim→evidence links |
| Tool-call success doesn't prove product behavior is correct | Actual result distinguished from executor report |
| Failures stop at "blocked" or get hardcoded closed | Contradiction triggers challenge and evolution loops |
| Model upgrades change behavior without traceability | Versioned evolution with benchmarks and rollback |
| Multi-agent workflows become prompt collections without shared reasoning | Single canonical algorithm governs all actors |

---

## Canonical R-Think Algorithm

```
INPUT: intent | event | mission

 1. Establish purpose, scope, authority, risk, novelty, and acceptance.
 2. OBSERVE   — The initial stage where the Guardian absorbs information without filters.
                 Reading reality as it is — without premature interpretation.
                 Iqra is not merely reading text, but reading situations, patterns, and context.
 3. UNDERSTAND — Building a mental model from observations.
                  The Guardian does not merely collect data, but seeks meaning and relationships within it.
 4. QUESTION   — Testing understanding through critical questions.
                  Is the mental model accurate? What is still unknown?
 5. VALIDATE   — Confirming understanding through experiments or cross-referencing.
                  Validation is the bridge between belief and truth.
 6. CONNECT    — Linking new findings to existing knowledge.
                  Discovery does not happen in a vacuum — it grows upon established foundations.
 7. CHALLENGE  — The most critical stage. Challenge prevents overconfidence by re-questioning
                  the entire chain. What will happen? Which assumption is wrong? Which part
                  remains uncovered? Is there another approach? Can the experiment be repeated?
 8. DISCOVER   — Arriving at new findings that have passed through the entire filter —
                  observation, understanding, validation, and challenge.
                  Discovery here is not merely "finding", but finding with tested confidence.
 9. EVOLVE     — Incorporating findings into the next cycle.
                  R-Think is a living framework — it evolves each time a cycle completes,
                  growing sharper and deeper.
10. Execute only authorized actions; capture actual result.
11. Re-enter OBSERVE when reality contradicts expectation.
12. Complete only when acceptance evidence passes.
```

### Adaptive Depth

| Level | Use Case | Required Behavior |
|-------|----------|-------------------|
| **L0 Routine** | Read/status/simple deterministic action | Observe–understand–act–verify lightweight |
| **L1 Controlled** | Bounded edit/configuration | Validate inputs and verify actual result |
| **L2 Significant** | Feature, architecture, uncertain investigation | Full R-Think with challenge and evidence |
| **L3 Critical** | Security, deletion, protocol/blueprint/human impact | Full cycle + independent verifier + explicit authority |

### Loop Rules

- Sequence is canonical but runtime is **not strictly linear**
- **Contradiction** returns to Observe or Validate
- **Insufficient method** routes to Challenge and Experiment
- **New relationship** may return to Understand/Question
- **Evolution** may create a new mission rather than mutate the active mission
- Retries require **changed hypothesis, method, context, or evidence** — not blind repetition

---

## State Machine

### Primary Cognitive States

```
OBSERVE → UNDERSTAND → QUESTION → VALIDATE → CONNECT → CHALLENGE → DISCOVER → EVOLVE
```

| State | Essence |
|-------|---------|
| **Observe (Iqra)** | Absorbing information without filters. Reading reality as it is — without premature interpretation. Not merely reading text, but reading situations, patterns, and context. |
| **Understand** | Building a mental model from observations. Not merely collecting data, but seeking meaning and relationships within it. |
| **Question** | Testing understanding through critical questions. Is the mental model accurate? What is still unknown? |
| **Validate** | Confirming understanding through experiments or cross-referencing. The bridge between belief and truth. |
| **Connect** | Linking new findings to existing knowledge. Discovery does not happen in a vacuum — it grows upon established foundations. |
| **Challenge** | The most critical stage. Prevents overconfidence by re-questioning the entire chain. What will happen? Which assumption is wrong? Which part remains uncovered? Is there another approach? Can the experiment be repeated? |
| **Discover** | Arriving at new findings that have passed through the entire filter — observation, understanding, validation, and challenge. Not merely "finding", but finding with tested confidence. |
| **Evolve** | Incorporating findings into the next cycle. R-Think is a living framework — it evolves each time a cycle completes, growing sharper and deeper. |

### Operational States

| State | Meaning |
|-------|---------|
| `WAITING_FOR_EVIDENCE` | Paused until evidence is available |
| `WAITING_FOR_AUTHORITY` | Paused until human/Guardian decision |
| `EXECUTING_METHOD` | Actively running a method or tool |
| `EXECUTING_EXPERIMENT` | Running a bounded experiment |
| `CONTRADICTION_DETECTED` | Expected vs actual conflict found |
| `METHOD_INSUFFICIENT` | Current method cannot proceed |
| `REVISION_REQUIRED` | Backtrack and revise approach |
| `COMPLETED` | Acceptance evidence passed |
| `PARTIAL` | Partial completion with known gaps |
| `FAILED` | Execution failed |
| `BLOCKED` | Cannot proceed — external dependency |
| `INVALID` | State or input is invalid |

### Transition Decisions

| Decision | Meaning |
|----------|---------|
| `ALLOW` | Transition permitted — requirements satisfied |
| `DENY` | Transition blocked — requirements not met |
| `DEFER` | Transition postponed — awaiting condition |
| `ESCALATE` | Transition requires higher authority |

---

## Non-Negotiable Principles

| Principle | Operational Meaning |
|-----------|-------------------|
| **Reality before narrative** | Actual result defeats executor/model report |
| **Artifacts before transition** | State doesn't move without required artifact |
| **Evidence before completion** | Completion requires acceptance evidence |
| **Unknown remains unknown** | Uncertainty is stated, not covered with false confidence |
| **Challenge before material decision** | Novel/high-risk/material decisions must be challenged |
| **History before cleanliness** | Failure/revision is not overwritten to look clean |
| **Evolution with authority** | Material changes are versioned and approved |
| **Model independence** | Runtime is not bound to one LLM/provider |
| **Local/open-source baseline** | No mandatory cloud, account, credit card, or recurring cost |

---

## Architecture

### Runtime Modules

| Module | Responsibility |
|--------|---------------|
| **Mission Runtime** | Lifecycle, dependencies, recovery |
| **State Machine** | Current state and allowed transitions |
| **Transition Engine** | Rule evaluation and authority checks |
| **Artifact Registry** | Schema validation and provenance |
| **Evidence Graph** | Claims, evidence, contradiction, acceptance |
| **Method Router** | Select model/tool/human/experiment |
| **Challenge Engine** | Coverage, alternative, failure mode |
| **Evolution Engine** | Version, benchmark, rollback, approval |
| **Policy Engine** | Capability and security decisions |
| **Provider Adapters** | Local models, OpenCode, tools, human |
| **Event Store** | Immutable operational history |
| **Inspector API/UI** | Observable process and evidence |

### Evidence Graph

```
SOURCE ──OBSERVED_AS──▶ OBSERVATION
OBSERVATION ──SUPPORTS|CONTRADICTS──▶ CLAIM
CLAIM ──FORMULATES──▶ HYPOTHESIS
HYPOTHESIS ──TESTED_BY──▶ EXPERIMENT
EXPERIMENT ──PRODUCES──▶ EVIDENCE
EVIDENCE ──SUPPORTS|REFUTES──▶ DECISION
DECISION ──AUTHORIZES──▶ ACTION
ACTION ──PRODUCES──▶ ACTUAL_RESULT
ACTUAL_RESULT ──SATISFIES|VIOLATES──▶ ACCEPTANCE
CONTRADICTION ──TRIGGERS──▶ CHALLENGE|REVISION
```

### Actor Authority Boundaries

| Actor | Allowed | Not Allowed |
|-------|---------|-------------|
| **Bro Kraken** (Human Architect) | Final authority on meaning, doctrine, evolution | — |
| **Guardian** (Architecture Guardian) | Approve/reject material transition/evolution | Fabricate evidence |
| **Executor** (OpenCode/AI) | Implement bounded mission, submit artifacts/evidence | Self-approve completion, expand scope |
| **Model** | Produce cognitive artifact, request tool/transition | Execute unrestricted tool directly |
| **Tool** | Return actual result | Interpret completion |
| **Verifier** | Evaluate acceptance independently | Rewrite executor history |
| **Human** | Provide intent/decision/authority | — |

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Runtime** | Node.js + TypeScript | Strong contracts and realtime orchestration |
| **Schemas** | JSON Schema + Zod | Protocol validation (compile-time + runtime) |
| **Testing** | Vitest | Contract and replay tests |
| **Database** | PostgreSQL *(planned)* | Factual state, events, lineage |
| **Semantic** | pgvector *(planned)* | Candidate retrieval only |
| **Events** | NATS *(planned, license verify)* | Persistent event transport |
| **Policy** | Custom typed policy / OPA *(planned)* | Authority evaluation |
| **Inference** | Ollama + llama.cpp adapters *(planned)* | Local model independence |
| **Executor** | OpenCode adapter *(planned)* | Bound coding mission |
| **Tools** | MCP / OpenAPI / custom local adapters *(planned)* | Capability-scoped |
| **Inspector** | Next.js / local web UI *(planned)* | State/evidence visualization |
| **Observability** | OpenTelemetry-compatible local stack *(planned)* | Metrics and trace |
| **Container** | Docker Engine / Podman *(planned)* | Avoid mandatory Docker Desktop |

All components must pass the **License Gate**: open-source/open-weight status, commercial use, offline capability, telemetry, account, credit card, pinned version, replacement, and rollback.

---

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** 9+ (pnpm also supported)

### Installation

```bash
git clone https://github.com/kraken-backend/r-think_framework.git
cd r-think_framework
npm install
```

### Development Commands

```bash
# Type checking (strict mode)
npm run typecheck

# Run all contract tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build
```

### Verify Everything Works

```bash
npm run typecheck && npm test && npm run build
```

Expected output: 315/315 tests passing, zero type errors, clean build.

> **Note:** The latest local commit (`68f1e24`) has not been pushed to GitHub due to an authentication issue. The remote `origin/main` is at `b9b512b`. See [GitHub Publication Status](#github-publication-status) for details.

---

## Project Structure

```
r_think/
├── LICENSE                     # AGPL-3.0-only (full official text)
├── DOCUMENTATION-LICENSE.md    # CC-BY-SA-4.0 documentation license
├── NOTICE                      # Copyright, attribution, third-party obligations
├── AUTHORS.md                  # Contributor roles and attribution
├── TRADEMARKS.md               # R-Think™ trademark reservation policy
├── CITATION.cff                # Academic citation metadata (CFF v1.2.0)
├── package.json                # Project config, scripts, dependencies
├── tsconfig.json               # TypeScript strict configuration
├── vitest.config.ts            # Test runner configuration
├── README.md                   # This file
├── TRACKER.md                  # Living project tracker
│
├── src/
│   ├── index.ts                # Public API exports
│   ├── contracts/
│   │   ├── types.ts            # Canonical enums and type definitions
│   │   └── index.ts            # TypeScript interfaces (Mission, RTP, Artifact, Transition)
│   ├── schemas/
│   │   ├── index.ts            # Zod runtime validators
│   │   ├── json-schema.ts      # JSON Schema definitions
│   │   └── validation.ts       # DERIVED policy validators
│   └── runtime/
│       ├── index.ts            # Runtime barrel exports
│       ├── rules.ts            # Transition rules, reason codes, adaptive depth, artifact gates
│       ├── state-machine.ts    # evaluateTransition, applyTransition, evaluateRetry
│       ├── artifact-registry.ts # ArtifactRegistry: register, replace, version history, validation
│       └── evidence-graph.ts   # EvidenceGraph: nodes, edges, pathfinding, cycle detection, validation
│
├── tests/
│   ├── contracts/
│   │   ├── rthink-rt-001.test.ts     # Zod validation tests (25)
│   │   ├── rthink-rt-002.test.ts     # State machine tests (66)
│   │   ├── rthink-rt-003.test.ts     # Artifact registry tests (44)
│   │   ├── rthink-rt-004.test.ts     # Evidence graph tests (140)
│   │   └── json-schema.test.ts       # JSON Schema tests (40)
│   └── fixtures/
│       ├── valid/               # Valid protocol fixtures
│       └── invalid/             # Invalid protocol fixtures (rejection test data)
│
└── docs/
    ├── pictures/
    │   ├── logo.png             # R-Think primary logo
    │   ├── rthink_flow.png      # R-Think flow diagram
    │   └── favicon_io/          # Favicon assets (7 files)
    ├── brand/
    │   └── RTHINK-BRAND-ASSET-INVENTORY.md
    ├── governance/
    │   └── RTHINK-IP-PROVENANCE.md
    ├── decisions/
    │   ├── RTHINK-RT-001_LICENSE-GATE.md
    │   ├── RTHINK-IP-001_LICENSE-ARCHITECTURE.md
    │   ├── RTHINK-RT-001-R2-C1_TYPESCRIPT-MODULE-RESOLUTION.md
    │   └── RTHINK-RT-002_STATE-MACHINE-AND-TRANSITION-RULES.md
    └── evidence/
        ├── RTHINK-RT-001-R1_EVIDENCE-MANIFEST.md
        ├── RTHINK-RT-001-R2_REPOSITORY-STATE-EVIDENCE.md
        ├── RTHINK-GIT-002_CONTROLLED-PUBLICATION-EVIDENCE.md
        └── RTHINK-RT-002_STATE-MACHINE-ACCEPTANCE-EVIDENCE.md
```

> **Local-only materials:** Local development maintains raw source materials and mission reports. These directories are intentionally excluded from the current public repository and must remain excluded from future pushes unless the Human Architect changes this policy.

---

## Current Status

### Repository State

| Dimension | Value |
|-----------|-------|
| Local HEAD | `68f1e24` |
| Remote origin/main | `b9b512b` |
| Ahead / Behind | 1 ahead, 0 behind |
| Working tree | Clean |
| Commits on main | 10 (2 authorized, 2 unauthorized, 5 controlled, 1 RT-002/003) |

### Runtime State

| Module | Status |
|--------|--------|
| Formal Contracts (enums, interfaces, schemas) | Implementation produced — ACCEPTED |
| State Machine & Transition Engine | Implementation produced — Guardian review pending |
| Artifact Registry | Implementation produced — Guardian review pending |
| Evidence Graph | Implementation produced — Guardian review pending |
| Method / Provider Router | Not started |
| Persistence & Event Store | Not started |
| Executor Integration | Not started |
| Inspector | Not started |

### Publication State

| Field | Value |
|-------|-------|
| Local commit | `68f1e24` — contains RT-002 + RT-003 implementations |
| Remote publication | BLOCKED |
| Authentication | BLOCKED — `krakenworld28` lacks push permission to `kraken-backend/r-think_framework` |
| Required action | Grant write access or use `kraken-backend` account credentials |

### Acceptance State

| Item | Status |
|------|--------|
| RT-002 implementation | Guardian review pending |
| RT-003 implementation | Guardian review pending |
| Human Architect approval | Pending |
| npm/package distribution | DEFERRED |

### Current Technical Baseline

| Dimension | Value |
|-----------|-------|
| Runtime | Node.js >= 18.0.0, ESM (`"type": "module"`) |
| TypeScript | 5.8.3 |
| Module system | `"module": "nodenext"`, `"moduleResolution": "nodenext"` |
| Canonical enums | 10 (8 original + EvidenceGraphNodeType + EvidenceGraphRelationType) |
| Zod schemas | 4 (Mission, RTP, Artifact, Transition) |
| JSON Schemas | 4 (Mission, RTP, Artifact, Transition) |
| Valid fixtures | 5 |
| Invalid fixtures | 14 |
| Contract tests | 315 — all passing |
| License Gate | All pass (MIT, Apache-2.0) |
| Module classification | PROVISIONAL-ACCEPTED |

### RTHINK-RT-001 — Implemented

| Artifact | Status |
|----------|--------|
| Repository baseline | IMPLEMENTED — ACCEPTED |
| TypeScript + Node.js workspace | Working |
| Canonical enums (8) | IMPLEMENTED — ACCEPTED |
| Zod validators (4 schemas) | IMPLEMENTED — ACCEPTED |
| JSON Schema definitions (4 schemas) | IMPLEMENTED — ACCEPTED |
| Valid fixtures (5) | Passing |
| Invalid fixtures (14) | Rejected correctly |
| Contract tests (65) | All passing |
| License Gate (6 dependencies) | All pass (MIT, Apache-2.0) |
| TypeScript strict typecheck | Passing |
| Build | Passing |

### RTHINK-RT-002 — Implementation Produced

| Artifact | Status |
|----------|--------|
| Transition rules (17) | Implementation produced |
| Reason codes (14) | Implementation produced |
| Adaptive depth config (L0–L3) | Implementation produced |
| Artifact gates (8) | Implementation produced |
| evaluateTransition() | Implementation produced |
| applyTransition() | Implementation produced |
| evaluateRetry() | Implementation produced |
| State machine tests (66) | All passing |
| Decision document | Created |
| Evidence document | Created |

### RTHINK-RT-003 — Implementation Produced

| Artifact | Status |
|----------|--------|
| ArtifactRegistry class | Implementation produced |
| registerArtifact() | Implementation produced |
| replaceArtifact() with versioning | Implementation produced |
| getArtifact(), listArtifacts(), hasArtifact(), removeArtifact() | Implementation produced |
| getVersionHistory() (immutable) | Implementation produced |
| validateArtifact() | Implementation produced |
| Schema validation (reuses ArtifactEnvelopeSchema) | Implementation produced |
| Registry tests (44) | All passing |

### RTHINK-RT-004 — Implementation Produced

| Artifact | Status |
|----------|--------|
| EvidenceGraph class | Implementation produced |
| createNode() | Implementation produced |
| connect() with relation validity | Implementation produced |
| getNode(), getEdge(), getOutgoing(), getIncoming() | Implementation produced |
| findPath() (BFS) | Implementation produced |
| hasCyclicEvolution() (DFS) | Implementation produced |
| validateGraph() | Implementation produced |
| exportGraph() | Implementation produced |
| removeNode(), removeEdge() with cascading | Implementation produced |
| Node types (11): MISSION, OBSERVATION, CLAIM, HYPOTHESIS, EXPERIMENT, EVIDENCE, DECISION, ACTION, ACTUAL_RESULT, ACCEPTANCE, EVOLUTION | Defined |
| Relation types (13): OBSERVED_AS, SUPPORTS, CONTRADICTS, GENERATES, TESTED_BY, PRODUCES, AUTHORIZES, EXECUTES, RESULTS_IN, SATISFIES, VIOLATES, SUPERSEDES, EVOLVES_TO | Defined |
| Evidence graph tests (140) | All passing |

---

## Consumer Map, Runtime Data Flow, Ownership Map

### Consumer Map

| Module | Consumers | Consumes From |
|--------|-----------|---------------|
| **Formal Contracts** (RT-001) | State Machine, Artifact Registry, Evidence Graph, Method Router, all downstream modules | Blueprint RTHINK-BP-001 |
| **State Machine** (RT-002) | Artifact Registry, Transition Engine, Evidence Graph | Formal Contracts (enums, interfaces) |
| **Artifact Registry** (RT-003) | Evidence Graph, Executor Integration, Inspector | State Machine, Formal Contracts (schemas) |
| **Evidence Graph** (RT-004) | Challenge Engine, Evolution Engine, Inspector, Method Router | Artifact Registry, Formal Contracts (types) |
| **Method Router** (RT-005) | Executor Integration, Persistence | Evidence Graph, State Machine |
| **Persistence** (RT-006) | Executor Integration, Inspector, Event Replay | Method Router, State Machine |
| **Executor Integration** (RT-007) | Inspector, Human | Persistence, Artifact Registry |
| **Inspector** (RT-008) | Human, Guardian | All modules (read-only) |

### Runtime Data Flow

```
Blueprint (RTHINK-BP-001)
  │ defines
  ▼
Formal Contracts (enums, interfaces, schemas, JSON Schema)
  │ enforce
  ▼
State Machine ←──→ Transition Engine ←──→ Adaptive Depth
  │ gate              │ evaluate            │ classify
  ▼                   ▼                    ▼
Artifact Registry ──→ Evidence Graph ──→ Method Router
  │ validate            │ link              │ select
  ▼                   ▼                    ▼
Persistence ──────→ Executor Integration ──→ Inspector
  │ store               │ execute             │ observe
  ▼                   ▼                    ▼
Event Store        Actual Result       Human / Guardian
```

### Ownership Map

| Module | Owner | Authority |
|--------|-------|-----------|
| Formal Contracts | Human Architect | Final doctrine authority |
| State Machine | Guardian | Transition rule authority |
| Artifact Registry | Executor | Schema enforcement |
| Evidence Graph | Guardian | Evidence-evidence link authority |
| Method Router | Guardian | Provider selection authority |
| Persistence | Executor | Event storage |
| Executor Integration | Human Architect | Execution scope authority |
| Inspector | Human Architect | Read-only observability |

---

## Runtime Roadmap

```
Blueprint (RTHINK-BP-001)
        │
        ▼
Formal Contracts (RT-001)
  Enums, Interfaces, Schemas, Fixtures
        │
        ▼
Runtime State Machine (RT-002)
  Transition Rules, Adaptive Depth, Artifact Gates
        │
        ▼
Artifact Registry (RT-003)
  Schema Validation, Immutable Versioning, Provenance
        │
        ▼
Evidence Graph (RT-004)
  Claims, Evidence, Contradiction, Acceptance
        ◄──────────── YOU ARE HERE
        │
        ▼
Method / Provider Router (RT-005)
  Model, Tool, Human, Experiment Selection
        │
        ▼
Persistence & Event Store (RT-006)
  PostgreSQL, Event Sourcing, Recovery
        │
        ▼
Executor Integration (RT-007)
  OpenCode Adapter, Revision Loop, Self-Approval Prevention
        │
        ▼
Inspector (RT-008)
  UI, Evidence Visualization, Process Observation
        │
        ▼
Mission Validation
  End-to-End Protocol Compliance Verification
        │
        ▼
R-Think Runtime v1
```

### Phase Completion Status

| Phase | Mission | Status |
|-------|---------|--------|
| Formal Contracts | RT-001 | Implementation produced — ACCEPTED |
| State Machine | RT-002 | Implementation produced — Guardian review pending |
| Artifact Registry | RT-003 | Implementation produced — Guardian review pending |
| Evidence Graph | RT-004 | Implementation produced — Guardian review pending |
| Method / Provider Router | RT-005 | Not started |
| Persistence & Event Store | RT-006 | Not started |
| Executor Integration | RT-007 | Not started |
| Inspector | RT-008 | Not started |
| Mission Validation | — | Not started |
| Runtime v1 | — | Not started |

---

## Development

### Adding New Schemas

1. Define types in `src/contracts/types.ts`
2. Add interface in `src/contracts/index.ts`
3. Create Zod validator in `src/schemas/index.ts`
4. Create JSON Schema in `src/schemas/json-schema.ts`
5. Add valid/invalid fixtures in `tests/fixtures/`
6. Write contract tests in `tests/contracts/`
7. Run `npm test` to verify

### Adding New Enums

Only add enum values that are explicitly defined in the blueprint (RTHINK-BP-001). Do not silently add semantic states or decision types. If a new value is needed:

1. Confirm it exists in the blueprint
2. If DERIVED, classify it as such in documentation
3. If PROVISIONAL, await Guardian confirmation

### Blueprint Traceability

Every implementation artifact must reference the relevant RTHINK-BP-001 requirement or section. Use the format:

```
// RTHINK-BP-001 §7.2: Transition Decision
```

### Commit Convention

```
<type>(<scope>): <description>

Types: feat, fix, docs, test, refactor, chore
Scopes: contracts, schemas, tests, fixtures, docs
```

---

## Founding Leadership

| Role | Person | Responsibilities |
|------|--------|-----------------|
| **Founder** | Hendri RH — Bro Kraken | Framework Creator, Human Architect, Final Doctrine Authority, Project Direction Authority |
| **Co-Founder** | Bro CG | Architecture Guardian, Engineering Coordinator, Governance Review Partner |
| **Co-Founder** | Hatmadita Ramuny | Public Relations, Community Relations, Partnership Development, External Representation |

### Origin Reference

**Alvarendra Mahdi Hendrianto (Rendra)** — 27 August 2021
The R-Think framework concept originated from the Iqra/Perhatikan principle
attributed to this origin reference.

---

## Authority

| Role | Person |
|------|--------|
| **Human Architect & Final Doctrine Authority** | Hendri RH — Bro Kraken |
| **Architecture Guardian** | Bro CG |
| **Public Relations** | Hatmadita Ramuny |
| **Primary Consumer** | CG OS |

---

## Brand & Intellectual Property

| Asset | Location |
|-------|----------|
| Primary logo | [docs/pictures/logo.png](docs/pictures/logo.png) |
| Favicon assets | [docs/pictures/favicon_io/](docs/pictures/favicon_io/) |
| Flow diagram | [docs/pictures/rthink_flow.png](docs/pictures/rthink_flow.png) |
| Brand asset inventory | [docs/brand/RTHINK-BRAND-ASSET-INVENTORY.md](docs/brand/RTHINK-BRAND-ASSET-INVENTORY.md) |
| Trademark policy | [TRADEMARKS.md](TRADEMARKS.md) |
| IP provenance | [docs/governance/RTHINK-IP-PROVENANCE.md](docs/governance/RTHINK-IP-PROVENANCE.md) |

---

## License

### Software

Source code, schemas, validators, tests, and fixtures are licensed under the
**GNU Affero General Public License v3.0 only** (AGPL-3.0-only).

See [LICENSE](LICENSE) for the full license text.

### Documentation

Framework documentation, blueprint text, diagrams, and written explanations are
licensed under **Creative Commons Attribution-ShareAlike 4.0 International**
(CC-BY-SA-4.0).

See [DOCUMENTATION-LICENSE.md](DOCUMENTATION-LICENSE.md) for details.

### Trademark

The R-Think name, R-Think™ wordmark, and R-Think logo are **not** granted
under any open license. Trademark rights are reserved separately.

See [TRADEMARKS.md](TRADEMARKS.md) for the trademark policy.

### Third-Party Dependencies

All direct dependencies are open-source:

- **zod** 3.25.67 — MIT
- **ajv** 8.20.0 — MIT
- **ajv-formats** 3.0.1 — MIT
- **typescript** 5.8.3 — Apache-2.0
- **vitest** 3.2.7 — MIT
- **@types/node** 22.15.31 — MIT

See [NOTICE](NOTICE) for complete attribution.

### Citation

```bibtex
@software{rh2026rthink,
  author = {Hendri RH},
  title = {R-Think Runtime},
  year = {2026},
  url = {https://github.com/kraken-backend/r-think_framework},
  license = {AGPL-3.0-only}
}
```

Or use [CITATION.cff](CITATION.cff) directly.

---

*Built with discipline. Governed by evidence. Evolved with authority.*
