import { useParams, Link } from "react-router-dom";
import { useArtifact, useArtifactHistory } from "../hooks.ts";
import { Loading, Empty, ErrorState, JsonViewer } from "../components/Shared.tsx";
import { Collapsible } from "../components/Badges.tsx";

function ArtifactDetail() {
  const { artifactId } = useParams<{ artifactId: string }>();
  const { data: artifact, loading, error } = useArtifact(artifactId ?? null);
  const { data: history } = useArtifactHistory(artifactId ?? null);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!artifact) return <Empty message="Artifact not found" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link
            to="/artifacts"
            style={{ color: "var(--color-text-muted)", fontSize: 13, textDecoration: "none" }}
          >
            ← Back to Artifacts
          </Link>
          <h1 className="page-title">{artifact.artifactId}</h1>
          <p className="page-subtitle">
            <span className="badge badge-primary">{artifact.artifactType}</span>
            <span style={{ marginLeft: 8, color: "var(--color-text-muted)" }}>
              v{artifact.version}
            </span>
          </p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-title">Artifact Details</div>
          <div className="data-row">
            <span className="data-label">Artifact ID</span>
            <span className="data-value mono">{artifact.artifactId}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Type</span>
            <span className="data-value">{artifact.artifactType}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Version</span>
            <span className="data-value">{artifact.version}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Mission</span>
            <span className="data-value mono">{artifact.missionId}</span>
          </div>
          <div className="data-row">
            <span className="data-label">State</span>
            <span className="data-value">{artifact.state}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Actor</span>
            <span className="data-value">
              {artifact.actor.id} ({artifact.actor.role})
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">Confidence</span>
            <span className="data-value">
              {artifact.confidence != null
                ? `${(artifact.confidence * 100).toFixed(1)}%`
                : "—"}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">Created</span>
            <span className="data-value mono">
              {new Date(artifact.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Payload</div>
          <JsonViewer data={artifact.payload} />
        </div>
      </div>

      <Collapsible title="Source References" defaultOpen>
        {artifact.sourceRefs.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>URI</th>
                  <th>Label</th>
                </tr>
              </thead>
              <tbody>
                {artifact.sourceRefs.map((ref, i) => (
                  <tr key={i}>
                    <td>{ref.type}</td>
                    <td className="mono">{ref.uri}</td>
                    <td>{ref.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty message="No source references" />
        )}
      </Collapsible>

      {history && history.length > 0 && (
        <Collapsible title={`Version History (${history.length} versions)`}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>State</th>
                  <th>Confidence</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.version}>
                    <td>{h.version}</td>
                    <td>{h.state}</td>
                    <td>
                      {h.confidence != null
                        ? `${(h.confidence * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="mono">
                      {new Date(h.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Collapsible>
      )}
    </div>
  );
}

export default ArtifactDetail;
