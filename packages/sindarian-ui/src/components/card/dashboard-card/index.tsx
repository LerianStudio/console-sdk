import { cn } from '@/lib/utils'

export function DashboardCard({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-card relative flex flex-col rounded-lg p-6 pt-4',
        className
      )}
      {...props}
    />
  )
}

export function DashboardCardIcon({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'text-shadcn-400 absolute right-6 top-4 flex size-6 items-center justify-center [&>svg]:size-6',
        className
      )}
      {...props}
    />
  )
}

export function DashboardCardTitle({
  className,
  ...props
}: React.ComponentProps<'h2'>) {
  return (
    <h2
      className={cn(
        'text-muted-foreground mb-4 text-sm font-medium uppercase',
        className
      )}
      {...props}
    />
  )
}

export function DashboardCardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'text-muted-foreground text-[32px] font-extrabold',
        className
      )}
      {...props}
    />
  )
}
