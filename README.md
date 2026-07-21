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
  - [Ontology Inventory](#ontology-inventory-rthink-doc-ontology-001)
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

R-Think Runtime is **NOT an executor**. It governs mission process — state, transition, artifact, evidence, authority, and recovery — but never runs business logic. Business execution (methods, tools, experiments) is performed by external consumers and executors. The runtime coordinates; it does not execute.

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
| **Mission Runtime Coordinator (RT-007)** | Lifecycle, state/transition coordination, artifact/evidence flow, contradiction handling, authority waiting, replay/recovery coordination — does NOT execute business logic |
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
| **Event Store Backend** | `InMemoryEventStorageAdapter` *(process-local, NON-durable)* | Default backend; durable adapter is a future pluggable contract |
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

Expected output: 1179 tests passing (1152 backend + 27 frontend), clean frontend build.

### Inspector Frontend

```bash
# Install frontend dependencies
cd inspector-ui && npm install

# Run frontend tests
npm test

# Build production bundle
npm run build

# Start dev server (port 5173, proxies /api to localhost:3001)
npm run dev

# From root: start backend + frontend together
npm run inspector:start  # Backend on port 3001
npm run inspector:dev    # Frontend on port 5173
```

> **Note:** R-Think Runtime **v1.0.0** — all core modules (RT-001 through RT-007) are IMPLEMENTED. Inspector Backend API (RT-008B: 27 endpoints, 105 tests) and Inspector Frontend (RT-008C: React + Vite, 9 views, 27 tests) are COMPLETE. E2E Mission Validation (RT-009: 6 scenarios, 40 tests, verdict A) is COMPLETE. Total: 1152 backend + 27 frontend = **1179 tests passing**. Validation integrity restored by V1-LOCK-C1 — typecheck, root build, inspector smoke test, and flaky tests all resolved.

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
│       ├── index.ts                # Runtime barrel exports
│       ├── rules.ts                # Transition rules, reason codes, adaptive depth, artifact gates
│       ├── state-machine.ts        # evaluateTransition, applyTransition, evaluateRetry
│       ├── artifact-registry.ts    # ArtifactRegistry: register, replace, version history, validation
│       ├── evidence-graph.ts       # EvidenceGraph: nodes, edges, pathfinding, cycle detection, validation
│       ├── router.ts               # Method/Provider Router: ProviderRegistry, Router, capability/priority routing
│       ├── evidence-export.ts       # RouterDecision → EvidenceGraph export adapter (decoupled, RT-005-C1)
│       ├── event-store.ts          # EventStore: immutable append-only operational history, store-owned globalPosition, atomic batch (RT-006/RT-006-C1)
│       ├── storage-adapters.ts     # EventStorageAdapter + SnapshotStorageAdapter (InMemory + Fake), durability boundary (RT-006-C1)
│       ├── materialized-view-store.ts # InMemoryMaterializedViewStore: derived-view separation (RT-006-C1)
│       ├── persistence.ts          # Persistence: EventStore + SnapshotStorageAdapter + MaterializedViewStore composition (RT-006/RT-006-C1)
│       ├── replay.ts               # ReplayEngine: deterministic replay, 12-code validation, snapshots (RT-006/RT-006-C1)
│       └── mission-runtime-coordinator.ts  # MissionRuntimeCoordinator: orchestration layer (RT-007)
│
│   └── inspector/
│       ├── index.ts                       # Public API barrel exports (RT-008B)
│       ├── dtos.ts                        # 22 immutable DTOs + deepCopy helper (RT-008B)
│       ├── filters.ts                     # Filter types + pagination params (RT-008B)
│       ├── inspector-read-model.ts        # InspectorReadModel interface — 27 endpoints (RT-008B)
│       ├── inspector-read-model-impl.ts   # Concrete implementation — deep-copy boundary (RT-008B)
│       ├── composition-root.ts            # createInspector() DI wiring (RT-008B)
│       ├── server.ts                      # HTTP server adapter — 27 endpoints, static files (RT-008C)
│       └── demo-data.ts                   # Deterministic demo data for dev mode (RT-008C)
│
├── inspector-ui/                          # React frontend (RT-008C)
│   ├── package.json                       # React 18, Vite, React Flow, vitest
│   ├── tsconfig.json                      # TypeScript strict, allowImportingTsExtensions
│   ├── vite.config.ts                     # Dev server port 5173, API proxy to :3001
│   ├── index.html                         # Entry HTML
│   └── src/
│       ├── main.tsx                        # React entry point
│       ├── App.tsx                         # Route config — 9 views
│       ├── App.css                         # Full stylesheet
│       ├── api/client.ts                   # Typed HTTP client — 27 endpoints, zero mutations
│       ├── hooks.ts                        # React hooks — useFetch, SSE polling, data hooks
│       ├── components/
│       │   ├── Layout.tsx                  # App shell with sidebar navigation
│       │   ├── Shared.tsx                  # Loading, Empty, ErrorState, JsonViewer
│       │   └── Badges.tsx                  # StateBadge, Collapsible
│       └── views/
│           ├── MissionList.tsx             # Mission overview + state filter
│           ├── MissionDetail.tsx           # Mission detail + events + artifacts + evidence
│           ├── EventTimeline.tsx           # Event timeline + SSE polling toggle
│           ├── ArtifactList.tsx            # Artifact list + type filter
│           ├── ArtifactDetail.tsx          # Artifact detail + history
│           ├── EvidenceGraph.tsx           # React Flow graph visualization
│           ├── AuthorityView.tsx           # Authority status + contradiction tracking
│           ├── ReplayView.tsx              # Mission replay + snapshot list
│           └── HealthView.tsx              # Runtime health, stats, methods, providers
│
├── tests/
│   ├── contracts/
│   │   ├── rthink-rt-001.test.ts     # Zod validation tests (25)
│   │   ├── rthink-rt-002.test.ts     # State machine tests (66)
│   │   ├── rthink-rt-003.test.ts     # Artifact registry tests (44)
│   │   ├── rthink-rt-004.test.ts     # Evidence graph tests (140)
│   │   ├── rthink-rt-005.test.ts     # Method/Provider Router + C1 semantic tests (359)
│   │   ├── rthink-rt-006.test.ts     # Persistence & Event Store tests (249, incl. RT-006-C1 blocks)
│   │   ├── rthink-rt-007.test.ts     # MissionRuntimeCoordinator tests (84)
│   │   ├── rthink-rt-008b.test.ts    # Inspector Backend API tests (105)
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
| Local HEAD | `5100521` |
| Remote origin/main | `1aa0921` |
| Ahead / Behind | 2 ahead, 0 behind |
| Branch | main |
| Commits on main | 16 |
| Publication | V1.0.0 lock pending — this commit |

**Current state:** R-Think Runtime v1.0.0 baseline locked. Validation integrity restored by V1-LOCK-C1. 1179 tests passing. All core modules implemented. Inspector Backend + Frontend complete. E2E validation passed.

### Architecture (Corrected per BP-LOCK-002, BP-LOCK-003, BP-LOCK-004)

Blueprint is NOT a phase. Blueprint is the Architectural Constitution that governs all phases. Knowledge is necessary but not sufficient — Authority (HA's constitutional power) transforms Knowledge into Blueprint.

```
Discovery Layer (Always Active)
  Reality → Observation → Question → Hypothesis → Experiment → Evidence
      ^                                                            |
      └──── Discovery → Validation → Knowledge → Convergence ─────┘
                                              │
                                              ▼
                                    Authority (HA's Act)
                                              │
                                              ▼
                                    Blueprint (Constitution)
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                         Implementation   Domains         Consumers
                         (RT-001-007)    (Truth,         (CG OS,
                                          Purpose,        OpenCode,
                                          Authority,      Inspector,
                                          Trust)          Guardian,
                                                          Human Architect)
```

### Architecture Domains (Independent, Parallel)

| Domain | Current State | Evidence |
|--------|--------------|----------|
| TRUTH | ARTICULATED | 6 truth sources identified (GOV-002). Hierarchy not declared. |
| PURPOSE | ARTICULATED | `MissionContract.objective` exists. Enforcement absent. |
| AUTHORITY | ARTICULATED | Hierarchy declared. 5 conflicts unresolved (GOV-002). |
| TRUST | PARTIALLY ARTICULATED | Trust-adjacent controls exist. Trust model absent. |

### Architecture Maturity (Constitutional, not engineering)

| State | Definition |
|-------|-----------|
| UNFORMED | Domain exists in Reality but not in architecture |
| ARTICULATED | Domain named, defined, current state documented |
| VALIDATED | Domain matches implementation reality |
| LOCKED | Domain immutable until explicitly reopened |
| EVOLVED | Domain modified after Lock |
| RETIRED | Domain superseded by successor |

**Current maturity: ARTICULATED** (not "40% complete")

### Phase Gate Model

| Gate | Name | Purpose | Status |
|------|------|---------|--------|
| G-1 | Architecture Gate | All architectural discoveries complete before implementation | OPEN |
| G-2 | Blueprint Lock | Blueprint locked before implementation | CLOSED |
| G-3 | Implementation Gate | Implementation authorized by HA | CLOSED |
| G-4 | Verification Gate | Implementation verified by Guardian | OPEN (existing modules) |
| G-5 | Production Gate | System production-ready | CLOSED |
| G-6 | Human Decision Gate | All HA decisions made | OPEN — **8 decisions pending** |

### Human Architect Decisions Pending

| # | Decision | Why Required |
|---|----------|-------------|
| D-1 | Restore Blueprint to Version Control | 100+ references cite deleted document |
| D-2 | Declare Truth Hierarchy | 6 overlapping truth sources, no hierarchy |
| D-3 | Define Purpose Semantics | Purpose absent from runtime code |
| D-4 | Define Trust Semantics | Trust concept absent from code |
| D-5 | Authorize RT-008B | Inspector Backend API not authorized |
| D-6 | Define Blueprint Lock Criteria | No lock criteria exist |
| D-7 | Resolve README vs TRACKER Supremacy | Dual presentation authority |
| D-8 | Define Authority Conflict Resolution | 5 authority conflicts unresolved |

### Runtime State

| Module | Status |
|--------|--------|
| Formal Contracts (enums, interfaces, schemas) | IMPLEMENTED — ACCEPTED |
| State Machine & Transition Engine | IMPLEMENTED — ACCEPTED |
| Artifact Registry | IMPLEMENTED — ACCEPTED |
| Evidence Graph | IMPLEMENTED — ACCEPTED |
| Method / Provider Router | IMPLEMENTED — ACCEPTED |
| Persistence & Event Store (RT-006) | IMPLEMENTED — ACCEPTED |
| Mission Runtime Coordinator (RT-007) | IMPLEMENTED — ACCEPTED |
| Inspector Backend API (RT-008B) | COMPLETE — 27 endpoints, 105 tests |
| Inspector Frontend (RT-008C) | COMPLETE — React + Vite, 9 views, 27 tests |
| E2E Mission Validation (RT-009) | COMPLETE — 40 tests, verdict A |

### Publication State

| Field | Value |
|-------|-------|
| Version | 1.0.0 (locked by V1-LOCK) |
| Published commits | RT-001 through RT-009 implementations |
| Publication | AUTHORIZED BY DIRECT HUMAN ARCHITECT ACTION — committed to `origin/main`, V1-LOCK-C1 integrity restored |

### Acceptance State

| Item | Status |
|------|--------|
| RT-001 Formal Contracts | ACCEPTED |
| RT-002 State Machine | ACCEPTED |
| RT-003 Artifact Registry | ACCEPTED |
| RT-004 Evidence Graph | ACCEPTED |
| RT-005 Method Router | ACCEPTED |
| RT-006 Persistence & Event Store | ACCEPTED |
| RT-007 Mission Runtime Coordinator | ACCEPTED |
| RT-008A Inspector Architecture Blueprint | ACCEPTED |
| RT-008A-R1 Inspector Factual Reconciliation | ACCEPTED |
| RT-008B Inspector Backend API | COMPLETE — 27 endpoints, 105 tests |
| RT-008C Inspector Frontend | COMPLETE — 27 tests, build success |
| RT-009 E2E Mission Validation | COMPLETE — 40 tests, verdict A |
| Runtime v1.0.0 Lock | LOCKED — V1-LOCK-C1 integrity restored |

### Ontology Inventory (RTHINK-DOC-ONTOLOGY-001, corrected by C2)

> **Audited:** 2026-07-20 | **Status:** COMPLETE — C1 meta-audit produced (NOT Guardian-accepted); C2 corrections produced (GUARDIAN REVIEW PENDING) | **Reports:** `docs/reports/20260720_1759_RTHINK-DOC-ONTOLOGY-001_...` and `docs/reports/20260720_2000_RTHINK-DOC-ONTOLOGY-001-C2_...`

**Implementation Ontology vs Doctrine:** The inventory below describes what the code currently implements. It does NOT constitute canonical doctrine. The authoritative blueprint (RTHINK-BP-001) is missing from version control; full doctrinal adequacy cannot be verified. Corrected per ONTOLOGY-001-C2.

#### Implemented Entities (Type + Code + Tests)

| Entity | Location | Type |
|--------|----------|------|
| CognitiveState (8 states) | `src/contracts/types.ts` | OBSERVE→UNDERSTAND→QUESTION→VALIDATE→CONNECT→CHALLENGE→DISCOVER→EVOLVE |
| OperationalState (12 states) | `src/contracts/types.ts` | WAITING_FOR_EVIDENCE, WAITING_FOR_AUTHORITY, etc. |
| ArtifactType (12 types) | `src/contracts/types.ts` | MISSION_CONTRACT, OBSERVATION, CLAIM, HYPOTHESIS, etc. |
| EvidenceGraphNodeType (11) | `src/contracts/types.ts` | MISSION, OBSERVATION, CLAIM, HYPOTHESIS, EVIDENCE, etc. |
| EvidenceGraphRelationType (13) | `src/contracts/types.ts` | SUPPORTS, CONTRADICTS, GENERATES, TESTED_BY, etc. |
| AuthorityStatus (5) | `src/contracts/types.ts` | NOT_REQUIRED, PENDING, GRANTED, DENIED, ESCALATED |
| ActorRole (7) | `src/contracts/types.ts` | ENGINEER, MODEL, TOOL, VERIFIER, HUMAN, GUARDIAN, EXECUTOR |
| MissionRiskLevel (4) | `src/contracts/types.ts` | L0_ROUTINE, L1_CONTROLLED, L2_SIGNIFICANT, L3_CRITICAL |
| StateMachine | `src/runtime/state-machine.ts` | evaluateTransition, applyTransition |
| ArtifactRegistry | `src/runtime/artifact-registry.ts` | registerArtifact, getArtifact, versionHistory |
| EvidenceGraph | `src/runtime/evidence-graph.ts` | createNode, connect, validate, export |
| Router | `src/runtime/router.ts` | registerMethod, resolve, route, explainDecision |
| Persistence | `src/runtime/persistence.ts` | EventStore wrapper |
| ReplayEngine | `src/runtime/replay.ts` | replayMission, createSnapshot |
| MissionRuntimeCoordinator | `src/runtime/mission-runtime-coordinator.ts` | Full orchestration layer |

#### Absent Entities (Prose/Documentation Only — Not in Code)

| Entity | Status | Evidence |
|--------|--------|----------|
| **Purpose** / PurposeContinuity | ABSENT | Zero `.ts` occurrences. `MissionContract.objective` exists but is not `purpose`. No drift detection. |
| **PurposeHash** | ABSENT | Zero occurrences anywhere in codebase |
| **Trust** / TrustLevel | ABSENT | Zero `.ts` occurrences. Trust-adjacent controls exist (AuthorityStatus = permission/approval; ADAPTIVE_DEPTH_CONFIG = risk/verification), but no trust entity, score, lifecycle, accumulation, degradation, or trust-based delegation. |
| **Truth** / TruthSource | ABSENT | Zero `.ts` occurrences (1 incidental test string). Evidence graph stores SUPPORTS/CONTRADICTS relations but no truth computation. |
| **Knowledge** / KnowledgeState | ABSENT | Zero `.ts` occurrences. No accumulation mechanism. |
| **Reality** / RealityModel | ABSENT | 5 prose-only occurrences in `.md` files. OBSERVE is the cognitive entry state; no formal Reality model. |
| **MissionState** (as interface) | ABSENT | No `interface MissionState`. `MissionCoordinatorState` implements the concept under a different name with 9 fields. |
| **methodHistory** / **methodSummary** | ABSENT | Zero occurrences. |
| **maxDepth** | ABSENT | `ADAPTIVE_DEPTH_CONFIG` exists; no `maxDepth` field. |
| **consumerBlueprintRefs** (runtime) | ABSENT | In `MissionContract` but not in `MissionCoordinatorState`. |

#### Canonical Flow Status

**CORRECTLY IMPLEMENTED.** 8 cognitive states, 7 canonical forward transitions, 4 loop rules, 6 operational transitions. 1007 tests passing. See full audit report for details.

#### Semantic Boundary Notes (Corrected per C2)

| Concept | Current Status | Boundary |
|---------|---------------|----------|
| Authority | **Permission/approval model** — `AuthorityStatus` + `checkCriticalAuthority` implement permission gates | Distinct from trust |
| Adaptive Depth | **Risk/verification model** — `ADAPTIVE_DEPTH_CONFIG` encodes verification requirements by mission risk level | Distinct from trust |
| Trust | **Unresolved ontology concept** — no explicit trust entity, score, lifecycle, or behavior in code | May be defined by Human Architect |
| OBSERVE | **Cognitive entry state** — the mandatory first state of the cognitive cycle | Distinct from Reality |
| OBSERVATION artifact | **Runtime entry mechanism** — recorded observations enter the system through this artifact | Distinct from Reality model |
| Reality | **No formal model** — no Reality type, source fidelity contract, or observation-to-reality comparison | May be defined by Human Architect |

#### RT-008B Status

**COMPLETE.** Inspector Backend API implemented: 27 endpoints (26 GET + 1 SSE), 22 immutable DTOs, 105 tests, zero regressions. Frontend (RT-008C) COMPLETE — 27 tests, build success. E2E Validation (RT-009) COMPLETE — 40 tests, verdict A. Total: 1152 backend + 27 frontend = **1179 tests passing**. Validation integrity restored by V1-LOCK-C1.

### Current Technical Baseline

| Dimension | Value |
|-----------|-------|
| Version | 1.0.0 |
| Runtime | Node.js >= 18.0.0, ESM (`"type": "module"`) |
| TypeScript | 5.8.3 |
| Module system | `"module": "nodenext"`, `"moduleResolution": "nodenext"` |
| Canonical enum types | 15 |
| Total enum members | 135 across all 15 enum types |
| RuntimeEventType enum members | 19 |
| AggregateType enum members | 12 |
| Router decision outcomes | 4 |
| Rejection reason codes | 9 |
| Event schema version | `rt-006-v1.0` |
| Replay validation issue codes | 12 |
| Zod schemas (contract-level) | 4 (20 total exported) |
| JSON Schemas | 4 |
| Valid fixtures | 5 |
| Invalid fixtures | 13 |
| Backend source files | 27 (13 runtime + 8 inspector + 6 contracts/schemas) |
| Backend test files | 10 |
| Backend tests | 1152 — all passing |
| Frontend source files | 15+ (React + Vite + TypeScript) |
| Frontend tests | 27 — all passing |
| **Total tests** | **1179** |
| Inspector endpoints | 27 (26 GET + 1 SSE) |
| Inspector DTOs | 22 immutable |
| License Gate | All pass (MIT, Apache-2.0) |
| npm audit | 0 vulnerabilities |
| Pre-existing typecheck issues | `demo-data.ts` (unused imports, missing contract fields), `server.ts` (unused port, filter type mismatch) |

### RTHINK-RT-001 — Implemented

| Artifact | Status |
|----------|--------|
| Repository baseline | IMPLEMENTED — ACCEPTED |
| TypeScript + Node.js workspace | Working |
| Canonical enums (8 at RT-001; 15 current) | IMPLEMENTED — ACCEPTED |
| Zod validators (4 schemas at RT-001; 20 current) | IMPLEMENTED — ACCEPTED |
| JSON Schema definitions (4 schemas) | IMPLEMENTED — ACCEPTED |
| Valid fixtures (5) | Passing |
| Invalid fixtures (13) | Rejected correctly |
| Contract tests (25 at RT-001; 1152 current) | All passing |
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

### RTHINK-RT-005 — Implementation Produced (C1 Reconciled)

| Artifact | Status |
|----------|--------|
| `ProviderRegistry` class | Implementation produced |
| `Router` class | Implementation produced |
| register / unregister / enable / disable | Implementation produced |
| findByCapability() / findByMethod() / lookup() / list() | Implementation produced |
| registerMethod() / unregisterMethod() / getMethod() / listMethods() | Implementation produced |
| validateRequest() | Implementation produced |
| resolve() — explicit stages: capability eval → availability filter → constraint apply → capable filter → lexicographic comparator | Implementation produced (C1) |
| route() — validate + resolve | Implementation produced |
| explainDecision() — full explainability (Selection evaluation) | Implementation produced |
| listCapabilities() / exportRegistry() / getRegistry() | Implementation produced |
| `RejectionReasonCode` (9 typed codes) | Added in C1 |
| `evidence-export.ts` — RouterDecision → EvidenceGraph adapter (decoupled) | Added in C1 |
| Routing stages: Capability Completeness → Version Compliance → Runtime Availability → Constraint Apply → Lexicographic Selection | Defined (C1) |
| Lexicographic comparator: version-mismatch → method-supported → availability → preferred → priority → registration → id | Defined (C1) |
| Priority score (display only): `capabilityScore*1000 + methodScore*100 + availabilityScore*10 + priorityScore` | Defined (C1) |
| Decision outcomes (4): SELECTED, NO_MATCH, ALL_UNAVAILABLE, REQUEST_INVALID | Defined (C1 corrected from 3) |
| Provider statuses (4): AVAILABLE, UNAVAILABLE, DISABLED, ERROR | Defined |
| `minVersion` is a HARD requirement: missing → `CAPABILITY_VERSION_MISSING`, below → `CAPABILITY_VERSION_BELOW_MINIMUM`; both reject the provider | Defined (C1) |
| Excluded providers recorded in `rejectedProviders` with `EXCLUDED_BY_REQUEST_CONSTRAINT`; exhaustion → NO_MATCH (never ALL_UNAVAILABLE) | Defined (C1) |
| `ALL_UNAVAILABLE` only when providers exist but are runtime-blocked (DISABLED/UNAVAILABLE/ERROR) | Defined (C1) |
| Router does NOT import the EvidenceGraph runtime class (decoupled via adapter) | Enforced (C1) |
| Shared registry pattern (two routers, one registry) | Implementation produced |
| Generic router (no business-specific logic) | Enforced |
| Router tests (359) + C1 semantic tests | All passing (674 at RT-005-C1; 923 current suite) |

### RTHINK-RT-006 — Implementation Produced

| Artifact | Status |
|----------|--------|
| `EventStore` class | Implementation produced |
| `appendEvent()` / `appendEvents()` | Append-only, per-aggregate contiguous sequence enforcement (1, 2, 3…), duplicate eventId / sequence / bad-field rejection |
| `loadEvent()` / `loadMission()` / `loadAggregate()` | Point + aggregate + mission reads (deep-copied) |
| `stream()` / `streamMission()` / `streamAggregate()` | Deterministic ordered reads (sequence → timestamp → eventId) |
| `count()` / `countMission()` / `countAggregate()` | Event counts |
| `export()` | Full immutable export |
| Immutable by design | Events never mutated; loaded copies are independent of stored state |
| `Persistence` class | Implementation produced (composes EventStore + materialized record namespace) |
| `append()` / `appendBatch()` | Delegate to EventStore (canonical event log) |
| `load()` / `exists()` / `remove()` / `list()` / `clear()` / `count()` | Current-state record namespace (optimization only) |
| `putRecord()` | Explicit materialized-view writer; never appends an event |
| `ReplayEngine` class | Implementation produced |
| `validateReplay()` | 12 issue codes: MISSING_SEQUENCE, DUPLICATE_SEQUENCE, INVALID_AGGREGATE, INVALID_SCHEMA_VERSION, INVALID_ORDERING, ORPHAN_EVENT, INVALID_CAUSATION_CHAIN, MISSING_CAUSATION_ROOT, DUPLICATE_GLOBAL_POSITION, MISSING_GLOBAL_POSITION, INVALID_GLOBAL_POSITION_ORDER, ATOMIC_BATCH_REJECTED |
| `EventStorageAdapter` / `SnapshotStorageAdapter` | Explicit durability boundary — `EventStore` depends on the adapter contract, NOT undocumented in-memory Maps; default `InMemoryEventStorageAdapter` is process-local and NON-durable (PostgreSQL is a future pluggable adapter) |
| `globalPosition` | Store-wide monotonic ordering assigned by the EventStore on append; GLOBAL order (`stream`/`export`/`replayMission`) is distinct from AGGREGATE order (`sequence` → `timestamp` → `eventId`, used by `replayAggregate`) |
| `replayMission()` / `replayAggregate()` / `replayAggregateUntil()` / `replayAggregateFrom()` / `replayAggregateRange()` | Deterministic folds; default generic reducer + custom `StateReducer` |
| Snapshots (optimization only) | `createSnapshot()` / `loadSnapshot()` / `listSnapshots()` / `deleteSnapshot()` / `replayFromSnapshot()` — result equals full replay |
| `EventStore`, `Persistence`, `ReplayEngine` | Generic — no OCR/OpenAI/Claude/Gemini/KDAP/DIP/business logic; no EvidenceGraph coupling (decoupled verified by tests) |
| RuntimeEventType enum members | 19 |
| AggregateType enum members | 12 |
| Event schema version | `rt-006-v1.0` |
| Contract test breakdown | 25 (RT-001) + 66 (RT-002) + 44 (RT-003) + 140 (RT-004) + 359 (RT-005) + 249 (RT-006) + 40 (JSON Schema) + 84 (RT-007) + 105 (RT-008B) + 40 (RT-009) = 1152 backend tests + 27 frontend = **1179 total** |
| Persistence & Event Store tests (249) | All passing (part of 1007 total) |
| Persistence & Event Store (RT-006-C1) | New test block 18.21–18.28 added: globalPosition, atomic batch, storage adapters, materialized views, typed authority, replay ordering/validation codes, honest backend naming |

---

## Consumer Map, Runtime Data Flow, Ownership Map

### Consumer Map

| Module | Consumers | Consumes From |
|--------|-----------|---------------|
| **Formal Contracts** (RT-001) | State Machine, Artifact Registry, Evidence Graph, Method Router, all downstream modules | Blueprint RTHINK-BP-001 |
| **State Machine** (RT-002) | Artifact Registry, Transition Engine, Evidence Graph | Formal Contracts (enums, interfaces) |
| **Artifact Registry** (RT-003) | Evidence Graph, Mission Runtime Coordinator, Inspector | State Machine, Formal Contracts (schemas) |
| **Evidence Graph** (RT-004) | Challenge Engine, Evolution Engine, Inspector, Evidence Export Adapter, Mission Runtime Coordinator | Artifact Registry, Formal Contracts (types) |
| **Method Router** (RT-005) | Mission Runtime Coordinator, Persistence, Evidence Export Adapter | Formal Contracts (enums, interfaces), ProviderRegistry, Method Registry, ExecutionConstraints |
| **Evidence Export Adapter** (RT-005-C1) | Coordinator → Evidence Graph | RouterDecision, Formal Contracts (EvidenceGraph enums) |
| **Persistence / Event Store** (RT-006) | Mission Runtime Coordinator, Inspector, Replay Engine, Event Replay | Method Router, State Machine, Formal Contracts (RuntimeEvent) |
| **Replay Engine** (RT-006) | Persistence, Inspector, Recovery | EventStore |
| **Mission Runtime Coordinator** (RT-007) | Inspector, External Consumers | State Machine, Artifact Registry, Evidence Graph, Method Router, Persistence, Replay Engine | Persistence, Formal Contracts (RuntimeEvent) |
| **Inspector** (RT-008A/RT-008A-R1/RT-008B/RT-008C) | Human, Guardian | All modules (read-only) — Backend API + Frontend COMPLETE |

### Runtime Data Flow

```
External Consumers (CG OS, OpenCode executor, Tools, Human / Guardian)
        │  submit artifacts / evidence / transition requests / authority
        ▼
Mission Runtime Coordinator (RT-007)
   · mission lifecycle          · state coordination
   · transition orchestration   · artifact flow
   · evidence flow              · contradiction handling
   · authority waiting          · replay coordination
   · recovery coordination
        │  coordinates — does NOT execute business logic
        ▼
Decoupled Runtime Modules (existing)
   State Machine · Artifact Registry · Method Router ·
   Evidence Export Adapter · Evidence Graph ·
   Persistence / Event Store · Replay Engine
        │
        ▼
Inspector (RT-008A/RT-008A-R1/RT-008B/RT-008C, read-only observatory — COMPLETE)

Coordination model: the Mission Runtime Coordinator wires the existing
decoupled runtime modules together at mission scope. It governs flow and
enforces gates; it does NOT run business logic. Business execution (running
methods, tools, experiments) is performed by the external Executor/consumer.
The Method Router produces a RouterDecision and does NOT consume the Evidence
Graph directly; linkage flows through the decoupled Evidence Export Adapter
into the Evidence Graph.
```

### Ownership Map

| Module | Runtime Owner | Guardian | Executor | Authority |
|--------|--------------|----------|----------|-----------|
| Formal Contracts | R-Think Runtime | Bro CG | OpenCode Local | Final doctrine authority (Human Architect) |
| State Machine | R-Think Runtime | Bro CG | OpenCode Local | Transition rule authority |
| Artifact Registry | R-Think Runtime | Bro CG | OpenCode Local | Schema enforcement |
| Evidence Graph | R-Think Runtime | Bro CG | OpenCode Local | Evidence-evidence link authority |
| Method Router | R-Think Runtime | Bro CG | OpenCode Local | Provider selection authority |
| Evidence Export Adapter | R-Think Runtime | Bro CG | OpenCode Local | Router→EvidenceGraph mapping authority (decoupled) |
| Persistence / Event Store | R-Think Runtime | Bro CG | OpenCode Local | Operational history integrity |
| Replay Engine | R-Think Runtime | Bro CG | OpenCode Local | Deterministic reconstruction |
| Event Storage Adapter | R-Think Runtime | Bro CG | OpenCode Local | Storage boundary compliance |
| Snapshot Storage Adapter | R-Think Runtime | Bro CG | OpenCode Local | Snapshot integrity |
| Materialized View Store | R-Think Runtime | Bro CG | OpenCode Local | Derived-state storage only |
| Mission Runtime Coordinator | R-Think Runtime | Bro CG | OpenCode Local | Mission lifecycle/state/transition coordination authority (Human Architect) |
| Inspector | R-Think Runtime | Bro CG | OpenCode Local | Read-only observability |

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
         │
         ▼
Method / Provider Router (RT-005)
   Model, Tool, Human, Experiment Selection
         │
         ▼
Persistence & Event Store (RT-006)
   Immutable Event Log, Replay, Snapshots, Recovery
         │
         ▼
Mission Runtime Coordinator (RT-007)
   Lifecycle, state/transition coordination, artifact/evidence flow,
   contradiction handling, authority waiting, replay/recovery coordination
           ◄──────────── V1.0.0 LOCKED
         │
         ▼
Inspector Backend API (RT-008B)
  Read-Only API, SSE Stream — COMPLETE (27 endpoints, 105 tests)
         │
         ▼
Inspector Frontend (RT-008C)
  React + Vite, 9 views, 27 tests — COMPLETE
         │
         ▼
E2E Mission Validation (RT-009)
  6 scenarios, 40 tests, verdict A — COMPLETE
         ◄──────────── V1.0.0 LOCKED
```

### Phase Completion Status

| Phase | Mission | Status |
|-------|---------|--------|
| Formal Contracts | RT-001 | ACCEPTED |
| State Machine | RT-002 | ACCEPTED |
| Artifact Registry | RT-003 | ACCEPTED |
| Evidence Graph | RT-004 | ACCEPTED |
| Method / Provider Router | RT-005 | ACCEPTED |
| Persistence & Event Store | RT-006 | ACCEPTED |
| Mission Runtime Coordinator | RT-007 | ACCEPTED |
| Inspector Blueprint | RT-008A | ACCEPTED |
| Inspector Factual Reconciliation | RT-008A-R1 | ACCEPTED |
| Inspector Backend API | RT-008B | COMPLETE |
| Inspector Frontend | RT-008C | COMPLETE |
| E2E Mission Validation | RT-009 | COMPLETE |
| **Runtime v1.0.0 Lock** | **V1-LOCK** | **LOCKED — V1-LOCK-C1 integrity restored** |

---

## Governance

### Report Policy

- **Every distinct task or mission ID requires a dedicated report.** Appending a parent mission report does not satisfy the report obligation for a new task or mission ID unless the Human Architect explicitly defines the work as continuation of the exact same mission ID.
- **A gitignored report remains mandatory as local governance evidence.** Being excluded from version control does not remove the reporting obligation. Reports must exist locally and be inspected before a task is considered complete.
- **The Three-Artifact Law (README + TRACKER + Report) is absolute.** No exception exists for acceptance tasks, documentation tasks, finalization tasks, publication gates, local commits, or no-code missions.

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
