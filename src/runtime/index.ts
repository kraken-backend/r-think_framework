/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Public Runtime API
// Blueprint Reference: RTHINK-BP-001 §7, §7.2

export {
  RULE_VERSION,
  CANONICAL_SEQUENCE,
  ReasonCode,
  ARTIFACT_GATES,
  TRANSITION_RULES,
  ADAPTIVE_DEPTH_CONFIG,
  findTransitionRule,
  findRulesFrom,
  isCognitiveState,
  isOperationalState,
  type TransitionRule,
  type ArtifactGate,
  type AdaptiveDepthConfig,
} from "./rules.js";

export {
  evaluateTransition,
  applyTransition,
  evaluateRetry,
  createTimestamp,
  type TransitionRequest,
  type AdaptiveDepthJustification,
  type RetryContext,
  type StateApplicationResult,
} from "./state-machine.js";

export {
  ArtifactRegistry,
  type ValidationResult,
} from "./artifact-registry.js";

export {
  EvidenceGraph,
  type GraphValidationResult,
  type GraphNodeInput,
  type GraphEdgeInput,
} from "./evidence-graph.js";
