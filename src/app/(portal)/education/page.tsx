import { Metadata } from 'next'
import { GraduationCap } from 'lucide-react'
import { getUserProfile } from '@/lib/session'
import { getCachedAllVideos } from '@/lib/data'
import EducationClient from './EducationClient'

export const metadata: Metadata = { title: 'Education' }

export default async function EducationPage() {
  const userProfile = await getUserProfile()
  if (!userProfile) return null

  const videos = await getCachedAllVideos()

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

      <EducationClient videos={videos} userRole={userProfile.role} />
    </div>
  )
}
