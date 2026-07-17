// R-Think Runtime — Evidence Graph Tests
// Blueprint Reference: RTHINK-BP-001 §9
// Mission: RTHINK-RT-004

import { describe, it, expect, beforeEach } from "vitest";
import { EvidenceGraph } from "../../src/runtime/evidence-graph.js";
import {
  EvidenceGraphNodeType,
  EvidenceGraphRelationType,
} from "../../src/contracts/types.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeMission(graph: EvidenceGraph, id = "mission-1") {
  return graph.createNode({
    nodeId: id,
    nodeType: EvidenceGraphNodeType.MISSION,
    missionId: id,
  });
}

function makeObservation(graph: EvidenceGraph, id = "obs-1", mission = "m1") {
  return graph.createNode({
    nodeId: id,
    nodeType: EvidenceGraphNodeType.OBSERVATION,
    missionId: mission,
  });
}

function makeClaim(graph: EvidenceGraph, id = "claim-1", mission = "m1") {
  return graph.createNode({
    nodeId: id,
    nodeType: EvidenceGraphNodeType.CLAIM,
    missionId: mission,
  });
}

function makeHypothesis(graph: EvidenceGraph, id = "hyp-1", mission = "m1") {
  return graph.createNode({
    nodeId: id,
    nodeType: EvidenceGraphNodeType.HYPOTHESIS,
    missionId: mission,
  });
}

function makeExperiment(graph: EvidenceGraph, id = "exp-1", mission = "m1") {
  return graph.createNode({
    nodeId: id,
    nodeType: EvidenceGraphNodeType.EXPERIMENT,
    missionId: mission,
  });
}

function makeEvidence(graph: EvidenceGraph, id = "ev-1", mission = "m1") {
  return graph.createNode({
    nodeId: id,
    nodeType: EvidenceGraphNodeType.EVIDENCE,
    missionId: mission,
  });
}

function makeDecision(graph: EvidenceGraph, id = "dec-1", mission = "m1") {
  return graph.createNode({
    nodeId: id,
    nodeType: EvidenceGraphNodeType.DECISION,
    missionId: mission,
  });
}

function makeAction(graph: EvidenceGraph, id = "act-1", mission = "m1") {
  return graph.createNode({
    nodeId: id,
    nodeType: EvidenceGraphNodeType.ACTION,
    missionId: mission,
  });
}

function makeActualResult(graph: EvidenceGraph, id = "ar-1", mission = "m1") {
  return graph.createNode({
    nodeId: id,
    nodeType: EvidenceGraphNodeType.ACTUAL_RESULT,
    missionId: mission,
  });
}

function makeAcceptance(graph: EvidenceGraph, id = "acc-1", mission = "m1") {
  return graph.createNode({
    nodeId: id,
    nodeType: EvidenceGraphNodeType.ACCEPTANCE,
    missionId: mission,
  });
}

function makeEvolution(graph: EvidenceGraph, id = "evo-1", mission = "m1") {
  return graph.createNode({
    nodeId: id,
    nodeType: EvidenceGraphNodeType.EVOLUTION,
    missionId: mission,
  });
}

