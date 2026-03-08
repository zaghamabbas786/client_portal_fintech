import { Metadata } from 'next'
import { getUserProfile } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { formatCurrencyDetailed, formatCurrency, formatRelativeTime, getInitials } from '@/lib/utils'
import Link from 'next/link'
import { ArrowRight, Lock, Download, Play, Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

// ─── Mock ticker items (replaced by DB in production) ────────────────────────
const TICKER_ITEMS = [
  { name: 'Marcus T.', system: 'Aurum', amount: 4218 },
  { name: 'James R.', system: 'Omni', amount: 1847 },
  { name: 'Karen W.', system: 'Aurum', text: 'Just activated Aurum 🚀' },
  { name: 'Larry O.', system: 'Aurum', amount: 5604 },
  { name: 'Sarah B.', system: 'Omni', amount: 3210 },
  { name: 'Gio A.', system: 'Aurum', amount: 8613 },
  { name: 'Dave H.', system: 'Omni', text: 'Challenge passed ✅' },
]

export default async function DashboardPage() {
  const userProfile = await getUserProfile()
  if (!userProfile) return null

  const isStandard = userProfile.role === 'STANDARD'
  const displayName = (userProfile.fullName || userProfile.email.split('@')[0]).split(' ')[0]

  // Fetch community highlights (latest 4 posts)
  const communityPosts = await prisma.post.findMany({
    take: 4,
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: {
      user: { select: { id: true, fullName: true, email: true, role: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  // Fetch leaderboard (current month)
  const now = new Date()
  const currentMonth = now.toLocaleString('en-US', { month: 'long' })
  const currentYear = now.getFullYear()

  const leaderboard = await prisma.leaderboardEntry.findMany({
    where: { month: currentMonth, year: currentYear },
    orderBy: { payout: 'desc' },
    take: 8,
    include: { user: { select: { id: true, fullName: true, role: true } } },
  })

  // Fetch user EAs
  const userEAs = await prisma.userEA.findMany({
    where: { userId: userProfile.id },
    include: { ea: true },
  })

  // Fetch all EAs (to show locked ones)
  const allEAs = await prisma.eA.findMany({ orderBy: { name: 'asc' } })

  // Fetch downloads (Standard tier)
  const downloads = await prisma.download.findMany({
    where: { requiredRole: 'STANDARD', isLatest: true },
    take: 4,
    orderBy: { createdAt: 'desc' },
  })

  // Fetch videos (4 latest)
  const videos = await prisma.video.findMany({
    where: { requiredRole: 'STANDARD' },
    take: 4,
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
  })

  // Fetch latest support tickets
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: userProfile.id },
    take: 2,
    orderBy: { createdAt: 'desc' },
  })

  // ─── Tag color helpers ─────────────────────────────────────────────────────
  const tagStyle: Record<string, { bg: string; color: string; border: string; label: string }> = {
    PAYOUT: { bg: 'var(--green-s)', color: 'var(--green)', border: 'var(--green)', label: 'PAYOUT' },
    AURUM_RESULTS: { bg: 'var(--gold-s)', color: 'var(--gold)', border: 'var(--gold)', label: 'AURUM' },
    CHALLENGE_PASSED: { bg: 'var(--blue-s)', color: 'var(--blue)', border: 'transparent', label: 'CHALLENGE' },
    GENERAL: { bg: 'var(--blue-s)', color: 'var(--blue)', border: 'transparent', label: 'GENERAL' },
    QUESTION: { bg: 'var(--purple-s)', color: 'var(--purple)', border: 'transparent', label: 'QUESTION' },
  }

  const avatarGradients = [
    'linear-gradient(135deg,#D4AF37,#8B6914)',
    'linear-gradient(135deg,#00C853,#009624)',
    'linear-gradient(135deg,#42A5F5,#1565C0)',
    'linear-gradient(135deg,#E53935,#b71c1c)',
    'linear-gradient(135deg,#AB47BC,#6a1b9a)',
  ]

  const ticketStatusStyle: Record<string, { bg: string; color: string; label: string }> = {
    OPEN: { bg: 'var(--blue-s)', color: 'var(--blue)', label: 'Open' },
    IN_PROGRESS: { bg: 'var(--gold-s)', color: 'var(--gold)', label: 'In Progress' },
    RESOLVED: { bg: 'var(--green-s)', color: 'var(--green)', label: 'Resolved' },
  }

  const ticketPriorityStyle: Record<string, { bg: string; color: string }> = {
    HIGH: { bg: 'var(--red-s)', color: 'var(--red)' },
    MEDIUM: { bg: 'var(--gold-s)', color: 'var(--gold)' },
    LOW: { bg: 'var(--green-s)', color: 'var(--green)' },
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div
        className="rounded-xl px-7 py-6 mb-[22px] flex justify-between items-center"
        style={{
          background: 'linear-gradient(135deg, var(--bg-2) 0%, rgba(229,57,53,0.06) 100%)',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <h1 className="text-[22px] font-bold mb-1" style={{ color: 'var(--text-1)' }}>
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            Here&apos;s what&apos;s happening in your account.
          </p>
        </div>
        <a
          href={process.env.NEXT_PUBLIC_CALENDLY_URL || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-[7px] rounded-[7px] text-[12px] font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--red)' }}
        >
          Book a Call with Gio
        </a>
      </div>

      {/* Live Results Ticker */}
      <div
        className="rounded-[10px] px-[18px] py-3 mb-[14px] flex items-center gap-[10px] overflow-hidden"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-[1px] flex-shrink-0 flex items-center gap-1.5"
          style={{ color: 'var(--red)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--red)' }} />
          LIVE RESULTS
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex gap-6 ticker-animate" style={{ width: 'max-content' }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div key={i} className="text-[13px] flex-shrink-0" style={{ color: 'var(--text-2)' }}>
                {item.name} —{' '}
                {item.amount ? (
                  <>
                    {item.system}{' '}
                    <span className="font-bold font-mono" style={{ color: 'var(--green)' }}>
                      ${item.amount.toLocaleString()}
                    </span>
                  </>
                ) : (
                  item.text
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1: Community Highlights + Payout Leaderboard */}
      <div className="grid grid-cols-2 gap-[14px] mb-[22px]">

        {/* Community Highlights */}
        <div
          className="rounded-[10px] p-[18px]"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center mb-[14px]">
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>
              💬 Community Highlights
            </span>
            <Link
              href="/community"
              className="ml-auto text-[11px] flex items-center gap-1 hover:opacity-80"
              style={{ color: 'var(--text-3)' }}
            >
              View All <ArrowRight size={11} />
            </Link>
          </div>

          <div className="space-y-2">
            {communityPosts.length === 0 ? (
              // Fallback mock data matching screenshots
              [
                { name: 'Anonymous', time: 'a day ago', tag: 'PAYOUT', body: 'I made a billion', amount: '1000000', tagStyle: { bg: 'var(--green-s)', color: 'var(--green)' } },
                { name: 'Anonymous', time: 'a day ago', tag: 'PAYOUT', body: 'I just made $6,500', amount: '6500', tagStyle: { bg: 'var(--green-s)', color: 'var(--green)' } },
                { name: 'Vivid Capital', time: 'a day ago', tag: 'AURUM', body: 'I just made', amount: '5000', tagStyle: { bg: 'var(--gold-s)', color: 'var(--gold)' } },
                { name: 'Vivid Capital', time: 'a day ago', tag: 'AURUM', body: 'I just made $500 with aurum', amount: null, tagStyle: { bg: 'var(--gold-s)', color: 'var(--gold)' } },
              ].map((post, i) => (
                <div
                  key={i}
                  className="p-[14px] rounded-lg"
                  style={{
                    background: 'var(--bg-1)',
                    border: `1px solid var(--border)`,
                    borderLeft: `3px solid ${post.tag === 'AURUM' ? 'var(--gold)' : 'var(--green)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                      style={{ background: avatarGradients[i % avatarGradients.length] }}
                    >
                      {post.name[0]}
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold" style={{ color: 'var(--text-1)' }}>{post.name}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>{post.time}</div>
                    </div>
                    <span
                      className="ml-auto text-[9px] font-bold px-[7px] py-[2px] rounded-[3px]"
                      style={{ background: post.tagStyle.bg, color: post.tagStyle.color }}
                    >
                      {post.tag}
                    </span>
                  </div>
                  <p className="text-[13px] mb-1" style={{ color: 'var(--text-2)' }}>{post.body}</p>
                  {post.amount && (
                    <div className="font-mono text-[22px] font-bold my-1.5" style={{ color: 'var(--green)' }}>
                      ${parseFloat(post.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </div>
                  )}
                  <div className="flex gap-3 mt-2 text-[11px]" style={{ color: 'var(--text-3)' }}>
                    <span>❤️ 0</span>
                    <span>💬 0</span>
                  </div>
                </div>
              ))
            ) : (
              communityPosts.map((post, i) => {
                const ts = tagStyle[post.tag] ?? tagStyle.GENERAL
                const isAurum = post.tag === 'AURUM_RESULTS'
                const isPayout = post.tag === 'PAYOUT'
                const postUser = post.user.fullName || post.user.email.split('@')[0]

                return (
                  <div
                    key={post.id}
                    className="p-[14px] rounded-lg"
                    style={{
                      background: 'var(--bg-1)',
                      border: `1px solid var(--border)`,
                      borderLeft: isAurum ? '3px solid var(--gold)' : isPayout ? '3px solid var(--green)' : '1px solid var(--border)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ background: avatarGradients[i % avatarGradients.length] }}
                      >
                        {getInitials(postUser)}
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold" style={{ color: 'var(--text-1)' }}>{postUser}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>{formatRelativeTime(post.createdAt)}</div>
                      </div>
                      <span
                        className="ml-auto text-[9px] font-bold px-[7px] py-[2px] rounded-[3px]"
                        style={{ background: ts.bg, color: ts.color }}
                      >
                        {ts.label}
                      </span>
                    </div>
                    <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>{post.content}</p>
                    {post.amount && (
                      <div className="font-mono text-[22px] font-bold my-1.5" style={{ color: 'var(--green)' }}>
                        {formatCurrencyDetailed(post.amount.toString())}
                      </div>
                    )}
                    <div className="flex gap-3 mt-2 text-[11px]" style={{ color: 'var(--text-3)' }}>
                      <span>❤️ {post._count.likes}</span>
                      <span>💬 {post._count.comments}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Payout Leaderboard */}
        <div
          className="rounded-[10px] p-[18px]"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center mb-[14px]">
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>
              🏆 Payout Leaderboard
            </span>
            <Link
              href="/leaderboard"
              className="ml-auto text-[11px] flex items-center gap-1 hover:opacity-80"
              style={{ color: 'var(--red)' }}
            >
              Full Rankings
            </Link>
          </div>

          {/* Header row */}
          <div
            className="grid gap-1 px-[14px] mb-2 text-[10px] font-semibold"
            style={{ gridTemplateColumns: '24px 1fr 80px 80px', color: 'var(--text-3)' }}
          >
            <span>#</span>
            <span>TRADER</span>
            <span className="text-right">SYSTEM</span>
            <span className="text-right">PAYOUT</span>
          </div>

          {/* Leaderboard rows — use mock if DB empty */}
          {(leaderboard.length > 0
            ? leaderboard.map((entry, i) => {
                const isUser = entry.userId === userProfile.id
                const rank = i + 1
                const rankColor = rank === 1 ? 'var(--gold)' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--text-2)'
                const isAurum = entry.user.role !== 'STANDARD'

                return {
                  id: entry.id,
                  rank,
                  name: entry.user.fullName || 'User',
                  system: entry.system,
                  payout: formatCurrency(entry.payout.toString()),
                  isUser,
                  rankColor,
                  isAurum,
                }
              })
            : [
                { id: '1', rank: 1, name: 'Aiden W.', system: 'Aurum', payout: '$8,613', isUser: false, rankColor: 'var(--gold)', isAurum: true },
                { id: '2', rank: 2, name: 'Liam B.', system: 'Aurum', payout: '$6,782', isUser: false, rankColor: '#C0C0C0', isAurum: true },
                { id: '3', rank: 3, name: 'Sophia L.', system: 'Aurum', payout: '$5,684', isUser: false, rankColor: '#CD7F32', isAurum: true },
                { id: '4', rank: 4, name: 'Marcus T.', system: 'Aurum', payout: '$4,218', isUser: false, rankColor: 'var(--text-2)', isAurum: true },
                { id: '5', rank: 5, name: 'Emma C.', system: 'Omni', payout: '$3,210', isUser: false, rankColor: 'var(--text-2)', isAurum: false },
                { id: '6', rank: 6, name: 'Daniel K.', system: 'Omni', payout: '$3,149', isUser: false, rankColor: 'var(--text-2)', isAurum: false },
                { id: '7', rank: 7, name: 'Olivia M.', system: 'Omni', payout: '$2,455', isUser: false, rankColor: 'var(--text-2)', isAurum: false },
                { id: '8', rank: 8, name: 'James R.', system: 'Omni', payout: '$1,847', isUser: false, rankColor: 'var(--text-2)', isAurum: false },
              ]
          ).map((row) => (
            <div
              key={row.id}
              className="grid gap-1 px-[14px] py-[9px] rounded-[6px] mb-0.5 text-[12px]"
              style={{
                gridTemplateColumns: '24px 1fr 80px 80px',
                background: row.isUser ? 'var(--blue-s)' : row.rank === 1 ? 'var(--gold-s)' : 'transparent',
                border: row.isUser
                  ? '1px solid rgba(66,165,245,0.15)'
                  : row.rank === 1
                  ? '1px solid rgba(212,175,55,0.15)'
                  : '1px solid transparent',
              }}
            >
              <span
                className="font-mono font-bold text-[13px]"
                style={{ color: row.rankColor }}
              >
                {row.rank}
              </span>
              <span
                className="font-semibold truncate"
                style={{ color: row.isUser ? 'var(--blue)' : 'var(--text-1)' }}
              >
                {row.isUser ? 'You' : row.name}
              </span>
              <span
                className="text-right text-[11px] font-semibold"
                style={{ color: row.isAurum ? 'var(--gold)' : 'var(--text-3)' }}
              >
                {row.system}
              </span>
              <span className="font-mono font-bold text-right" style={{ color: 'var(--green)' }}>
                {row.payout}
              </span>
            </div>
          ))}

          {/* Footer banner */}
          <div
            className="text-center mt-[14px] py-[10px] rounded-[6px]"
            style={{ background: 'var(--gold-s)' }}
          >
            <span className="text-[12px] font-semibold" style={{ color: 'var(--gold)' }}>
              ⭐ Top performers are all Aurum clients.
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: My EAs (7) + Upgrade Card (5) */}
      <div className="grid mb-[22px]" style={{ gridTemplateColumns: '7fr 5fr', gap: '14px' }}>

        {/* My EAs */}
        <div
          className="rounded-[10px] p-[18px]"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center mb-[14px]">
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>
              🔑 My EAs
            </span>
            <Link
              href="/my-eas"
              className="ml-auto text-[11px] flex items-center gap-1 hover:opacity-80"
              style={{ color: 'var(--red)' }}
            >
              Manage
            </Link>
          </div>

          <div className="space-y-1.5">
            {userEAs.length > 0 ? (
              userEAs.map((uea) => (
                <div
                  key={uea.id}
                  className="flex items-center justify-between px-[14px] py-3 rounded-[7px]"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-[10px]">
                    <div
                      className="w-8 h-8 rounded-[7px] flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--green-s)' }}
                    >
                      ⚡
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>
                        {uea.ea.name}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                        {uea.broker ?? 'No broker'} · Acc: {uea.accountNumber ?? 'N/A'}
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-[9px] py-[3px] rounded-full"
                    style={{ background: 'var(--green-s)', color: 'var(--green)' }}
                  >
                    ● Active
                  </span>
                </div>
              ))
            ) : (
              // Mock EA entries matching screenshots
              <>
                {[
                  { name: 'Omni EA', sub: 'TTT · Acc: 847291' },
                  { name: 'Asia Scalper', sub: 'TTT · Acc: 847291' },
                ].map((ea, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-[14px] py-3 rounded-[7px]"
                    style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-[10px]">
                      <div
                        className="w-8 h-8 rounded-[7px] flex items-center justify-center"
                        style={{ background: 'var(--green-s)' }}
                      >
                        ⚡
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>{ea.name}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>{ea.sub}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-[9px] py-[3px] rounded-full" style={{ background: 'var(--green-s)', color: 'var(--green)' }}>
                      ● Active
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* Locked Aurum EA */}
            {isStandard && (
              <div
                className="flex items-center justify-between px-[14px] py-3 rounded-[7px]"
                style={{ background: 'var(--bg-1)', border: '1px dashed var(--gold)' }}
              >
                <div className="flex items-center gap-[10px]">
                  <div className="w-8 h-8 rounded-[7px] flex items-center justify-center" style={{ background: 'var(--gold-s)' }}>
                    🔒
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--gold)' }}>Aurum EA</div>
                    <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>Premium algorithmic strategy</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-[9px] py-[3px] rounded-full" style={{ background: 'var(--gold-s)', color: 'var(--gold)' }}>
                  Upgrade Required
                </span>
              </div>
            )}

            {/* Coming soon EA */}
            <div
              className="flex items-center justify-between px-[14px] py-3 rounded-[7px]"
              style={{ background: 'var(--bg-1)', border: '1px dashed var(--border)' }}
            >
              <div className="flex items-center gap-[10px]">
                <div className="w-8 h-8 rounded-[7px] flex items-center justify-center" style={{ background: 'var(--red-s)' }}>
                  🔒
                </div>
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--text-3)' }}>Limitless BTC</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>Crypto · Coming soon</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-[9px] py-[3px] rounded-full" style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}>
                Soon
              </span>
            </div>
          </div>
        </div>

        {/* Right column: Upgrade Card + Portfolio Preview */}
        <div className="flex flex-col gap-[14px]">

          {/* Aurum Upgrade Card */}
          {isStandard && (
            <div
              className="rounded-[10px] p-5 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(229,57,53,0.06))',
                border: '1px dashed var(--gold)',
              }}
            >
              <div className="text-[28px] mb-2">🏆</div>
              <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--gold)' }}>
                Upgrade to Aurum
              </h3>
              <p className="text-[12px] mb-3 leading-relaxed" style={{ color: 'var(--text-2)' }}>
                4.8% avg monthly return · $40k+ in client payouts · Priority support
              </p>
              <a
                href={process.env.NEXT_PUBLIC_CALENDLY_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-[7px] rounded-[7px] text-[12px] font-semibold text-[var(--bg-0)] transition-all hover:opacity-90"
                style={{ background: 'var(--gold)' }}
              >
                Talk to Gio About Aurum
              </a>
            </div>
          )}

          {/* Portfolio Preview (locked) */}
          <div
            className="rounded-[10px] p-[18px] relative overflow-hidden flex-1"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', minHeight: '160px' }}
          >
            {/* Blurred preview content */}
            <div style={{ opacity: 0.25 }}>
              <div className="text-[14px] font-semibold mb-3">📊 Portfolio</div>
              <div className="flex gap-2 mb-3">
                <div className="flex-1 rounded-[6px] p-2.5 text-center" style={{ background: 'var(--bg-1)' }}>
                  <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-3)' }}>Balance</div>
                  <div className="font-mono text-[16px] font-bold">$203,149</div>
                </div>
                <div className="flex-1 rounded-[6px] p-2.5 text-center" style={{ background: 'var(--bg-1)' }}>
                  <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-3)' }}>Return</div>
                  <div className="font-mono text-[16px] font-bold" style={{ color: 'var(--green)' }}>+2.1%</div>
                </div>
              </div>
              <div className="h-12 rounded-[6px]" style={{ background: 'var(--green-s)' }} />
            </div>

            {/* Lock overlay */}
            <div className="locked-overlay">
              <div className="text-[28px] mb-2">📊</div>
              <div className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-1)' }}>
                Portfolio Analytics
              </div>
              <div className="text-[11px] mb-3 max-w-[220px]" style={{ color: 'var(--text-2)' }}>
                Connect your MT4/MT5 accounts. Available with Aurum or 7-Figure Boardroom.
              </div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--gold)' }}>
                Available with Aurum or 7-Figure Boardroom
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Downloads + Education & Support */}
      <div className="grid grid-cols-2 gap-[14px]">

        {/* Downloads */}
        <div
          className="rounded-[10px] p-[18px]"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center mb-[14px]">
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>
              📁 Downloads &amp; Set Files
            </span>
            <Link
              href="/downloads"
              className="ml-auto text-[11px] flex items-center gap-1 hover:opacity-80"
              style={{ color: 'var(--text-3)' }}
            >
              View All <ArrowRight size={11} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
            {(downloads.length > 0 ? downloads : [
              { id: '1', name: 'Omni EA v2', description: 'EA File · v2', fileType: 'EA_FILE' as const },
              { id: '2', name: 'Omni Setup Guide', description: 'Setup Guide · v2', fileType: 'PDF_GUIDE' as const },
              { id: '3', name: 'Omni Set Files Pack', description: 'Set Files · v2', fileType: 'SET_FILE' as const },
              { id: '4', name: 'Omni Broker Settings', description: 'Broker Settings · v1', fileType: 'BROKER_SETTINGS' as const },
            ] as { id: string; name: string; description: string | null; fileType: string }[]).slice(0, 4).map((file) => {
              const iconStyle: Record<string, { bg: string; color: string; emoji: string }> = {
                EA_FILE: { bg: 'var(--green-s)', color: 'var(--green)', emoji: '📥' },
                PDF_GUIDE: { bg: 'var(--blue-s)', color: 'var(--blue)', emoji: '📄' },
                SET_FILE: { bg: 'var(--purple-s)', color: 'var(--purple)', emoji: '⚙️' },
                BROKER_SETTINGS: { bg: 'var(--blue-s)', color: 'var(--blue)', emoji: '📋' },
              }
              const style = iconStyle[file.fileType] ?? iconStyle.EA_FILE
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-[10px] px-[14px] py-3 rounded-lg cursor-pointer transition-all"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-9 h-9 rounded-[7px] flex items-center justify-center flex-shrink-0 text-base"
                    style={{ background: style.bg }}
                  >
                    {style.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                      {file.name}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                      {file.description ?? 'Latest version'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Locked Aurum resources */}
          {isStandard && (
            <div
              className="px-[10px] py-[10px] rounded-[6px] text-center"
              style={{ border: '1px dashed var(--border)' }}
            >
              <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                🔒 Aurum EA files, set files & guides — available with upgrade
              </span>
            </div>
          )}
        </div>

        {/* Education + Support */}
        <div
          className="rounded-[10px] p-[18px]"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          {/* Education */}
          <div className="flex items-center mb-[14px]">
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>
              🎓 Education
            </span>
            <Link
              href="/education"
              className="ml-auto text-[11px] flex items-center gap-1 hover:opacity-80"
              style={{ color: 'var(--text-3)' }}
            >
              View All <ArrowRight size={11} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-[14px]">
            {(videos.length > 0 ? videos : [
              { id: '1', title: 'Getting Started with Omni EA', duration: '8:21', category: 'Getting Started', isFeatured: false },
              { id: '2', title: 'Installing Your EA on MT4/MT5', duration: '8:15', category: 'Getting Started', isFeatured: false },
              { id: '3', title: 'FTMO Challenge Setup Guide', duration: '12:20', category: 'Prop Firm Guides', isFeatured: false },
              { id: '4', title: 'How Top Clients Scale to £10k+/mo', duration: '25:18', category: 'Scaling', isFeatured: true },
            ]).slice(0, 4).map((video) => (
              <Link
                key={video.id}
                href="/education"
                className="rounded-lg p-[14px] cursor-pointer transition-all block"
                style={{
                  background: 'var(--bg-1)',
                  border: video.isFeatured ? '1px solid var(--gold)' : '1px solid var(--border)',
                }}
              >
                <div
                  className="rounded-[6px] h-[90px] flex items-center justify-center text-2xl mb-[10px]"
                  style={{ background: video.isFeatured ? 'var(--gold-s)' : 'var(--bg-3)' }}
                >
                  {video.isFeatured ? '🏆' : '▶️'}
                </div>
                <div
                  className="text-[12px] font-semibold leading-tight mb-0.5"
                  style={{ color: video.isFeatured ? 'var(--gold)' : 'var(--text-1)' }}
                >
                  {video.title}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                  {video.duration} · {video.category}
                </div>
              </Link>
            ))}
          </div>

          {/* Support section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <div className="flex items-center mb-[10px]">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>
                🎫 Support
              </span>
              <Link
                href="/support"
                className="ml-auto text-[11px]"
                style={{ color: 'var(--text-3)' }}
              >
                View All
              </Link>
            </div>

            {(tickets.length > 0 ? tickets : [
              { id: 'ticket-1', ticketNumber: '#1247', subject: 'Weekend trading query', status: 'RESOLVED' as const, priority: 'MEDIUM' as const },
              { id: 'ticket-2', ticketNumber: '#1251', subject: 'EA disconnected', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const },
            ]).slice(0, 2).map((ticket, i) => {
              const statusS = ticketStatusStyle[(ticket as any).status ?? 'OPEN']
              const priorityS = ticketPriorityStyle[(ticket as any).priority ?? 'MEDIUM']
              const num = (ticket as any).ticketNumber ?? `#${ticket.id.slice(0, 4)}`
              const isHighPriority = (ticket as any).priority === 'HIGH'

              return (
                <div
                  key={ticket.id}
                  className="flex justify-between items-center px-3 py-[10px] rounded-[6px] mb-1"
                  style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[11px] flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                      {num}
                    </span>
                    {isHighPriority && (
                      <span
                        className="text-[9px] font-bold px-[5px] py-[1px] rounded flex-shrink-0"
                        style={{ background: priorityS.bg, color: priorityS.color }}
                      >
                        High
                      </span>
                    )}
                    <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                      {(ticket as any).subject}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-[9px] py-[3px] rounded-full flex-shrink-0 ml-2"
                    style={{ background: statusS.bg, color: statusS.color }}
                  >
                    {statusS.label}
                  </span>
                </div>
              )
            })}

            <Link
              href="/support"
              className="mt-2 w-full block text-center py-[8px] rounded-[7px] text-[12px] font-semibold transition-all hover:border-[var(--text-2)]"
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            >
              <Plus size={12} className="inline mr-1" />
              New Support Ticket
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
