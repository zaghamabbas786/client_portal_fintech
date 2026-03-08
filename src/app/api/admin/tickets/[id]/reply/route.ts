import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: id,
      userId: auth.admin!.id,
      content: content.trim(),
      isAdmin: true,
    },
    include: { user: { select: { fullName: true, email: true } } },
  })

  // Auto-set ticket to IN_PROGRESS if still OPEN
  await prisma.supportTicket.updateMany({
    where: { id, status: 'OPEN' },
    data: { status: 'IN_PROGRESS' },
  })

  return NextResponse.json({ reply }, { status: 201 })
}
