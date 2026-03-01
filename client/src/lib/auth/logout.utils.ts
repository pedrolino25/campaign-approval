'use client'

import type { QueryClient } from '@tanstack/react-query'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export function performLogout(queryClient: QueryClient, router: AppRouterInstance): void {
  queryClient.clear()

  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    const channel = new BroadcastChannel('worklient_session_channel')
    channel.postMessage({ type: 'SESSION_INVALIDATED' })
    channel.close()
  }

  router.replace('/login')
}
