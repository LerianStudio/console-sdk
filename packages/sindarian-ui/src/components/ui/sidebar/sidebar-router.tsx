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

/**
 * Props the sidebar passes to whatever Link it is given. Deliberately a
 * superset of the anchor attributes: `prefetch`/`replace`/`scroll` are
 * next/link's own knobs, kept so a Next.js call site that passes them keeps
 * compiling. They are forwarded untouched and ignored by routers that have no
 * use for them.
 */
export type SidebarLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  href: string
  children?: React.ReactNode
  prefetch?: boolean | null
  replace?: boolean
  scroll?: boolean
}

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
 * Resolve Next's router once, at module load.
 *
 * `require` with a literal specifier, wrapped in try/catch, is the one form
 * that behaves correctly in BOTH worlds, which is why it is not a dynamic
 * `import()` or a computed specifier:
 *  - Next (webpack/turbopack) statically sees the literal and bundles
 *    next/link into the client chunk, so navigation stays client-side;
 *  - Vite/rolldown cannot resolve it when `next` is absent, and instead of
 *    failing the build it drops through to the catch — verified against a
 *    consumer build and its browser-side runtime.
 * A dynamic `import()` fails the Vite build outright; a computed specifier
 * hides it from Next too, which would silently downgrade the Console to full
 * page loads.
 *
 * Resolved once so the returned object — and therefore `usePathname`'s
 * identity — is stable across renders.
 */
function loadNextRouter(): SidebarRouter | null {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const link: unknown = require('next/link')
    const navigation: unknown = require('next/navigation')
    /* eslint-enable @typescript-eslint/no-require-imports */

    const Link = ((link as { default?: unknown })?.default ?? link) as
      React.ComponentType<SidebarLinkProps> | undefined
    const usePathname = (navigation as { usePathname?: unknown })
      ?.usePathname as (() => string) | undefined

    if (!Link || typeof usePathname !== 'function') return null
    return { Link, usePathname }
  } catch {
    return null
  }
}

const NEXT_ROUTER = loadNextRouter()

let warned = false

/** Last resort: a real link that costs a full page load. Warns once, in dev. */
function PlainLink({
  href,
  children,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  ...rest
}: SidebarLinkProps) {
  if (!warned && process.env.NODE_ENV !== 'production') {
    warned = true
    console.warn(
      'sindarian-ui: sidebar links are falling back to plain <a>, so every ' +
        'navigation reloads the page and no item will show as active. Mount ' +
        '<SidebarRouterProvider router={{ Link, usePathname }}> above the ' +
        "sidebar with your router's equivalents."
    )
  }

  return (
    <a href={href} {...rest}>
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
