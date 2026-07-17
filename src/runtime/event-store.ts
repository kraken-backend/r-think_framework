/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Event Store (RT-006-C1 revised)
// Blueprint Reference: RTHINK-BP-001 §19
// Mission: RTHINK-RT-006-C1 (Durability Boundary, Global Ordering, Governance)
//
// The Event Store is the authoritative, immutable operational history.
// It is NOT a CRUD layer and NOT a database abstraction. Events are
// append-only; correction creates new events, never mutation.
//
// RT-006-C1 corrections:
//  - Depends on an EventStorageAdapter CONTRACT (not undocumented Maps).
//  - Owns globalPosition assignment (monotonic, store-wide, immutable).
//  - Separates GLOBAL ordering (globalPosition) from AGGREGATE ordering
//    (sequence → timestamp → eventId).
//  - Atomic batch append: validate all, assign positions, append all or none.
//  - Honest backend naming: current adapter is process-local, NON-DURABLE.

import { AggregateType, RuntimeEventType, AuthorityStatus } from "../contracts/types.js";
import type { RuntimeEvent, EventStorageAdapter } from "../contracts/index.js";
import { InMemoryEventStorageAdapter } from "./storage-adapters.js";

const EVENT_STORE_VERSION = "rt-006-c1-v1.0";

export { EVENT_STORE_VERSION };

const VALID_AGGREGATE_TYPES = new Set<string>(Object.values(AggregateType));
const VALID_EVENT_TYPES = new Set<string>(Object.values(RuntimeEventType));
const VALID_AUTHORITY_STATUSES = new Set<string>(Object.values(AuthorityStatus));

// ─── Event Store ───────────────────────────────────────────────────────────────

export class EventStore {
  private adapter: EventStorageAdapter;
  /** Store-wide monotonic counter; the store owns globalPosition assignment. */
  private nextGlobalPosition = 1;
  /** Last contiguous sequence per aggregate (for append-time validation). */
  private lastSequenceByAggregate: Map<string, number> = new Map();

  constructor(adapter?: EventStorageAdapter) {
    this.adapter = adapter ?? new InMemoryEventStorageAdapter();
    // Rehydrate position/sequence counters from an adapter that already has data
    // (e.g. a durable adapter loaded from disk in a future mission).
    this.rehydrateCounters();
  }

  private rehydrateCounters(): void {
    const all = this.adapter.loadAll();
    let maxPos = 0;
    const seqMax = new Map<string, number>();
    for (const e of all) {
      if (e.globalPosition > maxPos) maxPos = e.globalPosition;
      const s = seqMax.get(e.aggregateId);
      if (s === undefined || e.sequence > s) seqMax.set(e.aggregateId, e.sequence);
    }
    this.nextGlobalPosition = maxPos + 1;
    this.lastSequenceByAggregate = seqMax;
  }

  getAdapter(): EventStorageAdapter {
    return this.adapter;
  }

  // ─── Append (single) ──────────────────────────────────────────────────────

  appendEvent(event: RuntimeEvent): { valid: boolean; errors: string[] } {
    const result = this.appendEvents([event]);
    return { valid: result.valid, errors: result.errors };
  }

  // ─── Append (atomic batch) ────────────────────────────────────────────────

