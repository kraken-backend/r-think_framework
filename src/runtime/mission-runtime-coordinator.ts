/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Mission Runtime Coordinator
// Blueprint Reference: RTHINK-BP-001 §17
// Mission: RTHINK-RT-007 (Mission Runtime Coordinator Foundation)
//
// The MissionRuntimeCoordinator is a PURE ORCHESTRATION layer. It wires
// existing decoupled runtime modules together at mission scope. It governs
// flow and enforces gates; it does NOT execute business logic.
//
// Business execution (running methods, tools, experiments) is performed by
// the external Executor/consumer. The coordinator coordinates only.
//
// Modules wired:
//   - State Machine      (evaluateTransition, applyTransition)
//   - Artifact Registry   (registerArtifact, getArtifact, listArtifacts)
//   - Evidence Graph      (createNode, connect)
//   - Method Router       (resolve) — read-only, produces RouterDecision
//   - Persistence         (append events, materialized views)
//   - Replay Engine       (replayMission, replayAggregate, createSnapshot)

import {
  RuntimeState,
  CognitiveState,
  TransitionDecisionType,
  RuntimeEventType,
  AggregateType,
  AuthorityStatus,
  ActorRole,
  MissionRiskLevel,
  type AuthorityReference,
  type RuntimeActorReference,
  type EvidenceGraphRelationType,
} from "../contracts/types.js";
import type {
  MissionContract,
  RuntimeEvent,
  ArtifactEnvelope,
  TransitionDecision,
} from "../contracts/index.js";
import {
  evaluateTransition,
  applyTransition,
  createTimestamp,
  type TransitionRequest,
} from "./state-machine.js";
import { ArtifactRegistry, type ValidationResult } from "./artifact-registry.js";
import {
  EvidenceGraph,
  type GraphValidationResult,
  type GraphNodeInput,
} from "./evidence-graph.js";
import { Router } from "./router.js";
import type { RouterDecision } from "../contracts/index.js";
import { Persistence } from "./persistence.js";
import { ReplayEngine, type StateReducer } from "./replay.js";
import type { ReplayResult, Snapshot } from "../contracts/index.js";

// ─── Coordinator Version ────────────────────────────────────────────────────

export const MISSION_RUNTIME_COORDINATOR_VERSION = "rt-007-v1.0";

// ─── Coordinator Configuration ──────────────────────────────────────────────

export interface MissionRuntimeCoordinatorConfig {
  missionId: string;
  contract: MissionContract;
  riskLevel: MissionRiskLevel;
}

// ─── Coordinator State ──────────────────────────────────────────────────────

export interface MissionCoordinatorState {
  missionId: string;
  currentState: RuntimeState;
  previousState?: RuntimeState;
  stateHistory: RuntimeState[];
  authorityStatus: AuthorityStatus;
  contradictions: string[];
  isTerminated: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Dependencies (injected) ────────────────────────────────────────────────

export interface MissionRuntimeCoordinatorDependencies {
  artifactRegistry: ArtifactRegistry;
  evidenceGraph: EvidenceGraph;
  router: Router;
  persistence: Persistence;
  replayEngine: ReplayEngine;
}

// ─── Event Emission Helper ──────────────────────────────────────────────────

let eventCounter = 0;

function buildEvent(
  missionId: string,
  aggregateId: string,
  aggregateType: AggregateType,
  eventType: RuntimeEventType,
  sequence: number,
  actor: RuntimeActorReference,
  authority: AuthorityReference,
  payload: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  correlationId?: string,
  causationId?: string
): RuntimeEvent {
  return {
    eventId: `evt-${missionId}-${aggregateId}-${sequence}-${++eventCounter}`,
    missionId,
    aggregateId,
    aggregateType,
    eventType,
    sequence,
    timestamp: createTimestamp(),
    actor,
    authority,
    payload,
    metadata,
    correlationId,
    causationId,
    schemaVersion: "rt-007-v1.0",
    globalPosition: 0, // assigned by EventStore
  };
}

// ─── Default Actor ──────────────────────────────────────────────────────────

const COORDINATOR_ACTOR: RuntimeActorReference = {
  id: "mission-runtime-coordinator",
  role: ActorRole.EXECUTOR,
};

const DEFAULT_AUTHORITY: AuthorityReference = {
  authorityId: "coordinator-default",
  actorRole: ActorRole.EXECUTOR,
  status: AuthorityStatus.NOT_REQUIRED,
};

// ─── Mission Runtime Coordinator ────────────────────────────────────────────

export class MissionRuntimeCoordinator {
  private config: MissionRuntimeCoordinatorConfig;
  private deps: MissionRuntimeCoordinatorDependencies;
  private state: MissionCoordinatorState;
  private eventSequence: number = 0;

