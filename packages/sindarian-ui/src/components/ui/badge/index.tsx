import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        active:
          'bg-system-success-surface text-system-success-h1a border-none py-[2px] px-3',
        inactive: 'bg-muted text-foreground border-none py-[2px] px-3',
        secondary:
          'border-transparent bg-muted text-foreground hover:bg-muted/80',
        destructive:
          'border-transparent bg-red-500 text-primary-foreground hover:bg-red-500/80',
        outline: 'text-foreground'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }

function Badge({ className, variant, asChild, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
