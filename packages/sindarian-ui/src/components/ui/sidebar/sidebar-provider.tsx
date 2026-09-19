'use client'

import React from 'react'
import { getStorage, getStorageObject } from '@/lib/storage'

/**
 * The viewport below which the rail stops being a layout and becomes a drawer.
 *
 * 767px rather than 768px: this is the upper bound of `max-width`, so it is the
 * exact complement of `min-[768px]:hidden` on `SidebarTrigger`, and the two
 * flip at the same pixel.
 *
 * ⚠️ THE PAIR HAS TO BE IN THE SAME UNIT. It used to be `md:hidden` over there,
 * and `md` is 48rem: rem in a media query follows the BROWSER'S default font
 * size, so at Chrome's "Small" setting that class hid the hamburger from 576px
 * while this query still asked for a drawer up to 767px — a band of viewports
 * with no navigation at all. Anything else that hides or shows a control at
 * this boundary states it in pixels for the same reason.
 */
export const SIDEBAR_MOBILE_QUERY = '(max-width: 767px)'

/**
 * Where focus goes when the rail has to receive it. The rail's own content is
 * links and buttons, so this is deliberately the short list rather than the
 * full tabbable grammar: a `[tabindex]` sweep would have to exclude `-1`, and
 * nothing in a sidebar carries one.
 */
const FOCUSABLE = 'a[href], button:not([disabled])'

export type SidebarContextProps = {
  isCollapsed: boolean
  /**
   * True only inside a drawer that `SidebarRoot` is actually rendering, which
   * needs `mobile="drawer"` as well as a narrow viewport. `SidebarRoot`
   * re-provides the context for that subtree; nothing else sets it.
   */
  isDrawer: boolean
  /**
   * True while the viewport is narrow enough for a drawer. Reported in BOTH
   * modes, so a consumer still on `mobile="inline"` can build its own
   * responsive behaviour from it.
   */
  isMobile: boolean
  /** Whether the mobile drawer is showing. Meaningless while `isMobile` is false. */
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  /**
   * Puts focus back on whatever opened the drawer. `SidebarRoot` calls it when
   * the drawer closes; nothing else should need it.
   */
  restoreDrawerFocus: () => void
  /** The drawer's DOM id, so `SidebarTrigger` can point `aria-controls` at it. */
  sidebarId: string
  items: Record<string, boolean>
  setItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  getItemCollapsed: (key: string) => boolean
  setItemCollapsed: (key: string, value: boolean) => void
  toggleSidebar: () => void
}

/**
 * Exported so `SidebarRoot` can re-provide it for the drawer's subtree. That
 * subtree is the only place `isCollapsed` and `isDrawer` differ from the
 * provider's own values, and scoping the override to it is what keeps a
 * consumer on `mobile="inline"` seeing exactly today's rail.
 */
export const SidebarContext = React.createContext<
  SidebarContextProps | undefined
>(undefined)

