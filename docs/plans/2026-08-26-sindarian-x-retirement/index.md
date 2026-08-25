# Sindarian-X Retirement — Lane Plan Index

> **For implementers:** this index is not executable. Every lane below has (or will
> have, when its wave is elaborated) its own plan document, run from its own
> worktree by ring-default:executing-plans,
> ring-default:dispatching-workflows, or ring-dev-team:running-dev-cycle. One lane per session.
> Read `## Frozen Contracts` before writing any code — a lane MUST NOT change one.

**Goal:** Retire `@lerianstudio/sindarian-x` (repo `lib-sindarian-ui`) completely: absorb its used surface into `@lerianstudio/sindarian-ui` additively, then migrate lender, matcher, br-consignado-gw, and the br-sfn cockpit onto sindarian-ui and its design tokens.

**Architecture:** sindarian-ui is SENIOR (decided by Fred, 2026-08-26): existing sindarian-ui consumers change absolutely nothing — every lib change is additive (new exports, new tokens; no existing export, prop, or token value changes). On any name collision, sindarian-ui's API wins and the migrating apps adapt. The four apps abandon the sindarian-x per-app `--brand` knob and adopt sindarian-ui's visual identity. Port scope is the UNION OF SYMBOLS THE FOUR APPS ACTUALLY USE (census method below), plus internal dependencies of those symbols — the rest of sindarian-x dies with the repo. `@lerianstudio/sindarian-tokens` stays OUT of this migration (wiring it into sindarian-ui would change existing consumers' pixels, violating the senior rule).

**Tech Stack:** TypeScript, React 19, Tailwind v4 (CSS-first), Radix UI/ShadCN, tsc + tsc-alias, Turbo, semantic-release (develop → beta prereleases). Consumers: Vite + TanStack Router SPAs.

## Lane Overview

| Lane | Delivers | Depends on | Wave | Worktree / Branch | Plan | Status |
|------|----------|-----------|------|-------------------|------|--------|
| foundation | sub-barrel scaffold, deps, additive tokens, `cn`/typography exports in sindarian-ui | none | 1 | `/srv/worktrees/sindarian-foundation` / `feat/sindarian-enterprise-foundation` | lane-foundation.md | Merged (PR #131) |
| primitives | missing shadcn primitives (Accordion, AlertDialog, RadioGroup, ScrollArea, ToggleGroup, HoverCard, FileUpload) | foundation | 2 | `/srv/worktrees/sindarian-primitives` / `feat/sindarian-missing-primitives` | lane-primitives.md | In review (PR #134) |
| enterprise | composed enterprise components (AlertBanner, StatCard, DataTable, AppShell, …) restyled to sindarian-ui tokens | foundation | 2 | `/srv/worktrees/sindarian-enterprise` / `feat/sindarian-enterprise-components` | lane-enterprise.md | In review (PR #136) |
| theme-toasts-charts | ThemeProvider/getThemeScript/ModeToggle, toast helper API, chart layer | foundation | 2 | `/srv/worktrees/sindarian-theme` / `feat/sindarian-theme-toasts-charts` | lane-theme-toasts-charts.md | In review (PR #133) |
| domain | finance domain grammar (money-math, MoneyText, KeyId, Blotter, LedgerSheet, format, used composites) | foundation | 2 | `/srv/worktrees/sindarian-domain` / `feat/sindarian-domain-grammar` | lane-domain.md | In review (PR #135) |
| lib-integration | integration lane: combined verification, absence checks, beta release, scratch-app smoke test | primitives, enterprise, theme-toasts-charts, domain | 3 | `/srv/worktrees/sindarian-integration` / `test/sindarian-enterprise-integration` | lane-lib-integration.md (deferred) | Pending |
| app-consignado | br-consignado-gw UI on sindarian-ui, sindarian-x removed | lib-integration | 4 | `/srv/worktrees/sindarian-app-consignado` (repo br-consignado-gw) / `feat/migrate-to-sindarian-ui` | lane-app-consignado.md (deferred) | Pending |
| app-matcher | matcher UI on sindarian-ui, sindarian-x removed | lib-integration | 4 | `/srv/worktrees/sindarian-app-matcher` (repo matcher) / `feat/migrate-to-sindarian-ui` | lane-app-matcher.md (deferred) | Pending |
| app-lender | lender UI on sindarian-ui, sindarian-x removed | lib-integration | 4 | `/srv/worktrees/sindarian-app-lender` (repo lender) / `feat/migrate-to-sindarian-ui` | lane-app-lender.md (deferred) | Pending |
| app-cockpit | br-sfn cockpit on sindarian-ui, sindarian-x removed, local theme fork deleted | lib-integration | 4 | `/srv/worktrees/sindarian-app-cockpit` (repo br-sfn) / `feat/migrate-to-sindarian-ui` | lane-app-cockpit.md (deferred) | Pending |
| retirement | npm deprecation of sindarian-x, repo archive, cross-repo absence verification | app-consignado, app-matcher, app-lender, app-cockpit | 5 | `/srv/worktrees/sindarian-retirement-final` / `chore/retire-sindarian-x` | lane-retirement.md (deferred) | Pending |

`Status` lifecycle: Pending → In flight → In review → Merged | Failed.
The orchestrator session owns this column. Lanes never write to this file.

**Mordor note:** worktrees are created with `agent new <repo> <slug>` (never edit the durable clones under `~/repos/lerianstudio/`). The `agent` command starts on an `agent/<slug>` branch; each lane MUST create its real branch (the one in its row above) off the correct base before committing — `agent/*` branches are never pushed. App-lane plan documents live in this directory and are SEEDED (copied) into the app-repo worktree at dispatch time.

**Base branches:** console-sdk lanes branch from and PR to `develop` (semantic-release publishes beta prereleases from it). App lanes use each repo's default PR base (verify per repo at elaboration; Lerian default is `develop`).

## Waves

- Wave 1 — `foundation` alone. It owns the three files every other console-sdk lane would otherwise fight over (`package.json`, `globals.css`, `src/index.tsx`).
- Wave 2 — `primitives`, `enterprise`, `theme-toasts-charts`, `domain` start together after foundation merges. File-disjoint by construction (see File Ownership).
- Wave 3 — `lib-integration` opens after all wave-2 lanes merge. Its merge triggers the beta release apps will consume.
- Wave 4 — `app-consignado`, `app-matcher`, `app-lender`, `app-cockpit` start together after the beta from wave 3 is published. Different repos, trivially disjoint. API gaps found by any app lane feed patch PRs to console-sdk `develop` (orchestrator coordinates; app lanes do not edit console-sdk).
- Wave 5 — `retirement` opens after all four app lanes merge.

## File Ownership (wave 2, console-sdk)

| Lane | Owns (exclusive) |
|------|-------------------|
| primitives | `packages/sindarian-ui/src/components/ui/{accordion,alert-dialog,radio-group,scroll-area,toggle-group,hover-card,file-upload}/**`, `packages/sindarian-ui/src/components/form/{textarea-field,radio-group-field,file-upload-field}/**`, AND `packages/sindarian-ui/src/index.tsx` |
| enterprise | `packages/sindarian-ui/src/enterprise/**` |
| theme-toasts-charts | `packages/sindarian-ui/src/theme/**`, `packages/sindarian-ui/src/toast/**`, `packages/sindarian-ui/src/charts/**` |
| domain | `packages/sindarian-ui/src/domain/**` |

`primitives` is the ONLY wave-2 lane allowed to touch `src/index.tsx` (its new primitives export from the main barrel). The other three lanes export exclusively through their sub-barrels, which foundation wired into the main barrel in wave 1. NO wave-2 lane touches `package.json` or `globals.css` — foundation owns both; a missing dep or token means stop and report to the orchestrator, never a local edit.

## Frozen Contracts

### FC-1 — Main barrel wiring (written by foundation, then owned by primitives)

Appended verbatim at the end of `packages/sindarian-ui/src/index.tsx`:

```ts
// Enterprise surface (sindarian-x absorption — see docs/plans/2026-08-26-sindarian-x-retirement/)
export * from './enterprise'
export * from './theme'
export * from './toast'
export * from './charts'
export * from './domain'
```

### FC-2 — New design tokens (names frozen; values chosen by foundation from the sindarian-ui palette)

Added to `packages/sindarian-ui/src/globals.css` in `:root` AND `.dark`, each with a matching `--color-*` entry in the `@theme inline` block:

```css
--credit
--credit-foreground
--matched-surface
--unmatched-surface
--chart-1  --chart-2  --chart-3  --chart-4
--chart-5  --chart-6  --chart-7  --chart-8
```

Semantic-state tokens are NOT duplicated: ported components map sindarian-x's `success`/`warning`/`info`/`destructive` usages onto sindarian-ui's existing `system-success` / `system-alert` / `system-info` / `system-error` / `destructive` tokens. No existing sindarian-ui token changes name or value — ever (senior rule).

Landed by foundation (PR #131) — binding on porting lanes:
- Raw tokens are HSL TRIPLES (house convention), wrapped by `hsl()` only in `@theme inline`. Code that resolves colors directly MUST use `var(--color-chart-N)` / `var(--color-credit)` etc., never `var(--chart-N)` — sindarian-x's charts used the raw form and need this one-token rename (allowed by FC-3 (b)).
- `--matched-surface`/`--unmatched-surface` are hue-NEUTRAL matte fills (as in sindarian-x's actual values), not success/error tints: the matched/unmatched signal is carried by the bar edge, not the wall.
- `--credit-foreground` MIRRORS `--credit` (legacy contract: the red itself carries the role as text; components use `bg-credit/10` + `text-credit`, never solid bg + foreground text).

### FC-3 — Legacy-API compatibility (freeze-by-reference)

Every symbol ported from sindarian-x keeps the public TypeScript API published in `@lerianstudio/sindarian-x@0.15.0` (`dist/**/*.d.ts` — an immutable npm artifact): same export name, same props/signature, same generics. Only two deviations are allowed: (a) styling re-based on sindarian-ui tokens, (b) internal imports re-pointed at sindarian-ui primitives. A porting lane that cannot keep an API byte-compatible stops and reports — it does not improvise a new API.

**FC-3 explicit exceptions** (amended by the orchestrator, 2026-08-26 — these three, and ONLY these, deviate from byte-compatibility):
1. The three net-new form fields (`TextareaField`, `RadioGroupField`, `FileUploadField`) follow sindarian-ui's OWN field-family conventions (mirror its `InputField`), NOT the legacy props — one coherent field family beats two prop dialects. The primitives lane publishes a legacy→new prop-mapping table in its report; app lanes adapt the ~17 affected call sites (lender ~16, consignado 1).
2. Toast helpers: every legacy `ToastOptions` field is either mapped onto sindarian-ui's toast or covered by an explicit exception test that documents the drop — no silent ignores. The warning mapping (legacy `warningToast` → a concrete sindarian-ui variant) is chosen by the lane from sindarian-ui's actual `ToastVariant` values and frozen in its report.
3. `AppShell` is byte-compatible on OUTER props only; internals are sindarian-ui's sidebar (family rule).

Key signatures reproduced for cross-lane reliance (theme + toast, consumed by app lanes and by enterprise components):

```ts
// theme (lane theme-toasts-charts)
type ThemePreference = 'light' | 'dark' | 'system'
function ThemeProvider(props: {
  children: React.ReactNode
  defaultTheme?: ThemePreference   // default 'system' (byte-compatible with sindarian-x@0.15.0)
  storageKey?: string              // default 'sindarian.theme'
}): JSX.Element
function useTheme(): { theme: ThemePreference; setTheme(t: ThemePreference): void; resolvedTheme: 'light' | 'dark' }
function getThemeScript(storageKey?: string): string   // pre-hydration FOUC guard, inline <script> body
function ModeToggle(props: ModeToggleProps): JSX.Element

// Fallback contract (tested by lane theme-toasts-charts, 30-case parity matrix):
// getThemeScript(storageKey?, defaultTheme? = 'system') — the script resolves stored
// dark/light/system exactly like ThemeProvider, and falls back to defaultTheme for
// absent/corrupted values. A dark-by-default app (app-cockpit) passes
// getThemeScript('cockpit.theme', 'dark') + <ThemeProvider defaultTheme="dark">, and
// REMOVES any static class="dark" from <html> (a static class would wrongly paint dark
// for a user who explicitly stored "light").

// toast (lane theme-toasts-charts) — module-scoped helpers over sindarian-ui's EXISTING
// toast machinery (src/hooks/use-toast.ts). The bare `toast` symbol is NOT ported:
// sindarian-ui already exports `toast` from the barrel (FC-4 collision) — apps adapt
// their bare toast(...) call sites to sindarian-ui's toast({ title, description, variant }).
function successToast(title: string, description?: string, opts?: Partial<ToastOptions>): void
function errorToast(title: string, description?: string, opts?: Partial<ToastOptions>): void
function warningToast(title: string, description?: string, opts?: Partial<ToastOptions>): void
```

(Exact `ModeToggleProps`/`ToastOptions` shapes: byte-compatible with sindarian-x@0.15.0 `dist` types.)

### FC-4 — Collision rule (sindarian-ui senior)

A symbol name already exported by `@lerianstudio/sindarian-ui@1.2.0` is NEVER ported, renamed, aliased, or shadowed. The migrating apps adapt their call sites to sindarian-ui's existing API. Known collisions from the sweep (apps must adapt to the sindarian-ui version): `Button`, `Badge`, `Card*`, `Dialog*`, `Sheet*`, `Tabs*`, `Input`, `Label`, `Textarea`, `Select*`, `Checkbox`, `Command*`, `Popover*`, `Tooltip*`, `Separator`, `Skeleton`, `Calendar`, `Collapsible`, `Progress`, `Switch`, `Avatar`, `Alert`, `Breadcrumb*`, `Sidebar*`, `Form*`, `Table*`, `Stepper*`, `PageHeader`, `EntityBox*`, `Toaster`, `useToast`, `toast`, `InputField`, `SelectField`, `SwitchField`, `DatePickerField`, `DateRangeField`, and `ConfirmDialog` → sindarian-ui's `ConfirmationDialog`. Porting lanes MUST check every candidate export against the sindarian-ui barrel before creating it; the integration lane re-verifies no duplicate export names exist.

**Family rule (added after the FC-6 census):** when a component FAMILY partially collides (some subpart names exist in sindarian-ui, others do not), the WHOLE family follows sindarian-ui and NONE of its subparts is ported — a barrel where `SidebarContent` resolves to one sidebar system and `SidebarMenu` to another is incoherent. Applies to: `Sidebar*` (incl. `SidebarMenu*`, `SidebarTrigger`, `SidebarInset`, `useSidebar`), `EntityBox*`, `Stepper*`, and the Radix `Toast*` primitives (`ToastClose/Description/Provider/Title/Viewport` — matcher adapts to sindarian-ui's toast system). Apps adapt these families wholesale. `AppShell` IS ported (novel name) but REBUILT internally on sindarian-ui's sidebar family — FC-3 byte-compatibility applies to its outer props only.

### FC-5 — Dependencies (written by foundation; frozen for wave 2)

Foundation adds to `packages/sindarian-ui/package.json` `dependencies` — wave-2 lanes rely on exactly these and add nothing:

```
recharts ^3.8.0
@tanstack/react-table ^8.21.3
@tanstack/react-virtual ^3.14.3
@radix-ui/react-accordion, @radix-ui/react-alert-dialog, @radix-ui/react-radio-group,
@radix-ui/react-scroll-area, @radix-ui/react-toggle-group, @radix-ui/react-hover-card
(radix pins: caret versions consistent with the existing @radix-ui/* entries)
```

Determinism: the exact ranges foundation records in the merged `package.json` (and the
lockfile) ARE the frozen values from that point on — wave-2 lanes consume the lockfile
and never re-resolve or edit dependency versions.

### FC-6 — Port-scope census (method frozen)

"Used symbol" = any identifier named in an import from `@lerianstudio/sindarian-x` OR from a local shim file that re-exports it (`export * from '@lerianstudio/sindarian-x'` — matcher has 35 shims, br-consignado-gw has 19), across the four app source trees AND their root-level configuration files (`vite.config.ts` and siblings import `getThemeScript` in lender and matcher). Read-only, in the durable clones:

```
~/repos/lerianstudio/br-consignado-gw/ui/{src,*.ts,*.tsx,*.mjs}
~/repos/lerianstudio/matcher/ui/{src,*.ts,*.tsx,*.mjs}
~/repos/lerianstudio/lender/ui/{src,*.ts,*.tsx,*.mjs}
~/repos/lerianstudio/br-sfn/cockpit/{src,e2e,scripts,*.ts,*.tsx,*.mjs}
```

Each porting lane computes the census slice for its category as its first task and ports ONLY that union (plus internal dependencies). Symbols outside the union are not ported.

### FC-6 census — EXECUTED 2026-08-26 (frozen port scope)

Union across the four apps: 216 distinct symbols; 107 are FC-4 collisions (apps adapt); 3 utils already landed in foundation. Counting rule: type-only exports COUNT as symbols (consistent throughout). Reconciliation of the 109 non-collision symbols: 84 port from the census lists below + 20 become app-side adaptations under the family rule (`Sidebar*` 11, `EntityBox*` 3, Radix `Toast*` 5, `ConfirmDialog` 1) + 2 were census false positives (`Action`/`useAction`) + 3 utils = 109. The port lists additionally export 3 plan-added internal-dependency symbols not in the raw census (`useTheme`, `ModeToggleLabels`, `ModeToggleProps`), so total new exports = 87. The frozen per-lane port lists (`T` = type-only; letters = apps c/m/l/k):

**primitives (26):** Accordion m, AccordionContent m, AccordionItem m, AccordionTrigger m, AlertDialog km, AlertDialogAction km, AlertDialogCancel k, AlertDialogContent km, AlertDialogDescription km, AlertDialogFooter km, AlertDialogHeader km, AlertDialogTitle km, HoverCard k, HoverCardContent k, HoverCardTrigger k, RadioGroup k, RadioGroupItem k, ScrollArea klm (+ScrollBar as internal dep), ToggleGroup k, ToggleGroupItem k, FileUpload k, FileUploadResult k T, validateFile l, FileUploadField c, RadioGroupField l, TextareaField l.

**enterprise (19):** AlertBanner cklm, AlertBannerTone cm T, AppShell clm (rebuilt on sindarian-ui sidebar, family rule), CursorPager lm, DataTable klm, DataTableProps km T, DateRangePicker km, DateRangeValue km T, DetailPanel lm, EmptyState cklm, EmptyStateProps m T, NumberInput m, SearchInput l, StatCard cl, StatCardTone c T, StatusBadge cklm, DEFAULT_STATUS_VARIANTS m, VirtualizedTable m, useIsMobile k.
NOT ported (family rule): every `Sidebar*`/`useSidebar`, `EntityBox*` subpart, `Stepper*` subpart, Radix `Toast*`. NOT ported (FC-4): ConfirmDialog (apps adapt to `ConfirmationDialog`).

**theme-toasts-charts (15):** ThemeProvider clm, useTheme (plan-added, exported), getThemeScript lm, ModeToggle clm, ModeToggleLabels + ModeToggleProps T (plan-added), successToast ckl, errorToast cl, warningToast k, ChartConfig k T, ChartContainer k, ChartLegend k, ChartLegendContent k, ChartTooltip k, ChartTooltipContent k (+ChartStyle as internal dep).
NOT ported (YAGNI, absent from census): BarChart, LineChart, Donut, Sparkline, chart presets. NOT ported (collision): bare `toast`.

**domain (27):** Blotter lm, BlotterRow lm, DelinquencyAging l, FIGURE_CLASS m, Figure klm, FigureSize m T, FigureTone m T, GaugeThresholds m T, KeyId l, LedgerPanel lm, LedgerSheet clm, MoneyText klm, MoneyTextProps lm T, NO_VALUE lm, SectionLabel klm, StatusRail m, StatusRailChip m T, StatusRailItem m T, Dot m, LivePulse m, ThresholdGauge m, formatCount klm, formatPercent klm, gaugeBand m, humanizeDurationMs m, moneyDiff m, toPercentValue m.
NOT ported (YAGNI, absent from census): public money-math (`toMinor`, `Amount`, …), Comprovante, MatchPair, and every other domain composite not listed — MoneyText's internal money handling ports as internal, unexported code.

Census erratum: `Action`/`useAction` reported for cockpit were false positives (local `@/components/actions/` module, not lib imports). `Dot`/`LivePulse` are StatusRail family → domain. `FigureTone` is a matcher-LOCAL type (its own figure.tsx wrapper), not a lib export — nothing to port; the domain lane ships 26 of the 27 listed symbols.

## Integration Lane

`lib-integration` (wave 3) is the required integration lane — four lanes touch the same package:

- Full monorepo verification: `npx turbo build lint check-types test`.
- Duplicate-export check across the merged barrel (FC-4 re-verification).
- Absence checks deferred under lane-cut rule 4: no `sindarian-x` string in package code, manifests, or config (planning documents under `docs/plans/` are excluded — they reference the name intentionally), no TODO/placeholder left by porting lanes, every FC-2 token present in built CSS.
- Scratch Vite consumer: install the fresh beta, compile a file importing every new export, mount ThemeProvider + Toaster + one chart + DataTable, render smoke-test.
- Confirms semantic-release published the beta from `develop` and records the exact version the app lanes must pin.
- Follow-ups inherited from wave 2 (single-owner window, so these edits are safe here): (a) add a `warning` variant ADDITIVELY to `src/hooks/use-toast.ts` + Toaster style map, and remap `warningToast` → `warning` in `src/toast/helpers.ts` (217 cockpit call sites deserve a real warning tone); (b) fix the pre-existing tsconfig quirk where `**/*.test.tsx` (unlike `.test.ts`) compiles into `dist` and ships; (c) move the three new form-field exports into `src/components/form/index.ts` per package convention; (d) hoist the per-file `ResizeObserver` jsdom stub into the shared jest setup; (e) re-point StatCard's inlined panel/figure markup at the merged domain primitives (it was inlined to respect wave-2 file disjointness) and its inline-SVG trend stays (sparkline was not ported); (f) add `../src/{enterprise,theme,toast,charts,domain}/**` to `.storybook/main.ts` story globs — the wave-2 stories are invisible to Storybook until then.

**Wave-2 API deltas the app lanes MUST handle** (from lane reports, binding):
- StatusBadge variant VALUES remap: `muted`→`inactive`, `warning`→`alert` (keys byte-identical). matcher and lender merge custom `variantMap`s and will get type errors until adjusted.
- AppShell (rebuilt on sindarian-ui's sidebar): no mobile off-canvas sheet (sidebar narrows 244→72px instead); collapse persistence moved cookie→localStorage (`sidebar-collapsed`); `variant="inset"` gone; header takes `SidebarExpandButton`, not `SidebarTrigger`.
- Form fields (FC-3 exception #1): prop-mapping table in the primitives lane report; `Control<T>` is now generic, which makes lender's two `loose-control.ts` casts unnecessary — delete them.
- Toast: `errorCode` opt is accepted but not rendered — consignado's `error-toast.ts` folds the code into `description`.
- Buttons: legacy `variant="ghost"`/`size="sm"`/`size="icon"` don't exist — `variant="plain"`, `size="small"`, `IconButton`.

## Merge Order

1. `foundation` → console-sdk `develop`.
2. Wave-2 lanes in any order; after each merge, still-open wave-2 lanes rebase onto updated `develop`.
3. `lib-integration` → `develop` → beta `@lerianstudio/sindarian-ui@1.3.0-beta.x` published; orchestrator records the version in this index.
4. App lanes in any order, each to its own repo's base branch. A lib gap found here becomes a patch PR to console-sdk `develop` (new beta), never an app-side fork of lib code.
5. `retirement` last. Promoting console-sdk `develop` → `main` (stable 1.3.0) happens here, before the npm deprecation of sindarian-x.

---

## Lane blocks (later waves — plans authored when their blockers merge)

### Lane: primitives

**Goal:** The shadcn primitives sindarian-ui lacks and the apps use exist in sindarian-ui: `Accordion*`, `AlertDialog*`, `RadioGroup*`, `ScrollArea`/`ScrollBar`, `ToggleGroup*`, `HoverCard*`, `FileUpload` + `validateFile` + its types.
**Scope:** `packages/sindarian-ui/src/components/ui/{accordion,alert-dialog,radio-group,scroll-area,toggle-group,hover-card,file-upload}/**`, `packages/sindarian-ui/src/index.tsx`. Each component: sindarian-x API (FC-3), sindarian-ui styling conventions (cva, data-slot, tokens), test + Storybook story per repo convention.
**Depends on:** foundation
**Done when:** census-listed primitive symbols exported from the main barrel; build/lint/test green; stories render in both themes.
**Status:** Pending

### Lane: enterprise

**Goal:** The composed enterprise layer exists under `src/enterprise/`, restyled to sindarian-ui tokens, API per FC-3 — exactly the 19 symbols in the FC-6 census enterprise list (AlertBanner, AppShell, CursorPager, DataTable, DateRangePicker, DetailPanel, EmptyState, NumberInput, SearchInput, StatCard, StatusBadge, VirtualizedTable, useIsMobile, plus their frozen types). FilterBar/FilterChip, MoneyInput, Combobox/MultiSelectCombobox are NOT in the census union and are not ported.
**Scope:** `packages/sindarian-ui/src/enterprise/**` only. Internally consumes sindarian-ui primitives (senior) — e.g. DataTable renders sindarian-ui `Table`.
**Depends on:** foundation
**Done when:** census union for this category exported from `src/enterprise/index.ts`; tests + stories; no FC-4 collision.
**Status:** Pending

### Lane: theme-toasts-charts

**Goal:** Theme, toast helpers, and the chart wrapper exist per FC-3 signatures: `ThemeProvider`/`useTheme`/`getThemeScript`/`ModeToggle` (`src/theme/`); `successToast`/`errorToast`/`warningToast` layered over sindarian-ui's existing toast machinery (`src/toast/`; bare `toast` is an FC-4 collision and is NOT ported); the shadcn Recharts wrapper family `ChartContainer`/`ChartTooltip`/`ChartTooltipContent`/`ChartLegend`/`ChartLegendContent`/`ChartConfig` (`src/charts/`), colored by the FC-2 tokens via `var(--color-chart-N)`. BarChart/LineChart/Donut/Sparkline/presets are NOT in the census union and are not ported.
**Scope:** `packages/sindarian-ui/src/{theme,toast,charts}/**` only.
**Depends on:** foundation
**Done when:** FC-3 theme/toast signatures compile against app-like usage samples; charts render in both themes; toasts route through sindarian-ui's Toaster without touching its existing API.
**Status:** Pending

### Lane: domain

**Goal:** The finance domain grammar the apps use exists under `src/domain/` — exactly the 27 symbols in the FC-6 census domain list: format helpers (`NO_VALUE`, `formatPercent`, `formatCount`, `humanizeDurationMs`, `toPercentValue`), `MoneyText`, `Figure` (+`FIGURE_CLASS`/tones), `KeyId`, `SectionLabel`, `Blotter`/`BlotterRow`, `LedgerSheet`/`LedgerPanel`, `StatusRail`/`Dot`/`LivePulse` (+types), `ThresholdGauge`/`gaugeBand`/`GaugeThresholds`, `DelinquencyAging`, `moneyDiff`. Money-handling internals port as unexported code with their tests (correctness is non-negotiable); the public money-math API is not in the census and is not exported.
**Scope:** `packages/sindarian-ui/src/domain/**` only.
**Depends on:** foundation
**Done when:** census union for this category exported from `src/domain/index.ts`; money-math test suite ported and green; pt-BR strings in composites preserved as-is (apps that need other locales adapt at app level, as today).
**Status:** Pending

### Lane: lib-integration

**Goal:** The merged sindarian-ui verifies end to end and a consumable beta exists.
**Scope:** integration checks (see Integration Lane above), scratch consumer app (throwaway, not committed to the monorepo), release confirmation.
**Depends on:** primitives, enterprise, theme-toasts-charts, domain
**Done when:** turbo green across the monorepo; absence + duplicate-export checks pass; beta version published and recorded in this index.
**Status:** Pending

### Lane: app-consignado

**Goal:** br-consignado-gw UI runs on `@lerianstudio/sindarian-ui` (pinned beta); `@lerianstudio/sindarian-x` removed from package.json.
**Scope:** repo br-consignado-gw, `ui/**`. Smallest app (36 files touch the lib, 19 are 4-line shims, 21 named symbols). Work: swap dep; delete shims and import directly from sindarian-ui; adapt collided call sites (FC-4 — e.g. InputField, PageHeader props); keep `ThemeProvider storageKey="consignado.theme"` (FC-3 API is compatible); delete the `--brand` override in `ui/src/styles.css` and re-point CSS imports to sindarian-ui's stylesheet; update the `@source` scan path; fix tests (7 files mock the lib by name).
**Depends on:** lib-integration
**Done when:** app builds, tests green, no `sindarian-x` reference in the repo, visual pass on the 7 pages in both themes.
**Status:** Pending

### Lane: app-matcher

**Goal:** matcher UI runs on sindarian-ui; sindarian-x removed.
**Scope:** repo matcher, `ui/**`. 87 import files + 35 shims, 44 symbols (`LABEL_VOICE_CLASS` in 29 files). Work: swap dep; delete/repoint shims; adapt collided call sites; keep the deliberate local forks that extend lib components (`money-text.tsx` tone, `figure.tsx` tone, local `status-badge.tsx`, local `mini-balance-bar.tsx`) by re-pointing their base imports; replace `getThemeScript` FOUC plugin import in `vite.config.ts`; keep `storageKey="matcher.theme"`; delete the `--brand` override; re-point `--color-matched-surface`/`--color-unmatched-surface` usages to the FC-2 tokens; update stale `DESIGN.md`.
**Depends on:** lib-integration
**Done when:** app builds, tests green, no `sindarian-x` reference, visual pass on key flows in both themes.
**Status:** Pending

### Lane: app-lender

**Goal:** lender UI runs on sindarian-ui; sindarian-x removed.
**Scope:** repo lender, `ui/**`. 79 files, ~90 symbols, heavy on `Table*` (ledger variant), `Button`, `AlertBanner`, `KeyId`, form fields, `Blotter`/`Figure`/`SectionLabel`. Work: swap dep; adapt collided call sites (form fields and Table are the big ones — sindarian-ui's `Table` has no `variant="ledger"`; the lane resolves the ledger-table treatment app-side or via a lib patch PR, orchestrator decides on first evidence); re-point the ~10 local wrappers (7 status badges, `key-id-link.tsx`, 2 `loose-control.ts`, `format.tsx` MoneyText wrapper); keep `storageKey="lender.theme"` + FOUC plugin swap in `vite.config.ts`; delete `--brand`/`--brand-resolved` overrides; update `DESIGN.md`.
**Depends on:** lib-integration
**Done when:** app builds, tests green (58 test files), no `sindarian-x` reference, visual pass in both themes.
**Status:** Pending

### Lane: app-cockpit

**Goal:** br-sfn cockpit runs on sindarian-ui; sindarian-x removed; the local theme fork deleted in favor of the lib's ThemeProvider.
**Scope:** repo br-sfn, `cockpit/**`. Largest lane: 348 files import the lib (141 symbols, 1644 occurrences), 28 more test files mock it. Work: swap dep (pinned exact today, 0.14.1); mass-adapt collided call sites (`Button` 180×, `PageHeader` 84×, `Badge` 70×, `cn` 67×, `DataTable` 57×...); DELETE the forked theme layer (`src/lib/theme/**`) and adopt the lib theme: `<ThemeProvider defaultTheme="dark" storageKey="cockpit.theme">` + inject `getThemeScript('cockpit.theme', 'dark')` pre-paint, and REMOVE the static `class="dark"` from `index.html` (the script now handles dark-by-default correctly, including a user-stored "light"); rebuild `ThemeToggle.tsx` on lib pieces while preserving the app-local density feature; keep documented divergences (`SilocMoney`, `SlcStateBadge`, `RecordStatusBadge`) as local wrappers re-pointed to sindarian-ui; update `index.css` imports + `@source`; codemod-first strategy (import rewrites are mechanical; prop adaptations are not).
**Depends on:** lib-integration
**Done when:** app builds, full test suite green (~590 test files), no `sindarian-x` reference, visual pass on SPI/SPB/SLC/SILOC/STA surfaces in both themes.
**Status:** Pending

### Lane: retirement

**Goal:** sindarian-x is dead: npm package deprecated, repo archived, no live consumer.
**Scope:** cross-repo verification (read-only grep for `sindarian-x` across the four app repos and console-sdk — manifests, lockfiles, source, config, and tests; planning documents under `docs/plans/` are excluded since they reference the name intentionally); promote console-sdk `develop` → `main` (stable release) so apps can move off the beta pin; `npm deprecate @lerianstudio/sindarian-x` (all versions, message pointing to `@lerianstudio/sindarian-ui`); archive `LerianStudio/lib-sindarian-ui` on GitHub. NOTE: npm deprecate and GitHub archive need owner/admin rights — surfaced to Fred as explicit actions if the lane's credentials cannot perform them.
**Depends on:** app-consignado, app-matcher, app-lender, app-cockpit
**Done when:** deprecation live on npm, repo archived, absence checks pass, apps pin a stable (non-beta) sindarian-ui.
**Status:** Pending
