# Sindarian Domain Grammar Implementation Plan

> **For implementers:** Use ring-default:executing-plans, ring-default:dispatching-workflows,
> or ring-dev-team:running-dev-cycle. This document is the living source of truth.
> Read `index.md` in this directory FIRST — §§ Frozen Contracts (FC-1..FC-6, incl. the
> executed census and the family rule) and File Ownership bind this lane.

**Goal:** The 27 census domain symbols exist under `src/domain/`: format helpers (NO_VALUE, formatPercent, formatCount, humanizeDurationMs, toPercentValue), MoneyText(+Props), Figure(+FIGURE_CLASS/FigureSize/FigureTone), KeyId, SectionLabel, Blotter/BlotterRow, LedgerSheet/LedgerPanel, StatusRail/Dot/LivePulse(+types), ThresholdGauge/gaugeBand/GaugeThresholds, DelinquencyAging, moneyDiff.

**Architecture:** Port from sindarian-x@0.15.0 (read-only reference: `~/repos/lerianstudio/lib-sindarian-ui/src/components/{ledger,recon,credit}/` and `src/components/ledger/format.ts`), API byte-compatible (FC-3), styling on sindarian-ui tokens (FC-2: `--color-credit`, `--color-matched-surface`, `--color-unmatched-surface`; semantic states via `system-*`). ATENÇÃO: money display correctness is non-negotiable — MoneyText's internal amount normalization and moneyDiff's arithmetic port EXACTLY, with their full legacy test suites; any internal money-math helpers they need port as UNEXPORTED internals with tests. pt-BR strings inside composites stay as-is (apps localize at app level, as today). Exports ONLY through `src/domain/index.ts`.

**Tech Stack:** TypeScript 6 strict, React 19, Intl.*, Tailwind v4, Jest/RTL, Storybook.

