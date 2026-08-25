# Sindarian Enterprise Components Implementation Plan

> **For implementers:** Use ring-default:executing-plans, ring-default:dispatching-workflows,
> or ring-dev-team:running-dev-cycle. This document is the living source of truth.
> Read `index.md` in this directory FIRST — §§ Frozen Contracts (FC-1..FC-6, incl. the
> executed census and the family rule) and File Ownership bind this lane.

**Goal:** The 19 census enterprise symbols exist under `src/enterprise/`, restyled to sindarian-ui tokens: AlertBanner(+Tone), AppShell, CursorPager, DataTable(+Props), DateRangePicker(+Value), DetailPanel, EmptyState(+Props), NumberInput, SearchInput, StatCard(+Tone), StatusBadge(+DEFAULT_STATUS_VARIANTS), VirtualizedTable, useIsMobile.

**Architecture:** Port from sindarian-x@0.15.0 (read-only reference: `~/repos/lerianstudio/lib-sindarian-ui/src/components/composed/` and `src/hooks/use-mobile.ts`), API byte-compatible (FC-3), internals re-based on sindarian-ui primitives (senior rule): DataTable renders sindarian-ui `Table`; SearchInput uses sindarian-ui `Input`; AppShell is REBUILT on sindarian-ui's sidebar family (family rule — no legacy `Sidebar*` code comes along). Everything exports ONLY through `src/enterprise/index.ts`; this lane never touches `src/index.tsx`, `package.json`, or `globals.css`.

**Tech Stack:** TypeScript 6 strict, React 19, @tanstack/react-table v8, @tanstack/react-virtual v3 (both installed by foundation), Tailwind v4, Jest/RTL, Storybook.

