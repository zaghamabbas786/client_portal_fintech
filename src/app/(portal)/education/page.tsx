import { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, ChevronRight } from 'lucide-react'
import { getUserProfile } from '@/lib/session'
import { getCachedAllVideos } from '@/lib/data'
import { categoryToSlug } from '@/lib/education-utils'

export const metadata: Metadata = { title: 'Education' }

const MODULE_ORDER = ['Getting Started', 'Risk Management', 'Scaling', 'Prop Firm Guides', 'Advanced']
const MODULE_STYLE: Record<string, { bg: string; color: string }> = {
  'Getting Started': { bg: 'var(--red)', color: '#fff' },
  'Risk Management': { bg: 'var(--bg-3)', color: 'var(--text-1)' },
  'Scaling': { bg: 'var(--gold)', color: 'var(--bg-0)' },
  'Prop Firm Guides': { bg: 'var(--blue)', color: '#fff' },
  'Advanced': { bg: 'var(--purple)', color: '#fff' },
}

export default async function EducationPage() {
  const userProfile = await getUserProfile()
  if (!userProfile) return null

  const videos = await getCachedAllVideos()
  const byCategory = new Map<string, typeof videos>()
  for (const v of videos) {
    if (!byCategory.has(v.category)) byCategory.set(v.category, [])
    byCategory.get(v.category)!.push(v)
  }

  const modules = MODULE_ORDER.filter((c) => byCategory.has(c))
  const otherModules = [...byCategory.keys()].filter((c) => !MODULE_ORDER.includes(c))
  const allModules = [...modules, ...otherModules]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <GraduationCap size={20} style={{ color: 'var(--text-2)' }} /> Classroom
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
          Pick a module to explore lessons and videos.
        </p>
      </div>

      {allModules.length === 0 ? (
        <div
          className="rounded-[10px] p-12 text-center"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
        >
          <p className="text-[14px]" style={{ color: 'var(--text-3)' }}>
            No modules yet. Content is being added.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allModules.map((category, idx) => {
            const moduleVideos = byCategory.get(category) ?? []
            const slug = categoryToSlug(category)
            const style = MODULE_STYLE[category] ?? { bg: 'var(--bg-3)', color: 'var(--text-1)' }
            const num = String(idx + 1).padStart(2, '0')
            return (
              <Link
                key={category}
                href={`/education/${slug}`}
                className="rounded-[10px] overflow-hidden transition-all hover:opacity-95 block"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
              >
                {/* Module header (dark) */}
                <div
                  className="px-4 py-5"
                  style={{ background: style.bg, color: style.color }}
                >
                  <div className="text-[13px] font-bold uppercase tracking-wide">
                    {category}
                    {idx === 0 && ' (Start Here)'}
                  </div>
                  <div className="text-[11px] mt-0.5 opacity-90">EOS Capital Tech</div>
                </div>
                {/* Module body (light) */}
                <div className="px-4 py-4" style={{ background: 'var(--bg-1)' }}>
                  <div className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
                    {num}: {category}
                    {idx === 0 && ' (Start Here)'}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                      {moduleVideos.length} lesson{moduleVideos.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--red)' }}>
                      Open <ChevronRight size={12} />
                    </span>
                  </div>
                  {/* Progress bar placeholder */}
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-3)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: '0%', background: 'var(--red)' }}
                    />
                  </div>
                  <div className="text-[9px] mt-1" style={{ color: 'var(--text-3)' }}>
                    0% complete
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
