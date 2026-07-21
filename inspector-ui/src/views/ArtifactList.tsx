import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useArtifacts } from "../hooks.ts";
import { Loading, Empty, ErrorState } from "../components/Shared.tsx";

function ArtifactList() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("");
  const [missionFilter, setMissionFilter] = useState("");

  const params: Record<string, string> = {};
  if (typeFilter) params.artifactType = typeFilter;
  if (missionFilter) params.missionId = missionFilter;

  const { data, loading, error } = useArtifacts(
    Object.keys(params).length > 0 ? params : undefined
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Artifacts</h1>
          <p className="page-subtitle">Schema-validated, versioned mission artifacts</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by artifact type"
        >
          <option value="">All Types</option>
          <option value="OBSERVATION">OBSERVATION</option>
          <option value="CLAIM">CLAIM</option>
          <option value="HYPOTHESIS">HYPOTHESIS</option>
          <option value="EXPERIMENT">EXPERIMENT</option>
          <option value="EVIDENCE">EVIDENCE</option>
          <option value="DECISION">DECISION</option>
          <option value="ACTION">ACTION</option>
          <option value="ACTUAL_RESULT">ACTUAL_RESULT</option>
          <option value="ACCEPTANCE">ACCEPTANCE</option>
          <option value="EVOLUTION">EVOLUTION</option>
          <option value="MISSION_CONTRACT">MISSION_CONTRACT</option>
          <option value="DISCOVERY">DISCOVERY</option>
        </select>
        <input
          className="filter-input"
          type="text"
          placeholder="Filter by Mission ID..."
          value={missionFilter}
          onChange={(e) => setMissionFilter(e.target.value)}
          aria-label="Filter by mission ID"
        />
      </div>

      {loading && <Loading />}
      {error && <ErrorState message={error} />}
      {!loading && !error && data?.items.length === 0 && (
        <Empty message="No artifacts found" />
      )}
      {!loading && data && data.items.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Artifact ID</th>
                <th>Type</th>
                <th>Version</th>
                <th>Mission</th>
                <th>Confidence</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr
                  key={a.artifactId}
                  className="clickable"
                  onClick={() => navigate(`/artifacts/${a.artifactId}`)}
                  role="row"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && navigate(`/artifacts/${a.artifactId}`)
                  }
                >
                  <td className="mono">{a.artifactId}</td>
                  <td>
                    <span className="badge badge-primary">{a.artifactType}</span>
                  </td>
                  <td>{a.version}</td>
                  <td className="mono">{a.missionId}</td>
                  <td>
                    {a.confidence != null
                      ? `${(a.confidence * 100).toFixed(0)}%`
                      : "—"}
                  </td>
                  <td className="mono">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && data && (
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--color-text-muted)" }}>
          Total: {data.total} artifacts
        </div>
      )}
    </div>
  );
}

export default ArtifactList;
