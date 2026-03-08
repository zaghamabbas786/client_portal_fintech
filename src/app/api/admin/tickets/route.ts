import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const tickets = await prisma.supportTicket.findMany({
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      _count: { select: { replies: true } },
    },
  })
  return NextResponse.json({ tickets })
}
