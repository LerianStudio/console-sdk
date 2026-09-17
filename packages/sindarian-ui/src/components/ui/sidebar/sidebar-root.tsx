'use client'

import React from 'react'
import { cva } from 'class-variance-authority'
import { useSidebar } from './sidebar-provider'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTitle } from '../sheet'

/**
 * ⛔ THE WIDTHS ARE TOKENS, NOT LITERALS.
 *
 * They were `w-[72px]` and `w-[244px]`, which a consumer could only override by
 * winning a specificity argument with `cn`. `--sidebar-width` and
 * `--sidebar-width-collapsed` are declared in `globals.css`, so the default
 * still ships with the stylesheet, and a consumer re-points either one from
 * anywhere above the rail — `className="[--sidebar-width:280px]"` on the rail
 * itself, or a rule on a layout wrapper.
 */
const sidebarVariants = cva(
  'group/sidebar shadow-sidebar relative flex flex-col transition-[width] duration-300 ease-in-out',
  {
    variants: {
      collapsed: {
        true: 'w-[var(--sidebar-width-collapsed)]',
        false: 'w-[var(--sidebar-width)]'
      }
    },
    defaultVariants: {
      collapsed: false
    }
  }
)

export type SidebarRootProps = React.ComponentProps<'nav'> & {
  /**
   * The drawer's accessible name below 768px. A dialog needs one, and it is
   * read out when the drawer opens.
   */
  mobileTitle?: string
}

/**
 * ⛔ BELOW 768px A RAIL IS NOT A LAYOUT.
 *
 * The widths above are a fixed share of a flex row, so at 390px the expanded
 * rail took 63% of the screen and left the page 146px, and the only affordance
 * — `SidebarExpandButton` — shrinks it to 72px, which is still 18% and still
 * permanently on screen. There was nothing that removed it.
 *
 * So below the breakpoint it becomes an overlay drawer and the inline rail is
 * not rendered at all. Escape, the backdrop click, the focus trap and returning
 * focus to whatever opened it are Radix Dialog's, through the kit's own
 * `Sheet`; none of that is re-implemented here. `SidebarTrigger` is what opens
 * it.
 */
export const SidebarRoot = ({
  className,
  mobileTitle = 'Navigation',
  ...props
}: SidebarRootProps) => {
  const { isCollapsed, isMobile, openMobile, setOpenMobile, sidebarId } =
    useSidebar()

  const rail = (
    <nav
      data-slot="sidebar-root"
      className={cn(sidebarVariants({ collapsed: isCollapsed }), className)}
      data-collapsed={isCollapsed}
      {...props}
    />
  )

  if (!isMobile) {
    return rail
  }

  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent
        side="left"
        // The Sheet's own paddings are built for a form panel; a rail brings
        // its own. `max-w-full` so a consumer widening `--sidebar-width` past
        // the viewport still cannot push the drawer off screen.
        className="w-[var(--sidebar-width)] max-w-full gap-0 p-0"
        // The drawer has a title and no description; without this Radix warns
        // about the missing `aria-describedby` target on every open.
        aria-describedby={undefined}
      >
        {/* Named for a screen reader, silent for everyone else: the rail's own
            header is a "back to products" link, not a heading. */}
        <SheetTitle className="sr-only">{mobileTitle}</SheetTitle>
        <nav
          id={sidebarId}
          data-slot="sidebar-root"
          data-mobile="true"
          data-collapsed={false}
          className={cn(
            sidebarVariants({ collapsed: false }),
            'h-full w-full shadow-none',
            className
          )}
          {...props}
        />
      </SheetContent>
    </Sheet>
  )
}
