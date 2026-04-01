'use client'

import { Toaster as SonnerToaster } from 'sonner'

type ToasterProps = {
  theme?: 'light' | 'dark' | 'system'
}

export function Toaster({ theme = 'system' }: ToasterProps) {
  return (
    <SonnerToaster
      theme={theme}
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
