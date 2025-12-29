'use client'

import { getStorage, getStorageObject } from '@/lib/storage'
import React from 'react'

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
  const [collapsed, setCollapsed] = React.useState<boolean>(
    getStorage('sidebar-collapsed', false) === 'true'
  )
  const [items, _setItems] = React.useState<Record<string, boolean>>(
    getStorageObject('sidebar-items', {})
  )

  const toggleSidebar = () => setCollapsed((collapsed) => !collapsed)

  const getItemCollapsed = (key: string) => {
    return items[key] || false
  }

  const setItemCollapsed = (key: string, value: boolean) => {
    _setItems((items) => ({ ...items, [key]: value }))
  }

  React.useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
  }, [collapsed])

  React.useEffect(() => {
    localStorage.setItem('sidebar-items', JSON.stringify(items))
  }, [items])

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
