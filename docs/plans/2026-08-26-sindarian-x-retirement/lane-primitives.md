# Sindarian Missing Primitives Implementation Plan

> **For implementers:** Use ring-default:executing-plans, ring-default:dispatching-workflows,
> or ring-dev-team:running-dev-cycle. This document is the living source of truth.
> Read `index.md` in this directory FIRST — §§ Frozen Contracts (FC-1..FC-6, incl. the
> executed census and the family rule) and File Ownership bind this lane.

**Goal:** The shadcn primitives and form fields sindarian-ui lacks (and the apps use) exist in sindarian-ui: Accordion, AlertDialog, HoverCard, RadioGroup, ScrollArea, ToggleGroup, FileUpload (+validateFile), and the form fields TextareaField, RadioGroupField, FileUploadField.

**Architecture:** Port from sindarian-x@0.15.0 (source reference, read-only: `~/repos/lerianstudio/lib-sindarian-ui/src/components/ui/` and `src/components/fields/`), keeping the public API byte-compatible (FC-3) while re-basing styling and file conventions on sindarian-ui (cva, `data-slot`, `cn()`, one directory per component with `index.tsx`, co-located test and Storybook story — mirror an existing component like `src/components/ui/checkbox/` for the exact shape). Radix deps are already installed (foundation, FC-5). This is the ONLY wave-2 lane allowed to edit `src/index.tsx`.

**Tech Stack:** TypeScript 6 strict, React 19, Radix UI, Tailwind v4, cva, Jest/RTL, Storybook.

**Lane:** primitives
**Depends on:** foundation (merged, PR #131)
**Worktree:** `/srv/worktrees/sindarian-primitives` on branch `feat/sindarian-missing-primitives`

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | all census primitives + form fields exported, tested, storied; build/lint/test green | 1.1, 1.2 | Detailed |

---

### Epic 1.1: Radix-backed primitives

**Goal:** Accordion (4 exports), AlertDialog (8), HoverCard (3), RadioGroup (2), ScrollArea (+ScrollBar internal dep), ToggleGroup (2) exist under `src/components/ui/` and export from the main barrel.
**Scope:** `src/components/ui/{accordion,alert-dialog,hover-card,radio-group,scroll-area,toggle-group}/**`, `src/index.tsx`.
**Dependencies:** none
**Done when:** every symbol in the census primitives list for these families is exported; `npx turbo build test lint check-types --filter=@lerianstudio/sindarian-ui` green.
**Status:** Pending

#### Task 1.1.1: Port the six Radix primitive families

- [ ] Done

**Context:** None of these exist in sindarian-ui (verified against the resolved barrel, 334 exports). Legacy sources: `~/repos/lerianstudio/lib-sindarian-ui/src/components/ui/{accordion,alert-dialog,hover-card,radio-group,scroll-area,toggle-group}.tsx`. sindarian-ui convention reference: `packages/sindarian-ui/src/components/ui/checkbox/` (directory + index.tsx + story + test) and its `.claude/CLAUDE.md`.

**Implementation vision:** One directory per family under `src/components/ui/`, following sindarian-ui file conventions exactly. Public API byte-compatible with the legacy `.d.ts` (FC-3): same export names, props, forwarded refs. Styling: translate legacy Tailwind classes onto sindarian-ui tokens — semantic-state classes map per FC-2 note (`success→system-success`, `warning→system-alert`, `info→system-info`); radii/typography follow sindarian-ui's existing primitives. Animation classes: sindarian-ui's Tailwind v4 setup — check how existing sindarian-ui overlays (Dialog, Sheet) animate and reuse that mechanism instead of assuming `tailwindcss-animate`. Import Radix from the individual `@radix-ui/react-*` packages (FC-5), never the unified `radix-ui` package the legacy used. Barrel: append `export * from './components/ui/<name>'` lines AFTER the FC-1 block, never inside it. Each family gets a test (render + one behavior assertion per family, e.g. accordion expands) and a Storybook story rendering all variants.

**Files:**
- Create: `packages/sindarian-ui/src/components/ui/{accordion,alert-dialog,hover-card,radio-group,scroll-area,toggle-group}/index.tsx` + co-located `*.test.tsx` and `*.stories.tsx` per repo convention
- Modify: `packages/sindarian-ui/src/index.tsx`

**Verification:** `npx turbo build test lint check-types --filter=@lerianstudio/sindarian-ui` green.

**Done when:** all six families exported per census, tests and stories in place.

#### Task 1.1.2: Port FileUpload + validateFile

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/ui/file-upload.tsx` (exports FileUpload, validateFile, FileUploadResult/FileUploadError/FileUploadProps types). Used by cockpit (FileUpload) and lender (validateFile). No Radix dependency.

**Implementation vision:** Same porting rules as 1.1.1. `validateFile` is pure logic — port with its unit tests (size/type validation edge cases). Keep the error-shape types byte-compatible: lender code branches on them.

**Files:**
- Create: `packages/sindarian-ui/src/components/ui/file-upload/index.tsx` + test + story
- Modify: `packages/sindarian-ui/src/index.tsx`

**Verification:** same turbo suite green; validateFile unit tests cover accept/reject/size-limit cases.

**Done when:** FileUpload, validateFile, and the three types export from the barrel.

---

### Epic 1.2: Form fields (react-hook-form wrappers)

**Goal:** TextareaField, RadioGroupField, FileUploadField exist following sindarian-ui's OWN field conventions.
**Scope:** `src/components/form/{textarea-field,radio-group-field,file-upload-field}/**`, `src/index.tsx`.
**Dependencies:** Epic 1.1 (RadioGroup and FileUpload primitives)
**Done when:** three fields exported, each rendering label/control/message through sindarian-ui's Form plumbing; turbo suite green.
**Status:** Pending

#### Task 1.2.1: Implement the three field wrappers

- [ ] Done

**Context:** sindarian-ui already has a form-field family under `src/components/form/` (InputField, SelectField, SwitchField, …) with its own conventions — THOSE conventions win over the legacy field-shell pattern (senior rule; the legacy `FieldLabel`/field-shell is NOT ported). Legacy references for props: `~/repos/lerianstudio/lib-sindarian-ui/src/components/fields/{textarea-field,radio-group-field,file-upload-field}.tsx`. Consumers: lender (TextareaField 11×, RadioGroupField), br-consignado-gw (FileUploadField).

**Implementation vision:** Mirror sindarian-ui's existing `InputField` implementation shape (read it first; follow its prop naming, generics, and Form integration exactly), swapping the control for Textarea / RadioGroup / FileUpload. Keep the legacy prop names that consumers pass (label, description, placeholder, control, name, options/accept) compatible where they do not conflict with sindarian-ui's field conventions; where they conflict, sindarian-ui's convention wins and the divergence is listed in the lane report for the app lanes.

**Files:**
- Create: `packages/sindarian-ui/src/components/form/{textarea-field,radio-group-field,file-upload-field}/index.tsx` + tests + stories
- Modify: `packages/sindarian-ui/src/index.tsx`

**Verification:** turbo suite green; each field test submits a react-hook-form form and asserts the value + error message rendering.

**Done when:** three fields exported and behaving like sindarian-ui's existing fields.
