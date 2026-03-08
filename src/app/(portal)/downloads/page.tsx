import { Metadata } from 'next'
import { getUserProfile } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { Download, Lock } from 'lucide-react'

export const metadata: Metadata = { title: 'Downloads' }

const FILE_TYPE_META: Record<string, { emoji: string; bg: string; color: string }> = {
  EA_FILE: { emoji: '📥', bg: 'var(--green-s)', color: 'var(--green)' },
  PDF_GUIDE: { emoji: '📄', bg: 'var(--blue-s)', color: 'var(--blue)' },
  SET_FILE: { emoji: '⚙️', bg: 'var(--purple-s)', color: 'var(--purple)' },
  BROKER_SETTINGS: { emoji: '📋', bg: 'var(--blue-s)', color: 'var(--blue)' },
}

const MOCK_FILES = {
  Omni: [
    { id: '1', name: 'Omni EA v2.2', description: 'EA File · v2.2', fileType: 'EA_FILE', isLatest: true },
    { id: '2', name: 'Omni Setup Guide', description: 'Setup Guide · v2', fileType: 'PDF_GUIDE', isLatest: true },
    { id: '3', name: 'Omni Set Files Pack', description: 'Set Files · v2', fileType: 'SET_FILE', isLatest: true },
    { id: '4', name: 'Omni Broker Settings', description: 'Broker Settings · v1', fileType: 'BROKER_SETTINGS', isLatest: true },
  ],
  'Asia Scalper': [
    { id: '5', name: 'Asia Scalper EA v2.1', description: 'EA File · v2.1', fileType: 'EA_FILE', isLatest: true },
    { id: '6', name: 'Asia Scalper Guide', description: 'Setup Guide · v2', fileType: 'PDF_GUIDE', isLatest: true },
    { id: '7', name: 'Asia Scalper Set Files', description: 'Set Files · v2.1', fileType: 'SET_FILE', isLatest: true },
  ],
}

export default async function DownloadsPage() {
  const userProfile = await getUserProfile()
  if (!userProfile) return null

  const isStandard = userProfile.role === 'STANDARD'
  const isAurumOrAbove = ['AURUM', 'BOARDROOM', 'ADMIN'].includes(userProfile.role)

  const allowedRole: ('STANDARD' | 'AURUM' | 'BOARDROOM' | 'ADMIN')[] = isAurumOrAbove
    ? ['STANDARD', 'AURUM', 'BOARDROOM']
    : ['STANDARD']

  const downloads = await prisma.download.findMany({
    where: { requiredRole: { in: allowedRole } },
    include: { ea: true },
    orderBy: [{ ea: { name: 'asc' } }, { isLatest: 'desc' }],
  })

  // Group by EA name
  const grouped: Record<string, typeof downloads> = {}
  downloads.forEach((d) => {
    const key = d.ea?.name ?? 'General'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(d)
  })

  const useMock = Object.keys(grouped).length === 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <Download size={20} style={{ color: 'var(--text-2)' }} /> Downloads
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          Access your EA files, guides, and configuration packs.
        </p>
      </div>

      {/* Omni Files */}
      {(useMock ? Object.entries(MOCK_FILES) : Object.entries(grouped)).map(([eaName, files]) => (
        <div key={eaName} className="mb-6">
          <h2 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
            {eaName} Files
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(files as { id: string; name: string; description: string | null; fileType: string; isLatest: boolean }[]).map((file) => {
              const meta = FILE_TYPE_META[file.fileType] ?? FILE_TYPE_META.EA_FILE
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-[8px] cursor-pointer transition-all group"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-10 h-10 rounded-[8px] flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: meta.bg }}
                  >
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                      {file.name}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                      {file.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.isLatest && (
                      <span
                        className="text-[9px] font-bold px-[7px] py-[2px] rounded-full"
                        style={{ background: 'var(--green-s)', color: 'var(--green)' }}
                      >
                        LATEST
                      </span>
                    )}
                    <Download size={14} style={{ color: 'var(--text-3)' }} className="group-hover:text-[var(--text-1)] transition-colors" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Locked Aurum section */}
      {isStandard && (
        <div
          className="rounded-[10px] p-6 relative overflow-hidden"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--text-1)', opacity: 0.3 }}>
            Aurum Files
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4" style={{ opacity: 0.15, filter: 'blur(2px)' }}>
            {['Aurum EA v4.2', 'Aurum Setup Guide', 'Aurum Set Files', 'Aurum Broker Settings'].map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-[8px]"
                style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
              >
                <div className="w-10 h-10 rounded-[8px]" style={{ background: 'var(--gold-s)' }} />
                <div className="flex-1">
                  <div className="h-3 rounded" style={{ background: 'var(--bg-3)', width: '70%' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Lock overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center rounded-[10px]"
            style={{ background: 'rgba(8,8,13,0.7)', backdropFilter: 'blur(2px)' }}
          >
            <Lock size={32} className="mb-3" style={{ color: 'var(--gold)' }} />
            <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-1)' }}>
              Aurum files require an upgrade
            </p>
            <p className="text-[12px] mb-4" style={{ color: 'var(--text-2)' }}>
              Upgrade to Aurum to access premium EA files and set files.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_CALENDLY_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-[7px] text-[13px] font-semibold transition-all hover:opacity-90"
              style={{ background: 'var(--gold)', color: 'var(--bg-0)' }}
            >
              Upgrade Now
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
