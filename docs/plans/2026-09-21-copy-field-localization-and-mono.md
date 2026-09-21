# CopyField: localizable labels, a monospace variant and a description slot

> **For implementers:** this document is both the plan and the index for one lane. Work in the worktree named below; commit signed Conventional Commits with scope `sindarian-ui`; do not push; do not open a PR.

**Goal:** `CopyField` can be used by a trilingual console without hard-coded English reaching a screen reader or a toast, can render an identifier or token in the monospace face, and can carry a one-line description under the field — so the Matcher console can delete its local `CopyableSecret`.

**Architecture:** four optional props on the existing component, every default byte-identical to today's behaviour. No new component, no i18n machinery in the library: the consumer passes translated strings, as it already does for `onCopyLabel`, `revealLabel`, `hideLabel` and `valueLabel`.

**Tech Stack:** React 19, TypeScript, Tailwind, jest + Testing Library, Storybook (`packages/sindarian-ui`).

## Lane operating rules

1. Worktree `/srv/worktrees/copyfield-i18n`, branch `agent/copyfield-i18n` (cut from `origin/develop` at `6e96622`, sindarian-ui `2.0.0-beta.12`). Never edit `~/repos/**`.
2. Commits: `feat(sindarian-ui): ...` for the props, `test(sindarian-ui): ...` for test-only, `docs(sindarian-ui): ...` for mdx/story-only. Subject ≤ 72 chars, lowercase imperative. Signed (`git log --show-signature -1` shows a good signature).
3. Frozen: every existing prop keeps its name, type and default; every existing story keeps rendering unchanged; the component's `data-slot` and `data-testid` values stay.
4. TDD: a RED test first for each of the four props, captured, then GREEN.
5. Run package-scoped commands only (below); no root-wide `turbo` runs.

## Bug protocol

A defect inside `packages/sindarian-ui/src/components/ui/copy-field/**` is fixed here with its own RED and a `fix(sindarian-ui):` commit. A defect anywhere else is a row in `## Bugs found outside this lane` (file, symptom, evidence, suspected fix), never an edit.

## Ownership carve-outs

This lane owns `packages/sindarian-ui/src/components/ui/copy-field/**` and this file. Nothing else.

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | The four props ship with tests, a story and docs | 1.1 | Detailed |

## Phase 1

### Epic 1.1: Four optional props on `CopyField`

**Goal:** a consumer can localize the copy button's accessible name and the no-clipboard fallback toast, opt a value into the monospace face, and render a description under the field.
**Scope:** `packages/sindarian-ui/src/components/ui/copy-field/**`.
**Dependencies:** none.
**Done when:** the package test, type-check and lint commands pass; the four RED excerpts are recorded below; the story and the mdx document the props.
**Status:** Done

#### Task 1.1.1: `copyLabel`, `fallbackLabel`, `mono`, `description`

- [x] Done

**Context:** `packages/sindarian-ui/src/components/ui/copy-field/index.tsx` on `develop`. The copy button's accessible name is computed as `label ? \`Copy ${label}\` : 'Copy value'` (English, no prop); the no-clipboard / refused-write path toasts `FALLBACK_COPY_LABEL` = `'Copy not available — text selected, press Ctrl/Cmd+C'` (English, no prop); the input's class comment says "No `font-mono`: the value inherits the app sans font" with no opt-in; there is no slot for a description paragraph. The Matcher console reimplements the component locally for exactly these four reasons. On Matcher `develop` (2026-09-21) that copy is inlined twice, in `ui/src/components/settings/callback-credential-token-dialog.tsx` and `webhook-token-result-dialog.tsx`; the Matcher ui lane (branch `refactor/collapse-ui`, commit `3a54fdbc`) folds both into `ui/src/components/settings/copyable-secret.tsx` with a header comment that names this lane as its deletion condition. Until that branch merges, a reader of `develop` finds the two inline copies, not the file. The four sibling props that already exist for localization (`onCopyLabel`, `revealLabel`, `hideLabel`, `valueLabel`) set the pattern: optional string, English default, documented with `@defaultValue`.

