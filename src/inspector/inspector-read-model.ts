/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Inspector Read-Only Model Interface
// Blueprint Reference: RTHINK-BP-001 §18, RT-008A-R1 §9.2
// Mission: RTHINK-RT-008B (Inspector Backend API)
//
// The InspectorReadModel is the STRICT READ-ONLY BOUNDARY between the
// Runtime and the Inspector. All reads go through this interface.
//
// GUARANTEES:
//   1. ALL methods return deep copies (immutable DTOs)
//   2. ZERO mutation methods — no append, register, create, connect, force
//   3. ZERO mutable Runtime class instances exposed — only immutable DTOs
//   4. EVERY response includes exportedAt provenance metadata
//   5. Cursor-based pagination with globalPosition for events
//   6. Error/unavailable data returns undefined or empty arrays — never throws
//
// COMPOSITION:
//   InspectorReadModel is constructed with explicit dependency injection of
//   Runtime module instances via the Composition Root.

import type {
  RuntimeHealth,
  RuntimeStatistics,
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
} from "./dtos.js";
import type {
  MissionFilter,
  EventFilter,
  ArtifactFilter,
  EvidenceFilter,
  PaginationParams,
} from "./filters.js";

// ─── Inspector Read-Only Model ─────────────────────────────────────────────

export interface InspectorReadModel {
  // ─── Mission Queries ───────────────────────────────────────────────────

  listMissions(
    filters?: MissionFilter,
    pagination?: PaginationParams
  ): PaginatedResult<MissionSummary>;

  getMission(missionId: string): MissionDetail | undefined;

  getMissionState(missionId: string): {
    readonly currentState: import("../contracts/types.js").RuntimeState;
    readonly previousState?: import("../contracts/types.js").RuntimeState;
    readonly updatedAt: string;
  } | undefined;

  getMissionHistory(missionId: string): readonly import("../contracts/types.js").RuntimeState[];

  getMissionEvents(
    missionId: string,
    pagination?: PaginationParams
  ): PaginatedResult<EventSummary>;

  getMissionArtifacts(
    missionId: string,
    pagination?: PaginationParams
  ): PaginatedResult<ArtifactSummary>;

  getMissionEvidence(missionId: string): EvidenceGraphSnapshot;

  getMissionAuthority(missionId: string): AuthorityDetail | undefined;

  getMissionContradictions(missionId: string): ContradictionsDetail | undefined;

  replayMission(missionId: string): ReplaySnapshot | undefined;

  // ─── Event Queries ─────────────────────────────────────────────────────

  listEvents(
    filters?: EventFilter,
    pagination?: PaginationParams
  ): PaginatedResult<EventSummary>;

  getEvent(eventId: string): EventDetail | undefined;

  // ─── Artifact Queries ──────────────────────────────────────────────────

  listArtifacts(
    filters?: ArtifactFilter,
    pagination?: PaginationParams
  ): PaginatedResult<ArtifactSummary>;

  getArtifact(artifactId: string): ArtifactDetail | undefined;

  getArtifactHistory(artifactId: string): readonly ArtifactDetail[];

  // ─── Evidence Graph Queries ────────────────────────────────────────────

  getEvidenceGraph(filters?: EvidenceFilter): EvidenceGraphSnapshot;

  findEvidencePath(fromNodeId: string, toNodeId: string): EvidencePath;

  validateEvidenceGraph(): EvidenceValidation;

  // ─── Router Queries ────────────────────────────────────────────────────

  listMethods(): readonly MethodSummary[];

  listProviders(): readonly ProviderSummary[];

  listCapabilities(): readonly string[];

  // ─── Health & Statistics ───────────────────────────────────────────────

  getHealth(): RuntimeHealth;

  getStatistics(): RuntimeStatistics;

  // ─── Snapshot Queries ──────────────────────────────────────────────────

  listSnapshots(aggregateId?: string): readonly SnapshotSummary[];

  getSnapshot(snapshotId: string): SnapshotDetail | undefined;

  // ─── SSE Stream ────────────────────────────────────────────────────────

  /**
   * Get events since a given globalPosition (for SSE polling).
   * Returns events with globalPosition > since.
   * Used by SSE Transport backed by Polling Cursor (RT-008A-R1 §10).
   */
  getEventsSince(globalPosition: number): readonly StreamEvent[];
}
