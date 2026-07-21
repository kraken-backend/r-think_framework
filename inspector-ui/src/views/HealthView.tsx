import { useHealth, useStatistics, useMethods, useProviders, useCapabilities } from "../hooks.ts";
import { Loading, Empty, ErrorState, JsonViewer } from "../components/Shared.tsx";

function HealthView() {
  const { data: health, loading: healthLoading, error: healthError } = useHealth();
  const { data: stats, loading: statsLoading } = useStatistics();
  const { data: methods, loading: methodsLoading } = useMethods();
  const { data: providers, loading: providersLoading } = useProviders();
  const { data: capabilities, loading: capabilitiesLoading } = useCapabilities();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Runtime Observatory</h1>
          <p className="page-subtitle">
            Health, statistics, methods, providers, and capabilities
          </p>
        </div>
      </div>

      {/* ─── Health ────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Runtime Health</div>
        {healthLoading && <Loading />}
        {healthError && <ErrorState message={healthError} />}
        {health && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{health.totalEvents}</div>
              <div className="stat-label">Total Events</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{health.totalArtifacts}</div>
              <div className="stat-label">Total Artifacts</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{health.evidenceNodeCount}</div>
              <div className="stat-label">Evidence Nodes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{health.evidenceEdgeCount}</div>
              <div className="stat-label">Evidence Edges</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{health.snapshotCount}</div>
              <div className="stat-label">Snapshots</div>
            </div>
            <div className="stat-card">
              <div
                className="stat-value"
                style={{
                  color: health.graphIntegrity.valid
                    ? "var(--color-success)"
                    : "var(--color-danger)",
                }}
              >
                {health.graphIntegrity.valid ? "Valid" : "Invalid"}
              </div>
              <div className="stat-label">Graph Integrity</div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Statistics ────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Runtime Statistics</div>
        {statsLoading && <Loading />}
        {stats && (
          <>
            <div className="stats-grid" style={{ marginBottom: 16 }}>
              <div className="stat-card">
                <div className="stat-value">{stats.transitionCount}</div>
                <div className="stat-label">Transitions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.contradictionCount}</div>
                <div className="stat-label">Contradictions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.failureCount}</div>
                <div className="stat-label">Failures</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.recoveryCount}</div>
                <div className="stat-label">Recoveries</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.discoveryCount}</div>
                <div className="stat-label">Discoveries</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.evolutionCount}</div>
                <div className="stat-label">Evolutions</div>
              </div>
            </div>
            <JsonViewer data={stats} label="Full Statistics" />
          </>
        )}
      </div>

      {/* ─── Methods ───────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Registered Methods</div>
        {methodsLoading && <Loading />}
        {methods && methods.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Method ID</th>
                  <th>Display Name</th>
                  <th>Description</th>
                  <th>Required Capabilities</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m.methodId}>
                    <td className="mono">{m.methodId}</td>
                    <td>{m.displayName}</td>
                    <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.description}
                    </td>
                    <td>
                      {m.requiredCapabilities.map((c) => (
                        <span
                          key={c.capabilityId}
                          className="badge badge-info"
                          style={{ marginRight: 4 }}
                        >
                          {c.capabilityId}
                          {c.minVersion ? ` >=${c.minVersion}` : ""}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty message="No methods registered" />
        )}
      </div>

      {/* ─── Providers ─────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Registered Providers</div>
        {providersLoading && <Loading />}
        {providers && providers.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Provider ID</th>
                  <th>Display Name</th>
                  <th>Version</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Enabled</th>
                  <th>Supported Methods</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.providerId}>
                    <td className="mono">{p.providerId}</td>
                    <td>{p.displayName}</td>
                    <td>{p.version}</td>
                    <td>{p.priority}</td>
                    <td>
                      <span
                        className={`badge ${
                          p.status === "AVAILABLE"
                            ? "badge-success"
                            : p.status === "DISABLED"
                            ? "badge-warning"
                            : "badge-danger"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td>{p.enabled ? "Yes" : "No"}</td>
                    <td>{p.supportedMethods.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty message="No providers registered" />
        )}
      </div>

      {/* ─── Capabilities ──────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">Available Capabilities</div>
        {capabilitiesLoading && <Loading />}
        {capabilities && capabilities.length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {capabilities.map((c) => (
              <span key={c} className="badge badge-primary">
                {c}
              </span>
            ))}
          </div>
        ) : (
          <Empty message="No capabilities registered" />
        )}
      </div>
    </div>
  );
}

export default HealthView;
