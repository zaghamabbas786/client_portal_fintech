'use client'

import { useState } from 'react'
import { Share2, Copy, Check, ArrowRight, Users, UserCheck, DollarSign } from 'lucide-react'

interface Props {
  commissionRate: number
  isBoardroom: boolean
  referralLink: string
  stats: { totalSent: number; signedUp: number; converted: number }
}

export default function ReferralClient({ commissionRate, isBoardroom, referralLink, stats }: Props) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <Share2 size={20} style={{ color: 'var(--text-2)' }} /> Referrals
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          Refer clients and earn commissions.
        </p>
      </div>

      {/* Commission rate card */}
      <div
        className="rounded-[10px] p-6 mb-5"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <div className="text-[11px] font-bold uppercase tracking-[1px] mb-1" style={{ color: 'var(--text-3)' }}>
          YOUR COMMISSION RATE
        </div>
        <div
          className="font-mono font-bold mb-2"
          style={{ fontSize: '42px', color: isBoardroom ? 'var(--gold)' : 'var(--text-1)' }}
        >
          {commissionRate}%
        </div>
        {isBoardroom && (
          <span
            className="text-[11px] font-bold px-3 py-1 rounded-full"
            style={{ background: 'var(--gold-s)', color: 'var(--gold)' }}
          >
            ⭐ Boardroom Bonus Rate
          </span>
        )}
        {!isBoardroom && (
          <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>
            Upgrade to 7-Figure Boardroom to unlock 30% commission rate.
          </p>
        )}
      </div>

      {/* Referral link */}
      <div
        className="rounded-[10px] p-5 mb-5"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <div className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
          Your Referral Link
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 rounded-lg px-3 py-2.5 text-[13px] outline-none"
            style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          />
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[7px] text-[13px] font-semibold transition-all"
            style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', color: copied ? 'var(--green)' : 'var(--text-2)' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'REFERRALS SENT', value: stats.totalSent, icon: <ArrowRight size={16} />, color: 'var(--text-2)' },
          { label: 'SIGNED UP', value: stats.signedUp, icon: <Users size={16} />, color: 'var(--blue)' },
          { label: 'CONVERTED', value: stats.converted, icon: <UserCheck size={16} />, color: 'var(--green)' },
          { label: 'COMMISSION EARNED', value: '$0', icon: <DollarSign size={16} />, color: 'var(--green)', isString: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[10px] p-4"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-3" style={{ color: stat.color }}>
              {stat.icon}
              <span className="text-[9px] font-bold uppercase tracking-[1px]" style={{ color: 'var(--text-3)' }}>
                {stat.label}
              </span>
            </div>
            <div
              className="font-mono font-bold text-[28px]"
              style={{ color: stat.label === 'COMMISSION EARNED' ? 'var(--green)' : 'var(--text-1)' }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
