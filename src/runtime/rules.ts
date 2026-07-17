/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Transition Rules, Reason Codes, Adaptive Depth
// Blueprint Reference: RTHINK-BP-001 §6, §6.2, §6.3, §7, §7.2

import {
  CognitiveState,
  OperationalState,
  RuntimeState,
  MissionRiskLevel,
  AuthorityStatus,
} from "../contracts/types.js";

// ─── Rule Version ────────────────────────────────────────────────────────────

export const RULE_VERSION = "rt-002-v1.0";

// ─── Canonical Cognitive Sequence ────────────────────────────────────────────
// RTHINK-BP-001 §6.1: Canonical order

export const CANONICAL_SEQUENCE: readonly CognitiveState[] = [
  CognitiveState.OBSERVE,
  CognitiveState.UNDERSTAND,
  CognitiveState.QUESTION,
  CognitiveState.VALIDATE,
  CognitiveState.CONNECT,
  CognitiveState.CHALLENGE,
  CognitiveState.DISCOVER,
  CognitiveState.EVOLVE,
];

// ─── Reason Codes ────────────────────────────────────────────────────────────
// DERIVED: Typed machine decision codes for testability

export const ReasonCode = {
  TRANSITION_ALLOWED: "TRANSITION_ALLOWED",
  UNSUPPORTED_TRANSITION: "UNSUPPORTED_TRANSITION",
  REQUIRED_ARTIFACT_MISSING: "REQUIRED_ARTIFACT_MISSING",
  REQUIRED_EVIDENCE_MISSING: "REQUIRED_EVIDENCE_MISSING",
  ADAPTIVE_DEPTH_JUSTIFICATION_MISSING: "ADAPTIVE_DEPTH_JUSTIFICATION_MISSING",
  ADAPTIVE_DEPTH_SKIP_NOT_ALLOWED: "ADAPTIVE_DEPTH_SKIP_NOT_ALLOWED",
  CHALLENGE_REQUIRED: "CHALLENGE_REQUIRED",
  CONTRADICTION_REQUIRES_REENTRY: "CONTRADICTION_REQUIRES_REENTRY",
  VERIFIER_REQUIRED: "VERIFIER_REQUIRED",
  AUTHORITY_REQUIRED: "AUTHORITY_REQUIRED",
  BLIND_RETRY_DENIED: "BLIND_RETRY_DENIED",
  RULE_VERSION_MISMATCH: "RULE_VERSION_MISMATCH",
  MISSION_ID_MISMATCH: "MISSION_ID_MISMATCH",
  FROM_STATE_MISMATCH: "FROM_STATE_MISMATCH",
} as const;

export type ReasonCode = (typeof ReasonCode)[keyof typeof ReasonCode];

// ─── Artifact Gate Definitions ───────────────────────────────────────────────
// RTHINK-BP-001 §7: Minimum exit artifacts per cognitive state

export interface ArtifactGate {
  requiredArtifacts: string[];
  description: string;
}

export const ARTIFACT_GATES: Record<CognitiveState, ArtifactGate> = {
  [CognitiveState.OBSERVE]: {
    requiredArtifacts: ["OBSERVATION"],
    description: "Observation records + source inventory",
  },
  [CognitiveState.UNDERSTAND]: {
    requiredArtifacts: ["PROBLEM_REPRESENTATION"],
    description: "Problem representation + constraints + unknowns",
  },
  [CognitiveState.QUESTION]: {
    requiredArtifacts: ["QUESTION"],
    description: "Question/assumption register",
  },
  [CognitiveState.VALIDATE]: {
    requiredArtifacts: ["VALIDATION"],
    description: "Validation records + contradiction status",
  },
  [CognitiveState.CONNECT]: {
    requiredArtifacts: ["RELATIONSHIP"],
    description: "Relationship/impact map",
  },
  [CognitiveState.CHALLENGE]: {
    requiredArtifacts: ["CHALLENGE"],
    description: "Challenge record + alternatives/failure modes",
  },
  [CognitiveState.DISCOVER]: {
    requiredArtifacts: ["DISCOVERY", "HYPOTHESIS"],
    description: "Discovery/hypothesis + experiment design",
  },
  [CognitiveState.EVOLVE]: {
    requiredArtifacts: ["EVOLUTION"],
    description: "Versioned evolution proposal/result",
  },
};

// ─── Transition Rule ─────────────────────────────────────────────────────────

export interface TransitionRule {
  id: string;
  from: RuntimeState;
  to: RuntimeState;
  requiredArtifacts: string[];
  requiredEvidence: boolean;
  requiredAuthority: AuthorityStatus;
  requiredVerifier: boolean;
  allowedNext: RuntimeState[];
  classification: "CANONICAL" | "DERIVED" | "PROVISIONAL";
  description: string;
}

// ─── Canonical Forward Transitions ───────────────────────────────────────────
// RTHINK-BP-001 §6.1, §7: Each cognitive state to its canonical successor

