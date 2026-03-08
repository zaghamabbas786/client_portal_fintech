'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './Sidebar'
import type { UserProfile } from '@/types'

export default function SidebarWrapper({ user }: { user: UserProfile }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return <Sidebar user={user} onSignOut={handleSignOut} signingOut={signingOut} />
}