export const useSidebar = () => {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export const SidebarProvider = ({ children }: React.PropsWithChildren) => {
  const [hydrated, setHydrated] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState<boolean>(false)
  const [items, _setItems] = React.useState<Record<string, boolean>>({})
  const [isMobile, setIsMobile] = React.useState(false)
  const [openMobile, _setOpenMobile] = React.useState(false)
  const sidebarId = React.useId()

  /**
   * ⛔ RADIX CANNOT RESTORE THIS FOCUS BY ITSELF. `DialogContent` preventDefaults
   * the focus scope's own restore and focuses `triggerRef.current` instead —
   * the ref a `SheetTrigger` would have filled. The drawer is opened from this
   * state rather than from a trigger inside the dialog, so that ref is null and
   * closing dropped focus onto `<body>`: a keyboard reader who opened the
   * navigation and pressed Escape was returned to the top of the document.
   *
   * Captured here rather than in `SidebarTrigger` so that a consumer opening
   * the drawer from its own control gets the same behaviour.
   */
  const opener = React.useRef<HTMLElement | null>(null)

  const setOpenMobile = React.useCallback((open: boolean) => {
    if (open && typeof document !== 'undefined') {
      opener.current = document.activeElement as HTMLElement | null
    }
    _setOpenMobile(open)
  }, [])

  /**
   * ⛔ THE VIEWPORT AT THE MOMENT FOCUS MOVES, NOT AT THE MOMENT IT OPENED.
   *
   * Radix calls `restoreDrawerFocus` from the focus scope's UNMOUNT handler,
   * which is the last thing in the commit to touch focus — later than any
   * effect in this provider, so the decision has to be made inside the handler
   * rather than beside it. By then `isMobile` has already flipped.
   */
  const isMobileRef = React.useRef(false)
  isMobileRef.current = isMobile

  const restoreDrawerFocus = React.useCallback(() => {
    // `isConnected`: the control that opened the drawer may itself have been
    // unmounted by whatever the reader did inside it.
    //
    // ⛔ AND NOT AT ALL WHEN THE VIEWPORT IS THE ONE THAT DISMISSED IT. A
    // tablet rotated from portrait to landscape with the navigation open
    // crosses 768px, so the drawer is replaced by the rail and the opener is
    // `SidebarTrigger` — which the same breakpoint just hid.
    // `.focus()` on a `display: none` element is a silent no-op, and Radix's
    // own restore is already `preventDefault()`ed, so focus fell to `<body>`
    // and the reader lost their place (SC 2.4.3). Measured in Chromium at
    // 390 → 1280: `{"rails":1,"triggerDisplay":"none","focus":"BODY:"}`.
    if (isMobileRef.current && opener.current?.isConnected) {
      opener.current.focus()
      return
    }

    // The rail is what the drawer became, so that is where the reader goes.
    // Below the breakpoint there is nothing here to find — a closed drawer
    // leaves no navigation in the DOM — and focus stays where Radix left it.
    document
      .getElementById(sidebarId)
      ?.querySelector<HTMLElement>(FOCUSABLE)
      ?.focus()
  }, [sidebarId])

  const toggleSidebar = () => setCollapsed((collapsed) => !collapsed)

  const getItemCollapsed = (key: string) => {
    return items[key] || false
  }

  const setItemCollapsed = (key: string, value: boolean) => {
    _setItems((items) => ({ ...items, [key]: value }))
  }

  // Read from localStorage after hydration to avoid SSR mismatch
  React.useEffect(() => {
    setCollapsed(getStorage('sidebar-collapsed', false) === 'true')
    _setItems(getStorageObject('sidebar-items', {}))
    setHydrated(true)
  }, [])

  /**
   * ⚠️ FALSE UNTIL THE CLIENT SAYS OTHERWISE. There is no viewport on the
   * server, so the first paint is always the rail and the drawer appears on
   * hydration; starting from a guess would make the markup differ between the
   * two renders. The `matchMedia` guard is the one `theme-provider.tsx` next
   * door already carries: jsdom and some embedded runtimes ship without it, and
   * a missing media API is a desktop, not a crash.
   */
  React.useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return
    }

    const media = window.matchMedia(SIDEBAR_MOBILE_QUERY)
    const sync = () => setIsMobile(media.matches)

    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  /**
   * A drawer left open while the viewport grows back would keep an overlay and
   * a focus trap over a layout that is already showing its rail, with nothing
   * on screen to dismiss them.
   *
   * Where focus goes afterwards is `restoreDrawerFocus`'s decision, not this
   * effect's: Radix's unmount handler runs later than anything here.
   */
  React.useEffect(() => {
    if (!isMobile) {
      _setOpenMobile(false)
    }
  }, [isMobile])

  // Only persist to localStorage after hydration to avoid overwriting stored values
  React.useEffect(() => {
    if (!hydrated) {
      return
    }

    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
  }, [collapsed, hydrated])

  React.useEffect(() => {
    if (!hydrated) {
      return
    }

    localStorage.setItem('sidebar-items', JSON.stringify(items))
  }, [items, hydrated])

  return (
    <SidebarContext.Provider
      value={{
        /**
         * ⚠️ A NARROW VIEWPORT DOES NOT TOUCH THIS. It used to be forced false
         * whenever `isMobile`, which silently changed the rail for every
         * consumer — including the ones that never asked for a drawer.
         * `SidebarRoot` overrides it for the drawer's own subtree instead, so
         * the stored preference reaches an inline rail unchanged at every
         * viewport.
         */
        isCollapsed: collapsed,
        isDrawer: false,
        isMobile,
        openMobile,
        setOpenMobile,
        restoreDrawerFocus,
        sidebarId,
        items,
        setItems: _setItems,
        getItemCollapsed,
        setItemCollapsed,
        toggleSidebar
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
