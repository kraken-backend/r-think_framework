# RTHINK-IP-001 — License Architecture Decision Record

**Mission:** RTHINK-IP-001 / RTHINK-IP-001-R1
**Status:** PENDING GUARDIAN AND HUMAN ARCHITECT ACCEPTANCE
**Created:** 2026-07-17
**Corrected:** 2026-07-17 (R1: canonical root placement, official AGPL)

---

## Context

The R-Think Runtime project requires a clear licensing architecture that
protects the creator's rights, enables open-source collaboration, and maintains
trademark control. Prior to RTHINK-IP-001, the project was `UNLICENSED` and
`private: true` in package.json.

---

## Decision

Adopt a **dual-license architecture** with separate trademark reservation:

### 1. Software: AGPL-3.0-only

- **Applies to:** Source code, schemas, validators, tests, fixtures, runtime code
- **SPDX:** AGPL-3.0-only
- **Rationale:**
  - Copyleft ensures derivatives remain open-source
  - Network interaction clause covers SaaS/server deployment
  - Aligns with governance principle: "Local/open-source baseline"
  - Prevents proprietary forks without contributing back

### 2. Documentation: CC-BY-SA-4.0

- **Applies to:** Framework docs, blueprint text, governance docs, README
- **SPDX:** CC-BY-SA-4.0
- **Rationale:**
  - Standard for open documentation
  - Attribution required
  - ShareAlike prevents proprietary documentation forks
  - Separates documentation from software licensing

### 3. Trademark: Reserved Separately

- **Applies to:** R-Think name, R-Think™ wordmark, R-Think logo
- **Status:** ™ (not ®)
- **Rationale:**
  - Neither AGPL nor CC-BY-SA grant trademark rights
  - Prevents confusion about official vs. unofficial versions
  - ™ does not represent completed DJKI registration
  - Professional IP counsel recommended before formal filing

---

## Alternatives Considered

| Alternative | Reason for Rejection |
|-------------|---------------------|
| MIT-only | Insufficient copyleft protection for a governance framework |
| Apache-2.0 | Patent grant clause could create unintended obligations |
| GPL-3.0 (without "only") | Allows GPL-3.0-or-later, which may permit AGPL-incompatible combinations |
| CC-BY-4.0 (without SA) | Allows proprietary documentation derivatives |
| Dual AGPL + proprietary | Contradicts open-source governance principle |
| No trademark reservation | Allows impersonation of official R-Think |

---

## Consequences

### Positive
- Clear separation of concerns (code, docs, trademark)
- Copyleft prevents proprietary forks
- Trademark prevents impersonation
- Standard SPDX identifiers enable automated license compliance
- Third-party obligations are clear and unaltered

### Negative
- AGPL-3.0-only may discourage some commercial adopters
- Requires maintainers to track license headers across files
- Trademark enforcement requires legal resources

### Mitigations
- AGPL commercial licensing can be negotiated separately by the copyright holder
- SPDX headers added to all project-owned source files
- Trademark policy includes clear usage guidelines

---

## Validation

| Requirement | Status |
|-------------|--------|
| All project-owned code has AGPL-3.0-only license | ✅ LICENSE file present |
| All documentation has CC-BY-SA-4.0 | ✅ DOCUMENTATION-LICENSE.md present |
| Third-party licenses unaltered | ✅ NOTICE records all dependencies |
| SPDX headers on source files | ✅ Added to all 6 TS source files |
| Trademark reserved separately | ✅ TRADEMARKS.md created |
| Attribution recorded | ✅ AUTHORS.md, NOTICE, CITATION.cff |
| package.json license field updated | ✅ AGPL-3.0-only |
| README license section updated | ✅ Reflects dual-license architecture |

---

## References

- `LICENSE` — Official AGPL-3.0 full text (downloaded from gnu.org)
- `DOCUMENTATION-LICENSE.md` — CC-BY-SA-4.0 full terms
- `TRADEMARKS.md` — Trademark reservation policy
- `NOTICE` — Copyright and attribution notice
- `AUTHORS.md` — Contributor roles
- `CITATION.cff` — Academic citation metadata

---

*This decision record is part of the R-Think IP foundation established by
RTHINK-IP-001. It requires Guardian and Human Architect acceptance.*
