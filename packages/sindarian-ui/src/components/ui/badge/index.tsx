import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'

/**
 * `credit` is the accounting reading of a credit amount, NOT an alias of
 * `destructive` (an error/alarm). The credit role is a tint-and-ink pair:
 * `--credit-foreground` mirrors `--credit` by contract, so the red carries the
 * role as text over a tinted surface. Do not "fix" this into a solid
 * `bg-credit` fill — that renders red-on-red and is invisible.
 */
/**
 * `gap-1` is load-bearing, not decoration: a badge holding a label AND an
 * element child (`ID<code>ctx-123</code>`) has nothing between them otherwise —
 * JSX drops the newline-only text node and CSS drops the whitespace-only
 * anonymous flex item — so the screen reads `IDctx-123`. Consumers were pasting
 * `className="gap-1"` per call site; `cn` runs tailwind-merge, so an explicit
 * `gap-2` still wins. Single-child badges are unaffected: gap needs two items.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        active:
          'bg-system-success-surface text-system-success-h1a border-system-success-border py-[2px] px-3',
        inactive:
          'bg-muted text-foreground border-muted-foreground/40 py-[2px] px-3',
        secondary:
          'border-transparent bg-muted-foreground text-white dark:text-black',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        credit:
          'border-credit/30 bg-credit/10 text-credit-foreground px-[10px] py-1',
        error:
          'border-system-error-border bg-system-error-surface text-system-error-text px-[10px] py-1',
        success:
          'border-system-success-border bg-system-success-surface text-system-success-text px-[10px] py-1',
        info: 'border-system-info-border bg-system-info-surface text-system-info-text px-[10px] py-1',
        alert:
          'border-system-alert-border bg-system-alert-surface text-system-alert-text px-[10px] py-1',
        purple:
          'border-system-purple-border bg-system-purple-surface text-system-purple-text px-[10px] py-1',
        outline: 'text-foreground'
      },
      /**
       * Font size only. Padding is baked per-variant above, so a `sm` that also
       * shrank the box would fight every variant that sets its own; scoping the
       * axis to type keeps `sm` composable with all of them. 11px is the canon
       * for fine print — the one micro-badge size, replacing the per-consumer
       * 0.7rem/10px/11px anarchy.
       */
      size: {
        default: '',
        sm: 'text-[11px]'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }

function Badge({ className, variant, size, asChild, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
