/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Inspector Read-Only Model Implementation
// Blueprint Reference: RTHINK-BP-001 §18, RT-008A-R1 §9
// Mission: RTHINK-RT-008B (Inspector Backend API)
//
// Concrete implementation of InspectorReadModel.
// Reads from existing Runtime modules via explicit dependency injection.
// ALL returns are deep copies. ZERO mutations reach Runtime state.
//
// Composition Root wires: EventStore, Persistence, ReplayEngine,
// ArtifactRegistry, EvidenceGraph, Router.

import type { RuntimeState } from "../contracts/types.js";
import type { RuntimeEvent, ArtifactEnvelope, Snapshot } from "../contracts/index.js";
import type { EventStore } from "../runtime/event-store.js";
import type { Persistence } from "../runtime/persistence.js";
import type { ReplayEngine } from "../runtime/replay.js";
import type { ArtifactRegistry } from "../runtime/artifact-registry.js";
import type { EvidenceGraph } from "../runtime/evidence-graph.js";
import type { Router } from "../runtime/router.js";
import type { MissionRuntimeCoordinator } from "../runtime/mission-runtime-coordinator.js";
import type { InspectorReadModel } from "./inspector-read-model.js";
import type {
  MissionSummary,
  MissionDetail,
  EventSummary,
  EventDetail,
  ArtifactSummary,
  ArtifactDetail,
  MethodSummary,
  ProviderSummary,
  EvidenceGraphSnapshot,
  EvidencePath,
  EvidenceValidation,
  SnapshotSummary,
  SnapshotDetail,
  ReplaySnapshot,
  AuthorityDetail,
  ContradictionsDetail,
  PaginatedResult,
  StreamEvent,
  RuntimeHealth,
  RuntimeStatistics,
} from "./dtos.js";
import type {
  MissionFilter,
  EventFilter,
  ArtifactFilter,
  EvidenceFilter,
  PaginationParams,
} from "./filters.js";
import { deepCopy } from "./dtos.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./filters.js";

// ─── Dependencies ──────────────────────────────────────────────────────────

export interface InspectorReadModelDependencies {
  eventStore: EventStore;
  persistence: Persistence;
  replayEngine: ReplayEngine;
  artifactRegistry: ArtifactRegistry;
  evidenceGraph: EvidenceGraph;
  router: Router;
  coordinators: Map<string, MissionRuntimeCoordinator>;
}

// ─── Implementation ────────────────────────────────────────────────────────

export class InspectorReadModelImpl implements InspectorReadModel {
  private deps: InspectorReadModelDependencies;

  constructor(deps: InspectorReadModelDependencies) {
    this.deps = deps;
  }

  // ─── Mission Queries ───────────────────────────────────────────────────

  listMissions(
    filters?: MissionFilter,
    pagination?: PaginationParams
  ): PaginatedResult<MissionSummary> {
    const allSummaries: MissionSummary[] = [];

    for (const [, coordinator] of this.deps.coordinators) {
      const state = coordinator.getCoordinatorState();
      const missionId = state.missionId;
      const summary = this.toMissionSummary(state, missionId);
      if (this.matchesMissionFilter(summary, filters)) {
        allSummaries.push(summary);
      }
    }

    allSummaries.sort((a, b) => a.missionId.localeCompare(b.missionId));
    return this.paginate(allSummaries, pagination);
  }

  getMission(missionId: string): MissionDetail | undefined {
    const coordinator = this.deps.coordinators.get(missionId);
    if (!coordinator) return undefined;

    const state = coordinator.getCoordinatorState();
    const summary = this.toMissionSummary(state, missionId);

    const detail: MissionDetail = {
      ...summary,
      contract: deepCopy(coordinator.getContract()),
      stateHistory: [...state.stateHistory],
      contradictions: [...state.contradictions],
    };

    return deepCopy(detail);
  }

  getMissionState(missionId: string): {
    currentState: RuntimeState;
    previousState?: RuntimeState;
    updatedAt: string;
  } | undefined {
    const coordinator = this.deps.coordinators.get(missionId);
    if (!coordinator) return undefined;

    const state = coordinator.getCoordinatorState();
    return deepCopy({
      currentState: state.currentState,
      previousState: state.previousState,
      updatedAt: state.updatedAt,
    });
  }

