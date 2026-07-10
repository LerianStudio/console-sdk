# Dependency Updates Implementation Plan

> **For implementers:** Use ring:executing-plans (rolling wave: dispatch each
> wave — a phase or one epic, your choice — as a workflow → review → user
> checkpoint → detail the next phase against the real code → repeat),
> or ring:running-dev-cycle for the full subagent-orchestrated workflow.
> This document is the living source of truth — task elaboration for later
> phases is written back into it during execution.

**Goal:** Update all dependencies across the console-sdk monorepo to their latest versions, including major bumps, while maintaining a working build and passing tests at every phase boundary.

**Architecture:** Rolling update strategy — safe minor/patch bumps first to reduce noise, then each major-version upgrade isolated so breakage is attributable. Each phase runs `ncu -u` with targeted filters, followed by `npm install`, build, lint, and test verification. The monorepo's shared config in `packages/utils/` means tooling upgrades (TypeScript, ESLint, Babel) propagate to all packages simultaneously.

**Tech Stack:** npm workspaces, npm-check-updates (ncu), Turbo, TypeScript, ESLint, Jest, Storybook

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | All minor/patch deps updated; build + lint + tests green | 1.1, 1.2 | Complete |
| 2 | TypeScript 6 migration complete; all packages compile and tests pass | 2.1, 2.2 | Complete |
| 3 | ESLint 10 + @types/node 26 landed; lint clean across monorepo | 3.1, 3.2 | Complete |
| 4 | Package-specific majors (commander, @formatjs) landed; CLI still works | 4.1, 4.2 | Complete |

---

## Phase 1: Safe Updates (Minor + Patch)

### Epic 1.1: Root and shared minor/patch bumps

**Goal:** All root devDependencies at latest minor/patch; workspace builds and tests still pass
**Scope:** Root `package.json`, `packages/utils/` shared configs
**Dependencies:** none
**Done when:** `npx turbo build && npx turbo lint && npx turbo test` all pass after update
**Status:** Pending

#### Task 1.1.1: Update root package.json minor/patch dependencies

- [ ] Done

**Context:** Root `package.json:32-61` has 26 devDependencies. ncu reports these as minor/patch upgrades from current versions:
- `@typescript-eslint/eslint-plugin` ^8.59.3 → ^8.62.1
- `@typescript-eslint/parser` ^8.59.3 → ^8.62.1
- `eslint-plugin-prettier` ^5.5.5 → ^5.5.6
- `globals` ^17.6.0 → ^17.7.0
- `prettier` ^3.8.1 → ^3.9.4
- `semantic-release` ^25.0.3 → ^25.0.5
- `ts-jest` ^29.4.9 → ^29.4.11
- `turbo` ^2.9.12 → ^2.10.2
- `prettier-plugin-tailwindcss` ^0.7.2 → ^0.8.0 (pre-1.0 minor, treat as potentially breaking — verify Prettier still formats Tailwind classes correctly)

**Implementation vision:** Run `ncu -u --target minor` at root level to bump only minor/patch versions. Then `npm install` to update lockfile. The `prettier-plugin-tailwindcss` 0.7→0.8 bump is pre-1.0 so semver doesn't guarantee backwards compat — after install, run Prettier on a sample file to confirm Tailwind class sorting still works. If it breaks, pin it back to ^0.7.2 and defer to Phase 3.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Verification:** `npx turbo build && npx turbo lint && npx turbo test` — all pass. Run `npx prettier --check packages/sindarian-ui/src/components/ui/button/index.tsx` to verify Tailwind plugin still works.

**Done when:** All root minor/patch deps updated, lockfile regenerated, full monorepo build + lint + test green.

#### Task 1.1.2: Update npm packageManager field

- [ ] Done

**Context:** Root `package.json:8` specifies `"packageManager": "npm@11.12.1"`. ncu shows npm 11.18.0 is available. This field is used by Corepack to enforce the npm version.

**Implementation vision:** Update the `packageManager` field to `"npm@11.18.0"`. This is a non-breaking patch/minor update. After updating, run `npm install` to verify the lockfile is still compatible.

**Files:**
- Modify: `package.json:8`

**Verification:** `npm --version` shows the expected version (or Corepack activates it). `npm install` completes without errors.

**Done when:** packageManager field updated, npm install works cleanly.

---

