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
 * `md:hidden` by default because above 768px the rail is already on screen and
 * a second way to reach it is a second thing to explain; a consumer that wants
 * it everywhere passes its own display class.
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
      className={cn('md:hidden', className)}
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
