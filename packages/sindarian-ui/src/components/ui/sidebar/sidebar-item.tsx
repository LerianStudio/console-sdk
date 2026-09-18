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
  onClick,
  ...props
}: SidebarItemProps) => {
  const { usePathname } = useSidebarRouter()
  const pathname = usePathname()
  const { isCollapsed, isDrawer, setOpenMobile } = useSidebar()

  const isActive = (href: string) => pathname === href

  /**
   * ⛔ ACTIVATING A DESTINATION CLOSES THE DRAWER. It is the whole point of the
   * drawer and it was the one interaction that left it open: Escape, the
   * backdrop and the X all dismissed it, a navigation link did not.
   *
   * The overlay is modal, so `document.body` carries `pointer-events: none`
   * while it is up, and a consumer's `SidebarItem` is a client-side `Link`
   * under a provider that survives the route change — so the reader landed on
   * the new page rendered INERT behind a drawer they had to dismiss a second
   * time, on a phone.
   *
   * Here rather than in `SidebarRoot`, because this is the component that knows
   * an activation happened; `SidebarBackButton` and every
   * `SidebarItemCollapsibleContent` leaf render through it, so they are covered
   * by construction. Guarded on `isDrawer` so an inline rail — where nothing is
   * covering the page — behaves exactly as before, and the consumer's own
   * handler still runs either way.
   */
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)

    if (isDrawer) {
      setOpenMobile(false)
    }
  }

  if (isCollapsed) {
    return (
      <SidebarItemIconButton
        data-slot="sidebar-item"
        href={href}
        active={isActive(href) || active}
        onClick={handleClick}
        {...props}
      />
    )
  }

  return (
    <SidebarItemButton
      data-slot="sidebar-item"
      href={href}
      active={isActive(href) || active}
      onClick={handleClick}
      {...props}
    />
  )
}
