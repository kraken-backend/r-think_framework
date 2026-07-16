// Invalid fixtures — each should fail a specific validation rule

// ─── Mission Contract: missing objective ────────────────────────────────────
export const invalidMissionContractNoObjective = {
  missionId: "RTHINK-RT-001",
  consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001" }],
  // objective: MISSING
  allowedScope: { projects: ["rthink-runtime"] },
  explicitNonScope: ["Full Runtime orchestration"],
  authority: { read: true },
  riskNoveltyLevel: "L2_SIGNIFICANT",
  acceptanceCriteria: ["Schema exists"],
  verification: ["Tests pass"],
  evidenceRequirements: ["Test output"],
  failureProtocol: ["Retry"],
  escalationConditions: ["Blueprint unavailable"],
  guardianApproval: false,
};

// ─── Mission Contract: missing blueprint references ─────────────────────────
export const invalidMissionContractNoBlueprintRefs = {
  missionId: "RTHINK-RT-001",
  // consumerBlueprintRefs: MISSING
  objective: "Test foundation",
  allowedScope: { projects: ["rthink-runtime"] },
  explicitNonScope: ["Full Runtime"],
  authority: { read: true },
  riskNoveltyLevel: "L2_SIGNIFICANT",
  acceptanceCriteria: ["Schema exists"],
  verification: ["Tests pass"],
  evidenceRequirements: ["Test output"],
  failureProtocol: ["Retry"],
  escalationConditions: ["Blueprint unavailable"],
  guardianApproval: false,
};

// ─── Mission Contract: missing acceptance criteria ──────────────────────────
export const invalidMissionContractNoAcceptanceCriteria = {
  missionId: "RTHINK-RT-001",
  consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001" }],
  objective: "Test foundation",
  allowedScope: { projects: ["rthink-runtime"] },
  explicitNonScope: ["Full Runtime"],
  authority: { read: true },
  riskNoveltyLevel: "L2_SIGNIFICANT",
  // acceptanceCriteria: MISSING
  verification: ["Tests pass"],
  evidenceRequirements: ["Test output"],
  failureProtocol: ["Retry"],
  escalationConditions: ["Blueprint unavailable"],
  guardianApproval: false,
};

// ─── Mission Contract: invalid risk level ───────────────────────────────────
export const invalidMissionContractBadRiskLevel = {
  missionId: "RTHINK-RT-001",
  consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001" }],
  objective: "Test foundation",
  allowedScope: { projects: ["rthink-runtime"] },
  explicitNonScope: ["Full Runtime"],
  authority: { read: true },
  riskNoveltyLevel: "L5_INSANE", // INVALID
  acceptanceCriteria: ["Schema exists"],
  verification: ["Tests pass"],
  evidenceRequirements: ["Test output"],
  failureProtocol: ["Retry"],
  escalationConditions: ["Blueprint unavailable"],
  guardianApproval: false,
};

// ─── RTP Message: invalid actor role ────────────────────────────────────────
export const invalidRtpMessageBadActorRole = {
  rtpVersion: "1.0",
  messageId: "RTP-MSG-00001",
  missionId: "RTHINK-RT-001",
  actor: {
    id: "opencode-01",
    role: "WIZARD", // INVALID
  },
  state: "OBSERVE",
  messageType: "MISSION_CREATED",
  blueprintRefs: [{ documentId: "RTHINK-BP-001" }],
  payload: {},
  evidenceRefs: [],
  timestamp: "2026-07-16T23:00:00.000Z",
};

// ─── RTP Message: unsupported RTP version ───────────────────────────────────
export const invalidRtpMessageBadVersion = {
  rtpVersion: "99.0", // UNSUPPORTED
  messageId: "RTP-MSG-00001",
  missionId: "RTHINK-RT-001",
  actor: {
    id: "opencode-01",
    role: "ENGINEER",
  },
  state: "OBSERVE",
  messageType: "MISSION_CREATED",
  blueprintRefs: [{ documentId: "RTHINK-BP-001" }],
  payload: {},
  evidenceRefs: [],
  timestamp: "2026-07-16T23:00:00.000Z",
};

