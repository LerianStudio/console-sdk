import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { IconButton } from '@/components/ui/icon-button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { EllipsisVertical } from 'lucide-react'

export function EntityCardWrapper({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div data-slot="entity-card-wrapper" {...props} />
}

export type EntityCardProps = React.ComponentProps<'div'> & {
  value?: number
  progress?: boolean
}

export function EntityCard({
  className,
  value,
  progress = false,
  children,
  ...props
}: EntityCardProps) {
  return (
    <div
      data-slot="entity-card-wrapper"
      className="transition-shadow hover:shadow-xl"
    >
      <div
        data-slot="entity-card"
        className={cn(
          'relative flex flex-col gap-4 rounded-lg bg-white px-5 py-4',
          { 'rounded-b-none': progress },
          className
        )}
        {...props}
      >
        {children}
      </div>
      {progress && <Progress className="h-1.5 rounded-t-none" value={value} />}
    </div>
  )
}

export function EntityCardAction({
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenu>) {
  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger className="absolute top-2.5 right-2.5">
        <IconButton variant="outline" size="small" rounded>
          <EllipsisVertical />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

export const EntityCardActionItem = DropdownMenuItem

export function EntityCardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="entity-card-header"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

export function EntityCardTitle({
  className,
  ...props
}: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="entity-card-title"
      className={cn('text-sm font-semibold text-zinc-700', className)}
      {...props}
    />
  )
}

export function EntityCardIcon({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="entity-card-icon"
      className={cn(
        'text-shadcn-400 size-8 [&>svg]:size-8 [&>svg]:stroke-[1.5]',
        className
      )}
      {...props}
    />
  )
}

export function EntityCardBadgeList({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="entity-card-badge-list"
      className={cn('flex flex-wrap gap-2', className)}
      {...props}
    />
  )
}

export function EntityCardBadge({
  className,
  ...props
}: React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      data-slot="entity-card-badge"
      className={cn('h-5 text-xs', className)}
      {...props}
    />
  )
}

export function EntityCardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="entity-card-content"
      className={cn('flex flex-col gap-2.5', className)}
      {...props}
    />
  )
}

export function EntityCardDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="entity-card-description"
      className={cn('text-shadcn-400 text-xs font-medium', className)}
      {...props}
    />
  )
}

export function EntityCardList({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="entity-card-list"
      className={cn(
        'text-shadcn-500 mx-2 list-inside list-disc space-y-1 text-xs font-medium',
        className
      )}
      {...props}
    />
  )
}

export function EntityCardFooter({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="entity-card-footer"
      className={cn(
        'text-shadcn-400 flex flex-col gap-2 text-xs font-medium',
        className
      )}
      {...props}
    >
      <Separator />
      <div className="flex flex-row items-center gap-2 [&>svg]:size-4 [&>svg]:stroke-[1.5] [&>svg]:text-zinc-600">
        {children}
      </div>
    </div>
  )
}
