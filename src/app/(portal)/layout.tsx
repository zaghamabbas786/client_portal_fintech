import { redirect } from 'next/navigation'
import { getAuthUser, getUserProfile } from '@/lib/session'
import { getCachedCommunityNewCount } from '@/lib/data'
import SidebarWrapper from '@/components/layout/SidebarWrapper'
import QueryProvider from '@/components/providers/QueryProvider'
import ReferralTracker from '@/components/ReferralTracker'
import ReferralTrackerClient from '@/components/ReferralTrackerClient'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const userProfile = await getUserProfile()
  if (!userProfile) redirect('/login')

  const communityNewCount = await getCachedCommunityNewCount()

  return (
    <QueryProvider>
      <ReferralTracker
        userId={userProfile.id}
        userEmail={userProfile.email}
        refFromMetadata={authUser.user_metadata?.ref}
      />
      <ReferralTrackerClient />
      <div className="flex min-h-screen" style={{ background: 'var(--bg-0)' }}>
        <SidebarWrapper user={userProfile} communityNewCount={communityNewCount}>{children}</SidebarWrapper>
      </div>
    </QueryProvider>
  )
}
