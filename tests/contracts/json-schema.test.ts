// R-Think Runtime — JSON Schema Contract Tests (ajv standards-compliant)
// Blueprint Reference: RTHINK-BP-001 §21
// RTHINK-RT-001-R1 Correction: Replaced custom validator with ajv

import { describe, it, expect, beforeAll } from "vitest";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import type { ValidateFunction } from "ajv";
import {
  MissionContractJsonSchema,
  RtpMessageJsonSchema,
  ArtifactEnvelopeJsonSchema,
  TransitionDecisionJsonSchema,
} from "../../src/schemas/json-schema.js";
import {
  MissionContractSchema,
  RtpMessageSchema,
  ArtifactEnvelopeSchema,
  TransitionDecisionSchema,
} from "../../src/schemas/index.js";
import {
  validMissionContract,
  validRtpMessage,
  validArtifactEnvelope,
  validTransitionDecision,
  validArtifactEnvelopeNonObservationNoSourceRefs,
} from "../fixtures/valid/index.js";
import {
  invalidMissionContractNoObjective,
  invalidMissionContractNoBlueprintRefs,
  invalidMissionContractNoAcceptanceCriteria,
  invalidMissionContractBadRiskLevel,
  invalidRtpMessageBadVersion,
  invalidRtpMessageBadState,
  invalidRtpMessageBadMessageType,
  invalidRtpMessageBadTimestamp,
  invalidRtpMessageUnknownProperty,
  invalidArtifactEnvelopeNoSourceRefs,
  invalidTransitionDecisionBadEnum,
  invalidTransitionDecisionNoRuleVersion,
} from "../fixtures/invalid/index.js";

// ─── Ajv Setup ──────────────────────────────────────────────────────────────

let ajv: InstanceType<typeof Ajv2020>;
let validateMissionContract: ValidateFunction;
let validateRtpMessage: ValidateFunction;
let validateArtifactEnvelope: ValidateFunction;
let validateTransitionDecision: ValidateFunction;

beforeAll(() => {
  ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);

  validateMissionContract = ajv.compile(MissionContractJsonSchema);
  validateRtpMessage = ajv.compile(RtpMessageJsonSchema);
  validateArtifactEnvelope = ajv.compile(ArtifactEnvelopeJsonSchema);
  validateTransitionDecision = ajv.compile(TransitionDecisionJsonSchema);
});

// ─── Schema Compilation Tests ───────────────────────────────────────────────

describe("JSON Schema Compilation", () => {
  it("Mission Contract schema compiles", () => {
    expect(validateMissionContract).toBeDefined();
    expect(typeof validateMissionContract).toBe("function");
  });

  it("RTP Message schema compiles", () => {
    expect(validateRtpMessage).toBeDefined();
    expect(typeof validateRtpMessage).toBe("function");
  });

  it("Artifact Envelope schema compiles", () => {
    expect(validateArtifactEnvelope).toBeDefined();
    expect(typeof validateArtifactEnvelope).toBe("function");
  });

  it("Transition Decision schema compiles", () => {
    expect(validateTransitionDecision).toBeDefined();
    expect(typeof validateTransitionDecision).toBe("function");
  });
});

// ─── Mission Contract Tests ─────────────────────────────────────────────────

describe("JSON Schema — Mission Contract", () => {
  it("valid Mission Contract passes", () => {
    expect(validateMissionContract(validMissionContract)).toBe(true);
  });

  it("without objective fails", () => {
    expect(validateMissionContract(invalidMissionContractNoObjective)).toBe(
      false
    );
  });

  it("without blueprint refs fails", () => {
    expect(
      validateMissionContract(invalidMissionContractNoBlueprintRefs)
    ).toBe(false);
  });

  it("without acceptance criteria fails", () => {
    expect(
      validateMissionContract(invalidMissionContractNoAcceptanceCriteria)
    ).toBe(false);
  });

  it("invalid risk level fails", () => {
    expect(
      validateMissionContract(invalidMissionContractBadRiskLevel)
    ).toBe(false);
  });

  it("unknown properties fail (additionalProperties: false)", () => {
    expect(
      validateMissionContract({ ...validMissionContract, injected: true })
    ).toBe(false);
  });
});

// ─── RTP Message Tests ──────────────────────────────────────────────────────

describe("JSON Schema — RTP Message", () => {
  it("valid RTP message passes", () => {
    expect(validateRtpMessage(validRtpMessage)).toBe(true);
  });

  it("unsupported RTP version fails", () => {
    expect(validateRtpMessage(invalidRtpMessageBadVersion)).toBe(false);
  });

  it("invalid state fails", () => {
    expect(validateRtpMessage(invalidRtpMessageBadState)).toBe(false);
  });

  it("invalid message type fails", () => {
    expect(validateRtpMessage(invalidRtpMessageBadMessageType)).toBe(false);
  });

  it("invalid ISO date-time fails", () => {
    expect(validateRtpMessage(invalidRtpMessageBadTimestamp)).toBe(false);
  });

  it("unknown properties fail", () => {
    expect(validateRtpMessage(invalidRtpMessageUnknownProperty)).toBe(false);
  });
});

// ─── Artifact Envelope Tests ────────────────────────────────────────────────

describe("JSON Schema — Artifact Envelope", () => {
  it("valid Artifact Envelope passes", () => {
    expect(validateArtifactEnvelope(validArtifactEnvelope)).toBe(true);
  });

  it("OBSERVATION without sourceRefs fails", () => {
    expect(
      validateArtifactEnvelope(invalidArtifactEnvelopeNoSourceRefs)
    ).toBe(false);
  });

  it("non-Observation artifact without sourceRefs passes", () => {
    expect(
      validateArtifactEnvelope(validArtifactEnvelopeNonObservationNoSourceRefs)
    ).toBe(true);
  });

  it("unknown properties fail", () => {
    expect(
      validateArtifactEnvelope({
        ...validArtifactEnvelope,
        sneakyField: true,
      })
    ).toBe(false);
  });
});