**Lane:** enterprise
**Depends on:** foundation (merged, PR #131)
**Worktree:** `/srv/worktrees/sindarian-enterprise` on branch `feat/sindarian-enterprise-components`

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | all 19 census symbols exported from src/enterprise, tested, storied; turbo green | 1.1, 1.2, 1.3 | Detailed |

---

### Epic 1.1: Status and display widgets

**Goal:** AlertBanner(+AlertBannerTone), EmptyState(+Props), StatCard(+StatCardTone), StatusBadge(+DEFAULT_STATUS_VARIANTS), DetailPanel exported.
**Scope:** `src/enterprise/{alert-banner,empty-state,stat-card,status-badge,detail-panel}/**`, `src/enterprise/index.ts`.
**Dependencies:** none
**Done when:** symbols exported; tests + stories; turbo suite green.
**Status:** Pending

#### Task 1.1.1: Port the five display widgets

- [ ] Done

**Context:** Legacy sources: `~/repos/lerianstudio/lib-sindarian-ui/src/components/composed/{alert-banner,empty-state,stat-card,status-badge,detail-panel}.tsx`. These are the highest-frequency enterprise imports (AlertBanner used by all four apps; StatusBadge by all four; EmptyState by all four). Tone maps in legacy reference success/warning/info/destructive tokens.

**Implementation vision:** API byte-compatible (FC-3). Tone/variant class maps translate to sindarian-ui tokens per FC-2: success→`system-success*`, warning→`system-alert*`, info→`system-info*`, error/destructive→`system-error*`/`destructive`. Where a legacy widget composes a legacy primitive (e.g. StatusBadge over legacy Badge), recompose over the sindarian-ui equivalent. `DEFAULT_STATUS_VARIANTS` keys stay byte-identical — matcher merges its own map into it. One directory per component under `src/enterprise/`, exported via `src/enterprise/index.ts`; conventions mirrored from sindarian-ui's existing application components (`src/components/`).

**Files:**
- Create: `packages/sindarian-ui/src/enterprise/{alert-banner,empty-state,stat-card,status-badge,detail-panel}/index.tsx` + tests + stories
- Modify: `packages/sindarian-ui/src/enterprise/index.ts`

**Verification:** `npx turbo build test lint check-types --filter=@lerianstudio/sindarian-ui` green.

**Done when:** all five exported with tone rendering asserted in tests (one assertion per tone).

---

### Epic 1.2: Tables, pagination, and inputs

**Goal:** DataTable(+DataTableProps), VirtualizedTable, CursorPager, NumberInput, SearchInput, DateRangePicker(+DateRangeValue), useIsMobile exported.
**Scope:** `src/enterprise/{data-table,virtualized-table,cursor-pager,number-input,search-input,date-range-picker}/**`, `src/enterprise/use-is-mobile.ts`, `src/enterprise/index.ts`.
**Dependencies:** none (parallel with 1.1)
**Done when:** symbols exported; DataTable keyboard/selection/empty/loading behaviors covered by tests; turbo green.
**Status:** Pending

#### Task 1.2.1: Port DataTable and VirtualizedTable

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/composed/{data-table,virtualized-table}.tsx`. Both consume TanStack `ColumnDef<T>`; DataTable adds loading/empty states, row selection, keyboard nav. Cockpit imports DataTable+Props in 57 files — this API is the single most load-bearing enterprise contract; byte-compatibility is mandatory.

**Implementation vision:** DataTable re-renders through sindarian-ui's `Table` family (senior internals); empty state renders the lane's own EmptyState if legacy did so (check legacy; if it did, import from the sibling directory inside this lane — allowed, same lane). VirtualizedTable stays the lean div-based windowed variant. Port the legacy test suites alongside, adapted to the repo's runner.

**Files:**
- Create: `packages/sindarian-ui/src/enterprise/{data-table,virtualized-table}/index.tsx` + tests + stories
- Modify: `packages/sindarian-ui/src/enterprise/index.ts`

**Verification:** turbo suite green; DataTable tests cover: renders rows, empty state, loading state, selection callback, keyboard navigation.

**Done when:** both exported, `DataTableProps<T>` generic identical to legacy.

#### Task 1.2.2: Port CursorPager, NumberInput, SearchInput, DateRangePicker, useIsMobile

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/composed/{cursor-pager,number-input,search-input,date-range-picker}.tsx` (SearchInput lives in `filter-bar.tsx` — extract ONLY SearchInput; FilterBar/FilterChip are not in the census and are not ported), `src/hooks/use-mobile.ts`. NumberInput exports helper fns (`parseRaw`, `isTransientPartial`) — port as internal unless the census lists them (it does not).

**Implementation vision:** Byte-compatible APIs. DateRangePicker composes sindarian-ui `Calendar`+`Popover` (senior internals); its `DateRangeValue` type stays identical (cockpit + matcher pass it around). NumberInput keeps its transient-partial input semantics and their unit tests — numeric input correctness gets the full legacy test suite.

**Files:**
- Create: `packages/sindarian-ui/src/enterprise/{cursor-pager,number-input,search-input,date-range-picker}/index.tsx`, `packages/sindarian-ui/src/enterprise/use-is-mobile.ts` + tests + stories
- Modify: `packages/sindarian-ui/src/enterprise/index.ts`

**Verification:** turbo suite green; NumberInput edge-case tests (partial input, negatives, decimal separators) pass.

**Done when:** all exported per census.

---

### Epic 1.3: AppShell rebuilt on sindarian-ui's sidebar

**Goal:** AppShell exported with the legacy outer prop API, internally composed from sindarian-ui's sidebar family.
**Scope:** `src/enterprise/app-shell/**`, `src/enterprise/index.ts`.
**Dependencies:** none (parallel)
**Done when:** AppShell renders nav/header/content slots against sindarian-ui's SidebarProvider; story shows the assembled shell; turbo green.
**Status:** Pending

#### Task 1.3.1: Rebuild AppShell

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/composed/app-shell.tsx` (AppShellProps at line 40). Family rule (index.md FC-4): NO legacy `Sidebar*` code is ported — the shell recomposes over sindarian-ui's existing sidebar family (read `src/components/ui/sidebar/` first for its actual API). Consumers (consignado's console-shell, lender, matcher) pass nav items/header/children through AppShellProps.

**Implementation vision:** Keep `AppShellProps` byte-compatible (FC-3 outer-props rule). Internals: sindarian-ui `SidebarProvider` + its sidebar parts. Where the legacy shell exposed legacy-sidebar behaviors not present in sindarian-ui's sidebar (collapse persistence, mobile sheet), use what sindarian-ui's sidebar offers and list every behavioral difference in the lane report — the app lanes need that list.

**Files:**
- Create: `packages/sindarian-ui/src/enterprise/app-shell/index.tsx` + test + story
- Modify: `packages/sindarian-ui/src/enterprise/index.ts`

**Verification:** turbo suite green; story renders shell with nav + content in both themes.

**Done when:** AppShell exported, prop-compatible, behavioral deltas documented in the lane report.
