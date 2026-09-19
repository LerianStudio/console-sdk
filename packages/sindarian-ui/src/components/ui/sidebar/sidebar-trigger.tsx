'use client'

import React from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '../icon-button'
import { useSidebar } from './sidebar-provider'

export type SidebarTriggerProps = React.ComponentProps<typeof IconButton>

/**
 * The control that opens the mobile drawer.
 *
 * Hidden from 768px up by default, because above it the rail is already on
 * screen and a second way to reach it is a second thing to explain; a consumer
 * that wants it everywhere passes its own display class.
 *
 * ⛔ THE BREAKPOINT IS IN PIXELS, AND `md:hidden` IS NOT A SPELLING OF IT.
 *
 * Whether the rail became a drawer is decided by `SIDEBAR_MOBILE_QUERY`, which
 * is `(max-width: 767px)` — pixels. `md:` is 48rem, and rem inside a MEDIA
 * QUERY resolves against the browser's default font size rather than anything
 * the page declares, so the two flip at different widths the moment a reader
 * changes that setting. At Chrome's "Small" (12px) `md:` turns over at 576px
 * while the drawer still turns over at 768px: every window between them showed
 * NO RAIL AND NO HAMBURGER, which is a console with no navigation at all.
 * Measured on product-console; the band is four of this package's own fixtures
 * in `scripts/measure-phone-shapes.mjs`. At "Very large" (20px) the same
 * mismatch runs the other way and 768–959px drew both.
 *
 * `min-[768px]:hidden` is the exact complement of that query, at every font
 * size, which is the property the harness enforces: one of the two, never
 * neither and never both.
 *
 * ⚠️ `aria-controls` IS SET ONLY WHILE THE DRAWER EXISTS. Radix unmounts the
 * dialog content when closed, and a reference to an element that is not in the
 * DOM is what axe-core reports as a CRITICAL `aria-valid-attr-value` — the same
 * defect the Autocomplete panel was repaired for (console-sdk#150). A toggle
 * with `aria-expanded="false"` and no `aria-controls` is complete on its own.
 */
export const SidebarTrigger = ({
  className,
  onClick,
  'aria-label': ariaLabel = 'Open navigation',
  ...props
}: SidebarTriggerProps) => {
  const { openMobile, setOpenMobile, sidebarId } = useSidebar()

  return (
    <IconButton
      type="button"
      variant="outline"
      data-slot="sidebar-trigger"
      aria-label={ariaLabel}
      aria-expanded={openMobile}
      aria-controls={openMobile ? sidebarId : undefined}
      className={cn('min-[768px]:hidden', className)}
      onClick={(event) => {
        onClick?.(event)
        setOpenMobile(!openMobile)
      }}
      {...props}
    >
      <Menu aria-hidden />
    </IconButton>
  )
}
