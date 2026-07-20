/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Mission Runtime Coordinator Tests
// Blueprint Reference: RTHINK-BP-001 §17
// Mission: RTHINK-RT-007 (Mission Runtime Coordinator Foundation)

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
  RuntimeEvent,
} from "../../src/contracts/index.js";
import {
  MissionRuntimeCoordinator,
  MISSION_RUNTIME_COORDINATOR_VERSION,
} from "../../src/runtime/mission-runtime-coordinator.js";
import { ArtifactRegistry } from "../../src/runtime/artifact-registry.js";
import { EvidenceGraph } from "../../src/runtime/evidence-graph.js";
import { Router } from "../../src/runtime/router.js";
import { Persistence } from "../../src/runtime/persistence.js";
import { ReplayEngine } from "../../src/runtime/replay.js";

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const TEST_MISSION_ID = "RT-007-TEST";

const TEST_CONTRACT: MissionContract = {
  missionId: TEST_MISSION_ID,
  consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001", section: "17" }],
  objective: "Test Mission Runtime Coordinator foundation",
  context: "Unit and integration tests for RT-007",
  allowedScope: {
    projects: ["rthink-runtime"],
    tools: ["vitest"],
    description: "Testing coordination orchestration",
  },
  explicitNonScope: ["Business logic", "OCR", "LLM", "Prompt engineering"],
  authority: {
    read: true,
    write: true,
    execute: false,
    network: false,
    humanDecision: false,
  },
  riskNoveltyLevel: MissionRiskLevel.L2_SIGNIFICANT,
  acceptanceCriteria: [
    "All coordination methods work correctly",
    "Events are emitted for every action",
    "No business logic in coordinator",
  ],
  verification: ["Unit tests", "Integration tests", "Lifecycle tests"],
  evidenceRequirements: ["Test output", "Event verification"],
  failureProtocol: ["Record failure", "Return to observation"],
  escalationConditions: ["Module unavailable"],
  guardianApproval: false,
};

const TEST_ARTIFACT: ArtifactEnvelope = {
  rtpVersion: "1.0",
  artifactId: "ART-RT007-001",
  artifactType: ArtifactType.OBSERVATION,
  version: 1,
  missionId: TEST_MISSION_ID,
  consumerBlueprintRefs: [{ documentId: "RTHINK-BP-001", section: "17" }],
  actor: { id: "test-engineer", role: ActorRole.ENGINEER },
  state: CognitiveState.OBSERVE,
  sourceRefs: [{ type: "test", uri: "rthink://test/observation" }],
  payload: { observation: "Test observation data" },
  evidenceRefs: [],
  createdAt: new Date().toISOString(),
};

// ─── Helper: Create Dependencies ────────────────────────────────────────────

function createDependencies() {
  const persistence = new Persistence();
  const replayEngine = new ReplayEngine(
    persistence.getEventStore(),
    persistence.getSnapshotStore()
  );
  return {
    artifactRegistry: new ArtifactRegistry(),
    evidenceGraph: new EvidenceGraph(),
    router: new Router(),
    persistence,
    replayEngine,
  };
}

function createCoordinator(deps?: ReturnType<typeof createDependencies>) {
  const d = deps ?? createDependencies();
  return {
    coordinator: new MissionRuntimeCoordinator(
      {
        missionId: TEST_MISSION_ID,
        contract: TEST_CONTRACT,
        riskLevel: MissionRiskLevel.L2_SIGNIFICANT,
      },
      d
    ),
    deps: d,
  };
}

// ─── 19.1 — Mission Lifecycle ───────────────────────────────────────────────