const CANONICAL_FORWARD_RULES: TransitionRule[] = [
  {
    id: "CF-01",
    from: CognitiveState.OBSERVE,
    to: CognitiveState.UNDERSTAND,
    requiredArtifacts: ["OBSERVATION"],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.UNDERSTAND, CognitiveState.QUESTION],
    classification: "CANONICAL",
    description: "OBSERVE → UNDERSTAND: Observations sufficient to represent problem",
  },
  {
    id: "CF-02",
    from: CognitiveState.UNDERSTAND,
    to: CognitiveState.QUESTION,
    requiredArtifacts: ["PROBLEM_REPRESENTATION"],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.QUESTION, CognitiveState.VALIDATE],
    classification: "CANONICAL",
    description: "UNDERSTAND → QUESTION: Representation exists",
  },
  {
    id: "CF-03",
    from: CognitiveState.QUESTION,
    to: CognitiveState.VALIDATE,
    requiredArtifacts: ["QUESTION"],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.VALIDATE, CognitiveState.CONNECT],
    classification: "CANONICAL",
    description: "QUESTION → VALIDATE: Claims and validation targets defined",
  },
  {
    id: "CF-04",
    from: CognitiveState.VALIDATE,
    to: CognitiveState.CONNECT,
    requiredArtifacts: ["VALIDATION"],
    requiredEvidence: true,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.CONNECT, CognitiveState.CHALLENGE],
    classification: "CANONICAL",
    description: "VALIDATE → CONNECT: Material claims have validation status",
  },
  {
    id: "CF-05",
    from: CognitiveState.CONNECT,
    to: CognitiveState.CHALLENGE,
    requiredArtifacts: ["RELATIONSHIP"],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.CHALLENGE, CognitiveState.DISCOVER],
    classification: "CANONICAL",
    description: "CONNECT → CHALLENGE: Material/novel/high-risk or method failure",
  },
  {
    id: "CF-06",
    from: CognitiveState.CHALLENGE,
    to: CognitiveState.DISCOVER,
    requiredArtifacts: ["CHALLENGE"],
    requiredEvidence: true,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.DISCOVER, CognitiveState.EVOLVE],
    classification: "CANONICAL",
    description: "CHALLENGE → DISCOVER: Challenge produces testable possibility",
  },
  {
    id: "CF-07",
    from: CognitiveState.DISCOVER,
    to: CognitiveState.EVOLVE,
    requiredArtifacts: ["DISCOVERY", "HYPOTHESIS"],
    requiredEvidence: true,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.EVOLVE],
    classification: "CANONICAL",
    description: "DISCOVER → EVOLVE: Evidence supports change",
  },
];

// ─── Loop Transitions ────────────────────────────────────────────────────────
// RTHINK-BP-001 §6.3: Loop rules

const LOOP_TRANSITION_RULES: TransitionRule[] = [
  {
    id: "LP-01",
    from: OperationalState.CONTRADICTION_DETECTED,
    to: CognitiveState.OBSERVE,
    requiredArtifacts: [],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.OBSERVE],
    classification: "CANONICAL",
    description: "CONTRADICTION_DETECTED → OBSERVE: Reality contradicts expectation",
  },
  {
    id: "LP-02",
    from: OperationalState.CONTRADICTION_DETECTED,
    to: CognitiveState.VALIDATE,
    requiredArtifacts: [],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.VALIDATE],
    classification: "CANONICAL",
    description: "CONTRADICTION_DETECTED → VALIDATE: Re-validate with new information",
  },
  {
    id: "LP-03",
    from: OperationalState.METHOD_INSUFFICIENT,
    to: CognitiveState.CHALLENGE,
    requiredArtifacts: [],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.CHALLENGE],
    classification: "CANONICAL",
    description: "METHOD_INSUFFICIENT → CHALLENGE: Insufficient method routes to challenge",
  },
  {
    id: "LP-04",
    from: OperationalState.REVISION_REQUIRED,
    to: CognitiveState.OBSERVE,
    requiredArtifacts: [],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.OBSERVE],
    classification: "CANONICAL",
    description: "REVISION_REQUIRED → OBSERVE: Backtrack and revise approach",
  },
];

// ─── Operational Transitions ─────────────────────────────────────────────────
// DERIVED: Operational state transitions justified by blueprint

