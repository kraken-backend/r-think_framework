# RTHINK-RT-001-R2-C1 — TypeScript Module Resolution Decision

**Decision ID:** RTHINK-RT-001-R2-C1
**Date:** 2026-07-17
**Status:** PROVISIONAL-ACCEPTED
**Authority:** Human Architect (Bro Kraken), Guardian (Bro CG)
**Mission:** RTHINK-RT-001-R2-C1 — TypeScript Resolution and R2 Record Consistency Correction

---

## Context

After RT-001-R2 concluded `moduleResolution: "node"` and reverted an unauthorized `"bundler"` change, the executor later changed it to `"bundler"` to silence a VS Code TypeScript editor error. This created an inconsistency between the R2 report, the R2 evidence document, and the actual working tree. The Guardian Correction Prompt R2-C1 ordered a formal technical evaluation based on the actual runtime architecture, not merely to silence an editor warning.

---

## Tool Versions

| Tool | Version |
|------|---------|
| TypeScript (project) | 5.8.3 |
| TypeScript (VS Code) | UNKNOWN (language server version not determinable from CLI) |
| Node.js | v22.23.1 |
| npm | 10.9.8 |

---

## Observed Architecture

| Property | Value | Significance |
|----------|-------|-------------|
| `package.json` `"type"` | `"module"` | Project is ESM |
| `package.json` `"exports"` | undefined | No conditional exports |
| `package.json` `"main"` | undefined | Entry point is implicit `index.js` |
| `package.json` `"engines"` | `node >= 18.0.0` | Targets modern Node.js |
| `tsconfig.json` `"target"` | `"ES2022"` | Compile target |
| Build command | `tsc` | Plain TypeScript compiler, no bundler |
| Direct bundler dependencies | NONE | No webpack, esbuild, rollup, parcel, tsup |
| Indirect bundler presence | vitest → vite (dev only) | Test runner only, not build pipeline |
| Source import style | `"./contracts/types.js"` | All imports use `.js` extensions |
| Emitted JS import style | `"./contracts/types.js"` | Consistent `.js` extensions |
| `docs/reports/` | git-ignored | Intentional local-only (Human Architect) |
| `raw/` | git-ignored | Intentional local-only (Human Architect) |

---

## Alternatives Evaluated

### 1. `moduleResolution: "node"` (node10)

- **Status:** DEPRECATED in TypeScript 5.x, will be removed in TypeScript 7.0
- **Requires:** `ignoreDeprecations: "5.0"` to suppress tsc error; VS Code TS server still shows error
- **Resolution behavior:** Legacy resolution without `.js` extension enforcement, without `exports` field support
- **Verdict:** REJECTED — deprecated, conceals architectural reality with `ignoreDeprecations`, VS Code still errors

### 2. `moduleResolution: "bundler"` (with `module: "ES2022"`)

- **Status:** Valid, no warnings
- **Requires:** No special flags
- **Resolution behavior:** Permissive — allows extensionless imports, TypeScript-specific extensions, directory imports. Designed for projects where a bundler (webpack, esbuild, rollup, etc.) handles final resolution.
- **Key fact:** No bundler exists in this project's build pipeline. `tsc` is the only build tool.
- **Verdict:** REJECTED — semantically inaccurate. The `"bundler"` mode exists because bundlers perform resolution that differs from Node.js. Without a bundler, this mode misrepresents the runtime.

### 3. `moduleResolution: "node16"` (with `module: "node16"`)

- **Status:** Valid, no warnings
- **Requires:** `module: "node16"` (TS5110 mandates paired settings)
- **Resolution behavior:** Models stable Node16-era module semantics — explicit `.js` extensions, `package.json` `"exports"` support. This is a resolution algorithm, not a runtime restriction; the compiled output runs on any supported Node.js version.
- **Key fact:** All source imports already use `.js` extensions. Typecheck passes.
- **Verdict:** REJECTED in favor of `"nodenext"` — `"nodenext"` tracks the latest Node.js module resolution behavior, which is strictly a superset of `"node16"`

### 4. `moduleResolution: "nodenext"` (with `module: "nodenext"`)

- **Status:** Valid, no warnings
- **Requires:** `module: "nodenext"` (TS5110 mandates paired settings)
- **Resolution behavior:** Tracks latest Node.js module resolution. Requires explicit `.js` extensions. Supports `package.json` `"exports"`. Automatically reflects Node.js ESM rules for `"type": "module"` projects.
- **Key fact:** All source imports already use `.js` extensions. Typecheck passes. Runtime import test passes. Emitted JS is identical in format to current `module: "ES2022"` output.
- **Verdict:** SELECTED — semantically accurate, no warnings, no deprecation, matches actual runtime

---

## Decision

**Selected:** `module: "nodenext"` + `moduleResolution: "nodenext"`

**Classification:** PROVISIONAL-ACCEPTED

**Current selection:** `module: "nodenext"` + `moduleResolution: "nodenext"`

**Rationale:**
1. No bundler exists in the build pipeline — `tsc` is the sole build tool
2. The project runs in Node.js (v22.23.1, engines `>= 18.0.0`)
3. `package.json` has `"type": "module"` — Node.js uses ESM resolution
4. All source imports already use `.js` extensions (required by Node.js ESM)
5. `"nodenext"` tracks current Node.js module resolution behavior
6. No deprecation warnings, no `ignoreDeprecations` needed
7. VS Code TypeScript language server shows no errors
8. Typecheck, tests, build, and runtime import all pass

**Compatibility impact:** Minimal. The `module` setting changes from `"ES2022"` to `"nodenext"`, but for a `"type": "module"` project with `.js` extensions on all imports, the emitted JavaScript is identical. No source code changes required.

**Rejected alternatives:**
- `"node"` / `"node10"` — deprecated, requires `ignoreDeprecations`
- `"bundler"` — semantically incorrect (no bundler in toolchain)
- `"node16"` — models Node16-era semantics (not runtime-restricted), but `"nodenext"` is a strict superset

---

## Provisional Limitations

Classification is PROVISIONAL-ACCEPTED. The selection is technically sound for the current architecture but should be revisited when any review trigger fires.

**Review triggers:**
1. npm/package architecture change (e.g., `exports` field added, conditional exports)
2. Supported Node.js matrix change (e.g., minimum version bump)
3. TypeScript major version upgrade (e.g., TypeScript 7.0)
4. Runtime architecture change (e.g., target shifts from Node.js to Deno/Bun)
5. Introduction of a bundler into the build pipeline

---

## Future Migration / Review Trigger

1. npm/package architecture change (e.g., `exports` field added, conditional exports)
2. Supported Node.js matrix change
3. TypeScript major version upgrade (e.g., TypeScript 7.0)
4. Runtime architecture change (e.g., Deno/Bun target)
5. Introduction of a bundler into the build pipeline
6. If the project is consumed as a library by other TypeScript projects requiring specific resolution modes
