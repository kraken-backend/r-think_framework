import { useParams, Link } from "react-router-dom";
import {
  useMission,
  useMissionEvents,
  useMissionArtifacts,
  useMissionEvidence,
  useMissionAuthority,
  useMissionContradictions,
} from "../hooks.ts";
import { Loading, Empty, ErrorState, JsonViewer } from "../components/Shared.tsx";
import { StateBadge, Collapsible } from "../components/Badges.tsx";

function MissionDetail() {
  const { missionId } = useParams<{ missionId: string }>();
  const { data: mission, loading, error } = useMission(missionId ?? null);
  const { data: events } = useMissionEvents(missionId ?? null);
  const { data: artifacts } = useMissionArtifacts(missionId ?? null);
  const { data: evidence } = useMissionEvidence(missionId ?? null);
  const { data: authority } = useMissionAuthority(missionId ?? null);
  const { data: contradictions } = useMissionContradictions(missionId ?? null);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!mission) return <Empty message="Mission not found" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link
            to="/missions"
            style={{ color: "var(--color-text-muted)", fontSize: 13, textDecoration: "none" }}
          >
            ← Back to Missions
          </Link>
          <h1 className="page-title">{mission.missionId}</h1>
          <p className="page-subtitle">
            <StateBadge state={mission.currentState} />
            {mission.previousState && (
              <span style={{ marginLeft: 8, color: "var(--color-text-muted)" }}>
                from <StateBadge state={mission.previousState} />
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-title">Mission Summary</div>
          <div className="data-row">
            <span className="data-label">Risk Level</span>
            <span className="data-value">{mission.riskLevel}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Authority Status</span>
            <span className="data-value">{mission.authorityStatus}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Contradictions</span>
            <span className="data-value">{mission.contradictionCount}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Events</span>
            <span className="data-value">{mission.eventCount}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Artifacts</span>
            <span className="data-value">{mission.artifactCount}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Created</span>
            <span className="data-value mono">
              {new Date(mission.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">Updated</span>
            <span className="data-value mono">
              {new Date(mission.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">State History</div>
          {mission.stateHistory.length > 0 ? (
            <div className="timeline">
              {mission.stateHistory.map((state, i) => (
                <div
                  key={`${state}-${i}`}
                  className={`timeline-item${
                    i === mission.stateHistory.length - 1 ? " current" : ""
                  }`}
                >
                  <div className="timeline-event-type">
                    <StateBadge state={state} />
                  </div>
                  <div className="timeline-event-meta">Step {i + 1}</div>
                </div>
              ))}
            </div>
          ) : (
            <Empty message="No state history" />
          )}
        </div>
      </div>

      {authority && (
        <Collapsible title="Authority Information">
          <div className="data-row">
            <span className="data-label">Status</span>
            <span className="data-value">{authority.status}</span>
          </div>
          {authority.contradictions.length > 0 && (
            <div className="data-row">
              <span className="data-label">Contradictions</span>
              <span className="data-value">
                {authority.contradictions.join(", ")}
              </span>
            </div>
          )}
        </Collapsible>
      )}

      {contradictions && contradictions.count > 0 && (
        <Collapsible title={`Contradictions (${contradictions.count})`}>
          {contradictions.contradictions.map((c, i) => (
            <div key={i} className="data-row">
              <span className="data-value">{c}</span>
            </div>
          ))}
        </Collapsible>
      )}

      <Collapsible title={`Events (${events?.items.length ?? 0})`} defaultOpen>
        {events && events.items.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Type</th>
                  <th>Sequence</th>
                  <th>Actor</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {events.items.map((e) => (
                  <tr key={e.eventId}>
                    <td className="mono">{e.eventId}</td>
                    <td>
                      <span className="badge badge-info">{e.eventType}</span>
                    </td>
                    <td>{e.sequence}</td>
                    <td>
                      {e.actor.id} ({e.actor.role})
                    </td>
                    <td className="mono">
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty message="No events" />
        )}
      </Collapsible>

      <Collapsible title={`Artifacts (${artifacts?.items.length ?? 0})`}>
        {artifacts && artifacts.items.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Artifact ID</th>
                  <th>Type</th>
                  <th>Version</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {artifacts.items.map((a) => (
                  <tr
                    key={a.artifactId}
                    className="clickable"
                    onClick={() =>
                      (window.location.href = `/artifacts/${a.artifactId}`)
                    }
                  >
                    <td className="mono">{a.artifactId}</td>
                    <td>
                      <span className="badge badge-primary">{a.artifactType}</span>
                    </td>
                    <td>{a.version}</td>
                    <td>{a.confidence != null ? `${(a.confidence * 100).toFixed(0)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty message="No artifacts" />
        )}
      </Collapsible>

      <Collapsible title="Evidence Graph">
        {evidence && evidence.nodeCount > 0 ? (
          <div>
            <div className="stats-grid" style={{ marginBottom: 12 }}>
              <div className="stat-card">
                <div className="stat-value">{evidence.nodeCount}</div>
                <div className="stat-label">Nodes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{evidence.edgeCount}</div>
                <div className="stat-label">Edges</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{evidence.hasCycles ? "Yes" : "No"}</div>
                <div className="stat-label">Has Cycles</div>
              </div>
            </div>
            <JsonViewer data={evidence} label="Full Evidence Graph" />
          </div>
        ) : (
          <Empty message="No evidence data" />
        )}
      </Collapsible>
    </div>
  );
}

export default MissionDetail;
