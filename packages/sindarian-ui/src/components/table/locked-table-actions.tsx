import React from 'react'
import { LockIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type LockedTableActionsProps = {
  /** Why this record cannot be changed. It is the control's accessible name as well as the tooltip's text. */
  message: string
  className?: string
}

/**
 * Where a row's action menu would be, on a record the ledger will not let
 * anyone change — an external account, in double-entry terms.
 *
 * ⛔ THE TRIGGER IS A BUTTON. It used to be a `<div>`, so the ONLY explanation
 * of why the menu is gone lived in a tooltip that a keyboard could not open and
 * a screen reader had nothing to attach to: the row simply had one control
 * fewer, unexplained.
 *
 * `aria-disabled`, not the `disabled` attribute: a truly disabled button takes
 * no focus and fires no pointer events, so it would announce as unavailable and
 * then refuse to open the tooltip that says WHY — the same dead end in a
 * different shape. This one is reachable, announces its reason as its name,
 * opens the tooltip on focus as well as hover, and does nothing when pressed
 * because there is nothing wired to it.
 */
export const LockedTableActions = ({
  message,
  className
}: LockedTableActionsProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-disabled="true"
            aria-label={message}
            className={cn(
              'border-border bg-muted flex size-9 items-center justify-center rounded-md border',
              // Reachable is half the fix: a `border` over a `bg-muted` can
              // swallow the browser's default outline entirely, and the other
              // two cells in this table carry the same ring.
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              className
            )}
          >
            <LockIcon size={14} className="text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">{message}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
