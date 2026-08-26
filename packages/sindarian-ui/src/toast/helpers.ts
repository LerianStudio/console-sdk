'use client'

/**
 * Severity toast helpers — thin wrappers over sindarian-ui's own toast
 * machinery (`@/hooks/use-toast`), which renders through `<Toaster />`.
 *
 * The bare `toast` is deliberately NOT re-exported here: sindarian-ui already
 * exports it from the main barrel, and one name must resolve to one function.
 * Call `toast({ title, description, variant })` directly when a helper does not
 * fit.
 *
 * Variant mapping — one helper per severity, onto sindarian-ui's own variants:
 *
 *   successToast → 'success'      (green)
 *   errorToast   → 'destructive'  (red)
 *   warningToast → 'warning'      (amber)
 */
import { toast } from '@/hooks/use-toast'
import type { ToastActionElement } from '@/components/ui/toast'

/** Extra toast props for the severity helpers (the variant is fixed per helper). */
export interface ToastOptions {
  /** Optional action element rendered inside the toast. */
  action?: ToastActionElement
  /**
   * Originating error code, when the toast was raised from an API failure.
   * Accepted for call-site compatibility; sindarian-ui's toast has no slot for
   * it, so it is not rendered. Put it in `description` if it must be visible.
   */
  errorCode?: string
}

function raise(
  variant: 'success' | 'warning' | 'destructive',
  title: string,
  description?: string,
  opts?: Partial<ToastOptions>
): void {
  toast({ action: opts?.action, variant, title, description })
}

export function successToast(
  title: string,
  description?: string,
  opts?: Partial<ToastOptions>
): void {
  raise('success', title, description, opts)
}

export function errorToast(
  title: string,
  description?: string,
  opts?: Partial<ToastOptions>
): void {
  raise('destructive', title, description, opts)
}

export function warningToast(
  title: string,
  description?: string,
  opts?: Partial<ToastOptions>
): void {
  raise('warning', title, description, opts)
}