  getMissionHistory(missionId: string): readonly RuntimeState[] {
    const coordinator = this.deps.coordinators.get(missionId);
    if (!coordinator) return [];

    return [...coordinator.getStateHistory()];
  }

  getMissionEvents(
    missionId: string,
    pagination?: PaginationParams
  ): PaginatedResult<EventSummary> {
    const events = this.deps.persistence.loadMission(missionId);
    const summaries = events.map((e) => this.toEventSummary(e));
    return this.paginate(summaries, pagination);
  }

  getMissionArtifacts(
    missionId: string,
    pagination?: PaginationParams
  ): PaginatedResult<ArtifactSummary> {
    const artifacts = this.deps.artifactRegistry.listArtifacts({ missionId });
    const summaries = artifacts.map((a) => this.toArtifactSummary(a));
    return this.paginate(summaries, pagination);
  }

  getMissionEvidence(missionId: string): EvidenceGraphSnapshot {
    const graph = this.deps.evidenceGraph;
    const nodes = graph
      .getAllNodes()
      .filter((n) => n.missionId === missionId);
    const nodeIds = new Set(nodes.map((n) => n.nodeId));
    const edges = graph
      .getAllEdges()
      .filter((e) => nodeIds.has(e.fromNodeId) || nodeIds.has(e.toNodeId));

    return deepCopy({
      nodes,
      edges,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      hasCycles: graph.hasCyclicEvolution(),
      exportedAt: new Date().toISOString(),
    });
  }

  getMissionAuthority(missionId: string): AuthorityDetail | undefined {
    const coordinator = this.deps.coordinators.get(missionId);
    if (!coordinator) return undefined;

    return deepCopy({
      status: coordinator.getAuthorityStatus(),
      contradictions: [...coordinator.getContradictions()],
      exportedAt: new Date().toISOString(),
    });
  }

  getMissionContradictions(missionId: string): ContradictionsDetail | undefined {
    const coordinator = this.deps.coordinators.get(missionId);
    if (!coordinator) return undefined;

    const contradictions = [...coordinator.getContradictions()];
    return deepCopy({
      contradictions,
      count: contradictions.length,
      exportedAt: new Date().toISOString(),
    });
  }

  replayMission(missionId: string): ReplaySnapshot | undefined {
    const coordinator = this.deps.coordinators.get(missionId);
    if (!coordinator) return undefined;

    const result = coordinator.replay();
    return deepCopy({
      aggregateId: result.aggregateId,
      eventCount: result.events.length,
      state: result.state,
      valid: result.validation.valid,
      errorCount: result.validation.errors.length,
      exportedAt: new Date().toISOString(),
    });
  }

  // ─── Event Queries ─────────────────────────────────────────────────────

  listEvents(
    filters?: EventFilter,
    pagination?: PaginationParams
  ): PaginatedResult<EventSummary> {
    const allEvents = this.deps.eventStore.stream();
    const filtered = filters ? allEvents.filter((e) => this.matchesEventFilter(e, filters)) : allEvents;
    const summaries = filtered.map((e) => this.toEventSummary(e));
    return this.paginate(summaries, pagination);
  }

  getEvent(eventId: string): EventDetail | undefined {
    const event = this.deps.eventStore.loadEvent(eventId);
    if (!event) return undefined;
    return deepCopy(this.toEventDetail(event));
  }

  // ─── Artifact Queries ──────────────────────────────────────────────────

  listArtifacts(
    filters?: ArtifactFilter,
    pagination?: PaginationParams
  ): PaginatedResult<ArtifactSummary> {
    const allArtifacts = this.deps.artifactRegistry.listArtifacts(
      filters ? { artifactType: filters.artifactType, missionId: filters.missionId } : undefined
    );
    const summaries = allArtifacts.map((a) => this.toArtifactSummary(a));
    return this.paginate(summaries, pagination);
  }

