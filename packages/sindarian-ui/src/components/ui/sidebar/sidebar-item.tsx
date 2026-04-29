'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { SidebarItemButton } from './sidebar-item-button'
import { SidebarItemIconButton } from './sidebar-item-icon-button'
import { useSidebar } from './sidebar-provider'

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
  children,
  ...props
}: SidebarItemProps) => {
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
