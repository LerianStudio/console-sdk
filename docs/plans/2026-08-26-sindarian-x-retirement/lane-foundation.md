# Sindarian Enterprise Foundation Implementation Plan

> **For implementers:** Use ring-default:executing-plans (rolling-phase: elaborate the
> current phase against the real code, execute its tasks in review-checkpointed
> batches, then elaborate the next phase — repeat),
> ring-default:dispatching-workflows to run each phase as a reviewed multi-agent
> workflow (review + contrarian baked in), or ring-dev-team:running-dev-cycle for the
> full subagent-orchestrated workflow.
> This document is the living source of truth — task elaboration for later
> phases is written back into it during execution.
> Read `index.md` § Frozen Contracts in this directory BEFORE writing any code.

**Goal:** Prepare `@lerianstudio/sindarian-ui` to absorb the sindarian-x surface: sub-barrel scaffold, wave-2 dependencies, additive design tokens, and the `cn`/typography exports — all strictly additive (senior rule: nothing existing changes).

**Architecture:** This lane exists to own the three contention files (`package.json`, `globals.css`, `src/index.tsx`) so the four wave-2 porting lanes can run fully parallel without ever touching them (except `primitives`, which inherits `src/index.tsx`). Everything here is additive; a change to an existing export, prop, or token value is a defect, not a judgment call.

**Tech Stack:** TypeScript 6 (strict), React 19, Tailwind v4 CSS-first, tsc + tsc-alias, Vitest/Jest per repo config, Turbo.

**Lane:** foundation
**Depends on:** none
**Worktree:** `/srv/worktrees/sindarian-foundation` on branch `feat/sindarian-enterprise-foundation`

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | sindarian-ui builds with the sub-barrel scaffold, new deps, new tokens, and new utility exports; existing surface byte-identical | 1.1, 1.2, 1.3 | Detailed |

---

### Epic 1.1: Sub-barrel scaffold and wave-2 dependencies

**Goal:** The five enterprise sub-modules exist and are wired into the public barrel; every dependency wave 2 needs is installed.
**Scope:** `packages/sindarian-ui/src/{enterprise,theme,toast,charts,domain}/`, `packages/sindarian-ui/src/index.tsx`, `packages/sindarian-ui/package.json`.
**Dependencies:** none
**Done when:** `npx turbo build --filter=@lerianstudio/sindarian-ui` is green and the built `dist/index.d.ts` shows only additions relative to the pre-lane build.
**Status:** Pending

#### Task 1.1.1: Create the five sub-barrel modules and wire the public barrel

- [ ] Done

**Context:** The public barrel is `packages/sindarian-ui/src/index.tsx` (~58 lines, sections for ui primitives, application components, hooks). No `enterprise/`, `theme/`, `toast/`, `charts/`, or `domain/` directory exists under `packages/sindarian-ui/src/`. Wave-2 lanes will fill these directories; each exports only through its own `index.ts` (index.md § File Ownership).

**Implementation vision:** Create each directory with an `index.ts` containing only `export {}` and a one-line comment naming the owning lane (e.g. `// Owned by lane enterprise — see docs/plans/2026-08-26-sindarian-x-retirement/`). Append the FC-1 block verbatim to `src/index.tsx` — five `export * from` lines as ONE CONTIGUOUS BLOCK in the exact frozen order (later work may append further exports after the block; the block itself is never split or reordered). Do not reorder, regroup, or reformat any existing export line. `export * from` an empty module is valid TS and emits nothing, so the published surface is unchanged until wave 2 lands.

**Files:**
- Create: `packages/sindarian-ui/src/enterprise/index.ts`
- Create: `packages/sindarian-ui/src/theme/index.ts`
- Create: `packages/sindarian-ui/src/toast/index.ts`
- Create: `packages/sindarian-ui/src/charts/index.ts`
- Create: `packages/sindarian-ui/src/domain/index.ts`
- Modify: `packages/sindarian-ui/src/index.tsx`

