import { Metadata } from 'next'
import { getUserProfile } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { KeyRound, Download, Lock } from 'lucide-react'

export const metadata: Metadata = { title: 'My EAs' }

export default async function MyEAsPage() {
  const userProfile = await getUserProfile()
  if (!userProfile) return null

  const userEAs = await prisma.userEA.findMany({
    where: { userId: userProfile.id },
    include: { ea: true },
    orderBy: { assignedAt: 'desc' },
  })

  const allEAs = await prisma.eA.findMany({ orderBy: { name: 'asc' } })
  const userEAIds = new Set(userEAs.map((u) => u.eaId))

  const isAurumOrAbove = ['AURUM', 'BOARDROOM', 'ADMIN'].includes(userProfile.role)
  const isStandard = userProfile.role === 'STANDARD'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <KeyRound size={20} style={{ color: 'var(--text-2)' }} /> My EAs
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          Manage your Expert Advisor licenses.
        </p>
      </div>

      {/* Active EAs */}
      {userEAs.length === 0 && (
        <div
          className="rounded-[10px] p-10 text-center mb-6"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <KeyRound size={40} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            No EA licenses assigned to your account yet.
          </p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-3)' }}>
            Contact support to get set up.
          </p>
        </div>
      )}

      {userEAs.length > 0 && (
        <div
          className="rounded-[10px] p-[18px] mb-5"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <div className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text-1)' }}>
            Active Licenses
          </div>
          <div className="space-y-2">
            {userEAs.map((uea) => (
              <div
                key={uea.id}
                className="flex items-center justify-between px-4 py-3 rounded-[8px]"
                style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[8px] flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: 'var(--green-s)' }}
                  >
                    ⚡
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>
                      {uea.ea.name}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                      v{uea.ea.version} · {uea.broker || 'No broker'} · Acc:{' '}
                      {uea.accountNumber || 'Not set'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[11px] font-semibold px-3 py-1 rounded-full"
                    style={{ background: uea.status === 'ACTIVE' ? 'var(--green-s)' : 'var(--red-s)', color: uea.status === 'ACTIVE' ? 'var(--green)' : 'var(--red)' }}
                  >
                    ● {uea.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                  {uea.ea.downloadUrl && (
                    <a
                      href={uea.ea.downloadUrl}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all hover:opacity-80"
                      style={{ background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                    >
                      <Download size={13} /> Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked / Upgrade EAs */}
      <div
        className="rounded-[10px] p-[18px]"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
      >
        <div className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text-1)' }}>
          {isStandard ? 'Upgrade to Unlock' : 'All Available EAs'}
        </div>

        <div className="space-y-2">
          {/* Aurum EA locked (for Standard) */}
          {isStandard && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-[8px]"
              style={{ background: 'var(--bg-1)', border: '1px dashed var(--gold)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-[8px] flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'var(--gold-s)' }}
                >
                  🏆
                </div>
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: 'var(--gold)' }}>
                    Aurum EA
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                    Premium algorithmic strategy · 9 strategies
                  </div>
                </div>
              </div>
              <a
                href={process.env.NEXT_PUBLIC_CALENDLY_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-[7px] text-[12px] font-semibold transition-all hover:opacity-90"
                style={{ background: 'var(--gold)', color: 'var(--bg-0)' }}
              >
                Upgrade Required
              </a>
            </div>
          )}

          {/* Coming soon EA */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-[8px]"
            style={{ background: 'var(--bg-1)', border: '1px dashed var(--border)', opacity: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--red-s)' }}
              >
                <Lock size={16} style={{ color: 'var(--text-3)' }} />
              </div>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: 'var(--text-3)' }}>
                  Limitless BTC
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                  Crypto EA · Coming soon
                </div>
              </div>
            </div>
            <span
              className="text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}
            >
              Coming Soon
            </span>
          </div>
        </div>

        {/* Upgrade promo for Standard */}
        {isStandard && (
          <div
            className="mt-4 p-4 rounded-[8px]"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(229,57,53,0.06))', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--gold)' }}>
              Upgrade to Aurum
            </p>
            <p className="text-[12px] mb-3" style={{ color: 'var(--text-2)' }}>
              4.8% avg monthly return · $40k+ in client payouts · Priority support
            </p>
            <a
              href={process.env.NEXT_PUBLIC_CALENDLY_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 rounded-[7px] text-[12px] font-semibold transition-all hover:opacity-90"
              style={{ background: 'var(--gold)', color: 'var(--bg-0)' }}
            >
              Talk to Gio About Aurum →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
