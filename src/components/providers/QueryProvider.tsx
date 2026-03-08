'use client'

import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { makeQueryClient } from '@/lib/query-client'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures the client is only created once per component lifecycle,
  // preventing a new QueryClient on every render in strict mode.
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only loads in development — zero production bundle impact */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
