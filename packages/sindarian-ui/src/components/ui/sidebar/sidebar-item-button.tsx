'use client'

import React from 'react'
import Link from 'next/link'
import { buttonVariants, iconVariants } from '../../ui/button'
import { cn } from '@/lib/utils'

export type SidebarItemButtonProps = React.ComponentProps<typeof Link> & {
  className?: string
  title: string
  icon?: React.ReactNode
  active?: boolean
  inactive?: boolean
  disabled?: boolean
}

export function SidebarItemButton({
  className,
  title,
  icon,
  href,
  active,
  inactive,
  disabled = false,
  ...props
}: SidebarItemButtonProps) {
  const sharedClassName = cn(
    buttonVariants({
      variant: active ? 'tertiary' : 'outline',
      fullWidth: true,
      size: 'small'
    }),
    'group/link flex items-center justify-start',
    inactive && 'hover:border-transparent',
    disabled && 'cursor-default opacity-30',
    className
  )

  const content = (
    <>
      {icon && (
        <span
          className={cn(iconVariants({ position: 'start', size: 'small' }))}
        >
          {icon}
        </span>
      )}
      {title}
    </>
  )

  if (disabled || inactive) {
    return (
      <div data-slot="sidebar-item-button" className={sharedClassName}>
        {content}
      </div>
    )
  }

  return (
    <Link
      data-slot="sidebar-item-button"
      href={href}
      className={sharedClassName}
      {...props}
    >
      {content}
    </Link>
  )
}
