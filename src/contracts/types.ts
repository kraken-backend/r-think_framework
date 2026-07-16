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
