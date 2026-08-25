/**
 * LedgerSheet + LedgerPanel — the connected-cell layout of the console.
 *
 * Do NOT float hairline cards in whitespace. Build connected sheets: a
 * `bg-border` wrapper with `gap-px`, cells `bg-card`. The 1px gaps reveal the
 * border color as hairline seams, so the panels read as one ruled ledger sheet.
 *
 *   <LedgerSheet cols={3}>
 *     <LedgerPanel>…</LedgerPanel>
 *     <LedgerPanel>…</LedgerPanel>
 *     <LedgerPanel>…</LedgerPanel>
 *   </LedgerSheet>
 *
 * The `cols` prop drives the responsive column count; on mobile every sheet
 * collapses to a single column. When a panel self-hides, pass the reduced
 * `cols` so the remaining panels stretch (e.g. 3 → 2 when a panel returns null).
 */
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Desktop column count. Only 1..4 are mapped (Tailwind needs literal class names). */
type Cols = 1 | 2 | 3 | 4

/** Tailwind needs literal class names to survive purge; map cols → class. */
const COLS_CLASS: Record<Cols, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4'
}

export type LedgerSheetProps = {
  children: ReactNode
  /** Desktop column count (1..4). Mobile always collapses to a single column. */
  cols?: Cols
  className?: string
}

export function LedgerSheet({
  children,
  cols = 1,
  className
}: LedgerSheetProps) {
  return (
    <div
      className={cn(
        'border-border bg-border grid grid-cols-1 gap-px overflow-hidden rounded-lg border',
        COLS_CLASS[cols] ?? COLS_CLASS[1],
        className
      )}
    >
      {children}
    </div>
  )
}

export type LedgerPanelProps = {
  children: ReactNode
  className?: string
  /** Render element. Defaults to `section` (a labeled console panel). */
  as?: 'section' | 'div'
}

/**
 * One cell of a ledger sheet. Flush — no own border or shadow — with `bg-card`,
 * internal `p-5` padding and `flex h-full flex-col gap-4` so panels stretch to
 * equal height. Start each panel with a `<SectionLabel>` as its heading.
 */
export function LedgerPanel({
  children,
  className,
  as: Tag = 'section'
}: LedgerPanelProps) {
  return (
    <Tag className={cn('bg-card flex h-full flex-col gap-4 p-5', className)}>
      {children}
    </Tag>
  )
}