// ─── Transition Decision Tests ──────────────────────────────────────────────

describe("JSON Schema — Transition Decision", () => {
  it("valid Transition Decision passes", () => {
    expect(validateTransitionDecision(validTransitionDecision)).toBe(true);
  });

  it("invalid decision enum fails", () => {
    expect(
      validateTransitionDecision(invalidTransitionDecisionBadEnum)
    ).toBe(false);
  });

  it("missing ruleVersion fails", () => {
    expect(
      validateTransitionDecision(invalidTransitionDecisionNoRuleVersion)
    ).toBe(false);
  });

  it("unknown properties fail", () => {
    expect(
      validateTransitionDecision({
        ...validTransitionDecision,
        injected: "nope",
      })
    ).toBe(false);
  });
});

// ─── Zod and JSON Schema Parity Tests ───────────────────────────────────────
// RTHINK-RT-001-R1: Explicit parity between Zod and JSON Schema

describe("Zod ↔ JSON Schema Parity", () => {
  type SchemaPair = {
    name: string;
    zodSchema: (typeof MissionContractSchema);
    validateJson: () => ValidateFunction;
    data: unknown;
  };

  const jsonValidators: Record<string, () => ValidateFunction> = {
    MissionContract: () => validateMissionContract,
    RtpMessage: () => validateRtpMessage,
    ArtifactEnvelope: () => validateArtifactEnvelope,
    TransitionDecision: () => validateTransitionDecision,
  };

  const validFixtures: SchemaPair[] = [
    { name: "MissionContract", zodSchema: MissionContractSchema, validateJson: jsonValidators.MissionContract, data: validMissionContract },
    { name: "RtpMessage", zodSchema: RtpMessageSchema, validateJson: jsonValidators.RtpMessage, data: validRtpMessage },
    { name: "ArtifactEnvelope", zodSchema: ArtifactEnvelopeSchema, validateJson: jsonValidators.ArtifactEnvelope, data: validArtifactEnvelope },
    { name: "TransitionDecision", zodSchema: TransitionDecisionSchema, validateJson: jsonValidators.TransitionDecision, data: validTransitionDecision },
    { name: "ArtifactEnvelope (non-Obs, no sourceRefs)", zodSchema: ArtifactEnvelopeSchema, validateJson: jsonValidators.ArtifactEnvelope, data: validArtifactEnvelopeNonObservationNoSourceRefs },
  ];

  const invalidFixtures: SchemaPair[] = [
    { name: "MissionContract no objective", zodSchema: MissionContractSchema, validateJson: jsonValidators.MissionContract, data: invalidMissionContractNoObjective },
    { name: "MissionContract no blueprintRefs", zodSchema: MissionContractSchema, validateJson: jsonValidators.MissionContract, data: invalidMissionContractNoBlueprintRefs },
    { name: "MissionContract no acceptanceCriteria", zodSchema: MissionContractSchema, validateJson: jsonValidators.MissionContract, data: invalidMissionContractNoAcceptanceCriteria },
    { name: "MissionContract bad riskLevel", zodSchema: MissionContractSchema, validateJson: jsonValidators.MissionContract, data: invalidMissionContractBadRiskLevel },
    { name: "RtpMessage bad version", zodSchema: RtpMessageSchema, validateJson: jsonValidators.RtpMessage, data: invalidRtpMessageBadVersion },
    { name: "RtpMessage bad state", zodSchema: RtpMessageSchema, validateJson: jsonValidators.RtpMessage, data: invalidRtpMessageBadState },
    { name: "RtpMessage bad messageType", zodSchema: RtpMessageSchema, validateJson: jsonValidators.RtpMessage, data: invalidRtpMessageBadMessageType },
    { name: "RtpMessage bad timestamp", zodSchema: RtpMessageSchema, validateJson: jsonValidators.RtpMessage, data: invalidRtpMessageBadTimestamp },
    { name: "ArtifactEnvelope OBS no sourceRefs", zodSchema: ArtifactEnvelopeSchema, validateJson: jsonValidators.ArtifactEnvelope, data: invalidArtifactEnvelopeNoSourceRefs },
    { name: "TransitionDecision bad enum", zodSchema: TransitionDecisionSchema, validateJson: jsonValidators.TransitionDecision, data: invalidTransitionDecisionBadEnum },
    { name: "TransitionDecision no ruleVersion", zodSchema: TransitionDecisionSchema, validateJson: jsonValidators.TransitionDecision, data: invalidTransitionDecisionNoRuleVersion },
  ];

  for (const f of validFixtures) {
    it(`VALID ${f.name}: Zod and JSON Schema both accept`, () => {
      const zodResult = f.zodSchema.safeParse(f.data);
      const jsonValid = f.validateJson()(f.data) as boolean;
      expect(zodResult.success).toBe(true);
      expect(jsonValid).toBe(true);
    });
  }

  for (const f of invalidFixtures) {
    it(`INVALID ${f.name}: Zod and JSON Schema both reject`, () => {
      const zodResult = f.zodSchema.safeParse(f.data);
      const jsonValid = f.validateJson()(f.data) as boolean;
      expect(zodResult.success).toBe(false);
      expect(jsonValid).toBe(false);
    });
  }
});
