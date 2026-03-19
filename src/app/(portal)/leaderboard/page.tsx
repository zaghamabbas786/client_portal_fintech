import { Metadata } from 'next'
import { Suspense } from 'react'
import { getUserProfile } from '@/lib/session'
import { formatCurrency } from '@/lib/utils'
import { Trophy } from 'lucide-react'
import { getCachedLeaderboard } from '@/lib/data'
import MonthFilter from './MonthFilter'
import AddPayoutForm from './AddPayoutForm'

export const metadata: Metadata = { title: 'Leaderboard' }

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function parseMonthYear(params: { month?: string; year?: string }) {
  const now = new Date()
  const defaultMonth = now.toLocaleString('en-US', { month: 'long' })
  const defaultYear = now.getFullYear()

  const monthParam = params.month
  const yearParam = params.year

  if (!monthParam || !yearParam) return { month: defaultMonth, year: defaultYear }

  const year = parseInt(yearParam, 10)
  if (isNaN(year) || year < 2020 || year > 2030) return { month: defaultMonth, year: defaultYear }

  const month = MONTHS.includes(monthParam) ? monthParam : defaultMonth
  return { month, year }
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const userProfile = await getUserProfile()
  const params = await searchParams
  const { month: currentMonth, year: currentYear } = parseMonthYear(params)

  const entries = await getCachedLeaderboard(currentMonth, currentYear)

  const rows = entries.map((e, i) => ({
    id: e.id,
    rank: i + 1,
    name: e.user.fullName || 'Trader',
    system: e.system,
    propFirm: e.propFirm ?? '—',
    payout: formatCurrency(e.payout.toString()),
    isAurum: e.user.role !== 'STANDARD',
    isUser: e.userId === userProfile?.id,
  }))

  const rankColor = (rank: number) =>
    rank === 1 ? 'var(--gold)' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--text-2)'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <Trophy size={22} style={{ color: 'var(--gold)' }} /> Leaderboard
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            Top traders ranked by monthly payout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddPayoutForm />
          <Suspense fallback={
          <div className="px-3 py-2 rounded-lg text-[13px] font-medium" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
            {currentMonth} {currentYear}
          </div>
        }>
          <MonthFilter currentMonth={currentMonth} currentYear={currentYear} />
        </Suspense>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[10px]">
      <div
        className="rounded-[10px] overflow-hidden min-w-[600px]"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        {/* Table header */}
        <div
          className="grid px-6 py-3 text-[10px] font-bold uppercase tracking-[1px]"
          style={{
            gridTemplateColumns: '60px 1fr 160px 160px 120px',
            color: 'var(--text-3)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span>RANK</span>
          <span>TRADER</span>
          <span>SYSTEM</span>
          <span>PROP FIRM</span>
          <span className="text-right">PAYOUT</span>
        </div>

        {/* Table rows */}
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[13px] mb-2" style={{ color: 'var(--text-3)' }}>No leaderboard entries for this month yet.</p>
            <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>Submit your payout to be the first!</p>
          </div>
        ) : (
        rows.map((row) => {
          const isTop3 = row.rank <= 3
          return (
            <div
              key={row.id}
              className="grid px-6 py-[14px] text-[13px] transition-colors"
              style={{
                gridTemplateColumns: '60px 1fr 160px 160px 120px',
                background: row.isUser
                  ? 'var(--blue-s)'
                  : isTop3
                  ? row.rank === 1
                    ? 'rgba(212,175,55,0.04)'
                    : 'transparent'
                  : 'transparent',
                borderBottom: '1px solid var(--border)',
                borderLeft: row.isUser ? '3px solid var(--blue)' : isTop3 ? `3px solid ${rankColor(row.rank)}` : '3px solid transparent',
              }}
            >
              <span className="font-mono font-bold text-[15px]" style={{ color: rankColor(row.rank) }}>
                #{row.rank}
              </span>
              <span
                className="font-semibold"
                style={{ color: row.isUser ? 'var(--blue)' : 'var(--text-1)' }}
              >
                {row.isUser ? 'You' : row.name}
              </span>
              <span
                className="font-semibold"
                style={{ color: row.isAurum ? 'var(--gold)' : 'var(--text-2)' }}
              >
                {row.system}
              </span>
              <span style={{ color: 'var(--text-2)' }}>{row.propFirm}</span>
              <span className="font-mono font-bold text-right" style={{ color: 'var(--green)' }}>
                {row.payout}
              </span>
            </div>
          )
        })
        )}

        {/* Bottom banner */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'var(--bg-1)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[14px]">⭐</span>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>
                Want to be on this list?
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                Top performers use our Aurum system. Upgrade to join them.
              </p>
            </div>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_CALENDLY_URL || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-[7px] text-[12px] font-semibold transition-all hover:opacity-90"
            style={{ background: 'var(--gold)', color: 'var(--bg-0)' }}
          >
            Learn More
          </a>
        </div>
      </div>
      </div>
    </div>
  )
}
