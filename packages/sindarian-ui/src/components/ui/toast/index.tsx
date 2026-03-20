'use client'

import * as React from 'react'

/**
 * Backward-compatible type exports.
 *
 * The Radix Toast primitives (ToastProvider, ToastViewport, Toast, etc.) are
 * no longer used -- Sonner manages rendering internally. These types are kept
 * so that any downstream code referencing ToastProps or ToastActionElement
 * continues to compile.
 */

export type ToastActionElement = React.ReactElement

export type ToastProps = {
  variant?: 'default' | 'success' | 'destructive'
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  duration?: number
}
