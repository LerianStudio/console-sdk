import React from 'react'
import { cn } from '@/lib/utils'

export function BasicCard({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('bg-card flex flex-col rounded-lg p-6', className)}
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
      className={cn('text-foreground mb-4 text-sm font-medium', className)}
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
      className={cn(
        'text-muted-foreground mb-6 text-sm font-medium',
        className
      )}
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