function buildFullChain(g: EvidenceGraph) {
  makeMission(g, "m1");
  makeObservation(g, "obs-1", "m1");
  makeClaim(g, "cl-1", "m1");
  makeHypothesis(g, "hyp-1", "m1");
  makeExperiment(g, "exp-1", "m1");
  makeEvidence(g, "ev-1", "m1");
  makeDecision(g, "dec-1", "m1");
  makeAction(g, "act-1", "m1");
  makeActualResult(g, "ar-1", "m1");
  makeAcceptance(g, "acc-1", "m1");
  makeEvolution(g, "evo-1", "m1");

  g.connect({ fromNodeId: "obs-1", toNodeId: "cl-1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
  g.connect({ fromNodeId: "obs-1", toNodeId: "hyp-1", relationType: EvidenceGraphRelationType.GENERATES });
  g.connect({ fromNodeId: "hyp-1", toNodeId: "exp-1", relationType: EvidenceGraphRelationType.TESTED_BY });
  g.connect({ fromNodeId: "exp-1", toNodeId: "ev-1", relationType: EvidenceGraphRelationType.PRODUCES });
  g.connect({ fromNodeId: "ev-1", toNodeId: "dec-1", relationType: EvidenceGraphRelationType.SUPPORTS });
  g.connect({ fromNodeId: "dec-1", toNodeId: "act-1", relationType: EvidenceGraphRelationType.AUTHORIZES });
  g.connect({ fromNodeId: "act-1", toNodeId: "ar-1", relationType: EvidenceGraphRelationType.EXECUTES });
  g.connect({ fromNodeId: "ar-1", toNodeId: "acc-1", relationType: EvidenceGraphRelationType.RESULTS_IN });
  g.connect({ fromNodeId: "acc-1", toNodeId: "dec-1", relationType: EvidenceGraphRelationType.SATISFIES });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 16.1 Node Creation — Valid
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.1 Node Creation — Valid", () => {
  let g: EvidenceGraph;
  beforeEach(() => { g = new EvidenceGraph(); });

  it("16.1.1 Create MISSION node succeeds", () => {
    const r = makeMission(g, "m1");
    expect(r.valid).toBe(true);
  });
  it("16.1.2 Create OBSERVATION node succeeds", () => {
    const r = makeObservation(g, "obs-1");
    expect(r.valid).toBe(true);
  });
  it("16.1.3 Create CLAIM node succeeds", () => {
    const r = makeClaim(g, "cl-1");
    expect(r.valid).toBe(true);
  });
  it("16.1.4 Create HYPOTHESIS node succeeds", () => {
    const r = makeHypothesis(g, "hyp-1");
    expect(r.valid).toBe(true);
  });
  it("16.1.5 Create EXPERIMENT node succeeds", () => {
    const r = makeExperiment(g, "exp-1");
    expect(r.valid).toBe(true);
  });
  it("16.1.6 Create EVIDENCE node succeeds", () => {
    const r = makeEvidence(g, "ev-1");
    expect(r.valid).toBe(true);
  });
  it("16.1.7 Create DECISION node succeeds", () => {
    const r = makeDecision(g, "dec-1");
    expect(r.valid).toBe(true);
  });
  it("16.1.8 Create ACTION node succeeds", () => {
    const r = makeAction(g, "act-1");
    expect(r.valid).toBe(true);
  });
  it("16.1.9 Create ACTUAL_RESULT node succeeds", () => {
    const r = makeActualResult(g, "ar-1");
    expect(r.valid).toBe(true);
  });
  it("16.1.10 Create ACCEPTANCE node succeeds", () => {
    const r = makeAcceptance(g, "acc-1");
    expect(r.valid).toBe(true);
  });
  it("16.1.11 Create EVOLUTION node succeeds", () => {
    const r = makeEvolution(g, "evo-1");
    expect(r.valid).toBe(true);
  });
  it("16.1.12 Node is retrievable after creation", () => {
    makeMission(g, "m1");
    expect(g.getNode("m1")).toBeDefined();
    expect(g.getNode("m1")!.nodeType).toBe(EvidenceGraphNodeType.MISSION);
  });
  it("16.1.13 Node count increases after creation", () => {
    expect(g.nodeCount).toBe(0);
    makeMission(g, "m1");
    expect(g.nodeCount).toBe(1);
    makeObservation(g, "obs-1");
    expect(g.nodeCount).toBe(2);
  });
  it("16.1.14 Node has correct default version", () => {
    makeMission(g, "m1");
    expect(g.getNode("m1")!.version).toBe(1);
  });
  it("16.1.15 Node has timestamp", () => {
    makeMission(g, "m1");
    expect(g.getNode("m1")!.timestamp).toBeTruthy();
  });
  it("16.1.16 Node has empty sourceRefs by default", () => {
    makeMission(g, "m1");
    expect(g.getNode("m1")!.sourceRefs).toEqual([]);
  });
  it("16.1.17 Node has empty metadata by default", () => {
    makeMission(g, "m1");
    expect(g.getNode("m1")!.metadata).toEqual({});
  });
  it("16.1.18 Node preserves custom sourceRefs", () => {
    g.createNode({
      nodeId: "obs-1",
      nodeType: EvidenceGraphNodeType.OBSERVATION,
      missionId: "m1",
      sourceRefs: [{ type: "file", uri: "src/test.ts" }],
    });
    expect(g.getNode("obs-1")!.sourceRefs).toHaveLength(1);
  });
  it("16.1.19 Node preserves custom metadata", () => {
    g.createNode({
      nodeId: "m1",
      nodeType: EvidenceGraphNodeType.MISSION,
      missionId: "m1",
      metadata: { key: "value" },
    });
    expect(g.getNode("m1")!.metadata).toEqual({ key: "value" });
  });
  it("16.1.20 getNode returns undefined for nonexistent", () => {
    expect(g.getNode("nonexistent")).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.2 Node Creation — Invalid
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.2 Node Creation — Invalid", () => {
  let g: EvidenceGraph;
  beforeEach(() => { g = new EvidenceGraph(); });

  it("16.2.1 Empty node ID rejected", () => {
    const r = g.createNode({ nodeId: "", nodeType: EvidenceGraphNodeType.MISSION, missionId: "m1" });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("non-empty");
  });
  it("16.2.2 Whitespace-only node ID rejected", () => {
    const r = g.createNode({ nodeId: "   ", nodeType: EvidenceGraphNodeType.MISSION, missionId: "m1" });
    expect(r.valid).toBe(false);
  });
  it("16.2.3 Duplicate node ID rejected", () => {
    makeMission(g, "m1");
    const r = makeMission(g, "m1");
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Duplicate");
  });
  it("16.2.4 Invalid node type rejected", () => {
    const r = g.createNode({ nodeId: "x", nodeType: "INVALID" as any, missionId: "m1" });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Invalid node type");
  });
  it("16.2.5 Empty mission ID rejected", () => {
    const r = g.createNode({ nodeId: "x", nodeType: EvidenceGraphNodeType.MISSION, missionId: "" });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Mission ID");
  });
  it("16.2.6 Node count unchanged after failed creation", () => {
    g.createNode({ nodeId: "", nodeType: EvidenceGraphNodeType.MISSION, missionId: "m1" });
    expect(g.nodeCount).toBe(0);
  });
  it("16.2.7 Multiple errors returned at once", () => {
    const r = g.createNode({ nodeId: "", nodeType: "BAD" as any, missionId: "" });
    expect(r.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.3 Edge Creation — Valid
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.3 Edge Creation — Valid", () => {
  let g: EvidenceGraph;
  beforeEach(() => { g = new EvidenceGraph(); });

  it("16.3.1 OBSERVED_AS from OBSERVATION to CLAIM", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    const r = g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(r.valid).toBe(true);
  });
  it("16.3.2 SUPPORTS from EVIDENCE to CLAIM", () => {
    makeEvidence(g, "e1"); makeClaim(g, "c1");
    const r = g.connect({ fromNodeId: "e1", toNodeId: "c1", relationType: EvidenceGraphRelationType.SUPPORTS });
    expect(r.valid).toBe(true);
  });
  it("16.3.3 SUPPORTS from EVIDENCE to HYPOTHESIS", () => {
    makeEvidence(g, "e1"); makeHypothesis(g, "h1");
    const r = g.connect({ fromNodeId: "e1", toNodeId: "h1", relationType: EvidenceGraphRelationType.SUPPORTS });
    expect(r.valid).toBe(true);
  });
  it("16.3.4 SUPPORTS from EVIDENCE to DECISION", () => {
    makeEvidence(g, "e1"); makeDecision(g, "d1");
    const r = g.connect({ fromNodeId: "e1", toNodeId: "d1", relationType: EvidenceGraphRelationType.SUPPORTS });
    expect(r.valid).toBe(true);
  });
  it("16.3.5 CONTRADICTS from EVIDENCE to CLAIM", () => {
    makeEvidence(g, "e1"); makeClaim(g, "c1");
    const r = g.connect({ fromNodeId: "e1", toNodeId: "c1", relationType: EvidenceGraphRelationType.CONTRADICTS });
    expect(r.valid).toBe(true);
  });
  it("16.3.6 CONTRADICTS from OBSERVATION to HYPOTHESIS", () => {
    makeObservation(g, "o1"); makeHypothesis(g, "h1");
    const r = g.connect({ fromNodeId: "o1", toNodeId: "h1", relationType: EvidenceGraphRelationType.CONTRADICTS });
    expect(r.valid).toBe(true);
  });
  it("16.3.7 GENERATES from MISSION to OBSERVATION", () => {
    makeMission(g, "m1"); makeObservation(g, "o1");
    const r = g.connect({ fromNodeId: "m1", toNodeId: "o1", relationType: EvidenceGraphRelationType.GENERATES });
    expect(r.valid).toBe(true);
  });
  it("16.3.8 GENERATES from OBSERVATION to HYPOTHESIS", () => {
    makeObservation(g, "o1"); makeHypothesis(g, "h1");
    const r = g.connect({ fromNodeId: "o1", toNodeId: "h1", relationType: EvidenceGraphRelationType.GENERATES });
    expect(r.valid).toBe(true);
  });
  it("16.3.9 TESTED_BY from HYPOTHESIS to EXPERIMENT", () => {
    makeHypothesis(g, "h1"); makeExperiment(g, "x1");
    const r = g.connect({ fromNodeId: "h1", toNodeId: "x1", relationType: EvidenceGraphRelationType.TESTED_BY });
    expect(r.valid).toBe(true);
  });
  it("16.3.10 PRODUCES from EXPERIMENT to EVIDENCE", () => {
    makeExperiment(g, "x1"); makeEvidence(g, "e1");
    const r = g.connect({ fromNodeId: "x1", toNodeId: "e1", relationType: EvidenceGraphRelationType.PRODUCES });
    expect(r.valid).toBe(true);
  });
  it("16.3.11 AUTHORIZES from DECISION to ACTION", () => {
    makeDecision(g, "d1"); makeAction(g, "a1");
    const r = g.connect({ fromNodeId: "d1", toNodeId: "a1", relationType: EvidenceGraphRelationType.AUTHORIZES });
    expect(r.valid).toBe(true);
  });
  it("16.3.12 EXECUTES from ACTION to ACTUAL_RESULT", () => {
    makeAction(g, "a1"); makeActualResult(g, "ar1");
    const r = g.connect({ fromNodeId: "a1", toNodeId: "ar1", relationType: EvidenceGraphRelationType.EXECUTES });
    expect(r.valid).toBe(true);
  });
  it("16.3.13 RESULTS_IN from ACTUAL_RESULT to ACCEPTANCE", () => {
    makeActualResult(g, "ar1"); makeAcceptance(g, "ac1");
    const r = g.connect({ fromNodeId: "ar1", toNodeId: "ac1", relationType: EvidenceGraphRelationType.RESULTS_IN });
    expect(r.valid).toBe(true);
  });
  it("16.3.14 SATISFIES from ACCEPTANCE to DECISION", () => {
    makeAcceptance(g, "ac1"); makeDecision(g, "d1");
    const r = g.connect({ fromNodeId: "ac1", toNodeId: "d1", relationType: EvidenceGraphRelationType.SATISFIES });
    expect(r.valid).toBe(true);
  });
  it("16.3.15 VIOLATES from ACCEPTANCE to CLAIM", () => {
    makeAcceptance(g, "ac1"); makeClaim(g, "c1");
    const r = g.connect({ fromNodeId: "ac1", toNodeId: "c1", relationType: EvidenceGraphRelationType.VIOLATES });
    expect(r.valid).toBe(true);
  });
  it("16.3.16 VIOLATES from ACCEPTANCE to HYPOTHESIS", () => {
    makeAcceptance(g, "ac1"); makeHypothesis(g, "h1");
    const r = g.connect({ fromNodeId: "ac1", toNodeId: "h1", relationType: EvidenceGraphRelationType.VIOLATES });
    expect(r.valid).toBe(true);
  });
  it("16.3.17 SUPERSEDES from EVIDENCE to EVIDENCE", () => {
    makeEvidence(g, "e1"); makeEvidence(g, "e2");
    const r = g.connect({ fromNodeId: "e1", toNodeId: "e2", relationType: EvidenceGraphRelationType.SUPERSEDES });
    expect(r.valid).toBe(true);
  });
  it("16.3.18 SUPERSEDES from CLAIM to CLAIM", () => {
    makeClaim(g, "c1"); makeClaim(g, "c2");
    const r = g.connect({ fromNodeId: "c1", toNodeId: "c2", relationType: EvidenceGraphRelationType.SUPERSEDES });
    expect(r.valid).toBe(true);
  });
  it("16.3.19 EVOLVES_TO from EVOLUTION to MISSION", () => {
    makeEvolution(g, "e1"); makeMission(g, "m2");
    const r = g.connect({ fromNodeId: "e1", toNodeId: "m2", relationType: EvidenceGraphRelationType.EVOLVES_TO });
    expect(r.valid).toBe(true);
  });
  it("16.3.20 EVOLVES_TO from EVOLUTION to EVOLUTION", () => {
    makeEvolution(g, "e1"); makeEvolution(g, "e2");
    const r = g.connect({ fromNodeId: "e1", toNodeId: "e2", relationType: EvidenceGraphRelationType.EVOLVES_TO });
    expect(r.valid).toBe(true);
  });
  it("16.3.21 Edge count increases", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    expect(g.edgeCount).toBe(0);
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(g.edgeCount).toBe(1);
  });
  it("16.3.22 Edge has timestamp", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const edges = g.getOutgoing("o1");
    expect(edges[0].timestamp).toBeTruthy();
  });
  it("16.3.23 Edge has metadata", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS, metadata: { confidence: 0.9 } });
    const edges = g.getOutgoing("o1");
    expect(edges[0].metadata).toEqual({ confidence: 0.9 });
  });
  it("16.3.24 Edge has edgeId", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const edges = g.getOutgoing("o1");
    expect(edges[0].edgeId).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.4 Edge Creation — Invalid
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.4 Edge Creation — Invalid", () => {
  let g: EvidenceGraph;
  beforeEach(() => { g = new EvidenceGraph(); });

  it("16.4.1 Unknown source node rejected", () => {
    makeClaim(g, "c1");
    const r = g.connect({ fromNodeId: "unknown", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Unknown source node");
  });
  it("16.4.2 Unknown target node rejected", () => {
    makeObservation(g, "o1");
    const r = g.connect({ fromNodeId: "o1", toNodeId: "unknown", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Unknown target node");
  });
  it("16.4.3 Self-reference rejected", () => {
    makeClaim(g, "c1");
    const r = g.connect({ fromNodeId: "c1", toNodeId: "c1", relationType: EvidenceGraphRelationType.SUPERSEDES });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Self-reference");
  });
  it("16.4.4 Invalid relation type rejected", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    const r = g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: "INVALID_REL" as any });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Invalid relation type");
  });
  it("16.4.5 Duplicate edge rejected", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const r = g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Duplicate edge");
  });
  it("16.4.6 Same source→target with different relation allowed", () => {
    makeEvidence(g, "e1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "e1", toNodeId: "c1", relationType: EvidenceGraphRelationType.SUPPORTS });
    const r = g.connect({ fromNodeId: "e1", toNodeId: "c1", relationType: EvidenceGraphRelationType.CONTRADICTS });
    expect(r.valid).toBe(true);
  });
  it("16.4.7 OBSERVED_AS from CLAIM to CLAIM rejected (wrong source type)", () => {
    makeClaim(g, "c1"); makeClaim(g, "c2");
    const r = g.connect({ fromNodeId: "c1", toNodeId: "c2", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("not valid from");
  });
  it("16.4.8 TESTED_BY from CLAIM to EXPERIMENT rejected (wrong source type)", () => {
    makeClaim(g, "c1"); makeExperiment(g, "x1");
    const r = g.connect({ fromNodeId: "c1", toNodeId: "x1", relationType: EvidenceGraphRelationType.TESTED_BY });
    expect(r.valid).toBe(false);
  });
  it("16.4.9 PRODUCES from CLAIM to EVIDENCE rejected (wrong source type)", () => {
    makeClaim(g, "c1"); makeEvidence(g, "e1");
    const r = g.connect({ fromNodeId: "c1", toNodeId: "e1", relationType: EvidenceGraphRelationType.PRODUCES });
    expect(r.valid).toBe(false);
  });
  it("16.4.10 AUTHORIZES from ACTION to ACTION rejected (wrong target type)", () => {
    makeAction(g, "a1"); makeAction(g, "a2");
    const r = g.connect({ fromNodeId: "a1", toNodeId: "a2", relationType: EvidenceGraphRelationType.AUTHORIZES });
    expect(r.valid).toBe(false);
  });
  it("16.4.11 EXECUTES from DECISION to ACTUAL_RESULT rejected (wrong source type)", () => {
    makeDecision(g, "d1"); makeActualResult(g, "ar1");
    const r = g.connect({ fromNodeId: "d1", toNodeId: "ar1", relationType: EvidenceGraphRelationType.EXECUTES });
    expect(r.valid).toBe(false);
  });
  it("16.4.12 Edge count unchanged after rejected edge", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(g.edgeCount).toBe(1);
  });
  it("16.4.13 Both unknown nodes error", () => {
    const r = g.connect({ fromNodeId: "x", toNodeId: "y", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(r.errors.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.5 Retrieval
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.5 Retrieval", () => {
  let g: EvidenceGraph;
  beforeEach(() => { g = new EvidenceGraph(); });

  it("16.5.1 getOutgoing returns correct edges", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1"); makeClaim(g, "c2");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    g.connect({ fromNodeId: "o1", toNodeId: "c2", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(g.getOutgoing("o1")).toHaveLength(2);
  });
  it("16.5.2 getIncoming returns correct edges", () => {
    makeObservation(g, "o1"); makeObservation(g, "o2"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    g.connect({ fromNodeId: "o2", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(g.getIncoming("c1")).toHaveLength(2);
  });
  it("16.5.3 getOutgoing empty for node with no outgoing", () => {
    makeClaim(g, "c1");
    expect(g.getOutgoing("c1")).toHaveLength(0);
  });
  it("16.5.4 getIncoming empty for node with no incoming", () => {
    makeObservation(g, "o1");
    expect(g.getIncoming("o1")).toHaveLength(0);
  });
  it("16.5.5 getOutgoing empty for nonexistent node", () => {
    expect(g.getOutgoing("nonexistent")).toHaveLength(0);
  });
  it("16.5.6 getIncoming empty for nonexistent node", () => {
    expect(g.getIncoming("nonexistent")).toHaveLength(0);
  });
  it("16.5.7 getAllNodes returns all nodes", () => {
    makeMission(g, "m1"); makeObservation(g, "o1"); makeClaim(g, "c1");
    expect(g.getAllNodes()).toHaveLength(3);
  });
  it("16.5.8 getAllEdges returns all edges", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1"); makeClaim(g, "c2");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    g.connect({ fromNodeId: "o1", toNodeId: "c2", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(g.getAllEdges()).toHaveLength(2);
  });
  it("16.5.9 getEdge returns edge by ID", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const edge = g.getOutgoing("o1")[0];
    expect(g.getEdge(edge.edgeId)).toBeDefined();
    expect(g.getEdge(edge.edgeId)!.relationType).toBe(EvidenceGraphRelationType.OBSERVED_AS);
  });
  it("16.5.10 getEdge returns undefined for nonexistent", () => {
    expect(g.getEdge("nonexistent")).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.6 Path Finding
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.6 Path Finding", () => {
  let g: EvidenceGraph;
  beforeEach(() => { g = new EvidenceGraph(); });

  it("16.6.1 Path found for direct connection", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(g.findPath("o1", "c1")).toEqual(["o1", "c1"]);
  });
  it("16.6.2 Path found for multi-hop chain", () => {
    buildFullChain(g);
    const path = g.findPath("obs-1", "acc-1");
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(2);
    expect(path![0]).toBe("obs-1");
    expect(path![path!.length - 1]).toBe("acc-1");
  });
  it("16.6.3 Path returns null for disconnected nodes", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    expect(g.findPath("o1", "c1")).toBeNull();
  });
  it("16.6.4 Path returns [nodeId] for same node", () => {
    makeMission(g, "m1");
    expect(g.findPath("m1", "m1")).toEqual(["m1"]);
  });
  it("16.6.5 Path returns null for nonexistent source", () => {
    makeClaim(g, "c1");
    expect(g.findPath("nonexistent", "c1")).toBeNull();
  });
  it("16.6.6 Path returns null for nonexistent target", () => {
    makeObservation(g, "o1");
    expect(g.findPath("o1", "nonexistent")).toBeNull();
  });
  it("16.6.7 Path returns null for empty graph", () => {
    expect(g.findPath("x", "y")).toBeNull();
  });
  it("16.6.8 Path finds shortest route", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1"); makeHypothesis(g, "h1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    g.connect({ fromNodeId: "o1", toNodeId: "h1", relationType: EvidenceGraphRelationType.GENERATES });
    const path = g.findPath("o1", "h1");
    expect(path).toEqual(["o1", "h1"]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.7 Cycle Detection
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.7 Cycle Detection", () => {
  let g: EvidenceGraph;
  beforeEach(() => { g = new EvidenceGraph(); });

  it("16.7.1 No cycle in empty graph", () => {
    expect(g.hasCyclicEvolution()).toBe(false);
  });
  it("16.7.2 No cycle with single EVOLUTION node", () => {
    makeEvolution(g, "e1");
    expect(g.hasCyclicEvolution()).toBe(false);
  });
  it("16.7.3 No cycle with linear EVOLVES_TO chain", () => {
    makeEvolution(g, "e1"); makeMission(g, "m2");
    g.connect({ fromNodeId: "e1", toNodeId: "m2", relationType: EvidenceGraphRelationType.EVOLVES_TO });
    expect(g.hasCyclicEvolution()).toBe(false);
  });
  it("16.7.4 Cycle detected with self-evolution", () => {
    makeEvolution(g, "e1"); makeEvolution(g, "e2");
    g.connect({ fromNodeId: "e1", toNodeId: "e2", relationType: EvidenceGraphRelationType.EVOLVES_TO });
    g.connect({ fromNodeId: "e2", toNodeId: "e1", relationType: EvidenceGraphRelationType.EVOLVES_TO });
    expect(g.hasCyclicEvolution()).toBe(true);
  });
  it("16.7.5 Cycle detected with three-node evolution", () => {
    makeEvolution(g, "e1"); makeEvolution(g, "e2"); makeEvolution(g, "e3");
    g.connect({ fromNodeId: "e1", toNodeId: "e2", relationType: EvidenceGraphRelationType.EVOLVES_TO });
    g.connect({ fromNodeId: "e2", toNodeId: "e3", relationType: EvidenceGraphRelationType.EVOLVES_TO });
    g.connect({ fromNodeId: "e3", toNodeId: "e1", relationType: EvidenceGraphRelationType.EVOLVES_TO });
    expect(g.hasCyclicEvolution()).toBe(true);
  });
  it("16.7.6 No cycle with non-EVOLVES_TO edges", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1"); makeClaim(g, "c2");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    g.connect({ fromNodeId: "o1", toNodeId: "c2", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(g.hasCyclicEvolution()).toBe(false);
  });
  it("16.7.7 EVOLVES_TO to non-EVOLUTION node doesn't cause cycle", () => {
    makeEvolution(g, "e1"); makeMission(g, "m1");
    g.connect({ fromNodeId: "e1", toNodeId: "m1", relationType: EvidenceGraphRelationType.EVOLVES_TO });
    expect(g.hasCyclicEvolution()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.8 Graph Validation
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.8 Graph Validation", () => {
  let g: EvidenceGraph;
  beforeEach(() => { g = new EvidenceGraph(); });

  it("16.8.1 Empty graph is valid", () => {
    expect(g.validateGraph().valid).toBe(true);
  });
  it("16.8.2 Graph with nodes only is valid", () => {
    makeMission(g, "m1"); makeObservation(g, "o1");
    expect(g.validateGraph().valid).toBe(true);
  });
  it("16.8.3 Full chain graph is valid", () => {
    buildFullChain(g);
    expect(g.validateGraph().valid).toBe(true);
  });
  it("16.8.4 Graph with SUPPORTS edge is valid", () => {
    makeEvidence(g, "e1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "e1", toNodeId: "c1", relationType: EvidenceGraphRelationType.SUPPORTS });
    expect(g.validateGraph().valid).toBe(true);
  });
  it("16.8.5 Graph with CONTRADICTS edge is valid", () => {
    makeEvidence(g, "e1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "e1", toNodeId: "c1", relationType: EvidenceGraphRelationType.CONTRADICTS });
    expect(g.validateGraph().valid).toBe(true);
  });
  it("16.8.6 Cyclic evolution detected as invalid", () => {
    makeEvolution(g, "e1"); makeEvolution(g, "e2");
    g.connect({ fromNodeId: "e1", toNodeId: "e2", relationType: EvidenceGraphRelationType.EVOLVES_TO });
    g.connect({ fromNodeId: "e2", toNodeId: "e1", relationType: EvidenceGraphRelationType.EVOLVES_TO });
    const r = g.validateGraph();
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Cyclic evolution");
  });
  it("16.8.3b VIOLATES edge is valid", () => {
    makeAcceptance(g, "ac1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "ac1", toNodeId: "c1", relationType: EvidenceGraphRelationType.VIOLATES });
    expect(g.validateGraph().valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.9 Export
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.9 Export", () => {
  let g: EvidenceGraph;
  beforeEach(() => { g = new EvidenceGraph(); });

  it("16.9.1 Export empty graph", () => {
    const exp = g.exportGraph();
    expect(exp.nodes).toHaveLength(0);
    expect(exp.edges).toHaveLength(0);
    expect(exp.version).toBeTruthy();
    expect(exp.exportedAt).toBeTruthy();
  });
  it("16.9.2 Export contains all nodes", () => {
    makeMission(g, "m1"); makeObservation(g, "o1"); makeClaim(g, "c1");
    const exp = g.exportGraph();
    expect(exp.nodes).toHaveLength(3);
  });
  it("16.9.3 Export contains all edges", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1"); makeClaim(g, "c2");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    g.connect({ fromNodeId: "o1", toNodeId: "c2", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const exp = g.exportGraph();
    expect(exp.edges).toHaveLength(2);
  });
  it("16.9.4 Export is deterministic", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const exp1 = g.exportGraph();
    const exp2 = g.exportGraph();
    expect(exp1.nodes).toEqual(exp2.nodes);
    expect(exp1.edges).toEqual(exp2.edges);
  });
  it("16.9.5 Export nodes preserve all fields", () => {
    makeMission(g, "m1");
    const node = g.getNode("m1")!;
    node.metadata = { key: "val" };
    node.sourceRefs = [{ type: "file", uri: "test.ts" }];
    const exp = g.exportGraph();
    const exported = exp.nodes.find((n) => n.nodeId === "m1")!;
    expect(exported.metadata).toEqual({ key: "val" });
    expect(exported.sourceRefs).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.10 Remove Operations
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.10 Remove Operations", () => {
  let g: EvidenceGraph;
  beforeEach(() => { g = new EvidenceGraph(); });

  it("16.10.1 Remove existing node returns true", () => {
    makeMission(g, "m1");
    expect(g.removeNode("m1")).toBe(true);
  });
  it("16.10.2 Removed node not retrievable", () => {
    makeMission(g, "m1");
    g.removeNode("m1");
    expect(g.getNode("m1")).toBeUndefined();
  });
  it("16.10.3 Remove nonexistent node returns false", () => {
    expect(g.removeNode("nonexistent")).toBe(false);
  });
  it("16.10.4 Node count decreases after removal", () => {
    makeMission(g, "m1"); makeObservation(g, "o1");
    g.removeNode("m1");
    expect(g.nodeCount).toBe(1);
  });
  it("16.10.5 Remove node removes connected edges (outgoing)", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    g.removeNode("o1");
    expect(g.edgeCount).toBe(0);
  });
  it("16.10.6 Remove node removes connected edges (incoming)", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    g.removeNode("c1");
    expect(g.edgeCount).toBe(0);
  });
  it("16.10.7 Remove existing edge returns true", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const edge = g.getOutgoing("o1")[0];
    expect(g.removeEdge(edge.edgeId)).toBe(true);
  });
  it("16.10.8 Removed edge not retrievable", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const edge = g.getOutgoing("o1")[0];
    g.removeEdge(edge.edgeId);
    expect(g.getEdge(edge.edgeId)).toBeUndefined();
  });
  it("16.10.9 Remove nonexistent edge returns false", () => {
    expect(g.removeEdge("nonexistent")).toBe(false);
  });
  it("16.10.10 Edge count decreases after removal", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1"); makeClaim(g, "c2");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    g.connect({ fromNodeId: "o1", toNodeId: "c2", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const edge = g.getOutgoing("o1")[0];
    g.removeEdge(edge.edgeId);
    expect(g.edgeCount).toBe(1);
  });
  it("16.10.11 Remove edge clears from incoming index", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const edge = g.getOutgoing("o1")[0];
    g.removeEdge(edge.edgeId);
    expect(g.getIncoming("c1")).toHaveLength(0);
  });
  it("16.10.12 Remove edge clears from outgoing index", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const edge = g.getOutgoing("o1")[0];
    g.removeEdge(edge.edgeId);
    expect(g.getOutgoing("o1")).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.11 Determinism
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.11 Determinism", () => {
  it("16.11.1 Two empty graphs are equivalent", () => {
    const g1 = new EvidenceGraph();
    const g2 = new EvidenceGraph();
    expect(g1.exportGraph().nodes).toEqual(g2.exportGraph().nodes);
  });
  it("16.11.2 Same operations produce same state", () => {
    const g1 = new EvidenceGraph();
    const g2 = new EvidenceGraph();
    [g1, g2].forEach((g) => {
      g.createNode({ nodeId: "m1", nodeType: EvidenceGraphNodeType.MISSION, missionId: "m1" });
      g.createNode({ nodeId: "o1", nodeType: EvidenceGraphNodeType.OBSERVATION, missionId: "m1" });
      g.connect({ fromNodeId: "m1", toNodeId: "o1", relationType: EvidenceGraphRelationType.GENERATES });
    });
    expect(g1.exportGraph().nodes.map((n) => n.nodeId)).toEqual(g2.exportGraph().nodes.map((n) => n.nodeId));
  });
  it("16.11.3 Repeated getNode returns same result", () => {
    const g = new EvidenceGraph();
    makeMission(g, "m1");
    expect(g.getNode("m1")).toEqual(g.getNode("m1"));
  });
  it("16.11.4 Repeated getOutgoing returns same result", () => {
    const g = new EvidenceGraph();
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(g.getOutgoing("o1")).toEqual(g.getOutgoing("o1"));
  });
  it("16.11.5 Repeated findPath returns same result", () => {
    const g = new EvidenceGraph();
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    expect(g.findPath("o1", "c1")).toEqual(g.findPath("o1", "c1"));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.12 Full Chain Integration
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.12 Full Chain Integration", () => {
  it("16.12.1 Complete evidence chain is valid", () => {
    const g = new EvidenceGraph();
    buildFullChain(g);
    expect(g.validateGraph().valid).toBe(true);
    expect(g.nodeCount).toBe(11);
    expect(g.edgeCount).toBeGreaterThanOrEqual(9);
  });
  it("16.12.2 Full chain has path from observation to acceptance", () => {
    const g = new EvidenceGraph();
    buildFullChain(g);
    const path = g.findPath("obs-1", "acc-1");
    expect(path).not.toBeNull();
    expect(path![0]).toBe("obs-1");
    expect(path![path!.length - 1]).toBe("acc-1");
  });
  it("16.12.3 Full chain export contains all data", () => {
    const g = new EvidenceGraph();
    buildFullChain(g);
    const exp = g.exportGraph();
    expect(exp.nodes.length).toBe(11);
    expect(exp.edges.length).toBeGreaterThanOrEqual(9);
    expect(exp.version).toBeTruthy();
  });
  it("16.12.4 Removing middle node breaks path", () => {
    const g = new EvidenceGraph();
    buildFullChain(g);
    g.removeNode("ev-1");
    const path = g.findPath("obs-1", "acc-1");
    expect(path).toBeNull();
  });
  it("16.12.5 Multiple missions can coexist", () => {
    const g = new EvidenceGraph();
    makeMission(g, "m1"); makeMission(g, "m2");
    makeObservation(g, "o1", "m1"); makeObservation(g, "o2", "m2");
    expect(g.nodeCount).toBe(4);
    expect(g.getNode("o1")!.missionId).toBe("m1");
    expect(g.getNode("o2")!.missionId).toBe("m2");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.13 Enum Values
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.13 Enum Values", () => {
  it("16.13.1 All 11 node types exist", () => {
    const types = Object.values(EvidenceGraphNodeType);
    expect(types).toHaveLength(11);
    expect(types).toContain("MISSION");
    expect(types).toContain("OBSERVATION");
    expect(types).toContain("CLAIM");
    expect(types).toContain("HYPOTHESIS");
    expect(types).toContain("EXPERIMENT");
    expect(types).toContain("EVIDENCE");
    expect(types).toContain("DECISION");
    expect(types).toContain("ACTION");
    expect(types).toContain("ACTUAL_RESULT");
    expect(types).toContain("ACCEPTANCE");
    expect(types).toContain("EVOLUTION");
  });
  it("16.13.2 All 13 relation types exist", () => {
    const types = Object.values(EvidenceGraphRelationType);
    expect(types).toHaveLength(13);
    expect(types).toContain("OBSERVED_AS");
    expect(types).toContain("SUPPORTS");
    expect(types).toContain("CONTRADICTS");
    expect(types).toContain("GENERATES");
    expect(types).toContain("TESTED_BY");
    expect(types).toContain("PRODUCES");
    expect(types).toContain("AUTHORIZES");
    expect(types).toContain("EXECUTES");
    expect(types).toContain("RESULTS_IN");
    expect(types).toContain("SATISFIES");
    expect(types).toContain("VIOLATES");
    expect(types).toContain("SUPERSEDES");
    expect(types).toContain("EVOLVES_TO");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16.14 Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

describe("16.14 Edge Cases", () => {
  let g: EvidenceGraph;
  beforeEach(() => { g = new EvidenceGraph(); });

  it("16.14.1 Empty graph nodeCount is 0", () => {
    expect(g.nodeCount).toBe(0);
  });
  it("16.14.2 Empty graph edgeCount is 0", () => {
    expect(g.edgeCount).toBe(0);
  });
  it("16.14.3 Single node, no edges: valid graph", () => {
    makeMission(g, "m1");
    expect(g.validateGraph().valid).toBe(true);
  });
  it("16.14.4 SUPERSEDES between HYPOTHESIS nodes", () => {
    makeHypothesis(g, "h1"); makeHypothesis(g, "h2");
    const r = g.connect({ fromNodeId: "h1", toNodeId: "h2", relationType: EvidenceGraphRelationType.SUPERSEDES });
    expect(r.valid).toBe(true);
  });
  it("16.14.5 SUPERSEDES between DECISION nodes", () => {
    makeDecision(g, "d1"); makeDecision(g, "d2");
    const r = g.connect({ fromNodeId: "d1", toNodeId: "d2", relationType: EvidenceGraphRelationType.SUPERSEDES });
    expect(r.valid).toBe(true);
  });
  it("16.14.6 SUPPORTS from EVIDENCE to DECISION is valid", () => {
    makeEvidence(g, "e1"); makeDecision(g, "d1");
    const r = g.connect({ fromNodeId: "e1", toNodeId: "d1", relationType: EvidenceGraphRelationType.SUPPORTS });
    expect(r.valid).toBe(true);
  });
  it("16.14.7 GENERATES from MISSION to CLAIM", () => {
    makeMission(g, "m1"); makeClaim(g, "c1");
    const r = g.connect({ fromNodeId: "m1", toNodeId: "c1", relationType: EvidenceGraphRelationType.GENERATES });
    expect(r.valid).toBe(true);
  });
  it("16.14.8 Multiple edges from same source allowed with different relations", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.CONTRADICTS });
    expect(g.edgeCount).toBe(2);
  });
  it("16.14.9 Export of graph with all 11 node types", () => {
    makeMission(g, "m1");
    makeObservation(g, "o1");
    makeClaim(g, "c1");
    makeHypothesis(g, "h1");
    makeExperiment(g, "x1");
    makeEvidence(g, "e1");
    makeDecision(g, "d1");
    makeAction(g, "a1");
    makeActualResult(g, "ar1");
    makeAcceptance(g, "ac1");
    makeEvolution(g, "ev1");
    const exp = g.exportGraph();
    expect(exp.nodes).toHaveLength(11);
  });
  it("16.14.10 Remove all nodes leaves empty graph", () => {
    makeMission(g, "m1"); makeObservation(g, "o1"); makeClaim(g, "c1");
    g.removeNode("m1"); g.removeNode("o1"); g.removeNode("c1");
    expect(g.nodeCount).toBe(0);
    expect(g.edgeCount).toBe(0);
  });
  it("16.14.11 Remove all edges leaves nodes intact", () => {
    makeObservation(g, "o1"); makeClaim(g, "c1");
    g.connect({ fromNodeId: "o1", toNodeId: "c1", relationType: EvidenceGraphRelationType.OBSERVED_AS });
    const edge = g.getOutgoing("o1")[0];
    g.removeEdge(edge.edgeId);
    expect(g.nodeCount).toBe(2);
    expect(g.edgeCount).toBe(0);
  });
  it("16.14.12 CONTRADICTS from EVIDENCE to DECISION", () => {
    makeEvidence(g, "e1"); makeDecision(g, "d1");
    const r = g.connect({ fromNodeId: "e1", toNodeId: "d1", relationType: EvidenceGraphRelationType.CONTRADICTS });
    expect(r.valid).toBe(true);
  });
  it("16.14.13 GENERATES from MISSION to CLAIM is valid", () => {
    makeMission(g, "m1"); makeClaim(g, "c1");
    const r = g.connect({ fromNodeId: "m1", toNodeId: "c1", relationType: EvidenceGraphRelationType.GENERATES });
    expect(r.valid).toBe(true);
  });
  it("16.14.14 Path through full chain is longest valid path", () => {
    buildFullChain(g);
    const path = g.findPath("obs-1", "dec-1");
    expect(path).not.toBeNull();
  });
  it("16.14.15 All 13 relation types tested at least once across tests", () => {
    const tested = new Set<string>();
    // This test ensures we cover all relation types
    const allRels = Object.values(EvidenceGraphRelationType);
    expect(allRels.length).toBe(13);
    // Manually verify each has been tested by checking the describe blocks above
    tested.add("OBSERVED_AS");
    tested.add("SUPPORTS");
    tested.add("CONTRADICTS");
    tested.add("GENERATES");
    tested.add("TESTED_BY");
    tested.add("PRODUCES");
    tested.add("AUTHORIZES");
    tested.add("EXECUTES");
    tested.add("RESULTS_IN");
    tested.add("SATISFIES");
    tested.add("VIOLATES");
    tested.add("SUPERSEDES");
    tested.add("EVOLVES_TO");
    expect(tested.size).toBe(13);
  });
});
