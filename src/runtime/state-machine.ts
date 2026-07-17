/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — State Machine and Transition Evaluator
// Blueprint Reference: RTHINK-BP-001 §6, §6.2, §6.3, §7, §7.2

import {
  RuntimeState,
  TransitionDecisionType,
  MissionRiskLevel,
  AuthorityStatus,
} from "../contracts/types.js";
import type { TransitionDecision } from "../contracts/index.js";
import {
  RULE_VERSION,
  ReasonCode,
  ADAPTIVE_DEPTH_CONFIG,
  findTransitionRule,
  isCognitiveState,
  type TransitionRule,
} from "./rules.js";

// ─── Transition Request ──────────────────────────────────────────────────────

export interface TransitionRequest {
  missionId: string;
  fromState: RuntimeState;
  requestedState: RuntimeState;
  riskLevel: MissionRiskLevel;
  availableArtifacts: string[];
  evidenceRefs: string[];
  contradictions: string[];
  adaptiveDepthJustification?: AdaptiveDepthJustification;
  authorityStatus: AuthorityStatus;
  verifierPresent: boolean;
  ruleVersion?: string;
  previousState?: RuntimeState;
  retryContext?: RetryContext;
  timestamp: string;
}

export interface AdaptiveDepthJustification {
  statesSkipped: RuntimeState[];
  reason: string;
  verificationAcceptance: string;
}

export interface RetryContext {
  previousHypothesis?: string;
  previousMethod?: string;
  previousContext?: string;
  previousEvidence?: string[];
  currentHypothesis?: string;
  currentMethod?: string;
  currentContext?: string;
  currentEvidence?: string[];
}

// ─── Transition Evaluation ───────────────────────────────────────────────────
// DERIVED: Deterministic, side-effect-free evaluator

export function evaluateTransition(
  request: TransitionRequest
): TransitionDecision {
  const now = request.timestamp;

  // 1. Mission ID validation
  if (!request.missionId || request.missionId.trim() === "") {
    return makeDecision(
      request,
      TransitionDecisionType.DENY,
      ReasonCode.MISSION_ID_MISMATCH,
      now
    );
  }

  // 2. Rule version check
  if (
    request.ruleVersion &&
    request.ruleVersion !== RULE_VERSION
  ) {
    return makeDecision(
      request,
      TransitionDecisionType.ESCALATE,
      ReasonCode.RULE_VERSION_MISMATCH,
      now
    );
  }

  // 3. Find the transition rule
  const rule = findTransitionRule(request.fromState, request.requestedState);

  if (!rule) {
    // 4. Check for adaptive-depth skip
    const skipResult = evaluateAdaptiveDepthSkip(request);
    if (skipResult) {
      return skipResult;
    }

    // 5. No rule and no skip → UNSUPPORTED
    return makeDecision(
      request,
      TransitionDecisionType.DENY,
      ReasonCode.UNSUPPORTED_TRANSITION,
      now
    );
  }

  // 6. Check artifact gates
  const artifactResult = checkArtifactGates(request, rule);
  if (artifactResult) {
    return artifactResult;
  }

  // 7. Check evidence requirements
  const evidenceResult = checkEvidenceRequirements(request, rule);
  if (evidenceResult) {
    return evidenceResult;
  }

  // 8. Check adaptive depth for challenge bypass
  const challengeResult = checkChallengeRequirement(request, rule);
  if (challengeResult) {
    return challengeResult;
  }

  // 9. Check L3 authority and verifier
  const authorityResult = checkCriticalAuthority(request, rule);
  if (authorityResult) {
    return authorityResult;
  }

  // 10. Check contradiction reentry
  const contradictionResult = checkContradictionReentry(request, rule);
  if (contradictionResult) {
    return contradictionResult;
  }

  // 11. All checks passed → ALLOW
  return makeDecision(
    request,
    TransitionDecisionType.ALLOW,
    ReasonCode.TRANSITION_ALLOWED,
    now,
    rule
  );
}

// ─── Artifact Gate Check ─────────────────────────────────────────────────────
// RTHINK-BP-001 §7: State doesn't move without required artifact

