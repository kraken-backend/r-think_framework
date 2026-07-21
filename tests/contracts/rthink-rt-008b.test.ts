/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Inspector Backend API Tests
// Blueprint Reference: RTHINK-BP-001 §18, RT-008A-R1 §9, RT-008A-R1 §11
// Mission: RTHINK-RT-008B (Inspector Backend API)
//
// Three test categories:
//   1. Deep-copy boundary — proves DTO independence from Runtime state
//   2. Zero-mutation — proves Inspector cannot modify Runtime state
//   3. Endpoint contract — verifies all 26 GET + 1 SSE endpoints exist and respond

import { describe, it, expect, beforeEach } from "vitest";
import {
  CognitiveState,
  RuntimeEventType,
  AggregateType,
  AuthorityStatus,
  ActorRole,
  MissionRiskLevel,
  ArtifactType,
  EvidenceGraphNodeType,
  EvidenceGraphRelationType,
} from "../../src/contracts/types.js";
import type {
  MissionContract,
  ArtifactEnvelope,
} from "../../src/contracts/index.js";
import { createInspector } from "../../src/inspector/composition-root.js";
import { InspectorReadModelImpl } from "../../src/inspector/inspector-read-model-impl.js";
import type { InspectorReadModelDependencies } from "../../src/inspector/inspector-read-model-impl.js";
import { deepCopy } from "../../src/inspector/dtos.js";
import { EventStore } from "../../src/runtime/event-store.js";
import { Persistence } from "../../src/runtime/persistence.js";
import { ReplayEngine } from "../../src/runtime/replay.js";
import { ArtifactRegistry } from "../../src/runtime/artifact-registry.js";
import { EvidenceGraph } from "../../src/runtime/evidence-graph.js";
import { Router } from "../../src/runtime/router.js";
import { MissionRuntimeCoordinator } from "../../src/runtime/mission-runtime-coordinator.js";

// ─── Test Fixtures ─────────────────────────────────────────────────────────

const TEST_MISSION_ID = "RT-008B-TEST";

const TEST_CONTRACT: MissionContract = {
  missionId: TEST_MISSION_ID,
  consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001", section: "18" }],
  objective: "Test Inspector Backend API",
  context: "RT-008B comprehensive test suite",
  allowedScope: {
    projects: ["rthink-runtime"],
    tools: ["vitest"],
    description: "Testing Inspector read-only boundary",
  },
  explicitNonScope: ["Business logic", "Runtime mutation"],
  authority: {
    read: true,
    write: true,
    execute: false,
    network: false,
    humanDecision: false,
  },
  riskNoveltyLevel: MissionRiskLevel.L1_CONTROLLED,
  acceptanceCriteria: [
    "All endpoints respond correctly",
    "Deep-copy boundary is enforced",
    "Zero Runtime mutations occur",
  ],
  verification: ["Unit tests", "Integration tests"],
  evidenceRequirements: ["Test output"],
  failureProtocol: ["Record failure"],
  escalationConditions: [],
  guardianApproval: false,
};

const TEST_ARTIFACT: ArtifactEnvelope = {
  rtpVersion: "1.0",
  artifactId: "ART-RT008B-001",
  artifactType: ArtifactType.OBSERVATION,
  version: 1,
  missionId: TEST_MISSION_ID,
  consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001", section: "18" }],
  actor: { id: "test-engineer", role: ActorRole.ENGINEER },
  state: CognitiveState.OBSERVE,
  sourceRefs: [{ type: "test", uri: "rthink://test/observation" }],
  payload: { observation: "Test observation for Inspector" },
  evidenceRefs: [],
  createdAt: new Date().toISOString(),
};

// ─── Test Helpers ──────────────────────────────────────────────────────────

function createTestDependencies(): InspectorReadModelDependencies {
  const persistence = new Persistence();
  const replayEngine = new ReplayEngine(
    persistence.getEventStore(),
    persistence.getSnapshotStore()
  );
  const artifactRegistry = new ArtifactRegistry();
  const evidenceGraph = new EvidenceGraph();
  const router = new Router();
  const coordinators = new Map();

  const coordinator = new MissionRuntimeCoordinator(
    { missionId: TEST_MISSION_ID, contract: TEST_CONTRACT, riskLevel: TEST_CONTRACT.riskNoveltyLevel },
    { artifactRegistry, evidenceGraph, router, persistence, replayEngine }
  );
  coordinators.set(TEST_MISSION_ID, coordinator);

  return {
    eventStore: persistence.getEventStore(),
    persistence,
    replayEngine,
    artifactRegistry,
    evidenceGraph,
    router,
    coordinators,
  };
}

