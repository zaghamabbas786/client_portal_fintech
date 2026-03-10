import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getCachedCommunityNewCount } from '@/lib/data'
import SidebarWrapper from '@/components/layout/SidebarWrapper'
import QueryProvider from '@/components/providers/QueryProvider'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile || userProfile.role !== 'ADMIN') redirect('/dashboard')

  const communityNewCount = await getCachedCommunityNewCount()

  return (
    <QueryProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--bg-0)' }}>
        <SidebarWrapper user={userProfile} communityNewCount={communityNewCount}>{children}</SidebarWrapper>
      </div>
    </QueryProvider>
  )
}
