// R-Think Runtime — JSON Schema Definitions
// Blueprint Reference: RTHINK-BP-001 §7, §7.2, §8, §12, Appendix A, Appendix B

// ─── Helper ─────────────────────────────────────────────────────────────────
// JSON Schema is a nested object — no external type needed.
type JsonSchemaRecord = Record<string, unknown>;

function constEnum(values: string[]): JsonSchemaRecord {
  return { type: "string", enum: values };
}

// ─── Canonical State Values ─────────────────────────────────────────────────
// RTHINK-BP-001 §7, §7.1

const COGNITIVE_STATES = [
  "OBSERVE",
  "UNDERSTAND",
  "QUESTION",
  "VALIDATE",
  "CONNECT",
  "CHALLENGE",
  "DISCOVER",
  "EVOLVE",
];

const OPERATIONAL_STATES = [
  "WAITING_FOR_EVIDENCE",
  "WAITING_FOR_AUTHORITY",
  "EXECUTING_METHOD",
  "EXECUTING_EXPERIMENT",
  "CONTRADICTION_DETECTED",
  "METHOD_INSUFFICIENT",
  "REVISION_REQUIRED",
  "COMPLETED",
  "PARTIAL",
  "FAILED",
  "BLOCKED",
  "INVALID",
];

const ALL_STATES = [...COGNITIVE_STATES, ...OPERATIONAL_STATES];

// ─── Transition Decision Values ─────────────────────────────────────────────
// RTHINK-BP-001 §7.2

const TRANSITION_DECISIONS = ["ALLOW", "DENY", "DEFER", "ESCALATE"];

// ─── RTP Message Type Values ────────────────────────────────────────────────
// RTHINK-BP-001 §12

const RTP_MESSAGE_TYPES = [
  "MISSION_CREATED",
  "STATE_ENTERED",
  "ARTIFACT_SUBMITTED",
  "EVIDENCE_SUBMISSION",
  "TRANSITION_REQUESTED",
  "TRANSITION_DECIDED",
  "AUTHORITY_REQUESTED",
  "ACTION_EXECUTED",
  "CONTRADICTION_RECORDED",
  "EVOLUTION_PROPOSED",
  "MISSION_TERMINATED",
];

// ─── Mission Risk Level Values ──────────────────────────────────────────────
// RTHINK-BP-001 §6.2

const MISSION_RISK_LEVELS = [
  "L0_ROUTINE",
  "L1_CONTROLLED",
  "L2_SIGNIFICANT",
  "L3_CRITICAL",
];

// ─── Actor Role Values ──────────────────────────────────────────────────────
// RTHINK-BP-001 §17

const ACTOR_ROLES = [
  "ENGINEER",
  "MODEL",
  "TOOL",
  "VERIFIER",
  "HUMAN",
  "GUARDIAN",
  "EXECUTOR",
];

// ─── Artifact Type Values ───────────────────────────────────────────────────
// RTHINK-BP-001 §8

const ARTIFACT_TYPES = [
  "MISSION_CONTRACT",
  "OBSERVATION",
  "PROBLEM_REPRESENTATION",
  "QUESTION",
  "CLAIM",
  "HYPOTHESIS",
  "VALIDATION",
  "RELATIONSHIP",
  "CHALLENGE",
  "DISCOVERY",
  "DECISION",
  "EVOLUTION",
];

// ─── Authority Status Values ────────────────────────────────────────────────
const AUTHORITY_STATUSES = [
  "NOT_REQUIRED",
  "PENDING",
  "GRANTED",
  "DENIED",
  "ESCALATED",
];

// ─── RTP Version ────────────────────────────────────────────────────────────
const SUPPORTED_RTP_VERSIONS = ["1.0"];

// ─── Mission Contract JSON Schema ───────────────────────────────────────────
// RTHINK-BP-001 Appendix A

export const MissionContractJsonSchema: JsonSchemaRecord = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "rthink://schemas/mission-contract/v1.0",
  title: "R-Think Mission Contract",
  description:
    "Defines the bounded work, authority, acceptance criteria, and governance for an R-Think mission. RTHINK-BP-001 Appendix A.",
  type: "object",
  properties: {
    missionId: { type: "string", minLength: 1 },
    consumerBlueprintRefs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          documentId: { type: "string", minLength: 1 },
          section: { type: "string" },
        },
        required: ["documentId"],
        additionalProperties: false,
      },
      minItems: 1,
    },
    objective: { type: "string", minLength: 1 },
    context: { type: "string" },
    allowedScope: {
      type: "object",
      properties: {
        projects: { type: "array", items: { type: "string" } },
        tools: { type: "array", items: { type: "string" } },
        description: { type: "string" },
      },
      additionalProperties: false,
    },
    explicitNonScope: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    authority: {
      type: "object",
      properties: {
        read: { type: "boolean" },
        write: { type: "boolean" },
        execute: { type: "boolean" },
        network: { type: "boolean" },
        humanDecision: { type: "boolean" },
      },
      additionalProperties: false,
    },
    riskNoveltyLevel: constEnum(MISSION_RISK_LEVELS),
    acceptanceCriteria: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    verification: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    evidenceRequirements: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    failureProtocol: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    escalationConditions: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    guardianApproval: { type: "boolean" },
  },
  required: [
    "missionId",
    "consumerBlueprintRefs",
    "objective",
    "allowedScope",
    "explicitNonScope",
    "authority",
    "riskNoveltyLevel",
    "acceptanceCriteria",
    "verification",
    "evidenceRequirements",
    "failureProtocol",
    "escalationConditions",
    "guardianApproval",
  ],
  additionalProperties: false,
};

// ─── RTP Message JSON Schema ────────────────────────────────────────────────
// RTHINK-BP-001 §12

