import { cn } from '@/lib/utils'

export function PageRoot({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-root"
      className={cn(
        'text-foreground bg-body-surface flex h-screen min-h-screen w-full flex-col overflow-y-auto',
        className
      )}
      {...props}
    />
  )
}

export function PageView({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-view"
      className={cn('flex min-h-0 flex-1', className)}
      {...props}
    />
  )
}

export function PageContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-content"
      className={cn('flex grow flex-col overflow-y-auto p-16 scrollbar-thin-translucent', className)}
      {...props}
    />
  )
}
