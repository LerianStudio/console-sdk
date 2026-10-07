'use client'

import type { ComponentProps } from 'react'
import { Toaster as SonnerToaster } from 'sonner'

import { DEFAULT_DURATION } from '@/hooks/use-toast'
import { useOptionalTheme } from '@/theme/theme-provider'

type ToasterProps = {
  /**
   * Forces the toast theme. Omit it inside a `ThemeProvider` to follow the
   * resolved theme automatically; with no provider the fallback is `'system'`,
   * leaving the light/dark call to sonner's own media query.
   */
  theme?: 'light' | 'dark' | 'system'
  /** Where the toast stack sits on screen. Defaults to `'bottom-right'`. */
  position?: ComponentProps<typeof SonnerToaster>['position']
}

export function Toaster({ theme, position = 'bottom-right' }: ToasterProps) {
  // Optional read: a Toaster mounted outside any ThemeProvider must still
  // render, so this cannot go through `useTheme`, which throws.
  const themeContext = useOptionalTheme()

  return (
    <SonnerToaster
      theme={theme ?? themeContext?.resolvedTheme ?? 'system'}
      position={position}
      visibleToasts={3}
      duration={DEFAULT_DURATION}
      expand={false}
      closeButton
      richColors={false}
      offset={16}
      gap={8}
      toastOptions={{
        className: 'font-sans !text-sm !font-medium'
      }}
    />
  )
}
