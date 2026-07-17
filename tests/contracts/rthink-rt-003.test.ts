// R-Think Runtime — Artifact Registry Tests
// Blueprint Reference: RTHINK-BP-001 §8, Appendix B
// Mission: RTHINK-RT-003

import { describe, it, expect, beforeEach } from "vitest";
import { ArtifactRegistry } from "../../src/runtime/artifact-registry.js";
import {
  ArtifactType,
  CognitiveState,
  ActorRole,
} from "../../src/contracts/types.js";
import type { ArtifactEnvelope } from "../../src/contracts/index.js";

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeArtifact(
  overrides: Partial<ArtifactEnvelope> = {}
): ArtifactEnvelope {
  return {
    rtpVersion: "1.0",
    artifactId: "art-001",
    artifactType: ArtifactType.OBSERVATION,
    version: 1,
    missionId: "TEST-MISSION",
    consumerBlueprintRefs: [{ documentId: "bp-001", section: "§8" }],
    actor: { id: "executor-1", role: ActorRole.EXECUTOR },
    state: CognitiveState.OBSERVE,
    sourceRefs: [{ type: "file", uri: "src/test.ts" }],
    payload: { data: "test observation" },
    evidenceRefs: [],
    createdAt: "2026-07-17T15:54:00.000Z",
    ...overrides,
  };
}

// ─── 15.1 Registration ──────────────────────────────────────────────────────

describe("15.1 Registration", () => {
  let registry: ArtifactRegistry;

  beforeEach(() => {
    registry = new ArtifactRegistry();
  });

  it("Register a valid artifact succeeds", () => {
    const artifact = makeArtifact();
    const result = registry.registerArtifact(artifact);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("Registered artifact is retrievable by ID", () => {
    const artifact = makeArtifact({ artifactId: "art-001" });
    registry.registerArtifact(artifact);
    const retrieved = registry.getArtifact("art-001");
    expect(retrieved).toBeDefined();
    expect(retrieved!.artifactId).toBe("art-001");
  });

  it("Registry size increases after registration", () => {
    expect(registry.size).toBe(0);
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    expect(registry.size).toBe(1);
    registry.registerArtifact(makeArtifact({ artifactId: "art-002" }));
    expect(registry.size).toBe(2);
  });

  it("hasArtifact returns true after registration", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    expect(registry.hasArtifact("art-001")).toBe(true);
    expect(registry.hasArtifact("nonexistent")).toBe(false);
  });

  it("Register OBSERVATION artifact with sourceRefs succeeds", () => {
    const artifact = makeArtifact({
      artifactType: ArtifactType.OBSERVATION,
      sourceRefs: [{ type: "file", uri: "src/obs.ts" }],
    });
    const result = registry.registerArtifact(artifact);
    expect(result.valid).toBe(true);
  });
});

// ─── 15.2 Duplicate Rejection ───────────────────────────────────────────────

describe("15.2 Duplicate Rejection", () => {
  let registry: ArtifactRegistry;

  beforeEach(() => {
    registry = new ArtifactRegistry();
  });

  it("Duplicate artifact ID is rejected", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    const result = registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Duplicate");
    expect(result.errors[0]).toContain("art-001");
  });

  it("Registry size unchanged after duplicate rejection", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    expect(registry.size).toBe(1);
  });

  it("Different artifact IDs are accepted", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    const result = registry.registerArtifact(makeArtifact({ artifactId: "art-002" }));
    expect(result.valid).toBe(true);
    expect(registry.size).toBe(2);
  });
});

// ─── 15.3 Validation Failure ────────────────────────────────────────────────

