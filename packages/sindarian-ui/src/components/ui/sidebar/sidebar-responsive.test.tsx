import '@testing-library/jest-dom'
import React from 'react'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Home } from 'lucide-react'
import {
  SidebarContent,
  SidebarGroup,
  SidebarItem,
  SidebarProvider,
  SidebarRoot,
  SidebarTrigger,
  useSidebar
} from '.'

/**
 * THE SIDEBAR ATE THE PHONE.
 *
 * `SidebarRoot` painted `w-[244px]` (or `w-[72px]` collapsed) with no viewport
 * awareness at all, in a flex row next to the page content. At 390px that is
 * 63% of the screen permanently spent on navigation, and the content beside it
 * got 146px. There was no way to dismiss it: `SidebarExpandButton` only shrinks
 * the rail to 72px, which is still 18% of the viewport and still there.
 *
 * Below 768px the rail is replaced by an overlay drawer — the shadcn sidebar
 * pattern this kit already resembles — over the kit's own `Sheet`, so Escape,
 * the backdrop, the focus trap and returning focus to the opener are Radix
 * Dialog's and not re-implemented here.
 *
 * jsdom ships no `matchMedia`, following the same stub `theme-provider.test.tsx`
 * uses next door, so `isMobile` is driven from the query the provider asks for
 * rather than from a real viewport.
 */
const MOBILE_QUERY = '(max-width: 767px)'

let matches = false
const listeners = new Set<() => void>()

const setViewport = (mobile: boolean) => {
  matches = mobile
  act(() => {
    listeners.forEach((listener) => listener())
  })
}

beforeEach(() => {
  matches = false
  listeners.clear()
  // The rail's collapsed state is persisted, and a test that toggles it would
  // otherwise decide the starting layout of every test after it.
  localStorage.clear()
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    // A GETTER, not a value. The provider keeps the MediaQueryList it was
    // handed and reads `.matches` again on every change event; a snapshot
    // taken at construction reports the viewport the page loaded at, forever.
    get matches() {
      return query === MOBILE_QUERY ? matches : false
    },
    media: query,
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
    onchange: null
  }))
})

const Nav = () => (
  <SidebarProvider>
    <SidebarTrigger />
    <SidebarRoot className="h-full" data-tour="midaz-sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarItem title="Home" icon={<Home />} href="/" />
        </SidebarGroup>
      </SidebarContent>
    </SidebarRoot>
  </SidebarProvider>
)

const wrapper = ({ children }: React.PropsWithChildren) => (
  <SidebarProvider>{children}</SidebarProvider>
)

describe('SidebarProvider viewport state', () => {
  it('defaults isMobile to false, so the server renders the rail', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper })

    expect(result.current.isMobile).toBe(false)
  })

  it('reports isMobile once the narrow query matches', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper })

    setViewport(true)
    expect(result.current.isMobile).toBe(true)
  })

  it('starts with the drawer closed', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper })

    expect(result.current.openMobile).toBe(false)
  })

  it('opens and closes the drawer through setOpenMobile', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper })

    setViewport(true)
    act(() => result.current.setOpenMobile(true))
    expect(result.current.openMobile).toBe(true)

    act(() => result.current.setOpenMobile(false))
    expect(result.current.openMobile).toBe(false)
  })

  it('closes the drawer when the viewport grows back to a rail', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper })

    setViewport(true)
    act(() => result.current.setOpenMobile(true))

    setViewport(false)
    expect(result.current.openMobile).toBe(false)
  })

  it('never reports a collapsed rail while the drawer is the layout', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper })

    act(() => result.current.toggleSidebar())
    expect(result.current.isCollapsed).toBe(true)

    // A 244px drawer showing icon-only items would be the worst of both.
    setViewport(true)
    expect(result.current.isCollapsed).toBe(false)
  })

  it('survives an environment with no matchMedia at all', () => {
    // @ts-expect-error deliberately removing the API the guard is for
    delete window.matchMedia

    const { result } = renderHook(() => useSidebar(), { wrapper })
    expect(result.current.isMobile).toBe(false)
  })
})

