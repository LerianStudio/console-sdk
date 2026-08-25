import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { SidebarItem } from './sidebar-item'
import { SidebarProvider } from './sidebar-provider'
import { SidebarRouterProvider } from './sidebar-router'

/**
 * The next-ABSENT world, simulated the only way that is faithful: make the
 * require throw exactly as an unresolved module does. The mock factories are
 * hoisted above the imports, so the router module's one-time resolution runs
 * against them and lands in its catch — the same state a Vite app reaches.
 *
 * The wave-3 smoke app proves the same thing for real, with next genuinely
 * uninstalled.
 */
jest.mock('next/link', () => {
  throw new Error("Cannot find module 'next/link'")
})
jest.mock('next/navigation', () => {
  throw new Error("Cannot find module 'next/navigation'")
})

let warn: jest.SpyInstance

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
})

const providerWarnings = () =>
  warn.mock.calls
    .map((c) => String(c[0]))
    .filter((m) => m.includes('SidebarRouterProvider'))

describe('sidebar router — Next absent, no provider', () => {
  // Runs first on purpose: the warning is deliberately once-per-process, so a
  // later test could not observe it again.
  it('falls back to a plain anchor and warns once, naming the provider', () => {
    render(
      <SidebarProvider>
        <SidebarItem title="Ledgers" icon={null} href="/ledgers" />
        <SidebarItem title="Accounts" icon={null} href="/accounts" />
      </SidebarProvider>
    )

    // Still a real, working link — degraded to a full page load, not broken.
    expect(screen.getByRole('link', { name: 'Ledgers' })).toHaveAttribute(
      'href',
      '/ledgers'
    )
    expect(screen.getByRole('link', { name: 'Accounts' })).toHaveAttribute(
      'href',
      '/accounts'
    )

    // Two items rendered, one warning: it does not repeat per link.
    expect(providerWarnings()).toHaveLength(1)
    expect(providerWarnings()[0]).toContain('plain <a>')
  })

  it('strips every next/link option before it reaches the DOM anchor', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <SidebarProvider>
        <SidebarItem
          title="Ledgers"
          icon={null}
          href="/ledgers"
          // The full next/link option surface. React warns on every one of
          // these that reaches an <a>, so a missed key fails this test loudly.
          as="/ledgers"
          replace
          scroll={false}
          shallow
          passHref
          prefetch="auto"
          unstable_dynamicOnHover
          locale="pt-BR"
          legacyBehavior
          onNavigate={() => {}}
          transitionTypes={['slide-in']}
          // A genuine anchor attribute, which must survive.
          target="_blank"
        />
      </SidebarProvider>
    )

    const link = screen.getByRole('link', { name: 'Ledgers' })

    // Nothing router-specific leaked onto the element.
    for (const attr of [
      'as',
      'replace',
      'scroll',
      'shallow',
      'passHref',
      'prefetch',
      'locale',
      'legacyBehavior',
      'transitionTypes',
      'unstable_dynamicOnHover',
      'onNavigate'
    ]) {
      expect(link).not.toHaveAttribute(attr)
      expect(link).not.toHaveAttribute(attr.toLowerCase())
    }

    // ...and the real anchor attributes did survive.
    expect(link).toHaveAttribute('href', '/ledgers')
    expect(link).toHaveAttribute('target', '_blank')

    // React reports unknown props on a DOM element through console.error.
    expect(
      error.mock.calls
        .map((c) => String(c[0]))
        .filter((m) => /prop|attribute/i.test(m))
    ).toEqual([])
    error.mockRestore()
  })

  it('marks nothing active rather than guessing a pathname', () => {
    render(
      <SidebarProvider>
        <SidebarItem title="Ledgers" icon={null} href="/ledgers" />
        <SidebarItem title="Accounts" icon={null} href="/accounts" />
      </SidebarProvider>
    )

    expect(screen.getByRole('link', { name: 'Ledgers' }).className).toEqual(
      screen.getByRole('link', { name: 'Accounts' }).className
    )
  })
})

describe('sidebar router — Next absent, provider mounted', () => {
  it('uses the injected router and its pathname', () => {
    render(
      <SidebarRouterProvider
        router={{
          Link: ({ href, children, ...rest }) => (
            <a data-router="injected" href={href} {...rest}>
              {children}
            </a>
          ),
          usePathname: () => '/ledgers'
        }}
      >
        <SidebarProvider>
          <SidebarItem title="Ledgers" icon={null} href="/ledgers" />
          <SidebarItem title="Accounts" icon={null} href="/accounts" />
        </SidebarProvider>
      </SidebarRouterProvider>
    )

    const active = screen.getByRole('link', { name: 'Ledgers' })
    const inactive = screen.getByRole('link', { name: 'Accounts' })

    expect(active).toHaveAttribute('data-router', 'injected')
    expect(inactive).toHaveAttribute('data-router', 'injected')
    // The injected pathname, not a guess, decides which item is active.
    expect(active.className).not.toEqual(inactive.className)
  })
})