describe("RT-007: Mission Runtime Coordinator", () => {
  describe("19.1 — Mission Lifecycle", () => {
    let coord: MissionRuntimeCoordinator;
    let deps: ReturnType<typeof createDependencies>;

    beforeEach(() => {
      const created = createCoordinator();
      coord = created.coordinator;
      deps = created.deps;
    });

    it("19.1.1 — Coordinator version is defined", () => {
      expect(MISSION_RUNTIME_COORDINATOR_VERSION).toBe("rt-007-v1.0");
    });

    it("19.1.2 — Initial state is OBSERVE", () => {
      expect(coord.getCurrentState()).toBe(CognitiveState.OBSERVE);
    });

    it("19.1.3 — Initial state history contains OBSERVE", () => {
      expect(coord.getStateHistory()).toEqual([CognitiveState.OBSERVE]);
    });

    it("19.1.4 — Initial authority status is NOT_REQUIRED", () => {
      expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.NOT_REQUIRED);
    });

    it("19.1.5 — Initial contradictions is empty", () => {
      expect(coord.getContradictions()).toEqual([]);
    });

    it("19.1.6 — Not terminated initially", () => {
      expect(coord.isTerminated()).toBe(false);
    });

    it("19.1.7 — Mission ID matches config", () => {
      expect(coord.getMissionId()).toBe(TEST_MISSION_ID);
    });

    it("19.1.8 — Contract matches config", () => {
      expect(coord.getContract()).toBe(TEST_CONTRACT);
    });

    it("19.1.9 — Risk level matches config", () => {
      expect(coord.getRiskLevel()).toBe(MissionRiskLevel.L2_SIGNIFICANT);
    });

    it("19.1.10 — initializeMission emits MISSION_CREATED event", () => {
      coord.initializeMission();
      const events = coord.getMissionEvents();
      const created = events.find(
        (e) => e.eventType === RuntimeEventType.MISSION_CREATED
      );
      expect(created).toBeDefined();
      expect(created!.aggregateType).toBe(AggregateType.MISSION);
      expect(created!.payload.missionId).toBe(TEST_MISSION_ID);
    });

    it("19.1.11 — terminateMission emits MISSION_UPDATED event", () => {
      coord.terminateMission("test termination");
      const events = coord.getMissionEvents();
      const terminated = events.find(
        (e) =>
          e.eventType === RuntimeEventType.MISSION_UPDATED &&
          (e.payload as Record<string, unknown>).terminated === true
      );
      expect(terminated).toBeDefined();
      expect(terminated!.payload.reason).toBe("test termination");
    });

    it("19.1.12 — terminateMission sets isTerminated", () => {
      coord.terminateMission("test");
      expect(coord.isTerminated()).toBe(true);
    });

    it("19.1.13 — getCoordinatorState returns deep copy", () => {
      const s1 = coord.getCoordinatorState();
      const s2 = coord.getCoordinatorState();
      expect(s1).toEqual(s2);
      expect(s1).not.toBe(s2);
      expect(s1.stateHistory).not.toBe(s2.stateHistory);
      expect(s1.contradictions).not.toBe(s2.contradictions);
    });
  });

  // ─── 19.2 — Transition Orchestration ──────────────────────────────────────

  describe("19.2 — Transition Orchestration", () => {
    let coord: MissionRuntimeCoordinator;

    beforeEach(() => {
      coord = createCoordinator().coordinator;
    });

    it("19.2.1 — OBSERVE → UNDERSTAND with OBSERVATION artifact is ALLOW", () => {
      const decision = coord.requestTransition(
        CognitiveState.UNDERSTAND,
        ["OBSERVATION"],
        [],
        []
      );
      expect(decision.decision).toBe(TransitionDecisionType.ALLOW);
      expect(coord.getCurrentState()).toBe(CognitiveState.UNDERSTAND);
    });

    it("19.2.2 — OBSERVE → UNDERSTAND without artifact is DENY", () => {
      const decision = coord.requestTransition(
        CognitiveState.UNDERSTAND,
        [],
        [],
        []
      );
      expect(decision.decision).toBe(TransitionDecisionType.DENY);
      expect(coord.getCurrentState()).toBe(CognitiveState.OBSERVE);
    });

    it("19.2.3 — requestTransition emits STATE_CHANGED events", () => {
      coord.requestTransition(CognitiveState.UNDERSTAND, ["OBSERVATION"], [], []);
      const events = coord.getMissionEvents();
      const requested = events.find(
        (e) =>
          e.eventType === RuntimeEventType.STATE_CHANGED &&
          e.metadata.phase === "transition-requested"
      );
      const decided = events.find(
        (e) =>
          e.eventType === RuntimeEventType.STATE_CHANGED &&
          e.metadata.phase === "transition-decided"
      );
      expect(requested).toBeDefined();
      expect(decided).toBeDefined();
    });

    it("19.2.4 — State history tracks all transitions", () => {
      coord.requestTransition(CognitiveState.UNDERSTAND, ["OBSERVATION"], [], []);
      coord.requestTransition(CognitiveState.QUESTION, ["PROBLEM_REPRESENTATION"], [], []);
      expect(coord.getStateHistory()).toEqual([
        CognitiveState.OBSERVE,
        CognitiveState.UNDERSTAND,
        CognitiveState.QUESTION,
      ]);
    });

    it("19.2.5 — Previous state is tracked", () => {
      coord.requestTransition(CognitiveState.UNDERSTAND, ["OBSERVATION"], [], []);
      expect(coord.getPreviousState()).toBe(CognitiveState.OBSERVE);
    });

    it("19.2.6 — forceState applies state without evaluation", () => {
      coord.forceState(OperationalState.WAITING_FOR_EVIDENCE, "test force");
      expect(coord.getCurrentState()).toBe(OperationalState.WAITING_FOR_EVIDENCE);
    });

    it("19.2.7 — forceState emits STATE_CHANGED event", () => {
      coord.forceState(OperationalState.WAITING_FOR_EVIDENCE, "test");
      const events = coord.getMissionEvents();
      const forced = events.find(
        (e) =>
          e.eventType === RuntimeEventType.STATE_CHANGED &&
          e.metadata.phase === "force-state"
      );
      expect(forced).toBeDefined();
    });

    it("19.2.8 — Terminated mission denies all transitions", () => {
      coord.terminateMission("done");
      const decision = coord.requestTransition(
        CognitiveState.UNDERSTAND,
        ["OBSERVATION"],
        [],
        []
      );
      expect(decision.decision).toBe(TransitionDecisionType.DENY);
      expect(coord.getCurrentState()).toBe(CognitiveState.OBSERVE);
    });

    it("19.2.9 — Full cognitive cycle: OBSERVE → UNDERSTAND → QUESTION → VALIDATE → CONNECT → CHALLENGE → DISCOVER → EVOLVE", () => {
      coord.requestTransition(CognitiveState.UNDERSTAND, ["OBSERVATION"], [], []);
      coord.requestTransition(CognitiveState.QUESTION, ["PROBLEM_REPRESENTATION"], [], []);
      coord.requestTransition(CognitiveState.VALIDATE, ["QUESTION"], [], []);
      coord.requestTransition(CognitiveState.CONNECT, ["VALIDATION"], ["ev-001"], []);
      coord.requestTransition(CognitiveState.CHALLENGE, ["RELATIONSHIP"], [], []);
      coord.requestTransition(CognitiveState.DISCOVER, ["CHALLENGE"], ["ev-002"], []);
      coord.requestTransition(CognitiveState.EVOLVE, ["DISCOVERY", "HYPOTHESIS"], ["ev-003"], []);
      expect(coord.getCurrentState()).toBe(CognitiveState.EVOLVE);
      expect(coord.getStateHistory()).toHaveLength(8);
    });
  });

  // ─── 19.3 — Artifact Coordination ─────────────────────────────────────────

  describe("19.3 — Artifact Coordination", () => {
    let coord: MissionRuntimeCoordinator;

    beforeEach(() => {
      coord = createCoordinator().coordinator;
    });

    it("19.3.1 — registerArtifact registers and emits event", () => {
      const result = coord.registerArtifact(TEST_ARTIFACT);
      expect(result.valid).toBe(true);
      expect(coord.hasArtifact("ART-RT007-001")).toBe(true);
    });

    it("19.3.2 — registerArtifact emits ARTIFACT_REGISTERED event", () => {
      coord.registerArtifact(TEST_ARTIFACT);
      const events = coord.getMissionEvents();
      const registered = events.find(
        (e) => e.eventType === RuntimeEventType.ARTIFACT_REGISTERED
      );
      expect(registered).toBeDefined();
      expect(registered!.payload.artifactId).toBe("ART-RT007-001");
    });

    it("19.3.3 — getArtifact retrieves artifact", () => {
      coord.registerArtifact(TEST_ARTIFACT);
      const artifact = coord.getArtifact("ART-RT007-001");
      expect(artifact).toBeDefined();
      expect(artifact!.artifactId).toBe("ART-RT007-001");
    });

    it("19.3.4 — listArtifacts returns all artifacts", () => {
      coord.registerArtifact(TEST_ARTIFACT);
      const list = coord.listArtifacts();
      expect(list).toHaveLength(1);
    });

    it("19.3.5 — listArtifacts filters by artifactType", () => {
      coord.registerArtifact(TEST_ARTIFACT);
      const obs = coord.listArtifacts({ artifactType: ArtifactType.OBSERVATION });
      const dec = coord.listArtifacts({ artifactType: ArtifactType.DECISION });
      expect(obs).toHaveLength(1);
      expect(dec).toHaveLength(0);
    });

    it("19.3.6 — listArtifacts filters by missionId", () => {
      coord.registerArtifact(TEST_ARTIFACT);
      const same = coord.listArtifacts({ missionId: TEST_MISSION_ID });
      const diff = coord.listArtifacts({ missionId: "OTHER" });
      expect(same).toHaveLength(1);
      expect(diff).toHaveLength(0);
    });

    it("19.3.7 — getArtifactVersionHistory returns version history", () => {
      coord.registerArtifact(TEST_ARTIFACT);
      const history = coord.getArtifactVersionHistory("ART-RT007-001");
      expect(history).toHaveLength(1);
    });

    it("19.3.8 — Duplicate artifact registration fails", () => {
      coord.registerArtifact(TEST_ARTIFACT);
      const result = coord.registerArtifact(TEST_ARTIFACT);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Duplicate");
    });

    it("19.3.9 — registerArtifact does not emit event on failure", () => {
      const initial = coord.getMissionEvents().length;
      coord.registerArtifact(TEST_ARTIFACT); // success
      coord.registerArtifact(TEST_ARTIFACT); // duplicate - fails
      const final = coord.getMissionEvents().length;
      // Only one new event (the successful registration)
      expect(final - initial).toBe(1);
    });
  });

  // ─── 19.4 — Evidence Coordination ─────────────────────────────────────────

  describe("19.4 — Evidence Coordination", () => {
    let coord: MissionRuntimeCoordinator;

    beforeEach(() => {
      coord = createCoordinator().coordinator;
    });

    it("19.4.1 — createEvidenceNode creates node and emits event", () => {
      const result = coord.createEvidenceNode({
        nodeId: "ev-node-001",
        nodeType: EvidenceGraphNodeType.OBSERVATION,
        missionId: TEST_MISSION_ID,
      });
      expect(result.valid).toBe(true);
      expect(coord.getEvidenceNode("ev-node-001")).toBeDefined();
    });

    it("19.4.2 — createEvidenceNode emits EVIDENCE_CREATED event", () => {
      coord.createEvidenceNode({
        nodeId: "ev-node-001",
        nodeType: EvidenceGraphNodeType.OBSERVATION,
        missionId: TEST_MISSION_ID,
      });
      const events = coord.getMissionEvents();
      const created = events.find(
        (e) => e.eventType === RuntimeEventType.EVIDENCE_CREATED
      );
      expect(created).toBeDefined();
      expect(created!.payload.nodeId).toBe("ev-node-001");
    });

    it("19.4.3 — connectEvidence connects nodes", () => {
      coord.createEvidenceNode({
        nodeId: "obs-001",
        nodeType: EvidenceGraphNodeType.OBSERVATION,
        missionId: TEST_MISSION_ID,
      });
      coord.createEvidenceNode({
        nodeId: "claim-001",
        nodeType: EvidenceGraphNodeType.CLAIM,
        missionId: TEST_MISSION_ID,
      });
      const result = coord.connectEvidence(
        "obs-001",
        "claim-001",
        EvidenceGraphRelationType.OBSERVED_AS
      );
      expect(result.valid).toBe(true);
    });

    it("19.4.4 — getEvidenceNode retrieves node", () => {
      coord.createEvidenceNode({
        nodeId: "ev-001",
        nodeType: EvidenceGraphNodeType.EVIDENCE,
        missionId: TEST_MISSION_ID,
      });
      const node = coord.getEvidenceNode("ev-001");
      expect(node).toBeDefined();
      expect(node!.nodeId).toBe("ev-001");
    });

    it("19.4.5 — Duplicate evidence node creation fails", () => {
      coord.createEvidenceNode({
        nodeId: "ev-001",
        nodeType: EvidenceGraphNodeType.EVIDENCE,
        missionId: TEST_MISSION_ID,
      });
      const result = coord.createEvidenceNode({
        nodeId: "ev-001",
        nodeType: EvidenceGraphNodeType.EVIDENCE,
        missionId: TEST_MISSION_ID,
      });
      expect(result.valid).toBe(false);
    });
  });

  // ─── 19.5 — Method Router Coordination ────────────────────────────────────

  describe("19.5 — Method Router Coordination", () => {
    let coord: MissionRuntimeCoordinator;
    let deps: ReturnType<typeof createDependencies>;

    beforeEach(() => {
      const created = createCoordinator();
      coord = created.coordinator;
      deps = created.deps;
    });

    it("19.5.1 — resolveMethod returns REQUEST_INVALID when no methods registered", () => {
      const decision = coord.resolveMethod("test-method");
      expect(decision.finalDecision).toBe("REQUEST_INVALID");
    });

    it("19.5.2 — resolveMethod emits ROUTER_DECISION event", () => {
      coord.resolveMethod("test-method");
      const events = coord.getMissionEvents();
      const routerDecision = events.find(
        (e) => e.eventType === RuntimeEventType.ROUTER_DECISION
      );
      expect(routerDecision).toBeDefined();
    });

    it("19.5.3 — resolveMethod with registered method and provider", () => {
      deps.router.registerMethod({
        methodId: "test-method",
        displayName: "Test Method",
        description: "A test method",
        requiredCapabilities: [],
      });
      deps.router.registerProvider({
        providerId: "test-provider",
        displayName: "Test Provider",
        version: "1.0.0",
        priority: 1,
        status: "AVAILABLE",
        supportedMethods: ["test-method"],
        capabilities: [],
        metadata: {},
      });
      const decision = coord.resolveMethod("test-method");
      expect(decision.finalDecision).toBe("SELECTED");
      expect(decision.selectedProvider).toBe("test-provider");
    });
  });

  // ─── 19.6 — Authority Management ──────────────────────────────────────────

  describe("19.6 — Authority Management", () => {
    let coord: MissionRuntimeCoordinator;

    beforeEach(() => {
      coord = createCoordinator().coordinator;
    });

    it("19.6.1 — requestAuthority sets PENDING status", () => {
      coord.requestAuthority(ActorRole.GUARDIAN, "Need approval for L3");
      expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.PENDING);
    });

    it("19.6.2 — requestAuthority emits STATE_CHANGED event", () => {
      coord.requestAuthority(ActorRole.GUARDIAN, "test");
      const events = coord.getMissionEvents();
      const requested = events.find(
        (e) =>
          e.eventType === RuntimeEventType.STATE_CHANGED &&
          e.metadata.phase === "authority-requested"
      );
      expect(requested).toBeDefined();
    });

    it("19.6.3 — grantAuthority sets GRANTED status", () => {
      coord.requestAuthority(ActorRole.GUARDIAN, "need approval");
      coord.grantAuthority("auth-001", ActorRole.GUARDIAN, "approved");
      expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.GRANTED);
    });

    it("19.6.4 — grantAuthority emits AUTHORITY_GRANTED event", () => {
      coord.requestAuthority(ActorRole.GUARDIAN, "need approval");
      coord.grantAuthority("auth-001", ActorRole.GUARDIAN, "approved");
      const events = coord.getMissionEvents();
      const granted = events.find(
        (e) => e.eventType === RuntimeEventType.AUTHORITY_GRANTED
      );
      expect(granted).toBeDefined();
      expect(granted!.payload.authorityId).toBe("auth-001");
    });

    it("19.6.5 — denyAuthority sets DENIED status", () => {
      coord.requestAuthority(ActorRole.GUARDIAN, "need approval");
      coord.denyAuthority("auth-002", ActorRole.GUARDIAN, "not approved");
      expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.DENIED);
    });

    it("19.6.6 — denyAuthority emits AUTHORITY_DENIED event", () => {
      coord.requestAuthority(ActorRole.GUARDIAN, "need approval");
      coord.denyAuthority("auth-002", ActorRole.GUARDIAN, "not approved");
      const events = coord.getMissionEvents();
      const denied = events.find(
        (e) => e.eventType === RuntimeEventType.AUTHORITY_DENIED
      );
      expect(denied).toBeDefined();
    });

    it("19.6.7 — resetAuthority sets NOT_REQUIRED", () => {
      coord.requestAuthority(ActorRole.GUARDIAN, "need");
      coord.denyAuthority("auth-003", ActorRole.GUARDIAN, "denied");
      coord.resetAuthority();
      expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.NOT_REQUIRED);
    });
  });

  // ─── 19.7 — Contradiction Handling ────────────────────────────────────────

  describe("19.7 — Contradiction Handling", () => {
    let coord: MissionRuntimeCoordinator;

    beforeEach(() => {
      coord = createCoordinator().coordinator;
    });

    it("19.7.1 — recordContradiction adds to contradictions list", () => {
      coord.recordContradiction("Data contradicts hypothesis");
      expect(coord.getContradictions()).toContain("Data contradicts hypothesis");
    });

    it("19.7.2 — recordContradiction emits CONTRADICTION_DETECTED event", () => {
      coord.recordContradiction("Test contradiction");
      const events = coord.getMissionEvents();
      const detected = events.find(
        (e) => e.eventType === RuntimeEventType.CONTRADICTION_DETECTED
      );
      expect(detected).toBeDefined();
      expect(detected!.payload.description).toBe("Test contradiction");
    });

    it("19.7.3 — recordContradiction from OBSERVE routes to OBSERVE", () => {
      const target = coord.recordContradiction("Test from OBSERVE");
      expect(target).toBe(CognitiveState.OBSERVE);
      expect(coord.getCurrentState()).toBe(CognitiveState.OBSERVE);
    });

    it("19.7.4 — recordContradiction from VALIDATE routes to VALIDATE", () => {
      coord.forceState(CognitiveState.VALIDATE, "test setup");
      const target = coord.recordContradiction("Test from VALIDATE");
      expect(target).toBe(CognitiveState.VALIDATE);
    });

    it("19.7.5 — recordContradiction from CONNECT routes to VALIDATE", () => {
      coord.forceState(CognitiveState.CONNECT, "test setup");
      const target = coord.recordContradiction("Test from CONNECT");
      expect(target).toBe(CognitiveState.VALIDATE);
    });

    it("19.7.6 — recordContradiction from CHALLENGE routes to VALIDATE", () => {
      coord.forceState(CognitiveState.CHALLENGE, "test setup");
      const target = coord.recordContradiction("Test from CHALLENGE");
      expect(target).toBe(CognitiveState.VALIDATE);
    });

    it("19.7.7 — recordContradiction from UNDERSTAND routes to OBSERVE", () => {
      coord.forceState(CognitiveState.UNDERSTAND, "test setup");
      const target = coord.recordContradiction("Test from UNDERSTAND");
      expect(target).toBe(CognitiveState.OBSERVE);
    });

    it("19.7.8 — Multiple contradictions accumulate", () => {
      coord.recordContradiction("First");
      coord.recordContradiction("Second");
      coord.recordContradiction("Third");
      expect(coord.getContradictions()).toHaveLength(3);
    });

    it("19.7.9 — recordContradiction resets authority to NOT_REQUIRED", () => {
      coord.requestAuthority(ActorRole.GUARDIAN, "need");
      expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.PENDING);
      coord.recordContradiction("Contradiction");
      expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.NOT_REQUIRED);
    });

    it("19.7.10 — routeContradiction returns correct target for each state", () => {
      expect(coord.routeContradiction()).toBe(CognitiveState.OBSERVE);
      coord.forceState(CognitiveState.VALIDATE, "test");
      expect(coord.routeContradiction()).toBe(CognitiveState.VALIDATE);
      coord.forceState(CognitiveState.CONNECT, "test");
      expect(coord.routeContradiction()).toBe(CognitiveState.VALIDATE);
      coord.forceState(CognitiveState.CHALLENGE, "test");
      expect(coord.routeContradiction()).toBe(CognitiveState.VALIDATE);
    });
  });

  // ─── 19.8 — Recovery Routing ──────────────────────────────────────────────

  describe("19.8 — Recovery Routing", () => {
    let coord: MissionRuntimeCoordinator;

    beforeEach(() => {
      coord = createCoordinator().coordinator;
    });

    it("19.8.1 — recoverFromFailure routes to OBSERVE", () => {
      const target = coord.recoverFromFailure("Test failure");
      expect(target).toBe(CognitiveState.OBSERVE);
      expect(coord.getCurrentState()).toBe(CognitiveState.OBSERVE);
    });

    it("19.8.2 — recoverFromFailure emits RECOVERY_STARTED event", () => {
      coord.recoverFromFailure("Test failure");
      const events = coord.getMissionEvents();
      const started = events.find(
        (e) => e.eventType === RuntimeEventType.RECOVERY_STARTED
      );
      expect(started).toBeDefined();
      expect(started!.payload.error).toBe("Test failure");
    });

    it("19.8.3 — recoverFromFailure emits RECOVERY_COMPLETED event", () => {
      coord.recoverFromFailure("Test failure");
      const events = coord.getMissionEvents();
      const completed = events.find(
        (e) => e.eventType === RuntimeEventType.RECOVERY_COMPLETED
      );
      expect(completed).toBeDefined();
      expect(completed!.payload.recoveryTarget).toBe(CognitiveState.OBSERVE);
    });

    it("19.8.4 — recoverFromFailure from any state routes to OBSERVE", () => {
      coord.forceState(OperationalState.FAILED, "test setup");
      const target = coord.recoverFromFailure("failure from FAILED");
      expect(target).toBe(CognitiveState.OBSERVE);
    });

    it("19.8.5 — recoverFromFailure records previous state", () => {
      coord.forceState(CognitiveState.EVOLVE, "test setup");
      coord.recoverFromFailure("failure");
      expect(coord.getPreviousState()).toBe(CognitiveState.EVOLVE);
    });
  });

  // ─── 19.9 — Replay Coordination ───────────────────────────────────────────

  describe("19.9 — Replay Coordination", () => {
    let coord: MissionRuntimeCoordinator;
    let deps: ReturnType<typeof createDependencies>;

    beforeEach(() => {
      const created = createCoordinator();
      coord = created.coordinator;
      deps = created.deps;
    });

    it("19.9.1 — replay returns ReplayResult for mission", () => {
      coord.initializeMission();
      const result = coord.replay();
      expect(result).toBeDefined();
      expect(result.aggregateId).toBe(TEST_MISSION_ID);
      expect(result.validation).toBeDefined();
    });

    it("19.9.2 — replay captures events from coordinator", () => {
      coord.initializeMission();
      coord.recordContradiction("test");
      const result = coord.replay();
      expect(result.events.length).toBeGreaterThanOrEqual(2);
    });

    it("19.9.3 — createSnapshot creates snapshot of current state", () => {
      coord.forceState(CognitiveState.VALIDATE, "test");
      const snapshot = coord.createSnapshot({ test: true });
      expect(snapshot).toBeDefined();
      expect(snapshot.aggregateId).toBe(TEST_MISSION_ID);
    });

    it("19.9.4 — getMissionEvents returns all coordinator events", () => {
      coord.initializeMission();
      coord.recordContradiction("test");
      const events = coord.getMissionEvents();
      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    it("19.9.5 — getPersistence returns the persistence instance", () => {
      expect(coord.getPersistence()).toBe(deps.persistence);
    });
  });

  // ─── 19.10 — Event Emission Integrity ─────────────────────────────────────

  describe("19.10 — Event Emission Integrity", () => {
    let coord: MissionRuntimeCoordinator;

    beforeEach(() => {
      coord = createCoordinator().coordinator;
    });

    it("19.10.1 — All events have correct missionId", () => {
      coord.initializeMission();
      coord.recordContradiction("test");
      coord.recoverFromFailure("error");
      const events = coord.getMissionEvents();
      for (const event of events) {
        expect(event.missionId).toBe(TEST_MISSION_ID);
      }
    });

    it("19.10.2 — All events have incrementing sequence", () => {
      coord.initializeMission();
      coord.recordContradiction("test");
      const events = coord.getMissionEvents();
      for (let i = 1; i < events.length; i++) {
        expect(events[i]!.sequence).toBeGreaterThan(events[i - 1]!.sequence);
      }
    });

    it("19.10.3 — All events have valid aggregateType", () => {
      coord.initializeMission();
      coord.recordContradiction("test");
      const events = coord.getMissionEvents();
      for (const event of events) {
        expect(Object.values(AggregateType)).toContain(event.aggregateType);
      }
    });

    it("19.10.4 — All events have valid eventType", () => {
      coord.initializeMission();
      coord.recordContradiction("test");
      const events = coord.getMissionEvents();
      for (const event of events) {
        expect(Object.values(RuntimeEventType)).toContain(event.eventType);
      }
    });

    it("19.10.5 — All events have valid actor", () => {
      coord.initializeMission();
      const events = coord.getMissionEvents();
      for (const event of events) {
        expect(event.actor.id).toBe("mission-runtime-coordinator");
        expect(event.actor.role).toBe(ActorRole.EXECUTOR);
      }
    });

    it("19.10.6 — All events have valid authority reference", () => {
      coord.initializeMission();
      const events = coord.getMissionEvents();
      for (const event of events) {
        expect(event.authority.authorityId).toBeDefined();
        expect(event.authority.status).toBeDefined();
      }
    });

    it("19.10.7 — All events have valid schemaVersion", () => {
      coord.initializeMission();
      const events = coord.getMissionEvents();
      for (const event of events) {
        expect(event.schemaVersion).toBe("rt-007-v1.0");
      }
    });

    it("19.10.8 — MISSION_CREATED event has correct aggregateType", () => {
      coord.initializeMission();
      const events = coord.getMissionEvents();
      const created = events.find(
        (e) => e.eventType === RuntimeEventType.MISSION_CREATED
      );
      expect(created!.aggregateType).toBe(AggregateType.MISSION);
    });

    it("19.10.9 — CONTRADICTION_DETECTED event has correct aggregateType", () => {
      coord.recordContradiction("test");
      const events = coord.getMissionEvents();
      const detected = events.find(
        (e) => e.eventType === RuntimeEventType.CONTRADICTION_DETECTED
      );
      expect(detected!.aggregateType).toBe(AggregateType.CONTRADICTION);
    });

    it("19.10.10 — AUTHORITY_GRANTED event has correct aggregateType", () => {
      coord.requestAuthority(ActorRole.GUARDIAN, "need");
      coord.grantAuthority("auth-001", ActorRole.GUARDIAN, "ok");
      const events = coord.getMissionEvents();
      const granted = events.find(
        (e) => e.eventType === RuntimeEventType.AUTHORITY_GRANTED
      );
      expect(granted!.aggregateType).toBe(AggregateType.AUTHORITY);
    });
  });

  // ─── 19.11 — No Business Logic (Design Verification) ─────────────────────

  describe("19.11 — No Business Logic (Design Verification)", () => {
    it("19.11.1 — Coordinator source contains no OCR references", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "src/runtime/mission-runtime-coordinator.ts",
        "utf-8"
      );
      expect(content.toLowerCase()).not.toContain("ocr");
    });

    it("19.11.2 — Coordinator source contains no LLM references", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "src/runtime/mission-runtime-coordinator.ts",
        "utf-8"
      );
      expect(content.toLowerCase()).not.toContain("llm");
      expect(content.toLowerCase()).not.toContain("openai");
      expect(content.toLowerCase()).not.toContain("claude");
      expect(content.toLowerCase()).not.toContain("gemini");
    });

    it("19.11.3 — Coordinator source contains no prompt references", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "src/runtime/mission-runtime-coordinator.ts",
        "utf-8"
      );
      expect(content.toLowerCase()).not.toContain("prompt");
    });

    it("19.11.4 — Coordinator source contains no business logic implementations", async () => {
      const fs = await import("fs");
      const content = fs.readFileSync(
        "src/runtime/mission-runtime-coordinator.ts",
        "utf-8"
      );
      // Check for actual business logic keywords (not in comments)
      const lines = content.split("\n");
      const codeLines = lines.filter(
        (l) => !l.trim().startsWith("//") && !l.trim().startsWith("*") && !l.trim().startsWith("/*")
      );
      const codeContent = codeLines.join("\n").toLowerCase();
      expect(codeContent).not.toContain("business logic");
      expect(codeContent).not.toContain("domain logic");
    });
  });

  // ─── 19.12 — Integration: Full Mission Lifecycle ──────────────────────────

  describe("19.12 — Integration: Full Mission Lifecycle", () => {
    it("19.12.1 — Complete mission: init → OBSERVE → UNDERSTAND → QUESTION → VALIDATE → CONNECT → CHALLENGE → DISCOVER → EVOLVE → terminate", () => {
      const coord = createCoordinator().coordinator;

      // Initialize
      coord.initializeMission();
      expect(coord.getCurrentState()).toBe(CognitiveState.OBSERVE);

      // Register OBSERVATION artifact
      coord.registerArtifact(TEST_ARTIFACT);
      expect(coord.hasArtifact("ART-RT007-001")).toBe(true);

      // Create evidence node
      coord.createEvidenceNode({
        nodeId: "obs-evidence-001",
        nodeType: EvidenceGraphNodeType.OBSERVATION,
        missionId: TEST_MISSION_ID,
      });

      // Transition through cognitive cycle
      coord.requestTransition(CognitiveState.UNDERSTAND, ["OBSERVATION"], [], []);
      expect(coord.getCurrentState()).toBe(CognitiveState.UNDERSTAND);

      coord.requestTransition(CognitiveState.QUESTION, ["PROBLEM_REPRESENTATION"], [], []);
      expect(coord.getCurrentState()).toBe(CognitiveState.QUESTION);

      coord.requestTransition(CognitiveState.VALIDATE, ["QUESTION"], [], []);
      expect(coord.getCurrentState()).toBe(CognitiveState.VALIDATE);

      coord.requestTransition(CognitiveState.CONNECT, ["VALIDATION"], ["ev-001"], []);
      expect(coord.getCurrentState()).toBe(CognitiveState.CONNECT);

      coord.requestTransition(CognitiveState.CHALLENGE, ["RELATIONSHIP"], [], []);
      expect(coord.getCurrentState()).toBe(CognitiveState.CHALLENGE);

      coord.requestTransition(CognitiveState.DISCOVER, ["CHALLENGE"], ["ev-002"], []);
      expect(coord.getCurrentState()).toBe(CognitiveState.DISCOVER);

      coord.requestTransition(CognitiveState.EVOLVE, ["DISCOVERY", "HYPOTHESIS"], ["ev-003"], []);
      expect(coord.getCurrentState()).toBe(CognitiveState.EVOLVE);

      // Terminate
      coord.terminateMission("Mission complete");
      expect(coord.isTerminated()).toBe(true);

      // Verify full state history
      expect(coord.getStateHistory()).toEqual([
        CognitiveState.OBSERVE,
        CognitiveState.UNDERSTAND,
        CognitiveState.QUESTION,
        CognitiveState.VALIDATE,
        CognitiveState.CONNECT,
        CognitiveState.CHALLENGE,
        CognitiveState.DISCOVER,
        CognitiveState.EVOLVE,
      ]);

      // Verify events
      const events = coord.getMissionEvents();
      expect(events.length).toBeGreaterThanOrEqual(10);
    });

    it("19.12.2 — Mission with contradiction and recovery", () => {
      const coord = createCoordinator().coordinator;

      coord.initializeMission();
      coord.forceState(CognitiveState.VALIDATE, "test setup");

      // Record contradiction from VALIDATE → routes to VALIDATE
      const route = coord.recordContradiction("Evidence contradicts claim");
      expect(route).toBe(CognitiveState.VALIDATE);
      expect(coord.getContradictions()).toHaveLength(1);

      // Recover from failure
      const recovery = coord.recoverFromFailure("Method failed");
      expect(recovery).toBe(CognitiveState.OBSERVE);
      expect(coord.getCurrentState()).toBe(CognitiveState.OBSERVE);
    });

    it("19.12.3 — Mission with authority flow", () => {
      const coord = createCoordinator().coordinator;

      coord.initializeMission();
      coord.forceState(CognitiveState.CONNECT, "test setup");

      // Request authority
      coord.requestAuthority(ActorRole.GUARDIAN, "L3 requires authority");
      expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.PENDING);

      // Grant authority
      coord.grantAuthority("auth-l3-001", ActorRole.GUARDIAN, "Approved");
      expect(coord.getAuthorityStatus()).toBe(AuthorityStatus.GRANTED);

      // Continue with transition
      coord.requestTransition(
        CognitiveState.CHALLENGE,
        ["RELATIONSHIP"],
        [],
        [],
        AuthorityStatus.GRANTED
      );
      expect(coord.getCurrentState()).toBe(CognitiveState.CHALLENGE);
    });

    it("19.12.4 — Replay captures full mission history", () => {
      const coord = createCoordinator().coordinator;

      coord.initializeMission();
      coord.recordContradiction("test contradiction");
      coord.recoverFromFailure("test failure");
      coord.initializeMission(); // second init event

      const replay = coord.replay();
      expect(replay.events.length).toBeGreaterThanOrEqual(4);
      expect(replay.validation.valid).toBe(true);
    });
  });
});
