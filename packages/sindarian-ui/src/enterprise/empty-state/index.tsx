/**
 * EmptyState: centered icon + title + optional description and action, for
 * "no data yet" and "no results" surfaces. Keep copy short and neutral.
 *
 * The `ruled` flag is the "ruled page" presentation hook: instead of the
 * floating centered card (which reads as a void inside a ledger register), it
 * renders a quiet, top/left-aligned notation under a hairline rule — so a
 * sparse register reads as ruled stationery waiting for entries rather than an
 * empty pane. The icon bubble drops; the title takes the column-head label
 * voice; the copy aligns to the page baseline. This is the seam a pre-ruled
 * empty-rows register (built app-side) composes with: the EmptyState sits at
 * the head of the page and the faint ruled lines fill below it.
 */
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

import { LABEL_VOICE_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  /** Lucide icon component. Defaults to Inbox. */
  icon?: LucideIcon
  title: string
  description?: string
  /** Optional action node (e.g. a Button). */
  action?: ReactNode
  /**
   * Render as a ruled-page notation rather than a centered card. Use inside a
   * ledger register so a short/empty result set reads as ruled stationery, not
   * a void. Pairs with the app-side pre-ruled empty-rows fill. Default off.
   */
  ruled?: boolean
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  ruled = false,
  className
}: EmptyStateProps) {
  if (ruled) {
    return (
      <div
        data-variant="ruled"
        className={cn(
          'border-border flex flex-col items-start gap-2 border-t px-3 py-6 text-left',
          className
        )}
      >
        <div className="text-muted-foreground flex items-center gap-2">
          <Icon className="size-4" aria-hidden />
          <span className={LABEL_VOICE_CLASS}>{title}</span>
        </div>
        {description ? (
          <p className="text-muted-foreground max-w-prose text-sm">
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-1">{action}</div> : null}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-16 text-center',
        className
      )}
    >
      <div className="bg-muted flex size-11 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
