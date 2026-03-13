'use client'

import React from 'react'
import { cva } from 'class-variance-authority'
import { useSidebar } from './sidebar-provider'
import { cn } from '@/lib/utils'

const sidebarVariants = cva(
  'group/sidebar shadow-sidebar relative flex flex-col transition-[width] duration-300 ease-in-out scrollbar-thin-translucent',
  {
    variants: {
      collapsed: {
        true: 'w-[72px]',
        false: 'w-[244px]'
      }
    },
    defaultVariants: {
      collapsed: false
    }
  }
)

export const SidebarRoot = ({
  className,
  ...props
}: React.ComponentProps<'nav'>) => {
  const { isCollapsed } = useSidebar()

  return (
    <nav
      data-slot="sidebar-root"
      className={cn(sidebarVariants({ collapsed: isCollapsed }), className)}
      data-collapsed={isCollapsed}
      {...props}
    />
  )
}
