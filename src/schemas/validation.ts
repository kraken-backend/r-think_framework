// R-Think Runtime — Contract Validation Helpers
// Blueprint Reference: RTHINK-BP-001 §7.2, §19

import { z } from "zod";
import { TransitionDecisionSchema } from "./index.js";

// ─── DERIVED: Transition Policy Validators ──────────────────────────────────
// These are derived validation functions that enforce behavioral rules
// beyond structural schema validation. Classified as DERIVED per mission spec.

/**
 * DERIVED: ALLOW decision with unresolved required artifacts is rejected.
 * RTHINK-BP-001 §7.2: "Model may request a transition; runtime decides."
 * RTHINK-BP-001 §5: "Artifacts before transition — State tidak berpindah
 * tanpa required artifact."
 */
export function validateAllowDecisionArtifacts(
  data: z.infer<typeof TransitionDecisionSchema>
): { valid: boolean; reason?: string } {
  if (data.decision === "ALLOW" && data.missingRequirements.length > 0) {
    return {
      valid: false,
      reason: `ALLOW decision rejected: missing required artifacts [${data.missingRequirements.join(", ")}]`,
    };
  }
  return { valid: true };
}

/**
 * DERIVED: Critical mission lacking explicit authority evidence is rejected.
 * RTHINK-BP-001 §6.2: "L3 Critical — Full cycle + independent verifier
 * + explicit authority."
 * RTHINK-BP-001 §5: "Challenge before material decision."
 */
export function validateCriticalMissionAuthority(
  data: z.infer<typeof TransitionDecisionSchema>,
  missionRiskLevel?: string
): { valid: boolean; reason?: string } {
  if (
    missionRiskLevel === "L3_CRITICAL" &&
    data.authorityStatus !== "GRANTED"
  ) {
    return {
      valid: false,
      reason: `Critical mission transition rejected: authority status is ${data.authorityStatus}, expected GRANTED`,
    };
  }
  return { valid: true };
}

/**
 * DERIVED: Validate RTP version is supported.
 * RTHINK-BP-001 §12: Protocol version must be known.
 */
export function validateRtpVersion(
  rtpVersion: string
): { valid: boolean; reason?: string } {
  const supported = ["1.0"];
  if (!supported.includes(rtpVersion)) {
    return {
      valid: false,
      reason: `Unsupported RTP version: ${rtpVersion}. Supported: ${supported.join(", ")}`,
    };
  }
  return { valid: true };
}
