# RTHINK-RT-001 License Gate

**Mission:** RTHINK-RT-001 — Repository Baseline, Formal Contracts, and Protocol Schema Foundation
**Updated:** 2026-07-16 (RTHINK-RT-001-R1 correction)
**Blueprint Reference:** RTHINK-BP-001 §14

## Direct Dependencies

| Package | Pinned Version | License | Purpose | Runtime/Dev | Account Required | Cloud Required | Telemetry | Replacement |
|---------|---------------|---------|---------|-------------|-----------------|---------------|-----------|-------------|
| zod | 3.25.67 | MIT | Schema validation (Zod runtime validators) | Runtime | No | No | No | Manual validation |
| ajv | 8.20.0 | MIT | Standards-compliant JSON Schema validation | Runtime | No | No | No | Manual validation |
| ajv-formats | 3.0.1 | MIT | format validation for ajv (date-time, etc.) | Runtime | No | No | No | Manual regex |
| typescript | 5.8.3 | Apache-2.0 | TypeScript compiler and type checking | Dev | No | No | No | — |
| vitest | 3.2.7 | MIT | Contract test runner | Dev | No | No | No | Jest |
| @types/node | 22.15.31 | MIT | TypeScript type definitions for Node.js | Dev | No | No | No | — |

## Assessment

All 6 direct dependencies:
- **License compatibility:** PASS (MIT, Apache-2.0 — all open-source permissive)
- **Account required:** No
- **Cloud access required:** No
- **Mandatory telemetry:** No
- **Credit card required:** No
- **CPU-only execution:** Yes

## Vulnerability Status

- `npm audit` reports **0 vulnerabilities** after upgrading vitest to 3.2.7 and adding ajv 8.20.0

## RTHINK-RT-001-R1 Correction

- Added ajv 8.20.0 to replace custom recursive JSON Schema validator
- Added ajv-formats 3.0.1 for format keyword support (date-time)
- ajv 8.20.0 resolves moderate ReDoS vulnerability (GHSA-2g4f-4pwh-qvx6) present in earlier versions
- All dependencies re-verified against License Gate criteria

## Recommendation

All dependencies PASS the License Gate. Safe to proceed.
