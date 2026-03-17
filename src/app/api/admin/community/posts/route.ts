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
  const tag = searchParams.get('tag')?.trim() ?? ''

  const where = {
    ...(search && {
      OR: [
        { content: { contains: search, mode: 'insensitive' as const } },
        { user: { fullName: { contains: search, mode: 'insensitive' as const } } },
        { user: { email: { contains: search, mode: 'insensitive' as const } } },
      ],
    }),
    ...(tag && tag !== 'ALL' && { tag }),
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
        _count: { select: { likes: true, comments: true } },
      },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    prisma.post.count({ where }),
  ])

  const formatted = posts.map(({ amount, createdAt, updatedAt, ...rest }) => ({
    ...rest,
    amount: amount != null ? amount.toString() : null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }))

  return NextResponse.json({ posts: formatted, total, page, totalPages: Math.ceil(total / LIMIT) })
}
