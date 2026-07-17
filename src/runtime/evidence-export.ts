/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Router Decision → Evidence Graph Export Adapter
// Blueprint Reference: RTHINK-BP-001 §9
// Mission: RTHINK-RT-005-C1 (Semantic Contract & Documentation Reconciliation)
//
// This adapter is PURE and DECOUPLED: it imports only contract types and
// EvidenceGraph enums. It does NOT import the EvidenceGraph runtime class.
// The Execution Orchestrator wires RouterDecision → this adapter → EvidenceGraph.

import {
  EvidenceGraphNodeType,
  EvidenceGraphRelationType,
} from "../contracts/types.js";
import type {
  RouterDecision,
  EvidenceGraphExport,
  EvidenceGraphNode,
  EvidenceGraphEdge,
  SourceRef,
} from "../contracts/index.js";

// ─── Export Contract ───────────────────────────────────────────────────────

export interface RouterDecisionEvidenceExport {
  decisionNode: EvidenceGraphNode;
  selectedProviderNode?: EvidenceGraphNode;
  evidenceNodes: EvidenceGraphNode[];
  rejectedProviderNodes: EvidenceGraphNode[];
  authorizationCandidate?: EvidenceGraphNode;
  edges: EvidenceGraphEdge[];
  exportedAt: string;
  version: string;
}

export const EVIDENCE_EXPORT_VERSION = "rt-005-c1-evidence-1.0";

// ─── Adapter ───────────────────────────────────────────────────────────────

function makeSourceRefs(methodId: string, decisionId: string): SourceRef[] {
  return [
    { type: "router-method", uri: `rthink://router/method/${methodId}` },
    { type: "router-decision", uri: `rthink://router/decision/${decisionId}` },
  ];
}