  constructor(
    config: MissionRuntimeCoordinatorConfig,
    deps: MissionRuntimeCoordinatorDependencies
  ) {
    this.config = config;
    this.deps = deps;
    this.state = {
      missionId: config.missionId,
      currentState: CognitiveState.OBSERVE,
      stateHistory: [CognitiveState.OBSERVE],
      authorityStatus: AuthorityStatus.NOT_REQUIRED,
      contradictions: [],
      isTerminated: false,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
    };
  }

  // ─── Mission Lifecycle ───────────────────────────────────────────────────

  /**
   * Initialize the mission. Emits MISSION_CREATED event.
   * The mission starts in OBSERVE state.
   */
  initializeMission(): void {
    this.emitEvent(
      RuntimeEventType.MISSION_CREATED,
      AggregateType.MISSION,
      {
        missionId: this.config.missionId,
        contract: this.config.contract,
        riskLevel: this.config.riskLevel,
        initialState: this.state.currentState,
      },
      { phase: "initialization" }
    );
  }

  /**
   * Terminate the mission. Emits MISSION_UPDATED event with termination payload.
   * No further transitions allowed after termination.
   */
  terminateMission(reason: string): void {
    this.state.isTerminated = true;
    this.state.updatedAt = createTimestamp();
    this.emitEvent(
      RuntimeEventType.MISSION_UPDATED,
      AggregateType.MISSION,
      {
        missionId: this.config.missionId,
        reason,
        finalState: this.state.currentState,
        stateHistory: this.state.stateHistory,
        terminated: true,
      },
      { phase: "termination" }
    );
  }

  // ─── State Read Accessors ────────────────────────────────────────────────

  getCurrentState(): RuntimeState {
    return this.state.currentState;
  }

  getPreviousState(): RuntimeState | undefined {
    return this.state.previousState;
  }

  getStateHistory(): readonly RuntimeState[] {
    return this.state.stateHistory;
  }

  getAuthorityStatus(): AuthorityStatus {
    return this.state.authorityStatus;
  }

  getContradictions(): readonly string[] {
    return this.state.contradictions;
  }

  isTerminated(): boolean {
    return this.state.isTerminated;
  }

  getMissionId(): string {
    return this.config.missionId;
  }

  getContract(): MissionContract {
    return this.config.contract;
  }

  getRiskLevel(): MissionRiskLevel {
    return this.config.riskLevel;
  }

  getCoordinatorState(): MissionCoordinatorState {
    return {
      ...this.state,
      stateHistory: [...this.state.stateHistory],
      contradictions: [...this.state.contradictions],
    };
  }

  // ─── Transition Orchestration ────────────────────────────────────────────

