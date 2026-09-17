import '@testing-library/jest-dom'
import React from 'react'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import {
  act,
  render,
  renderHook,
  screen,
  waitFor
} from '@testing-library/react'
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

/**
 * The console's own shape: a consumer className carrying a rail-width rule, a
 * data attribute for the product tour, and no `mobile` prop unless a case sets
 * one. `min-w-70` is what all eight `src/components/sidebar/*.tsx` pass today.
 */
const Nav = ({ mobile }: { mobile?: 'inline' | 'drawer' }) => (
  <SidebarProvider>
    <SidebarTrigger />
    <SidebarRoot
      mobile={mobile}
      className="h-full data-[collapsed=false]:min-w-70"
      data-tour="midaz-sidebar"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarItem title="Home" icon={<Home />} href="/" />
        </SidebarGroup>
      </SidebarContent>
    </SidebarRoot>
  </SidebarProvider>
)

const Drawer = () => <Nav mobile="drawer" />

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

  /**
   * ⛔ THE COLLAPSE FLAG IS THE PROVIDER'S, AND A NARROW VIEWPORT DOES NOT TOUCH
   * IT. It used to be forced false whenever `isMobile`, which quietly changed
   * the rail for every consumer that had not asked for a drawer. The override
   * now lives in the drawer's own subtree, so a consumer left on `mobile="inline"`
   * keeps exactly the rail it has today, collapsed or not.
   */
  it('leaves the collapsed rail alone when the viewport narrows', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper })

    act(() => result.current.toggleSidebar())
    expect(result.current.isCollapsed).toBe(true)

    setViewport(true)
    expect(result.current.isCollapsed).toBe(true)
  })

  it('exposes the drawer state in both modes, so a consumer can drive its own', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper })

    setViewport(true)
    expect(result.current.isMobile).toBe(true)
    act(() => result.current.setOpenMobile(true))
    expect(result.current.openMobile).toBe(true)
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
    const { container } = render(<Drawer />)

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

/**
 * ⛔ THE DRAWER IS OPT-IN, AND THAT IS A CONSUMER-SAFETY RULE RATHER THAN A
 * TASTE.
 *
 * The kit's `SidebarTrigger` is the only way back into a drawer, and it must
 * render inside `SidebarProvider` — which the console mounts INSIDE each
 * `*-sidebar.tsx`, below its `<Header />`. So a console that merely bumps this
 * dependency cannot have a trigger yet, and a drawer-by-default would hand it a
 * phone with no navigation at all: strictly worse than the rail that eats the
 * screen. `mobile` defaults to `'inline'`, which is byte-for-byte today's
 * behaviour, and a consumer opts in once it has somewhere to put the trigger.
 */
describe('SidebarRoot in the default inline mode', () => {
  it('still renders the rail below 768px', () => {
    const { container } = render(<Nav />)

    setViewport(true)
    expect(container.querySelector('[data-slot="sidebar-root"]')).toBeTruthy()
  })

  it('mounts no drawer at all, so nothing can trap focus over the page', async () => {
    const { baseElement } = render(<Nav />)
    setViewport(true)

    await userEvent.click(screen.getByRole('button', { name: /navigation/i }))

    expect(baseElement.querySelector('[data-slot="sheet-content"]')).toBeNull()
    expect(baseElement.querySelector('[data-slot="sheet-overlay"]')).toBeNull()
  })

  it('keeps the rail collapsed below 768px if that is how the reader left it', async () => {
    localStorage.setItem('sidebar-collapsed', 'true')
    const { container } = render(<Nav />)
    const rail = () => container.querySelector('[data-slot="sidebar-root"]')

    // The stored preference arrives after hydration, not on the first paint.
    await waitFor(() =>
      expect(rail()).toHaveAttribute('data-collapsed', 'true')
    )

    setViewport(true)
    expect(rail()).toHaveAttribute('data-collapsed', 'true')
  })

  it('keeps the rail collapse control, which the drawer removes', async () => {
    const { container } = render(<Nav />)
    setViewport(true)

    expect(container.querySelector('[data-slot="sidebar-root"]')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /navigation/i })).toBeTruthy()
  })
})

describe('SidebarRoot in drawer mode below 768px', () => {
  it('renders no inline rail at all', () => {
    const { container } = render(<Drawer />)
    expect(container.querySelector('[data-slot="sidebar-root"]')).toBeTruthy()

    setViewport(true)
    expect(container.querySelector('[data-slot="sidebar-root"]')).toBeNull()
  })

  it('shows the navigation in a drawer once the trigger is pressed', async () => {
    render(<Drawer />)
    setViewport(true)

    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: /navigation/i }))
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })

  it('closes the drawer on Escape', async () => {
    render(<Drawer />)
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
    render(<Drawer />)
    setViewport(true)

    const trigger = screen.getByRole('button', { name: /navigation/i })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')

    expect(document.activeElement).toBe(trigger)
  })

  it('closes the drawer on a backdrop click', async () => {
    const { baseElement } = render(<Drawer />)
    setViewport(true)

    await userEvent.click(screen.getByRole('button', { name: /navigation/i }))
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()

    const overlay = baseElement.querySelector('[data-slot="sheet-overlay"]')!
    await userEvent.click(overlay)

    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull()
  })

  /**
   * ⛔ THE DRAWER MUST NOT ARM RAIL-SHAPED RULES.
   *
   * The consumer className is forwarded verbatim onto the drawer's `<nav>`, and
   * all eight console sidebars pass `data-[collapsed=false]:min-w-70`. Stamping
   * `data-collapsed="false"` there armed it: `min-width: 280px` inside a 244px
   * sheet, which `max-w-full` cannot claw back because `min-width` resolves
   * last, so the navigation was 36px wider than the drawer holding it.
   * `data-mobile="true"` already names this surface, and a drawer is never
   * collapsed, so the attribute had nothing left to say.
   */
  it('carries no data-collapsed, so a rail width rule cannot fire inside it', async () => {
    const { baseElement } = render(<Drawer />)
    setViewport(true)

    await userEvent.click(screen.getByRole('button', { name: /navigation/i }))

    const nav = baseElement.querySelector('[data-slot="sidebar-root"]')
    expect(nav).not.toHaveAttribute('data-collapsed')
    expect(nav).toHaveAttribute('data-mobile', 'true')
  })

  it('renders full-width items rather than an icon rail, even when collapsed on desktop', async () => {
    localStorage.setItem('sidebar-collapsed', 'true')
    render(<Drawer />)
    setViewport(true)

    await userEvent.click(screen.getByRole('button', { name: /navigation/i }))

    // The icon-only variant renders the title in a tooltip instead of inline.
    expect(screen.getByRole('link', { name: 'Home' })).toHaveTextContent('Home')
  })

  it('keeps the consumer className and data attributes on the drawer nav', async () => {
    const { baseElement } = render(<Drawer />)
    setViewport(true)

    await userEvent.click(screen.getByRole('button', { name: /navigation/i }))

    const nav = baseElement.querySelector('[data-slot="sidebar-root"]')
    expect(nav).toHaveClass('h-full')
    expect(nav).toHaveAttribute('data-tour', 'midaz-sidebar')
  })
})

describe('SidebarTrigger', () => {
  it('names itself in English with no props', () => {
    render(<Drawer />)

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
    render(<Drawer />)
    setViewport(true)

    const trigger = screen.getByRole('button', { name: /navigation/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('points aria-controls at the drawer only while the drawer exists', async () => {
    const { baseElement } = render(<Drawer />)
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
