/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Canonical Types
// Blueprint Reference: RTHINK-BP-001 Sections 7, 7.1, 7.2, 11, 12, Appendix A

// ─── Cognitive States (Primary) ─────────────────────────────────────────────
// RTHINK-BP-001 §7: State Machine dan Transition Protocol
// The canonical R-Think sequence: Observe → Understand → Question → Validate
//   → Connect → Challenge → Discover → Evolve

export const CognitiveState = {
  OBSERVE: "OBSERVE",
  UNDERSTAND: "UNDERSTAND",
  QUESTION: "QUESTION",
  VALIDATE: "VALIDATE",
  CONNECT: "CONNECT",
  CHALLENGE: "CHALLENGE",
  DISCOVER: "DISCOVER",
  EVOLVE: "EVOLVE",
} as const;

export type CognitiveState = (typeof CognitiveState)[keyof typeof CognitiveState];

export const PRIMARY_COGNITIVE_STATES: readonly CognitiveState[] = [
  CognitiveState.OBSERVE,
  CognitiveState.UNDERSTAND,
  CognitiveState.QUESTION,
  CognitiveState.VALIDATE,
  CognitiveState.CONNECT,
  CognitiveState.CHALLENGE,
  CognitiveState.DISCOVER,
  CognitiveState.EVOLVE,
];

// ─── Operational States ──────────────────────────────────────────────────────
// RTHINK-BP-001 §7.1: Operational states

export const OperationalState = {
  WAITING_FOR_EVIDENCE: "WAITING_FOR_EVIDENCE",
  WAITING_FOR_AUTHORITY: "WAITING_FOR_AUTHORITY",
  EXECUTING_METHOD: "EXECUTING_METHOD",
  EXECUTING_EXPERIMENT: "EXECUTING_EXPERIMENT",
  CONTRADICTION_DETECTED: "CONTRADICTION_DETECTED",
  METHOD_INSUFFICIENT: "METHOD_INSUFFICIENT",
  REVISION_REQUIRED: "REVISION_REQUIRED",
  COMPLETED: "COMPLETED",
  PARTIAL: "PARTIAL",
  FAILED: "FAILED",
  BLOCKED: "BLOCKED",
  INVALID: "INVALID",
} as const;

export type OperationalState =
  (typeof OperationalState)[keyof typeof OperationalState];

// Combined state type for transitions
export type RuntimeState = CognitiveState | OperationalState;

// ─── Transition Decisions ────────────────────────────────────────────────────
// RTHINK-BP-001 §7.2: Transition decision

export const TransitionDecisionType = {
  ALLOW: "ALLOW",
  DENY: "DENY",
  DEFER: "DEFER",
  ESCALATE: "ESCALATE",
} as const;

export type TransitionDecisionType =
  (typeof TransitionDecisionType)[keyof typeof TransitionDecisionType];

// ─── RTP Message Types ──────────────────────────────────────────────────────
// RTHINK-BP-001 §12: R-Think Protocol (RTP)

export const RtpMessageType = {
  MISSION_CREATED: "MISSION_CREATED",
  STATE_ENTERED: "STATE_ENTERED",
  ARTIFACT_SUBMITTED: "ARTIFACT_SUBMITTED",
  EVIDENCE_SUBMISSION: "EVIDENCE_SUBMISSION",
  TRANSITION_REQUESTED: "TRANSITION_REQUESTED",
  TRANSITION_DECIDED: "TRANSITION_DECIDED",
  AUTHORITY_REQUESTED: "AUTHORITY_REQUESTED",
  ACTION_EXECUTED: "ACTION_EXECUTED",
  CONTRADICTION_RECORDED: "CONTRADICTION_RECORDED",
  EVOLUTION_PROPOSED: "EVOLUTION_PROPOSED",
  MISSION_TERMINATED: "MISSION_TERMINATED",
} as const;

export type RtpMessageType =
  (typeof RtpMessageType)[keyof typeof RtpMessageType];

// ─── Mission Risk/Novelty Levels ────────────────────────────────────────────
// RTHINK-BP-001 §6.2: Adaptive depth

export const MissionRiskLevel = {
  L0_ROUTINE: "L0_ROUTINE",
  L1_CONTROLLED: "L1_CONTROLLED",
  L2_SIGNIFICANT: "L2_SIGNIFICANT",
  L3_CRITICAL: "L3_CRITICAL",
} as const;

export type MissionRiskLevel =
  (typeof MissionRiskLevel)[keyof typeof MissionRiskLevel];

// ─── Actor Roles ────────────────────────────────────────────────────────────
// RTHINK-BP-001 §17: Actor Authority Boundaries

