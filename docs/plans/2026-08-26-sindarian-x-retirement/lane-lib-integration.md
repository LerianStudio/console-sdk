# Sindarian Library Integration Implementation Plan

> **For implementers:** Use ring-default:executing-plans, ring-default:dispatching-workflows,
> or ring-dev-team:running-dev-cycle. This document is the living source of truth.
> Read `index.md` in this directory FIRST — Frozen Contracts and the "Follow-ups inherited
> from wave 2" list bind this lane.

**Goal:** The merged sindarian-ui verifies end to end, every wave-2 follow-up lands, and a consumable package exists (tarball-verified; npm beta publish is BLOCKED on the org NPM_TOKEN rotation — see NOTA below).

**Architecture:** This lane runs ALONE in wave 3 — the single-owner window. Unlike wave-2 lanes, it may touch ANY file in `packages/sindarian-ui` (and repo config), because no sibling writes concurrently. The senior rule still holds for behavior: changes to pre-existing code must be additive or defect fixes (the `warning` toast variant is additive; the tsconfig fix removes accidentally-shipped test files).

NOTA (RESOLVED — kept for history): the develop release workflow was failing with npm 401 ("Invalid npm token"), so publishing was impossible until the secret was rotated. That blocker is CLEARED: the token was rotated and the accumulated betas published, through `@lerianstudio/sindarian-ui@1.2.0-beta.15` — the version the four app lanes migrated and verified against. `1.2.0` is the stable this promote PR carries. There is no `1.3.0-beta.*`, and none is expected: the retirement shipped inside the 1.2.0 line.

Every task below stays registry-independent regardless (consumer verification uses `npm pack`), which is why the lane could complete while the token was still broken.

**Tech Stack:** TypeScript 6, Jest/RTL, Turbo, Vite (scratch consumer), semantic-release.

