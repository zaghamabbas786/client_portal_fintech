import { Metadata } from 'next'
import { getUserProfile } from '@/lib/session'
import { BarChart2, Lock } from 'lucide-react'
import PortfolioClient from './PortfolioClient'

export const metadata: Metadata = { title: 'Portfolio' }

export default async function PortfolioPage() {
  const userProfile = await getUserProfile()
  if (!userProfile) return null

  const hasAccess = ['AURUM', 'BOARDROOM', 'ADMIN'].includes(userProfile.role)

  if (!hasAccess) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <BarChart2 size={20} style={{ color: 'var(--text-2)' }} /> Portfolio
          </h1>
        </div>

        <div
          className="rounded-xl p-16 text-center"
          style={{ background: 'var(--bg-2)', border: '1px dashed var(--gold)' }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--gold-s)' }}
          >
            <Lock size={36} style={{ color: 'var(--gold)' }} />
          </div>
          <h2 className="text-[20px] font-bold mb-2" style={{ color: 'var(--text-1)' }}>
            Portfolio Analytics
          </h2>
          <p className="text-[14px] mb-2 max-w-[400px] mx-auto" style={{ color: 'var(--text-2)' }}>
            Connect your MT4/MT5 accounts and track live performance, equity curves, trade history, and key statistics.
          </p>
          <p className="text-[12px] mb-6" style={{ color: 'var(--gold)' }}>
            Available with Aurum or 7-Figure Boardroom membership.
          </p>
          <a
            href={process.env.NEXT_PUBLIC_CALENDLY_URL || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-[8px] text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ background: 'var(--gold)', color: 'var(--bg-0)' }}
          >
            Talk to Gio About Upgrading →
          </a>
        </div>
      </div>
    )
  }

  return <PortfolioClient />
}