describe('SidebarRoot widths', () => {
  it('takes its expanded width from a CSS variable a consumer can override', () => {
    const { container } = render(<Nav />)

    expect(container.querySelector('[data-slot="sidebar-root"]')).toHaveClass(
      'w-[var(--sidebar-width)]'
    )
  })

  it('takes its collapsed width from a CSS variable too', () => {
    const Collapsed = () => {
      const { toggleSidebar, isCollapsed } = useSidebar()
      return (
        <>
          <button type="button" onClick={toggleSidebar}>
            toggle
          </button>
          <SidebarRoot data-collapsed={isCollapsed} />
        </>
      )
    }

    const { container } = render(
      <SidebarProvider>
        <Collapsed />
      </SidebarProvider>
    )

    return userEvent.click(screen.getByText('toggle')).then(() => {
      expect(container.querySelector('[data-slot="sidebar-root"]')).toHaveClass(
        'w-[var(--sidebar-width-collapsed)]'
      )
    })
  })

  it('declares both widths in the stylesheet so the default survives', () => {
    // The classes above name a variable; without a declaration behind it the
    // rail computes to `width: auto` and the whole geometry is gone.
    const css = readFileSync(
      resolve(__dirname, '..', '..', '..', 'globals.css'),
      'utf8'
    )

    expect(css).toMatch(/--sidebar-width:\s*244px;/)
    expect(css).toMatch(/--sidebar-width-collapsed:\s*72px;/)
  })
})

describe('SidebarRoot below 768px', () => {
  it('renders no inline rail at all', () => {
    const { container } = render(<Nav />)
    expect(container.querySelector('[data-slot="sidebar-root"]')).toBeTruthy()

    setViewport(true)
    expect(container.querySelector('[data-slot="sidebar-root"]')).toBeNull()
  })

  it('shows the navigation in a drawer once the trigger is pressed', async () => {
    render(<Nav />)
    setViewport(true)

    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: /navigation/i }))
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })

  it('closes the drawer on Escape', async () => {
    render(<Nav />)
    setViewport(true)

    await userEvent.click(screen.getByRole('button', { name: /navigation/i }))
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull()
  })

  /**
   * ⛔ RADIX RESTORES FOCUS TO ITS OWN TRIGGER REF, AND THERE ISN'T ONE.
   *
   * `DialogContent` preventDefaults the focus scope's restore and calls
   * `triggerRef.current?.focus()` instead. The drawer is opened from provider
   * state rather than from a `SheetTrigger`, so that ref is null and closing
   * dropped focus onto `<body>` — a keyboard reader who opened the navigation,
   * changed their mind and pressed Escape was returned to the top of the
   * document with their place lost (SC 2.4.3).
   */
  it('returns focus to whatever opened the drawer', async () => {
    render(<Nav />)
    setViewport(true)

    const trigger = screen.getByRole('button', { name: /navigation/i })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')

    expect(document.activeElement).toBe(trigger)
  })

  it('keeps the consumer className and data attributes on the drawer nav', async () => {
    const { baseElement } = render(<Nav />)
    setViewport(true)

    await userEvent.click(screen.getByRole('button', { name: /navigation/i }))

    const nav = baseElement.querySelector('[data-slot="sidebar-root"]')
    expect(nav).toHaveClass('h-full')
    expect(nav).toHaveAttribute('data-tour', 'midaz-sidebar')
  })
})

describe('SidebarTrigger', () => {
  it('names itself in English with no props', () => {
    render(<Nav />)

    expect(
      screen.getByRole('button', { name: 'Open navigation' })
    ).toBeInTheDocument()
  })

  it('takes a translated name', () => {
    render(
      <SidebarProvider>
        <SidebarTrigger aria-label="Abrir navegação" />
      </SidebarProvider>
    )

    expect(
      screen.getByRole('button', { name: 'Abrir navegação' })
    ).toBeInTheDocument()
  })

  it('reports the drawer state through aria-expanded', async () => {
    render(<Nav />)
    setViewport(true)

    const trigger = screen.getByRole('button', { name: /navigation/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('points aria-controls at the drawer only while the drawer exists', async () => {
    const { baseElement } = render(<Nav />)
    setViewport(true)

    const trigger = screen.getByRole('button', { name: /navigation/i })
    // A reference to an element that is not in the DOM is what axe-core
    // reports as a CRITICAL aria-valid-attr-value; the closed drawer is
    // unmounted, so the attribute is absent rather than dangling.
    expect(trigger).not.toHaveAttribute('aria-controls')

    await userEvent.click(trigger)
    const controls = trigger.getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    expect(baseElement.querySelector(`#${CSS.escape(controls!)}`)).toBe(
      baseElement.querySelector('[data-slot="sidebar-root"]')
    )
  })
})
