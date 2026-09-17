'use client'

import React from 'react'
import { cva } from 'class-variance-authority'
import { SidebarContext, useSidebar } from './sidebar-provider'
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
   * What this rail becomes below 768px.
   *
   * - `'inline'` (default): nothing changes. The rail renders at every
   *   viewport exactly as it always has, and the reader's collapsed preference
   *   is untouched.
   * - `'drawer'`: the inline rail is not rendered below the breakpoint and the
   *   navigation moves into an overlay drawer that `SidebarTrigger` opens.
   *
   * ⛔ THE DEFAULT IS NOT A TASTE, IT IS A CONSUMER-SAFETY RULE. `SidebarTrigger`
   * is the only way back into the drawer and it must render inside
   * `SidebarProvider`. A consumer that has not placed one yet — which is every
   * consumer at the moment this shipped — would get a phone with NO navigation
   * rather than a rail that takes 63% of it, and that is strictly worse. Opt in
   * once there is somewhere to put the trigger.
   */
  mobile?: 'inline' | 'drawer'
  /**
   * The drawer's accessible name. A dialog needs one, and it is read out when
   * the drawer opens. Unused while `mobile` is `'inline'`.
   */
  mobileTitle?: string
}

/**
 * ⛔ BELOW 768px A RAIL IS NOT A LAYOUT — once a consumer opts in.
 *
 * The widths above are a fixed share of a flex row, so at 390px the expanded
 * rail took 63% of the screen and left the page 146px, and the only affordance
 * — `SidebarExpandButton` — shrinks it to 72px, which is still 18% and still
 * permanently on screen. There was nothing that removed it.
 *
 * With `mobile="drawer"` the rail is replaced below the breakpoint by an
 * overlay drawer. Escape, the backdrop click, the focus trap and returning
 * focus to whatever opened it are Radix Dialog's, through the kit's own
 * `Sheet`; none of that is re-implemented here.
 */
export const SidebarRoot = ({
  className,
  mobile = 'inline',
  mobileTitle = 'Navigation',
  ...props
}: SidebarRootProps) => {
  const context = useSidebar()
  const {
    isCollapsed,
    isMobile,
    openMobile,
    setOpenMobile,
    restoreDrawerFocus,
    sidebarId
  } = context

  if (!isMobile || mobile === 'inline') {
    return (
      <nav
        data-slot="sidebar-root"
        className={cn(sidebarVariants({ collapsed: isCollapsed }), className)}
        data-collapsed={isCollapsed}
        {...props}
      />
    )
  }

  return (
    /**
     * ⛔ THE COLLAPSE FLAG IS OVERRIDDEN HERE AND NOWHERE ELSE.
     *
     * `SidebarItem` and `SidebarGroupTitle` read it straight off the context
     * rather than off the DOM, so a rail collapsed on desktop would follow the
     * reader onto their phone and render an icon-only strip inside a 244px
     * overlay — the cost of both layouts and the benefit of neither. Scoping
     * the override to this subtree is what lets the provider keep reporting the
     * reader's real preference to an inline rail.
     */
    <SidebarContext.Provider
      value={{ ...context, isCollapsed: false, isDrawer: true }}
    >
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
          // ⛔ RADIX'S OWN RESTORE GOES NOWHERE HERE. `DialogContent`
          // preventDefaults the focus scope's restore and focuses the ref a
          // `SheetTrigger` would have filled; this drawer is opened from provider
          // state, so that ref is null and closing dropped focus onto `<body>`.
          // Running first means `composeEventHandlers` skips Radix's half.
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            restoreDrawerFocus()
          }}
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
    </SidebarContext.Provider>
  )
}