**Verification:** `npx turbo build --filter=@lerianstudio/sindarian-ui` green; `ls packages/sindarian-ui/dist/{enterprise,theme,toast,charts,domain}` shows compiled stubs.

**Done when:** build green; `git diff` on `src/index.tsx` shows only additions, with the FC-1 block contiguous and in frozen order.

#### Task 1.1.2: Add the frozen wave-2 dependencies

- [ ] Done

**Context:** `packages/sindarian-ui/package.json` carries 14 `@radix-ui/react-*` entries in `dependencies` (bundled, not peer) plus cva/clsx/tailwind-merge. Wave-2 lanes are forbidden from touching this file (index.md § File Ownership), so every dependency they need lands now, per FC-5.

**Implementation vision:** Add to `dependencies`, following the existing caret-version convention: `recharts ^3.8.0`, `@tanstack/react-table ^8.21.3`, `@tanstack/react-virtual ^3.14.3`, and the six radix packages for the missing primitives — `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-toggle-group`, `@radix-ui/react-hover-card` — at the latest versions compatible with the repo's existing `@radix-ui/*` pins (check the installed majors; do not bump any existing entry). The exact ranges this task records in `package.json` become the frozen FC-5 values on merge — wave-2 lanes consume the lockfile and never re-resolve. No peerDependencies changes: the sindarian-x peers the ported code needs (`react-hook-form`, `lucide-react`, `react-day-picker`) are already sindarian-ui peers.

**Files:**
- Modify: `packages/sindarian-ui/package.json`
- Modify: lockfile at repo root (regenerated by install, not hand-edited)

**Verification:** install from repo root succeeds; `npx turbo build check-types --filter=@lerianstudio/sindarian-ui` green.

**Done when:** all FC-5 packages resolve and no existing dependency version changed.

---

### Epic 1.2: Additive design tokens

**Goal:** The FC-2 tokens exist in light and dark with values drawn from the sindarian-ui palette; no existing token changes.
**Scope:** `packages/sindarian-ui/src/globals.css`, one new contract test.
**Dependencies:** none (parallel with Epic 1.1)
**Done when:** FC-2 names present in `:root`, `.dark`, and the `@theme inline` block; contract test green; existing token lines untouched in the diff.
**Status:** Pending

#### Task 1.2.1: Add credit, reconciliation-surface, and chart tokens

- [ ] Done

**Context:** `packages/sindarian-ui/src/globals.css` (~343 lines) defines the full sindarian-ui identity: application tokens, system-state tokens (`--system-success/error/info/alert/purple` with `-border/-surface/-text/-h1a` variants), the sunglow / de-york / vivid-tangerine / cod-gray / shadcn scales, and a Tailwind v4 `@theme inline` mapping. It has NO `--credit`, `--matched-surface`, `--unmatched-surface`, or `--chart-*` tokens. Ported components (domain: MoneyText/Blotter; enterprise: DataTable states; charts: series colors) will consume the FC-2 names.

**Implementation vision:** Append the FC-2 tokens to `:root` and `.dark`, plus `--color-*` (and `--color-chart-1..8`) entries in `@theme inline`. Value decisions, made here once:
- `--credit` / `--credit-foreground`: the ledger-red semantic for credit amounts, DISTINCT from `--destructive` (sindarian-x drew this distinction deliberately). Derive from the palette's red range at AA contrast against `--background` in both themes. `--credit-foreground` MIRRORS `--credit` — the red itself carries the role as text; components pair `bg-credit/10` with `text-credit` rather than painting on-credit text. (Shipped: `--credit: 0 74% 42%` / `--credit-foreground: 0 74% 42%` in `:root`, `0 91% 71%` for both in `.dark`.)
- `--matched-surface` / `--unmatched-surface`: HUE-NEUTRAL matte fills, one step apart on the base grey scale — not green-tinted and red-tinted. The matched/unmatched signal is carried by the bar's leading edge, so a tinted wall would double-encode it. (Shipped: `240 5% 96%` / `240 5% 90%` in `:root`, `240 5% 26%` / `240 5% 34%` in `.dark`.)
- `--chart-1..8`: an 8-slot categorical palette built from the existing brand scales (sunglow, de-york, vivid-tangerine, cod-gray) plus system hues, ordered for maximum adjacent-pair distinction, each AA-distinguishable against `--card` in both themes.
Append-only: no existing line moves or changes. Dark values are explicit (no derivation) — matching how the file already mirrors tokens in `.dark`.