**Lane:** lib-integration
**Depends on:** primitives (PR #134), enterprise (PR #136), theme-toasts-charts (PR #133), domain (PR #135) — all merged
**Worktree:** `/srv/worktrees/sindarian-integration` on branch `test/sindarian-enterprise-integration`

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | follow-ups landed + combined verification green + tarball-consumer smoke passes | 1.1, 1.2, 1.3 | Detailed |

---

### Epic 1.1: Wave-2 inherited follow-ups (library code)

**Goal:** Follow-ups (a), (c), (d), (g), (i), (j) from index.md § Integration Lane are landed.
**Scope:** `packages/sindarian-ui/src/hooks/use-toast.ts`, `src/components/ui/toast/`, `src/toast/helpers.ts`, `src/components/form/**`, `src/index.tsx`, `src/__tests__/tokens-contract.test.ts`, `packages/sindarian-ui/package.json`, `packages/utils/jest` setup.
**Dependencies:** none
**Done when:** warningToast renders a real warning tone; helper dedup done; tokens semantics asserted; turbo suite green.
**Status:** Pending

#### Task 1.1.1: Add the `warning` toast variant and remap warningToast

- [ ] Done

**Context:** `src/hooks/use-toast.ts` has variants `default | success | destructive`; `src/toast/helpers.ts` maps `warningToast` → `destructive` as an interim (FC-3 exception #2 — the app-visible contract is a real warning tone, and no app consumes the interim). The Toaster styling lives with the toast component.

**Implementation vision:** ADDITIVE: extend `ToastVariant` with `'warning'`, add its style branch in the Toaster/toast component (visual tone from `system-alert*` tokens per FC-2 mapping), remap `warningToast` to `'warning'`, update the helper's doc comment and the exception tests (the `errorCode` drop test stays). No existing variant changes.

**Files:**
- Modify: `packages/sindarian-ui/src/hooks/use-toast.ts`, the toast component under `src/components/ui/toast/`, `packages/sindarian-ui/src/toast/helpers.ts` + tests

**Verification:** helper test asserts warningToast renders the warning tone via the real Toaster; existing toast tests unchanged and green.

**Done when:** warning variant exported in `ToastVariant`, warningToast uses it.

#### Task 1.1.2: Dedupe the form-field label helper and add @types/react-dom

- [ ] Done

**Context:** `RenderableLabel` + `hasRenderableLabel` are duplicated verbatim (~40 lines ×3) in `src/components/form/{textarea-field,radio-group-field,file-upload-field}/index.tsx`, with a subtle branch-ordering constraint (element before portal before collection) — the largest correctness risk left from wave 2. Also: `@types/react-dom` is absent, so no test can touch react-dom type-safely (the portal tests hand-build the node).

**Implementation vision:** Extract to `src/components/form/renderable-label.ts` (single copy, ordering constraint documented once), import in the three fields, delete the copies. Add `@types/react-dom` to devDependencies. Swap the hand-built portal in the three test files for a real `createPortal` (keep one hand-built case as a shape regression if desired). Also land follow-up (c): move the three form-field export lines from `src/index.tsx` into `src/components/form/index.ts` per package convention (public surface identical — verify with a dist export diff).

**Files:**
- Create: `packages/sindarian-ui/src/components/form/renderable-label.ts`
- Modify: the three field files + tests, `src/components/form/index.ts`, `src/index.tsx`, `packages/sindarian-ui/package.json`

**Verification:** turbo suite green; dist export list byte-identical before/after the barrel move.

**Done when:** one helper copy, real portal tests, identical public surface.

#### Task 1.1.3: Shared ResizeObserver stub + FC-2 semantics assertions

- [ ] Done

**Context:** Four primitives test files carry a local jsdom `ResizeObserver` stub (follow-up d). `tokens-contract.test.ts` asserts token PRESENCE only; FC-2 also requires `--credit-foreground` mirroring `--credit` in both themes and every FC-2 `@theme inline` alias wrapping its raw token in `hsl()` (follow-up g).

**Implementation vision:** Hoist the stub into the shared jest setup (check `packages/utils/jest.config.ts` wiring; add a setup file if the package lacks one), delete the four local copies. Extend the tokens test with the two semantic invariants.

**Files:**
- Modify: jest setup (shared or package-level), the four test files, `packages/sindarian-ui/src/__tests__/tokens-contract.test.ts`

**Verification:** turbo suite green; mutating `--credit-foreground` locally fails the new assertion (spot-check, revert).

**Done when:** zero local stubs; semantics asserted.

---

### Epic 1.2: Repo hygiene follow-ups

**Goal:** Follow-ups (b), (e), (f), (h) landed: dist stops shipping test files, Storybook sees and type-checks every wave-2 story, StatCard uses the domain primitives.
**Scope:** `packages/sindarian-ui/tsconfig.json`, `.storybook/main.ts`, `tsconfig.storybook.json`, `packages/sindarian-ui/src/enterprise/stat-card/**`.
**Dependencies:** none (parallel with 1.1)
**Done when:** `dist` contains no `*.test.*`; Storybook builds with all story globs; story type-check actually runs; StatCard renders via domain LedgerPanel/SectionLabel/Figure with its outer API unchanged.
**Status:** Pending

#### Task 1.2.1: Stop shipping tests in dist; fix Storybook config

- [ ] Done

**Context:** (b) tsconfig excludes `**/*.test.ts` but not `**/*.test.tsx`, so React test files compile into dist and ship (11+ files). (f) `.storybook/main.ts` globs only `../src/components/**` — wave-2 stories in `src/{enterprise,theme,toast,charts,domain}` are invisible. (h) `tsconfig.storybook.json` dies on 2 pre-existing TS6059 rootDir errors before checking any story; after fixing it, two pre-existing offenders (`page.stories.tsx`, `collapsible.stories.tsx`) will surface — fix those two stories too (they are pre-existing defects, not new surface).

**Implementation vision:** Add `**/*.test.tsx` to the tsconfig exclude; verify dist diff removes only test artifacts. Extend story globs. Fix the storybook tsconfig rootDir (include `.storybook/` paths properly) and repair the two offending stories minimally.

**Files:**
- Modify: `packages/sindarian-ui/tsconfig.json`, `.storybook/main.ts`, `tsconfig.storybook.json`, `src/components/page/page.stories.tsx`, `src/components/ui/collapsible/collapsible.stories.tsx` (paths approximate — locate exactly)

**Verification:** `ls dist` post-build has no test files; Storybook build (or its type-check) passes with all globs.

**Done when:** dist clean, stories visible and type-checked.

#### Task 1.2.2: Re-point StatCard at the domain primitives

- [ ] Done

**Context:** (e) StatCard inlined LedgerPanel/SectionLabel/Figure markup during wave 2 to respect file disjointness; the domain lane's primitives are now merged. The inline-SVG trend STAYS (sparkline was never ported — census).

**Implementation vision:** Replace the inlined markup with imports from `../../domain/...`, keeping StatCard's outer API and rendered semantics identical (its tests must pass unchanged — treat any needed test edit as a red flag to investigate).

**Files:**
- Modify: `packages/sindarian-ui/src/enterprise/stat-card/index.tsx`

**Verification:** StatCard tests pass UNCHANGED; visual story diff acceptable in both themes.

**Done when:** no duplicated ledger markup remains in StatCard.

---

### Epic 1.3: Combined verification and consumable package

**Goal:** The whole package proves out: monorepo green, no cross-lane regressions, a real consumer compiles and renders against the built artifact.
**Scope:** verification only + a THROWAWAY scratch app outside the repo (do not commit it).
**Dependencies:** 1.1, 1.2
**Done when:** all checks below green; tarball smoke passes; results recorded in the lane report.
**Status:** Pending

#### Task 1.3.1: Full verification sweep

- [ ] Done

**Context:** Four lanes merged into one package; the deferred cross-lane checks (lane-cut rule 4) run here.

**Implementation vision:**
- `npx turbo build lint check-types test` (whole monorepo, not just the package).
- Duplicate-export scan across the FULL merged barrel (FC-4): zero duplicate named exports.
- Census completeness, verified in TWO passes because value and type exports live in different build artifacts. TypeScript erases type-only exports from the emitted JavaScript, so a symbol like `FileUploadResult`, `DataTableProps`, `MoneyDiffInput`, `AgingBucketsLabels` or `ChartConfig` appears ONLY in `dist/index.d.ts` and never in `dist/index.js` — checking every FC-6 symbol against the JS bundle reports false absences.
  - Value exports (components, functions, constants): must resolve from the built `dist/index.js`.
  - Type-only exports (interfaces, type aliases): must resolve from `dist/index.d.ts`.
  - In the scratch consumer, import type-only symbols with `import type { … }`; a plain `import` of a type-only symbol fails to resolve at runtime against the built bundle.
- Absence checks: no `sindarian-x` string in package code/manifests/config (docs/plans excluded); no TODO/FIXME/placeholder left by wave-2 lanes in the new directories; every FC-2 token present in built CSS.
- Scratch consumer: `npm pack` the built package into a tarball; scaffold a throwaway Vite React app in /tmp; install the tarball + peers; compile a file importing EVERY new export (values by plain `import`, types by `import type` — see the two-pass rule above); mount ThemeProvider + Toaster + a DataTable + one ChartContainer chart + MoneyText/KeyId; `vite build` green AND an EXECUTABLE render smoke — a jsdom-based test inside the scratch app (vitest) that mounts the composed page from the built bundle and asserts rendered output (table rows, chart svg, money text) with zero console errors. `curl` against `vite preview` is only a server-availability check, never the render proof.
- Record in the report: the exact export count, and that beta publish remains blocked on the npm token (the merge will trigger it once rotated).

**Files:**
- None committed beyond fixes any check forces (report first if a fix belongs to another owner).

**Verification:** all of the above, outputs quoted in the lane report.

**Done when:** every check green; report written.