**Lane:** domain
**Depends on:** foundation (merged, PR #131)
**Worktree:** `/srv/worktrees/sindarian-domain` on branch `feat/sindarian-domain-grammar`

## Phase Overview

| Phase | Milestone | Epics | Status |
|-------|-----------|-------|--------|
| 1 | all 27 census symbols exported from src/domain, tested, storied; turbo green | 1.1, 1.2, 1.3 | Detailed |

---

### Epic 1.1: Format helpers and money/figure text

**Goal:** NO_VALUE, formatPercent, formatCount, humanizeDurationMs, toPercentValue, moneyDiff, MoneyText(+MoneyTextProps), Figure(+FIGURE_CLASS/FigureSize/FigureTone) exported.
**Scope:** `src/domain/{format.ts,money-text,figure}/**`, `src/domain/index.ts`.
**Dependencies:** none
**Done when:** legacy format/money tests ported and green; turbo green.
**Status:** Pending

#### Task 1.1.1: Port format.ts and moneyDiff

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/ledger/format.ts` (NO_VALUE:9, formatPercent:33, toPercentValue:51, formatCount:61, humanizeDurationMs:74) and the recon module exporting `moneyDiff` (`src/components/recon/` — locate `MatchPair`/`moneyDiff`; port ONLY `moneyDiff` and whatever internal types it needs, unexported). All are pure functions with locale params — port verbatim with their tests. matcher and lender call formatCount/formatPercent in dozens of files; numeric output MUST be byte-identical (snapshot the legacy outputs in tests for a fixed input set).

**Files:**
- Create: `packages/sindarian-ui/src/domain/format.ts`, `packages/sindarian-ui/src/domain/money-diff.ts` + tests
- Modify: `packages/sindarian-ui/src/domain/index.ts`

**Verification:** `npx turbo build test lint check-types --filter=@lerianstudio/sindarian-ui` green; output-equivalence snapshots pass.

**Done when:** six pure symbols exported, outputs byte-identical to legacy for the snapshot corpus.

#### Task 1.1.2: Port MoneyText and Figure

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/ledger/{money-text.tsx,figure.tsx}`. MoneyText is used by cockpit (36×), lender, matcher — and matcher WRAPS it adding a `tone="credit"` prop (its local fork extends the lib component), so the base API must stay byte-compatible or matcher's fork breaks. Internal amount normalization (`normalizeAmount`/`formatMoneyParts` or equivalents) ports as unexported internals WITH their legacy tests.

**Implementation vision:** Byte-compatible props. Sign-color classes map to sindarian-ui tokens: credit-red via `text-credit` (FC-2). `FIGURE_CLASS` constant stays byte-identical if it references only classes that exist (verify `tabular-nums` availability; sindarian-x defined a `.tabular-nums` utility in its styles — if sindarian-ui lacks it, use Tailwind's built-in `tabular-nums` utility class).

**Files:**
- Create: `packages/sindarian-ui/src/domain/{money-text,figure}/index.tsx` + tests + stories
- Modify: `packages/sindarian-ui/src/domain/index.ts`

**Verification:** turbo suite green; MoneyText renders negative/positive/zero/multi-currency cases matching legacy snapshots.

**Done when:** MoneyText/Figure exported with money-rendering tests green.

---

### Epic 1.2: Ledger structure widgets

**Goal:** SectionLabel, Blotter/BlotterRow, LedgerSheet/LedgerPanel, KeyId exported.
**Scope:** `src/domain/{section-label,blotter,ledger-sheet,key-id}/**`, `src/domain/index.ts`.
**Dependencies:** none (parallel with 1.1)
**Done when:** symbols exported; KeyId masking tests green; turbo green.
**Status:** Pending

#### Task 1.2.1: Port SectionLabel, Blotter, LedgerSheet/LedgerPanel

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/ledger/{section-label.tsx,blotter.tsx,ledger-sheet.tsx}`. SectionLabel consumes the voice constants foundation already exported (`LABEL_VOICE_CLASS`/`SECTION_LABEL_CLASS` — import from `../../lib/typography`, do not redefine). Consumers: cockpit (SectionLabel 42×), lender (Blotter 20×, LedgerSheet), matcher, consignado (LedgerSheet).

**Implementation vision:** Byte-compatible APIs; surfaces and hairlines translate to sindarian-ui tokens (`--card`, `--border`, shadows). Density: the legacy used density tokens (`--density-*`) that do NOT exist in sindarian-ui — replace with the fixed paddings sindarian-ui's own components use, and note in the lane report that the density system is not carried over (cockpit's density feature adapts app-side).

**Files:**
- Create: `packages/sindarian-ui/src/domain/{section-label,blotter,ledger-sheet}/index.tsx` + tests + stories
- Modify: `packages/sindarian-ui/src/domain/index.ts`

**Verification:** turbo suite green; stories render in both themes.

**Done when:** five symbols exported (SectionLabel, Blotter, BlotterRow, LedgerSheet, LedgerPanel).

#### Task 1.2.2: Port KeyId

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/ledger/key-id.tsx` (masks cpf/cnpj/email/phone kinds, copy button, masksByDefault). Lender imports KeyId in 37 occurrences and wraps it (`key-id-link.tsx`) — base API must stay byte-compatible. Masking of PII kinds is behavior, not styling: port the masking logic EXACTLY with its tests (cpf/cnpj digit grouping, email/phone partial masking).

**Files:**
- Create: `packages/sindarian-ui/src/domain/key-id/index.tsx` + tests + story
- Modify: `packages/sindarian-ui/src/domain/index.ts`

**Verification:** turbo suite green; masking tests per kind pass; copy button copies the UNMASKED value only if legacy did (verify legacy behavior first and match it).

**Done when:** KeyId exported with masking behavior identical to legacy.

---

### Epic 1.3: Status and gauge composites

**Goal:** StatusRail(+StatusRailChip/StatusRailItem types), Dot, LivePulse, ThresholdGauge/gaugeBand/GaugeThresholds, DelinquencyAging exported.
**Scope:** `src/domain/{status-rail,threshold-gauge,delinquency-aging}/**`, `src/domain/index.ts`.
**Dependencies:** none (parallel)
**Done when:** symbols exported; gaugeBand boundary tests green; turbo green.
**Status:** Pending

#### Task 1.3.1: Port StatusRail family, ThresholdGauge, DelinquencyAging

- [ ] Done

**Context:** Legacy: `~/repos/lerianstudio/lib-sindarian-ui/src/components/ledger/status-rail.tsx` (StatusRail, Dot:138, LivePulse:148 — LivePulse uses a `status-rail-pulse` keyframe animation defined in the legacy styles.css:422-438), `src/components/ledger/threshold-gauge.tsx` (ThresholdGauge, gaugeBand), `src/components/credit/delinquency-aging.tsx`. Consumers: matcher (StatusRail/Dot/LivePulse/ThresholdGauge/gaugeBand), lender (DelinquencyAging).

**Implementation vision:** Byte-compatible APIs. The pulse keyframes: define them scoped inside this lane's component CSS-in-file (Tailwind v4 `@keyframes` inside the component's story/styles is not available — check how sindarian-ui ships component-scoped animation today; if only globals.css carries keyframes, STOP and report to the orchestrator instead of editing globals.css, which this lane does not own). `gaugeBand` is pure banding logic — port with boundary tests (at/below/above each threshold). DelinquencyAging renders aging buckets — port with its bucket-math tests.

**Files:**
- Create: `packages/sindarian-ui/src/domain/{status-rail,threshold-gauge,delinquency-aging}/index.tsx` + tests + stories
- Modify: `packages/sindarian-ui/src/domain/index.ts`

**Verification:** turbo suite green; gaugeBand boundary cases and DelinquencyAging bucket sums asserted.

**Done when:** all epic symbols exported; any globals.css need reported, not self-served.
