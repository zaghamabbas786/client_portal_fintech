import { Metadata } from 'next'
import Link from 'next/link'
import { getUserProfile } from '@/lib/session'
import { KeyRound, Download, Lock, Plus, Clock } from 'lucide-react'
import { getCachedUserEAs, getCachedEAs, getCachedUserEARequests } from '@/lib/data'
import { formatRelativeTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'My EAs' }

export default async function MyEAsPage() {
  const userProfile = await getUserProfile()
  if (!userProfile) return null

  const isAurumOrAbove = ['AURUM', 'BOARDROOM', 'ADMIN'].includes(userProfile.role)
  const isStandard = userProfile.role === 'STANDARD'
  const allowedRoles = isAurumOrAbove ? ['STANDARD', 'AURUM', 'BOARDROOM'] : ['STANDARD']

  const [userEAs, allEAs, eaRequests] = await Promise.all([
    getCachedUserEAs(userProfile.id, allowedRoles),
    getCachedEAs(),
    getCachedUserEARequests(userProfile.id),
  ])
  const userEAIds = new Set(userEAs.map((u) => u.eaId))

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <KeyRound size={20} style={{ color: 'var(--text-2)' }} /> My EAs
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            Manage your Expert Advisor licenses.
          </p>
        </div>
        <Link
          href="/my-eas/request"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[7px] text-[13px] font-semibold text-white transition-all hover:opacity-90 w-fit"
          style={{ background: 'var(--red)' }}
        >
          <Plus size={16} />
          Request EA
        </Link>
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
                  {(() => {
                    const downloadUrl = uea.ea.downloadUrl ?? (uea.ea as { downloads?: { fileUrl: string }[] }).downloads?.[0]?.fileUrl
                    return downloadUrl ? (
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all hover:opacity-80"
                        style={{ background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                      >
                        <Download size={13} /> Download
                      </a>
                    ) : null
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requested EAs */}
      {eaRequests.length > 0 && (
        <div
          className="rounded-[10px] p-[18px] mb-5"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>
              Requested EAs
            </div>
            <Link
              href="/my-eas/request"
              className="text-[12px] font-medium hover:opacity-80"
              style={{ color: 'var(--text-2)' }}
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {eaRequests.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-4 py-3 rounded-[8px]"
                style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-[8px] flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: 'var(--gold-s)' }}
                  >
                    <Clock size={18} style={{ color: 'var(--gold)' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                      {r.eaName || 'EA Request'}
                    </div>
                    <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--text-3)' }}>
                      {r.message}
                    </p>
                    <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                      {formatRelativeTime(r.createdAt)}
                    </span>
                  </div>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background:
                      r.status === 'PENDING' ? 'var(--gold-s)' : r.status === 'APPROVED' ? 'var(--green-s)' : 'var(--bg-3)',
                    color:
                      r.status === 'PENDING' ? 'var(--gold)' : r.status === 'APPROVED' ? 'var(--green)' : 'var(--text-3)',
                  }}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
          {eaRequests.length > 5 && (
            <Link
              href="/my-eas/request"
              className="block text-center text-[12px] font-medium mt-3 py-2 hover:opacity-80"
              style={{ color: 'var(--text-2)' }}
            >
              +{eaRequests.length - 5} more
            </Link>
          )}
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