export function toEvidenceGraphArtifacts(
  decision: RouterDecision,
  missionId: string = "default-mission"
): RouterDecisionEvidenceExport {
  const exportedAt = new Date().toISOString();
  const sourceRefs = makeSourceRefs(decision.methodId, decision.decisionId);

  // DECISION node
  const decisionNode: EvidenceGraphNode = {
    nodeId: `decision:${decision.decisionId}`,
    nodeType: EvidenceGraphNodeType.DECISION,
    missionId,
    timestamp: decision.timestamp,
    version: 1,
    sourceRefs,
    metadata: {
      decisionId: decision.decisionId,
      requestId: decision.requestId,
      methodId: decision.methodId,
      finalDecision: decision.finalDecision,
      reason: decision.reason,
      selectedProvider: decision.selectedProvider,
      rejectedProviders: decision.rejectedProviders.map((r) => ({
        providerId: r.providerId,
        reason: r.reason,
        code: r.code,
      })),
      capabilityMatch: decision.capabilityMatch,
      priorityEvaluation: decision.priorityEvaluation,
    },
  };

  const nodes: EvidenceGraphNode[] = [decisionNode];
  const edges: EvidenceGraphEdge[] = [];
  const evidenceNodes: EvidenceGraphNode[] = [];
  const rejectedProviderNodes: EvidenceGraphNode[] = [];

  // EVIDENCE nodes from capability match
  if (decision.capabilityMatch.matchedCapabilities.length > 0) {
    const evNode: EvidenceGraphNode = {
      nodeId: `evidence:${decision.decisionId}:capability-match`,
      nodeType: EvidenceGraphNodeType.EVIDENCE,
      missionId,
      timestamp: decision.timestamp,
      version: 1,
      sourceRefs,
      metadata: {
        kind: "capability-match",
        matched: decision.capabilityMatch.matchedCapabilities,
        versionMatches: decision.capabilityMatch.versionMatches,
        versionMismatches: decision.capabilityMatch.versionMismatches,
      },
    };
    nodes.push(evNode);
    evidenceNodes.push(evNode);
    edges.push({
      edgeId: `edge:${decision.decisionId}:ev-cap`,
      fromNodeId: evNode.nodeId,
      toNodeId: decisionNode.nodeId,
      relationType: EvidenceGraphRelationType.SUPPORTS,
      timestamp: decision.timestamp,
      metadata: { source: "router-capability-match" },
    });
  }

  if (decision.capabilityMatch.missingCapabilities.length > 0) {
    const missNode: EvidenceGraphNode = {
      nodeId: `evidence:${decision.decisionId}:capability-gap`,
      nodeType: EvidenceGraphNodeType.EVIDENCE,
      missionId,
      timestamp: decision.timestamp,
      version: 1,
      sourceRefs,
      metadata: {
        kind: "capability-gap",
        missing: decision.capabilityMatch.missingCapabilities,
      },
    };
    nodes.push(missNode);
    evidenceNodes.push(missNode);
    edges.push({
      edgeId: `edge:${decision.decisionId}:ev-gap`,
      fromNodeId: missNode.nodeId,
      toNodeId: decisionNode.nodeId,
      relationType: EvidenceGraphRelationType.CONTRADICTS,
      timestamp: decision.timestamp,
      metadata: { source: "router-capability-gap" },
    });
  }

  // Rejected provider evidence nodes
  for (const rp of decision.rejectedProviders) {
    const rejNode: EvidenceGraphNode = {
      nodeId: `evidence:${decision.decisionId}:rejected:${rp.providerId}`,
      nodeType: EvidenceGraphNodeType.EVIDENCE,
      missionId,
      timestamp: decision.timestamp,
      version: 1,
      sourceRefs,
      metadata: {
        kind: "provider-rejected",
        providerId: rp.providerId,
        reason: rp.reason,
        code: rp.code,
      },
    };
    nodes.push(rejNode);
    rejectedProviderNodes.push(rejNode);
    edges.push({
      edgeId: `edge:${decision.decisionId}:rej:${rp.providerId}`,
      fromNodeId: rejNode.nodeId,
      toNodeId: decisionNode.nodeId,
      relationType: EvidenceGraphRelationType.CONTRADICTS,
      timestamp: decision.timestamp,
      metadata: { source: "router-rejection" },
    });
  }

  // Selected provider node + authorization candidate
  let selectedProviderNode: EvidenceGraphNode | undefined;
  let authorizationCandidate: EvidenceGraphNode | undefined;

  if (decision.selectedProvider) {
    selectedProviderNode = {
      nodeId: `provider:${decision.selectedProvider}`,
      nodeType: EvidenceGraphNodeType.OBSERVATION,
      missionId,
      timestamp: decision.timestamp,
      version: 1,
      sourceRefs,
      metadata: {
        kind: "selected-provider",
        providerId: decision.selectedProvider,
        methodId: decision.methodId,
      },
    };
    nodes.push(selectedProviderNode);

    authorizationCandidate = {
      nodeId: `action:${decision.decisionId}:authorize:${decision.selectedProvider}`,
      nodeType: EvidenceGraphNodeType.ACTION,
      missionId,
      timestamp: decision.timestamp,
      version: 1,
      sourceRefs,
      metadata: {
        kind: "execution-authorization-candidate",
        providerId: decision.selectedProvider,
        methodId: decision.methodId,
        decisionId: decision.decisionId,
      },
    };
    nodes.push(authorizationCandidate);

    edges.push({
      edgeId: `edge:${decision.decisionId}:auth`,
      fromNodeId: decisionNode.nodeId,
      toNodeId: authorizationCandidate.nodeId,
      relationType: EvidenceGraphRelationType.AUTHORIZES,
      timestamp: decision.timestamp,
      metadata: { source: "router-selection" },
    });
  }

  return {
    decisionNode,
    selectedProviderNode,
    evidenceNodes,
    rejectedProviderNodes,
    authorizationCandidate,
    edges,
    exportedAt,
    version: EVIDENCE_EXPORT_VERSION,
  };
}

export function toEvidenceGraphExport(
  decision: RouterDecision,
  missionId: string = "default-mission"
): EvidenceGraphExport {
  const artifacts = toEvidenceGraphArtifacts(decision, missionId);
  const nodes: EvidenceGraphNode[] = [
    artifacts.decisionNode,
    ...artifacts.evidenceNodes,
    ...artifacts.rejectedProviderNodes,
  ];
  if (artifacts.selectedProviderNode) nodes.push(artifacts.selectedProviderNode);
  if (artifacts.authorizationCandidate) nodes.push(artifacts.authorizationCandidate);

  return {
    nodes,
    edges: artifacts.edges,
    exportedAt: artifacts.exportedAt,
    version: artifacts.version,
  };
}