  getArtifact(artifactId: string): ArtifactDetail | undefined {
    const artifact = this.deps.artifactRegistry.getArtifact(artifactId);
    if (!artifact) return undefined;
    return deepCopy(this.toArtifactDetail(artifact));
  }

  getArtifactHistory(artifactId: string): readonly ArtifactDetail[] {
    const history = this.deps.artifactRegistry.getVersionHistory(artifactId);
    return history.map((a) => deepCopy(this.toArtifactDetail(a)));
  }

  // ─── Evidence Graph Queries ────────────────────────────────────────────

  getEvidenceGraph(filters?: EvidenceFilter): EvidenceGraphSnapshot {
    let nodes = this.deps.evidenceGraph.getAllNodes();
    let edges = this.deps.evidenceGraph.getAllEdges();

    if (filters?.missionId) {
      nodes = nodes.filter((n) => n.missionId === filters.missionId);
      const nodeIds = new Set(nodes.map((n) => n.nodeId));
      edges = edges.filter(
        (e) => nodeIds.has(e.fromNodeId) || nodeIds.has(e.toNodeId)
      );
    }
    if (filters?.nodeType) {
      nodes = nodes.filter((n) => n.nodeType === filters.nodeType);
    }
    if (filters?.relationType) {
      edges = edges.filter((e) => e.relationType === filters.relationType);
    }

    return deepCopy({
      nodes,
      edges,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      hasCycles: this.deps.evidenceGraph.hasCyclicEvolution(),
      exportedAt: new Date().toISOString(),
    });
  }

  findEvidencePath(fromNodeId: string, toNodeId: string): EvidencePath {
    const path = this.deps.evidenceGraph.findPath(fromNodeId, toNodeId);
    return deepCopy({
      fromNodeId,
      toNodeId,
      path,
      found: path !== null,
    });
  }

  validateEvidenceGraph(): EvidenceValidation {
    const result = this.deps.evidenceGraph.validateGraph();
    return deepCopy({
      valid: result.valid,
      errors: result.errors,
      nodeCount: this.deps.evidenceGraph.nodeCount,
      edgeCount: this.deps.evidenceGraph.edgeCount,
      exportedAt: new Date().toISOString(),
    });
  }

  // ─── Router Queries ────────────────────────────────────────────────────

  listMethods(): readonly MethodSummary[] {
    const methods = this.deps.router.listMethods();
    return deepCopy(
      methods.map((m) => ({
        methodId: m.methodId,
        displayName: m.displayName,
        description: m.description,
        requiredCapabilities: m.requiredCapabilities,
      }))
    );
  }

  listProviders(): readonly ProviderSummary[] {
    const registrations = this.deps.router.exportRegistry();
    return deepCopy(
      registrations.map((r) => ({
        providerId: r.provider.providerId,
        displayName: r.provider.displayName,
        version: r.provider.version,
        priority: r.provider.priority,
        status: r.provider.status,
        supportedMethods: r.provider.supportedMethods,
        enabled: r.enabled,
      }))
    );
  }

  listCapabilities(): readonly string[] {
    return [...this.deps.router.listCapabilities()];
  }

  // ─── Health & Statistics ───────────────────────────────────────────────

  getHealth(): RuntimeHealth {
    return deepCopy({
      totalEvents: this.deps.eventStore.count(),
      totalArtifacts: this.deps.artifactRegistry.size,
      evidenceNodeCount: this.deps.evidenceGraph.nodeCount,
      evidenceEdgeCount: this.deps.evidenceGraph.edgeCount,
      graphIntegrity: this.deps.evidenceGraph.validateGraph(),
      snapshotCount: this.deps.persistence.getSnapshotStore().list().length,
      materializedViewCount: this.deps.persistence.countRecords(),
      exportedAt: new Date().toISOString(),
    });
  }

