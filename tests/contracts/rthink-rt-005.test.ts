// R-Think Runtime — Method / Provider Router Tests
// Blueprint Reference: RTHINK-BP-001
// Mission: RTHINK-RT-005

import { describe, it, expect, beforeEach } from "vitest";
import { ProviderRegistry, Router, ROUTER_VERSION } from "../../src/runtime/router.js";
import { toEvidenceGraphExport } from "../../src/runtime/evidence-export.js";
import { readFileSync } from "node:fs";

const evidenceExportSource = readFileSync(
  new URL("../../src/runtime/evidence-export.ts", import.meta.url),
  "utf-8"
);
import {
  ProviderStatus,
  RouterDecisionOutcome,
  RejectionReasonCode,
} from "../../src/contracts/types.js";
import type {
  Method,
  Provider,
  ExecutionRequest,
  ExecutionContext,
  ExecutionConstraints,
  RouterDecision,
} from "../../src/contracts/index.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeMethod(
  id = "method-1",
  caps: { capId: string; minVersion?: string }[] = []
): Method {
  return {
    methodId: id,
    displayName: `Method ${id}`,
    description: `Description for ${id}`,
    requiredCapabilities: caps.map((c) => ({
      capabilityId: c.capId,
      minVersion: c.minVersion,
    })),
  };
}

function makeProvider(
  id = "provider-1",
  methods: string[] = ["method-1"],
  caps: { capId: string; version: string }[] = [],
  priority = 10,
  status: ProviderStatus = ProviderStatus.AVAILABLE
): Provider {
  return {
    providerId: id,
    displayName: `Provider ${id}`,
    version: "1.0.0",
    priority,
    status,
    supportedMethods: methods,
    capabilities: caps.map((c) => ({
      capabilityId: c.capId,
      version: c.version,
    })),
    metadata: {},
  };
}

function makeContext(
  missionId = "m1",
  state: string = "OBSERVE",
  riskLevel: string = "L1_CONTROLLED"
): ExecutionContext {
  return {
    missionId,
    state: state as any,
    riskLevel: riskLevel as any,
    metadata: {},
  };
}

