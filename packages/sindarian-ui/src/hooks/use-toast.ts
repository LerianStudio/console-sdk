'use client'

import { toast as sonnerToast } from 'sonner'

import type { ToastActionElement } from '@/components/ui/toast'

/**
 * Lifetime of every non-destructive toast, and the `<Toaster />` fallback for
 * anything raised without one. The two must not drift apart, so the Toaster
 * imports this rather than repeating the literal.
 */
export const DEFAULT_DURATION = 10000

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
   * Auto-dismiss delay in ms, which must be greater than 0: sonner resolves it
   * as `toast.duration || toasterDuration || default`, so `0` reads as unset
   * and the toast silently takes the `<Toaster />` default instead of closing
   * at once. Omit it to take the variant's own lifetime: `destructive` stays
   * until dismissed, every other variant closes after 10s.
   */
  duration?: number
}

type Toast = Omit<ToasterToast, 'id'> & { id?: ToasterToast['id'] }

const isPlainText = (value: React.ReactNode) =>
  value === undefined || typeof value === 'string'

/**
 * Two identical errors share one toast instead of stacking: same variant, same
 * text -- same id, and sonner updates the one already on screen.
 *
 * Unbounded stacking is worse for a persistent toast than for a transient one.
 * `<Toaster />` shows three at a time and renders the rest `opacity: 0;
 * pointer-events: none`, so a fourth error nobody can read is also a fourth
 * error nobody can close -- and without an auto-dismiss, nothing ahead of it
 * clears on its own.
 *
 * Only plain-text toasts collapse. A `ReactNode` has no stable key and
 * `String(node)` would fold unrelated errors onto one id.
 *
 * ponytail: the ceiling is still three. Distinct persistent errors past the
 * third queue behind the front three until one is dismissed; lifting that means
 * raising `visibleToasts`, not more work here.
 */
function collapseKey(
  title: React.ReactNode,
  description: React.ReactNode
): string | undefined {
  if (!isPlainText(title) || !isPlainText(description)) {
    return undefined
  }

  return `destructive:${title ?? ''}:${description ?? ''}`
}

function toast({ title, description, variant, duration, id, ...rest }: Toast) {
  const message = title ?? ''
  const toastId =
    variant === 'destructive' && id === undefined
      ? collapseKey(title, description)
      : id

  const options: Parameters<typeof sonnerToast>[1] & {
    id?: string | number
  } = {
    description,
    ...rest,
    ...(toastId !== undefined && { id: toastId }),
    duration:
      duration ??
      (variant === 'destructive' ? PERSIST_UNTIL_DISMISSED : DEFAULT_DURATION)
  }

  let raisedId: string | number

  switch (variant) {
    case 'success':
      raisedId = sonnerToast.success(message, options)
      break
    case 'warning':
      raisedId = sonnerToast.warning(message, options)
      break
    case 'destructive':
      raisedId = sonnerToast.error(message, options)
      break
    default:
      raisedId = sonnerToast(message, options)
      break
  }

  return {
    id: raisedId,
    dismiss: () => sonnerToast.dismiss(raisedId),
    update: (props: Partial<ToasterToast>) => {
      sonnerToast(props.title ?? message, {
        ...rest,
        id: raisedId,
        description: props.description ?? description,
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