### Epic 1.2: Per-package minor/patch bumps

**Goal:** All package-level dependencies at latest minor/patch versions
**Scope:** `packages/sindarian-ui/package.json`, `packages/sindarian-server/package.json`, `packages/sindarian-logs/package.json`, `packages/sindarian-i18n-cli/package.json`
**Dependencies:** Epic 1.1 (root deps must be stable first)
**Done when:** `npx turbo build && npx turbo lint && npx turbo test` all pass; Storybook builds (`npm run build-storybook -w packages/sindarian-ui`)
**Status:** Pending

#### Task 1.2.1: Update sindarian-ui minor/patch dependencies

- [ ] Done

**Context:** `packages/sindarian-ui/package.json:34-75` has 14 dependencies + 6 devDependencies. ncu reports these minor/patch bumps:
- All 13 Radix UI packages: minor bumps (e.g., `@radix-ui/react-avatar` ^1.1.11 → ^1.2.1, `@radix-ui/react-checkbox` ^1.3.3 → ^1.3.6, etc.)
- `@tailwindcss/postcss` ^4.1.18 → ^4.3.2, `tailwindcss` ^4.1.18 → ^4.3.2
- `postcss` ^8.5.6 → ^8.5.16
- `dayjs` ^1.11.20 → ^1.11.21
- `tailwind-merge` ^3.4.0 → ^3.6.0
- Storybook ecosystem: ^10.2.0 → ^10.4.6 (all four packages)
- `@chromatic-com/storybook` ^5.0.0 → ^5.2.1
- `@types/react` ^19.2.14 → ^19.2.17

**Implementation vision:** Run `ncu -u --target minor` inside `packages/sindarian-ui/`. Then `npm install` from root. The Radix UI bumps are the main risk area — these are minor versions but could change component APIs or styling. After update, run Storybook build to catch visual/API regressions. The Tailwind 4.1→4.3 bump should be safe (minor) but verify build output includes CSS correctly.

**Files:**
- Modify: `packages/sindarian-ui/package.json`
- Modify: `package-lock.json`

**Verification:** `npx turbo build --filter=@lerianstudio/sindarian-ui && npx turbo test --filter=@lerianstudio/sindarian-ui` pass. `npm run build-storybook -w packages/sindarian-ui` succeeds.

**Done when:** All sindarian-ui deps at latest minor/patch, build + tests + Storybook build green.

#### Task 1.2.2: Update sindarian-server and sindarian-logs minor/patch dependencies

- [ ] Done

**Context:** `packages/sindarian-server/package.json` has `path-to-regexp` ^8.3.0 → ^8.4.2 (patch). `packages/sindarian-logs/package.json` has `@lerianstudio/sindarian-server` dev dep floor bump >=1.0.0-beta.30 → >=1.1.0.

**Implementation vision:** Run `ncu -u --target minor` in both `packages/sindarian-server/` and `packages/sindarian-logs/`. The path-to-regexp patch is low risk. The sindarian-logs dev dep is just a peer dep floor bump — update to match the published version. Run `npm install` from root.

**Files:**
- Modify: `packages/sindarian-server/package.json`
- Modify: `packages/sindarian-logs/package.json`
- Modify: `package-lock.json`

**Verification:** `npx turbo build --filter=@lerianstudio/sindarian-server --filter=@lerianstudio/sindarian-logs && npx turbo test --filter=@lerianstudio/sindarian-server --filter=@lerianstudio/sindarian-logs` pass.

**Done when:** Both packages at latest minor/patch, build + tests green.

#### Task 1.2.3: Update sindarian-i18n-cli minor/patch dependencies

- [ ] Done

**Context:** `packages/sindarian-i18n-cli/package.json:38-44` has 5 dependencies. Only `glob` ^13.0.6 might have a minor bump. `commander` and `@formatjs/ts-transformer` majors are deferred to Phase 4. `typescript` major is deferred to Phase 2.

**Implementation vision:** Run `ncu -u --target minor` in `packages/sindarian-i18n-cli/`. This should only pick up patch-level bumps. Run `npm install` from root.

**Files:**
- Modify: `packages/sindarian-i18n-cli/package.json`
- Modify: `package-lock.json`

**Verification:** `npx turbo build --filter=@lerianstudio/sindarian-i18n-cli && npx turbo test --filter=@lerianstudio/sindarian-i18n-cli` pass.

