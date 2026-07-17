/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Persistence (RT-006-C1 revised)
// Blueprint Reference: RTHINK-BP-001 §19
// Mission: RTHINK-RT-006-C1 (Durability Boundary, Global Ordering, Governance)
//
// Persistence composes three explicitly-separated concerns:
//   1. EventStore            — authoritative immutable event history
//   2. SnapshotStore         — snapshot OPTIMIZATION (SnapshotStorageAdapter)
//   3. MaterializedViewStore — derived current-state views (NOT authoritative)
//
// Responsibility separation (RT-006-C1):
//   - append / appendBatch delegate to the EventStore (canonical event log).
//   - Materialized views are derived state; clearing/removing a view NEVER
//     deletes events; writing a view NEVER appends events.

import { EventStore } from "./event-store.js";
import { InMemorySnapshotStorageAdapter } from "./storage-adapters.js";
import { InMemoryMaterializedViewStore } from "./materialized-view-store.js";
import type {
  MaterializedViewRecord,
  MaterializedViewStore,
  Snapshot,
  SnapshotStorageAdapter,
  RuntimeEvent,
} from "../contracts/index.js";

const PERSISTENCE_VERSION = "rt-006-c1-v1.0";

export { PERSISTENCE_VERSION };

// ─── Persistence ───────────────────────────────────────────────────────────────

export class Persistence {
  private eventStore: EventStore;
  private snapshotStore: SnapshotStorageAdapter;
  private viewStore: MaterializedViewStore;

  constructor(
    eventStore?: EventStore,
    snapshotStore?: SnapshotStorageAdapter,
    viewStore?: MaterializedViewStore
  ) {
    this.eventStore = eventStore ?? new EventStore();
    this.snapshotStore = snapshotStore ?? new InMemorySnapshotStorageAdapter();
    this.viewStore = viewStore ?? new InMemoryMaterializedViewStore();
  }

  getEventStore(): EventStore {
    return this.eventStore;
  }

  getSnapshotStore(): SnapshotStorageAdapter {
    return this.snapshotStore;
  }

  getMaterializedViewStore(): MaterializedViewStore {
    return this.viewStore;
  }

  // ─── Event log (delegate to EventStore) ────────────────────────────────────

  append(event: RuntimeEvent): { valid: boolean; errors: string[] } {
    return this.eventStore.appendEvent(event);
  }

  appendBatch(
    events: RuntimeEvent[]
  ): { valid: boolean; errors: string[]; accepted: number; rejected: number } {
    return this.eventStore.appendEvents(events);
  }

  // ─── Materialized view (derived state) ──────────────────────────────────────

  /**
   * Write a derived current-state record. NEVER appends an event.
   * `derivedFromGlobalPosition` records provenance for rebuild-from-replay.
   * Returns a deep copy of the stored record.
   */
  putRecord(record: MaterializedViewRecord): MaterializedViewRecord {
    this.viewStore.put(record);
    return this.viewStore.load(record.recordId)!;
  }

  loadRecord(recordId: string): MaterializedViewRecord | undefined {
    return this.viewStore.load(recordId);
  }

  recordExists(recordId: string): boolean {
    return this.viewStore.exists(recordId);
  }

  removeRecord(recordId: string): boolean {
    return this.viewStore.remove(recordId);
  }

  listRecords(): MaterializedViewRecord[] {
    return this.viewStore.list();
  }

  clearRecords(): void {
    this.viewStore.clear();
  }

  countRecords(): number {
    return this.viewStore.count();
  }

  // ─── Snapshot pass-through (optimization only) ──────────────────────────────

  saveSnapshot(snapshot: Snapshot): void {
    this.snapshotStore.save(snapshot);
  }

  loadSnapshot(snapshotId: string): Snapshot | undefined {
    return this.snapshotStore.load(snapshotId);
  }

  listSnapshotsByAggregate(aggregateId: string): Snapshot[] {
    return this.snapshotStore.listByAggregate(aggregateId);
  }

  deleteSnapshot(snapshotId: string): boolean {
    return this.snapshotStore.delete(snapshotId);
  }

  // ─── Convenience reads (delegate to EventStore) ─────────────────────────────

  loadEvent(eventId: string): RuntimeEvent | undefined {
    return this.eventStore.loadEvent(eventId);
  }

  loadMission(missionId: string): RuntimeEvent[] {
    return this.eventStore.loadMission(missionId);
  }

  loadAggregate(aggregateId: string): RuntimeEvent[] {
    return this.eventStore.loadAggregate(aggregateId);
  }

  stream(): RuntimeEvent[] {
    return this.eventStore.stream();
  }

  countEvents(): number {
    return this.eventStore.count();
  }
}
