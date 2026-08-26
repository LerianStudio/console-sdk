'use client'

/**
 * DetailPanel — the console's right-side slide-over for inspecting and editing a
 * single record without leaving the list behind it. Built on Sheet (a Radix
 * Dialog) with three structural slots:
 *
 *   - a STICKY header: the record title, an optional actions cluster, and a
 *     close affordance, pinned to the top while the body scrolls;
 *   - a SCROLLABLE body carrying `children`;
 *   - an optional STICKY footer for the primary/secondary actions
 *     (e.g. Cancel / Save), pinned to the bottom.
 *
 *   <DetailPanel
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="Transaction txn_8f2a"
 *     footer={<>
 *       <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
 *       <Button onClick={save}>Save</Button>
 *     </>}
 *   >
 *     …long body…
 *   </DetailPanel>
 *
 * Controlled only: drive `open` from props and reflect dismissals via
 * `onOpenChange`. `side` defaults to "right".
 */
import * as React from 'react'
import { X } from 'lucide-react'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export type DetailPanelProps = {
  /** Controlled open state. */
  open: boolean
  /** Reflects every dismissal (overlay, Esc, close button) and programmatic toggle. */
  onOpenChange: (open: boolean) => void
  /** Header title; also the accessible dialog name. */
  title: React.ReactNode
  /** Edge the panel slides in from. Defaults to "right". */
  side?: 'right' | 'left'
  /** Optional header actions, placed left of the close button. */
  actions?: React.ReactNode
  /** Optional sticky footer (e.g. Cancel / Save). */
  footer?: React.ReactNode
  /** Accessible label for the close button. Defaults to "Close". */
  closeLabel?: string
  /** Scrollable body content. */
  children?: React.ReactNode
  className?: string
}

/**
 * The slide-over inspector. The header and footer stay pinned; only the body
 * scrolls. Sheet already renders an overlay, focus trap, and Esc/overlay
 * dismissal — we suppress its built-in corner close button (`[&>button.absolute]`)
 * and provide our own inside the header so the layout stays deliberate.
 */
export function DetailPanel({
  open,
  onOpenChange,
  title,
  side = 'right',
  actions,
  footer,
  closeLabel = 'Close',
  children,
  className
}: DetailPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          // Reset Sheet's padding/gap and hide its built-in close button; we
          // own the three-slot layout and the header close affordance here.
          'flex flex-col gap-0 overflow-hidden p-0',
          '[&>button.absolute]:hidden',
          className
        )}
      >
        {/* Sticky header — title + optional actions + close. */}
        <header className="border-border bg-card sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b px-6 py-4">
          <SheetTitle className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
            {title}
          </SheetTitle>
          <div className="flex shrink-0 items-center gap-1.5">
            {actions}
            <SheetClose
              data-slot="detail-panel-close"
              className="ring-offset-background focus:ring-ring rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:outline-none disabled:pointer-events-none"
              aria-label={closeLabel}
            >
              <X className="size-4" aria-hidden />
            </SheetClose>
          </div>
        </header>

        {/* Scrollable body. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-6 py-5">{children}</div>
        </div>

        {/* Sticky footer — actions. */}
        {footer ? (
          <footer className="border-border bg-card sticky bottom-0 z-10 flex shrink-0 flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
