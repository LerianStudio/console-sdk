# DatePicker & Calendar Design Upgrade — Implementation Plan

> **For implementers:** Use ring:executing-plans (rolling wave: implement the
> detailed phase -> user checkpoint -> detail the next phase -> implement -> repeat),
> or ring:running-dev-cycle-frontend for the full subagent-orchestrated workflow.
> This document is the living source of truth — task elaboration for later
> phases is written back into it during execution.

**Goal:** Update the Calendar primitive styling to match the Lerian DS Figma spec, create a new TimePicker UI primitive, and migrate the DateTimePickerField from product-console into sindarian-ui — all following sindarian-ui component standards.

**Architecture:** The Calendar primitive gets cell sizing and spacing adjustments. A new `TimePicker` primitive is created as a scrollable dual-column (hour/minute) selector, migrated from product-console's `TimeScrollList` and adapted to sindarian-ui conventions. A new `DateTimePickerField` form component is migrated from product-console's `DateTimeScrollPickerField`, composing Calendar + vertical divider + TimePicker inside a Popover. The existing `DatePickerField` (date-only) keeps its structure but benefits from the Calendar styling updates.

**Tech Stack:** React 19, react-day-picker ^9.13, dayjs, react-hook-form, Radix Popover, Tailwind CSS 4, lucide-react, class-variance-authority

## Source References

### Figma Design (node 3111-2214, component set 3024:64320 "DatePicker")

**Trigger** (all states): Row layout, calendar icon (16x16) + text, padding `0 14px 0 10px`, gap 8px, height 36px, border-radius 6px, Inter Medium 14/20.

| State | Border | Fill | Text |
|-------|--------|------|------|
| default | `#E4E4E7` 1px | white | placeholder `#71717A` "Selecionar data e hora..." |
| filled | `#E4E4E7` 1px | white | value `#3F3F46` "abr 16, 2026 10:03" |
| error | `#EF4444` 1px | white | placeholder `#71717A` |
| disabled | `#E4E4E7` 1px | `#E4E4E7` | placeholder, opacity 0.5 |
| open | `#FEED02` 2px | white | value `#3F3F46` |

**Popover (open state):** Row layout — `calendar | 1px divider | time-picker`. White fill, 1px `#E4E4E7` border, shadow `0 4px 12px rgba(0,0,0,0.08)`, border-radius 8px.

**Calendar panel:** 12px padding, 4px gap. Header: chevron-left (28x28) | month-year (Inter Bold 14/20, centered) | chevron-right (28x28). Weekday row: 7 cells 34x20, Inter Medium 12/18, `#52525B`. Day cells: 34x34, 6px radius, Inter Regular 14/20. Selected: fill `#FEED02`, Inter Bold 14/20, text `#27272A`. Outside days: opacity 0.5.

**Time picker panel:** 12px padding, 8px gap between columns. Two columns: "Hora"/"Minuto" labels (Inter Medium 12/18), 6px spacer, scrollable items (44x32, 6px radius). Selected: fill `#FEED02`, bold. Unselected: regular, `#52525B`.

### Migration Source (product-console)

- `product-console/src/components/form/date-time-scroll-picker-field/index.tsx` — DateTimeScrollPickerField (to be migrated as `DateTimePickerField`)
- `product-console/src/components/form/date-time-scroll-picker-field/time-scroll-list.tsx` — TimeScrollList + HOURS/MINUTES constants

### Sindarian-UI Patterns (must follow)

- **UI primitives:** `'use client'`, `data-slot="name"` on root, `cn()` for classes, named exports, Radix wrappers
- **Form fields:** Generic `<T extends FieldValues>`, `Control<T>` + `Path<T>`, composition: `FormField -> FormItem -> FormLabel -> FormControl -> (UI) -> FormMessage -> FormDescription`. Standard props: `label`, `tooltip`, `labelExtra`, `description`, `disabled`, `readOnly`, `required`, `data-testid`
- **Barrel exports:** UI primitives in `src/index.tsx`, form fields via `src/components/form/index.ts`
- **Stories:** `Meta<Props>` with `title: 'Primitives/Name'` or `'Components/Form/Name'`, BaseComponent helper for form fields

