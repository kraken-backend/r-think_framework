import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMissions } from "../hooks.ts";
import { Loading, Empty, ErrorState } from "../components/Shared.tsx";
import { StateBadge } from "../components/Badges.tsx";

function MissionList() {
  const navigate = useNavigate();
  const [stateFilter, setStateFilter] = useState("");
  const params = stateFilter ? { state: stateFilter } : undefined;
  const { data, loading, error } = useMissions(params);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Missions</h1>
          <p className="page-subtitle">Mission overview and status</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="filter-select"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          aria-label="Filter by state"
        >
          <option value="">All States</option>
          <option value="OBSERVE">OBSERVE</option>
          <option value="UNDERSTAND">UNDERSTAND</option>
          <option value="QUESTION">QUESTION</option>
          <option value="VALIDATE">VALIDATE</option>
          <option value="CONNECT">CONNECT</option>
          <option value="CHALLENGE">CHALLENGE</option>
          <option value="DISCOVER">DISCOVER</option>
          <option value="EVOLVE">EVOLVE</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      {loading && <Loading />}
      {error && <ErrorState message={error} />}
      {!loading && !error && data?.items.length === 0 && (
        <Empty message="No missions found" />
      )}
      {!loading && !error && data && data.items.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mission ID</th>
                <th>State</th>
                <th>Risk Level</th>
                <th>Authority</th>
                <th>Contradictions</th>
                <th>Events</th>
                <th>Artifacts</th>
                <th>Terminated</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((m) => (
                <tr
                  key={m.missionId}
                  className="clickable"
                  onClick={() => navigate(`/missions/${m.missionId}`)}
                  role="row"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && navigate(`/missions/${m.missionId}`)
                  }
                >
                  <td className="mono">{m.missionId}</td>
                  <td>
                    <StateBadge state={m.currentState} />
                  </td>
                  <td>{m.riskLevel}</td>
                  <td>{m.authorityStatus}</td>
                  <td>{m.contradictionCount}</td>
                  <td>{m.eventCount}</td>
                  <td>{m.artifactCount}</td>
                  <td>{m.isTerminated ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && data && (
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--color-text-muted)" }}>
          Total: {data.total} missions
        </div>
      )}
    </div>
  );
}

export default MissionList;
