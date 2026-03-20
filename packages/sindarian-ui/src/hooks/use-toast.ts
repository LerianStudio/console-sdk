'use client'

import { toast as sonnerToast } from 'sonner'

import type { ToastActionElement } from '@/components/ui/toast'

const DEFAULT_DURATION = 10000
const DESTRUCTIVE_DURATION = Infinity

type ToastVariant = 'default' | 'success' | 'destructive'

type ToasterToast = {
  id: string | number
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
  action?: ToastActionElement
}

type Toast = Omit<ToasterToast, 'id'>

function toast({ title, description, variant, ...rest }: Toast) {
  const message = title ?? ''
  const options: Parameters<typeof sonnerToast>[1] & { id?: string } = {
    description,
    ...rest
  }

  let id: string | number

  switch (variant) {
    case 'success':
      options.duration = DEFAULT_DURATION
      id = sonnerToast.success(message, options)
      break
    case 'destructive':
      options.duration = DESTRUCTIVE_DURATION
      id = sonnerToast.error(message, options)
      break
    default:
      options.duration = DEFAULT_DURATION
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
        ...rest
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
