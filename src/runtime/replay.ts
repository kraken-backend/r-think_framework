/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Replay Engine (RT-006-C1 revised)
// Blueprint Reference: RTHINK-BP-001 §19
// Mission: RTHINK-RT-006-C1 (Durability Boundary, Global Ordering, Governance)
//
// Reconstructs runtime state using ONLY events. Deterministic: replaying the
// same event set twice produces identical output. Snapshots are an OPTIMIZATION
// only; replay from the event log remains authoritative.
//
// RT-006-C1 ordering distinction:
//   - replayAggregate uses AGGREGATE ordering (sequence → timestamp → eventId)
//   - replayMission / full replay / cross-aggregate reads use GLOBAL ordering
//     (globalPosition)
// The engine depends on a SnapshotStorageAdapter for snapshot storage.

import { EventStore } from "./event-store.js";
import { InMemorySnapshotStorageAdapter } from "./storage-adapters.js";
import { AggregateType, RuntimeEventType } from "../contracts/types.js";
import type {
  RuntimeEvent,
  Snapshot,
  ReplayValidationResult,
  ReplayIssue,
  ReplayResult,
  SnapshotStorageAdapter,
} from "../contracts/index.js";

const REPLAY_VERSION = "rt-006-c1-v1.0";

export { REPLAY_VERSION };

export type StateReducer = (
  state: Record<string, unknown>,
  event: RuntimeEvent
) => Record<string, unknown>;

const DEFAULT_REDUCER: StateReducer = (state, event) => {
  const next = { ...state };
  next[`${event.eventType}`] = event.payload;
  next._lastEvent = event.eventId;
  next._lastSequence = event.sequence;
  next._lastGlobalPosition = event.globalPosition;
  next._eventCount = ((next._eventCount as number) ?? 0) + 1;
  return next;
};

const VALID_AGGREGATE_TYPES = new Set<string>(Object.values(AggregateType));
const VALID_EVENT_TYPES = new Set<string>(Object.values(RuntimeEventType));

// ─── Replay Engine ─────────────────────────────────────────────────────────────

export class ReplayEngine {
  private eventStore: EventStore;
  private snapshots: SnapshotStorageAdapter;

  constructor(eventStore: EventStore, snapshots?: SnapshotStorageAdapter) {
    this.eventStore = eventStore;
    this.snapshots = snapshots ?? new InMemorySnapshotStorageAdapter();
  }

  // ─── Validation ────────────────────────────────────────────────────────