**Files:**
- Modify: `packages/sindarian-ui/src/globals.css`

**Verification:** assert each token by block form: `--<name>:` present in `:root` and `.dark`, and `--color-<name>:` present in `@theme inline` (the contract test in Task 1.2.2 asserts exactly this per block); build green.

**Done when:** every FC-2 name resolves in light and dark and `git diff globals.css` contains only additions.

#### Task 1.2.2: Token contract test

- [ ] Done

**Context:** The senior rule ("existing consumers change nothing") is this migration's core invariant, and globals.css is where wave-2 pressure to violate it will appear ("just tweak this one value"). A cheap tripwire makes the invariant executable.

**Implementation vision:** One Vitest/Jest file (follow the package's existing test-runner config) that reads `src/globals.css` as text and asserts: (a) every FC-2 name appears in `:root`, `.dark`, and `@theme inline`; (b) a fixed list of pre-existing sentinel tokens (`--primary`, `--background`, `--system-success`, `--color-sunglow-500`, `--radius`) still carries its exact current value — copy the five current values into the test as literals. Sentinels, not a full-file hash: a hash would break on any legitimate future edit; sentinels only trip when someone rewrites the identity.

**Files:**
- Create: `packages/sindarian-ui/src/__tests__/tokens-contract.test.ts`

**Verification:** `npx turbo test --filter=@lerianstudio/sindarian-ui` green; mutating a sentinel value locally makes it fail (spot-check, then revert).

**Done when:** test green and it fails on sentinel mutation.

---

### Epic 1.3: Utility exports

**Goal:** `cn` and the typography voice constants are public — the highest-frequency non-component imports in the apps (cockpit imports `cn` 67×; matcher imports `LABEL_VOICE_CLASS` in 29 files).
**Scope:** `packages/sindarian-ui/src/lib/typography.ts` (new), `packages/sindarian-ui/src/index.tsx`.
**Dependencies:** Epic 1.1 (barrel edit lands there first to avoid two tasks writing the same file blind)
**Done when:** `import { cn, LABEL_VOICE_CLASS, SECTION_LABEL_CLASS } from '@lerianstudio/sindarian-ui'` compiles against the built package.
**Status:** Pending

#### Task 1.3.1: Export cn and port the typography voice constants

- [ ] Done

**Context:** `cn` exists at `packages/sindarian-ui/src/lib/utils.ts:4` but is not exported from the barrel. sindarian-x exports `cn` plus `LABEL_VOICE_CLASS` (uppercase label voice) and `SECTION_LABEL_CLASS` from its `lib/typography.ts`; the apps use all three pervasively. Reference source (read-only): `~/repos/lerianstudio/lib-sindarian-ui/src/lib/typography.ts`.

**Implementation vision:** Create `src/lib/typography.ts` with the two constants copied from sindarian-x@0.15.0. They are Tailwind className strings; keep them verbatim unless they reference a token class sindarian-ui lacks — in that case substitute the nearest sindarian-ui token utility and note the substitution in the lane report. Add `export { cn } from './lib/utils'` and `export * from './lib/typography'` to `src/index.tsx`, appended after the FC-1 block. `cn`'s existing implementation is untouched.

**Files:**
- Create: `packages/sindarian-ui/src/lib/typography.ts`
- Modify: `packages/sindarian-ui/src/index.tsx`
- Test: `packages/sindarian-ui/src/__tests__/utility-exports.test.ts` (imports the three symbols from the barrel, asserts types/values)

**Verification:** `npx turbo build test check-types --filter=@lerianstudio/sindarian-ui` green.

**Done when:** the three symbols import cleanly from the package root and the constants match sindarian-x's values (or carry a noted substitution).
