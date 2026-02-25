import { QueryClient } from '@tanstack/react-query'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: true,
        staleTime: 30_000,
        gcTime: 5 * 60 * 1000,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}
