/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Contract Types
// Blueprint Reference: RTHINK-BP-001 Appendix A, Section 19

import type {
  RuntimeState,
  TransitionDecisionType,
  RtpMessageType,
  RtpVersion,
  MissionRiskLevel,
  ActorRole,
  ArtifactType,
  AuthorityStatus,
  EvidenceGraphNodeType,
  EvidenceGraphRelationType,
  ProviderStatus as ProviderStatusEnum,
  RouterDecisionOutcome,
  RejectionReasonCode,
  RuntimeEventType,
  AggregateType,
  AuthorityReference,
  RuntimeActorReference,
} from "./types.js";

// ─── Mission Contract ───────────────────────────────────────────────────────
// RTHINK-BP-001 Appendix A — Mission Contract Template

export interface BlueprintRef {
  documentId: string;
  section?: string;
}

export interface Scope {
  projects?: string[];
  tools?: string[];
  description?: string;
}

export interface Authority {
  read?: boolean;
  write?: boolean;
  execute?: boolean;
  network?: boolean;
  humanDecision?: boolean;
}

export interface MissionContract {
  missionId: string;
  consumerBlueprintRefs: BlueprintRef[];
  objective: string;
  context?: string;
  allowedScope: Scope;
  explicitNonScope: string[];
  authority: Authority;
  riskNoveltyLevel: MissionRiskLevel;
  acceptanceCriteria: string[];
  verification: string[];
  evidenceRequirements: string[];
  failureProtocol: string[];
  escalationConditions: string[];
  guardianApproval: boolean;
}

// ─── RTP Message ────────────────────────────────────────────────────────────
// RTHINK-BP-001 §12 — R-Think Protocol Message

export interface ActorIdentity {
  id: string;
  role: ActorRole;
}

export interface RtpMessage {
  rtpVersion: RtpVersion;
  messageId: string;
  missionId: string;
  actor: ActorIdentity;
  state: RuntimeState;
  messageType: RtpMessageType;
  blueprintRefs: BlueprintRef[];
  payload: Record<string, unknown>;
  evidenceRefs: string[];
  requestedTransition?: RuntimeState;
  confidence?: number;
  unresolved?: string[];
  timestamp: string;
}

// ─── Artifact Envelope ──────────────────────────────────────────────────────
// RTHINK-BP-001 Appendix B — Artifact Envelope

export interface SourceRef {
  type: string;
  uri: string;
}

export interface IntegrityMetadata {
  algorithm?: string;
  hash?: string;
}

export interface ArtifactEnvelope {
  rtpVersion: RtpVersion;
  artifactId: string;
  artifactType: ArtifactType;
  version: number;
  missionId: string;
  consumerBlueprintRefs: BlueprintRef[];
  actor: ActorIdentity;
  state: RuntimeState;
  sourceRefs: SourceRef[];
  method?: string;
  payload: Record<string, unknown>;
  evidenceRefs: string[];
  confidence?: number;
  uncertainties?: string[];
  contradictions?: string[];
  createdAt: string;
  supersedes?: string;
  integrity?: IntegrityMetadata;
}

// ─── Transition Decision ────────────────────────────────────────────────────
// RTHINK-BP-001 §7.2 — Transition Decision

export interface TransitionDecision {
  missionId: string;
  sourceState: RuntimeState;
  requestedState: RuntimeState;
  decision: TransitionDecisionType;
  ruleVersion: string;
  requiredArtifacts: string[];
  satisfiedRequirements: string[];
  missingRequirements: string[];
  contradictions: string[];
  authorityStatus: AuthorityStatus;
  evidenceRefs: string[];
  reasonCode?: string;
  nextAllowedActions: RuntimeState[];
  timestamp: string;
}

// ─── Evidence Graph Node ────────────────────────────────────────────────────
// RTHINK-BP-001 §9: Evidence Graph — node

export interface EvidenceGraphNode {
  nodeId: string;
  nodeType: EvidenceGraphNodeType;
  missionId: string;
  timestamp: string;
  version: number;
  sourceRefs: SourceRef[];
  metadata: Record<string, unknown>;
}

// ─── Evidence Graph Edge ────────────────────────────────────────────────────
// RTHINK-BP-001 §9: Evidence Graph — edge

export interface EvidenceGraphEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: EvidenceGraphRelationType;
  timestamp: string;
  metadata: Record<string, unknown>;
}

// ─── Evidence Graph Export ──────────────────────────────────────────────────

export interface EvidenceGraphExport {
  nodes: EvidenceGraphNode[];
  edges: EvidenceGraphEdge[];
  exportedAt: string;
  version: string;
}

// ─── Method / Provider Router Contracts ─────────────────────────────────────
// RTHINK-BP-001: Method/Provider Router — typed contracts

export interface Method {
  methodId: string;
  displayName: string;
  description: string;
  requiredCapabilities: Requirement[];
}

export interface Capability {
  capabilityId: string;
  displayName: string;
  description: string;
}

export interface Requirement {
  capabilityId: string;
  minVersion?: string;
  optional?: boolean;
}

export interface Provider {
  providerId: string;
  displayName: string;
  version: string;
  priority: number;
  status: ProviderStatusEnum;
  supportedMethods: string[];
  capabilities: ProviderCapability[];
  metadata: Record<string, unknown>;
}

export interface ProviderCapability {
  capabilityId: string;
  version: string;
}

export interface ProviderRegistration {
  provider: Provider;
  registeredAt: string;
  enabled: boolean;
}

export interface ExecutionContext {
  missionId: string;
  state: RuntimeState;
  riskLevel: MissionRiskLevel;
  metadata: Record<string, unknown>;
}

export interface ExecutionRequest {
  requestId: string;
  methodId: string;
  context: ExecutionContext;
  requirements?: Requirement[];
  constraints?: ExecutionConstraints;
}