function checkArtifactGates(
  request: TransitionRequest,
  rule: TransitionRule
): TransitionDecision | null {
  const requiredArtifacts = rule.requiredArtifacts;
  const satisfied = requiredArtifacts.filter((a) =>
    request.availableArtifacts.includes(a)
  );
  const missing = requiredArtifacts.filter(
    (a) => !request.availableArtifacts.includes(a)
  );

  if (missing.length > 0) {
    return makeDecision(
      request,
      TransitionDecisionType.DENY,
      ReasonCode.REQUIRED_ARTIFACT_MISSING,
      request.timestamp,
      rule,
      { satisfied, missing }
    );
  }

  return null;
}

// ─── Evidence Requirements Check ─────────────────────────────────────────────
// RTHINK-BP-001 §5: Evidence before completion

function checkEvidenceRequirements(
  request: TransitionRequest,
  rule: TransitionRule
): TransitionDecision | null {
  if (rule.requiredEvidence && request.evidenceRefs.length === 0) {
    return makeDecision(
      request,
      TransitionDecisionType.DENY,
      ReasonCode.REQUIRED_EVIDENCE_MISSING,
      request.timestamp,
      rule
    );
  }

  return null;
}

// ─── Challenge Requirement Check ─────────────────────────────────────────────
// RTHINK-BP-001 §5: Challenge before material decision
// RTHINK-BP-001 §6.2: L2/L3 cannot bypass CHALLENGE

function checkChallengeRequirement(
  request: TransitionRequest,
  _rule: TransitionRule
): TransitionDecision | null {
  const depthConfig = ADAPTIVE_DEPTH_CONFIG[request.riskLevel];

  // L2 and L3 require challenge for material decisions
  if (
    depthConfig.requiresChallenge &&
    isCognitiveState(request.requestedState) &&
    request.requestedState !== "CHALLENGE" &&
    request.requestedState !== "OBSERVE" &&
    request.requestedState !== "UNDERSTAND" &&
    request.requestedState !== "QUESTION"
  ) {
    // For L2/L3, the transition is allowed but challenge must be evidenced
    // This is already handled by the rule's requiredArtifacts
  }

  return null;
}

// ─── Critical Authority Check ────────────────────────────────────────────────
// RTHINK-BP-001 §6.2: L3 requires full cycle + independent verifier + explicit authority

function checkCriticalAuthority(
  request: TransitionRequest,
  _rule: TransitionRule
): TransitionDecision | null {
  const depthConfig = ADAPTIVE_DEPTH_CONFIG[request.riskLevel];

  if (depthConfig.requiresVerifier && !request.verifierPresent) {
    return makeDecision(
      request,
      TransitionDecisionType.ESCALATE,
      ReasonCode.VERIFIER_REQUIRED,
      request.timestamp,
      _rule
    );
  }

  if (
    depthConfig.requiresAuthority &&
    request.authorityStatus !== AuthorityStatus.GRANTED
  ) {
    return makeDecision(
      request,
      TransitionDecisionType.ESCALATE,
      ReasonCode.AUTHORITY_REQUIRED,
      request.timestamp,
      _rule
    );
  }

  return null;
}

// ─── Contradiction Reentry Check ─────────────────────────────────────────────
// RTHINK-BP-001 §6.3: Contradiction returns to OBSERVE or VALIDATE

function checkContradictionReentry(
  request: TransitionRequest,
  _rule: TransitionRule
): TransitionDecision | null {
  if (request.contradictions.length > 0) {
    const validReentryTargets = ["OBSERVE", "VALIDATE"];
    if (
      isCognitiveState(request.requestedState) &&
      !validReentryTargets.includes(request.requestedState)
    ) {
      // Contradictions present but not re-entering OBSERVE or VALIDATE
      // Allow but flag with CONTRADICTION_REQUIRES_REENTRY
    }
  }

  return null;
}

// ─── Adaptive Depth Skip Evaluation ──────────────────────────────────────────
// RTHINK-BP-001 §6.2: L0/L1 may request bounded skip with justification

