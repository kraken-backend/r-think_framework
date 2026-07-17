/* R-Think Runtime
 * Copyright (C) 2026 Hendri RH
 * SPDX-License-Identifier: AGPL-3.0-only */

// R-Think Runtime — Artifact Registry
// Blueprint Reference: RTHINK-BP-001 §8, Appendix B

import { ArtifactEnvelopeSchema } from "../schemas/index.js";
import type { ArtifactEnvelope } from "../contracts/index.js";
import type { ArtifactType } from "../contracts/types.js";

// ─── Validation Result ───────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Artifact Registry ───────────────────────────────────────────────────────
// DERIVED: In-memory artifact storage with immutable versioning

export class ArtifactRegistry {
  private artifacts: Map<string, ArtifactEnvelope> = new Map();
  private versionHistory: Map<string, ArtifactEnvelope[]> = new Map();

  // ─── Register ────────────────────────────────────────────────────────────
  // Register a new artifact. Rejects duplicates and invalid artifacts.

  registerArtifact(artifact: ArtifactEnvelope): ValidationResult {
    const validation = this.validateArtifact(artifact);
    if (!validation.valid) {
      return validation;
    }

    if (this.artifacts.has(artifact.artifactId)) {
      return {
        valid: false,
        errors: [
          `Duplicate artifact ID: "${artifact.artifactId}" already exists`,
        ],
      };
    }

    this.artifacts.set(artifact.artifactId, artifact);
    this.versionHistory.set(artifact.artifactId, [artifact]);
    return { valid: true, errors: [] };
  }

  // ─── Get ─────────────────────────────────────────────────────────────────
  // Retrieve the current version of an artifact by ID.

  getArtifact(artifactId: string): ArtifactEnvelope | undefined {
    return this.artifacts.get(artifactId);
  }

  // ─── List ────────────────────────────────────────────────────────────────
  // List all current artifacts, optionally filtered by type or mission.

  listArtifacts(filters?: {
    artifactType?: ArtifactType;
    missionId?: string;
  }): ArtifactEnvelope[] {
    let results = Array.from(this.artifacts.values());

    if (filters?.artifactType) {
      results = results.filter((a) => a.artifactType === filters.artifactType);
    }
    if (filters?.missionId) {
      results = results.filter((a) => a.missionId === filters.missionId);
    }

    return results;
  }

  // ─── Has ─────────────────────────────────────────────────────────────────
  // Check whether an artifact ID exists in the registry.

  hasArtifact(artifactId: string): boolean {
    return this.artifacts.has(artifactId);
  }

  // ─── Remove ──────────────────────────────────────────────────────────────
  // Remove an artifact by ID. Preserves version history.

  removeArtifact(artifactId: string): boolean {
    return this.artifacts.delete(artifactId);
  }

  // ─── Replace ─────────────────────────────────────────────────────────────
  // Create a new version of an existing artifact. The old version is preserved
  // in version history. The new version supersedes the old.

  replaceArtifact(
    artifactId: string,
    replacement: Omit<ArtifactEnvelope, "supersedes">
  ): ValidationResult {
    const current = this.artifacts.get(artifactId);
    if (!current) {
      return {
        valid: false,
        errors: [`Artifact not found: "${artifactId}"`],
      };
    }

    if (replacement.artifactId !== artifactId) {
      return {
        valid: false,
        errors: [
          `Artifact ID mismatch: replacement has "${replacement.artifactId}", expected "${artifactId}"`,
        ],
      };
    }

    const newVersion: ArtifactEnvelope = {
      ...replacement,
      version: current.version + 1,
      supersedes: current.artifactId,
    };

    const validation = this.validateArtifact(newVersion);
    if (!validation.valid) {
      return validation;
    }

    this.artifacts.set(artifactId, newVersion);

    const history = this.versionHistory.get(artifactId) ?? [];
    history.push(newVersion);
    this.versionHistory.set(artifactId, history);

    return { valid: true, errors: [] };
  }

  // ─── Validate ────────────────────────────────────────────────────────────
  // Validate an artifact against the ArtifactEnvelope schema.

  validateArtifact(artifact: ArtifactEnvelope): ValidationResult {
    const result = ArtifactEnvelopeSchema.safeParse(artifact);
    if (result.success) {
      return { valid: true, errors: [] };
    }
    return {
      valid: false,
      errors: result.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`
      ),
    };
  }

  // ─── Version History ─────────────────────────────────────────────────────
  // Retrieve the full version history of an artifact.

  getVersionHistory(artifactId: string): ArtifactEnvelope[] {
    return this.versionHistory.get(artifactId) ?? [];
  }

  // ─── Size ────────────────────────────────────────────────────────────────
  // Number of current artifacts in the registry.

  get size(): number {
    return this.artifacts.size;
  }
}
