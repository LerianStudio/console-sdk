import React from 'react'
import { cn } from '@/lib/utils'

export function BasicCard({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col rounded-lg bg-white p-6', className)}
      {...props}
    />
  )
}

export function BasicCardTitle({
  className,
  ...props
}: React.ComponentProps<'h2'>) {
  return (
    <h2
      className={cn('text-shadcn-600 mb-4 text-sm font-medium', className)}
      {...props}
    />
  )
}

export function BasicCardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-shadcn-500 mb-6 text-sm font-medium', className)}
      {...props}
    />
  )
}

export function BasicCardAction({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col', className)} {...props} />
}
