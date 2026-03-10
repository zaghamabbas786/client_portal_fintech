'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './Sidebar'
import type { UserProfile } from '@/types'
import { Menu } from 'lucide-react'

const SIDEBAR_WIDTH = 240

export default function SidebarWrapper({ user, children, communityNewCount = 0 }: { user: UserProfile; children?: React.ReactNode; communityNewCount?: number }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile sidebar when resizing to desktop so it stays closed when going back to mobile
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = () => {
      if (mq.matches) setMobileOpen(false)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const hamburgerButton = (
    <button
      data-testid="menu-toggle"
      onClick={() => setMobileOpen(true)}
      className="fixed top-4 left-4 z-30 lg:hidden w-9 h-9 rounded-lg flex items-center justify-center shadow-lg"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        color: 'var(--text-2)',
      }}
      aria-label="Open navigation"
    >
      <Menu size={18} />
    </button>
  )

  return (
    <>
      {/* Mobile hamburger — portaled to body so it stays fixed when scrolling */}
      {mounted && document.body && createPortal(hamburgerButton, document.body)}

      {/* Overlay — mobile only, closed by default */}
      {mobileOpen && (
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — on mobile: hidden off-screen by default, slides in when open */}
      <div
        className={[
          'fixed top-0 left-0 h-screen z-50',
          'transition-transform duration-200 ease-out',
          // Mobile: translate off-screen when closed
          'max-lg:transition-transform max-lg:duration-200',
          mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
          // Desktop: always visible
          'lg:translate-x-0',
        ].join(' ')}
        style={{ width: SIDEBAR_WIDTH }}
      >
        <Sidebar
          user={user}
          onSignOut={handleSignOut}
          signingOut={signingOut}
          onNavClick={() => setMobileOpen(false)}
          showMobileClose={mobileOpen}
          communityNewCount={communityNewCount}
        />
      </div>

      {/* Main content — margin adjusts for sidebar width */}
      {children && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @media (min-width: 1024px) {
              .portal-main-with-sidebar {
                margin-left: ${SIDEBAR_WIDTH}px;
                max-width: calc(100vw - ${SIDEBAR_WIDTH}px);
              }
            }
          `}} />
          <main className="portal-main-with-sidebar flex-1 p-4 sm:p-7 pt-16 lg:pt-7 transition-[margin,max-width] duration-200">
            {children}
          </main>
        </>
      )}
    </>
  )
}
