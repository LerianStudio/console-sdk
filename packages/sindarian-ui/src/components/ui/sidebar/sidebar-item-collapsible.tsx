import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@radix-ui/react-collapsible'
import { ChevronRight } from 'lucide-react'
import { useSidebar } from './sidebar-provider'
import { Separator } from '../separator'
import { SidebarItemButton } from './sidebar-item-button'
import { buttonVariants } from '../button'
import { SidebarItemIconButton } from './sidebar-item-icon-button'

export function SidebarItemCollapsible({
  className,
  ...props
}: React.ComponentProps<typeof Collapsible>) {
  const { isCollapsed } = useSidebar()

  return (
    <Collapsible
      data-slot="sidebar-item-collapsible"
      className={cn(
        {
          'bg-shadcn-100 rounded-md': isCollapsed
        },
        className
      )}
      {...props}
    />
  )
}

export type SidebarItemCollapsibleTriggerProps = React.ComponentProps<
  typeof CollapsibleTrigger
> &
  Omit<React.ComponentProps<typeof SidebarItemButton>, 'href'> &
  Omit<React.ComponentProps<typeof SidebarItemIconButton>, 'href'>

export function SidebarItemCollapsibleTrigger({
  className,
  icon,
  title,
  children,
  ...props
}: SidebarItemCollapsibleTriggerProps) {
  const { isCollapsed } = useSidebar()

  return (
    <CollapsibleTrigger
      data-slot="sidebar-item-collapsible-trigger"
      className={cn(
        'flex w-full flex-row p-0',
        'transition-all hover:underline [&[data-state=open]>svg]:rotate-90',
        buttonVariants({
          variant: 'outline',
          fullWidth: true,
          size: 'small'
        }),
        {
          'size-10': isCollapsed
        },
        className
      )}
      {...props}
    >
      {isCollapsed && (
        <SidebarItemIconButton title={title} icon={icon} href="" inactive />
      )}
      {!isCollapsed && (
        <>
          <SidebarItemButton title={title} icon={icon} href={''} inactive />
          <ChevronRight className="mr-1 size-6 shrink-0 cursor-pointer text-zinc-900 transition-transform duration-200" />
        </>
      )}
    </CollapsibleTrigger>
  )
}

export function SidebarItemCollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsibleContent>) {
  const { isCollapsed } = useSidebar()

  return (
    <CollapsibleContent
      data-slot="sidebar-item-collapsible-content"
      className={cn(
        'mt-1 flex flex-col gap-1',
        'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden transition-all duration-200 ease-in-out',
        {
          'items-center': isCollapsed
        },
        className
      )}
      {...props}
    >
      {isCollapsed ? (
        children
      ) : (
        <div className="flex items-stretch gap-3">
          <Separator className="ml-5 h-auto" orientation="vertical" />
          <div className="w-full gap-1">{children}</div>
        </div>
      )}
    </CollapsibleContent>
  )
}
