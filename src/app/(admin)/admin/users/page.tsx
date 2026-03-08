import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'User Management' }

const ROLE_COLOR: Record<string, { bg: string; color: string }> = {
  STANDARD: { bg: 'var(--bg-3)', color: 'var(--text-3)' },
  AURUM: { bg: 'var(--gold-s)', color: 'var(--gold)' },
  BOARDROOM: { bg: 'var(--purple-s)', color: 'var(--purple)' },
  ADMIN: { bg: 'var(--red-s)', color: 'var(--red)' },
}

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { posts: true, tickets: true } } },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1" style={{ color: 'var(--text-1)' }}>
          User Management
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          {users.length} total users
        </p>
      </div>

      <div
        className="rounded-[10px] overflow-hidden"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <div
          className="grid px-5 py-3 text-[10px] font-bold uppercase tracking-[1px]"
          style={{ gridTemplateColumns: '1fr 140px 80px 80px 120px', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}
        >
          <span>USER</span>
          <span>JOINED</span>
          <span>POSTS</span>
          <span>TICKETS</span>
          <span>ROLE</span>
        </div>

        {users.map((user) => {
          const roleStyle = ROLE_COLOR[user.role] ?? ROLE_COLOR.STANDARD
          return (
            <div
              key={user.id}
              className="grid px-5 py-3 text-[13px]"
              style={{ gridTemplateColumns: '1fr 140px 80px 80px 120px', borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <div className="font-semibold" style={{ color: 'var(--text-1)' }}>
                  {user.fullName || '—'}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>{user.email}</div>
              </div>
              <div className="text-[12px] self-center" style={{ color: 'var(--text-3)' }}>
                {formatDate(user.createdAt, 'MMM d, yyyy')}
              </div>
              <div className="font-mono self-center" style={{ color: 'var(--text-2)' }}>
                {user._count.posts}
              </div>
              <div className="font-mono self-center" style={{ color: 'var(--text-2)' }}>
                {user._count.tickets}
              </div>
              <span
                className="text-[10px] font-bold px-[9px] py-[3px] rounded-full self-center w-fit"
                style={{ background: roleStyle.bg, color: roleStyle.color }}
              >
                {user.role}
              </span>
            </div>
          )
        })}

        {users.length === 0 && (
          <div className="px-5 py-10 text-center" style={{ color: 'var(--text-3)' }}>
            No users yet.
          </div>
        )}
      </div>
    </div>
  )
}