  /**
   * Atomic: validate the ENTIRE batch first (detect all conflicts), assign
   * global positions, then append ALL. If any event fails, append NONE and no
   * global position is consumed.
   */
  appendEvents(events: RuntimeEvent[]): {
    valid: boolean;
    errors: string[];
    accepted: number;
    rejected: number;
  } {
    const errors: string[] = [];
    const acceptedEvents: RuntimeEvent[] = [];
    const provisionalSeq = new Map<string, number>(this.lastSequenceByAggregate);

    for (let i = 0; i < events.length; i++) {
      const event = events[i]!;
      const errs = this.validateForAppend(event, provisionalSeq, acceptedEvents);
      if (errs.length > 0) {
        errors.push(...errs);
        continue;
      }
      // Tentatively reserve sequence + a global position for this batch member.
      provisionalSeq.set(event.aggregateId, event.sequence);
      const globalPosition = this.nextGlobalPosition + acceptedEvents.length;
      acceptedEvents.push({ ...event, globalPosition });
    }

    if (errors.length > 0) {
      // Rollback: nothing is appended, no position consumed.
      return { valid: false, errors, accepted: 0, rejected: events.length };
    }

    // Commit: assign positions + append through the adapter.
    let pos = this.nextGlobalPosition;
    const toStore = acceptedEvents.map((e) => {
      const withPos = { ...e, globalPosition: pos };
      pos += 1;
      return withPos;
    });
    this.adapter.appendBatch(toStore);
    this.nextGlobalPosition = pos;
    for (const e of toStore) {
      this.lastSequenceByAggregate.set(e.aggregateId, e.sequence);
    }

    return { valid: true, errors: [], accepted: toStore.length, rejected: 0 };
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  private validateForAppend(
    event: RuntimeEvent,
    lastSeqByAgg: Map<string, number>,
    inBatchSoFar: RuntimeEvent[]
  ): string[] {
    const errors: string[] = [];

    if (!event.eventId || typeof event.eventId !== "string") {
      errors.push("eventId is required");
    }
    if (!event.missionId || typeof event.missionId !== "string") {
      errors.push("missionId is required");
    }
    if (!event.aggregateId || typeof event.aggregateId !== "string") {
      errors.push("aggregateId is required");
    }
    if (!event.timestamp || typeof event.timestamp !== "string") {
      errors.push("timestamp is required");
    }
    if (!event.actor || typeof event.actor !== "object" || !event.actor.id) {
      errors.push("actor is required");
    }
    if (!event.payload || typeof event.payload !== "object") {
      errors.push("payload is required");
    }
    if (!event.metadata || typeof event.metadata !== "object") {
      errors.push("metadata is required");
    }
    if (this.adapter.loadEvent(event.eventId)) {
      errors.push(`Duplicate eventId: ${event.eventId}`);
    }
    for (const existing of inBatchSoFar) {
      if (existing.eventId === event.eventId) {
        errors.push(`Duplicate eventId within batch: ${event.eventId}`);
      }
    }

    if (!VALID_AGGREGATE_TYPES.has(event.aggregateType)) {
      errors.push(`Invalid aggregateType: ${String(event.aggregateType)}`);
    }
    if (!VALID_EVENT_TYPES.has(event.eventType)) {
      errors.push(`Invalid eventType: ${String(event.eventType)}`);
    }
    if (!Number.isInteger(event.sequence) || event.sequence < 1) {
      errors.push(`Invalid sequence: ${event.sequence}`);
    } else {
      const last = lastSeqByAgg.get(event.aggregateId) ?? 0;
      if (event.sequence !== last + 1) {
        errors.push(
          `Invalid sequence for aggregate ${event.aggregateId}: expected ${
            last + 1
          }, got ${event.sequence}`
        );
      }
    }
    if (!event.schemaVersion || event.schemaVersion.trim() === "") {
      errors.push("schemaVersion must be a non-empty string");
    }
    // NOTE: globalPosition is STORE-OWNED. The store ALWAYS reassigns it on
    // append, ignoring any caller-supplied value. We therefore do NOT reject a
    // non-zero globalPosition here (that would break cross-store recovery /
    // replay-rebuild). The "caller cannot override position" guarantee is
    // proven by the fact that the stored position is always store-assigned
    // (see RT-006-C1 tests).
    // Typed authority reference required (RT-006-C1).
    if (
      !event.authority ||
      typeof event.authority !== "object" ||
      !event.authority.authorityId ||
      typeof event.authority.authorityId !== "string" ||
      event.authority.authorityId.trim() === ""
    ) {
      errors.push("authority must be a typed AuthorityReference with non-empty authorityId");
    } else if (
      !VALID_AUTHORITY_STATUSES.has(event.authority.status)
    ) {
      errors.push(`Invalid authority status: ${String(event.authority.status)}`);
    }
    if (event.causationId) {
      // A causation reference must point to an event that exists in the store
      // or has already been accepted earlier in this same batch.
      const inStore = this.adapter.loadEvent(event.causationId);
      const inBatch = inBatchSoFar.some((e) => e.eventId === event.causationId);
      if (!inStore && !inBatch) {
        errors.push(`causationId references missing event: ${event.causationId}`);
      }
    }

    return errors;
  }

  // ─── Load ─────────────────────────────────────────────────────────────────

  loadEvent(eventId: string): RuntimeEvent | undefined {
    return this.adapter.loadEvent(eventId);
  }

  loadMission(missionId: string): RuntimeEvent[] {
    return this.adapter.loadMission(missionId);
  }

  loadAggregate(aggregateId: string): RuntimeEvent[] {
    // Per-aggregate ordering: sequence → timestamp → eventId.
    return this.adapter
      .loadAggregate(aggregateId)
      .sort((a, b) => this.compareAggregate(a, b));
  }

  // ─── Stream ───────────────────────────────────────────────────────────────

  /**
   * GLOBAL ordering by globalPosition (cross-aggregate safe).
   */
  stream(): RuntimeEvent[] {
    return this.adapter.loadAll().sort((a: RuntimeEvent, b: RuntimeEvent) => a.globalPosition - b.globalPosition);
  }

  streamMission(missionId: string): RuntimeEvent[] {
    return this.adapter
      .loadMission(missionId)
      .sort((a: RuntimeEvent, b: RuntimeEvent) => a.globalPosition - b.globalPosition);
  }

  /**
   * Per-aggregate ordering: sequence → timestamp → eventId.
   */
  streamAggregate(aggregateId: string): RuntimeEvent[] {
    return this.loadAggregate(aggregateId);
  }

  // ─── Count / Export ───────────────────────────────────────────────────────

  count(): number {
    return this.adapter.count();
  }

  countMission(missionId: string): number {
    return this.adapter.loadMission(missionId).length;
  }

  countAggregate(aggregateId: string): number {
    return this.adapter.loadAggregate(aggregateId).length;
  }

  /**
   * Full export in GLOBAL order (globalPosition). Immutable deep copies.
   */
  export(): { events: RuntimeEvent[]; version: string } {
    return { events: this.stream(), version: EVENT_STORE_VERSION };
  }

  // ─── Ordering helpers ───────────────────────────────────────────────────────

  /** Per-aggregate canonical order: sequence → timestamp → eventId. */
  private compareAggregate(a: RuntimeEvent, b: RuntimeEvent): number {
    if (a.sequence !== b.sequence) return a.sequence - b.sequence;
    if (a.timestamp !== b.timestamp) {
      return a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0;
    }
    return a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0;
  }
}
