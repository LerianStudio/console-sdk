'use client'

import { getStorage } from '@/lib/storage'
import React from 'react'

export type SidebarContextProps = {
  isCollapsed: boolean
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

  const toggleSidebar = () => setCollapsed((collapsed) => !collapsed)

  React.useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
  }, [collapsed])

  return (
    <SidebarContext.Provider value={{ isCollapsed: collapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}
