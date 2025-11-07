'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'

import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { LoadingButton } from '@/components/ui/loading-button'
import { Ban, CheckCircle2, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cva, VariantProps } from 'class-variance-authority'

const confirmationDialogIconVariants = cva(
  'flex size-10 shrink-0 items-center justify-center rounded-lg [&>svg]:size-6',
  {
    variants: {
      variant: {
        default: 'bg-red-50 text-red-500',
        warning: 'bg-yellow-50 text-yellow-500',
        destructive: 'bg-red-50 text-red-500',
        success: 'bg-green-50 text-green-800'
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
  ledgerName?: string
  variant?: 'default' | 'warning' | 'destructive' | 'success'
  loading?: boolean
  onConfirm?: () => void
  onCancel?: () => void
  confirmLabel?: string
  cancelLabel?: string
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
  cancelLabel
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog">
        <DialogHeader className="flex-row items-center">
          <ConfirmationDialogIcon variant={variant} />
          <div className="flex flex-col gap-4">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="gap-4">
          <Button onClick={onCancel} variant="secondary" size="small">
            {cancelLabel ?? 'Cancel'}
          </Button>
          <LoadingButton
            loading={loading}
            onClick={onConfirm}
            variant="primary"
            size="small"
            data-testid="confirm"
          >
            {confirmLabel ?? 'Confirm'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
