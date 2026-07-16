// R-Think Runtime — Contract Tests
// Blueprint Reference: RTHINK-BP-001 §21, §23, Mission Spec §13

import { describe, it, expect } from "vitest";
import {
  MissionContractSchema,
  RtpMessageSchema,
  ArtifactEnvelopeSchema,
  TransitionDecisionSchema,
  CognitiveStateSchema,
  ActorRoleSchema,
} from "../../src/schemas/index.js";
import {
  validateAllowDecisionArtifacts,
  validateCriticalMissionAuthority,
  validateRtpVersion,
} from "../../src/schemas/validation.js";
import {
  validMissionContract,
  validRtpMessage,
  validArtifactEnvelope,
  validTransitionDecision,
} from "../fixtures/valid/index.js";
import {
  invalidMissionContractNoObjective,
  invalidMissionContractNoBlueprintRefs,
  invalidMissionContractNoAcceptanceCriteria,
  invalidMissionContractBadRiskLevel,
  invalidRtpMessageBadActorRole,
  invalidRtpMessageBadVersion,
  invalidRtpMessageBadState,
  invalidRtpMessageBadMessageType,
  invalidArtifactEnvelopeNoSourceRefs,
  invalidTransitionDecisionBadEnum,
  invalidTransitionDecisionNoRuleVersion,
} from "../fixtures/invalid/index.js";

// ─── Mission Contract Tests ─────────────────────────────────────────────────
// RTHINK-BP-001 Appendix A

describe("Mission Contract", () => {
  it("valid Mission Contract is accepted", () => {
    const result = MissionContractSchema.safeParse(validMissionContract);
    expect(result.success).toBe(true);
  });

  it("Mission Contract without objective is rejected", () => {
    const result = MissionContractSchema.safeParse(
      invalidMissionContractNoObjective
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      expect(issues).toContain("objective");
    }
  });

  it("Mission Contract without blueprint references is rejected", () => {
    const result = MissionContractSchema.safeParse(
      invalidMissionContractNoBlueprintRefs
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      expect(issues).toContain("consumerBlueprintRefs");
    }
  });

  it("Mission Contract without acceptance criteria is rejected", () => {
    const result = MissionContractSchema.safeParse(
      invalidMissionContractNoAcceptanceCriteria
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      expect(issues).toContain("acceptanceCriteria");
    }
  });

  it("invalid risk level is rejected", () => {
    const result = MissionContractSchema.safeParse(
      invalidMissionContractBadRiskLevel
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      expect(issues).toContain("riskNoveltyLevel");
    }
  });
});

// ─── RTP Message Tests ──────────────────────────────────────────────────────
// RTHINK-BP-001 §12

describe("RTP Message", () => {
  it("valid RTP message is accepted", () => {
    const result = RtpMessageSchema.safeParse(validRtpMessage);
    expect(result.success).toBe(true);
  });

  it("invalid actor role is rejected", () => {
    const result = RtpMessageSchema.safeParse(invalidRtpMessageBadActorRole);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      expect(issues).toContain("actor.role");
    }
  });

  it("unsupported RTP version is rejected", () => {
    const result = RtpMessageSchema.safeParse(invalidRtpMessageBadVersion);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      expect(issues).toContain("rtpVersion");
    }
  });

  it("invalid cognitive state is rejected", () => {
    const result = RtpMessageSchema.safeParse(invalidRtpMessageBadState);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      expect(issues).toContain("state");
    }
  });

  it("invalid RTP message type is rejected", () => {
    const result = RtpMessageSchema.safeParse(
      invalidRtpMessageBadMessageType
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      expect(issues).toContain("messageType");
    }
  });
});

// ─── Artifact Envelope Tests ────────────────────────────────────────────────
// RTHINK-BP-001 Appendix B

describe("Artifact Envelope", () => {
  it("valid Artifact Envelope is accepted", () => {
    const result = ArtifactEnvelopeSchema.safeParse(validArtifactEnvelope);
    expect(result.success).toBe(true);
  });

  it("Artifact without provenance/source information is rejected", () => {
    const result = ArtifactEnvelopeSchema.safeParse(
      invalidArtifactEnvelopeNoSourceRefs
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      expect(issues).toContain("sourceRefs");
    }
  });
});

