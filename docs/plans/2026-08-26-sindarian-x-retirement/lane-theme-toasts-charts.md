# Sindarian Theme, Toasts and Charts Implementation Plan

> **For implementers:** Use ring-default:executing-plans, ring-default:dispatching-workflows,
> or ring-dev-team:running-dev-cycle. This document is the living source of truth.
> Read `index.md` in this directory FIRST — §§ Frozen Contracts (FC-1..FC-6, incl. the
> executed census and the family rule) and File Ownership bind this lane.

**Goal:** ThemeProvider/useTheme/getThemeScript/ModeToggle (`src/theme/`), successToast/errorToast/warningToast (`src/toast/`), and the shadcn Recharts wrapper family ChartContainer/ChartTooltip/ChartTooltipContent/ChartLegend/ChartLegendContent/ChartConfig (`src/charts/`) exist per FC-3.

**Architecture:** Port from sindarian-x@0.15.0 (read-only reference: `~/repos/lerianstudio/lib-sindarian-ui/src/components/theme/`, `src/hooks/use-toast.ts`, `src/components/ui/chart.tsx`). Theme is a self-contained context (localStorage + `.dark` class + `prefers-color-scheme` + cross-tab sync) — port near-verbatim. Toast helpers REWRAP sindarian-ui's existing toast machinery (`src/hooks/use-toast.ts` in sindarian-ui — read it first; the helpers call ITS `toast()`, none of the legacy singleton store comes along). Charts color via `var(--color-chart-N)` (FC-2 note — NOT the legacy `var(--chart-N)` form). This lane owns only `src/{theme,toast,charts}/**`.

**Tech Stack:** TypeScript 6 strict, React 19, recharts v3 (installed by foundation), Jest/RTL, Storybook.