**Done when:** sindarian-i18n-cli at latest minor/patch, build + tests green.

---

## Phase 2: TypeScript 6 Migration

### Epic 2.1: Bump TypeScript to v6 and fix compilation

**Goal:** All packages compile and tests pass under TypeScript 6
**Scope:** Root `package.json` (typescript devDep), `packages/sindarian-i18n-cli/package.json` (has own TS dep), all `tsconfig.json` files, source files with type errors
**Dependencies:** Phase 1 complete
**Done when:** `npx turbo build && npx turbo check-types && npx turbo test` all pass with TypeScript ^6.0.3
**Status:** Detailed

#### Task 2.1.1: Bump TypeScript version in package.json files

- [ ] Done

**Context:** TypeScript is declared in two places: root `package.json:60` as `"typescript": "^5.9.3"` (devDep shared by all packages) and `packages/sindarian-i18n-cli/package.json:43` as `"typescript": "^5.9.3"` (runtime dependency for the CLI's ts-transformer). Both need to bump to `^6.0.3`.

**Implementation vision:** Update both package.json files to `"typescript": "^6.0.3"`. Run `npm install` from root. Do NOT attempt to fix type errors yet — just get the version installed. Then run `npx turbo build` to see what breaks. Capture the full error output for the next task.

**Files:**
- Modify: `package.json:60` — change typescript to ^6.0.3
- Modify: `packages/sindarian-i18n-cli/package.json:43` — change typescript to ^6.0.3
- Modify: `package-lock.json`

**Verification:** `npm install` succeeds. `npx tsc --version` shows 6.x.

**Done when:** TypeScript 6 installed; version confirmed.

#### Task 2.1.2: Fix tsconfig.json files for TypeScript 6 compatibility

- [ ] Done

**Context:** The monorepo has this tsconfig inheritance chain:
- Base: `packages/utils/tsconfig.json` — strict, no target/module/moduleResolution set
- `sindarian-server/tsconfig.json` — target ES2021, module CommonJS, experimentalDecorators, emitDecoratorMetadata
- `sindarian-logs/tsconfig.json` — target ES2021, module CommonJS, experimentalDecorators, emitDecoratorMetadata
- `sindarian-i18n-cli/tsconfig.json` — target ES2021, module CommonJS
- `sindarian-ui/tsconfig.json` — target ES2022, module NodeNext, moduleResolution NodeNext

TS 6 may deprecate or change behavior of `experimentalDecorators`, `moduleResolution: "node"`, or other options. The `sindarian-server` and `sindarian-logs` packages are decorator-heavy (144 uses across 21 files using `reflect-metadata` + `Reflect.defineMetadata`).

**Implementation vision:** After bumping TS in Task 2.1.1, run `npx turbo check-types` and capture errors. If tsconfig options are deprecated or renamed, update them in the base and per-package configs. Key risk: if TS 6 removes `experimentalDecorators` support, sindarian-server and sindarian-logs would need significant refactoring — in that case, STOP and escalate to the user. More likely: the flag still works but with warnings, or needs a renamed option.

**Files:**
- Modify: `packages/utils/tsconfig.json` (if base settings need updating)
- Modify: Any per-package `tsconfig.json` that has deprecated options

**Verification:** `npx turbo check-types` passes (or shows only source-level type errors, not config errors).

**Done when:** All tsconfig files are TS 6-compatible; no config-level errors.

#### Task 2.1.3: Fix TypeScript 6 type errors in source code

- [ ] Done

**Context:** After Tasks 2.1.1 and 2.1.2, there may be source-level type errors from TS 6's stricter checks. The monorepo has 129 instances of `any` across 52 files (concentrated in sindarian-server's logger and context modules). TS 6 may also change inference behavior or narrow types differently.

**Implementation vision:** Run `npx turbo check-types 2>&1` and collect all errors. Fix each error at the source — prefer adding explicit types over suppressing with `// @ts-expect-error`. Group fixes by package. For decorator-related errors in sindarian-server/logs, follow the existing patterns in those packages. If errors are extensive (>20 files affected), categorize them and fix systematically by error code.

**Files:**
- Modify: Source files flagged by `tsc --noEmit` (exact files depend on error output)

**Verification:** `npx turbo build && npx turbo check-types && npx turbo test` all pass.

