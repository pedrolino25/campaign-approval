'use client'

import { Toaster } from '@/lib/hooks/use-toast'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}
