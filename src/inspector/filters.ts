/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Inspector Filter Types
// Blueprint Reference: RTHINK-BP-001 §18, RT-008A-R1 §9.4
// Mission: RTHINK-RT-008B (Inspector Backend API)

import type {
  RuntimeState,
  RuntimeEventType,
  AggregateType,
  ActorRole,
  ArtifactType,
  EvidenceGraphNodeType,
  EvidenceGraphRelationType,
  AuthorityStatus,
  MissionRiskLevel,
} from "../contracts/types.js";

// ─── Filter Types ──────────────────────────────────────────────────────────

export interface MissionFilter {
  readonly state?: RuntimeState;
  readonly riskLevel?: MissionRiskLevel;
  readonly authorityStatus?: AuthorityStatus;
  readonly isTerminated?: boolean;
  readonly timeRange?: { readonly from: string; readonly to: string };
}

export interface EventFilter {
  readonly missionId?: string;
  readonly eventType?: RuntimeEventType;
  readonly aggregateType?: AggregateType;
  readonly actorId?: string;
  readonly actorRole?: ActorRole;
  readonly timeRange?: { readonly from: string; readonly to: string };
}

export interface ArtifactFilter {
  readonly missionId?: string;
  readonly artifactType?: ArtifactType;
}

export interface EvidenceFilter {
  readonly missionId?: string;
  readonly nodeType?: EvidenceGraphNodeType;
  readonly relationType?: EvidenceGraphRelationType;
}

// ─── Pagination Parameters ─────────────────────────────────────────────────

export interface PaginationParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly cursor?: string;
}

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;
