# sindarian-ui upstream uplift (br-sfn cockpit audit backlog) — Mini Plan

> **For implementers:** one-phase plan. Epics are parallel streams: dispatch every
> epic whose dependencies are met, at the same time, one agent per epic, same
> branch. All work lands in a single PR.

**Goal:** land the consumer-proven fixes from the br-sfn cockpit token audit (2026-09-02) in `packages/sindarian-ui`: Badge small size, Toaster theme wiring, `color-scheme`, CardTitle heading level, AppShell banner label, and the migration doc.
**Scope:** `packages/sindarian-ui` only. Base branch `develop` (PR base per repo template). All changes additive — no breaking change to any existing consumer.

**Already fixed on develop (do NOT redo):** `--font-sans` fallback (`91957c5`), SidebarExpandButton accessible name (`50e0f8a`), Button destructive variant (`a96f033`).

**Deliberately NOT changed:** `globals.css` line 1 `@import 'tailwindcss'`. Dropping it would break consumers that rely on the lib for preflight/utilities; the double-preflight cost (~10KB pre-gzip, identical rules twice) is documented instead (Epic 1.6).

## Streams

| Epic | Delivers | Depends on | Files |
|------|----------|------------|-------|
| 1.1  | native widgets follow the theme (`color-scheme`) | none | `src/globals.css`, `src/__tests__/tokens-contract.test.ts` |
| 1.2  | Toaster follows ThemeProvider's resolved theme | none | `src/components/ui/toast/toaster.tsx`, `src/theme/theme-provider.tsx`, `src/components/ui/toast/toaster.test.tsx` |
| 1.3  | CardTitle heading-level escape hatch + honest prop types | none | `src/components/ui/card/index.tsx`, `src/components/ui/card/card.test.tsx` |
| 1.4  | AppShell banner landmark can be named | none | `src/enterprise/app-shell/index.tsx`, `src/enterprise/app-shell/app-shell.test.tsx` |
| 1.5  | Badge `size="sm"` (11px micro-badge) | none | `src/components/ui/badge/index.tsx`, `src/components/ui/badge/badge.test.tsx` |
| 1.6  | migration + setup doc consumers actually need | none | `packages/sindarian-ui/README.md` |
| 1.7  | integration + repo-wide verification | 1.1–1.6 | — (verification only) |

All paths except the README are relative to `packages/sindarian-ui/`.

## Contracts

Frozen before dispatch. An agent MUST NOT change these; if one cannot be met, STOP and report.

1. **Badge size axis:**
   ```ts
   size: { default: '', sm: 'text-[11px]' }
   // defaultVariants: { variant: 'default', size: 'default' }
   ```
   `sm` changes ONLY the font size. Per-variant padding stays untouched. `size="default"` (and omitted size) renders byte-identical class output to today.
2. **CardTitle polymorphism:**
   ```ts
   type CardTitleProps = React.ComponentProps<'h3'> & {
     as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
   }
   // default: 'h3' — rendered element, data-slot and classes unchanged when `as` omitted
   ```
3. **AppShell banner label:**
   ```ts
   headerLabel?: string
   // renders as aria-label on the existing <header> element; no other DOM change
   ```
