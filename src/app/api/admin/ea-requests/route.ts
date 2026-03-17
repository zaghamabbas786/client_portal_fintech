import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

const LIMIT = 10

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const delegate = (prisma as { eARequest?: { findMany: (args: object) => Promise<unknown[]>; count: (args: object) => Promise<number> } }).eARequest
  if (!delegate) {
    return NextResponse.json({ error: 'EARequest model not available. Run "npx prisma generate" and restart the server.' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const status = searchParams.get('status')?.trim() ?? ''

  const where = status && status !== 'ALL' ? { status } : {}
  const [requests, total, statusCounts] = await Promise.all([
    delegate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    delegate.count({ where }),
    (prisma as { eARequest?: { groupBy: (args: object) => Promise<{ status: string; _count: { id: number } }[]> } }).eARequest?.groupBy({
      by: ['status'],
      _count: { id: true },
    }).then((rows) => {
      const map: Record<string, number> = { ALL: 0 }
      rows?.forEach((r) => { map[r.status] = r._count.id; map.ALL += r._count.id })
      return map
    }) ?? Promise.resolve({ ALL: 0 }),
  ])
  return NextResponse.json({ requests, total, page, totalPages: Math.ceil(total / LIMIT), counts: statusCounts })
}
