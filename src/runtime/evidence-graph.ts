/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Evidence Graph Engine
// Blueprint Reference: RTHINK-BP-001 §9
// Mission: RTHINK-RT-004

import {
  EvidenceGraphNodeType,
  EvidenceGraphRelationType,
} from "../contracts/types.js";
import type {
  EvidenceGraphNode,
  EvidenceGraphEdge,
  EvidenceGraphExport,
  SourceRef,
} from "../contracts/index.js";

// ─── Graph Validation Result ────────────────────────────────────────────────

export interface GraphValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Graph Node Input ───────────────────────────────────────────────────────

export interface GraphNodeInput {
  nodeId: string;
  nodeType: EvidenceGraphNodeType;
  missionId: string;
  sourceRefs?: SourceRef[];
  metadata?: Record<string, unknown>;
}

// ─── Graph Edge Input ───────────────────────────────────────────────────────

export interface GraphEdgeInput {
  fromNodeId: string;
  toNodeId: string;
  relationType: EvidenceGraphRelationType;
  metadata?: Record<string, unknown>;
}

// ─── Evidence Graph ─────────────────────────────────────────────────────────

const GRAPH_VERSION = "rt-004-v1.0";

// Allowed source→target node type pairs per relation type
const RELATION_VALIDITY: Record<
  EvidenceGraphRelationType,
  { source: EvidenceGraphNodeType[]; target: EvidenceGraphNodeType[] }
> = {
  [EvidenceGraphRelationType.OBSERVED_AS]: {
    source: [EvidenceGraphNodeType.OBSERVATION],
    target: [EvidenceGraphNodeType.CLAIM],
  },
  [EvidenceGraphRelationType.SUPPORTS]: {
    source: [EvidenceGraphNodeType.EVIDENCE],
    target: [
      EvidenceGraphNodeType.CLAIM,
      EvidenceGraphNodeType.HYPOTHESIS,
      EvidenceGraphNodeType.DECISION,
    ],
  },
  [EvidenceGraphRelationType.CONTRADICTS]: {
    source: [EvidenceGraphNodeType.EVIDENCE, EvidenceGraphNodeType.OBSERVATION],
    target: [
      EvidenceGraphNodeType.CLAIM,
      EvidenceGraphNodeType.HYPOTHESIS,
      EvidenceGraphNodeType.DECISION,
    ],
  },
  [EvidenceGraphRelationType.GENERATES]: {
    source: [EvidenceGraphNodeType.MISSION, EvidenceGraphNodeType.OBSERVATION],
    target: [
      EvidenceGraphNodeType.OBSERVATION,
      EvidenceGraphNodeType.CLAIM,
      EvidenceGraphNodeType.HYPOTHESIS,
    ],
  },
  [EvidenceGraphRelationType.TESTED_BY]: {
    source: [EvidenceGraphNodeType.HYPOTHESIS],
    target: [EvidenceGraphNodeType.EXPERIMENT],
  },
  [EvidenceGraphRelationType.PRODUCES]: {
    source: [EvidenceGraphNodeType.EXPERIMENT],
    target: [EvidenceGraphNodeType.EVIDENCE],
  },
  [EvidenceGraphRelationType.AUTHORIZES]: {
    source: [EvidenceGraphNodeType.DECISION],
    target: [EvidenceGraphNodeType.ACTION],
  },
  [EvidenceGraphRelationType.EXECUTES]: {
    source: [EvidenceGraphNodeType.ACTION],
    target: [EvidenceGraphNodeType.ACTUAL_RESULT],
  },
  [EvidenceGraphRelationType.RESULTS_IN]: {
    source: [EvidenceGraphNodeType.ACTUAL_RESULT],
    target: [EvidenceGraphNodeType.ACCEPTANCE],
  },
  [EvidenceGraphRelationType.SATISFIES]: {
    source: [EvidenceGraphNodeType.ACCEPTANCE],
    target: [EvidenceGraphNodeType.DECISION],
  },
  [EvidenceGraphRelationType.VIOLATES]: {
    source: [EvidenceGraphNodeType.ACCEPTANCE],
    target: [EvidenceGraphNodeType.CLAIM, EvidenceGraphNodeType.HYPOTHESIS],
  },
  [EvidenceGraphRelationType.SUPERSEDES]: {
    source: [
      EvidenceGraphNodeType.EVIDENCE,
      EvidenceGraphNodeType.CLAIM,
      EvidenceGraphNodeType.HYPOTHESIS,
      EvidenceGraphNodeType.DECISION,
    ],
    target: [
      EvidenceGraphNodeType.EVIDENCE,
      EvidenceGraphNodeType.CLAIM,
      EvidenceGraphNodeType.HYPOTHESIS,
      EvidenceGraphNodeType.DECISION,
    ],
  },
  [EvidenceGraphRelationType.EVOLVES_TO]: {
    source: [EvidenceGraphNodeType.EVOLUTION],
    target: [EvidenceGraphNodeType.MISSION, EvidenceGraphNodeType.EVOLUTION],
  },
};

