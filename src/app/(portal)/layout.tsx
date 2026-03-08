import { redirect } from 'next/navigation'
import { getAuthUser, getUserProfile } from '@/lib/session'
import SidebarWrapper from '@/components/layout/SidebarWrapper'
import QueryProvider from '@/components/providers/QueryProvider'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/login')

  const userProfile = await getUserProfile()
  if (!userProfile) redirect('/login')

  return (
    <QueryProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--bg-0)' }}>
        <SidebarWrapper user={userProfile} />
        <main className="ml-[240px] flex-1 p-7 max-w-[calc(100vw-240px)]">
          {children}
        </main>
      </div>
    </QueryProvider>
  )
}
