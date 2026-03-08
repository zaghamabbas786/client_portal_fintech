import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh for 3 min — no refetch on window focus within this window
        staleTime: 3 * 60 * 1000,
        // Keep unused data in cache for 5 min before garbage-collecting
        gcTime: 5 * 60 * 1000,
        // Don't hammer the server on transient failures
        retry: 1,
        // Refetch when user comes back to the tab after being away
        refetchOnWindowFocus: true,
      },
    },
  })
}

// Browser singleton — one QueryClient for the entire app session
let browserClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client (no shared state between requests)
    return makeQueryClient()
  }
  // Browser: reuse the same client so the cache persists across navigations
  if (!browserClient) browserClient = makeQueryClient()
  return browserClient
}
