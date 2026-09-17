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
  /** True while the viewport is narrow enough that the rail is a drawer. */
  isMobile: boolean
  /** Whether the mobile drawer is showing. Meaningless while `isMobile` is false. */
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  /** The drawer's DOM id, so `SidebarTrigger` can point `aria-controls` at it. */
  sidebarId: string
  items: Record<string, boolean>
  setItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  getItemCollapsed: (key: string) => boolean
  setItemCollapsed: (key: string, value: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(
  undefined
)

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
  const [openMobile, setOpenMobile] = React.useState(false)
  const sidebarId = React.useId()

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
      setOpenMobile(false)
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
         * ⛔ NEVER COLLAPSED IN A DRAWER, and this is the only place that can
         * say so. `SidebarItem` and `SidebarGroupTitle` read this flag straight
         * off the context rather than off the DOM, so a rail collapsed on
         * desktop would follow the reader onto their phone and render an
         * icon-only strip inside a 244px overlay — the cost of both layouts and
         * the benefit of neither. The stored preference is untouched: it comes
         * back when the viewport does.
         */
        isCollapsed: isMobile ? false : collapsed,
        isMobile,
        openMobile,
        setOpenMobile,
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
