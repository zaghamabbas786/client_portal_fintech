import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { FileText, Video } from 'lucide-react'

export const metadata: Metadata = { title: 'Content Management' }

export default async function AdminContentPage() {
  const [downloads, videos] = await Promise.all([
    prisma.download.findMany({ orderBy: { createdAt: 'desc' }, include: { ea: true } }),
    prisma.video.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1" style={{ color: 'var(--text-1)' }}>
          Content Management
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          Manage downloads, videos, and resources.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Downloads */}
        <div
          className="rounded-[10px] overflow-hidden"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <FileText size={16} style={{ color: 'var(--text-2)' }} />
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>Downloads ({downloads.length})</span>
          </div>
          {downloads.map((d) => (
            <div key={d.id} className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="text-[13px] font-medium" style={{ color: 'var(--text-1)' }}>{d.name}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>{d.ea?.name ?? 'General'} · v{d.version}</div>
              </div>
              {d.isLatest && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--green-s)', color: 'var(--green)' }}>
                  LATEST
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Videos */}
        <div
          className="rounded-[10px] overflow-hidden"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <Video size={16} style={{ color: 'var(--text-2)' }} />
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>Videos ({videos.length})</span>
          </div>
          {videos.map((v) => (
            <div key={v.id} className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="text-[13px] font-medium" style={{ color: v.isFeatured ? 'var(--gold)' : 'var(--text-1)' }}>{v.title}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>{v.category} · {v.duration}</div>
              </div>
              {v.isFeatured && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--gold-s)', color: 'var(--gold)' }}>
                  FEATURED
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