**Done when:** Zero type errors; all 1,002+ tests pass; build output clean.

### Epic 2.2: Verify ts-jest compatibility with TypeScript 6

**Goal:** Jest test runner works correctly with TS 6 transform
**Scope:** Jest configs, ts-jest setup, test execution
**Dependencies:** Epic 2.1 (TS 6 compiles)
**Done when:** `npx turbo test` passes across all packages with no transform errors
**Status:** Pending

#### Task 2.2.1: Verify and fix ts-jest with TypeScript 6

- [ ] Done

**Context:** All packages use `ts-jest` (v29.4.11) as the Jest transform: `transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.eslint.json' }] }`. sindarian-ui also has a `@jest-config-loader ts-node` pragma for Jest 30+ compatibility. ts-jest 29.x may not support TS 6 — check the ts-jest compatibility matrix.

**Implementation vision:** Run `npx turbo test` after TS 6 is installed. If ts-jest fails with version mismatch errors, check if a newer ts-jest version supports TS 6 and bump it. The current ts-jest 29.4.11 may need updating. If no compatible ts-jest exists yet, this is a blocker — escalate to user.

**Files:**
- Modify: `package.json` (ts-jest version if needed)
- Modify: `package-lock.json`

**Verification:** `npx turbo test` — all test suites pass.

**Done when:** All tests pass with TS 6 + ts-jest.

---

## Phase 3: ESLint 10 + Tooling Majors

### Epic 3.1: Upgrade ESLint to v10 and update config

**Goal:** ESLint 10 runs cleanly across the monorepo with updated flat config
**Scope:** Root `package.json`, `packages/utils/eslint.config.mjs`, all package-level ESLint configs, `@eslint/js` ^9→^10, `eslint` ^9→^10
**Dependencies:** Phase 2 complete
**Done when:** `npx turbo lint` passes with ESLint 10
**Status:** Detailed

#### Task 3.1.1: Bump ESLint ecosystem to v10

- [ ] Done

**Context:** Root `package.json` has `eslint: ^9.39.2` and `@eslint/js: ^9.39.2`. The monorepo already uses flat config format (ESLint 9 style). All configs are `.mjs` (ES module) except `packages/sindarian-ui/eslint.config.js` which is CJS and already broken (pre-existing lint failure: `TypeError: baseConfig is not iterable`).

**Implementation vision:** Bump `eslint` to `^10.6.0` and `@eslint/js` to `^10.0.1` in root `package.json`. Run `npm install`. Then run `npx turbo lint` and capture errors. ESLint 10 may drop support for `FlatCompat` (used in `packages/utils/eslint.config.mjs`), change API surface, or require config adjustments. Fix errors iteratively. For sindarian-ui's CJS config, convert it to `.mjs` with ES imports as part of this task since it's already broken.

**Files:**
- Modify: `package.json` — bump eslint and @eslint/js
- Modify: `packages/utils/eslint.config.mjs` — if FlatCompat or API changes needed
- Modify: `packages/sindarian-ui/eslint.config.js` → rename to `eslint.config.mjs` and convert to ES imports
- Modify: `package-lock.json`

**Verification:** `npx turbo lint` — all 4 packages pass (including sindarian-ui, which was previously broken).

**Done when:** ESLint 10 installed; all packages lint clean.

### Epic 3.2: Upgrade @babel/preset-typescript to v8 and @types/node to v26

**Goal:** Tooling dependencies at latest major; build + tests still pass
**Scope:** Root `package.json`
**Dependencies:** Epic 3.1
**Done when:** `npx turbo build && npx turbo test && npx turbo check-types` all pass
**Status:** Detailed

#### Task 3.2.1: Bump @babel/preset-typescript and @types/node

- [ ] Done

**Context:** Root `package.json` has `@babel/preset-typescript: ^7.28.5` and `@types/node: ^25.6.2`. Investigation shows `@babel/preset-typescript` is declared but NOT actively used by any config — no babel.config.* or .babelrc files exist. Jest uses ts-jest (not Babel) for transforms. `@types/node` is used for Node.js type definitions across all packages.

**Implementation vision:** Bump `@babel/preset-typescript` to `^8.0.1` and `@types/node` to `^26.1.0` in root `package.json`. Run `npm install`. Since Babel isn't actually used, the v8 bump should be a no-op. For @types/node v26, run `npx turbo check-types` to verify no type errors from removed/changed Node APIs. If @babel/preset-typescript is truly unused, consider removing it entirely — but defer that decision to the user (note it in the report, don't remove).

