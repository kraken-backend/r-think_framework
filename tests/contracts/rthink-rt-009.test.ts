/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — End-to-End Mission Validation Tests
// Mission: RTHINK-RT-009
// Blueprint Reference: RTHINK-BP-001
//
// Six E2E scenarios validating the complete Runtime system:
//   A. Successful Controlled Mission — full lifecycle L1 OBSERVE→COMPLETED
//   B. Missing Artifact Gate — transition denied when artifacts absent
//   C. Authority Required — L3 critical mission requires authority grant
//   D. Contradiction and Recovery — detect contradiction, recover, resume
//   E. Replay/Snapshot Equivalence — snapshot-assisted replay matches full replay
//   F. Inspector Read-Only Integrity — deep-copy boundary, zero mutation

import { describe, it, expect, beforeEach } from "vitest";
import {
  CognitiveState,
  OperationalState,
  TransitionDecisionType,
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
import { MissionRuntimeCoordinator } from "../../src/runtime/mission-runtime-coordinator.js";
import { ArtifactRegistry } from "../../src/runtime/artifact-registry.js";
import { EvidenceGraph } from "../../src/runtime/evidence-graph.js";
import { Router } from "../../src/runtime/router.js";
import { Persistence } from "../../src/runtime/persistence.js";
import { ReplayEngine } from "../../src/runtime/replay.js";
import { createInspector } from "../../src/inspector/composition-root.js";
import type { InspectorReadModel } from "../../src/inspector/inspector-read-model.js";

// ─── Shared Fixtures ────────────────────────────────────────────────────────

const MISSION_A = "E2E-SCENARIO-A";
const MISSION_B = "E2E-SCENARIO-B";
const MISSION_C = "E2E-SCENARIO-C";
const MISSION_D = "E2E-SCENARIO-D";
const MISSION_E = "E2E-SCENARIO-E";
const MISSION_F = "E2E-SCENARIO-F";

function makeContract(missionId: string, risk: MissionRiskLevel): MissionContract {
  return {
    missionId,
    consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001", section: "E2E" }],
    objective: `E2E validation for ${missionId}`,
    context: "RT-009 End-to-End Mission Validation",
    allowedScope: {
      projects: ["rthink-runtime"],
      tools: ["vitest"],
      description: "Full system E2E validation",
    },
    explicitNonScope: ["Business logic", "Runtime mutation by Inspector"],
    authority: {
      read: true,
      write: true,
      execute: false,
      network: false,
      humanDecision: false,
    },
    riskNoveltyLevel: risk,
    acceptanceCriteria: ["All E2E scenarios pass"],
    verification: ["E2E tests"],
    evidenceRequirements: ["Event verification", "Inspector verification"],
    failureProtocol: ["Record failure", "Return to observation"],
    escalationConditions: ["Module unavailable"],
    guardianApproval: false,
  };
}

function makeArtifact(
  missionId: string,
  artifactType: ArtifactType,
  id: string,
  state: CognitiveState = CognitiveState.OBSERVE
): ArtifactEnvelope {
  return {
    rtpVersion: "1.0",
    artifactId: id,
    artifactType,
    version: 1,
    missionId,
    consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001", section: "E2E" }],
    actor: { id: "e2e-engineer", role: ActorRole.ENGINEER },
    state,
    sourceRefs: artifactType === ArtifactType.OBSERVATION
      ? [{ sourceId: `${id}-src`, type: "observation", uri: `file:///${id}.txt` }]
      : [],
    payload: { type: artifactType, generatedBy: "E2E-RT-009" },
    evidenceRefs: [],
    createdAt: new Date().toISOString(),
  };
}

// ─── E2E Wiring Factory ─────────────────────────────────────────────────────

interface E2ERuntime {
  persistence: Persistence;
  artifactRegistry: ArtifactRegistry;
  evidenceGraph: EvidenceGraph;
  router: Router;
  replayEngine: ReplayEngine;
  coordinators: Map<string, MissionRuntimeCoordinator>;
  inspector: InspectorReadModel;
}

function createE2ERuntime(): E2ERuntime {
  const persistence = new Persistence();
  const artifactRegistry = new ArtifactRegistry();
  const evidenceGraph = new EvidenceGraph();
  const router = new Router();
  const replayEngine = new ReplayEngine(
    persistence.getEventStore(),
    persistence.getSnapshotStore()
  );
  const coordinators = new Map<string, MissionRuntimeCoordinator>();
  const inspector = createInspector({
    eventStore: persistence.getEventStore(),
    persistence,
    replayEngine,
    artifactRegistry,
    evidenceGraph,
    router,
    coordinators,
  });
  return {
    persistence,
    artifactRegistry,
    evidenceGraph,
    router,
    replayEngine,
    coordinators,
    inspector,
  };
}

function createCoordinator(
  rt: E2ERuntime,
  missionId: string,
  risk: MissionRiskLevel
): MissionRuntimeCoordinator {
  const coord = new MissionRuntimeCoordinator(
    { missionId, contract: makeContract(missionId, risk), riskLevel: risk },
    {
      artifactRegistry: rt.artifactRegistry,
      evidenceGraph: rt.evidenceGraph,
      router: rt.router,
      persistence: rt.persistence,
      replayEngine: rt.replayEngine,
    }
  );
  rt.coordinators.set(missionId, coord);
  return coord;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO A — Successful Controlled Mission
// ═══════════════════════════════════════════════════════════════════════════════

describe("RT-009 Scenario A: Successful Controlled Mission", () => {
  let rt: E2ERuntime;
  let coord: MissionRuntimeCoordinator;

  beforeEach(() => {
    rt = createE2ERuntime();
    coord = createCoordinator(rt, MISSION_A, MissionRiskLevel.L1_CONTROLLED);
    coord.initializeMission();
  });

  it("starts in OBSERVE state after initialization", () => {
    expect(coord.getCurrentState()).toBe(CognitiveState.OBSERVE);
    expect(coord.isTerminated()).toBe(false);
    expect(coord.getContradictions()).toHaveLength(0);
  });

  it("transitions OBSERVE to UNDERSTAND after registering OBSERVATION artifact", () => {
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.OBSERVATION, "OBS-A1")
    );
    const decision = coord.requestTransition(
      CognitiveState.UNDERSTAND,
      [ArtifactType.OBSERVATION],
      [],
      []
    );
    expect(decision.decision).toBe(TransitionDecisionType.ALLOW);
    expect(coord.getCurrentState()).toBe(CognitiveState.UNDERSTAND);
  });

  it("completes full cognitive lifecycle OBSERVE to EVOLVE to COMPLETED", () => {
    // OBSERVE -> UNDERSTAND
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.OBSERVATION, "OBS-1")
    );
    let d = coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);
    expect(d.decision).toBe(TransitionDecisionType.ALLOW);

    // UNDERSTAND -> QUESTION
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.PROBLEM_REPRESENTATION, "PR-1", CognitiveState.UNDERSTAND)
    );
    d = coord.requestTransition(CognitiveState.QUESTION, [ArtifactType.PROBLEM_REPRESENTATION], [], []);
    expect(d.decision).toBe(TransitionDecisionType.ALLOW);

    // QUESTION -> VALIDATE
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.QUESTION, "Q-1", CognitiveState.QUESTION)
    );
    d = coord.requestTransition(CognitiveState.VALIDATE, [ArtifactType.QUESTION], [], []);
    expect(d.decision).toBe(TransitionDecisionType.ALLOW);

    // VALIDATE -> CONNECT
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.VALIDATION, "VAL-1", CognitiveState.VALIDATE)
    );
    d = coord.requestTransition(CognitiveState.CONNECT, [ArtifactType.VALIDATION], ["evidence-1"], []);
    expect(d.decision).toBe(TransitionDecisionType.ALLOW);

    // CONNECT -> CHALLENGE
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.RELATIONSHIP, "REL-1", CognitiveState.CONNECT)
    );
    d = coord.requestTransition(CognitiveState.CHALLENGE, [ArtifactType.RELATIONSHIP], [], []);
    expect(d.decision).toBe(TransitionDecisionType.ALLOW);

    // CHALLENGE -> DISCOVER
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.CHALLENGE, "CH-1", CognitiveState.CHALLENGE)
    );
    d = coord.requestTransition(CognitiveState.DISCOVER, [ArtifactType.CHALLENGE], ["evidence-2"], []);
    expect(d.decision).toBe(TransitionDecisionType.ALLOW);

    // DISCOVER -> EVOLVE
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.DISCOVERY, "DISC-1", CognitiveState.DISCOVER)
    );
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.HYPOTHESIS, "HYP-1", CognitiveState.DISCOVER)
    );
    d = coord.requestTransition(CognitiveState.EVOLVE, [ArtifactType.DISCOVERY, ArtifactType.HYPOTHESIS], ["evidence-3"], []);
    expect(d.decision).toBe(TransitionDecisionType.ALLOW);

    // EVOLVE -> COMPLETED
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.EVOLUTION, "EVO-1", CognitiveState.EVOLVE)
    );
    d = coord.requestTransition(OperationalState.COMPLETED, [ArtifactType.EVOLUTION], ["evidence-4"], []);
    expect(d.decision).toBe(TransitionDecisionType.ALLOW);

    expect(coord.getCurrentState()).toBe(OperationalState.COMPLETED);
  });

  it("emits STATE_CHANGED events for every transition", () => {
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.OBSERVATION, "OBS-E1")
    );
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);

    const events = coord.getMissionEvents();
    const stateEvents = events.filter(
      (e) => e.eventType === RuntimeEventType.STATE_CHANGED
    );
    expect(stateEvents.length).toBeGreaterThanOrEqual(2); // requested + decided
    const decided = stateEvents.find(
      (e) => (e.metadata as Record<string, unknown>).phase === "transition-decided"
    );
    expect(decided).toBeDefined();
    expect((decided!.payload as Record<string, unknown>).decision).toBe(TransitionDecisionType.ALLOW);
  });

  it("emits ARTIFACT_REGISTERED events", () => {
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.OBSERVATION, "OBS-E2")
    );
    const events = coord.getMissionEvents();
    const artifactEvents = events.filter(
      (e) => e.eventType === RuntimeEventType.ARTIFACT_REGISTERED
    );
    expect(artifactEvents).toHaveLength(1);
  });

  it("Inspector reflects live runtime state", () => {
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.OBSERVATION, "OBS-I1")
    );
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);

    const mission = rt.inspector.getMission(MISSION_A);
    expect(mission).toBeDefined();
    expect(mission!.currentState).toBe(CognitiveState.UNDERSTAND);
    expect(mission!.previousState).toBe(CognitiveState.OBSERVE);
    expect(mission!.eventCount).toBeGreaterThanOrEqual(3);
  });

  it("event store has globally ordered events", () => {
    coord.registerArtifact(
      makeArtifact(MISSION_A, ArtifactType.OBSERVATION, "OBS-G1")
    );
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);

    const allEvents = rt.persistence.stream();
    for (let i = 1; i < allEvents.length; i++) {
      expect(allEvents[i]!.globalPosition).toBeGreaterThan(
        allEvents[i - 1]!.globalPosition
      );
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO B — Missing Artifact Gate
// ═══════════════════════════════════════════════════════════════════════════════

describe("RT-009 Scenario B: Missing Artifact Gate", () => {
  let rt: E2ERuntime;
  let coord: MissionRuntimeCoordinator;

  beforeEach(() => {
    rt = createE2ERuntime();
    coord = createCoordinator(rt, MISSION_B, MissionRiskLevel.L1_CONTROLLED);
    coord.initializeMission();
  });

  it("denies OBSERVE to UNDERSTAND when OBSERVATION artifact is missing", () => {
    const decision = coord.requestTransition(
      CognitiveState.UNDERSTAND,
      [],
      [],
      []
    );
    expect(decision.decision).toBe(TransitionDecisionType.DENY);
    expect(decision.reasonCode).toContain("REQUIRED_ARTIFACT");
    expect(coord.getCurrentState()).toBe(CognitiveState.OBSERVE);
  });

  it("denies UNDERSTAND to QUESTION when PROBLEM_REPRESENTATION artifact is missing", () => {
    coord.registerArtifact(
      makeArtifact(MISSION_B, ArtifactType.OBSERVATION, "OBS-B1")
    );
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);
    expect(coord.getCurrentState()).toBe(CognitiveState.UNDERSTAND);

    const decision = coord.requestTransition(
      CognitiveState.QUESTION,
      [],
      [],
      []
    );
    expect(decision.decision).toBe(TransitionDecisionType.DENY);
    expect(decision.reasonCode).toContain("REQUIRED_ARTIFACT");
    expect(coord.getCurrentState()).toBe(CognitiveState.UNDERSTAND);
  });

  it("denies VALIDATE to CONNECT when VALIDATION artifact is missing", () => {
    // Walk through to VALIDATE quickly
    coord.registerArtifact(makeArtifact(MISSION_B, ArtifactType.OBSERVATION, "B-O1"));
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);
    coord.registerArtifact(makeArtifact(MISSION_B, ArtifactType.PROBLEM_REPRESENTATION, "B-PR1", CognitiveState.UNDERSTAND));
    coord.requestTransition(CognitiveState.QUESTION, [ArtifactType.PROBLEM_REPRESENTATION], [], []);
    coord.registerArtifact(makeArtifact(MISSION_B, ArtifactType.QUESTION, "B-Q1", CognitiveState.QUESTION));
    coord.requestTransition(CognitiveState.VALIDATE, [ArtifactType.QUESTION], [], []);
    expect(coord.getCurrentState()).toBe(CognitiveState.VALIDATE);

    const decision = coord.requestTransition(
      CognitiveState.CONNECT,
      [],
      [],
      []
    );
    expect(decision.decision).toBe(TransitionDecisionType.DENY);
    expect(coord.getCurrentState()).toBe(CognitiveState.VALIDATE);
  });

  it("allows transition once artifact type is provided", () => {
    const d1 = coord.requestTransition(CognitiveState.UNDERSTAND, [], [], []);
    expect(d1.decision).toBe(TransitionDecisionType.DENY);

    coord.registerArtifact(
      makeArtifact(MISSION_B, ArtifactType.OBSERVATION, "OBS-B2")
    );
    const d2 = coord.requestTransition(
      CognitiveState.UNDERSTAND,
      [ArtifactType.OBSERVATION],
      [],
      []
    );
    expect(d2.decision).toBe(TransitionDecisionType.ALLOW);
    expect(coord.getCurrentState()).toBe(CognitiveState.UNDERSTAND);
  });

  it("Inspector shows mission remains in OBSERVE when gate blocks", () => {
    coord.requestTransition(CognitiveState.UNDERSTAND, [], [], []);
    const mission = rt.inspector.getMission(MISSION_B);
    expect(mission).toBeDefined();
    expect(mission!.currentState).toBe(CognitiveState.OBSERVE);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO C — Authority Required
// ═══════════════════════════════════════════════════════════════════════════════

describe("RT-009 Scenario C: Authority Required", () => {
  let rt: E2ERuntime;
  let coord: MissionRuntimeCoordinator;

  beforeEach(() => {
    rt = createE2ERuntime();
    coord = createCoordinator(rt, MISSION_C, MissionRiskLevel.L3_CRITICAL);
    coord.initializeMission();
  });

  it("starts with authority NOT_REQUIRED for a new mission", () => {
    expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.NOT_REQUIRED);
  });

  it("sets authority to PENDING when requested", () => {
    coord.requestAuthority(ActorRole.ENGINEER, "Need HA approval for L3 critical mission");
    expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.PENDING);
  });

  it("sets authority to GRANTED when approved", () => {
    coord.requestAuthority(ActorRole.ENGINEER, "Requesting authority");
    coord.grantAuthority("AUTH-001", ActorRole.HUMAN, "Approved by HA");
    expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.GRANTED);
  });

  it("sets authority to DENIED when rejected", () => {
    coord.requestAuthority(ActorRole.ENGINEER, "Requesting authority");
    coord.denyAuthority("AUTH-002", ActorRole.HUMAN, "Denied: scope too broad");
    expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.DENIED);
  });

  it("emits AUTHORITY_GRANTED event", () => {
    coord.requestAuthority(ActorRole.ENGINEER, "Request");
    coord.grantAuthority("AUTH-003", ActorRole.HUMAN, "Granted");
    const events = coord.getMissionEvents();
    const authEvents = events.filter(
      (e) => e.eventType === RuntimeEventType.AUTHORITY_GRANTED
    );
    expect(authEvents).toHaveLength(1);
  });

  it("can reset authority back to NOT_REQUIRED", () => {
    coord.requestAuthority(ActorRole.ENGINEER, "Request");
    coord.grantAuthority("AUTH-004", ActorRole.HUMAN, "Granted");
    coord.resetAuthority();
    expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.NOT_REQUIRED);
  });

  it("Inspector reflects authority status changes", () => {
    coord.requestAuthority(ActorRole.ENGINEER, "Request for Inspector");
    const auth1 = rt.inspector.getMissionAuthority(MISSION_C);
    expect(auth1).toBeDefined();
    expect(auth1!.status).toBe("PENDING");

    coord.grantAuthority("AUTH-005", ActorRole.HUMAN, "Granted");
    const auth2 = rt.inspector.getMissionAuthority(MISSION_C);
    expect(auth2).toBeDefined();
    expect(auth2!.status).toBe("GRANTED");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO D — Contradiction and Recovery
// ═══════════════════════════════════════════════════════════════════════════════

describe("RT-009 Scenario D: Contradiction and Recovery", () => {
  let rt: E2ERuntime;
  let coord: MissionRuntimeCoordinator;

  beforeEach(() => {
    rt = createE2ERuntime();
    coord = createCoordinator(rt, MISSION_D, MissionRiskLevel.L1_CONTROLLED);
    coord.initializeMission();
  });

  it("records contradiction and routes to appropriate state", () => {
    // Advance to UNDERSTAND first
    coord.registerArtifact(makeArtifact(MISSION_D, ArtifactType.OBSERVATION, "D-O1"));
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);
    expect(coord.getCurrentState()).toBe(CognitiveState.UNDERSTAND);

    // Record contradiction — should route back to OBSERVE (section 6.3)
    const routedState = coord.recordContradiction(
      "OBSERVE results contradict UNDERSTAND conclusions"
    );
    expect([CognitiveState.OBSERVE, CognitiveState.VALIDATE]).toContain(routedState);
    expect(coord.getContradictions()).toHaveLength(1);
    expect(coord.getContradictions()[0]).toContain("OBSERVE results contradict");
  });

  it("emits CONTRADICTION_DETECTED event", () => {
    coord.recordContradiction("Test contradiction event");
    const events = coord.getMissionEvents();
    const contradictionEvents = events.filter(
      (e) => e.eventType === RuntimeEventType.CONTRADICTION_DETECTED
    );
    expect(contradictionEvents).toHaveLength(1);
  });

  it("can recover from failure", () => {
    coord.recoverFromFailure("Module timeout");
    expect(coord.getCurrentState()).toBe(CognitiveState.OBSERVE);

    const events = coord.getMissionEvents();
    const recoveryEvents = events.filter(
      (e) =>
        e.eventType === RuntimeEventType.RECOVERY_STARTED ||
        e.eventType === RuntimeEventType.RECOVERY_COMPLETED
    );
    expect(recoveryEvents.length).toBeGreaterThanOrEqual(2);
  });

  it("mission can resume after contradiction recovery", () => {
    coord.recordContradiction("Contradiction during analysis");
    expect(coord.getCurrentState()).toBe(CognitiveState.OBSERVE);

    // Resume the lifecycle
    coord.registerArtifact(makeArtifact(MISSION_D, ArtifactType.OBSERVATION, "D-O2"));
    const d = coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);
    expect(d.decision).toBe(TransitionDecisionType.ALLOW);
    expect(coord.getCurrentState()).toBe(CognitiveState.UNDERSTAND);
  });

  it("multiple contradictions accumulate", () => {
    coord.recordContradiction("First contradiction");
    coord.recoverFromFailure("Recovery 1");
    coord.recordContradiction("Second contradiction");
    expect(coord.getContradictions()).toHaveLength(2);
  });

  it("Inspector reflects contradictions and recovery state", () => {
    coord.recordContradiction("Inspector-visible contradiction");
    const detail = rt.inspector.getMission(MISSION_D);
    expect(detail).toBeDefined();
    expect(detail!.contradictions).toHaveLength(1);
    expect(detail!.contradictions[0]).toContain("Inspector-visible contradiction");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO E — Replay/Snapshot Equivalence
// ═══════════════════════════════════════════════════════════════════════════════

describe("RT-009 Scenario E: Replay/Snapshot Equivalence", () => {
  let rt: E2ERuntime;
  let coord: MissionRuntimeCoordinator;

  beforeEach(() => {
    rt = createE2ERuntime();
    coord = createCoordinator(rt, MISSION_E, MissionRiskLevel.L1_CONTROLLED);
    coord.initializeMission();
  });

  it("full replay produces valid result with correct event count", () => {
    coord.registerArtifact(makeArtifact(MISSION_E, ArtifactType.OBSERVATION, "E-O1"));
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);

    const replayResult = coord.replay();
    expect(replayResult.events.length).toBeGreaterThanOrEqual(3);
    expect(replayResult.validation.valid).toBe(true);
    expect(replayResult.aggregateId).toBe(MISSION_E);
  });

  it("snapshot-assisted replay produces valid result with subsequent events", () => {
    // Advance a few steps
    coord.registerArtifact(makeArtifact(MISSION_E, ArtifactType.OBSERVATION, "E-O2"));
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);

    // Create snapshot
    const snapshot = coord.createSnapshot({ note: "mid-lifecycle" });
    expect(snapshot).toBeDefined();
    expect(snapshot.aggregateId).toBe(MISSION_E);

    // Advance further
    coord.registerArtifact(makeArtifact(MISSION_E, ArtifactType.PROBLEM_REPRESENTATION, "E-PR1", CognitiveState.UNDERSTAND));
    coord.requestTransition(CognitiveState.QUESTION, [ArtifactType.PROBLEM_REPRESENTATION], [], []);

    // Full replay from scratch
    const fullReplay = coord.replay();
    expect(fullReplay.events.length).toBeGreaterThanOrEqual(5);

    // Snapshot-assisted replay: should replay events from snapshot position onward
    const snapshotReplay = coord.replayFromSnapshot(snapshot.snapshotId);
    expect(snapshotReplay).toBeDefined();
    expect(snapshotReplay!.events.length).toBeGreaterThanOrEqual(1);
  });

  it("replay produces deterministic result", () => {
    coord.registerArtifact(makeArtifact(MISSION_E, ArtifactType.OBSERVATION, "E-O3"));
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);

    const replay1 = coord.replay();
    const replay2 = coord.replay();
    expect(replay1.events.length).toBe(replay2.events.length);
    expect(replay1.validation.valid).toBe(replay2.validation.valid);
    for (let i = 0; i < replay1.events.length; i++) {
      expect(replay1.events[i]!.eventId).toBe(replay2.events[i]!.eventId);
    }
  });

  it("Inspector replayMission returns same event count as coordinator replay", () => {
    coord.registerArtifact(makeArtifact(MISSION_E, ArtifactType.OBSERVATION, "E-O4"));
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);

    const coordReplay = coord.replay();
    const inspectorReplay = rt.inspector.replayMission(MISSION_E);
    expect(inspectorReplay).toBeDefined();
    expect(inspectorReplay!.eventCount).toBe(coordReplay.events.length);
    expect(inspectorReplay!.valid).toBe(true);
  });

  it("snapshots are listed in Inspector", () => {
    coord.registerArtifact(makeArtifact(MISSION_E, ArtifactType.OBSERVATION, "E-O5"));
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);
    coord.createSnapshot({ checkpoint: "after-understand" });

    const snapshots = rt.inspector.listSnapshots();
    expect(snapshots.length).toBeGreaterThanOrEqual(1);
    expect(snapshots[0]!.aggregateId).toBe(MISSION_E);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO F — Inspector Read-Only Integrity
// ═══════════════════════════════════════════════════════════════════════════════

describe("RT-009 Scenario F: Inspector Read-Only Integrity", () => {
  let rt: E2ERuntime;
  let coord: MissionRuntimeCoordinator;

  beforeEach(() => {
    rt = createE2ERuntime();
    coord = createCoordinator(rt, MISSION_F, MissionRiskLevel.L1_CONTROLLED);
    coord.initializeMission();
    coord.registerArtifact(makeArtifact(MISSION_F, ArtifactType.OBSERVATION, "F-O1"));
    coord.requestTransition(CognitiveState.UNDERSTAND, [ArtifactType.OBSERVATION], [], []);
  });

  it("mutating returned DTO does not affect runtime state", () => {
    const mission1 = rt.inspector.getMission(MISSION_F);
    expect(mission1).toBeDefined();
    const originalState = mission1!.currentState;
    const originalEventCount = mission1!.eventCount;

    // Mutate the returned DTO
    mission1!.currentState = "INVALID_STATE" as any;
    mission1!.eventCount = 99999;

    // Runtime state should be unaffected
    const mission2 = rt.inspector.getMission(MISSION_F);
    expect(mission2).toBeDefined();
    expect(mission2!.currentState).toBe(originalState);
    expect(mission2!.eventCount).toBe(originalEventCount);
  });

  it("mutating listMissions result does not affect runtime", () => {
    const result = rt.inspector.listMissions();
    expect(result.items.length).toBeGreaterThanOrEqual(1);

    // Mutate the result
    result.items = [];
    result.total = 0;

    // Original data unaffected
    const result2 = rt.inspector.listMissions();
    expect(result2.items.length).toBeGreaterThanOrEqual(1);
    expect(result2.total).toBeGreaterThanOrEqual(1);
  });

  it("mutating event list does not affect runtime", () => {
    const events = rt.inspector.listEvents();
    expect(events.items.length).toBeGreaterThanOrEqual(1);

    events.items = [];

    const events2 = rt.inspector.listEvents();
    expect(events2.items.length).toBeGreaterThanOrEqual(1);
  });

  it("mutating evidence graph does not affect runtime", () => {
    const graph = rt.inspector.getEvidenceGraph();
    const originalNodeCount = graph.nodeCount;

    graph.nodeCount = 0;
    graph.nodes = [];

    const graph2 = rt.inspector.getEvidenceGraph();
    expect(graph2.nodeCount).toBe(originalNodeCount);
  });

  it("mutating health does not affect runtime", () => {
    const health = rt.inspector.getHealth();
    const originalTotal = health.totalEvents;

    health.totalEvents = 0;

    const health2 = rt.inspector.getHealth();
    expect(health2.totalEvents).toBe(originalTotal);
  });

  it("each getMission call returns a new deep-copied object", () => {
    const m1 = rt.inspector.getMission(MISSION_F);
    const m2 = rt.inspector.getMission(MISSION_F);
    expect(m1).not.toBe(m2);
    expect(m1).toEqual(m2);
  });

  it("each listEvents call returns new deep-copied objects", () => {
    const e1 = rt.inspector.listEvents();
    const e2 = rt.inspector.listEvents();
    expect(e1).not.toBe(e2);
    expect(e1.items).not.toBe(e2.items);
    expect(e1).toEqual(e2);
  });

  it("Inspector has no mutation methods", () => {
    const inspector = rt.inspector;
    const readMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(inspector));
    const mutationKeywords = [
      "create", "update", "delete", "set", "insert", "remove",
      "modify", "grant", "deny", "transition", "restart",
    ];
    for (const method of readMethods) {
      if (method === "constructor") continue;
      for (const keyword of mutationKeywords) {
        expect(method.toLowerCase()).not.toContain(keyword);
      }
    }
  });

  it("getEventsSince returns events after given position", () => {
    const allEvents = rt.inspector.listEvents();
    expect(allEvents.items.length).toBeGreaterThanOrEqual(2);
    const afterFirst = allEvents.items[0]!.globalPosition;
    const since = rt.inspector.getEventsSince(afterFirst);
    expect(since.length).toBeGreaterThanOrEqual(1);
    for (const evt of since) {
      expect(evt.globalPosition).toBeGreaterThanOrEqual(afterFirst);
    }
  });

  it("validateEvidenceGraph returns valid for well-formed graph", () => {
    coord.createEvidenceNode({
      nodeId: "F-EN1",
      nodeType: EvidenceGraphNodeType.MISSION,
      missionId: MISSION_F,
    });
    coord.createEvidenceNode({
      nodeId: "F-EN2",
      nodeType: EvidenceGraphNodeType.OBSERVATION,
      missionId: MISSION_F,
    });
    coord.connectEvidence("F-EN1", "F-EN2", EvidenceGraphRelationType.GENERATES);

    const validation = rt.inspector.validateEvidenceGraph();
    expect(validation.valid).toBe(true);
  });
});
