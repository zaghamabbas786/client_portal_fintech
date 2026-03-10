import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { id } = await params
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { fullName: true, email: true } } },
      },
    },
  })

  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (ticket.userId !== userProfile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json({ ticket })
}