**Implementation vision:**
1. `copyLabel?: string` — the copy button's `aria-label`. When omitted the computed English name stays exactly as today. Doc comment in the sibling style.
2. `fallbackLabel?: string` — the toast title on the fallback path. Omitted → `FALLBACK_COPY_LABEL` as today.
3. `mono?: boolean` (default `false`) — adds `font-mono` to the input's class list. Rewrite the "No `font-mono`" comment to: sans by default so the field matches every other input; `mono` opts identifiers, tokens and recovery codes in. Nothing else about the input changes.
4. `description?: React.ReactNode` — when given, render `<p data-slot="copy-field-description" id={\`${inputId}-description\`} className="text-muted-foreground text-xs">` after the input row, and set `aria-describedby` on the input to that id. Omitted → no element, no attribute.
Tests, in `copy-field.test.tsx`, RED first (run each before the prop exists and capture the failure): the copy button's accessible name is `copyLabel` when given and `Copy <label>` when not; with `navigator.clipboard` undefined the toast title is `fallbackLabel` when given and the English default when not (the file already stubs the clipboard for the fallback path — reuse that shape); `mono` adds `font-mono` and its absence does not; `description` renders with the `data-slot`, and the input's `aria-describedby` points at it. Story: one new story `Localized` in `copy-field.stories.tsx` passing all four props with Portuguese strings and a token-shaped value. Docs: four rows in the props table of `copy-field.mdx`, same register as the existing rows.

**Files:**
- Modify: `packages/sindarian-ui/src/components/ui/copy-field/index.tsx`, `packages/sindarian-ui/src/components/ui/copy-field/copy-field.test.tsx`, `packages/sindarian-ui/src/components/ui/copy-field/copy-field.stories.tsx`, `packages/sindarian-ui/src/components/ui/copy-field/copy-field.mdx`, this file

**Verification:** `npm run test -w packages/sindarian-ui -- copy-field` green; `npm run check-types -w packages/sindarian-ui` exits 0; `npm run lint -w packages/sindarian-ui` exits 0. Dependencies are installed at the workspace root (`npm ci` already ran).

**Done when:** the four props exist with today's defaults, each has a test that failed before it existed, the story and the mdx show them, and `git diff origin/develop --stat` touches only the four component files and this document.

## Recorded measurements

### RED, before the props existed

`npm run test -w packages/sindarian-ui -- copy-field` — `Tests: 5 failed, 30 passed, 35 total`:

```
● CopyField › copyLabel › uses copyLabel as the copy button accessible name when provided
  TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Copiar segredo"

● CopyField › fallbackLabel › toasts fallbackLabel when the clipboard API is absent
● CopyField › fallbackLabel › toasts fallbackLabel when writeText rejects
  expect(jest.fn()).toHaveBeenCalledWith(...expected) — received title:
  "Copy not available — text selected, press Ctrl/Cmd+C"

● CopyField › mono › renders the value in the monospace face when mono is set
  expect(element).toHaveClass("font-mono")

● CopyField › description › renders the description and points the input at it
  Unable to find an element with the text: Guarde em um gerenciador de senhas.
```

`npm run check-types -w packages/sindarian-ui` refused all four prop names:

```
copy-field.test.tsx(448,48): error TS2322: Type '{ value: string; label: string; copyLabel: string; }' is not assignable to type 'IntrinsicAttributes & CopyFieldProps'.
copy-field.test.tsx(478,11): error TS2322: Type '{ value: string; label: string; fallbackLabel: string; }' ...
copy-field.test.tsx(513,57): error TS2322: Type '{ value: string; label: string; mono: true; }' ...
copy-field.test.tsx(535,11): error TS2322: Type '{ value: string; label: string; description: string; }' ...
```

### GREEN, after

| Command | Result |
| --- | --- |
| `npm run test -w packages/sindarian-ui -- copy-field` | `Test Suites: 1 passed`, `Tests: 35 passed, 35 total` (was 26) |
| `npm run check-types -w packages/sindarian-ui` | exit 0 |
| `npm run lint -w packages/sindarian-ui` | exit 0 |

The default render is guarded as byte-identical, not just visually unchanged: with `mono`
omitted the input's `class` attribute is asserted equal to today's exact string, so `cn`
adding the conditional class cannot reorder or rewrite the list for existing consumers.

`git diff origin/develop --stat` touches the four component files and this document, nothing else.

## Bugs found outside this lane

| File | Symptom | Evidence | Suspected fix |
|---|---|---|---|
