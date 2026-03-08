import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupportTicket {
  id: string
  subject: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  createdAt: string
  updatedAt: string
  _count?: { replies: number }
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const supportKeys = {
  all: ['support'] as const,
  tickets: () => ['support', 'tickets'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetches and caches the user's support tickets. */
export function useTickets() {
  return useQuery({
    queryKey: supportKeys.tickets(),
    queryFn: async (): Promise<SupportTicket[]> => {
      const res = await fetch('/api/support')
      if (!res.ok) throw new Error('Failed to load tickets')
      const data = await res.json()
      return data.tickets ?? []
    },
  })
}

/** Submits a new ticket, then invalidates the tickets list. */
export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { subject: string; description: string; priority: string }) => {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit ticket')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportKeys.tickets() })
    },
  })
}