const OPERATIONAL_TRANSITION_RULES: TransitionRule[] = [
  {
    id: "OP-01",
    from: CognitiveState.OBSERVE,
    to: OperationalState.WAITING_FOR_EVIDENCE,
    requiredArtifacts: [],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.OBSERVE],
    classification: "DERIVED",
    description: "OBSERVE → WAITING_FOR_EVIDENCE: Paused until evidence available",
  },
  {
    id: "OP-02",
    from: CognitiveState.CONNECT,
    to: OperationalState.WAITING_FOR_AUTHORITY,
    requiredArtifacts: [],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.PENDING,
    requiredVerifier: false,
    allowedNext: [CognitiveState.CONNECT, CognitiveState.CHALLENGE],
    classification: "DERIVED",
    description: "CONNECT → WAITING_FOR_AUTHORITY: Human/Guardian decision needed",
  },
  {
    id: "OP-03",
    from: CognitiveState.CHALLENGE,
    to: OperationalState.EXECUTING_EXPERIMENT,
    requiredArtifacts: ["CHALLENGE"],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.CHALLENGE, CognitiveState.DISCOVER],
    classification: "DERIVED",
    description: "CHALLENGE → EXECUTING_EXPERIMENT: Running bounded experiment",
  },
  {
    id: "OP-04",
    from: CognitiveState.EVOLVE,
    to: OperationalState.COMPLETED,
    requiredArtifacts: ["EVOLUTION"],
    requiredEvidence: true,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [],
    classification: "DERIVED",
    description: "EVOLVE → COMPLETED: Acceptance evidence passed",
  },
  {
    id: "OP-05",
    from: CognitiveState.VALIDATE,
    to: OperationalState.CONTRADICTION_DETECTED,
    requiredArtifacts: ["VALIDATION"],
    requiredEvidence: true,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [
      CognitiveState.OBSERVE,
      CognitiveState.VALIDATE,
      OperationalState.METHOD_INSUFFICIENT,
    ],
    classification: "CANONICAL",
    description: "VALIDATE → CONTRADICTION_DETECTED: Expected vs actual conflict found",
  },
  {
    id: "OP-06",
    from: CognitiveState.CHALLENGE,
    to: OperationalState.METHOD_INSUFFICIENT,
    requiredArtifacts: ["CHALLENGE"],
    requiredEvidence: false,
    requiredAuthority: AuthorityStatus.NOT_REQUIRED,
    requiredVerifier: false,
    allowedNext: [CognitiveState.CHALLENGE, CognitiveState.DISCOVER],
    classification: "CANONICAL",
    description: "CHALLENGE → METHOD_INSUFFICIENT: Current method cannot proceed",
  },
];

// ─── All Rules Combined ──────────────────────────────────────────────────────

export const TRANSITION_RULES: readonly TransitionRule[] = [
  ...CANONICAL_FORWARD_RULES,
  ...LOOP_TRANSITION_RULES,
  ...OPERATIONAL_TRANSITION_RULES,
];

// ─── Adaptive Depth Configuration ────────────────────────────────────────────
// RTHINK-BP-001 §6.2: Adaptive depth levels

export interface AdaptiveDepthConfig {
  level: MissionRiskLevel;
  canSkip: boolean;
  requiresChallenge: boolean;
  requiresVerifier: boolean;
  requiresAuthority: boolean;
  description: string;
}

export const ADAPTIVE_DEPTH_CONFIG: Record<
  MissionRiskLevel,
  AdaptiveDepthConfig
> = {
  [MissionRiskLevel.L0_ROUTINE]: {
    level: MissionRiskLevel.L0_ROUTINE,
    canSkip: true,
    requiresChallenge: false,
    requiresVerifier: false,
    requiresAuthority: false,
    description:
      "Read/status/simple deterministic action. Observe–understand–act–verify lightweight.",
  },
  [MissionRiskLevel.L1_CONTROLLED]: {
    level: MissionRiskLevel.L1_CONTROLLED,
    canSkip: true,
    requiresChallenge: false,
    requiresVerifier: false,
    requiresAuthority: false,
    description: "Bounded edit/configuration. Validate inputs and verify actual result.",
  },
  [MissionRiskLevel.L2_SIGNIFICANT]: {
    level: MissionRiskLevel.L2_SIGNIFICANT,
    canSkip: false,
    requiresChallenge: true,
    requiresVerifier: false,
    requiresAuthority: false,
    description: "Feature, architecture, uncertain investigation. Full R-Think with challenge and evidence.",
  },
  [MissionRiskLevel.L3_CRITICAL]: {
    level: MissionRiskLevel.L3_CRITICAL,
    canSkip: false,
    requiresChallenge: true,
    requiresVerifier: true,
    requiresAuthority: true,
    description: "Security, deletion, protocol/blueprint/human impact. Full cycle + independent verifier + explicit authority.",
  },
};

// ─── Rule Lookup ─────────────────────────────────────────────────────────────

export function findTransitionRule(
  from: RuntimeState,
  to: RuntimeState
): TransitionRule | undefined {
  return TRANSITION_RULES.find((r) => r.from === from && r.to === to);
}

export function findRulesFrom(from: RuntimeState): TransitionRule[] {
  return TRANSITION_RULES.filter((r) => r.from === from);
}

export function isCognitiveState(state: RuntimeState): state is CognitiveState {
  return Object.values(CognitiveState).includes(state as CognitiveState);
}

export function isOperationalState(
  state: RuntimeState
): state is OperationalState {
  return Object.values(OperationalState).includes(state as OperationalState);
}
