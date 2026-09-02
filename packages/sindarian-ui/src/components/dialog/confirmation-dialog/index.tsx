'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { LoadingButton } from '@/components/ui/loading-button'
import { Ban, CheckCircle2, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cva, VariantProps } from 'class-variance-authority'

const confirmationDialogIconVariants = cva(
  'flex size-10 shrink-0 items-center justify-center rounded-lg [&>svg]:size-6',
  {
    variants: {
      // System tokens, not raw palette steps: a raw 50-step surface has no dark
      // counterpart, so on the dark canvas it rendered a near-white block.
      // `default` is deliberately neutral so `destructive` reads as a distinct,
      // heavier warning instead of an alias of it.
      variant: {
        default: 'bg-muted text-foreground',
        warning: 'bg-system-alert-surface text-system-alert-h1a',
        destructive: 'bg-system-error-surface text-system-error-h1a',
        success: 'bg-system-success-surface text-system-success-h1a'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

const ConfirmationDialogIcon = ({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof confirmationDialogIconVariants>) => (
  <span
    className={cn(confirmationDialogIconVariants({ variant }), className)}
    {...props}
  >
    {variant === 'default' && <Ban />}
    {variant === 'warning' && <TriangleAlert />}
    {variant === 'destructive' && <Ban />}
    {variant === 'success' && <CheckCircle2 />}
  </span>
)

export type ConfirmationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  /** @deprecated dead prop, removed in the next major */
  ledgerName?: string
  variant?: 'default' | 'warning' | 'destructive' | 'success'
  loading?: boolean
  /**
   * Awaited. While it is in flight the dialog reports a pending status, both
   * actions are disabled and dismissal is blocked; it closes on resolve. A
   * rejection leaves the dialog open — error UX belongs to the caller.
   */
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  confirmLabel?: string
  cancelLabel?: string
  /** Announced to screen readers while a confirm is in flight. */
  pendingLabel?: string
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title = '',
  description = '',
  variant = 'default',
  loading,
  onConfirm = () => {},
  onCancel = () => {},
  confirmLabel,
  cancelLabel,
  pendingLabel = 'Processing…'
}: ConfirmationDialogProps) {
  const [pending, setPending] = React.useState(false)
  const busy = Boolean(loading) || pending

  const handleConfirm = async () => {
    if (busy) {
      return
    }

    setPending(true)

    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // Deliberately silent: the caller owns error UX. Catching only keeps a
      // rejection from escaping the click handler as an unhandled rejection —
      // the dialog stays open so the caller can render the failure in place.
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        data-testid="dialog"
        // Radix already blocks outside interaction on an alert dialog, so
        // Escape is the only remaining way to abandon a mutation mid-flight.
        onEscapeKeyDown={(event) => {
          if (busy) {
            event.preventDefault()
          }
        }}
      >
        <AlertDialogHeader className="flex-row items-center">
          <ConfirmationDialogIcon variant={variant} />
          <div className="flex flex-col gap-4">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {/* Mounted empty so the announcement fires on the text change, not on
            the region appearing. The visible pending cue is the button spinner. */}
        <span role="status" className="sr-only">
          {busy ? pendingLabel : ''}
        </span>

        <AlertDialogFooter className="gap-4">
          {/*
           * `button-secondary` is repeated in className on purpose. AlertDialogCancel
           * hardcodes the outline variant, and Slot joins its className into this
           * child's, so Button ends up calling cn('…button-secondary', '…button-outline').
           * Those two are one conflict group now, last one wins, and outline arrives
           * second — which silently erased the secondary chrome. Slot's join puts this
           * className after Cancel's, so repeating the class here lands it last and
           * takes the group back.
           */}
          <AlertDialogCancel asChild>
            <Button
              onClick={onCancel}
              disabled={busy}
              variant="secondary"
              size="small"
              className="button-secondary"
            >
              {cancelLabel ?? 'Cancel'}
            </Button>
          </AlertDialogCancel>
          <LoadingButton
            loading={busy}
            onClick={handleConfirm}
            variant="primary"
            size="small"
            data-testid="confirm"
          >
            {confirmLabel ?? 'Confirm'}
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