// ─── Transition Decision Tests ──────────────────────────────────────────────
// RTHINK-BP-001 §7.2

describe("Transition Decision", () => {
  it("valid Transition Decision is accepted", () => {
    const result = TransitionDecisionSchema.safeParse(validTransitionDecision);
    expect(result.success).toBe(true);
  });

  it("invalid transition decision enum is rejected", () => {
    const result = TransitionDecisionSchema.safeParse(
      invalidTransitionDecisionBadEnum
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      expect(issues).toContain("decision");
    }
  });

  it("Transition Decision without rule version is rejected", () => {
    const result = TransitionDecisionSchema.safeParse(
      invalidTransitionDecisionNoRuleVersion
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.path.join("."));
      expect(issues).toContain("ruleVersion");
    }
  });

  it("DERIVED: ALLOW decision with unresolved required artifacts is rejected", () => {
    const result = validateAllowDecisionArtifacts({
      ...validTransitionDecision,
      missingRequirements: ["observation-records"],
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("missing required artifacts");
  });

  it("DERIVED: Critical mission lacking explicit authority evidence is rejected", () => {
    const result = validateCriticalMissionAuthority(
      { ...validTransitionDecision, authorityStatus: "PENDING" },
      "L3_CRITICAL"
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("authority status");
  });
});

// ─── Unknown Fields Tests ───────────────────────────────────────────────────
// RTHINK-BP-001 §21: Schema contract

describe("Unknown Fields", () => {
  it("unknown fields in Mission Contract are rejected (strict mode)", () => {
    const result = MissionContractSchema.safeParse({
      ...validMissionContract,
      unknownField: "should not be here",
    });
    expect(result.success).toBe(false);
  });

  it("unknown fields in RTP Message are rejected (strict mode)", () => {
    const result = RtpMessageSchema.safeParse({
      ...validRtpMessage,
      extraData: 42,
    });
    expect(result.success).toBe(false);
  });

  it("unknown fields in Artifact Envelope are rejected (strict mode)", () => {
    const result = ArtifactEnvelopeSchema.safeParse({
      ...validArtifactEnvelope,
      sneakyField: true,
    });
    expect(result.success).toBe(false);
  });

  it("unknown fields in Transition Decision are rejected (strict mode)", () => {
    const result = TransitionDecisionSchema.safeParse({
      ...validTransitionDecision,
      injectedField: "nope",
    });
    expect(result.success).toBe(false);
  });
});

// ─── RTP Version Gate Tests ─────────────────────────────────────────────────

describe("RTP Version Gate", () => {
  it("DERIVED: supported RTP version 1.0 is accepted", () => {
    const result = validateRtpVersion("1.0");
    expect(result.valid).toBe(true);
  });

  it("DERIVED: unsupported RTP version 2.0 is rejected", () => {
    const result = validateRtpVersion("2.0");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Unsupported RTP version");
  });
});

// ─── Schema Enum Completeness ───────────────────────────────────────────────
// RTHINK-BP-001 §11: Required canonical types

describe("Canonical Enum Completeness", () => {
  it("CognitiveState schema has exactly 8 primary states", () => {
    const values = CognitiveStateSchema.options;
    expect(values).toHaveLength(8);
    expect(values).toContain("OBSERVE");
    expect(values).toContain("UNDERSTAND");
    expect(values).toContain("QUESTION");
    expect(values).toContain("VALIDATE");
    expect(values).toContain("CONNECT");
    expect(values).toContain("CHALLENGE");
    expect(values).toContain("DISCOVER");
    expect(values).toContain("EVOLVE");
  });

  it("ActorRole schema has exactly 7 roles", () => {
    const values = ActorRoleSchema.options;
    expect(values).toHaveLength(7);
    expect(values).toContain("ENGINEER");
    expect(values).toContain("MODEL");
    expect(values).toContain("TOOL");
    expect(values).toContain("VERIFIER");
    expect(values).toContain("HUMAN");
    expect(values).toContain("GUARDIAN");
    expect(values).toContain("EXECUTOR");
  });
});
