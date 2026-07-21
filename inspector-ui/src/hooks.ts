import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "./api/client.ts";
import type { StreamEvent } from "./api/client.ts";

// ─── Generic Fetch Hook ─────────────────────────────────────────────────────

export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ─── Mission Hooks ──────────────────────────────────────────────────────────

export function useMissions(params?: Record<string, string>) {
  return useFetch(() => api.listMissions(params), [JSON.stringify(params)]);
}

export function useMission(missionId: string | null) {
  return useFetch(
    () => (missionId ? api.getMission(missionId) : Promise.resolve(null)),
    [missionId]
  );
}

export function useMissionEvents(missionId: string | null) {
  return useFetch(
    () =>
      missionId
        ? api.getMissionEvents(missionId)
        : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 50, hasMore: false }),
    [missionId]
  );
}

export function useMissionArtifacts(missionId: string | null) {
  return useFetch(
    () =>
      missionId
        ? api.getMissionArtifacts(missionId)
        : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 50, hasMore: false }),
    [missionId]
  );
}

export function useMissionEvidence(missionId: string | null) {
  return useFetch(
    () =>
      missionId
        ? api.getMissionEvidence(missionId)
        : Promise.resolve({
            nodes: [],
            edges: [],
            nodeCount: 0,
            edgeCount: 0,
            hasCycles: false,
            exportedAt: "",
          }),
    [missionId]
  );
}

export function useMissionAuthority(missionId: string | null) {
  return useFetch(
    () => (missionId ? api.getMissionAuthority(missionId) : Promise.resolve(null)),
    [missionId]
  );
}

export function useMissionContradictions(missionId: string | null) {
  return useFetch(
    () =>
      missionId
        ? api.getMissionContradictions(missionId)
        : Promise.resolve(null),
    [missionId]
  );
}

export function useReplayMission(missionId: string | null) {
  return useFetch(
    () => (missionId ? api.replayMission(missionId) : Promise.resolve(null)),
    [missionId]
  );
}

// ─── Event Hooks ────────────────────────────────────────────────────────────

export function useEvents(params?: Record<string, string>) {
  return useFetch(() => api.listEvents(params), [JSON.stringify(params)]);
}

export function useEvent(eventId: string | null) {
  return useFetch(
    () => (eventId ? api.getEvent(eventId) : Promise.resolve(null)),
    [eventId]
  );
}

export function useEventsSince(globalPosition: number) {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastPositionRef = useRef(globalPosition);

  const poll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const newEvents = await api.getEventsSince(lastPositionRef.current);
      if (newEvents.length > 0) {
        setEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.eventId));
          const unique = newEvents.filter((e) => !existingIds.has(e.eventId));
          return [...prev, ...unique];
        });
        lastPositionRef.current =
          newEvents[newEvents.length - 1]!.globalPosition;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Poll error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(poll, 3000);
    poll();
    return () => clearInterval(interval);
  }, [poll]);

  return { events, loading, error, lastPosition: lastPositionRef.current };
}

// ─── Artifact Hooks ─────────────────────────────────────────────────────────

export function useArtifacts(params?: Record<string, string>) {
  return useFetch(() => api.listArtifacts(params), [JSON.stringify(params)]);
}

export function useArtifact(artifactId: string | null) {
  return useFetch(
    () => (artifactId ? api.getArtifact(artifactId) : Promise.resolve(null)),
    [artifactId]
  );
}

export function useArtifactHistory(artifactId: string | null) {
  return useFetch(
    () =>
      artifactId
        ? api.getArtifactHistory(artifactId)
        : Promise.resolve([]),
    [artifactId]
  );
}

// ─── Evidence Hooks ─────────────────────────────────────────────────────────

export function useEvidenceGraph() {
  return useFetch(() => api.getEvidenceGraph());
}

export function useEvidenceValidation() {
  return useFetch(() => api.validateEvidence());
}

// ─── Router Hooks ───────────────────────────────────────────────────────────

export function useMethods() {
  return useFetch(() => api.listMethods());
}

export function useProviders() {
  return useFetch(() => api.listProviders());
}

export function useCapabilities() {
  return useFetch(() => api.listCapabilities());
}

// ─── Health & Stats Hooks ───────────────────────────────────────────────────

export function useHealth() {
  return useFetch(() => api.getHealth());
}

export function useStatistics() {
  return useFetch(() => api.getStatistics());
}

// ─── Snapshot Hooks ─────────────────────────────────────────────────────────

export function useSnapshots(aggregateId?: string) {
  return useFetch(() => api.listSnapshots(aggregateId), [aggregateId]);
}

export function useSnapshot(snapshotId: string | null) {
  return useFetch(
    () => (snapshotId ? api.getSnapshot(snapshotId) : Promise.resolve(null)),
    [snapshotId]
  );
}
