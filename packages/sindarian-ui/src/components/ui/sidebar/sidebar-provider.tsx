'use client'

import React from 'react'
import { getStorage, getStorageObject } from '@/lib/storage'

/**
 * The viewport below which the rail stops being a layout and becomes a drawer.
 *
 * 767px rather than 768px: this is the upper bound of `max-width`, so it is the
 * complement of Tailwind's `md` breakpoint (`min-width: 768px`) and `md:hidden`
 * on `SidebarTrigger` flips at exactly the same pixel the query does.
 */
export const SIDEBAR_MOBILE_QUERY = '(max-width: 767px)'

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

  const restoreDrawerFocus = React.useCallback(() => {
    // `isConnected`: the control that opened the drawer may itself have been
    // unmounted by whatever the reader did inside it.
    if (opener.current?.isConnected) {
      opener.current.focus()
    }
  }, [])

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
