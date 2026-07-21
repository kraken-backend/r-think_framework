import { useState } from "react";
import { useEvents, useEventsSince } from "../hooks.ts";
import { Loading, Empty, ErrorState } from "../components/Shared.tsx";

function EventTimeline() {
  const [mode, setMode] = useState<"poll" | "list">("list");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [missionFilter, setMissionFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const params: Record<string, string> = {};
  if (eventTypeFilter) params.eventType = eventTypeFilter;
  if (missionFilter) params.missionId = missionFilter;

  const { data, loading, error } = useEvents(
    Object.keys(params).length > 0 ? params : undefined
  );
  const { events: polledEvents, loading: polling } = useEventsSince(0);

  const events = mode === "list" ? (data?.items ?? []) : polledEvents;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Chronological runtime event timeline</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`btn${mode === "list" ? " btn-primary" : ""}`}
            onClick={() => setMode("list")}
          >
            Paginated List
          </button>
          <button
            className={`btn${mode === "poll" ? " btn-primary" : ""}`}
            onClick={() => setMode("poll")}
          >
            Live Polling (SSE)
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="filter-select"
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          aria-label="Filter by event type"
        >
          <option value="">All Event Types</option>
          <option value="MISSION_CREATED">MISSION_CREATED</option>
          <option value="STATE_CHANGED">STATE_CHANGED</option>
          <option value="ARTIFACT_REGISTERED">ARTIFACT_REGISTERED</option>
          <option value="ARTIFACT_REPLACED">ARTIFACT_REPLACED</option>
          <option value="EVIDENCE_CREATED">EVIDENCE_CREATED</option>
          <option value="CONTRADICTION_DETECTED">CONTRADICTION_DETECTED</option>
          <option value="AUTHORITY_GRANTED">AUTHORITY_GRANTED</option>
          <option value="AUTHORITY_DENIED">AUTHORITY_DENIED</option>
          <option value="EXECUTION_STARTED">EXECUTION_STARTED</option>
          <option value="EXECUTION_COMPLETED">EXECUTION_COMPLETED</option>
        </select>
        <input
          className="filter-input"
          type="text"
          placeholder="Filter by Mission ID..."
          value={missionFilter}
          onChange={(e) => setMissionFilter(e.target.value)}
          aria-label="Filter by mission ID"
        />
        {mode === "poll" && polling && (
          <span style={{ fontSize: 12, color: "var(--color-success)" }}>
            ● Polling...
          </span>
        )}
      </div>

      {mode === "list" && loading && <Loading />}
      {mode === "list" && error && <ErrorState message={error} />}
      {!loading && events.length === 0 && <Empty message="No events found" />}

      {events.length > 0 && (
        <div className="timeline">
          {events.map((e) => (
            <div
              key={e.eventId}
              className={`timeline-item${
                selectedEvent === e.eventId ? " current" : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() =>
                setSelectedEvent(
                  selectedEvent === e.eventId ? null : e.eventId
                )
              }
              role="button"
              tabIndex={0}
              onKeyDown={(ev) =>
                ev.key === "Enter" &&
                setSelectedEvent(
                  selectedEvent === e.eventId ? null : e.eventId
                )
              }
            >
              <div className="timeline-event-type">
                <span className="badge badge-info">{e.eventType}</span>
                <span style={{ marginLeft: 8, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  #{e.globalPosition}
                </span>
              </div>
              <div className="timeline-event-meta">
                {e.eventId}{" "}
                {"aggregateType" in e ? `· ${e.aggregateType}` : ""}
                {"actor" in e ? `· ${e.actor.id} (${e.actor.role})` : ""} ·{" "}
                {new Date(e.timestamp).toLocaleString()}
              </div>
              {selectedEvent === e.eventId && (
                <div className="timeline-event-payload">
                  Event ID: {e.eventId}
                  {"\n"}
                  Mission: {e.missionId}
                  {"\n"}
                  Aggregate: {e.aggregateId}
                  {"\n"}
                  {"sequence" in e ? `Sequence: ${e.sequence}` : ""}
                  {"\n"}
                  Global Position: {e.globalPosition}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && data && mode === "list" && (
        <div style={{ marginTop: 12, fontSize: 13, color: "var(--color-text-muted)" }}>
          Total: {data.total} events | Page {data.page} | Has more:{" "}
          {data.hasMore ? "Yes" : "No"}
        </div>
      )}
    </div>
  );
}

export default EventTimeline;
