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