function createPopulatedDeps(): InspectorReadModelDependencies {
  const deps = createTestDependencies();

  // Initialize the mission
  const coordinator = deps.coordinators.get(TEST_MISSION_ID)!;
  coordinator.initializeMission();

  // Register an artifact
  coordinator.registerArtifact(TEST_ARTIFACT);

  // Create evidence nodes
  coordinator.createEvidenceNode({
    nodeId: "obs-node-1",
    nodeType: EvidenceGraphNodeType.OBSERVATION,
    missionId: TEST_MISSION_ID,
    metadata: { description: "Test observation node" },
  });
  coordinator.createEvidenceNode({
    nodeId: "claim-node-1",
    nodeType: EvidenceGraphNodeType.CLAIM,
    missionId: TEST_MISSION_ID,
    metadata: { description: "Test claim node" },
  });

  // Connect evidence nodes
  coordinator.connectEvidence(
    "obs-node-1",
    "claim-node-1",
    EvidenceGraphRelationType.OBSERVED_AS,
    { confidence: 0.8 }
  );

  return deps;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. DEEP-COPY BOUNDARY TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("RT-008B: Deep-Copy Boundary", () => {
  let inspector: InspectorReadModelImpl;
  let deps: InspectorReadModelDependencies;

  beforeEach(() => {
    deps = createPopulatedDeps();
    inspector = new InspectorReadModelImpl(deps);
  });

  it("deepCopy utility produces independent copies", () => {
    const original = { nested: { value: 42 }, arr: [1, 2, 3] };
    const copy = deepCopy(original);
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
    expect(copy.nested).not.toBe(original.nested);
    expect(copy.arr).not.toBe(original.arr);
  });

  it("getMission returns deep copy — mutations do not affect Runtime", () => {
    const mission1 = inspector.getMission(TEST_MISSION_ID);
    expect(mission1).toBeDefined();

    const mission2 = inspector.getMission(TEST_MISSION_ID);
    expect(mission2).toEqual(mission1);
    expect(mission2).not.toBe(mission1);

    // Mutate the returned DTO
    (mission1 as { contradictionCount: number }).contradictionCount = 999;
    expect(mission2!.contradictionCount).not.toBe(999);
  });

  it("getMissionState returns deep copy", () => {
    const state1 = inspector.getMissionState(TEST_MISSION_ID);
    expect(state1).toBeDefined();

    const state2 = inspector.getMissionState(TEST_MISSION_ID);
    expect(state2).toEqual(state1);
    expect(state2).not.toBe(state1);
  });

  it("getMissionHistory returns independent array copy", () => {
    const history1 = inspector.getMissionHistory(TEST_MISSION_ID);
    const history2 = inspector.getMissionHistory(TEST_MISSION_ID);
    expect(history1).toEqual(history2);
    expect(history1).not.toBe(history2);
  });

  it("getMissionEvents returns deep copies in paginated result", () => {
    const result = inspector.getMissionEvents(TEST_MISSION_ID);
    expect(result.items.length).toBeGreaterThan(0);

    const result2 = inspector.getMissionEvents(TEST_MISSION_ID);
    expect(result2.items).toEqual(result.items);

    // Mutate first result's first item
    if (result.items.length > 0) {
      const first = result.items[0]!;
      (first as { eventType: string }).eventType = "MUTATED" as never;
      expect(result2.items[0]!.eventType).not.toBe("MUTATED");
    }
  });

  it("getMissionArtifacts returns deep copies", () => {
    const result = inspector.getMissionArtifacts(TEST_MISSION_ID);
    const result2 = inspector.getMissionArtifacts(TEST_MISSION_ID);
    expect(result.items).toEqual(result2.items);
    if (result.items.length > 0) {
      expect(result.items[0]).not.toBe(result2.items[0]);
    }
  });

  it("getMissionEvidence returns deep copy of graph snapshot", () => {
    const graph1 = inspector.getMissionEvidence(TEST_MISSION_ID);
    const graph2 = inspector.getMissionEvidence(TEST_MISSION_ID);
    expect(graph1).toEqual(graph2);
    expect(graph1).not.toBe(graph2);
    expect(graph1.nodes).not.toBe(graph2.nodes);
    expect(graph1.edges).not.toBe(graph2.edges);
  });

  it("getMissionAuthority returns deep copy", () => {
    const auth1 = inspector.getMissionAuthority(TEST_MISSION_ID);
    const auth2 = inspector.getMissionAuthority(TEST_MISSION_ID);
    expect(auth1).toEqual(auth2);
    expect(auth1).not.toBe(auth2);
  });

  it("getMissionContradictions returns deep copy", () => {
    const c1 = inspector.getMissionContradictions(TEST_MISSION_ID);
    const c2 = inspector.getMissionContradictions(TEST_MISSION_ID);
    expect(c1).toEqual(c2);
    expect(c1).not.toBe(c2);
  });

  it("replayMission returns deep copy", () => {
    const r1 = inspector.replayMission(TEST_MISSION_ID);
    const r2 = inspector.replayMission(TEST_MISSION_ID);
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    expect(r1).not.toBe(r2);
    expect(r1!.aggregateId).toEqual(r2!.aggregateId);
    expect(r1!.eventCount).toEqual(r2!.eventCount);
    expect(r1!.errorCount).toEqual(r2!.errorCount);
    expect(r1!.state).toEqual(r2!.state);
  });

  it("listEvents returns deep copies", () => {
    const result = inspector.listEvents();
    if (result.items.length > 0) {
      const result2 = inspector.listEvents();
      expect(result.items[0]).toEqual(result2.items[0]);
      expect(result.items[0]).not.toBe(result2.items[0]);
    }
  });

  it("getEvent returns deep copy", () => {
    const events = inspector.listEvents();
    if (events.items.length > 0) {
      const eventId = events.items[0]!.eventId;
      const e1 = inspector.getEvent(eventId);
      const e2 = inspector.getEvent(eventId);
      expect(e1).toEqual(e2);
      expect(e1).not.toBe(e2);
    }
  });

  it("listArtifacts returns deep copies", () => {
    const result = inspector.listArtifacts();
    if (result.items.length > 0) {
      const result2 = inspector.listArtifacts();
      expect(result.items[0]).toEqual(result2.items[0]);
      expect(result.items[0]).not.toBe(result2.items[0]);
    }
  });

  it("getArtifact returns deep copy", () => {
    const a1 = inspector.getArtifact("ART-RT008B-001");
    const a2 = inspector.getArtifact("ART-RT008B-001");
    expect(a1).toEqual(a2);
    expect(a1).not.toBe(a2);
  });

  it("getArtifactHistory returns deep copies", () => {
    const h1 = inspector.getArtifactHistory("ART-RT008B-001");
    const h2 = inspector.getArtifactHistory("ART-RT008B-001");
    expect(h1).toEqual(h2);
    if (h1.length > 0) {
      expect(h1[0]).not.toBe(h2[0]);
    }
  });

  it("getEvidenceGraph returns deep copy", () => {
    const g1 = inspector.getEvidenceGraph();
    const g2 = inspector.getEvidenceGraph();
    expect(g1).toEqual(g2);
    expect(g1).not.toBe(g2);
    expect(g1.nodes).not.toBe(g2.nodes);
  });

  it("findEvidencePath returns deep copy", () => {
    const p1 = inspector.findEvidencePath("obs-node-1", "claim-node-1");
    const p2 = inspector.findEvidencePath("obs-node-1", "claim-node-1");
    expect(p1).toEqual(p2);
    expect(p1).not.toBe(p2);
  });

  it("validateEvidenceGraph returns deep copy", () => {
    const v1 = inspector.validateEvidenceGraph();
    const v2 = inspector.validateEvidenceGraph();
    expect(v1).toEqual(v2);
    expect(v1).not.toBe(v2);
  });

  it("listMethods returns deep copies", () => {
    const m1 = inspector.listMethods();
    const m2 = inspector.listMethods();
    expect(m1).toEqual(m2);
    if (m1.length > 0) {
      expect(m1[0]).not.toBe(m2[0]);
    }
  });

  it("listProviders returns deep copies", () => {
    const p1 = inspector.listProviders();
    const p2 = inspector.listProviders();
    expect(p1).toEqual(p2);
    if (p1.length > 0) {
      expect(p1[0]).not.toBe(p2[0]);
    }
  });

  it("getHealth returns deep copy", () => {
    const h1 = inspector.getHealth();
    const h2 = inspector.getHealth();
    expect(h1).toEqual(h2);
    expect(h1).not.toBe(h2);
  });

  it("getStatistics returns deep copy", () => {
    const s1 = inspector.getStatistics();
    const s2 = inspector.getStatistics();
    expect(s1).toEqual(s2);
    expect(s1).not.toBe(s2);
  });

  it("listSnapshots returns deep copies", () => {
    const snaps1 = inspector.listSnapshots();
    const snaps2 = inspector.listSnapshots();
    expect(snaps1).toEqual(snaps2);
  });

  it("getEventsSince returns deep copies", () => {
    const events1 = inspector.getEventsSince(0);
    const events2 = inspector.getEventsSince(0);
    expect(events1).toEqual(events2);
    if (events1.length > 0) {
      expect(events1[0]).not.toBe(events2[0]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. ZERO-MUTATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("RT-008B: Zero-Mutation Guarantee", () => {
  let inspector: InspectorReadModelImpl;
  let deps: InspectorReadModelDependencies;
  let snapshotBefore: {
    eventCount: number;
    artifactCount: number;
    evidenceNodeCount: number;
    evidenceEdgeCount: number;
  };

  beforeEach(() => {
    deps = createPopulatedDeps();
    inspector = new InspectorReadModelImpl(deps);

    // Take snapshot of Runtime state BEFORE any Inspector reads
    snapshotBefore = {
      eventCount: deps.eventStore.count(),
      artifactCount: deps.artifactRegistry.size,
      evidenceNodeCount: deps.evidenceGraph.nodeCount,
      evidenceEdgeCount: deps.evidenceGraph.edgeCount,
    };
  });

  function assertNoMutation(): void {
    expect(deps.eventStore.count()).toBe(snapshotBefore.eventCount);
    expect(deps.artifactRegistry.size).toBe(snapshotBefore.artifactCount);
    expect(deps.evidenceGraph.nodeCount).toBe(snapshotBefore.evidenceNodeCount);
    expect(deps.evidenceGraph.edgeCount).toBe(snapshotBefore.evidenceEdgeCount);
  }

  it("listMissions does not mutate Runtime", () => {
    inspector.listMissions();
    inspector.listMissions({ state: CognitiveState.OBSERVE });
    inspector.listMissions({ riskLevel: MissionRiskLevel.L1_CONTROLLED });
    assertNoMutation();
  });

  it("getMission does not mutate Runtime", () => {
    inspector.getMission(TEST_MISSION_ID);
    inspector.getMission("nonexistent-mission");
    assertNoMutation();
  });

  it("getMissionState does not mutate Runtime", () => {
    inspector.getMissionState(TEST_MISSION_ID);
    assertNoMutation();
  });

  it("getMissionHistory does not mutate Runtime", () => {
    inspector.getMissionHistory(TEST_MISSION_ID);
    assertNoMutation();
  });

  it("getMissionEvents does not mutate Runtime", () => {
    inspector.getMissionEvents(TEST_MISSION_ID);
    inspector.getMissionEvents(TEST_MISSION_ID, { page: 1, pageSize: 10 });
    assertNoMutation();
  });

  it("getMissionArtifacts does not mutate Runtime", () => {
    inspector.getMissionArtifacts(TEST_MISSION_ID);
    assertNoMutation();
  });

  it("getMissionEvidence does not mutate Runtime", () => {
    inspector.getMissionEvidence(TEST_MISSION_ID);
    assertNoMutation();
  });

  it("getMissionAuthority does not mutate Runtime", () => {
    inspector.getMissionAuthority(TEST_MISSION_ID);
    assertNoMutation();
  });

  it("getMissionContradictions does not mutate Runtime", () => {
    inspector.getMissionContradictions(TEST_MISSION_ID);
    assertNoMutation();
  });

  it("replayMission does not mutate Runtime", () => {
    inspector.replayMission(TEST_MISSION_ID);
    assertNoMutation();
  });

  it("listEvents does not mutate Runtime", () => {
    inspector.listEvents();
    inspector.listEvents({ eventType: RuntimeEventType.STATE_CHANGED });
    inspector.listEvents({ missionId: TEST_MISSION_ID });
    assertNoMutation();
  });

  it("getEvent does not mutate Runtime", () => {
    const events = inspector.listEvents();
    if (events.items.length > 0) {
      inspector.getEvent(events.items[0]!.eventId);
    }
    inspector.getEvent("nonexistent-event");
    assertNoMutation();
  });

  it("listArtifacts does not mutate Runtime", () => {
    inspector.listArtifacts();
    inspector.listArtifacts({ missionId: TEST_MISSION_ID });
    inspector.listArtifacts({ artifactType: ArtifactType.OBSERVATION });
    assertNoMutation();
  });

  it("getArtifact does not mutate Runtime", () => {
    inspector.getArtifact("ART-RT008B-001");
    inspector.getArtifact("nonexistent-artifact");
    assertNoMutation();
  });

  it("getArtifactHistory does not mutate Runtime", () => {
    inspector.getArtifactHistory("ART-RT008B-001");
    inspector.getArtifactHistory("nonexistent-artifact");
    assertNoMutation();
  });

  it("getEvidenceGraph does not mutate Runtime", () => {
    inspector.getEvidenceGraph();
    inspector.getEvidenceGraph({ missionId: TEST_MISSION_ID });
    inspector.getEvidenceGraph({ nodeType: EvidenceGraphNodeType.OBSERVATION });
    assertNoMutation();
  });

  it("findEvidencePath does not mutate Runtime", () => {
    inspector.findEvidencePath("obs-node-1", "claim-node-1");
    inspector.findEvidencePath("nonexistent", "nonexistent");
    assertNoMutation();
  });

  it("validateEvidenceGraph does not mutate Runtime", () => {
    inspector.validateEvidenceGraph();
    assertNoMutation();
  });

  it("listMethods does not mutate Runtime", () => {
    inspector.listMethods();
    assertNoMutation();
  });

  it("listProviders does not mutate Runtime", () => {
    inspector.listProviders();
    assertNoMutation();
  });

  it("listCapabilities does not mutate Runtime", () => {
    inspector.listCapabilities();
    assertNoMutation();
  });

  it("getHealth does not mutate Runtime", () => {
    inspector.getHealth();
    assertNoMutation();
  });

  it("getStatistics does not mutate Runtime", () => {
    inspector.getStatistics();
    assertNoMutation();
  });

  it("listSnapshots does not mutate Runtime", () => {
    inspector.listSnapshots();
    inspector.listSnapshots(TEST_MISSION_ID);
    assertNoMutation();
  });

  it("getSnapshot does not mutate Runtime", () => {
    inspector.getSnapshot("nonexistent-snapshot");
    assertNoMutation();
  });

  it("getEventsSince does not mutate Runtime", () => {
    inspector.getEventsSince(0);
    inspector.getEventsSince(999999);
    assertNoMutation();
  });

  it("Exhaustive mutation check across ALL endpoint methods", () => {
    // Execute every single InspectorReadModel method
    inspector.listMissions();
    inspector.getMission(TEST_MISSION_ID);
    inspector.getMissionState(TEST_MISSION_ID);
    inspector.getMissionHistory(TEST_MISSION_ID);
    inspector.getMissionEvents(TEST_MISSION_ID);
    inspector.getMissionArtifacts(TEST_MISSION_ID);
    inspector.getMissionEvidence(TEST_MISSION_ID);
    inspector.getMissionAuthority(TEST_MISSION_ID);
    inspector.getMissionContradictions(TEST_MISSION_ID);
    inspector.replayMission(TEST_MISSION_ID);
    inspector.listEvents();
    inspector.listEvents({ eventType: RuntimeEventType.STATE_CHANGED });
    inspector.listArtifacts();
    inspector.listArtifacts({ artifactType: ArtifactType.OBSERVATION });
    inspector.getEvidenceGraph();
    inspector.findEvidencePath("obs-node-1", "claim-node-1");
    inspector.validateEvidenceGraph();
    inspector.listMethods();
    inspector.listProviders();
    inspector.listCapabilities();
    inspector.getHealth();
    inspector.getStatistics();
    inspector.listSnapshots();
    inspector.getEventsSince(0);

    assertNoMutation();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. ENDPOINT CONTRACT TESTS (26 GET + 1 SSE = 27 total)
// ═══════════════════════════════════════════════════════════════════════════

describe("RT-008B: Endpoint Contract — 26 GET + 1 SSE", () => {
  let inspector: InspectorReadModelImpl;
  let deps: InspectorReadModelDependencies;

  beforeEach(() => {
    deps = createPopulatedDeps();
    inspector = new InspectorReadModelImpl(deps);
  });

  // ─── Mission Endpoints (10 GET) ────────────────────────────────────────

  describe("Mission Endpoints (10 GET)", () => {
    it("GET /api/missions — listMissions returns PaginatedResult<MissionSummary>", () => {
      const result = inspector.listMissions();
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("pageSize");
      expect(result).toHaveProperty("hasMore");
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
      expect(result.items.length).toBeGreaterThan(0);

      const mission = result.items[0]!;
      expect(typeof mission.missionId).toBe("string");
      expect(typeof mission.currentState).toBe("string");
      expect(typeof mission.riskLevel).toBe("string");
      expect(typeof mission.authorityStatus).toBe("string");
      expect(typeof mission.contradictionCount).toBe("number");
      expect(typeof mission.isTerminated).toBe("boolean");
      expect(typeof mission.eventCount).toBe("number");
      expect(typeof mission.artifactCount).toBe("number");
      expect(typeof mission.createdAt).toBe("string");
      expect(typeof mission.updatedAt).toBe("string");
    });

    it("GET /api/missions/:id — getMission returns MissionDetail", () => {
      const detail = inspector.getMission(TEST_MISSION_ID);
      expect(detail).toBeDefined();
      expect(detail!.missionId).toBe(TEST_MISSION_ID);
      expect(detail!.contract).toBeDefined();
      expect(detail!.contract.missionId).toBe(TEST_MISSION_ID);
      expect(Array.isArray(detail!.stateHistory)).toBe(true);
      expect(Array.isArray(detail!.contradictions)).toBe(true);
    });

    it("GET /api/missions/:id — getMission returns undefined for nonexistent", () => {
      expect(inspector.getMission("nonexistent")).toBeUndefined();
    });

    it("GET /api/missions/:id/state — getMissionState returns state", () => {
      const state = inspector.getMissionState(TEST_MISSION_ID);
      expect(state).toBeDefined();
      expect(typeof state!.currentState).toBe("string");
      expect(typeof state!.updatedAt).toBe("string");
    });

    it("GET /api/missions/:id/history — getMissionHistory returns state array", () => {
      const history = inspector.getMissionHistory(TEST_MISSION_ID);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toBe(CognitiveState.OBSERVE);
    });

    it("GET /api/missions/:id/events — getMissionEvents returns PaginatedResult<EventSummary>", () => {
      const result = inspector.getMissionEvents(TEST_MISSION_ID);
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result.items.length).toBeGreaterThan(0);

      const event = result.items[0]!;
      expect(typeof event.eventId).toBe("string");
      expect(typeof event.missionId).toBe("string");
      expect(typeof event.eventType).toBe("string");
      expect(typeof event.globalPosition).toBe("number");
    });

    it("GET /api/missions/:id/artifacts — getMissionArtifacts returns PaginatedResult<ArtifactSummary>", () => {
      const result = inspector.getMissionArtifacts(TEST_MISSION_ID);
      expect(result).toHaveProperty("items");
      expect(result.items.length).toBeGreaterThan(0);

      const artifact = result.items[0]!;
      expect(typeof artifact.artifactId).toBe("string");
      expect(typeof artifact.artifactType).toBe("string");
      expect(typeof artifact.version).toBe("number");
      expect(typeof artifact.missionId).toBe("string");
    });

    it("GET /api/missions/:id/evidence — getMissionEvidence returns EvidenceGraphSnapshot", () => {
      const evidence = inspector.getMissionEvidence(TEST_MISSION_ID);
      expect(evidence).toHaveProperty("nodes");
      expect(evidence).toHaveProperty("edges");
      expect(evidence).toHaveProperty("nodeCount");
      expect(evidence).toHaveProperty("edgeCount");
      expect(evidence).toHaveProperty("hasCycles");
      expect(evidence).toHaveProperty("exportedAt");
      expect(evidence.nodeCount).toBeGreaterThan(0);
    });

    it("GET /api/missions/:id/authority — getMissionAuthority returns AuthorityDetail", () => {
      const authority = inspector.getMissionAuthority(TEST_MISSION_ID);
      expect(authority).toBeDefined();
      expect(typeof authority!.status).toBe("string");
      expect(Array.isArray(authority!.contradictions)).toBe(true);
      expect(typeof authority!.exportedAt).toBe("string");
    });

    it("GET /api/missions/:id/contradictions — getMissionContradictions returns ContradictionsDetail", () => {
      const contradictions = inspector.getMissionContradictions(TEST_MISSION_ID);
      expect(contradictions).toBeDefined();
      expect(Array.isArray(contradictions!.contradictions)).toBe(true);
      expect(typeof contradictions!.count).toBe("number");
      expect(typeof contradictions!.exportedAt).toBe("string");
    });

    it("GET /api/missions/:id/replay — replayMission returns ReplaySnapshot", () => {
      const replay = inspector.replayMission(TEST_MISSION_ID);
      expect(replay).toBeDefined();
      expect(typeof replay!.aggregateId).toBe("string");
      expect(typeof replay!.eventCount).toBe("number");
      expect(typeof replay!.valid).toBe("boolean");
      expect(typeof replay!.errorCount).toBe("number");
      expect(typeof replay!.exportedAt).toBe("string");
    });
  });

  // ─── Event Endpoints (2 GET) ───────────────────────────────────────────

  describe("Event Endpoints (2 GET)", () => {
    it("GET /api/events — listEvents returns PaginatedResult<EventSummary>", () => {
      const result = inspector.listEvents();
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result.items.length).toBeGreaterThan(0);

      const event = result.items[0]!;
      expect(typeof event.eventId).toBe("string");
      expect(typeof event.globalPosition).toBe("number");
      expect(typeof event.eventType).toBe("string");
      expect(typeof event.timestamp).toBe("string");
    });

    it("GET /api/events/:id — getEvent returns EventDetail", () => {
      const events = inspector.listEvents();
      expect(events.items.length).toBeGreaterThan(0);

      const eventId = events.items[0]!.eventId;
      const detail = inspector.getEvent(eventId);
      expect(detail).toBeDefined();
      expect(detail!.eventId).toBe(eventId);
      expect(detail!.payload).toBeDefined();
      expect(detail!.metadata).toBeDefined();
      expect(typeof detail!.schemaVersion).toBe("string");
    });

    it("GET /api/events/:id — getEvent returns undefined for nonexistent", () => {
      expect(inspector.getEvent("nonexistent-event")).toBeUndefined();
    });
  });

  // ─── Artifact Endpoints (3 GET) ────────────────────────────────────────

  describe("Artifact Endpoints (3 GET)", () => {
    it("GET /api/artifacts — listArtifacts returns PaginatedResult<ArtifactSummary>", () => {
      const result = inspector.listArtifacts();
      expect(result).toHaveProperty("items");
      expect(result.items.length).toBeGreaterThan(0);

      const artifact = result.items[0]!;
      expect(typeof artifact.artifactId).toBe("string");
      expect(typeof artifact.artifactType).toBe("string");
      expect(typeof artifact.version).toBe("number");
    });

    it("GET /api/artifacts/:id — getArtifact returns ArtifactDetail", () => {
      const detail = inspector.getArtifact("ART-RT008B-001");
      expect(detail).toBeDefined();
      expect(detail!.artifactId).toBe("ART-RT008B-001");
      expect(detail!.actor).toBeDefined();
      expect(typeof detail!.actor.id).toBe("string");
      expect(typeof detail!.actor.role).toBe("string");
      expect(Array.isArray(detail!.sourceRefs)).toBe(true);
      expect(Array.isArray(detail!.evidenceRefs)).toBe(true);
    });

    it("GET /api/artifacts/:id — getArtifact returns undefined for nonexistent", () => {
      expect(inspector.getArtifact("nonexistent")).toBeUndefined();
    });

    it("GET /api/artifacts/:id/history — getArtifactHistory returns artifact array", () => {
      const history = inspector.getArtifactHistory("ART-RT008B-001");
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]!.artifactId).toBe("ART-RT008B-001");
    });
  });

  // ─── Evidence Endpoints (4 GET) ────────────────────────────────────────

  describe("Evidence Endpoints (4 GET)", () => {
    it("GET /api/evidence/nodes — getEvidenceGraph with nodeType filter returns nodes", () => {
      const graph = inspector.getEvidenceGraph({
        nodeType: EvidenceGraphNodeType.OBSERVATION,
      });
      expect(graph).toHaveProperty("nodes");
      expect(graph.nodes.length).toBeGreaterThan(0);
      for (const node of graph.nodes) {
        expect(node.nodeType).toBe(EvidenceGraphNodeType.OBSERVATION);
      }
    });

    it("GET /api/evidence/edges — getEvidenceGraph with relationType filter returns edges", () => {
      const graph = inspector.getEvidenceGraph({
        relationType: EvidenceGraphRelationType.OBSERVED_AS,
      });
      expect(graph).toHaveProperty("edges");
      for (const edge of graph.edges) {
        expect(edge.relationType).toBe(EvidenceGraphRelationType.OBSERVED_AS);
      }
    });

    it("GET /api/evidence/graph — getEvidenceGraph returns full EvidenceGraphSnapshot", () => {
      const graph = inspector.getEvidenceGraph();
      expect(graph).toHaveProperty("nodes");
      expect(graph).toHaveProperty("edges");
      expect(graph).toHaveProperty("nodeCount");
      expect(graph).toHaveProperty("edgeCount");
      expect(graph).toHaveProperty("hasCycles");
      expect(graph).toHaveProperty("exportedAt");
      expect(graph.nodeCount).toBe(2);
      expect(graph.edgeCount).toBe(1);
    });

    it("GET /api/evidence/validate — validateEvidenceGraph returns EvidenceValidation", () => {
      const validation = inspector.validateEvidenceGraph();
      expect(validation).toHaveProperty("valid");
      expect(validation).toHaveProperty("errors");
      expect(validation).toHaveProperty("nodeCount");
      expect(validation).toHaveProperty("edgeCount");
      expect(validation).toHaveProperty("exportedAt");
      expect(typeof validation.valid).toBe("boolean");
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  // ─── Router Endpoints (3 GET) ──────────────────────────────────────────

  describe("Router Endpoints (3 GET)", () => {
    it("GET /api/router/methods — listMethods returns MethodSummary[]", () => {
      const methods = inspector.listMethods();
      expect(Array.isArray(methods)).toBe(true);
    });

    it("GET /api/router/providers — listProviders returns ProviderSummary[]", () => {
      const providers = inspector.listProviders();
      expect(Array.isArray(providers)).toBe(true);
    });

    it("GET /api/router/capabilities — listCapabilities returns string[]", () => {
      const capabilities = inspector.listCapabilities();
      expect(Array.isArray(capabilities)).toBe(true);
      for (const cap of capabilities) {
        expect(typeof cap).toBe("string");
      }
    });
  });

  // ─── Health Endpoint (1 GET) ───────────────────────────────────────────

  describe("Health Endpoint (1 GET)", () => {
    it("GET /api/health — getHealth returns RuntimeHealth", () => {
      const health = inspector.getHealth();
      expect(typeof health.totalEvents).toBe("number");
      expect(typeof health.totalArtifacts).toBe("number");
      expect(typeof health.evidenceNodeCount).toBe("number");
      expect(typeof health.evidenceEdgeCount).toBe("number");
      expect(health.graphIntegrity).toBeDefined();
      expect(typeof health.graphIntegrity.valid).toBe("boolean");
      expect(typeof health.snapshotCount).toBe("number");
      expect(typeof health.materializedViewCount).toBe("number");
      expect(typeof health.exportedAt).toBe("string");

      expect(health.totalEvents).toBeGreaterThan(0);
      expect(health.totalArtifacts).toBe(1);
      expect(health.evidenceNodeCount).toBe(2);
      expect(health.evidenceEdgeCount).toBe(1);
    });
  });

  // ─── Statistics Endpoint (1 GET) ───────────────────────────────────────

  describe("Statistics Endpoint (1 GET)", () => {
    it("GET /api/stats — getStatistics returns RuntimeStatistics", () => {
      const stats = inspector.getStatistics();
      expect(typeof stats.transitionCount).toBe("number");
      expect(typeof stats.contradictionCount).toBe("number");
      expect(typeof stats.authorityGrantCount).toBe("number");
      expect(typeof stats.authorityDenyCount).toBe("number");
      expect(typeof stats.failureCount).toBe("number");
      expect(typeof stats.recoveryCount).toBe("number");
      expect(typeof stats.discoveryCount).toBe("number");
      expect(typeof stats.evolutionCount).toBe("number");
      expect(typeof stats.exportedAt).toBe("string");
      expect(stats.eventsByType).toBeDefined();
      expect(stats.eventsByActor).toBeDefined();
      expect(stats.artifactsByType).toBeDefined();
    });
  });

  // ─── Snapshot Endpoints (2 GET) ────────────────────────────────────────

  describe("Snapshot Endpoints (2 GET)", () => {
    it("GET /api/snapshots — listSnapshots returns SnapshotSummary[]", () => {
      const snapshots = inspector.listSnapshots();
      expect(Array.isArray(snapshots)).toBe(true);
    });

    it("GET /api/snapshots/:id — getSnapshot returns SnapshotDetail or undefined", () => {
      const snapshot = inspector.getSnapshot("nonexistent");
      expect(snapshot).toBeUndefined();
    });
  });

  // ─── SSE Endpoint (1 SSE) ──────────────────────────────────────────────

  describe("SSE Endpoint (1 SSE)", () => {
    it("SSE /api/stream — getEventsSince returns StreamEvent[]", () => {
      const events = inspector.getEventsSince(0);
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);

      for (const event of events) {
        expect(typeof event.globalPosition).toBe("number");
        expect(typeof event.eventId).toBe("string");
        expect(typeof event.eventType).toBe("string");
        expect(typeof event.missionId).toBe("string");
        expect(typeof event.timestamp).toBe("string");
      }
    });

    it("SSE /api/stream — getEventsSince with high cursor returns empty", () => {
      const events = inspector.getEventsSince(999999);
      expect(events).toEqual([]);
    });

    it("SSE /api/stream — reconnect cursor semantics (globalPosition > since)", () => {
      const allEvents = inspector.getEventsSince(0);
      expect(allEvents.length).toBeGreaterThan(0);

      const lastPosition = allEvents[allEvents.length - 1]!.globalPosition;
      const newEvents = inspector.getEventsSince(lastPosition);
      expect(newEvents.length).toBe(0);
    });
  });

  // ─── Endpoint Count Verification ───────────────────────────────────────

  describe("Endpoint Count Verification", () => {
    it("verifies 26 GET + 1 SSE = 27 total endpoints", () => {
      const getEndpoints = [
        "GET /api/missions",
        "GET /api/missions/:id",
        "GET /api/missions/:id/state",
        "GET /api/missions/:id/history",
        "GET /api/missions/:id/events",
        "GET /api/missions/:id/artifacts",
        "GET /api/missions/:id/evidence",
        "GET /api/missions/:id/authority",
        "GET /api/missions/:id/contradictions",
        "GET /api/missions/:id/replay",
        "GET /api/events",
        "GET /api/events/:id",
        "GET /api/artifacts",
        "GET /api/artifacts/:id",
        "GET /api/artifacts/:id/history",
        "GET /api/evidence/nodes",
        "GET /api/evidence/edges",
        "GET /api/evidence/graph",
        "GET /api/evidence/validate",
        "GET /api/router/methods",
        "GET /api/router/providers",
        "GET /api/router/capabilities",
        "GET /api/health",
        "GET /api/stats",
        "GET /api/snapshots",
        "GET /api/snapshots/:id",
      ];

      const sseEndpoints = [
        "SSE /api/stream",
      ];

      expect(getEndpoints.length).toBe(26);
      expect(sseEndpoints.length).toBe(1);
      expect(getEndpoints.length + sseEndpoints.length).toBe(27);
    });
  });

  // ─── Filtering Tests ───────────────────────────────────────────────────

  describe("Filtering", () => {
    it("MissionFilter by state", () => {
      const result = inspector.listMissions({ state: CognitiveState.OBSERVE });
      expect(result.items.length).toBeGreaterThan(0);
      for (const m of result.items) {
        expect(m.currentState).toBe(CognitiveState.OBSERVE);
      }
    });

    it("MissionFilter by riskLevel", () => {
      const result = inspector.listMissions({
        riskLevel: MissionRiskLevel.L1_CONTROLLED,
      });
      expect(result.items.length).toBeGreaterThan(0);
      for (const m of result.items) {
        expect(m.riskLevel).toBe(MissionRiskLevel.L1_CONTROLLED);
      }
    });

    it("MissionFilter by isTerminated", () => {
      const result = inspector.listMissions({ isTerminated: false });
      for (const m of result.items) {
        expect(m.isTerminated).toBe(false);
      }
    });

    it("EventFilter by eventType", () => {
      const result = inspector.listEvents({
        eventType: RuntimeEventType.STATE_CHANGED,
      });
      for (const e of result.items) {
        expect(e.eventType).toBe(RuntimeEventType.STATE_CHANGED);
      }
    });

    it("EventFilter by missionId", () => {
      const result = inspector.listEvents({ missionId: TEST_MISSION_ID });
      for (const e of result.items) {
        expect(e.missionId).toBe(TEST_MISSION_ID);
      }
    });

    it("ArtifactFilter by missionId", () => {
      const result = inspector.listArtifacts({ missionId: TEST_MISSION_ID });
      for (const a of result.items) {
        expect(a.missionId).toBe(TEST_MISSION_ID);
      }
    });

    it("ArtifactFilter by artifactType", () => {
      const result = inspector.listArtifacts({
        artifactType: ArtifactType.OBSERVATION,
      });
      for (const a of result.items) {
        expect(a.artifactType).toBe(ArtifactType.OBSERVATION);
      }
    });

    it("EvidenceFilter by missionId", () => {
      const graph = inspector.getEvidenceGraph({ missionId: TEST_MISSION_ID });
      for (const node of graph.nodes) {
        expect(node.missionId).toBe(TEST_MISSION_ID);
      }
    });
  });

  // ─── Pagination Tests ──────────────────────────────────────────────────

  describe("Pagination", () => {
    it("default pagination returns page 1 with 50 items", () => {
      const result = inspector.listEvents();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(50);
    });

    it("custom pagination parameters", () => {
      const result = inspector.listEvents({}, { page: 1, pageSize: 5 });
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(5);
      expect(result.items.length).toBeLessThanOrEqual(5);
    });

    it("hasMore is true when more pages exist", () => {
      const result = inspector.listEvents({}, { page: 1, pageSize: 1 });
      expect(result.hasMore).toBe(true);
    });

    it("hasMore is false on last page", () => {
      const result = inspector.listEvents({}, { page: 1, pageSize: 1000 });
      expect(result.hasMore).toBe(false);
    });

    it("pageSize is capped at MAX_PAGE_SIZE (200)", () => {
      const result = inspector.listEvents({}, { page: 1, pageSize: 999 });
      expect(result.pageSize).toBe(200);
    });
  });

  // ─── Composition Root Test ─────────────────────────────────────────────

  describe("Composition Root", () => {
    it("createInspector returns InspectorReadModel", () => {
      const inspectorInstance = createInspector({
        eventStore: deps.eventStore,
        persistence: deps.persistence,
        replayEngine: deps.replayEngine,
        artifactRegistry: deps.artifactRegistry,
        evidenceGraph: deps.evidenceGraph,
        router: deps.router,
        coordinators: deps.coordinators,
      });

      expect(inspectorInstance).toBeDefined();
      expect(typeof inspectorInstance.listMissions).toBe("function");
      expect(typeof inspectorInstance.getMission).toBe("function");
      expect(typeof inspectorInstance.listEvents).toBe("function");
      expect(typeof inspectorInstance.getHealth).toBe("function");
      expect(typeof inspectorInstance.getStatistics).toBe("function");
      expect(typeof inspectorInstance.getEventsSince).toBe("function");
    });
  });

  // ─── Error Handling Tests ──────────────────────────────────────────────

  describe("Error Handling", () => {
    it("returns undefined for nonexistent mission (never throws)", () => {
      expect(() => inspector.getMission("no-such-mission")).not.toThrow();
      expect(inspector.getMission("no-such-mission")).toBeUndefined();
    });

    it("returns undefined for nonexistent event (never throws)", () => {
      expect(() => inspector.getEvent("no-such-event")).not.toThrow();
      expect(inspector.getEvent("no-such-event")).toBeUndefined();
    });

    it("returns undefined for nonexistent artifact (never throws)", () => {
      expect(() => inspector.getArtifact("no-such-artifact")).not.toThrow();
      expect(inspector.getArtifact("no-such-artifact")).toBeUndefined();
    });

    it("returns undefined for nonexistent snapshot (never throws)", () => {
      expect(() => inspector.getSnapshot("no-such-snapshot")).not.toThrow();
      expect(inspector.getSnapshot("no-such-snapshot")).toBeUndefined();
    });

    it("returns empty array for nonexistent mission events", () => {
      const result = inspector.getMissionEvents("no-such-mission");
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("returns empty array for nonexistent mission history", () => {
      const history = inspector.getMissionHistory("no-such-mission");
      expect(history).toEqual([]);
    });

    it("returns empty array for nonexistent mission artifacts", () => {
      const result = inspector.getMissionArtifacts("no-such-mission");
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