describe("15.3 Validation Failure", () => {
  let registry: ArtifactRegistry;

  beforeEach(() => {
    registry = new ArtifactRegistry();
  });

  it("Rejects artifact with empty artifactId", () => {
    const artifact = makeArtifact({ artifactId: "" });
    const result = registry.registerArtifact(artifact);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("Rejects artifact with invalid artifactType", () => {
    const artifact = makeArtifact({
      artifactType: "INVALID_TYPE" as any,
    });
    const result = registry.registerArtifact(artifact);
    expect(result.valid).toBe(false);
  });

  it("Rejects artifact with negative version", () => {
    const artifact = makeArtifact({ version: -1 });
    const result = registry.registerArtifact(artifact);
    expect(result.valid).toBe(false);
  });

  it("Rejects OBSERVATION artifact without sourceRefs", () => {
    const artifact = makeArtifact({
      artifactType: ArtifactType.OBSERVATION,
      sourceRefs: [],
    });
    const result = registry.registerArtifact(artifact);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("sourceRefs"))).toBe(true);
  });

  it("Rejects artifact with empty missionId", () => {
    const artifact = makeArtifact({ missionId: "" });
    const result = registry.registerArtifact(artifact);
    expect(result.valid).toBe(false);
  });

  it("validateArtifact returns errors for invalid artifact", () => {
    const artifact = makeArtifact({ version: 0 });
    const result = registry.validateArtifact(artifact);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("validateArtifact returns no errors for valid artifact", () => {
    const artifact = makeArtifact();
    const result = registry.validateArtifact(artifact);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ─── 15.4 Version Replacement ───────────────────────────────────────────────

describe("15.4 Version Replacement", () => {
  let registry: ArtifactRegistry;

  beforeEach(() => {
    registry = new ArtifactRegistry();
  });

  it("Replace creates new version with incremented version number", () => {
    registry.registerArtifact(
      makeArtifact({ artifactId: "art-001", version: 1 })
    );
    const result = registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 1 }),
      payload: { data: "updated" },
    } as any);
    expect(result.valid).toBe(true);
    const current = registry.getArtifact("art-001");
    expect(current!.version).toBe(2);
  });

  it("Replace sets supersedes field", () => {
    registry.registerArtifact(
      makeArtifact({ artifactId: "art-001", version: 1 })
    );
    registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 1 }),
      payload: { data: "v2" },
    } as any);
    const current = registry.getArtifact("art-001");
    expect(current!.supersedes).toBe("art-001");
  });

  it("Replace preserves version history", () => {
    registry.registerArtifact(
      makeArtifact({ artifactId: "art-001", version: 1 })
    );
    registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 1 }),
      payload: { data: "v2" },
    } as any);
    registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 2 }),
      payload: { data: "v3" },
    } as any);
    const history = registry.getVersionHistory("art-001");
    expect(history).toHaveLength(3);
    expect(history[0].version).toBe(1);
    expect(history[1].version).toBe(2);
    expect(history[2].version).toBe(3);
  });

  it("Replace fails for nonexistent artifact", () => {
    const result = registry.replaceArtifact("nonexistent", makeArtifact());
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("not found");
  });

  it("Replace fails if artifactId mismatches", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    const result = registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "WRONG-ID" }),
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("mismatch");
  });

  it("Replace rejects invalid replacement artifact", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    const result = registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 1 }),
      artifactType: "INVALID" as any,
    });
    expect(result.valid).toBe(false);
  });

  it("Original artifact is unchanged after replace (immutability)", () => {
    const original = makeArtifact({
      artifactId: "art-001",
      version: 1,
      payload: { data: "v1" },
    });
    registry.registerArtifact(original);
    const frozen = JSON.parse(JSON.stringify(original));
    registry.replaceArtifact("art-001", {
      ...original,
      payload: { data: "v2" },
    } as any);
    const retrieved = registry.getVersionHistory("art-001")[0];
    expect(retrieved).toEqual(frozen);
  });
});

// ─── 15.5 Retrieval ─────────────────────────────────────────────────────────

describe("15.5 Retrieval", () => {
  let registry: ArtifactRegistry;

  beforeEach(() => {
    registry = new ArtifactRegistry();
  });

  it("getArtifact returns undefined for nonexistent ID", () => {
    expect(registry.getArtifact("nonexistent")).toBeUndefined();
  });

  it("getArtifact returns the registered artifact", () => {
    const artifact = makeArtifact({ artifactId: "art-001" });
    registry.registerArtifact(artifact);
    const retrieved = registry.getArtifact("art-001");
    expect(retrieved).toEqual(artifact);
  });

  it("getArtifact returns the latest version after replace", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001", version: 1 }));
    registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 1 }),
      payload: { data: "v2" },
    } as any);
    const current = registry.getArtifact("art-001");
    expect(current!.version).toBe(2);
    expect(current!.payload).toEqual({ data: "v2" });
  });
});

