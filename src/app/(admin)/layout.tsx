import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import SidebarWrapper from '@/components/layout/SidebarWrapper'
import QueryProvider from '@/components/providers/QueryProvider'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile || userProfile.role !== 'ADMIN') redirect('/dashboard')

  return (
    <QueryProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--bg-0)' }}>
        <SidebarWrapper user={userProfile} />
        <main className="flex-1 p-4 sm:p-7 pt-16 lg:pt-7 lg:ml-[240px] lg:max-w-[calc(100vw-240px)]">
          {children}
        </main>
      </div>
    </QueryProvider>
  )
}
