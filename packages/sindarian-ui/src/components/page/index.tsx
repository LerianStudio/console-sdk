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

export type PageContentProps = React.ComponentProps<'div'> & {
  /**
   * How much room the container spends on padding.
   *
   * `'default'` is 64px a side at every width, and it is what every consumer
   * that does not ask for anything gets, class for class.
   *
   * `'compact'` adds 16px a side below `sm` (640px) and changes nothing above
   * it. On a 390px phone the default spends 128px — a third of the screen —
   * before the page has drawn anything: measured at 390 on ten Product Console
   * screens across Midaz, Pix, Payments, Reporter, Tracer, Flowker and
   * Settings, each was left with 262px of content, and the pages adding their
   * own `px-24` inside it were down to 70px, which is where a transaction
   * receipt's amount ran off its card.
   *
   * WHY `max-sm:p-4` AND NOT THE MOBILE-FIRST `p-4 sm:p-16`. A base `p-4`
   * REPLACES `p-16` for every caller, and `sm:p-16` then re-imposes 64px at
   * desktop on the pages that deliberately asked for something else — a
   * full-bleed page would grow a 64px frame at 1440. `max-sm:` only ADDS a rule
   * below `sm`, so every call site renders identically from 640px up, whatever
   * padding it passes.
   *
   * HOW A CALLER OPTS OUT. Pass the phone value too: `className="p-0
   * max-sm:p-0"`. `cn` is tailwind-merge, so the caller's `max-sm:p-0` replaces
   * this rule rather than stacking with it.
   *
   * AND AN AXIS PADDING HAS TO REPEAT ITSELF: `className="px-6 max-sm:px-6"`,
   * never `px-6` alone. tailwind-merge does not treat `max-sm:p-4` and `px-6`
   * as the same group, so it drops neither, and CSS then gives the media-query
   * rule the last word — a lone `px-6` is silently 16px on both axes on a
   * phone.
   */
  padding?: 'default' | 'compact'
}

export function PageContent({
  className,
  padding = 'default',
  ...props
}: PageContentProps) {
  return (
    <div
      data-slot="page-content"
      // Order is the contract, not a style: `className` last is what lets a
      // caller's `p-0` beat `p-16` and a caller's `max-sm:p-0` replace the
      // compact rule instead of stacking with it.
      className={cn(
        'flex grow flex-col overflow-y-auto p-16',
        padding === 'compact' && 'max-sm:p-4',
        className
      )}
      {...props}
    />
  )
}
