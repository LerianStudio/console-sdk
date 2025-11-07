import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  CollapsibleProps,
  CollapsibleTriggerProps
} from '@radix-ui/react-collapsible'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Paper } from '@/components/ui/paper'
import { ChevronDown } from 'lucide-react'
import { Separator } from '../separator'

export type PaperCollapsibleProps = CollapsibleProps

function PaperCollapsible({
  className,
  children,
  ...props
}: PaperCollapsibleProps) {
  return (
    <Collapsible className="group/paper-collapsible" {...props}>
      <Paper
        data-slot="paper-collapsible"
        className={cn('flex flex-col', className)}
      >
        {children}
      </Paper>
    </Collapsible>
  )
}

function PaperCollapsibleBanner({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="paper-collapsible-banner"
      className={cn('flex flex-row p-6', className)}
      {...props}
    >
      <div className="flex grow flex-col">{children}</div>
      <PaperCollapsibleTrigger />
    </div>
  )
}

function PaperCollapsibleTrigger({
  className,
  children: _children,
  ...props
}: CollapsibleTriggerProps) {
  return (
    <CollapsibleTrigger
      data-slot="paper-collapsible-trigger"
      className={cn(
        'transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      <ChevronDown className="size-6 shrink-0 cursor-pointer text-zinc-700 transition-transform duration-200" />
    </CollapsibleTrigger>
  )
}

function PaperCollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <CollapsibleContent
      data-slot="paper-collapsible-content"
      className={cn(
        'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden transition-all duration-200 ease-in-out',
        className
      )}
      {...props}
    >
      <Separator />
      {children}
    </CollapsibleContent>
  )
}

export {
  PaperCollapsible,
  PaperCollapsibleBanner,
  PaperCollapsibleTrigger,
  PaperCollapsibleContent
}
