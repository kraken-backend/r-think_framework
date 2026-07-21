import { useState } from "react";
import { useReplayMission, useSnapshots, useMissions } from "../hooks.ts";
import { Loading, Empty, JsonViewer } from "../components/Shared.tsx";

function ReplayView() {
  const { data: missions, loading: missionsLoading } = useMissions();
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const { data: replay, loading: replayLoading } = useReplayMission(selectedMission);
  const { data: snapshots, loading: snapshotsLoading } = useSnapshots();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Replay & Snapshots</h1>
          <p className="page-subtitle">
            Mission replay output and snapshot state reconstruction
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Mission Replay</div>
        <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 12 }}>
          Select a mission to view its deterministic replay output. This is a read-only
          observation — no mutation or runtime rewind occurs.
        </p>
        {missionsLoading ? (
          <Loading />
        ) : missions && missions.items.length > 0 ? (
          <div className="filter-bar">
            <select
              className="filter-select"
              value={selectedMission ?? ""}
              onChange={(e) => setSelectedMission(e.target.value || null)}
              aria-label="Select mission for replay"
            >
              <option value="">Select a mission...</option>
              {missions.items.map((m) => (
                <option key={m.missionId} value={m.missionId}>
                  {m.missionId} ({m.currentState})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Empty message="No missions available for replay" />
        )}
      </div>

      {selectedMission && replayLoading && <Loading />}

      {selectedMission && replay && (
        <div className="card-grid">
          <div className="card">
            <div className="card-title">Replay Result</div>
            <div className="data-row">
              <span className="data-label">Aggregate ID</span>
              <span className="data-value mono">{replay.aggregateId}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Event Count</span>
              <span className="data-value">{replay.eventCount}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Valid</span>
              <span
                className="data-value"
                style={{ color: replay.valid ? "var(--color-success)" : "var(--color-danger)" }}
              >
                {replay.valid ? "Yes" : "No"}
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Error Count</span>
              <span className="data-value">{replay.errorCount}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Exported At</span>
              <span className="data-value mono">
                {new Date(replay.exportedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Reconstructed State</div>
            <JsonViewer data={replay.state} />
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Snapshots</div>
        <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 12 }}>
          Snapshot-assisted replay produces the same result as full replay.
          Snapshots are optimization checkpoints, not runtime rewinds.
        </p>
        {snapshotsLoading ? (
          <Loading />
        ) : snapshots && snapshots.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Snapshot ID</th>
                  <th>Aggregate ID</th>
                  <th>Sequence</th>
                  <th>Global Position</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.snapshotId}>
                    <td className="mono">{s.snapshotId}</td>
                    <td className="mono">{s.aggregateId}</td>
                    <td>{s.sequence}</td>
                    <td>{s.globalPosition}</td>
                    <td className="mono">
                      {new Date(s.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty message="No snapshots created yet. Snapshots are created during replay optimization." />
        )}
      </div>
    </div>
  );
}

export default ReplayView;