export class EvidenceGraph {
  private nodes: Map<string, EvidenceGraphNode> = new Map();
  private edges: Map<string, EvidenceGraphEdge> = new Map();
  private nodeEdgeOut: Map<string, string[]> = new Map();
  private nodeEdgeIn: Map<string, string[]> = new Map();
  private edgeCounter: number = 0;

  // ─── Node Operations ────────────────────────────────────────────────────

  createNode(input: GraphNodeInput): GraphValidationResult {
    const errors: string[] = [];

    if (!input.nodeId || input.nodeId.trim() === "") {
      errors.push("Node ID must be a non-empty string");
    }

    if (this.nodes.has(input.nodeId)) {
      errors.push(`Duplicate node ID: "${input.nodeId}"`);
    }

    if (!Object.values(EvidenceGraphNodeType).includes(input.nodeType)) {
      errors.push(`Invalid node type: "${input.nodeType}"`);
    }

    if (!input.missionId || input.missionId.trim() === "") {
      errors.push("Mission ID must be a non-empty string");
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const node: EvidenceGraphNode = {
      nodeId: input.nodeId,
      nodeType: input.nodeType,
      missionId: input.missionId,
      timestamp: new Date().toISOString(),
      version: 1,
      sourceRefs: input.sourceRefs ?? [],
      metadata: input.metadata ?? {},
    };

    this.nodes.set(node.nodeId, node);
    this.nodeEdgeOut.set(node.nodeId, []);
    this.nodeEdgeIn.set(node.nodeId, []);

    return { valid: true, errors: [] };
  }

  // ─── Edge Operations ────────────────────────────────────────────────────

  connect(input: GraphEdgeInput): GraphValidationResult {
    const errors: string[] = [];

    if (!this.nodes.has(input.fromNodeId)) {
      errors.push(`Unknown source node: "${input.fromNodeId}"`);
    }

    if (!this.nodes.has(input.toNodeId)) {
      errors.push(`Unknown target node: "${input.toNodeId}"`);
    }

    if (input.fromNodeId === input.toNodeId) {
      errors.push(
        `Self-reference not allowed: "${input.fromNodeId}" → "${input.toNodeId}"`
      );
    }

    if (
      !Object.values(EvidenceGraphRelationType).includes(input.relationType)
    ) {
      errors.push(`Invalid relation type: "${input.relationType}"`);
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const fromNode = this.nodes.get(input.fromNodeId)!;
    const toNode = this.nodes.get(input.toNodeId)!;
    const validity = RELATION_VALIDITY[input.relationType];

    if (
      !validity.source.includes(fromNode.nodeType) ||
      !validity.target.includes(toNode.nodeType)
    ) {
      errors.push(
        `Relation "${input.relationType}" not valid from "${fromNode.nodeType}" to "${toNode.nodeType}"`
      );
      return { valid: false, errors };
    }

    // Check for duplicate edges
    const existingEdges = this.nodeEdgeOut.get(input.fromNodeId) ?? [];
    for (const edgeId of existingEdges) {
      const edge = this.edges.get(edgeId)!;
      if (
        edge.toNodeId === input.toNodeId &&
        edge.relationType === input.relationType
      ) {
        errors.push(
          `Duplicate edge: "${input.fromNodeId}" → "${input.toNodeId}" with relation "${input.relationType}"`
        );
        return { valid: false, errors };
      }
    }

    this.edgeCounter++;
    const edgeId = `edge-${this.edgeCounter}`;

    const edge: EvidenceGraphEdge = {
      edgeId,
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      relationType: input.relationType,
      timestamp: new Date().toISOString(),
      metadata: input.metadata ?? {},
    };

    this.edges.set(edgeId, edge);
    this.nodeEdgeOut.get(input.fromNodeId)!.push(edgeId);
    this.nodeEdgeIn.get(input.toNodeId)!.push(edgeId);

    return { valid: true, errors: [] };
  }

  // ─── Retrieval ──────────────────────────────────────────────────────────

  getNode(nodeId: string): EvidenceGraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  getEdge(edgeId: string): EvidenceGraphEdge | undefined {
    return this.edges.get(edgeId);
  }

  getOutgoing(nodeId: string): EvidenceGraphEdge[] {
    const edgeIds = this.nodeEdgeOut.get(nodeId) ?? [];
    return edgeIds.map((id) => this.edges.get(id)!);
  }

  getIncoming(nodeId: string): EvidenceGraphEdge[] {
    const edgeIds = this.nodeEdgeIn.get(nodeId) ?? [];
    return edgeIds.map((id) => this.edges.get(id)!);
  }

  getAllNodes(): EvidenceGraphNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): EvidenceGraphEdge[] {
    return Array.from(this.edges.values());
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    return this.edges.size;
  }

  // ─── Path Finding ───────────────────────────────────────────────────────

  findPath(fromNodeId: string, toNodeId: string): string[] | null {
    if (!this.nodes.has(fromNodeId) || !this.nodes.has(toNodeId)) {
      return null;
    }

    if (fromNodeId === toNodeId) {
      return [fromNodeId];
    }

    const visited = new Set<string>();
    const queue: { nodeId: string; path: string[] }[] = [
      { nodeId: fromNodeId, path: [fromNodeId] },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.nodeId === toNodeId) {
        return current.path;
      }

      if (visited.has(current.nodeId)) {
        continue;
      }

      visited.add(current.nodeId);

      const outgoing = this.getOutgoing(current.nodeId);
      for (const edge of outgoing) {
        if (!visited.has(edge.toNodeId)) {
          queue.push({
            nodeId: edge.toNodeId,
            path: [...current.path, edge.toNodeId],
          });
        }
      }
    }

    return null;
  }