**Files:**
- Modify: `package.json` — bump both dependencies
- Modify: `package-lock.json`

**Verification:** `npx turbo build && npx turbo check-types && npx turbo test` all pass.

**Done when:** Both at latest major; no regressions.

---

## Phase 4: Package-Specific Majors

### Epic 4.1: Upgrade commander to v15 in sindarian-i18n-cli

**Goal:** CLI argument parsing works with commander 15; all CLI commands functional
**Scope:** `packages/sindarian-i18n-cli/package.json`, `packages/sindarian-i18n-cli/src/cli.ts`
**Dependencies:** Phases 2-3 complete
**Done when:** `npx turbo build --filter=@lerianstudio/sindarian-i18n-cli && npx turbo test --filter=@lerianstudio/sindarian-i18n-cli` pass
**Status:** Detailed

#### Task 4.1.1: Bump commander to v15 and fix CLI if needed

- [ ] Done

**Context:** `packages/sindarian-i18n-cli/package.json` has `"commander": "^14.0.3"`. The CLI is defined in `packages/sindarian-i18n-cli/src/cli.ts` and uses commander for `extract`, `check`, and `check-keys` subcommands with options like `-c, --config`.

**Implementation vision:** Bump `commander` to `^15.0.0` in the package.json. Run `npm install` from root. Then `npx turbo build --filter=@lerianstudio/sindarian-i18n-cli` and `npx turbo test --filter=@lerianstudio/sindarian-i18n-cli`. Commander major bumps typically involve changes to option parsing, error handling, or TypeScript types. If tests fail, read the cli.ts file and fix the API usage.

**Files:**
- Modify: `packages/sindarian-i18n-cli/package.json` — commander ^14.0.3 → ^15.0.0
- Modify: `packages/sindarian-i18n-cli/src/cli.ts` — if API changes needed
- Modify: `package-lock.json`

**Verification:** `npx turbo build --filter=@lerianstudio/sindarian-i18n-cli && npx turbo test --filter=@lerianstudio/sindarian-i18n-cli` pass.

**Done when:** Commander 15 installed; CLI builds and tests pass.

### Epic 4.2: Upgrade @formatjs/ts-transformer to v4 in sindarian-i18n-cli

**Goal:** i18n message extraction works with the new transformer version
**Scope:** `packages/sindarian-i18n-cli/package.json`, extraction source files if API changed
**Dependencies:** Epic 4.1 (commander stable)
**Done when:** `npx turbo test --filter=@lerianstudio/sindarian-i18n-cli` passes; extraction output matches previous behavior
**Status:** Detailed

#### Task 4.2.1: Bump @formatjs/ts-transformer to v4 and fix extraction

- [ ] Done

**Context:** `packages/sindarian-i18n-cli/package.json` has `"@formatjs/ts-transformer": "^3.14.2"`. The extractor uses it in `packages/sindarian-i18n-cli/src/extractor.ts` via `transform(ts, opts)` to extract i18n messages from source files. In Task 2.1.3, we already added type casts at the TS boundary (`ts as any` and `as unknown as ts.TransformerFactory`).

**Implementation vision:** Bump `@formatjs/ts-transformer` to `^4.4.14`. Run `npm install`. The v4 upgrade may change the `transform()` API signature or the options shape. Run `npx turbo build --filter=@lerianstudio/sindarian-i18n-cli` first. If it fails, read the extractor.ts usage and compare with the new API. The type casts from the TS 6 migration may need updating or may become unnecessary if v4 ships with TS 6 types. Run tests after fixing.

**Files:**
- Modify: `packages/sindarian-i18n-cli/package.json` — @formatjs/ts-transformer ^3.14.2 → ^4.4.14
- Modify: `packages/sindarian-i18n-cli/src/extractor.ts` — if API changes needed
- Modify: `package-lock.json`

**Verification:** `npx turbo build --filter=@lerianstudio/sindarian-i18n-cli && npx turbo test --filter=@lerianstudio/sindarian-i18n-cli` pass.

**Done when:** @formatjs/ts-transformer v4 installed; extraction works; all i18n-cli tests pass.
