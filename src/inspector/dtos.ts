/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Inspector Immutable DTOs
// Blueprint Reference: RTHINK-BP-001 §18, RT-008A §9.3
// Mission: RTHINK-RT-008B (Inspector Backend API)
//
// 22 immutable DTOs organized in three groups:
//   12 Primary DTOs — mission, event, router, health, statistics, snapshots
//    5 Artifact DTOs — artifact summary, detail, history
//    5 Evidence DTOs — graph snapshot, node, edge, path, validation
//
// All properties are readonly. Deep copy at the InspectorReadModel boundary
// guarantees caller mutation cannot reach Runtime state.

import type {
  RuntimeState,
  RuntimeEventType,
  AggregateType,
  ActorRole,
  ArtifactType,
  EvidenceGraphNodeType,
  EvidenceGraphRelationType,
  RuntimeActorReference,
  AuthorityReference,
  AuthorityStatus,
  MissionRiskLevel,
} from "../contracts/types.js";
import type {
  MissionContract,
  SourceRef,
  IntegrityMetadata,
  EvidenceGraphNode,
  EvidenceGraphEdge,
} from "../contracts/index.js";
import type { GraphValidationResult } from "../runtime/evidence-graph.js";

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
  readonly cursor?: string;
}

// ─── 12 Primary DTOs ───────────────────────────────────────────────────────

export interface MissionSummary {
  readonly missionId: string;
  readonly currentState: RuntimeState;
  readonly previousState?: RuntimeState;
  readonly riskLevel: MissionRiskLevel;
  readonly authorityStatus: AuthorityStatus;
  readonly contradictionCount: number;
  readonly isTerminated: boolean;
  readonly eventCount: number;
  readonly artifactCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MissionDetail extends MissionSummary {
  readonly contract: Readonly<MissionContract>;
  readonly stateHistory: readonly RuntimeState[];
  readonly contradictions: readonly string[];
}

export interface EventSummary {
  readonly eventId: string;
  readonly missionId: string;
  readonly aggregateId: string;
  readonly aggregateType: AggregateType;
  readonly eventType: RuntimeEventType;
  readonly sequence: number;
  readonly globalPosition: number;
  readonly timestamp: string;
  readonly actor: Readonly<RuntimeActorReference>;
}

export interface EventDetail extends EventSummary {
  readonly authority: Readonly<AuthorityReference>;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly schemaVersion: string;
}

export interface MethodSummary {
  readonly methodId: string;
  readonly displayName: string;
  readonly description: string;
  readonly requiredCapabilities: readonly {
    readonly capabilityId: string;
    readonly minVersion?: string;
    readonly optional?: boolean;
  }[];
}

export interface ProviderSummary {
  readonly providerId: string;
  readonly displayName: string;
  readonly version: string;
  readonly priority: number;
  readonly status: string;
  readonly supportedMethods: readonly string[];
  readonly enabled: boolean;
}

export interface RuntimeHealth {
  readonly totalEvents: number;
  readonly totalArtifacts: number;
  readonly evidenceNodeCount: number;
  readonly evidenceEdgeCount: number;
  readonly graphIntegrity: Readonly<GraphValidationResult>;
  readonly snapshotCount: number;
  readonly materializedViewCount: number;
  readonly exportedAt: string;
}

export interface RuntimeStatistics {
  readonly eventsByType: Readonly<Record<string, number>>;
  readonly eventsByActor: Readonly<Record<string, number>>;
  readonly artifactsByType: Readonly<Record<string, number>>;
  readonly transitionCount: number;
  readonly contradictionCount: number;
  readonly authorityGrantCount: number;
  readonly authorityDenyCount: number;
  readonly failureCount: number;
  readonly recoveryCount: number;
  readonly discoveryCount: number;
  readonly evolutionCount: number;
  readonly exportedAt: string;
}

export interface SnapshotSummary {
  readonly snapshotId: string;
  readonly aggregateId: string;
  readonly sequence: number;
  readonly globalPosition: number;
  readonly timestamp: string;
  readonly exportedAt: string;
}

export interface SnapshotDetail extends SnapshotSummary {
  readonly runtimeState: Readonly<Record<string, unknown>>;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface ReplaySnapshot {
  readonly aggregateId: string;
  readonly eventCount: number;
  readonly state: Readonly<Record<string, unknown>>;
  readonly valid: boolean;
  readonly errorCount: number;
  readonly exportedAt: string;
}

export interface AuthorityDetail {
  readonly status: AuthorityStatus;
  readonly contradictions: readonly string[];
  readonly exportedAt: string;
}

export interface ContradictionsDetail {
  readonly contradictions: readonly string[];
  readonly count: number;
  readonly exportedAt: string;
}

// ─── 5 Artifact DTOs ───────────────────────────────────────────────────────

export interface ArtifactSummary {
  readonly artifactId: string;
  readonly artifactType: ArtifactType;
  readonly version: number;
  readonly missionId: string;
  readonly confidence?: number;
  readonly createdAt: string;
}

export interface ArtifactDetail extends ArtifactSummary {
  readonly actor: Readonly<{ id: string; role: ActorRole }>;
  readonly state: RuntimeState;
  readonly sourceRefs: readonly SourceRef[];
  readonly method?: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly evidenceRefs: readonly string[];
  readonly uncertainties?: readonly string[];
  readonly contradictions?: readonly string[];
  readonly supersedes?: string;
  readonly integrity?: Readonly<IntegrityMetadata>;
}

// ─── 5 Evidence DTOs ───────────────────────────────────────────────────────

export interface EvidenceGraphSnapshot {
  readonly nodes: readonly EvidenceGraphNode[];
  readonly edges: readonly EvidenceGraphEdge[];
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly hasCycles: boolean;
  readonly exportedAt: string;
}

export interface EvidenceNodeSummary {
  readonly nodeId: string;
  readonly nodeType: EvidenceGraphNodeType;
  readonly missionId: string;
  readonly timestamp: string;
  readonly version: number;
}

export interface EvidenceEdgeSummary {
  readonly edgeId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly relationType: EvidenceGraphRelationType;
  readonly timestamp: string;
}

export interface EvidencePath {
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly path: readonly string[] | null;
  readonly found: boolean;
}

export interface EvidenceValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly exportedAt: string;
}

// ─── SSE Event Payload ─────────────────────────────────────────────────────

export interface StreamEvent {
  readonly globalPosition: number;
  readonly eventId: string;
  readonly eventType: RuntimeEventType;
  readonly missionId: string;
  readonly aggregateId: string;
  readonly timestamp: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

// ─── Deep Copy Helper ──────────────────────────────────────────────────────

/**
 * Deep copy an object at the Inspector boundary.
 * Uses structuredClone for correctness with nested objects, arrays, Date, etc.
 * This is the single enforcement point for immutability.
 */
export function deepCopy<T>(obj: T): T {
  return structuredClone(obj);
}
