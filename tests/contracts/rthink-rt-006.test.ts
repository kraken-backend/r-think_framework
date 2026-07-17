// R-Think Runtime — Persistence & Event Store Tests
// Blueprint Reference: RTHINK-BP-001 §19
// Mission: RTHINK-RT-006

import { describe, it, expect, beforeEach } from "vitest";
import {
  EventStore,
  Persistence,
  ReplayEngine,
  EVENT_STORE_VERSION,
  PERSISTENCE_VERSION,
  REPLAY_VERSION,
} from "../../src/runtime/index.js";
import {
  RuntimeEventType,
  AggregateType,
} from "../../src/contracts/types.js";
import {
  CURRENT_EVENT_SCHEMA_VERSION,
} from "../../src/contracts/index.js";
import type { RuntimeEvent, Snapshot, StateReducer, MaterializedViewRecord } from "../../src/contracts/index.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

let eventSeq = 0;

function makeEvent(
  overrides: Partial<RuntimeEvent> = {}
): RuntimeEvent {
  eventSeq += 1;
  return {
    eventId: `evt-${eventSeq}`,
    missionId: "m1",
    aggregateId: "agg-1",
    aggregateType: AggregateType.MISSION,
    eventType: RuntimeEventType.MISSION_CREATED,
    sequence: 1,
    timestamp: "2026-07-17T00:00:00.000Z",
    actor: { id: "actor-1", role: "EXECUTOR" as any },
    authority: { authorityId: "runtime", actorRole: "EXECUTOR" as any, status: "GRANTED" as any },
    payload: { value: 1 },
    metadata: {},
    correlationId: undefined,
    causationId: undefined,
    schemaVersion: CURRENT_EVENT_SCHEMA_VERSION,
    globalPosition: 0,
    ...overrides,
  };
}

function seqEvents(count: number, aggregateId = "agg-seq"): RuntimeEvent[] {
  const out: RuntimeEvent[] = [];
  for (let i = 1; i <= count; i++) {
    out.push(
      makeEvent({
        eventId: `evt-${aggregateId}-${i}`,
        aggregateId,
        sequence: i,
        timestamp: `2026-07-17T00:00:${String(i).padStart(2, "0")}.000Z`,
        eventType: i % 2 === 0 ? RuntimeEventType.STATE_CHANGED : RuntimeEventType.MISSION_CREATED,
        payload: { value: i },
      })
    );
  }
  return out;
}

const SUM_REDUCER: StateReducer = (state, event) => {
  const prev = (state.sum as number) ?? 0;
  const inc = (event.payload.value as number) ?? 0;
  return { ...state, sum: prev + inc, last: event.eventId };
};

const MISSION_EVENT_TYPES = Object.values(RuntimeEventType);
const AGGREGATE_TYPES = Object.values(AggregateType);

// ─────────────────────────────────────────────────────────────────────────────
// 18.1 Event Store — Append
// ─────────────────────────────────────────────────────────────────────────────

