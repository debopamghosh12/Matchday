import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api'

const MAX_RETRIES = 3

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry server errors, network errors and rate limits; not bad requests.
      retry: (failureCount, error) => {
        if (failureCount >= MAX_RETRIES) return false
        if (error instanceof ApiError) {
          return error.status === 0 || error.status === 429 || error.status >= 500
        }
        return true
      },
      // Exponential backoff (2s, 4s, 8s...), or the server's Retry-After on 429.
      retryDelay: (attempt, error) => {
        if (error instanceof ApiError && error.isRateLimited && error.retryAfter) {
          return Math.min(error.retryAfter, 60) * 1000
        }
        return Math.min(2000 * 2 ** attempt, 30_000)
      },
      refetchOnWindowFocus: false,
      // Always try the request: offline, the service worker answers from its cache
      // (React Query's default 'online' mode would pause instead).
      networkMode: 'offlineFirst',
    },
  },
})
