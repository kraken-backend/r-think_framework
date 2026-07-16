// Valid Mission Contract fixture
// RTHINK-BP-001 Appendix A

export const validMissionContract = {
  missionId: "RTHINK-RT-001",
  consumerBlueprintRefs: [
    { documentId: "RTHINK-BP-001", section: "20.1" },
  ],
  objective:
    "Establish minimum formal and testable repository foundation for R-Think Runtime",
  context: "Initial foundation mission. Blueprint is source of truth.",
  allowedScope: {
    projects: ["rthink-runtime"],
    tools: ["read_file", "write_file", "run_tests"],
    description: "Repository baseline, schemas, validators, fixtures, tests",
  },
  explicitNonScope: [
    "Full Mission Runtime orchestration",
    "PostgreSQL persistence",
    "REST API",
    "CLI commands",
  ],
  authority: {
    read: true,
    write: true,
    execute: false,
    network: false,
    humanDecision: false,
  },
  riskNoveltyLevel: "L2_SIGNIFICANT",
  acceptanceCriteria: [
    "All four required schemas exist",
    "Zod validators match schemas",
    "Valid fixtures pass validation",
    "Invalid fixtures fail for expected reason",
    "TypeScript typecheck passes",
  ],
  verification: [
    "Contract tests with Vitest",
    "Schema validation tests",
    "Enum rejection tests",
  ],
  evidenceRequirements: [
    "Test output with exit codes",
    "TypeScript build output",
    "Git status output",
  ],
  failureProtocol: [
    "Record actual failure",
    "Return to observation",
    "Form bounded alternative",
    "Retry with changed method",
  ],
  escalationConditions: [
    "Blueprint unavailable",
    "Doctrine ambiguous",
    "Dependency fails License Gate",
  ],
  guardianApproval: false,
};

// Valid RTP Message fixture
// RTHINK-BP-001 §12

export const validRtpMessage = {
  rtpVersion: "1.0",
  messageId: "RTP-MSG-00001",
  missionId: "RTHINK-RT-001",
  actor: {
    id: "opencode-01",
    role: "ENGINEER",
  },
  state: "OBSERVE",
  messageType: "MISSION_CREATED",
  blueprintRefs: [{ documentId: "RTHINK-BP-001", section: "20.1" }],
  payload: { description: "Mission initialized" },
  evidenceRefs: [],
  timestamp: "2026-07-16T23:00:00.000Z",
};

// Valid Artifact Envelope fixture
// RTHINK-BP-001 Appendix B

export const validArtifactEnvelope = {
  rtpVersion: "1.0",
  artifactId: "ART-00001",
  artifactType: "MISSION_CONTRACT",
  version: 1,
  missionId: "RTHINK-RT-001",
  consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001", section: "20.1" }],
  actor: {
    id: "opencode-01",
    role: "ENGINEER",
  },
  state: "OBSERVE",
  sourceRefs: [{ type: "document", uri: "RTHINK-BP-001" }],
  method: "manual",
  payload: { objective: "Foundation mission" },
  evidenceRefs: [],
  confidence: 0.9,
  uncertainties: [],
  contradictions: [],
  createdAt: "2026-07-16T23:00:00.000Z",
};

// Valid Transition Decision fixture
// RTHINK-BP-001 §7.2

export const validTransitionDecision = {
  missionId: "RTHINK-RT-001",
  sourceState: "OBSERVE",
  requestedState: "UNDERSTAND",
  decision: "ALLOW",
  ruleVersion: "1.0",
  requiredArtifacts: ["observation-records"],
  satisfiedRequirements: ["observation-records"],
  missingRequirements: [],
  contradictions: [],
  authorityStatus: "NOT_REQUIRED",
  evidenceRefs: ["artifact://obs-001"],
  reasonCode: "SUFFICIENT_EVIDENCE",
  nextAllowedActions: ["UNDERSTAND", "QUESTION"],
  timestamp: "2026-07-16T23:00:00.000Z",
};

// Valid non-Observation Artifact Envelope without sourceRefs
// RTHINK-BP-001 §8: sourceRefs required only for OBSERVATION
export const validArtifactEnvelopeNonObservationNoSourceRefs = {
  rtpVersion: "1.0",
  artifactId: "ART-00002",
  artifactType: "DECISION",
  version: 1,
  missionId: "RTHINK-RT-001",
  consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001", section: "20.1" }],
  actor: {
    id: "opencode-01",
    role: "ENGINEER",
  },
  state: "VALIDATE",
  sourceRefs: [],
  payload: { decision: "ALLOW" },
  evidenceRefs: [],
  createdAt: "2026-07-16T23:00:00.000Z",
};
