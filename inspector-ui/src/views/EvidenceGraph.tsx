import { useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEvidenceGraph, useEvidenceValidation } from "../hooks.ts";
import { Loading, Empty, ErrorState } from "../components/Shared.tsx";

const nodeTypeColors: Record<string, string> = {
  MISSION: "#38bdf8",
  OBSERVATION: "#4ade80",
  CLAIM: "#fbbf24",
  HYPOTHESIS: "#c084fc",
  EXPERIMENT: "#f87171",
  EVIDENCE: "#2dd4bf",
  DECISION: "#818cf8",
  ACTION: "#fb923c",
  ACTUAL_RESULT: "#e879f9",
  ACCEPTANCE: "#34d399",
  EVOLUTION: "#60a5fa",
};

const relationColors: Record<string, string> = {
  OBSERVED_AS: "#4ade80",
  SUPPORTS: "#34d399",
  CONTRADICTS: "#f87171",
  GENERATES: "#fbbf24",
  TESTED_BY: "#c084fc",
  PRODUCES: "#fb923c",
  AUTHORIZES: "#818cf8",
  EXECUTES: "#60a5fa",
  RESULTS_IN: "#e879f9",
  SATISFIES: "#34d399",
  VIOLATES: "#f87171",
  SUPERSEDES: "#fbbf24",
  EVOLVES_TO: "#60a5fa",
};

function EvidenceGraph() {
  const { data: graph, loading, error } = useEvidenceGraph();
  const { data: validation } = useEvidenceValidation();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!graph) return { flowNodes: [], flowEdges: [] };

    const nodes: Node[] = graph.nodes.map((n, i) => ({
      id: n.nodeId,
      position: {
        x: (i % 4) * 220 + 50,
        y: Math.floor(i / 4) * 150 + 50,
      },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: nodeTypeColors[n.nodeType] ?? "#94a3b8",
                margin: "0 auto 4px",
              }}
            />
            <div style={{ fontSize: 11, fontWeight: 600 }}>{n.nodeType}</div>
            <div style={{ fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>
              {n.nodeId}
            </div>
          </div>
        ),
      },
      style: {
        background: "#1e293b",
        border: `2px solid ${nodeTypeColors[n.nodeType] ?? "#475569"}`,
        borderRadius: 8,
        padding: 12,
        width: 140,
      },
    }));

    const edges: Edge[] = graph.edges.map((e) => ({
      id: e.edgeId,
      source: e.fromNodeId,
      target: e.toNodeId,
      label: e.relationType,
      labelStyle: { fontSize: 10, fill: "#94a3b8" },
      style: {
        stroke: relationColors[e.relationType] ?? "#475569",
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: relationColors[e.relationType] ?? "#475569",
      },
    }));

    return { flowNodes: nodes, flowEdges: edges };
  }, [graph]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Evidence Graph</h1>
          <p className="page-subtitle">
            Nodes, edges, relationships, and validation
          </p>
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorState message={error} />}
      {!loading && !error && (!graph || graph.nodeCount === 0) && (
        <Empty message="No evidence graph data" />
      )}

      {!loading && graph && graph.nodeCount > 0 && (
        <>
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card">
              <div className="stat-value">{graph.nodeCount}</div>
              <div className="stat-label">Nodes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{graph.edgeCount}</div>
              <div className="stat-label">Edges</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{graph.hasCycles ? "Yes" : "No"}</div>
              <div className="stat-label">Has Cycles</div>
            </div>
            {validation && (
              <div className="stat-card">
                <div className="stat-value" style={{ color: validation.valid ? "var(--color-success)" : "var(--color-danger)" }}>
                  {validation.valid ? "Valid" : "Invalid"}
                </div>
                <div className="stat-label">Graph Integrity</div>
              </div>
            )}
          </div>

          <div className="evidence-graph-container">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              fitView
              onNodeClick={(_, node) => setSelectedNode(node.id)}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#475569" />
              <Controls />
            </ReactFlow>
          </div>

          {selectedNode && graph && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-title">
                Selected Node: {selectedNode}
              </div>
              {(() => {
                const node = graph.nodes.find((n) => n.nodeId === selectedNode);
                if (!node) return <Empty message="Node not found" />;
                return (
                  <div>
                    <div className="data-row">
                      <span className="data-label">Node Type</span>
                      <span className="data-value">
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: nodeTypeColors[node.nodeType] ?? "#94a3b8",
                            marginRight: 6,
                          }}
                        />
                        {node.nodeType}
                      </span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Mission</span>
                      <span className="data-value mono">{node.missionId}</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Version</span>
                      <span className="data-value">{node.version}</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Timestamp</span>
                      <span className="data-value mono">
                        {new Date(node.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {node.data && Object.keys(node.data).length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div className="data-label" style={{ marginBottom: 4 }}>Data</div>
                        <pre className="json-viewer">
                          {JSON.stringify(node.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {validation && validation.errors.length > 0 && (
            <div className="card" style={{ marginTop: 16, borderColor: "var(--color-danger)" }}>
              <div className="card-title" style={{ color: "var(--color-danger)" }}>
                Validation Errors
              </div>
              {validation.errors.map((err, i) => (
                <div key={i} className="data-row">
                  <span className="data-value">{err}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EvidenceGraph;
