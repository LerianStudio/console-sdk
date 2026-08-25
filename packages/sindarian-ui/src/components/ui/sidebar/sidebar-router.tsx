'use client'

/**
 * Router injection for the sidebar's links.
 *
 * The sidebar needs exactly two things from a router: a component that renders
 * a client-side-navigating link, and a way to read the current pathname (for
 * the active item). Nothing else.
 *
 * Resolution order, per render:
 *   1. a mounted <SidebarRouterProvider> — what a Vite/TanStack Router app uses
 *   2. next/link + next/navigation, when the app runs under Next.js
 *   3. a plain <a> (full page loads) + a dev-only warning
 *
 * Step 2 is why a Next.js app needs no provider and no code change: the default
 * still routes through next/link exactly as the hard import used to.
 */
import * as React from 'react'

import { loadNextRouter } from './next-router.cjs'

/**
 * next/link's own options — every prop it accepts that is NOT a DOM anchor
 * attribute. Mirrored from next 16's `InternalLinkProps` so a Next.js call site
 * that passes any of them keeps compiling; they are forwarded untouched and
 * ignored by routers that have no use for them.
 *
 * `href` and `as` are narrowed to `string`: next also accepts a `UrlObject`,
 * but the sidebar builds its own hrefs and every other router in play takes a
 * string.
 *
 * next's `onMouseEnter`/`onTouchStart`/`onClick` are deliberately absent — they
 * are real anchor attributes and already come from `AnchorHTMLAttributes`.
 */
type RouterOnlyLinkProps = {
  /** @deprecated next v10: dynamic-route hrefs resolve automatically. */
  as?: string
  replace?: boolean
  scroll?: boolean
  /** Pages Router only. */
  shallow?: boolean
  passHref?: boolean
  prefetch?: boolean | 'auto' | null
  unstable_dynamicOnHover?: boolean
  /** Pages Router only. */
  locale?: string | false
  /** @deprecated next: removed in a future version. */
  legacyBehavior?: boolean
  onNavigate?: (event: { preventDefault: () => void }) => void
  transitionTypes?: string[]
}

/**
 * Props the sidebar passes to whatever Link it is given: the DOM anchor
 * attributes plus next/link's options.
 */
export type SidebarLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  href: string
  children?: React.ReactNode
} & RouterOnlyLinkProps

/** The full injection surface. Both members are required — a router that can
 *  link but not report its pathname would silently break the active state. */
export type SidebarRouter = {
  /** Renders a client-side-navigating link. */
  Link: React.ComponentType<SidebarLinkProps>
  /** Current pathname, e.g. `/ledgers/123`. Must re-render on navigation. */
  usePathname: () => string
}

const SidebarRouterContext = React.createContext<SidebarRouter | null>(null)

export type SidebarRouterProviderProps = React.PropsWithChildren<{
  router: SidebarRouter
}>

/**
 * Teaches the sidebar how to navigate. Mount it above any sidebar in an app
 * that is not Next.js:
 *
 *   <SidebarRouterProvider router={{ Link: MyLink, usePathname: useMyPathname }}>
 *
 * Keep `router` referentially stable (module constant or useMemo): `usePathname`
 * is called as a hook, so swapping the object for a different implementation
 * mid-tree would change hook identity.
 */
export function SidebarRouterProvider({
  router,
  children
}: SidebarRouterProviderProps) {
  return (
    <SidebarRouterContext.Provider value={router}>
      {children}
    </SidebarRouterContext.Provider>
  )
}

/**
 * Resolve Next's router once, at module load, so the returned object — and
 * therefore `usePathname`'s identity — is stable across renders.
 *
 * The resolution itself lives in `next-router.cjs`: it needs a literal
 * `require`, which exists in the CommonJS output but not in the ESM one. That
 * file is CommonJS in both builds, so a Next.js consumer keeps client-side
 * navigation whichever format its bundler picks. See the file for the details.
 */
const NEXT_ROUTER = loadNextRouter()

let warned = false

/**
 * The router-only props, as a runtime key set. Typed `Record<keyof
 * RouterOnlyLinkProps, true>` so it is exhaustive BY CONSTRUCTION: adding a
 * prop to the type without listing it here is a compile error, and the two can
 * never drift. Forwarding any of these to a DOM `<a>` earns a React
 * unknown-attribute warning.
 */
const ROUTER_ONLY_PROPS: Record<keyof RouterOnlyLinkProps, true> = {
  as: true,
  replace: true,
  scroll: true,
  shallow: true,
  passHref: true,
  prefetch: true,
  unstable_dynamicOnHover: true,
  locale: true,
  legacyBehavior: true,
  onNavigate: true,
  transitionTypes: true
}

/** Last resort: a real link that costs a full page load. Warns once, in dev. */
function PlainLink({ href, children, ...rest }: SidebarLinkProps) {
  if (!warned && process.env.NODE_ENV !== 'production') {
    warned = true
    console.warn(
      'sindarian-ui: sidebar links are falling back to plain <a>, so every ' +
        'navigation reloads the page and no item will show as active. Mount ' +
        '<SidebarRouterProvider router={{ Link, usePathname }}> above the ' +
        "sidebar with your router's equivalents."
    )
  }

  const anchorProps: Record<string, unknown> = { ...rest }
  for (const key of Object.keys(ROUTER_ONLY_PROPS)) delete anchorProps[key]

  return (
    <a href={href} {...anchorProps}>
      {children}
    </a>
  )
}

const FALLBACK_ROUTER: SidebarRouter = {
  Link: PlainLink,
  // No router, no truth. Returning '' marks nothing active rather than
  // guessing from location.pathname, which would go stale on the first
  // client-side navigation anyway.
  usePathname: () => ''
}

/** The router the sidebar should use: injected, else Next, else plain anchors. */
export function useSidebarRouter(): SidebarRouter {
  return (
    React.useContext(SidebarRouterContext) ?? NEXT_ROUTER ?? FALLBACK_ROUTER
  )
}
