'use client'

import { useState } from 'react'
import { GraduationCap, Play, Clock } from 'lucide-react'

const CATEGORIES = ['All', 'Getting Started', 'Risk Management', 'Scaling', 'Prop Firm Guides']

const MOCK_VIDEOS = [
  { id: '1', title: 'Getting Started with Omni EA', duration: '8:21', category: 'Getting Started', isFeatured: false, thumbnail: null },
  { id: '2', title: 'Installing Your EA on MT4/MT5', duration: '8:15', category: 'Getting Started', isFeatured: false, thumbnail: null },
  { id: '3', title: 'FTMO Challenge Setup Guide', duration: '12:20', category: 'Prop Firm Guides', isFeatured: false, thumbnail: null },
  { id: '4', title: 'MyForexFunds Best Practices', duration: '11:0', category: 'Prop Firm Guides', isFeatured: false, thumbnail: null },
  { id: '5', title: 'Risk Management Fundamentals', duration: '12:30', category: 'Risk Management', isFeatured: false, thumbnail: null },
  { id: '6', title: 'Position Sizing for Prop Firms', duration: '9:45', category: 'Risk Management', isFeatured: false, thumbnail: null },
  { id: '7', title: 'How Top Clients Scale to £10k+/mo', duration: '25:18', category: 'Scaling', isFeatured: true, thumbnail: null },
  { id: '8', title: 'Multi-Account Management', duration: '14:30', category: 'Scaling', isFeatured: false, thumbnail: null },
]

export default function EducationPage() {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = MOCK_VIDEOS.filter(
    (v) => activeCategory === 'All' || v.category === activeCategory
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <GraduationCap size={20} style={{ color: 'var(--text-2)' }} /> Education
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          Learn strategies, risk management, and scaling techniques.
        </p>
      </div>

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

      {/* Videos grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map((video) => (
          <div
            key={video.id}
            className="rounded-[10px] overflow-hidden cursor-pointer transition-all group"
            style={{
              background: 'var(--bg-2)',
              border: video.isFeatured ? '1px solid var(--gold)' : '1px solid var(--border)',
            }}
          >
            {/* Thumbnail */}
            <div
              className="h-[140px] flex items-center justify-center relative"
              style={{ background: video.isFeatured ? 'var(--gold-s)' : 'var(--bg-3)' }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                <Play size={20} fill="white" style={{ color: 'white', marginLeft: '2px' }} />
              </div>
              {video.isFeatured && (
                <span
                  className="absolute top-2 left-2 text-[9px] font-bold px-2 py-1 rounded-full"
                  style={{ background: 'var(--gold)', color: 'var(--bg-0)' }}
                >
                  ⭐ FEATURED
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
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-3)' }}>
                  <Clock size={11} />
                  {video.duration}
                </div>
                <span
                  className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: video.category === 'Prop Firm Guides'
                      ? 'var(--blue-s)'
                      : video.category === 'Risk Management'
                      ? 'var(--red-s)'
                      : video.category === 'Scaling'
                      ? 'var(--gold-s)'
                      : 'var(--bg-3)',
                    color: video.category === 'Prop Firm Guides'
                      ? 'var(--blue)'
                      : video.category === 'Risk Management'
                      ? 'var(--red)'
                      : video.category === 'Scaling'
                      ? 'var(--gold)'
                      : 'var(--text-3)',
                  }}
                >
                  {video.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
