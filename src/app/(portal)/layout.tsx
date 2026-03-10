import { redirect } from 'next/navigation'
import { getAuthUser, getUserProfile } from '@/lib/session'
import SidebarWrapper from '@/components/layout/SidebarWrapper'
import QueryProvider from '@/components/providers/QueryProvider'
import ReferralTracker from '@/components/ReferralTracker'
import ReferralTrackerClient from '@/components/ReferralTrackerClient'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const userProfile = await getUserProfile()
  if (!userProfile) redirect('/login')

  return (
    <QueryProvider>
      <ReferralTracker
        userId={userProfile.id}
        userEmail={userProfile.email}
        refFromMetadata={authUser.user_metadata?.ref}
      />
      <ReferralTrackerClient />
      <div className="flex min-h-screen" style={{ background: 'var(--bg-0)' }}>
        <SidebarWrapper user={userProfile} />
        {/* On mobile: no left margin (sidebar overlays). On desktop: offset by sidebar width */}
        <main className="flex-1 p-4 sm:p-7 pt-16 lg:pt-7 lg:ml-[240px] lg:max-w-[calc(100vw-240px)]">
          {children}
        </main>
      </div>
    </QueryProvider>
  )
}
