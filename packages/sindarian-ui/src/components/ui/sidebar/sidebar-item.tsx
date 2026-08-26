'use client'

import React from 'react'
import { SidebarItemButton } from './sidebar-item-button'
import { SidebarItemIconButton } from './sidebar-item-icon-button'
import { useSidebar } from './sidebar-provider'
import { useSidebarRouter } from './sidebar-router'

export type SidebarItemProps = React.ComponentProps<typeof SidebarItemButton> &
  React.ComponentProps<typeof SidebarItemIconButton> & {
    title: string
    icon: React.ReactNode
    href: string
    active?: boolean
    disabled?: boolean
    children?: React.ReactNode
  }

export const SidebarItem = ({
  active,
  href,
  children: _children,
  ...props
}: SidebarItemProps) => {
  const { usePathname } = useSidebarRouter()
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()

  const isActive = (href: string) => pathname === href

  if (isCollapsed) {
    return (
      <SidebarItemIconButton
        data-slot="sidebar-item"
        href={href}
        active={isActive(href) || active}
        {...props}
      />
    )
  }

  return (
    <SidebarItemButton
      data-slot="sidebar-item"
      href={href}
      active={isActive(href) || active}
      {...props}
    />
  )
}
