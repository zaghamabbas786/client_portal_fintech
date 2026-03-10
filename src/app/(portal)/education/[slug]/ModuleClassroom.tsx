'use client'

import { useState } from 'react'
import { Play, ChevronDown, ChevronRight, Lock, Clock, Check } from 'lucide-react'
import type { Role } from '@prisma/client'

interface Video {
  id: string
  title: string
  description: string | null
  duration: string | null
  embedUrl: string
  category: string
  isFeatured: boolean
  thumbnail: string | null
  requiredRole: Role
  sortOrder: number
}

interface Props {
  moduleTitle: string
  moduleSlug: string
  videos: Video[]
  userRole: Role
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

export default function ModuleClassroom({ moduleTitle, moduleSlug, videos, userRole }: Props) {
  const [expanded, setExpanded] = useState(true)
  const firstWatchable = videos.find((v) => canWatch(userRole, v.requiredRole)) ?? videos[0]
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(videos.length > 0 ? firstWatchable : null)

  const firstVideo = videos[0]
  const activeVideo = selectedVideo ?? firstVideo

  return (
    <div className="flex flex-col lg:flex-row gap-6 rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
      {/* Left sidebar - lessons */}
      <div
        className="lg:w-[280px] flex-shrink-0"
        style={{ borderRight: '1px solid var(--border)' }}
      >
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="text-[14px] font-bold" style={{ color: 'var(--text-1)' }}>
            {moduleTitle}
          </div>
          <div className="h-1.5 mt-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-3)' }}>
            <div className="h-full rounded-full" style={{ width: '0%', background: 'var(--red)' }} />
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>
            0% complete
          </div>
        </div>

        <div className="p-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[12px] font-semibold hover:opacity-90 transition-opacity"
            style={{ color: 'var(--text-1)', background: 'var(--bg-2)' }}
          >
            {moduleTitle}
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {expanded && (
            <div className="mt-1 space-y-0.5">
              {videos.map((video) => {
                const locked = !canWatch(userRole, video.requiredRole)
                const isSelected = activeVideo?.id === video.id
                return (
                  <button
                    key={video.id}
                    onClick={() => !locked && setSelectedVideo(video)}
                    disabled={locked}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-[12px] transition-all"
                    style={{
                      background: isSelected ? 'var(--gold-s)' : 'transparent',
                      color: isSelected ? 'var(--gold)' : locked ? 'var(--text-3)' : 'var(--text-2)',
                      cursor: locked ? 'not-allowed' : 'pointer',
                      opacity: locked ? 0.6 : 1,
                      border: isSelected ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                    }}
                  >
                    {locked ? (
                      <Lock size={12} />
                    ) : (
                      <Play size={12} style={{ opacity: 0.6 }} />
                    )}
                    <span className="flex-1 truncate">{video.title}</span>
                    {video.duration && (
                      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                        {video.duration}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right main content - video + description */}
      <div className="flex-1 min-w-0 p-6">
        {activeVideo ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>
                {activeVideo.title}
              </h2>
              {canWatch(userRole, activeVideo.requiredRole) && (
                <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--green)' }}>
                  <Check size={10} /> Available
                </span>
              )}
              {!canWatch(userRole, activeVideo.requiredRole) && (
                <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}>
                  <Lock size={10} /> {getRoleLabel(activeVideo.requiredRole)}+
                </span>
              )}
            </div>

            {canWatch(userRole, activeVideo.requiredRole) ? (
              <>
                <div className="rounded-[8px] overflow-hidden mb-4" style={{ background: 'var(--bg-0)' }}>
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

                {activeVideo.description && (
                  <div
                    className="rounded-[8px] p-4 text-[13px] leading-relaxed"
                    style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                  >
                    {activeVideo.description}
                  </div>
                )}

                {activeVideo.duration && (
                  <div className="flex items-center gap-1.5 mt-3 text-[11px]" style={{ color: 'var(--text-3)' }}>
                    <Clock size={12} /> {activeVideo.duration}
                  </div>
                )}
              </>
            ) : (
              <div
                className="rounded-[8px] p-12 text-center"
                style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}
              >
                <Lock size={32} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
                <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text-1)' }}>
                  Upgrade to unlock
                </p>
                <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>
                  This video requires {getRoleLabel(activeVideo.requiredRole)} or higher.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center" style={{ color: 'var(--text-3)' }}>
            <p className="text-[13px]">No lessons in this module yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
