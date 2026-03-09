'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './Sidebar'
import type { UserProfile } from '@/types'
import { Menu } from 'lucide-react'

export default function SidebarWrapper({ user }: { user: UserProfile }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile hamburger — only shown on small screens */}
      <button
        data-testid="menu-toggle"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* Overlay — mobile only */}
      {mobileOpen && (
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          'fixed top-0 left-0 h-screen z-50',
          // On desktop: always visible, on mobile: slide in/out
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'transition-transform duration-200',
        ].join(' ')}
      >
        <Sidebar
          user={user}
          onSignOut={handleSignOut}
          signingOut={signingOut}
          onNavClick={() => setMobileOpen(false)}
        />
      </div>
    </>
  )
}
