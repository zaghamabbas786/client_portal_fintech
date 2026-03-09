import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    select: {
      id: true, fullName: true, email: true, phone: true, avatarUrl: true,
      emailNotifications: true, communityAlerts: true, payoutUpdates: true,
    },
  })

  return NextResponse.json({ user })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { fullName, phone, emailNotifications, communityAlerts, payoutUpdates, avatarUrl } = body

  const user = await prisma.user.update({
    where: { supabaseId: authUser.id },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(phone !== undefined && { phone }),
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(communityAlerts !== undefined && { communityAlerts }),
      ...(payoutUpdates !== undefined && { payoutUpdates }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  })

  return NextResponse.json({ user })
}