---

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | TimePicker primitive + Calendar styling updated, both visible in Storybook | 1.1, 1.2 | Detailed |
| 2 | DateTimePickerField works end-to-end with react-hook-form, stories + export done | 2.1, 2.2 | Epic-level |
| 3 | Keyboard a11y for TimePicker, visual consistency check for DatePickerField + DateRangeField | 3.1, 3.2 | Epic-level |

---

## Phase 1: TimePicker Primitive & Calendar Styling

### Epic 1.1: TimePicker UI Component

**Goal:** A new `TimePicker` primitive at `packages/sindarian-ui/src/components/ui/time-picker/` renders scrollable hour and minute columns, following sindarian-ui conventions (`data-slot`, `cn()`, named export).
**Scope:** `packages/sindarian-ui/src/components/ui/time-picker/`, main barrel export
**Dependencies:** none
**Done when:** TimePicker renders two scrollable columns (hour 00-23, minute 00-59), selected values are highlighted with primary fill, `onChange` callback fires with `{ hour: number; minute: number }`, Storybook stories render correctly, component is exported from the library.
**Status:** Pending

#### Task 1.1.1: Create TimePicker component

- [ ] Done

**Context:** product-console has a `TimeScrollList` at `product-console/src/components/form/date-time-scroll-picker-field/time-scroll-list.tsx` that renders a single scrollable column. It uses inline `<style>` for scrollbar styling, `cn()` from a local util, aspect-square buttons with `min-w-[2.5rem]`, `bg-accent`/`text-accent-foreground` for selected state, and `role="listbox"` + `role="option"` for accessibility. It exports `HOURS` and `MINUTES` arrays alongside the component.

In sindarian-ui, UI primitives follow these conventions (see e.g. `src/components/ui/switch/index.tsx`, `src/components/ui/select/index.tsx`):
- File starts with `'use client'`
- Root element gets `data-slot="time-picker"`
- Use `cn()` from `@/lib/utils`
- Named exports: `export { TimePicker, HOURS, MINUTES }`
- No inline `<style>` tags — use Tailwind utilities or a `styles.css` file if custom scrollbar styling is needed

**Implementation vision:** Create `packages/sindarian-ui/src/components/ui/time-picker/index.tsx`. The component is a higher-level composition than `TimeScrollList` — it renders the full two-column (hour + minute) layout internally, rather than requiring the consumer to wire up two lists.

Props interface:
```typescript
export type TimePickerProps = {
  hour?: number
  minute?: number
  onChange?: (time: { hour: number; minute: number }) => void
  disabled?: boolean
  className?: string
  hourLabel?: string    // default "Hour"
  minuteLabel?: string  // default "Minute"
}
```

Structure:
- Root: `<div data-slot="time-picker" className={cn("flex gap-2 p-3", className)}>`
- Two internal scroll columns, each with:
  - Label: `<span>` with `text-xs font-medium text-muted-foreground text-center`
  - 6px spacer (`h-1.5`)
  - Scrollable container: `<div role="listbox" aria-label={label}>` with `overflow-y-auto` and max-height ~240px
  - Items: `<button role="option" aria-selected={selected}>` sized 44x32 (`w-11 h-8`), rounded-md
  - Selected item: `bg-primary text-primary-foreground font-bold`
  - Unselected item: `text-muted-foreground hover:bg-muted`
- Auto-scroll to selected value on mount using `useRef` + `useEffect` + `scrollIntoView({ block: 'nearest' })`
- Custom scrollbar styling: prefer a `styles.css` file imported in the component (matching the pattern of `src/components/ui/select/styles.css`), using the scrollbar CSS from product-console's `timeScrollStyles` but converted to a proper CSS file using design tokens

Migration changes from product-console's `TimeScrollList`:
- Combine two columns into a single component (instead of consumer rendering two `TimeScrollList`)
- Replace `bg-accent`/`text-accent-foreground` with `bg-primary`/`text-primary-foreground` to match Figma's `#FEED02` selected state
- Replace inline `<style>` with imported CSS file
- Add `data-slot="time-picker"` on root
- Remove `react-intl` dependency (use prop-based labels instead)
- Size items to match Figma: 44x32 (`w-11 h-8`) instead of `min-w-[2.5rem]` + aspect-square

