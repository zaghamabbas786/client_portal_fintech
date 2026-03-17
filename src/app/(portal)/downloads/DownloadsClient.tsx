'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Lock } from 'lucide-react'
import Pagination from '@/components/admin/Pagination'

const FILE_TYPE_META: Record<string, { emoji: string; bg: string; color: string }> = {
  EA_FILE: { emoji: '📥', bg: 'var(--green-s)', color: 'var(--green)' },
  PDF_GUIDE: { emoji: '📄', bg: 'var(--blue-s)', color: 'var(--blue)' },
  SET_FILE: { emoji: '⚙️', bg: 'var(--purple-s)', color: 'var(--purple)' },
  BROKER_SETTINGS: { emoji: '📋', bg: 'var(--blue-s)', color: 'var(--blue)' },
}

const MOCK_FILES = {
  Omni: [
    { id: '1', name: 'Omni EA v2.2', description: 'EA File · v2.2', fileType: 'EA_FILE', isLatest: true, fileUrl: null },
    { id: '2', name: 'Omni Setup Guide', description: 'Setup Guide · v2', fileType: 'PDF_GUIDE', isLatest: true, fileUrl: null },
    { id: '3', name: 'Omni Set Files Pack', description: 'Set Files · v2', fileType: 'SET_FILE', isLatest: true, fileUrl: null },
    { id: '4', name: 'Omni Broker Settings', description: 'Broker Settings · v1', fileType: 'BROKER_SETTINGS', isLatest: true, fileUrl: null },
  ],
  'Asia Scalper': [
    { id: '5', name: 'Asia Scalper EA v2.1', description: 'EA File · v2.1', fileType: 'EA_FILE', isLatest: true, fileUrl: null },
    { id: '6', name: 'Asia Scalper Guide', description: 'Setup Guide · v2', fileType: 'PDF_GUIDE', isLatest: true, fileUrl: null },
    { id: '7', name: 'Asia Scalper Set Files', description: 'Set Files · v2.1', fileType: 'SET_FILE', isLatest: true, fileUrl: null },
  ],
}

interface DownloadItem {
  id: string
  name: string
  description: string | null
  fileType: string
  fileUrl: string
  isLatest: boolean
  ea?: { name: string } | null
}

export default function DownloadsClient() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['downloads', page],
    queryFn: (): Promise<{
      downloads: DownloadItem[]
      total: number
      page: number
      totalPages: number
      isStandard: boolean
    }> => fetch(`/api/downloads?page=${page}`).then((r) => r.json()),
  })

  const downloads = data?.downloads ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const isStandard = data?.isStandard ?? true

  // Group by EA name
  const grouped: Record<string, DownloadItem[]> = {}
  downloads.forEach((d) => {
    const key = d.ea?.name ?? 'General'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(d)
  })

  const useMock = !isLoading && Object.keys(grouped).length === 0

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

      {isLoading ? (
        <div className="flex items-center justify-center py-16" style={{ color: 'var(--text-3)' }}>
          <div className="animate-pulse text-[13px]">Loading downloads…</div>
        </div>
      ) : (
        <>
          {(useMock ? Object.entries(MOCK_FILES) : Object.entries(grouped)).map(([eaName, files]) => (
            <div key={eaName} className="mb-6">
              <h2 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
                {eaName} Files
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(files as DownloadItem[]).map((file) => {
                  const meta = FILE_TYPE_META[file.fileType] ?? FILE_TYPE_META.EA_FILE
                  const hasUrl = !!file.fileUrl

                  return (
                    <a
                      key={file.id}
                      href={file.fileUrl ?? '#'}
                      download={hasUrl ? file.name : undefined}
                      target={hasUrl ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      aria-disabled={!hasUrl}
                      className="flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all group"
                      style={{
                        background: 'var(--bg-2)',
                        border: '1px solid var(--border)',
                        cursor: hasUrl ? 'pointer' : 'not-allowed',
                        opacity: hasUrl ? 1 : 0.5,
                        textDecoration: 'none',
                      }}
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
                          {!hasUrl && ' · No file attached'}
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
                        <Download
                          size={14}
                          className="transition-colors"
                          style={{ color: 'var(--text-3)' }}
                        />
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          ))}

          {!useMock && totalPages > 1 && (
            <div className="rounded-[10px] overflow-hidden mt-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Locked Aurum section */}
      {isStandard && (
        <div
          className="rounded-[10px] p-6 relative overflow-hidden mt-6"
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