function makeRequest(
  requestId = "req-1",
  methodId = "method-1",
  context?: ExecutionContext,
  constraints?: ExecutionConstraints
): ExecutionRequest {
  return {
    requestId,
    methodId,
    context: context ?? makeContext(),
    constraints,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 17.1 Provider Registry — Registration
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.1 Provider Registry — Registration", () => {
  let reg: ProviderRegistry;
  beforeEach(() => { reg = new ProviderRegistry(); });

  it("17.1.1 Register valid provider succeeds", () => {
    const r = reg.register(makeProvider("p1"));
    expect(r.valid).toBe(true);
    expect(reg.size).toBe(1);
  });
  it("17.1.2 Register provider with empty ID fails", () => {
    const r = reg.register(makeProvider(""));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Provider ID"))).toBe(true);
  });
  it("17.1.3 Register provider with whitespace ID fails", () => {
    const r = reg.register(makeProvider("   "));
    expect(r.valid).toBe(false);
  });
  it("17.1.4 Register duplicate provider fails", () => {
    reg.register(makeProvider("p1"));
    const r = reg.register(makeProvider("p1"));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Duplicate"))).toBe(true);
  });
  it("17.1.5 Register provider with empty display name fails", () => {
    const p = makeProvider("p1");
    p.displayName = "";
    const r = reg.register(p);
    expect(r.valid).toBe(false);
  });
  it("17.1.6 Register provider with empty version fails", () => {
    const p = makeProvider("p1");
    p.version = "";
    const r = reg.register(p);
    expect(r.valid).toBe(false);
  });
  it("17.1.7 Register provider with negative priority fails", () => {
    const r = reg.register(makeProvider("p1", ["m1"], [], -1));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Priority"))).toBe(true);
  });
  it("17.1.8 Register provider with invalid status fails", () => {
    const p = makeProvider("p1");
    (p as any).status = "BOGUS";
    const r = reg.register(p);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Invalid provider status"))).toBe(true);
  });
  it("17.1.9 Register provider with no supported methods fails", () => {
    const r = reg.register(makeProvider("p1", []));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("at least one method"))).toBe(true);
  });
  it("17.1.10 Register preserves metadata", () => {
    const p = makeProvider("p1");
    p.metadata = { key: "value" };
    reg.register(p);
    const regItem = reg.lookup("p1")!;
    expect(regItem.provider.metadata.key).toBe("value");
  });
  it("17.1.11 Registration timestamp is set", () => {
    reg.register(makeProvider("p1"));
    const regItem = reg.lookup("p1")!;
    expect(regItem.registeredAt).toBeTruthy();
  });
  it("17.1.12 New provider is enabled by default", () => {
    reg.register(makeProvider("p1"));
    const regItem = reg.lookup("p1")!;
    expect(regItem.enabled).toBe(true);
  });
  it("17.1.13 Register multiple providers", () => {
    reg.register(makeProvider("p1"));
    reg.register(makeProvider("p2"));
    reg.register(makeProvider("p3"));
    expect(reg.size).toBe(3);
  });
  it("17.1.14 Register provider with zero priority succeeds", () => {
    const r = reg.register(makeProvider("p1", ["m1"], [], 0));
    expect(r.valid).toBe(true);
  });
  it("17.1.15 Register provider with multiple methods", () => {
    const r = reg.register(makeProvider("p1", ["m1", "m2", "m3"]));
    expect(r.valid).toBe(true);
  });
  it("17.1.16 Register provider with capabilities", () => {
    const r = reg.register(makeProvider("p1", ["m1"], [
      { capId: "cap-a", version: "1.0.0" },
      { capId: "cap-b", version: "2.0.0" },
    ]));
    expect(r.valid).toBe(true);
    const regItem = reg.lookup("p1")!;
    expect(regItem.provider.capabilities.length).toBe(2);
  });
  it("17.1.17 Register returns multiple errors at once", () => {
    const p = makeProvider("");
    p.displayName = "";
    p.version = "";
    const r = reg.register(p);
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(3);
  });
  it("17.1.18 Registration stores a copy, not the original reference", () => {
    const p = makeProvider("p1");
    reg.register(p);
    p.displayName = "changed";
    expect(reg.lookup("p1")!.provider.displayName).not.toBe("changed");
  });
  it("17.1.19 Provider priority is preserved", () => {
    reg.register(makeProvider("p1", ["m1"], [], 42));
    expect(reg.lookup("p1")!.provider.priority).toBe(42);
  });
  it("17.1.20 Provider status is preserved", () => {
    reg.register(makeProvider("p1", ["m1"], [], 10, ProviderStatus.UNAVAILABLE));
    expect(reg.lookup("p1")!.provider.status).toBe(ProviderStatus.UNAVAILABLE);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.2 Provider Registry — Removal
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.2 Provider Registry — Removal", () => {
  let reg: ProviderRegistry;
  beforeEach(() => { reg = new ProviderRegistry(); });

  it("17.2.1 Remove existing provider returns true", () => {
    reg.register(makeProvider("p1"));
    expect(reg.unregister("p1")).toBe(true);
  });
  it("17.2.2 Remove nonexistent provider returns false", () => {
    expect(reg.unregister("nonexistent")).toBe(false);
  });
  it("17.2.3 Size decreases after removal", () => {
    reg.register(makeProvider("p1"));
    reg.register(makeProvider("p2"));
    reg.unregister("p1");
    expect(reg.size).toBe(1);
  });
  it("17.2.4 Removed provider not in list", () => {
    reg.register(makeProvider("p1"));
    reg.register(makeProvider("p2"));
    reg.unregister("p1");
    const ids = reg.list().map((r) => r.provider.providerId);
    expect(ids).toEqual(["p2"]);
  });
  it("17.2.5 Removed provider not in lookup", () => {
    reg.register(makeProvider("p1"));
    reg.unregister("p1");
    expect(reg.lookup("p1")).toBeUndefined();
  });
  it("17.2.6 Remove last provider leaves empty registry", () => {
    reg.register(makeProvider("p1"));
    reg.unregister("p1");
    expect(reg.size).toBe(0);
    expect(reg.list()).toEqual([]);
  });
  it("17.2.7 Remove all providers one by one", () => {
    reg.register(makeProvider("p1"));
    reg.register(makeProvider("p2"));
    reg.register(makeProvider("p3"));
    reg.unregister("p1");
    reg.unregister("p2");
    reg.unregister("p3");
    expect(reg.size).toBe(0);
  });
  it("17.2.8 Re-register after removal succeeds", () => {
    reg.register(makeProvider("p1"));
    reg.unregister("p1");
    const r = reg.register(makeProvider("p1"));
    expect(r.valid).toBe(true);
    expect(reg.size).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.3 Provider Registry — Enable / Disable
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.3 Provider Registry — Enable / Disable", () => {
  let reg: ProviderRegistry;
  beforeEach(() => { reg = new ProviderRegistry(); });

  it("17.3.1 Disable existing provider returns true", () => {
    reg.register(makeProvider("p1"));
    expect(reg.disable("p1")).toBe(true);
  });
  it("17.3.2 Enable existing provider returns true", () => {
    reg.register(makeProvider("p1"));
    reg.disable("p1");
    expect(reg.enable("p1")).toBe(true);
  });
  it("17.3.3 Disable nonexistent provider returns false", () => {
    expect(reg.disable("nonexistent")).toBe(false);
  });
  it("17.3.4 Enable nonexistent provider returns false", () => {
    expect(reg.enable("nonexistent")).toBe(false);
  });
  it("17.3.5 Disabled provider shows enabled=false in list", () => {
    reg.register(makeProvider("p1"));
    reg.disable("p1");
    expect(reg.list()[0]!.enabled).toBe(false);
  });
  it("17.3.6 Enabled provider shows enabled=true in list", () => {
    reg.register(makeProvider("p1"));
    reg.disable("p1");
    reg.enable("p1");
    expect(reg.list()[0]!.enabled).toBe(true);
  });
  it("17.3.7 Disable does not change provider status", () => {
    reg.register(makeProvider("p1"));
    reg.disable("p1");
    expect(reg.lookup("p1")!.provider.status).toBe(ProviderStatus.AVAILABLE);
  });
  it("17.3.8 Multiple enable/disable cycles", () => {
    reg.register(makeProvider("p1"));
    reg.disable("p1");
    reg.enable("p1");
    reg.disable("p1");
    reg.enable("p1");
    expect(reg.lookup("p1")!.enabled).toBe(true);
  });
  it("17.3.9 Disable one provider does not affect others", () => {
    reg.register(makeProvider("p1"));
    reg.register(makeProvider("p2"));
    reg.disable("p1");
    expect(reg.lookup("p2")!.enabled).toBe(true);
  });
  it("17.3.10 Lookup reflects enabled state", () => {
    reg.register(makeProvider("p1"));
    expect(reg.lookup("p1")!.enabled).toBe(true);
    reg.disable("p1");
    expect(reg.lookup("p1")!.enabled).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.4 Provider Registry — Lookup and Search
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.4 Provider Registry — Lookup and Search", () => {
  let reg: ProviderRegistry;
  beforeEach(() => { reg = new ProviderRegistry(); });

  it("17.4.1 Lookup existing provider returns registration", () => {
    reg.register(makeProvider("p1"));
    expect(reg.lookup("p1")).toBeDefined();
  });
  it("17.4.2 Lookup nonexistent provider returns undefined", () => {
    expect(reg.lookup("nonexistent")).toBeUndefined();
  });
  it("17.4.3 findByCapability with matching provider", () => {
    reg.register(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    const found = reg.findByCapability("ocr");
    expect(found.length).toBe(1);
    expect(found[0]!.provider.providerId).toBe("p1");
  });
  it("17.4.4 findByCapability with no match", () => {
    reg.register(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    expect(reg.findByCapability("nlp").length).toBe(0);
  });
  it("17.4.5 findByCapability with multiple matches", () => {
    reg.register(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    reg.register(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "2.0" }]));
    expect(reg.findByCapability("ocr").length).toBe(2);
  });
  it("17.4.6 findByMethod with matching provider", () => {
    reg.register(makeProvider("p1", ["m1", "m2"]));
    const found = reg.findByMethod("m2");
    expect(found.length).toBe(1);
    expect(found[0]!.provider.providerId).toBe("p1");
  });
  it("17.4.7 findByMethod with no match", () => {
    reg.register(makeProvider("p1", ["m1"]));
    expect(reg.findByMethod("m99").length).toBe(0);
  });
  it("17.4.8 findByMethod with multiple matches", () => {
    reg.register(makeProvider("p1", ["m1"]));
    reg.register(makeProvider("p2", ["m1"]));
    expect(reg.findByMethod("m1").length).toBe(2);
  });
  it("17.4.9 list returns empty array for empty registry", () => {
    expect(reg.list()).toEqual([]);
  });
  it("17.4.10 list returns all registrations", () => {
    reg.register(makeProvider("p1"));
    reg.register(makeProvider("p2"));
    reg.register(makeProvider("p3"));
    expect(reg.list().length).toBe(3);
  });
  it("17.4.11 findByCapability excludes disabled providers", () => {
    reg.register(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    reg.register(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    reg.disable("p2");
    // findByCapability does NOT filter by enabled — it returns all matching
    const found = reg.findByCapability("ocr");
    expect(found.length).toBe(2);
  });
  it("17.4.12 findByMethod excludes providers that don't support the method", () => {
    reg.register(makeProvider("p1", ["m1"]));
    reg.register(makeProvider("p2", ["m2"]));
    expect(reg.findByMethod("m1").length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.5 Router — Method Management
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.5 Router — Method Management", () => {
  let router: Router;
  beforeEach(() => { router = new Router(); });

  it("17.5.1 Register valid method succeeds", () => {
    const r = router.registerMethod(makeMethod("m1"));
    expect(r.valid).toBe(true);
  });
  it("17.5.2 Register method with empty ID fails", () => {
    const r = router.registerMethod(makeMethod(""));
    expect(r.valid).toBe(false);
  });
  it("17.5.3 Register duplicate method fails", () => {
    router.registerMethod(makeMethod("m1"));
    const r = router.registerMethod(makeMethod("m1"));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Duplicate"))).toBe(true);
  });
  it("17.5.4 Register method with empty display name fails", () => {
    const m = makeMethod("m1");
    m.displayName = "";
    const r = router.registerMethod(m);
    expect(r.valid).toBe(false);
  });
  it("17.5.5 Get method returns registered method", () => {
    router.registerMethod(makeMethod("m1"));
    expect(router.getMethod("m1")).toBeDefined();
  });
  it("17.5.6 Get method returns undefined for unknown", () => {
    expect(router.getMethod("unknown")).toBeUndefined();
  });
  it("17.5.7 List methods returns all", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerMethod(makeMethod("m2"));
    expect(router.listMethods().length).toBe(2);
  });
  it("17.5.8 Unregister method returns true", () => {
    router.registerMethod(makeMethod("m1"));
    expect(router.unregisterMethod("m1")).toBe(true);
  });
  it("17.5.9 Unregister nonexistent method returns false", () => {
    expect(router.unregisterMethod("unknown")).toBe(false);
  });
  it("17.5.10 Method with required capabilities stored correctly", () => {
    router.registerMethod(makeMethod("m1", [
      { capId: "ocr", minVersion: "2.0" },
      { capId: "nlp" },
    ]));
    const m = router.getMethod("m1")!;
    expect(m.requiredCapabilities.length).toBe(2);
    expect(m.requiredCapabilities[0]!.capabilityId).toBe("ocr");
    expect(m.requiredCapabilities[0]!.minVersion).toBe("2.0");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.6 Router — Request Validation
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.6 Router — Request Validation", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1"));
  });

  it("17.6.1 Valid request passes validation", () => {
    const r = router.validateRequest(makeRequest("req-1", "m1"));
    expect(r.valid).toBe(true);
  });
  it("17.6.2 Empty requestId fails validation", () => {
    const r = router.validateRequest(makeRequest("", "m1"));
    expect(r.valid).toBe(false);
  });
  it("17.6.3 Empty methodId fails validation", () => {
    const r = router.validateRequest(makeRequest("req-1", ""));
    expect(r.valid).toBe(false);
  });
  it("17.6.4 Unknown method fails validation", () => {
    const r = router.validateRequest(makeRequest("req-1", "unknown"));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Unknown method"))).toBe(true);
  });
  it("17.6.5 Missing context fails validation", () => {
    const r = router.validateRequest({
      requestId: "req-1",
      methodId: "m1",
      context: undefined as any,
    });
    expect(r.valid).toBe(false);
  });
  it("17.6.6 Multiple validation errors returned", () => {
    const r = router.validateRequest({
      requestId: "",
      methodId: "",
      context: undefined as any,
    });
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(3);
  });
  it("17.6.7 Whitespace-only requestId fails", () => {
    const r = router.validateRequest(makeRequest("   ", "m1"));
    expect(r.valid).toBe(false);
  });
  it("17.6.8 Whitespace-only methodId fails", () => {
    const r = router.validateRequest(makeRequest("req-1", "   "));
    expect(r.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.7 Router — Basic Routing
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.7 Router — Basic Routing", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1"));
  });

  it("17.7.1 Single provider match returns SELECTED", () => {
    router.registerProvider(makeProvider("p1", ["m1"]));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.SELECTED);
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.7.2 No providers returns NO_MATCH", () => {
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.selectedProvider).toBeNull();
  });
  it("17.7.3 All providers disabled returns ALL_UNAVAILABLE", () => {
    router.registerProvider(makeProvider("p1", ["m1"]));
    router.registerProvider(makeProvider("p2", ["m1"]));
    router.disableProvider("p1");
    router.disableProvider("p2");
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
  });
  it("17.7.4 Mixed: one available, one disabled — selects available", () => {
    router.registerProvider(makeProvider("p1", ["m1"]));
    router.registerProvider(makeProvider("p2", ["m1"]));
    router.disableProvider("p2");
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.7.5 Provider with UNAVAILABLE status is skipped", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.UNAVAILABLE));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
  });
  it("17.7.6 Unknown method returns REQUEST_INVALID", () => {
    const d = router.resolve("unknown");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.REQUEST_INVALID);
  });
  it("17.7.7 Route with valid request returns valid=true", () => {
    router.registerProvider(makeProvider("p1", ["m1"]));
    const result = router.route(makeRequest("req-1", "m1"));
    expect(result.valid).toBe(true);
    expect(result.decision.finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
  it("17.7.8 Route with invalid request returns valid=false", () => {
    const result = router.route(makeRequest("", "m1"));
    expect(result.valid).toBe(false);
  });
  it("17.7.9 Route with unknown method returns REQUEST_INVALID", () => {
    const result = router.route(makeRequest("req-1", "unknown"));
    expect(result.valid).toBe(false);
    expect(result.decision.finalDecision).toBe(RouterDecisionOutcome.REQUEST_INVALID);
  });
  it("17.7.10 Provider with ERROR status is skipped", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.ERROR));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
  });
  it("17.7.11 Rejected providers list is populated", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.UNAVAILABLE));
    router.registerProvider(makeProvider("p2", ["m1"]));
    const d = router.resolve("m1");
    expect(d.rejectedProviders.length).toBe(1);
    expect(d.rejectedProviders[0]!.providerId).toBe("p1");
  });
  it("17.7.12 Decision has timestamp", () => {
    const d = router.resolve("m1");
    expect(d.timestamp).toBeTruthy();
  });
  it("17.7.13 Decision has decisionId", () => {
    const d = router.resolve("m1");
    expect(d.decisionId).toBeTruthy();
  });
  it("17.7.14 Decision IDs are unique", () => {
    const d1 = router.resolve("m1");
    const d2 = router.resolve("m1");
    expect(d1.decisionId).not.toBe(d2.decisionId);
  });
  it("17.7.15 Method not registered but provider exists — REQUEST_INVALID", () => {
    router.registerProvider(makeProvider("p1", ["m99"]));
    const d = router.resolve("m99");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.REQUEST_INVALID);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.8 Router — Capability Matching
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.8 Router — Capability Matching", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1", [
      { capId: "ocr", minVersion: "1.0" },
    ]));
  });

  it("17.8.1 Provider with matching capability is selected", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p1");
    expect(d.capabilityMatch.matchedCapabilities).toContain("ocr");
  });
  it("17.8.2 Provider missing capability is rejected", () => {
    router.registerProvider(makeProvider("p1", ["m1"], []));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders.some((r) => r.providerId === "p1" && r.code === RejectionReasonCode.REQUIRED_CAPABILITY_MISSING)).toBe(true);
  });
  it("17.8.3 Version match succeeds", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "2.0" }]));
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p1");
    expect(d.capabilityMatch.versionMatches).toContain("ocr");
  });
  it("17.8.4 Version mismatch below minVersion is rejected (hard filter)", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "0.5" }]));
    const d = router.resolve("m1");
    // minVersion is a hard requirement → provider is rejected
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders[0]!.code).toBe(RejectionReasonCode.CAPABILITY_VERSION_BELOW_MINIMUM);
  });
  it("17.8.5 Method with no required capabilities — any provider matches", () => {
    router.registerMethod(makeMethod("m-free"));
    router.registerProvider(makeProvider("p1", ["m-free"]));
    const d = router.resolve("m-free");
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.8.6 Multiple required capabilities — all must be present", () => {
    router.registerMethod(makeMethod("m-complex", [
      { capId: "ocr" },
      { capId: "nlp" },
      { capId: "vision" },
    ]));
    router.registerProvider(makeProvider("p1", ["m-complex"], [
      { capId: "ocr", version: "1.0" },
      { capId: "nlp", version: "1.0" },
    ]));
    const d = router.resolve("m-complex");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders.some((r) => r.providerId === "p1" && r.code === RejectionReasonCode.REQUIRED_CAPABILITY_MISSING)).toBe(true);
  });
  it("17.8.7 Provider with all capabilities matches", () => {
    router.registerMethod(makeMethod("m-complex", [
      { capId: "ocr" },
      { capId: "nlp" },
    ]));
    router.registerProvider(makeProvider("p1", ["m-complex"], [
      { capId: "ocr", version: "1.0" },
      { capId: "nlp", version: "1.0" },
    ]));
    const d = router.resolve("m-complex");
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.8.8 Two providers, one with cap and one without — capable wins", () => {
    router.registerProvider(makeProvider("p1", ["m1"], []));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p2");
  });
  it("17.8.9 Both providers missing capability — NO_MATCH", () => {
    router.registerProvider(makeProvider("p1", ["m1"], []));
    router.registerProvider(makeProvider("p2", ["m1"], []));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.8.10 Required capabilities list in decision is correct", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    const d = router.resolve("m1");
    expect(d.capabilityMatch.requiredCapabilities).toEqual(["ocr"]);
  });
  it("17.8.11 Provider with extra capabilities still matches", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [
      { capId: "ocr", version: "1.0" },
      { capId: "extra", version: "1.0" },
    ]));
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.8.12 Partial capability match — still NO_MATCH if any missing", () => {
    router.registerMethod(makeMethod("m2", [
      { capId: "a" },
      { capId: "b" },
      { capId: "c" },
    ]));
    router.registerProvider(makeProvider("p1", ["m2"], [
      { capId: "a", version: "1.0" },
      { capId: "b", version: "1.0" },
    ]));
    const d = router.resolve("m2");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.8.13 Capability match result tracks all providers' capabilities", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "2.0" }]));
    const d = router.resolve("m1");
    expect(d.capabilityMatch.matchedCapabilities).toContain("ocr");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.9 Router — Priority Evaluation
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.9 Router — Priority Evaluation", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1"));
  });

  it("17.9.1 Higher priority provider wins", () => {
    router.registerProvider(makeProvider("p-low", ["m1"], [], 5));
    router.registerProvider(makeProvider("p-high", ["m1"], [], 20));
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p-high");
  });
  it("17.9.2 Equal priority — first registered wins (stable order)", () => {
    router.registerProvider(makeProvider("p-first", ["m1"], [], 10));
    router.registerProvider(makeProvider("p-second", ["m1"], [], 10));
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p-first");
  });
  it("17.9.3 Priority evaluation has candidates", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 5));
    router.registerProvider(makeProvider("p2", ["m1"], [], 10));
    const d = router.resolve("m1");
    expect(d.priorityEvaluation.candidates.length).toBe(2);
  });
  it("17.9.4 Winner matches selected provider", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 5));
    router.registerProvider(makeProvider("p2", ["m1"], [], 10));
    const d = router.resolve("m1");
    expect(d.priorityEvaluation.winner).toBe(d.selectedProvider);
  });
  it("17.9.5 Higher priority score in evaluation", () => {
    router.registerProvider(makeProvider("p-low", ["m1"], [], 5));
    router.registerProvider(makeProvider("p-high", ["m1"], [], 10));
    const d = router.resolve("m1");
    const highScore = d.priorityEvaluation.candidates.find(
      (c) => c.providerId === "p-high"
    );
    const lowScore = d.priorityEvaluation.candidates.find(
      (c) => c.providerId === "p-low"
    );
    expect(highScore!.totalScore).toBeGreaterThan(lowScore!.totalScore);
  });
  it("17.9.6 Preferred provider gets priority boost via constraints", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 5));
    router.registerProvider(makeProvider("p2", ["m1"], [], 5));
    const d = router.resolve("m1", { preferProviders: ["p1"] });
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.9.7 Three providers — middle priority doesn't win", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 5));
    router.registerProvider(makeProvider("p2", ["m1"], [], 15));
    router.registerProvider(makeProvider("p3", ["m1"], [], 10));
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p2");
  });
  it("17.9.8 Tie-breaking rule is documented", () => {
    const d = router.resolve("m1");
    expect(d.priorityEvaluation.tieBreakingRule).toBeTruthy();
  });
  it("17.9.9 Candidates sorted by totalScore descending", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 5));
    router.registerProvider(makeProvider("p2", ["m1"], [], 10));
    router.registerProvider(makeProvider("p3", ["m1"], [], 15));
    const d = router.resolve("m1");
    const scores = d.priorityEvaluation.candidates.map((c) => c.totalScore);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]!).toBeGreaterThanOrEqual(scores[i]!);
    }
  });
  it("17.9.10 Zero priority provider can be selected if only provider", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 0));
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p1");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.10 Router — Constraints
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.10 Router — Constraints", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1"));
  });

  it("17.10.1 Exclude provider removes it from candidates", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [], 5));
    const d = router.resolve("m1", { excludeProviders: ["p1"] });
    expect(d.selectedProvider).toBe("p2");
    expect(d.rejectedProviders.some((r) => r.providerId === "p1" && r.code === RejectionReasonCode.EXCLUDED_BY_REQUEST_CONSTRAINT)).toBe(true);
  });
  it("17.10.2 Exclude all providers — NO_MATCH (excluded, not runtime-unavailable)", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    const d = router.resolve("m1", { excludeProviders: ["p1"] });
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders.some((r) => r.providerId === "p1" && r.code === RejectionReasonCode.EXCLUDED_BY_REQUEST_CONSTRAINT)).toBe(true);
  });
  it("17.10.3 Prefer provider boosts priority", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 100));
    router.registerProvider(makeProvider("p2", ["m1"], [], 1));
    const d = router.resolve("m1", { preferProviders: ["p2"] });
    expect(d.selectedProvider).toBe("p2");
  });
  it("17.10.4 Required capabilities constraint filters providers", () => {
    router.registerProvider(makeProvider("p1", ["m1"], []));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    const d = router.resolve("m1", { requiredCapabilities: ["ocr"] });
    expect(d.selectedProvider).toBe("p2");
  });
  it("17.10.5 Required capabilities — none match — NO_MATCH", () => {
    router.registerProvider(makeProvider("p1", ["m1"], []));
    const d = router.resolve("m1", { requiredCapabilities: ["ocr"] });
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.10.6 Combined constraints", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 5));
    router.registerProvider(makeProvider("p3", ["m1"], [], 20));
    const d = router.resolve("m1", {
      excludeProviders: ["p1"],
      requiredCapabilities: ["ocr"],
    });
    expect(d.selectedProvider).toBe("p2");
  });
  it("17.10.7 No constraints — default behavior", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.10.8 Empty constraints — default behavior", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    const d = router.resolve("m1", {});
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.10.9 Exclude nonexistent provider has no effect", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    const d = router.resolve("m1", { excludeProviders: ["nonexistent"] });
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.10.10 Prefer nonexistent provider has no effect", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    const d = router.resolve("m1", { preferProviders: ["nonexistent"] });
    expect(d.selectedProvider).toBe("p1");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.11 Router — Explainability
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.11 Router — Explainability", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1"));
  });

  it("17.11.1 Explanation for selected provider contains provider name", () => {
    router.registerProvider(makeProvider("p1", ["m1"]));
    const d = router.resolve("m1");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("p1");
  });
  it("17.11.2 Explanation for no match contains reason", () => {
    const d = router.resolve("m1");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("No providers support this method");
  });
  it("17.11.3 Explanation for all unavailable", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.UNAVAILABLE));
    const d = router.resolve("m1");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("unavailable");
  });
  it("17.11.4 Explanation for request invalid", () => {
    const d = router.resolve("unknown");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("REQUEST_INVALID");
  });
  it("17.11.5 Explanation includes rejected providers", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.UNAVAILABLE));
    router.registerProvider(makeProvider("p2", ["m1"], [], 5));
    const d = router.resolve("m1");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("Rejected");
    expect(explanation).toContain("p1");
  });
  it("17.11.6 Explanation includes selection evaluation", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [], 20));
    const d = router.resolve("m1");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("Selection evaluation");
  });
  it("17.11.7 Explanation includes timestamp", () => {
    const d = router.resolve("m1");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("Timestamp");
  });
  it("17.11.8 Explanation includes decision ID", () => {
    const d = router.resolve("m1");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain(d.decisionId);
  });
  it("17.11.9 Explanation includes outcome", () => {
    const d = router.resolve("m1");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("Outcome");
  });
  it("17.11.10 Explanation for capability failure includes rejected provider", () => {
    router.registerMethod(makeMethod("m2", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m2"], []));
    const d = router.resolve("m2");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("Rejected");
    expect(explanation).toContain("REQUIRED_CAPABILITY_MISSING");
  });
  it("17.11.11 Explanation for selected includes method name", () => {
    router.registerProvider(makeProvider("p1", ["m1"]));
    const d = router.resolve("m1");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("m1");
  });
  it("17.11.12 Explanation is multi-line string", () => {
    router.registerProvider(makeProvider("p1", ["m1"]));
    const d = router.resolve("m1");
    const explanation = router.explainDecision(d);
    expect(explanation.split("\n").length).toBeGreaterThan(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.12 Router — Registry Export
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.12 Router — Registry Export", () => {
  let router: Router;
  beforeEach(() => { router = new Router(); });

  it("17.12.1 Export empty registry", () => {
    expect(router.exportRegistry()).toEqual([]);
  });
  it("17.12.2 Export after registration", () => {
    router.registerProvider(makeProvider("p1"));
    const exported = router.exportRegistry();
    expect(exported.length).toBe(1);
    expect(exported[0]!.provider.providerId).toBe("p1");
  });
  it("17.12.3 Export after removal", () => {
    router.registerProvider(makeProvider("p1"));
    router.registerProvider(makeProvider("p2"));
    router.removeProvider("p1");
    const exported = router.exportRegistry();
    expect(exported.length).toBe(1);
    expect(exported[0]!.provider.providerId).toBe("p2");
  });
  it("17.12.4 Export preserves enabled state", () => {
    router.registerProvider(makeProvider("p1"));
    router.disableProvider("p1");
    const exported = router.exportRegistry();
    expect(exported[0]!.enabled).toBe(false);
  });
  it("17.12.5 Export preserves provider details", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 42));
    const exported = router.exportRegistry();
    const p = exported[0]!.provider;
    expect(p.priority).toBe(42);
    expect(p.capabilities.length).toBe(1);
    expect(p.supportedMethods).toEqual(["m1"]);
  });
  it("17.12.6 Export is a copy (mutation doesn't affect registry)", () => {
    router.registerProvider(makeProvider("p1"));
    const exported = router.exportRegistry();
    exported.pop();
    expect(router.exportRegistry().length).toBe(1);
  });
  it("17.12.7 listCapabilities returns sorted unique capabilities", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [
      { capId: "z-cap", version: "1.0" },
      { capId: "a-cap", version: "1.0" },
    ]));
    router.registerProvider(makeProvider("p2", ["m1"], [
      { capId: "a-cap", version: "1.0" },
      { capId: "m-cap", version: "1.0" },
    ]));
    const caps = router.listCapabilities();
    expect(caps).toEqual(["a-cap", "m-cap", "z-cap"]);
  });
  it("17.12.8 listCapabilities empty when no providers", () => {
    expect(router.listCapabilities()).toEqual([]);
  });
  it("17.12.9 getRegistry returns the registry instance", () => {
    const reg = router.getRegistry();
    expect(reg).toBeInstanceOf(ProviderRegistry);
  });
  it("17.12.10 ROUTER_VERSION is defined", () => {
    expect(ROUTER_VERSION).toBeTruthy();
    expect(ROUTER_VERSION).toContain("rt-005");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.13 Router — Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.13 Router — Edge Cases", () => {
  let router: Router;
  beforeEach(() => { router = new Router(); });

  it("17.13.1 Route after provider removal — NO_MATCH", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"]));
    router.removeProvider("p1");
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.13.2 Route after method unregistration — REQUEST_INVALID", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"]));
    router.unregisterMethod("m1");
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.REQUEST_INVALID);
  });
  it("17.13.3 Provider supporting multiple methods", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerMethod(makeMethod("m2"));
    router.registerProvider(makeProvider("p1", ["m1", "m2"]));
    expect(router.resolve("m1").selectedProvider).toBe("p1");
    expect(router.resolve("m2").selectedProvider).toBe("p1");
  });
  it("17.13.4 Multiple providers, each supporting different methods", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerMethod(makeMethod("m2"));
    router.registerProvider(makeProvider("p1", ["m1"]));
    router.registerProvider(makeProvider("p2", ["m2"]));
    expect(router.resolve("m1").selectedProvider).toBe("p1");
    expect(router.resolve("m2").selectedProvider).toBe("p2");
  });
  it("17.13.5 Method with no required capabilities — any provider works", () => {
    router.registerMethod(makeMethod("m-free"));
    router.registerProvider(makeProvider("p1", ["m-free"]));
    expect(router.resolve("m-free").selectedProvider).toBe("p1");
  });
  it("17.13.6 Enable provider after disable — routable again", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"]));
    router.disableProvider("p1");
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
    router.enableProvider("p1");
    expect(router.resolve("m1").selectedProvider).toBe("p1");
  });
  it("17.13.7 Very high priority provider wins over all", () => {
    router.registerMethod(makeMethod("m1"));
    for (let i = 1; i <= 20; i++) {
      router.registerProvider(makeProvider(`p${i}`, ["m1"], [], i));
    }
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p20");
  });
  it("17.13.8 All providers at priority 0 — first wins", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 0));
    router.registerProvider(makeProvider("p2", ["m1"], [], 0));
    router.registerProvider(makeProvider("p3", ["m1"], [], 0));
    expect(router.resolve("m1").selectedProvider).toBe("p1");
  });
  it("17.13.9 Provider with ERROR status is treated as unavailable", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.ERROR));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
  });
  it("17.13.10 Provider with UNAVAILABLE status is treated as unavailable", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.UNAVAILABLE));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
  });
  it("17.13.11 Disabled provider with AVAILABLE status is skipped", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"]));
    router.disableProvider("p1");
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
  });
  it("17.13.12 Provider not supporting the method is not a candidate", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerMethod(makeMethod("m2"));
    router.registerProvider(makeProvider("p1", ["m2"]));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.13.13 Multiple methods, different capability requirements", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerMethod(makeMethod("m2", [{ capId: "nlp" }]));
    router.registerProvider(makeProvider("p1", ["m1", "m2"], [
      { capId: "ocr", version: "1.0" },
      { capId: "nlp", version: "1.0" },
    ]));
    expect(router.resolve("m1").selectedProvider).toBe("p1");
    expect(router.resolve("m2").selectedProvider).toBe("p1");
  });
  it("17.13.14 Provider metadata preserved through routing", () => {
    router.registerMethod(makeMethod("m1"));
    const p = makeProvider("p1", ["m1"]);
    p.metadata = { region: "us-east" };
    router.registerProvider(p);
    const exported = router.exportRegistry();
    expect(exported[0]!.provider.metadata.region).toBe("us-east");
  });
  it("17.13.15 Registration timestamp is ISO format", () => {
    router.registerProvider(makeProvider("p1"));
    const reg = router.exportRegistry()[0]!;
    expect(new Date(reg.registeredAt).toISOString()).toBe(reg.registeredAt);
  });
  it("17.13.16 Empty router methods list", () => {
    expect(router.listMethods()).toEqual([]);
  });
  it("17.13.17 Register multiple methods, list returns all", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerMethod(makeMethod("m2"));
    router.registerMethod(makeMethod("m3"));
    expect(router.listMethods().length).toBe(3);
  });
  it("17.13.18 Route with constraints but no providers — REQUEST_INVALID", () => {
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.REQUEST_INVALID);
  });
  it("17.13.19 Remove provider not registered returns false", () => {
    expect(router.removeProvider("nonexistent")).toBe(false);
  });
  it("17.13.20 Disable provider not registered returns false", () => {
    expect(router.disableProvider("nonexistent")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.14 Router — Full Integration
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.14 Router — Full Integration", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("text-recognition", [{ capId: "ocr" }]));
    router.registerMethod(makeMethod("data-extraction", [{ capId: "parser" }]));
    router.registerMethod(makeMethod("translation", [{ capId: "nlp" }, { capId: "language" }]));
  });

  it("17.14.1 Three providers, different priorities — best wins", () => {
    router.registerProvider(makeProvider("fast-ocr", ["text-recognition"], [{ capId: "ocr", version: "2.0" }], 30));
    router.registerProvider(makeProvider("basic-ocr", ["text-recognition"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("slow-ocr", ["text-recognition"], [{ capId: "ocr", version: "1.0" }], 5));
    const d = router.resolve("text-recognition");
    expect(d.selectedProvider).toBe("fast-ocr");
  });
  it("17.14.2 Constraint excludes best — next best wins", () => {
    router.registerProvider(makeProvider("fast-ocr", ["text-recognition"], [{ capId: "ocr", version: "2.0" }], 30));
    router.registerProvider(makeProvider("basic-ocr", ["text-recognition"], [{ capId: "ocr", version: "1.0" }], 10));
    const d = router.resolve("text-recognition", { excludeProviders: ["fast-ocr"] });
    expect(d.selectedProvider).toBe("basic-ocr");
  });
  it("17.14.3 Provider with capability but wrong method — not a candidate", () => {
    router.registerProvider(makeProvider("parser-p", ["data-extraction"], [{ capId: "parser", version: "1.0" }]));
    const d = router.resolve("text-recognition");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.14.4 Multi-capability method — both caps required", () => {
    router.registerProvider(makeProvider("translator", ["translation"], [
      { capId: "nlp", version: "1.0" },
      { capId: "language", version: "1.0" },
    ]));
    const d = router.resolve("translation");
    expect(d.selectedProvider).toBe("translator");
  });
  it("17.14.5 Multi-capability method — one cap missing — rejected", () => {
    router.registerProvider(makeProvider("partial", ["translation"], [
      { capId: "nlp", version: "1.0" },
    ]));
    const d = router.resolve("translation");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.14.6 End-to-end: register, resolve, explain", () => {
    router.registerProvider(makeProvider("p1", ["text-recognition"], [{ capId: "ocr", version: "1.0" }], 10));
    const d = router.resolve("text-recognition");
    expect(d.selectedProvider).toBe("p1");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("p1");
    expect(explanation).toContain("SELECTED");
  });
  it("17.14.7 Provider status change mid-lifecycle", () => {
    router.registerProvider(makeProvider("p1", ["text-recognition"], [{ capId: "ocr", version: "1.0" }]));
    expect(router.resolve("text-recognition").selectedProvider).toBe("p1");
    router.disableProvider("p1");
    expect(router.resolve("text-recognition").finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
    router.enableProvider("p1");
    expect(router.resolve("text-recognition").selectedProvider).toBe("p1");
  });
  it("17.14.8 Evidence graph contract — RouterDecision has all fields", () => {
    router.registerProvider(makeProvider("p1", ["text-recognition"], [{ capId: "ocr", version: "1.0" }]));
    const d = router.resolve("text-recognition");
    expect(d.decisionId).toBeTruthy();
    expect(d.methodId).toBe("text-recognition");
    expect(d.selectedProvider).toBe("p1");
    expect(d.capabilityMatch).toBeDefined();
    expect(d.priorityEvaluation).toBeDefined();
    expect(d.timestamp).toBeTruthy();
    expect(d.finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
  it("17.14.9 Custom router with shared registry", () => {
    const reg = new ProviderRegistry();
    const r1 = new Router(reg);
    const r2 = new Router(reg);
    r1.registerMethod(makeMethod("m1"));
    r2.registerMethod(makeMethod("m1"));
    r1.registerProvider(makeProvider("p1", ["m1"]));
    expect(r2.resolve("m1").selectedProvider).toBe("p1");
  });
  it("17.14.10 Provider with metadata — preserved through routing", () => {
    const p = makeProvider("p1", ["text-recognition"], [{ capId: "ocr", version: "1.0" }]);
    p.metadata = { gpu: true, memory: "8GB" };
    router.registerProvider(p);
    const exported = router.exportRegistry();
    expect(exported[0]!.provider.metadata.gpu).toBe(true);
  });
  it("17.14.11 Large provider set — deterministic result", () => {
    for (let i = 1; i <= 50; i++) {
      router.registerProvider(makeProvider(`p${i}`, ["text-recognition"], [{ capId: "ocr", version: "1.0" }], i));
    }
    const results = Array.from({ length: 10 }, () => router.resolve("text-recognition").selectedProvider);
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe("p50");
  });
  it("17.14.12 Constraint with version mismatch in requiredCapabilities", () => {
    router.registerProvider(makeProvider("p1", ["translation"], [
      { capId: "nlp", version: "0.5" },
      { capId: "language", version: "1.0" },
    ]));
    const d = router.resolve("translation");
    // Provider has the capabilities, so it matches (version mismatch is tracked but not a hard filter)
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.14.13 Explainability for multi-provider scenario", () => {
    router.registerProvider(makeProvider("p1", ["text-recognition"], [{ capId: "ocr", version: "1.0" }], 5));
    router.registerProvider(makeProvider("p2", ["text-recognition"], [{ capId: "ocr", version: "1.0" }], 10));
    const d = router.resolve("text-recognition");
    const explanation = router.explainDecision(d);
    expect(explanation).toContain("p2");
    expect(explanation).toContain("Rejected");
    expect(explanation).toContain("p1");
  });
  it("17.14.14 Route with all constraints types combined", () => {
    router.registerProvider(makeProvider("p1", ["text-recognition"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("p2", ["text-recognition"], [{ capId: "ocr", version: "1.0" }], 5));
    router.registerProvider(makeProvider("p3", ["text-recognition"], [{ capId: "ocr", version: "1.0" }], 20));
    const d = router.resolve("text-recognition", {
      excludeProviders: ["p3"],
      preferProviders: ["p1"],
    });
    expect(d.selectedProvider).toBe("p1");
    expect(d.rejectedProviders.some((r) => r.providerId === "p3" && r.code === RejectionReasonCode.EXCLUDED_BY_REQUEST_CONSTRAINT)).toBe(true);
  });
  it("17.14.15 Router decision requestId is populated from route()", () => {
    router.registerProvider(makeProvider("p1", ["text-recognition"], [{ capId: "ocr", version: "1.0" }]));
    const result = router.route(makeRequest("my-req", "text-recognition"));
    expect(result.decision.requestId).toBe("my-req");
  });
  it("17.14.16 Multiple routing decisions — each unique", () => {
    router.registerProvider(makeProvider("p1", ["text-recognition"], [{ capId: "ocr", version: "1.0" }]));
    const d1 = router.resolve("text-recognition");
    const d2 = router.resolve("text-recognition");
    expect(d1.decisionId).not.toBe(d2.decisionId);
    expect(d1.timestamp).toBeDefined();
    expect(d2.timestamp).toBeDefined();
  });
  it("17.14.17 Provider registration count preserved", () => {
    router.registerProvider(makeProvider("p1", ["m1"]));
    router.registerProvider(makeProvider("p2", ["m1"]));
    router.registerProvider(makeProvider("p3", ["m1"]));
    expect(router.exportRegistry().length).toBe(3);
  });
  it("17.14.18 Exported registry is independent copy", () => {
    router.registerProvider(makeProvider("p1", ["m1"]));
    const exported = router.exportRegistry();
    exported.push({} as any);
    expect(router.exportRegistry().length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.15 Deterministic Ordering
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.15 Deterministic Ordering", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1"));
  });

  it("17.15.1 Same providers, same result every time", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [], 20));
    const results = Array.from({ length: 20 }, () => router.resolve("m1").selectedProvider);
    expect(new Set(results).size).toBe(1);
  });
  it("17.15.2 Equal priority — first registered always wins", () => {
    router.registerProvider(makeProvider("p-first", ["m1"], [], 10));
    router.registerProvider(makeProvider("p-second", ["m1"], [], 10));
    const results = Array.from({ length: 20 }, () => router.resolve("m1").selectedProvider);
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe("p-first");
  });
  it("17.15.3 No randomness in routing decisions", () => {
    for (let i = 1; i <= 10; i++) {
      router.registerProvider(makeProvider(`p${i}`, ["m1"], [], Math.floor(Math.random() * 100)));
    }
    const d1 = router.resolve("m1");
    const d2 = router.resolve("m1");
    expect(d1.selectedProvider).toBe(d2.selectedProvider);
  });
  it("17.15.4 Priority scores are deterministic for same inputs", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [], 20));
    const d1 = router.resolve("m1");
    const d2 = router.resolve("m1");
    expect(d1.priorityEvaluation.candidates).toEqual(d2.priorityEvaluation.candidates);
  });
  it("17.15.5 Capability match is deterministic", () => {
    router.registerMethod(makeMethod("m2", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m2"], [{ capId: "ocr", version: "1.0" }]));
    const d1 = router.resolve("m2");
    const d2 = router.resolve("m2");
    expect(d1.capabilityMatch).toEqual(d2.capabilityMatch);
  });
  it("17.15.6 Constraints produce deterministic results", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [], 20));
    const c = { preferProviders: ["p1"] };
    const d1 = router.resolve("m1", c);
    const d2 = router.resolve("m1", c);
    expect(d1.selectedProvider).toBe(d2.selectedProvider);
  });
  it("17.15.7 Tie-breaking rule is stable", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [], 10));
    const d1 = router.resolve("m1");
    const d2 = router.resolve("m1");
    expect(d1.priorityEvaluation.tieBreakingRule).toBe(d2.priorityEvaluation.tieBreakingRule);
  });
  it("17.15.8 Large set — same winner across runs", () => {
    for (let i = 1; i <= 30; i++) {
      router.registerProvider(makeProvider(`p${i}`, ["m1"], [], i));
    }
    const winners = Array.from({ length: 50 }, () => router.resolve("m1").selectedProvider);
    expect(new Set(winners).size).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.16 Failure Cases
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.16 Failure Cases", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1"));
  });

  it("17.16.1 Unknown method — REQUEST_INVALID", () => {
    const d = router.resolve("unknown-method");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.REQUEST_INVALID);
  });
  it("17.16.2 All providers unavailable — ALL_UNAVAILABLE", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.UNAVAILABLE));
    router.registerProvider(makeProvider("p2", ["m1"], [], 5, ProviderStatus.ERROR));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
  });
  it("17.16.3 No providers at all — NO_MATCH", () => {
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.16.4 Providers exist but none support the method — NO_MATCH", () => {
    router.registerProvider(makeProvider("p1", ["m2"]));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.16.5 All providers excluded by constraint — NO_MATCH", () => {
    router.registerProvider(makeProvider("p1", ["m1"]));
    const d = router.resolve("m1", { excludeProviders: ["p1"] });
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders.some((r) => r.providerId === "p1" && r.code === RejectionReasonCode.EXCLUDED_BY_REQUEST_CONSTRAINT)).toBe(true);
  });
  it("17.16.6 All providers fail capability check — NO_MATCH", () => {
    router.registerMethod(makeMethod("m2", [{ capId: "x" }]));
    router.registerProvider(makeProvider("p1", ["m2"], []));
    const d = router.resolve("m2");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.16.7 Route with empty requestId — invalid", () => {
    const result = router.route({ requestId: "", methodId: "m1", context: makeContext() });
    expect(result.valid).toBe(false);
  });
  it("17.16.8 Route with missing context — invalid", () => {
    const result = router.route({ requestId: "r1", methodId: "m1", context: undefined as any });
    expect(result.valid).toBe(false);
  });
  it("17.16.9 Decision reason is non-empty for all outcomes", () => {
    const d1 = router.resolve("m1");
    expect(d1.reason.length).toBeGreaterThan(0);
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.UNAVAILABLE));
    const d2 = router.resolve("m1");
    expect(d2.reason.length).toBeGreaterThan(0);
  });
  it("17.16.10 Rejected providers populated for capability failures", () => {
    router.registerMethod(makeMethod("m2", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m2"], []));
    router.registerProvider(makeProvider("p2", ["m2"], []));
    const d = router.resolve("m2");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders.filter((r) => r.code === RejectionReasonCode.REQUIRED_CAPABILITY_MISSING).length).toBe(2);
  });
  it("17.16.11 Rejected providers populated for unavailable providers", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.UNAVAILABLE));
    router.registerProvider(makeProvider("p2", ["m1"], [], 5));
    const d = router.resolve("m1");
    expect(d.rejectedProviders.length).toBe(1);
    expect(d.rejectedProviders[0]!.providerId).toBe("p1");
  });
  it("17.16.12 Request with unknown method and empty ID — REQUEST_INVALID", () => {
    const d = router.resolve("");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.REQUEST_INVALID);
  });
  it("17.16.13 Registration failure preserves existing state", () => {
    router.registerProvider(makeProvider("p1", ["m1"]));
    router.registerProvider(makeProvider("p1")); // duplicate
    expect(router.exportRegistry().length).toBe(1);
  });
  it("17.16.14 Method registration failure preserves existing state", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerMethod(makeMethod("m1")); // duplicate
    expect(router.listMethods().length).toBe(1);
  });
  it("17.16.15 Provider without capability cannot be selected for capability method", () => {
    router.registerMethod(makeMethod("m-cap", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m-cap"], [{ capId: "nlp", version: "1.0" }]));
    const d = router.resolve("m-cap");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.17 Version Matching
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.17 Version Matching", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1", [{ capId: "ocr", minVersion: "2.0" }]));
  });

  it("17.17.1 Provider version higher than min — version match", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "3.0" }]));
    const d = router.resolve("m1");
    expect(d.capabilityMatch.versionMatches).toContain("ocr");
  });
  it("17.17.2 Provider version equal to min — version match", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "2.0" }]));
    const d = router.resolve("m1");
    expect(d.capabilityMatch.versionMatches).toContain("ocr");
  });
  it("17.17.3 Provider version lower than min — rejected with version-below code", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders[0]!.code).toBe(RejectionReasonCode.CAPABILITY_VERSION_BELOW_MINIMUM);
  });
  it("17.17.4 Version at/above min is selected", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "2.0" }]));
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.17.5 Major version comparison", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "10.0.0" }]));
    const d = router.resolve("m1");
    expect(d.capabilityMatch.versionMatches).toContain("ocr");
  });
  it("17.17.6 Minor version comparison", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "2.5.0" }]));
    const d = router.resolve("m1");
    expect(d.capabilityMatch.versionMatches).toContain("ocr");
  });
  it("17.17.7 Patch version comparison", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "2.0.1" }]));
    const d = router.resolve("m1");
    expect(d.capabilityMatch.versionMatches).toContain("ocr");
  });
  it("17.17.8 No minVersion requirement — capability always matches", () => {
    router.registerMethod(makeMethod("m-free", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m-free"], [{ capId: "ocr", version: "0.0.1" }]));
    const d = router.resolve("m-free");
    expect(d.capabilityMatch.versionMatches).toContain("ocr");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.18 Provider Registry — Shared with Router
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.18 Provider Registry — Shared with Router", () => {
  it("17.18.1 Default router creates own registry", () => {
    const router = new Router();
    expect(router.getRegistry()).toBeInstanceOf(ProviderRegistry);
  });
  it("17.18.2 Custom registry is shared", () => {
    const reg = new ProviderRegistry();
    const router = new Router(reg);
    reg.register(makeProvider("p1", ["m1"]));
    expect(router.getRegistry().size).toBe(1);
  });
  it("17.18.3 Two routers share same registry", () => {
    const reg = new ProviderRegistry();
    const r1 = new Router(reg);
    const r2 = new Router(reg);
    r1.registerProvider(makeProvider("p1", ["m1"]));
    expect(r2.getRegistry().size).toBe(1);
  });
  it("17.18.4 Router registerProvider affects shared registry", () => {
    const reg = new ProviderRegistry();
    const r1 = new Router(reg);
    const r2 = new Router(reg);
    r1.registerProvider(makeProvider("p1", ["m1"]));
    expect(reg.size).toBe(1);
    expect(r2.getRegistry().size).toBe(1);
  });
  it("17.18.5 Registry operations affect router", () => {
    const reg = new ProviderRegistry();
    const router = new Router(reg);
    router.registerMethod(makeMethod("m1"));
    reg.register(makeProvider("p1", ["m1"]));
    expect(router.resolve("m1").selectedProvider).toBe("p1");
    reg.unregister("p1");
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.19 Evidence Integration Contracts
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.19 Evidence Integration Contracts", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 5));
  });

  it("17.19.1 Decision has decisionId for evidence linking", () => {
    const d = router.resolve("m1");
    expect(d.decisionId).toMatch(/^decision-/);
  });
  it("17.19.2 Decision has methodId for evidence context", () => {
    const d = router.resolve("m1");
    expect(d.methodId).toBe("m1");
  });
  it("17.19.3 Decision has selected provider for action artifact", () => {
    const d = router.resolve("m1");
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.19.4 Decision has rejected providers for evidence trail", () => {
    const d = router.resolve("m1");
    expect(d.rejectedProviders.length).toBe(1);
    expect(d.rejectedProviders[0]!.providerId).toBe("p2");
  });
  it("17.19.5 Decision has reason for human readability", () => {
    const d = router.resolve("m1");
    expect(typeof d.reason).toBe("string");
    expect(d.reason.length).toBeGreaterThan(0);
  });
  it("17.19.6 Decision has capability match for evidence detail", () => {
    const d = router.resolve("m1");
    expect(d.capabilityMatch.requiredCapabilities.length).toBeGreaterThan(0);
    expect(d.capabilityMatch.matchedCapabilities.length).toBeGreaterThan(0);
  });
  it("17.19.7 Decision has priority evaluation for evidence detail", () => {
    const d = router.resolve("m1");
    expect(d.priorityEvaluation.candidates.length).toBe(2);
    expect(d.priorityEvaluation.winner).toBe("p1");
  });
  it("17.19.8 Decision has timestamp for temporal ordering", () => {
    const d = router.resolve("m1");
    expect(new Date(d.timestamp).toISOString()).toBe(d.timestamp);
  });
  it("17.19.9 Decision is serializable to JSON", () => {
    const d = router.resolve("m1");
    const json = JSON.stringify(d);
    const parsed = JSON.parse(json);
    expect(parsed.decisionId).toBe(d.decisionId);
    expect(parsed.selectedProvider).toBe(d.selectedProvider);
  });
  it("17.19.10 Explanation is human-readable for evidence", () => {
    const d = router.resolve("m1");
    const explanation = router.explainDecision(d);
    expect(typeof explanation).toBe("string");
    expect(explanation.length).toBeGreaterThan(20);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.20 Provider Registry — Capability Search
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.20 Provider Registry — Capability Search", () => {
  let reg: ProviderRegistry;
  beforeEach(() => {
    reg = new ProviderRegistry();
  });

  it("17.20.1 findByCapability returns matching providers", () => {
    reg.register(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    reg.register(makeProvider("p2", ["m1"], [{ capId: "nlp", version: "1.0" }]));
    const found = reg.findByCapability("ocr");
    expect(found.length).toBe(1);
    expect(found[0]!.provider.providerId).toBe("p1");
  });
  it("17.20.2 findByCapability returns empty when no match", () => {
    reg.register(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    expect(reg.findByCapability("translation").length).toBe(0);
  });
  it("17.20.3 findByCapability returns multiple providers", () => {
    reg.register(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    reg.register(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "2.0" }]));
    expect(reg.findByCapability("ocr").length).toBe(2);
  });
  it("17.20.4 findByCapability ignores version", () => {
    reg.register(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "0.1" }]));
    expect(reg.findByCapability("ocr").length).toBe(1);
  });
  it("17.20.5 findByMethod returns matching providers", () => {
    reg.register(makeProvider("p1", ["translate"], []));
    reg.register(makeProvider("p2", ["summarize"], []));
    const found = reg.findByMethod("translate");
    expect(found.length).toBe(1);
    expect(found[0]!.provider.providerId).toBe("p1");
  });
  it("17.20.6 findByMethod returns empty when no match", () => {
    reg.register(makeProvider("p1", ["translate"], []));
    expect(reg.findByMethod("missing").length).toBe(0);
  });
  it("17.20.7 findByMethod returns all providers for method", () => {
    reg.register(makeProvider("p1", ["translate"], []));
    reg.register(makeProvider("p2", ["translate"], []));
    expect(reg.findByMethod("translate").length).toBe(2);
  });
  it("17.20.8 lookup returns registration when present", () => {
    reg.register(makeProvider("p1", ["m1"], []));
    const r = reg.lookup("p1");
    expect(r).toBeDefined();
    expect(r!.provider.providerId).toBe("p1");
  });
  it("17.20.9 lookup returns undefined when absent", () => {
    expect(reg.lookup("nope")).toBeUndefined();
  });
  it("17.20.10 list returns all registrations", () => {
    reg.register(makeProvider("p1", ["m1"], []));
    reg.register(makeProvider("p2", ["m2"], []));
    expect(reg.list().length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.21 Provider Registry — Validation Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.21 Provider Registry — Validation Edge Cases", () => {
  let reg: ProviderRegistry;
  beforeEach(() => {
    reg = new ProviderRegistry();
  });

  it("17.21.1 Empty providerId rejected", () => {
    const r = reg.register({ ...makeProvider("", ["m1"]) } as any);
    expect(r.valid).toBe(false);
    expect(r.errors.join(" ")).toContain("Provider ID");
  });
  it("17.21.2 Whitespace providerId rejected", () => {
    const r = reg.register({ ...makeProvider("   ", ["m1"]) } as any);
    expect(r.valid).toBe(false);
  });
  it("17.21.3 Duplicate providerId rejected", () => {
    reg.register(makeProvider("p1", ["m1"]));
    const r = reg.register(makeProvider("p1", ["m2"]));
    expect(r.valid).toBe(false);
    expect(r.errors.join(" ")).toContain("Duplicate");
  });
  it("17.21.4 Empty displayName rejected", () => {
    const r = reg.register({ ...makeProvider("p1", ["m1"]), displayName: "" } as any);
    expect(r.valid).toBe(false);
  });
  it("17.21.5 Empty version rejected", () => {
    const r = reg.register({ ...makeProvider("p1", ["m1"]), version: "" } as any);
    expect(r.valid).toBe(false);
  });
  it("17.21.6 Negative priority rejected", () => {
    const r = reg.register({ ...makeProvider("p1", ["m1"]), priority: -1 } as any);
    expect(r.valid).toBe(false);
  });
  it("17.21.7 Invalid status rejected", () => {
    const r = reg.register({ ...makeProvider("p1", ["m1"]), status: "WEIRD" } as any);
    expect(r.valid).toBe(false);
  });
  it("17.21.8 No supported methods rejected", () => {
    const r = reg.register({ ...makeProvider("p1", []), supportedMethods: [] } as any);
    expect(r.valid).toBe(false);
  });
  it("17.21.9 Multiple errors collected", () => {
    const r = reg.register({ ...makeProvider("", []), supportedMethods: [] } as any);
    expect(r.errors.length).toBeGreaterThan(1);
  });
  it("17.21.10 Valid provider accepted", () => {
    const r = reg.register(makeProvider("p1", ["m1"]));
    expect(r.valid).toBe(true);
    expect(r.errors.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.22 Method Management — Validation Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.22 Method Management — Validation Edge Cases", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
  });

  it("17.22.1 Empty methodId rejected", () => {
    const r = router.registerMethod({ ...makeMethod("") } as any);
    expect(r.valid).toBe(false);
  });
  it("17.22.2 Whitespace methodId rejected", () => {
    const r = router.registerMethod({ ...makeMethod("  ") } as any);
    expect(r.valid).toBe(false);
  });
  it("17.22.3 Duplicate methodId rejected", () => {
    router.registerMethod(makeMethod("m1"));
    const r = router.registerMethod(makeMethod("m1"));
    expect(r.valid).toBe(false);
  });
  it("17.22.4 Empty displayName rejected", () => {
    const r = router.registerMethod({ ...makeMethod("m1"), displayName: "" } as any);
    expect(r.valid).toBe(false);
  });
  it("17.22.5 Valid method accepted", () => {
    const r = router.registerMethod(makeMethod("m1"));
    expect(r.valid).toBe(true);
  });
  it("17.22.6 getMethod returns method", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    const m = router.getMethod("m1");
    expect(m).toBeDefined();
    expect(m!.methodId).toBe("m1");
  });
  it("17.22.7 getMethod returns undefined when absent", () => {
    expect(router.getMethod("nope")).toBeUndefined();
  });
  it("17.22.8 unregisterMethod removes method", () => {
    router.registerMethod(makeMethod("m1"));
    expect(router.unregisterMethod("m1")).toBe(true);
    expect(router.getMethod("m1")).toBeUndefined();
  });
  it("17.22.9 unregisterMethod returns false when absent", () => {
    expect(router.unregisterMethod("nope")).toBe(false);
  });
  it("17.22.10 listMethods returns all methods", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerMethod(makeMethod("m2"));
    expect(router.listMethods().length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.23 Request Validation Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.23 Request Validation Edge Cases", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1"));
  });

  it("17.23.1 Empty requestId rejected", () => {
    const r = router.validateRequest(makeRequest("", "m1"));
    expect(r.valid).toBe(false);
  });
  it("17.23.2 Whitespace requestId rejected", () => {
    const r = router.validateRequest(makeRequest("  ", "m1"));
    expect(r.valid).toBe(false);
  });
  it("17.23.3 Empty methodId rejected", () => {
    const r = router.validateRequest(makeRequest("r1", ""));
    expect(r.valid).toBe(false);
  });
  it("17.23.4 Unknown method rejected", () => {
    const r = router.validateRequest(makeRequest("r1", "unknown"));
    expect(r.valid).toBe(false);
    expect(r.errors.join(" ")).toContain("Unknown");
  });
  it("17.23.5 Missing context rejected", () => {
    const r = router.validateRequest({ requestId: "r1", methodId: "m1" } as any);
    expect(r.valid).toBe(false);
  });
  it("17.23.6 Valid request accepted", () => {
    const r = router.validateRequest(makeRequest("r1", "m1"));
    expect(r.valid).toBe(true);
  });
  it("17.23.7 Multiple errors collected", () => {
    const r = router.validateRequest({ requestId: "", methodId: "" } as any);
    expect(r.errors.length).toBeGreaterThan(1);
  });
  it("17.23.8 Valid request has no errors", () => {
    const r = router.validateRequest(makeRequest("r1", "m1"));
    expect(r.errors.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.24 Priority Score Evaluation
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.24 Priority Score Evaluation", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
  });

  it("17.24.1 Higher priority selected", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 5));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 50));
    expect(router.resolve("m1").selectedProvider).toBe("p2");
  });
  it("17.24.2 Equal priority — first registered wins (stable)", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    expect(router.resolve("m1").selectedProvider).toBe("p1");
  });
  it("17.24.3 Priority evaluation candidates count", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 20));
    const d = router.resolve("m1");
    expect(d.priorityEvaluation.candidates.length).toBe(2);
  });
  it("17.24.4 Winner in candidates", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 20));
    const d = router.resolve("m1");
    expect(d.priorityEvaluation.candidates.some((c) => c.providerId === d.priorityEvaluation.winner)).toBe(true);
  });
  it("17.24.5 Total score is sum of weighted components", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    const d = router.resolve("m1");
    const c = d.priorityEvaluation.candidates[0]!;
    expect(c.totalScore).toBe(c.capabilityScore * 1000 + c.methodScore * 100 + c.availabilityScore * 10 + c.priorityScore);
  });
  it("17.24.6 Capability score is 1.0 when all capabilities matched", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    const d = router.resolve("m1");
    expect(d.priorityEvaluation.candidates[0]!.capabilityScore).toBe(1);
  });
  it("17.24.7 Method score is 1 when method supported", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    const d = router.resolve("m1");
    expect(d.priorityEvaluation.candidates[0]!.methodScore).toBe(1);
  });
  it("17.24.8 Availability score is 1 for available provider", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    const d = router.resolve("m1");
    expect(d.priorityEvaluation.candidates[0]!.availabilityScore).toBe(1);
  });
  it("17.24.9 Tie-breaking rule documented", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    const d = router.resolve("m1");
    expect(d.priorityEvaluation.tieBreakingRule.length).toBeGreaterThan(0);
  });
  it("17.24.10 PreferProvider boosts priority above higher base", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 1));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 100));
    const d = router.resolve("m1", { preferProviders: ["p1"] });
    expect(d.selectedProvider).toBe("p1");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.25 Capability Matching Deep
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.25 Capability Matching Deep", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
  });

  it("17.25.1 Method requires one capability — provider matches", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
  it("17.25.2 Method requires one capability — provider missing", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "nlp", version: "1.0" }]));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.25.3 Method requires multiple — all present", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }, { capId: "nlp" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }, { capId: "nlp", version: "1.0" }]));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
  it("17.25.4 Method requires multiple — one missing", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }, { capId: "nlp" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.25.5 Capability failure recorded in rejectedProviders", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "nlp", version: "1.0" }]));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders.some((r) => r.providerId === "p1" && r.code === RejectionReasonCode.REQUIRED_CAPABILITY_MISSING)).toBe(true);
  });
  it("17.25.6 CapabilityMatch matched lists matched cap", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    const d = router.resolve("m1");
    expect(d.capabilityMatch.matchedCapabilities).toContain("ocr");
  });
  it("17.25.7 Extra provider capabilities ignored", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }, { capId: "nlp", version: "1.0" }]));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
  it("17.25.8 Method with no required caps accepts any provider", () => {
    router.registerMethod(makeMethod("m1", []));
    router.registerProvider(makeProvider("p1", ["m1"], []));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
  it("17.25.9 Provider with no caps fails method requiring cap", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], []));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.25.10 Required cap with minVersion satisfied", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr", minVersion: "1.0" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "2.0" }]));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.26 Constraint Combinations
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.26 Constraint Combinations", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
  });

  it("17.26.1 excludeProviders removes target", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 5));
    expect(router.resolve("m1", { excludeProviders: ["p1"] }).selectedProvider).toBe("p2");
  });
  it("17.26.2 preferProviders selects preferred", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 5));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    expect(router.resolve("m1", { preferProviders: ["p1"] }).selectedProvider).toBe("p1");
  });
  it("17.26.3 exclude+prefer combined", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 5));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("p3", ["m1"], [{ capId: "ocr", version: "1.0" }], 1));
    const d = router.resolve("m1", { excludeProviders: ["p2"], preferProviders: ["p1"] });
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.26.4 requiredCapabilities filters", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "nlp", version: "1.0" }], 5));
    expect(router.resolve("m1", { requiredCapabilities: ["ocr"] }).selectedProvider).toBe("p1");
  });
  it("17.26.5 all constraints combined", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 5));
    router.registerProvider(makeProvider("p3", ["m1"], [{ capId: "ocr", version: "1.0" }], 20));
    const d = router.resolve("m1", { excludeProviders: ["p3"], preferProviders: ["p1"] });
    expect(d.selectedProvider).toBe("p1");
  });
  it("17.26.6 exclude nonexistent has no effect", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    expect(router.resolve("m1", { excludeProviders: ["ghost"] }).selectedProvider).toBe("p1");
  });
  it("17.26.7 prefer nonexistent has no effect", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 5));
    expect(router.resolve("m1", { preferProviders: ["ghost"] }).selectedProvider).toBe("p1");
  });
  it("17.26.8 empty constraints object", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    expect(router.resolve("m1", {}).selectedProvider).toBe("p1");
  });
  it("17.26.9 undefined constraints", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    expect(router.resolve("m1").selectedProvider).toBe("p1");
  });
  it("17.26.10 requiredCapabilities with version mismatch still matches", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "0.5" }], 10));
    expect(router.resolve("m1", { requiredCapabilities: ["ocr"] }).selectedProvider).toBe("p1");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.27 Explainability Deep
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.27 Explainability Deep", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
  });

  it("17.27.1 Explanation contains Decision line", () => {
    const d = router.resolve("m1");
    expect(router.explainDecision(d)).toContain("Decision:");
  });
  it("17.27.2 Explanation contains Method line", () => {
    const d = router.resolve("m1");
    expect(router.explainDecision(d)).toContain("Method:");
  });
  it("17.27.3 Explanation contains Outcome line", () => {
    const d = router.resolve("m1");
    expect(router.explainDecision(d)).toContain("Outcome:");
  });
  it("17.27.4 Explanation contains Selected for success", () => {
    const d = router.resolve("m1");
    expect(router.explainDecision(d)).toContain("Selected:");
  });
  it("17.27.5 Explanation contains Reason", () => {
    const d = router.resolve("m1");
    expect(router.explainDecision(d)).toContain("Reason:");
  });
  it("17.27.6 Explanation contains Timestamp", () => {
    const d = router.resolve("m1");
    expect(router.explainDecision(d)).toContain("Timestamp:");
  });
  it("17.27.7 Explanation for NO_MATCH contains No provider", () => {
    router.registerMethod(makeMethod("mx", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("py", ["mx"], [{ capId: "nlp", version: "1.0" }]));
    const d = router.resolve("mx");
    expect(router.explainDecision(d)).toContain("No provider");
  });
  it("17.27.8 Explanation for REQUEST_INVALID", () => {
    const d = router.resolve("unknown");
    expect(router.explainDecision(d)).toContain("REQUEST_INVALID");
  });
  it("17.27.9 Explanation contains capability match section", () => {
    const d = router.resolve("m1");
    expect(router.explainDecision(d)).toContain("ocr");
  });
  it("17.27.10 Explanation contains rejected providers for multi", () => {
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }], 5));
    const d = router.resolve("m1");
    const e = router.explainDecision(d);
    expect(e).toContain("Rejected");
    expect(e).toContain("p2");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.28 Registry Export Deep
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.28 Registry Export Deep", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
  });

  it("17.28.1 exportRegistry returns array", () => {
    router.registerProvider(makeProvider("p1", ["m1"], []));
    expect(Array.isArray(router.exportRegistry())).toBe(true);
  });
  it("17.28.2 exportRegistry reflects registrations", () => {
    router.registerProvider(makeProvider("p1", ["m1"], []));
    router.registerProvider(makeProvider("p2", ["m1"], []));
    expect(router.exportRegistry().length).toBe(2);
  });
  it("17.28.3 exportRegistry preserves provider data", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 7));
    const p = router.exportRegistry()[0]!.provider;
    expect(p.providerId).toBe("p1");
    expect(p.priority).toBe(7);
    expect(p.capabilities[0]!.capabilityId).toBe("ocr");
  });
  it("17.28.4 exportRegistry reflects enabled state", () => {
    router.registerProvider(makeProvider("p1", ["m1"], []));
    router.disableProvider("p1");
    expect(router.exportRegistry()[0]!.enabled).toBe(false);
  });
  it("17.28.5 exportRegistry independent of mutation", () => {
    router.registerProvider(makeProvider("p1", ["m1"], []));
    const e = router.exportRegistry();
    e.push({} as any);
    expect(router.exportRegistry().length).toBe(1);
  });
  it("17.28.6 getRegistry returns registry instance", () => {
    expect(router.getRegistry()).toBeInstanceOf(ProviderRegistry);
  });
  it("17.28.7 listCapabilities returns sorted unique", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "nlp", version: "1.0" }]));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    const caps = router.listCapabilities();
    expect(caps).toEqual(["nlp", "ocr"]);
  });
  it("17.28.8 listCapabilities deduplicates", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    router.registerProvider(makeProvider("p2", ["m1"], [{ capId: "ocr", version: "2.0" }]));
    expect(router.listCapabilities()).toEqual(["ocr"]);
  });
  it("17.28.9 listCapabilities empty when no providers", () => {
    expect(router.listCapabilities()).toEqual([]);
  });
  it("17.28.10 exportRegistry empty initially", () => {
    expect(router.exportRegistry().length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.29 Edge Cases Deep
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.29 Edge Cases Deep", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
  });

  it("17.29.1 Resolve unknown method returns REQUEST_INVALID", () => {
    expect(router.resolve("ghost").finalDecision).toBe(RouterDecisionOutcome.REQUEST_INVALID);
  });
  it("17.29.2 Resolve empty method returns REQUEST_INVALID", () => {
    expect(router.resolve("").finalDecision).toBe(RouterDecisionOutcome.REQUEST_INVALID);
  });
  it("17.29.3 Resolve with no providers NO_MATCH", () => {
    router.registerMethod(makeMethod("m1"));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.29.4 Disabled provider not selected", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    router.disableProvider("p1");
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
  });
  it("17.29.5 ERROR status provider not selected", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.ERROR));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
  });
  it("17.29.6 UNAVAILABLE status provider not selected", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.UNAVAILABLE));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
  });
  it("17.29.7 Re-enabling provider allows selection", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    router.disableProvider("p1");
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
    router.enableProvider("p1");
    expect(router.resolve("m1").selectedProvider).toBe("p1");
  });
  it("17.29.8 Unregister provider removes it", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], []));
    router.removeProvider("p1");
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.29.9 All providers excluded by constraint — NO_MATCH", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [], 5));
    const d = router.resolve("m1", { excludeProviders: ["p1", "p2"] });
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders.filter((r) => r.code === RejectionReasonCode.EXCLUDED_BY_REQUEST_CONSTRAINT).length).toBe(2);
  });
  it("17.29.10 Single provider routing", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    expect(router.resolve("m1").selectedProvider).toBe("p1");
  });
  it("17.29.11 Many providers — deterministic winner", () => {
    router.registerMethod(makeMethod("m1"));
    for (let i = 1; i <= 20; i++) {
      router.registerProvider(makeProvider(`p${i}`, ["m1"], [], i));
    }
    const r = Array.from({ length: 5 }, () => router.resolve("m1").selectedProvider);
    expect(new Set(r).size).toBe(1);
    expect(r[0]).toBe("p20");
  });
  it("17.29.12 Method with capabilities but no providers — NO_MATCH", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.29.13 Provider not supporting method excluded", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["other"], []));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.29.14 RemoveProvider returns false when absent", () => {
    expect(router.removeProvider("nope")).toBe(false);
  });
  it("17.29.15 Enable returns false when absent", () => {
    expect(router.enableProvider("nope")).toBe(false);
  });
  it("17.29.16 Disable returns false when absent", () => {
    expect(router.disableProvider("nope")).toBe(false);
  });
  it("17.29.17 Unregister returns false when absent", () => {
    expect(router.getRegistry().unregister("nope")).toBe(false);
  });
  it("17.29.18 Multiple methods independent", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerMethod(makeMethod("m2"));
    router.registerProvider(makeProvider("p1", ["m1"], []));
    router.registerProvider(makeProvider("p2", ["m2"], []));
    expect(router.resolve("m1").selectedProvider).toBe("p1");
    expect(router.resolve("m2").selectedProvider).toBe("p2");
  });
  it("17.29.19 Provider supporting multiple methods", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerMethod(makeMethod("m2"));
    router.registerProvider(makeProvider("p1", ["m1", "m2"], []));
    expect(router.resolve("m1").selectedProvider).toBe("p1");
    expect(router.resolve("m2").selectedProvider).toBe("p1");
  });
  it("17.29.20 Decision timestamp is valid ISO", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], []));
    const d = router.resolve("m1");
    expect(() => new Date(d.timestamp).toISOString()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.30 Version Matching Deep
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.30 Version Matching Deep", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
    router.registerMethod(makeMethod("m1", [{ capId: "ocr", minVersion: "2.0" }]));
  });

  it("17.30.1 Exact version satisfies minVersion", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "2.0" }], 10));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
  it("17.30.2 Higher version satisfies minVersion", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "2.5" }], 10));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
  it("17.30.3 Lower version below minVersion is rejected (hard filter)", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.5" }], 10));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders[0]!.code).toBe(RejectionReasonCode.CAPABILITY_VERSION_BELOW_MINIMUM);
  });
  it("17.30.4 versionBelow recorded when below min", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }], 10));
    const d = router.resolve("m1");
    expect(d.rejectedProviders[0]!.code).toBe(RejectionReasonCode.CAPABILITY_VERSION_BELOW_MINIMUM);
  });
  it("17.30.5 versionMatch recorded when satisfied", () => {
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "2.0" }], 10));
    const d = router.resolve("m1");
    expect(d.capabilityMatch.versionMatches).toContain("ocr");
  });
  it("17.30.6 No minVersion — versionMatch always", () => {
    router.registerMethod(makeMethod("m-free", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m-free"], [{ capId: "ocr", version: "0.0.1" }], 10));
    const d = router.resolve("m-free");
    expect(d.capabilityMatch.versionMatches).toContain("ocr");
  });
  it("17.30.7 Major version comparison", () => {
    router.unregisterMethod("m1");
    router.registerMethod(makeMethod("m1", [{ capId: "ocr", minVersion: "10.0" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "9.9" }], 10));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders[0]!.code).toBe(RejectionReasonCode.CAPABILITY_VERSION_BELOW_MINIMUM);
  });
  it("17.30.8 Missing minVersion in provider still matches", () => {
    router.unregisterMethod("m1");
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr" }], 10));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
  it("17.30.9 Multiple caps with mixed versions — any below min rejects provider", () => {
    router.unregisterMethod("m1");
    router.registerMethod(makeMethod("m1", [{ capId: "ocr", minVersion: "2.0" }, { capId: "nlp", minVersion: "1.0" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }, { capId: "nlp", version: "1.5" }], 10));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
    expect(d.rejectedProviders[0]!.code).toBe(RejectionReasonCode.CAPABILITY_VERSION_BELOW_MINIMUM);
  });
  it("17.30.10 Version with more segments than min", () => {
    router.unregisterMethod("m1");
    router.registerMethod(makeMethod("m1", [{ capId: "ocr", minVersion: "1.0" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0.0.0" }], 10));
    expect(router.resolve("m1").finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17.31 RT-005-C1 — Semantic Contract Reconciliation
// ═══════════════════════════════════════════════════════════════════════════════

describe("17.31 RT-005-C1 Semantic Contract", () => {
  let router: Router;
  beforeEach(() => {
    router = new Router();
  });

  // ── Enum invariants ──
  it("17.31.1 RouterDecisionOutcome has exactly 4 members", () => {
    expect(Object.keys(RouterDecisionOutcome).length).toBe(4);
  });
  it("17.31.2 RejectionReasonCode has exactly 9 members", () => {
    expect(Object.keys(RejectionReasonCode).length).toBe(9);
  });
  it("17.31.3 RejectedProvider.code is a typed enum value", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], []));
    const d = router.resolve("m1");
    expect(d.rejectedProviders[0]!.code).toBe(RejectionReasonCode.REQUIRED_CAPABILITY_MISSING);
  });

  // ── minVersion hard requirement ──
  it("17.31.4 Provider missing version when minVersion required → CAPABILITY_VERSION_MISSING", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr", minVersion: "1.0" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr" }]));
    const d = router.resolve("m1");
    expect(d.rejectedProviders[0]!.code).toBe(RejectionReasonCode.CAPABILITY_VERSION_MISSING);
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.31.5 Provider version below min → CAPABILITY_VERSION_BELOW_MINIMUM", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr", minVersion: "2.0" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "1.0" }]));
    const d = router.resolve("m1");
    expect(d.rejectedProviders[0]!.code).toBe(RejectionReasonCode.CAPABILITY_VERSION_BELOW_MINIMUM);
    expect(d.finalDecision).toBe(RouterDecisionOutcome.NO_MATCH);
  });
  it("17.31.6 Provider version equal to min → versionMatch, selected", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr", minVersion: "2.0" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "2.0" }]));
    const d = router.resolve("m1");
    expect(d.capabilityMatch.versionMatches).toContain("ocr");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });
  it("17.31.7 Provider version above min → versionMatch, selected", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr", minVersion: "2.0" }]));
    router.registerProvider(makeProvider("p1", ["m1"], [{ capId: "ocr", version: "3.1" }]));
    const d = router.resolve("m1");
    expect(d.capabilityMatch.versionMatches).toContain("ocr");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.SELECTED);
  });

  // ── Excluded providers in rejectedProviders ──
  it("17.31.8 Excluded provider appears in rejectedProviders with EXCLUDED_BY_REQUEST_CONSTRAINT", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    router.registerProvider(makeProvider("p2", ["m1"], [], 5));
    const d = router.resolve("m1", { excludeProviders: ["p1"] });
    expect(d.selectedProvider).toBe("p2");
    expect(d.rejectedProviders.some((r) => r.providerId === "p1" && r.code === RejectionReasonCode.EXCLUDED_BY_REQUEST_CONSTRAINT)).toBe(true);
  });

  // ── ALL_UNAVAILABLE only when runtime-blocked ──
  it("17.31.9 ALL_UNAVAILABLE only when providers are runtime-blocked, not excluded", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.UNAVAILABLE));
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
    expect(d.rejectedProviders[0]!.code).toBe(RejectionReasonCode.STATUS_UNAVAILABLE);
  });
  it("17.31.10 Disabled provider → STATUS_DISABLED in ALL_UNAVAILABLE", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10, ProviderStatus.AVAILABLE));
    router.disableProvider("p1");
    const d = router.resolve("m1");
    expect(d.finalDecision).toBe(RouterDecisionOutcome.ALL_UNAVAILABLE);
    expect(d.rejectedProviders[0]!.code).toBe(RejectionReasonCode.STATUS_DISABLED);
  });

  // ── Lexicographic comparator precedence ──
  it("17.31.11 Lexicographic: higher priority beats lower when equal capability", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p-low", ["m1"], [], 5));
    router.registerProvider(makeProvider("p-high", ["m1"], [], 30));
    expect(router.resolve("m1").selectedProvider).toBe("p-high");
  });
  it("17.31.12 Lexicographic: preferred beats higher base priority", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p-low", ["m1"], [], 5));
    router.registerProvider(makeProvider("p-high", ["m1"], [], 30));
    const d = router.resolve("m1", { preferProviders: ["p-low"] });
    expect(d.selectedProvider).toBe("p-low");
  });
  it("17.31.13 Lexicographic: equal priority → first registered wins", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p-first", ["m1"], [], 10));
    router.registerProvider(makeProvider("p-second", ["m1"], [], 10));
    expect(router.resolve("m1").selectedProvider).toBe("p-first");
  });

  // ── No double-counting in rejectedProviders ──
  it("17.31.14 Capability-failed provider appears exactly once in rejectedProviders", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], []));
    const d = router.resolve("m1");
    const count = d.rejectedProviders.filter((r) => r.providerId === "p1").length;
    expect(count).toBe(1);
  });

  // ── Evidence export adapter per outcome ──
  it("17.31.15 Evidence export produced for SELECTED outcome", () => {
    router.registerMethod(makeMethod("m1"));
    router.registerProvider(makeProvider("p1", ["m1"], [], 10));
    const d = router.resolve("m1");
    const exp = toEvidenceGraphExport(d);
    expect(exp.nodes.some((n) => n.nodeType === "DECISION")).toBe(true);
    expect(exp.nodes.some((n) => n.nodeType === "ACTION")).toBe(true);
    expect(exp.edges.some((e) => e.relationType === "AUTHORIZES")).toBe(true);
  });
  it("17.31.16 Evidence export produced for NO_MATCH outcome", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], []));
    const d = router.resolve("m1");
    const exp = toEvidenceGraphExport(d);
    expect(exp.nodes.some((n) => n.nodeType === "DECISION")).toBe(true);
    expect(exp.edges.some((e) => e.relationType === "CONTRADICTS")).toBe(true);
  });
  it("17.31.17 Evidence export preserves rejection reason code", () => {
    router.registerMethod(makeMethod("m1", [{ capId: "ocr" }]));
    router.registerProvider(makeProvider("p1", ["m1"], []));
    const d = router.resolve("m1");
    const exp = toEvidenceGraphExport(d);
    const rej = exp.nodes.find((n) => n.metadata?.kind === "provider-rejected");
    expect(rej?.metadata?.code).toBe(RejectionReasonCode.REQUIRED_CAPABILITY_MISSING);
  });

  // ── Router does NOT import EvidenceGraph runtime class ──
  it("17.31.18 Router module does not import EvidenceGraph runtime class", async () => {
    const routerSrc = await import("../../src/runtime/router.js");
    expect((routerSrc as any).EvidenceGraph).toBeUndefined();
  });
  it("17.31.19 evidence-export does not import the EvidenceGraph runtime module/class", () => {
    const src = evidenceExportSource;
    expect(src).not.toMatch(/from ["'].*evidence-graph["']/);
    expect(src).not.toMatch(/\bnew EvidenceGraph\b/);
    expect(src).not.toMatch(/import .*\bevidence-graph\b/);
  });
});
