'use client'

import { useState } from 'react'
import { Play, Clock, X, Lock } from 'lucide-react'
import type { Role } from '@prisma/client'

interface Video {
  id: string
  title: string
  duration: string | null
  embedUrl: string
  category: string
  isFeatured: boolean
  thumbnail: string | null
  requiredRole: Role
}

interface Props {
  videos: Video[]
  userRole: Role
}

const CATEGORIES = ['All', 'Getting Started', 'Risk Management', 'Scaling', 'Prop Firm Guides']

const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  'Getting Started': { bg: 'var(--bg-3)', color: 'var(--text-3)' },
  'Risk Management': { bg: 'var(--red-s)', color: 'var(--red)' },
  'Scaling': { bg: 'var(--gold-s)', color: 'var(--gold)' },
  'Prop Firm Guides': { bg: 'var(--blue-s)', color: 'var(--blue)' },
}

const ROLE_ORDER: Record<Role, number> = { STANDARD: 0, AURUM: 1, BOARDROOM: 2, ADMIN: 3 }

function canWatch(userRole: Role, requiredRole: Role) {
  return ROLE_ORDER[userRole] >= ROLE_ORDER[requiredRole]
}

function getRoleLabel(role: Role) {
  if (role === 'AURUM') return 'Aurum'
  if (role === 'BOARDROOM') return 'Boardroom'
  return role
}

export default function EducationClient({ videos, userRole }: Props) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)

  const filtered = videos.filter(
    (v) => activeCategory === 'All' || v.category === activeCategory
  )

  const catStyle = activeVideo
    ? CATEGORY_STYLE[activeVideo.category] ?? { bg: 'var(--bg-3)', color: 'var(--text-3)' }
    : null

  return (
    <>
      {/* Category tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: activeCategory === cat ? 'var(--red)' : 'var(--bg-2)',
              color: activeCategory === cat ? '#fff' : 'var(--text-2)',
              border: activeCategory === cat ? 'none' : '1px solid var(--border)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          className="rounded-[10px] p-12 text-center"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <p className="text-[14px]" style={{ color: 'var(--text-3)' }}>
            No videos in this category yet.
          </p>
        </div>
      )}

      {/* Videos grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((video) => {
          const locked = !canWatch(userRole, video.requiredRole)
          const style = CATEGORY_STYLE[video.category] ?? { bg: 'var(--bg-3)', color: 'var(--text-3)' }
          return (
            <div
              key={video.id}
              data-testid="video-card"
              onClick={() => !locked && setActiveVideo(video)}
              className="rounded-[10px] overflow-hidden transition-all group"
              style={{
                background: 'var(--bg-2)',
                border: video.isFeatured ? '1px solid var(--gold)' : '1px solid var(--border)',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.6 : 1,
              }}
            >
              {/* Thumbnail */}
              <div
                className="h-[140px] flex items-center justify-center relative"
                style={{ background: video.thumbnail ? undefined : video.isFeatured ? 'var(--gold-s)' : 'var(--bg-3)' }}
              >
                {video.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                )}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 absolute"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >
                  {locked
                    ? <Lock size={18} style={{ color: 'white' }} />
                    : <Play size={20} fill="white" style={{ color: 'white', marginLeft: '2px' }} />
                  }
                </div>
                {video.isFeatured && (
                  <span
                    className="absolute top-2 left-2 text-[9px] font-bold px-2 py-1 rounded-full"
                    style={{ background: 'var(--gold)', color: 'var(--bg-0)' }}
                  >
                    ⭐ FEATURED
                  </span>
                )}
                {locked && (
                  <span
                    className="absolute top-2 right-2 text-[9px] font-bold px-2 py-1 rounded-full"
                    style={{ background: 'var(--purple-s)', color: 'var(--purple)' }}
                  >
                    {getRoleLabel(video.requiredRole)}+
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-[14px]">
                <div
                  className="text-[13px] font-semibold mb-1 leading-tight"
                  style={{ color: video.isFeatured ? 'var(--gold)' : 'var(--text-1)' }}
                >
                  {video.title}
                </div>
                <div className="flex items-center justify-between">
                  {video.duration && (
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-3)' }}>
                      <Clock size={11} />
                      {video.duration}
                    </div>
                  )}
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                    style={{ background: style.bg, color: style.color }}
                  >
                    {video.category}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Video player modal */}
      {activeVideo && (
        <div
          data-testid="video-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveVideo(null) }}
        >
          <div
            className="w-full max-w-3xl rounded-[12px] overflow-hidden"
            style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <div className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>
                  {activeVideo.title}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {activeVideo.duration && (
                    <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                      <Clock size={10} /> {activeVideo.duration}
                    </span>
                  )}
                  {catStyle && (
                    <span
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: catStyle.bg, color: catStyle.color }}
                    >
                      {activeVideo.category}
                    </span>
                  )}
                </div>
              </div>
              <button
                data-testid="video-modal-close"
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'var(--bg-3)', color: 'var(--text-2)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Embed */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={activeVideo.embedUrl}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                style={{ border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
