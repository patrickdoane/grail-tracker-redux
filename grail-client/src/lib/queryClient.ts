import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './apiClient'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      retry(failureCount: number, error: unknown) {
        if (isApiError(error)) {
          // Only retry server-side errors (>= 500)
          if (error.status >= 500 && failureCount < 2) {
            return true
          }
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
