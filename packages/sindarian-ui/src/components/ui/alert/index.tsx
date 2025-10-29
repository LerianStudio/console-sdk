import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { IconButton } from '../icon-button'
import { X } from 'lucide-react'

const alertVariants = cva('alert', {
  variants: {
    variant: {
      default: '',
      informative: 'alert-informative',
      destructive: 'alert-destructive',
      warning: 'alert-warning',
      success: 'alert-success'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

export type AlertProps = React.ComponentProps<'div'> &
  VariantProps<typeof alertVariants>

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('alert-title', className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('alert-description', className)}
      {...props}
    />
  )
}

function AlertActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-actions"
      className={cn('alert-actions', className)}
      {...props}
    />
  )
}

function AlertTopAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-top-action"
      className={cn('alert-top-action', className)}
      {...props}
    />
  )
}

function AlertClose({
  className,
  ...props
}: React.ComponentProps<typeof IconButton>) {
  return (
    <AlertTopAction>
      <IconButton
        className={cn('alert-close', className)}
        variant="outline"
        size="small"
        rounded
        {...props}
      >
        <X />
      </IconButton>
    </AlertTopAction>
  )
}

export {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertActions,
  AlertTopAction,
  AlertClose
}
