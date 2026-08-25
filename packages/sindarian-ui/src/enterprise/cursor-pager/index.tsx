'use client'

/**
 * CursorPager drives the cursor-pagination envelope
 *   { items, hasMore, nextCursor, prevCursor, limit }
 * shared by the console's cursor-paged list endpoints (do not use it on
 * offset-based endpoints).
 *
 * It is controlled: the parent owns the active cursor (the value it passes to
 * the list hook) and reacts to `onCursorChange`. Pass the page envelope's
 * `hasMore`, `nextCursor`, `prevCursor`. "Previous" is enabled when the page
 * reports a `prevCursor`; "Next" when `hasMore` and a `nextCursor` exist.
 *
 * `onCursorChange(undefined)` requests the first page (no cursor).
 */
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CursorPagerProps = {
  /** From the page envelope: more pages exist after this one. */
  hasMore?: boolean
  /** From the page envelope: cursor for the next page. */
  nextCursor?: string | null
  /** From the page envelope: cursor for the previous page. */
  prevCursor?: string | null
  /** Called with the cursor to load (undefined => first page). */
  onCursorChange: (cursor: string | undefined) => void
  /** Disable both controls (e.g. while fetching). */
  disabled?: boolean
  /** Optional summary, e.g. "50 per page" or a loaded-count string. */
  summary?: string
  /** Label for the previous-page control. Defaults to "Previous". */
  previousLabel?: string
  /** Label for the next-page control. Defaults to "Next". */
  nextLabel?: string
  className?: string
}

export function CursorPager({
  hasMore,
  nextCursor,
  prevCursor,
  onCursorChange,
  disabled = false,
  summary,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  className
}: CursorPagerProps) {
  const canPrev = !disabled && !!prevCursor
  const canNext = !disabled && !!hasMore && !!nextCursor

  return (
    <div
      className={cn('flex items-center justify-between gap-4 pt-3', className)}
    >
      <p className="text-muted-foreground text-xs">{summary ?? ''}</p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="small"
          icon={<ChevronLeft aria-hidden />}
          iconPlacement="start"
          disabled={!canPrev}
          onClick={() => onCursorChange(prevCursor ?? undefined)}
        >
          {previousLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="small"
          icon={<ChevronRight aria-hidden />}
          iconPlacement="end"
          disabled={!canNext}
          onClick={() => onCursorChange(nextCursor ?? undefined)}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
