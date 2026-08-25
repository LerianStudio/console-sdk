'use client'

/**
 * AppShell — the console frame: a sidebar rail, an optional sticky header row,
 * and a centered, scrollable content column. This is the whole screen, not a
 * fragment, so it deliberately OWNS the SidebarProvider — the consumer drops a
 * sindarian-ui sidebar (`SidebarRoot` + its parts) into `sidebar` and a
 * `SidebarExpandButton` into `header`, and the collapse behavior comes free,
 * no extra wrapper required.
 *
 * Landmark contract (the a11y-correct frame):
 *   SidebarProvider
 *     div (the shell ROW — carries `className`)
 *       a.sr-only (skip link, if labelled)    // FIRST focusable in the document,
 *                                             //   targets <main> — bypasses the nav
 *       {sidebar}
 *       div[data-slot=sidebar-inset]          // the inset COLUMN — a plain div
 *         header (banner, if given)           // SIBLING of <main>, not nested
 *         main#<id> tabIndex=-1               // the ONE main: skip-linkable + ref-able
 *           div (centered content container) → {children}
 *
 * The skip link is the FIRST child inside the shell row — before the sidebar —
 * so a keyboard user's very first Tab lands on it and Enter jumps past the
 * entire nav to the content <main>. That is the whole point of WCAG 2.4.1
 * "Bypass Blocks": a skip link placed AFTER the nav would be reached only after
 * tabbing through every nav item, defeating its purpose. The inset column is a
 * <div>, not a <main>, so AppShell can own the single inner <main> for the
 * content. The page header passed via `header` becomes a top-level banner
 * SIBLING of <main> (one banner); a PageHeader rendered inside `children` lands
 * inside <main> and is content, not a top-level landmark.
 *
 * Client by construction: it calls React.useId() to wire the skip link to the
 * content <main>, and forwards a ref to that <main> so a consumer can focus it
 * on route change — both are client concerns, hence the "use client" directive.
 */
import * as React from 'react'

import { SidebarProvider } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export type AppShellProps = {
  sidebar?: React.ReactNode
  /**
   * App-bar CONTENT, rendered INSIDE the shell's <header> banner landmark. Pass
   * banner content only — the sidebar trigger, a screen title, header actions.
   *
   * Do NOT pass an element that renders its OWN <header>/landmark (e.g.
   * <PageHeader>, which is itself a <header>). Nesting a <header> in this banner
   * produces a SECOND banner — a <header> is not sectioning content, so the
   * inner one stays body-scoped — which violates WCAG's at-most-one-banner rule.
   * Page-level title blocks (<PageHeader>) belong in `children`, where they land
   * inside <main> and are correctly page content, not a top-level landmark.
   */
  header?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  /**
   * When set, renders a "skip to content" link as the FIRST focusable element;
   * activating it jumps focus to the content <main>. Omit it and no skip link
   * renders. The link/target wiring (the <main> id) is internal — generated with
   * React.useId() so it is stable and unique without a required id prop.
   */
  skipToContentLabel?: string
}

export const AppShell = React.forwardRef<HTMLElement, AppShellProps>(
  function AppShell(
    {
      sidebar,
      header,
      children,
      className,
      contentClassName,
      skipToContentLabel
    },
    ref
  ) {
    // The content <main> id — wires the skip link to its target and gives the
    // <main> a stable, focusable anchor. Internal: no consumer-facing id prop.
    const mainId = React.useId()

    // sindarian-ui's SidebarProvider is context-only (it renders no DOM and
    // takes no className), so the shell owns the flex row itself and `className`
    // lands on it — the same element the legacy provider's className reached.
    return (
      <SidebarProvider>
        {/* h-svh (not min-h-svh): the shell row is exactly one viewport tall, so
            the content <main> owns scrolling instead of the document. */}
        <div className={cn('flex h-svh w-full overflow-hidden', className)}>
          {skipToContentLabel ? (
            <a
              href={`#${mainId}`}
              className="focus:bg-background focus:text-foreground sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:px-3 focus:py-2 focus:shadow"
            >
              {skipToContentLabel}
            </a>
          ) : null}
          {sidebar}
          <div
            data-slot="sidebar-inset"
            className="bg-background relative flex w-full min-w-0 flex-1 flex-col"
          >
            {header ? (
              <header className="border-border bg-background sticky top-0 z-10 flex items-center gap-3 border-b px-6 py-3">
                {header}
              </header>
            ) : null}
            <main
              id={mainId}
              ref={ref}
              tabIndex={-1}
              // min-h-0 lets this flex child shrink below its content height —
              // without it `flex-1` keeps min-height:auto and nothing scrolls.
              className="min-h-0 flex-1 overflow-y-auto outline-none"
            >
              <div
                className={cn(
                  'mx-auto w-full max-w-7xl px-6 py-8 lg:px-8',
                  contentClassName
                )}
              >
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    )
  }
)
AppShell.displayName = 'AppShell'