  /**
   * Request a state transition. Delegates to the State Machine for evaluation,
   * then applies the result if ALLOWED. Emits STATE_CHANGED events.
   */
  requestTransition(
    requestedState: RuntimeState,
    availableArtifacts: string[],
    evidenceRefs: string[],
    contradictions: string[],
    authorityStatus?: AuthorityStatus,
    verifierPresent: boolean = false
  ): TransitionDecision {
    if (this.state.isTerminated) {
      return this.makeDeniedDecision(
        requestedState,
        "Mission is terminated",
        contradictions
      );
    }

    const request: TransitionRequest = {
      missionId: this.config.missionId,
      fromState: this.state.currentState,
      requestedState,
      riskLevel: this.config.riskLevel,
      availableArtifacts,
      evidenceRefs,
      contradictions,
      authorityStatus: authorityStatus ?? this.state.authorityStatus,
      verifierPresent,
      timestamp: createTimestamp(),
    };

    this.emitEvent(
      RuntimeEventType.STATE_CHANGED,
      AggregateType.STATE,
      {
        fromState: this.state.currentState,
        requestedState,
        availableArtifacts,
        evidenceRefs,
        contradictions,
      },
      { phase: "transition-requested" }
    );

    const decision = evaluateTransition(request);

    this.emitEvent(
      RuntimeEventType.STATE_CHANGED,
      AggregateType.STATE,
      {
        decision: decision.decision,
        reasonCode: decision.reasonCode,
        sourceState: decision.sourceState,
        requestedState: decision.requestedState,
      },
      { phase: "transition-decided" }
    );

    if (decision.decision === TransitionDecisionType.ALLOW) {
      const application = applyTransition(
        decision,
        this.state.currentState,
        this.config.missionId
      );
      if (application.success && application.newState) {
        this.applyStateChange(application.newState);
      }
    }

    return decision;
  }

  /**
   * Force-apply a state without transition evaluation.
   * Used for recovery and authority-granted scenarios.
   * Emits STATE_CHANGED event.
   */
  forceState(newState: RuntimeState, reason: string): void {
    this.applyStateChange(newState);
    this.emitEvent(
      RuntimeEventType.STATE_CHANGED,
      AggregateType.STATE,
      {
        forcedState: newState,
        reason,
        previousState: this.state.previousState,
      },
      { phase: "force-state" }
    );
  }

  // ─── Artifact Coordination ───────────────────────────────────────────────

  /**
   * Register an artifact in the Artifact Registry.
   * Emits ARTIFACT_REGISTERED event on success.
   */
  registerArtifact(artifact: ArtifactEnvelope): ValidationResult {
    const result = this.deps.artifactRegistry.registerArtifact(artifact);
    if (result.valid) {
      this.emitEvent(
        RuntimeEventType.ARTIFACT_REGISTERED,
        AggregateType.ARTIFACT,
        {
          artifactId: artifact.artifactId,
          artifactType: artifact.artifactType,
          version: artifact.version,
          missionId: artifact.missionId,
        },
        { phase: "artifact-registered" }
      );
    }
    return result;
  }

  /**
   * Get an artifact by ID.
   */
  getArtifact(artifactId: string): ArtifactEnvelope | undefined {
    return this.deps.artifactRegistry.getArtifact(artifactId);
  }

  /**
   * List artifacts, optionally filtered.
   */
  listArtifacts(filters?: {
    artifactType?: import("../contracts/types.js").ArtifactType;
    missionId?: string;
  }): ArtifactEnvelope[] {
    return this.deps.artifactRegistry.listArtifacts(filters);
  }

  /**
   * Check if an artifact exists.
   */
  hasArtifact(artifactId: string): boolean {
    return this.deps.artifactRegistry.hasArtifact(artifactId);
  }

  /**
   * Get artifact version history.
   */
  getArtifactVersionHistory(artifactId: string): ArtifactEnvelope[] {
    return this.deps.artifactRegistry.getVersionHistory(artifactId);
  }

  // ─── Evidence Coordination ───────────────────────────────────────────────

  /**
   * Create an evidence graph node. Emits EVIDENCE_CREATED event on success.
   */
  createEvidenceNode(input: GraphNodeInput): GraphValidationResult {
    const result = this.deps.evidenceGraph.createNode(input);
    if (result.valid) {
      this.emitEvent(
        RuntimeEventType.EVIDENCE_CREATED,
        AggregateType.EVIDENCE,
        {
          nodeId: input.nodeId,
          nodeType: input.nodeType,
          missionId: input.missionId,
        },
        { phase: "evidence-node-created" }
      );
    }
    return result;
  }

  /**
   * Connect two evidence graph nodes.
   */
  connectEvidence(
    fromNodeId: string,
    toNodeId: string,
    relationType: EvidenceGraphRelationType,
    metadata: Record<string, unknown> = {}
  ): GraphValidationResult {
    return this.deps.evidenceGraph.connect({
      fromNodeId,
      toNodeId,
      relationType,
      metadata,
    });
  }

