/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Inspector Demo Data
// Mission: RTHINK-RT-008C (Inspector Frontend)
//
// Deterministic demo data for development mode.
// Uses real Runtime classes to create a minimal valid state.
// Clearly labeled as DEMO — never presented as live data.

import { EventStore } from "../runtime/event-store.js";
import { Persistence } from "../runtime/persistence.js";
import { ReplayEngine } from "../runtime/replay.js";
import { ArtifactRegistry } from "../runtime/artifact-registry.js";
import { EvidenceGraph } from "../runtime/evidence-graph.js";
import { Router } from "../runtime/router.js";
import { MissionRuntimeCoordinator } from "../runtime/mission-runtime-coordinator.js";
import type {
  InspectorCompositionInput,
} from "./composition-root.js";
import type {
  RuntimeHealth,
  RuntimeStatistics,
  MissionSummary,
  MissionDetail,
  EventSummary,
  ArtifactSummary,
  EvidenceGraphSnapshot,
  MethodSummary,
  ProviderSummary,
  AuthorityDetail,
  ContradictionsDetail,
  ReplaySnapshot,
  SnapshotSummary,
} from "./dtos.js";

// ─── Demo Mission Contract ──────────────────────────────────────────────────

const DEMO_MISSION_CONTRACT = {
  missionId: "DEMO-MISSION-001",
  objective: "Demonstrate R-Think Inspector frontend capabilities",
  riskNoveltyLevel: "L1_CONTROLLED" as const,
  acceptanceCriteria: [
    "All Inspector views render correctly",
    "Evidence graph displays nodes and edges",
    "Events timeline shows chronological history",
  ],
  scope: "Inspector frontend development and validation",
  consumerBlueprintRefs: [],
};

const DEMO_MISSION_ID = "DEMO-MISSION-001";

// ─── Runtime Instances ──────────────────────────────────────────────────────