export const ActorRole = {
  ENGINEER: "ENGINEER",
  MODEL: "MODEL",
  TOOL: "TOOL",
  VERIFIER: "VERIFIER",
  HUMAN: "HUMAN",
  GUARDIAN: "GUARDIAN",
  EXECUTOR: "EXECUTOR",
} as const;

export type ActorRole = (typeof ActorRole)[keyof typeof ActorRole];

// ─── Artifact Types ─────────────────────────────────────────────────────────
// RTHINK-BP-001 §8: Cognitive Artifact Standard

export const ArtifactType = {
  MISSION_CONTRACT: "MISSION_CONTRACT",
  OBSERVATION: "OBSERVATION",
  PROBLEM_REPRESENTATION: "PROBLEM_REPRESENTATION",
  QUESTION: "QUESTION",
  CLAIM: "CLAIM",
  HYPOTHESIS: "HYPOTHESIS",
  VALIDATION: "VALIDATION",
  RELATIONSHIP: "RELATIONSHIP",
  CHALLENGE: "CHALLENGE",
  DISCOVERY: "DISCOVERY",
  DECISION: "DECISION",
  EVOLUTION: "EVOLUTION",
} as const;

export type ArtifactType = (typeof ArtifactType)[keyof typeof ArtifactType];

// ─── RTP Version ────────────────────────────────────────────────────────────
// RTHINK-BP-001 §12: Protocol version

export const SUPPORTED_RTP_VERSIONS = ["1.0"] as const;
export type RtpVersion = (typeof SUPPORTED_RTP_VERSIONS)[number];

export function isSupportedRtpVersion(
  version: string
): version is RtpVersion {
  return (SUPPORTED_RTP_VERSIONS as readonly string[]).includes(version);
}

// ─── Authority Status ───────────────────────────────────────────────────────
// RTHINK-BP-001 §17, Appendix A

export const AuthorityStatus = {
  NOT_REQUIRED: "NOT_REQUIRED",
  PENDING: "PENDING",
  GRANTED: "GRANTED",
  DENIED: "DENIED",
  ESCALATED: "ESCALATED",
} as const;

export type AuthorityStatus =
  (typeof AuthorityStatus)[keyof typeof AuthorityStatus];

// ─── Evidence Graph Node Types ──────────────────────────────────────────────
// RTHINK-BP-001 §9: Evidence Graph — node types

export const EvidenceGraphNodeType = {
  MISSION: "MISSION",
  OBSERVATION: "OBSERVATION",
  CLAIM: "CLAIM",
  HYPOTHESIS: "HYPOTHESIS",
  EXPERIMENT: "EXPERIMENT",
  EVIDENCE: "EVIDENCE",
  DECISION: "DECISION",
  ACTION: "ACTION",
  ACTUAL_RESULT: "ACTUAL_RESULT",
  ACCEPTANCE: "ACCEPTANCE",
  EVOLUTION: "EVOLUTION",
} as const;

export type EvidenceGraphNodeType =
  (typeof EvidenceGraphNodeType)[keyof typeof EvidenceGraphNodeType];

// ─── Evidence Graph Relation Types ──────────────────────────────────────────
// RTHINK-BP-001 §9: Evidence Graph — typed relationships

export const EvidenceGraphRelationType = {
  OBSERVED_AS: "OBSERVED_AS",
  SUPPORTS: "SUPPORTS",
  CONTRADICTS: "CONTRADICTS",
  GENERATES: "GENERATES",
  TESTED_BY: "TESTED_BY",
  PRODUCES: "PRODUCES",
  AUTHORIZES: "AUTHORIZES",
  EXECUTES: "EXECUTES",
  RESULTS_IN: "RESULTS_IN",
  SATISFIES: "SATISFIES",
  VIOLATES: "VIOLATES",
  SUPERSEDES: "SUPERSEDES",
  EVOLVES_TO: "EVOLVES_TO",
} as const;

export type EvidenceGraphRelationType =
  (typeof EvidenceGraphRelationType)[keyof typeof EvidenceGraphRelationType];

// ─── Provider Status ────────────────────────────────────────────────────────
// RTHINK-BP-001: Method/Provider Router — provider lifecycle states

export const ProviderStatus = {
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
  DISABLED: "DISABLED",
  ERROR: "ERROR",
} as const;

export type ProviderStatus =
  (typeof ProviderStatus)[keyof typeof ProviderStatus];

// ─── Router Decision Outcome ────────────────────────────────────────────────
// RTHINK-BP-001: Method/Provider Router — routing decision outcomes

