/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Storage Adapter Contracts (RT-006-C1)
// Blueprint Reference: RTHINK-BP-001 §19
// Mission: RTHINK-RT-006-C1 (Durability Boundary, Global Ordering, Governance)
//
// Explicit durability boundary. The canonical EventStore depends on adapter
// interfaces rather than owning undocumented Maps as its persistence identity.
//
// IMPORTANT — HONEST BACKEND NAMING:
//   InMemoryEventStorageAdapter is the CURRENT storage backend.
//   It is PROCESS-LOCAL and NON-DURABLE. A process restart loses its contents.
//   Durable adapters (PostgreSQL, NATS, …) are FUTURE work. The boundary exists
//   now; the durable implementation does not. Replay is authoritative only over
//   the events available from the configured storage adapter.

import type {
  EventStorageAdapter,
  SnapshotStorageAdapter,
  RuntimeEvent,
  Snapshot,
} from "../contracts/index.js";

const STORAGE_ADAPTER_VERSION = "rt-006-c1-v1.0";

export { STORAGE_ADAPTER_VERSION };

// ─── Deep copy helper (immutability guarantee) ────────────────────────────────

function cloneEvent(event: RuntimeEvent): RuntimeEvent {
  return {
    ...event,
    actor: { ...event.actor },
    authority: { ...event.authority },
    payload: structuredClone(event.payload),
    metadata: structuredClone(event.metadata),
  };
}

function cloneSnapshot(snapshot: Snapshot): Snapshot {
  return {
    ...snapshot,
    runtimeState: structuredClone(snapshot.runtimeState),
    metadata: structuredClone(snapshot.metadata),
  };
}

// ─── In-Memory Event Storage Adapter ──────────────────────────────────────────

export class InMemoryEventStorageAdapter implements EventStorageAdapter {
  private events: Map<string, RuntimeEvent> = new Map();
  private byMission: Map<string, string[]> = new Map();
  private byAggregate: Map<string, string[]> = new Map();

  /** Process-local, NON-DURABLE. Mirrors the canonical store's global position. */
  append(event: RuntimeEvent): void {
    const stored = cloneEvent(event);
    this.events.set(stored.eventId, stored);
    this.pushIndex(this.byMission, stored.missionId, stored.eventId);
    this.pushIndex(this.byAggregate, stored.aggregateId, stored.eventId);
  }

  appendBatch(events: RuntimeEvent[]): void {
    for (const e of events) this.append(e);
  }

  loadEvent(eventId: string): RuntimeEvent | undefined {
    const e = this.events.get(eventId);
    return e ? cloneEvent(e) : undefined;
  }

  loadAll(): RuntimeEvent[] {
    return Array.from(this.events.values()).map((e) => cloneEvent(e));
  }

  loadMission(missionId: string): RuntimeEvent[] {
    const ids = this.byMission.get(missionId);
    if (!ids) return [];
    return ids.map((id) => cloneEvent(this.events.get(id)!)).filter(Boolean);
  }

  loadAggregate(aggregateId: string): RuntimeEvent[] {
    const ids = this.byAggregate.get(aggregateId);
    if (!ids) return [];
    return ids.map((id) => cloneEvent(this.events.get(id)!)).filter(Boolean);
  }

  count(): number {
    return this.events.size;
  }

  private pushIndex(index: Map<string, string[]>, key: string, id: string): void {
    const list = index.get(key);
    if (list) list.push(id);
    else index.set(key, [id]);
  }
}

// ─── In-Memory Snapshot Storage Adapter ───────────────────────────────────────

export class InMemorySnapshotStorageAdapter implements SnapshotStorageAdapter {
  private snapshots: Map<string, Snapshot> = new Map();

  save(snapshot: Snapshot): void {
    this.snapshots.set(snapshot.snapshotId, cloneSnapshot(snapshot));
  }

  load(snapshotId: string): Snapshot | undefined {
    const s = this.snapshots.get(snapshotId);
    return s ? cloneSnapshot(s) : undefined;
  }

  list(): Snapshot[] {
    return Array.from(this.snapshots.values()).map((s) => cloneSnapshot(s));
  }

  listByAggregate(aggregateId: string): Snapshot[] {
    return Array.from(this.snapshots.values())
      .filter((s) => s.aggregateId === aggregateId)
      .map((s) => cloneSnapshot(s));
  }

  delete(snapshotId: string): boolean {
    return this.snapshots.delete(snapshotId);
  }
}

// ─── Test Fake Event Storage Adapter ──────────────────────────────────────────
// Injectable alternate adapter used to prove the EventStore depends on the
// adapter CONTRACT, not on a concrete in-memory implementation.

export class FakeEventStorageAdapter implements EventStorageAdapter {
  private events: Map<string, RuntimeEvent> = new Map();
  public appendCalls = 0;
  public appendBatchCalls = 0;

  append(event: RuntimeEvent): void {
    this.appendCalls += 1;
    this.events.set(event.eventId, cloneEvent(event));
  }

  appendBatch(events: RuntimeEvent[]): void {
    this.appendBatchCalls += 1;
    for (const e of events) this.append(e);
  }

  loadEvent(eventId: string): RuntimeEvent | undefined {
    const e = this.events.get(eventId);
    return e ? cloneEvent(e) : undefined;
  }

  loadAll(): RuntimeEvent[] {
    return Array.from(this.events.values()).map((e) => cloneEvent(e));
  }

  loadMission(missionId: string): RuntimeEvent[] {
    return this.loadAll().filter((e) => e.missionId === missionId);
  }

  loadAggregate(aggregateId: string): RuntimeEvent[] {
    return this.loadAll().filter((e) => e.aggregateId === aggregateId);
  }

  count(): number {
    return this.events.size;
  }
}
