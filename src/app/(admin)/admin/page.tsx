import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Users, MessageSquare, Ticket, BarChart2, FileText } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin Panel' }

export default async function AdminPage() {
  const [totalUsers, totalPosts, openTickets, totalDownloads] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.supportTicket.count({ where: { status: { not: 'RESOLVED' } } }),
    prisma.download.count(),
  ])

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, fullName: true, email: true, role: true, createdAt: true },
  })

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: <Users size={18} />, color: 'var(--blue)', bg: 'var(--blue-s)' },
    { label: 'Community Posts', value: totalPosts, icon: <MessageSquare size={18} />, color: 'var(--green)', bg: 'var(--green-s)' },
    { label: 'Open Tickets', value: openTickets, icon: <Ticket size={18} />, color: 'var(--red)', bg: 'var(--red-s)' },
    { label: 'Downloads', value: totalDownloads, icon: <FileText size={18} />, color: 'var(--gold)', bg: 'var(--gold-s)' },
  ]

  const ROLE_COLOR: Record<string, { bg: string; color: string }> = {
    STANDARD: { bg: 'var(--bg-3)', color: 'var(--text-3)' },
    AURUM: { bg: 'var(--gold-s)', color: 'var(--gold)' },
    BOARDROOM: { bg: 'var(--purple-s)', color: 'var(--purple)' },
    ADMIN: { bg: 'var(--red-s)', color: 'var(--red)' },
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1" style={{ color: 'var(--text-1)' }}>
          Admin Panel
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          Manage users, content, and platform settings.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[10px] p-5"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
          >
            <div
              className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3"
              style={{ background: stat.bg, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="font-mono font-bold text-[28px] mb-0.5" style={{ color: 'var(--text-1)' }}>
              {stat.value}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { href: '/admin/users', label: 'User Management', desc: 'Manage roles, assign EAs, view activity', icon: <Users size={20} /> },
          { href: '/admin/content', label: 'Content Management', desc: 'Upload resources, manage videos', icon: <FileText size={20} /> },
          { href: '/admin/tickets', label: 'Support Tickets', desc: 'Respond to and manage tickets', icon: <Ticket size={20} /> },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-[10px] p-5 transition-all hover:border-[#333345] block"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
          >
            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3" style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}>
              {link.icon}
            </div>
            <div className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{link.label}</div>
            <div className="text-[12px]" style={{ color: 'var(--text-3)' }}>{link.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent Users */}
      <div
        className="rounded-[10px] overflow-hidden"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>Recent Users</span>
          <Link href="/admin/users" className="text-[12px]" style={{ color: 'var(--red)' }}>View All</Link>
        </div>
        {recentUsers.map((user) => {
          const roleStyle = ROLE_COLOR[user.role] ?? ROLE_COLOR.STANDARD
          return (
            <div
              key={user.id}
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--red), #b71c1c)' }}
                >
                  {(user.fullName || user.email)[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>
                    {user.fullName || user.email.split('@')[0]}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>{user.email}</div>
                </div>
              </div>
              <span
                className="text-[10px] font-bold px-[9px] py-[3px] rounded-full"
                style={{ background: roleStyle.bg, color: roleStyle.color }}
              >
                {user.role}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
