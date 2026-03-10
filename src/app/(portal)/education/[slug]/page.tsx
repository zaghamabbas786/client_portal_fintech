import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getUserProfile } from '@/lib/session'
import { getCachedAllVideos } from '@/lib/data'
import { slugToCategory } from '@/lib/education-utils'
import ModuleClassroom from './ModuleClassroom'

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const userProfile = await getUserProfile()
  if (!userProfile) return null

  const { slug } = await params
  const videos = await getCachedAllVideos()
  const categories = [...new Set(videos.map((v) => v.category))]
  const category = slugToCategory(slug, categories)

  if (!category) notFound()

  const moduleVideos = videos
    .filter((v) => v.category === category)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div>
      <Link
        href="/education"
        className="inline-flex items-center gap-2 text-[13px] mb-6 hover:opacity-80"
        style={{ color: 'var(--text-2)' }}
      >
        <ArrowLeft size={14} /> Back to Classroom
      </Link>

      <ModuleClassroom
        moduleTitle={category}
        moduleSlug={slug}
        videos={moduleVideos}
        userRole={userProfile.role}
      />
    </div>
  )
}