  /**
   * Get an evidence node by ID.
   */
  getEvidenceNode(nodeId: string) {
    return this.deps.evidenceGraph.getNode(nodeId);
  }

  // ─── Method Router Coordination ──────────────────────────────────────────

  /**
   * Resolve a method to a provider via the Router.
   * Emits ROUTER_DECISION event.
   */
  resolveMethod(
    methodId: string,
    constraints?: import("../contracts/index.js").ExecutionConstraints
  ): RouterDecision {
    const decision = this.deps.router.resolve(methodId, constraints);

    this.emitEvent(
      RuntimeEventType.ROUTER_DECISION,
      AggregateType.ROUTER,
      {
        decisionId: decision.decisionId,
        methodId: decision.methodId,
        selectedProvider: decision.selectedProvider,
        finalDecision: decision.finalDecision,
        rejectedCount: decision.rejectedProviders.length,
      },
      { phase: "router-resolution" }
    );

    return decision;
  }

  // ─── Authority Management ────────────────────────────────────────────────

  /**
   * Request authority for a transition. Sets authority status to PENDING.
   */
  requestAuthority(requestingRole: ActorRole, reason: string): void {
    this.state.authorityStatus = AuthorityStatus.PENDING;
    this.state.updatedAt = createTimestamp();

    this.emitEvent(
      RuntimeEventType.STATE_CHANGED,
      AggregateType.AUTHORITY,
      {
        authorityStatus: AuthorityStatus.PENDING,
        requestingRole,
        reason,
      },
      { phase: "authority-requested" }
    );
  }

  /**
   * Grant authority. Sets authority status to GRANTED.
   */
  grantAuthority(
    authorityId: string,
    grantingRole: ActorRole,
    reason: string
  ): void {
    this.state.authorityStatus = AuthorityStatus.GRANTED;
    this.state.updatedAt = createTimestamp();

    this.emitEvent(
      RuntimeEventType.AUTHORITY_GRANTED,
      AggregateType.AUTHORITY,
      {
        authorityId,
        grantingRole,
        reason,
        previousStatus: AuthorityStatus.PENDING,
      },
      { phase: "authority-granted" }
    );
  }

  /**
   * Deny authority. Sets authority status to DENIED.
   */
  denyAuthority(
    authorityId: string,
    denyingRole: ActorRole,
    reason: string
  ): void {
    this.state.authorityStatus = AuthorityStatus.DENIED;
    this.state.updatedAt = createTimestamp();

    this.emitEvent(
      RuntimeEventType.AUTHORITY_DENIED,
      AggregateType.AUTHORITY,
      {
        authorityId,
        denyingRole,
        reason,
        previousStatus: AuthorityStatus.PENDING,
      },
      { phase: "authority-denied" }
    );
  }

  /**
   * Reset authority to NOT_REQUIRED after denial resolution.
   */
  resetAuthority(): void {
    this.state.authorityStatus = AuthorityStatus.NOT_REQUIRED;
    this.state.updatedAt = createTimestamp();
  }

  // ─── Contradiction Handling ──────────────────────────────────────────────

  /**
   * Record a contradiction. Routes to OBSERVE or VALIDATE per §6.3.
   * Emits CONTRADICTION_DETECTED event.
   */
  recordContradiction(description: string): RuntimeState {
    this.state.contradictions.push(description);
    this.state.authorityStatus = AuthorityStatus.NOT_REQUIRED;
    this.state.updatedAt = createTimestamp();

    this.emitEvent(
      RuntimeEventType.CONTRADICTION_DETECTED,
      AggregateType.CONTRADICTION,
      {
        description,
        contradictionCount: this.state.contradictions.length,
        currentState: this.state.currentState,
      },
      { phase: "contradiction-detected" }
    );

    const routeTarget = this.routeContradiction();
    this.forceState(routeTarget, `Contradiction routing: ${description}`);
    return routeTarget;
  }