  getStatistics(): RuntimeStatistics {
    const events = this.deps.eventStore.stream();
    const artifacts = this.deps.artifactRegistry.listArtifacts();

    const eventsByType: Record<string, number> = {};
    const eventsByActor: Record<string, number> = {};
    let transitionCount = 0;
    let contradictionCount = 0;
    let authorityGrantCount = 0;
    let authorityDenyCount = 0;
    let failureCount = 0;
    let recoveryCount = 0;
    let discoveryCount = 0;
    let evolutionCount = 0;

    for (const event of events) {
      eventsByType[event.eventType] = (eventsByType[event.eventType] ?? 0) + 1;
      eventsByActor[event.actor.id] = (eventsByActor[event.actor.id] ?? 0) + 1;

      switch (event.eventType) {
        case "STATE_CHANGED":
          transitionCount++;
          break;
        case "CONTRADICTION_DETECTED":
          contradictionCount++;
          break;
        case "AUTHORITY_GRANTED":
          authorityGrantCount++;
          break;
        case "AUTHORITY_DENIED":
          authorityDenyCount++;
          break;
        case "EXECUTION_FAILED":
          failureCount++;
          break;
        case "RECOVERY_COMPLETED":
          recoveryCount++;
          break;
        case "DISCOVERY_CREATED":
          discoveryCount++;
          break;
        case "EVOLUTION_CREATED":
          evolutionCount++;
          break;
      }
    }

    const artifactsByType: Record<string, number> = {};
    for (const artifact of artifacts) {
      artifactsByType[artifact.artifactType] =
        (artifactsByType[artifact.artifactType] ?? 0) + 1;
    }

    return deepCopy({
      eventsByType,
      eventsByActor,
      artifactsByType,
      transitionCount,
      contradictionCount,
      authorityGrantCount,
      authorityDenyCount,
      failureCount,
      recoveryCount,
      discoveryCount,
      evolutionCount,
      exportedAt: new Date().toISOString(),
    });
  }

  // ─── Snapshot Queries ──────────────────────────────────────────────────

  listSnapshots(aggregateId?: string): readonly SnapshotSummary[] {
    const store = this.deps.persistence.getSnapshotStore();
    const snapshots: Snapshot[] = aggregateId
      ? store.listByAggregate(aggregateId)
      : store.list();

    return deepCopy(
      snapshots.map((s) => ({
        snapshotId: s.snapshotId,
        aggregateId: s.aggregateId,
        sequence: s.sequence,
        globalPosition: s.globalPosition,
        timestamp: s.timestamp,
        exportedAt: new Date().toISOString(),
      }))
    );
  }

  getSnapshot(snapshotId: string): SnapshotDetail | undefined {
    const snapshot = this.deps.persistence.getSnapshotStore().load(snapshotId);
    if (!snapshot) return undefined;

    return deepCopy({
      snapshotId: snapshot.snapshotId,
      aggregateId: snapshot.aggregateId,
      sequence: snapshot.sequence,
      globalPosition: snapshot.globalPosition,
      timestamp: snapshot.timestamp,
      runtimeState: snapshot.runtimeState,
      metadata: snapshot.metadata,
      exportedAt: new Date().toISOString(),
    });
  }

  // ─── SSE Stream ────────────────────────────────────────────────────────

  getEventsSince(globalPosition: number): readonly StreamEvent[] {
    const allEvents = this.deps.eventStore.stream();
    return deepCopy(
      allEvents
        .filter((e) => e.globalPosition > globalPosition)
        .map((e) => ({
          globalPosition: e.globalPosition,
          eventId: e.eventId,
          eventType: e.eventType,
          missionId: e.missionId,
          aggregateId: e.aggregateId,
          timestamp: e.timestamp,
          payload: e.payload,
        }))
    );
  }

  // ─── Private: DTO Mapping ─────────────────────────────────────────────

  private toMissionSummary(
    state: {
      missionId: string;
      currentState: RuntimeState;
      previousState?: RuntimeState;
      authorityStatus: import("../contracts/types.js").AuthorityStatus;
      contradictions: string[];
      isTerminated: boolean;
      createdAt: string;
      updatedAt: string;
    },
    missionId: string
  ): MissionSummary {
    const eventCount = this.deps.eventStore.countMission(missionId);
    const artifactCount = this.deps.artifactRegistry
      .listArtifacts({ missionId }).length;

    const coordinator = this.deps.coordinators.get(missionId);
    const riskLevel = coordinator?.getRiskLevel() ?? "L0_ROUTINE";

    return {
      missionId: state.missionId,
      currentState: state.currentState,
      previousState: state.previousState,
      riskLevel,
      authorityStatus: state.authorityStatus,
      contradictionCount: state.contradictions.length,
      isTerminated: state.isTerminated,
      eventCount,
      artifactCount,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    };
  }