// ─── 15.6 Removal ───────────────────────────────────────────────────────────

describe("15.6 Removal", () => {
  let registry: ArtifactRegistry;

  beforeEach(() => {
    registry = new ArtifactRegistry();
  });

  it("removeArtifact returns true for existing artifact", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    expect(registry.removeArtifact("art-001")).toBe(true);
  });

  it("Artifact is no longer retrievable after removal", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    registry.removeArtifact("art-001");
    expect(registry.getArtifact("art-001")).toBeUndefined();
    expect(registry.hasArtifact("art-001")).toBe(false);
  });

  it("removeArtifact returns false for nonexistent artifact", () => {
    expect(registry.removeArtifact("nonexistent")).toBe(false);
  });

  it("Registry size decreases after removal", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    expect(registry.size).toBe(1);
    registry.removeArtifact("art-001");
    expect(registry.size).toBe(0);
  });

  it("Version history is preserved after removal", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001", version: 1 }));
    registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 1 }),
      payload: { data: "v2" },
    } as any);
    registry.removeArtifact("art-001");
    const history = registry.getVersionHistory("art-001");
    expect(history).toHaveLength(2);
  });
});

// ─── 15.7 Listing ───────────────────────────────────────────────────────────

describe("15.7 Listing", () => {
  let registry: ArtifactRegistry;

  beforeEach(() => {
    registry = new ArtifactRegistry();
  });

  it("listArtifacts returns all artifacts when no filter", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    registry.registerArtifact(makeArtifact({ artifactId: "art-002" }));
    expect(registry.listArtifacts()).toHaveLength(2);
  });

  it("listArtifacts filters by artifactType", () => {
    registry.registerArtifact(
      makeArtifact({ artifactId: "art-001", artifactType: ArtifactType.OBSERVATION })
    );
    registry.registerArtifact(
      makeArtifact({ artifactId: "art-002", artifactType: ArtifactType.HYPOTHESIS })
    );
    registry.registerArtifact(
      makeArtifact({ artifactId: "art-003", artifactType: ArtifactType.OBSERVATION })
    );
    const observations = registry.listArtifacts({
      artifactType: ArtifactType.OBSERVATION,
    });
    expect(observations).toHaveLength(2);
    expect(observations.every((a) => a.artifactType === ArtifactType.OBSERVATION)).toBe(true);
  });

  it("listArtifacts filters by missionId", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001", missionId: "M1" }));
    registry.registerArtifact(makeArtifact({ artifactId: "art-002", missionId: "M2" }));
    const m1 = registry.listArtifacts({ missionId: "M1" });
    expect(m1).toHaveLength(1);
    expect(m1[0].missionId).toBe("M1");
  });

  it("listArtifacts filters by both type and mission", () => {
    registry.registerArtifact(
      makeArtifact({ artifactId: "art-001", artifactType: ArtifactType.OBSERVATION, missionId: "M1" })
    );
    registry.registerArtifact(
      makeArtifact({ artifactId: "art-002", artifactType: ArtifactType.HYPOTHESIS, missionId: "M1" })
    );
    registry.registerArtifact(
      makeArtifact({ artifactId: "art-003", artifactType: ArtifactType.OBSERVATION, missionId: "M2" })
    );
    const result = registry.listArtifacts({
      artifactType: ArtifactType.OBSERVATION,
      missionId: "M1",
    });
    expect(result).toHaveLength(1);
    expect(result[0].artifactId).toBe("art-001");
  });

  it("listArtifacts returns empty array when no matches", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    const result = registry.listArtifacts({ missionId: "NONEXISTENT" });
    expect(result).toHaveLength(0);
  });

  it("Removed artifacts are not listed", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    registry.registerArtifact(makeArtifact({ artifactId: "art-002" }));
    registry.removeArtifact("art-001");
    const listed = registry.listArtifacts();
    expect(listed).toHaveLength(1);
    expect(listed[0].artifactId).toBe("art-002");
  });
});

