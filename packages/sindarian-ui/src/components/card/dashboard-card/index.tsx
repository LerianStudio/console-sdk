import { cn } from '@/lib/utils'

export function DashboardCard({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-lg bg-white p-6 pt-4',
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
        'text-shadcn-400 absolute top-4 right-6 flex size-6 items-center justify-center [&>svg]:size-6',
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
        'mb-4 text-sm font-medium text-zinc-600 uppercase',
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
      className={cn('text-[32px] font-extrabold text-zinc-600', className)}
      {...props}
    />
  )
}