export interface ExecutionConstraints {
  excludeProviders?: string[];
  preferProviders?: string[];
  maxResponseTime?: number;
  requiredCapabilities?: string[];
}

export interface ExecutionResult {
  requestId: string;
  providerId: string;
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
  duration?: number;
  evidenceRefs: string[];
}

export interface RouterDecision {
  decisionId: string;
  requestId: string;
  methodId: string;
  selectedProvider: string | null;
  rejectedProviders: RejectedProvider[];
  reason: string;
  capabilityMatch: CapabilityMatchResult;
  priorityEvaluation: PriorityEvaluation;
  finalDecision: RouterDecisionOutcome;
  timestamp: string;
}

export interface RejectedProvider {
  providerId: string;
  reason: string;
  code: RejectionReasonCode;
}

export interface CapabilityMatchResult {
  requiredCapabilities: string[];
  matchedCapabilities: string[];
  missingCapabilities: string[];
  versionMatches: string[];
  versionMismatches: string[];
  versionMissing: string[];
  versionBelow: string[];
}

export interface PriorityEvaluation {
  candidates: ProviderPriorityScore[];
  winner: string | null;
  tieBreakingRule: string;
}

export interface ProviderPriorityScore {
  providerId: string;
  capabilityScore: number;
  methodScore: number;
  availabilityScore: number;
  priorityScore: number;
  totalScore: number;
}

// ─── Persistence & Event Store Contracts ──────────────────────────────────────
// RTHINK-BP-001 §19: Persistence & Event Store — canonical event model
// Fully generic. No business/provider-specific fields.

export const CURRENT_EVENT_SCHEMA_VERSION = "rt-006-v1.0";

export interface ActorIdentityRef {
  id: string;
  role: ActorRole;
}

export interface RuntimeEvent {
  eventId: string;
  missionId: string;
  aggregateId: string;
  aggregateType: AggregateType;
  eventType: RuntimeEventType;
  sequence: number;
  timestamp: string;
  actor: RuntimeActorReference;
  authority: AuthorityReference;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
  schemaVersion: string;
  /**
   * Canonical global position assigned by the Event Store at append time.
   * Monotonically increasing across the ENTIRE store, starting at 1, unique,
   * immutable after append, and independent from per-aggregate `sequence`.
   * Callers cannot supply or override this; the store owns assignment.
   */
  globalPosition: number;
}

export interface Snapshot {
  snapshotId: string;
  aggregateId: string;
  sequence: number;
  /** globalPosition boundary the snapshot was taken at (store high-water mark) */
  globalPosition: number;
  timestamp: string;
  runtimeState: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface ReplayValidationResult {
  valid: boolean;
  errors: ReplayIssue[];
}

export interface ReplayIssue {
  code:
    | "MISSING_SEQUENCE"
    | "DUPLICATE_SEQUENCE"
    | "INVALID_AGGREGATE"
    | "INVALID_SCHEMA_VERSION"
    | "INVALID_ORDERING"
    | "ORPHAN_EVENT"
    | "INVALID_CAUSATION_CHAIN"
    | "MISSING_CAUSATION_ROOT"
    | "DUPLICATE_GLOBAL_POSITION"
    | "MISSING_GLOBAL_POSITION"
    | "INVALID_GLOBAL_POSITION_ORDER"
    | "ATOMIC_BATCH_REJECTED";
  message: string;
  eventId?: string;
  sequence?: number;
  aggregateId?: string;
  globalPosition?: number;
}

export interface ReplayResult {
  aggregateId: string;
  events: RuntimeEvent[];
  state: Record<string, unknown>;
  validation: ReplayValidationResult;
}

// ─── Storage Adapter Contracts ────────────────────────────────────────────────
// RTHINK-BP-001 §19: Persistence — explicit durability boundary.
// The EventStore depends on adapter interfaces, NOT on undocumented Maps as its
// persistence identity. The current backend is process-local and non-durable.
// Durable adapters (PostgreSQL, NATS, …) are FUTURE work; only the boundary
// exists now.

export interface EventStorageAdapter {
  /** Append a single already-validated event (store assigns globalPosition). */
  append(event: RuntimeEvent): void;
  /** Append a batch atomically. Implementations must reject the whole batch on conflict. */
  appendBatch(events: RuntimeEvent[]): void;
  loadEvent(eventId: string): RuntimeEvent | undefined;
  loadAll(): RuntimeEvent[];
  loadMission(missionId: string): RuntimeEvent[];
  loadAggregate(aggregateId: string): RuntimeEvent[];
  count(): number;
}

export interface SnapshotStorageAdapter {
  save(snapshot: Snapshot): void;
  load(snapshotId: string): Snapshot | undefined;
  list(): Snapshot[];
  listByAggregate(aggregateId: string): Snapshot[];
  delete(snapshotId: string): boolean;
}

// ─── Materialized View Store Contract ──────────────────────────────────────────
// RTHINK-BP-001 §19: Persistence — derived current-state views.
// NOT authoritative history. Removing/clearing a view never deletes events.
// Writing a view never appends events.

export interface MaterializedViewRecord {
  recordId: string;
  aggregateId: string;
  missionId: string;
  state: Record<string, unknown>;
  metadata: Record<string, unknown>;
  updatedAt: string;
  /** globalPosition of the event that produced this record (provenance) */
  derivedFromGlobalPosition: number;
  schemaVersion: string;
}

export interface MaterializedViewStore {
  put(record: MaterializedViewRecord): void;
  load(recordId: string): MaterializedViewRecord | undefined;
  exists(recordId: string): boolean;
  remove(recordId: string): boolean;
  list(): MaterializedViewRecord[];
  clear(): void;
  count(): number;
}
