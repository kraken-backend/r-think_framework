/* R-Think Inspector — API Client
 * Read-only HTTP client for Inspector Backend API (RT-008B)
 * All methods are GET-only. Zero mutation paths. */

const BASE_URL = "/api";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─── Mission Endpoints ──────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  cursor?: string;
}

export interface MissionSummary {
  missionId: string;
  currentState: string;
  previousState?: string;
  riskLevel: string;
  authorityStatus: string;
  contradictionCount: number;
  isTerminated: boolean;
  eventCount: number;
  artifactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MissionDetail extends MissionSummary {
  contract: Record<string, unknown>;
  stateHistory: string[];
  contradictions: string[];
}

export interface EventSummary {
  eventId: string;
  missionId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  sequence: number;
  globalPosition: number;
  timestamp: string;
  actor: { id: string; role: string };
}

export interface EventDetail extends EventSummary {
  authority: Record<string, unknown>;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
  schemaVersion: string;
}

export interface ArtifactSummary {
  artifactId: string;
  artifactType: string;
  version: number;
  missionId: string;
  confidence?: number;
  createdAt: string;
}

export interface ArtifactDetail extends ArtifactSummary {
  actor: { id: string; role: string };
  state: string;
  sourceRefs: { type: string; uri: string; label: string }[];
  method?: string;
  payload: Record<string, unknown>;
  evidenceRefs: string[];
  uncertainties?: string[];
  contradictions?: string[];
}

export interface EvidenceGraphNode {
  nodeId: string;
  nodeType: string;
  missionId: string;
  timestamp: string;
  data: Record<string, unknown>;
  version: number;
}

export interface EvidenceGraphEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: string;
  timestamp: string;
}

export interface EvidenceGraphSnapshot {
  nodes: EvidenceGraphNode[];
  edges: EvidenceGraphEdge[];
  nodeCount: number;
  edgeCount: number;
  hasCycles: boolean;
  exportedAt: string;
}

export interface EvidenceValidation {
  valid: boolean;
  errors: string[];
  nodeCount: number;
  edgeCount: number;
  exportedAt: string;
}

export interface MethodSummary {
  methodId: string;
  displayName: string;
  description: string;
  requiredCapabilities: {
    capabilityId: string;
    minVersion?: string;
    optional?: boolean;
  }[];
}

export interface ProviderSummary {
  providerId: string;
  displayName: string;
  version: string;
  priority: number;
  status: string;
  supportedMethods: string[];
  enabled: boolean;
}

export interface RuntimeHealth {
  totalEvents: number;
  totalArtifacts: number;
  evidenceNodeCount: number;
  evidenceEdgeCount: number;
  graphIntegrity: { valid: boolean; errors: string[] };
  snapshotCount: number;
  materializedViewCount: number;
  exportedAt: string;
}

export interface RuntimeStatistics {
  eventsByType: Record<string, number>;
  eventsByActor: Record<string, number>;
  artifactsByType: Record<string, number>;
  transitionCount: number;
  contradictionCount: number;
  authorityGrantCount: number;
  authorityDenyCount: number;
  failureCount: number;
  recoveryCount: number;
  discoveryCount: number;
  evolutionCount: number;
  exportedAt: string;
}

export interface SnapshotSummary {
  snapshotId: string;
  aggregateId: string;
  sequence: number;
  globalPosition: number;
  timestamp: string;
  exportedAt: string;
}

export interface SnapshotDetail extends SnapshotSummary {
  runtimeState: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface ReplaySnapshot {
  aggregateId: string;
  eventCount: number;
  state: Record<string, unknown>;
  valid: boolean;
  errorCount: number;
  exportedAt: string;
}

export interface StreamEvent {
  globalPosition: number;
  eventId: string;
  eventType: string;
  missionId: string;
  aggregateId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

// ─── API Methods ────────────────────────────────────────────────────────────

export const api = {
  // Missions
  listMissions: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchJson<PaginatedResult<MissionSummary>>(`/missions${qs}`);
  },
  getMission: (id: string) =>
    fetchJson<MissionDetail | null>(`/missions/${id}`),
  getMissionState: (id: string) =>
    fetchJson<{ currentState: string; previousState?: string; updatedAt: string } | null>(
      `/missions/${id}/state`
    ),
  getMissionHistory: (id: string) =>
    fetchJson<string[]>(`/missions/${id}/history`),
  getMissionEvents: (id: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchJson<PaginatedResult<EventSummary>>(
      `/missions/${id}/events${qs}`
    );
  },
  getMissionArtifacts: (id: string) =>
    fetchJson<PaginatedResult<ArtifactSummary>>(`/missions/${id}/artifacts`),
  getMissionEvidence: (id: string) =>
    fetchJson<EvidenceGraphSnapshot>(`/missions/${id}/evidence`),
  getMissionAuthority: (id: string) =>
    fetchJson<{ status: string; contradictions: string[] } | null>(
      `/missions/${id}/authority`
    ),
  getMissionContradictions: (id: string) =>
    fetchJson<{ contradictions: string[]; count: number } | null>(
      `/missions/${id}/contradictions`
    ),
  replayMission: (id: string) =>
    fetchJson<ReplaySnapshot | null>(`/missions/${id}/replay`),

  // Events
  listEvents: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchJson<PaginatedResult<EventSummary>>(`/events${qs}`);
  },
  getEvent: (id: string) =>
    fetchJson<EventDetail | null>(`/events/${id}`),

  // Artifacts
  listArtifacts: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchJson<PaginatedResult<ArtifactSummary>>(`/artifacts${qs}`);
  },
  getArtifact: (id: string) =>
    fetchJson<ArtifactDetail | null>(`/artifacts/${id}`),
  getArtifactHistory: (id: string) =>
    fetchJson<ArtifactDetail[]>(`/artifacts/${id}/history`),

  // Evidence
  getEvidenceGraph: () =>
    fetchJson<EvidenceGraphSnapshot>("/evidence/graph"),
  validateEvidence: () =>
    fetchJson<EvidenceValidation>("/evidence/validate"),

  // Router
  listMethods: () => fetchJson<MethodSummary[]>("/router/methods"),
  listProviders: () => fetchJson<ProviderSummary[]>("/router/providers"),
  listCapabilities: () => fetchJson<string[]>("/router/capabilities"),

  // Health & Stats
  getHealth: () => fetchJson<RuntimeHealth>("/health"),
  getStatistics: () => fetchJson<RuntimeStatistics>("/stats"),

  // Snapshots
  listSnapshots: (aggregateId?: string) => {
    const qs = aggregateId ? `?aggregateId=${aggregateId}` : "";
    return fetchJson<SnapshotSummary[]>(`/snapshots${qs}`);
  },
  getSnapshot: (id: string) =>
    fetchJson<SnapshotDetail | null>(`/snapshots/${id}`),

  // SSE Stream
  getEventsSince: (globalPosition: number) =>
    fetchJson<StreamEvent[]>(`/stream?since=${globalPosition}`),
};
