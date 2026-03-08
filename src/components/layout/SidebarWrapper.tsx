'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './Sidebar'
import type { UserProfile } from '@/types'

export default function SidebarWrapper({ user }: { user: UserProfile }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return <Sidebar user={user} onSignOut={handleSignOut} />
}