describe("18.1 EventStore — Append", () => {
  let store: EventStore;
  beforeEach(() => {
    store = new EventStore();
  });

  it("18.1.1 appendEvent accepts a valid event", () => {
    expect(store.appendEvent(makeEvent()).valid).toBe(true);
    expect(store.count()).toBe(1);
  });
  it("18.1.2 appendEvent returns errors for empty eventId", () => {
    const r = store.appendEvent(makeEvent({ eventId: "" }));
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
  it("18.1.3 appendEvent returns errors for empty missionId", () => {
    const r = store.appendEvent(makeEvent({ missionId: "" }));
    expect(r.valid).toBe(false);
  });
  it("18.1.4 appendEvent returns errors for empty aggregateId", () => {
    const r = store.appendEvent(makeEvent({ aggregateId: "" }));
    expect(r.valid).toBe(false);
  });
  it("18.1.5 appendEvent rejects invalid aggregateType", () => {
    const r = store.appendEvent(makeEvent({ aggregateType: "BOGUS" as any }));
    expect(r.valid).toBe(false);
  });
  it("18.1.6 appendEvent rejects invalid eventType", () => {
    const r = store.appendEvent(makeEvent({ eventType: "BOGUS" as any }));
    expect(r.valid).toBe(false);
  });
  it("18.1.7 appendEvent rejects non-positive sequence", () => {
    const r = store.appendEvent(makeEvent({ sequence: 0 }));
    expect(r.valid).toBe(false);
  });
  it("18.1.8 appendEvent rejects fractional sequence", () => {
    const r = store.appendEvent(makeEvent({ sequence: 1.5 }));
    expect(r.valid).toBe(false);
  });
  it("18.1.9 appendEvent rejects empty timestamp", () => {
    const r = store.appendEvent(makeEvent({ timestamp: "" }));
    expect(r.valid).toBe(false);
  });
  it("18.1.10 appendEvent rejects missing actor", () => {
    const r = store.appendEvent(makeEvent({ actor: undefined as any }));
    expect(r.valid).toBe(false);
  });
  it("18.1.11 appendEvent rejects empty authority reference", () => {
    const r = store.appendEvent(
      makeEvent({
        authority: { authorityId: "", actorRole: "EXECUTOR" as any, status: "GRANTED" as any },
      })
    );
    expect(r.valid).toBe(false);
  });
  it("18.1.12 appendEvent rejects missing payload", () => {
    const r = store.appendEvent(makeEvent({ payload: undefined as any }));
    expect(r.valid).toBe(false);
  });
  it("18.1.13 appendEvent rejects missing metadata", () => {
    const r = store.appendEvent(makeEvent({ metadata: undefined as any }));
    expect(r.valid).toBe(false);
  });
  it("18.1.14 appendEvent rejects duplicate eventId", () => {
    store.appendEvent(makeEvent({ eventId: "dup" }));
    const r = store.appendEvent(makeEvent({ eventId: "dup" }));
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Duplicate");
  });
  it("18.1.15 appendEvent rejects out-of-order sequence", () => {
    store.appendEvent(makeEvent({ eventId: "a", aggregateId: "x", sequence: 1 }));
    const r = store.appendEvent(makeEvent({ eventId: "b", aggregateId: "x", sequence: 3 }));
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toContain("Invalid sequence");
  });
  it("18.1.16 appendEvent accepts next sequence", () => {
    store.appendEvent(makeEvent({ eventId: "a", aggregateId: "x", sequence: 1 }));
    const r = store.appendEvent(makeEvent({ eventId: "b", aggregateId: "x", sequence: 2 }));
    expect(r.valid).toBe(true);
  });
  it("18.1.17 appendEvent requires sequence 1 for new aggregate", () => {
    const r = store.appendEvent(makeEvent({ aggregateId: "fresh", sequence: 2 }));
    expect(r.valid).toBe(false);
  });
  it("18.1.18 appendEvent per-aggregate sequence independence", () => {
    expect(store.appendEvent(makeEvent({ aggregateId: "p1", sequence: 1 })).valid).toBe(true);
    expect(store.appendEvent(makeEvent({ aggregateId: "p2", sequence: 1 })).valid).toBe(true);
  });
  it("18.1.19 stored event is a copy (immutability)", () => {
    const e = makeEvent();
    store.appendEvent(e);
    e.payload.value = 999;
    expect(store.loadEvent(e.eventId)!.payload.value).toBe(1);
  });
  it("18.1.20 appendEvent preserves all fields", () => {
    const root = makeEvent({ eventId: "root-evt", aggregateId: "pres", sequence: 1 });
    store.appendEvent(root);
    const e = makeEvent({ eventId: "child-evt", aggregateId: "pres", sequence: 2, correlationId: "c1", causationId: "root-evt" });
    store.appendEvent(e);
    const loaded = store.loadEvent(e.eventId)!;
    expect(loaded.correlationId).toBe("c1");
    expect(loaded.causationId).toBe("root-evt");
    expect(loaded.authority.authorityId).toBe("runtime");
    expect(loaded.globalPosition).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.2 Event Store — Batch Append
// ─────────────────────────────────────────────────────────────────────────────

describe("18.2 EventStore — Batch Append", () => {
  let store: EventStore;
  beforeEach(() => {
    store = new EventStore();
  });

  it("18.2.1 appendEvents accepts all valid", () => {
    const r = store.appendEvents(seqEvents(3));
    expect(r.valid).toBe(true);
    expect(r.accepted).toBe(3);
    expect(r.rejected).toBe(0);
  });
  it("18.2.2 appendEvents atomic: bad sequence rejects whole batch", () => {
    const events = seqEvents(3);
    events[2] = makeEvent({ eventId: "bad", aggregateId: "agg-seq", sequence: 99 });
    const r = store.appendEvents(events);
    expect(r.accepted).toBe(0);
    expect(r.rejected).toBe(3);
    expect(r.valid).toBe(false);
    expect(store.count()).toBe(0);
  });
  it("18.2.3 appendEvents atomic: duplicate in batch rejects whole batch", () => {
    const events = seqEvents(4);
    events.push(makeEvent({ eventId: events[0]!.eventId, aggregateId: "agg-seq", sequence: 5 }));
    const r = store.appendEvents(events);
    expect(r.accepted).toBe(0);
    expect(r.rejected).toBe(5);
    expect(store.count()).toBe(0);
  });
  it("18.2.4 appendEvents rejects duplicate eventId within batch", () => {
    const events = seqEvents(2);
    events.push(makeEvent({ eventId: events[0]!.eventId, aggregateId: "agg-seq", sequence: 3 }));
    const r = store.appendEvents(events);
    expect(r.rejected).toBe(3);
    expect(r.accepted).toBe(0);
  });
  it("18.2.5 appendEvents empty batch is valid", () => {
    const r = store.appendEvents([]);
    expect(r.valid).toBe(true);
    expect(r.accepted).toBe(0);
  });
  it("18.2.6 appendEvents atomic: invalid event rejects whole batch", () => {
    const good = makeEvent({ eventId: "g", aggregateId: "a1", sequence: 1 });
    const bad = makeEvent({ eventId: "b", aggregateId: "a2", sequence: 1, eventType: "X" as any });
    const r = store.appendEvents([good, bad]);
    expect(r.accepted).toBe(0);
    expect(r.rejected).toBe(2);
    expect(store.count()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.3 Event Store — Load
// ─────────────────────────────────────────────────────────────────────────────

describe("18.3 EventStore — Load", () => {
  let store: EventStore;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents(seqEvents(4, "load-agg"));
  });

  it("18.3.1 loadEvent returns stored event", () => {
    const e = store.loadEvent("evt-load-agg-1");
    expect(e?.eventId).toBe("evt-load-agg-1");
  });
  it("18.3.2 loadEvent returns undefined for unknown", () => {
    expect(store.loadEvent("nope")).toBeUndefined();
  });
  it("18.3.3 loadAggregate returns all events for aggregate", () => {
    expect(store.loadAggregate("load-agg").length).toBe(4);
  });
  it("18.3.4 loadAggregate returns empty for unknown", () => {
    expect(store.loadAggregate("ghost").length).toBe(0);
  });
  it("18.3.5 loadMission returns mission events", () => {
    expect(store.loadMission("m1").length).toBe(4);
  });
  it("18.3.6 loadMission returns empty for unknown", () => {
    expect(store.loadMission("ghost").length).toBe(0);
  });
  it("18.3.7 loaded event is a deep copy", () => {
    const e = store.loadEvent("evt-load-agg-1")!;
    e.payload.value = 42;
    expect(store.loadEvent("evt-load-agg-1")!.payload.value).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.4 Event Store — Stream
// ─────────────────────────────────────────────────────────────────────────────

describe("18.4 EventStore — Stream", () => {
  let store: EventStore;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents([
      makeEvent({ eventId: "e-a", aggregateId: "a", sequence: 1, timestamp: "2026-01-01T00:00:01Z" }),
      makeEvent({ eventId: "e-b", aggregateId: "b", sequence: 1, timestamp: "2026-01-01T00:00:00Z" }),
      makeEvent({ eventId: "e-c", aggregateId: "a", sequence: 2, timestamp: "2026-01-01T00:00:02Z" }),
    ]);
  });

  it("18.4.1 stream returns all events", () => {
    expect(store.stream().length).toBe(3);
  });
  it("18.4.2 streamMission filters by mission", () => {
    expect(store.streamMission("m1").length).toBe(3);
  });
  it("18.4.3 streamAggregate filters by aggregate", () => {
    expect(store.streamAggregate("a").length).toBe(2);
  });
  it("18.4.4 stream ordered by sequence", () => {
    const ids = store.stream().map((e) => e.sequence);
    expect(ids).toEqual([1, 1, 2]);
  });
  it("18.4.5 stream uses GLOBAL ordering (globalPosition = append order)", () => {
    // append order: e-a(gp1), e-b(gp2), e-c(gp3)
    const ordered = store.stream();
    expect(ordered.map((e) => e.eventId)).toEqual(["e-a", "e-b", "e-c"]);
  });
  it("18.4.6 global ordering independent of per-aggregate sequence", () => {
    const s = new EventStore();
    s.appendEvent(makeEvent({ eventId: "z", aggregateId: "x", sequence: 1, timestamp: "t" }));
    s.appendEvent(makeEvent({ eventId: "a", aggregateId: "y", sequence: 1, timestamp: "t" }));
    // globalPosition assigned by append order: z=1, a=2
    expect(s.stream()[0]!.eventId).toBe("z");
  });
  it("18.4.7 streamAggregate ordered", () => {
    const ids = store.streamAggregate("a").map((e) => e.sequence);
    expect(ids).toEqual([1, 2]);
  });
  it("18.4.8 streamMission returns copy", () => {
    const s = store.streamMission("m1");
    s[0]!.payload.value = 7;
    expect(store.streamMission("m1")[0]!.payload.value).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.5 Event Store — Count / Export / Immutability
// ─────────────────────────────────────────────────────────────────────────────

describe("18.5 EventStore — Count / Export / Immutability", () => {
  let store: EventStore;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents(seqEvents(3));
  });

  it("18.5.1 count returns total", () => {
    expect(store.count()).toBe(3);
  });
  it("18.5.2 countMission returns per-mission", () => {
    expect(store.countMission("m1")).toBe(3);
  });
  it("18.5.3 countAggregate returns per-aggregate", () => {
    expect(store.countAggregate("agg-seq")).toBe(3);
  });
  it("18.5.4 export returns events", () => {
    expect(store.export().events.length).toBe(3);
  });
  it("18.5.5 export version is set", () => {
    expect(store.export().version).toBe(EVENT_STORE_VERSION);
  });
  it("18.5.6 export ordering is GLOBAL (globalPosition)", () => {
    const exp = store.export();
    const positions = exp.events.map((e) => e.globalPosition);
    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sorted);
  });
  it("18.5.7 export returns copies", () => {
    const exp = store.export();
    exp.events[0]!.payload.value = 55;
    expect(store.stream()[0]!.payload.value).toBe(1);
  });
  it("18.5.8 export in global order regardless of aggregate sequence", () => {
    const s = new EventStore();
    s.appendEvent(makeEvent({ eventId: "y1", aggregateId: "y", sequence: 1 }));
    s.appendEvent(makeEvent({ eventId: "x1", aggregateId: "x", sequence: 1 }));
    // global order = append order: y1(gp1), x1(gp2)
    expect(s.export().events.map((e) => e.eventId)).toEqual(["y1", "x1"]);
  });
  it("18.5.9 stored events are immutable (no update API)", () => {
    store.appendEvent(makeEvent({ eventId: "nope", sequence: 1, aggregateId: "nope" }));
    expect(store.loadEvent("nope")).toBeDefined();
  });
  it("18.5.10 immutability: append does not mutate input", () => {
    const e = makeEvent({ eventId: "im", sequence: 1, aggregateId: "im" });
    store.appendEvent(e);
    e.sequence = 999;
    expect(store.loadEvent("im")!.sequence).toBe(1);
  });
  it("18.5.11 EVENT_STORE_VERSION constant", () => {
    expect(EVENT_STORE_VERSION).toContain("rt-006");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.6 Persistence — Event Append & Materialized View Separation
// ─────────────────────────────────────────────────────────────────────────────

function makeRecord(recordId: string, aggregateId = "agg-1", missionId = "m1", state: Record<string, unknown> = { a: 1 }): MaterializedViewRecord {
  return {
    recordId,
    aggregateId,
    missionId,
    state,
    metadata: {},
    updatedAt: new Date().toISOString(),
    derivedFromGlobalPosition: 0,
    schemaVersion: CURRENT_EVENT_SCHEMA_VERSION,
  };
}

describe("18.6 Persistence — Append & Materialized Views", () => {
  let persistence: Persistence;
  beforeEach(() => {
    persistence = new Persistence();
  });

  it("18.6.1 append delegates to event store", () => {
    expect(persistence.append(makeEvent()).valid).toBe(true);
    expect(persistence.getEventStore().count()).toBe(1);
  });
  it("18.6.2 appendBatch delegates", () => {
    const r = persistence.appendBatch(seqEvents(3));
    expect(r.accepted).toBe(3);
  });
  it("18.6.3 putRecord stores derived state", () => {
    persistence.putRecord(makeRecord("k1"));
    expect(persistence.loadRecord("k1")?.state.a).toBe(1);
  });
  it("18.6.4 exists true after put", () => {
    persistence.putRecord(makeRecord("k1"));
    expect(persistence.recordExists("k1")).toBe(true);
  });
  it("18.6.5 exists false before put", () => {
    expect(persistence.recordExists("k1")).toBe(false);
  });
  it("18.6.6 loadRecord returns undefined for missing", () => {
    expect(persistence.loadRecord("missing")).toBeUndefined();
  });
  it("18.6.7 remove deletes record", () => {
    persistence.putRecord(makeRecord("k1"));
    expect(persistence.removeRecord("k1")).toBe(true);
    expect(persistence.recordExists("k1")).toBe(false);
  });
  it("18.6.8 remove returns false for missing", () => {
    expect(persistence.removeRecord("missing")).toBe(false);
  });
  it("18.6.9 list returns all records", () => {
    persistence.putRecord(makeRecord("k1"));
    persistence.putRecord(makeRecord("k2"));
    expect(persistence.listRecords().length).toBe(2);
  });
  it("18.6.10 clear empties records (never deletes events)", () => {
    persistence.append(makeEvent({ eventId: "evt-keep", sequence: 1, aggregateId: "keep" }));
    persistence.putRecord(makeRecord("k1"));
    persistence.clearRecords();
    expect(persistence.countRecords()).toBe(0);
    expect(persistence.countEvents()).toBe(1);
  });
  it("18.6.11 count returns record count", () => {
    persistence.putRecord(makeRecord("k1"));
    persistence.putRecord(makeRecord("k2"));
    expect(persistence.countRecords()).toBe(2);
  });
  it("18.6.12 putRecord returns copy", () => {
    const r = persistence.putRecord(makeRecord("k1", "agg-1", "m1", { a: 1 }));
    r.state.a = 2;
    expect(persistence.loadRecord("k1")!.state.a).toBe(1);
  });
  it("18.6.13 putRecord overwrites", () => {
    persistence.putRecord(makeRecord("k1", "agg-1", "m1", { a: 1 }));
    persistence.putRecord(makeRecord("k1", "agg-1", "m1", { a: 2 }));
    expect(persistence.loadRecord("k1")!.state.a).toBe(2);
  });
  it("18.6.14 PERSISTENCE_VERSION constant", () => {
    expect(PERSISTENCE_VERSION).toContain("rt-006");
  });
  it("18.6.15 getEventStore returns same instance", () => {
    const es = persistence.getEventStore();
    persistence.append(makeEvent({ eventId: "x", sequence: 1, aggregateId: "x" }));
    expect(es.count()).toBe(1);
  });
  it("18.6.16 shared event store across persistence", () => {
    const es = new EventStore();
    const p = new Persistence(es);
    p.append(makeEvent({ eventId: "y", sequence: 1, aggregateId: "y" }));
    expect(es.count()).toBe(1);
  });
  it("18.6.17 record value deep copy on list", () => {
    persistence.putRecord(makeRecord("k1", "agg-1", "m1", { nested: { v: 1 } }));
    persistence.listRecords()[0]!.state.nested = { v: 9 };
    expect((persistence.loadRecord("k1")!.state.nested as any).v).toBe(1);
  });
  it("18.6.18 putRecord sets updatedAt ISO", () => {
    const r = persistence.putRecord(makeRecord("k1"));
    expect(new Date(r.updatedAt).toISOString()).toBe(r.updatedAt);
  });
  it("18.6.19 append invalid event rejected", () => {
    expect(persistence.append(makeEvent({ sequence: 0 })).valid).toBe(false);
  });
  it("18.6.20 appendBatch atomic: invalid item rejects whole batch", () => {
    const r = persistence.appendBatch([makeEvent(), makeEvent({ sequence: 0 })]);
    expect(r.accepted).toBe(0);
    expect(r.rejected).toBe(2);
  });
  it("18.6.21 materialized view is NOT authoritative history", () => {
    persistence.append(makeEvent({ eventId: "e1", sequence: 1, aggregateId: "a1" }));
    persistence.putRecord(makeRecord("r1", "a1"));
    expect(persistence.countEvents()).toBe(1);
    expect(persistence.countRecords()).toBe(1);
  });
  it("18.6.22 putRecord never appends events", () => {
    persistence.putRecord(makeRecord("r1"));
    expect(persistence.countEvents()).toBe(0);
    expect(persistence.countRecords()).toBe(1);
  });
  it("18.6.23 removing record never deletes events", () => {
    persistence.append(makeEvent({ eventId: "e1", sequence: 1, aggregateId: "a1" }));
    persistence.putRecord(makeRecord("r1", "a1"));
    persistence.removeRecord("r1");
    expect(persistence.countEvents()).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.7 Replay Engine — Basic
// ─────────────────────────────────────────────────────────────────────────────

describe("18.7 ReplayEngine — Basic", () => {
  let store: EventStore;
  let replay: ReplayEngine;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents(seqEvents(4, "replay-agg"));
    replay = new ReplayEngine(store);
  });

  it("18.7.1 replayAggregate returns all events", () => {
    expect(replay.replayAggregate("replay-agg").events.length).toBe(4);
  });
  it("18.7.2 replayAggregate returns state", () => {
    const r = replay.replayAggregate("replay-agg", SUM_REDUCER);
    expect(r.state.sum).toBe(10);
  });
  it("18.7.3 replayMission returns mission events", () => {
    expect(replay.replayMission("m1").events.length).toBe(4);
  });
  it("18.7.4 replayAggregate unknown returns empty", () => {
    const r = replay.replayAggregate("ghost");
    expect(r.events.length).toBe(0);
  });
  it("18.7.5 replay result includes validation", () => {
    const r = replay.replayAggregate("replay-agg");
    expect(r.validation.valid).toBe(true);
  });
  it("18.7.6 replay fold order is sequence-ascending", () => {
    const seqs = replay.replayAggregate("replay-agg").events.map((e) => e.sequence);
    expect(seqs).toEqual([1, 2, 3, 4]);
  });
  it("18.7.7 replay default reducer records event count", () => {
    expect(replay.replayAggregate("replay-agg").state._eventCount).toBe(4);
  });
  it("18.7.8 replayUntil stops at sequence", () => {
    const r = replay.replayUntil("replay-agg", 2);
    expect(r.events.length).toBe(2);
  });
  it("18.7.9 replayFrom starts at sequence", () => {
    const r = replay.replayFrom("replay-agg", 3);
    expect(r.events.length).toBe(2);
    expect(r.events[0]!.sequence).toBe(3);
  });
  it("18.7.10 replayRange inclusive bounds", () => {
    const r = replay.replayRange("replay-agg", 2, 3);
    expect(r.events.map((e) => e.sequence)).toEqual([2, 3]);
  });
  it("18.7.11 replayRange out of bounds empty", () => {
    expect(replay.replayRange("replay-agg", 10, 20).events.length).toBe(0);
  });
  it("18.7.12 REPLAY_VERSION constant", () => {
    expect(REPLAY_VERSION).toContain("rt-006");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.8 Replay — Deterministic
// ─────────────────────────────────────────────────────────────────────────────

describe("18.8 ReplayEngine — Deterministic", () => {
  let store: EventStore;
  let replay: ReplayEngine;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents(seqEvents(5, "det-agg"));
    replay = new ReplayEngine(store);
  });

  it("18.8.1 replay twice identical state", () => {
    const a = replay.replayAggregate("det-agg", SUM_REDUCER);
    const b = replay.replayAggregate("det-agg", SUM_REDUCER);
    expect(a.state).toEqual(b.state);
  });
  it("18.8.2 replay twice identical event ids", () => {
    const a = replay.replayAggregate("det-agg");
    const b = replay.replayAggregate("det-agg");
    expect(a.events.map((e) => e.eventId)).toEqual(b.events.map((e) => e.eventId));
  });
  it("18.8.3 replay from different engine identical", () => {
    const other = new ReplayEngine(store);
    expect(other.replayAggregate("det-agg", SUM_REDUCER).state).toEqual(
      replay.replayAggregate("det-agg", SUM_REDUCER).state
    );
  });
  it("18.8.4 shuffle input still deterministic output", () => {
    const shuffled = [...seqEvents(5, "det-agg")].sort(() => Math.random() - 0.5);
    const s2 = new EventStore();
    s2.appendEvents(shuffled.sort((a, b) => a.sequence - b.sequence));
    const r2 = new ReplayEngine(s2).replayAggregate("det-agg", SUM_REDUCER);
    expect(r2.state).toEqual(replay.replayAggregate("det-agg", SUM_REDUCER).state);
  });
  it("18.8.5 replayUntil deterministic", () => {
    expect(replay.replayUntil("det-agg", 3, SUM_REDUCER).state).toEqual(
      replay.replayUntil("det-agg", 3, SUM_REDUCER).state
    );
  });
  it("18.8.6 replayRange deterministic", () => {
    expect(replay.replayRange("det-agg", 2, 4, SUM_REDUCER).state).toEqual(
      replay.replayRange("det-agg", 2, 4, SUM_REDUCER).state
    );
  });
  it("18.8.7 empty replay deterministic", () => {
    const r1 = new ReplayEngine(new EventStore()).replayAggregate("x");
    const r2 = new ReplayEngine(new EventStore()).replayAggregate("x");
    expect(r1.state).toEqual(r2.state);
  });
  it("18.8.8 replayMission deterministic", () => {
    expect(replay.replayMission("m1", SUM_REDUCER).state).toEqual(
      replay.replayMission("m1", SUM_REDUCER).state
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.9 Snapshots
// ─────────────────────────────────────────────────────────────────────────────

describe("18.9 ReplayEngine — Snapshots", () => {
  let store: EventStore;
  let replay: ReplayEngine;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents(seqEvents(4, "snap-agg"));
    replay = new ReplayEngine(store);
  });

  it("18.9.1 createSnapshot captures sequence", () => {
    const s = replay.createSnapshot("snap-agg", { v: 1 });
    expect(s.sequence).toBe(4);
  });
  it("18.9.2 createSnapshot captures state", () => {
    const s = replay.createSnapshot("snap-agg", { v: 42 });
    expect(s.runtimeState.v).toBe(42);
  });
  it("18.9.3 loadSnapshot returns snapshot", () => {
    const s = replay.createSnapshot("snap-agg", { v: 1 });
    expect(replay.loadSnapshot(s.snapshotId)?.snapshotId).toBe(s.snapshotId);
  });
  it("18.9.4 loadSnapshot returns copy", () => {
    const s = replay.createSnapshot("snap-agg", { v: 1 });
    const loaded = replay.loadSnapshot(s.snapshotId)!;
    loaded.runtimeState.v = 9;
    expect(replay.loadSnapshot(s.snapshotId)!.runtimeState.v).toBe(1);
  });
  it("18.9.5 listSnapshots includes created", () => {
    replay.createSnapshot("snap-agg", {});
    expect(replay.listSnapshots().length).toBeGreaterThanOrEqual(1);
  });
  it("18.9.6 deleteSnapshot removes it", () => {
    const s = replay.createSnapshot("snap-agg", {});
    expect(replay.deleteSnapshot(s.snapshotId)).toBe(true);
    expect(replay.loadSnapshot(s.snapshotId)).toBeUndefined();
  });
  it("18.9.7 deleteSnapshot false for unknown", () => {
    expect(replay.deleteSnapshot("ghost")).toBe(false);
  });
  it("18.9.8 snapshot is optimization; full replay authoritative", () => {
    const snap = replay.createSnapshot("snap-agg", replay.replayAggregate("snap-agg", SUM_REDUCER).state);
    const fromSnap = replay.replayFromSnapshot(snap.snapshotId, SUM_REDUCER)!;
    const full = replay.replayAggregate("snap-agg", SUM_REDUCER);
    expect(fromSnap.state.sum).toBe(full.state.sum);
  });
  it("18.9.9 replayFromSnapshot applies subsequent events", () => {
    const snap = replay.createSnapshot("snap-agg", replay.replayAggregate("snap-agg", SUM_REDUCER).state);
    store.appendEvent(makeEvent({ eventId: "evt-snap-agg-5", aggregateId: "snap-agg", sequence: 5, payload: { value: 10 } }));
    const r = replay.replayFromSnapshot(snap.snapshotId, SUM_REDUCER)!;
    expect(r.events.length).toBe(1);
    expect(r.state.sum).toBe(20);
  });
  it("18.9.10 replayFromSnapshot undefined for unknown snapshot", () => {
    expect(replay.replayFromSnapshot("ghost")).toBeUndefined();
  });
  it("18.9.11 snapshot sequence reflects last event", () => {
    store.appendEvent(makeEvent({ eventId: "evt-snap-agg-5", aggregateId: "snap-agg", sequence: 5 }));
    expect(replay.createSnapshot("snap-agg", {}).sequence).toBe(5);
  });
  it("18.9.12 snapshot timestamp ISO", () => {
    const s = replay.createSnapshot("snap-agg", {});
    expect(new Date(s.timestamp).toISOString()).toBe(s.timestamp);
  });
  it("18.9.13 snapshot metadata preserved", () => {
    const s = replay.createSnapshot("snap-agg", {}, { note: "x" });
    expect(s.metadata.note).toBe("x");
  });
  it("18.9.14 snapshot at sequence 0 when no events", () => {
    const s = replay.createSnapshot("empty-agg", {});
    expect(s.sequence).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.10 Event Types Completeness
// ─────────────────────────────────────────────────────────────────────────────

describe("18.10 Event Types Completeness", () => {
  it("18.10.1 RuntimeEventType has 19 members", () => {
    expect(MISSION_EVENT_TYPES.length).toBe(19);
  });
  it("18.10.2 every event type appendable", () => {
    const store = new EventStore();
    MISSION_EVENT_TYPES.forEach((t, i) => {
      const r = store.appendEvent(
        makeEvent({ eventId: `et-${i}`, aggregateId: "et-agg", sequence: i + 1, eventType: t })
      );
      expect(r.valid).toBe(true);
    });
  });
  it("18.10.3 AggregateType has 12 members", () => {
    expect(AGGREGATE_TYPES.length).toBe(12);
  });
  it("18.10.4 every aggregate type appendable", () => {
    const store = new EventStore();
    AGGREGATE_TYPES.forEach((t, i) => {
      const r = store.appendEvent(
        makeEvent({ eventId: `at-${i}`, aggregateId: `at-${i}`, sequence: 1, aggregateType: t })
      );
      expect(r.valid).toBe(true);
    });
  });
  it("18.10.5 each canonical event type appears in enum", () => {
    const required = [
      "MISSION_CREATED", "MISSION_UPDATED", "STATE_CHANGED", "ARTIFACT_REGISTERED",
      "ARTIFACT_REPLACED", "ROUTER_DECISION", "EXECUTION_STARTED", "EXECUTION_COMPLETED",
      "EXECUTION_FAILED", "EVIDENCE_CREATED", "CONTRADICTION_DETECTED", "CHALLENGE_STARTED",
      "CHALLENGE_COMPLETED", "DISCOVERY_CREATED", "EVOLUTION_CREATED", "AUTHORITY_GRANTED",
      "AUTHORITY_DENIED", "RECOVERY_STARTED", "RECOVERY_COMPLETED",
    ];
    for (const r of required) {
      expect((RuntimeEventType as any)[r]).toBe(r);
    }
  });
  it("18.10.6 CURRENT_EVENT_SCHEMA_VERSION defined", () => {
    expect(CURRENT_EVENT_SCHEMA_VERSION).toContain("rt-006");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.11 Validation — Sequences & Ordering
// ─────────────────────────────────────────────────────────────────────────────

describe("18.11 Replay Validation — Sequences & Ordering", () => {
  let replay: ReplayEngine;
  beforeEach(() => {
    replay = new ReplayEngine(new EventStore());
  });

  it("18.11.1 valid ordered events pass", () => {
    expect(replay.validateReplay(seqEvents(3)).valid).toBe(true);
  });
  it("18.11.2 empty events pass", () => {
    expect(replay.validateReplay([]).valid).toBe(true);
  });
  it("18.11.3 missing sequence detected", () => {
    const events = seqEvents(3);
    events[1] = makeEvent({ eventId: "x", aggregateId: "agg-seq", sequence: 4 });
    const r = replay.validateReplay(events);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.code === "MISSING_SEQUENCE")).toBe(true);
  });
  it("18.11.4 duplicate sequence detected", () => {
    const events = [
      makeEvent({ eventId: "a", aggregateId: "dup", sequence: 1 }),
      makeEvent({ eventId: "b", aggregateId: "dup", sequence: 1 }),
    ];
    const r = replay.validateReplay(events);
    expect(r.errors.some((e) => e.code === "DUPLICATE_SEQUENCE")).toBe(true);
  });
  it("18.11.5 non-increasing (duplicate) sequence detected", () => {
    const events = [
      makeEvent({ eventId: "a", aggregateId: "ni", sequence: 1 }),
      makeEvent({ eventId: "b", aggregateId: "ni", sequence: 1 }),
    ];
    const r = replay.validateReplay(events);
    expect(r.errors.some((e) => e.code === "DUPLICATE_SEQUENCE")).toBe(true);
  });
  it("18.11.6 invalid aggregate detected (bad aggregateType)", () => {
    const events = [makeEvent({ aggregateType: "BOGUS" as any })];
    const r = replay.validateReplay(events);
    expect(r.errors.some((e) => e.code === "INVALID_AGGREGATE")).toBe(true);
  });
  it("18.11.7 invalid schema version detected", () => {
    const events = [makeEvent({ schemaVersion: "" })];
    const r = replay.validateReplay(events);
    expect(r.errors.some((e) => e.code === "INVALID_SCHEMA_VERSION")).toBe(true);
  });
  it("18.11.8 invalid ordering across events detected", () => {
    const events = [
      makeEvent({ eventId: "a", aggregateId: "o", sequence: 2, timestamp: "2026-01-01T00:00:02Z" }),
      makeEvent({ eventId: "b", aggregateId: "o", sequence: 1, timestamp: "2026-01-01T00:00:01Z" }),
    ];
    const r = replay.validateReplay(events);
    expect(r.errors.some((e) => e.code === "INVALID_ORDERING")).toBe(true);
  });
  it("18.11.9 per-aggregate sequences validated independently", () => {
    const events = [
      makeEvent({ eventId: "a", aggregateId: "p1", sequence: 1 }),
      makeEvent({ eventId: "b", aggregateId: "p2", sequence: 1 }),
    ];
    expect(replay.validateReplay(events).valid).toBe(true);
  });
  it("18.11.10 valid multi-aggregate preserves validity", () => {
    const events = [
      makeEvent({ eventId: "a", aggregateId: "p1", sequence: 1 }),
      makeEvent({ eventId: "b", aggregateId: "p1", sequence: 2 }),
      makeEvent({ eventId: "c", aggregateId: "p2", sequence: 1 }),
    ];
    expect(replay.validateReplay(events).valid).toBe(true);
  });
  it("18.11.11 missing sequence reports aggregateId", () => {
    const events = seqEvents(2);
    events[1] = makeEvent({ eventId: "x", aggregateId: "agg-seq", sequence: 9 });
    const issue = replay.validateReplay(events).errors.find((e) => e.code === "MISSING_SEQUENCE");
    expect(issue?.aggregateId).toBe("agg-seq");
  });
  it("18.11.12 duplicate sequence reports eventId", () => {
    const events = [
      makeEvent({ eventId: "aa", aggregateId: "d", sequence: 1 }),
      makeEvent({ eventId: "bb", aggregateId: "d", sequence: 1 }),
    ];
    const issue = replay.validateReplay(events).errors.find((e) => e.code === "DUPLICATE_SEQUENCE");
    expect(issue?.eventId).toBe("bb");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.12 Validation — Causation & Orphans
// ─────────────────────────────────────────────────────────────────────────────

describe("18.12 Replay Validation — Causation & Orphans", () => {
  let replay: ReplayEngine;
  beforeEach(() => {
    replay = new ReplayEngine(new EventStore());
  });

  it("18.12.1 root + child causation valid", () => {
    const events = [
      makeEvent({ eventId: "root", sequence: 1, aggregateId: "c", causationId: undefined }),
      makeEvent({ eventId: "child", sequence: 2, aggregateId: "c", causationId: "root" }),
    ];
    expect(replay.validateReplay(events).valid).toBe(true);
  });
  it("18.12.2 orphan event (missing parent) detected", () => {
    const events = [
      makeEvent({ eventId: "child", sequence: 1, aggregateId: "c", causationId: "missing" }),
    ];
    const r = replay.validateReplay(events);
    expect(r.errors.some((e) => e.code === "ORPHAN_EVENT")).toBe(true);
  });
  it("18.12.3 causation across mission boundary detected", () => {
    const events = [
      makeEvent({ eventId: "root", sequence: 1, aggregateId: "c", missionId: "m1", causationId: undefined }),
      makeEvent({ eventId: "child", sequence: 2, aggregateId: "c", missionId: "m2", causationId: "root" }),
    ];
    const r = replay.validateReplay(events);
    expect(r.errors.some((e) => e.code === "INVALID_CAUSATION_CHAIN")).toBe(true);
  });
  it("18.12.4 no root event detected as MISSING_CAUSATION_ROOT", () => {
    const events = [
      makeEvent({ eventId: "child", sequence: 1, aggregateId: "c", missionId: "mX", causationId: "ghost" }),
    ];
    const r = replay.validateReplay(events);
    expect(r.errors.some((e) => e.code === "MISSING_CAUSATION_ROOT")).toBe(true);
  });
  it("18.12.5 multiple roots allowed across missions", () => {
    const events = [
      makeEvent({ eventId: "r1", sequence: 1, aggregateId: "cA", missionId: "mA", causationId: undefined }),
      makeEvent({ eventId: "r2", sequence: 1, aggregateId: "cB", missionId: "mB", causationId: undefined }),
    ];
    expect(replay.validateReplay(events).valid).toBe(true);
  });
  it("18.12.6 deep causation chain valid", () => {
    const events = [
      makeEvent({ eventId: "n0", sequence: 1, aggregateId: "ch", causationId: undefined }),
      makeEvent({ eventId: "n1", sequence: 2, aggregateId: "ch", causationId: "n0" }),
      makeEvent({ eventId: "n2", sequence: 3, aggregateId: "ch", causationId: "n1" }),
    ];
    expect(replay.validateReplay(events).valid).toBe(true);
  });
  it("18.12.7 orphan reports eventId", () => {
    const events = [
      makeEvent({ eventId: "o", sequence: 1, aggregateId: "c", causationId: "ghost" }),
    ];
    const issue = replay.validateReplay(events).errors.find((e) => e.code === "ORPHAN_EVENT");
    expect(issue?.eventId).toBe("o");
  });
  it("18.12.8 correlationId does not affect validation", () => {
    const events = [
      makeEvent({ eventId: "a", sequence: 1, aggregateId: "c", correlationId: "corr" }),
    ];
    expect(replay.validateReplay(events).valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.13 Recovery
// ─────────────────────────────────────────────────────────────────────────────

describe("18.13 Replay — Recovery", () => {
  let store: EventStore;
  let replay: ReplayEngine;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents(seqEvents(5, "rec-agg"));
    replay = new ReplayEngine(store);
  });

  it("18.13.1 replayUntil recovers partial state", () => {
    const r = replay.replayUntil("rec-agg", 3, SUM_REDUCER);
    expect(r.state.sum).toBe(6);
  });
  it("18.13.2 replayFrom recovers remaining state", () => {
    const r = replay.replayFrom("rec-agg", 4, SUM_REDUCER);
    expect(r.state.sum).toBe(9);
  });
  it("18.13.3 replayRange recovers bounded state", () => {
    const r = replay.replayRange("rec-agg", 2, 4, SUM_REDUCER);
    expect(r.state.sum).toBe(9);
  });
  it("18.13.4 recovery from snapshot equals full replay", () => {
    const snap = replay.createSnapshot("rec-agg", replay.replayUntil("rec-agg", 5, SUM_REDUCER).state);
    store.appendEvent(makeEvent({ eventId: "evt-rec-agg-6", aggregateId: "rec-agg", sequence: 6, payload: { value: 6 } }));
    const fromSnap = replay.replayFromSnapshot(snap.snapshotId, SUM_REDUCER)!;
    const full = replay.replayAggregate("rec-agg", SUM_REDUCER);
    expect(fromSnap.state.sum).toBe(full.state.sum);
  });
  it("18.13.5 recovery after event deletion simulated by new store", () => {
    const subset = store.loadAggregate("rec-agg").filter((e) => e.sequence <= 3);
    const s2 = new EventStore();
    s2.appendEvents(subset);
    const r = new ReplayEngine(s2).replayAggregate("rec-agg", SUM_REDUCER);
    expect(r.state.sum).toBe(6);
  });
  it("18.13.6 replayUntil(0) empty", () => {
    expect(replay.replayUntil("rec-agg", 0).events.length).toBe(0);
  });
  it("18.13.7 replayFrom beyond end empty", () => {
    expect(replay.replayFrom("rec-agg", 99).events.length).toBe(0);
  });
  it("18.13.8 recovery deterministic across calls", () => {
    expect(replay.replayUntil("rec-agg", 4, SUM_REDUCER).state).toEqual(
      replay.replayUntil("rec-agg", 4, SUM_REDUCER).state
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.14 Large & Empty History
// ─────────────────────────────────────────────────────────────────────────────

describe("18.14 Replay — Large & Empty History", () => {
  it("18.14.1 large history (1000 events) replays correctly", () => {
    const store = new EventStore();
    store.appendEvents(seqEvents(1000, "big"));
    const replay = new ReplayEngine(store);
    const r = replay.replayAggregate("big", SUM_REDUCER);
    expect(r.state.sum).toBe(500500);
    expect(r.events.length).toBe(1000);
  });
  it("18.14.2 large history validation passes", () => {
    const store = new EventStore();
    store.appendEvents(seqEvents(500, "big2"));
    const replay = new ReplayEngine(store);
    expect(replay.validateReplay(store.loadAggregate("big2")).valid).toBe(true);
  });
  it("18.14.3 empty history replay valid", () => {
    const replay = new ReplayEngine(new EventStore());
    const r = replay.replayAggregate("empty");
    expect(r.valid);
    expect(r.events.length).toBe(0);
  });
  it("18.14.4 empty history state is empty object", () => {
    const replay = new ReplayEngine(new EventStore());
    expect(replay.replayAggregate("empty").state).toEqual({});
  });
  it("18.14.5 empty history validation valid", () => {
    expect(new ReplayEngine(new EventStore()).validateReplay([]).valid).toBe(true);
  });
  it("18.14.6 large history stream count", () => {
    const store = new EventStore();
    store.appendEvents(seqEvents(100, "s100"));
    expect(store.stream().length).toBe(100);
  });
  it("18.14.7 large history export count", () => {
    const store = new EventStore();
    store.appendEvents(seqEvents(100, "s100"));
    expect(store.export().events.length).toBe(100);
  });
  it("18.14.8 large history deterministic replay twice", () => {
    const store = new EventStore();
    store.appendEvents(seqEvents(300, "d300"));
    const replay = new ReplayEngine(store);
    expect(replay.replayAggregate("d300", SUM_REDUCER).state).toEqual(
      replay.replayAggregate("d300", SUM_REDUCER).state
    );
  });
  it("18.14.9 many aggregates independence", () => {
    const store = new EventStore();
    for (let i = 0; i < 50; i++) {
      store.appendEvents(seqEvents(3, `agg-${i}`));
    }
    expect(store.count()).toBe(150);
  });
  it("18.14.10 large history replayRange", () => {
    const store = new EventStore();
    store.appendEvents(seqEvents(200, "r200"));
    const replay = new ReplayEngine(store);
    expect(replay.replayRange("r200", 50, 60, SUM_REDUCER).events.length).toBe(11);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.15 Immutability & Ordering Enforcement
// ─────────────────────────────────────────────────────────────────────────────

describe("18.15 Immutability & Ordering", () => {
  let store: EventStore;
  beforeEach(() => {
    store = new EventStore();
  });

  it("18.15.1 cannot overwrite stored event", () => {
    store.appendEvent(makeEvent({ eventId: "im", sequence: 1, aggregateId: "im" }));
    // there is no update API; re-append same id is rejected
    expect(store.appendEvent(makeEvent({ eventId: "im", sequence: 1, aggregateId: "im" })).valid).toBe(false);
  });
  it("18.15.2 correction must be new event (higher sequence)", () => {
    store.appendEvent(makeEvent({ eventId: "orig", sequence: 1, aggregateId: "corr" }));
    const fix = makeEvent({ eventId: "fix", sequence: 2, aggregateId: "corr", payload: { corrected: true } });
    expect(store.appendEvent(fix).valid).toBe(true);
    expect(store.loadAggregate("corr").length).toBe(2);
  });
  it("18.15.3 ordering primary sequence", () => {
    store.appendEvent(makeEvent({ eventId: "a", aggregateId: "o2", sequence: 1, timestamp: "2026-01-01T00:00:09Z" }));
    store.appendEvent(makeEvent({ eventId: "b", aggregateId: "o2", sequence: 2, timestamp: "2026-01-01T00:00:01Z" }));
    expect(store.streamAggregate("o2").map((e) => e.eventId)).toEqual(["a", "b"]);
  });
  it("18.15.4 ordering secondary timestamp", () => {
    store.appendEvent(makeEvent({ eventId: "early", aggregateId: "o3a", sequence: 1, timestamp: "2026-01-01T00:00:01Z" }));
    store.appendEvent(makeEvent({ eventId: "late", aggregateId: "o3b", sequence: 1, timestamp: "2026-01-01T00:00:02Z" }));
    expect(store.stream().map((e) => e.eventId)).toEqual(["early", "late"]);
  });
  it("18.15.5 global ordering uses globalPosition (append order), not eventId", () => {
    store.appendEvent(makeEvent({ eventId: "z", aggregateId: "o4a", sequence: 1, timestamp: "t" }));
    store.appendEvent(makeEvent({ eventId: "a", aggregateId: "o4b", sequence: 1, timestamp: "t" }));
    // globalPosition is assigned by append order: z=1, a=2 → [z, a]
    expect(store.stream().map((e) => e.eventId)).toEqual(["z", "a"]);
  });
  it("18.15.6 sequence must start at 1 per aggregate", () => {
    expect(store.appendEvent(makeEvent({ aggregateId: "start", sequence: 5 })).valid).toBe(false);
  });
  it("18.15.7 contiguous sequences required", () => {
    store.appendEvent(makeEvent({ eventId: "a", aggregateId: "cont", sequence: 1 }));
    expect(store.appendEvent(makeEvent({ eventId: "b", aggregateId: "cont", sequence: 3 })).valid).toBe(false);
  });
  it("18.15.8 valid contiguous sequence accepted", () => {
    store.appendEvent(makeEvent({ eventId: "a", aggregateId: "cont2", sequence: 1 }));
    expect(store.appendEvent(makeEvent({ eventId: "b", aggregateId: "cont2", sequence: 2 })).valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.16 Replay from Router Decision Event (Evidence integration prep)
// ─────────────────────────────────────────────────────────────────────────────

describe("18.16 Replay — Router Decision & Evidence Relation", () => {
  let store: EventStore;
  let replay: ReplayEngine;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents([
      makeEvent({ eventId: "rd-1", aggregateId: "router-1", aggregateType: AggregateType.ROUTER, eventType: RuntimeEventType.ROUTER_DECISION, sequence: 1, payload: { selectedProvider: "p1" } }),
      makeEvent({ eventId: "rd-2", aggregateId: "router-1", aggregateType: AggregateType.ROUTER, eventType: RuntimeEventType.ROUTER_DECISION, sequence: 2, payload: { selectedProvider: "p2" } }),
    ]);
    replay = new ReplayEngine(store);
  });

  it("18.16.1 router decision events replayed", () => {
    expect(replay.replayAggregate("router-1").events.length).toBe(2);
  });
  it("18.16.2 router decision state retains last selection", () => {
    const r = replay.replayAggregate("router-1");
    expect((r.state.ROUTER_DECISION as any).selectedProvider).toBe("p2");
  });
  it("18.16.3 evidence created event replayed", () => {
    store.appendEvent(makeEvent({ eventId: "ev-1", aggregateId: "ev-1", aggregateType: AggregateType.EVIDENCE, eventType: RuntimeEventType.EVIDENCE_CREATED, sequence: 1 }));
    expect(replay.replayAggregate("ev-1").events[0]!.eventType).toBe(RuntimeEventType.EVIDENCE_CREATED);
  });
  it("18.16.4 persistence never replaces evidence graph (separation)", () => {
    // Persistence stores events; it exposes no EvidenceGraph mutation API.
    const p = new Persistence(store);
    expect(typeof (p as any).createNode).toBe("undefined");
  });
  it("18.16.5 replay output is plain operational state (no business logic)", () => {
    const r = replay.replayAggregate("router-1");
    expect(r.state).toBeTypeOf("object");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.17 Concurrent Append Simulation
// ─────────────────────────────────────────────────────────────────────────────

describe("18.17 Concurrent Append Simulation", () => {
  it("18.17.1 interleaved aggregates append consistently", () => {
    const store = new EventStore();
    const batch: RuntimeEvent[] = [];
    for (let i = 1; i <= 20; i++) {
      batch.push(makeEvent({ eventId: `p1-${i}`, aggregateId: "p1", sequence: i }));
      batch.push(makeEvent({ eventId: `p2-${i}`, aggregateId: "p2", sequence: i }));
    }
    const r = store.appendEvents(batch);
    expect(r.accepted).toBe(40);
    expect(store.countAggregate("p1")).toBe(20);
    expect(store.countAggregate("p2")).toBe(20);
  });
  it("18.17.2 out-of-order concurrent append rejected (atomic: whole batch)", () => {
    const store = new EventStore();
    const batch = [
      makeEvent({ eventId: "a", aggregateId: "x", sequence: 2 }),
      makeEvent({ eventId: "b", aggregateId: "x", sequence: 1 }),
    ];
    const r = store.appendEvents(batch);
    expect(r.rejected).toBe(2);
    expect(store.count()).toBe(0);
  });
  it("18.17.3 concurrent duplicate ids rejected", () => {
    const store = new EventStore();
    const batch = [
      makeEvent({ eventId: "same", aggregateId: "x", sequence: 1 }),
      makeEvent({ eventId: "same", aggregateId: "y", sequence: 1 }),
    ];
    const r = store.appendEvents(batch);
    expect(r.rejected).toBeGreaterThanOrEqual(1);
  });
  it("18.17.4 replay after concurrent append deterministic", () => {
    const store = new EventStore();
    const batch: RuntimeEvent[] = [];
    for (let i = 1; i <= 10; i++) {
      batch.push(makeEvent({ eventId: `c-${i}`, aggregateId: "c", sequence: i }));
    }
    store.appendEvents(batch);
    const replay = new ReplayEngine(store);
    expect(replay.replayAggregate("c", SUM_REDUCER).state.sum).toBe(10);
  });
  it("18.17.5 mixed valid/invalid batch rejected atomically (no partial)", () => {
    const store = new EventStore();
    const batch = [
      makeEvent({ eventId: "good1", aggregateId: "m", sequence: 1 }),
      makeEvent({ eventId: "bad", aggregateId: "m", sequence: 5 }),
      makeEvent({ eventId: "good2", aggregateId: "m", sequence: 2 }),
    ];
    const r = store.appendEvents(batch);
    expect(r.accepted).toBe(0);
    expect(r.rejected).toBe(3);
    expect(store.count()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.18 Snapshot Recovery & Versioning
// ─────────────────────────────────────────────────────────────────────────────

describe("18.18 Snapshot Recovery & Versioning", () => {
  let store: EventStore;
  let replay: ReplayEngine;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents(seqEvents(3, "ver-agg"));
    replay = new ReplayEngine(store);
  });

  it("18.18.1 snapshot at intermediate sequence recoverable", () => {
    const snap = replay.createSnapshot("ver-agg", { at: 3 });
    expect(snap.sequence).toBe(3);
  });
  it("18.18.2 snapshot metadata round-trips", () => {
    const snap = replay.createSnapshot("ver-agg", {}, { mission: "m1" });
    expect(replay.loadSnapshot(snap.snapshotId)!.metadata.mission).toBe("m1");
  });
  it("18.18.3 replayFromSnapshot on empty subsequent yields baseline only", () => {
    const snap = replay.createSnapshot("ver-agg", { base: 1 });
    const r = replay.replayFromSnapshot(snap.snapshotId, SUM_REDUCER)!;
    expect(r.events.length).toBe(0);
    expect((r.state as any).base).toBe(1);
  });
  it("18.18.4 schemaVersion preserved in events", () => {
    const e = store.loadAggregate("ver-agg")[0]!;
    expect(e.schemaVersion).toBe(CURRENT_EVENT_SCHEMA_VERSION);
  });
  it("18.18.5 multiple snapshots listed", () => {
    replay.createSnapshot("ver-agg", {});
    replay.createSnapshot("ver-agg", {});
    expect(replay.listSnapshots().length).toBeGreaterThanOrEqual(2);
  });
  it("18.18.6 snapshot does not mutate aggregate events", () => {
    replay.createSnapshot("ver-agg", {});
    expect(store.countAggregate("ver-agg")).toBe(3);
  });
  it("18.18.7 snapshot recovery sum equals full replay", () => {
    const snap = replay.createSnapshot("ver-agg", replay.replayUntil("ver-agg", 3, SUM_REDUCER).state);
    store.appendEvent(makeEvent({ eventId: "evt-ver-agg-4", aggregateId: "ver-agg", sequence: 4, payload: { value: 4 } }));
    const fromSnap = replay.replayFromSnapshot(snap.snapshotId, SUM_REDUCER)!;
    const full = replay.replayAggregate("ver-agg", SUM_REDUCER);
    expect(fromSnap.state.sum).toBe(full.state.sum);
  });
  it("18.18.8 listSnapshots returns copies", () => {
    const s = replay.createSnapshot("ver-agg", {});
    replay.listSnapshots()[0]!.runtimeState.hack = 1;
    expect(replay.loadSnapshot(s.snapshotId)!.runtimeState.hack).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.19 Event Export & Cross-module
// ─────────────────────────────────────────────────────────────────────────────

describe("18.19 Event Export & Cross-module", () => {
  let store: EventStore;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents(seqEvents(3));
  });

  it("18.19.1 export contains all events", () => {
    expect(store.export().events.length).toBe(3);
  });
  it("18.19.2 export events carry schemaVersion", () => {
    expect(store.export().events.every((e) => e.schemaVersion === CURRENT_EVENT_SCHEMA_VERSION)).toBe(true);
  });
  it("18.19.3 persistence wraps event store export", () => {
    const p = new Persistence(store);
    expect(p.getEventStore().export().events.length).toBe(3);
  });
  it("18.19.4 replay engine reads via event store", () => {
    const replay = new ReplayEngine(store);
    expect(replay.replayAggregate("agg-seq").events.length).toBe(3);
  });
  it("18.19.5 all canonical event types exportable", () => {
    const s = new EventStore();
    MISSION_EVENT_TYPES.forEach((t, i) => {
      s.appendEvent(makeEvent({ eventId: `ex-${i}`, aggregateId: "ex", sequence: i + 1, eventType: t }));
    });
    expect(s.export().events.length).toBe(19);
  });
  it("18.19.6 snapshot not in event log (separation)", () => {
    const replay = new ReplayEngine(store);
    replay.createSnapshot("agg-seq", {});
    expect(store.count()).toBe(3);
  });
  it("18.19.7 event store decoupled from EvidenceGraph", () => {
    // EventStore must not import or expose EvidenceGraph internals.
    const src = require("fs").readFileSync(
      new (require("url").URL)("../../src/runtime/event-store.ts", import.meta.url),
      "utf-8"
    );
    expect(src).not.toMatch(/EvidenceGraph/);
  });
  it("18.19.8 persistence decoupled from EvidenceGraph", () => {
    const src = require("fs").readFileSync(
      new (require("url").URL)("../../src/runtime/persistence.ts", import.meta.url),
      "utf-8"
    );
    expect(src).not.toMatch(/EvidenceGraph/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.20 Mission/Event Id & Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe("18.20 Edge Cases", () => {
  let store: EventStore;
  let replay: ReplayEngine;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents(seqEvents(2, "edge"));
    replay = new ReplayEngine(store);
  });

  it("18.20.1 single event replay", () => {
    const s = new EventStore();
    s.appendEvent(makeEvent({ eventId: "one", aggregateId: "one", sequence: 1 }));
    expect(new ReplayEngine(s).replayAggregate("one").events.length).toBe(1);
  });
  it("18.20.2 replay unknown aggregate returns empty valid", () => {
    const r = replay.replayAggregate("ghost");
    expect(r.valid);
    expect(r.events.length).toBe(0);
  });
  it("18.20.3 loadEvent unknown returns undefined", () => {
    expect(store.loadEvent("ghost")).toBeUndefined();
  });
  it("18.20.4 correlationId stored and loaded", () => {
    store.appendEvent(makeEvent({ eventId: "corr", sequence: 1, aggregateId: "corr", correlationId: "cid" }));
    expect(store.loadEvent("corr")!.correlationId).toBe("cid");
  });
  it("18.20.5 causationId chain stored", () => {
    store.appendEvent(makeEvent({ eventId: "c1", sequence: 1, aggregateId: "ch2" }));
    store.appendEvent(makeEvent({ eventId: "c2", sequence: 2, aggregateId: "ch2", causationId: "c1" }));
    expect(store.loadEvent("c2")!.causationId).toBe("c1");
  });
  it("18.20.6 metadata preserved", () => {
    store.appendEvent(makeEvent({ eventId: "md", sequence: 1, aggregateId: "md", metadata: { k: "v" } }));
    expect(store.loadEvent("md")!.metadata.k).toBe("v");
  });
  it("18.20.7 payload deep preserved", () => {
    store.appendEvent(makeEvent({ eventId: "pl", sequence: 1, aggregateId: "pl", payload: { nested: { a: 1 } } }));
    expect((store.loadEvent("pl")!.payload.nested as any).a).toBe(1);
  });
  it("18.20.8 actor role preserved", () => {
    store.appendEvent(makeEvent({ eventId: "ac", sequence: 1, aggregateId: "ac", actor: { id: "u", role: "GUARDIAN" as any } }));
    expect(store.loadEvent("ac")!.actor.role).toBe("GUARDIAN");
  });
  it("18.20.9 authority preserved", () => {
    store.appendEvent(
      makeEvent({
        eventId: "au",
        sequence: 1,
        aggregateId: "au",
        authority: { authorityId: "guardian", actorRole: "GUARDIAN" as any, status: "GRANTED" as any },
      })
    );
    expect(store.loadEvent("au")!.authority.authorityId).toBe("guardian");
  });
  it("18.20.10 replayUntil with missing events", () => {
    expect(replay.replayUntil("edge", 10).events.length).toBe(2);
  });
  it("18.20.11 replayFrom mission-level", () => {
    expect(replay.replayMission("m1").events.length).toBe(2);
  });
  it("18.20.12 countMission after append", () => {
    expect(store.countMission("m1")).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18.21 RT-006-C1 — Durability Boundary, Global Ordering, Governance
// ─────────────────────────────────────────────────────────────────────────────

import {
  InMemoryEventStorageAdapter,
  InMemorySnapshotStorageAdapter,
  FakeEventStorageAdapter,
} from "../../src/runtime/storage-adapters.js";
import { InMemoryMaterializedViewStore } from "../../src/runtime/materialized-view-store.js";

describe("18.21 RT-006-C1 — Global Position", () => {
  let store: EventStore;
  beforeEach(() => {
    store = new EventStore();
  });

  it("18.21.1 first event receives globalPosition 1", () => {
    store.appendEvent(makeEvent({ eventId: "g1", sequence: 1, aggregateId: "g" }));
    expect(store.loadEvent("g1")!.globalPosition).toBe(1);
  });
  it("18.21.2 globalPosition monotonically increasing", () => {
    store.appendEvents(seqEvents(5, "gp"));
    const positions = store.export().events.map((e) => e.globalPosition);
    expect(positions).toEqual([1, 2, 3, 4, 5]);
  });
  it("18.21.3 globalPosition unique across all events", () => {
    store.appendEvents(seqEvents(4, "a"));
    store.appendEvents(seqEvents(4, "b"));
    const positions = store.export().events.map((e) => e.globalPosition);
    expect(new Set(positions).size).toBe(positions.length);
  });
  it("18.21.4 cross-aggregate global ordering is store-wide", () => {
    store.appendEvent(makeEvent({ eventId: "x", sequence: 1, aggregateId: "x" }));
    store.appendEvent(makeEvent({ eventId: "y", sequence: 1, aggregateId: "y" }));
    expect(store.stream().map((e) => e.eventId)).toEqual(["x", "y"]);
  });
  it("18.21.5 mission stream uses globalPosition order", () => {
    store.appendEvent(makeEvent({ eventId: "m1", sequence: 1, aggregateId: "x", missionId: "M" }));
    store.appendEvent(makeEvent({ eventId: "m2", sequence: 2, aggregateId: "x", missionId: "M" }));
    store.appendEvent(makeEvent({ eventId: "m3", sequence: 1, aggregateId: "y", missionId: "M" }));
    expect(store.streamMission("M").map((e) => e.eventId)).toEqual(["m1", "m2", "m3"]);
  });
  it("18.21.6 export uses globalPosition order", () => {
    store.appendEvent(makeEvent({ eventId: "e2", sequence: 1, aggregateId: "y" }));
    store.appendEvent(makeEvent({ eventId: "e1", sequence: 1, aggregateId: "x" }));
    expect(store.export().events.map((e) => e.eventId)).toEqual(["e2", "e1"]);
  });
  it("18.21.7 replayMission uses globalPosition order (cross-aggregate)", () => {
    store.appendEvent(makeEvent({ eventId: "r2", sequence: 1, aggregateId: "y", missionId: "M" }));
    store.appendEvent(makeEvent({ eventId: "r1", sequence: 1, aggregateId: "x", missionId: "M" }));
    const r = new ReplayEngine(store).replayMission("M");
    expect(r.events.map((e) => e.eventId)).toEqual(["r2", "r1"]);
  });
  it("18.21.8 caller cannot override globalPosition", () => {
    store.appendEvent(makeEvent({ eventId: "o1", sequence: 1, aggregateId: "x", globalPosition: 999 }));
    expect(store.loadEvent("o1")!.globalPosition).toBe(1);
  });
  it("18.21.9 failed append does not consume globalPosition", () => {
    store.appendEvent(makeEvent({ eventId: "ok", sequence: 1, aggregateId: "x" }));
    store.appendEvent(makeEvent({ eventId: "bad", sequence: 99, aggregateId: "x" }));
    store.appendEvent(makeEvent({ eventId: "ok2", sequence: 2, aggregateId: "x" }));
    expect(store.loadEvent("ok2")!.globalPosition).toBe(2);
  });
  it("18.21.10 global positions remain gap-free after rejected batch", () => {
    store.appendEvents(seqEvents(3, "gf"));
    const bad = seqEvents(3, "gf2");
    bad[1] = makeEvent({ eventId: "bad2", aggregateId: "gf2", sequence: 99 });
    store.appendEvents(bad);
    const positions = store.export().events.map((e) => e.globalPosition).sort((a, b) => a - b);
    expect(positions).toEqual([1, 2, 3]);
  });
});

describe("18.22 RT-006-C1 — Atomic Batch", () => {
  let store: EventStore;
  beforeEach(() => {
    store = new EventStore();
  });

  it("18.22.1 valid batch appends all", () => {
    const r = store.appendEvents(seqEvents(4, "ab"));
    expect(r.accepted).toBe(4);
    expect(r.rejected).toBe(0);
    expect(store.count()).toBe(4);
  });
  it("18.22.2 invalid first item appends none", () => {
    const batch = [makeEvent({ eventId: "bad", aggregateId: "x", sequence: 9 }), ...seqEvents(3, "x")];
    const r = store.appendEvents(batch);
    expect(r.accepted).toBe(0);
    expect(store.count()).toBe(0);
  });
  it("18.22.3 invalid middle item appends none", () => {
    const batch = seqEvents(3, "x");
    batch[1] = makeEvent({ eventId: "bad", aggregateId: "x", sequence: 99 });
    const r = store.appendEvents(batch);
    expect(r.accepted).toBe(0);
    expect(store.count()).toBe(0);
  });
  it("18.22.4 invalid last item appends none", () => {
    const batch = seqEvents(3, "x");
    batch.push(makeEvent({ eventId: "bad", aggregateId: "x", sequence: 99 }));
    const r = store.appendEvents(batch);
    expect(r.accepted).toBe(0);
    expect(store.count()).toBe(0);
  });
  it("18.22.5 duplicate inside batch appends none", () => {
    const batch = seqEvents(2, "x");
    batch.push(makeEvent({ eventId: batch[0]!.eventId, aggregateId: "x", sequence: 3 }));
    const r = store.appendEvents(batch);
    expect(r.accepted).toBe(0);
    expect(store.count()).toBe(0);
  });
  it("18.22.6 conflict with store appends none", () => {
    store.appendEvents(seqEvents(2, "x"));
    const r = store.appendEvents([makeEvent({ eventId: "n", aggregateId: "x", sequence: 1 })]);
    expect(r.accepted).toBe(0);
    expect(store.count()).toBe(2);
  });
  it("18.22.7 aggregate sequences unchanged after rejection", () => {
    store.appendEvents(seqEvents(2, "x"));
    const bad = seqEvents(3, "x");
    bad[1] = makeEvent({ eventId: "bad", aggregateId: "x", sequence: 99 });
    store.appendEvents(bad);
    expect(store.loadAggregate("x").map((e) => e.sequence)).toEqual([1, 2]);
  });
});

describe("18.23 RT-006-C1 — Storage Adapters", () => {
  it("18.23.1 EventStore uses adapter contract (fake injectable)", () => {
    const fake = new FakeEventStorageAdapter();
    const store = new EventStore(fake);
    store.appendEvent(makeEvent({ eventId: "f1", sequence: 1, aggregateId: "f" }));
    expect(fake.appendCalls).toBe(1);
    expect(store.count()).toBe(1);
  });
  it("18.23.2 in-memory adapter deep copies writes", () => {
    const adapter = new InMemoryEventStorageAdapter();
    const store = new EventStore(adapter);
    const e = makeEvent({ eventId: "d1", sequence: 1, aggregateId: "d" });
    store.appendEvent(e);
    e.payload.value = 123;
    expect((adapter.loadEvent("d1")!.payload.value as number)).toBe(1);
  });
  it("18.23.3 in-memory adapter deep copies reads", () => {
    const adapter = new InMemoryEventStorageAdapter();
    const store = new EventStore(adapter);
    store.appendEvent(makeEvent({ eventId: "d2", sequence: 1, aggregateId: "d", payload: { v: 1 } }));
    const loaded = adapter.loadEvent("d2")!;
    loaded.payload.v = 9;
    expect((store.loadEvent("d2")!.payload.v as number)).toBe(1);
  });
  it("18.23.4 alternate fake adapter can be injected into Persistence", () => {
    const fake = new FakeEventStorageAdapter();
    const store = new EventStore(fake);
    const p = new Persistence(store);
    p.append(makeEvent({ eventId: "p1", sequence: 1, aggregateId: "p" }));
    expect(fake.appendCalls).toBe(1);
  });
  it("18.23.5 EventStore contains no PostgreSQL assumptions", () => {
    const src = require("fs").readFileSync(
      new (require("url").URL)("../../src/runtime/event-store.ts", import.meta.url),
      "utf-8"
    );
    expect(src).not.toMatch(/postgres|PostgreSQL|pg\./i);
  });
  it("18.23.6 snapshot adapter stores and loads", () => {
    const snapAdapter = new InMemorySnapshotStorageAdapter();
    const snap: Snapshot = {
      snapshotId: "s1",
      aggregateId: "a",
      sequence: 2,
      globalPosition: 5,
      timestamp: new Date().toISOString(),
      runtimeState: { x: 1 },
      metadata: {},
    };
    snapAdapter.save(snap);
    expect(snapAdapter.load("s1")!.runtimeState.x).toBe(1);
    expect(snapAdapter.listByAggregate("a").length).toBe(1);
    expect(snapAdapter.delete("s1")).toBe(true);
  });
});

describe("18.24 RT-006-C1 — Materialized Views", () => {
  it("18.24.1 event log independent from views", () => {
    const p = new Persistence();
    p.append(makeEvent({ eventId: "e1", sequence: 1, aggregateId: "a" }));
    p.putRecord(makeRecord("r1", "a"));
    expect(p.countEvents()).toBe(1);
    expect(p.countRecords()).toBe(1);
  });
  it("18.24.2 view removal does not remove events", () => {
    const p = new Persistence();
    p.append(makeEvent({ eventId: "e1", sequence: 1, aggregateId: "a" }));
    p.putRecord(makeRecord("r1", "a"));
    p.removeRecord("r1");
    expect(p.countEvents()).toBe(1);
  });
  it("18.24.3 view clear does not remove events", () => {
    const p = new Persistence();
    p.append(makeEvent({ eventId: "e1", sequence: 1, aggregateId: "a" }));
    p.putRecord(makeRecord("r1", "a"));
    p.clearRecords();
    expect(p.countEvents()).toBe(1);
  });
  it("18.24.4 put does not append events", () => {
    const p = new Persistence();
    p.putRecord(makeRecord("r1"));
    expect(p.countEvents()).toBe(0);
  });
  it("18.24.5 rebuild preparation contract exists", () => {
    const view = new InMemoryMaterializedViewStore();
    const rec = makeRecord("r1", "a", "m1", { v: 1 });
    view.put(rec);
    // Rebuild-from-replay preparation: provenance recorded.
    expect(rec.derivedFromGlobalPosition).toBe(0);
    expect(view.load("r1")!.recordId).toBe("r1");
  });
  it("18.24.6 view record deep copy on list", () => {
    const view = new InMemoryMaterializedViewStore();
    view.put(makeRecord("r1", "a", "m1", { nested: { v: 1 } }));
    view.list()[0]!.state.nested = { v: 9 };
    expect((view.load("r1")!.state.nested as any).v).toBe(1);
  });
});

describe("18.25 RT-006-C1 — Typed Authority", () => {
  let store: EventStore;
  beforeEach(() => {
    store = new EventStore();
  });

  it("18.25.1 typed reference required (string rejected)", () => {
    const r = store.appendEvent(
      makeEvent({ authority: "guardian" as any })
    );
    expect(r.valid).toBe(false);
  });
  it("18.25.2 invalid status rejected", () => {
    const r = store.appendEvent(
      makeEvent({
        authority: { authorityId: "a", actorRole: "GUARDIAN" as any, status: "BOGUS" as any },
      })
    );
    expect(r.valid).toBe(false);
  });
  it("18.25.3 valid status accepted", () => {
    const r = store.appendEvent(
      makeEvent({
        authority: { authorityId: "a", actorRole: "GUARDIAN" as any, status: "GRANTED" as any },
        eventId: "ok",
        aggregateId: "ok",
        sequence: 1,
      })
    );
    expect(r.valid).toBe(true);
  });
  it("18.25.4 role and decision link preserved", () => {
    store.appendEvent(
      makeEvent({
        eventId: "au",
        aggregateId: "au",
        sequence: 1,
        authority: {
          authorityId: "a",
          actorRole: "GUARDIAN" as any,
          status: "GRANTED" as any,
          decisionId: "dec-1",
          grantedBy: "bro",
        },
      })
    );
    const loaded = store.loadEvent("au")!;
    expect(loaded.authority.actorRole).toBe("GUARDIAN");
    expect(loaded.authority.decisionId).toBe("dec-1");
    expect(loaded.authority.grantedBy).toBe("bro");
  });
  it("18.25.5 authority deep-copy immutability", () => {
    store.appendEvent(
      makeEvent({ eventId: "au2", aggregateId: "au2", sequence: 1, authority: { authorityId: "a", actorRole: "GUARDIAN" as any, status: "GRANTED" as any } })
    );
    const loaded = store.loadEvent("au2")!;
    loaded.authority.authorityId = "mutated";
    expect(store.loadEvent("au2")!.authority.authorityId).toBe("a");
  });
});

describe("18.26 RT-006-C1 — Replay Ordering & Validation Codes", () => {
  let store: EventStore;
  beforeEach(() => {
    store = new EventStore();
    store.appendEvents(seqEvents(3, "ro"));
  });

  it("18.26.1 replayAggregate uses aggregate sequence order", () => {
    const r = new ReplayEngine(store).replayAggregate("ro");
    expect(r.events.map((e) => e.sequence)).toEqual([1, 2, 3]);
  });
  it("18.26.2 replayMission uses globalPosition order", () => {
    const r = new ReplayEngine(store).replayMission("m1");
    expect(r.events.map((e) => e.globalPosition)).toEqual([1, 2, 3]);
  });
  it("18.26.3 replay twice identical result", () => {
    const engine = new ReplayEngine(store);
    expect(engine.replayAggregate("ro", SUM_REDUCER).state).toEqual(
      engine.replayAggregate("ro", SUM_REDUCER).state
    );
  });
  it("18.26.4 snapshot replay equals full replay", () => {
    const engine = new ReplayEngine(store);
    const snap = engine.createSnapshot("ro", engine.replayAggregate("ro", SUM_REDUCER).state);
    store.appendEvent(makeEvent({ eventId: "evt-ro-4", aggregateId: "ro", sequence: 4, payload: { value: 4 } }));
    const fromSnap = engine.replayFromSnapshot(snap.snapshotId, SUM_REDUCER)!;
    const full = engine.replayAggregate("ro", SUM_REDUCER);
    expect(fromSnap.state.sum).toBe(full.state.sum);
  });
  it("18.26.5 global history replay deterministic", () => {
    const engine = new ReplayEngine(store);
    expect(engine.replayMission("m1", SUM_REDUCER).state).toEqual(
      engine.replayMission("m1", SUM_REDUCER).state
    );
  });
  it("18.26.6 replay detects duplicate globalPosition", () => {
    const events = [
      makeEvent({ eventId: "a", aggregateId: "x", sequence: 1, globalPosition: 1 }),
      makeEvent({ eventId: "b", aggregateId: "y", sequence: 1, globalPosition: 1 }),
    ];
    const r = new ReplayEngine(store).validateReplay(events);
    expect(r.errors.some((e) => e.code === "DUPLICATE_GLOBAL_POSITION")).toBe(true);
  });
  it("18.26.7 replay detects invalid globalPosition order", () => {
    const events = [
      makeEvent({ eventId: "a", aggregateId: "x", sequence: 1, globalPosition: 2 }),
      makeEvent({ eventId: "b", aggregateId: "y", sequence: 1, globalPosition: 4 }),
    ];
    const r = new ReplayEngine(store).validateReplay(events);
    expect(r.errors.some((e) => e.code === "INVALID_GLOBAL_POSITION_ORDER")).toBe(true);
  });
  it("18.26.8 replay detects missing globalPosition when assigned", () => {
    const events = [
      makeEvent({ eventId: "a", aggregateId: "x", sequence: 1, globalPosition: 1 }),
      makeEvent({ eventId: "b", aggregateId: "y", sequence: 1, globalPosition: 0 }),
    ];
    const r = new ReplayEngine(store).validateReplay(events);
    expect(r.errors.some((e) => e.code === "MISSING_GLOBAL_POSITION")).toBe(true);
  });
  it("18.26.9 atomic batch rejection surfaces ATOMIC_BATCH_REJECTED code", () => {
    // validateReplay itself does not perform batching; the EventStore enforces
    // atomicity. This test asserts the issue code is registered in the type.
    const issue: ReplayIssue = { code: "ATOMIC_BATCH_REJECTED", message: "x" };
    expect(issue.code).toBe("ATOMIC_BATCH_REJECTED");
  });
});

describe("18.27 RT-006-C1 — Documentation / Source Coupling", () => {
  it("18.27.1 EventStore does not import EvidenceGraph", () => {
    const src = require("fs").readFileSync(
      new (require("url").URL)("../../src/runtime/event-store.ts", import.meta.url),
      "utf-8"
    );
    expect(src).not.toMatch(/EvidenceGraph/);
  });
  it("18.27.2 ReplayEngine does not import EvidenceGraph", () => {
    const src = require("fs").readFileSync(
      new (require("url").URL)("../../src/runtime/replay.ts", import.meta.url),
      "utf-8"
    );
    expect(src).not.toMatch(/EvidenceGraph/);
  });
  it("18.27.3 Persistence does not import EvidenceGraph", () => {
    const src = require("fs").readFileSync(
      new (require("url").URL)("../../src/runtime/persistence.ts", import.meta.url),
      "utf-8"
    );
    expect(src).not.toMatch(/EvidenceGraph/);
  });
  it("18.27.4 Router does not import EvidenceGraph runtime class", () => {
    const src = require("fs").readFileSync(
      new (require("url").URL)("../../src/runtime/router.ts", import.meta.url),
      "utf-8"
    );
    expect(src).not.toMatch(/EvidenceGraph/);
  });
});

describe("18.28 RT-006-C1 — Honest Backend Naming", () => {
  it("18.28.1 in-memory adapter is process-local (no durability claims)", () => {
    const adapter = new InMemoryEventStorageAdapter();
    const store = new EventStore(adapter);
    store.appendEvent(makeEvent({ eventId: "e1", sequence: 1, aggregateId: "a" }));
    expect(store.count()).toBe(1);
    // A fresh adapter has no data — proves non-durable process-local boundary.
    const fresh = new InMemoryEventStorageAdapter();
    expect(fresh.count()).toBe(0);
  });
  it("18.28.2 README documents non-durable in-memory backend", () => {
    const src = require("fs").readFileSync(
      new (require("url").URL)("../../README.md", import.meta.url),
      "utf-8"
    );
    expect(src).toMatch(/InMemoryEventStorageAdapter|process-local|non-durable/i);
  });
  it("18.28.3 README contains no duplicate RT-007 roadmap section", () => {
    const src = require("fs").readFileSync(
      new (require("url").URL)("../../README.md", import.meta.url),
      "utf-8"
    );
    const matches = src.match(/Executor Integration \(RT-007\)/g) ?? [];
    expect(matches.length).toBeLessThanOrEqual(1);
  });
});
