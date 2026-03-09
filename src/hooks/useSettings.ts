import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SettingsUser {
  id: string
  fullName: string | null
  email: string
  phone: string | null
  avatarUrl: string | null
  emailNotifications: boolean
  communityAlerts: boolean
  payoutUpdates: boolean
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const settingsKeys = {
  all: ['settings'] as const,
  user: () => ['settings', 'user'] as const,
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetches and caches user settings. Cached for 5 min so switching back is instant. */
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.user(),
    queryFn: async (): Promise<SettingsUser> => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      if (!data.user) throw new Error('No user data')
      return data.user
    },
    staleTime: 5 * 60 * 1000, // 5 min — don't refetch when switching tabs
    gcTime: 10 * 60 * 1000,   // 10 min — keep in cache
  })
}

/** Updates profile + notification prefs, then invalidates cache. */
export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      fullName?: string
      phone?: string
      emailNotifications?: boolean
      communityAlerts?: boolean
      payoutUpdates?: boolean
    }) => {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      return data.user as SettingsUser
    },
    onSuccess: (user) => {
      qc.setQueryData(settingsKeys.user(), user)
    },
  })
}

/** Updates avatar URL only, then invalidates cache. */
export function useUpdateAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (avatarUrl: string) => {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save avatar')
      return data.user as SettingsUser
    },
    onSuccess: (user) => {
      qc.setQueryData(settingsKeys.user(), user)
    },
  })
}