function createDemoRuntime(): InspectorCompositionInput {
  const persistence = new Persistence();
  const eventStore = persistence.getEventStore();
  const replayEngine = new ReplayEngine(
    eventStore,
    persistence.getSnapshotStore()
  );
  const artifactRegistry = new ArtifactRegistry();
  const evidenceGraph = new EvidenceGraph();
  const router = new Router();
  const coordinators = new Map<string, MissionRuntimeCoordinator>();

  // Create coordinator
  const coordinator = new MissionRuntimeCoordinator(
    {
      missionId: DEMO_MISSION_ID,
      contract: DEMO_MISSION_CONTRACT,
      riskLevel: DEMO_MISSION_CONTRACT.riskNoveltyLevel,
    },
    { artifactRegistry, evidenceGraph, router, persistence, replayEngine }
  );
  coordinators.set(DEMO_MISSION_ID, coordinator);

  // Initialize mission
  coordinator.initializeMission();

  // Register artifacts
  const observationId = coordinator.registerArtifact({
    artifactId: `ART-OBS-001`,
    artifactType: "OBSERVATION",
    missionId: DEMO_MISSION_ID,
    version: 1,
    confidence: 0.92,
    createdAt: new Date().toISOString(),
    actor: { id: "ENGINEER-01", role: "ENGINEER" },
    state: "OBSERVE",
    sourceRefs: [
      { type: "USER_INPUT" as const, uri: "demo://observation", label: "Demo observation" },
    ],
    payload: { content: "Initial observation of system state", category: "discovery" },
    evidenceRefs: [],
  });

  const claimId = coordinator.registerArtifact({
    artifactId: `ART-CLAIM-001`,
    artifactType: "CLAIM",
    missionId: DEMO_MISSION_ID,
    version: 1,
    confidence: 0.85,
    createdAt: new Date().toISOString(),
    actor: { id: "ENGINEER-01", role: "ENGINEER" },
    state: "UNDERSTAND",
    sourceRefs: [
      { type: "ARTIFACT_REFERENCE" as const, uri: `artifact://ART-OBS-001`, label: "Based on observation" },
    ],
    payload: { hypothesis: "System can observe and understand mission state", strength: "strong" },
    evidenceRefs: [],
  });

  const hypothesisId = coordinator.registerArtifact({
    artifactId: `ART-HYP-001`,
    artifactType: "HYPOTHESIS",
    missionId: DEMO_MISSION_ID,
    version: 1,
    confidence: 0.78,
    createdAt: new Date().toISOString(),
    actor: { id: "ENGINEER-01", role: "ENGINEER" },
    state: "QUESTION",
    sourceRefs: [
      { type: "ARTIFACT_REFERENCE" as const, uri: `artifact://ART-CLAIM-001`, label: "Based on claim" },
    ],
    payload: { prediction: "Inspector will render all views correctly", testable: true },
    evidenceRefs: [],
  });

  // Connect evidence graph nodes
  evidenceGraph.createNode({
    nodeId: "EVD-NODE-001",
    nodeType: "OBSERVATION",
    missionId: DEMO_MISSION_ID,
    timestamp: new Date().toISOString(),
    data: { content: "System state observation" },
    version: 1,
  });

  evidenceGraph.createNode({
    nodeId: "EVD-NODE-002",
    nodeType: "CLAIM",
    missionId: DEMO_MISSION_ID,
    timestamp: new Date().toISOString(),
    data: { statement: "Inspector can observe mission state" },
    version: 1,
  });

  evidenceGraph.createNode({
    nodeId: "EVD-NODE-003",
    nodeType: "HYPOTHESIS",
    missionId: DEMO_MISSION_ID,
    timestamp: new Date().toISOString(),
    data: { prediction: "All Inspector views will render" },
    version: 1,
  });

  evidenceGraph.createNode({
    nodeId: "EVD-NODE-004",
    nodeType: "EVIDENCE",
    missionId: DEMO_MISSION_ID,
    timestamp: new Date().toISOString(),
    data: { source: "demo", content: "Test execution results" },
    version: 1,
  });

  evidenceGraph.createNode({
    nodeId: "EVD-NODE-005",
    nodeType: "DECISION",
    missionId: DEMO_MISSION_ID,
    timestamp: new Date().toISOString(),
    data: { decision: "Proceed with Inspector implementation" },
    version: 1,
  });

  evidenceGraph.connect("EVD-NODE-001", "EVD-NODE-002", "OBSERVED_AS");
  evidenceGraph.connect("EVD-NODE-002", "EVD-NODE-003", "GENERATES");
  evidenceGraph.connect("EVD-NODE-003", "EVD-NODE-004", "TESTED_BY");
  evidenceGraph.connect("EVD-NODE-004", "EVD-NODE-005", "SUPPORTS");

  // Register methods
  router.registerMethod({
    methodId: "demo-method-01",
    displayName: "Demo Analysis",
    description: "A demo method for testing Inspector views",
    requiredCapabilities: [
      { capabilityId: "analysis", minVersion: "1.0.0" },
    ],
  });

  return {
    eventStore,
    persistence,
    replayEngine,
    artifactRegistry,
    evidenceGraph,
    router,
    coordinators,
  };
}

// ─── Demo Runtime Data ──────────────────────────────────────────────────────

let _demoRuntime: InspectorCompositionInput | null = null;

export function getDemoRuntime(): InspectorCompositionInput {
  if (!_demoRuntime) {
    _demoRuntime = createDemoRuntime();
  }
  return _demoRuntime;
}

// ─── Demo Summary Data ──────────────────────────────────────────────────────