export const RouterDecisionOutcome = {
  SELECTED: "SELECTED",
  NO_MATCH: "NO_MATCH",
  ALL_UNAVAILABLE: "ALL_UNAVAILABLE",
  REQUEST_INVALID: "REQUEST_INVALID",
} as const;

export type RouterDecisionOutcome =
  (typeof RouterDecisionOutcome)[keyof typeof RouterDecisionOutcome];

// ─── Rejection Reason Codes ──────────────────────────────────────────────────
// RTHINK-BP-001: Method/Provider Router — typed rejection reasons

export const RejectionReasonCode = {
  STATUS_DISABLED: "STATUS_DISABLED",
  STATUS_UNAVAILABLE: "STATUS_UNAVAILABLE",
  STATUS_ERROR: "STATUS_ERROR",
  METHOD_NOT_SUPPORTED: "METHOD_NOT_SUPPORTED",
  REQUIRED_CAPABILITY_MISSING: "REQUIRED_CAPABILITY_MISSING",
  CAPABILITY_VERSION_MISSING: "CAPABILITY_VERSION_MISSING",
  CAPABILITY_VERSION_BELOW_MINIMUM: "CAPABILITY_VERSION_BELOW_MINIMUM",
  EXCLUDED_BY_REQUEST_CONSTRAINT: "EXCLUDED_BY_REQUEST_CONSTRAINT",
  LOWER_SELECTION_PRIORITY: "LOWER_SELECTION_PRIORITY",
} as const;

export type RejectionReasonCode =
  (typeof RejectionReasonCode)[keyof typeof RejectionReasonCode];

// ─── Runtime Event Types ──────────────────────────────────────────────────────
// RTHINK-BP-001 §19: Persistence & Event Store — canonical runtime event types
// These are generic operational events. No business/provider-specific values.

export const RuntimeEventType = {
  MISSION_CREATED: "MISSION_CREATED",
  MISSION_UPDATED: "MISSION_UPDATED",
  STATE_CHANGED: "STATE_CHANGED",
  ARTIFACT_REGISTERED: "ARTIFACT_REGISTERED",
  ARTIFACT_REPLACED: "ARTIFACT_REPLACED",
  ROUTER_DECISION: "ROUTER_DECISION",
  EXECUTION_STARTED: "EXECUTION_STARTED",
  EXECUTION_COMPLETED: "EXECUTION_COMPLETED",
  EXECUTION_FAILED: "EXECUTION_FAILED",
  EVIDENCE_CREATED: "EVIDENCE_CREATED",
  CONTRADICTION_DETECTED: "CONTRADICTION_DETECTED",
  CHALLENGE_STARTED: "CHALLENGE_STARTED",
  CHALLENGE_COMPLETED: "CHALLENGE_COMPLETED",
  DISCOVERY_CREATED: "DISCOVERY_CREATED",
  EVOLUTION_CREATED: "EVOLUTION_CREATED",
  AUTHORITY_GRANTED: "AUTHORITY_GRANTED",
  AUTHORITY_DENIED: "AUTHORITY_DENIED",
  RECOVERY_STARTED: "RECOVERY_STARTED",
  RECOVERY_COMPLETED: "RECOVERY_COMPLETED",
} as const;

export type RuntimeEventType =
  (typeof RuntimeEventType)[keyof typeof RuntimeEventType];

// ─── Aggregate Types (for event aggregateType) ─────────────────────────────────
// RTHINK-BP-001 §19: Persistence — generic aggregate classification

export const AggregateType = {
  MISSION: "MISSION",
  STATE: "STATE",
  ARTIFACT: "ARTIFACT",
  ROUTER: "ROUTER",
  EXECUTION: "EXECUTION",
  EVIDENCE: "EVIDENCE",
  CONTRADICTION: "CONTRADICTION",
  CHALLENGE: "CHALLENGE",
  DISCOVERY: "DISCOVERY",
  EVOLUTION: "EVOLUTION",
  AUTHORITY: "AUTHORITY",
  RECOVERY: "RECOVERY",
} as const;

export type AggregateType = (typeof AggregateType)[keyof typeof AggregateType];

// ─── Authority Reference ───────────────────────────────────────────────────────
// RTHINK-BP-001 §17, §19: Persistence — typed authority reference for events.
// Operational and generic. Identifies the authority record that permitted an
// event, the role that exercised it, the current authority status, and an
// optional decision/granting linkage. No legal or external identity semantics.

export interface AuthorityReference {
  authorityId: string;
  actorRole: ActorRole;
  status: AuthorityStatus;
  decisionId?: string;
  grantedBy?: string;
}

// Runtime actor reference used by events (re-exported from contracts/index).
export interface RuntimeActorReference {
  id: string;
  role: ActorRole;
}
