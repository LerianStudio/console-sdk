'use client'

import React from 'react'
import Link from 'next/link'
import { buttonVariants } from '../../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../../ui/tooltip'
import { cn } from '@/lib/utils'
import { iconButtonVariants } from '../icon-button'

type SidebarItemIconButtonProps = React.ComponentProps<typeof Link> & {
  title: string
  icon: React.ReactNode
  active?: boolean
  inactive?: boolean
  disabled?: boolean
}

export const SidebarItemIconButton = ({
  title,
  icon,
  href,
  active,
  inactive,
  disabled,
  ...props
}: SidebarItemIconButtonProps) => {
  const sharedClassName = cn(
    buttonVariants({
      variant: active ? 'tertiary' : 'outline'
    }),
    iconButtonVariants(),
    inactive && 'hover:border-transparent',
    disabled && 'cursor-default opacity-30'
  )

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {disabled || inactive ? (
            <div
              data-slot="sidebar-item-icon-button"
              className={sharedClassName}
            >
              {icon}
            </div>
          ) : (
            <Link
              data-slot="sidebar-item-icon-button"
              href={href}
              className={sharedClassName}
              {...props}
            >
              {icon}
            </Link>
          )}
        </TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