**Files:**
- Create: `packages/sindarian-ui/src/components/ui/time-picker/index.tsx`
- Create: `packages/sindarian-ui/src/components/ui/time-picker/styles.css` (scrollbar styles)
- Modify: `packages/sindarian-ui/src/index.tsx` (add `export * from './components/ui/time-picker'`)

**Verification:** `pnpm storybook` — TimePicker story renders, clicking items changes selection, auto-scroll works on mount.

**Done when:** TimePicker renders matching the Figma time-picker panel spec, exports `TimePicker`, `HOURS`, `MINUTES` from the library barrel.

---

#### Task 1.1.2: Create TimePicker stories

- [ ] Done

**Context:** Storybook stories in sindarian-ui follow the pattern at e.g. `src/components/ui/calendar/calendar.stories.tsx` — default export `Meta<Props>` with `title: 'Primitives/TimePicker'`, named exports for variants.

**Implementation vision:** Create `packages/sindarian-ui/src/components/ui/time-picker/time-picker.stories.tsx` with:
- `Primary` — no initial selection (defaults hour=0, minute=0)
- `WithValue` — pre-selected time (e.g., hour=10, minute=3 to match Figma's "10:03")
- `Disabled` — all items disabled
- `CustomLabels` — labels set to "Hora" and "Minuto" (Portuguese, matching Figma labels)

Each story should use a stateful wrapper via `useState` so clicking items updates the display.

**Files:**
- Create: `packages/sindarian-ui/src/components/ui/time-picker/time-picker.stories.tsx`

**Verification:** All 4 stories render in Storybook without errors. Interactions work (clicking items updates selection).

**Done when:** Stories are visible under "Primitives/TimePicker" in Storybook navigation.

---

### Epic 1.2: Calendar Styling Updates

**Goal:** Calendar day cell sizing, weekday spacing, and selection visuals match the Figma spec. Navigation buttons remain at 28x28 while day cells grow to 34x34.
**Scope:** `packages/sindarian-ui/src/components/ui/calendar/index.tsx`
**Dependencies:** none
**Done when:** Day cells are 34x34, weekday cells are 34x20, nav buttons are 28x28 (decoupled from cell size), selected day is bold with primary fill, outside days have 0.5 opacity. All existing Calendar stories render correctly.
**Status:** Pending

#### Task 1.2.1: Update Calendar CSS variables and classNames

- [ ] Done

**Context:** The Calendar component at `packages/sindarian-ui/src/components/ui/calendar/index.tsx:36` sets `[--cell-size:--spacing(7)]` (28px) on the root and uses `--cell-size` for both nav buttons and day cells. The Figma design uses 34px for day cells but keeps 28px for nav buttons — these must be decoupled.

**Implementation vision:** Introduce `--nav-size` CSS variable for navigation buttons, update `--cell-size` for day cells.

Changes to the root className (line 36):
- Replace `[--cell-size:--spacing(7)]` with `[--cell-size:34px] [--nav-size:28px]`

Changes in `classNames` prop:
1. `button_previous` (line 58-61): Change `size-(--cell-size)` to `size-(--nav-size)`
2. `button_next` (line 63-66): Change `size-(--cell-size)` to `size-(--nav-size)`
3. `month_caption` (line 68-70): Change `h-(--cell-size)` to `h-(--nav-size)` and `px-(--cell-size)` to `px-(--nav-size)`
4. `week_number_header` (line 98-100): Change `w-(--cell-size)` to `w-(--nav-size)`
5. `week` (line 97): Change `mt-2` to `gap-0.5` (tighter 2px row gap matching Figma)
6. `outside` (line 126-128): Add `opacity-50` to match Figma

Changes in `CalendarDayButton` (line 224-228):
- Add `data-[selected-single=true]:font-bold data-[range-start=true]:font-bold data-[range-end=true]:font-bold` to make selected day text bold per Figma

**Files:**
- Modify: `packages/sindarian-ui/src/components/ui/calendar/index.tsx`

**Verification:** Open Calendar stories in Storybook. Day cells visibly larger. Nav buttons unchanged. Selected day bold. Outside days semi-transparent. No layout overflow.

**Done when:** Calendar visuals match Figma spec for cell sizes (34x34 days, 28x28 nav), bold selection, and 0.5 opacity outside days.

---

#### Task 1.2.2: Verify existing Calendar stories

- [ ] Done

**Context:** Calendar stories at `packages/sindarian-ui/src/components/ui/calendar/calendar.stories.tsx` cover: Primary, WithSelectedDate, RangeSelection, WithWeekNumbers, MultipleMonths.

**Implementation vision:** Run Storybook, verify all 5 existing stories render correctly with the new sizing. The larger cells might cause overflow in constrained containers — if so, adjust the popover or calendar width. Check RangeSelection specifically: the `range_start`/`range_middle`/`range_end` classes use `bg-muted` backgrounds that need to still look correct at 34px height. No new stories needed — just visual verification and any fixes.

**Files:**
- Modify (if needed): `packages/sindarian-ui/src/components/ui/calendar/calendar.stories.tsx`
- Modify (if needed): `packages/sindarian-ui/src/components/ui/calendar/index.tsx`

**Verification:** All 5 Calendar stories render without layout breakage or visual regressions.

**Done when:** Visual inspection confirms all stories match the updated design with no regressions.

---

## Phase 2: DateTimePickerField Migration

### Epic 2.1: Create DateTimePickerField form component

**Goal:** A new form field at `packages/sindarian-ui/src/components/form/date-time-picker-field/` migrated from product-console's `DateTimeScrollPickerField`, adapted to sindarian-ui form field conventions and the Figma design.
**Scope:** `packages/sindarian-ui/src/components/form/date-time-picker-field/`, form barrel export
**Dependencies:** Epic 1.1 (TimePicker primitive), Epic 1.2 (Calendar styling)
**Done when:** Component integrates with `react-hook-form` via `Control<T>`, trigger displays formatted date+time with clear button, popover opens with Calendar + vertical divider + TimePicker side by side, value emits as ISO datetime string, all Figma states (default/filled/error/disabled/open) render correctly. Follows sindarian-ui form field conventions (FormItem/FormLabel/FormControl/FormMessage/FormDescription composition, standard props).
**Status:** Pending

### Epic 2.2: Stories, barrel export, and documentation

**Goal:** DateTimePickerField has comprehensive Storybook stories and is exported from the sindarian-ui library.
**Scope:** Stories file, `src/components/form/index.ts`, `src/index.tsx`
**Dependencies:** Epic 2.1
**Done when:** Stories for Primary, WithValue, Required, WithTooltip, WithDescription, Disabled, ReadOnly, WithMinMaxDate render in Storybook. Component importable from `@lerianstudio/sindarian-ui`.
**Status:** Pending

---

## Phase 3: Polish & Consistency

### Epic 3.1: TimePicker keyboard navigation and screen reader support

**Goal:** TimePicker columns are navigable with arrow keys (up/down to move, Tab between columns) and screen-reader accessible (aria-label, aria-selected on items, live announcements on selection change).
**Scope:** `packages/sindarian-ui/src/components/ui/time-picker/index.tsx`
**Dependencies:** Epic 1.1
**Done when:** Keyboard navigation works without mouse. Screen reader announces selected values.
**Status:** Pending

### Epic 3.2: DatePickerField and DateRangeField visual alignment

**Goal:** DatePickerField and DateRangeField benefit from the Calendar styling updates and look consistent with the upgraded design. Verify no visual regressions from the cell size change.
**Scope:** `packages/sindarian-ui/src/components/form/date-picker-field/`, `packages/sindarian-ui/src/components/form/date-range-field/`
**Dependencies:** Epic 1.2
**Done when:** DatePickerField and DateRangeField popovers render correctly with the updated Calendar. Range selection visuals work at the new cell size. Stories for both render without issues.
**Status:** Pending
