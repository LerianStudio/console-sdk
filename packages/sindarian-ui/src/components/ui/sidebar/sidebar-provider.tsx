'use client'

import React from 'react'
import { getStorage, getStorageObject } from '@/lib/storage'

export type SidebarContextProps = {
  isCollapsed: boolean
  items: Record<string, boolean>
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
        isCollapsed: collapsed,
        items,
        getItemCollapsed,
        setItemCollapsed,
        toggleSidebar
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
