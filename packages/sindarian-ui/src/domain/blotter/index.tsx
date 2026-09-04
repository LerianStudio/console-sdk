/**
 * Blotter + BlotterRow — the key/value readout of the console.
 *
 * Clean key/value rows separated by hairline borders (`divide-y divide-border`)
 * — no zebra fills. Each row: a quiet sentence-case sans label on the left, a mono
 * `tabular-nums` value on the right, `hover:bg-body-surface` as the quiet row
 * affordance (the recessed page surface, one step behind `bg-card`, in both
 * themes). Escalate the value color (`text-credit`, `text-system-alert`) only
 * when a metric crosses a threshold.
 *
 *   <Blotter>
 *     <BlotterRow label="Resolved on time" value="128" />
 *     <BlotterRow label="Pending overdue" value="3" valueClassName="text-credit" />
 *   </Blotter>
 *
 * Renders a `<dl>`; rows are `<div>`s with `<dt>`/`<dd>`.
 */
import type { ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { LABEL_VOICE_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'

export type BlotterProps = {
  children: ReactNode
  className?: string
}

export function Blotter({ children, className }: BlotterProps) {
  return <dl className={cn('divide-border divide-y', className)}>{children}</dl>
}

export type BlotterRowProps = {
  label: ReactNode
  value: ReactNode
  /** Threshold-escalation class on the value (e.g. `text-credit`). */
  valueClassName?: string
  className?: string
  /**
   * Stack the label above a full-width value instead of the inline
   * label-left / value-right layout. Use for long-form prose (reasons,
   * descriptions, notes) where a justified single line would squish the text.
   * The value renders as wrapping sans body copy, not the mono tabular figure
   * used by inline rows.
   */
  stacked?: boolean
  /**
   * Render a skeleton in the value slot and mark the row `aria-busy`. The label
   * is known before the figure is, so it keeps rendering — a loading blotter
   * still reads as the same set of rows. Default off.
   */
  loading?: boolean
}

export function BlotterRow({
  label,
  value,
  valueClassName,
  className,
  stacked = false,
  loading = false
}: BlotterRowProps) {
  // The skeleton stands in for the value slot's own shape: a full-width prose
  // line when stacked, the mono figure's width when inline.
  const shownValue = loading ? (
    <Skeleton className={cn('h-4', stacked ? 'w-full' : 'w-24')} />
  ) : (
    value
  )

  if (stacked) {
    return (
      <div
        aria-busy={loading || undefined}
        className={cn(
          'hover:bg-body-surface space-y-1 px-2 py-2 transition-colors duration-150 ease-out',
          className
        )}
      >
        <dt className={LABEL_VOICE_CLASS}>{label}</dt>
        <dd
          className={cn(
            'text-foreground text-sm break-words whitespace-pre-wrap',
            valueClassName
          )}
        >
          {shownValue}
        </dd>
      </div>
    )
  }

  return (
    <div
      aria-busy={loading || undefined}
      className={cn(
        'hover:bg-body-surface flex items-center justify-between gap-3 px-2 py-2 transition-colors duration-150 ease-out',
        className
      )}
    >
      <dt className={LABEL_VOICE_CLASS}>{label}</dt>
      <dd
        className={cn(
          'font-mono text-sm font-medium tabular-nums',
          valueClassName
        )}
      >
        {shownValue}
      </dd>
    </div>
  )
}
