# RTHINK-RT-001-R1 Evidence Manifest

**Mission:** RTHINK-RT-001-R1 — Formal Contract Evidence and Governance Correction
**Parent Mission:** RTHINK-RT-001 — Repository Baseline, Formal Contracts, Protocol Schema Foundation
**Created:** 2026-07-16T23:25:43+07:00
**Executor:** opencode (big-pickle)
**Blueprint Reference:** RTHINK-BP-001

## Purpose

This manifest records the authoritative SHA-256 hashes of all source files after RTHINK-RT-001-R1 corrections. Any future verification must match these hashes exactly.

## File Hashes (SHA-256)

| File | SHA-256 |
|------|---------|
| `package.json` | `5B573844E68701A7E0B5B4AAC5E6CA9B267507FC808EC4069B1ED087B6538679` |
| `src/contracts/types.ts` | `427912B9E0A5ADB1BA1219A63F974653A664CBF3CD9BE5759BDB54371BF0BED9` |
| `src/contracts/index.ts` | `84ADF1D0053E54EF7723131EC2F3ADAE69BBCC29406893A02797E3FFFE9BB653` |
| `src/schemas/index.ts` | `C9A97BBFB1A47E1A0F765E803978884BDBA3C9FF6BDAFB3F6C704B0818CD64D7` |
| `src/schemas/json-schema.ts` | `60665548B0F1B139F6AE505369FE67CD298B785AF84C66373B78739AA73430C4` |
| `src/schemas/validation.ts` | `1C475E9B6ED9927681EC718A7A4C89E1B5BA1B2BD27647DE069DDD954D16D698` |
| `tests/contracts/rthink-rt-001.test.ts` | `A7C89F260F422B08A083869B0818CF52B38F630FEDA148783CE839CBA61FBDF6` |
| `tests/contracts/json-schema.test.ts` | `279BF4E671F433C81DE16F83F40A8309470AAE9C86E9D8E3C20B1FE7CA7FE88E` |
| `tests/fixtures/valid/index.ts` | `80A48BC42F9560DE6B480E328E9C4E93AAD350E7CDC4C3310A5E0FACE1CA9202` |
| `tests/fixtures/invalid/index.ts` | `0639AA01706A1EAFFD960F2D33676FF5766ADF7C514E2F637B8DA88F1D19856B` |
| `README.md` | `9E474047580B72CBF7673247C74EC41A2F048A8C849C4B195F73C497E5D86642` |
| `TRACKER.md` | `BB23D063F51F19A703FB02EDA073707C2DC20D4B1B7F4BA85932796CEFAA1208` |
| `docs/decisions/RTHINK-RT-001_LICENSE-GATE.md` | `5E994863F3A8F78E31D7F29A81073320182F8A62446C18DCC4E5EA83FF6E9159` |
| `docs/reports/260716_2258_RTHINK-RT-001_Repository-Baseline-and-Formal-Contracts.md` | `B40D0C45E56B0AD88BF86DC4A6F196C494E91A599E17ADEEA67F2176A15E3A8F` |
| `docs/reports/RTHINK-RT-001_Repository-Baseline-and-Formal-Contracts.md` | `B40D0C45E56B0AD88BF86DC4A6F196C494E91A599E17ADEEA67F2176A15E3A8F` |

## Corrections Applied (RTHINK-RT-001-R1)

| # | Correction | File(s) |
|---|-----------|---------|
| 1 | vitest pinned from `^3.2.7` to `3.2.7` | `package.json` |
| 2 | Installed ajv 8.20.0 + ajv-formats 3.0.1 | `package.json`, `package-lock.json` |
| 3 | Renamed `rthunk-rt-001.test.ts` → `rthink-rt-001.test.ts` | `tests/contracts/rthink-rt-001.test.ts` |
| 4 | ArtifactEnvelope sourceRefs conditional: OBSERVATION requires min 1, others allow empty | `src/schemas/index.ts`, `src/schemas/json-schema.ts` |
| 5 | Added non-Observation no-sourceRefs valid fixture | `tests/fixtures/valid/index.ts` |
| 6 | Added bad-timestamp and unknown-property invalid fixtures | `tests/fixtures/invalid/index.ts` |
| 7 | Rewrote JSON Schema tests using ajv (Ajv2020, draft 2020-12) | `tests/contracts/json-schema.test.ts` |
| 8 | Fixed parity test closure over uninitialized `let` vars | `tests/contracts/json-schema.test.ts` |
| 9 | Updated License Gate with ajv/ajv-formats | `docs/decisions/RTHINK-RT-001_LICENSE-GATE.md` |
| 10 | Updated README.md test counts (38→65), fixture counts, file names, license list | `README.md` |

## Validation Evidence

| Check | Result |
|-------|--------|
| TypeScript typecheck | PASS (exit 0, no errors) |
| Build (tsc) | PASS (exit 0, no errors) |
| Contract tests | 65/65 PASSING (25 Zod + 40 JSON Schema) |
| npm audit | 0 vulnerabilities |

## Historical Reports

Both copies of the RT-001 report are identical:
- `docs/reports/260716_2258_RTHINK-RT-001_Repository-Baseline-and-Formal-Contracts.md` (canonical, timestamped)
- `docs/reports/RTHINK-RT-001_Repository-Baseline-and-Formal-Contracts.md` (duplicate)

SHA-256: `B40D0C45E56B0AD88BF86DC4A6F196C494E91A599E17ADEEA67F2176A15E3A8F`

---

*Manifest created by Executor. Integrity verification requires matching all SHA-256 hashes above.*
