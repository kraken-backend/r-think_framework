/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Materialized View Store (RT-006-C1)
// Blueprint Reference: RTHINK-BP-001 §19
// Mission: RTHINK-RT-006-C1 (Durability Boundary, Global Ordering, Governance)
//
// Derived current-state views. NOT authoritative history. Removing or clearing
// a view NEVER deletes events. Writing a view NEVER appends events. A view can
// be rebuilt from replay (rebuild contract prepared below).

import type { MaterializedViewStore, MaterializedViewRecord } from "../contracts/index.js";

const MATERIALIZED_VIEW_VERSION = "rt-006-c1-v1.0";

export { MATERIALIZED_VIEW_VERSION };

export class InMemoryMaterializedViewStore implements MaterializedViewStore {
  private records: Map<string, MaterializedViewRecord> = new Map();

  put(record: MaterializedViewRecord): void {
    this.records.set(record.recordId, {
      ...record,
      state: structuredClone(record.state),
      metadata: structuredClone(record.metadata),
    } as MaterializedViewRecord);
  }

  load(recordId: string): MaterializedViewRecord | undefined {
    const r = this.records.get(recordId);
    if (!r) return undefined;
    return {
      ...r,
      state: structuredClone(r.state),
      metadata: structuredClone(r.metadata),
    } as MaterializedViewRecord;
  }

  exists(recordId: string): boolean {
    return this.records.has(recordId);
  }

  remove(recordId: string): boolean {
    return this.records.delete(recordId);
  }

  list(): MaterializedViewRecord[] {
    return Array.from(this.records.values()).map((r) => ({
      ...r,
      state: structuredClone(r.state),
      metadata: structuredClone(r.metadata),
    })) as MaterializedViewRecord[];
  }

  clear(): void {
    this.records.clear();
  }

  count(): number {
    return this.records.size;
  }
}