  private toEventSummary(event: RuntimeEvent): EventSummary {
    return {
      eventId: event.eventId,
      missionId: event.missionId,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventType: event.eventType,
      sequence: event.sequence,
      globalPosition: event.globalPosition,
      timestamp: event.timestamp,
      actor: { id: event.actor.id, role: event.actor.role },
    };
  }

  private toEventDetail(event: RuntimeEvent): EventDetail {
    return {
      ...this.toEventSummary(event),
      authority: { ...event.authority },
      payload: event.payload,
      metadata: event.metadata,
      correlationId: event.correlationId,
      causationId: event.causationId,
      schemaVersion: event.schemaVersion,
    };
  }

  private toArtifactSummary(artifact: ArtifactEnvelope): ArtifactSummary {
    return {
      artifactId: artifact.artifactId,
      artifactType: artifact.artifactType,
      version: artifact.version,
      missionId: artifact.missionId,
      confidence: artifact.confidence,
      createdAt: artifact.createdAt,
    };
  }

  private toArtifactDetail(artifact: ArtifactEnvelope): ArtifactDetail {
    return {
      ...this.toArtifactSummary(artifact),
      actor: { id: artifact.actor.id, role: artifact.actor.role },
      state: artifact.state,
      sourceRefs: [...artifact.sourceRefs],
      method: artifact.method,
      payload: artifact.payload,
      evidenceRefs: [...artifact.evidenceRefs],
      uncertainties: artifact.uncertainties ? [...artifact.uncertainties] : undefined,
      contradictions: artifact.contradictions ? [...artifact.contradictions] : undefined,
      supersedes: artifact.supersedes,
      integrity: artifact.integrity ? { ...artifact.integrity } : undefined,
    };
  }

  // ─── Private: Filter Matching ──────────────────────────────────────────

  private matchesMissionFilter(
    summary: MissionSummary,
    filters?: MissionFilter
  ): boolean {
    if (!filters) return true;
    if (filters.state !== undefined && summary.currentState !== filters.state) return false;
    if (filters.riskLevel !== undefined && summary.riskLevel !== filters.riskLevel) return false;
    if (filters.authorityStatus !== undefined && summary.authorityStatus !== filters.authorityStatus) return false;
    if (filters.isTerminated !== undefined && summary.isTerminated !== filters.isTerminated) return false;
    if (filters.timeRange) {
      const from = new Date(filters.timeRange.from).getTime();
      const to = new Date(filters.timeRange.to).getTime();
      const created = new Date(summary.createdAt).getTime();
      if (created < from || created > to) return false;
    }
    return true;
  }

  private matchesEventFilter(event: RuntimeEvent, filters: EventFilter): boolean {
    if (filters.missionId !== undefined && event.missionId !== filters.missionId) return false;
    if (filters.eventType !== undefined && event.eventType !== filters.eventType) return false;
    if (filters.aggregateType !== undefined && event.aggregateType !== filters.aggregateType) return false;
    if (filters.actorId !== undefined && event.actor.id !== filters.actorId) return false;
    if (filters.actorRole !== undefined && event.actor.role !== filters.actorRole) return false;
    if (filters.timeRange) {
      const from = new Date(filters.timeRange.from).getTime();
      const to = new Date(filters.timeRange.to).getTime();
      const ts = new Date(event.timestamp).getTime();
      if (ts < from || ts > to) return false;
    }
    return true;
  }

  // ─── Private: Pagination ──────────────────────────────────────────────

  private paginate<T>(
    items: T[],
    pagination?: PaginationParams
  ): PaginatedResult<T> {
    const pageSize = Math.min(
      pagination?.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );
    const page = pagination?.page ?? 1;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedItems = items.slice(start, end);

    return {
      items: paginatedItems,
      total: items.length,
      page,
      pageSize,
      hasMore: end < items.length,
    };
  }
}