export const RtpMessageJsonSchema: JsonSchemaRecord = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "rthink://schemas/rtp-message/v1.0",
  title: "R-Think Protocol Message",
  description:
    "A message within the R-Think Protocol (RTP) exchanged between runtime actors. RTHINK-BP-001 §12.",
  type: "object",
  properties: {
    rtpVersion: { type: "string", enum: SUPPORTED_RTP_VERSIONS },
    messageId: { type: "string", minLength: 1 },
    missionId: { type: "string", minLength: 1 },
    actor: {
      type: "object",
      properties: {
        id: { type: "string", minLength: 1 },
        role: constEnum(ACTOR_ROLES),
      },
      required: ["id", "role"],
      additionalProperties: false,
    },
    state: constEnum(ALL_STATES),
    messageType: constEnum(RTP_MESSAGE_TYPES),
    blueprintRefs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          documentId: { type: "string", minLength: 1 },
          section: { type: "string" },
        },
        required: ["documentId"],
        additionalProperties: false,
      },
    },
    payload: { type: "object" },
    evidenceRefs: {
      type: "array",
      items: { type: "string" },
    },
    requestedTransition: { type: "string", enum: ALL_STATES },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    unresolved: {
      type: "array",
      items: { type: "string" },
    },
    timestamp: { type: "string", format: "date-time" },
  },
  required: [
    "rtpVersion",
    "messageId",
    "missionId",
    "actor",
    "state",
    "messageType",
    "blueprintRefs",
    "payload",
    "evidenceRefs",
    "timestamp",
  ],
  additionalProperties: false,
};

// ─── Artifact Envelope JSON Schema ──────────────────────────────────────────
// RTHINK-BP-001 Appendix B

export const ArtifactEnvelopeJsonSchema: JsonSchemaRecord = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "rthink://schemas/artifact-envelope/v1.0",
  title: "R-Think Artifact Envelope",
  description:
    "Standard envelope for all cognitive artifacts in R-Think. RTHINK-BP-001 Appendix B.",
  type: "object",
  properties: {
    rtpVersion: { type: "string", enum: SUPPORTED_RTP_VERSIONS },
    artifactId: { type: "string", minLength: 1 },
    artifactType: constEnum(ARTIFACT_TYPES),
    version: { type: "number", exclusiveMinimum: 0 },
    missionId: { type: "string", minLength: 1 },
    consumerBlueprintRefs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          documentId: { type: "string", minLength: 1 },
          section: { type: "string" },
        },
        required: ["documentId"],
        additionalProperties: false,
      },
      minItems: 1,
    },
    actor: {
      type: "object",
      properties: {
        id: { type: "string", minLength: 1 },
        role: constEnum(ACTOR_ROLES),
      },
      required: ["id", "role"],
      additionalProperties: false,
    },
    state: constEnum(ALL_STATES),
    sourceRefs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", minLength: 1 },
          uri: { type: "string", minLength: 1 },
        },
        required: ["type", "uri"],
        additionalProperties: false,
      },
    },
    method: { type: "string" },
    payload: { type: "object" },
    evidenceRefs: {
      type: "array",
      items: { type: "string" },
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    uncertainties: {
      type: "array",
      items: { type: "string" },
    },
    contradictions: {
      type: "array",
      items: { type: "string" },
    },
    createdAt: { type: "string", format: "date-time" },
    supersedes: { type: "string" },
    integrity: {
      type: "object",
      properties: {
        algorithm: { type: "string" },
        hash: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  required: [
    "rtpVersion",
    "artifactId",
    "artifactType",
    "version",
    "missionId",
    "consumerBlueprintRefs",
    "actor",
    "state",
    "sourceRefs",
    "payload",
    "evidenceRefs",
    "createdAt",
  ],
  allOf: [
    {
      if: {
        properties: { artifactType: { const: "OBSERVATION" } },
        required: ["artifactType"],
      },
      then: {
        properties: {
          sourceRefs: { type: "array", minItems: 1 },
        },
        required: ["sourceRefs"],
      },
    },
  ],
  additionalProperties: false,
};

// ─── Transition Decision JSON Schema ────────────────────────────────────────
// RTHINK-BP-001 §7.2

export const TransitionDecisionJsonSchema: JsonSchemaRecord = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "rthink://schemas/transition-decision/v1.0",
  title: "R-Think Transition Decision",
  description:
    "Formal decision record for cognitive state transitions. RTHINK-BP-001 §7.2.",
  type: "object",
  properties: {
    missionId: { type: "string", minLength: 1 },
    sourceState: constEnum(ALL_STATES),
    requestedState: constEnum(ALL_STATES),
    decision: constEnum(TRANSITION_DECISIONS),
    ruleVersion: { type: "string", minLength: 1 },
    requiredArtifacts: {
      type: "array",
      items: { type: "string" },
    },
    satisfiedRequirements: {
      type: "array",
      items: { type: "string" },
    },
    missingRequirements: {
      type: "array",
      items: { type: "string" },
    },
    contradictions: {
      type: "array",
      items: { type: "string" },
    },
    authorityStatus: constEnum(AUTHORITY_STATUSES),
    evidenceRefs: {
      type: "array",
      items: { type: "string" },
    },
    reasonCode: { type: "string" },
    nextAllowedActions: {
      type: "array",
      items: { type: "string", enum: ALL_STATES },
    },
    timestamp: { type: "string", format: "date-time" },
  },
  required: [
    "missionId",
    "sourceState",
    "requestedState",
    "decision",
    "ruleVersion",
    "requiredArtifacts",
    "satisfiedRequirements",
    "missingRequirements",
    "contradictions",
    "authorityStatus",
    "evidenceRefs",
    "nextAllowedActions",
    "timestamp",
  ],
  additionalProperties: false,
};
