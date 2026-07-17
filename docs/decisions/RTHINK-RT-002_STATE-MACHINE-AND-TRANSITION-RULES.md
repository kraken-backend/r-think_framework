# RTHINK-RT-002 — State Machine, Transition Engine, and Adaptive-Depth Foundation

**Decision ID:** RTHINK-RT-002
**Date:** 2026-07-17
**Status:** IMPLEMENTATION COMPLETE — LOCAL-ONLY (NO COMMIT, NO PUSH)
**Authority:** Human Architect (Bro Kraken), Guardian (Bro CG)
**Mission:** RTHINK-RT-002 — State Machine, Transition Engine, and Adaptive-Depth Foundation

---

## Context

RT-001 established the formal contracts (types, schemas, fixtures, tests) but no runtime logic existed. RT-002 implements the foundational state machine engine that evaluates transition requests against canonical rules, enforces artifact gates, applies adaptive-depth policy, and manages loops and retries — all per blueprint §6, §6.2, §6.3, §7, §7.2.

---

## Scope

### In Scope
- Transition rule table (16 rules: 7 canonical, 4 loop, 5 operational)
- Reason code enumeration (14 typed codes)
- Adaptive depth configuration (L0–L3)
- Artifact gate mapping (8 gates)
- `evaluateTransition()` — pure function, rule evaluation
- `applyTransition()` — pure function, state application
- `evaluateRetry()` — pure function, retry gating
- Rule lookup helpers, timestamp utility, type guard

### Explicitly Non-Scope (per RT-002 charter)
- Persistence, PostgreSQL, event sourcing
- API, WebSocket, CLI, SDK
- Inspector UI, provider adapters
- Full Artifact Registry, Evidence Graph
- Method Router, Challenge Engine, Evolution Engine, Policy Engine

---

## Design Decisions

### 1. Rule Version: `rt-002-v1.0`

Single version string for all transition rules in this mission. Rule versions will increment when rules change, not when the engine code changes.

### 2. 16 Transition Rules

| Category | Count | Rule IDs | Examples |
|----------|-------|----------|---------|
| CANONICAL forward | 7 | CF-01–CF-07 | OBSERVE→UNDERSTAND, DISCOVER→EVOLVE |
| Loop | 4 | LP-01–LP-04 | CONTRADICTION_DETECTED→OBSERVE, METHOD_INSUFFICIENT→CHALLENGE |
| Operational | 5 | OP-01–OP-05 | WAITING_FOR_EVIDENCE→OBSERVE, COMPLETED terminal |

### 3. 14 Reason Codes

Typed enum values for machine-readable reason codes (TRANSITION_ALLOWED, UNSUPPORTED_TRANSITION, MISSING_ARTIFACT, etc.) rather than free-form strings.

### 4. Adaptive Depth Policy

| Level | Skip Allowed | Requires | Constraints |
|-------|-------------|----------|-------------|
| L0 | Justified bounded skip | Justification text | Cannot bypass contradiction or acceptance evidence |
| L1 | Justified bounded skip | Justification text | Cannot bypass contradiction or acceptance evidence |
| L2 | No | Full canonical sequence | Challenge cannot be bypassed |
| L3 | No | Full canonical + verifier + authority | Cannot bypass any requirement |

### 5. Artifact Gates

8 gates mapped from blueprint §7 minimum exit requirements:

| From State | Required Artifacts |
|-----------|-------------------|
| OBSERVE | OBSERVATION |
| UNDERSTAND | PROBLEM_REPRESENTATION |
| QUESTION | QUESTION |
| VALIDATE | VALIDATION |
| CONNECT | RELATIONSHIP |
| CHALLENGE | CHALLENGE |
| DISCOVER | DISCOVERY + HYPOTHESIS |
| (completion) | DECISION + ACCEPTANCE_EVIDENCE |

### 6. Pure Functions — No Side Effects

All runtime functions are pure: they take input, return output, mutate nothing. State application creates a new object rather than mutating the input. This enables deterministic testing and replay.

### 7. Evidence Required for Challenge, Validate, Discover, Evolve

Transitions from VALIDATE, CHALLENGE, DISCOVER require at least one evidenceRef. This enforces the blueprint principle that critical transitions must have supporting evidence.

### 8. No New Dependencies

Zero new npm packages. Pure TypeScript implementation leveraging existing type definitions from `src/contracts/types.ts`.

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/runtime/rules.ts` | Created | Rule table, reason codes, adaptive depth config, artifact gates, helpers |
| `src/runtime/state-machine.ts` | Created | evaluateTransition, applyTransition, evaluateRetry, createTimestamp |
| `src/runtime/index.ts` | Created | Barrel export for runtime module |
| `src/index.ts` | Modified | Added `export * from "./runtime/index.js"` |
| `tests/contracts/rthink-rt-002.test.ts` | Created | 66 tests across 6 categories (14.1–14.6) |

---

## Validation

| Check | Result |
|-------|--------|
| Typecheck (`tsc --noEmit`) | PASS (exit 0) |
| Build (`tsc`) | PASS (exit 0) |
| Tests | 131/131 PASSING (25 RT-001 + 66 RT-002 + 40 JSON Schema) |
| Audit (`npm audit --omit=dev`) | 0 vulnerabilities |
| New dependencies added | NONE |

---

## Test Coverage Summary

| Category | Test Count | Coverage |
|----------|-----------|----------|
| 14.1 Canonical Forward Transitions | 28 | All 7 transitions × 4 checks |
| 14.2 Illegal Transitions | 7 | Unsupported jumps, missing artifacts, missing evidence, gate enforcement |
| 14.3 Adaptive Depth | 10 | L0/L1 skip allowed/denied, L2/L3 bypass denied, L3 verifier/authority |
| 14.4 Loops and Retries | 6 | Contradiction loops, method insufficient, changed-basis retry, blind retry |
| 14.5 State Application | 8 | ALLOW/DENY/DEFER/ESCALATE application, mismatch rejection, immutability |
| 14.6 Parity and Public API | 7 | Rule table parity, root export, determinism, helpers |
| **Total** | **66** | |

---

## Provisional Limitations

This is an initial foundation. The following are intentionally deferred:
- Persistence (event store, PostgreSQL)
- Full artifact registry with schema validation
- Evidence graph with source→claim→evidence links
- Method router and provider adapters
- Challenge engine and evolution engine
- Policy engine and authority evaluation
- Inspector API/UI
- CLI/SDK/API endpoints

---

## Future Review Triggers

1. Adding a new transition rule requires updating the rule table and reason codes
2. Changing artifact requirements requires updating artifact gates
3. Adding persistence requires event-sourced state hydration
4. Adding provider adapters requires method router integration
5. Production deployment requires security hardening and audit trail
