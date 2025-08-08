import { cn } from '@/lib/utils'

export function PageRoot({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-root"
      className={cn(
        'bg-background text-foreground flex h-full min-h-screen w-full overflow-y-auto',
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
      className={cn(
        'bg-shadcn-100 flex min-h-full grow flex-col overflow-y-auto',
        className
      )}
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
      className={cn('h-full w-full overflow-y-auto p-16', className)}
      {...props}
    />
  )
}
