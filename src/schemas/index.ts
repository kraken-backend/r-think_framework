// R-Think Runtime — Zod Validators
// Blueprint Reference: RTHINK-BP-001 §7, §7.2, §8, §12, Appendix A, Appendix B

import { z } from "zod";
import {
  CognitiveState,
  OperationalState,
  TransitionDecisionType,
  RtpMessageType,
  MissionRiskLevel,
  ActorRole,
  ArtifactType,
  AuthorityStatus,
  SUPPORTED_RTP_VERSIONS,
} from "../contracts/types.js";

// ─── Helper: strict enum from const object ──────────────────────────────────
function strictEnum<T extends Record<string, string>>(obj: T) {
  const values = Object.values(obj) as [string, ...string[]];
  return z.enum(values);
}

// ─── Common Schemas ─────────────────────────────────────────────────────────

export const CognitiveStateSchema = strictEnum(CognitiveState);
export const OperationalStateSchema = strictEnum(OperationalState);
export const RuntimeStateSchema = z.union([
  CognitiveStateSchema,
  OperationalStateSchema,
]);
export const TransitionDecisionTypeSchema = strictEnum(TransitionDecisionType);
export const RtpMessageTypeSchema = strictEnum(RtpMessageType);
export const MissionRiskLevelSchema = strictEnum(MissionRiskLevel);
export const ActorRoleSchema = strictEnum(ActorRole);
export const ArtifactTypeSchema = strictEnum(ArtifactType);
export const AuthorityStatusSchema = strictEnum(AuthorityStatus);

export const RtpVersionSchema = z.enum(
  SUPPORTED_RTP_VERSIONS as unknown as [string, ...string[]]
);

export const BlueprintRefSchema = z.object({
  documentId: z.string().min(1),
  section: z.string().optional(),
});

// ─── Mission Contract Schema ────────────────────────────────────────────────
// RTHINK-BP-001 Appendix A — Mission Contract Template
// Fields: missionId, consumerBlueprintRefs, objective, context, allowedScope,
//   explicitNonScope, authority, riskNoveltyLevel, acceptanceCriteria,
//   verification, evidenceRequirements, failureProtocol, escalationConditions,
//   guardianApproval

export const AuthoritySchema = z.object({
  read: z.boolean().optional(),
  write: z.boolean().optional(),
  execute: z.boolean().optional(),
  network: z.boolean().optional(),
  humanDecision: z.boolean().optional(),
});

export const ScopeSchema = z.object({
  projects: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const MissionContractSchema = z
  .object({
    missionId: z.string().min(1),
    consumerBlueprintRefs: z.array(BlueprintRefSchema).min(1),
    objective: z.string().min(1),
    context: z.string().optional(),
    allowedScope: ScopeSchema,
    explicitNonScope: z.array(z.string()).min(1),
    authority: AuthoritySchema,
    riskNoveltyLevel: MissionRiskLevelSchema,
    acceptanceCriteria: z.array(z.string()).min(1),
    verification: z.array(z.string()).min(1),
    evidenceRequirements: z.array(z.string()).min(1),
    failureProtocol: z.array(z.string()).min(1),
    escalationConditions: z.array(z.string()).min(1),
    guardianApproval: z.boolean(),
  })
  .strict();

// ─── RTP Message Schema ─────────────────────────────────────────────────────
// RTHINK-BP-001 §12 — R-Think Protocol

export const ActorIdentitySchema = z.object({
  id: z.string().min(1),
  role: ActorRoleSchema,
});

export const RtpMessageSchema = z
  .object({
    rtpVersion: RtpVersionSchema,
    messageId: z.string().min(1),
    missionId: z.string().min(1),
    actor: ActorIdentitySchema,
    state: RuntimeStateSchema,
    messageType: RtpMessageTypeSchema,
    blueprintRefs: z.array(BlueprintRefSchema),
    payload: z.record(z.unknown()),
    evidenceRefs: z.array(z.string()),
    requestedTransition: RuntimeStateSchema.optional(),
    confidence: z.number().min(0).max(1).optional(),
    unresolved: z.array(z.string()).optional(),
    timestamp: z.string().datetime(),
  })
  .strict();

// ─── Artifact Envelope Schema ───────────────────────────────────────────────
// RTHINK-BP-001 Appendix B — Artifact Envelope

export const SourceRefSchema = z.object({
  type: z.string().min(1),
  uri: z.string().min(1),
});

export const IntegrityMetadataSchema = z.object({
  algorithm: z.string().optional(),
  hash: z.string().optional(),
});

export const ArtifactEnvelopeSchema = z
  .object({
    rtpVersion: RtpVersionSchema,
    artifactId: z.string().min(1),
    artifactType: ArtifactTypeSchema,
    version: z.number().int().positive(),
    missionId: z.string().min(1),
    consumerBlueprintRefs: z.array(BlueprintRefSchema).min(1),
    actor: ActorIdentitySchema,
    state: RuntimeStateSchema,
    sourceRefs: z.array(SourceRefSchema),
    method: z.string().optional(),
    payload: z.record(z.unknown()),
    evidenceRefs: z.array(z.string()),
    confidence: z.number().min(0).max(1).optional(),
    uncertainties: z.array(z.string()).optional(),
    contradictions: z.array(z.string()).optional(),
    createdAt: z.string().datetime(),
    supersedes: z.string().optional(),
    integrity: IntegrityMetadataSchema.optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.artifactType === "OBSERVATION") {
        return data.sourceRefs.length >= 1;
      }
      return true;
    },
    {
      message:
        "OBSERVATION artifacts require at least one source reference (RTHINK-BP-001 §8)",
      path: ["sourceRefs"],
    }
  );

// ─── Transition Decision Schema ─────────────────────────────────────────────
// RTHINK-BP-001 §7.2 — Transition Decision

export const TransitionDecisionSchema = z
  .object({
    missionId: z.string().min(1),
    sourceState: RuntimeStateSchema,
    requestedState: RuntimeStateSchema,
    decision: TransitionDecisionTypeSchema,
    ruleVersion: z.string().min(1),
    requiredArtifacts: z.array(z.string()),
    satisfiedRequirements: z.array(z.string()),
    missingRequirements: z.array(z.string()),
    contradictions: z.array(z.string()),
    authorityStatus: AuthorityStatusSchema,
    evidenceRefs: z.array(z.string()),
    reasonCode: z.string().optional(),
    nextAllowedActions: z.array(RuntimeStateSchema),
    timestamp: z.string().datetime(),
  })
  .strict();
