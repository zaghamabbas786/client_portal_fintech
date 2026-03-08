'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, getInitials, getRoleLabel } from '@/lib/utils'
import type { UserProfile } from '@/types'
import {
  LayoutDashboard,
  MessageSquare,
  Trophy,
  KeyRound,
  FolderDown,
  GraduationCap,
  Ticket,
  BarChart2,
  Share2,
  Settings,
  Lock,
  LogOut,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
  locked?: boolean
  section: 'main' | 'resources' | 'premium'
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} />, section: 'main' },
  { href: '/community', label: 'Community', icon: <MessageSquare size={15} />, badge: 5, section: 'main' },
  { href: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={15} />, section: 'main' },
  { href: '/my-eas', label: 'My EAs', icon: <KeyRound size={15} />, section: 'main' },
  { href: '/downloads', label: 'Downloads', icon: <FolderDown size={15} />, section: 'resources' },
  { href: '/education', label: 'Education', icon: <GraduationCap size={15} />, section: 'resources' },
  { href: '/support', label: 'Support', icon: <Ticket size={15} />, section: 'resources' },
  { href: '/portfolio', label: 'Portfolio', icon: <BarChart2 size={15} />, locked: true, section: 'premium' },
  { href: '/referrals', label: 'Referrals', icon: <Share2 size={15} />, section: 'premium' },
  { href: '/settings', label: 'Settings', icon: <Settings size={15} />, section: 'premium' },
]

interface SidebarProps {
  user: UserProfile
  onSignOut: () => void
}

export default function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname()
  const isAurumOrAbove = user.role === 'AURUM' || user.role === 'BOARDROOM' || user.role === 'ADMIN'
  const isAdmin = user.role === 'ADMIN'

  const sections = [
    { key: 'main', label: 'Main' },
    { key: 'resources', label: 'Resources' },
    { key: 'premium', label: 'Premium' },
  ] as const

  const displayName = user.fullName || user.email.split('@')[0]
  const initials = getInitials(user.fullName || user.email)

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-[240px] flex flex-col z-20"
      style={{ background: 'var(--bg-1)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="px-5 py-[18px]" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-[10px]">
          <div
            className="w-8 h-8 rounded-[7px] flex items-center justify-center font-black text-base text-white flex-shrink-0"
            style={{ background: 'var(--red)' }}
          >
            E
          </div>
          <div>
            <div className="text-[13px] font-bold tracking-[0.3px] leading-tight" style={{ color: 'var(--text-1)' }}>
              EOS CAPITAL TECH
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
              Client Portal
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => {
          const items = navItems.filter((item) => item.section === section.key)
          return (
            <div key={section.key}>
              <div
                className="px-5 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[1.5px]"
                style={{ color: 'var(--text-3)' }}
              >
                {section.label}
              </div>
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const isLocked =
                  item.locked && !isAurumOrAbove

                return (
                  <Link
                    key={item.href}
                    href={isLocked ? '#' : item.href}
                    className={cn(
                      'flex items-center gap-[10px] px-5 py-[9px] text-[13px] font-medium transition-all duration-100 relative',
                      'border-l-[3px]',
                      isActive
                        ? 'border-l-[var(--red)] text-[var(--red)]'
                        : 'border-l-transparent',
                      isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                      !isActive && !isLocked && 'hover:bg-[var(--bg-2)] hover:text-[var(--text-1)]'
                    )}
                    style={{
                      color: isActive ? 'var(--red)' : 'var(--text-2)',
                      background: isActive ? 'var(--red-s)' : undefined,
                    }}
                  >
                    <span className="w-[18px] text-center flex-shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && !isLocked && (
                      <span
                        className="absolute right-[14px] text-white text-[10px] font-bold px-[6px] py-[1px] rounded-full"
                        style={{ background: 'var(--red)' }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isLocked && (
                      <Lock size={10} className="absolute right-[14px]" style={{ color: 'var(--text-3)' }} />
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}

        {/* Admin link */}
        {isAdmin && (
          <div>
            <div
              className="px-5 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[1.5px]"
              style={{ color: 'var(--text-3)' }}
            >
              Admin
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-[10px] px-5 py-[9px] text-[13px] font-medium transition-all duration-100 relative border-l-[3px]',
                pathname.startsWith('/admin')
                  ? 'border-l-[var(--red)] text-[var(--red)]'
                  : 'border-l-transparent hover:bg-[var(--bg-2)] hover:text-[var(--text-1)]'
              )}
              style={{
                color: pathname.startsWith('/admin') ? 'var(--red)' : 'var(--text-2)',
                background: pathname.startsWith('/admin') ? 'var(--red-s)' : undefined,
              }}
            >
              <span className="w-[18px] text-center flex-shrink-0">
                <Settings size={15} />
              </span>
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="px-5 py-[14px]" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-[9px]">
          <div
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold text-[12px] text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--red), #b71c1c)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>
              {displayName}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
              {getRoleLabel(user.role).toUpperCase()}
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="flex-shrink-0 transition-colors"
            style={{ color: 'var(--text-3)' }}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
