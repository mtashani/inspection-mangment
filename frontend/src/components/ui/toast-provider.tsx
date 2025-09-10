'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

export function ToastProvider() {
  const { theme } = useTheme()

  return (
    <Toaster
      theme={theme as 'light' | 'dark' | 'system'}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'rgb(var(--color-bg-primary))',
          border: '1px solid rgb(var(--color-border-primary))',
          color: 'rgb(var(--color-text-primary))',
        },
      }}
    />
  )
}