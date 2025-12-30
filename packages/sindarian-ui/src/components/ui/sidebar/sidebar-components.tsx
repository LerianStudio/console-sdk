import React from 'react'
import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-provider'
import { Separator } from '../separator'

export type SidebarHeaderProps = React.ComponentProps<'div'> & {
  className?: string
  collapsed?: boolean
}

export const SidebarHeader = ({
  className,
  collapsed,
  ...props
}: SidebarHeaderProps) => (
  <div
    data-slot="sidebar-header"
    data-collapsed={collapsed}
    className={cn(
      'dark:bg-cod-gray-950 flex w-full flex-col items-center bg-white p-4',
      collapsed && 'justify-center p-0',
      className
    )}
    {...props}
  />
)

export type SidebarContentProps = React.ComponentProps<'div'> & {
  className?: string
}

export const SidebarContent = ({
  className,
  ...props
}: SidebarContentProps) => (
  <div
    data-slot="sidebar-content"
    className={cn(
      'group flex flex-1 flex-col gap-4 overflow-hidden overflow-y-auto bg-white px-4 pt-4 transition-all duration-300 ease-in-out',
      'group-data-[collapsed=true]/sidebar:items-center group-data-[collapsed=true]/sidebar:px-2',
      className
    )}
    {...props}
  />
)

export type SidebarGroupProps = {
  className?: string
} & React.ComponentProps<'nav'>

export const SidebarGroup = ({ className, ...props }: SidebarGroupProps) => (
  <nav
    data-slot="sidebar-group"
    className={cn(
      'flex flex-col gap-1',
      'group-data-[collapsed=true]/sidebar:items-center',
      className
    )}
    {...props}
  />
)

export type SidebarGroupTitleProps = React.PropsWithChildren & {
  collapsed?: boolean
}

export const SidebarGroupTitle = ({ children }: SidebarGroupTitleProps) => {
  const { isCollapsed } = useSidebar()

  if (isCollapsed) {
    return <Separator />
  }

  return (
    <div data-slot="sidebar-group-title" className="my-2 px-2">
      <p className="text-xs font-semibold tracking-[1.1px] text-zinc-500 uppercase">
        {children}
      </p>
    </div>
  )
}

export type SidebarFooterProps = {
  className?: string
} & React.ComponentProps<'nav'>

export const SidebarFooter = ({ className, ...props }: SidebarFooterProps) => (
  <nav
    data-slot="sidebar-footer"
    className={cn(
      'border-shadcn-200 flex w-full justify-center border-t bg-white p-4',
      className
    )}
    {...props}
  />
)
