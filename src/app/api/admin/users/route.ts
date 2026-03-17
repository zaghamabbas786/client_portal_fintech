import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

const LIMIT = 10

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const search = searchParams.get('search')?.trim() ?? ''
  const role = searchParams.get('role')?.trim() ?? ''

  const where = {
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { fullName: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(role && role !== 'ALL' && { role: role as 'STANDARD' | 'AURUM' | 'BOARDROOM' | 'ADMIN' }),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true, tickets: true } } },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    prisma.user.count({ where }),
  ])
  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / LIMIT) })
}
