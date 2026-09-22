'use client'

import { toast as sonnerToast } from 'sonner'

import type { ToastActionElement } from '@/components/ui/toast'

const DEFAULT_DURATION = 10000

/**
 * A destructive toast reports something the operator has to read -- a refused
 * money operation, a failed copy of a show-once secret, a language switch that
 * did not take. It stays up until dismissed instead of auto-closing.
 *
 * `Infinity` is how sonner disables the auto-close timer (it short-circuits the
 * timer effect rather than calling `setTimeout(fn, Infinity)`, which would fire
 * immediately). `<Toaster />` already passes `closeButton`, and sonner gates the
 * close button on that flag alone, never on the duration -- so a persistent
 * toast still renders its dismiss affordance.
 */
const PERSIST_UNTIL_DISMISSED = Infinity

type ToastVariant = 'default' | 'success' | 'warning' | 'destructive'

type ToasterToast = {
  id: string | number
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
  action?: ToastActionElement
  /**
   * Auto-dismiss delay in ms. Omit it to take the variant's own lifetime:
   * `destructive` stays until dismissed, every other variant closes after 10s.
   */
  duration?: number
}

type Toast = Omit<ToasterToast, 'id'>

function toast({ title, description, variant, duration, ...rest }: Toast) {
  const message = title ?? ''
  const options: Parameters<typeof sonnerToast>[1] & { id?: string } = {
    description,
    ...rest,
    duration:
      duration ??
      (variant === 'destructive' ? PERSIST_UNTIL_DISMISSED : DEFAULT_DURATION)
  }

  let id: string | number

  switch (variant) {
    case 'success':
      id = sonnerToast.success(message, options)
      break
    case 'warning':
      id = sonnerToast.warning(message, options)
      break
    case 'destructive':
      id = sonnerToast.error(message, options)
      break
    default:
      id = sonnerToast(message, options)
      break
  }

  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (props: Partial<ToasterToast>) => {
      sonnerToast(props.title ?? message, {
        id,
        description: props.description ?? description,
        ...rest,
        duration: props.duration ?? options.duration
      })
    }
  }
}

/**
 * Backward-compatible hook that wraps Sonner's toast API.
 *
 * Returns the same shape as the original Radix-based useToast:
 * - `toast()` to create a toast
 * - `dismiss()` to dismiss a toast by id (or all if no id)
 * - `toasts` array (always empty -- Sonner manages its own state internally)
 */
function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => {
      if (toastId !== undefined) {
        sonnerToast.dismiss(toastId)
      } else {
        sonnerToast.dismiss()
      }
    },
    toasts: [] as ToasterToast[]
  }
}

export { useToast, toast }
export type { ToasterToast, Toast, ToastVariant }
