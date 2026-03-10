'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Calls /api/referral/track-from-session when user has ref in user_metadata.
 * Runs once on mount - ref survives in Supabase user_metadata from signup.
 */
export default function ReferralTrackerClient() {
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    async function track() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.user_metadata?.ref) return

      try {
        await fetch('/api/referral/track-from-session', {
          method: 'POST',
          credentials: 'same-origin',
        })
      } catch {
        // Non-critical
      }
    }

    track()
  }, [])

  return null
}
