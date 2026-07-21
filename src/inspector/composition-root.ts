/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Inspector Composition Root
// Blueprint Reference: RTHINK-BP-001 §18, RT-008A-R1 §9.6
// Mission: RTHINK-RT-008B (Inspector Backend API)
//
// The Composition Root is the SINGLE PLACE where InspectorReadModel is
// constructed with explicit dependency injection of Runtime module instances.
// No implicit global singleton. No ambient service locator.
//
// Usage:
//   import { createInspector } from "./inspector/composition-root.js";
//   const inspector = createInspector({
//     eventStore, persistence, replayEngine,
//     artifactRegistry, evidenceGraph, router, coordinators
//   });

import { InspectorReadModelImpl } from "./inspector-read-model-impl.js";
import type { InspectorReadModel } from "./inspector-read-model.js";
import type { InspectorReadModelDependencies } from "./inspector-read-model-impl.js";
import type { EventStore } from "../runtime/event-store.js";
import type { Persistence } from "../runtime/persistence.js";
import type { ReplayEngine } from "../runtime/replay.js";
import type { ArtifactRegistry } from "../runtime/artifact-registry.js";
import type { EvidenceGraph } from "../runtime/evidence-graph.js";
import type { Router } from "../runtime/router.js";
import type { MissionRuntimeCoordinator } from "../runtime/mission-runtime-coordinator.js";

// ─── Composition Root Input ────────────────────────────────────────────────

export interface InspectorCompositionInput {
  eventStore: EventStore;
  persistence: Persistence;
  replayEngine: ReplayEngine;
  artifactRegistry: ArtifactRegistry;
  evidenceGraph: EvidenceGraph;
  router: Router;
  coordinators: Map<string, MissionRuntimeCoordinator>;
}

// ─── Composition Root ──────────────────────────────────────────────────────

/**
 * Create an InspectorReadModel with explicit dependency injection.
 *
 * This is the SINGLE ENTRY POINT for constructing the Inspector.
 * All Runtime dependencies are injected here. The returned InspectorReadModel
 * is the ONLY interface through which the Inspector reads Runtime state.
 *
 * @param input - Runtime module instances to inject
 * @returns InspectorReadModel - read-only boundary for Inspector queries
 */
export function createInspector(
  input: InspectorCompositionInput
): InspectorReadModel {
  const deps: InspectorReadModelDependencies = {
    eventStore: input.eventStore,
    persistence: input.persistence,
    replayEngine: input.replayEngine,
    artifactRegistry: input.artifactRegistry,
    evidenceGraph: input.evidenceGraph,
    router: input.router,
    coordinators: input.coordinators,
  };

  return new InspectorReadModelImpl(deps);
}
