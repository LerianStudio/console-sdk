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
 * still ships with the stylesheet, and a consumer re-points either one with
 * `className="[--sidebar-width:280px]"` ON THE RAIL, which moves the rail and
 * the mobile drawer together (see `liftWidthOverrides` below), or with a rule
 * on `:root`/`html`.
 *
 * ⚠️ A DECLARATION ON A REACT-TREE ANCESTOR REACHES THE RAIL AND NOT THE
 * DRAWER. Custom properties inherit down the DOM tree, and the drawer is
 * portalled to `document.body`, so a layout wrapper is not an ancestor of it.
 * `:root` is, which is why it is named above and a wrapper is not.
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

/**
 * Tailwind arbitrary-property classes that re-point the sidebar geometry, e.g.
 * `[--sidebar-width:320px]` or `[--sidebar-width-collapsed:88px]`.
 *
 * ⚠️ ANCHORED TO A CLASS BOUNDARY, WHICH IS THE WHOLE POINT OF THE LOOKBEHIND.
 * Unanchored it also matched the tail of `md:[--sidebar-width:320px]` and
 * lifted it with the prefix stripped — an override a consumer scoped to
 * ≥768px, applied unconditionally to the drawer that only exists below it.
 */
const WIDTH_OVERRIDE = /(?<=^|\s)\[--sidebar-width(?:-collapsed)?:[^\]]+\]/g

/**
 * ⛔ THE ONE PART OF THE CONSUMER'S className THAT HAS TO CROSS THE PORTAL.
 *
 * `SheetContent` mounts through `SheetPortal` into `document.body`, and custom
 * properties inherit down the DOM tree rather than the React tree. So the
 * documented override — a class on the rail — set `--sidebar-width` on an
 * element the drawer is not a descendant of, and the whole className that DOES
 * travel lands on the inner `<nav>`, which is BELOW the element that reads the
 * variable. Measured in Chromium: rail 320px, drawer 244px. Following the
 * instruction handed to product-console produced a 280px rail on desktop and a
 * 244px drawer on a phone, silently.
 *
 * ⚠️ ONLY THE GEOMETRY TOKENS. The rest of a rail className is rail-shaped —
 * `h-full`, and the `data-[collapsed=false]:min-w-70` all eight console
 * sidebars pass — and putting that on the sheet would reinstate the
 * 280px-inside-a-244px-sheet overflow from the other side.
 */
function liftWidthOverrides(className?: string): string | undefined {
  return className?.match(WIDTH_OVERRIDE)?.join(' ')
}

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
  id,
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
      /* ⛔ ONLY IN DRAWER MODE, AND THERE IT IS NOT THE CALLER'S TO SET. The
         same id the drawer carries: the rail and the drawer are one navigation
         in two shapes, and the provider looks it up by id to put focus back
         into it when a growing viewport swaps one for the other. The two
         branches are exclusive, so it is never duplicated.

         On the default path there is no drawer and no swap, so nothing here
         needs an id and the caller's own is passed straight through — a
         consumer who opted into nothing gets the DOM it always had.

         AFTER the spread, not before it. Spread first, a caller that set `id`
         replaced this one and silently broke both things that read it. */
      <nav
        data-slot="sidebar-root"
        className={cn(sidebarVariants({ collapsed: isCollapsed }), className)}
        data-collapsed={isCollapsed}
        {...props}
        id={mobile === 'drawer' ? sidebarId : id}
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
          // the viewport still cannot push the drawer off screen. The lifted
          // override goes LAST so it re-points the variable this element reads.
          //
          // ⛔ THE `max-sm:` PAIR IS NOT A DUPLICATE. `SheetContent` grew a
          // phone step — `max-sm:w-full max-sm:px-4` — because a form panel at
          // two fifths of a 390px screen is unreadable. A NAVIGATION drawer is
          // the one panel that must not take it: 244px over a dimmed page is
          // the design, and full-bleed removes the tap-outside-to-close target
          // that every other way out of this drawer is an alternative to.
          // tailwind-merge drops a conflicting class only when the modifiers
          // match, so a bare `w-[…]` cannot reach `max-sm:w-full` and these two
          // tokens are what state the exemption. Measured: without them the
          // drawer is 390px wide with 16px of inset on a 390px phone.
          className={cn(
            'w-[var(--sidebar-width)] max-w-full gap-0 p-0 max-sm:w-[var(--sidebar-width)] max-sm:p-0',
            liftWidthOverrides(className)
          )}
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
            data-slot="sidebar-root"
            data-mobile="true"
            /* ⛔ NO `data-collapsed` HERE. The consumer className is forwarded
               verbatim, and all eight console sidebars pass
               `data-[collapsed=false]:min-w-70`; stamping the attribute armed
               it, giving the navigation a 280px min-width inside a 244px sheet.
               `min-width` resolves after `max-width`, so the sheet could not
               claw it back and the contents were 36px wider than the drawer.
               `data-mobile` already names this surface and a drawer is never
               collapsed, so the attribute had nothing left to say. */
            className={cn(
              sidebarVariants({ collapsed: false }),
              'h-full w-full shadow-none',
              className
            )}
            {...props}
            /* ⛔ AFTER THE SPREAD, AND NOT THE CALLER'S. This is the target of
               `SidebarTrigger`'s `aria-controls` and the handle the provider
               uses to put focus back into the navigation when the viewport
               grows. Spread first, a caller that set `id` replaced it and left
               a dangling `aria-controls` — which axe reports as a CRITICAL
               `aria-valid-attr-value` — and a focus restore that lands on
               `<body>`. Both silent. */
            id={sidebarId}
          />
        </SheetContent>
      </Sheet>
    </SidebarContext.Provider>
  )
}
