'use client'

import { Toaster as SonnerToaster } from 'sonner'

import { useOptionalTheme } from '@/theme/theme-provider'

type ToasterProps = {
  /**
   * Forces the toast theme. Omit it inside a `ThemeProvider` to follow the
   * resolved theme automatically; with no provider the fallback is `'system'`,
   * leaving the light/dark call to sonner's own media query.
   */
  theme?: 'light' | 'dark' | 'system'
}

export function Toaster({ theme }: ToasterProps) {
  // Optional read: a Toaster mounted outside any ThemeProvider must still
  // render, so this cannot go through `useTheme`, which throws.
  const themeContext = useOptionalTheme()

  return (
    <SonnerToaster
      theme={theme ?? themeContext?.resolvedTheme ?? 'system'}
      position="bottom-right"
      visibleToasts={3}
      duration={10000}
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
