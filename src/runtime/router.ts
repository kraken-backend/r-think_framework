/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Method / Provider Router
// Blueprint Reference: RTHINK-BP-001
// Mission: RTHINK-RT-005 (foundation) / RTHINK-RT-005-C1 (semantic correction)

import {
  ProviderStatus,
  RouterDecisionOutcome,
  RejectionReasonCode,
} from "../contracts/types.js";
import type {
  Method,
  Provider,
  ProviderRegistration,
  ExecutionRequest,
  ExecutionResult,
  ExecutionConstraints,
  RouterDecision,
  RejectedProvider,
  CapabilityMatchResult,
  PriorityEvaluation,
} from "../contracts/index.js";

// ─── Router Configuration ───────────────────────────────────────────────────

const ROUTER_VERSION = "rt-005-v1.0";

export { ROUTER_VERSION, RejectionReasonCode };

// ─── Provider Registry ─────────────────────────────────────────────────────

export class ProviderRegistry {
  private providers: Map<string, ProviderRegistration> = new Map();

  register(provider: Provider): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!provider.providerId || provider.providerId.trim() === "") {
      errors.push("Provider ID must be a non-empty string");
    }

    if (this.providers.has(provider.providerId)) {
      errors.push(`Duplicate provider ID: "${provider.providerId}"`);
    }

    if (!provider.displayName || provider.displayName.trim() === "") {
      errors.push("Display name must be a non-empty string");
    }

    if (!provider.version || provider.version.trim() === "") {
      errors.push("Version must be a non-empty string");
    }

    if (provider.priority < 0) {
      errors.push("Priority must be non-negative");
    }

    if (!Object.values(ProviderStatus).includes(provider.status)) {
      errors.push(`Invalid provider status: "${provider.status}"`);
    }

    if (provider.supportedMethods.length === 0) {
      errors.push("Provider must support at least one method");
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const registration: ProviderRegistration = {
      provider: { ...provider },
      registeredAt: new Date().toISOString(),
      enabled: true,
    };

    this.providers.set(provider.providerId, registration);
    return { valid: true, errors: [] };
  }

  unregister(providerId: string): boolean {
    if (!this.providers.has(providerId)) {
      return false;
    }
    this.providers.delete(providerId);
    return true;
  }

  enable(providerId: string): boolean {
    const reg = this.providers.get(providerId);
    if (!reg) return false;
    reg.enabled = true;
    return true;
  }

  disable(providerId: string): boolean {
    const reg = this.providers.get(providerId);
    if (!reg) return false;
    reg.enabled = false;
    return true;
  }

  list(): ProviderRegistration[] {
    return Array.from(this.providers.values());
  }

  lookup(providerId: string): ProviderRegistration | undefined {
    return this.providers.get(providerId);
  }

  findByCapability(capabilityId: string): ProviderRegistration[] {
    return this.list().filter((reg) =>
      reg.provider.capabilities.some(
        (c) => c.capabilityId === capabilityId
      )
    );
  }

  findByMethod(methodId: string): ProviderRegistration[] {
    return this.list().filter((reg) =>
      reg.provider.supportedMethods.includes(methodId)
    );
  }

  get size(): number {
    return this.providers.size;
  }
}

// ─── Router Engine ──────────────────────────────────────────────────────────

interface SelectionCandidate {
  providerId: string;
  registration: ProviderRegistration;
  missingCaps: number;
  versionMismatch: number;
  methodSupported: number;
  availability: number;
  preferred: number;
  priority: number;
  regOrder: number;
  idFallback: string;
}

export class Router {
  private registry: ProviderRegistry;
  private methods: Map<string, Method> = new Map();
  private decisionCounter: number = 0;
  private registrationOrder: Map<string, number> = new Map();
  private regSeq: number = 0;

  constructor(registry?: ProviderRegistry) {
    this.registry = registry ?? new ProviderRegistry();
  }

  // ─── Method Management ──────────────────────────────────────────────