**Lane:** theme-toasts-charts
**Depends on:** foundation (merged, PR #131)
**Worktree:** `/srv/worktrees/sindarian-theme` on branch `feat/sindarian-theme-toasts-charts`

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | theme + toast helpers + chart wrappers exported, tested, storied; turbo green | 1.1, 1.2, 1.3 | Detailed |

---

### Epic 1.1: Theme system

**Goal:** ThemeProvider, useTheme, getThemeScript, ModeToggle (+ModeToggleLabels/ModeToggleProps types) exported from `src/theme/index.ts`, FC-3 byte-compatible.
**Scope:** `src/theme/**`.
**Dependencies:** none
**Done when:** FC-3 fallback contract tested (no stored value → system preference, pre-paint and hydrated agree); turbo green.
**Status:** Pending

#### Task 1.1.1: Port ThemeProvider, useTheme, getThemeScript

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/theme/{theme-provider.tsx,get-theme-script.ts}`. Contract (index.md FC-3): `{ theme, setTheme, resolvedTheme }`, `defaultTheme` default `'system'`, `storageKey` default `'sindarian.theme'`; getThemeScript's resolution MUST mirror ThemeProvider's (stored value → system preference). Three apps mount it directly (lender/matcher/consignado, storageKeys `lender.theme`/`matcher.theme`/`consignado.theme`); lender and matcher inject getThemeScript via vite.config.

**Implementation vision:** Near-verbatim port: localStorage persistence, `.dark` class on `document.documentElement`, live `prefers-color-scheme` tracking while `'system'`, cross-tab `storage` sync. The FOUC script stays a dependency-free IIFE string. Tests: provider set/resolve/persist; the script string evaluated in a jsdom test agrees with the provider for stored `'dark'`, stored `'light'`, and no-stored-value (system) cases.

**Files:**
- Create: `packages/sindarian-ui/src/theme/{theme-provider.tsx,get-theme-script.ts}` + tests
- Modify: `packages/sindarian-ui/src/theme/index.ts`

**Verification:** `npx turbo build test lint check-types --filter=@lerianstudio/sindarian-ui` green.

**Done when:** FC-3 signatures compile verbatim; fallback-agreement tests pass.

#### Task 1.1.2: Port ModeToggle

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/theme/mode-toggle.tsx` (segmented light/system/dark control, lucide icons). Consumed by consignado, lender, matcher.

**Implementation vision:** Byte-compatible props (ModeToggleLabels/ModeToggleProps). Recompose over sindarian-ui primitives where the legacy used its own (check what it renders — if it used legacy Button/Tooltip, swap for sindarian-ui's).

**Files:**
- Create: `packages/sindarian-ui/src/theme/mode-toggle.tsx` + test + story
- Modify: `packages/sindarian-ui/src/theme/index.ts`

**Verification:** turbo suite green; test clicks through the three modes and asserts useTheme state.

**Done when:** ModeToggle exported and wired to this lane's ThemeProvider.

---

### Epic 1.2: Toast helpers

**Goal:** successToast, errorToast, warningToast exported from `src/toast/index.ts`, layered on sindarian-ui's existing toast machinery. Bare `toast` NOT exported (FC-4 collision).
**Scope:** `src/toast/**`.
**Dependencies:** none
**Done when:** helpers render through sindarian-ui's `<Toaster/>`; turbo green.
**Status:** Pending

#### Task 1.2.1: Implement the three helpers over sindarian-ui's toast

- [ ] Done

**Context:** Legacy signatures: `~/repos/lerianstudio/lib-sindarian-ui/src/hooks/use-toast.ts:160-188` — `successToast(title, description?, opts?)` etc. Target machinery: sindarian-ui's `src/hooks/use-toast.ts` (exports `toast({ title, description, variant })` and `ToastVariant`). Consumers: consignado (successToast/errorToast, also `vi.mock`ed in 7 test files), lender, cockpit (warningToast 50×, successToast).

**Implementation vision:** Each helper is a thin call into sindarian-ui's `toast()` with the mapped variant (check sindarian-ui's ToastVariant values; map success/error/warning onto them — if a warning variant does not exist, use the closest existing variant and record the mapping in the lane report; do NOT add a variant to the existing hook, that file is outside this lane). Signature byte-compatible with legacy (FC-3, exception #2): every legacy `ToastOptions` field is either mapped or covered by an explicit exception test that documents the drop — no silent ignores.

**Files:**
- Create: `packages/sindarian-ui/src/toast/helpers.ts` + test
- Modify: `packages/sindarian-ui/src/toast/index.ts`

**Verification:** turbo suite green; test mounts sindarian-ui `Toaster`, fires each helper, asserts rendered title/description/variant.

**Done when:** three helpers exported; no bare `toast` re-export from `src/toast/`.

---

### Epic 1.3: Chart wrapper family

**Goal:** ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig (type) exported from `src/charts/index.ts` (+ChartStyle as internal dep if the container needs it).
**Scope:** `src/charts/**`.
**Dependencies:** none
**Done when:** a story renders a Recharts chart inside ChartContainer themed by `--color-chart-N` in both themes; turbo green.
**Status:** Pending

#### Task 1.3.1: Port the shadcn chart wrapper

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/ui/chart.tsx` (392 lines, shadcn-style Recharts wrapper). Only cockpit consumes it (7 files). BarChart/LineChart/Donut/Sparkline/presets are NOT ported (census).

**Implementation vision:** Byte-compatible API. Color resolution: replace every `var(--chart-N)` with `var(--color-chart-N)` (FC-2 — raw tokens are HSL triples here). Keep the config-driven CSS variable injection mechanism (ChartStyle) internal. Story: one bar chart with 4 series across chart-1..4, rendered light and dark.

**Files:**
- Create: `packages/sindarian-ui/src/charts/chart.tsx` + test + story
- Modify: `packages/sindarian-ui/src/charts/index.ts`

**Verification:** turbo suite green; story renders with resolved colors (no transparent/invalid series).

**Done when:** six census symbols exported from `src/charts/`.
