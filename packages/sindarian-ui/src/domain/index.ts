// Owned by lane domain — see docs/plans/2026-08-26-sindarian-x-retirement/
//
// The finance domain grammar absorbed from @lerianstudio/sindarian-x@0.15.0.
// Exports are NAMED (never `export *`) on purpose: the port census freezes the
// public surface to exactly the symbols the four migrating apps import, and the
// money-math internals (`toMinor`, `Amount`, `sumMinor`, `formatMoneyParts`,
// `maskKeyId`, `AgingBuckets`, …) stay module-private so they never become an
// API this package has to keep.

export {
  NO_VALUE,
  formatCount,
  formatPercent,
  humanizeDurationMs,
  toPercentValue
} from './format'
export type { FormatPercentOptions, PercentUnit } from './format'

export { moneyDiff } from './money-diff'
export type { MoneyDiffInput } from './money-diff'

export { MoneyText } from './money-text'
export type { MoneyTextProps } from './money-text'

export { FIGURE_CLASS, Figure } from './figure'
export type { FigureProps, FigureSize } from './figure'

export { SectionLabel } from './section-label'
export type { SectionLabelProps } from './section-label'

export { Blotter, BlotterRow } from './blotter'
export type { BlotterProps, BlotterRowProps } from './blotter'

export { LedgerPanel, LedgerSheet } from './ledger-sheet'
export type { LedgerPanelProps, LedgerSheetProps } from './ledger-sheet'

export { KeyId } from './key-id'
export type { KeyIdKind, KeyIdProps } from './key-id'

export { Dot, LivePulse, StatusRail } from './status-rail'
export type {
  StatusRailChip,
  StatusRailItem,
  StatusRailProps
} from './status-rail'

export { ThresholdGauge, gaugeBand } from './threshold-gauge'
export type {
  GaugeBand,
  GaugeDirection,
  GaugeEdges,
  GaugeFormat,
  GaugeThresholds,
  ThresholdGaugeProps
} from './threshold-gauge'

export { DelinquencyAging } from './delinquency-aging'
export type {
  AgingBand,
  AgingBucketsLabels,
  DelinquencyAgingProps,
  DelinquencyBucket
} from './delinquency-aging'