  validateReplay(events: RuntimeEvent[]): ReplayValidationResult {
    const errors: ReplayIssue[] = [];

    if (events.length === 0) {
      return { valid: true, errors: [] };
    }

    const byAggregate = new Map<string, RuntimeEvent[]>();
    for (const e of events) {
      const list = byAggregate.get(e.aggregateId) ?? [];
      list.push(e);
      byAggregate.set(e.aggregateId, list);
    }

    for (const [aggregateId, aggEvents] of byAggregate) {
      // Within an aggregate, the PRESENTED order must already be canonically
      // ordered (sequence → timestamp → eventId). A non-increasing pair means
      // the events were supplied out of canonical order (INVALID_ORDERING).
      for (let i = 1; i < aggEvents.length; i++) {
        const a = aggEvents[i - 1]!;
        const b = aggEvents[i]!;
        const cmp =
          a.sequence - b.sequence ||
          (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0) ||
          (a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0);
        if (cmp > 0) {
          errors.push({
            code: "INVALID_ORDERING",
            message: `Event ${b.eventId} is ordered before ${a.eventId} despite canonical order within aggregate ${aggregateId}`,
            eventId: b.eventId,
            sequence: b.sequence,
            aggregateId,
          });
        }
      }

      const ordered = [...aggEvents].sort((a, b) => a.sequence - b.sequence);
      let prev = 0;
      const seen = new Set<number>();
      for (const e of ordered) {
        if (!VALID_AGGREGATE_TYPES.has(e.aggregateType)) {
          errors.push({
            code: "INVALID_AGGREGATE",
            message: `Event ${e.eventId} has invalid aggregateType ${String(e.aggregateType)}`,
            eventId: e.eventId,
            sequence: e.sequence,
            aggregateId,
          });
        }
        if (!VALID_EVENT_TYPES.has(e.eventType)) {
          errors.push({
            code: "INVALID_AGGREGATE",
            message: `Event ${e.eventId} has invalid eventType ${String(e.eventType)}`,
            eventId: e.eventId,
            sequence: e.sequence,
            aggregateId,
          });
        }
        if (!Number.isInteger(e.sequence) || e.sequence < 1) {
          errors.push({
            code: "INVALID_AGGREGATE",
            message: `Event ${e.eventId} has invalid sequence ${e.sequence}`,
            eventId: e.eventId,
            sequence: e.sequence,
            aggregateId,
          });
        } else if (e.sequence !== prev + 1) {
          if (e.sequence <= prev) {
            errors.push({
              code: "DUPLICATE_SEQUENCE",
              message: `Duplicate or non-increasing sequence ${e.sequence} for aggregate ${aggregateId}`,
              eventId: e.eventId,
              sequence: e.sequence,
              aggregateId,
            });
          } else {
            errors.push({
              code: "MISSING_SEQUENCE",
              message: `Missing sequence(s) between ${prev} and ${e.sequence} for aggregate ${aggregateId}`,
              sequence: e.sequence,
              aggregateId,
            });
          }
        }
        if (seen.has(e.sequence)) {
          errors.push({
            code: "DUPLICATE_SEQUENCE",
            message: `Duplicate sequence ${e.sequence} for aggregate ${aggregateId}`,
            eventId: e.eventId,
            sequence: e.sequence,
            aggregateId,
          });
        }
        seen.add(e.sequence);
        prev = e.sequence;
      }
    }

    // Global position integrity (store-wide). Events that have not yet been
    // assigned a position (globalPosition === 0) are treated as unpersisted.
    // If ANY event in the batch carries an assigned position while others do
    // not, the unassigned ones are flagged MISSING_GLOBAL_POSITION — a partial
    // assignment is never a valid global history.
    const positioned = events.filter((e) => typeof e.globalPosition === "number" && e.globalPosition >= 1);
    const unpositioned = events.filter((e) => !(typeof e.globalPosition === "number" && e.globalPosition >= 1));
    if (positioned.length > 0 && unpositioned.length > 0) {
      for (const e of unpositioned) {
        errors.push({
          code: "MISSING_GLOBAL_POSITION",
          message: `Event ${e.eventId} has no globalPosition while peers are assigned`,
          eventId: e.eventId,
          aggregateId: e.aggregateId,
        });
      }
    }
    if (positioned.length > 0) {
      const globalPositions = positioned.map((e) => e.globalPosition).sort((a, b) => a - b);
      const posSeen = new Set<number>();
      let prevPos = 0;
      for (const gp of globalPositions) {
        if (posSeen.has(gp)) {
          const offender = events.find((e) => e.globalPosition === gp)!;
          errors.push({
            code: "DUPLICATE_GLOBAL_POSITION",
            message: `Duplicate globalPosition ${gp} (event ${offender.eventId})`,
            eventId: offender.eventId,
            globalPosition: gp,
          });
        } else if (gp !== prevPos + 1) {
          const offender = events.find((e) => e.globalPosition === gp)!;
          errors.push({
            code: "INVALID_GLOBAL_POSITION_ORDER",
            message: `Global positions not contiguous at ${gp} (expected ${prevPos + 1})`,
            eventId: offender.eventId,
            globalPosition: gp,
          });
        }
        posSeen.add(gp);
        prevPos = gp;
      }
    }

    for (const e of events) {
      if (!e.schemaVersion || e.schemaVersion.trim() === "") {
        errors.push({
          code: "INVALID_SCHEMA_VERSION",
          message: `Event ${e.eventId} has empty schemaVersion`,
          eventId: e.eventId,
          aggregateId: e.aggregateId,
        });
      }
    }

    // Causation chain validation (per mission root presence).
    const byId = new Map(events.map((e) => [e.eventId, e]));
    const missionEvents = new Map<string, RuntimeEvent[]>();
    for (const e of events) {
      const list = missionEvents.get(e.missionId) ?? [];
      list.push(e);
      missionEvents.set(e.missionId, list);
      if (e.causationId) {
        const parent = byId.get(e.causationId);
        if (!parent) {
          errors.push({
            code: "ORPHAN_EVENT",
            message: `Event ${e.eventId} references missing causationId ${e.causationId}`,
            eventId: e.eventId,
            aggregateId: e.aggregateId,
          });
        } else if (parent.missionId !== e.missionId) {
          errors.push({
            code: "INVALID_CAUSATION_CHAIN",
            message: `Event ${e.eventId} causation chain crosses mission boundary`,
            eventId: e.eventId,
            aggregateId: e.aggregateId,
          });
        }
      }
    }
    for (const [missionId, list] of missionEvents) {
      const hasRoot = list.some((e) => !e.causationId);
      if (!hasRoot) {
        errors.push({
          code: "MISSING_CAUSATION_ROOT",
          message: `Mission ${missionId} has no causation root event`,
          aggregateId: missionId,
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ─── Replay ────────────────────────────────────────────────────────────

  private foldAggregate(
    aggregateId: string,
    events: RuntimeEvent[],
    reducer: StateReducer
  ): ReplayResult {
    const ordered = [...events].sort(
      (a, b) =>
        a.sequence - b.sequence ||
        (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0) ||
        (a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0)
    );
    const validation = this.validateReplay(ordered);
    let state: Record<string, unknown> = {};
    for (const e of ordered) state = reducer(state, e);
    return {
      aggregateId,
      events: ordered.map((e) => ({ ...e })),
      state,
      validation,
    };
  }

  private foldGlobal(
    aggregateId: string,
    events: RuntimeEvent[],
    reducer: StateReducer
  ): ReplayResult {
    const ordered = [...events].sort((a, b) => a.globalPosition - b.globalPosition);
    const validation = this.validateReplay(ordered);
    let state: Record<string, unknown> = {};
    for (const e of ordered) state = reducer(state, e);
    return {
      aggregateId,
      events: ordered.map((e) => ({ ...e })),
      state,
      validation,
    };
  }

  replayMission(missionId: string, reducer: StateReducer = DEFAULT_REDUCER): ReplayResult {
    // GLOBAL ordering for cross-aggregate mission replay.
    return this.foldGlobal(missionId, this.eventStore.loadMission(missionId), reducer);
  }

  replayAggregate(aggregateId: string, reducer: StateReducer = DEFAULT_REDUCER): ReplayResult {
    // AGGREGATE ordering for single-aggregate replay.
    return this.foldAggregate(aggregateId, this.eventStore.loadAggregate(aggregateId), reducer);
  }

  replayUntil(
    aggregateId: string,
    sequence: number,
    reducer: StateReducer = DEFAULT_REDUCER
  ): ReplayResult {
    const events = this.eventStore
      .loadAggregate(aggregateId)
      .filter((e) => e.sequence <= sequence);
    return this.foldAggregate(aggregateId, events, reducer);
  }

  replayFrom(
    aggregateId: string,
    sequence: number,
    reducer: StateReducer = DEFAULT_REDUCER
  ): ReplayResult {
    const events = this.eventStore
      .loadAggregate(aggregateId)
      .filter((e) => e.sequence >= sequence);
    return this.foldAggregate(aggregateId, events, reducer);
  }

  replayRange(
    aggregateId: string,
    from: number,
    to: number,
    reducer: StateReducer = DEFAULT_REDUCER
  ): ReplayResult {
    const events = this.eventStore
      .loadAggregate(aggregateId)
      .filter((e) => e.sequence >= from && e.sequence <= to);
    return this.foldAggregate(aggregateId, events, reducer);
  }

  // ─── Snapshots (optimization only) ─────────────────────────────────────

  createSnapshot(
    aggregateId: string,
    runtimeState: Record<string, unknown>,
    metadata: Record<string, unknown> = {}
  ): Snapshot {
    const agg = this.eventStore.loadAggregate(aggregateId);
    const last = agg.sort((a, b) => b.globalPosition - a.globalPosition)[0];
    const globalPosition = last ? last.globalPosition : 0;
    const sequence = last ? last.sequence : 0;
    const snapshot: Snapshot = {
      snapshotId: `snap-${aggregateId}-${globalPosition}-${Date.now()}-${Math.floor(
        Math.random() * 1e6
      )}`,
      aggregateId,
      sequence,
      globalPosition,
      timestamp: new Date().toISOString(),
      runtimeState: { ...runtimeState },
      metadata: { ...metadata },
    };
    this.snapshots.save(snapshot);
    return {
      ...snapshot,
      runtimeState: { ...snapshot.runtimeState },
      metadata: { ...snapshot.metadata },
    };
  }

  loadSnapshot(snapshotId: string): Snapshot | undefined {
    const s = this.snapshots.load(snapshotId);
    return s
      ? { ...s, runtimeState: { ...s.runtimeState }, metadata: { ...s.metadata } }
      : undefined;
  }

  listSnapshots(): Snapshot[] {
    return this.snapshots
      .list()
      .map((s) => ({ ...s, runtimeState: { ...s.runtimeState }, metadata: { ...s.metadata } }));
  }

  deleteSnapshot(snapshotId: string): boolean {
    return this.snapshots.delete(snapshotId);
  }

  /**
   * Replay from a snapshot baseline, then apply subsequent events
   * (sequence > snapshot.sequence). Snapshot is optimization only; the result
   * equals a full authoritative replay.
   */
  replayFromSnapshot(
    snapshotId: string,
    reducer: StateReducer = DEFAULT_REDUCER
  ): ReplayResult | undefined {
    const snap = this.snapshots.load(snapshotId);
    if (!snap) return undefined;
    const baseline: Record<string, unknown> = { ...snap.runtimeState };
    const subsequent = this.eventStore
      .loadAggregate(snap.aggregateId)
      .filter((e) => e.sequence > snap.sequence);
    const ordered = [...subsequent].sort(
      (a, b) =>
        a.sequence - b.sequence ||
        (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0) ||
        (a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0)
    );
    let state = baseline;
    for (const e of ordered) state = reducer(state, e);
    return {
      aggregateId: snap.aggregateId,
      events: ordered.map((e) => ({ ...e })),
      state,
      validation: this.validateReplay(ordered),
    };
  }
}