// ─── 15.8 Deterministic Behavior ────────────────────────────────────────────

describe("15.8 Deterministic Behavior", () => {
  let registry: ArtifactRegistry;

  beforeEach(() => {
    registry = new ArtifactRegistry();
  });

  it("Same registration sequence produces same state", () => {
    const reg1 = new ArtifactRegistry();
    const reg2 = new ArtifactRegistry();
    const artifacts = [
      makeArtifact({ artifactId: "a-1", version: 1 }),
      makeArtifact({ artifactId: "a-2", version: 1 }),
      makeArtifact({ artifactId: "a-3", version: 1 }),
    ];
    artifacts.forEach((a) => reg1.registerArtifact(a));
    artifacts.forEach((a) => reg2.registerArtifact(a));
    expect(reg1.size).toBe(reg2.size);
    expect(reg1.listArtifacts()).toEqual(reg2.listArtifacts());
  });

  it("Repeated getArtifact returns equivalent result", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    const r1 = registry.getArtifact("art-001");
    const r2 = registry.getArtifact("art-001");
    expect(r1).toEqual(r2);
  });

  it("Repeated listArtifacts returns equivalent results", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001" }));
    registry.registerArtifact(makeArtifact({ artifactId: "art-002" }));
    const l1 = registry.listArtifacts();
    const l2 = registry.listArtifacts();
    expect(l1).toEqual(l2);
  });
});

// ─── 15.9 Immutable Version History ─────────────────────────────────────────

describe("15.9 Immutable Version History", () => {
  let registry: ArtifactRegistry;

  beforeEach(() => {
    registry = new ArtifactRegistry();
  });

  it("getVersionHistory returns empty array for nonexistent artifact", () => {
    expect(registry.getVersionHistory("nonexistent")).toEqual([]);
  });

  it("Version history contains all versions in order", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001", version: 1 }));
    registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 1 }),
      payload: { data: "v2" },
    } as any);
    registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 2 }),
      payload: { data: "v3" },
    } as any);
    const history = registry.getVersionHistory("art-001");
    expect(history).toHaveLength(3);
    expect(history[0].version).toBe(1);
    expect(history[0].payload).toEqual({ data: "test observation" });
    expect(history[1].version).toBe(2);
    expect(history[1].payload).toEqual({ data: "v2" });
    expect(history[2].version).toBe(3);
    expect(history[2].payload).toEqual({ data: "v3" });
  });

  it("Earlier versions are not mutated by later replacements", () => {
    registry.registerArtifact(
      makeArtifact({ artifactId: "art-001", version: 1, payload: { x: 1 } })
    );
    registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 1, payload: { x: 1 } }),
      payload: { x: 2 },
    } as any);
    const history = registry.getVersionHistory("art-001");
    expect(history[0].payload).toEqual({ x: 1 });
    expect(history[1].payload).toEqual({ x: 2 });
  });

  it("Version history persists after current artifact removal", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001", version: 1 }));
    registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 1 }),
      payload: { data: "v2" },
    } as any);
    registry.removeArtifact("art-001");
    const history = registry.getVersionHistory("art-001");
    expect(history).toHaveLength(2);
  });

  it("Supersedes chain is traceable through history", () => {
    registry.registerArtifact(makeArtifact({ artifactId: "art-001", version: 1 }));
    registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 1 }),
      payload: { data: "v2" },
    } as any);
    registry.replaceArtifact("art-001", {
      ...makeArtifact({ artifactId: "art-001", version: 2 }),
      payload: { data: "v3" },
    } as any);
    const history = registry.getVersionHistory("art-001");
    expect(history[0].supersedes).toBeUndefined();
    expect(history[1].supersedes).toBe("art-001");
    expect(history[2].supersedes).toBe("art-001");
  });
});