4. **Toaster theme resolution order:** explicit `theme` prop → ThemeProvider `resolvedTheme` when rendered inside a `ThemeProvider` → `'system'`. Rendering `<Toaster />` OUTSIDE any ThemeProvider MUST NOT throw (the lib's `useTheme` throws; do not call it unconditionally).
5. **No new public exports** except what these contracts imply through existing barrels. No version bump by hand (semantic-release owns it).
6. **Commit convention per epic:** conventional commit scoped `(sindarian-ui)`; `feat` for 1.2/1.3/1.4/1.5, `fix` for 1.1, `docs` for 1.6.

---

### Epic 1.1: color-scheme in the theme blocks

**Goal:** UA widgets (form controls, scrollbars) get native light/dark treatment matching the active theme.
**Scope:** `src/globals.css` `:root` and `.dark` blocks; extend the tokens contract test.
**Dependencies:** none
**Done when:** `:root` declares `color-scheme: light`, `.dark` declares `color-scheme: dark`, and the tokens contract test pins both.
**Status:** Done

#### Task 1.1.1: Declare color-scheme in both theme blocks and pin it

- [x] Done

**Context:** `globals.css` `:root` (~line 213, inside `@layer base`) and `.dark` (~line 321) declare only HSL custom properties. Without `color-scheme`, native widgets stay light in dark mode. WARNING: `src/__tests__/tokens-contract.test.ts` parses `globals.css` as TEXT, extracting blocks by the literal openers `':root {'`, `'.dark {'`, `'@theme inline {'` — do not reformat those openers, and keep each declaration on one line.

**Implementation vision:** add `color-scheme: light;` as the first declaration of the `:root` block and `color-scheme: dark;` as the first declaration of the `.dark` block, each with a one-line comment stating the constraint (native widget theming). Extend `tokens-contract.test.ts` with assertions that `color-scheme: light` appears in the root block and `color-scheme: dark` in the dark block.

**Files:**
- Modify: `src/globals.css`
- Test: `src/__tests__/tokens-contract.test.ts`

**Verification:** `npx jest src/__tests__/tokens-contract.test.ts` from `packages/sindarian-ui` passes, including the new assertions; temporarily removing one declaration makes the new assertion fail (prove the gate can fail, then restore).

**Done when:** both declarations exist, the contract test pins them, and the full tokens contract suite is green.

---

### Epic 1.2: Toaster follows the resolved theme

**Goal:** a consumer inside `ThemeProvider` gets a Toaster that matches the active theme with zero wiring; consumers outside a provider keep today's behavior.
**Scope:** `toaster.tsx`; a non-throwing context read from `theme-provider.tsx`; new test file.
**Dependencies:** none
**Done when:** Contract 4 holds and is test-pinned.
**Status:** Done

#### Task 1.2.1: Wire Toaster to ThemeProvider without making the provider mandatory

- [x] Done

**Context:** `src/components/ui/toast/toaster.tsx` passes `theme` (default `'system'`) straight to sonner and never reads the lib's own ThemeProvider, so every consumer hand-rolls a wrapper (br-sfn cockpit carries `ThemedToaster`). The lib's `useTheme` (`src/theme/theme-provider.tsx:153-159`) THROWS outside a provider — Contract 4 forbids calling it unconditionally.

**Implementation vision:** expose the theme context for optional consumption — either export the context object internally or add a `useOptionalTheme()` (returns `undefined` outside a provider) in `theme-provider.tsx`; keep `useTheme`'s throwing behavior untouched. In `Toaster`, resolve per Contract 4: explicit prop wins, else provider `resolvedTheme`, else `'system'`. Keep every other sonner prop byte-identical.

**Files:**
- Modify: `src/components/ui/toast/toaster.tsx`, `src/theme/theme-provider.tsx`
- Test: `src/components/ui/toast/toaster.test.tsx` (create)

**Verification:** new jest tests cover the three branches of Contract 4 (prop wins inside provider; provider theme used when no prop; no-provider render does not throw and passes `system`). `npx jest src/theme src/components/ui/toast` green — the existing `theme-provider.test.tsx` must stay untouched and green.

**Done when:** all three resolution branches are test-pinned and the theme suite is green.

---

### Epic 1.3: CardTitle heading level + honest types

**Goal:** cards under a page `h1` can render `h2` titles (axe heading-order clean) without consumer wrappers; the public prop types match the rendered elements.
**Scope:** `CardTitle` (and the `CardDescription` type lie) in `card/index.tsx`.
**Dependencies:** none
**Done when:** Contract 2 holds; `CardDescription` is typed as the `<p>` it renders.
**Status:** Done

#### Task 1.3.1: Add the `as` prop to CardTitle and fix the element typings

- [x] Done

**Context:** `src/components/ui/card/index.tsx:28-39`: `CardTitle` renders `<h3>` hardcoded but is typed `React.ComponentProps<'div'>`; `CardDescription` (line ~41) renders `<p>` typed as `'div'`. Proven consumer failure: br-sfn `correios.settings.a11y.test.tsx` goes RED on axe heading-order when cards sit under an `h1` — the consumer keeps a local wrapper only because the level is unreachable.

**Implementation vision:** implement Contract 2 (render `const Comp = as ?? 'h3'`); retype `CardDescription` props as `React.ComponentProps<'p'>`. No DOM/class change when `as` is omitted. Add a test file (none exists for card) asserting: default renders `h3` with `data-slot="card-title"` and today's classes; `as="h2"` renders `h2` with identical slot/classes.

**Files:**
- Modify: `src/components/ui/card/index.tsx`
- Test: `src/components/ui/card/card.test.tsx` (create)

**Verification:** `npx jest src/components/ui/card` green; `npm run check-types` inside `packages/sindarian-ui` clean (proves the retyping breaks no internal usage).

**Done when:** `as` works and is test-pinned, default output unchanged, types honest.

---

### Epic 1.4: name the AppShell banner landmark

**Goal:** consumers can name the `<header>` banner (multi-banner and i18n-strict apps stop failing landmark-name checks).
**Scope:** `enterprise/app-shell/index.tsx` props + header rendering; its existing test.
**Dependencies:** none
**Done when:** Contract 3 holds and is test-pinned.
**Status:** Done

#### Task 1.4.1: Add headerLabel to AppShellProps

- [x] Done

**Context:** `src/enterprise/app-shell/index.tsx:104-108` renders a bare `<header>` with hardcoded className and no attribute passthrough; `AppShellProps` (lines 41-65) is a closed object type, so consumers cannot name the banner at all. Existing test `app-shell.test.tsx` asserts exactly one header and its ordering — extend it, do not weaken it.

**Implementation vision:** implement Contract 3: `headerLabel?: string` on `AppShellProps` with a doc comment (when to name a banner), rendered as `aria-label` on the existing `<header>`. Omitted → attribute absent (assert that too). Extend the existing test file with both assertions.

**Files:**
- Modify: `src/enterprise/app-shell/index.tsx`
- Test: `src/enterprise/app-shell/app-shell.test.tsx`

**Verification:** `npx jest src/enterprise/app-shell` green, existing assertions untouched.

**Done when:** labeled and unlabeled renders are both test-pinned.

---

### Epic 1.5: Badge size="sm"

**Goal:** one canonical micro-badge size in the lib, killing the 0.7rem/10px/11px per-consumer anarchy at the source.
**Scope:** `badge/index.tsx` cva only.
**Dependencies:** none
**Done when:** Contract 1 holds and is test-pinned.
**Status:** Done

#### Task 1.5.1: Add the size axis to badgeVariants

- [x] Done

**Context:** `src/components/ui/badge/index.tsx:7-41`: cva has a single `variant` axis with padding baked per-variant (`py-[2px] px-3`, `px-[10px] py-1`), base carries `text-sm`. Contract 1 deliberately scopes `sm` to font-size only so it composes with EVERY variant without a padding fight. The 11px value is the br-sfn doctrine canon for fine print (Fred's ruling 2026-09-02).

**Implementation vision:** add the `size` axis per Contract 1 verbatim; add `size: 'default'` to `defaultVariants`. Check whether the component runs classes through tailwind-merge (`cn`) — if plain concatenation, `text-[11px]` must still win over the base `text-sm` (cva emits base first; verify in the test by computed class list). Add a test: default badge class output unchanged (snapshot today's string for `variant="default"` and one system variant); `size="sm"` includes `text-[11px]`; `text-sm` does not survive merge when sm is set (if `cn` uses tailwind-merge).

**Files:**
- Modify: `src/components/ui/badge/index.tsx`
- Test: `src/components/ui/badge/badge.test.tsx` (create)

**Verification:** `npx jest src/components/ui/badge` green.

**Done when:** sm is test-pinned and default output is proven unchanged.

---

### Epic 1.6: migration + setup documentation

**Goal:** every migrating consumer stops rediscovering the three traps br-sfn hit; the setup section stops documenting Tailwind v3.
**Scope:** `packages/sindarian-ui/README.md` only.
**Dependencies:** none
**Done when:** README carries a migration section and a v4-true setup section.
**Status:** Done

#### Task 1.6.1: Add "Migrating to 1.3+" and retrue the Tailwind setup section

- [x] Done

**Context:** README's "Tailwind CSS Setup" (~lines 42-55) documents a v3 `tailwind.config.js` `content` array and names the package `sindarian-ui` (unscoped) — stale for a Tailwind v4 package. The "Changelog" section (~line 220) points at the stale root `CHANGELOG.md` instead of the package one semantic-release writes. There is no migration doc anywhere in the repo.

**Implementation vision:** (a) rewrite "Tailwind CSS Setup" for v4: `@import 'tailwindcss'` then the lib's `dist/globals.css`, `@source` into the package dist, `@custom-variant dark` — mirror the wiring both production consumers use (br-sfn cockpit `src/index.css`, product-console `src/app/globals.css`). (b) Add a "Migrating to 1.3+" section with exactly these items: remove `tailwindcss-animate` from the app (the lib ships `tw-animate-css`; keeping the old plugin silently re-times every lib overlay); `CardTitle` renders a real `h3` since 1.3.0 — delete consumer heading wrappers, use `as` for a different level; Vite/non-Next consumers must load Inter themselves (`@fontsource-variable/inter`) and may set `--font-inter` (the lib falls back to `'Inter'` then system since 1.3.0-beta); note the double preflight (app `@import 'tailwindcss'` + lib globals both emit preflight — harmless duplication, ~10KB pre-gzip; keep the app import first). (c) Point the Changelog section at `packages/sindarian-ui/CHANGELOG.md`. English, factual, no marketing tone.

**Files:**
- Modify: `packages/sindarian-ui/README.md`

**Verification:** every claim cross-checked against the code on THIS branch (e.g. the font fallback text must match what `globals.css` actually does after the develop fix). No fabricated flags or paths.

**Done when:** the three trap notes + v4 setup are in, changelog pointer fixed.

---

### Epic 1.7: integration + repo-wide verification

**Goal:** the combined diff builds, lints, type-checks, and tests clean exactly as CI will run it.
**Scope:** verification only; owns no files.
**Dependencies:** 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
**Done when:** all gates below green on the combined tree.
**Status:** Done

#### Task 1.7.1: Run the CI gates locally and sweep for cross-epic breakage

- [x] Done

**Context:** CI on a PR to develop runs `turbo lint`, `npm run test --filter`, `npm run build --filter` for the changed package (Node 22). `check-types` is NOT in CI but the release build runs full tsc — run it anyway. Lint runs `eslint . --fix`: run it and verify it produces zero diff (a dirty tree after lint means unformatted code).

**Implementation vision:** from the repo root: `npx turbo lint --filter=@lerianstudio/sindarian-ui` (then `git status --porcelain` must be empty), `npm run test -- --filter=@lerianstudio/sindarian-ui`, `npm run build -- --filter=@lerianstudio/sindarian-ui`; from the package: `npm run check-types`. Sweep: no remaining `React.ComponentProps<'div'>` on an element that renders something else in card/index.tsx; barrel exports still compile; no accidental changes outside `packages/sindarian-ui` + the plan file.

**Verification:** all four commands exit 0 (never judge through a pipe — capture exit codes directly); `git diff --stat` touches only the planned files.

**Done when:** gates green, diff scoped, epics 1.1-1.6 all read Done.
