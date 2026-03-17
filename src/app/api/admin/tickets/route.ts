import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

const LIMIT = 10

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const status = searchParams.get('status')?.trim() ?? ''

  const where = status && status !== 'ALL' ? { status: status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' } : {}

  const [tickets, total, statusCounts] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        _count: { select: { replies: true } },
      },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.groupBy({
      by: ['status'],
      _count: { id: true },
    }).then((rows) => {
      const map: Record<string, number> = { ALL: 0 }
      rows.forEach((r) => {
        map[r.status] = r._count.id
        map.ALL += r._count.id
      })
      return map
    }),
  ])
  return NextResponse.json({ tickets, total, page, totalPages: Math.ceil(total / LIMIT), counts: statusCounts })
}
