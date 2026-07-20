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

export {
  ProviderRegistry,
  Router,
  ROUTER_VERSION,
  RejectionReasonCode,
} from "./router.js";

export {
  toEvidenceGraphArtifacts,
  toEvidenceGraphExport,
  EVIDENCE_EXPORT_VERSION,
  type RouterDecisionEvidenceExport,
} from "./evidence-export.js";

export {
  EventStore,
  EVENT_STORE_VERSION,
} from "./event-store.js";

export {
  Persistence,
  PERSISTENCE_VERSION,
} from "./persistence.js";

export {
  ReplayEngine,
  REPLAY_VERSION,
  type StateReducer,
} from "./replay.js";

export {
  InMemoryEventStorageAdapter,
  InMemorySnapshotStorageAdapter,
  FakeEventStorageAdapter,
  STORAGE_ADAPTER_VERSION,
} from "./storage-adapters.js";

export {
  InMemoryMaterializedViewStore,
  MATERIALIZED_VIEW_VERSION,
} from "./materialized-view-store.js";

export {
  MissionRuntimeCoordinator,
  MISSION_RUNTIME_COORDINATOR_VERSION,
  type MissionRuntimeCoordinatorConfig,
  type MissionCoordinatorState,
  type MissionRuntimeCoordinatorDependencies,
} from "./mission-runtime-coordinator.js";

export { CURRENT_EVENT_SCHEMA_VERSION } from "../contracts/index.js";

export type {
  RuntimeEvent,
  Snapshot,
  ReplayValidationResult,
  ReplayIssue,
  ReplayResult,
  EventStorageAdapter,
  SnapshotStorageAdapter,
  MaterializedViewStore,
  MaterializedViewRecord,
} from "../contracts/index.js";
