// Owned by lane enterprise — see docs/plans/2026-08-26-sindarian-x-retirement/
//
// The composed enterprise layer absorbed from @lerianstudio/sindarian-x@0.15.0.
// Outer public APIs are byte-compatible with that package; internals are
// recomposed over sindarian-ui primitives and its design tokens.
//
// Names already exported by sindarian-ui are NEVER re-exported here (FC-4):
// consumers adapt to sindarian-ui's API for Button, Badge, Table*, Sidebar*,
// EntityBox*, Stepper*, PageHeader, ConfirmationDialog and friends.

export { AlertBanner } from './alert-banner'
export type { AlertBannerProps, AlertBannerTone } from './alert-banner'

export { AppShell } from './app-shell'
export type { AppShellProps } from './app-shell'

export { CursorPager } from './cursor-pager'
export type { CursorPagerProps } from './cursor-pager'

export { DataTable } from './data-table'
export type { DataTableProps } from './data-table'

export { DateRangePicker } from './date-range-picker'
export type { DateRangePickerProps, DateRangeValue } from './date-range-picker'

export { DetailPanel } from './detail-panel'
export type { DetailPanelProps } from './detail-panel'

export { EmptyState } from './empty-state'
export type { EmptyStateProps } from './empty-state'

export { NumberInput } from './number-input'
export type { NumberInputProps } from './number-input'

export { SearchInput } from './search-input'
export type { SearchInputProps } from './search-input'

export { StatCard } from './stat-card'
export type { StatCardProps, StatCardRow, StatCardTone } from './stat-card'

export { DEFAULT_STATUS_VARIANTS, StatusBadge } from './status-badge'
export type { StatusBadgeProps } from './status-badge'

export { VirtualizedTable } from './virtualized-table'
export type { VirtualizedTableProps } from './virtualized-table'

export { useIsMobile } from './use-is-mobile'