  registerMethod(method: Method): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!method.methodId || method.methodId.trim() === "") {
      errors.push("Method ID must be a non-empty string");
    }

    if (this.methods.has(method.methodId)) {
      errors.push(`Duplicate method ID: "${method.methodId}"`);
    }

    if (!method.displayName || method.displayName.trim() === "") {
      errors.push("Display name must be a non-empty string");
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    this.methods.set(method.methodId, { ...method });
    return { valid: true, errors: [] };
  }

  unregisterMethod(methodId: string): boolean {
    if (!this.methods.has(methodId)) return false;
    this.methods.delete(methodId);
    return true;
  }

  getMethod(methodId: string): Method | undefined {
    return this.methods.get(methodId);
  }

  listMethods(): Method[] {
    return Array.from(this.methods.values());
  }

  // ─── Provider Management (delegates to registry) ────────────────────

  registerProvider(provider: Provider): { valid: boolean; errors: string[] } {
    const r = this.registry.register(provider);
    if (r.valid) {
      this.registrationOrder.set(provider.providerId, ++this.regSeq);
    }
    return r;
  }

  removeProvider(providerId: string): boolean {
    this.registrationOrder.delete(providerId);
    return this.registry.unregister(providerId);
  }

  enableProvider(providerId: string): boolean {
    return this.registry.enable(providerId);
  }

  disableProvider(providerId: string): boolean {
    return this.registry.disable(providerId);
  }

  // ─── Routing ────────────────────────────────────────────────────────

  validateRequest(request: ExecutionRequest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.requestId || request.requestId.trim() === "") {
      errors.push("Request ID must be a non-empty string");
    }

    if (!request.methodId || request.methodId.trim() === "") {
      errors.push("Method ID must be a non-empty string");
    }

    if (!this.methods.has(request.methodId)) {
      errors.push(`Unknown method: "${request.methodId}"`);
    }

    if (!request.context) {
      errors.push("Execution context is required");
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  resolve(
    methodId: string,
    constraints?: ExecutionConstraints
  ): RouterDecision {
    const decisionId = `decision-${++this.decisionCounter}`;
    const timestamp = new Date().toISOString();

    const method = this.methods.get(methodId);
    if (!method) {
      return this.createDecision(
        decisionId,
        "",
        methodId,
        null,
        [],
        "Unknown method",
        RouterDecisionOutcome.REQUEST_INVALID,
        timestamp
      );
    }

    const supportingProviders = this.registry.findByMethod(methodId);

    if (supportingProviders.length === 0) {
      return this.createDecision(
        decisionId,
        "",
        methodId,
        null,
        [],
        "No providers support this method",
        RouterDecisionOutcome.NO_MATCH,
        timestamp
      );
    }

    // Stage 1-2: capability completeness + version compliance
    const capabilityEvals = new Map<string, CapabilityMatchResult>();
    const rejected: RejectedProvider[] = [];

    for (const reg of supportingProviders) {
      const match = this.evaluateCapabilitiesForProvider(method, reg.provider);
      capabilityEvals.set(reg.provider.providerId, match);

      if (match.missingCapabilities.length > 0) {
        rejected.push({
          providerId: reg.provider.providerId,
          reason: `Missing required capabilities: ${match.missingCapabilities.join(", ")}`,
          code: RejectionReasonCode.REQUIRED_CAPABILITY_MISSING,
        });
      } else if (match.versionMissing.length > 0) {
        rejected.push({
          providerId: reg.provider.providerId,
          reason: `Capability version missing for required minimum: ${match.versionMissing.join(", ")}`,
          code: RejectionReasonCode.CAPABILITY_VERSION_MISSING,
        });
      } else if (match.versionBelow.length > 0) {
        rejected.push({
          providerId: reg.provider.providerId,
          reason: `Capability version below minimum: ${match.versionBelow.join(", ")}`,
          code: RejectionReasonCode.CAPABILITY_VERSION_BELOW_MINIMUM,
        });
      }
    }

    // Stage 4: runtime availability
    const availableProviders = supportingProviders.filter((reg) => {
      if (!reg.enabled) {
        rejected.push({
          providerId: reg.provider.providerId,
          reason: "Provider disabled",
          code: RejectionReasonCode.STATUS_DISABLED,
        });
        return false;
      }
      if (reg.provider.status !== ProviderStatus.AVAILABLE) {
        rejected.push({
          providerId: reg.provider.providerId,
          reason: `Provider status: ${reg.provider.status}`,
          code:
            reg.provider.status === ProviderStatus.UNAVAILABLE
              ? RejectionReasonCode.STATUS_UNAVAILABLE
              : RejectionReasonCode.STATUS_ERROR,
        });
        return false;
      }
      return true;
    });

    if (availableProviders.length === 0) {
      return this.createDecision(
        decisionId,
        "",
        methodId,
        null,
        rejected,
        "All supporting providers are unavailable",
        RouterDecisionOutcome.ALL_UNAVAILABLE,
        timestamp
      );
    }

    // Stage 5: request constraints (exclude / requiredCapabilities)
    const constrained = this.applyConstraints(availableProviders, constraints, rejected);

    if (constrained.length === 0) {
      // Exhaustion due to request constraints → NO_MATCH (not ALL_UNAVAILABLE)
      return this.createDecision(
        decisionId,
        "",
        methodId,
        null,
        rejected,
        "Request constraints eliminated all valid candidates",
        RouterDecisionOutcome.NO_MATCH,
        timestamp
      );
    }

    // Stage 1-2 filter: capability completeness + version compliance (both HARD)
    const capableProviders = constrained.filter((reg) => {
      const match = capabilityEvals.get(reg.provider.providerId)!;
      const blocked = match.missingCapabilities.length > 0 || match.versionMismatches.length > 0;
      if (blocked) {
        // Already recorded in `rejected` by the capability evaluation loop above.
        return false;
      }
      return true;
    });

    // Aggregate capability match only when at least one capable provider survives
    let capabilityMatch: CapabilityMatchResult | undefined;
    if (capableProviders.length > 0) {
      capabilityMatch = this.aggregateCapabilityMatch(
        method,
        capableProviders,
        capabilityEvals
      );
    }

    if (capableProviders.length === 0) {
      return this.createDecision(
        decisionId,
        "",
        methodId,
        null,
        rejected,
        "No provider matches all required capabilities",
        RouterDecisionOutcome.NO_MATCH,
        timestamp,
        capabilityMatch
      );
    }

    // Stage 6-8: lexicographic comparator
    const preferSet = new Set(constraints?.preferProviders ?? []);
    const candidates: SelectionCandidate[] = capableProviders.map((reg) => {
      const match = capabilityEvals.get(reg.provider.providerId)!;
      return {
        providerId: reg.provider.providerId,
        registration: reg,
        missingCaps: match.missingCapabilities.length, // 0 for all capableProviders
        versionMismatch: match.versionMismatches.length,
        methodSupported: reg.provider.supportedMethods.includes(method.methodId)
          ? 0
          : 1,
        availability: 1,
        preferred: preferSet.has(reg.provider.providerId) ? 0 : 1,
        priority: -reg.provider.priority,
        regOrder: this.registrationOrder.get(reg.provider.providerId) ?? 0,
        idFallback: reg.provider.providerId,
      };
    });

    // Verification: all candidates must have missingCaps === 0
    if (candidates.some((c) => c.missingCaps !== 0)) {
      return this.createDecision(
        decisionId,
        "",
        methodId,
        null,
        rejected,
        "Capability evaluation inconsistency",
        RouterDecisionOutcome.NO_MATCH,
        timestamp
      );
    }

    candidates.sort((a, b) => {
      if (a.versionMismatch !== b.versionMismatch)
        return a.versionMismatch - b.versionMismatch;
      if (a.methodSupported !== b.methodSupported)
        return a.methodSupported - b.methodSupported;
      if (a.availability !== b.availability) return a.availability - b.availability;
      if (a.preferred !== b.preferred) return a.preferred - b.preferred;
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.regOrder !== b.regOrder) return a.regOrder - b.regOrder;
      return a.idFallback < b.idFallback ? -1 : a.idFallback > b.idFallback ? 1 : 0;
    });

    const winner = candidates[0];
    if (!winner) {
      return this.createDecision(
        decisionId,
        "",
        methodId,
        null,
        rejected,
        "No winner determined",
        RouterDecisionOutcome.NO_MATCH,
        timestamp,
        capabilityMatch
      );
    }

    for (const c of candidates) {
      if (c.providerId !== winner.providerId) {
        rejected.push({
          providerId: c.providerId,
          reason: `Lower selection priority (method=${c.methodSupported}, version=${c.versionMismatch})`,
          code: RejectionReasonCode.LOWER_SELECTION_PRIORITY,
        });
      }
    }

    const priorityEval = this.buildPriorityEvaluation(candidates, winner.providerId);

    return this.createDecision(
      decisionId,
      winner.providerId,
      methodId,
      winner.providerId,
      rejected,
      `Selected provider "${winner.registration.provider.displayName}" (priority: ${winner.registration.provider.priority})`,
      RouterDecisionOutcome.SELECTED,
      timestamp,
      capabilityMatch,
      priorityEval
    );
  }

  route(request: ExecutionRequest): {
    valid: boolean;
    decision: RouterDecision;
    result?: ExecutionResult;
  } {
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      return {
        valid: false,
        decision: this.createDecision(
          `decision-${++this.decisionCounter}`,
          request.requestId,
          request.methodId,
          null,
          [],
          validation.errors.join("; "),
          RouterDecisionOutcome.REQUEST_INVALID,
          new Date().toISOString()
        ),
      };
    }

    const decision = this.resolve(request.methodId, request.constraints);
    decision.requestId = request.requestId;

    return {
      valid: decision.finalDecision === RouterDecisionOutcome.SELECTED,
      decision,
    };
  }

  explainDecision(decision: RouterDecision): string {
    const lines: string[] = [];
    lines.push(`Decision: ${decision.decisionId}`);
    lines.push(`Method: ${decision.methodId}`);
    lines.push(`Outcome: ${decision.finalDecision}`);

    if (decision.selectedProvider) {
      lines.push(`Selected: ${decision.selectedProvider}`);
    }

    if (decision.rejectedProviders.length > 0) {
      lines.push("Rejected:");
      for (const rp of decision.rejectedProviders) {
        lines.push(`  - ${rp.providerId}: [${rp.code}] ${rp.reason}`);
      }
    }

    lines.push(`Reason: ${decision.reason}`);

    if (decision.capabilityMatch) {
      const cm = decision.capabilityMatch;
      if (cm.matchedCapabilities.length > 0) {
        lines.push(`Matched capabilities: ${cm.matchedCapabilities.join(", ")}`);
      }
      if (cm.missingCapabilities.length > 0) {
        lines.push(`Missing capabilities: ${cm.missingCapabilities.join(", ")}`);
      }
      if (cm.versionMatches.length > 0) {
        lines.push(`Version matches: ${cm.versionMatches.join(", ")}`);
      }
      if (cm.versionMismatches.length > 0) {
        lines.push(`Version mismatches: ${cm.versionMismatches.join(", ")}`);
      }
    }

    if (decision.priorityEvaluation) {
      const pe = decision.priorityEvaluation;
      if (pe.candidates.length > 0) {
        lines.push("Selection evaluation:");
        for (const c of pe.candidates) {
          lines.push(
            `  - ${c.providerId}: cap=${c.capabilityScore} method=${c.methodScore} avail=${c.availabilityScore} prio=${c.priorityScore} total=${c.totalScore}`
          );
        }
      }
    }

    lines.push(`Timestamp: ${decision.timestamp}`);
    return lines.join("\n");
  }

  listCapabilities(): string[] {
    const caps = new Set<string>();
    for (const reg of this.registry.list()) {
      for (const cap of reg.provider.capabilities) {
        caps.add(cap.capabilityId);
      }
    }
    return Array.from(caps).sort();
  }

  exportRegistry(): ProviderRegistration[] {
    return this.registry.list();
  }

  getRegistry(): ProviderRegistry {
    return this.registry;
  }

  // ─── Private Helpers ────────────────────────────────────────────────

  private applyConstraints(
    providers: ProviderRegistration[],
    constraints: ExecutionConstraints | undefined,
    rejected: RejectedProvider[]
  ): ProviderRegistration[] {
    if (!constraints) return providers;

    let result = providers;
    const rejectedSet = new Set(rejected.map((r) => r.providerId));

    if (constraints.excludeProviders && constraints.excludeProviders.length > 0) {
      const excluded = result.filter((reg) =>
        constraints.excludeProviders!.includes(reg.provider.providerId)
      );
      for (const reg of excluded) {
        if (!rejectedSet.has(reg.provider.providerId)) {
          rejected.push({
            providerId: reg.provider.providerId,
            reason: "Excluded by request constraint",
            code: RejectionReasonCode.EXCLUDED_BY_REQUEST_CONSTRAINT,
          });
          rejectedSet.add(reg.provider.providerId);
        }
      }
      result = result.filter(
        (reg) => !constraints.excludeProviders!.includes(reg.provider.providerId)
      );
    }

    if (constraints.requiredCapabilities && constraints.requiredCapabilities.length > 0) {
      const dropped = result.filter(
        (reg) =>
          !constraints.requiredCapabilities!.every((capId) =>
            reg.provider.capabilities.some((c) => c.capabilityId === capId)
          )
      );
      for (const reg of dropped) {
        if (!rejectedSet.has(reg.provider.providerId)) {
          rejected.push({
            providerId: reg.provider.providerId,
            reason: `Does not satisfy required capabilities: ${constraints.requiredCapabilities!.join(", ")}`,
            code: RejectionReasonCode.REQUIRED_CAPABILITY_MISSING,
          });
          rejectedSet.add(reg.provider.providerId);
        }
      }
      result = result.filter((reg) =>
        constraints.requiredCapabilities!.every((capId) =>
          reg.provider.capabilities.some((c) => c.capabilityId === capId)
        )
      );
    }

    // preferProviders is a Stage-6 soft preference, handled in comparator.
    // (No priority mutation here — preserves semantic ordering.)

    return result;
  }

  private aggregateCapabilityMatch(
    method: Method,
    providers: ProviderRegistration[],
    evals: Map<string, CapabilityMatchResult>
  ): CapabilityMatchResult {
    const requiredCapabilities = method.requiredCapabilities.map((r) => r.capabilityId);
    const allMatched = new Set<string>();
    const allMissing = new Set<string>();
    const versionMatches: string[] = [];
    const versionMismatches: string[] = [];
    const versionMissing: string[] = [];
    const versionBelow: string[] = [];

    for (const reg of providers) {
      const match = evals.get(reg.provider.providerId);
      if (!match) continue;
      for (const m of match.matchedCapabilities) allMatched.add(m);
      for (const m of match.missingCapabilities) allMissing.add(m);
      versionMatches.push(...match.versionMatches);
      versionMismatches.push(...match.versionMismatches);
      versionMissing.push(...match.versionMissing);
      versionBelow.push(...match.versionBelow);
    }

    return {
      requiredCapabilities,
      matchedCapabilities: Array.from(allMatched),
      missingCapabilities: Array.from(allMissing),
      versionMatches,
      versionMismatches,
      versionMissing,
      versionBelow,
    };
  }

  private evaluateCapabilitiesForProvider(
    method: Method,
    provider: Provider
  ): CapabilityMatchResult {
    const required = method.requiredCapabilities.map((r) => r.capabilityId);
    const matched: string[] = [];
    const missing: string[] = [];
    const versionMatches: string[] = [];
    const versionMismatches: string[] = [];
    const versionMissing: string[] = [];
    const versionBelow: string[] = [];

    for (const req of method.requiredCapabilities) {
      const providerCap = provider.capabilities.find(
        (c) => c.capabilityId === req.capabilityId
      );

      if (!providerCap) {
        missing.push(req.capabilityId);
        continue;
      }

      matched.push(req.capabilityId);

      // minVersion is a HARD requirement
      if (req.minVersion) {
        if (!providerCap.version) {
          // Missing provider version when minVersion required → reject
          versionMismatches.push(req.capabilityId);
          versionMissing.push(req.capabilityId);
        } else if (this.compareVersions(providerCap.version, req.minVersion) >= 0) {
          versionMatches.push(req.capabilityId);
        } else {
          versionMismatches.push(req.capabilityId);
          versionBelow.push(req.capabilityId);
        }
      } else {
        // No minVersion → capability satisfies version requirement
        versionMatches.push(req.capabilityId);
      }
    }

    return {
      requiredCapabilities: required,
      matchedCapabilities: matched,
      missingCapabilities: missing,
      versionMatches,
      versionMismatches,
      versionMissing,
      versionBelow,
    };
  }

  private buildPriorityEvaluation(
    candidates: SelectionCandidate[],
    winnerId: string
  ): PriorityEvaluation {
    const scored = candidates.map((c) => {
      const capabilityScore = c.missingCaps === 0 && c.versionMismatch === 0 ? 1 : 0;
      const methodScore = c.methodSupported === 0 ? 1 : 0;
      const availabilityScore = c.availability;
      const priorityScore = -c.priority; // undo negation
      const totalScore =
        capabilityScore * 1000 +
        methodScore * 100 +
        availabilityScore * 10 +
        priorityScore;

      return {
        providerId: c.providerId,
        capabilityScore,
        methodScore,
        availabilityScore,
        priorityScore,
        totalScore,
      };
    });

    return {
      candidates: scored,
      winner: winnerId,
      tieBreakingRule:
        "Lexicographic: capability → version → method → availability → preference → priority → registration → id",
    };
  }

  private compareVersions(a: string, b: string): number {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    const maxLen = Math.max(pa.length, pb.length);

    for (let i = 0; i < maxLen; i++) {
      const na = pa[i] ?? 0;
      const nb = pb[i] ?? 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  private createDecision(
    decisionId: string,
    requestId: string,
    methodId: string,
    selectedProvider: string | null,
    rejectedProviders: RejectedProvider[],
    reason: string,
    finalDecision: RouterDecisionOutcome,
    timestamp: string,
    capabilityMatch?: CapabilityMatchResult,
    priorityEvaluation?: PriorityEvaluation
  ): RouterDecision {
    return {
      decisionId,
      requestId,
      methodId,
      selectedProvider,
      rejectedProviders,
      reason,
      capabilityMatch: capabilityMatch ?? {
        requiredCapabilities: [],
        matchedCapabilities: [],
        missingCapabilities: [],
        versionMatches: [],
        versionMismatches: [],
        versionMissing: [],
        versionBelow: [],
      },
      priorityEvaluation: priorityEvaluation ?? {
        candidates: [],
        winner: null,
        tieBreakingRule: "Lexicographic comparator",
      },
      finalDecision,
      timestamp,
    };
  }
}