  // ─── Cycle Detection ────────────────────────────────────────────────────

  hasCyclicEvolution(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const evolutionNodes = Array.from(this.nodes.values())
      .filter((n) => n.nodeType === EvidenceGraphNodeType.EVOLUTION)
      .map((n) => n.nodeId);

    for (const nodeId of evolutionNodes) {
      if (this.dfsCycleCheck(nodeId, visited, recursionStack)) {
        return true;
      }
    }

    return false;
  }

  private dfsCycleCheck(
    nodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    if (recursionStack.has(nodeId)) {
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoing = this.getOutgoing(nodeId);
    for (const edge of outgoing) {
      if (
        edge.relationType === EvidenceGraphRelationType.EVOLVES_TO &&
        this.dfsCycleCheck(edge.toNodeId, visited, recursionStack)
      ) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // ─── Graph Validation ──────────────────────────────────────────────────

  validateGraph(): GraphValidationResult {
    const errors: string[] = [];

    // Check for broken edge references
    for (const edge of this.edges.values()) {
      if (!this.nodes.has(edge.fromNodeId)) {
        errors.push(
          `Broken reference: edge "${edge.edgeId}" references unknown source node "${edge.fromNodeId}"`
        );
      }
      if (!this.nodes.has(edge.toNodeId)) {
        errors.push(
          `Broken reference: edge "${edge.edgeId}" references unknown target node "${edge.toNodeId}"`
        );
      }
    }

    // Check for orphaned edges in index
    for (const [nodeId, edgeIds] of this.nodeEdgeOut) {
      if (!this.nodes.has(nodeId)) {
        errors.push(`Orphaned edge index: node "${nodeId}" not found`);
      }
      for (const edgeId of edgeIds) {
        if (!this.edges.has(edgeId)) {
          errors.push(
            `Broken edge index: edge "${edgeId}" referenced by node "${nodeId}" not found`
          );
        }
      }
    }

    for (const [nodeId, edgeIds] of this.nodeEdgeIn) {
      if (!this.nodes.has(nodeId)) {
        errors.push(`Orphaned edge index: node "${nodeId}" not found`);
      }
      for (const edgeId of edgeIds) {
        if (!this.edges.has(edgeId)) {
          errors.push(
            `Broken edge index: edge "${edgeId}" referenced by node "${nodeId}" not found`
          );
        }
      }
    }

    // Check for cyclic evolution chains
    if (this.hasCyclicEvolution()) {
      errors.push("Cyclic evolution chain detected");
    }

    // Check node type/edge relation validity
    for (const edge of this.edges.values()) {
      const fromNode = this.nodes.get(edge.fromNodeId);
      const toNode = this.nodes.get(edge.toNodeId);
      if (fromNode && toNode) {
        const validity = RELATION_VALIDITY[edge.relationType];
        if (
          !validity.source.includes(fromNode.nodeType) ||
          !validity.target.includes(toNode.nodeType)
        ) {
          errors.push(
            `Invalid relation "${edge.relationType}" from "${fromNode.nodeType}" to "${toNode.nodeType}"`
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ─── Export ─────────────────────────────────────────────────────────────

  exportGraph(): EvidenceGraphExport {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      exportedAt: new Date().toISOString(),
      version: GRAPH_VERSION,
    };
  }

  // ─── Remove ─────────────────────────────────────────────────────────────

  removeNode(nodeId: string): boolean {
    if (!this.nodes.has(nodeId)) {
      return false;
    }

    // Remove all connected edges
    const outgoing = [...(this.nodeEdgeOut.get(nodeId) ?? [])];
    const incoming = [...(this.nodeEdgeIn.get(nodeId) ?? [])];

    for (const edgeId of outgoing) {
      const edge = this.edges.get(edgeId);
      if (edge) {
        const inList = this.nodeEdgeIn.get(edge.toNodeId);
        if (inList) {
          const idx = inList.indexOf(edgeId);
          if (idx >= 0) inList.splice(idx, 1);
        }
        this.edges.delete(edgeId);
      }
    }

    for (const edgeId of incoming) {
      const edge = this.edges.get(edgeId);
      if (edge) {
        const outList = this.nodeEdgeOut.get(edge.fromNodeId);
        if (outList) {
          const idx = outList.indexOf(edgeId);
          if (idx >= 0) outList.splice(idx, 1);
        }
        this.edges.delete(edgeId);
      }
    }

    this.nodeEdgeOut.delete(nodeId);
    this.nodeEdgeIn.delete(nodeId);
    this.nodes.delete(nodeId);

    return true;
  }

  removeEdge(edgeId: string): boolean {
    const edge = this.edges.get(edgeId);
    if (!edge) {
      return false;
    }

    const outList = this.nodeEdgeOut.get(edge.fromNodeId);
    if (outList) {
      const idx = outList.indexOf(edgeId);
      if (idx >= 0) outList.splice(idx, 1);
    }

    const inList = this.nodeEdgeIn.get(edge.toNodeId);
    if (inList) {
      const idx = inList.indexOf(edgeId);
      if (idx >= 0) inList.splice(idx, 1);
    }

    this.edges.delete(edgeId);
    return true;
  }
}