export const DEMO_MISSIONS: MissionSummary[] = [
  {
    missionId: DEMO_MISSION_ID,
    currentState: "OBSERVE",
    riskLevel: "L1_CONTROLLED",
    authorityStatus: "NOT_REQUIRED",
    contradictionCount: 0,
    isTerminated: false,
    eventCount: 5,
    artifactCount: 3,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    missionId: "DEMO-MISSION-002",
    currentState: "VALIDATE",
    previousState: "QUESTION",
    riskLevel: "L2_SIGNIFICANT",
    authorityStatus: "PENDING",
    contradictionCount: 1,
    isTerminated: false,
    eventCount: 12,
    artifactCount: 7,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    missionId: "DEMO-MISSION-003",
    currentState: "COMPLETED",
    riskLevel: "L0_ROUTINE",
    authorityStatus: "GRANTED",
    contradictionCount: 0,
    isTerminated: true,
    eventCount: 20,
    artifactCount: 10,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const DEMO_EVENTS: EventSummary[] = [
  {
    eventId: "EVT-001",
    missionId: DEMO_MISSION_ID,
    aggregateId: DEMO_MISSION_ID,
    aggregateType: "MISSION",
    eventType: "MISSION_CREATED",
    sequence: 1,
    globalPosition: 1,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    actor: { id: "SYSTEM", role: "ENGINEER" },
  },
  {
    eventId: "EVT-002",
    missionId: DEMO_MISSION_ID,
    aggregateId: DEMO_MISSION_ID,
    aggregateType: "STATE",
    eventType: "STATE_CHANGED",
    sequence: 2,
    globalPosition: 2,
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    actor: { id: "SYSTEM", role: "ENGINEER" },
  },
  {
    eventId: "EVT-003",
    missionId: DEMO_MISSION_ID,
    aggregateId: "ART-OBS-001",
    aggregateType: "ARTIFACT",
    eventType: "ARTIFACT_REGISTERED",
    sequence: 1,
    globalPosition: 3,
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    actor: { id: "ENGINEER-01", role: "ENGINEER" },
  },
  {
    eventId: "EVT-004",
    missionId: DEMO_MISSION_ID,
    aggregateId: "ART-CLAIM-001",
    aggregateType: "ARTIFACT",
    eventType: "ARTIFACT_REGISTERED",
    sequence: 2,
    globalPosition: 4,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    actor: { id: "ENGINEER-01", role: "ENGINEER" },
  },
  {
    eventId: "EVT-005",
    missionId: DEMO_MISSION_ID,
    aggregateId: DEMO_MISSION_ID,
    aggregateType: "EVIDENCE",
    eventType: "EVIDENCE_CREATED",
    sequence: 3,
    globalPosition: 5,
    timestamp: new Date(Date.now() - 600000).toISOString(),
    actor: { id: "ENGINEER-01", role: "ENGINEER" },
  },
];

export const DEMO_ARTIFACTS: ArtifactSummary[] = [
  {
    artifactId: "ART-OBS-001",
    artifactType: "OBSERVATION",
    version: 1,
    missionId: DEMO_MISSION_ID,
    confidence: 0.92,
    createdAt: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    artifactId: "ART-CLAIM-001",
    artifactType: "CLAIM",
    version: 1,
    missionId: DEMO_MISSION_ID,
    confidence: 0.85,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    artifactId: "ART-HYP-001",
    artifactType: "HYPOTHESIS",
    version: 1,
    missionId: DEMO_MISSION_ID,
    confidence: 0.78,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
  },
];

export const DEMO_METHODS: MethodSummary[] = [
  {
    methodId: "method-ocr-analysis",
    displayName: "OCR Document Analysis",
    description: "Analyze documents using optical character recognition",
    requiredCapabilities: [
      { capabilityId: "ocr", minVersion: "2.0.0" },
      { capabilityId: "document-analysis" },
    ],
  },
  {
    methodId: "method-code-review",
    displayName: "Code Review",
    description: "Review source code for quality and correctness",
    requiredCapabilities: [
      { capabilityId: "code-analysis", minVersion: "1.0.0" },
    ],
  },
];

export const DEMO_PROVIDERS: ProviderSummary[] = [
  {
    providerId: "provider-local-llm",
    displayName: "Local LLM (Ollama)",
    version: "1.0.0",
    priority: 1,
    status: "AVAILABLE",
    supportedMethods: ["method-ocr-analysis", "method-code-review"],
    enabled: true,
  },
  {
    providerId: "provider-opencode",
    displayName: "OpenCode Executor",
    version: "0.5.0",
    priority: 2,
    status: "AVAILABLE",
    supportedMethods: ["method-code-review"],
    enabled: true,
  },
];

export const DEMO_HEALTH = {
  totalEvents: 5,
  totalArtifacts: 3,
  evidenceNodeCount: 5,
  evidenceEdgeCount: 4,
  graphIntegrity: { valid: true, errors: [] as string[] },
  snapshotCount: 0,
  materializedViewCount: 0,
  exportedAt: new Date().toISOString(),
};

export const DEMO_STATISTICS = {
  eventsByType: {
    MISSION_CREATED: 1,
    STATE_CHANGED: 1,
    ARTIFACT_REGISTERED: 2,
    EVIDENCE_CREATED: 1,
  } as Record<string, number>,
  eventsByActor: {
    SYSTEM: 2,
    "ENGINEER-01": 3,
  } as Record<string, number>,
  artifactsByType: {
    OBSERVATION: 1,
    CLAIM: 1,
    HYPOTHESIS: 1,
  } as Record<string, number>,
  transitionCount: 1,
  contradictionCount: 0,
  authorityGrantCount: 0,
  authorityDenyCount: 0,
  failureCount: 0,
  recoveryCount: 0,
  discoveryCount: 1,
  evolutionCount: 0,
  exportedAt: new Date().toISOString(),
};