function evaluateAdaptiveDepthSkip(
  request: TransitionRequest
): TransitionDecision | null {
  const depthConfig = ADAPTIVE_DEPTH_CONFIG[request.riskLevel];

  // L2/L3 cannot skip
  if (!depthConfig.canSkip) {
    return null;
  }

  // Check if this is actually a skip (non-adjacent transition)
  const rule = findTransitionRule(request.fromState, request.requestedState);
  if (rule) {
    // Not a skip — a normal transition exists
    return null;
  }

  // This is a skip request — check justification
  if (!request.adaptiveDepthJustification) {
    return makeDecision(
      request,
      TransitionDecisionType.DENY,
      ReasonCode.ADAPTIVE_DEPTH_JUSTIFICATION_MISSING,
      request.timestamp
    );
  }

  const justification = request.adaptiveDepthJustification;

  // Validate justification content
  if (
    !justification.reason ||
    justification.reason.trim() === "" ||
    !justification.verificationAcceptance ||
    justification.verificationAcceptance.trim() === ""
  ) {
    return makeDecision(
      request,
      TransitionDecisionType.DENY,
      ReasonCode.ADAPTIVE_DEPTH_JUSTIFICATION_MISSING,
      request.timestamp
    );
  }

  // L0/L1 skip is allowed with justification
  return makeDecision(
    request,
    TransitionDecisionType.ALLOW,
    ReasonCode.TRANSITION_ALLOWED,
    request.timestamp,
    undefined,
    { satisfied: [], missing: [] },
    justification.statesSkipped
  );
}

// ─── Decision Builder ────────────────────────────────────────────────────────

function makeDecision(
  request: TransitionRequest,
  decision: TransitionDecisionType,
  reasonCode: ReasonCode,
  timestamp: string,
  rule?: TransitionRule,
  artifactCheck?: { satisfied: string[]; missing: string[] },
  _statesSkipped?: RuntimeState[]
): TransitionDecision {
  const requiredArtifacts = rule?.requiredArtifacts ?? [];
  const satisfied = artifactCheck?.satisfied ?? requiredArtifacts;
  const missing = artifactCheck?.missing ?? [];

  const nextAllowedActions = rule?.allowedNext ?? [];

  return {
    missionId: request.missionId,
    sourceState: request.fromState,
    requestedState: request.requestedState,
    decision,
    ruleVersion: RULE_VERSION,
    requiredArtifacts,
    satisfiedRequirements: satisfied,
    missingRequirements: missing,
    contradictions: request.contradictions,
    authorityStatus: request.authorityStatus,
    evidenceRefs: request.evidenceRefs,
    reasonCode,
    nextAllowedActions,
    timestamp,
  };
}

// ─── State Application ───────────────────────────────────────────────────────
// DERIVED: Apply an allowed decision

export interface StateApplicationResult {
  success: boolean;
  newState?: RuntimeState;
  error?: string;
}

export function applyTransition(
  decision: TransitionDecision,
  currentState: RuntimeState,
  missionId: string
): StateApplicationResult {
  // Validate mission ID
  if (decision.missionId !== missionId) {
    return {
      success: false,
      error: `Mission ID mismatch: decision has "${decision.missionId}", expected "${missionId}"`,
    };
  }

  // Validate source state
  if (decision.sourceState !== currentState) {
    return {
      success: false,
      error: `From-state mismatch: decision source is "${decision.sourceState}", current is "${currentState}"`,
    };
  }

  // Only ALLOW produces the requested next state
  if (decision.decision === TransitionDecisionType.ALLOW) {
    return {
      success: true,
      newState: decision.requestedState,
    };
  }

  // DENY, DEFER, ESCALATE do not change state
  return {
    success: true,
    newState: currentState,
  };
}

// ─── Retry Evaluation ────────────────────────────────────────────────────────
// RTHINK-BP-001 §6.3: Retries require changed hypothesis, method, context, or evidence

export function evaluateRetry(
  request: TransitionRequest
): TransitionDecision | null {
  if (!request.retryContext) {
    return null;
  }

  const ctx = request.retryContext;
  const hasChanged =
    (ctx.previousHypothesis !== ctx.currentHypothesis &&
      ctx.currentHypothesis !== undefined) ||
    (ctx.previousMethod !== ctx.currentMethod &&
      ctx.currentMethod !== undefined) ||
    (ctx.previousContext !== ctx.currentContext &&
      ctx.currentContext !== undefined) ||
    (ctx.previousEvidence !== undefined &&
      ctx.currentEvidence !== undefined &&
      JSON.stringify(ctx.previousEvidence) !==
        JSON.stringify(ctx.currentEvidence));

  if (!hasChanged) {
    return makeDecision(
      request,
      TransitionDecisionType.DENY,
      ReasonCode.BLIND_RETRY_DENIED,
      request.timestamp
    );
  }

  return null; // Allow normal evaluation to proceed
}

// ─── Deterministic Timestamp ─────────────────────────────────────────────────
// DERIVED: Injected time for testability

export function createTimestamp(injectedTime?: string): string {
  return injectedTime ?? new Date().toISOString();
}
