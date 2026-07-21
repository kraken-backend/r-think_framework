import { Link } from "react-router-dom";
import { useMissions } from "../hooks.ts";
import { Loading, Empty, ErrorState } from "../components/Shared.tsx";

function AuthorityView() {
  const { data: missions, loading, error } = useMissions();

  const authorityMissions =
    missions?.items.filter(
      (m) =>
        m.authorityStatus === "PENDING" ||
        m.authorityStatus === "GRANTED" ||
        m.authorityStatus === "DENIED" ||
        m.authorityStatus === "ESCALATED"
    ) ?? [];

  const allMissions = missions?.items ?? [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Authority & Contradictions</h1>
          <p className="page-subtitle">
            Authority status, references, and contradiction tracking
          </p>
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-value">
                {authorityMissions.length}
              </div>
              <div className="stat-label">Authority Pending/Active</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {allMissions.reduce((sum, m) => sum + m.contradictionCount, 0)}
              </div>
              <div className="stat-label">Total Contradictions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {allMissions.filter((m) => m.authorityStatus === "GRANTED").length}
              </div>
              <div className="stat-label">Authority Granted</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {allMissions.filter((m) => m.authorityStatus === "DENIED").length}
              </div>
              <div className="stat-label">Authority Denied</div>
            </div>
          </div>

          {allMissions.length === 0 ? (
            <Empty message="No missions available" />
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Mission</th>
                    <th>Authority Status</th>
                    <th>Contradictions</th>
                    <th>State</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allMissions.map((m) => (
                    <tr
                      key={m.missionId}
                    >
                      <td className="mono">{m.missionId}</td>
                      <td>
                        <span
                          className={`badge ${
                            m.authorityStatus === "GRANTED"
                              ? "badge-success"
                              : m.authorityStatus === "DENIED"
                              ? "badge-danger"
                              : m.authorityStatus === "PENDING"
                              ? "badge-warning"
                              : m.authorityStatus === "ESCALATED"
                              ? "badge-danger"
                              : "badge-info"
                          }`}
                        >
                          {m.authorityStatus}
                        </span>
                      </td>
                      <td>{m.contradictionCount}</td>
                      <td>{m.currentState}</td>
                      <td>
                        <Link
                          to={`/missions/${m.missionId}`}
                          style={{ color: "var(--color-primary)", fontSize: 13 }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AuthorityView;
