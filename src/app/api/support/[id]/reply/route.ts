import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userProfile = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { id } = await params
  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { userId: true },
  })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (ticket.userId !== userProfile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: id,
      userId: userProfile.id,
      content: content.trim(),
      isAdmin: false,
    },
    include: { user: { select: { fullName: true, email: true } } },
  })

  // Auto-set to IN_PROGRESS if still OPEN
  await prisma.supportTicket.updateMany({
    where: { id, status: 'OPEN' },
    data: { status: 'IN_PROGRESS' },
  })

  return NextResponse.json({ reply }, { status: 201 })
}