// ─── RTP Message: invalid cognitive state ────────────────────────────────────
export const invalidRtpMessageBadState = {
  rtpVersion: "1.0",
  messageId: "RTP-MSG-00001",
  missionId: "RTHINK-RT-001",
  actor: {
    id: "opencode-01",
    role: "ENGINEER",
  },
  state: "DREAMING", // INVALID
  messageType: "MISSION_CREATED",
  blueprintRefs: [{ documentId: "RTHINK-BP-001" }],
  payload: {},
  evidenceRefs: [],
  timestamp: "2026-07-16T23:00:00.000Z",
};

// ─── RTP Message: invalid message type ──────────────────────────────────────
export const invalidRtpMessageBadMessageType = {
  rtpVersion: "1.0",
  messageId: "RTP-MSG-00001",
  missionId: "RTHINK-RT-001",
  actor: {
    id: "opencode-01",
    role: "ENGINEER",
  },
  state: "OBSERVE",
  messageType: "SEND_MAGIC", // INVALID
  blueprintRefs: [{ documentId: "RTHINK-BP-001" }],
  payload: {},
  evidenceRefs: [],
  timestamp: "2026-07-16T23:00:00.000Z",
};

// ─── Artifact Envelope: missing source refs ─────────────────────────────────
export const invalidArtifactEnvelopeNoSourceRefs = {
  rtpVersion: "1.0",
  artifactId: "ART-00001",
  artifactType: "OBSERVATION",
  version: 1,
  missionId: "RTHINK-RT-001",
  consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001" }],
  actor: {
    id: "opencode-01",
    role: "ENGINEER",
  },
  state: "OBSERVE",
  // sourceRefs: MISSING — required for provenance
  payload: {},
  evidenceRefs: [],
  createdAt: "2026-07-16T23:00:00.000Z",
};

// ─── Transition Decision: invalid decision enum ─────────────────────────────
export const invalidTransitionDecisionBadEnum = {
  missionId: "RTHINK-RT-001",
  sourceState: "OBSERVE",
  requestedState: "UNDERSTAND",
  decision: "MAYBE", // INVALID
  ruleVersion: "1.0",
  requiredArtifacts: [],
  satisfiedRequirements: [],
  missingRequirements: [],
  contradictions: [],
  authorityStatus: "NOT_REQUIRED",
  evidenceRefs: [],
  nextAllowedActions: [],
  timestamp: "2026-07-16T23:00:00.000Z",
};

// ─── Transition Decision: missing rule version ──────────────────────────────
export const invalidTransitionDecisionNoRuleVersion = {
  missionId: "RTHINK-RT-001",
  sourceState: "OBSERVE",
  requestedState: "UNDERSTAND",
  decision: "ALLOW",
  // ruleVersion: MISSING
  requiredArtifacts: [],
  satisfiedRequirements: [],
  missingRequirements: [],
  contradictions: [],
  authorityStatus: "NOT_REQUIRED",
  evidenceRefs: [],
  nextAllowedActions: [],
  timestamp: "2026-07-16T23:00:00.000Z",
};

// ─── RTP Message: invalid ISO date-time format ─────────────────────────────
export const invalidRtpMessageBadTimestamp = {
  rtpVersion: "1.0",
  messageId: "RTP-MSG-00001",
  missionId: "RTHINK-RT-001",
  actor: {
    id: "opencode-01",
    role: "ENGINEER",
  },
  state: "OBSERVE",
  messageType: "MISSION_CREATED",
  blueprintRefs: [{ documentId: "RTHINK-BP-001" }],
  payload: {},
  evidenceRefs: [],
  timestamp: "not-a-date", // INVALID ISO date-time
};

// ─── RTP Message: unknown property (strict mode) ────────────────────────────
export const invalidRtpMessageUnknownProperty = {
  rtpVersion: "1.0",
  messageId: "RTP-MSG-00001",
  missionId: "RTHINK-RT-001",
  actor: {
    id: "opencode-01",
    role: "ENGINEER",
  },
  state: "OBSERVE",
  messageType: "MISSION_CREATED",
  blueprintRefs: [{ documentId: "RTHINK-BP-001" }],
  payload: {},
  evidenceRefs: [],
  timestamp: "2026-07-16T23:00:00.000Z",
  injectedField: "should not be here", // UNKNOWN
};
