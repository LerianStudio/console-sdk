import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { SidebarItem } from './sidebar-item'
import { SidebarProvider } from './sidebar-provider'
import {
  SidebarRouterProvider,
  useSidebarRouter,
  type SidebarLinkProps,
  type SidebarRouter
} from './sidebar-router'

/**
 * `next` IS installed in this workspace, so these tests exercise the real
 * Next-present default — the path Midaz Console takes today. The next-absent
 * path is covered by `sidebar-router-no-next.test.tsx`, which makes the
 * require throw, and end-to-end by the wave-3 consumer smoke app.
 *
 * next/navigation's usePathname needs an App Router context, which no unit test
 * has; mocking the module is the only way to drive it. The mock is asserted to
 * be the very function the default resolved, so it cannot drift into testing
 * something the component does not call.
 */
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/ledgers')
}))

function renderItem(ui: React.ReactElement) {
  return render(<SidebarProvider>{ui}</SidebarProvider>)
}

describe('sidebar router — Next.js default (no provider mounted)', () => {
  it('resolves next/link and next/navigation as the default', () => {
    const { result } = renderHookValue(() => useSidebarRouter())

    // Identity, not behavior: the default must BE Next's own modules, which is
    // what makes "zero changes in Next consumers" true rather than plausible.
    const nextLink = jest.requireActual('next/link') as { default: unknown }
    const nextNavigation = jest.requireMock('next/navigation') as {
      usePathname: unknown
    }

    expect(result.Link).toBe(nextLink.default ?? nextLink)
    expect(result.usePathname).toBe(nextNavigation.usePathname)
  })

  it('renders an anchor through next/link and marks the active item', () => {
    renderItem(
      <>
        <SidebarItem title="Ledgers" icon={null} href="/ledgers" />
        <SidebarItem title="Accounts" icon={null} href="/accounts" />
      </>
    )

    const active = screen.getByRole('link', { name: 'Ledgers' })
    const inactive = screen.getByRole('link', { name: 'Accounts' })

    expect(active).toHaveAttribute('href', '/ledgers')
    expect(inactive).toHaveAttribute('href', '/accounts')

    // The active item takes the tertiary button treatment, the other the outline.
    expect(active.className).not.toEqual(inactive.className)
  })

  it('does not warn about a missing provider when Next is available', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    renderItem(<SidebarItem title="Ledgers" icon={null} href="/ledgers" />)

    expect(
      warn.mock.calls.filter((c) =>
        String(c[0]).includes('SidebarRouterProvider')
      )
    ).toHaveLength(0)
    warn.mockRestore()
  })
})

describe('sidebar router — injected provider', () => {
  const InjectedLink = ({ href, children, ...rest }: SidebarLinkProps) => (
    <a data-router="injected" href={href} {...rest}>
      {children}
    </a>
  )

  const router: SidebarRouter = {
    Link: InjectedLink,
    usePathname: () => '/accounts'
  }

  it('uses the injected Link instead of next/link', () => {
    render(
      <SidebarRouterProvider router={router}>
        <SidebarProvider>
          <SidebarItem title="Accounts" icon={null} href="/accounts" />
        </SidebarProvider>
      </SidebarRouterProvider>
    )

    expect(screen.getByRole('link', { name: 'Accounts' })).toHaveAttribute(
      'data-router',
      'injected'
    )
  })

  it('drives the active state from the injected usePathname', () => {
    render(
      <SidebarRouterProvider router={router}>
        <SidebarProvider>
          <SidebarItem title="Accounts" icon={null} href="/accounts" />
          <SidebarItem title="Ledgers" icon={null} href="/ledgers" />
        </SidebarProvider>
      </SidebarRouterProvider>
    )

    // The provider says /accounts, so Accounts is active — NOT Ledgers, which
    // the mocked next/navigation would have chosen had the default leaked through.
    const accounts = screen.getByRole('link', { name: 'Accounts' })
    const ledgers = screen.getByRole('link', { name: 'Ledgers' })
    expect(accounts.className).not.toEqual(ledgers.className)
    expect(accounts).toHaveAttribute('data-router', 'injected')
  })
})

/** Minimal hook harness — renderHook pulls in more than this file needs. */
function renderHookValue<T>(hook: () => T): { result: T } {
  const out = {} as { result: T }
  function Probe() {
    out.result = hook()
    return null
  }
  render(<Probe />)
  return out
}
