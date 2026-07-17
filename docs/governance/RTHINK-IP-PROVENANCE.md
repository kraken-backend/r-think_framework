# RTHINK-IP-PROVENANCE — Intellectual Property Provenance Record

**Mission:** RTHINK-IP-001 / RTHINK-IP-001-R1
**Status:** PENDING GUARDIAN AND HUMAN ARCHITECT ACCEPTANCE
**Created:** 2026-07-17
**Corrected:** 2026-07-17 (R1: canonical root placement, official AGPL, citation fix)

---

## Purpose

This document records the intellectual property provenance of the R-Think
Runtime project, including authorship origin, licensing architecture, trademark
status, and third-party dependency obligations.

---

## Authorship and Origin

| Role | Individual | Date |
|------|-----------|------|
| **Framework Creator & Copyright Holder** | Hendri RH — Bro Kraken | 2026 (copyright claim) |
| **Concept Origin** | Alvarendra Mahdi Hendrianto (Rendra) | 27 August 2021 |
| **Architecture Guardian & Engineering Coordinator** | Bro CG | Ongoing |
| **Public Relations & Community Relations** | Hatmadita Ramuny | Ongoing |
| **Engineering Executor** | OpenCode Local (tooling only) | 2026-07-16 → 2026-07-17 |

**Key principle:** OpenCode Local is identified as executor tooling only. It is
not a legal author, owner, or copyright holder. All work produced under the
executor role is controlled by the Human Architect.

---

## Framework Origin

The R-Think framework concept originated from the **Iqra/Perhatikan principle**
— the discipline of observing reality before making decisions. This origin is
attributed to Alvarendra Mahdi Hendrianto (Rendra), dated 27 August 2021.

The concrete expression of this framework (source code, documentation, schemas,
schemas, tests, fixtures) is the work of the current project team under the
authority of the Human Architect.

---

## Copyright Claims

### Project-Owned Work

Copyright (C) 2026 Hendri RH is claimed over:

- TypeScript source code in `src/`
- JSON Schema definitions in `src/schemas/json-schema.ts`
- Zod validator schemas in `src/schemas/index.ts`
- Validation helpers in `src/schemas/validation.ts`
- Contract type definitions in `src/contracts/`
- Test files in `tests/`
- Fixture data in `tests/fixtures/`
- Documentation in `docs/`
- README.md, AUTHORS.md, NOTICE, CITATION.cff
- Governance and decision documents

### Not Copyrighted

The following are **not** claimed as copyrightable:

- Abstract ideas, methods, principles, or concepts (not eligible for copyright)
- The Iqra/Perhatikan principle itself
- Mathematical or logical rules embedded in schemas
- Third-party dependencies (remain under their respective licenses)

---

## Licensing Architecture

### Software License: AGPL-3.0-only

All project-owned source code, schemas, validators, tests, and fixtures are
licensed under the **GNU Affero General Public License v3.0 only**.

- **SPDX identifier:** AGPL-3.0-only
- **License file:** `LICENSE`
- **Key terms:** Copyleft, network interaction clause, source availability

### Documentation License: CC-BY-SA-4.0

Framework documentation, governance documents, and written explanations are
licensed under **Creative Commons Attribution-ShareAlike 4.0 International**.

- **SPDX identifier:** CC-BY-SA-4.0
- **License file:** `DOCUMENTATION-LICENSE.md`
- **Key terms:** Attribution required, ShareAlike for derivatives

### Trademark: Reserved Separately

The R-Think name, R-Think™ wordmark, and R-Think logo are **not** granted
under any open license. Trademark rights are reserved separately.

- **Trademark policy:** `TRADEMARKS.md`
- **Registration status:** ™ (not ®) — no DJKI registration claimed as completed

---

## Third-Party Dependencies

| Package | Version | License | Obligations |
|---------|---------|---------|-------------|
| zod | 3.25.67 | MIT | Include copyright notice |
| ajv | 8.20.0 | MIT | Include copyright notice |
| ajv-formats | 3.0.1 | MIT | Include copyright notice |
| typescript | 5.8.3 | Apache-2.0 | Include copyright notice and license |
| vitest | 3.2.7 | MIT | Include copyright notice |
| @types/node | 22.15.31 | MIT | Include copyright notice |

**No project licensing alters third-party license terms.** Each dependency
retains its own license obligations.

---

## Trademark Status

| Mark | Status | Registration |
|------|--------|-------------|
| R-Think | ™ | NOT registered |
| R-Think™ | ™ | NOT registered |
| R-Think logo | ™ | NOT registered |

- ™ symbol does **not** represent completed government trademark registration
- No DJKI (Direktorat Jenderal Kekayaan Intelektual) registration is claimed
- Professional IP counsel is recommended before formal filing

---

## Legal Limitations

1. **Copyright scope:** Copyright protects concrete expression (code, text,
   diagrams), not abstract ideas, methods, or principles
2. **No patent claims:** No patent rights are claimed as registered
3. **No DJKI claims:** No copyright, trademark, or patent registration with
   Indonesia's Directorate General of Intellectual Property is claimed as
   completed
4. **Professional advice recommended:** IP counsel is recommended before formal
   filing or commercial enforcement

---

## Evidence Trail

This provenance record was established by RTHINK-IP-001 on 2026-07-17 and
corrected by RTHINK-IP-001-R1 on 2026-07-17. Founding Leadership structure
updated by RTHINK-RT-004-C1 on 2026-07-17.

### Files at Canonical Root (corrected by R1)

| File | Purpose |
|------|---------|
| `LICENSE` | Official AGPL-3.0 full text (downloaded from gnu.org) |
| `DOCUMENTATION-LICENSE.md` | CC-BY-SA-4.0 documentation license |
| `NOTICE` | Copyright notice, attribution, third-party obligations |
| `AUTHORS.md` | Contributor roles and attribution |
| `TRADEMARKS.md` | Trademark reservation and usage policy |
| `CITATION.cff` | Academic citation metadata (CFF v1.2.0, no date-released) |
| `docs/governance/RTHINK-IP-PROVENANCE.md` | This document |
| `docs/brand/RTHINK-BRAND-ASSET-INVENTORY.md` | Brand asset inventory |
| `docs/decisions/RTHINK-IP-001_LICENSE-ARCHITECTURE.md` | Architecture decision record |

### Files Modified in RTHINK-IP-001

| File | Change |
|------|--------|
| `package.json` | License field, repository metadata |
| `src/contracts/types.ts` | SPDX header added |
| `src/contracts/index.ts` | SPDX header added |
| `src/schemas/index.ts` | SPDX header added |
| `src/schemas/json-schema.ts` | SPDX header added |
| `src/schemas/validation.ts` | SPDX header added |
| `src/index.ts` | SPDX header added |
| `README.md` | Logo, license, brand sections updated |

---

*This provenance record is part of the R-Think IP foundation established by
RTHINK-IP-001. It requires Guardian and Human Architect acceptance.*