  /**
   * Determine the appropriate state for contradiction re-entry.
   * Per RTHINK-BP-001 §6.3: contradiction returns to OBSERVE or VALIDATE.
   */
  routeContradiction(): RuntimeState {
    if (
      this.state.currentState === CognitiveState.VALIDATE ||
      this.state.currentState === CognitiveState.CONNECT ||
      this.state.currentState === CognitiveState.CHALLENGE
    ) {
      return CognitiveState.VALIDATE;
    }
    return CognitiveState.OBSERVE;
  }

  // ─── Recovery Routing ────────────────────────────────────────────────────

  /**
   * Recover from a failure. Routes to OBSERVE for retry.
   * Emits RECOVERY_STARTED and RECOVERY_COMPLETED events.
   */
  recoverFromFailure(error: string): RuntimeState {
    this.emitEvent(
      RuntimeEventType.RECOVERY_STARTED,
      AggregateType.RECOVERY,
      {
        error,
        currentState: this.state.currentState,
      },
      { phase: "recovery-started" }
    );

    const recoveryTarget = CognitiveState.OBSERVE;
    this.forceState(recoveryTarget, `Recovery from failure: ${error}`);

    this.emitEvent(
      RuntimeEventType.RECOVERY_COMPLETED,
      AggregateType.RECOVERY,
      {
        error,
        recoveryTarget,
        newState: this.state.currentState,
      },
      { phase: "recovery-completed" }
    );

    return recoveryTarget;
  }

  // ─── Replay Coordination ─────────────────────────────────────────────────

  /**
   * Replay the mission from the event store.
   */
  replay(reducer?: StateReducer): ReplayResult {
    return this.deps.replayEngine.replayMission(
      this.config.missionId,
      reducer
    );
  }

  /**
   * Create a snapshot of the current coordinator state.
   */
  createSnapshot(
    metadata: Record<string, unknown> = {}
  ): Snapshot {
    return this.deps.replayEngine.createSnapshot(
      this.config.missionId,
      {
        currentState: this.state.currentState,
        previousState: this.state.previousState,
        stateHistory: this.state.stateHistory,
        authorityStatus: this.state.authorityStatus,
        contradictions: this.state.contradictions,
        isTerminated: this.state.isTerminated,
      },
      metadata
    );
  }

  /**
   * Replay from a snapshot.
   */
  replayFromSnapshot(
    snapshotId: string,
    reducer?: StateReducer
  ): ReplayResult | undefined {
    return this.deps.replayEngine.replayFromSnapshot(snapshotId, reducer);
  }

  // ─── Persistence Access ──────────────────────────────────────────────────

  /**
   * Get the Persistence instance for direct access.
   */
  getPersistence(): Persistence {
    return this.deps.persistence;
  }

  /**
   * Get all events for this mission.
   */
  getMissionEvents(): RuntimeEvent[] {
    return this.deps.persistence.loadMission(this.config.missionId);
  }

  // ─── Internal Helpers ────────────────────────────────────────────────────

  private applyStateChange(newState: RuntimeState): void {
    this.state.previousState = this.state.currentState;
    this.state.currentState = newState;
    this.state.stateHistory.push(newState);
    this.state.updatedAt = createTimestamp();
  }

  private makeDeniedDecision(
    requestedState: RuntimeState,
    reason: string,
    contradictions: string[]
  ): TransitionDecision {
    return {
      missionId: this.config.missionId,
      sourceState: this.state.currentState,
      requestedState,
      decision: TransitionDecisionType.DENY,
      ruleVersion: "rt-002-v1.0",
      requiredArtifacts: [],
      satisfiedRequirements: [],
      missingRequirements: [],
      contradictions,
      authorityStatus: this.state.authorityStatus,
      evidenceRefs: [],
      reasonCode: reason,
      nextAllowedActions: [],
      timestamp: createTimestamp(),
    };
  }

  private emitEvent(
    eventType: RuntimeEventType,
    aggregateType: AggregateType,
    payload: Record<string, unknown>,
    metadata: Record<string, unknown> = {}
  ): void {
    const event = buildEvent(
      this.config.missionId,
      this.config.missionId,
      aggregateType,
      eventType,
      ++this.eventSequence,
      COORDINATOR_ACTOR,
      DEFAULT_AUTHORITY,
      payload,
      metadata
    );
    this.deps.persistence.append(event);
  }
}
